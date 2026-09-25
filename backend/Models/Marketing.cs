namespace RosiNedelcheva.Api.Models;

public class Promotion
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Percent { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public List<int> ProductIds { get; set; } = [];
}

public class PromoCode
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int Percent { get; set; }
    public int Used { get; set; }
    public int MaxUses { get; set; } = 100;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SiteBanner
{
    public string Text { get; set; } = string.Empty;
    public string Href { get; set; } = "/karti";
    public bool IsActive { get; set; }
}

public class Subscriber
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class EmailCampaign
{
    public int Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int Recipients { get; set; }
    public string Status { get; set; } = "saved";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CourierSettings
{
    public bool UseDemo { get; set; } = true;
    public string Username { get; set; } = "iasp-dev";
    public string Password { get; set; } = "1Asp-dev";
    public string SenderName { get; set; } = "Росица Неделчева";
    public string SenderPhone { get; set; } = "0895563333";
    public string City { get; set; } = "София";
    public string PostCode { get; set; } = "1000";
    public string Street { get; set; } = "ул. Проф. Александър Фол";
    public string StreetNumber { get; set; } = "2";
    public double Weight { get; set; } = 1;
    public string Description { get; set; } = "Терапевтични карти";
}

public class PublicOffers
{
    public Promotion? Promotion { get; set; }
    public SiteBanner Banner { get; set; } = new();
    public QuoteResult? Quote { get; set; }
}

public class QuoteResult
{
    public bool Ok { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Percent { get; set; }
    public string? Code { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
}
