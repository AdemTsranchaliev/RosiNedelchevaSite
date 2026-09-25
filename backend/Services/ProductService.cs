using RosiNedelcheva.Api.Models;

namespace RosiNedelcheva.Api.Services;

public class ProductService : IProductService
{
    private readonly AppStore _store;

    public ProductService(AppStore store)
    {
        _store = store;
    }

    public Task<IEnumerable<Product>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<Product>>(_store.Products(includeInactive: false));
    }

    public Task<IEnumerable<Product>> GetManagedAsync()
    {
        return Task.FromResult<IEnumerable<Product>>(_store.Products(includeInactive: true));
    }

    public Task<Product?> GetByIdAsync(int id)
    {
        return Task.FromResult(_store.Product(id, includeInactive: false));
    }

    public Task<Product> CreateAsync(Product product)
    {
        return Task.FromResult(_store.AddProduct(product));
    }

    public Task<Product?> UpdateAsync(int id, Product product)
    {
        return Task.FromResult(_store.UpdateProduct(id, product));
    }

    public Task<bool> DeleteAsync(int id)
    {
        return Task.FromResult(_store.ArchiveProduct(id));
    }
}
