using System.Net;
using System.Net.Mail;

namespace RosiNedelcheva.Api.Services;

public class MailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailService> _logger;

    public MailService(IConfiguration configuration, ILogger<MailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_configuration["Mail:Host"]);

    public async Task SendAsync(string to, string subject, string html)
    {
        var host = _configuration["Mail:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            throw new InvalidOperationException("SMTP не е настроен. Добавете Mail:Host в настройките.");
        }

        var port = int.TryParse(_configuration["Mail:Port"], out var parsed) ? parsed : 587;
        var from = _configuration["Mail:From"] ?? "info@ertherapybg.com";
        var fromName = _configuration["Mail:FromName"] ?? "Росица Неделчева";
        var user = _configuration["Mail:User"];
        var password = _configuration["Mail:Password"];

        using var message = new MailMessage
        {
            From = new MailAddress(from, fromName),
            Subject = subject,
            Body = html,
            IsBodyHtml = true
        };
        message.To.Add(to);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = port != 25,
            Timeout = 12000,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };
        if (!string.IsNullOrWhiteSpace(user))
        {
            client.Credentials = new NetworkCredential(user, password);
        }

        await client.SendMailAsync(message);
        _logger.LogInformation("Mail sent to {To} with subject {Subject}", to, subject);
    }
}
