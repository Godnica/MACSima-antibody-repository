const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const DESTRUCTIVE_SQL_RE = /\b(TRUNCATE|DROP\s+TABLE|DROP\s+SCHEMA)\b/i;

module.exports = async function migrate() {
  const client = await pool.connect();
  try {
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Read all .sql files sorted alphabetically
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) continue; // already applied

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const allowDestructive = process.env.ALLOW_DESTRUCTIVE_MIGRATIONS === 'true';
      const guardedDestructive = sql.includes('app.allow_destructive_migrations');
      if (DESTRUCTIVE_SQL_RE.test(sql) && !allowDestructive && !guardedDestructive) {
        throw new Error(
          `Refusing to run destructive migration ${file}. ` +
          'Set ALLOW_DESTRUCTIVE_MIGRATIONS=true only for an intentional local reset.'
        );
      }

      await client.query('BEGIN');
      try {
        await client.query(
          `SELECT set_config('app.allow_destructive_migrations', $1, true)`,
          [allowDestructive ? 'true' : 'false']
        );
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[migrate] Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed for ${file}: ${err.message}`);
      }
    }

    console.log('[migrate] All migrations up to date.');
  } finally {
    client.release();
  }
};
