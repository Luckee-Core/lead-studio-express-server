# Production hardening (Lead Studio Express)

Lead Studio OSS ships for **local / trusted development** by default. Before exposing the API on a LAN or the internet, work through this checklist.

## Authentication and authorization

| Item | OSS default | Production expectation |
|------|-------------|------------------------|
| Dev auth bypass | Active when `NODE_ENV !== 'production'` | **Disabled** — remove or replace with real middleware |
| `x-user-id` headers | Dev user injected locally | Verify on every mutating/sensitive route |
| Service role key | Server-only in `.env` | Never in client; rotate if leaked |

Implement session cookies, JWT, or API keys before multi-user or public deploy.

## Network

- Bind to `127.0.0.1` during local dev if unsure about firewall rules.
- Use HTTPS in production; terminate TLS at your reverse proxy.
- Set `CORS_ORIGINS` to explicit browser origins (not `*` with credentials).
- Set `CRON_SECRET` for `/api/cron` routes.

## Rate limits

Add rate limiting on:

- AI-backed `/api/services/*` routes
- Email send endpoints
- Scraper triggers
- Bulk operations

## Uploads and outbound fetch

- Enforce size limits on email attachments (see `lead_contact_email_attachments` check).
- SSRF guards on any user-supplied URLs in research workers.

## Secrets

- Gmail service account JSON: file path or env only; never commit.
- `npm audit` before releases.

## Related

- Trust model: root `README.md`
- Pair quickstart: `docs/oss-quickstart.md`
- Governance: mentorai-server `data/open-source/`
