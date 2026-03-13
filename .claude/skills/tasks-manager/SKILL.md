---
name: task-manager
description: Skill for planning, tracking, and managing development tasks in a tasks.md file at the project root. Use this skill BEFORE starting any coding work on the Antibody Repository Tool project. It reads CLAUDE.md to understand the full specification, breaks it down into ordered development tasks, writes them to tasks.md, and keeps that file updated as work progresses. Trigger this skill whenever the user mentions tasks, planning, task list, todo, progress, next step, what to do next, or wants to organize development work.
---

# Task Manager Skill

This skill manages the development task list for the project. It generates, tracks, and updates a `tasks.md` file in the project root directory.

## When to Use

- **Before starting development**: Read CLAUDE.md → generate the full task breakdown → write tasks.md
- **During development**: After completing a task, update its status in tasks.md
- **When asked "what's next"**: Read tasks.md, find the next pending task, and start working on it

## tasks.md Format

The file uses a strict format so it can be parsed reliably:

```markdown
# Project Tasks — Antibody Repository Tool

> Auto-generated from CLAUDE.md. Do not edit manually.
> Last updated: YYYY-MM-DD HH:MM

## Summary
- Total: N
- Done: N
- In Progress: N
- Pending: N

---

## Phase 1 — Project Setup
- [x] 1.1 — Initialize project (Vite + React frontend, Express backend, folder structure)
- [x] 1.2 — Set up SQLite database with better-sqlite3 and migration system
- [ ] 1.3 — Description of task
...

## Phase 2 — Section Name
- [ ] 2.1 — Description of task
...
```

### Status markers
- `[ ]` = Pending
- `[~]` = In Progress
- `[x]` = Done

## Task Generation Rules

When generating tasks from CLAUDE.md, follow these principles:

### 1. Logical ordering with dependencies
Tasks must be ordered so that no task depends on an uncompleted task. The phases should follow this sequence:

```
Phase 1 — Project Setup & Configuration
Phase 2 — Database Schema & Migrations
Phase 3 — Authentication (JWT, roles, middleware)
Phase 4 — Laboratories CRUD (API + UI)
Phase 5 — Antibody Inventory (API + UI + form)
Phase 6 — Experiments (API + UI + antibody selection + titration calc)
Phase 7 — Experiment Status Transitions & Inventory Deduction
Phase 8 — Low Stock Alerts
Phase 9 — Billing Module & PDF Generation
Phase 10 — Repository Public View (User role)
Phase 11 — Seed Data & Testing
Phase 12 — Polish & Final Review
```

### 2. Task granularity
Each task should be **one coherent unit of work** that can be completed and tested independently. Rules of thumb:
- A backend API endpoint + its validation = 1 task
- A frontend page/component with its state management = 1 task
- Wiring a frontend page to its API = 1 task
- A complex feature (e.g. experiment execution with inventory deduction) may be split into: backend logic, frontend UI, integration

### 3. Each task description must be actionable
Bad: `Set up database`
Good: `Create SQLite database initialization with better-sqlite3, write migration for laboratories table with columns: id, name, pi_name, email, billing_address`

### 4. Reference CLAUDE.md sections
Each task should note which section of CLAUDE.md it implements, e.g.:
```
- [ ] 5.3 — Build antibody add form with all fields from §8 of CLAUDE.md (lab dropdown, tube number, species, target, clone, company, order number, lot number, fluorochrome, processing, panel, volume, cost, quality color). Auto-calculate chf_per_ul.
```

## Workflow

### Generating tasks.md (first time)

1. Read `CLAUDE.md` from project root
2. Break the specification into phases and tasks following the ordering above
3. Write `tasks.md` to project root
4. Report summary to user

### Updating task status

When a task is completed:
1. Read current `tasks.md`
2. Change `[ ]` or `[~]` to `[x]` for the completed task
3. If starting a new task, mark it `[~]`
4. Update the Summary counts at the top
5. Update the "Last updated" timestamp
6. Write the file back

### Checking progress

When asked about progress:
1. Read `tasks.md`
2. Report: how many done, in progress, pending
3. State the current/next task to work on
4. Flag any blockers (e.g. a dependency not yet completed)

## Important Notes

- **Never delete tasks** — only change their status
- **Never reorder tasks** — the order is set at generation time based on dependencies
- **Add tasks** only if the user explicitly requests a new feature not in CLAUDE.md — append them at the end of the relevant phase with the next available number
- **tasks.md is the single source of truth** for what has been done and what remains