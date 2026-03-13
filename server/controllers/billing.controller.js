const pool = require('../db/pool');
const pdfGenerator = require('../utils/pdfGenerator');

exports.getBillingData = async (req, res, next) => {
  try {
    // Fetch experiment
    const { rows: [experiment] } = await pool.query(`
      SELECT e.*, l.name AS requesting_lab_name
      FROM experiments e
      LEFT JOIN laboratories l ON e.requesting_lab_id = l.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    if (experiment.status === 'planning') {
      return res.status(400).json({ error: 'Experiment has not been executed yet' });
    }

    // Fetch all experiment antibodies grouped by owner lab
    const { rows: antibodies } = await pool.query(`
      SELECT ea.total_ul_used, ea.total_chf,
             a.tube_number, a.antigen_target, a.clone, a.fluorochrome, a.chf_per_ul, a.lab_id,
             l.name AS lab_name, l.pi_name, l.email, l.billing_address
      FROM experiment_antibodies ea
      JOIN antibodies a ON ea.antibody_id = a.id
      JOIN laboratories l ON a.lab_id = l.id
      WHERE ea.experiment_id = $1
      ORDER BY l.name, a.tube_number
    `, [req.params.id]);

    // Group by lab
    const labMap = {};
    for (const ab of antibodies) {
      if (!labMap[ab.lab_id]) {
        labMap[ab.lab_id] = {
          lab_id: ab.lab_id,
          lab_name: ab.lab_name,
          pi_name: ab.pi_name,
          email: ab.email,
          billing_address: ab.billing_address,
          antibodies: [],
          total_cost: 0,
        };
      }
      const entry = {
        tube_number: ab.tube_number,
        target: ab.antigen_target,
        clone: ab.clone,
        fluorochrome: ab.fluorochrome,
        total_ul_used: parseFloat(ab.total_ul_used),
        chf_per_ul: parseFloat(ab.chf_per_ul),
        total_chf: parseFloat(ab.total_chf),
      };
      labMap[ab.lab_id].antibodies.push(entry);
      labMap[ab.lab_id].total_cost += entry.total_chf;
    }

    res.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        date: experiment.date,
        status: experiment.status,
        requesting_lab_name: experiment.requesting_lab_name,
      },
      labs: Object.values(labMap),
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadPdf = async (req, res, next) => {
  try {
    const { id, labId } = req.params;

    // Fetch experiment
    const { rows: [experiment] } = await pool.query(`
      SELECT e.*, l.name AS requesting_lab_name
      FROM experiments e
      LEFT JOIN laboratories l ON e.requesting_lab_id = l.id
      WHERE e.id = $1
    `, [id]);

    if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
    if (experiment.status === 'planning') {
      return res.status(400).json({ error: 'Experiment has not been executed yet' });
    }

    // Fetch lab info
    const { rows: [lab] } = await pool.query(
      'SELECT * FROM laboratories WHERE id = $1', [labId]
    );
    if (!lab) return res.status(404).json({ error: 'Laboratory not found' });

    // Fetch antibodies for this lab in this experiment
    const { rows: antibodies } = await pool.query(`
      SELECT ea.total_ul_used, ea.total_chf,
             a.tube_number, a.antigen_target, a.clone, a.fluorochrome, a.chf_per_ul
      FROM experiment_antibodies ea
      JOIN antibodies a ON ea.antibody_id = a.id
      WHERE ea.experiment_id = $1 AND a.lab_id = $2
      ORDER BY a.tube_number
    `, [id, labId]);

    if (antibodies.length === 0) {
      return res.status(404).json({ error: 'No antibodies found for this lab in this experiment' });
    }

    const abData = antibodies.map(ab => ({
      tube_number: ab.tube_number,
      target: ab.antigen_target,
      clone: ab.clone,
      fluorochrome: ab.fluorochrome,
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
      requestingLab: experiment.requesting_lab_name || '—',
      ownerLab: lab.name,
      ownerLabPI: lab.pi_name,
      billingAddress: lab.billing_address,
      antibodies: abData,
      totalCost,
    };

    const safeName = experiment.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeLabName = lab.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="billing_${safeName}_${safeLabName}.pdf"`);

    const doc = pdfGenerator.generateBillingPdf(data);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
};
