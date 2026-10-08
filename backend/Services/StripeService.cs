using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class StripeService
{
    private readonly IConfiguration _config;
    private readonly ILogger<StripeService> _logger;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(20) };

    public StripeService(IConfiguration config, ILogger<StripeService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(SecretKey);

    public async Task<StripeCheckout> CreateCheckout(ShopOrder order, CancellationToken cancellationToken = default)
    {
        var site = SiteUrl();
        var form = new Dictionary<string, string>
        {
            ["ui_mode"] = "hosted_page",
            ["mode"] = "payment",
            ["billing_address_collection"] = "auto",
            ["phone_number_collection[enabled]"] = "false",
            ["automatic_tax[enabled]"] = "false",
            ["allow_promotion_codes"] = "false",
            ["submit_type"] = "pay",
            ["locale"] = "bg",
            ["payment_method_options[card][restrictions][brands_blocked][0]"] = "discover_global_network",
            ["integration_identifier"] = "hosted_web_0001",
            ["origin_context"] = "web",
            ["customer_email"] = order.Email.Trim(),
            ["client_reference_id"] = order.Number,
            ["success_url"] = $"{site}/porachka/uspeh/?session_id={{CHECKOUT_SESSION_ID}}",
            ["cancel_url"] = $"{site}/porachka/?payment=cancelled",
            ["metadata[orderId]"] = order.Id.ToString(),
            ["metadata[orderNumber]"] = order.Number,
        };

        var totalCents = StripeMoney.Cents(order.Total);
        var goodsCents = Math.Clamp(StripeMoney.Cents(order.Total - order.Shipping), 0, totalCents);
        var shipCents = totalCents - goodsCents;
        if (totalCents < 50)
        {
            throw new InvalidOperationException("Сумата за плащане с карта е твърде малка.");
        }

        var description = string.Join(", ", order.Items.Select(item => $"{item.Title} × {item.Quantity}"));
        var line = 0;
        if (goodsCents > 0)
        {
            AddLine(form, line, goodsCents, ProductName(order), description);
            line += 1;
        }
        if (shipCents > 0)
        {
            AddLine(form, line, shipCents, "Доставка", "Еконт");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/checkout/sessions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", SecretKey);
        request.Headers.TryAddWithoutValidation("Idempotency-Key", $"order-{order.Id}");
        request.Content = new FormUrlEncodedContent(form);

        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(body);
        if (!response.IsSuccessStatusCode)
        {
            var message = StripeMessage(doc) ?? "Stripe не прие плащането.";
            _logger.LogWarning("Stripe checkout was rejected for order {Number}: {Message}", order.Number, message);
            throw new InvalidOperationException("Плащането с карта не се отвори. Опитайте отново.");
        }

        var id = doc.RootElement.GetProperty("id").GetString();
        var url = doc.RootElement.GetProperty("url").GetString();
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(url))
        {
            throw new InvalidOperationException("Плащането с карта не се отвори. Опитайте отново.");
        }

        return new StripeCheckout(id, url);
    }

    public async Task<StripeSession> GetSession(string sessionId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.stripe.com/v1/checkout/sessions/{Uri.EscapeDataString(sessionId)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", SecretKey);
        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(body);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Stripe session {SessionId} was not read: {Message}", sessionId, StripeMessage(doc));
            throw new InvalidOperationException("Плащането не се потвърди.");
        }

        return ReadSession(doc.RootElement);
    }

    public static StripeEvent? ReadEvent(string payload)
    {
        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;
        var type = root.TryGetProperty("type", out var typeElement) ? typeElement.GetString() : null;
        if (type is not ("checkout.session.completed" or "checkout.session.async_payment_succeeded"))
        {
            return new StripeEvent(type ?? "", null);
        }

        if (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("object", out var session))
        {
            return new StripeEvent(type, null);
        }

        return new StripeEvent(type, ReadSession(session));
    }

    public string WebhookSecret => _config["Stripe:WebhookSecret"]?.Trim() ?? "";

    private string SecretKey => _config["Stripe:SecretKey"]?.Trim() ?? "";

    private string SiteUrl()
    {
        var site = First(_config["Stripe:SiteUrl"], _config["Mail:SiteUrl"]);
        if (string.IsNullOrWhiteSpace(site))
        {
            throw new InvalidOperationException("Липсва адрес на сайта за връщане след плащане.");
        }

        return site.Trim().TrimEnd('/');
    }

    private static string? First(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static void AddLine(IDictionary<string, string> form, int index, long cents, string name, string description)
    {
        var prefix = $"line_items[{index}]";
        form[$"{prefix}[quantity]"] = "1";
        form[$"{prefix}[price_data][currency]"] = "eur";
        form[$"{prefix}[price_data][unit_amount]"] = cents.ToString();
        form[$"{prefix}[price_data][product_data][name]"] = Trim(name, 120);
        if (!string.IsNullOrWhiteSpace(description))
        {
            form[$"{prefix}[price_data][product_data][description]"] = Trim(description, 400);
        }
    }

    private static string ProductName(ShopOrder order)
    {
        var titles = order.Items.Select(item => item.Title.Trim()).Where(title => title.Length > 0).Distinct().ToList();
        return titles.Count switch
        {
            0 => "Поръчка",
            1 => titles[0],
            _ => string.Join(", ", titles)
        };
    }

    private static string Trim(string value, int max)
    {
        var text = value.Trim();
        return text.Length <= max ? text : text[..max];
    }

    private static StripeSession ReadSession(JsonElement session)
    {
        int? orderId = null;
        if (session.TryGetProperty("metadata", out var metadata) &&
            metadata.TryGetProperty("orderId", out var idElement) &&
            int.TryParse(idElement.GetString(), out var parsed))
        {
            orderId = parsed;
        }

        long? amount = null;
        if (session.TryGetProperty("amount_total", out var amountElement) && amountElement.ValueKind == JsonValueKind.Number)
        {
            amount = amountElement.GetInt64();
        }

        return new StripeSession(
            session.GetProperty("id").GetString() ?? "",
            session.TryGetProperty("payment_status", out var status) ? status.GetString() : null,
            amount,
            orderId);
    }

    private static string? StripeMessage(JsonDocument doc)
    {
        if (doc.RootElement.TryGetProperty("error", out var error) && error.TryGetProperty("message", out var message))
        {
            return message.GetString();
        }

        return null;
    }
}

public static class StripeMoney
{
    public static long Cents(decimal amount) => (long)Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero);
}

public static class StripeSignature
{
    public static bool Verify(string payload, string? header, string secret)
    {
        if (string.IsNullOrWhiteSpace(header) || string.IsNullOrWhiteSpace(secret)) return false;

        string? timestamp = null;
        var signatures = new List<string>();
        foreach (var part in header.Split(','))
        {
            var split = part.Split('=', 2);
            if (split.Length != 2) continue;
            if (split[0] == "t") timestamp = split[1];
            if (split[0] == "v1") signatures.Add(split[1]);
        }

        if (timestamp is null || signatures.Count == 0 || !long.TryParse(timestamp, out var unix)) return false;
        var age = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - unix;
        if (age > 300 || age < -300) return false;

        var signed = Encoding.UTF8.GetBytes($"{timestamp}.{payload}");
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), signed);
        var expected = Convert.ToHexString(hash).ToLowerInvariant();
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        return signatures.Any(signature =>
        {
            var actual = Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant());
            return actual.Length == expectedBytes.Length && CryptographicOperations.FixedTimeEquals(actual, expectedBytes);
        });
    }
}

public sealed record StripeCheckout(string SessionId, string Url);
public sealed record StripeSession(string Id, string? PaymentStatus, long? AmountTotal, int? OrderId);
public sealed record StripeEvent(string Type, StripeSession? Session);
