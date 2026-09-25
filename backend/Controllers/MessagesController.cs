using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/messages")]
public class MessagesController : ControllerBase
{
    private readonly AppStore _store;

    public MessagesController(AppStore store)
    {
        _store = store;
    }

    [HttpPost]
    public ActionResult<ContactMessage> Create([FromBody] ContactMessage message)
    {
        if (string.IsNullOrWhiteSpace(message.Name) ||
            string.IsNullOrWhiteSpace(message.Email) ||
            string.IsNullOrWhiteSpace(message.Message) ||
            !message.Email.Contains('@'))
        {
            return BadRequest(new { message = "Попълнете име, имейл и съобщение." });
        }

        return Ok(_store.AddMessage(message));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public ActionResult<IEnumerable<ContactMessage>> All()
    {
        return Ok(_store.Messages());
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/read")]
    public ActionResult<ContactMessage> Read(int id, [FromBody] ReadRequest request)
    {
        var message = _store.SetMessageRead(id, request.IsRead);
        if (message is null)
        {
            return NotFound();
        }

        return Ok(message);
    }
}

public class ReadRequest
{
    public bool IsRead { get; set; }
}
