using System.Globalization;
using System.Net;
using System.Text;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public record EmailTemplateInfo(string Id, string Group, string Name, string Description);

public record RenderedEmail(string Id, string Subject, string Html);

public class EmailTemplates
{
    private readonly string _site;

    public EmailTemplates(IConfiguration configuration)
    {
        _site = (configuration["Mail:SiteUrl"] ?? "http://localhost:3000").TrimEnd('/');
    }

    public IReadOnlyList<EmailTemplateInfo> Catalog() =>
    [
        new("order-received", "Поръчки", "Нова поръчка", "Потвърждение към клиента веднага след поръчка."),
        new("order-admin", "Поръчки", "Нова поръчка към теб", "Известие с данните за доставка."),
        new("order-confirmed", "Поръчки", "Потвърдена", "Поръчката се подготвя."),
        new("order-shipped", "Поръчки", "Изпратена", "Товарителница и очакване на пратката."),
        new("order-completed", "Поръчки", "Завършена", "След като комплектът е получен."),
        new("order-unclaimed", "Поръчки", "Непотърсена", "Пратката още не е взета."),
        new("order-returned", "Поръчки", "Върната", "С причината за връщането."),
        new("order-cancelled", "Поръчки", "Отказана", "Когато поръчката не се изпълнява."),
        new("welcome", "Хора", "Добре дошъл", "След регистрация в профила."),
        new("newsletter", "Хора", "Бюлетин", "Потвърждение за абонамент."),
        new("contact-thanks", "Хора", "Получено съобщение", "Отговор, че писмото е при нас."),
        new("contact-admin", "Хора", "Съобщение към теб", "Ново писмо от формата за контакт."),
        new("promotion", "Магазин", "Промоция", "Кратко писмо за отстъпка и код."),
        new("review-invite", "Магазин", "Покана за ревю", "След завършена поръчка, с линк за оценка и снимки.")
    ];

    public RenderedEmail? Sample(string id)
    {
        var order = SampleOrder();
        var tracked = SampleOrder();
        tracked.TrackingCode = "EC123456789BG";
        return id switch
        {
            "order-received" => Order(order, "received"),
            "order-admin" => Order(order, "admin"),
            "order-confirmed" => Order(order, "confirmed"),
            "order-shipped" => Order(tracked, "shipped"),
            "order-completed" => Order(order, "completed"),
            "order-unclaimed" => Order(tracked, "unclaimed"),
            "order-returned" => Order(order, "returned"),
            "order-cancelled" => Order(order, "cancelled"),
            "welcome" => Welcome("Мария"),
            "newsletter" => Newsletter("maria@example.com"),
            "contact-thanks" => ContactThanks("Мария", "Въпрос за картите"),
            "contact-admin" => ContactAdmin("Мария Иванова", "maria@example.com", "089 111 2233", "Въпрос за картите", "Здравейте, интересува ме дали картите са подходящи и за работа в група."),
            "promotion" => Promotion(),
            "review-invite" => ReviewInvite(SampleOrder(), "Справяне с тревожността", "sample"),
            _ => null
        };
    }

    public RenderedEmail Order(ShopOrder order, string kind)
    {
        var name = FirstName(order.CustomerName);
        var (eyebrow, title, intro, subject) = kind switch
        {
            "admin" => ("Нова поръчка", order.Number, $"{E(order.CustomerName)} поръча от сайта.", $"Нова поръчка {order.Number}"),
            "confirmed" => ("Потвърдена", "Подготвяме я", $"Здравей, {E(name)}. Поръчка {E(order.Number)} е потвърдена и се подготвя за изпращане.", $"Поръчка {order.Number} е потвърдена"),
            "shipped" => ("На път", "Поръчката тръгна", $"Здравей, {E(name)}. Комплектът е предаден на куриера.", $"Поръчка {order.Number} е изпратена"),
            "completed" => ("При теб", "Приятна работа с картите", $"Здравей, {E(name)}. Надяваме се комплектът вече е при теб и ще ти бъде тих спътник.", $"Поръчка {order.Number} е завършена"),
            "unclaimed" => ("Непотърсена", "Пратката те чака", $"Здравей, {E(name)}. Пратката по поръчка {E(order.Number)} още не е потърсена. Ако адресът или телефонът трябва да се поправят, пиши ни.", $"Пратка {order.Number} не е потърсена"),
            "returned" => ("Върната", "Поръчката се върна", $"Здравей, {E(name)}. Поръчка {E(order.Number)} е отбелязана като върната.", $"Поръчка {order.Number} е върната"),
            "cancelled" => ("Отказана", "Поръчката е спряна", $"Здравей, {E(name)}. Поръчка {E(order.Number)} няма да бъде изпълнена. Ако все пак искаш картите, магазинът е отворен.", $"Поръчка {order.Number} е отказана"),
            _ => ("Поръчка", "Благодарим ти", $"Здравей, {E(name)}. Получихме поръчка {E(order.Number)}. Ще я подготвим спокойно и ще ти пишем, когато тръгне.", $"Поръчка {order.Number} е приета")
        };

        var body = new StringBuilder();
        body.Append(Paragraph(intro));
        if (kind is "shipped" or "unclaimed" && !string.IsNullOrWhiteSpace(order.TrackingCode))
        {
            body.Append(Callout("Товарителница", E(order.TrackingCode)));
        }

        if (kind == "returned")
        {
            var reason = order.History.LastOrDefault(item => item.Status == "returned")?.Note;
            if (string.IsNullOrWhiteSpace(reason)) reason = "Клиентът не е намерил пратката на адреса.";
            body.Append(Callout("Причина", E(reason)));
        }

        body.Append(Items(order));
        body.Append(Address(order));
        var cta = kind == "admin" ? "Отвори админа" : "Към профила";
        var href = kind == "admin" ? $"{_site}/admin/" : $"{_site}/profil/";
        return new RenderedEmail(kind == "admin" ? "order-admin" : $"order-{kind}", subject, Layout(eyebrow, title, body.ToString(), cta, href));
    }

    public RenderedEmail Welcome(string name) =>
        new("welcome", "Профилът ти е готов", Layout(
            "Добре дошъл",
            $"Здравей, {E(FirstName(name))}",
            Paragraph("Профилът ти е готов. Оттам виждаш поръчките си и статуса им. Картите „Справяне с тревожността“ са инструмент за самопомощ, самоосъзнаване и вътрешна устойчивост."),
            "Към картите",
            $"{_site}/karti/"));

    public RenderedEmail Newsletter(string email) =>
        new("newsletter", "Абонаментът е записан", Layout(
            "Бюлетин",
            "Писма за картите",
            Paragraph($"Здравей. Записахме {E(email)}.") +
            Paragraph("Писмата са за картите, практиката и новите текстове — рядко, спокойно, без шум."),
            "Към картите",
            $"{_site}/karti/"));

    public RenderedEmail ContactThanks(string name, string topic) =>
        new("contact-thanks", "Получихме съобщението ти", Layout(
            "Контакт",
            "Писмото е при нас",
            Paragraph($"Здравей, {E(FirstName(name))}. Получихме съобщението ти{(string.IsNullOrWhiteSpace(topic) ? "" : $" за „{E(topic)}“")}. Ще отговорим лично."),
            "Към контактите",
            $"{_site}/kontakti/"));

    public RenderedEmail ContactAdmin(string name, string email, string phone, string topic, string message) =>
        new("contact-admin", $"Съобщение от {name}", Layout(
            "Контакт",
            string.IsNullOrWhiteSpace(topic) ? "Ново съобщение" : E(topic),
            Paragraph($"{E(name)}<br>{E(email)}{(string.IsNullOrWhiteSpace(phone) ? "" : $"<br>{E(phone)}")}") +
            Paragraph(E(message).Replace("\n", "<br>")),
            "Отвори админа",
            $"{_site}/admin/"));

    public RenderedEmail ReviewInvite(ShopOrder order, string productName, string token)
    {
        var name = FirstName(order.CustomerName);
        return new RenderedEmail(
            "review-invite",
            "Как ти хареса комплектът?",
            Layout(
                "Ревю",
                "Как ти хареса?",
                Paragraph($"Здравей, {E(name)}. Ако картите вече са при теб, ще се радвам на кратко ревю за „{E(productName)}“. Можеш да добавиш и снимка. Ще се появи на сайта, след като го прегледам."),
                "Напиши ревю",
                $"{_site}/revyu/{token}/"));
    }

    public RenderedEmail Promotion() =>
        new("promotion", "Есенна грижа — 10% от комплекта", Layout(
            "Промоция",
            "Есенна грижа",
            Paragraph("До края на седмицата комплектът „Справяне с тревожността“ е с 10% отстъпка. Кодът се въвежда при поръчка.") +
            Callout("Код", "GRIZHA10"),
            "Към картите",
            $"{_site}/karti/"));

    private static ShopOrder SampleOrder() => new()
    {
        Number = "RN-20260924-1042",
        CustomerName = "Мария Иванова",
        Phone = "089 111 2233",
        Email = "maria@example.com",
        City = "София",
        Address = "ул. Оборище 12",
        Note = "Моля, обадете се преди доставка.",
        Total = 71.10m,
        PromoCode = "GRIZHA10",
        DiscountPercent = 10,
        Items = [new OrderLine { Title = "Справяне с тревожността", Price = 79m, Quantity = 1 }],
        History = [new OrderEvent { Status = "returned", Note = "Клиентът не е намерил пратката на адреса." }]
    };

    private static string Items(ShopOrder order)
    {
        var rows = new StringBuilder();
        foreach (var item in order.Items)
        {
            rows.Append($"""
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(78,69,62,0.12);font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#4e453e;">{E(item.Title)} × {item.Quantity}</td>
                  <td align="right" style="padding:12px 0;border-bottom:1px solid rgba(78,69,62,0.12);font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#4e453e;">{Money(item.Price * item.Quantity)}</td>
                </tr>
                """);
        }

        var discount = order.DiscountPercent > 0
            ? $"""<tr><td style="padding:8px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#8d8176;">Отстъпка {order.DiscountPercent}%{(string.IsNullOrWhiteSpace(order.PromoCode) ? "" : $" · {E(order.PromoCode)}")}</td><td></td></tr>"""
            : "";
        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">{rows}{discount}
              <tr>
                <td style="padding:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#4e453e;">Общо</td>
                <td align="right" style="padding:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#4e453e;">{Money(order.Total)}</td>
              </tr>
            </table>
            """;
    }

    private static string Address(ShopOrder order) =>
        Callout("Доставка", $"{E(order.CustomerName)}<br>{E(order.Phone)} · {E(order.Email)}<br>{E(order.City)}, {E(order.Address)}{(string.IsNullOrWhiteSpace(order.Note) ? "" : $"<br>{E(order.Note)}")}");

    private static string Layout(string eyebrow, string title, string inner, string cta, string href) =>
        $$"""
        <!DOCTYPE html>
        <html lang="bg">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{title}}</title></head>
        <body style="margin:0;padding:0;background:#f6f1e8;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e8;">
            <tr><td align="center" style="padding:36px 16px;">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
                <tr><td align="center" style="padding:0 8px 22px;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.28em;color:#8f7350;">RN</div>
                  <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#5e5148;">Росица Неделчева</div>
                  <div style="margin-top:2px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#8d8176;">Психолог и психотерапевт</div>
                </td></tr>
                <tr><td style="background:#fffdf8;border:1px solid rgba(78,69,62,0.12);border-radius:18px;padding:36px 32px;">
                  <p style="margin:0 0 12px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8f7350;">{{E(eyebrow)}}</p>
                  <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:34px;line-height:1.15;color:#4e453e;">{{E(title)}}</h1>
                  {{inner}}
                  <p style="margin:26px 0 0;">
                    <a href="{{href}}" style="display:inline-block;background:#5e5148;color:#f6f1e8;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;">{{cta}}</a>
                  </p>
                </td></tr>
                <tr><td align="center" style="padding:22px 8px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#8d8176;">
                  Росица Неделчева · 089 556 3333<br>
                  <a href="mailto:info@ertherapybg.com" style="color:#8d8176;text-decoration:none;">info@ertherapybg.com</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """;

    private static string Paragraph(string html) =>
        $"""<p style="margin:0 0 14px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#6d6258;">{html}</p>""";

    private static string Callout(string label, string html) =>
        $"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
          <tr><td style="background:#efe6d8;border-radius:14px;padding:14px 16px;">
            <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8f7350;">{label}</div>
            <div style="margin-top:6px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.45;color:#4e453e;">{html}</div>
          </td></tr>
        </table>
        """;

    private static string Money(decimal value) =>
        value.ToString("0.00", CultureInfo.InvariantCulture).Replace(".", ",") + " €";

    private static string FirstName(string name)
    {
        var part = name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return string.IsNullOrWhiteSpace(part) ? name : part;
    }

    private static string E(string? value) => WebUtility.HtmlEncode(value ?? "");
}
