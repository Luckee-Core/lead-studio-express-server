# OSS release status (Lead Studio pair)

Scored against mentorai-server [`oss-release-readiness-checklist.md`](https://github.com/trouthouse-tech/mentorai-server/blob/main/data/open-source/oss-release-readiness-checklist.md) — **Pair** archetype.

**Overall:** Ship with debt (v0.1.0)

## Passed (highlights)

| Area | Status |
|------|--------|
| LICENSE / CONTRIBUTING / SECURITY | Both repos |
| README + governance links | Both repos |
| `.env.example` | Both repos |
| Express ADR 009 entity routers | express |
| SQL bundle + runbook | express `sql/` |
| CI (build, typecheck/audit) | Both repos |
| OSS setup wizard + health test | web `/setup` |
| Wire contract documented | `docs/oss-quickstart.md` |

## Open debt (non-blocking for first tag)

| Item | Notes |
|------|-------|
| Production auth | Documented in `docs/production-hardening.md`; not implemented |
| OpenAPI / route manifest | Future |
| Integration test suite | Manual smoke + wizard health check |
| GitHub private advisories | Enable in org/repo settings |
| `interface` vs `type` drift | Close on touch in express data routers |

## Security audit notes (summary)

- **Threat model:** local/trusted dev; dev auth bypass on express in non-production.
- **Client secrets:** no service keys in `NEXT_PUBLIC_*`; wizard stores setup prefs in `localStorage` only (no tokens).
- **CORS:** express uses permissive `cors()` — acceptable for local OSS; tighten for production (see production-hardening).
- **Depth pass:** re-run with `oss-module-security-audit-guide.md` + `oss-lightweight-package-security-audit-guide.md` before wide public launch.

Last updated: 2026-06 (v0.1.0 OSS slice prep).
