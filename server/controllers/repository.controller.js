const pool = require('../db/pool');

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
      SELECT a.id, a.tube_number, a.species, a.antigen_target, a.clone, a.company,
             a.fluorochrome, a.quality_color, l.name AS lab_name
      FROM antibodies a
      JOIN laboratories l ON a.lab_id = l.id
      ${whereClause}
      ORDER BY a.antigen_target, a.clone
    `, params);

    res.json(rows);
  } catch (err) {
    next(err);
  }
};
