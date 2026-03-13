const pool = require('../db/pool');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM laboratories ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, pi_name, email, billing_address } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO laboratories (name, pi_name, email, billing_address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, pi_name, email, billing_address]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, pi_name, email, billing_address } = req.body;
    const { rows } = await pool.query(
      `UPDATE laboratories SET name=$1, pi_name=$2, email=$3, billing_address=$4
       WHERE id=$5 RETURNING *`,
      [name, pi_name, email, billing_address, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Laboratory not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM laboratories WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Laboratory not found' });
    res.json({ message: 'Laboratory deleted' });
  } catch (err) {
    next(err);
  }
};
