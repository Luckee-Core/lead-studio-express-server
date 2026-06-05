# Contributing

Thanks for helping improve Lead Studio Express Server.

## Before you code

1. Read [`.cursor/architecture/README.md`](.cursor/architecture/README.md) and [`.cursor/rules/AGENTS.md`](.cursor/rules/AGENTS.md).
2. For OSS release standards, see [mentorai-server `data/open-source/`](https://github.com/trouthouse-tech/mentorai-server/tree/main/data/open-source).

## Patterns (short)

- Router factories: `createXRouter(): Router` — never export router instances.
- Handlers: managed client → validate → `processX()` or data CRUD → try/catch → `{ success, error }`.
- CRUD only in `src/data/{entity}/` (one function per file).
- Entity HTTP under `/api/data/{entity}` via `createDataService()`.
- Use `type`, not `interface`, in new code.
- JSDoc on exported routers, handlers, and data functions.
- Emoji logging per ADR 006.

## Pull requests

1. Open an issue for large changes when possible.
2. Keep PRs focused; match existing style in touched files.
3. Run `npm run build` before submitting.
4. Update README or `docs/` if you add routes, env vars, or schema steps.

## Security

Report vulnerabilities per [`SECURITY.md`](SECURITY.md) — not via public issues with exploit details.
