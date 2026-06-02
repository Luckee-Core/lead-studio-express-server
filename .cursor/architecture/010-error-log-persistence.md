# 010 – Error log persistence (Supabase tables)

## Status

Accepted

## Context

Typed error tables (`thunk_errors`, `ui_errors`, `api_errors`) are normal data entities—not a separate “error-log feature” with extra service layers.

## Decision

Follow **mentorai-server** colocation: one folder per table under `src/data/{entity}/` containing:

- `insert-*.ts` — Supabase `.from(table).insert(...)`
- `router.ts` — `createXRouter()` with route handlers (validate inline, call insert)
- `types.ts`, `index.ts`

Mount routers on the existing `/api/data` aggregator:

```typescript
router.use("/thunk-errors", createThunkErrorsRouter());
router.use("/ui-errors", createUiErrorsRouter());
router.use("/api-errors", createApiErrorsRouter());
```

Server enriches `app_slug`, `environment`, `release` via `resolveAppErrorInsertMeta()` — clients must not send these.

## Environment

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Tenant project |
| `SUPABASE_SERVICE_ROLE_KEY` | Insert from Express |
| `APP_SLUG` | Default `code-your-resume` |
| `GIT_COMMIT_SHA` | Optional `release` column |

## DDL

`docs/supabase-error-log-schema.sql` — no JSONB; scalar columns per table.

## Anti-patterns

- `src/data/error-log/` or `src/api/data/error-log/` umbrella grouping unrelated tables
- `src/services/error-log/` for validation-only wrappers around a single insert
- Reporting failures back into error tables from error handlers (console only)

## Copy to another Express backend

1. Run SQL in tenant Supabase.
2. Copy `src/data/thunk-errors/` (and `ui-errors/`, `api-errors/` as needed).
3. Copy `src/utils/resolve-app-error-insert-meta.ts` if reused across tables.
4. Mount routers on your `/api/data` (or equivalent) router factory.

## Related

- Next [015 – Error event logging](../../code-your-resume-open-source/.cursor/architecture/015-error-event-logging.md)
- [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md)
