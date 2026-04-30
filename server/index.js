require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');
const migrate = require('./db/migrate');
const seed = require('./db/seed');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy when behind reverse proxy (Render, Docker, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS: allow configured origin or all in dev
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check endpoint (used by Docker & Render)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/laboratories', require('./routes/laboratories.routes'));
app.use('/api/antibodies',   require('./routes/antibodies.routes'));
app.use('/api/experiments',  require('./routes/experiments.routes'));
app.use('/api/templates',    require('./routes/templates.routes'));
app.use('/api/billing',      require('./routes/billing.routes'));
app.use('/api/repository',   require('./routes/repository.routes'));
app.use('/api/users',        require('./routes/users.routes'));

app.use(errorHandler);

// Serve Angular frontend in production
const clientDist = path.join(__dirname, '../client/dist/client/browser');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

(async () => {
  await migrate();
  await seed();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
