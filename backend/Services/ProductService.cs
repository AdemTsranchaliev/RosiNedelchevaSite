using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class ProductService : IProductService
{
    private readonly List<Product> _products =
    [
        new()
        {
            Id = 1,
            Name = "Пример продукт",
            Description = "Начален продукт за демонстрация на магазина.",
            Price = 29.99m,
            ImageUrl = null,
            Stock = 10,
            IsActive = true
        },
        new()
        {
            Id = 2,
            Name = "Втори продукт",
            Description = "Още един примерен продукт.",
            Price = 49.50m,
            ImageUrl = null,
            Stock = 5,
            IsActive = true
        }
    ];

    private int _nextId = 3;

    public Task<IEnumerable<Product>> GetAllAsync()
    {
        return Task.FromResult(_products.Where(p => p.IsActive).AsEnumerable());
    }

    public Task<Product?> GetByIdAsync(int id)
    {
        var product = _products.FirstOrDefault(p => p.Id == id && p.IsActive);
        return Task.FromResult(product);
    }

    public Task<Product> CreateAsync(Product product)
    {
        product.Id = _nextId++;
        product.CreatedAt = DateTime.UtcNow;
        product.IsActive = true;
        _products.Add(product);
        return Task.FromResult(product);
    }

    public Task<Product?> UpdateAsync(int id, Product product)
    {
        var existing = _products.FirstOrDefault(p => p.Id == id);
        if (existing is null)
        {
            return Task.FromResult<Product?>(null);
        }

        existing.Name = product.Name;
        existing.Description = product.Description;
        existing.Price = product.Price;
        existing.ImageUrl = product.ImageUrl;
        existing.Stock = product.Stock;
        existing.IsActive = product.IsActive;

        return Task.FromResult<Product?>(existing);
    }

    public Task<bool> DeleteAsync(int id)
    {
        var existing = _products.FirstOrDefault(p => p.Id == id);
        if (existing is null)
        {
            return Task.FromResult(false);
        }

        existing.IsActive = false;
        return Task.FromResult(true);
    }
}
