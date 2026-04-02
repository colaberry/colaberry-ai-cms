# Colaberry AI CMS

Headless CMS built with Strapi v5, powering colaberry.ai content. Deployed on GCP Cloud Run.

## Prerequisites

- Node.js 20+
- Docker (optional, for containerized development with PostgreSQL)

## Quick Start

```bash
npm install
npm run develop
```

Open [http://localhost:1337/admin](http://localhost:1337/admin).

By default, Strapi uses SQLite for local development. No database setup required.

## Docker (with PostgreSQL)

```bash
docker compose up
```

This starts Strapi + PostgreSQL 16. CMS available at [http://localhost:1337](http://localhost:1337).

```bash
docker compose down -v  # Stop and remove volumes
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_CLIENT` | `sqlite` | Database client (`sqlite` or `postgres`) |
| `DATABASE_HOST` | — | PostgreSQL host (Docker: `db`) |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_NAME` | — | Database name |
| `DATABASE_USERNAME` | — | Database user |
| `DATABASE_PASSWORD` | — | Database password |
| `HOST` | `0.0.0.0` | Strapi listen host |
| `PORT` | `1337` | Strapi listen port |
| `AUTH0_DOMAIN` | — | Auth0 domain for SSO |
| `AUTH0_CLIENT_ID` | — | Auth0 client ID |
| `AUTH0_CLIENT_SECRET` | — | Auth0 client secret |

## Content Types

- **Agents** — AI agent catalog entries
- **MCP Servers** — Model Context Protocol server listings
- **Skills** — AI skill definitions (16,900+)
- **Podcasts** — Episode metadata and transcripts
- **Tools** — AI tool catalog
- **Use Cases** — Industry use case writeups
- **Industries** — Industry vertical definitions
- **Collections** — Curated content groupings

## Branch Strategy

| Branch | Deploys to | Service |
|--------|-----------|---------|
| `Release-1.0.beta` | dev CMS | `colaberry-ai-cms` |
| `Release-1.0` | prod CMS | `colaberry-ai-cms-prod` |

Pushes to these branches trigger Cloud Build automatically.

## Build

```bash
npm run build    # Build admin panel
npm run start    # Start production server
npm run develop  # Start with auto-reload
```
