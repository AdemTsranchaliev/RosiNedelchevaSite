using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api")]
public class MarketingController : ControllerBase
{
    private readonly AppStore _store;

    public MarketingController(AppStore store)
    {
        _store = store;
    }

    [HttpGet("offers")]
    public ActionResult<PublicOffers> Offers()
    {
        var banner = _store.Banner();
        return Ok(new PublicOffers
        {
            Promotion = _store.ActivePromotion(),
            Banner = banner.IsActive ? banner : new SiteBanner()
        });
    }

    [HttpPost("promo/quote")]
    public ActionResult<QuoteResult> Quote([FromBody] QuoteRequest request)
    {
        if (request.Subtotal < 0)
        {
            return BadRequest(new { message = "Невалидна сума." });
        }

        return Ok(_store.Quote(request.Subtotal, request.Code, request.Items));
    }

    [HttpPost("newsletter")]
    public ActionResult<Subscriber> Subscribe([FromBody] SubscribeRequest request)
    {
        var email = request.Email?.Trim() ?? "";
        if (!email.Contains('@') || !email.Contains('.'))
        {
            return BadRequest(new { message = "Въведете валиден имейл." });
        }

        return Ok(_store.AddSubscriber(email));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("promotions")]
    public ActionResult<IEnumerable<Promotion>> Promotions() => Ok(_store.Promotions());

    [Authorize(Roles = "Admin")]
    [HttpPost("promotions")]
    public ActionResult<Promotion> CreatePromotion([FromBody] Promotion item)
    {
        if (string.IsNullOrWhiteSpace(item.Name) || item.Percent is < 1 or > 90)
        {
            return BadRequest(new { message = "Име и процент между 1 и 90." });
        }

        return Ok(_store.AddPromotion(item));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("promotions/{id:int}")]
    public ActionResult<Promotion> UpdatePromotion(int id, [FromBody] Promotion item)
    {
        var updated = _store.UpdatePromotion(id, item);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("promo-codes")]
    public ActionResult<IEnumerable<PromoCode>> Codes() => Ok(_store.PromoCodes());

    [Authorize(Roles = "Admin")]
    [HttpPost("promo-codes")]
    public ActionResult<PromoCode> CreateCode([FromBody] PromoCode item)
    {
        if (string.IsNullOrWhiteSpace(item.Code) || item.Percent is < 1 or > 90)
        {
            return BadRequest(new { message = "Код и процент между 1 и 90." });
        }

        return Ok(_store.AddPromoCode(item));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("promo-codes/{id:int}")]
    public ActionResult<PromoCode> UpdateCode(int id, [FromBody] PromoCode item)
    {
        var updated = _store.UpdatePromoCode(id, item);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("banner")]
    public ActionResult<SiteBanner> Banner() => Ok(_store.Banner());

    [Authorize(Roles = "Admin")]
    [HttpPut("banner")]
    public ActionResult<SiteBanner> SaveBanner([FromBody] SiteBanner banner) => Ok(_store.UpdateBanner(banner));

    [Authorize(Roles = "Admin")]
    [HttpGet("newsletter")]
    public ActionResult<IEnumerable<Subscriber>> Newsletter() => Ok(_store.Subscribers());

    [Authorize(Roles = "Admin")]
    [HttpGet("campaigns")]
    public ActionResult<IEnumerable<EmailCampaign>> Campaigns() => Ok(_store.Campaigns());

    [Authorize(Roles = "Admin")]
    [HttpPost("campaigns")]
    public ActionResult<EmailCampaign> Send([FromBody] EmailCampaign campaign)
    {
        if (string.IsNullOrWhiteSpace(campaign.Subject) || string.IsNullOrWhiteSpace(campaign.Body))
        {
            return BadRequest(new { message = "Тема и текст са задължителни." });
        }

        var audience = _store.Audience();
        campaign.Recipients = audience.Count;
        campaign.Status = audience.Count == 0 ? "empty" : "sent";
        return Ok(_store.AddCampaign(campaign));
    }
}

public class QuoteRequest
{
    public decimal Subtotal { get; set; }
    public string? Code { get; set; }
    public List<OrderLine>? Items { get; set; }
}

public class SubscribeRequest
{
    public string? Email { get; set; }
}
