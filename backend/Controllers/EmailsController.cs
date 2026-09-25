using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/emails")]
public class EmailsController : ControllerBase
{
    private readonly EmailTemplates _templates;
    private readonly MailService _mail;
    private readonly IConfiguration _configuration;

    public EmailsController(EmailTemplates templates, MailService mail, IConfiguration configuration)
    {
        _templates = templates;
        _mail = mail;
        _configuration = configuration;
    }

    [HttpGet]
    public ActionResult Catalog() => Ok(new
    {
        configured = _mail.IsConfigured,
        from = _configuration["Mail:From"] ?? "info@ertherapybg.com",
        templates = _templates.Catalog()
    });

    [HttpGet("{id}")]
    public ActionResult Preview(string id)
    {
        var email = _templates.Sample(id);
        if (email is null)
        {
            return NotFound();
        }

        var info = _templates.Catalog().First(item => item.Id == id);
        return Ok(new { info.Id, info.Group, info.Name, info.Description, email.Subject, email.Html });
    }

    [HttpPost("{id}/test")]
    public async Task<ActionResult> Test(string id, [FromBody] TestEmailRequest request)
    {
        var to = request.To?.Trim() ?? "";
        if (!to.Contains('@') || !to.Contains('.'))
        {
            return BadRequest(new { message = "Въведете имейл, на който да стигне тестът." });
        }

        var email = _templates.Sample(id);
        if (email is null)
        {
            return NotFound();
        }

        if (!_mail.IsConfigured)
        {
            return BadRequest(new { message = "SMTP не е настроен. Прегледът е готов, но писмото не може да излезе." });
        }

        try
        {
            await _mail.SendAsync(to, email.Subject, email.Html);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        return Ok(new { sent = true });
    }
}

public class TestEmailRequest
{
    public string? To { get; set; }
}
