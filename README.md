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

## Setup

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
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

3. **Install dependencies**

   ```bash
   # Backend
   cd server && npm install

   # Frontend
   cd ../client && npm install
   ```

4. **Initialize the database**

   Migrations run automatically on server startup. The database is seeded with:
   - 1 admin user (`admin` / `admin`)
   - 3 example laboratories
   - 10 example antibodies
   - 1 example experiment in planning status

5. **Start the application**

   ```bash
   # Backend (from /server)
   npm start

   # Frontend (from /client)
   ng serve
   ```

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
