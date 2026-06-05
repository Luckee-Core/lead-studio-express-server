# 009 – `/api/data` Supabase entity routers

## Scope

- **HTTP:** `app.use('/api/data', createDataService())` in `index.ts`.
- **Aggregator:** `createDataService()` (Lead Studio: `createLeadStudioDataService()` in `src/data/lead-studio-data-service.ts`) mounts one sub-router per entity.
- **Paths:** REST-style entity prefixes — e.g. `/api/data/leads`, `/api/data/lead-contacts`, `/api/data/saved-filters` — not action-style `/api/data/company/list`.
- **Persistence:** Supabase (Postgres) via `req.supabase` or managed client; CRUD functions live in `src/data/{entity}/`, not inline in routers.

## Layout

```text
src/data/
  index.ts                      # export createDataService()
  lead-studio-data-service.ts   # mounts entity routers (product-specific name OK)
  leads/
    router.ts                   # export createLeadsRouter(): Router
    get-all-leads.ts            # one CRUD function per file
    create-lead.ts
    index.ts                    # barrel for CRUD exports
  lead-contacts/
    router.ts
    …
```

## Entity router rules

1. **Factory:** `export const createLeadsRouter = (): Router => { … }` — never export a bare router instance.
2. **Thin handlers:** validate input → call `src/data/{entity}/*.ts` → map errors to HTTP.
3. **Responses:**
   - Success: `res.status(200).json({ success: true, data, … })`
   - Client error: `res.status(400).json({ success: false, error, message? })`
   - Server error: `res.status(500).json({ success: false, error, message? })`
4. **Logging:** emoji prefixes per ADR 006 (`❌` on catch).
5. **JSDoc:** every exported router factory and route handler.

## Adding a new entity

1. Create `src/data/{entity}/` with CRUD files (one function per file).
2. Add `router.ts` with `create{Entity}Router()`.
3. Register in the data service aggregator: `router.use('/{entity-kebab}', create{Entity}Router())`.
4. Document new paths in repo README route table.

## What does not belong here

- **Workers / AI orchestration** → `src/domains/{domain}/` and mount under `/api/services`, `/api/scrapers`, or product-specific prefix.
- **Filesystem JSON vaults** — not used in Lead Studio OSS; legacy file-vault patterns are product-specific forks only.

## Environment

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — required for data routes.
- `CORS_ORIGINS` — optional comma-separated browser origins for cross-origin web apps.

## Cross-reference

OSS governance: `mentorai-server/data/open-source/oss-express-backend-benchmark.md` §3.1.  
Web pairing: `mentorai-server/data/open-source/oss-web-express-wire-contract.md`.
