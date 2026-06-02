# 009 – CRM file vault and `/api/data` action API

## Scope

- **Persistence:** JSON files under `CRM_DATA_DIR` (default: `<cwd>/.data/crm`), including `companies.json`, `employees.json`, `jobs.json`, `job-applications.json`. **Graphics** use Supabase `image_graphics` only (`docs/supabase-image-graphics-schema.sql`).
- **HTTP:** `app.use('/api/data', createApiDataRouter())`. Routes are **action paths** per entity: `/api/data/company/list`, `/api/data/company/create`, etc. (not `src/domains/crm`).
- **Source layout:** HTTP wiring in `src/api/data/{entity}/`; vault read/write in `src/data/crm/`.

## Environment

- `CRM_DATA_DIR` – optional absolute path to the CRM JSON directory.
- `JOB_LISTING_DATA_DIR` – optional absolute path for job-listing ledger JSON (`job-listing-scrape-runs.json`, `job-listing-ai-*.json`). Default: `<CRM_DATA_DIR>/../job-listing`.
- `ANTHROPIC_API_KEY` – optional; when set, `POST /api/data/job/import-listing` runs a small JSON extract after HTML→text.
- `CORS_ORIGINS` – optional comma-separated browser origins (defaults allow common Next dev URLs).

## Job import-listing

- **Route:** `POST /api/data/job/import-listing` with JSON body `{ "id": "<jobUuid>" }`. Requires the job to have a non-empty `url`; validates `http`/`https` and basic SSRF guards.
- **Orchestration:** `src/services/job/scrape-job-listing.ts` (`runJobListingImport`) — `fetch` with timeout and byte cap, HTML→plain text, optional Anthropic extract, then **persist** `job-listing-ai-requests` / `responses` / `exchanges` with the same prompts the API used (call first, ledger second — same pattern as mentorai `lead-website-research`), then CRM job update.
- **Ledger:** `src/data/job-listing/` — append-only JSON arrays (scrape runs + AI requests, responses, exchanges). AI rows are written **after** the Anthropic round completes; failed scrapes finalize the run row with `status: "failed"`.

## No managed database (default)

v1 does not use Supabase or other DB clients for CRM; only the filesystem vault.

## Optional Supabase mirror (job listing sections)

When **`SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** are set, AI ledger rows from the primary extract and sections pass are **also** inserted into `job_listing_ai_requests`, `job_listing_ai_responses`, and `job_listing_ai_exchanges` (see `docs/supabase-job-listing-ai-ledger-mirror.sql`). A successful **sections** extract is **also** inserted into `job_responsibilities`, `job_requirements`, and `job_nice_to_have` (see `docs/supabase-job-listing-sections-mirror.sql`). The JSON ledger remains the source of truth for the full CRM; Supabase is an optional sidecar.
