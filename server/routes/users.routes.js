const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/users.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

router.get('/', auth, adminOnly, ctrl.getAll);

router.post('/', auth, adminOnly,
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  body('display_name').optional({ values: 'falsy' }).trim(),
  validate,
  ctrl.create
);

router.delete('/:id', auth, adminOnly, ctrl.remove);

router.post('/:id/reset-password', auth, adminOnly,
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
  ctrl.resetPassword
);

module.exports = router;
