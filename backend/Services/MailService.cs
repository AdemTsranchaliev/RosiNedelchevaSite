using System.Net;
using System.Net.Mail;
using Azure;
using Azure.Communication.Email;
using RosiNedelcheva.Api.Models;

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

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_configuration["Mail:ConnectionString"])
        || !string.IsNullOrWhiteSpace(_configuration["Mail:Host"]);

    public async Task SendAsync(string to, string subject, string html)
    {
        var connection = _configuration["Mail:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(connection))
        {
            await SendAzureAsync(connection, to, subject, html);
            return;
        }

        await SendSmtpAsync(to, subject, html);
    }

    private async Task SendAzureAsync(string connection, string to, string subject, string html)
    {
        var from = _configuration["Mail:From"] ?? "DoNotReply@rosinedelcheva.com";
        var fromName = _configuration["Mail:FromName"] ?? "Росица Неделчева";
        var replyTo = _configuration["Mail:ReplyTo"];
        var client = new EmailClient(connection);
        var message = new EmailMessage(from, to, new EmailContent(subject) { Html = html });
        if (!string.IsNullOrWhiteSpace(replyTo))
        {
            message.ReplyTo.Add(new EmailAddress(replyTo, fromName));
        }

        try
        {
            await client.SendAsync(WaitUntil.Started, message);
        }
        catch (RequestFailedException exception)
        {
            _logger.LogError(exception, "Azure email was rejected for {To}", to);
            throw new InvalidOperationException(exception.Message, exception);
        }

        _logger.LogInformation("Mail sent to {To} with subject {Subject}", to, subject);
    }

    private async Task SendSmtpAsync(string to, string subject, string html)
    {
        var host = _configuration["Mail:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            throw new InvalidOperationException("Имейлът не е свързан. Добавете Mail:ConnectionString в настройките.");
        }

        var port = int.TryParse(_configuration["Mail:Port"], out var parsed) ? parsed : 587;
        var from = _configuration["Mail:From"] ?? "DoNotReply@rosinedelcheva.com";
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

public class ShopMail
{
    private readonly MailService _mail;
    private readonly EmailTemplates _templates;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ShopMail> _logger;

    public ShopMail(MailService mail, EmailTemplates templates, IConfiguration configuration, ILogger<ShopMail> logger)
    {
        _mail = mail;
        _templates = templates;
        _configuration = configuration;
        _logger = logger;
    }

    public Task OrderPlaced(ShopOrder order) => Task.WhenAll(
        Send(order.Email, _templates.Order(order, "received")),
        Send(Inbox(), _templates.Order(order, "admin")));

    public Task OrderStatus(ShopOrder order, string status)
    {
        if (status is not ("confirmed" or "shipped" or "completed" or "unclaimed" or "returned" or "cancelled"))
        {
            return Task.CompletedTask;
        }

        return Send(order.Email, _templates.Order(order, status));
    }

    public Task Welcome(string name, string email)
    {
        var message = _templates.Welcome(name);
        return Send(email, message);
    }

    public Task Newsletter(string email)
    {
        var message = _templates.Newsletter(email);
        return Send(email, message);
    }

    public Task Contact(ContactMessage message) => Task.WhenAll(
        Send(message.Email, _templates.ContactThanks(message.Name, message.Topic)),
        Send(Inbox(), _templates.ContactAdmin(message.Name, message.Email, "", message.Topic, message.Message)));

    private string? Inbox()
    {
        var reply = _configuration["Mail:ReplyTo"];
        if (!string.IsNullOrWhiteSpace(reply)) return reply.Trim();
        var admin = _configuration["Auth:AdminEmail"];
        return string.IsNullOrWhiteSpace(admin) ? null : admin.Trim();
    }

    private async Task Send(string? to, RenderedEmail email)
    {
        if (!_mail.IsConfigured || string.IsNullOrWhiteSpace(to) || !to.Contains('@')) return;
        try
        {
            await _mail.SendAsync(to.Trim(), email.Subject, email.Html);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Mail {Template} was not sent to {To}", email.Id, to);
        }
    }
}
