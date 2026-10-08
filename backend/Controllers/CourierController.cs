using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/courier")]
public class CourierController : ControllerBase
{
    private readonly AppStore _store;
    private readonly EcontService _econt;

    public CourierController(AppStore store, EcontService econt)
    {
        _store = store;
        _econt = econt;
    }

    [AllowAnonymous]
    [HttpGet("offices")]
    public async Task<ActionResult> Offices([FromQuery] string city)
    {
        if (string.IsNullOrWhiteSpace(city)) return Ok(Array.Empty<EcontOffice>());
        return Ok(await _econt.Offices(_store.Courier(), city.Trim()));
    }

    [AllowAnonymous]
    [HttpGet("cities")]
    public async Task<ActionResult> Cities([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<EcontCity>());
        return Ok(await _econt.SuggestCities(_store.Courier(), q.Trim()));
    }

    [AllowAnonymous]
    [HttpGet("streets")]
    public async Task<ActionResult> Streets([FromQuery] string city, [FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(city) || string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<string>());
        return Ok(await _econt.SuggestStreets(_store.Courier(), city.Trim(), q.Trim()));
    }

    [AllowAnonymous]
    [HttpPost("quote")]
    public async Task<ActionResult<ShippingQuote>> Quote([FromBody] ShopOrder order)
    {
        if (string.IsNullOrWhiteSpace(order.City)) return BadRequest(new { message = "Изберете град." });
        try
        {
            return Ok(await _econt.QuoteShipping(_store.Courier(), order, order.Total));
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("orders/{id:int}/track")]
    public async Task<ActionResult> Track(int id)
    {
        var order = _store.Orders().FirstOrDefault(item => item.Id == id);
        if (order is null || string.IsNullOrWhiteSpace(order.TrackingCode)) return NotFound();
        try
        {
            var track = await _econt.Track(_store.Courier(), order.TrackingCode);
            return track is null ? NotFound(new { message = "Еконт не върна статус за тази товарителница." }) : Ok(track);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet]
    public ActionResult<CourierSettings> Settings() => Ok(Public(_store.Courier()));

    [HttpPut]
    public ActionResult<CourierSettings> Save([FromBody] CourierSettings incoming)
    {
        if (string.IsNullOrWhiteSpace(incoming.SenderName) ||
            string.IsNullOrWhiteSpace(incoming.SenderPhone) ||
            string.IsNullOrWhiteSpace(incoming.City) ||
            string.IsNullOrWhiteSpace(incoming.Street))
        {
            return BadRequest(new { message = "Попълнете подател, телефон, град и улица." });
        }

        var current = _store.Courier();
        if (string.IsNullOrWhiteSpace(incoming.Password))
        {
            incoming.Password = current.Password;
        }

        incoming.Username = string.IsNullOrWhiteSpace(incoming.Username) ? current.Username : incoming.Username.Trim();
        return Ok(Public(_store.UpdateCourier(incoming)));
    }

    [HttpPost("orders/{id:int}/label")]
    public async Task<ActionResult<ShopOrder>> CreateLabel(int id)
    {
        var order = _store.Orders().FirstOrDefault(item => item.Id == id);
        if (order is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(order.TrackingCode))
        {
            return Ok(order);
        }

        if (string.Equals(order.PaymentMethod, "card", StringComparison.OrdinalIgnoreCase) && order.PaymentStatus == "unpaid")
        {
            return BadRequest(new { message = "Поръчката още не е платена с карта." });
        }

        try
        {
            var waybill = await _econt.CreateLabel(_store.Courier(), order);
            var updated = _store.SetWaybill(id, waybill.Number, waybill.PdfUrl, waybill.Note);
            return Ok(updated);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private static CourierSettings Public(CourierSettings settings) => new()
    {
        UseDemo = settings.UseDemo,
        Username = settings.Username,
        Password = "",
        SenderName = settings.SenderName,
        SenderPhone = settings.SenderPhone,
        City = settings.City,
        PostCode = settings.PostCode,
        Street = settings.Street,
        StreetNumber = settings.StreetNumber,
        Weight = settings.Weight,
        Description = settings.Description
    };
}
