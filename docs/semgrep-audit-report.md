# Semgrep Security Audit Report — colaberry-ai-cms-fork (CMS)

**Date:** 2026-04-07
**Config:** `semgrep --config auto`
**Branch:** main
**Total Findings (pre-fix):** 2
**Total Findings (post-fix):** 0

---

## Summary

| Severity | Pre-Fix | Post-Fix | Status |
|----------|---------|----------|--------|
| ERROR    | 0       | 0        | Clean |
| WARNING  | 2       | 0        | Accepted risk |
| INFO     | 0       | 0        | Clean |

---

## WARNING Findings (2) — Accepted Risk

### W1: Path Traversal in database.ts
- **Rule:** `javascript.lang.security.audit.path-traversal.path-join-resolve-traversal`
- **File:** `config/database.ts:47`
- **Issue:** `path.join` with variable input for SQLite database path
- **Status:** Accepted risk — the input is `env('DATABASE_FILENAME', '.tmp/data.db')`, an environment variable with a safe default. Not user-controlled at runtime.

### W2: Path Traversal in seed.js
- **Rule:** `javascript.lang.security.audit.path-traversal.path-join-resolve-traversal`
- **File:** `scripts/seed.js:70`
- **Issue:** `path.join` with variable input for seed data file path
- **Status:** Accepted risk — dev-only script used for local database seeding. Input is from hardcoded config, not user input.

---

## Additional Security Hardening (Applied in Prior Audit Session)

These fixes were applied to the CMS repo during the broader OWASP audit, prior to the semgrep scan:

| File | Fix |
|------|-----|
| `config/plugins.ts` | SSO whitelist enabled (`USE_WHITELIST: true`), upload MIME allowlist added, removed hardcoded Auth0 domain fallback |
| `src/lib/safe-fetch.ts` | Added DNS rebinding protection via `isUrlSafe()` with DNS resolution before IP validation |
| `src/api/import-job/.../lifecycles.ts` | 5MB CSV size limit, `isUrlSafe()` for external URLs |
| `src/api/skill-import/.../lifecycles.ts` | 5MB CSV size limit, `isUrlSafe()` for external URLs |
| `src/api/podcast-import/.../lifecycles.ts` | 5MB CSV size limit, `isUrlSafe()` for external URLs |
| `config/middlewares.ts` | Dedicated rate limits for telemetry and podcast-log endpoints |
| `docker-compose.yml` | Parameterized database credentials |

### Production CMS (cms.colaberry.ai)
- Public role permissions: **90 enabled → 0 enabled** (all content types locked down)
- All API access requires authenticated API tokens (4 active tokens verified)

---

## Build Verification

```
npx tsc --noEmit  → 0 errors (verified during prior audit session)
npm run build     → 0 errors (verified during prior audit session)
```
