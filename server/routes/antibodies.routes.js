const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/antibodies.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

const antibodyValidators = [
  body('lab_id').isInt({ min: 1 }).withMessage('Lab is required'),
  body('tube_number').trim().notEmpty().withMessage('Tube number is required'),
  body('volume_on_arrival').isFloat({ gt: 0 }).withMessage('Volume must be > 0'),
  body('cost_chf').isFloat({ gt: 0 }).withMessage('Cost must be > 0'),
  body('current_volume').optional().isFloat({ min: 0 }).withMessage('Current volume must be >= 0'),
  validate,
];

router.get('/',             auth, ctrl.getAll);
router.get('/combinations', auth, ctrl.getCombinations);
router.get('/low-stock',    auth, adminOnly, ctrl.getLowStock);
router.post('/',         auth, adminOnly, ...antibodyValidators, ctrl.create);
router.put('/:id',       auth, adminOnly, ...antibodyValidators, ctrl.update);
router.delete('/:id',    auth, adminOnly, ctrl.remove);

module.exports = router;
