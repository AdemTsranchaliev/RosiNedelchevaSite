namespace RosiNedelcheva.Api.Models;

public class BlogEntry
{
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public int ReadMinutes { get; set; } = 4;
    public string Image { get; set; } = string.Empty;
    public string ImageAlt { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
}
