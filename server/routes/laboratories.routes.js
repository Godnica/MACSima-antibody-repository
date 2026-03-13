const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/laboratories.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

const labValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  validate,
];

router.get('/',     auth, ctrl.getAll);
router.post('/',    auth, adminOnly, ...labValidators, ctrl.create);
router.put('/:id',  auth, adminOnly, ...labValidators, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

module.exports = router;
