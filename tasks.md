# Project Tasks — Antibody Repository Tool

> Auto-generated from CLAUDE.md. Do not edit manually.
> Last updated: 2026-03-26 14:30

## Summary
- Total: 68
- Done: 68
- In Progress: 0
- Pending: 0

---

## Phase 1 — Project Setup & Configuration

- [x] 1.1 — Initialize folder structure: `/server` (with `routes/`, `controllers/`, `middleware/`, `db/`) and `/client` (Angular 17+ via `ng new`). Create `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `PORT`. Add `.gitignore`. (§12 CLAUDE.md)
- [x] 1.2 — Initialize Node.js/Express backend: `package.json`, install dependencies (`express`, `pg`, `bcrypt`, `jsonwebtoken`, `pdfkit`, `dotenv`, `cors`). Create `server/index.js` entry point with CORS and JSON middleware. (§12 CLAUDE.md)
- [x] 1.3 — Initialize Angular 17+ frontend with standalone components (`ng new client --standalone`). Install Angular Material. Configure base routing and SCSS. (§12 CLAUDE.md)

---

## Phase 2 — Database Schema & Migrations

- [x] 2.1 — Create migration system: `server/db/migrate.js` that reads and runs SQL files from `/migrations` folder in alphabetical order on startup. Create `server/db/pool.js` with `pg` Pool using `DATABASE_URL`. (§12 CLAUDE.md)
- [x] 2.2 — Write migration `001_create_laboratories.sql`: table `laboratories` with columns `id` (SERIAL PK), `name` (VARCHAR 255, UNIQUE NOT NULL), `pi_name` (VARCHAR 255), `email` (VARCHAR 255), `billing_address` (TEXT). (§2.1 CLAUDE.md)
- [x] 2.3 — Write migration `002_create_users.sql`: table `users` with columns `id` (SERIAL PK), `username` (VARCHAR 255, UNIQUE NOT NULL), `password_hash` (TEXT NOT NULL), `role` (VARCHAR 20, default `user`), `must_change_password` (BOOLEAN, default FALSE), `created_at` (TIMESTAMPTZ, default NOW()). (§1 CLAUDE.md)
- [x] 2.4 — Write migration `003_create_antibodies.sql`: table `antibodies` with all columns from §2.2: `id`, `lab_id` (FK → laboratories.id NOT NULL), `tube_number` (UNIQUE), `species`, `antigen_target`, `clone`, `company`, `order_number`, `lot_number`, `fluorochrome`, `processing`, `panel`, `volume_on_arrival`, `current_volume`, `cost_chf`, `chf_per_ul`, `quality_color` (default `none`), `created_at`. (§2.2 CLAUDE.md)
- [x] 2.5 — Write migration `004_create_experiments.sql`: table `experiments` with columns `id`, `name` (NOT NULL), `date`, `requesting_lab_id` (FK → laboratories.id), `status` (VARCHAR 30, default `planning`), `macswell_slides`, `total_cocktail_volume`, `created_at`. (§2.3 CLAUDE.md)
- [x] 2.6 — Write migration `005_create_experiment_antibodies.sql`: table `experiment_antibodies` with columns `id`, `experiment_id` (FK → experiments.id NOT NULL), `antibody_id` (FK → antibodies.id NOT NULL), `titration_ratio` (INTEGER), `ul_per_slide` (NUMERIC 10,4), `total_ul_used` (NUMERIC 10,4), `total_chf` (NUMERIC 10,4). (§2.4 CLAUDE.md)
- [x] 2.7 — Write seed file `server/db/seed.js`: insert 1 admin user (admin/admin, must_change_password=true), 3 example laboratories, 10 example antibodies spread across labs, 1 experiment in `planning` status with 3 antibodies. Run seed only if tables are empty. (§13 CLAUDE.md)

---

## Phase 3 — Authentication

- [x] 3.1 — Implement `POST /api/auth/login`: validate username/password with bcrypt, return JWT containing `{ userId, username, role }`, set expiry 8h. Return 401 on failure. (§1, §11 CLAUDE.md)
- [x] 3.2 — Implement `POST /api/auth/logout`: stateless, return 200. Create `server/middleware/auth.js` with `requireAuth` (any valid JWT) and `requireAdmin` (role=admin) middleware. (§11 CLAUDE.md)
- [x] 3.3 — Build Angular login page: username/password form (Reactive Forms), call `/api/auth/login`, store JWT in localStorage, redirect to main app. Show error on invalid credentials. (§1 CLAUDE.md)
- [x] 3.4 — Implement Angular AuthService + AuthGuard: decode JWT, expose `currentUser$`, protect admin routes. Add password-change prompt/dialog when `must_change_password=true`. (§1 CLAUDE.md)

---

## Phase 4 — Laboratories CRUD

- [x] 4.1 — Implement Laboratories API: `GET /api/laboratories`, `POST /api/laboratories`, `PUT /api/laboratories/:id`, `DELETE /api/laboratories/:id`. Validate name unique/not empty. Require admin role for POST/PUT/DELETE. (§11 CLAUDE.md)
- [x] 4.2 — Build Laboratories tab (Angular): table listing all labs (name, PI, email, billing address). Add/edit via dialog form. Delete with confirmation dialog. Wire to API. (§7 CLAUDE.md)

---

## Phase 5 — Antibody Inventory

- [x] 5.1 — Implement `GET /api/antibodies`: return all antibodies with lab name joined. Support query params for filtering (target, species, clone, fluorochrome, lab_id, quality_color). Require auth. (§11 CLAUDE.md)
- [x] 5.2 — Implement `POST /api/antibodies`: validate all required fields, tube_number unique, volume > 0, cost > 0. Auto-calculate `chf_per_ul = cost_chf / volume_on_arrival`. Set `current_volume = volume_on_arrival`. Require admin. (§8, §12 CLAUDE.md)
- [x] 5.3 — Implement `PUT /api/antibodies/:id` and `DELETE /api/antibodies/:id`: update recalculates `chf_per_ul` if cost or volume changes. Delete with cascade check. Require admin. (§11 CLAUDE.md)
- [x] 5.4 — Build Inventory tab (Angular): paginated/scrollable table with columns (tube number, target, clone, fluorochrome, lab, current volume, CHF/µL, quality color badge). Add antibody button opens form dialog. (§7, §8 CLAUDE.md)
- [x] 5.5 — Build antibody add/edit form dialog (Angular): all fields from §8 (lab dropdown populated from API, quality color dropdown). Reactive form with validators. Show auto-calculated `chf_per_ul` as read-only. (§8 CLAUDE.md)
- [x] 5.6 — Implement inline edit and delete in Inventory table: edit opens same form dialog pre-filled. Delete shows confirmation. Quality color shown as colored dot/badge (green/yellow/grey/none). (§9 CLAUDE.md)

---

## Phase 6 — Experiments

- [x] 6.1 — Implement Experiments list API: `GET /api/experiments` (with requesting lab name joined), `POST /api/experiments` (name, date, requesting_lab_id, macswell_slides, total_cocktail_volume; status defaults to `planning`), `GET /api/experiments/:id`, `PUT /api/experiments/:id`. Require admin. (§11 CLAUDE.md)
- [x] 6.2 — Implement experiment antibodies API: `GET /api/experiments/:id/antibodies`, `POST /api/experiments/:id/antibodies` (antibody_id + titration_ratio, auto-calculate ul_per_slide/total_ul_used/total_chf per §3), `PUT /api/experiments/:id/antibodies/:eaId` (update titration, recalculate), `DELETE /api/experiments/:id/antibodies/:eaId`. Block all mutations if experiment status != `planning`. (§3, §11 CLAUDE.md)
- [x] 6.3 — Build Experiments list tab (Angular): table of all experiments (name, date, requesting lab, status badge, slides). "New Experiment" button opens creation dialog. Click row navigates to detail view. (§7 CLAUDE.md)
- [x] 6.4 — Build Experiment detail view (Angular): header with experiment metadata. Antibody selector (searchable, shows target/clone/fluorochrome/lab). Add selected antibody to list. (§10 CLAUDE.md)
- [x] 6.5 — Build titration input and live calculation in Experiment detail (Angular): for each antibody row show titration input + read-only µL/slide, total µL, total CHF (calculated live from §3 formulas). Footer shows total experiment cost. (§3, §10 CLAUDE.md)
- [x] 6.6 — Implement Save in Experiment detail: persist antibodies + titrations via API. Disable all editing when experiment is not in `planning` status. (§4, §10 CLAUDE.md)

---

## Phase 7 — Experiment Status Transitions & Inventory Deduction

- [x] 7.1 — Implement `POST /api/experiments/:id/execute`: validate status is `planning`. Check all antibodies have sufficient `current_volume` (current_volume - total_ul_used >= 0); if not, return 422 with list of insufficient antibodies. On success: deduct `total_ul_used` from each `antibodies.current_volume`, set status to `executed_not_billed`. Use DB transaction. (§4 CLAUDE.md)
- [x] 7.2 — Implement `POST /api/experiments/:id/mark-billed`: validate status is `executed_not_billed`, set to `executed_billed`. No inventory changes. Require admin. (§4 CLAUDE.md)
- [x] 7.3 — Build "Execute Experiment" button in detail view (Angular): show confirmation dialog (*"This will deduct antibody volumes from inventory. This action cannot be undone. Proceed?"*). On API error (insufficient volume) show which antibodies are problematic. On success navigate back or refresh. (§4 CLAUDE.md)
- [x] 7.4 — In experiment detail view (planning status): highlight antibody rows in red when `current_volume < total_ul_used`, warning the user that inventory is insufficient before attempting execution. (§4 CLAUDE.md)
- [x] 7.5 — In experiments list view: highlight experiment rows in red when in `planning` status and at least one antibody has insufficient volume to execute. Requires backend to return an `has_insufficient_volume` flag on GET /api/experiments. (§4 CLAUDE.md)

---

## Phase 8 — Low Stock Alerts

- [x] 8.1 — Implement `GET /api/antibodies/low-stock`: return antibodies where `current_volume < 40`, joined with lab name, sorted by `current_volume ASC`. Require admin. (§5 CLAUDE.md)
- [x] 8.2 — Build Low Stock tab (Angular): read-only table with columns (tube number, target, clone, lab owner, current volume, company, order number). Sorted by volume ascending. (§5, §7 CLAUDE.md)

---

## Phase 9 — Billing Module & PDF Generation

- [x] 9.1 — Implement `GET /api/billing/experiment/:id`: return billing data grouped by antibody owner lab (lab name, requesting lab, list of antibodies with tube number/target/clone/fluorochrome/total µL/CHF per µL/total CHF, subtotal per lab). Require admin, status must be `executed_not_billed`. (§6 CLAUDE.md)
- [x] 9.2 — Implement `GET /api/billing/experiment/:id/pdf/:labId`: generate PDF with `pdfkit` (header "Antibody Usage Invoice" + date, experiment info block, antibody cost table, total at bottom). Stream to client as file download. Require admin. (§6 CLAUDE.md)
- [x] 9.3 — Build Billing tab (Angular): list experiments with status `executed_not_billed`. For each, show billing data grouped by lab with download PDF button per lab. "Mark as Billed" button calls mark-billed API. Also show history of `executed_billed` experiments (read-only). (§6, §7 CLAUDE.md)

---

## Phase 10 — Repository View (User Role)

- [x] 10.1 — Implement `GET /api/repository`: same as GET /api/antibodies but requires only valid JWT (any role). Support filters: target, species, clone, fluorochrome, lab_id, quality_color. (§11 CLAUDE.md)
- [x] 10.2 — Build Repository tab (Angular, accessible to all roles): read-only antibody table with search bar and filter controls (target, species, clone, fluorochrome, lab dropdown, quality color dropdown). Quality color shown as colored dot/badge. (§7 CLAUDE.md)

---

## Phase 10b — Enhancements

- [x] 10b.1 — In the antibody add/edit form dialog (frontend), change the "processing" field from a free text input to a nullable select/dropdown with options: (empty/null), "actual", "backup". Update both the add and edit form dialogs. (§8 CLAUDE.md)
- [x] 10b.2 — In the experiment creation/detail view (`client/src/app/pages/experiments/`), when searching for antibodies in the searchbar/autocomplete, show the "processing" field in the dropdown options. Also filter out antibodies that have `current_volume = 0` from the search results (both frontend and backend). (§10 CLAUDE.md)
- [x] 10b.3 — In the experiments list view (`client/src/app/pages/experiments/`), add a search bar that allows filtering experiments by antibody type. The filter should match experiments that used antibodies with the same `antigen_target`, `clone`, and `fluorochrome`. Requires backend support (`GET /api/experiments` with query param `antibody_search`) to filter experiments by antibody attributes using OR logic. (§7 CLAUDE.md)
- [x] 10b.4 — Allow admin users to manually edit the `current_volume` (µL) field of an existing antibody. In the antibody edit form dialog (frontend), add `current_volume` as an editable numeric field (must be >= 0). In the backend `PUT /api/antibodies/:id`, accept and validate `current_volume` as an optional updatable field (admin-only). This enables admins to correct volumes manually (e.g. adjustments, spillage, recounts). (§2.2, §8 CLAUDE.md)
- [x] 10b.5 — Rename the `panel` column to `status` in the `antibodies` table. Accepted values: null, `in use`, `backup`. Update all layers: migration SQL (`003_create_antibodies.sql`), seed data (`server/db/seed.js`), backend controller/routes/repository endpoint, frontend model (`antibody.model.ts`), form dialog (change dropdown options to null/"in use"/"backup"), inventory table, experiment views, and any other reference to `panel` across the entire codebase. (§2.2, §8 CLAUDE.md)
- [x] 10b.6 — **Database**: Add `experiment_type` column (VARCHAR(255), nullable) to the `experiments` table. Update migration `004_create_experiments.sql` to include the column for fresh installs. Create new migration `007_add_experiment_type.sql` for existing databases. Use skill `db-admin`. (§2.3 CLAUDE.md)
- [x] 10b.7 — **Backend**: Update experiment controller, routes, and endpoints to accept, validate, and return `experiment_type`. Update `POST /api/experiments` (create), `PUT /api/experiments/:id` (update), `GET /api/experiments` (list), and `GET /api/experiments/:id` (detail). Use skill `back-end-developer`. (§11 CLAUDE.md)
- [x] 10b.8 — **Frontend**: Add `experiment_type` to the experiment model, creation/edit dialog form, experiments list table (new column), and experiment detail view header. Use skill `front-end-developer`. (§7, §10 CLAUDE.md)

---

## Phase 11 — Seed Data & Integration Testing

- [x] 11.1 — Verify seed runs correctly on fresh DB: confirm admin user, 3 labs, 10 antibodies, 1 planning experiment with 3 antibodies are created. Test login with admin/admin and forced password change. (§13 CLAUDE.md)
- [x] 11.2 — End-to-end smoke test: create lab → add antibodies → create experiment → add antibodies to experiment → execute experiment (verify volume deduction) → generate billing PDF → mark as billed. Verify low stock alert triggers at < 40 µL. (§4, §5, §6 CLAUDE.md)

---

## Phase 12 — Polish & Final Review

- [x] 12.1 — Apply consistent number formatting throughout UI: CHF values 2 decimal places, volumes 1 decimal place. (§12 CLAUDE.md)
- [x] 12.2 — Add server-side validation for all edge cases: tube number uniqueness, volume/cost > 0, titration denominator > 0, status transition guards. Return meaningful error messages. (§12 CLAUDE.md)
- [x] 12.3 — Add Angular Reactive Forms validation on all forms (matching server-side rules). Show inline error messages. Disable submit until form is valid. (§12 CLAUDE.md)
- [x] 12.4 — Navigation and role-based routing: Admin sees all 5 tabs; User sees only Repository tab. Redirect unauthorized access. Add logout button. (§7 CLAUDE.md)
- [x] 12.5 — Final review: check all CLAUDE.md requirements are implemented, UI language is English, all status transitions are irreversible, no backwards transitions possible. (§4 CLAUDE.md)

---

## Phase 13 — Dockerizzazione

- [x] 13.1 — **Build Angular per produzione**: Configurare il build di produzione Angular (`ng build --configuration production`) e servire i file statici direttamente da Express. Modificare `server/index.js` per servire la cartella `client/dist` come static files. Così frontend e backend girano in un unico processo Node.js.
- [x] 13.2 — **Dockerfile**: Creare un `Dockerfile` multi-stage: stage 1 builda il frontend Angular, stage 2 copia il build + il backend in un'immagine Node.js leggera (node:20-alpine). Esporre la porta configurata via ENV.
- [x] 13.3 — **docker-compose.yml**: Creare `docker-compose.yml` con due servizi: `app` (il container dell'applicazione) e `db` (postgres:16-alpine). Configurare volumi per persistenza dati PostgreSQL, variabili d'ambiente (DATABASE_URL, JWT_SECRET, PORT), dipendenze e healthcheck.
- [x] 13.4 — **File .dockerignore**: Creare `.dockerignore` per escludere `node_modules`, `.git`, `.env`, file non necessari dal context del build Docker.
- [x] 13.5 — **Script di avvio**: Creare `start.sh` (Linux/Mac) e `start.bat` (Windows) che lanciano `docker compose up -d` con un messaggio user-friendly che indica l'URL dove accedere (es. http://localhost:3000).
- [x] 13.6 — **Test locale Docker**: Verificare che `docker compose up` funzioni correttamente: build immagini, avvio container, migrazione DB, seed dati, accesso al sito via browser.

---

## Phase 14 — Deploy Cloud (Render + Neon)

- [x] 14.1 — **Configurazione Neon.tech**: Documentare i passi per creare un database PostgreSQL gratuito su Neon.tech e ottenere la connection string. Aggiornare `.env.example` con esempio di `DATABASE_URL` per Neon.
- [x] 14.2 — **Configurazione Render.com**: Creare `render.yaml` (Infrastructure as Code) per deploy automatico su Render: web service con Docker, variabili d'ambiente (DATABASE_URL da Neon, JWT_SECRET, PORT). Documentare i passi per collegare il repo GitHub a Render.
- [x] 14.3 — **Adattamenti per produzione**: Verificare/aggiungere: CORS configurabile via ENV (non hardcoded localhost), `trust proxy` per Express dietro reverse proxy, health check endpoint (`GET /api/health`), gestione corretta di `NODE_ENV=production`.
- [x] 14.4 — **Documentazione deploy**: Aggiornare il `README.md` con guida passo-passo per: (A) installazione locale con Docker, (B) deploy su Render + Neon. Includere screenshot o comandi esatti.

---

## Phase 15 — Admin User Management

- [x] 15.1 — **Migration**: Create migration `009_add_display_name_to_users.sql` to add optional `display_name` (VARCHAR 255) column to `users` table, useful for showing a friendly name in the user list. The existing `users` table already has `id`, `username`, `password_hash`, `role`, `must_change_password`, `created_at`.
- [x] 15.2 — **Backend API — Users CRUD**: Create `server/routes/users.routes.js` and `server/controllers/users.controller.js`. Implement endpoints (all admin-only): `GET /api/users` (list all users, exclude password_hash), `POST /api/users` (create user: username, password, role, display_name; hash password with bcrypt; username must be unique), `DELETE /api/users/:id` (delete user, block deleting own account). Mount routes in `server/index.js`.
- [x] 15.3 — **Backend API — Reset Password**: Add `POST /api/users/:id/reset-password` endpoint (admin-only): accepts `newPassword`, hashes it, updates the user, sets `must_change_password = true` so the user is forced to change it on next login.
- [x] 15.4 — **Frontend Service**: Create `client/src/app/core/services/user.service.ts` with methods: `getAll()`, `create(data)`, `remove(id)`, `resetPassword(id, newPassword)`. Add `UserAdmin` interface to models.
- [x] 15.5 — **Frontend Component**: Create `client/src/app/pages/admin-users/admin-users.component.ts|html|scss` (standalone). Table showing all users (username, display name, role, created_at). "Add User" button opens a dialog with form (username, display name, password, role dropdown admin/user). Delete button with confirmation. Reset password button with password input dialog. Wire to UserService.
- [x] 15.6 — **Navigation & Routing**: Add route `/admin/users` in `app.routes.ts` (lazy-loaded, admin-only guard). Add "User Management" nav item in `main-layout.component.ts` with icon `group` and `adminOnly: true`. Place it after "Laboratories" in the nav list.
