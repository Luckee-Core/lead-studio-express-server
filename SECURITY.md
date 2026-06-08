# Security

## Supported use

**Local / trusted development** is the primary assumption for this open-source API: you run Express on your machine or a controlled network, paired with [lead-studio-web-open-source](https://github.com/lead-open-source/lead-studio-web-open-source). See `README.md` for env vars, mounted routes, and the **dev auth bypass** in non-production.

**Before exposing this server on a LAN or the internet:** enforce authentication and authorization on every mutating and sensitive read route, use HTTPS, configure CORS explicitly, and add rate limits on expensive or AI-backed endpoints.

## Reporting a vulnerability

**Do not** post exploit details in public issues before a fix is coordinated.

### 1. GitHub private security advisories (preferred)

1. Open this repository on GitHub.
2. Go to the **Security** tab.
3. Use **Report a vulnerability** (private submission).

Enable **private vulnerability reporting** on the repo or organization if the button is not visible. See [GitHub’s guidance](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

### 2. Maintainer email (optional; forks should set this)

If private advisories are unavailable, edit this file and add a working address—for example `mailto:security@your-domain.org`.

## Scope and limitations

- This document does not replace a professional security assessment for production or multi-tenant deployments.
- **Service-role Supabase keys**, **Anthropic/OpenAI keys**, and **Gmail service account** material must stay server-only — never in client bundles or public env.
- Optional integrations (Apify, webhooks) expand attack surface; disable or firewall routes you do not use.

## Audit resources

Pre-release and security review guides: [mentorai-server `data/open-source/`](https://github.com/trouthouse-tech/mentorai-server/tree/main/data/open-source) (benchmark, checklist, wire contract).

## Versions

Security fixes apply to the **default branch** unless maintainers publish a separate support policy.
