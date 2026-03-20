# Spec-Driven Development (SDD) Guide

> Engineering beyond vibe coding. Every feature starts with a specification.

---

## What is Spec-Driven Development?

SDD replaces ad-hoc "vibe coding" with a structured 4-phase workflow. Instead of describing a goal in a few sentences and hoping AI generates the right code, you create a detailed specification that acts as a contract — defining behavior, constraints, and requirements before any code is generated.

**Vibe Coding:** "Tell the AI something, hope it works, debug after."
**Spec-Driven:** "Write clear specs first, generate code from that clarity, review small tasks."

---

## The 4-Phase Workflow

### Phase 1: Specify → `@spec-writer`

Create a `spec.md` that defines **WHAT** and **WHY** — never **HOW**.

```
Input:  Feature request or user story
Output: specs/{feature-name}/spec.md
Agent:  @spec-writer
```

The spec includes user stories with acceptance criteria, requirements tables, UI/UX checklists, edge cases, and out-of-scope items.

### Phase 2: Plan → `@spec-planner`

Generate a `plan.md` that defines **HOW** to implement the spec.

```
Input:  spec.md + Constitution.md + codebase exploration
Output: specs/{feature-name}/plan.md
Agent:  @spec-planner
```

The plan includes architecture decisions, file change lists, data models, component hierarchies, and testing strategies.

### Phase 3: Tasks → `@spec-tasks`

Break the plan into small, independently reviewable tasks.

```
Input:  plan.md + spec.md
Output: specs/{feature-name}/tasks.md
Agent:  @spec-tasks
```

Each task changes 1-3 files, has clear acceptance criteria, is assigned to a specific agent, and includes verification commands.

### Phase 4: Implement → Existing Agents

Execute tasks one at a time using existing specialized agents.

```
Input:  Individual task from tasks.md
Agents: @frontend-dev, @testing, @content-gen, @ui-ux-spec, @asset-gen
```

Developer reviews each task before moving to the next. Quality gates run after each task.

### Quality Review → `@spec-reviewer`

At any point, invoke `@spec-reviewer` to validate document quality, completeness, and cross-document consistency.

---

## Directory Structure

```
specs/
├── README.md                          # This file
├── _templates/                        # Template files (do not modify)
│   ├── spec-template.md               # Specification template
│   ├── plan-template.md               # Technical plan template
│   ├── tasks-template.md              # Task breakdown template
│   └── verification-template.md       # Verification checklist template
│
├── {feature-name}/                    # One directory per feature
│   ├── spec.md                        # The specification (Phase 1)
│   ├── plan.md                        # Technical plan (Phase 2)
│   ├── tasks.md                       # Task breakdown (Phase 3)
│   ├── verification.md                # Verification checklist (optional)
│   ├── research.md                    # Research notes (optional)
│   ├── data-model.md                  # Data model details (optional)
│   ├── api.md                         # API contract details (optional)
│   └── components.md                  # Component hierarchy (optional)
│
└── {another-feature}/
    └── [same structure]
```

---

## Naming Conventions

- **Feature directories:** kebab-case (e.g., `specs/user-dashboard/`, `specs/podcast-search/`)
- **Always start with:** `spec.md` → `plan.md` → `tasks.md` (in order)
- **Optional files:** Only create when the feature warrants additional detail

---

## Quick Start

### New Feature

1. Create the spec:
   ```
   @spec-writer Create a spec for [feature description]
   ```

2. Generate the plan:
   ```
   @spec-planner Create a plan for specs/{feature-name}/spec.md
   ```

3. Break into tasks:
   ```
   @spec-tasks Create tasks for specs/{feature-name}/plan.md
   ```

4. Review (optional but recommended):
   ```
   @spec-reviewer Review specs/{feature-name}/
   ```

5. Implement task by task:
   ```
   @frontend-dev Implement Task 1 from specs/{feature-name}/tasks.md
   ```

---

## Integration with Existing Agents

| Phase | SDD Agent | Hands Off To |
|-------|-----------|--------------|
| Specify | `@spec-writer` | — |
| Plan | `@spec-planner` | — |
| Tasks | `@spec-tasks` | Assigns to implementation agents |
| Implement | — | `@frontend-dev`, `@testing`, `@content-gen`, `@ui-ux-spec`, `@asset-gen` |
| Review | `@spec-reviewer` | — |

The SDD workflow sits **upstream** of existing agents. It feeds them structured, reviewed work instead of ad-hoc instructions.

---

## Constitution

All specs must comply with `Constitution.md` at the project root. The Constitution defines immutable architectural principles (tech stack, design system, page structure, quality gates) that no individual spec can override.

---

## When to Use SDD

| Scenario | Use SDD? |
|----------|----------|
| New page or feature | Yes |
| Major refactor | Yes |
| New content type | Yes |
| Bug fix (1-2 files) | No — fix directly |
| Copy/text change | No — fix directly |
| Design system update | Yes — affects many pages |
| Security fix | Depends on scope |
