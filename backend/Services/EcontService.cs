using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class EcontService
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };

    public async Task<Waybill> CreateLabel(CourierSettings settings, ShopOrder order)
    {
        var (street, number) = SplitAddress(order.Address);
        var city = await FindCity(settings, order.City);
        var matchedStreet = city is null ? null : await MatchStreet(settings, city.Id, street);
        string? note = null;
        string? officeCode = null;
        if (string.Equals(order.DeliveryType, "office", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(order.OfficeCode))
        {
            officeCode = order.OfficeCode.Trim();
            note = string.IsNullOrWhiteSpace(order.OfficeName) ? $"До офис {officeCode}" : $"До офис {order.OfficeName}";
        }
        else if (matchedStreet is null && settings.UseDemo && city is not null)
        {
            officeCode = await FirstOffice(settings, city.Id);
            if (officeCode is null)
            {
                throw new InvalidOperationException($"Еконт не открива „{street}“ в {order.City}.");
            }

            note = $"Улицата не се разпознава, затова пратката е до офис {officeCode}. Адрес от поръчката: {order.Address}";
        }
        else if (matchedStreet is null)
        {
            throw new InvalidOperationException($"Еконт не открива „{street}“ в {order.City}. Поправи адреса и опитай отново.");
        }

        var labelBody = new Dictionary<string, object?>
        {
            ["senderClient"] = new { name = settings.SenderName, phones = new[] { settings.SenderPhone } },
            ["senderAddress"] = Address(settings.City, settings.PostCode, settings.Street, settings.StreetNumber),
            ["receiverClient"] = new { name = order.CustomerName, phones = new[] { order.Phone }, email = order.Email },
            ["packCount"] = 1,
            ["shipmentType"] = "pack",
            ["weight"] = settings.Weight <= 0 ? 1 : settings.Weight,
            ["shipmentDescription"] = string.IsNullOrWhiteSpace(note) ? settings.Description : $"{settings.Description}. {note}",
            ["orderNumber"] = order.Number
        };
        if (string.Equals(order.PaymentMethod, "cod", StringComparison.OrdinalIgnoreCase))
        {
            labelBody["services"] = new
            {
                cdAmount = order.Total,
                cdType = "get",
                cdCurrency = "EUR"
            };
        }
        if (matchedStreet is not null && city is not null)
        {
            labelBody["receiverAddress"] = Address(city.Name, city.PostCode, matchedStreet, number);
        }
        else if (officeCode is not null)
        {
            labelBody["receiverOfficeCode"] = officeCode;
        }

        var payload = new { mode = "create", label = labelBody };

        var root = await Post(settings, "Shipments/LabelService.createLabel.json", payload);
        if (!root.TryGetProperty("label", out var label))
        {
            throw new InvalidOperationException(DeepMessage(root) ?? "Еконт не прие товарителницата.");
        }

        var shipmentNumber = label.TryGetProperty("shipmentNumber", out var numberValue) ? numberValue.ToString().Trim('"') : "";
        var pdf = label.TryGetProperty("pdfURL", out var pdfValue) ? pdfValue.GetString() ?? "" : "";
        if (string.IsNullOrWhiteSpace(shipmentNumber))
        {
            throw new InvalidOperationException(DeepMessage(root) ?? "Еконт не върна номер на товарителница.");
        }

        return new Waybill(shipmentNumber, pdf, note);
    }

    public async Task<ShipmentTrack?> Track(CourierSettings settings, string shipmentNumber)
    {
        var root = await Post(settings, "Shipments/ShipmentService.getShipmentStatuses.json", new { shipmentNumbers = new[] { shipmentNumber } });
        if (!root.TryGetProperty("shipmentStatuses", out var list) || list.ValueKind != JsonValueKind.Array || list.GetArrayLength() == 0)
        {
            throw new InvalidOperationException(DeepMessage(root) ?? "Еконт не върна статус за тази товарителница.");
        }
        var status = list[0].GetProperty("status");
        var office = status.TryGetProperty("receiverOfficeCode", out var code) ? code.ToString().Trim('"') : "";
        var delivery = status.TryGetProperty("receiverDeliveryType", out var kind) ? kind.GetString() ?? "" : "";
        var shortStatus = status.TryGetProperty("shortDeliveryStatus", out var text) ? text.GetString() ?? "" : "";
        var collectedAmount = Amount(status, "cdCollectedAmount");
        var paidAmount = Amount(status, "cdPaidAmount");
        var officeName = await OfficeName(settings, office);
        return new ShipmentTrack(
            string.IsNullOrWhiteSpace(shortStatus) ? "Няма статус" : shortStatus,
            delivery == "office" ? "До офис" : "До адрес",
            office,
            officeName,
            collectedAmount > 0 || paidAmount > 0,
            collectedAmount,
            Epoch(status, "cdCollectedTime"),
            paidAmount,
            Epoch(status, "cdPaidTime"));
    }

    public async Task<IReadOnlyList<EcontOffice>> Offices(CourierSettings settings, string cityName)
    {
        var city = await FindCity(settings, cityName);
        if (city is null) return [];
        var root = await Post(settings, "Nomenclatures/NomenclaturesService.getOffices.json", new { countryCode = "BGR", cityID = city.Id });
        if (!root.TryGetProperty("offices", out var offices)) return [];
        var result = new List<EcontOffice>();
        foreach (var office in offices.EnumerateArray())
        {
            var code = office.TryGetProperty("code", out var value) ? value.ToString().Trim('"') : "";
            var name = office.TryGetProperty("name", out var label) ? label.GetString() ?? code : code;
            if (!string.IsNullOrWhiteSpace(code)) result.Add(new EcontOffice(code, name));
        }

        return result;
    }

    private static Dictionary<string, string>? _officeNames;

    private async Task<string> OfficeName(CourierSettings settings, string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "";
        if (_officeNames is null)
        {
            var root = await Post(settings, "Nomenclatures/NomenclaturesService.getOffices.json", new { countryCode = "BGR" });
            var map = new Dictionary<string, string>();
            if (root.TryGetProperty("offices", out var offices))
            {
                foreach (var office in offices.EnumerateArray())
                {
                    var current = office.TryGetProperty("code", out var value) ? value.ToString().Trim('"') : "";
                    var label = office.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "";
                    if (!string.IsNullOrWhiteSpace(current)) map[current] = label;
                }
            }

            _officeNames = map;
        }

        return _officeNames.TryGetValue(code, out var found) ? found : "";
    }

    private async Task<CityMatch?> FindCity(CourierSettings settings, string name)
    {
        var cities = await Cities(settings);
        var wanted = Normalize(name);
        return cities.FirstOrDefault(city => Normalize(city.Name) == wanted);
    }

    private async Task<string?> MatchStreet(CourierSettings settings, int cityId, string street)
    {
        var root = await Post(settings, "Nomenclatures/NomenclaturesService.getStreets.json", new { cityID = cityId });
        if (!root.TryGetProperty("streets", out var streets)) return null;
        var wanted = Normalize(street);
        foreach (var item in streets.EnumerateArray())
        {
            var official = item.GetProperty("name").GetString() ?? "";
            if (Normalize(official) == wanted) return official;
        }

        return null;
    }

    private async Task<string?> FirstOffice(CourierSettings settings, int cityId)
    {
        var root = await Post(settings, "Nomenclatures/NomenclaturesService.getOffices.json", new { countryCode = "BGR", cityID = cityId });
        if (!root.TryGetProperty("offices", out var offices)) return null;
        foreach (var office in offices.EnumerateArray())
        {
            if (office.TryGetProperty("code", out var code)) return code.ToString().Trim('"');
        }

        return null;
    }

    private static List<CityMatch>? _cities;

    private async Task<List<CityMatch>> Cities(CourierSettings settings)
    {
        if (_cities is not null) return _cities;
        var root = await Post(settings, "Nomenclatures/NomenclaturesService.getCities.json", new { countryCode = "BGR" });
        var list = new List<CityMatch>();
        if (root.TryGetProperty("cities", out var cities))
        {
            foreach (var city in cities.EnumerateArray())
            {
                list.Add(new CityMatch(
                    city.GetProperty("id").GetInt32(),
                    city.GetProperty("name").GetString() ?? "",
                    city.TryGetProperty("postCode", out var post) ? post.ToString().Trim('"') : ""));
            }
        }

        _cities = list;
        return list;
    }

    private async Task<JsonElement> Post(CourierSettings settings, string path, object payload)
    {
        var host = settings.UseDemo ? "http://demo.econt.com/ee/services" : "http://ee.econt.com/services";
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{host}/{path}");
        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{settings.Username}:{settings.Password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", token);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await Http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
        return document.RootElement.Clone();
    }

    private static string? DeepMessage(JsonElement node)
    {
        string? found = null;
        Walk(node);
        return found;

        void Walk(JsonElement current)
        {
            if (current.TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.String)
            {
                var text = message.GetString()?.Trim();
                if (!string.IsNullOrWhiteSpace(text)) found = text;
            }

            if (current.TryGetProperty("innerErrors", out var inner) && inner.ValueKind == JsonValueKind.Array)
            {
                foreach (var child in inner.EnumerateArray()) Walk(child);
            }
        }
    }

    private static string Normalize(string value)
    {
        var text = value.Trim().ToLowerInvariant();
        foreach (var prefix in new[] { "ул.", "бул.", "улица", "булевард" })
        {
            if (text.StartsWith(prefix)) text = text[prefix.Length..].Trim();
        }

        return text;
    }

    private static object Address(string city, string postCode, string street, string number) => new
    {
        city = new
        {
            country = new { code2 = "BGR" },
            name = city,
            postCode
        },
        street,
        num = number
    };

    private static decimal Amount(JsonElement status, string name)
    {
        if (!status.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.Number) return 0;
        return value.GetDecimal();
    }

    private static string? Epoch(JsonElement status, string name)
    {
        if (!status.TryGetProperty(name, out var value) || value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined) return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out var raw) && raw > 0)
        {
            var ms = raw < 10_000_000_000 ? raw * 1000 : raw;
            return DateTimeOffset.FromUnixTimeMilliseconds(ms).ToString("o");
        }

        if (value.ValueKind == JsonValueKind.String)
        {
            var text = value.GetString();
            return string.IsNullOrWhiteSpace(text) ? null : text;
        }

        return null;
    }

    private static (string Street, string Number) SplitAddress(string address)
    {
        var parts = address.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2 && parts[^1].Any(char.IsDigit))
        {
            return (string.Join(' ', parts[..^1]), parts[^1]);
        }

        return (string.IsNullOrWhiteSpace(address) ? "адрес" : address.Trim(), "1");
    }
}

public record Waybill(string Number, string PdfUrl, string? Note = null);

record CityMatch(int Id, string Name, string PostCode);

public record ShipmentTrack(
    string Status,
    string Delivery,
    string OfficeCode,
    string OfficeName,
    bool CashOnDelivery,
    decimal CollectedAmount,
    string? CollectedAt,
    decimal PaidAmount,
    string? PaidAt);

public record EcontOffice(string Code, string Name);
