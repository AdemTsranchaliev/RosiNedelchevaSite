using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using RosiNedelcheva.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100_000_000;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100_000_000;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<AppStore>();
builder.Services.AddSingleton<EmailTemplates>();
builder.Services.AddSingleton<MailService>();
builder.Services.AddSingleton<EcontService>();
builder.Services.AddSingleton<NekorektenService>();
builder.Services.AddScoped<IProductService, ProductService>();

var jwtKey = builder.Configuration["Auth:JwtKey"] ?? "dev-only-key-change-in-production-32b";
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Auth:Issuer"] ?? "RosiNedelcheva",
            ValidAudience = builder.Configuration["Auth:Audience"] ?? "RosiNedelcheva",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.Name
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseStaticFiles();
app.UseAuthentication();
if (app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        if (context.User.Identity?.IsAuthenticated != true || !context.User.IsInRole("Admin"))
        {
            var identity = context.User.Identity as ClaimsIdentity;
            if (identity is not { IsAuthenticated: true })
            {
                identity = new ClaimsIdentity("DevBypass");
                context.User = new ClaimsPrincipal(identity);
            }

            identity.AddClaim(new Claim(ClaimTypes.Role, "Admin"));
        }

        await next();
    });
}
app.UseAuthorization();
app.MapControllers();

app.Run();
