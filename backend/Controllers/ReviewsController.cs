using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private static readonly HashSet<string> Images = [".jpg", ".jpeg", ".png", ".webp"];
    private readonly AppStore _store;
    private readonly IWebHostEnvironment _environment;

    public ReviewsController(AppStore store, IWebHostEnvironment environment)
    {
        _store = store;
        _environment = environment;
    }

    [HttpGet]
    public ActionResult<ReviewSummary> Published([FromQuery] int productId = 1)
    {
        return Ok(_store.PublishedReviews(productId));
    }

    [HttpGet("invite/{token}")]
    public ActionResult Invite(string token)
    {
        var invite = _store.ReviewInvite(token);
        if (invite is null)
        {
            return NotFound(new { message = "Линкът за ревю не е валиден." });
        }

        return Ok(new
        {
            productName = invite.ProductName,
            authorName = invite.AuthorName,
            city = invite.City,
            used = invite.UsedAt is not null
        });
    }

    [HttpPost]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult> Submit([FromForm] ReviewForm form)
    {
        var invite = _store.ReviewInvite(form.Token ?? "");
        if (invite is null)
        {
            return NotFound(new { message = "Линкът за ревю не е валиден." });
        }

        if (invite.UsedAt is not null)
        {
            return BadRequest(new { message = "За тази поръчка вече има ревю." });
        }

        if (form.Rating is < 1 or > 5)
        {
            return BadRequest(new { message = "Изберете оценка от 1 до 5." });
        }

        var body = (form.Body ?? "").Trim();
        if (body.Length > 1200)
        {
            return BadRequest(new { message = "Текстът е твърде дълъг." });
        }

        var photos = form.Photos ?? [];
        if (photos.Count > 4)
        {
            return BadRequest(new { message = "Може да качите до 4 снимки." });
        }

        var urls = new List<string>();
        foreach (var photo in photos)
        {
            if (photo.Length == 0) continue;
            if (photo.Length > 5_000_000)
            {
                return BadRequest(new { message = "Всяка снимка трябва да е до 5 MB." });
            }

            var extension = Path.GetExtension(photo.FileName).ToLowerInvariant();
            if (!Images.Contains(extension))
            {
                return BadRequest(new { message = "Снимките трябва да са jpg, png или webp." });
            }

            var folder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");
            Directory.CreateDirectory(folder);
            var name = $"{Guid.NewGuid():N}{extension}";
            await using var stream = System.IO.File.Create(Path.Combine(folder, name));
            await photo.CopyToAsync(stream);
            urls.Add($"/uploads/{name}");
        }

        var nameOnReview = string.IsNullOrWhiteSpace(form.AuthorName) ? invite.AuthorName : form.AuthorName.Trim();
        if (nameOnReview.Length > 40) nameOnReview = nameOnReview[..40];

        var review = _store.SubmitReview(invite.Token, form.Rating, body, nameOnReview, urls);
        if (review is null)
        {
            return BadRequest(new { message = "Ревюто не се записа." });
        }

        return Ok(new { id = review.Id, status = review.Status });
    }

    [Authorize]
    [HttpGet("mine")]
    public ActionResult Mine()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized();
        }

        return Ok(_store.ReviewInvitesForEmail(email));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("manage")]
    public ActionResult<IEnumerable<ProductReview>> Manage()
    {
        return Ok(_store.Reviews());
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}")]
    public ActionResult<ProductReview> Status(int id, [FromBody] ReviewStatusRequest request)
    {
        var status = request.Status?.Trim() ?? "";
        if (status is not ("pending" or "published" or "hidden"))
        {
            return BadRequest(new { message = "Непознат статус." });
        }

        var review = _store.SetReviewStatus(id, status);
        if (review is null) return NotFound();
        return Ok(review);
    }
}

public class ReviewForm
{
    public string? Token { get; set; }
    public int Rating { get; set; }
    public string? Body { get; set; }
    public string? AuthorName { get; set; }
    public List<IFormFile>? Photos { get; set; }
}

public class ReviewStatusRequest
{
    public string? Status { get; set; }
}
