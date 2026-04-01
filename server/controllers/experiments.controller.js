const pool = require('../db/pool');
const calc = require('../utils/calculations');
const pdfGenerator = require('../utils/pdfGenerator');

// ── Experiments CRUD ──────────────────────────────────────────────────────────

exports.getAll = async (req, res, next) => {
  try {
    const { antigen_target, clone } = req.query;

    let antibodyFilter = '';
    let params = [];
    let i = 1;

    if (antigen_target && clone) {
      antibodyFilter = `
        AND e.id IN (
          SELECT ea_filter.experiment_id
          FROM experiment_antibodies ea_filter
          JOIN antibodies a_filter ON ea_filter.antibody_id = a_filter.id
          WHERE a_filter.antigen_target = $${i++} AND a_filter.clone = $${i++}
        )
      `;
      params.push(antigen_target, clone);
    }

    const { rows } = await pool.query(`
      SELECT e.*, l.name AS requesting_lab_name,
        CASE WHEN e.status = 'planning' THEN EXISTS (
          SELECT 1 FROM experiment_antibodies ea
          JOIN antibodies a ON ea.antibody_id = a.id
          WHERE ea.experiment_id = e.id AND a.current_volume < ea.total_ul_used
        ) ELSE false END AS has_insufficient_volume
      FROM experiments e
      LEFT JOIN laboratories l ON e.requesting_lab_id = l.id
      WHERE 1=1 ${antibodyFilter}
      ORDER BY e.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, l.name AS requesting_lab_name
      FROM experiments e
      LEFT JOIN laboratories l ON e.requesting_lab_id = l.id
      WHERE e.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Experiment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, date, requesting_lab_id, macswell_slides, total_cocktail_volume, experiment_type } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO experiments (name, date, requesting_lab_id, macswell_slides, total_cocktail_volume, experiment_type)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [name, date || null, requesting_lab_id || null, macswell_slides, total_cocktail_volume, experiment_type || null]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { rows: [exp] } = await pool.query('SELECT status FROM experiments WHERE id=$1', [req.params.id]);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    if (exp.status !== 'planning') return res.status(400).json({ error: 'Only planning experiments can be edited' });

    const { name, date, requesting_lab_id, macswell_slides, total_cocktail_volume, experiment_type } = req.body;
    const { rows } = await pool.query(`
      UPDATE experiments SET name=$1, date=$2, requesting_lab_id=$3, macswell_slides=$4, total_cocktail_volume=$5, experiment_type=$6
      WHERE id=$7 RETURNING *
    `, [name, date || null, requesting_lab_id || null, macswell_slides, total_cocktail_volume, experiment_type || null, req.params.id]);

    // Recalculate all experiment_antibodies since slides/volume may have changed
    await recalculateAll(req.params.id, macswell_slides, total_cocktail_volume);

    res.json(rows[0]);
  } catch (err) { next(err); }
};

// ── Quote PDF ────────────────────────────────────────────────────────────────

exports.quotePdf = async (req, res, next) => {
  try {
    const { rows: [experiment] } = await pool.query(`
      SELECT e.*, l.name AS requesting_lab_name
      FROM experiments e
      LEFT JOIN laboratories l ON e.requesting_lab_id = l.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

    const { rows: antibodies } = await pool.query(`
      SELECT ea.titration_ratio, ea.ul_per_slide, ea.total_ul_used, ea.total_chf,
             a.tube_number, a.antigen_target, a.clone, a.fluorochrome, a.chf_per_ul,
             l.name AS lab_name
      FROM experiment_antibodies ea
      JOIN antibodies a ON ea.antibody_id = a.id
      JOIN laboratories l ON a.lab_id = l.id
      WHERE ea.experiment_id = $1
      ORDER BY ea.id
    `, [req.params.id]);

    const abData = antibodies.map(ab => ({
      tube_number: ab.tube_number,
      target: ab.antigen_target,
      clone: ab.clone,
      fluorochrome: ab.fluorochrome,
      lab_name: ab.lab_name,
      titration_ratio: parseInt(ab.titration_ratio),
      ul_per_slide: parseFloat(ab.ul_per_slide),
      total_ul_used: parseFloat(ab.total_ul_used),
      chf_per_ul: parseFloat(ab.chf_per_ul),
      total_chf: parseFloat(ab.total_chf),
    }));

    const totalCost = abData.reduce((sum, ab) => sum + ab.total_chf, 0);

    const expDate = experiment.date
      ? new Date(experiment.date).toLocaleDateString('en-GB')
      : '—';

    const data = {
      experimentName: experiment.name,
      experimentDate: expDate,
      experimentType: experiment.experiment_type || '',
      requestingLab: experiment.requesting_lab_name || '—',
      macswellSlides: parseInt(experiment.macswell_slides),
      totalCocktailVolume: parseFloat(experiment.total_cocktail_volume),
      antibodies: abData,
      totalCost,
    };

    const safeName = experiment.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote_${safeName}.pdf"`);

    const doc = pdfGenerator.generateQuotePdf(data);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
};

// ── Execute (Planning → Executed Not Billed) ─────────────────────────────────

exports.execute = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [experiment] } = await client.query(
      'SELECT * FROM experiments WHERE id=$1', [req.params.id]
    );
    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    if (experiment.status !== 'planning') {
      return res.status(400).json({ error: 'Only planning experiments can be executed' });
    }

    const { rows: expAntibodies } = await client.query(`
      SELECT ea.*, a.current_volume, a.tube_number, a.antigen_target
      FROM experiment_antibodies ea
      JOIN antibodies a ON ea.antibody_id = a.id
      WHERE ea.experiment_id = $1
    `, [req.params.id]);

    const insufficient = expAntibodies.filter(
      ea => parseFloat(ea.current_volume) < parseFloat(ea.total_ul_used)
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
        })),
      });
    }

    for (const ea of expAntibodies) {
      await client.query(
        'UPDATE antibodies SET current_volume = current_volume - $1 WHERE id = $2',
        [ea.total_ul_used, ea.antibody_id]
      );
    }

    await client.query(
      "UPDATE experiments SET status='executed_not_billed' WHERE id=$1", [req.params.id]
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

// ── Mark Billed ───────────────────────────────────────────────────────────────

exports.markBilled = async (req, res, next) => {
  try {
    const { rows: [exp] } = await pool.query('SELECT status FROM experiments WHERE id=$1', [req.params.id]);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    if (exp.status !== 'executed_not_billed') {
      return res.status(400).json({ error: 'Only executed_not_billed experiments can be marked as billed' });
    }
    const { rows } = await pool.query(
      "UPDATE experiments SET status='executed_billed' WHERE id=$1 RETURNING *", [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// ── Experiment Antibodies ─────────────────────────────────────────────────────

exports.getAntibodies = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT ea.*,
             a.tube_number, a.antigen_target, a.clone, a.fluorochrome,
             a.chf_per_ul, a.current_volume,
             l.name AS lab_name
      FROM experiment_antibodies ea
      JOIN antibodies a ON ea.antibody_id = a.id
      JOIN laboratories l ON a.lab_id = l.id
      WHERE ea.experiment_id = $1
      ORDER BY ea.id
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.addAntibody = async (req, res, next) => {
  try {
    const { rows: [exp] } = await pool.query('SELECT * FROM experiments WHERE id=$1', [req.params.id]);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    if (exp.status !== 'planning') return res.status(400).json({ error: 'Experiment is not in planning status' });

    const { antibody_id, titration_ratio } = req.body;
    const { rows: [ab] } = await pool.query('SELECT chf_per_ul FROM antibodies WHERE id=$1', [antibody_id]);
    if (!ab) return res.status(404).json({ error: 'Antibody not found' });

    const ulSlide  = calc.ulPerSlide(parseFloat(exp.total_cocktail_volume), parseInt(titration_ratio));
    const totalUl  = calc.totalUlUsed(ulSlide, parseInt(exp.macswell_slides));
    const totalChf = calc.totalChf(totalUl, parseFloat(ab.chf_per_ul));

    const { rows } = await pool.query(`
      INSERT INTO experiment_antibodies
        (experiment_id, antibody_id, titration_ratio, ul_per_slide, total_ul_used, total_chf)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.params.id, antibody_id, titration_ratio, ulSlide, totalUl, totalChf]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.updateAntibody = async (req, res, next) => {
  try {
    const { rows: [exp] } = await pool.query('SELECT * FROM experiments WHERE id=$1', [req.params.id]);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    if (exp.status !== 'planning') return res.status(400).json({ error: 'Experiment is not in planning status' });

    const { titration_ratio } = req.body;
    const { rows: [ea] } = await pool.query('SELECT * FROM experiment_antibodies WHERE id=$1', [req.params.eaId]);
    if (!ea) return res.status(404).json({ error: 'Record not found' });

    const { rows: [ab] } = await pool.query('SELECT chf_per_ul FROM antibodies WHERE id=$1', [ea.antibody_id]);

    const ulSlide  = calc.ulPerSlide(parseFloat(exp.total_cocktail_volume), parseInt(titration_ratio));
    const totalUl  = calc.totalUlUsed(ulSlide, parseInt(exp.macswell_slides));
    const totalChf = calc.totalChf(totalUl, parseFloat(ab.chf_per_ul));

    const { rows } = await pool.query(`
      UPDATE experiment_antibodies
      SET titration_ratio=$1, ul_per_slide=$2, total_ul_used=$3, total_chf=$4
      WHERE id=$5 RETURNING *
    `, [titration_ratio, ulSlide, totalUl, totalChf, req.params.eaId]);

    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.removeAntibody = async (req, res, next) => {
  try {
    const { rows: [exp] } = await pool.query('SELECT status FROM experiments WHERE id=$1', [req.params.id]);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });
    if (exp.status !== 'planning') return res.status(400).json({ error: 'Experiment is not in planning status' });

    await pool.query('DELETE FROM experiment_antibodies WHERE id=$1', [req.params.eaId]);
    res.json({ message: 'Antibody removed from experiment' });
  } catch (err) { next(err); }
};

// ── Helper ────────────────────────────────────────────────────────────────────

async function recalculateAll(experimentId, macswell_slides, total_cocktail_volume) {
  const { rows: eas } = await pool.query(`
    SELECT ea.id, ea.titration_ratio, a.chf_per_ul
    FROM experiment_antibodies ea
    JOIN antibodies a ON ea.antibody_id = a.id
    WHERE ea.experiment_id = $1
  `, [experimentId]);

  for (const ea of eas) {
    const ulSlide  = calc.ulPerSlide(parseFloat(total_cocktail_volume), parseInt(ea.titration_ratio));
    const totalUl  = calc.totalUlUsed(ulSlide, parseInt(macswell_slides));
    const totalChf = calc.totalChf(totalUl, parseFloat(ea.chf_per_ul));
    await pool.query(
      'UPDATE experiment_antibodies SET ul_per_slide=$1, total_ul_used=$2, total_chf=$3 WHERE id=$4',
      [ulSlide, totalUl, totalChf, ea.id]
    );
  }
}
