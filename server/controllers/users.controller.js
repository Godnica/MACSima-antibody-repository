const bcrypt = require('bcrypt');
const pool = require('../db/pool');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, display_name, role, must_change_password, created_at FROM users ORDER BY created_at'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { username, password, role, display_name } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role, display_name, must_change_password)
       VALUES ($1, $2, $3, $4, true) RETURNING id, username, display_name, role, must_change_password, created_at`,
      [username, passwordHash, role || 'user', display_name || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { rowCount } = await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2',
      [passwordHash, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};
