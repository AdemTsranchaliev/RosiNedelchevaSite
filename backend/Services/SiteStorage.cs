namespace RosiNedelcheva.Api.Services;

public static class SiteStorage
{
    public static string UploadsFolder(IWebHostEnvironment environment)
    {
        var folder = Path.Combine(Root(environment), "uploads");
        Directory.CreateDirectory(folder);
        return folder;
    }

    private static string Root(IWebHostEnvironment environment)
    {
        var site = Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME");
        var home = Environment.GetEnvironmentVariable("HOME");
        if (!string.IsNullOrWhiteSpace(site) && !string.IsNullOrWhiteSpace(home))
        {
            return Path.Combine(home, "data");
        }

        return environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
    }
}
