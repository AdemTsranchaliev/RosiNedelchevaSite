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
    private readonly NekorektenService _nekorekten;
    private readonly MailService _mail;
    private readonly EmailTemplates _templates;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(AppStore store, NekorektenService nekorekten, MailService mail, EmailTemplates templates, ILogger<OrdersController> logger)
    {
        _store = store;
        _nekorekten = nekorekten;
        _mail = mail;
        _templates = templates;
        _logger = logger;
    }

    [HttpPost]
    public ActionResult<ShopOrder> Create([FromBody] ShopOrder order)
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

        order.UserId = CurrentUserId();
        var subtotal = order.Items.Sum(item => item.Price * item.Quantity);
        var quote = _store.Quote(subtotal, order.PromoCode, order.Items);
        if (!string.IsNullOrWhiteSpace(order.PromoCode) && !quote.Ok)
        {
            return BadRequest(new { message = quote.Message });
        }

        order.DiscountPercent = quote.Percent;
        order.PromoCode = quote.Code;
        order.Total = quote.Total;
        if (quote.Code is not null)
        {
            _store.ConsumeCode(quote.Code);
        }
        if (string.IsNullOrWhiteSpace(order.Number))
        {
            order.Number = $"RN-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 10000)}";
        }

        return Ok(_store.AddOrder(order));
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
