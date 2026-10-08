using System.Linq.Expressions;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RosiNedelcheva.Api.Data;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class AppStore
{
    private readonly IDbContextFactory<AppDbContext> _factory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AppStore> _logger;
    private readonly string _storePath;
    private readonly object _gate = new();

    public AppStore(
        IDbContextFactory<AppDbContext> factory,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<AppStore> logger)
    {
        _factory = factory;
        _configuration = configuration;
        _logger = logger;
        _storePath = Path.Combine(environment.ContentRootPath, "data", "store.json");
        using var db = factory.CreateDbContext();
        db.Database.Migrate();
        ImportJsonIfEmpty(db);
        EnsureSeed(db);
    }

    public UserProfile ToProfile(AppUser user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        CreatedAt = user.CreatedAt
    };

    public AppUser? FindUserByEmail(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return With(db => db.Users.FirstOrDefault(user => user.Email.ToLower() == normalized));
    }

    public AppUser? FindUserById(int id) => With(db => db.Users.FirstOrDefault(user => user.Id == id));

    public IReadOnlyList<UserProfile> Users() =>
        With(db => (IReadOnlyList<UserProfile>)db.Users
            .OrderByDescending(user => user.CreatedAt)
            .AsEnumerable()
            .Select(ToProfile)
            .ToList());

    public AppUser AddUser(string name, string email, string password, string role)
    {
        return With(db =>
        {
            var normalized = email.Trim().ToLowerInvariant();
            if (db.Users.Any(user => user.Email.ToLower() == normalized))
            {
                throw new InvalidOperationException("Този имейл вече е регистриран.");
            }

            var user = new AppUser
            {
                Id = NextId(db.Users, item => item.Id),
                Name = name.Trim(),
                Email = normalized,
                PasswordHash = PasswordHasher.Hash(password),
                Role = role,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            db.SaveChanges();
            return user;
        });
    }

    public IReadOnlyList<Product> Products(bool includeInactive) =>
        With(db => (IReadOnlyList<Product>)db.Products
            .Where(product => includeInactive || product.IsActive)
            .OrderBy(product => product.Id)
            .AsEnumerable()
            .Select(Clone)
            .ToList());

    public Product? Product(int id, bool includeInactive) =>
        With(db =>
        {
            var product = db.Products.FirstOrDefault(item => item.Id == id && (includeInactive || item.IsActive));
            return product is null ? null : Clone(product);
        });

    public Product AddProduct(Product product)
    {
        return With(db =>
        {
            product.Id = NextId(db.Products, item => item.Id);
            product.CreatedAt = DateTime.UtcNow;
            product.IsActive = true;
            product.Images ??= [];
            product.ImageUrl = product.Images.FirstOrDefault() ?? product.ImageUrl;
            db.Products.Add(product);
            db.SaveChanges();
            return Clone(product);
        });
    }

    public Product? UpdateProduct(int id, Product product)
    {
        return With(db =>
        {
            var existing = db.Products.FirstOrDefault(item => item.Id == id);
            if (existing is null) return null;

            existing.Name = product.Name;
            existing.Subtitle = product.Subtitle;
            existing.Description = product.Description;
            existing.Details = product.Details;
            existing.Price = product.Price;
            existing.Images = product.Images ?? [];
            existing.ImageUrl = existing.Images.FirstOrDefault() ?? product.ImageUrl;
            existing.VideoUrl = product.VideoUrl;
            existing.Highlights = product.Highlights ?? [];
            existing.Specs = product.Specs ?? [];
            existing.Stock = product.Stock;
            existing.IsActive = product.IsActive;
            db.SaveChanges();
            return Clone(existing);
        });
    }

    public bool ArchiveProduct(int id)
    {
        return With(db =>
        {
            var existing = db.Products.FirstOrDefault(item => item.Id == id);
            if (existing is null) return false;
            existing.IsActive = false;
            db.SaveChanges();
            return true;
        });
    }

    public ShopOrder AddOrder(ShopOrder order)
    {
        return With(db =>
        {
            order.Id = NextId(db.Orders, item => item.Id);
            order.CreatedAt = DateTime.UtcNow;
            order.Status = "new";
            order.History = [new OrderEvent { Status = "new", Note = "Получена поръчка", At = order.CreatedAt }];
            order.Items ??= [];
            db.Orders.Add(order);
            db.SaveChanges();
            return order;
        });
    }

    public void AttachStripeSession(int id, string sessionId)
    {
        With(db =>
        {
            var order = db.Orders.FirstOrDefault(item => item.Id == id);
            if (order is null) return;
            order.StripeSessionId = sessionId;
            db.SaveChanges();
        });
    }

    public ShopOrder? OrderByStripeSession(string sessionId) =>
        With(db => db.Orders.FirstOrDefault(item => item.StripeSessionId == sessionId));

    public (ShopOrder Order, bool JustPaid, OrderAttribution? Attribution) MarkCardPaid(int id)
    {
        return With(db =>
        {
            var order = db.Orders.FirstOrDefault(item => item.Id == id);
            if (order is null)
            {
                throw new InvalidOperationException("Поръчката не е намерена.");
            }

            if (order.PaymentStatus == "paid")
            {
                return (order, false, (OrderAttribution?)null);
            }

            order.PaymentStatus = "paid";
            order.PaidAt = DateTime.UtcNow;
            order.History ??= [];
            order.History.Add(new OrderEvent
            {
                Status = order.Status,
                Note = "Платено с карта",
                At = order.PaidAt.Value
            });
            var attribution = order.Attribution;
            order.Attribution = null;
            if (!string.IsNullOrWhiteSpace(order.PromoCode))
            {
                var code = order.PromoCode.Trim().ToLowerInvariant();
                var match = db.PromoCodes.FirstOrDefault(item => item.Code.ToLower() == code);
                if (match is not null) match.Used += 1;
            }

            db.SaveChanges();
            return (order, true, attribution);
        });
    }

    public IReadOnlyList<ShopOrder> Orders() =>
        With(db => (IReadOnlyList<ShopOrder>)db.Orders.OrderByDescending(order => order.CreatedAt).ToList());

    public IReadOnlyList<ShopOrder> OrdersForUser(int userId) =>
        With(db => (IReadOnlyList<ShopOrder>)db.Orders
            .Where(order => order.UserId == userId)
            .OrderByDescending(order => order.CreatedAt)
            .ToList());

    public ShopOrder? UpdateOrderStatus(int id, string status, string? note, string? trackingCode)
    {
        return With(db =>
        {
            var order = db.Orders.FirstOrDefault(item => item.Id == id);
            if (order is null) return null;

            order.History ??= [];
            if (order.History.Count == 0)
            {
                order.History.Add(new OrderEvent { Status = "new", Note = "Получена поръчка", At = order.CreatedAt });
            }

            if (!string.IsNullOrWhiteSpace(trackingCode))
            {
                order.TrackingCode = trackingCode.Trim();
            }

            order.Status = status;
            order.History.Add(new OrderEvent
            {
                Status = status,
                Note = string.IsNullOrWhiteSpace(note) ? "" : note.Trim(),
                At = DateTime.UtcNow
            });
            if (status == "completed")
            {
                EnsureReviewInvites(db, order);
            }

            db.SaveChanges();
            return order;
        });
    }

    public ReviewSummary PublishedReviews(int productId)
    {
        return With(db =>
        {
            var reviews = db.Reviews
                .Where(review => review.ProductId == productId && review.Status == "published")
                .OrderByDescending(review => review.CreatedAt)
                .AsEnumerable()
                .Select(review => new PublicReview
                {
                    Id = review.Id,
                    AuthorName = review.AuthorName,
                    City = review.City,
                    Rating = review.Rating,
                    Body = review.Body,
                    Images = review.Images ?? [],
                    CreatedAt = review.CreatedAt
                })
                .ToList();
            var count = reviews.Count;
            return new ReviewSummary
            {
                ProductId = productId,
                Count = count,
                Average = count == 0 ? 0 : Math.Round(reviews.Average(review => review.Rating), 1),
                Reviews = reviews
            };
        });
    }

    public ReviewInvite? ReviewInvite(string token) =>
        With(db => db.ReviewInvites.FirstOrDefault(invite => invite.Token == token));

    public IReadOnlyList<ReviewInvite> UnsentReviewInvites(int orderId) =>
        With(db => (IReadOnlyList<ReviewInvite>)db.ReviewInvites
            .Where(invite => invite.OrderId == orderId && invite.UsedAt == null && invite.SentAt == null)
            .ToList());

    public void MarkReviewInviteSent(int id)
    {
        With(db =>
        {
            var invite = db.ReviewInvites.FirstOrDefault(item => item.Id == id);
            if (invite is null) return;
            invite.SentAt = DateTime.UtcNow;
            db.SaveChanges();
        });
    }

    public IReadOnlyList<object> ReviewInvitesForEmail(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return With(db => (IReadOnlyList<object>)db.ReviewInvites
            .Where(invite => invite.Email.ToLower() == normalized)
            .OrderByDescending(invite => invite.CreatedAt)
            .Select(invite => new
            {
                token = invite.Token,
                productName = invite.ProductName,
                orderNumber = invite.OrderNumber,
                used = invite.UsedAt != null
            })
            .ToList());
    }

    public ProductReview? SubmitReview(string token, int rating, string body, string authorName, List<string> images)
    {
        return With(db =>
        {
            var invite = db.ReviewInvites.FirstOrDefault(item => item.Token == token);
            if (invite is null || invite.UsedAt is not null) return null;

            var review = new ProductReview
            {
                Id = NextId(db.Reviews, item => item.Id),
                ProductId = invite.ProductId,
                OrderId = invite.OrderId,
                OrderNumber = invite.OrderNumber,
                Email = invite.Email,
                AuthorName = string.IsNullOrWhiteSpace(authorName) ? invite.AuthorName : authorName.Trim(),
                City = invite.City,
                Rating = rating,
                Body = body.Trim(),
                Images = images ?? [],
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };
            invite.UsedAt = review.CreatedAt;
            db.Reviews.Add(review);
            db.SaveChanges();
            return review;
        });
    }

    public IReadOnlyList<ProductReview> Reviews() =>
        With(db => (IReadOnlyList<ProductReview>)db.Reviews.OrderByDescending(review => review.CreatedAt).ToList());

    public ProductReview? SetReviewStatus(int id, string status)
    {
        return With(db =>
        {
            var review = db.Reviews.FirstOrDefault(item => item.Id == id);
            if (review is null) return null;
            review.Status = status;
            db.SaveChanges();
            return review;
        });
    }

    public ContactMessage AddMessage(ContactMessage message)
    {
        return With(db =>
        {
            message.Id = NextId(db.Messages, item => item.Id);
            message.CreatedAt = DateTime.UtcNow;
            message.IsRead = false;
            db.Messages.Add(message);
            db.SaveChanges();
            return message;
        });
    }

    public IReadOnlyList<ContactMessage> Messages() =>
        With(db => (IReadOnlyList<ContactMessage>)db.Messages.OrderByDescending(item => item.CreatedAt).ToList());

    public ContactMessage? SetMessageRead(int id, bool isRead)
    {
        return With(db =>
        {
            var message = db.Messages.FirstOrDefault(item => item.Id == id);
            if (message is null) return null;
            message.IsRead = isRead;
            db.SaveChanges();
            return message;
        });
    }

    public IReadOnlyList<BlogEntry> Blog(bool includeUnpublished) =>
        With(db => (IReadOnlyList<BlogEntry>)db.BlogPosts
            .Where(post => includeUnpublished || post.IsPublished)
            .OrderByDescending(post => post.Date)
            .ToList());

    public BlogEntry? BlogBySlug(string slug, bool includeUnpublished) =>
        With(db => db.BlogPosts.FirstOrDefault(post => post.Slug == slug && (includeUnpublished || post.IsPublished)));

    public BlogEntry AddBlog(BlogEntry entry)
    {
        return With(db =>
        {
            entry.Id = NextId(db.BlogPosts, item => item.Id);
            entry.Slug = Slugify(string.IsNullOrWhiteSpace(entry.Slug) ? entry.Title : entry.Slug);
            if (db.BlogPosts.Any(post => post.Slug == entry.Slug))
            {
                entry.Slug = $"{entry.Slug}-{entry.Id}";
            }

            db.BlogPosts.Add(entry);
            db.SaveChanges();
            return entry;
        });
    }

    public BlogEntry? UpdateBlog(int id, BlogEntry entry)
    {
        return With(db =>
        {
            var existing = db.BlogPosts.FirstOrDefault(item => item.Id == id);
            if (existing is null) return null;

            existing.Title = entry.Title;
            existing.Excerpt = entry.Excerpt;
            existing.Date = entry.Date;
            existing.ReadMinutes = entry.ReadMinutes;
            existing.Image = entry.Image;
            existing.ImageAlt = entry.ImageAlt;
            existing.Body = entry.Body;
            existing.IsPublished = entry.IsPublished;
            var slug = Slugify(string.IsNullOrWhiteSpace(entry.Slug) ? entry.Title : entry.Slug);
            if (!db.BlogPosts.Any(post => post.Id != id && post.Slug == slug))
            {
                existing.Slug = slug;
            }

            db.SaveChanges();
            return existing;
        });
    }

    public bool DeleteBlog(int id)
    {
        return With(db =>
        {
            var existing = db.BlogPosts.FirstOrDefault(item => item.Id == id);
            if (existing is null) return false;
            db.BlogPosts.Remove(existing);
            db.SaveChanges();
            return true;
        });
    }

    public IReadOnlyList<Promotion> Promotions() =>
        With(db => (IReadOnlyList<Promotion>)db.Promotions.OrderByDescending(item => item.StartsAt).ToList());

    public Promotion? ActivePromotion()
    {
        var now = DateTime.UtcNow;
        return With(db => db.Promotions.FirstOrDefault(item => item.IsActive && item.StartsAt <= now && item.EndsAt >= now));
    }

    public Promotion AddPromotion(Promotion item)
    {
        return With(db =>
        {
            item.Id = NextId(db.Promotions, entry => entry.Id);
            item.ProductIds ??= [];
            db.Promotions.Add(item);
            db.SaveChanges();
            return item;
        });
    }

    public Promotion? UpdatePromotion(int id, Promotion item)
    {
        return With(db =>
        {
            var existing = db.Promotions.FirstOrDefault(entry => entry.Id == id);
            if (existing is null) return null;
            existing.Name = item.Name;
            existing.Description = item.Description;
            existing.Percent = item.Percent;
            existing.StartsAt = item.StartsAt;
            existing.EndsAt = item.EndsAt;
            existing.IsActive = item.IsActive;
            existing.ProductIds = item.ProductIds ?? [];
            db.SaveChanges();
            return existing;
        });
    }

    public IReadOnlyList<PromoCode> PromoCodes() =>
        With(db => (IReadOnlyList<PromoCode>)db.PromoCodes.OrderByDescending(item => item.Id).ToList());

    public PromoCode AddPromoCode(PromoCode item)
    {
        return With(db =>
        {
            item.Id = NextId(db.PromoCodes, entry => entry.Id);
            item.Code = item.Code.Trim().ToUpperInvariant();
            db.PromoCodes.Add(item);
            db.SaveChanges();
            return item;
        });
    }

    public PromoCode? UpdatePromoCode(int id, PromoCode item)
    {
        return With(db =>
        {
            var existing = db.PromoCodes.FirstOrDefault(entry => entry.Id == id);
            if (existing is null) return null;
            existing.Code = item.Code.Trim().ToUpperInvariant();
            existing.Percent = item.Percent;
            existing.MaxUses = item.MaxUses;
            existing.ExpiresAt = item.ExpiresAt;
            existing.IsActive = item.IsActive;
            db.SaveChanges();
            return existing;
        });
    }

    public QuoteResult Quote(decimal subtotal, string? code, IReadOnlyList<OrderLine>? lines = null)
    {
        return With(db =>
        {
            var promotion = CurrentPromotion(db);
            var promoDiscount = PromotionDiscount(db, promotion, subtotal, lines);
            var percent = promoDiscount > 0 && promotion is not null ? promotion.Percent : 0;
            var label = promotion is null ? "" : promotion.Name;
            string? applied = null;
            if (!string.IsNullOrWhiteSpace(code))
            {
                var match = FindCode(db, code);
                if (match is null)
                {
                    return new QuoteResult { Ok = false, Message = "Този код не е валиден.", Subtotal = subtotal, Total = subtotal };
                }

                var codeDiscount = decimal.Round(subtotal * match.Percent / 100m, 2);
                if (codeDiscount > promoDiscount)
                {
                    promoDiscount = codeDiscount;
                    percent = match.Percent;
                    label = match.Code;
                    applied = match.Code;
                }
            }

            var total = decimal.Round(subtotal - promoDiscount, 2);
            return new QuoteResult
            {
                Ok = true,
                Message = percent > 0 ? $"{label} · −{percent}%" : "Няма активна отстъпка.",
                Percent = percent,
                Code = applied,
                Subtotal = subtotal,
                Total = total
            };
        });
    }

    public void ConsumeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;
        var normalized = code.Trim().ToLowerInvariant();
        With(db =>
        {
            var match = db.PromoCodes.FirstOrDefault(item => item.Code.ToLower() == normalized);
            if (match is null) return;
            match.Used += 1;
            db.SaveChanges();
        });
    }

    public SiteBanner Banner() => With(db => ReadBanner(Settings(db)));

    public CourierSettings Courier() => With(db => ReadCourier(Settings(db)));

    public string NekorektenKey() => With(db => Settings(db).NekorektenKey ?? "");

    public IReadOnlyList<ReputationCheck> ReputationChecks() =>
        With(db => (IReadOnlyList<ReputationCheck>)db.ReputationChecks.OrderByDescending(item => item.CheckedAt).ToList());

    public ReputationCheck SaveReputation(ReputationCheck check)
    {
        return With(db =>
        {
            check.Id = NextId(db.ReputationChecks, item => item.Id);
            check.CheckedAt = DateTime.UtcNow;
            check.Reports ??= [];
            db.ReputationChecks.Add(check);
            db.SaveChanges();
            return check;
        });
    }

    public CourierSettings UpdateCourier(CourierSettings settings)
    {
        return With(db =>
        {
            var row = Settings(db);
            row.CourierJson = JsonSerializer.Serialize(settings, JsonColumns.Options);
            db.SaveChanges();
            return settings;
        });
    }

    public ShopOrder? SetWaybill(int id, string number, string pdfUrl, string? note = null)
    {
        return With(db =>
        {
            var order = db.Orders.FirstOrDefault(item => item.Id == id);
            if (order is null) return null;
            order.TrackingCode = number;
            order.LabelUrl = pdfUrl;
            order.History ??= [];
            if (order.History.Count == 0)
            {
                order.History.Add(new OrderEvent { Status = "new", Note = "Получена поръчка", At = order.CreatedAt });
            }

            order.History.Add(new OrderEvent
            {
                Status = order.Status,
                Note = string.IsNullOrWhiteSpace(note) ? $"Товарителница {number}" : $"Товарителница {number}. {note.Trim()}",
                At = DateTime.UtcNow
            });
            db.SaveChanges();
            return order;
        });
    }

    public SiteBanner UpdateBanner(SiteBanner banner)
    {
        return With(db =>
        {
            var row = Settings(db);
            row.BannerText = banner.Text ?? "";
            row.BannerHref = string.IsNullOrWhiteSpace(banner.Href) ? "/karti" : banner.Href;
            row.BannerActive = banner.IsActive;
            db.SaveChanges();
            return ReadBanner(row);
        });
    }

    public IReadOnlyList<Subscriber> Subscribers() =>
        With(db => (IReadOnlyList<Subscriber>)db.Subscribers.OrderByDescending(item => item.CreatedAt).ToList());

    public Subscriber AddSubscriber(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return With(db =>
        {
            var existing = db.Subscribers.FirstOrDefault(item => item.Email.ToLower() == normalized);
            if (existing is not null) return existing;
            var subscriber = new Subscriber
            {
                Id = NextId(db.Subscribers, item => item.Id),
                Email = normalized,
                CreatedAt = DateTime.UtcNow
            };
            db.Subscribers.Add(subscriber);
            db.SaveChanges();
            return subscriber;
        });
    }

    public IReadOnlyList<string> Audience()
    {
        return With(db =>
        {
            var emails = db.Subscribers.Select(item => item.Email).ToList();
            emails.AddRange(db.Users.Where(user => user.Role != "Admin").Select(user => user.Email));
            emails.AddRange(db.Orders.Select(order => order.Email));
            return (IReadOnlyList<string>)emails
                .Where(email => !string.IsNullOrWhiteSpace(email))
                .Select(email => email.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
        });
    }

    public IReadOnlyList<EmailCampaign> Campaigns() =>
        With(db => (IReadOnlyList<EmailCampaign>)db.Campaigns.OrderByDescending(item => item.CreatedAt).ToList());

    public EmailCampaign AddCampaign(EmailCampaign campaign)
    {
        return With(db =>
        {
            campaign.Id = NextId(db.Campaigns, item => item.Id);
            campaign.CreatedAt = DateTime.UtcNow;
            db.Campaigns.Add(campaign);
            db.SaveChanges();
            return campaign;
        });
    }

    private void EnsureReviewInvites(AppDbContext db, ShopOrder order)
    {
        order.Items ??= [];
        foreach (var line in order.Items)
        {
            var productId = ResolveProductId(db, line);
            if (productId == 0) continue;
            if (db.ReviewInvites.Local.Any(invite => invite.OrderId == order.Id && invite.ProductId == productId)
                || db.ReviewInvites.Any(invite => invite.OrderId == order.Id && invite.ProductId == productId))
            {
                continue;
            }

            var product = db.Products.FirstOrDefault(item => item.Id == productId);
            db.ReviewInvites.Add(new ReviewInvite
            {
                Id = NextId(db.ReviewInvites, item => item.Id),
                Token = Guid.NewGuid().ToString("N"),
                OrderId = order.Id,
                OrderNumber = order.Number,
                ProductId = productId,
                ProductName = product?.Name ?? line.Title,
                Email = order.Email.Trim().ToLowerInvariant(),
                AuthorName = FirstName(order.CustomerName),
                City = order.City.Trim(),
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    private int ResolveProductId(AppDbContext db, OrderLine line)
    {
        if (line.ProductId > 0 && db.Products.Any(product => product.Id == line.ProductId))
        {
            return line.ProductId;
        }

        var title = line.Title.Trim().ToLowerInvariant();
        var byName = db.Products.FirstOrDefault(product => product.Name.ToLower() == title);
        if (byName is not null) return byName.Id;
        var products = db.Products.Select(product => product.Id).ToList();
        return products.Count == 1 ? products[0] : 0;
    }

    private static string FirstName(string name)
    {
        var part = name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return string.IsNullOrWhiteSpace(part) ? name.Trim() : part;
    }

    private decimal PromotionDiscount(AppDbContext db, Promotion? promotion, decimal subtotal, IReadOnlyList<OrderLine>? lines)
    {
        if (promotion is null || promotion.Percent <= 0) return 0;
        var ids = promotion.ProductIds ?? [];
        if (ids.Count == 0)
        {
            return decimal.Round(subtotal * promotion.Percent / 100m, 2);
        }

        if (lines is null || lines.Count == 0) return 0;
        var names = db.Products
            .Where(product => ids.Contains(product.Id))
            .Select(product => product.Name)
            .AsEnumerable()
            .Select(name => name.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var eligible = lines
            .Where(line => ids.Contains(line.ProductId) || names.Contains(line.Title.Trim()))
            .Sum(line => line.Price * line.Quantity);
        return decimal.Round(eligible * promotion.Percent / 100m, 2);
    }

    private Promotion? CurrentPromotion(AppDbContext db)
    {
        var now = DateTime.UtcNow;
        return db.Promotions.FirstOrDefault(item => item.IsActive && item.StartsAt <= now && item.EndsAt >= now);
    }

    private PromoCode? FindCode(AppDbContext db, string code)
    {
        var normalized = code.Trim().ToLowerInvariant();
        var match = db.PromoCodes.FirstOrDefault(item => item.IsActive && item.Code.ToLower() == normalized);
        if (match is null) return null;
        if (match.ExpiresAt is not null && match.ExpiresAt < DateTime.UtcNow) return null;
        if (match.Used >= match.MaxUses) return null;
        return match;
    }

    private void ImportJsonIfEmpty(AppDbContext db)
    {
        if (db.Users.Any() || db.Products.Any()) return;
        if (!File.Exists(_storePath)) return;

        var data = JsonSerializer.Deserialize<StoreData>(File.ReadAllText(_storePath), JsonColumns.Options);
        if (data is null) return;

        foreach (var product in data.Products)
        {
            product.Images ??= [];
            product.Highlights ??= [];
            product.Specs ??= [];
        }

        foreach (var order in data.Orders)
        {
            order.Items ??= [];
            order.History ??= [];
        }

        foreach (var review in data.Reviews)
        {
            review.Images ??= [];
        }

        foreach (var promotion in data.Promotions)
        {
            promotion.ProductIds ??= [];
        }

        foreach (var check in data.Reputation)
        {
            check.Reports ??= [];
        }

        db.Users.AddRange(data.Users);
        db.Products.AddRange(data.Products);
        db.Orders.AddRange(data.Orders);
        db.Messages.AddRange(data.Messages);
        db.BlogPosts.AddRange(data.Blog);
        db.Promotions.AddRange(data.Promotions);
        db.PromoCodes.AddRange(data.PromoCodes);
        db.Subscribers.AddRange(data.Subscribers);
        db.Campaigns.AddRange(data.Campaigns);
        db.Reviews.AddRange(data.Reviews);
        db.ReviewInvites.AddRange(data.ReviewInvites);
        db.ReputationChecks.AddRange(data.Reputation);

        var settings = Settings(db);
        settings.BannerText = data.Banner.Text ?? "";
        settings.BannerHref = string.IsNullOrWhiteSpace(data.Banner.Href) ? "/karti" : data.Banner.Href;
        settings.BannerActive = data.Banner.IsActive;
        settings.CourierJson = JsonSerializer.Serialize(data.Courier ?? new CourierSettings(), JsonColumns.Options);
        settings.NekorektenKey = data.NekorektenKey ?? "";
        db.SaveChanges();
        _logger.LogInformation(
            "Imported store.json into SQL Server: {Users} users, {Orders} orders, {Reviews} reviews.",
            data.Users.Count,
            data.Orders.Count,
            data.Reviews.Count);
    }

    private void EnsureSeed(AppDbContext db)
    {
        var changed = false;
        if (!db.Products.Any())
        {
            db.Products.Add(new Product
            {
                Id = 1,
                Name = "Справяне с тревожността",
                Description = "Терапевтични карти за самопомощ, самоосъзнаване и вътрешна устойчивост.",
                Price = 79m,
                ImageUrl = "/images/product-box.jpg",
                Images = [],
                Highlights = [],
                Specs = [],
                Stock = 40,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            changed = true;
        }

        var adminEmail = (_configuration["Auth:AdminEmail"] ?? "admin@ertherapybg.com").Trim().ToLowerInvariant();
        if (!db.Users.Any(user => user.Email.ToLower() == adminEmail))
        {
            db.Users.Add(new AppUser
            {
                Id = NextId(db.Users, item => item.Id),
                Name = _configuration["Auth:AdminName"] ?? "Росица Неделчева",
                Email = adminEmail,
                PasswordHash = PasswordHasher.Hash(_configuration["Auth:AdminPassword"] ?? "RosiAdmin2026!"),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            });
            changed = true;
        }

        if (!db.BlogPosts.Any())
        {
            db.BlogPosts.AddRange(
            [
                new BlogEntry
                {
                    Id = 1,
                    Slug = "kakvo-e-trevozhnost",
                    Title = "Какво е тревожността и как да я разпознаем",
                    Excerpt = "Тревожността не е само „мислене твърде много“. Как се проявява в тялото, емоциите и поведението.",
                    Date = "2026-03-12",
                    ReadMinutes = 5,
                    Image = "/images/site/rosi-wide.jpg",
                    ImageAlt = "Росица Неделчева до купчина книги в кабинета",
                    Body = "Тревожността е естествена човешка реакция. Понякога ни предпазва, а понякога започва да заема твърде много пространство в ежедневието.\n\nРазпознаването ѝ в мислите, емоциите, тялото и поведението е първата стъпка към по-грижовна и осъзната реакция.\n\nКартите „Справяне с тревожността“ са създадени именно като инструмент за това постепенно опознаване — без бързане и без „правилни“ отговори.",
                    IsPublished = true
                },
                new BlogEntry
                {
                    Id = 2,
                    Slug = "resursi-pri-trevozhnost",
                    Title = "Ресурси, свързаност и самоподкрепа",
                    Excerpt = "Когато тревожността ни насочва към това, което не е наред, ресурсите ни връщат към опората.",
                    Date = "2026-02-20",
                    ReadMinutes = 4,
                    Image = "/images/site/rosi-portrait-2.jpg",
                    ImageAlt = "Портрет на Росица Неделчева",
                    Body = "Ресурсите не означават, че трудността изчезва. Те ни помагат да преминаваме през нея с повече устойчивост и грижа към себе си.\n\nМогат да бъдат в тялото, във взаимоотношенията, в ежедневните навици и във вътрешните качества.\n\nПонякога малката стъпка — една карта, едно наблюдение, една пауза — е достатъчно начало.",
                    IsPublished = true
                },
                new BlogEntry
                {
                    Id = 3,
                    Slug = "kogato-da-potraishe-pomosht",
                    Title = "Кога е добре да потърсим професионална помощ",
                    Excerpt = "Самопомощта е ценна, но не замества терапията. Признаци, при които си струва да се обърнем към специалист.",
                    Date = "2026-01-18",
                    ReadMinutes = 6,
                    Image = "/images/site/rosi-portrait.jpg",
                    ImageAlt = "Росица Неделчева",
                    Body = "Инструментите за самопомощ могат да подкрепят осъзнатостта и ежедневната грижа, но не заместват психотерапия, медицинска консултация или психиатрично лечение.\n\nАко тревожността е постоянна, пречи на съня, работата или взаимоотношенията, или ако има панически атаки и силен дистрес — потърсете професионална подкрепа.\n\nГрижата за себе си включва и знанието кога да помолим за помощ.",
                    IsPublished = true
                }
            ]);
            changed = true;
        }

        var products = db.Products.ToList();
        foreach (var local in db.Products.Local)
        {
            if (!products.Contains(local)) products.Add(local);
        }

        foreach (var product in products.Where(item => (item.Images?.Count ?? 0) == 0 && string.IsNullOrWhiteSpace(item.Subtitle)))
        {
            product.Subtitle = "Инструмент за самопомощ, самоосъзнаване и вътрешна устойчивост";
            product.Details = "Създадени са от практиката на Росица Неделчева. Помагат тревожността да се разбира постепенно.";
            product.Images =
            [
                "/images/product-box.jpg",
                "/images/cards-overview.jpg",
                "/images/site/rosi-portrait.jpg",
                "/images/site/rosi-wide.jpg"
            ];
            product.ImageUrl = product.Images[0];
            product.Highlights =
            [
                "100 карти",
                "6 раздела с въпроси, насоки и техники",
                "За хора с тревожност и за психолози/терапевти",
                "Създадени от практикуващ психолог и психотерапевт"
            ];
            product.Specs =
            [
                new ProductSpec { Lead = "100", Detail = "карти" },
                new ProductSpec { Lead = "6", Detail = "раздела" },
                new ProductSpec { Lead = "Кутия", Detail = "целият комплект" },
                new ProductSpec { Lead = "Език", Detail = "български" }
            ];
            changed = true;
        }

        if (!db.Orders.Any())
        {
            SeedDemo(db);
            changed = true;
        }

        foreach (var order in db.Orders.Where(item => item.Status == "completed").ToList())
        {
            var before = db.ReviewInvites.Count();
            EnsureReviewInvites(db, order);
            if (db.ReviewInvites.Count() != before) changed = true;
        }

        Settings(db);
        if (changed || db.ChangeTracker.HasChanges())
        {
            db.SaveChanges();
        }
    }

    private void SeedDemo(AppDbContext db)
    {
        var names = new[] { "Мария Иванова", "Елена Петрова", "Никол Георгиева", "Ива Стоянова", "Теодора Димитрова", "Анна Колева" };
        var cities = new[] { "София", "Пловдив", "Варна", "Бургас", "Стара Загора" };
        var statuses = new[] { "completed", "completed", "shipped", "confirmed", "new", "cancelled" };
        var now = DateTime.UtcNow;
        for (var index = 0; index < 22; index++)
        {
            var status = statuses[index % statuses.Length];
            var quantity = index % 5 == 0 ? 2 : 1;
            db.Orders.Add(new ShopOrder
            {
                Id = index + 1,
                Number = $"RN-DEMO-{1000 + index}",
                CustomerName = names[index % names.Length],
                Phone = "0891234567",
                Email = $"klient{index + 1}@example.com",
                City = cities[index % cities.Length],
                Address = "ул. Примерна 12",
                Total = status == "cancelled" ? 79m * quantity : 71.10m * quantity,
                DiscountPercent = status == "cancelled" ? 0 : 10,
                PromoCode = index % 3 == 0 ? "GRIZHA10" : null,
                Status = status,
                CreatedAt = now.AddDays(-(index % 28)).AddHours(-index),
                Items = [new OrderLine { ProductId = 1, Title = "Справяне с тревожността", Price = 79m, Quantity = quantity }],
                History = []
            });
        }

        db.Messages.AddRange(
        [
            new ContactMessage { Id = 1, Name = "Мария Иванова", Email = "maria@example.com", Topic = "Картите", Message = "Подходящи ли са за работа в група?", IsRead = false, CreatedAt = now.AddDays(-2) },
            new ContactMessage { Id = 2, Name = "Петър Николов", Email = "petar@example.com", Topic = "Сесия", Message = "Имате ли свободен час онлайн следващата седмица?", IsRead = true, CreatedAt = now.AddDays(-6) }
        ]);

        db.Promotions.Add(new Promotion
        {
            Id = 1,
            Name = "Есенна грижа",
            Description = "10% от комплекта за две седмици.",
            Percent = 10,
            StartsAt = now.AddDays(-3),
            EndsAt = now.AddDays(11),
            IsActive = true,
            ProductIds = []
        });
        db.PromoCodes.AddRange(
        [
            new PromoCode { Id = 1, Code = "GRIZHA10", Percent = 10, Used = 8, MaxUses = 50, ExpiresAt = now.AddMonths(2), IsActive = true },
            new PromoCode { Id = 2, Code = "PRAKTIKA15", Percent = 15, Used = 3, MaxUses = 20, ExpiresAt = now.AddMonths(1), IsActive = true }
        ]);

        var settings = Settings(db);
        settings.BannerText = "Есенна грижа — 10% от комплекта до края на седмицата";
        settings.BannerHref = "/karti";
        settings.BannerActive = true;

        foreach (var email in new[] { "maria@example.com", "elena@example.com", "nikol@example.com", "iva@example.com", "anna@example.com" })
        {
            db.Subscribers.Add(new Subscriber
            {
                Id = NextId(db.Subscribers, item => item.Id),
                Email = email,
                CreatedAt = now.AddDays(-db.Subscribers.Local.Count * 3)
            });
        }

        db.Campaigns.Add(new EmailCampaign
        {
            Id = 1,
            Subject = "Нов комплект карти",
            Body = "Здравейте,\n\nкомплектът „Справяне с тревожността“ вече е наличен.",
            Recipients = 5,
            Status = "sent",
            CreatedAt = now.AddDays(-12)
        });
    }

    private SiteSettings Settings(AppDbContext db)
    {
        var settings = db.SiteSettings.FirstOrDefault(item => item.Id == 1);
        if (settings is not null) return settings;
        settings = new SiteSettings
        {
            Id = 1,
            BannerHref = "/karti",
            CourierJson = JsonSerializer.Serialize(new CourierSettings(), JsonColumns.Options)
        };
        db.SiteSettings.Add(settings);
        return settings;
    }

    private static SiteBanner ReadBanner(SiteSettings settings) => new()
    {
        Text = settings.BannerText,
        Href = settings.BannerHref,
        IsActive = settings.BannerActive
    };

    private static CourierSettings ReadCourier(SiteSettings settings) =>
        JsonSerializer.Deserialize<CourierSettings>(settings.CourierJson, JsonColumns.Options) ?? new CourierSettings();

    private T With<T>(Func<AppDbContext, T> action)
    {
        lock (_gate)
        {
            using var db = _factory.CreateDbContext();
            return action(db);
        }
    }

    private void With(Action<AppDbContext> action)
    {
        lock (_gate)
        {
            using var db = _factory.CreateDbContext();
            action(db);
        }
    }

    private static int NextId<TEntity>(DbSet<TEntity> set, Expression<Func<TEntity, int>> id) where TEntity : class
    {
        var stored = set.Select(id).Max(value => (int?)value) ?? 0;
        var read = id.Compile();
        var local = set.Local.Select(read).DefaultIfEmpty(0).Max();
        return Math.Max(stored, local) + 1;
    }

    private static Product Clone(Product product) => new()
    {
        Id = product.Id,
        Name = product.Name,
        Subtitle = product.Subtitle,
        Description = product.Description,
        Details = product.Details,
        Price = product.Price,
        ImageUrl = product.ImageUrl,
        Images = product.Images?.ToList() ?? [],
        VideoUrl = product.VideoUrl,
        Highlights = product.Highlights?.ToList() ?? [],
        Specs = product.Specs?.Select(spec => new ProductSpec { Lead = spec.Lead, Detail = spec.Detail }).ToList() ?? [],
        Stock = product.Stock,
        IsActive = product.IsActive,
        CreatedAt = product.CreatedAt
    };

    private static string Slugify(string value)
    {
        var map = new Dictionary<char, string>
        {
            ['а'] = "a", ['б'] = "b", ['в'] = "v", ['г'] = "g", ['д'] = "d",
            ['е'] = "e", ['ж'] = "zh", ['з'] = "z", ['и'] = "i", ['й'] = "y",
            ['к'] = "k", ['л'] = "l", ['м'] = "m", ['н'] = "n", ['о'] = "o",
            ['п'] = "p", ['р'] = "r", ['с'] = "s", ['т'] = "t", ['у'] = "u",
            ['ф'] = "f", ['х'] = "h", ['ц'] = "ts", ['ч'] = "ch", ['ш'] = "sh",
            ['щ'] = "sht", ['ъ'] = "a", ['ь'] = "", ['ю'] = "yu", ['я'] = "ya"
        };

        var lower = value.Trim().ToLowerInvariant();
        var buffer = new System.Text.StringBuilder();
        foreach (var ch in lower)
        {
            if (map.TryGetValue(ch, out var latin))
            {
                buffer.Append(latin);
            }
            else if (char.IsAsciiLetterOrDigit(ch))
            {
                buffer.Append(ch);
            }
            else if (ch is ' ' or '-' or '_')
            {
                buffer.Append('-');
            }
        }

        var slug = buffer.ToString().Trim('-');
        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        return string.IsNullOrWhiteSpace(slug) ? "statia" : slug;
    }

    private sealed class StoreData
    {
        public List<AppUser> Users { get; set; } = [];
        public List<Product> Products { get; set; } = [];
        public List<ShopOrder> Orders { get; set; } = [];
        public List<ContactMessage> Messages { get; set; } = [];
        public List<BlogEntry> Blog { get; set; } = [];
        public List<Promotion> Promotions { get; set; } = [];
        public List<PromoCode> PromoCodes { get; set; } = [];
        public SiteBanner Banner { get; set; } = new();
        public CourierSettings Courier { get; set; } = new();
        public string NekorektenKey { get; set; } = "";
        public List<ReputationCheck> Reputation { get; set; } = [];
        public List<Subscriber> Subscribers { get; set; } = [];
        public List<EmailCampaign> Campaigns { get; set; } = [];
        public List<ProductReview> Reviews { get; set; } = [];
        public List<ReviewInvite> ReviewInvites { get; set; } = [];
    }
}
