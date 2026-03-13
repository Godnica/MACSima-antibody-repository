const bcrypt = require('bcrypt');
const pool = require('./pool');
const calc = require('../utils/calculations');

module.exports = async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(rows[0].count) > 0) {
    console.log('[seed] Database already seeded, skipping.');
    return;
  }

  console.log('[seed] Seeding database...');

  // 1. Admin user
  const passwordHash = await bcrypt.hash('admin', 10);
  await pool.query(
    `INSERT INTO users (username, password_hash, role, must_change_password)
     VALUES ($1, $2, 'admin', true)`,
    ['admin', passwordHash]
  );

  // 2. Laboratories
  const { rows: labs } = await pool.query(`
    INSERT INTO laboratories (name, pi_name, email, billing_address) VALUES
      ('Lab Immunology', 'Prof. Anna Rossi', 'a.rossi@university.ch', 'Via Immunologia 1, 6500 Bellinzona'),
      ('Lab Oncology', 'Prof. Marco Bianchi', 'm.bianchi@university.ch', 'Via Oncologia 5, 6900 Lugano'),
      ('Lab Neuroscience', 'Prof. Laura Verdi', 'l.verdi@university.ch', 'Via Neuroscienze 3, 6600 Locarno')
    RETURNING id, name
  `);
  const [labImmuno, labOnco, labNeuro] = labs;

  // 3. Antibodies (10 total, spread across labs)
  //    chf_per_ul = cost_chf / volume_on_arrival
  const antibodies = [
    // Lab Immunology (4 antibodies)
    { lab_id: labImmuno.id, tube: 'IMM-001', species: 'Mouse', target: 'CD3',    clone: 'UCHT1',  company: 'BioLegend', order: 'BL-300401', lot: 'B123456', fluoro: 'FITC',    vol: 100, cost: 250.00 },
    { lab_id: labImmuno.id, tube: 'IMM-002', species: 'Mouse', target: 'CD4',    clone: 'RPA-T4', company: 'BioLegend', order: 'BL-300507', lot: 'B234567', fluoro: 'PE',      vol: 100, cost: 280.00 },
    { lab_id: labImmuno.id, tube: 'IMM-003', species: 'Mouse', target: 'CD8',    clone: 'SK1',    company: 'BD Biosciences', order: 'BD-555635', lot: 'C345678', fluoro: 'APC',     vol: 50,  cost: 180.00 },
    { lab_id: labImmuno.id, tube: 'IMM-004', species: 'Mouse', target: 'CD19',   clone: 'HIB19',  company: 'BioLegend', order: 'BL-302206', lot: 'B456789', fluoro: 'BV421',   vol: 25,  cost: 150.00 },
    // Lab Oncology (3 antibodies)
    { lab_id: labOnco.id,   tube: 'ONC-001', species: 'Rabbit', target: 'Ki67',   clone: 'SP6',    company: 'Abcam',     order: 'AB-15580',  lot: 'D567890', fluoro: 'Alexa488', vol: 200, cost: 400.00 },
    { lab_id: labOnco.id,   tube: 'ONC-002', species: 'Mouse',  target: 'HER2',   clone: 'CB11',   company: 'Leica',     order: 'LC-NCL-CB11', lot: 'E678901', fluoro: 'PE-Cy7',  vol: 100, cost: 320.00 },
    { lab_id: labOnco.id,   tube: 'ONC-003', species: 'Mouse',  target: 'PCNA',   clone: 'PC10',   company: 'Sigma',     order: 'SG-P8825',  lot: 'F789012', fluoro: 'FITC',    vol: 150, cost: 220.00 },
    // Lab Neuroscience (3 antibodies)
    { lab_id: labNeuro.id,  tube: 'NEU-001', species: 'Rabbit', target: 'GFAP',   clone: 'EP672Y', company: 'Abcam',     order: 'AB-68428',  lot: 'G890123', fluoro: 'Alexa555', vol: 100, cost: 350.00 },
    { lab_id: labNeuro.id,  tube: 'NEU-002', species: 'Mouse',  target: 'NeuN',   clone: 'A60',    company: 'Millipore', order: 'MP-MAB377', lot: 'H901234', fluoro: 'APC',      vol: 50,  cost: 290.00 },
    { lab_id: labNeuro.id,  tube: 'NEU-003', species: 'Rabbit', target: 'Iba1',   clone: 'EPR16588', company: 'Abcam',  order: 'AB-178846', lot: 'I012345', fluoro: 'PE',       vol: 30,  cost: 180.00 },
  ];

  const insertedAbs = [];
  for (const ab of antibodies) {
    const chfPerUl = calc.chfPerUl(ab.cost, ab.vol);
    const { rows: [row] } = await pool.query(
      `INSERT INTO antibodies
         (lab_id, tube_number, species, antigen_target, clone, company, order_number,
          lot_number, fluorochrome, volume_on_arrival, current_volume, cost_chf, chf_per_ul)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12)
       RETURNING id`,
      [ab.lab_id, ab.tube, ab.species, ab.target, ab.clone, ab.company,
       ab.order, ab.lot, ab.fluoro, ab.vol, ab.cost, chfPerUl]
    );
    insertedAbs.push({ id: row.id, ...ab, chf_per_ul: chfPerUl });
  }

  // 4. Experiment in 'planning' with 3 antibodies
  const cocktailVolume = 200;
  const slides = 3;

  const { rows: [experiment] } = await pool.query(
    `INSERT INTO experiments (name, date, requesting_lab_id, status, macswell_slides, total_cocktail_volume)
     VALUES ($1, CURRENT_DATE, $2, 'planning', $3, $4)
     RETURNING id`,
    ['Pilot MACSima Run #1', labImmuno.id, slides, cocktailVolume]
  );

  // Pick first 3 antibodies: IMM-001 (1:100), IMM-002 (1:200), ONC-001 (1:50)
  const expAntibodies = [
    { ab: insertedAbs[0], titration: 100 },
    { ab: insertedAbs[1], titration: 200 },
    { ab: insertedAbs[4], titration: 50  },
  ];

  for (const { ab, titration } of expAntibodies) {
    const ulSlide  = calc.ulPerSlide(cocktailVolume, titration);
    const totalUl  = calc.totalUlUsed(ulSlide, slides);
    const totalChf = calc.totalChf(totalUl, ab.chf_per_ul);

    await pool.query(
      `INSERT INTO experiment_antibodies
         (experiment_id, antibody_id, titration_ratio, ul_per_slide, total_ul_used, total_chf)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [experiment.id, ab.id, titration, ulSlide, totalUl, totalChf]
    );
  }

  console.log('[seed] Done: 1 admin, 3 labs, 10 antibodies, 1 experiment.');
};
