const pool = require('../db/pool');
const calc = require('../utils/calculations');

exports.getAll = async (req, res, next) => {
  try {
    const { target, species, clone, fluorochrome, lab_id, quality_color } = req.query;

    let where = [];
    let params = [];
    let i = 1;

    if (target)        { where.push(`a.antigen_target ILIKE $${i++}`); params.push(`%${target}%`); }
    if (species)       { where.push(`a.species ILIKE $${i++}`);        params.push(`%${species}%`); }
    if (clone)         { where.push(`a.clone ILIKE $${i++}`);          params.push(`%${clone}%`); }
    if (fluorochrome)  { where.push(`a.fluorochrome ILIKE $${i++}`);   params.push(`%${fluorochrome}%`); }
    if (lab_id)        { where.push(`a.lab_id = $${i++}`);             params.push(lab_id); }
    if (quality_color) { where.push(`a.quality_color = $${i++}`);      params.push(quality_color); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await pool.query(`
      SELECT a.*, l.name AS lab_name
      FROM antibodies a
      JOIN laboratories l ON a.lab_id = l.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `, params);

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getCombinations = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT antigen_target, clone
      FROM antibodies
      WHERE antigen_target IS NOT NULL AND antigen_target != ''
        AND clone IS NOT NULL AND clone != ''
      ORDER BY antigen_target, clone
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, l.name AS lab_name
      FROM antibodies a
      JOIN laboratories l ON a.lab_id = l.id
      WHERE a.current_volume < 40
      ORDER BY a.current_volume ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      lab_id, tube_number, species, antigen_target, clone, company,
      order_number, lot_number, fluorochrome, processing, panel,
      volume_on_arrival, cost_chf, quality_color,
    } = req.body;

    const chfPerUl = calc.chfPerUl(parseFloat(cost_chf), parseFloat(volume_on_arrival));

    const { rows } = await pool.query(`
      INSERT INTO antibodies
        (lab_id, tube_number, species, antigen_target, clone, company,
         order_number, lot_number, fluorochrome, processing, panel,
         volume_on_arrival, current_volume, cost_chf, chf_per_ul, quality_color)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$13,$14,$15)
      RETURNING *
    `, [
      lab_id, tube_number, species, antigen_target, clone, company,
      order_number, lot_number, fluorochrome, processing || null, panel || null,
      volume_on_arrival, cost_chf, chfPerUl, quality_color || 'none',
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const {
      lab_id, tube_number, species, antigen_target, clone, company,
      order_number, lot_number, fluorochrome, processing, panel,
      volume_on_arrival, cost_chf, quality_color,
    } = req.body;

    const chfPerUl = calc.chfPerUl(parseFloat(cost_chf), parseFloat(volume_on_arrival));

    const { rows } = await pool.query(`
      UPDATE antibodies SET
        lab_id=$1, tube_number=$2, species=$3, antigen_target=$4, clone=$5,
        company=$6, order_number=$7, lot_number=$8, fluorochrome=$9,
        processing=$10, panel=$11, volume_on_arrival=$12, cost_chf=$13,
        chf_per_ul=$14, quality_color=$15
      WHERE id=$16
      RETURNING *
    `, [
      lab_id, tube_number, species, antigen_target, clone, company,
      order_number, lot_number, fluorochrome, processing || null, panel || null,
      volume_on_arrival, cost_chf, chfPerUl, quality_color || 'none',
      req.params.id,
    ]);

    if (!rows[0]) return res.status(404).json({ error: 'Antibody not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM antibodies WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Antibody not found' });
    res.json({ message: 'Antibody deleted' });
  } catch (err) {
    next(err);
  }
};
