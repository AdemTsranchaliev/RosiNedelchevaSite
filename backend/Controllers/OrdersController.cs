using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private static readonly HashSet<string> Statuses = ["new", "confirmed", "shipped", "completed", "cancelled", "unclaimed", "returned"];
    private readonly AppStore _store;
    private readonly EcontService _econt;
    private readonly NekorektenService _nekorekten;
    private readonly MailService _mail;
    private readonly ShopMail _shop;
    private readonly EmailTemplates _templates;
    private readonly MetaConversionsService _meta;
    private readonly CardPaymentService _cards;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(AppStore store, EcontService econt, NekorektenService nekorekten, MailService mail, ShopMail shop, EmailTemplates templates, MetaConversionsService meta, CardPaymentService cards, ILogger<OrdersController> logger)
    {
        _store = store;
        _econt = econt;
        _nekorekten = nekorekten;
        _mail = mail;
        _shop = shop;
        _templates = templates;
        _meta = meta;
        _cards = cards;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ShopOrder>> Create([FromBody] ShopOrder order)
    {
        if (string.IsNullOrWhiteSpace(order.CustomerName) ||
            string.IsNullOrWhiteSpace(order.Phone) ||
            string.IsNullOrWhiteSpace(order.Email) ||
            string.IsNullOrWhiteSpace(order.City) ||
            string.IsNullOrWhiteSpace(order.Address) ||
            order.Items.Count == 0)
        {
            return BadRequest(new { message = "Поръчката е непълна." });
        }

        if (!order.AcceptedTerms)
        {
            return BadRequest(new { message = "Потвърдете, че приемате условията." });
        }

        order.UserId = CurrentUserId();
        var subtotal = order.Items.Sum(item => item.Price * item.Quantity);
        var quote = _store.Quote(subtotal, order.PromoCode, order.Items);
        if (!string.IsNullOrWhiteSpace(order.PromoCode) && !quote.Ok)
        {
            return BadRequest(new { message = quote.Message });
        }

        order.DiscountPercent = quote.Percent;
        order.PromoCode = quote.Code;
        ShippingQuote shipping;
        try
        {
            shipping = await _econt.QuoteShipping(_store.Courier(), order, quote.Total);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        order.Shipping = shipping.Amount;
        order.Total = quote.Total + shipping.Amount;
        if (string.IsNullOrWhiteSpace(order.Number))
        {
            order.Number = $"RN-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 10000)}";
        }

        var card = string.Equals(order.PaymentMethod, "card", StringComparison.OrdinalIgnoreCase);
        var attribution = order.Attribution;
        if (card)
        {
            if (!_cards.IsConfigured)
            {
                return BadRequest(new { message = "Плащането с карта не е настроено." });
            }

            if (order.Total <= 0)
            {
                return BadRequest(new { message = "Сумата за плащане с карта трябва да е по-голяма от нула." });
            }

            order.PaymentStatus = "unpaid";
            if (attribution is not null)
            {
                attribution.ClientIp = ClientIp();
                attribution.UserAgent = Request.Headers.UserAgent.ToString();
                order.Attribution = attribution;
            }
        }
        else
        {
            order.Attribution = null;
            if (quote.Code is not null)
            {
                _store.ConsumeCode(quote.Code);
            }
        }

        var saved = _store.AddOrder(order);
        if (!card)
        {
            await _shop.OrderPlaced(saved);
            if (attribution?.MarketingConsent == true)
            {
                _ = _meta.SendPurchaseAsync(saved, attribution, ClientIp(), Request.Headers.UserAgent.ToString());
            }

            return Ok(new { checkoutUrl = (string?)null, number = saved.Number });
        }

        try
        {
            var checkoutUrl = await _cards.Begin(saved);
            return Ok(new { checkoutUrl, number = saved.Number });
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Card checkout did not open for order {Number}", saved.Number);
            saved.PaymentStatus = null;
            _store.UpdateOrderStatus(saved.Id, "cancelled", "Плащането с карта не се отвори.", null);
            var message = exception is InvalidOperationException ? exception.Message : "Плащането с карта не се отвори. Опитайте отново.";
            return BadRequest(new { message });
        }
    }

    [HttpGet("checkout")]
    public async Task<ActionResult<CheckoutReceipt>> Checkout([FromQuery(Name = "session_id")] string? sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length is < 8 or > 255 || !sessionId.StartsWith("cs_", StringComparison.Ordinal) || sessionId.Any(ch => !(char.IsAsciiLetterOrDigit(ch) || ch == '_')))
        {
            return BadRequest(new { message = "Липсва плащане за потвърждение." });
        }

        ShopOrder? order;
        try
        {
            order = await _cards.Confirm(sessionId);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        if (order is null)
        {
            return NotFound(new { message = "Поръчката не е намерена." });
        }

        if (order.PaymentStatus != "paid")
        {
            return Ok(new CheckoutReceipt { Paid = false, Number = order.Number });
        }

        return Ok(Receipt(order));
    }

    private string? ClientIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
        if (!string.IsNullOrWhiteSpace(forwarded) && IPAddress.TryParse(forwarded, out _))
        {
            return forwarded;
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }

    [Authorize]
    [HttpGet("mine")]
    public ActionResult<IEnumerable<ShopOrder>> Mine()
    {
        var id = CurrentUserId();
        if (id is null)
        {
            return Unauthorized();
        }

        return Ok(_store.OrdersForUser(id.Value));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public ActionResult<IEnumerable<ShopOrder>> All()
    {
        return Ok(_store.Orders());
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ShopOrder>> Status(int id, [FromBody] StatusRequest request)
    {
        var status = request.Status?.Trim() ?? "";
        if (!Statuses.Contains(status))
        {
            return BadRequest(new { message = "Непознат статус." });
        }

        if (status == "returned" && string.IsNullOrWhiteSpace(request.Note))
        {
            return BadRequest(new { message = "Напишете причина за връщането." });
        }

        var order = _store.UpdateOrderStatus(id, status, request.Note, request.TrackingCode);
        if (order is null)
        {
            return NotFound();
        }

        await _shop.OrderStatus(order, status);

        if (status == "completed" && _mail.IsConfigured)
        {
            foreach (var invite in _store.UnsentReviewInvites(order.Id))
            {
                try
                {
                    var email = _templates.ReviewInvite(order, invite.ProductName, invite.Token);
                    await _mail.SendAsync(invite.Email, email.Subject, email.Html);
                    _store.MarkReviewInviteSent(invite.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Review invite was not sent for order {OrderId}", order.Id);
                }
            }
        }

        return Ok(order);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:int}/nekorekten")]
    public async Task<ActionResult<NekorektenLookup>> Nekorekten(int id)
    {
        var order = _store.Orders().FirstOrDefault(item => item.Id == id);
        if (order is null) return NotFound();
        var key = _store.NekorektenKey();
        if (string.IsNullOrWhiteSpace(key))
        {
            return BadRequest(new { message = "Ключът за Некоректен не е зададен." });
        }

        if (string.IsNullOrWhiteSpace(order.Phone))
        {
            return BadRequest(new { message = "Поръчката няма телефон." });
        }

        try
        {
            var lookup = await _nekorekten.SearchPhone(key, order.Phone);
            var saved = _store.SaveReputation(new ReputationCheck
            {
                OrderId = order.Id,
                Name = order.CustomerName,
                Email = order.Email,
                Phone = lookup.Phone,
                Count = lookup.Count,
                Reports = lookup.Reports
            });
            lookup.CheckedAt = saved.CheckedAt;
            return Ok(lookup);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private static CheckoutReceipt Receipt(ShopOrder order) => new()
    {
        Paid = true,
        Number = order.Number,
        Total = order.Total,
        Shipping = order.Shipping,
        DiscountPercent = order.DiscountPercent,
        CustomerName = order.CustomerName,
        Phone = order.Phone,
        Email = order.Email,
        City = order.City,
        Address = order.Address,
        DeliveryType = order.DeliveryType,
        CreatedAt = order.CreatedAt,
        Items = order.Items
    };

    private int? CurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var id) ? id : null;
    }
}

public class StatusRequest
{
    public string? Status { get; set; }
    public string? Note { get; set; }
    public string? TrackingCode { get; set; }
}

public class CheckoutReceipt
{
    public bool Paid { get; set; }
    public string Number { get; set; } = "";
    public decimal Total { get; set; }
    public decimal Shipping { get; set; }
    public int DiscountPercent { get; set; }
    public string CustomerName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string City { get; set; } = "";
    public string Address { get; set; } = "";
    public string DeliveryType { get; set; } = "address";
    public DateTime CreatedAt { get; set; }
    public List<OrderLine> Items { get; set; } = [];
}
