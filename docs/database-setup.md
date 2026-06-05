# Database setup (Supabase)

Lead Studio Express requires a **Supabase (Postgres)** project with the Lead Studio table bundle.

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **service_role** key into `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

Never put the service role key in the web app or `NEXT_PUBLIC_*` variables.

## 2. Run schema SQL

Open the Supabase **SQL Editor** and run scripts in the order listed in **[`sql/README.md`](../sql/README.md)**.

**Do not** use `src/db/schema/001_initial_schema.sql` for Lead Studio OSS — it targets the Luckee hub (auth UUID users, coach tables) and does **not** include `leads`.

Quick path:

1. [`sql/001_users_and_credits.sql`](../sql/001_users_and_credits.sql)
2. All numbered files in [`sql/README.md`](../sql/README.md) **Required** table (through `145_email_sending_identities.sql`)
3. Optional: [`sql/lead_sent_emails_open_tracking_token.sql`](../sql/lead_sent_emails_open_tracking_token.sql) if using open tracking

## 3. Verify connection

```bash
npm run dev
curl http://localhost:3032/api/health
curl http://localhost:3032/api/data/leads
```

Expect JSON with `success: true` or a clear error — not a connection timeout.

On first `npm run dev`, the server creates a **dev user** (`dev-user-001`) when `NODE_ENV` is not `production`.

## 4. Optional features

| Feature | Extra env / SQL |
|---------|-----------------|
| AI research workers | `ANTHROPIC_API_KEY` |
| Google Maps find-leads | `GOOGLE_MAPS_API_KEY` |
| Outbound email | Gmail service account — [`src/services/email/README.md`](../src/services/email/README.md) + open-tracking SQL |
| Facebook scrapers | `APIFY_API_TOKEN` |
| Cron routes | `CRON_SECRET` in production |

## 5. Local-only threat model

OSS default assumes **trusted local use**. Dev auth bypass applies when `NODE_ENV !== 'production'`. Do not expose an unauthenticated API on `0.0.0.0` without real auth.

## Related

- Pair quickstart: [`docs/oss-quickstart.md`](oss-quickstart.md)
- Wire contract: mentorai-server `data/open-source/oss-web-express-wire-contract.md`
