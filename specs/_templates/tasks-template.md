# Tasks: [Feature Name]

## References
- **Spec:** `specs/{feature-name}/spec.md`
- **Plan:** `specs/{feature-name}/plan.md`

---

## Task Summary

| # | Task | Status | Agent | Depends On |
|---|------|--------|-------|------------|
| 1 | [Title] | TODO | @frontend-dev | — |
| 2 | [Title] | TODO | @frontend-dev | Task 1 |
| 3 | [Title] | TODO | @frontend-dev | Task 2 |
| 4 | [Title] | TODO | @testing | Task 3 |

**Status values:** TODO | IN PROGRESS | IN REVIEW | DONE

---

## Tasks

### Task 1: [Title — e.g., "Create TypeScript interfaces"]

**Agent:** @frontend-dev
**Status:** TODO
**Depends on:** None
**Spec requirements:** FR-1, FR-2

**Description:**
[2-3 sentences describing exactly what to do. Be specific about the approach.]

**Files to change:**
- `src/lib/[file].ts` — [what to add/modify]

**Acceptance Criteria:**
- [ ] [Criterion 1 — specific and testable]
- [ ] [Criterion 2]
- [ ] `npx tsc --noEmit` passes

**Verification:**
```bash
npx tsc --noEmit    # Type check passes
npm run build       # Build passes
```

---

### Task 2: [Title — e.g., "Create utility functions"]

**Agent:** @frontend-dev
**Status:** TODO
**Depends on:** Task 1
**Spec requirements:** FR-3

**Description:**
[2-3 sentences]

**Files to change:**
- `src/lib/[file].ts` — [what to add/modify]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] `npx tsc --noEmit` passes

**Verification:**
```bash
npx tsc --noEmit
npm run build
```

---

### Task 3: [Title — e.g., "Create page component"]

**Agent:** @frontend-dev
**Status:** TODO
**Depends on:** Task 1, Task 2
**Spec requirements:** FR-1, FR-4, US-1

**Description:**
[2-3 sentences]

**Files to change:**
- `src/components/[Name].tsx` — [what to create]
- `src/pages/[path].tsx` — [what to create/modify]

**Acceptance Criteria:**
- [ ] Page renders in light mode without errors
- [ ] Page renders in dark mode without errors
- [ ] Design system compliance (zinc + coral only)
- [ ] Page structure follows standard (.reveal, .stagger-grid, EnterpriseCtaBand)
- [ ] `npm run build` passes

**Verification:**
```bash
npm run build
npx tsc --noEmit
npm run lint
# Visual: check localhost:3000/[route] in light + dark mode
```

---

### Task 4: [Title — e.g., "Write tests"]

**Agent:** @testing
**Status:** TODO
**Depends on:** Task 3
**Spec requirements:** NFR-1, NFR-2

**Description:**
[2-3 sentences]

**Files to change:**
- `src/components/__tests__/[Name].test.tsx` — [what to test]

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] All prop variants tested
- [ ] Edge cases covered (empty data, long text)
- [ ] `npx vitest run` passes

**Verification:**
```bash
npx vitest run
npm run build
```

---

## Quality Gates (Run After All Tasks)

### Build & Type Safety
- [ ] `npm run build` — 0 errors
- [ ] `npx tsc --noEmit` — 0 type errors
- [ ] `npm run lint` — 0 lint errors

### Visual Verification
- [ ] Light mode — all sections render correctly
- [ ] Dark mode — all sections render correctly
- [ ] Mobile (375px) — layout responsive
- [ ] Desktop (1280px) — layout correct

### Design System Compliance
- [ ] No forbidden colors in new/modified files
- [ ] Coral accent used only for CTAs
- [ ] Locked component classes used correctly
- [ ] Animation nesting rule not violated
- [ ] `ContentTypeIcon` used (no emoji)

### Traceability
- [ ] All spec user stories have corresponding tasks
- [ ] All plan file changes have corresponding tasks
- [ ] All acceptance criteria are verified
