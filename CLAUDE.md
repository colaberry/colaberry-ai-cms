# Colaberry AI — CMS Backend

## Tech Stack
- **Framework:** Strapi v5.36.0 (headless CMS)
- **Runtime:** Node.js 20+ (up to 24.x)
- **Language:** TypeScript 5
- **Database:** SQLite (dev via better-sqlite3), PostgreSQL (production via pg)
- **Deployment:** Docker

## Content Types (20 total)

### Core Catalog
| Content Type   | API ID                           | Key Relations                        |
|----------------|----------------------------------|--------------------------------------|
| Agent          | `api::agent.agent`               | tags, companies, skills, useCases, mcpServers |
| MCP Server     | `api::mcp-server.mcp-server`     | tags, companies, skills, useCases    |
| Skill          | `api::skill.skill`               | agents, mcpServers                   |
| Use Case       | `api::use-case.use-case`         | agents, mcpServers                   |

### Content
| Content Type       | API ID                                 |
|--------------------|----------------------------------------|
| Article            | `api::article.article`                 |
| Podcast Episode    | `api::podcast-episode.podcast-episode` |
| Book               | `api::book.book`                       |
| Case Study         | `api::case-study.case-study`           |
| Author             | `api::author.author`                   |
| Category           | `api::category.category`               |
| Tag                | `api::tag.tag`                         |
| Company            | `api::company.company`                 |

### System
| Content Type          | API ID                                       |
|-----------------------|----------------------------------------------|
| Newsletter Subscriber | `api::newsletter-subscriber.newsletter-subscriber` |
| Podcast Import        | `api::podcast-import.podcast-import`         |
| Import Job            | `api::import-job.import-job`                 |
| Skill Import          | `api::skill-import.skill-import`             |
| Podcast Log           | `api::podcast-log.podcast-log`               |
| Global (single)       | `api::global.global`                         |
| About (single)        | `api::about.about`                           |
| Global Navigation     | `api::global-navigation.global-navigation`   |

## Shared Components
- `shared.seo` — metaTitle, metaDescription, shareImage
- `shared.media` — file with alt text
- `shared.rich-text` — Rich text editor block
- `shared.navigation-link` / `shared.navigation-child` / `shared.navigation-column`

## Content Type Pattern
All content types follow the same structure:
```
src/api/{name}/
├── content-types/{name}/
│   ├── schema.json          # Field definitions, relations, enums
│   └── lifecycles.ts        # Optional lifecycle hooks
├── controllers/{name}.ts    # Factory controller (createCoreController)
├── routes/{name}.ts         # Factory routes (createCoreRouter)
└── services/{name}.ts       # Factory service (createCoreService)
```

Standard fields across types: `name`, `slug` (uid), `description`, `status` (live/beta/concept), `visibility` (public/private), `source` (internal/external/partner), `seo` component.

## Lifecycle Hooks
Active in: `podcast-import`, `import-job`, `skill-import` — handle async CSV import processing.

## Import Scripts
```bash
node scripts/import-catalog.js       # Import agents/skills from CSV
node scripts/import-mcp-registry.js  # Sync MCP servers from registry
node scripts/seed.js                 # Seed example data
node scripts/import-skills.js        # Import skills data
```

## API Config
- Default limit: 25 results
- Max limit: 100 results
- `withCount: true` by default

## Build & Validation
```bash
npm run build      # Compile TypeScript to dist/
npm run develop    # Start dev server with auto-reload
npm run strapi     # Strapi CLI commands
```

## Environment Variables
Required (see `.env.example`):
- `HOST`, `PORT` — Server config
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET` — Security
- `DATABASE_CLIENT`, `DATABASE_URL` — Database (defaults to SQLite)

## Git
- **Remote:** https://github.com/saitejesh-cyber/colaberry-ai-cms-fork
