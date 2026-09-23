# Rosi Nedelcheva Site

Онлайн магазин с ASP.NET Core API и Next.js фронтенд.

## Структура

```
backend/     # ASP.NET Core 8 Web API (Controllers / Models / Services)
frontend/    # Next.js + TypeScript + Tailwind
```

## Стартиране

### Backend

```bash
cd backend
dotnet run
```

- API: http://localhost:5080
- Swagger: http://localhost:5080/swagger

### Frontend

```bash
cd frontend
npm run dev
```

- App: http://localhost:3000

## API

| Method | Endpoint | Описание |
|--------|----------|----------|
| GET | `/api/products` | Всички продукти |
| GET | `/api/products/{id}` | Продукт по id |
| POST | `/api/products` | Създаване |
| PUT | `/api/products/{id}` | Обновяване |
| DELETE | `/api/products/{id}` | Изтриване (soft delete) |

Засега продуктите са в паметта (`ProductService`). По-късно може да се добави база данни (EF Core).
