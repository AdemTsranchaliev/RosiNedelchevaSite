using System.Text.Json.Serialization;

namespace RosiNedelcheva.Api.Models;

public class ShopOrder
{
    public int Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public bool AcceptedTerms { get; set; }
    public string PaymentMethod { get; set; } = "card";
    public string? PaymentStatus { get; set; }
    public string? StripeSessionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public string DeliveryType { get; set; } = "address";
    public string? OfficeCode { get; set; }
    public string? OfficeName { get; set; }
    public decimal Total { get; set; }
    public decimal Shipping { get; set; }
    public string? PromoCode { get; set; }
    public int DiscountPercent { get; set; }
    public string Status { get; set; } = "new";
    public string? TrackingCode { get; set; }
    public string? LabelUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<OrderLine> Items { get; set; } = [];
    public List<OrderEvent> History { get; set; } = [];

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public OrderAttribution? Attribution { get; set; }
}

public class OrderAttribution
{
    public string? EventId { get; set; }
    public string? Fbp { get; set; }
    public string? Fbc { get; set; }
    public bool MarketingConsent { get; set; }
    public string? SourceUrl { get; set; }
    public string? ClientIp { get; set; }
    public string? UserAgent { get; set; }
}

public class OrderEvent
{
    public string Status { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public DateTime At { get; set; } = DateTime.UtcNow;
}

public class OrderLine
{
    public int ProductId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}
