using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize(Roles = "Admin")]
public class UploadsController : ControllerBase
{
    private static readonly HashSet<string> Images = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private static readonly HashSet<string> Videos = [".mp4", ".webm", ".mov"];
    private readonly IWebHostEnvironment _environment;

    public UploadsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost]
    [RequestSizeLimit(100_000_000)]
    public async Task<ActionResult> Upload(IFormFile? file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Изберете файл." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Images.Contains(extension) && !Videos.Contains(extension))
        {
            return BadRequest(new { message = "Позволени са снимки (jpg, png, webp) и видео (mp4, webm)." });
        }

        var folder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(folder);
        var name = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(folder, name);
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);

        return Ok(new { url = $"/uploads/{name}", kind = Videos.Contains(extension) ? "video" : "image" });
    }
}
