using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class CardPaymentService
{
    private readonly StripeService _stripe;
    private readonly AppStore _store;
    private readonly MetaConversionsService _meta;
    private readonly ShopMail _shop;
    private readonly ILogger<CardPaymentService> _logger;

    public CardPaymentService(StripeService stripe, AppStore store, MetaConversionsService meta, ShopMail shop, ILogger<CardPaymentService> logger)
    {
        _stripe = stripe;
        _store = store;
        _meta = meta;
        _shop = shop;
        _logger = logger;
    }

    public bool IsConfigured => _stripe.IsConfigured;

    public async Task<string> Begin(ShopOrder order, CancellationToken cancellationToken = default)
    {
        var checkout = await _stripe.CreateCheckout(order, cancellationToken);
        _store.AttachStripeSession(order.Id, checkout.SessionId);
        return checkout.Url;
    }

    public async Task<ShopOrder?> Confirm(string sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _stripe.GetSession(sessionId, cancellationToken);
        return await Apply(session);
    }

    public async Task<ShopOrder?> Apply(StripeSession session)
    {
        if (string.IsNullOrWhiteSpace(session.Id) || session.OrderId is null)
        {
            return null;
        }

        var order = _store.OrderByStripeSession(session.Id);
        if (order is null || order.Id != session.OrderId || !string.Equals(order.PaymentMethod, "card", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Stripe session {SessionId} does not match a card order.", session.Id);
            return null;
        }

        if (!string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            return order;
        }

        if (session.AmountTotal != StripeMoney.Cents(order.Total))
        {
            _logger.LogError(
                "Stripe amount {Actual} does not match order {Number} ({Expected} cents).",
                session.AmountTotal,
                order.Number,
                StripeMoney.Cents(order.Total));
            return order;
        }

        var (paid, justPaid, attribution) = _store.MarkCardPaid(order.Id);
        if (justPaid)
        {
            await _shop.OrderPlaced(paid);
            if (attribution is { MarketingConsent: true })
            {
                _ = _meta.SendPurchaseAsync(paid, attribution, attribution.ClientIp, attribution.UserAgent);
            }
        }

        return paid;
    }
}
