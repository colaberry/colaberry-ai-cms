# Plan: [Feature Name]

## Spec Reference
- **Spec:** `specs/{feature-name}/spec.md`
- **Status:** Draft | Approved

---

## Architecture Decision

### Chosen Approach

[1-2 paragraphs describing the chosen technical approach. Explain WHY this approach was chosen, not just what it does.]

### Alternatives Considered

| # | Option | Pros | Cons | Decision |
|---|--------|------|------|----------|
| A | [Approach A] | [advantages] | [disadvantages] | **Chosen** |
| B | [Approach B] | [advantages] | [disadvantages] | Rejected |
| C | [Approach C] | [advantages] | [disadvantages] | Rejected |

---

## Constitution Compliance

### Technology Stack
- [ ] Uses Pages Router (NOT App Router)
- [ ] TypeScript strict mode, no `any` types
- [ ] Tailwind CSS utilities (no inline styles)
- [ ] CMS data via `src/lib/cms.ts` with static fallback

### Design System
- [ ] Zinc monochrome + coral `#DC2626` accent only
- [ ] No forbidden colors (emerald, green, blue, amber, slate)
- [ ] Both light and dark mode supported
- [ ] Pill-shaped buttons, 1px border cards

### Page Structure
- [ ] `.reveal` hero + `SectionHeader`
- [ ] `.surface-panel` for filters
- [ ] `.stagger-grid` on grids (not nested in `.reveal`)
- [ ] `EnterpriseCtaBand` at bottom
- [ ] `ContentTypeIcon` for icons

### Patterns
- [ ] SkillNet 3-layer pattern where applicable
- [ ] Generic templates reused where applicable
- [ ] `getStaticProps` for data fetching (SSG)

---

## Data Model

### New TypeScript Interfaces

```typescript
// Define new types/interfaces here
// Follow existing patterns in src/lib/ontologyTypes.ts

interface ExampleType {
  id: string;
  name: string;
  slug: string;
  // ...
}
```

### Existing Types to Reuse

| Type | File | Usage |
|------|------|-------|
| `ContentOntologyConfig` | `src/lib/ontologyTypes.ts` | [how it's used] |
| [Other type] | [file path] | [usage] |

---

## Component Hierarchy

```
PageComponent
├── SectionHeader (kicker, title, description)
├── FilterSection (.surface-panel)
│   ├── SearchInput
│   └── CategoryPills (.chip-brand / .chip-neutral)
├── ContentGrid (.stagger-grid)
│   └── ItemCard (.catalog-card) × N
└── EnterpriseCtaBand
```

### Existing Components to Reuse

| Component | File | Reuse Type |
|-----------|------|-----------|
| `SectionHeader` | `src/components/SectionHeader.tsx` | Direct use |
| `EnterpriseCtaBand` | `src/components/EnterpriseCtaBand.tsx` | Direct use |
| [Other] | [path] | Direct use / Extend / Wrap |

### New Components to Create

| Component | File | Purpose |
|-----------|------|---------|
| [ComponentName] | `src/components/[Name].tsx` | [what it does] |

---

## File Changes

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/lib/[types].ts` | Create / Modify | [New interfaces or type additions] |
| 2 | `src/lib/[utils].ts` | Create / Modify | [Utility functions] |
| 3 | `src/data/[data].ts` | Create / Modify | [Static data or taxonomy] |
| 4 | `src/components/[Name].tsx` | Create / Modify | [Component implementation] |
| 5 | `src/pages/[path].tsx` | Create / Modify | [Page implementation] |
| 6 | `src/styles/globals.css` | Modify | [New CSS classes if needed] |

---

## API Changes

### New API Routes

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|--------------|
| `/api/[route]` | GET | [description] | Yes / No |

### CMS Content Type Changes

| Content Type | Change | Fields |
|-------------|--------|--------|
| [Type] | Create / Modify | [field list] |

*(Write "None" if no API or CMS changes needed)*

---

## Testing Strategy

### Unit Tests
- [ ] [Component] — renders correctly with all prop variants
- [ ] [Utility function] — returns expected output for edge cases

### Integration Tests
- [ ] [Page] — renders with mock CMS data
- [ ] [Feature] — user flow works end-to-end

### Manual Verification
- [ ] Light mode visual check
- [ ] Dark mode visual check
- [ ] Mobile responsive (375px)
- [ ] All interactive elements work (clicks, hovers, toggles)

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R-1 | [Risk description] | Low/Med/High | Low/Med/High | [Mitigation strategy] |
| R-2 | [Risk description] | Low/Med/High | Low/Med/High | [Mitigation strategy] |

---

## Estimated Effort

| Phase | Estimated Tasks | Complexity |
|-------|----------------|------------|
| Types/Data | [N] tasks | Low / Medium / High |
| Components | [N] tasks | Low / Medium / High |
| Pages | [N] tasks | Low / Medium / High |
| Tests | [N] tasks | Low / Medium / High |
| **Total** | **[N] tasks** | — |
