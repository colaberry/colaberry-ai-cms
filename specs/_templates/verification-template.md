# Verification: [Feature Name]

## References
- **Spec:** `specs/{feature-name}/spec.md`
- **Plan:** `specs/{feature-name}/plan.md`
- **Tasks:** `specs/{feature-name}/tasks.md`

---

## 1. Build Verification

| Check | Command | Status |
|-------|---------|--------|
| Production build | `npm run build` | Pass / Fail |
| Type safety | `npx tsc --noEmit` | Pass / Fail |
| Lint | `npm run lint` | Pass / Fail |
| Tests | `npx vitest run` | Pass / Fail / N/A |

---

## 2. Functional Verification

### User Story Traceability

| User Story | Acceptance Criteria | Task # | Status |
|-----------|---------------------|--------|--------|
| US-1 | [Criterion 1] | Task 3 | Pass / Fail |
| US-1 | [Criterion 2] | Task 3 | Pass / Fail |
| US-2 | [Criterion 1] | Task 4 | Pass / Fail |

### Feature Verification Steps

| # | Step | Expected Result | Actual Result | Status |
|---|------|----------------|---------------|--------|
| 1 | Navigate to [route] | Page loads without errors | | Pass / Fail |
| 2 | [User action] | [Expected outcome] | | Pass / Fail |
| 3 | [User action] | [Expected outcome] | | Pass / Fail |

---

## 3. Design System Compliance

### Color Compliance
- [ ] No `emerald-*` classes in new/modified files
- [ ] No `green-*` classes in new/modified files
- [ ] No `blue-*` classes in new/modified files (except links if applicable)
- [ ] No `amber-*` classes in new/modified files
- [ ] No `slate-*` classes in new/modified files
- [ ] Coral `#DC2626` used only for CTAs and small accent dots
- [ ] All text uses zinc scale

**Grep verification:**
```bash
grep -rn "emerald\|green-[3-7]00\|text-blue-[4-6]00\|amber-\|slate-" [files] --include="*.tsx"
# Expected: 0 matches
```

### Component Compliance
- [ ] Buttons are pill-shaped (`rounded-full`)
- [ ] Cards use `.catalog-card` or `.surface-panel`
- [ ] Chips use `.chip-brand` (active) or `.chip-neutral` (default)
- [ ] No `translateY` hover on cards
- [ ] No glassmorphism or hover lift effects

### Page Structure Compliance
- [ ] `.reveal` wrapper on hero section
- [ ] `SectionHeader` with `size="xl"`, kicker, title, description
- [ ] `.surface-panel` for filter/search bars
- [ ] `.stagger-grid` on card grids
- [ ] `.stagger-grid` NOT nested inside `.reveal`
- [ ] `.reveal` on each major section
- [ ] `EnterpriseCtaBand` at page bottom
- [ ] `ContentTypeIcon` for content type icons (no emoji)

### Animation Compliance
- [ ] All animations <= 0.4s duration
- [ ] translateY <= 12px
- [ ] No `.reveal-scale` nested inside `.reveal`
- [ ] No `.stagger-grid` nested inside `.reveal`

---

## 4. Visual Verification

### Light Mode
| Page/Section | Renders Correctly | Notes |
|-------------|-------------------|-------|
| Hero section | Yes / No | |
| Filter/search bar | Yes / No | |
| Card grid | Yes / No | |
| CTA band | Yes / No | |
| Footer | Yes / No | |

### Dark Mode
| Page/Section | Renders Correctly | Notes |
|-------------|-------------------|-------|
| Hero section | Yes / No | |
| Filter/search bar | Yes / No | |
| Card grid | Yes / No | |
| CTA band | Yes / No | |
| Footer | Yes / No | |

### Dark Mode Toggle
- [ ] Toggle switches correctly
- [ ] State persists after page reload
- [ ] No flash of wrong theme on load

---

## 5. Responsive Verification

| Breakpoint | Width | Layout Correct | Overflow Issues | Touch Targets |
|-----------|-------|----------------|-----------------|---------------|
| Mobile | 375px | Yes / No | None / [describe] | Yes / No |
| Tablet | 768px | Yes / No | None / [describe] | Yes / No |
| Desktop | 1280px | Yes / No | None / [describe] | N/A |
| Wide | 1920px | Yes / No | None / [describe] | N/A |

---

## 6. Accessibility

- [ ] Semantic HTML (proper heading hierarchy: h1 → h2 → h3)
- [ ] All images have `alt` text
- [ ] Interactive elements have ARIA labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Sufficient color contrast (4.5:1 minimum for text)
- [ ] Screen reader tested (VoiceOver / NVDA)

---

## 7. Performance

- [ ] No unnecessary re-renders (React DevTools profiler)
- [ ] Images optimized (WebP via `next/image`)
- [ ] Heavy components use dynamic import (`next/dynamic`)
- [ ] No layout shifts (CLS < 0.1)
- [ ] Page load < 3s on fast 3G (Lighthouse)

---

## 8. Edge Cases

| # | Edge Case | Expected Behavior | Actual Behavior | Status |
|---|-----------|-------------------|-----------------|--------|
| EC-1 | [Empty state — no data] | [Expected] | | Pass / Fail |
| EC-2 | [Search with no results] | [Expected] | | Pass / Fail |
| EC-3 | [Very long text] | [Expected] | | Pass / Fail |
| EC-4 | [CMS unavailable] | [Expected] | | Pass / Fail |
| EC-5 | [Invalid URL] | [Expected] | | Pass / Fail |

---

## 9. Summary

| Category | Total Checks | Passed | Failed | Blocked |
|----------|-------------|--------|--------|---------|
| Build | | | | |
| Functional | | | | |
| Design System | | | | |
| Visual | | | | |
| Responsive | | | | |
| Accessibility | | | | |
| Performance | | | | |
| Edge Cases | | | | |
| **Total** | | | | |

### Overall Status: PASS / FAIL / BLOCKED

### Issues Found
1. [Issue description — severity, steps to reproduce]

### Sign-Off
- [ ] Developer verified
- [ ] Design review passed
- [ ] QA approved
- [ ] Ready for merge
