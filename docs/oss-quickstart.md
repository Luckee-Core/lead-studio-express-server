# Lead Studio OSS quickstart (web + Express)

End-to-end setup for the open-source pair:

| Repo | Role |
|------|------|
| [lead-studio-express-server](https://github.com/lead-open-source/lead-studio-express-server) | API (port **3032**) |
| [lead-studio-web-open-source](https://github.com/lead-open-source/lead-studio-web-open-source) | Next.js UI (port **3000**) |

## 1. Supabase

1. Create a [Supabase](https://supabase.com) project.
2. Run SQL in order from [`sql/README.md`](../sql/README.md) (start with `001_users_and_credits.sql`).

## 2. Express API

```bash
git clone https://github.com/lead-open-source/lead-studio-express-server.git
cd lead-studio-express-server
cp .env.example .env
```

Set at minimum:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm install
npm run playwright:install   # optional; needed for Playwright URL discovery
npm run dev
```

Verify:

```bash
curl http://localhost:3032/api/health
curl http://localhost:3032/api/data/leads
```

## 3. Web app

```bash
git clone https://github.com/lead-open-source/lead-studio-web-open-source.git
cd lead-studio-web-open-source
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3032
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000/setup](http://localhost:3000/setup) for the **first-run wizard**, or go to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) after setup is complete.

## 4. Smoke test

1. Complete `/setup` (health check passes).
2. Open `/dashboard` — empty or seeded pipeline.
3. **Find leads** — requires `GOOGLE_MAPS_API_KEY` on Express.
4. **Lead detail** — research actions require `ANTHROPIC_API_KEY`.

## Wire contract

| Item | Value |
|------|-------|
| Web → API env | `NEXT_PUBLIC_SERVER_URL` |
| Health | `GET /api/health` |
| CRM reads | `GET /api/data/leads`, etc. |
| Workers | `POST /api/services/...` |
| Auth (OSS default) | Dev bypass on Express when `NODE_ENV !== 'production'` |

Full contract: mentorai-server `data/open-source/oss-web-express-wire-contract.md`.

## Governance

Release checklist and audits: mentorai-server [`data/open-source/README.md`](https://github.com/trouthouse-tech/mentorai-server/tree/main/data/open-source).
