# CLAUDE.md — Antibody Repository Tool

## Project Overview

Web-based tool for managing antibodies used in MACSima experiments. The system tracks inventory, plans experiments, calculates costs, deducts stock, and generates billing summaries per laboratory.

**Tech stack**: Angular 17+ (standalone components) + Node.js/Express + PostgreSQL. No external auth provider — simple username/password with bcrypt + JWT sessions.

---

## 1. User Roles

### Admin
- Full access to all features
- Manage antibody inventory (add, edit, delete)
- Create experiments, select antibodies, set titrations
- Change experiment status (Planning → Executed Not Billed → Executed Billed)
- Generate billing PDFs
- Assign Quality Color Code to antibodies
- View Low Stock alerts

### User (read-only)
- View the Repository tab only
- Search and filter antibodies (by target, species, clone, fluorochrome, lab, quality)
- Cannot modify anything

### Default credentials (seed on first run)
- Admin: `admin` / `admin` (prompt change on first login)

---

## 2. Database Schema

### 2.1 `laboratories` table

| Column          | Type         | Notes                        |
|-----------------|--------------|------------------------------|
| id              | SERIAL       | PK                           |
| name            | VARCHAR(255) | Unique, NOT NULL             |
| pi_name         | VARCHAR(255) | Principal Investigator       |
| email           | VARCHAR(255) | Contact email                |
| billing_address | TEXT         | For invoices                 |

This is the **single source of truth** for lab names. All references to labs in other tables use `lab_id` (FK).

### 2.2 `antibodies` table

| Column              | Type         | Notes                                  |
|---------------------|--------------|----------------------------------------|
| id                  | SERIAL       | PK                                     |
| lab_id              | INTEGER      | FK → laboratories.id (owner), NOT NULL |
| tube_number         | VARCHAR(100) | Physical tube identifier, UNIQUE       |
| species             | VARCHAR(255) | Target species                         |
| antigen_target      | VARCHAR(255) | Target protein                         |
| clone               | VARCHAR(255) | Antibody clone                         |
| company             | VARCHAR(255) | Vendor                                 |
| order_number        | VARCHAR(255) | Vendor catalog number                  |
| lot_number          | VARCHAR(255) | Production lot                         |
| fluorochrome        | VARCHAR(255) | Fluorescent label                      |
| processing          | TEXT         | Processing info (nullable)             |
| panel               | VARCHAR(255) | Panel association (nullable)           |
| volume_on_arrival   | NUMERIC(10,2)| Initial volume in µL                   |
| current_volume      | NUMERIC(10,2)| Remaining volume in µL                 |
| cost_chf            | NUMERIC(10,2)| Total cost of vial in CHF              |
| chf_per_ul          | NUMERIC(10,4)| **Auto-calculated**: cost_chf / volume_on_arrival |
| quality_color       | VARCHAR(20)  | One of: `none`, `green`, `yellow`, `grey`. Default: `none` |
| created_at          | TIMESTAMPTZ  | Default NOW()                          |

**Important**: Each vial is a distinct record. Even if two vials have the same target/clone/fluorochrome, they are treated as separate antibodies with separate IDs, volumes, and costs.

### 2.3 `experiments` table

| Column                 | Type          | Notes                                      |
|------------------------|---------------|--------------------------------------------|
| id                     | SERIAL        | PK                                         |
| name                   | VARCHAR(255)  | Experiment name, NOT NULL                  |
| date                   | DATE          | Date of experiment                         |
| requesting_lab_id      | INTEGER       | FK → laboratories.id (who commissions it)  |
| status                 | VARCHAR(30)   | `planning` / `executed_not_billed` / `executed_billed` |
| macswell_slides        | INTEGER       | Number of slides used                      |
| total_cocktail_volume  | NUMERIC(10,2) | Total antibody cocktail volume in µL       |
| created_at             | TIMESTAMPTZ   | Default NOW()                              |

### 2.4 `experiment_antibodies` table

| Column          | Type          | Notes                                          |
|-----------------|---------------|-------------------------------------------------|
| id              | SERIAL        | PK                                              |
| experiment_id   | INTEGER       | FK → experiments.id, NOT NULL                   |
| antibody_id     | INTEGER       | FK → antibodies.id, NOT NULL                    |
| titration_ratio | INTEGER       | Denominator of the ratio (e.g. 100 for 1:100)  |
| ul_per_slide    | NUMERIC(10,4) | **Auto-calculated** (see §3)                    |
| total_ul_used   | NUMERIC(10,4) | **Auto-calculated** (see §3)                    |
| total_chf       | NUMERIC(10,4) | **Auto-calculated** (see §3)                    |

---

## 3. Titration Calculation Rules

Given:
- `titration_ratio` = the denominator (user enters e.g. `100` for 1:100)
- `total_cocktail_volume` = from the experiment (e.g. 200 µL)
- `macswell_slides` = from the experiment (e.g. 3)

**Formulas (fixed, non-negotiable):**

```
µL_per_slide = total_cocktail_volume / titration_ratio
total_µL_used = µL_per_slide × macswell_slides
total_CHF = total_µL_used × chf_per_µL
```

**Example:**
- Cocktail volume = 200 µL, Titration = 1:100, Slides = 3
- µL per slide = 200 / 100 = 2.0 µL
- Total µL used = 2.0 × 3 = 6.0 µL
- If CHF/µL = 5.0 → Total CHF = 6.0 × 5.0 = 30.0 CHF

---

## 4. Experiment Status & Transitions

```
Planning  →  Executed Not Billed  →  Executed Billed
```

### Rules:
1. **Planning**: Default status on creation. Antibodies can be added/removed. Titrations can be edited. **No inventory changes.**
2. **Planning → Executed Not Billed**: **IRREVERSIBLE**. On this transition:
   - For each antibody in the experiment: subtract `total_ul_used` from `antibodies.current_volume`
   - Validate that `current_volume` will not go below 0. If it would, **block the transition** and show which antibodies have insufficient volume.
   - This action requires a confirmation dialog: *"This will deduct antibody volumes from inventory. This action cannot be undone. Proceed?"*
3. **Executed Not Billed → Executed Billed**: Marks billing as complete. No inventory changes. Also irreversible.
4. **No backwards transitions allowed.** No undo. No rollback.

### Editing rules by status:
| Status                | Can edit antibodies/titrations? | Can edit experiment metadata? |
|-----------------------|---------------------------------|-------------------------------|
| Planning              | Yes                             | Yes                           |
| Executed Not Billed   | No                              | No                            |
| Executed Billed       | No                              | No                            |

---

## 5. Low Stock Alerts

**Threshold**: `current_volume < 40 µL`

The **Low Stock** tab shows all antibodies below threshold with columns:
- Tube number
- Antigen/Target
- Clone
- Lab owner (name from laboratories table)
- Current volume (µL)
- Company
- Order number

Sorted by current volume ascending (most critical first).

---

## 6. Billing Module

### Trigger
Admin selects an experiment with status `executed_not_billed` and clicks "Generate Billing".

### Logic
1. Group all `experiment_antibodies` by the antibody's `lab_id` (owner lab).
2. For each lab, produce a billing summary containing:
   - Experiment name and date
   - Requesting lab name
   - Table of antibodies owned by that lab:
     - Tube number, Target, Clone, Fluorochrome
     - Total µL used
     - CHF/µL
     - Total CHF
   - **Total cost for that lab** (sum of all Total CHF)
3. Generate one **PDF per lab**.
4. After generating, the admin can mark the experiment as `executed_billed`.

### PDF format
Simple, clean layout:
- Header: "Antibody Usage Invoice" + date
- Experiment info block
- Antibody cost table
- Total at bottom
- Use a library like `pdfkit` or `jspdf` server-side.

---

## 7. UI Structure

### Navigation Tabs (Admin view)
1. **Inventory** — Full antibody table with CRUD. Add antibody via form. Edit inline or via modal. Delete with confirmation.
2. **Experiments** — List of experiments. Create new. Click to open detail view with antibody selection and titration entry.
3. **Low Stock** — Read-only table of antibodies below 40 µL.
4. **Billing** — List experiments with status `executed_not_billed`. Button to generate billing PDFs. History of billed experiments.
5. **Laboratories** — CRUD for labs (name, PI, email, billing address).

### Navigation Tabs (User view)
1. **Repository** — Read-only antibody browser with search and filters (target, species, clone, fluorochrome, lab, quality color). Quality color shown as a colored dot or badge.

---

## 8. Antibody Add Form (Admin)

Simple form with all fields from the antibodies table:
- Lab (dropdown from laboratories table)
- Tube number (text)
- Species (text)
- Antigen/Target (text)
- Clone (text)
- Company (text)
- Order number (text)
- Lot number (text)
- Fluorochrome (text)
- Processing (text, optional)
- Panel (text, optional)
- Volume on arrival (number, µL)
- Cost (number, CHF)
- Quality color (dropdown: None / Green / Yellow / Grey)

`chf_per_ul` is calculated automatically and displayed but not editable.
`current_volume` is initialized to `volume_on_arrival` on creation.

---

## 9. Quality Color Code

| Color  | Meaning            | Display         |
|--------|--------------------|-----------------|
| none   | Not yet evaluated  | No badge        |
| green  | Good quality       | Green dot/badge |
| yellow | Mediocre quality   | Yellow dot/badge|
| grey   | Neutral            | Grey dot/badge  |

Only admins can set/change the quality color (from the Inventory tab).

---

## 10. Experiment Detail View (Admin)

When an admin opens an experiment in `planning` status:

1. **Header**: Experiment name, date, requesting lab, status badge, slides count, cocktail volume.
2. **Antibody selector**: Searchable dropdown/table to pick antibodies from inventory. On selection, auto-fill: tube number, lab, target, clone, fluorochrome, CHF/µL.
3. **Titration input**: For each selected antibody, a field to enter the titration denominator (integer).
4. **Calculated columns** (read-only, update live):
   - µL per slide
   - Total µL used
   - Total CHF
5. **Footer**: Total experiment cost (sum of all antibodies' Total CHF).
6. **Action buttons**:
   - "Save" (persist changes while in Planning)
   - "Execute Experiment" → transitions to `executed_not_billed` with confirmation dialog

---

## 11. API Endpoints (suggested structure)

```
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/laboratories
POST   /api/laboratories
PUT    /api/laboratories/:id
DELETE /api/laboratories/:id

GET    /api/antibodies
GET    /api/antibodies/low-stock
POST   /api/antibodies
PUT    /api/antibodies/:id
DELETE /api/antibodies/:id

GET    /api/experiments
POST   /api/experiments
GET    /api/experiments/:id
PUT    /api/experiments/:id
POST   /api/experiments/:id/execute        (Planning → Executed Not Billed)
POST   /api/experiments/:id/mark-billed    (Executed Not Billed → Executed Billed)

GET    /api/experiments/:id/antibodies
POST   /api/experiments/:id/antibodies
PUT    /api/experiments/:id/antibodies/:eaId
DELETE /api/experiments/:id/antibodies/:eaId

GET    /api/billing/experiment/:id          (generate billing data)
GET    /api/billing/experiment/:id/pdf/:labId  (download PDF for a lab)

GET    /api/repository                      (public, read-only, filtered)
```

All admin endpoints require JWT with admin role. `/api/repository` requires only valid JWT (any role).

---

## 12. Technical Notes

- **Database**: PostgreSQL 15+. Use `pg` (node-postgres) as the driver. Migrations managed via raw SQL files in a `/migrations` folder, run on startup in order. Connection string configurable via `DATABASE_URL` env variable.
- **Backend**: Express.js. JSON API. CORS enabled for dev. Structure: `/server` folder with `routes/`, `controllers/`, `middleware/`, `db/` subfolders.
- **Frontend**: Angular 17+ with standalone components (no NgModules). Use Angular Router for tab navigation. Angular Material for UI components (tables, forms, dialogs, tabs, snackbars). SCSS for styling. Structure: `/client` folder, generated via `ng new`.
- **PDF generation**: `pdfkit` on the server side. Stream PDF to client as download.
- **Validation**: All inputs validated server-side. Tube number must be unique. Volumes and costs must be > 0. Titration denominator must be > 0. Frontend validation as well via Angular Reactive Forms.
- **Number formatting**: All CHF values displayed with 2 decimal places. Volumes with 1 decimal place.
- **Language**: UI in English.
- **Environment**: `.env` file at project root with `DATABASE_URL`, `JWT_SECRET`, `PORT`. Provide a `.env.example` with placeholder values.

---

## 13. Seed Data

On first run, seed the database with:
- 1 admin user (admin/admin)
- 3 example laboratories
- 10 example antibodies spread across the labs
- 1 example experiment in `planning` status with 3 antibodies

This allows immediate testing after setup.

## Skills
- Database setup: see `.claude/skills/db-admin/SKILL.md`
- API layer: see `.claude/skills/backend-api/SKILL.md`
- Task management: see `.claude/skills/tasks-manager/SKILL.md`



Before doing anything, use the task manager skills to define the tasks in the tasks.md file. Then let me review the tasks and, if necessary, we can proceed using the appropriate skills to carry them out.