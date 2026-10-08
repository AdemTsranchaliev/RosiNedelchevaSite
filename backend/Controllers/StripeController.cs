using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/stripe")]
public class StripeController : ControllerBase
{
    private readonly StripeService _stripe;
    private readonly CardPaymentService _payments;
    private readonly ILogger<StripeController> _logger;

    public StripeController(StripeService stripe, CardPaymentService payments, ILogger<StripeController> logger)
    {
        _stripe = stripe;
        _payments = payments;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var secret = _stripe.WebhookSecret;
        if (string.IsNullOrWhiteSpace(secret))
        {
            _logger.LogWarning("Stripe webhook was ignored because Stripe:WebhookSecret is empty.");
            return BadRequest();
        }

        string payload;
        using (var reader = new StreamReader(Request.Body))
        {
            payload = await reader.ReadToEndAsync();
        }

        if (!StripeSignature.Verify(payload, Request.Headers["Stripe-Signature"], secret))
        {
            return BadRequest();
        }

        StripeEvent? stripeEvent;
        try
        {
            stripeEvent = StripeService.ReadEvent(payload);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Stripe webhook payload was not read.");
            return BadRequest();
        }

        if (stripeEvent?.Session is not null)
        {
            await _payments.Apply(stripeEvent.Session);
        }

        return Ok();
    }
}
