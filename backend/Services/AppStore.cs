using System.Text.Json;
using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class AppStore
{
    private readonly string _path;
    private readonly object _gate = new();
    private StoreData _data;

    public AppStore(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var dir = Path.Combine(environment.ContentRootPath, "data");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, "store.json");
        _data = Load();
        EnsureSeed(configuration);
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
        lock (_gate)
        {
            return _data.Users.FirstOrDefault(user =>
                string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase));
        }
    }

    public AppUser? FindUserById(int id)
    {
        lock (_gate)
        {
            return _data.Users.FirstOrDefault(user => user.Id == id);
        }
    }

    public IReadOnlyList<UserProfile> Users()
    {
        lock (_gate)
        {
            return _data.Users
                .OrderByDescending(user => user.CreatedAt)
                .Select(ToProfile)
                .ToList();
        }
    }

    public AppUser AddUser(string name, string email, string password, string role)
    {
        lock (_gate)
        {
            if (_data.Users.Any(user => string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("Този имейл вече е регистриран.");
            }

            var user = new AppUser
            {
                Id = NextId(_data.Users.Select(item => item.Id)),
                Name = name.Trim(),
                Email = email.Trim().ToLowerInvariant(),
                PasswordHash = PasswordHasher.Hash(password),
                Role = role,
                CreatedAt = DateTime.UtcNow
            };
            _data.Users.Add(user);
            Save();
            return user;
        }
    }

    public IReadOnlyList<Product> Products(bool includeInactive)
    {
        lock (_gate)
        {
            return _data.Products
                .Where(product => includeInactive || product.IsActive)
                .OrderBy(product => product.Id)
                .Select(Clone)
                .ToList();
        }
    }

    public Product? Product(int id, bool includeInactive)
    {
        lock (_gate)
        {
            var product = _data.Products.FirstOrDefault(item =>
                item.Id == id && (includeInactive || item.IsActive));
            return product is null ? null : Clone(product);
        }
    }

    public Product AddProduct(Product product)
    {
        lock (_gate)
        {
            product.Id = NextId(_data.Products.Select(item => item.Id));
            product.CreatedAt = DateTime.UtcNow;
            product.IsActive = true;
            product.Images ??= [];
            product.ImageUrl = product.Images.FirstOrDefault() ?? product.ImageUrl;
            _data.Products.Add(product);
            Save();
            return Clone(product);
        }
    }

    public Product? UpdateProduct(int id, Product product)
    {
        lock (_gate)
        {
            var existing = _data.Products.FirstOrDefault(item => item.Id == id);
            if (existing is null)
            {
                return null;
            }

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
            Save();
            return Clone(existing);
        }
    }

    public bool ArchiveProduct(int id)
    {
        lock (_gate)
        {
            var existing = _data.Products.FirstOrDefault(item => item.Id == id);
            if (existing is null)
            {
                return false;
            }

            existing.IsActive = false;
            Save();
            return true;
        }
    }

    public ShopOrder AddOrder(ShopOrder order)
    {
        lock (_gate)
        {
            order.Id = NextId(_data.Orders.Select(item => item.Id));
            order.CreatedAt = DateTime.UtcNow;
            order.Status = "new";
            order.History = [new OrderEvent { Status = "new", Note = "Получена поръчка", At = order.CreatedAt }];
            _data.Orders.Add(order);
            Save();
            return order;
        }
    }

    public IReadOnlyList<ShopOrder> Orders()
    {
        lock (_gate)
        {
            return _data.Orders.OrderByDescending(order => order.CreatedAt).ToList();
        }
    }

    public IReadOnlyList<ShopOrder> OrdersForUser(int userId)
    {
        lock (_gate)
        {
            return _data.Orders
                .Where(order => order.UserId == userId)
                .OrderByDescending(order => order.CreatedAt)
                .ToList();
        }
    }

    public ShopOrder? UpdateOrderStatus(int id, string status, string? note, string? trackingCode)
    {
        lock (_gate)
        {
            var order = _data.Orders.FirstOrDefault(item => item.Id == id);
            if (order is null)
            {
                return null;
            }

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
                EnsureReviewInvites(order);
            }

            Save();
            return order;
        }
    }

    public ReviewSummary PublishedReviews(int productId)
    {
        lock (_gate)
        {
            var reviews = _data.Reviews
                .Where(review => review.ProductId == productId && review.Status == "published")
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new PublicReview
                {
                    Id = review.Id,
                    AuthorName = review.AuthorName,
                    City = review.City,
                    Rating = review.Rating,
                    Body = review.Body,
                    Images = review.Images,
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
        }
    }

    public ReviewInvite? ReviewInvite(string token)
    {
        lock (_gate)
        {
            return _data.ReviewInvites.FirstOrDefault(invite =>
                string.Equals(invite.Token, token, StringComparison.Ordinal));
        }
    }

    public IReadOnlyList<ReviewInvite> UnsentReviewInvites(int orderId)
    {
        lock (_gate)
        {
            return _data.ReviewInvites
                .Where(invite => invite.OrderId == orderId && invite.UsedAt is null && invite.SentAt is null)
                .ToList();
        }
    }

    public void MarkReviewInviteSent(int id)
    {
        lock (_gate)
        {
            var invite = _data.ReviewInvites.FirstOrDefault(item => item.Id == id);
            if (invite is null) return;
            invite.SentAt = DateTime.UtcNow;
            Save();
        }
    }

    public IReadOnlyList<object> ReviewInvitesForEmail(string email)
    {
        lock (_gate)
        {
            return _data.ReviewInvites
                .Where(invite => string.Equals(invite.Email, email, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(invite => invite.CreatedAt)
                .Select(invite => (object)new
                {
                    token = invite.Token,
                    productName = invite.ProductName,
                    orderNumber = invite.OrderNumber,
                    used = invite.UsedAt is not null
                })
                .ToList();
        }
    }

    public ProductReview? SubmitReview(string token, int rating, string body, string authorName, List<string> images)
    {
        lock (_gate)
        {
            var invite = _data.ReviewInvites.FirstOrDefault(item =>
                string.Equals(item.Token, token, StringComparison.Ordinal));
            if (invite is null || invite.UsedAt is not null)
            {
                return null;
            }

            var review = new ProductReview
            {
                Id = NextId(_data.Reviews.Select(item => item.Id)),
                ProductId = invite.ProductId,
                OrderId = invite.OrderId,
                OrderNumber = invite.OrderNumber,
                Email = invite.Email,
                AuthorName = string.IsNullOrWhiteSpace(authorName) ? invite.AuthorName : authorName.Trim(),
                City = invite.City,
                Rating = rating,
                Body = body.Trim(),
                Images = images,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };
            invite.UsedAt = review.CreatedAt;
            _data.Reviews.Add(review);
            Save();
            return review;
        }
    }

    public IReadOnlyList<ProductReview> Reviews()
    {
        lock (_gate)
        {
            return _data.Reviews.OrderByDescending(review => review.CreatedAt).ToList();
        }
    }

    public ProductReview? SetReviewStatus(int id, string status)
    {
        lock (_gate)
        {
            var review = _data.Reviews.FirstOrDefault(item => item.Id == id);
            if (review is null) return null;
            review.Status = status;
            Save();
            return review;
        }
    }

    private void EnsureReviewInvites(ShopOrder order)
    {
        foreach (var line in order.Items)
        {
            var productId = ResolveProductId(line);
            if (productId == 0) continue;
            if (_data.ReviewInvites.Any(invite => invite.OrderId == order.Id && invite.ProductId == productId))
            {
                continue;
            }

            var product = _data.Products.FirstOrDefault(item => item.Id == productId);
            _data.ReviewInvites.Add(new ReviewInvite
            {
                Id = NextId(_data.ReviewInvites.Select(item => item.Id)),
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

    private int ResolveProductId(OrderLine line)
    {
        if (line.ProductId > 0 && _data.Products.Any(product => product.Id == line.ProductId))
        {
            return line.ProductId;
        }

        var byName = _data.Products.FirstOrDefault(product =>
            string.Equals(product.Name, line.Title, StringComparison.OrdinalIgnoreCase));
        if (byName is not null) return byName.Id;
        return _data.Products.Count == 1 ? _data.Products[0].Id : 0;
    }

    private static string FirstName(string name)
    {
        var part = name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return string.IsNullOrWhiteSpace(part) ? name.Trim() : part;
    }

    public ContactMessage AddMessage(ContactMessage message)
    {
        lock (_gate)
        {
            message.Id = NextId(_data.Messages.Select(item => item.Id));
            message.CreatedAt = DateTime.UtcNow;
            message.IsRead = false;
            _data.Messages.Add(message);
            Save();
            return message;
        }
    }

    public IReadOnlyList<ContactMessage> Messages()
    {
        lock (_gate)
        {
            return _data.Messages.OrderByDescending(item => item.CreatedAt).ToList();
        }
    }

    public ContactMessage? SetMessageRead(int id, bool isRead)
    {
        lock (_gate)
        {
            var message = _data.Messages.FirstOrDefault(item => item.Id == id);
            if (message is null)
            {
                return null;
            }

            message.IsRead = isRead;
            Save();
            return message;
        }
    }

    public IReadOnlyList<BlogEntry> Blog(bool includeUnpublished)
    {
        lock (_gate)
        {
            return _data.Blog
                .Where(post => includeUnpublished || post.IsPublished)
                .OrderByDescending(post => post.Date)
                .ToList();
        }
    }

    public BlogEntry? BlogBySlug(string slug, bool includeUnpublished)
    {
        lock (_gate)
        {
            return _data.Blog.FirstOrDefault(post =>
                post.Slug == slug && (includeUnpublished || post.IsPublished));
        }
    }

    public BlogEntry AddBlog(BlogEntry entry)
    {
        lock (_gate)
        {
            entry.Id = NextId(_data.Blog.Select(item => item.Id));
            entry.Slug = Slugify(string.IsNullOrWhiteSpace(entry.Slug) ? entry.Title : entry.Slug);
            if (_data.Blog.Any(post => post.Slug == entry.Slug))
            {
                entry.Slug = $"{entry.Slug}-{entry.Id}";
            }

            _data.Blog.Add(entry);
            Save();
            return entry;
        }
    }

    public BlogEntry? UpdateBlog(int id, BlogEntry entry)
    {
        lock (_gate)
        {
            var existing = _data.Blog.FirstOrDefault(item => item.Id == id);
            if (existing is null)
            {
                return null;
            }

            existing.Title = entry.Title;
            existing.Excerpt = entry.Excerpt;
            existing.Date = entry.Date;
            existing.ReadMinutes = entry.ReadMinutes;
            existing.Image = entry.Image;
            existing.ImageAlt = entry.ImageAlt;
            existing.Body = entry.Body;
            existing.IsPublished = entry.IsPublished;
            var slug = Slugify(string.IsNullOrWhiteSpace(entry.Slug) ? entry.Title : entry.Slug);
            if (!_data.Blog.Any(post => post.Id != id && post.Slug == slug))
            {
                existing.Slug = slug;
            }

            Save();
            return existing;
        }
    }

    public bool DeleteBlog(int id)
    {
        lock (_gate)
        {
            var removed = _data.Blog.RemoveAll(item => item.Id == id) > 0;
            if (removed)
            {
                Save();
            }

            return removed;
        }
    }

    public IReadOnlyList<Promotion> Promotions()
    {
        lock (_gate) return _data.Promotions.OrderByDescending(item => item.StartsAt).ToList();
    }

    public Promotion? ActivePromotion()
    {
        lock (_gate)
        {
            var now = DateTime.UtcNow;
            return _data.Promotions.FirstOrDefault(item =>
                item.IsActive && item.StartsAt <= now && item.EndsAt >= now);
        }
    }

    public Promotion AddPromotion(Promotion item)
    {
        lock (_gate)
        {
            item.Id = NextId(_data.Promotions.Select(entry => entry.Id));
            _data.Promotions.Add(item);
            Save();
            return item;
        }
    }

    public Promotion? UpdatePromotion(int id, Promotion item)
    {
        lock (_gate)
        {
            var existing = _data.Promotions.FirstOrDefault(entry => entry.Id == id);
            if (existing is null) return null;
            existing.Name = item.Name;
            existing.Description = item.Description;
            existing.Percent = item.Percent;
            existing.StartsAt = item.StartsAt;
            existing.EndsAt = item.EndsAt;
            existing.IsActive = item.IsActive;
            existing.ProductIds = item.ProductIds ?? [];
            Save();
            return existing;
        }
    }

    public IReadOnlyList<PromoCode> PromoCodes()
    {
        lock (_gate) return _data.PromoCodes.OrderByDescending(item => item.Id).ToList();
    }

    public PromoCode AddPromoCode(PromoCode item)
    {
        lock (_gate)
        {
            item.Id = NextId(_data.PromoCodes.Select(entry => entry.Id));
            item.Code = item.Code.Trim().ToUpperInvariant();
            _data.PromoCodes.Add(item);
            Save();
            return item;
        }
    }

    public PromoCode? UpdatePromoCode(int id, PromoCode item)
    {
        lock (_gate)
        {
            var existing = _data.PromoCodes.FirstOrDefault(entry => entry.Id == id);
            if (existing is null) return null;
            existing.Code = item.Code.Trim().ToUpperInvariant();
            existing.Percent = item.Percent;
            existing.MaxUses = item.MaxUses;
            existing.ExpiresAt = item.ExpiresAt;
            existing.IsActive = item.IsActive;
            Save();
            return existing;
        }
    }

    public QuoteResult Quote(decimal subtotal, string? code, IReadOnlyList<OrderLine>? lines = null)
    {
        lock (_gate)
        {
            var promotion = CurrentPromotion();
            var promoDiscount = PromotionDiscount(promotion, subtotal, lines);
            var percent = promoDiscount > 0 && promotion is not null ? promotion.Percent : 0;
            var label = promotion is null ? "" : promotion.Name;
            string? applied = null;
            if (!string.IsNullOrWhiteSpace(code))
            {
                var match = FindCode(code);
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
        }
    }

    private decimal PromotionDiscount(Promotion? promotion, decimal subtotal, IReadOnlyList<OrderLine>? lines)
    {
        if (promotion is null || promotion.Percent <= 0) return 0;
        var ids = promotion.ProductIds ?? [];
        if (ids.Count == 0)
        {
            return decimal.Round(subtotal * promotion.Percent / 100m, 2);
        }

        if (lines is null || lines.Count == 0) return 0;
        var names = _data.Products
            .Where(product => ids.Contains(product.Id))
            .Select(product => product.Name.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var eligible = lines
            .Where(line => ids.Contains(line.ProductId) || names.Contains(line.Title.Trim()))
            .Sum(line => line.Price * line.Quantity);
        return decimal.Round(eligible * promotion.Percent / 100m, 2);
    }

    public void ConsumeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;
        lock (_gate)
        {
            var match = _data.PromoCodes.FirstOrDefault(item =>
                string.Equals(item.Code, code.Trim(), StringComparison.OrdinalIgnoreCase));
            if (match is null) return;
            match.Used += 1;
            Save();
        }
    }

    public SiteBanner Banner()
    {
        lock (_gate) return _data.Banner;
    }

    public CourierSettings Courier()
    {
        lock (_gate) return _data.Courier;
    }

    public string NekorektenKey()
    {
        lock (_gate) return _data.NekorektenKey ?? "";
    }

    public IReadOnlyList<ReputationCheck> ReputationChecks()
    {
        lock (_gate) return _data.Reputation.OrderByDescending(item => item.CheckedAt).ToList();
    }

    public ReputationCheck SaveReputation(ReputationCheck check)
    {
        lock (_gate)
        {
            check.Id = NextId(_data.Reputation.Select(item => item.Id));
            check.CheckedAt = DateTime.UtcNow;
            _data.Reputation.Add(check);
            Save();
            return check;
        }
    }

    public CourierSettings UpdateCourier(CourierSettings settings)
    {
        lock (_gate)
        {
            _data.Courier = settings;
            Save();
            return settings;
        }
    }

    public ShopOrder? SetWaybill(int id, string number, string pdfUrl, string? note = null)
    {
        lock (_gate)
        {
            var order = _data.Orders.FirstOrDefault(item => item.Id == id);
            if (order is null) return null;
            order.TrackingCode = number;
            order.LabelUrl = pdfUrl;
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
            Save();
            return order;
        }
    }

    public SiteBanner UpdateBanner(SiteBanner banner)
    {
        lock (_gate)
        {
            _data.Banner = banner;
            Save();
            return banner;
        }
    }

    public IReadOnlyList<Subscriber> Subscribers()
    {
        lock (_gate) return _data.Subscribers.OrderByDescending(item => item.CreatedAt).ToList();
    }

    public Subscriber AddSubscriber(string email)
    {
        lock (_gate)
        {
            var normalized = email.Trim().ToLowerInvariant();
            var existing = _data.Subscribers.FirstOrDefault(item =>
                string.Equals(item.Email, normalized, StringComparison.OrdinalIgnoreCase));
            if (existing is not null) return existing;
            var subscriber = new Subscriber
            {
                Id = NextId(_data.Subscribers.Select(item => item.Id)),
                Email = normalized,
                CreatedAt = DateTime.UtcNow
            };
            _data.Subscribers.Add(subscriber);
            Save();
            return subscriber;
        }
    }

    public IReadOnlyList<string> Audience()
    {
        lock (_gate)
        {
            return _data.Subscribers.Select(item => item.Email)
                .Concat(_data.Users.Where(user => user.Role != "Admin").Select(user => user.Email))
                .Concat(_data.Orders.Select(order => order.Email))
                .Where(email => !string.IsNullOrWhiteSpace(email))
                .Select(email => email.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();
        }
    }

    public IReadOnlyList<EmailCampaign> Campaigns()
    {
        lock (_gate) return _data.Campaigns.OrderByDescending(item => item.CreatedAt).ToList();
    }

    public EmailCampaign AddCampaign(EmailCampaign campaign)
    {
        lock (_gate)
        {
            campaign.Id = NextId(_data.Campaigns.Select(item => item.Id));
            campaign.CreatedAt = DateTime.UtcNow;
            _data.Campaigns.Add(campaign);
            Save();
            return campaign;
        }
    }

    private Promotion? CurrentPromotion()
    {
        var now = DateTime.UtcNow;
        return _data.Promotions.FirstOrDefault(item => item.IsActive && item.StartsAt <= now && item.EndsAt >= now);
    }

    private PromoCode? FindCode(string code)
    {
        var match = _data.PromoCodes.FirstOrDefault(item =>
            item.IsActive && string.Equals(item.Code, code.Trim(), StringComparison.OrdinalIgnoreCase));
        if (match is null) return null;
        if (match.ExpiresAt is not null && match.ExpiresAt < DateTime.UtcNow) return null;
        if (match.Used >= match.MaxUses) return null;
        return match;
    }

    private void EnsureSeed(IConfiguration configuration)
    {
        lock (_gate)
        {
            var changed = false;
            if (_data.Products.Count == 0)
            {
                _data.Products.Add(new Product
                {
                    Id = 1,
                    Name = "Справяне с тревожността",
                    Description = "Терапевтични карти за самопомощ, самоосъзнаване и вътрешна устойчивост.",
                    Price = 79m,
                    ImageUrl = "/images/product-box.jpg",
                    Stock = 40,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                changed = true;
            }

            var adminEmail = configuration["Auth:AdminEmail"] ?? "admin@ertherapybg.com";
            if (!_data.Users.Any(user => string.Equals(user.Email, adminEmail, StringComparison.OrdinalIgnoreCase)))
            {
                _data.Users.Add(new AppUser
                {
                    Id = NextId(_data.Users.Select(item => item.Id)),
                    Name = configuration["Auth:AdminName"] ?? "Росица Неделчева",
                    Email = adminEmail.Trim().ToLowerInvariant(),
                    PasswordHash = PasswordHasher.Hash(configuration["Auth:AdminPassword"] ?? "RosiAdmin2026!"),
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                });
                changed = true;
            }

            if (_data.Blog.Count == 0)
            {
                _data.Blog.AddRange(
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

            foreach (var product in _data.Products)
            {
                product.Images ??= [];
                product.Highlights ??= [];
                product.Specs ??= [];
            }

            foreach (var product in _data.Products.Where(item => item.Images.Count == 0 && string.IsNullOrWhiteSpace(item.Subtitle)))
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

            if (_data.Orders.Count == 0)
            {
                SeedDemo();
                changed = true;
            }

            foreach (var order in _data.Orders.Where(item => item.Status == "completed"))
            {
                var before = _data.ReviewInvites.Count;
                EnsureReviewInvites(order);
                if (_data.ReviewInvites.Count != before) changed = true;
            }

            if (changed)
            {
                Save();
            }
        }
    }

    private void SeedDemo()
    {
        var names = new[] { "Мария Иванова", "Елена Петрова", "Никол Георгиева", "Ива Стоянова", "Теодора Димитрова", "Анна Колева" };
        var cities = new[] { "София", "Пловдив", "Варна", "Бургас", "Стара Загора" };
        var statuses = new[] { "completed", "completed", "shipped", "confirmed", "new", "cancelled" };
        var now = DateTime.UtcNow;
        for (var index = 0; index < 22; index++)
        {
            var status = statuses[index % statuses.Length];
            var quantity = index % 5 == 0 ? 2 : 1;
            _data.Orders.Add(new ShopOrder
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
                Items = [new OrderLine { ProductId = 1, Title = "Справяне с тревожността", Price = 79m, Quantity = quantity }]
            });
        }

        _data.Messages.AddRange(
        [
            new ContactMessage { Id = 1, Name = "Мария Иванова", Email = "maria@example.com", Topic = "Картите", Message = "Подходящи ли са за работа в група?", IsRead = false, CreatedAt = now.AddDays(-2) },
            new ContactMessage { Id = 2, Name = "Петър Николов", Email = "petar@example.com", Topic = "Сесия", Message = "Имате ли свободен час онлайн следващата седмица?", IsRead = true, CreatedAt = now.AddDays(-6) }
        ]);

        _data.Promotions.Add(new Promotion
        {
            Id = 1,
            Name = "Есенна грижа",
            Description = "10% от комплекта за две седмици.",
            Percent = 10,
            StartsAt = now.AddDays(-3),
            EndsAt = now.AddDays(11),
            IsActive = true
        });
        _data.PromoCodes.AddRange(
        [
            new PromoCode { Id = 1, Code = "GRIZHA10", Percent = 10, Used = 8, MaxUses = 50, ExpiresAt = now.AddMonths(2), IsActive = true },
            new PromoCode { Id = 2, Code = "PRAKTIKA15", Percent = 15, Used = 3, MaxUses = 20, ExpiresAt = now.AddMonths(1), IsActive = true }
        ]);
        _data.Banner = new SiteBanner
        {
            Text = "Есенна грижа — 10% от комплекта до края на седмицата",
            Href = "/karti",
            IsActive = true
        };
        foreach (var email in new[] { "maria@example.com", "elena@example.com", "nikol@example.com", "iva@example.com", "anna@example.com" })
        {
            _data.Subscribers.Add(new Subscriber
            {
                Id = NextId(_data.Subscribers.Select(item => item.Id)),
                Email = email,
                CreatedAt = now.AddDays(-_data.Subscribers.Count * 3)
            });
        }

        _data.Campaigns.Add(new EmailCampaign
        {
            Id = 1,
            Subject = "Нов комплект карти",
            Body = "Здравейте,\n\nкомплектът „Справяне с тревожността“ вече е наличен.",
            Recipients = 5,
            Status = "sent",
            CreatedAt = now.AddDays(-12)
        });
    }

    private StoreData Load()
    {
        if (!File.Exists(_path))
        {
            return new StoreData();
        }

        try
        {
            var json = File.ReadAllText(_path);
            return JsonSerializer.Deserialize<StoreData>(json, JsonOptions) ?? new StoreData();
        }
        catch (JsonException)
        {
            return new StoreData();
        }
    }

    private void Save()
    {
        var json = JsonSerializer.Serialize(_data, JsonOptions);
        File.WriteAllText(_path, json);
    }

    private static int NextId(IEnumerable<int> ids)
    {
        var max = 0;
        foreach (var id in ids)
        {
            if (id > max)
            {
                max = id;
            }
        }

        return max + 1;
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

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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
