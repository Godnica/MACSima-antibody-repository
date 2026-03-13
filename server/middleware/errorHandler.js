module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    let msg = 'Duplicate entry';
    if (err.constraint === 'antibodies_tube_number_key') msg = 'Tube number already exists';
    else if (err.constraint === 'laboratories_name_key') msg = 'Laboratory name already exists';
    else if (err.constraint === 'users_username_key') msg = 'Username already exists';
    return res.status(409).json({ error: msg, detail: err.detail });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record not found', detail: err.detail });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
