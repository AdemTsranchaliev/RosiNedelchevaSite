using System.Globalization;
using System.Net;
using System.Text;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public record EmailTemplateInfo(string Id, string Group, string Name, string Description);

public record RenderedEmail(string Id, string Subject, string Html);

public class EmailTemplates
{
    private const string Sans = "'Segoe UI',Helvetica,Arial,sans-serif";
    private const string Serif = "Georgia,'Times New Roman',serif";
    private const string InstagramUrl = "https://www.instagram.com/ertherapybg";
    private const string FacebookUrl = "https://www.facebook.com/ertherapybg";

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
        new("welcome", "Хора", "Добре дошъл", "Писмо към профила."),
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
        return new RenderedEmail(kind == "admin" ? "order-admin" : $"order-{kind}", subject, Layout(eyebrow, title, body.ToString(), cta, href, subject));
    }

    public RenderedEmail Welcome(string name) =>
        new("welcome", "Профилът ти е готов", Layout(
            "Добре дошъл",
            $"Здравей, {E(FirstName(name))}",
            Paragraph("Профилът ти е готов. Оттам виждаш поръчките си и статуса им. Картите „Справяне с тревожността“ са инструмент за самопомощ, самоосъзнаване и вътрешна устойчивост."),
            "Към картите",
            $"{_site}/karti/",
            "Профилът ти е готов"));

    public RenderedEmail Newsletter(string email) =>
        new("newsletter", "Абонаментът е записан", Layout(
            "Бюлетин",
            "Писма за картите",
            Paragraph($"Здравей. Записахме {E(email)}.") +
            Paragraph("Писмата са за картите, практиката и новите текстове — рядко, спокойно, без шум."),
            "Към картите",
            $"{_site}/karti/",
            "Абонаментът е записан"));

    public RenderedEmail ContactThanks(string name, string topic) =>
        new("contact-thanks", "Получихме съобщението ти", Layout(
            "Контакт",
            "Писмото е при нас",
            Paragraph($"Здравей, {E(FirstName(name))}. Получихме съобщението ти{(string.IsNullOrWhiteSpace(topic) ? "" : $" за „{E(topic)}“")}. Ще отговорим лично."),
            "Към контактите",
            $"{_site}/kontakti/",
            "Получихме съобщението ти"));

    public RenderedEmail ContactAdmin(string name, string email, string phone, string topic, string message) =>
        new("contact-admin", $"Съобщение от {name}", Layout(
            "Контакт",
            string.IsNullOrWhiteSpace(topic) ? "Ново съобщение" : topic,
            Paragraph($"{E(name)}<br>{E(email)}{(string.IsNullOrWhiteSpace(phone) ? "" : $"<br>{E(phone)}")}") +
            Paragraph(E(message).Replace("\n", "<br>")),
            "Отвори админа",
            $"{_site}/admin/",
            $"Съобщение от {name}"));

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
                $"{_site}/revyu/{token}/",
                "Как ти хареса комплектът?"));
    }

    public RenderedEmail Promotion() =>
        new("promotion", "Есенна грижа — 10% от комплекта", Layout(
            "Промоция",
            "Есенна грижа",
            Paragraph("До края на седмицата комплектът „Справяне с тревожността“ е с 10% отстъпка. Кодът се въвежда при поръчка.") +
            Callout("Код", "GRIZHA10"),
            "Към картите",
            $"{_site}/karti/",
            "Есенна грижа — 10% от комплекта"));

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
                  <td style="padding:12px 0;border-bottom:1px solid #efe6d8;font-family:{Sans};font-size:15px;line-height:1.45;color:#4e453e;">{E(item.Title)}<span style="color:#8d8176;"> × {item.Quantity}</span></td>
                  <td align="right" valign="top" style="padding:12px 0 12px 16px;border-bottom:1px solid #efe6d8;font-family:{Sans};font-size:15px;color:#4e453e;white-space:nowrap;">{Money(item.Price * item.Quantity)}</td>
                </tr>
                """);
        }

        var discount = order.DiscountPercent > 0
            ? $"""<tr><td style="padding:10px 0 0;font-family:{Sans};font-size:13px;color:#8d8176;">Отстъпка {order.DiscountPercent}%{(string.IsNullOrWhiteSpace(order.PromoCode) ? "" : $" · {E(order.PromoCode)}")}</td><td></td></tr>"""
            : "";
        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;">{rows}{discount}
              <tr>
                <td style="padding:14px 0 0;font-family:{Serif};font-size:20px;color:#4e453e;">Общо</td>
                <td align="right" style="padding:14px 0 0;font-family:{Serif};font-size:20px;color:#4e453e;">{Money(order.Total)}</td>
              </tr>
            </table>
            """;
    }

    private static string Address(ShopOrder order) =>
        Callout("Доставка", $"{E(order.CustomerName)}<br>{E(order.Phone)} · {E(order.Email)}<br>{E(order.City)}, {E(order.Address)}{(string.IsNullOrWhiteSpace(order.Note) ? "" : $"<br>{E(order.Note)}")}");

    private string Asset(string file) => $"{_site}/images/email/{file}";

    private string SocialLink(string file, string label, string href) =>
        $"""
        <td style="padding:0 6px;">
          <a href="{href}" style="text-decoration:none;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle" style="padding-right:8px;"><img src="{Asset(file)}" width="20" height="20" alt="" style="display:block;border:0;outline:none;width:20px;height:20px;"></td>
                <td valign="middle" style="font-family:{Sans};font-size:13px;line-height:20px;color:#6d6258;">{label}</td>
              </tr>
            </table>
          </a>
        </td>
        """;

    private string Layout(string eyebrow, string title, string inner, string cta, string href, string? preheader = null)
    {
        var preview = string.IsNullOrWhiteSpace(preheader) ? title : preheader;
        var logo = Asset("logo-rn.png");
        return $$"""
        <!DOCTYPE html>
        <html lang="bg">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <title>{{E(title)}}</title>
          <style>
            @media only screen and (max-width: 620px) {
              .email-card { padding: 28px 22px !important; }
              .email-title { font-size: 30px !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background:#f6f1e8;" bgcolor="#f6f1e8">
          <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f6f1e8;">{{E(preview)}}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f6f1e8" style="background:#f6f1e8;">
            <tr><td align="center" style="padding:32px 16px 40px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
                <tr><td align="center" style="padding:0 12px 22px;">
                  <a href="{{_site}}/" style="text-decoration:none;">
                    <img src="{{logo}}" width="96" height="88" alt="Росица Неделчева" style="display:block;margin:0 auto;border:0;outline:none;width:96px;height:auto;">
                  </a>
                  <p style="margin:14px 0 0;font-family:{{Serif}};font-size:22px;line-height:1.2;letter-spacing:0.01em;color:#4e453e;">Росица Неделчева</p>
                  <p style="margin:6px 0 0;font-family:{{Sans}};font-size:11px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;color:#8f7350;">Психолог и психотерапевт</p>
                </td></tr>
                <tr><td class="email-card" bgcolor="#fffdf8" style="background:#fffdf8;border:1px solid #e6dfd4;border-top:3px solid #c4a574;border-radius:18px;padding:34px 36px 32px;">
                  <p style="margin:0 0 10px;font-family:{{Sans}};font-size:11px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;color:#8f7350;">{{E(eyebrow)}}</p>
                  <h1 class="email-title" style="margin:0 0 16px;font-family:{{Serif}};font-weight:500;font-size:34px;line-height:1.15;color:#4e453e;">{{E(title)}}</h1>
                  {{inner}}
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0;">
                    <tr>
                      <td align="center" bgcolor="#5e5148" style="border-radius:999px;background:#5e5148;">
                        <a href="{{href}}" style="display:inline-block;padding:13px 26px;font-family:{{Sans}};font-size:14px;line-height:1.2;color:#f6f1e8;text-decoration:none;border-radius:999px;">{{E(cta)}}</a>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td align="center" style="padding:26px 12px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      {{SocialLink("instagram.png", "Instagram", InstagramUrl)}}
                      <td width="18"></td>
                      {{SocialLink("facebook.png", "Facebook", FacebookUrl)}}
                    </tr>
                  </table>
                  <p style="margin:18px 0 0;font-family:{{Sans}};font-size:13px;line-height:1.7;color:#8d8176;">
                    <a href="tel:+359895563333" style="color:#6d6258;text-decoration:none;">089 556 3333</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:rosiinedelcheva@gmail.com" style="color:#6d6258;text-decoration:none;">rosiinedelcheva@gmail.com</a>
                  </p>
                  <p style="margin:8px 0 0;font-family:{{Sans}};font-size:12px;line-height:1.7;color:#a3988e;">
                    <a href="{{_site}}/karti/" style="color:#a3988e;text-decoration:none;">Карти</a>
                    &nbsp;·&nbsp;
                    <a href="{{_site}}/za-men/" style="color:#a3988e;text-decoration:none;">За мен</a>
                    &nbsp;·&nbsp;
                    <a href="{{_site}}/kontakti/" style="color:#a3988e;text-decoration:none;">Контакти</a>
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
        """;
    }

    private static string Paragraph(string html) =>
        $"""<p style="margin:0 0 14px;font-family:{Sans};font-size:15px;line-height:1.7;color:#6d6258;">{html}</p>""";

    private static string Callout(string label, string html) =>
        $"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
          <tr><td bgcolor="#f4efe6" style="background:#f4efe6;border-left:3px solid #c4a574;border-radius:12px;padding:14px 16px;">
            <div style="font-family:{Sans};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8f7350;">{label}</div>
            <div style="margin-top:6px;font-family:{Serif};font-size:17px;line-height:1.5;color:#4e453e;">{html}</div>
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
