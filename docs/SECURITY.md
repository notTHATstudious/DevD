# Security Review

Review date: November 2026. Scope: frontend, backend, dependencies, build and
deployment config, git history.

## Summary

| Area | Status |
|---|---|
| Production dependencies (npm) | ✅ 0 known vulnerabilities |
| Backend dependencies (pip-audit) | ✅ 0 known vulnerabilities |
| Dev-only tools (Vite 5, Vitest 3, ESLint plugins) | ⚠️ Known advisories; affect only your own machine while developing. Plan an upgrade (see below). |
| Secrets in git history | ✅ None found (only a dummy test password from removed login tests) |
| XSS | ✅ React escapes all feed text; links limited to `https://`; strict CSP |
| Abuse / spam | ✅ Rate limits, body size limit, honeypot, daily cap |
| Personal data | ✅ No accounts; minimal server data (see Privacy) |

## What was fixed in this review

**Dependencies**
- Removed `zod` (unused; high-severity advisory).
- Removed `react-router-dom` (only one page; had advisories). 404 is now handled in `App.tsx`.
- Removed `lovable-tagger` (template dev plugin, not needed).
- Moved `tailwindcss-animate` to dev dependencies (build-time only).
- `npm audit fix` for patch-level fixes.

**Browser**
- Content-Security-Policy is generated at build time (`vite.config.ts`):
  no `'unsafe-inline'` scripts (the theme snippet is allowed by its SHA-256 hash),
  images only from this site and Google's favicon service, API calls only to
  `VITE_API_BASE_URL`, no plugins/objects, HTTPS upgrade.
- `public/_headers` adds anti-framing (clickjacking), nosniff, referrer and HSTS
  headers on hosts that support it. `frame-ancestors` cannot be set from a
  `<meta>` tag, so the host must send these headers (see DEPLOYMENT.md).
- Vite dev server listens on `localhost` only (was all network interfaces).

**Backend** (`backend/app/core/security.py`)
- Security headers on every response: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, HSTS in production.
- Request bodies limited to 16 KB; `Content-Length` required for POST.
- Per-IP rate limits (global 300/min; search 60/min; contact 5 per 15 min).
- API docs (`/docs`, `/redoc`, `/openapi.json`) off unless `DEBUG=true`.
- Feed downloads capped at 5 MB each; XML parsed with expat 2.7 (protected
  against entity-expansion "billion laughs" attacks); only the fixed feed list
  is ever fetched (no user-supplied URLs → no SSRF).
- Uvicorn runs with `--proxy-headers` (real client IPs for rate limiting) and
  `--no-server-header` in Docker; container runs as a non-root user.
- CORS: no credentials allowed; restrict `CORS_ORIGINS` to your domain in production.

**Contact form**
- Owner email lives only in server env vars; never sent to the browser.
- Validation: category whitelist, length limits, email format, control characters
  stripped, name forced to one line (prevents email header injection).
- Hidden honeypot field silently drops bot submissions.
- Stored in SQLite with parameterized queries (no SQL injection); IPs not stored;
  messages auto-deleted after `CONTACT_RETENTION_DAYS`.

**CI**
- Keep-alive workflow runs with `permissions: {}` (no repo access).

## Remaining items / recommendations

| Priority | Item |
|---|---|
| High (before launch) | Set `APP_ENV=production` and `CORS_ORIGINS=["https://your-domain"]` on the server. |
| High | Serve everything over HTTPS only (paid hosts and Let's Encrypt make this free). |
| High | Make sure the frontend host sends the headers in `public/_headers` (check with https://securityheaders.com). |
| Medium | Upgrade dev tooling: Vite 5 → 6+/7, Vitest 3 → 4+, typescript-eslint. Breaking upgrades; test after. |
| Medium | Back up `backend/data/messages.db` (or rely on email forwarding). |
| Medium | Run `npm audit --omit=dev` and `pip-audit -r backend/requirements.txt` monthly, or enable GitHub Dependabot alerts. |
| Low | Source icons load from Google's favicon service (disclosed in the Privacy Policy). Self-hosting icons would remove this third-party request. |
| Low | Rate limits are in memory: fine for one server. If you ever run several instances, move them to Redis or the proxy. |

## How to re-run the checks

```bash
npm audit --omit=dev
npm test && npx tsc -p tsconfig.app.json --noEmit && npm run lint
cd backend && .venv/bin/pip install pip-audit && .venv/bin/pip-audit -r requirements.txt
cd backend && .venv/bin/python -m pytest
```

After deploying:

```bash
curl -sI https://YOUR-API/health        # expect x-frame-options, x-content-type-options, strict-transport-security
curl -s -o /dev/null -w "%{http_code}\n" https://YOUR-API/docs   # expect 404
```
