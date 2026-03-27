const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./pool');
const calc = require('../utils/calculations');

const INIT_CSV_DIR = path.join(__dirname, '../../init-csv');

function parseCSV(filename) {
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
  switch ((raw || '').toLowerCase()) {
    case 'good': return 'green';
    case 'ok':   return 'yellow';
    case 'no':   return 'grey';
    default:     return 'none';
  }
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

  // 2. Laboratories from CSV
  const labRows = parseCSV('laboratories.csv');
  const labMap = {}; // name → id

  for (const row of labRows) {
    const { rows: [lab] } = await pool.query(
      `INSERT INTO laboratories (name, pi_name, email, billing_address, institute)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE
         SET pi_name = EXCLUDED.pi_name,
             email = EXCLUDED.email,
             billing_address = EXCLUDED.billing_address,
             institute = EXCLUDED.institute
       RETURNING id, name`,
      [row.name, row.pi_name, row.email, row.billing_address, row.institute || null]
    );
    labMap[lab.name] = lab.id;
  }

  console.log(`[seed] Inserted ${labRows.length} laboratories.`);

  // 3. Antibodies from CSV
  const abRows = parseCSV('antibodies .csv');
  let abCount = 0;

  for (const row of abRows) {
    const labId = labMap[row.lab_name];
    if (!labId) {
      console.warn(`[seed] Unknown lab "${row.lab_name}" for tube ${row.tube_number}, skipping.`);
      continue;
    }

    const volOnArrival = parseFloat(row.volume_on_arrival) || 0;
    const costChf = parseFloat(row.cost_chf) || 0;
    const chfPerUl = calc.chfPerUl(costChf, volOnArrival);
    const qualityColor = mapQualityColor(row.quality_color);

    await pool.query(
      `INSERT INTO antibodies
         (lab_id, tube_number, species, antigen_target, clone, company, order_number,
          lot_number, fluorochrome, processing, status, volume_on_arrival, current_volume,
          cost_chf, chf_per_ul, quality_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$13,$14,$15)
       ON CONFLICT (tube_number) DO NOTHING`,
      [
        labId, row.tube_number, row.species, row.antigen_target, row.clone,
        row.company, row.order_number, row.lot_number, row.fluorochrome,
        row.processing || null, row.status || null,
        volOnArrival, costChf, chfPerUl, qualityColor
      ]
    );
    abCount++;
  }

  console.log(`[seed] Inserted ${abCount} antibodies.`);
  console.log('[seed] Done: 1 admin, labs and antibodies from CSV.');
};
