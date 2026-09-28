using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class EcontService
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };
    private static readonly TimeSpan CacheFor = TimeSpan.FromHours(12);
    private static readonly TimeZoneInfo Sofia = TimeZoneInfo.FindSystemTimeZoneById("Europe/Sofia");
    private readonly SemaphoreSlim _load = new(1, 1);
    private List<CityMatch>? _cities;
    private List<OfficePoint>? _offices;
    private readonly Dictionary<int, List<string>> _streets = [];
    private string _cacheKey = "";
    private DateTime _cachedAt;

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
        var offices = await AllOffices(settings);
        return offices
            .Where(office => office.CityId == city.Id)
            .Select(office => office.Public)
            .ToList();
    }

    public async Task<IReadOnlyList<EcontCity>> SuggestCities(CourierSettings settings, string query)
    {
        var wanted = Normalize(query);
        if (wanted.Length < 2) return [];
        var cities = await Cities(settings);
        return cities
            .Where(city => Normalize(city.Name).Contains(wanted) || city.PostCode.StartsWith(query.Trim(), StringComparison.Ordinal))
            .OrderBy(city => Normalize(city.Name) == wanted ? 0 : Normalize(city.Name).StartsWith(wanted) ? 1 : 2)
            .ThenBy(city => city.Name.Length)
            .ThenBy(city => city.Name, StringComparer.CurrentCulture)
            .Take(8)
            .Select(city => new EcontCity(city.Name, city.PostCode, city.Region))
            .ToList();
    }

    public async Task<IReadOnlyList<string>> SuggestStreets(CourierSettings settings, string cityName, string query)
    {
        var wanted = Normalize(query);
        if (wanted.Length < 2) return [];
        var city = await FindCity(settings, cityName);
        if (city is null) return [];
        var streets = await Streets(settings, city.Id);
        return streets
            .Where(street => Normalize(street).Contains(wanted))
            .Take(8)
            .ToList();
    }

    private async Task<string> OfficeName(CourierSettings settings, string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return "";
        var offices = await AllOffices(settings);
        return offices.FirstOrDefault(office => office.Code == code)?.Name ?? "";
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
        var offices = await AllOffices(settings);
        return offices.FirstOrDefault(office => office.CityId == cityId && office.Kind == "office")?.Code
            ?? offices.FirstOrDefault(office => office.CityId == cityId)?.Code;
    }

    private async Task<List<CityMatch>> Cities(CourierSettings settings)
    {
        await Fresh(settings);
        if (_cities is not null) return _cities;
        await _load.WaitAsync();
        try
        {
            await Fresh(settings);
            if (_cities is not null) return _cities;
            _cities = await LoadCities(settings);
            Remember(settings);
            return _cities;
        }
        finally
        {
            _load.Release();
        }
    }

    private async Task<List<OfficePoint>> AllOffices(CourierSettings settings)
    {
        await Fresh(settings);
        if (_offices is not null) return _offices;
        await _load.WaitAsync();
        try
        {
            await Fresh(settings);
            if (_offices is not null) return _offices;
            _offices = await LoadOffices(settings);
            Remember(settings);
            return _offices;
        }
        finally
        {
            _load.Release();
        }
    }

    private async Task<List<string>> Streets(CourierSettings settings, int cityId)
    {
        await Fresh(settings);
        if (_streets.TryGetValue(cityId, out var cached)) return cached;
        await _load.WaitAsync();
        try
        {
            await Fresh(settings);
            if (_streets.TryGetValue(cityId, out cached)) return cached;
            var root = await Post(settings, "Nomenclatures/NomenclaturesService.getStreets.json", new { cityID = cityId });
            var list = new List<string>();
            if (root.TryGetProperty("streets", out var streets))
            {
                foreach (var street in streets.EnumerateArray())
                {
                    var name = street.TryGetProperty("name", out var value) ? value.GetString() ?? "" : "";
                    if (!string.IsNullOrWhiteSpace(name)) list.Add(name);
                }
            }

            _streets[cityId] = list;
            Remember(settings);
            return list;
        }
        finally
        {
            _load.Release();
        }
    }

    private Task Fresh(CourierSettings settings)
    {
        var key = $"{settings.UseDemo}:{settings.Username}";
        if (_cacheKey == key && DateTime.UtcNow - _cachedAt < CacheFor) return Task.CompletedTask;
        _cities = null;
        _offices = null;
        _streets.Clear();
        _cacheKey = key;
        _cachedAt = DateTime.MinValue;
        return Task.CompletedTask;
    }

    private void Remember(CourierSettings settings)
    {
        _cacheKey = $"{settings.UseDemo}:{settings.Username}";
        _cachedAt = DateTime.UtcNow;
    }

    private async Task<List<CityMatch>> LoadCities(CourierSettings settings)
    {
        var root = await Post(settings, "Nomenclatures/NomenclaturesService.getCities.json", new { countryCode = "BGR" });
        var list = new List<CityMatch>();
        if (!root.TryGetProperty("cities", out var cities)) return list;
        foreach (var city in cities.EnumerateArray())
        {
            list.Add(new CityMatch(
                city.GetProperty("id").GetInt32(),
                city.GetProperty("name").GetString() ?? "",
                city.TryGetProperty("postCode", out var post) ? post.ToString().Trim('"') : "",
                city.TryGetProperty("regionName", out var region) ? region.GetString() ?? "" : ""));
        }

        return list;
    }

    private async Task<List<OfficePoint>> LoadOffices(CourierSettings settings)
    {
        var root = await Post(settings, "Nomenclatures/NomenclaturesService.getOffices.json", new { countryCode = "BGR" });
        var list = new List<OfficePoint>();
        if (!root.TryGetProperty("offices", out var offices)) return list;
        foreach (var office in offices.EnumerateArray())
        {
            var code = office.TryGetProperty("code", out var value) ? value.ToString().Trim('"') : "";
            if (string.IsNullOrWhiteSpace(code)) continue;
            var name = office.TryGetProperty("name", out var label) ? label.GetString() ?? code : code;
            var kind = Flag(office, "isAPS") ? "aps"
                : Flag(office, "isDrive") ? "drive"
                : Flag(office, "isMPS") ? "mps"
                : "office";
            var (cityId, city, address) = Place(office);
            list.Add(new OfficePoint(code, name, kind, address, city, Hours(office), cityId));
        }

        return list;
    }

    private static (int CityId, string City, string Address) Place(JsonElement office)
    {
        if (!office.TryGetProperty("address", out var address)) return (0, "", "");
        var cityId = 0;
        var city = "";
        if (address.TryGetProperty("city", out var cityNode))
        {
            if (cityNode.TryGetProperty("id", out var id) && id.TryGetInt32(out var parsed)) cityId = parsed;
            city = cityNode.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "";
        }

        var full = address.TryGetProperty("fullAddress", out var line) ? line.GetString()?.Trim() ?? "" : "";
        if (!string.IsNullOrWhiteSpace(city) && full.StartsWith(city, StringComparison.OrdinalIgnoreCase))
        {
            full = full[city.Length..].Trim().TrimStart(',', '—', '-').Trim();
        }

        return (cityId, city, full);
    }

    private static string Hours(JsonElement office)
    {
        var from = Clock(office, "normalBusinessHoursFrom");
        var to = Clock(office, "normalBusinessHoursTo");
        if (from is null || to is null || from == to) return "";
        return $"{from}–{to}";
    }

    private static string? Clock(JsonElement office, string name)
    {
        if (!office.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.Number) return null;
        if (!value.TryGetInt64(out var raw) || raw <= 0) return null;
        var clock = raw < 172_800_000
            ? TimeSpan.FromMilliseconds(raw)
            : TimeZoneInfo.ConvertTime(DateTimeOffset.FromUnixTimeMilliseconds(raw), Sofia).TimeOfDay;
        return $"{clock.Hours:00}:{clock.Minutes:00}";
    }

    public async Task<ShippingQuote> QuoteShipping(CourierSettings settings, ShopOrder order, decimal codBase)
    {
        var city = await FindCity(settings, order.City);
        if (city is null)
        {
            throw new InvalidOperationException($"Еконт не открива град „{order.City}“.");
        }

        var labelBody = new Dictionary<string, object?>
        {
            ["senderClient"] = new { name = settings.SenderName, phones = new[] { settings.SenderPhone } },
            ["senderAddress"] = Address(settings.City, settings.PostCode, settings.Street, settings.StreetNumber),
            ["receiverClient"] = new
            {
                name = string.IsNullOrWhiteSpace(order.CustomerName) ? "Получател" : order.CustomerName,
                phones = new[] { string.IsNullOrWhiteSpace(order.Phone) ? settings.SenderPhone : order.Phone }
            },
            ["packCount"] = 1,
            ["shipmentType"] = "pack",
            ["weight"] = settings.Weight <= 0 ? 1 : settings.Weight,
            ["shipmentDescription"] = settings.Description
        };

        if (string.Equals(order.DeliveryType, "office", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(order.OfficeCode))
            {
                throw new InvalidOperationException("Изберете офис или еконтомат.");
            }

            labelBody["receiverOfficeCode"] = order.OfficeCode.Trim();
        }
        else
        {
            var (street, number) = SplitAddress(order.Address);
            var matchedStreet = await MatchStreet(settings, city.Id, street);
            if (matchedStreet is null)
            {
                throw new InvalidOperationException($"Еконт не открива „{street}“ в {city.Name}.");
            }

            labelBody["receiverAddress"] = Address(city.Name, city.PostCode, matchedStreet, number);
        }

        if (string.Equals(order.PaymentMethod, "cod", StringComparison.OrdinalIgnoreCase) && codBase > 0)
        {
            labelBody["services"] = new { cdAmount = codBase, cdType = "get", cdCurrency = "EUR" };
        }

        var root = await Post(settings, "Shipments/LabelService.createLabel.json", new { mode = "calculate", label = labelBody });
        if (!root.TryGetProperty("label", out var label))
        {
            throw new InvalidOperationException(DeepMessage(root) ?? "Еконт не върна цена за доставка.");
        }

        return new ShippingQuote(ReadAmount(label, "totalPrice"), label.TryGetProperty("currency", out var money) ? money.GetString() ?? "EUR" : "EUR", ServiceText(label));
    }

    private static string ServiceText(JsonElement label)
    {
        if (!label.TryGetProperty("services", out var services) || services.ValueKind != JsonValueKind.Array) return "";
        return string.Join(" · ", services.EnumerateArray()
            .Select(service => service.TryGetProperty("description", out var text) ? text.GetString() ?? "" : "")
            .Where(text => !string.IsNullOrWhiteSpace(text)));
    }

    private static decimal ReadAmount(JsonElement node, string name)
    {
        if (!node.TryGetProperty(name, out var value)) return 0;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var amount)) return amount;
        if (value.ValueKind == JsonValueKind.String && decimal.TryParse(value.GetString(), System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
        {
            return parsed;
        }

        return 0;
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

    private static bool Flag(JsonElement office, string name)
    {
        return office.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.True;
    }

    private static string Normalize(string value)
    {
        var text = value.Trim().ToLowerInvariant();
        foreach (var prefix in new[] { "ул.", "бул.", "улица", "булевард", "гр.", "град", "с.", "село" })
        {
            if (!text.StartsWith(prefix)) continue;
            if (!prefix.EndsWith('.') && text.Length > prefix.Length && text[prefix.Length] != ' ') continue;
            text = text[prefix.Length..].Trim();
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

public record ShippingQuote(decimal Amount, string Currency, string Description);

public record Waybill(string Number, string PdfUrl, string? Note = null);

public record EcontOffice(string Code, string Name, string Kind, string Address, string City, string Hours);

public record EcontCity(string Name, string PostCode, string Region);

record CityMatch(int Id, string Name, string PostCode, string Region);

record OfficePoint(string Code, string Name, string Kind, string Address, string City, string Hours, int CityId)
{
    public EcontOffice Public => new(Code, Name, Kind, Address, City, Hours);
}

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
