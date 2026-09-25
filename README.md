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
| POST | `/api/products` | Създаване (админ) |
| PUT | `/api/products/{id}` | Обновяване (админ) |
| DELETE | `/api/products/{id}` | Скриване (админ) |
| POST | `/api/auth/login` | Общ вход за клиенти и админ |
| POST | `/api/auth/register` | Регистрация на клиент |
| GET | `/api/orders` | Поръчки (админ) |
| GET | `/api/messages` | Съобщения (админ) |
| GET | `/api/blog/manage` | Статии (админ) |
| GET | `/api/users` | Потребители (админ) |

Входът е на `/vhod`. Администраторът се отваря на `/admin`, клиентът — на `/profil`.

Локален админ (само при първо стартиране, после се пази в `backend/data/store.json`):

- имейл: `admin@ertherapybg.com`
- парола: `RosiAdmin2026!`
