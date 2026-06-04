# Таро Премиум — Telegram Mini App

Сервис гаданий на Таро внутри Telegram. Пользователь открывает Mini App, выбирает расклад, задаёт вопрос, вытягивает карты, получает ИИ-трактовку.

> Оригинальный handoff-README прототипа: [README_handoff.md](README_handoff.md)

## Архитектура

```
taro_bot/
├── apps/
│   ├── api/          # Fastify + Prisma + grammY бот
│   └── web/          # React + TypeScript + Vite (Mini App)
├── packages/
│   └── shared/       # Типы, данные карт, сиды (78 карт, расклады, колоды)
├── cards/
│   ├── mansion/      # Dark Mansion (0..77.jpg)
│   └── wood/         # Dark Wood (0..77.jpg)
└── docker-compose.yml
```

## Быстрый старт (локально)

### Требования
- Node.js 20+, pnpm 9+
- PostgreSQL 16 (или Docker)

### 1. Установить зависимости

```bash
pnpm install
```

### 2. Настроить окружение

```bash
cp .env.example .env
# Заполните .env — минимум: BOT_TOKEN, WEBAPP_URL, JWT_SECRET, LLM_API_KEY
```

### 3. Запустить БД (Docker)

```bash
docker run -d --name taro-pg \
  -e POSTGRES_USER=taro \
  -e POSTGRES_PASSWORD=taro_secret \
  -e POSTGRES_DB=taro_premium \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. Мигрировать и засидировать БД

```bash
cd apps/api
npx prisma migrate dev --name init
cd ../..
pnpm db:seed
```

### 5. Запустить в dev-режиме

```bash
pnpm dev
# API: http://localhost:3000
# Web: http://localhost:5173
```

---

## Настройка BotFather

1. Создайте бота: `/newbot` → получите `BOT_TOKEN`
2. Установите Menu Button → Web App URL: ваш `WEBAPP_URL`
3. (Опц.) `/setdomain` → добавьте ваш домен
4. Для Telegram Stars: `/mybots` → Payments → Telegram Stars

---

## Деплой на Railway / Render / VPS

### Railway (рекомендуется)

```bash
npm install -g @railway/cli
railway login
railway new
railway add postgres
railway variables set BOT_TOKEN=... WEBAPP_URL=... JWT_SECRET=... LLM_API_KEY=...
railway up
```

### VPS + Docker Compose (HTTPS через Nginx + Let's Encrypt)

```bash
# 1. Скопируйте .env на сервер
scp .env user@server:/app/taro_bot/

# 2. Сборка и запуск
docker compose up -d --build

# 3. Миграции
docker compose exec api npx prisma migrate deploy

# 4. Nginx + Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

Пример nginx-конфига:

```nginx
server {
    server_name your-domain.com;
    location /api/ { proxy_pass http://localhost:3000; }
    location / { proxy_pass http://localhost:8080; }
}
```

### Переменные окружения (обязательные)

| Переменная | Описание |
|-----------|----------|
| `BOT_TOKEN` | Токен бота от BotFather |
| `WEBAPP_URL` | HTTPS URL Mini App |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Случайная строка >= 32 символа |
| `LLM_PROVIDER` | `openai` или `anthropic` |
| `LLM_API_KEY` | API-ключ провайдера LLM |

### Опциональные

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `LLM_MODEL` | `gpt-4o-mini` | Модель LLM |
| `PAYMENT_PROVIDER` | `telegram` | `telegram` или `yukassa` |
| `CDN_BASE_URL` | (пусто) | Базовый URL для изображений карт |

---

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/api/auth` | — | Валидация initData, JWT-сессия |
| GET | `/api/me` | JWT | Профиль, баланс, статус free |
| GET | `/api/me/transactions` | JWT | История транзакций |
| GET | `/api/catalog` | — | Расклады, колоды, пакеты пополнения |
| POST | `/api/reading` | JWT | Создать расклад (розыгрыш + LLM) |
| GET | `/api/history` | JWT | История раскладов |
| GET | `/api/daily` | JWT | Карта дня |
| POST | `/api/daily/reveal` | JWT | Открыть карту дня |
| POST | `/api/deck` | JWT | Сменить колоду |
| POST | `/api/natal` | JWT | Построить натальную карту |
| POST | `/api/topup/create` | JWT | Создать платёж |
| POST | `/api/payments/webhook` | — | Вебхук провайдера оплаты |

---

## Тесты

```bash
cd apps/api
pnpm test
```

Покрывают:
- Валидация HMAC-SHA256 подписи `initData`
- Атомарное списание, нехватка средств, бесплатный расклад
- Пополнение + идемпотентность вебхука
- Серверный розыгрыш карт (уникальность, диапазон, % перевёрнутых)

---

## TODO (перед запуском)

- [ ] **Лицензии** на изображения `cards/mansion` и `cards/wood` — они сторонние. Подтвердите права на коммерческое использование или замените своими.
- [ ] **Соцсети** — замените плейсхолдеры `@taro.lux` / `@tarolux_bot` в `HomeScreen.tsx`.
- [ ] **Юридическое** — оферта, дисклеймер «развлекательный сервис», возрастное ограничение.
- [ ] **Домен** — зарегистрируйте HTTPS-домен (Telegram требует https для Mini App).
- [ ] **CDN** — при большом трафике вынесите `cards/` на CDN и установите `CDN_BASE_URL`.
- [ ] **Уведомления** — push «доступен бесплатный расклад дня» утром.
- [ ] **Реальные эфемериды** — при желании Swiss Ephemeris вместо детерминированного сида в `/api/natal`.

---

## Стек

- **Backend**: Node.js 20, TypeScript, Fastify 4, Prisma 5, PostgreSQL 16
- **Bot**: grammY
- **LLM**: OpenAI GPT-4o-mini / Anthropic Claude (env-настройка)
- **Frontend**: React 18, TypeScript, Vite 5, @twa-dev/sdk
- **Deploy**: Docker Compose, Nginx
