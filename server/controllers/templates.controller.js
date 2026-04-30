const pool = require('../db/pool');
const calc = require('../utils/calculations');

// ── Templates CRUD ────────────────────────────────────────────────────────────

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*,
             l.name AS requesting_lab_name,
             (SELECT COUNT(*)::int FROM experiment_template_antibodies tab WHERE tab.template_id = t.id) AS antibody_count
      FROM experiment_templates t
      LEFT JOIN laboratories l ON t.requesting_lab_id = l.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, l.name AS requesting_lab_name
      FROM experiment_templates t
      LEFT JOIN laboratories l ON t.requesting_lab_id = l.id
      WHERE t.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Template not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, requesting_lab_id, experiment_type, macswell_slides, total_cocktail_volume, notes } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO experiment_templates
        (name, requesting_lab_id, experiment_type, macswell_slides, total_cocktail_volume, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [
      name,
      requesting_lab_id || null,
      experiment_type || null,
      macswell_slides || null,
      total_cocktail_volume || null,
      notes || null,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, requesting_lab_id, experiment_type, macswell_slides, total_cocktail_volume, notes } = req.body;
    const { rows } = await pool.query(`
      UPDATE experiment_templates
      SET name=$1, requesting_lab_id=$2, experiment_type=$3, macswell_slides=$4, total_cocktail_volume=$5, notes=$6
      WHERE id=$7 RETURNING *
    `, [
      name,
      requesting_lab_id || null,
      experiment_type || null,
      macswell_slides || null,
      total_cocktail_volume || null,
      notes || null,
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: 'Template not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM experiment_templates WHERE id=$1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
};

// ── Template Antibodies ───────────────────────────────────────────────────────

exports.getAntibodies = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT tab.*,
             a.tube_number, a.antibody_code, a.antigen_target, a.clone, a.fluorochrome,
             a.chf_per_ul, a.current_volume, a.volume_on_arrival, a.status,
             l.name AS lab_name, l.pi_name
      FROM experiment_template_antibodies tab
      JOIN antibodies a ON tab.antibody_id = a.id
      JOIN laboratories l ON a.lab_id = l.id
      WHERE tab.template_id = $1
      ORDER BY tab.id
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.addAntibody = async (req, res, next) => {
  try {
    const { rows: [t] } = await pool.query('SELECT id FROM experiment_templates WHERE id=$1', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Template not found' });

    const { antibody_id, titration_ratio } = req.body;
    const { rows: [ab] } = await pool.query('SELECT id FROM antibodies WHERE id=$1', [antibody_id]);
    if (!ab) return res.status(404).json({ error: 'Antibody not found' });

    const { rows } = await pool.query(`
      INSERT INTO experiment_template_antibodies (template_id, antibody_id, titration_ratio)
      VALUES ($1,$2,$3) RETURNING *
    `, [req.params.id, antibody_id, titration_ratio]);

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Antibody already in this template' });
    }
    next(err);
  }
};

exports.updateAntibody = async (req, res, next) => {
  try {
    const { titration_ratio } = req.body;
    const { rows } = await pool.query(`
      UPDATE experiment_template_antibodies
      SET titration_ratio=$1
      WHERE id=$2 AND template_id=$3 RETURNING *
    `, [titration_ratio, req.params.tabId, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.removeAntibody = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM experiment_template_antibodies WHERE id=$1 AND template_id=$2',
      [req.params.tabId, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Antibody removed from template' });
  } catch (err) { next(err); }
};

// ── Save experiment as template ───────────────────────────────────────────────

exports.saveExperimentAsTemplate = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [exp] } = await client.query('SELECT * FROM experiments WHERE id=$1', [req.params.id]);
    if (!exp) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const { name, notes } = req.body;
    if (!name || !String(name).trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Template name is required' });
    }

    const { rows: [template] } = await client.query(`
      INSERT INTO experiment_templates
        (name, requesting_lab_id, experiment_type, macswell_slides, total_cocktail_volume, notes)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [
      name.trim(),
      exp.requesting_lab_id,
      exp.experiment_type,
      exp.macswell_slides,
      exp.total_cocktail_volume,
      notes || null,
    ]);

    await client.query(`
      INSERT INTO experiment_template_antibodies (template_id, antibody_id, titration_ratio)
      SELECT $1, ea.antibody_id, ea.titration_ratio
      FROM experiment_antibodies ea
      WHERE ea.experiment_id = $2
    `, [template.id, exp.id]);

    await client.query('COMMIT');
    res.status(201).json(template);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── Instantiate template into a new experiment ────────────────────────────────

exports.instantiate = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [tpl] } = await client.query(
      'SELECT * FROM experiment_templates WHERE id=$1', [req.params.id]
    );
    if (!tpl) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Template not found' });
    }

    const {
      name,
      date,
      requesting_lab_id,
      macswell_slides,
      total_cocktail_volume,
      experiment_type,
    } = req.body;

    if (!name || !String(name).trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Experiment name is required' });
    }

    const slides    = parseInt(macswell_slides ?? tpl.macswell_slides);
    const cocktail  = parseFloat(total_cocktail_volume ?? tpl.total_cocktail_volume);

    if (!Number.isFinite(slides) || slides < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'macswell_slides must be >= 1' });
    }
    if (!Number.isFinite(cocktail) || cocktail <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'total_cocktail_volume must be > 0' });
    }

    const { rows: [exp] } = await client.query(`
      INSERT INTO experiments
        (name, date, requesting_lab_id, status, macswell_slides, total_cocktail_volume, experiment_type)
      VALUES ($1,$2,$3,'planning',$4,$5,$6) RETURNING *
    `, [
      name.trim(),
      date || null,
      requesting_lab_id ?? tpl.requesting_lab_id ?? null,
      slides,
      cocktail,
      experiment_type ?? tpl.experiment_type ?? null,
    ]);

    const { rows: tplAbs } = await client.query(`
      SELECT tab.antibody_id, tab.titration_ratio, a.chf_per_ul
      FROM experiment_template_antibodies tab
      JOIN antibodies a ON tab.antibody_id = a.id
      WHERE tab.template_id = $1
    `, [tpl.id]);

    for (const ta of tplAbs) {
      const ulSlide  = calc.ulPerSlide(cocktail, parseInt(ta.titration_ratio));
      const totalUl  = calc.totalUlUsed(ulSlide, slides);
      const totalChf = calc.totalChf(totalUl, parseFloat(ta.chf_per_ul));
      await client.query(`
        INSERT INTO experiment_antibodies
          (experiment_id, antibody_id, titration_ratio, ul_per_slide, total_ul_used, total_chf)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [exp.id, ta.antibody_id, ta.titration_ratio, ulSlide, totalUl, totalChf]);
    }

    await client.query('COMMIT');
    res.status(201).json(exp);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
