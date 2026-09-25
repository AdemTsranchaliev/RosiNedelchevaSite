namespace RosiNedelcheva.Api.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> Images { get; set; } = [];
    public string? VideoUrl { get; set; }
    public List<string> Highlights { get; set; } = [];
    public List<ProductSpec> Specs { get; set; } = [];
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ProductSpec
{
    public string Lead { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
}
