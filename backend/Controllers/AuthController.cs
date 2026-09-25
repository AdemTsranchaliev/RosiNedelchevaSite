using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RosiNedelcheva.Api.Models;
using RosiNedelcheva.Api.Services;

namespace RosiNedelcheva.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppStore _store;
    private readonly IConfiguration _configuration;

    public AuthController(AppStore store, IConfiguration configuration)
    {
        _store = store;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public ActionResult<AuthResponse> Register([FromBody] RegisterRequest request)
    {
        var name = request.Name?.Trim() ?? "";
        var email = request.Email?.Trim() ?? "";
        var password = request.Password ?? "";

        if (name.Length < 2 || !IsEmail(email) || password.Length < 8)
        {
            return BadRequest(new { message = "Въведете име, валиден имейл и парола от поне 8 знака." });
        }

        try
        {
            var user = _store.AddUser(name, email, password, "Customer");
            return Ok(Issue(user));
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
    {
        var email = request.Email?.Trim() ?? "";
        var password = request.Password ?? "";
        var user = _store.FindUserByEmail(email);
        if (user is null || !PasswordHasher.Verify(password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Грешен имейл или парола." });
        }

        return Ok(Issue(user));
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<UserProfile> Me()
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idValue, out var id))
        {
            return Unauthorized();
        }

        var user = _store.FindUserById(id);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(_store.ToProfile(user));
    }

    private AuthResponse Issue(AppUser user)
    {
        var keyText = _configuration["Auth:JwtKey"] ?? "dev-only-key-change-in-production-32b";
        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(keyText));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(7);
        var token = new JwtSecurityToken(
            issuer: _configuration["Auth:Issuer"] ?? "RosiNedelcheva",
            audience: _configuration["Auth:Audience"] ?? "RosiNedelcheva",
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role)
            ],
            expires: expires,
            signingCredentials: credentials);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            User = _store.ToProfile(user)
        };
    }

    private static bool IsEmail(string email) =>
        email.Contains('@') && email.Contains('.') && !email.Contains(' ');
}

public class LoginRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class RegisterRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserProfile User { get; set; } = new();
}
