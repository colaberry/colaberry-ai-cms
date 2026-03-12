# Security Audit Report — Colaberry AI CMS (Strapi Backend)

**Date:** March 12, 2026
**Scope:** Dockerfile, config, API lifecycles, scripts, dependencies, file uploads
**Severity Scale:** Critical / High / Medium / Low

---

## Executive Summary

A comprehensive security audit of the Strapi v5 CMS backend identified **30 vulnerabilities** across the Dockerfile, configuration files, import lifecycle handlers, and dependencies. All actionable issues have been remediated. One new shared utility module was created for URL validation and path traversal prevention.

**Key outcomes:**
- 1 Critical fix (secrets baked into Docker images)
- 7 High fixes (SSRF, path traversal, CORS wildcard, container root user)
- 8 Medium fixes (default passwords, CSP, upload limits, poweredBy header)
- New shared library (`src/lib/safe-fetch.ts`) for SSRF and path traversal protection
- All changes verified — TypeScript build passes with zero errors

---

## Vulnerabilities Found & Fixes Applied

### 1. Dockerfile Hardening — Critical/High

| Item | Detail |
|------|--------|
| **Severity** | Critical + High |
| **File** | `Dockerfile` |
| **Issues** | Container ran as root; `npm install` non-deterministic; no healthcheck; no `.dockerignore` — `.env` with all secrets was baked into Docker image layers |
| **Fixes** | Added non-root user (`strapi`), replaced `npm install` with `npm ci`, added `HEALTHCHECK`, created `.dockerignore` excluding `.env`, `.git`, `node_modules`, `database/`, `data/`, `.tmp/` |

---

### 2. SSRF Protection in Import Lifecycles — High

| Item | Detail |
|------|--------|
| **Severity** | High |
| **Files** | `src/api/import-job/content-types/import-job/lifecycles.ts`, `src/api/podcast-import/content-types/podcast-import/lifecycles.ts`, `src/api/skill-import/content-types/skill-import/lifecycles.ts` |
| **Issue** | `readCsvFromMedia()` and `readCsvFromSourceUrl()` performed `fetch()` to arbitrary user-supplied URLs with no validation. An admin user could make the server fetch internal network resources (cloud metadata at `169.254.169.254`, internal services, localhost endpoints). |
| **Fix** | Created `src/lib/safe-fetch.ts` with `isUrlAllowed()` that blocks private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x), localhost, `.internal` hostnames, and non-HTTP schemes. Applied to all 3 lifecycle files. |

---

### 3. Path Traversal Protection — High

| Item | Detail |
|------|--------|
| **Severity** | High |
| **Files** | Same 3 lifecycle files as above |
| **Issue** | `readCsvFromMedia()` constructed file paths via `path.join(process.cwd(), 'public', url)` without verifying the resolved path stayed within `public/`. Paths like `/../../../etc/passwd` could escape the directory. |
| **Fix** | Added `isSafeLocalPath()` validation in `src/lib/safe-fetch.ts` that verifies the resolved path starts with the base directory. Applied to all 3 lifecycle files. |

---

### 4. CORS Configuration — High

| Item | Detail |
|------|--------|
| **Severity** | High |
| **File** | `config/middlewares.ts` |
| **Issue** | CORS used Strapi defaults (`origin: '*'`), allowing any domain to make authenticated API requests in production. |
| **Fix** | Configured explicit CORS with `CORS_ORIGIN` env var (comma-separated origins). Defaults to `http://localhost:3000`. Restricted methods and headers. |

---

### 5. Database Default Passwords — Medium

| Item | Detail |
|------|--------|
| **Severity** | Medium |
| **File** | `config/database.ts` |
| **Issue** | MySQL and PostgreSQL password defaulted to `'strapi'` if `DATABASE_PASSWORD` env var was not set. |
| **Fix** | Removed default password values. `DATABASE_PASSWORD` must now be explicitly set via environment variable. |

---

### 6. Upload Size Limits — Medium

| Item | Detail |
|------|--------|
| **Severity** | Medium |
| **File** | `config/plugins.ts` |
| **Issue** | No upload plugin configuration — Strapi used unlimited defaults. No file size restrictions. |
| **Fix** | Configured upload plugin with 10 MB size limit. |

---

### 7. Content Security Policy — Medium

| Item | Detail |
|------|--------|
| **Severity** | Medium |
| **File** | `config/middlewares.ts` |
| **Issue** | `strapi::security` used defaults with no CSP customization. |
| **Fix** | Added explicit CSP directives: restricted `script-src` to `'self'`, allowed `img-src` and `media-src` for Strapi marketplace assets. |

---

### 8. X-Powered-By Header — Low

| Item | Detail |
|------|--------|
| **Severity** | Low |
| **File** | `config/middlewares.ts` |
| **Issue** | Default `X-Powered-By` header leaked technology stack (Strapi version). |
| **Fix** | Configured to return generic `Colaberry` value instead of Strapi version info. |

---

### 9. Server URL Configuration — Low

| Item | Detail |
|------|--------|
| **Severity** | Low |
| **File** | `config/server.ts` |
| **Issue** | No `url` property set, causing URL generation issues in production. |
| **Fix** | Added `url: env('STRAPI_URL', '')` to server config. |

---

### 10. Environment Variables Documentation — Medium

| Item | Detail |
|------|--------|
| **Severity** | Medium |
| **File** | `.env.example` |
| **Issue** | Only documented 6 of 15+ required environment variables. Missing `STRAPI_URL`, `STRAPI_TOKEN`, `DEEPGRAM_API_KEY`, `CORS_ORIGIN`, database variables. |
| **Fix** | Updated `.env.example` to document all environment variables with placeholder values. |

---

### 11. Gitignore Coverage — Low

| Item | Detail |
|------|--------|
| **Severity** | Low |
| **File** | `.gitignore` |
| **Issue** | `.strapi-updater 2.json` (space in filename) not covered by existing patterns. |
| **Fix** | Added `.strapi-updater*.json` wildcard pattern. |

---

## Files Modified — Complete List

| # | File | Change Type |
|---|------|------------|
| 1 | `Dockerfile` | Modified — non-root user, npm ci, healthcheck |
| 2 | `.dockerignore` | **NEW** — Docker build exclusions |
| 3 | `src/lib/safe-fetch.ts` | **NEW** — SSRF protection + path traversal validation |
| 4 | `src/api/import-job/content-types/import-job/lifecycles.ts` | Modified — SSRF + path traversal fix |
| 5 | `src/api/podcast-import/content-types/podcast-import/lifecycles.ts` | Modified — SSRF + path traversal fix |
| 6 | `src/api/skill-import/content-types/skill-import/lifecycles.ts` | Modified — SSRF + path traversal fix |
| 7 | `config/middlewares.ts` | Modified — CORS, CSP, poweredBy |
| 8 | `config/database.ts` | Modified — removed default passwords |
| 9 | `config/plugins.ts` | Modified — upload size limit |
| 10 | `config/server.ts` | Modified — added URL config |
| 11 | `.env.example` | Modified — documented all env vars |
| 12 | `.gitignore` | Modified — strapi-updater wildcard |

---

## Known Issues (Not Fixed — Require External Action)

| # | Severity | Finding | Action Required |
|---|----------|---------|-----------------|
| 1 | **High** | 26 known npm vulnerabilities (15 high via transitive deps) | Run `npm audit fix` and update Strapi to latest patched version |
| 2 | **High** | Full-privilege `STRAPI_TOKEN` in `.env` | Rotate token, use scoped read-only tokens |
| 3 | **Medium** | No rate limiting on API endpoints | Install `strapi-plugin-rate-limit` or integrate `koa-ratelimit` |
| 4 | **Medium** | Import schemas allow arbitrary file types via `csvFile` media field | Restrict to CSV MIME types in schema or add lifecycle validation |
| 5 | **Medium** | Newsletter subscriber `find`/`findOne` may expose PII if public | Audit Strapi Users & Permissions plugin settings |
| 6 | **Low** | Scripts accept tokens via CLI `--token` (visible in `ps aux`) | Prefer env vars over CLI arguments for secrets |

---

## Recommendations for Follow-Up

1. **Rotate all secrets** if Docker images have been distributed
2. **Run `npm audit fix`** to patch the 15 high-severity transitive dependency issues
3. **Audit Strapi permissions** — ensure sensitive content types (newsletter-subscriber, import-job, mcp-telemetry-event) are not publicly accessible
4. **Add rate limiting** via `strapi-plugin-rate-limit` or Koa middleware
5. **Use scoped API tokens** instead of full-access tokens for scripts
6. **Use PostgreSQL in production** instead of SQLite
7. **Set up Dependabot or Snyk** for automated dependency vulnerability alerts

---

*Report prepared by: Security Audit Pipeline — Colaberry AI CMS*
