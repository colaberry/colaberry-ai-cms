# Colaberry AI — Constitution

> Immutable architectural principles governing all specifications and implementations.
> These rules CANNOT be overridden by individual feature specs.
> Every spec, plan, and task MUST comply with this document.

---

## Article 1: Technology Stack (Non-Negotiable)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.x | **Pages Router only** — NOT App Router |
| UI Library | React | 19.x | Functional components + hooks only |
| Language | TypeScript | 5.x | Strict mode enabled, no `any` types |
| Styling | Tailwind CSS | 4.x | + PostCSS, CSS custom properties in `globals.css` |
| Fonts | Inter | via `next/font/google` | Variable `--font-inter`, all text uses Inter |
| CMS | Strapi | v5 | Headless, fetched via `src/lib/cms.ts` using `NEXT_PUBLIC_CMS_URL` |
| Deployment | Docker + Vercel | — | Vercel-compatible builds required |

**Violations:** Using App Router, class components, JavaScript (non-TS), or inline `<style>` tags is forbidden.

---

## Article 2: Design System Law — Zinc Monochrome + Coral Accent

### 2.1 Color Palette

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FFFFFF` | `#09090B` (zinc-950) |
| Surface | `#FAFAFA` (zinc-50) | `#18181B` (zinc-900) |
| Text primary | `#18181B` (zinc-900) | `#FAFAFA` (zinc-50) |
| Text muted | `#71717A` (zinc-500) | `#A1A1AA` (zinc-400) |
| Border | `#E4E4E7` (zinc-200) | `#3F3F46` (zinc-700) |
| Accent (coral) | `#DC2626` | `#F87171` |

### 2.2 Coral Usage Rule

Coral `#DC2626` is used **ONLY** for:
- CTA buttons (primary action)
- Small accent indicator dots

Everything else uses the zinc scale. No exceptions.

### 2.3 Forbidden Colors

The following Tailwind color families are **BANNED** from all page and component code:

| Forbidden | Reason | Use Instead |
|-----------|--------|-------------|
| `emerald-*` | No green for status/success | zinc equivalents |
| `green-*` | No green indicators | zinc equivalents |
| `blue-*` | No blue headings/accents | zinc equivalents |
| `amber-*` | No amber badges | zinc equivalents |
| `slate-*` | Wrong gray scale | zinc equivalents |

**Exception:** `text-red-600` for error states only. `config.categoryColors` for SVG category node fills (content-type-specific by design).

---

## Article 3: Content Architecture

### 3.1 Five Content Types

| Type | Categories | Taxonomy File | Collections |
|------|-----------|--------------|-------------|
| Skills | 10 | `src/data/skill-taxonomy.ts` | 6+ |
| MCPs | 9 | `src/data/mcp-taxonomy.ts` | 6 |
| Agents | 8 | `src/data/agent-taxonomy.ts` | 6 |
| Podcasts | 8 | `src/data/podcast-taxonomy.ts` | 6 |
| Tools | 12 | `src/data/tool-taxonomy.ts` | 5 |

### 3.2 SkillNet 3-Layer Pattern (Mandatory)

Every content type follows three layers:

1. **Taxonomy** — Category classification with `classifyX()` functions
2. **Relation Graph** — Typed relationships between items (similar_to, depend_on, etc.)
3. **Collections** — Curated groupings with metadata, tags, difficulty

### 3.3 Generic Page Templates

All content types use these shared templates (accept `ContentOntologyConfig`):

| Template | Purpose |
|----------|---------|
| `OntologyPageTemplate` | 3-layer SVG ontology diagram |
| `GraphPageTemplate` | ForceGraph2D + controls |
| `CollectionsPageTemplate` | Searchable collections listing |
| `CollectionDetailTemplate` | Collection detail + embedded graph |

### 3.4 CMS-First Data Strategy

- Primary: Fetch from Strapi v5 via `src/lib/cms.ts`
- Fallback: Static data in `src/data/` when CMS unavailable
- All data fetching via `getStaticProps` (SSG preferred)

### 3.5 Cross-Type Relationships

| From | To | Relation |
|------|----|----------|
| Agent | Skill | USES |
| Agent | MCP | CONNECTS_VIA |
| MCP | Tool | PROVIDES |
| Skill | Tool | IMPLEMENTED_BY |
| Podcast | Agent/MCP/Skill/Tool | DISCUSSES |

---

## Article 4: Page Structure Standard

Every new page MUST include:

1. **`.reveal` wrapper** on the hero section
2. **`SectionHeader`** component with `size="xl"`, `kicker`, `title`, `description`
3. **`.surface-panel`** wrapper around filter/search bars
4. **`.stagger-grid`** class on all card grids
5. **`.reveal`** wrapper on every major section
6. **`EnterpriseCtaBand`** at page bottom
7. **`ContentTypeIcon`** for content type icons — never emoji

### Locked Component Classes

| Class | Usage |
|-------|-------|
| `.catalog-card` | Listing cards (1px border, no hover lift) |
| `.surface-panel` | Filter/search panels |
| `.chip-brand` | Active filter (coral accent) |
| `.chip-neutral` | Default filter (zinc scale) |
| `.detail-section` | Content sections on detail pages |

---

## Article 5: Animation Constraints

| Property | Value |
|----------|-------|
| Max duration | 0.4s |
| Translate distance | 12px translateY |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` |

### Critical Nesting Rule

**NEVER** nest `.reveal-scale` or `.stagger-grid` inside a `.reveal` parent.

IntersectionObserver only observes top-level `.reveal` elements. Nested animated children remain invisible (white space bug).

---

## Article 6: Dark Mode

- Toggle: `.dark` class on `<html>`, persisted in localStorage
- CSS vars swap between `:root` and `.dark` blocks in `globals.css`
- Components use `dark:` Tailwind variants for overrides
- **Every component MUST support both light and dark mode**

---

## Article 7: Security Principles

1. No secrets in client-side code (no API keys in `NEXT_PUBLIC_*` beyond CMS URL)
2. All API routes (`src/pages/api/`) must implement rate limiting
3. Input sanitization on all user-facing inputs
4. CSP headers on all responses
5. No `dangerouslySetInnerHTML` without explicit sanitization

---

## Article 8: Quality Gates

Every change MUST pass ALL gates before merge:

```bash
npm run build        # 0 errors — production build
npx tsc --noEmit     # 0 errors — type safety
npm run lint         # 0 errors — code quality
```

Additionally:
- Light mode visual verification
- Dark mode visual verification
- Mobile responsive check (375px minimum)

---

## Article 9: Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `CollectionGraph.tsx` |
| Pages | kebab-case | `solution-stacks/index.tsx` |
| Utilities | camelCase | `buildGraphData()` |
| CSS classes | kebab-case | `.catalog-card` |
| Types/Interfaces | PascalCase | `ContentOntologyConfig` |
| Constants | UPPER_SNAKE | `CATEGORY_COLORS` |
| Spec directories | kebab-case | `specs/user-dashboard/` |

---

## Amendment Process

This Constitution can only be amended by explicit team consensus. Individual specs, plans, or tasks cannot override these principles. If a spec conflicts with the Constitution, the Constitution wins.
