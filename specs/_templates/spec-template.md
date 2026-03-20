# Feature: [Feature Name]

## Status: Draft | In Review | Approved | In Progress | Done

## Overview

[1-2 sentence summary of what this feature does and why it matters to the business or user experience.]

---

## User Stories

### US-1: [Story Title]

**As a** [role — e.g., site visitor, administrator, developer]
**I want to** [action — what the user wants to do]
**So that** [benefit — why they want to do it]

**Acceptance Criteria:**
- [ ] [Criterion 1 — must be testable]
- [ ] [Criterion 2 — must be testable]
- [ ] [Criterion 3 — must be testable]

### US-2: [Story Title]

**As a** [role]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR-1 | [Description — specific, testable] | Must | US-1 |
| FR-2 | [Description] | Must | US-1 |
| FR-3 | [Description] | Should | US-2 |
| FR-4 | [Description] | Could | — |

### Non-Functional Requirements

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-1 | Page load time | < 2s on 3G | Lighthouse audit |
| NFR-2 | Accessibility | WCAG 2.1 AA | axe-core scan |
| NFR-3 | SEO | Meta tags present | Build-time check |
| NFR-4 | Bundle size | No regression > 5% | Build output |

---

## UI/UX Requirements

### Design System Compliance (from Constitution.md)
- [ ] Uses zinc monochrome + coral `#DC2626` accent only
- [ ] No forbidden colors (emerald, green, blue, amber, slate)
- [ ] Both light and dark mode supported
- [ ] Responsive at 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Uses locked component classes (`.catalog-card`, `.surface-panel`, `.chip-brand`, `.chip-neutral`)
- [ ] Pill-shaped buttons (`rounded-full`), no `translateY` hover
- [ ] Cards: 1px borders, no glassmorphism, no hover lift

### Page Structure Compliance
- [ ] `.reveal` wrapper on hero section with `SectionHeader` (`size="xl"`, kicker, title, description)
- [ ] `.surface-panel` for filter/search bars
- [ ] `.stagger-grid` on card grids (NOT nested inside `.reveal`)
- [ ] `.reveal` on each major section
- [ ] `EnterpriseCtaBand` at page bottom
- [ ] `ContentTypeIcon` for content type icons (never emoji)

### Wireframe / Layout Description

[Describe the visual layout in words, or reference a Figma link. Include:
- Section order (top to bottom)
- Grid layout (columns at each breakpoint)
- Key visual elements (icons, badges, cards, graphs)
- Interactive elements (filters, search, toggles)]

---

## Edge Cases

| # | Case | Expected Behavior |
|---|------|-------------------|
| EC-1 | [Empty state — no data] | [Show empty state message, no errors] |
| EC-2 | [Search with no results] | [Show "No results found" message] |
| EC-3 | [Very long text content] | [Truncate with ellipsis or expand] |
| EC-4 | [CMS unavailable] | [Fall back to static data] |
| EC-5 | [Invalid URL parameter] | [404 page or redirect] |

---

## Out of Scope

- [Feature/behavior explicitly NOT included in this spec]
- [Future enhancement deferred to a separate spec]
- [Related feature that is someone else's responsibility]

---

## Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| [CMS content type exists] | Data | Ready / Pending |
| [API endpoint available] | Backend | Ready / Pending |
| [Component X exists] | Frontend | Ready / Pending |
| [Design approved] | Design | Ready / Pending |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| [Page loads without error] | 100% | Production monitoring |
| [User engagement] | [target] | Analytics |
| [Build time impact] | < 5% regression | CI pipeline |

---

## Open Questions

- [ ] [Question 1 — needs answer before planning can begin]
- [ ] [Question 2 — needs stakeholder input]
