# Lead Studio Express Server

Express API for [lead-studio-web-open-source](https://github.com/lead-open-source/lead-studio-web-open-source). Ported from the lead surface of `mentorai-server` (Luckee-only extras such as residential leads, lead digest, services studio, and user background studio are **not** included).

**OSS quickstart (web + Express):** [`docs/oss-quickstart.md`](docs/oss-quickstart.md).

OSS governance (benchmarks, release checklist, security audits): [mentorai-server `data/open-source/`](https://github.com/trouthouse-tech/mentorai-server/tree/main/data/open-source). Web + API wire contract: Lead Studio section in `oss-web-express-wire-contract.md`.

## Quick start

```bash
cp .env.example .env
# Fill SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, etc.

npm install
# Optional: URL discovery workers need Playwright browsers
npm run playwright:install
npm run dev
```

Default port: **3032** (matches OSS web `NEXT_PUBLIC_SERVER_URL` dev default).

Mac users can start both repos from the web repo's Desktop launcher — see [`lead-studio-web-open-source/scripts/README.md`](https://github.com/lead-open-source/lead-studio-web-open-source/blob/main/scripts/README.md).

Point the web app at this server:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3032
```

## Mounted routes

| Prefix | Purpose |
|--------|---------|
| `GET /`, `GET /api/health` | Health |
| `/api/data/*` | Lead CRM CRUD (leads, contacts, categories, email queue, scrape runs, call log, costs, saved filters, commercial research queue, …) |
| `/api/services/*` | Lead research workers (Google search, website crawl, Facebook, auto-categorize, …) |
| `/api/lead-contact-chat/*` | Contact chat drafts |
| `/api/email/*`, `/api/webhooks/*`, `/api/cron/*` | Outbound email (Workspace service account) + Gmail push hooks |
| `/api/scrapers/facebook-*` | Facebook admin scrapers |

## Architecture

See [`.cursor/architecture/README.md`](.cursor/architecture/README.md) for ADRs (router factories, data layer, managed clients, edge-function boundaries).

## Database

Supabase setup and SQL run order: [`docs/database-setup.md`](docs/database-setup.md).

## Local development and trust

When `NODE_ENV` is not `production`, the server applies a **dev auth bypass** so local CRM flows work without login. **Do not** rely on this for LAN or internet exposure — add authentication and authorization before wider deploy. Bind to `127.0.0.1` or firewall the port during local development if unsure.

## Security

Report issues per [`SECURITY.md`](SECURITY.md). License: MIT — see [`LICENSE`](LICENSE). Release status: [`docs/oss-release-status.md`](docs/oss-release-status.md).

## Verification

```bash
npm run build
curl http://localhost:3032/api/health
```

Smoke with OSS web: leads list, find leads (maps scrape), lead detail research actions, email queue, commercial research queue, saved filter presets.
