namespace RosiNedelcheva.Api.Models;

public class ProductReview
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Body { get; set; } = string.Empty;
    public List<string> Images { get; set; } = [];
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ReviewInvite
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }
    public DateTime? SentAt { get; set; }
}

public class PublicReview
{
    public int Id { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Body { get; set; } = string.Empty;
    public List<string> Images { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public class ReviewSummary
{
    public int ProductId { get; set; }
    public double Average { get; set; }
    public int Count { get; set; }
    public List<PublicReview> Reviews { get; set; } = [];
}
