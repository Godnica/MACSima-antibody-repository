const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: dbUrl,
  // Enable SSL for cloud databases (Neon, Render, etc.)
  ssl: dbUrl.includes('neon.tech') || dbUrl.includes('render.com') || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('connect', (client) => {
  client.query('SET search_path TO public').catch(err => {
    console.error('[db] Failed to set search_path:', err.message);
  });
});

module.exports = pool;
