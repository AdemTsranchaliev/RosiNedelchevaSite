using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public partial class MetaConversionsService
{
    private const string GraphVersion = "v23.0";
    private readonly IConfiguration _config;
    private readonly ILogger<MetaConversionsService> _logger;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(4) };

    public MetaConversionsService(IConfiguration config, ILogger<MetaConversionsService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendPurchaseAsync(ShopOrder order, OrderAttribution attribution, string? ip, string? userAgent)
    {
        var pixelId = _config["Meta:PixelId"]?.Trim();
        var token = _config["Meta:AccessToken"]?.Trim();
        if (string.IsNullOrWhiteSpace(pixelId) || string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        if (!PixelPattern().IsMatch(pixelId))
        {
            _logger.LogWarning("Meta PixelId не е валиден. Conversions API не изпрати покупката.");
            return;
        }

        if (!attribution.MarketingConsent || string.IsNullOrWhiteSpace(attribution.EventId))
        {
            return;
        }

        try
        {
            var userData = UserData(order, attribution, ip, userAgent);
            var contents = order.Items.Select(item => new Dictionary<string, object?>
            {
                ["id"] = item.ProductId == 1 ? "trevozhnost-cards" : item.ProductId.ToString(),
                ["quantity"] = item.Quantity,
                ["item_price"] = item.Price
            }).ToArray();

            var data = new Dictionary<string, object?>
            {
                ["event_name"] = "Purchase",
                ["event_time"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                ["event_id"] = attribution.EventId.Trim(),
                ["action_source"] = "website",
                ["user_data"] = userData,
                ["custom_data"] = new Dictionary<string, object?>
                {
                    ["currency"] = "EUR",
                    ["value"] = order.Total,
                    ["order_id"] = order.Number,
                    ["content_type"] = "product",
                    ["content_ids"] = contents.Select(item => item["id"]).ToArray(),
                    ["contents"] = contents
                }
            };

            var source = CleanUrl(attribution.SourceUrl);
            if (source is not null)
            {
                data["event_source_url"] = source;
            }

            var payload = new Dictionary<string, object?>
            {
                ["data"] = new[] { data }
            };
            var testCode = _config["Meta:TestEventCode"]?.Trim();
            if (!string.IsNullOrWhiteSpace(testCode))
            {
                payload["test_event_code"] = testCode;
            }

            var url = $"https://graph.facebook.com/{GraphVersion}/{pixelId}/events?access_token={Uri.EscapeDataString(token)}";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                if (body.Length > 300) body = body[..300];
                _logger.LogWarning("Meta Conversions API върна {Status} за {Number}: {Body}", (int)response.StatusCode, order.Number, body);
            }
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Meta Conversions API не изпрати покупка {Number}", order.Number);
        }
    }

    private static Dictionary<string, object?> UserData(ShopOrder order, OrderAttribution attribution, string? ip, string? userAgent)
    {
        var userData = new Dictionary<string, object?>();
        AddHash(userData, "em", NormalizeEmail(order.Email));
        AddHash(userData, "ph", NormalizePhone(order.Phone));
        AddHash(userData, "ct", NormalizeCity(order.City));
        AddHash(userData, "country", "bg");

        var parts = order.CustomerName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length > 0) AddHash(userData, "fn", parts[0].ToLowerInvariant());
        if (parts.Length > 1) AddHash(userData, "ln", parts[^1].ToLowerInvariant());

        if (!string.IsNullOrWhiteSpace(ip)) userData["client_ip_address"] = ip;
        if (!string.IsNullOrWhiteSpace(userAgent)) userData["client_user_agent"] = userAgent.Length > 512 ? userAgent[..512] : userAgent;

        var fbp = CleanClickId(attribution.Fbp);
        var fbc = CleanClickId(attribution.Fbc);
        if (fbp is not null) userData["fbp"] = fbp;
        if (fbc is not null) userData["fbc"] = fbc;
        return userData;
    }

    private static void AddHash(Dictionary<string, object?> target, string key, string? normalized)
    {
        var hash = Sha256(normalized);
        if (hash is not null) target[key] = new[] { hash };
    }

    private static string? Sha256(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string? NormalizeEmail(string email)
    {
        var value = email.Trim().ToLowerInvariant();
        return value.Contains('@') ? value : null;
    }

    private static string? NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("00", StringComparison.Ordinal)) digits = digits[2..];
        if (digits.StartsWith('0')) digits = "359" + digits[1..];
        return digits.Length >= 10 ? digits : null;
    }

    private static string? NormalizeCity(string city)
    {
        var value = city.Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(value) ? null : value.Replace(" ", "", StringComparison.Ordinal);
    }

    private static string? CleanUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || url.Length > 500) return null;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return null;
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) return null;
        return uri.ToString();
    }

    private static string? CleanClickId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 200) return null;
        return ClickIdPattern().IsMatch(value) ? value : null;
    }

    [GeneratedRegex(@"^\d{5,20}$")]
    private static partial Regex PixelPattern();

    [GeneratedRegex(@"^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$")]
    private static partial Regex ClickIdPattern();
}
