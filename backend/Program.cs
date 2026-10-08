using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using RosiNedelcheva.Api.Data;
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

var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Липсва ConnectionStrings:Default. Задай го чрез dotnet user-secrets или променливата ConnectionStrings__Default.");
}

builder.Services.AddDbContextFactory<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql =>
        sql.EnableRetryOnFailure(maxRetryCount: 10, maxRetryDelay: TimeSpan.FromSeconds(15), errorNumbersToAdd: null)));
builder.Services.AddSingleton<AppStore>();
builder.Services.AddSingleton<EmailTemplates>();
builder.Services.AddSingleton<MailService>();
builder.Services.AddSingleton<ShopMail>();
builder.Services.AddSingleton<EcontService>();
builder.Services.AddSingleton<NekorektenService>();
builder.Services.AddSingleton<MetaConversionsService>();
builder.Services.AddSingleton<StripeService>();
builder.Services.AddSingleton<CardPaymentService>();
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

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                return uri.Host is "localhost" or "127.0.0.1" && uri.Scheme is "http" or "https";
            })
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

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.Use(async (context, next) =>
{
    var relative = PageIndex(context.Request, app.Environment);
    if (relative is not null)
    {
        context.Items["page-index"] = relative;
        context.Request.Path = "/" + relative;
    }

    await next();
});
app.UseDefaultFiles();
app.UseStaticFiles();
var uploads = SiteStorage.UploadsFolder(app.Environment);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploads),
    RequestPath = "/uploads"
});
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
app.MapFallback(async context =>
{
    var path = context.Request.Path;
    if (path.StartsWithSegments("/api") || path.StartsWithSegments("/swagger"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var relative = context.Items["page-index"] as string ?? PageIndex(context.Request, app.Environment);
    if (relative is not null)
    {
        var page = app.Environment.WebRootFileProvider.GetFileInfo(relative);
        if (page.Exists)
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            context.Response.ContentLength = page.Length;
            if (!HttpMethods.IsHead(context.Request.Method))
            {
                await using var stream = page.CreateReadStream();
                await stream.CopyToAsync(context.Response.Body);
            }

            return;
        }
    }

    var webRoot = app.Environment.WebRootPath;
    var segments = (path.Value ?? "").Split('/', StringSplitOptions.RemoveEmptyEntries);
    var reviewAt = Array.FindIndex(segments, segment => segment.Equals("revyu", StringComparison.OrdinalIgnoreCase));
    if (string.IsNullOrEmpty(webRoot) || reviewAt < 0 || reviewAt + 1 >= segments.Length)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var token = segments[reviewAt + 1];
    var file = Path.Combine(webRoot, "revyu", "demo", "index.html");
    if (token.Length is 0 or > 64
        || token.Any(character => !char.IsAsciiLetterOrDigit(character) && character is not '-' and not '_')
        || !File.Exists(file))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var html = await File.ReadAllTextAsync(file);
    var head = html.IndexOf("<head", StringComparison.OrdinalIgnoreCase);
    if (head >= 0)
    {
        var close = html.IndexOf('>', head);
        if (close >= 0)
        {
            html = html.Insert(close + 1, $"<script>window.__REVIEW_TOKEN={JsonSerializer.Serialize(token)};</script>");
        }
    }

    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.WriteAsync(html);
});

app.Run();

static string? PageIndex(HttpRequest request, IWebHostEnvironment environment)
{
    if (!HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method))
    {
        return null;
    }

    var requestPath = request.Path.Value ?? "";
    if (requestPath.StartsWith("/api", StringComparison.OrdinalIgnoreCase)
        || requestPath.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase)
        || requestPath.StartsWith("/uploads", StringComparison.OrdinalIgnoreCase)
        || requestPath.StartsWith("/revyu", StringComparison.OrdinalIgnoreCase)
        || Path.HasExtension(requestPath))
    {
        return null;
    }

    var trimmed = requestPath.Trim('/');
    if (trimmed.Length > 0)
    {
        foreach (var segment in trimmed.Split('/'))
        {
            if (segment.Length == 0 || segment is "." or "..")
            {
                return null;
            }
        }
    }

    var relative = trimmed.Length == 0 ? "index.html" : trimmed + "/index.html";
    return environment.WebRootFileProvider.GetFileInfo(relative).Exists ? relative : null;
}
