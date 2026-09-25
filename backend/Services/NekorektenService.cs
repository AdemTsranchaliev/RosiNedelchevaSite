using System.Net.Http.Headers;
using System.Text.Json;

namespace RosiNedelcheva.Api.Services;

public class NekorektenService
{
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(20) };

    public async Task<NekorektenLookup> SearchPhone(string apiKey, string phone)
    {
        var digits = Normalize(phone);
        if (digits.Length < 10)
        {
            throw new InvalidOperationException("Телефонът е твърде кратък за проверка.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.nekorekten.com/api/v1/reports?phone={Uri.EscapeDataString(digits)}");
        request.Headers.TryAddWithoutValidation("Api-Key", apiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
        var root = doc.RootElement;
        if (!response.IsSuccessStatusCode)
        {
            var message = Text(root, "message");
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(message) ? "Некоректен не прие проверката." : message);
        }

        var reports = new List<NekorektenReport>();
        if (root.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in items.EnumerateArray())
            {
                var id = Text(item, "id") ?? "";
                var name = $"{Text(item, "firstName")} {Text(item, "lastName")}".Trim();
                var text = Text(item, "text") ?? "";
                if (text.Length > 280) text = text[..280] + "…";
                reports.Add(new NekorektenReport
                {
                    Id = id,
                    Name = name,
                    Phone = Text(item, "phone") ?? "",
                    Email = Text(item, "email") ?? "",
                    Text = text,
                    Date = Text(item, "createDate") ?? "",
                    Url = string.IsNullOrWhiteSpace(id) ? "https://nekorekten.com/" : $"https://nekorekten.com/reports/{id}"
                });
            }
        }

        var count = root.TryGetProperty("count", out var countNode) && countNode.TryGetInt32(out var parsed) ? parsed : reports.Count;
        return new NekorektenLookup { Count = count, Phone = digits, Reports = reports };
    }

    private static string Normalize(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("00", StringComparison.Ordinal)) digits = digits[2..];
        if (digits.StartsWith('0')) digits = "359" + digits[1..];
        else if (digits.Length == 9) digits = "359" + digits;
        return digits;
    }

    private static string? Text(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var value)) return null;
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            _ => null
        };
    }
}

public class NekorektenLookup
{
    public int Count { get; set; }
    public string Phone { get; set; } = "";
    public DateTime? CheckedAt { get; set; }
    public List<NekorektenReport> Reports { get; set; } = [];
}

public class ReputationCheck
{
    public int Id { get; set; }
    public int? OrderId { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public int Count { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    public List<NekorektenReport> Reports { get; set; } = [];
}

public class NekorektenReport
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Text { get; set; } = "";
    public string Date { get; set; } = "";
    public string Url { get; set; } = "";
}
