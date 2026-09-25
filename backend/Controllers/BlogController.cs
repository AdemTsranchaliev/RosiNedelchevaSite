using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/blog")]
public class BlogController : ControllerBase
{
    private readonly AppStore _store;

    public BlogController(AppStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<BlogEntry>> Published()
    {
        return Ok(_store.Blog(includeUnpublished: false));
    }

    [HttpGet("{slug}")]
    public ActionResult<BlogEntry> BySlug(string slug)
    {
        var post = _store.BlogBySlug(slug, includeUnpublished: false);
        if (post is null)
        {
            return NotFound();
        }

        return Ok(post);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("manage")]
    public ActionResult<IEnumerable<BlogEntry>> Manage()
    {
        return Ok(_store.Blog(includeUnpublished: true));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public ActionResult<BlogEntry> Create([FromBody] BlogEntry entry)
    {
        if (string.IsNullOrWhiteSpace(entry.Title) || string.IsNullOrWhiteSpace(entry.Body))
        {
            return BadRequest(new { message = "Заглавието и текстът са задължителни." });
        }

        if (string.IsNullOrWhiteSpace(entry.Date))
        {
            entry.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        }

        return Ok(_store.AddBlog(entry));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public ActionResult<BlogEntry> Update(int id, [FromBody] BlogEntry entry)
    {
        var updated = _store.UpdateBlog(id, entry);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        if (!_store.DeleteBlog(id))
        {
            return NotFound();
        }

        return NoContent();
    }
}
