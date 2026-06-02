# Lead Studio Express Server

Express API for [lead-studio-web-open-source](https://github.com/lead-open-source/lead-studio-web-open-source). Ported from the lead surface of `mentorai-server` (Luckee-only extras such as residential leads, lead digest, services studio, and user background studio are **not** included).

## Quick start

```bash
cp .env.example .env
# Fill SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, etc.

npm install
npm run dev
```

Default port: **3005** (matches OSS web `NEXT_PUBLIC_SERVER_URL` dev default).

Point the web app at this server:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3005
```

## Mounted routes

| Prefix | Purpose |
|--------|---------|
| `GET /`, `GET /api/health` | Health |
| `/api/data/*` | Lead CRM CRUD (leads, contacts, categories, email queue, scrape runs, call log, costs, saved filters, commercial research queue, …) |
| `/api/services/*` | Lead research workers (Google search, website crawl, Facebook, auto-categorize, …) |
| `/api/lead-contact-chat/*` | Contact chat drafts |
| `/api/gmail-oauth/*` | Gmail send pipeline |
| `/api/email/*`, `/api/webhooks/*`, `/api/cron/*` | Outbound email + SendGrid/Gmail hooks |
| `/api/scrapers/facebook-*` | Facebook admin scrapers |

## Architecture

See [`.cursor/architecture/README.md`](.cursor/architecture/README.md) for ADRs (router factories, data layer, managed clients, edge-function boundaries).

## Verification

```bash
npm run build
curl http://localhost:3005/api/health
```

Smoke with OSS web: leads list, find leads (maps scrape), lead detail research actions, email queue, commercial research queue, saved filter presets.
