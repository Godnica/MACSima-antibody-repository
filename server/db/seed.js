const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./pool');

const INIT_CSV_DIR = path.join(__dirname, '../../init-csv');

function parseSemicolonCSV(filename) {
  const filePath = path.join(INIT_CSV_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  const headers = lines[0].split(';').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

function mapQualityColor(raw) {
  switch ((raw || '').toLowerCase().trim()) {
    case 'good':       return 'green';
    case 'ok':         return 'yellow';
    case 'no':         return 'grey';
    case 'not tested': return 'none';
    default:           return 'none';
  }
}

/** Parse a numeric value, stripping non-numeric trailing chars (e.g. "100?") */
function parseNum(val) {
  if (!val || val.toLowerCase() === 'free') return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

module.exports = async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) > 0) {
    console.log('[seed] Database already seeded, skipping.');
    return;
  }

  console.log('[seed] Seeding database from CSV files...');

  // 1. Admin user
  const passwordHash = await bcrypt.hash('admin', 10);
  await pool.query(
    `INSERT INTO users (username, password_hash, role, must_change_password)
     VALUES ($1, $2, 'admin', true)`,
    ['admin', passwordHash]
  );

  // 2. Laboratories from CSV (semicolon-separated)
  const labRows = parseSemicolonCSV('laboratories.csv');
  const labMap = {}; // name or pi_name → id

  for (const row of labRows) {
    const { rows: [lab] } = await pool.query(
      `INSERT INTO laboratories (name, pi_name, email, billing_address, institute)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE
         SET pi_name = EXCLUDED.pi_name,
             email = EXCLUDED.email,
             billing_address = EXCLUDED.billing_address,
             institute = EXCLUDED.institute
       RETURNING id, name, pi_name`,
      [row.name, row.pi_name, row.email, row.billing_address, row.institute || null]
    );
    labMap[lab.name] = lab.id;
    if (lab.pi_name) labMap[lab.pi_name.trim()] = lab.id;
  }

  console.log(`[seed] Inserted ${labRows.length} laboratories.`);

  // 3. Antibodies from CSV (semicolon-separated)
  const abRows = parseSemicolonCSV('antibodies.csv');
  let abCount = 0;
  let skipped = 0;

  for (const row of abRows) {
    const labId = labMap[row.lab_name];
    if (!labId) {
      console.warn(`[seed] Unknown lab "${row.lab_name}" for tube ${row.tube_number}, skipping.`);
      skipped++;
      continue;
    }

    const volOnArrival = parseNum(row.volume_on_arrival);
    // CSV column "cost_chf" actually contains CHF per µL (same values as old "chf/ul" column)
    const chfPerUl = parseNum(row.cost_chf);
    const costChf = chfPerUl * volOnArrival;
    const currentVolume = parseNum(row.current_vol) || volOnArrival;
    const qualityColor = mapQualityColor(row.quality_color);

    await pool.query(
      `INSERT INTO antibodies
         (lab_id, tube_number, species, antigen_target, clone, company, order_number,
          lot_number, fluorochrome, processing, status, volume_on_arrival, current_volume,
          cost_chf, chf_per_ul, quality_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (tube_number) DO NOTHING`,
      [
        labId, row.tube_number, row.species, row.antigen_target, row.clone,
        row.company, row.order_number, row.lot_number || null, row.fluorochrome,
        row.processing || null, row.status || null,
        volOnArrival, currentVolume, costChf, chfPerUl, qualityColor
      ]
    );
    abCount++;
  }

  console.log(`[seed] Inserted ${abCount} antibodies (${skipped} skipped).`);
  console.log('[seed] Done: 1 admin, labs and antibodies from CSV.');
};
