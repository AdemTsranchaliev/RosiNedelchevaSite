using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppStore _store;

    public UsersController(AppStore store)
    {
        _store = store;
    }

    [HttpGet]
    public ActionResult<IEnumerable<UserProfile>> All()
    {
        return Ok(_store.Users());
    }

    [HttpGet("reputation")]
    public ActionResult<IEnumerable<ReputationCheck>> Reputation()
    {
        return Ok(_store.ReputationChecks());
    }
}
