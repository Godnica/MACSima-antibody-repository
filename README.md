# Antibody Repository Tool

Web-based tool for managing antibodies used in MACSima experiments. Tracks inventory, plans experiments, calculates costs, deducts stock, and generates billing summaries per laboratory.

## Tech Stack

- **Frontend**: Angular 17+ (standalone components, Angular Material, SCSS)
- **Backend**: Node.js / Express.js (JSON API)
- **Database**: PostgreSQL 15+
- **Auth**: Username/password with bcrypt + JWT sessions
- **PDF**: PDFKit (server-side generation)

## Project Structure

```
├── client/          # Angular frontend
├── server/          # Express.js backend
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── db/
├── migrations/      # Raw SQL migration files (run on startup in order)
├── .env.example     # Environment variable template
└── CLAUDE.md        # Full project specification
```

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Angular CLI (`npm install -g @angular/cli`)

## Installation Guide

### Quick Start (fresh install)

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd MACSima-antibody-repository
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/antibody_repo
   JWT_SECRET=your-secret-key-change-me
   PORT=3000
   ```

3. **Create the PostgreSQL database**

   ```bash
   # Connect to PostgreSQL and create the database
   psql -U postgres -c "CREATE DATABASE antibody_repo;"
   ```

   > If using a different user/password, update `DATABASE_URL` in `.env` accordingly.

4. **Install dependencies**

   ```bash
   # Backend
   cd server && npm install

   # Frontend
   cd ../client && npm install
   ```

5. **Start the application**

   ```bash
   # Backend (from /server) — migrations and seed run automatically on first start
   npm start

   # Frontend (from /client, in a separate terminal)
   ng serve
   ```

   The app will be available at `http://localhost:4200` (frontend) and `http://localhost:3000` (API).

6. **First login**

   - Username: `admin` / Password: `admin`
   - You will be prompted to change the password on first login.

### Database Reset

If you need to start from scratch (e.g. after schema changes), drop and recreate the database:

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS antibody_repo;"
psql -U postgres -c "CREATE DATABASE antibody_repo;"

# Restart the backend — migrations and seed will run again
cd server && npm start
```

> **Warning**: This will delete all existing data (antibodies, experiments, billing history). Only do this in development or if you have a backup.

### Seed Data

On first startup (empty database), the system automatically seeds:

- 1 admin user (`admin` / `admin`, must change password on first login)
- 3 example laboratories
- 10 example antibodies spread across labs
- 1 example experiment in `planning` status with 3 antibodies

The seed only runs if the `users` table is empty, so it will not overwrite existing data.

### Updating

When pulling new changes that include database schema modifications:

1. Stop the backend server
2. Reset the database (see "Database Reset" above)
3. Pull the latest code: `git pull`
4. Reinstall dependencies if needed: `cd server && npm install && cd ../client && npm install`
5. Restart the backend: `cd server && npm start`

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on startup | Make sure PostgreSQL is running and `DATABASE_URL` is correct |
| `database "antibody_repo" does not exist` | Run `psql -U postgres -c "CREATE DATABASE antibody_repo;"` |
| `password authentication failed` | Check the user/password in your `DATABASE_URL` |
| Migration errors after schema changes | Drop and recreate the database (see "Database Reset") |
| `EADDRINUSE` port 3000 | Another process is using port 3000 — change `PORT` in `.env` or stop the other process |
| Forgot admin password | Run: `psql $DATABASE_URL -c "UPDATE users SET password_hash = '<bcrypt_hash>', must_change_password = true WHERE username = 'admin';"` (generate hash with `node -e "require('bcrypt').hash('admin',10).then(console.log)"` from the `/server` directory) |

## User Roles

### Admin
- Full CRUD on antibody inventory
- Create and manage experiments
- Execute experiments (deducts stock from inventory)
- Generate billing PDFs per laboratory
- Assign quality color codes to antibodies
- View low stock alerts
- Manage laboratories

### User (read-only)
- Browse the antibody repository
- Search and filter by target, species, clone, fluorochrome, lab, quality

## Core Features

### Inventory Management
Add, edit, and delete antibody vials. Each vial is a distinct record with its own volume and cost tracking. CHF/uL is auto-calculated from cost and volume on arrival.

### Experiments
Create experiments, select antibodies from inventory, and set titration ratios. Calculated fields update live:

```
uL per slide = total_cocktail_volume / titration_ratio
total uL used = uL per slide x macswell_slides
total CHF     = total uL used x CHF per uL
```

### Experiment Status Flow

```
Planning  -->  Executed Not Billed  -->  Executed Billed
```

- **Planning**: Edit antibodies and titrations freely. No inventory changes.
- **Executed Not Billed**: Irreversible. Deducts volumes from inventory (blocked if insufficient stock).
- **Executed Billed**: Marks billing complete. Also irreversible.

### Low Stock Alerts
Antibodies with current volume below 40 uL are flagged, sorted by most critical first.

### Billing
Generate one PDF invoice per lab for each executed experiment, grouped by antibody ownership. Includes cost breakdown per antibody and lab totals.

### Quality Color Codes

| Color  | Meaning           |
|--------|--------------------|
| None   | Not yet evaluated  |
| Green  | Good quality       |
| Yellow | Mediocre quality   |
| Grey   | Neutral            |

## API Overview

All endpoints under `/api`. Admin endpoints require JWT with admin role. Repository endpoint requires any valid JWT.

| Area            | Base path                          |
|-----------------|------------------------------------|
| Auth            | `/api/auth/login`, `/api/auth/logout` |
| Laboratories    | `/api/laboratories`                |
| Antibodies      | `/api/antibodies`                  |
| Experiments     | `/api/experiments`                 |
| Billing         | `/api/billing/experiment/:id`      |
| Repository      | `/api/repository`                  |

## License

Private - All rights reserved.
