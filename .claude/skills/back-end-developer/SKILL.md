---
name: backend-developer
description: Skill for building the backend of the Antibody Repository Tool using Express.js and PostgreSQL. Use this skill whenever creating, modifying, or debugging any API route, controller, middleware, database migration, query, seed file, or server-side logic. Trigger on any mention of API, endpoint, route, controller, middleware, database, migration, query, model, auth, JWT, PDF generation, billing logic, or Express-related work. Also trigger when implementing a task from tasks.md that involves the server layer.
---

# Backend Developer Skill — Antibody Repository Tool

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ via `pg` (node-postgres)
- **Auth**: `bcrypt` for password hashing, `jsonwebtoken` for JWT
- **PDF**: `pdfkit` for server-side PDF generation
- **Validation**: `express-validator` for request validation
- **Environment**: `dotenv` for config

## Project Structure

```
server/
├── index.js                  # Entry point: init Express, apply middleware, start server
├── db/
│   ├── pool.js               # pg Pool singleton, reads DATABASE_URL from env
│   ├── migrate.js            # Reads /migrations/*.sql in order, runs on startup
│   └── seed.js               # Seed data, runs only if tables are empty
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_laboratories.sql
│   ├── 003_create_antibodies.sql
│   ├── 004_create_experiments.sql
│   └── 005_create_experiment_antibodies.sql
├── middleware/
│   ├── auth.js               # JWT verification middleware
│   ├── adminOnly.js          # Role check: reject if not admin
│   └── errorHandler.js       # Global error handler
├── routes/
│   ├── auth.routes.js
│   ├── laboratories.routes.js
│   ├── antibodies.routes.js
│   ├── experiments.routes.js
│   ├── billing.routes.js
│   └── repository.routes.js
├── controllers/
│   ├── auth.controller.js
│   ├── laboratories.controller.js
│   ├── antibodies.controller.js
│   ├── experiments.controller.js
│   ├── billing.controller.js
│   └── repository.controller.js
└── utils/
    ├── calculations.js       # Titration formulas (single source of truth)
    └── pdfGenerator.js       # Billing PDF builder
```

## Coding Conventions

### General Rules

- **CommonJS** (`require` / `module.exports`). No ES modules in the server.
- **Async/await** everywhere. No callbacks. No `.then()` chains.
- **No ORM**. Write raw SQL queries using `pool.query()`. This keeps things explicit and avoids magic.
- **No classes for controllers**. Each controller is a plain module exporting async functions.
- Every controller function uses `try/catch` with errors forwarded to the global error handler via `next(err)`.

### File Template — Route

```javascript
const router = require('express').Router();
const ctrl = require('../controllers/laboratories.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/',    auth, adminOnly, ctrl.getAll);
router.post('/',   auth, adminOnly, ctrl.create);
router.put('/:id', auth, adminOnly, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.delete);

module.exports = router;
```

### File Template — Controller

```javascript
const pool = require('../db/pool');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM laboratories ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, pi_name, email, billing_address } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO laboratories (name, pi_name, email, billing_address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, pi_name, email, billing_address]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};
```

### File Template — Migration

```sql
-- 002_create_laboratories.sql
CREATE TABLE IF NOT EXISTS laboratories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  pi_name VARCHAR(255),
  email VARCHAR(255),
  billing_address TEXT
);
```

Migrations are plain `.sql` files. The `migrate.js` script:
1. Creates a `migrations` tracking table if it doesn't exist
2. Reads all `.sql` files from `/migrations` sorted alphabetically
3. Skips already-applied migrations
4. Runs new ones inside a transaction
5. Records each applied migration

### File Template — Middleware (auth)

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### File Template — adminOnly middleware

```javascript
module.exports = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

## Database Connection

### pool.js

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
```

- Single `Pool` instance, imported wherever needed.
- Connection string from `DATABASE_URL` env variable.
- For dev: `postgresql://user:password@localhost:5432/antibody_repo`

## Entry Point (index.js)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const migrate = require('./db/migrate');
const seed = require('./db/seed');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/laboratories',  require('./routes/laboratories.routes'));
app.use('/api/antibodies',    require('./routes/antibodies.routes'));
app.use('/api/experiments',   require('./routes/experiments.routes'));
app.use('/api/billing',       require('./routes/billing.routes'));
app.use('/api/repository',    require('./routes/repository.routes'));

// Error handler (must be last)
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 3000;

(async () => {
  await migrate();
  await seed();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
```

## Global Error Handler

```javascript
module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry', detail: err.detail });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record not found', detail: err.detail });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
```

## Validation Pattern

Use `express-validator` in route files, before the controller:

```javascript
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

router.post('/',
  auth, adminOnly,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('pi_name').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  validate,
  ctrl.create
);
```

### validate middleware

```javascript
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

## Business Logic

### Titration Calculations (`utils/calculations.js`)

This is the **single source of truth** for all cost calculations. Both controllers and seed data must use these functions.

```javascript
/**
 * @param {number} totalCocktailVolume - Total cocktail volume in µL
 * @param {number} titrationRatio - Denominator (e.g. 100 for 1:100)
 * @returns {number} µL per slide
 */
exports.ulPerSlide = (totalCocktailVolume, titrationRatio) => {
  return totalCocktailVolume / titrationRatio;
};

/**
 * @param {number} ulPerSlide
 * @param {number} macswellSlides - Number of slides
 * @returns {number} Total µL used
 */
exports.totalUlUsed = (ulPerSlide, macswellSlides) => {
  return ulPerSlide * macswellSlides;
};

/**
 * @param {number} totalUlUsed
 * @param {number} chfPerUl - Cost per µL in CHF
 * @returns {number} Total cost in CHF
 */
exports.totalChf = (totalUlUsed, chfPerUl) => {
  return totalUlUsed * chfPerUl;
};

/**
 * @param {number} costChf - Total cost of vial
 * @param {number} volumeOnArrival - Initial volume in µL
 * @returns {number} CHF per µL
 */
exports.chfPerUl = (costChf, volumeOnArrival) => {
  return costChf / volumeOnArrival;
};
```

### Experiment Execution (`POST /api/experiments/:id/execute`)

This is the most critical endpoint. It MUST:

1. **Start a database transaction** (`BEGIN` / `COMMIT` / `ROLLBACK`)
2. Verify experiment status is `planning` — reject otherwise
3. Fetch all `experiment_antibodies` for this experiment with their calculated `total_ul_used`
4. For each antibody, check that `antibodies.current_volume >= total_ul_used`
   - If ANY antibody has insufficient volume: **ROLLBACK** and return `400` with a list of which antibodies failed and how much is missing
5. For each antibody: `UPDATE antibodies SET current_volume = current_volume - $1 WHERE id = $2`
6. Update experiment status to `executed_not_billed`
7. **COMMIT**

```javascript
exports.execute = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check status
    const { rows: [experiment] } = await client.query(
      'SELECT * FROM experiments WHERE id = $1', [req.params.id]
    );
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    if (experiment.status !== 'planning') {
      return res.status(400).json({ error: 'Only planning experiments can be executed' });
    }

    // 2. Fetch antibodies with usage
    const { rows: expAntibodies } = await client.query(
      `SELECT ea.*, a.current_volume, a.tube_number, a.antigen_target
       FROM experiment_antibodies ea
       JOIN antibodies a ON ea.antibody_id = a.id
       WHERE ea.experiment_id = $1`, [req.params.id]
    );

    // 3. Validate volumes
    const insufficient = expAntibodies.filter(ea =>
      parseFloat(ea.current_volume) < parseFloat(ea.total_ul_used)
    );
    if (insufficient.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Insufficient antibody volume',
        details: insufficient.map(ea => ({
          antibody_id: ea.antibody_id,
          tube_number: ea.tube_number,
          target: ea.antigen_target,
          available: parseFloat(ea.current_volume),
          required: parseFloat(ea.total_ul_used),
        }))
      });
    }

    // 4. Deduct volumes
    for (const ea of expAntibodies) {
      await client.query(
        'UPDATE antibodies SET current_volume = current_volume - $1 WHERE id = $2',
        [ea.total_ul_used, ea.antibody_id]
      );
    }

    // 5. Update status
    await client.query(
      "UPDATE experiments SET status = 'executed_not_billed' WHERE id = $1",
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Experiment executed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
```

### Experiment Antibody Save/Update

When saving an experiment_antibody (add or update titration), the server must **recalculate** `ul_per_slide`, `total_ul_used`, and `total_chf` using the formulas from `utils/calculations.js`. The client sends only `antibody_id` and `titration_ratio`; all calculated fields are computed server-side.

```javascript
// On insert or update of experiment_antibody:
const experiment = await getExperiment(experimentId);
const antibody = await getAntibody(antibodyId);
const calc = require('../utils/calculations');

const ulSlide = calc.ulPerSlide(experiment.total_cocktail_volume, titrationRatio);
const totalUl = calc.totalUlUsed(ulSlide, experiment.macswell_slides);
const totalCost = calc.totalChf(totalUl, antibody.chf_per_ul);

// INSERT or UPDATE with these calculated values
```

### Billing PDF Generation (`utils/pdfGenerator.js`)

Use `pdfkit`. Each PDF contains data for ONE lab.

```javascript
const PDFDocument = require('pdfkit');

/**
 * @param {Object} data
 * @param {string} data.experimentName
 * @param {string} data.experimentDate
 * @param {string} data.requestingLab
 * @param {string} data.ownerLab
 * @param {string} data.ownerLabPI
 * @param {string} data.billingAddress
 * @param {Array} data.antibodies - [{ tube_number, target, clone, fluorochrome, total_ul_used, chf_per_ul, total_chf }]
 * @param {number} data.totalCost
 * @returns {PDFDocument} - pipe to response
 */
exports.generateBillingPdf = (data) => {
  const doc = new PDFDocument({ margin: 50 });

  // Header
  doc.fontSize(18).text('Antibody Usage Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);
  doc.text(`Date: ${data.experimentDate}`);
  doc.text(`Experiment: ${data.experimentName}`);
  doc.text(`Requesting Lab: ${data.requestingLab}`);
  doc.text(`Billed to: ${data.ownerLab} (PI: ${data.ownerLabPI})`);
  if (data.billingAddress) doc.text(`Address: ${data.billingAddress}`);
  doc.moveDown();

  // Table header
  const tableTop = doc.y;
  const cols = [50, 150, 220, 310, 390, 440, 500];
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('Tube', cols[0], tableTop);
  doc.text('Target', cols[1], tableTop);
  doc.text('Clone', cols[2], tableTop);
  doc.text('Fluorochrome', cols[3], tableTop);
  doc.text('µL used', cols[4], tableTop);
  doc.text('CHF/µL', cols[5], tableTop);
  doc.text('Total CHF', cols[6], tableTop);

  // Table rows
  doc.font('Helvetica').fontSize(8);
  let y = tableTop + 15;
  for (const ab of data.antibodies) {
    doc.text(ab.tube_number, cols[0], y);
    doc.text(ab.target, cols[1], y);
    doc.text(ab.clone, cols[2], y);
    doc.text(ab.fluorochrome, cols[3], y);
    doc.text(ab.total_ul_used.toFixed(1), cols[4], y);
    doc.text(ab.chf_per_ul.toFixed(4), cols[5], y);
    doc.text(ab.total_chf.toFixed(2), cols[6], y);
    y += 14;
  }

  // Total
  y += 10;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total: ${data.totalCost.toFixed(2)} CHF`, cols[5], y);

  doc.end();
  return doc;
};
```

### Billing Endpoint

```javascript
// GET /api/billing/experiment/:id/pdf/:labId
exports.downloadPdf = async (req, res, next) => {
  try {
    // 1. Fetch experiment (must be executed_not_billed or executed_billed)
    // 2. Fetch experiment_antibodies joined with antibodies, filtered by lab_id
    // 3. Fetch lab info
    // 4. Build data object
    // 5. Generate PDF and pipe to response

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="billing_${experimentName}_${labName}.pdf"`);
    const doc = pdfGenerator.generateBillingPdf(data);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
};
```

## API Response Conventions

- **Success list**: `200` with JSON array
- **Success single**: `200` with JSON object
- **Created**: `201` with created object
- **Validation error**: `400` with `{ errors: [...] }` (from express-validator) or `{ error: "message" }`
- **Unauthorized**: `401` with `{ error: "..." }`
- **Forbidden**: `403` with `{ error: "Admin access required" }`
- **Not found**: `404` with `{ error: "Resource not found" }`
- **Conflict** (duplicate): `409` with `{ error: "Duplicate entry", detail: "..." }`
- **Server error**: `500` with `{ error: "Internal server error" }`

All responses are JSON. No HTML. No redirects.

## Seed Data (`db/seed.js`)

Run only if the `users` table is empty (first startup).

```javascript
module.exports = async () => {
  const { rows } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) > 0) return;

  // 1. Create admin user (bcrypt hash of 'admin')
  // 2. Create 3 laboratories
  // 3. Create 10 antibodies across the 3 labs
  // 4. Create 1 experiment in 'planning' with 3 experiment_antibodies
  //    (calculate ul_per_slide, total_ul_used, total_chf using utils/calculations.js)
};
```

## Users Table (for auth)

Add a migration `001_create_users.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Roles: `admin`, `user`. JWT payload: `{ id, username, role }`. Token expiration: `24h`.

## Environment Variables

`.env.example`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/antibody_repo
JWT_SECRET=change-this-to-a-random-string
PORT=3000
```

## Things to Avoid

- **No ORM** (no Sequelize, no Prisma, no Knex query builder) — raw SQL only
- **No TypeScript on the server** — plain JavaScript with CommonJS
- **No GraphQL** — REST JSON only
- **No WebSockets** — simple request/response
- **No file uploads** — antibodies are added via form, not CSV import
- **No caching layer** — PostgreSQL is fast enough for this scale
- **No rate limiting** — internal tool, not public-facing
- **No logging library** — `console.log` / `console.error` is sufficient
- **No test framework required** — manual testing via seed data is enough for v1