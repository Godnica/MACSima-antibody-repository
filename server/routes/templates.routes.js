const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/templates.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

const templateValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('requesting_lab_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid requesting lab'),
  body('macswell_slides').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Slides must be >= 1'),
  body('total_cocktail_volume').optional({ values: 'falsy' }).isFloat({ gt: 0 }).withMessage('Cocktail volume must be > 0'),
  body('experiment_type').optional({ values: 'falsy' }).trim(),
  body('notes').optional({ values: 'falsy' }).trim(),
  validate,
];

router.get('/', auth, adminOnly, ctrl.getAll);
router.post('/', auth, adminOnly, ...templateValidators, ctrl.create);
router.get('/:id', auth, adminOnly, ctrl.getById);
router.put('/:id', auth, adminOnly, ...templateValidators, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

router.post('/:id/instantiate', auth, adminOnly,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('requesting_lab_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid requesting lab'),
  body('macswell_slides').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Slides must be >= 1'),
  body('total_cocktail_volume').optional({ values: 'falsy' }).isFloat({ gt: 0 }).withMessage('Cocktail volume must be > 0'),
  body('experiment_type').optional({ values: 'falsy' }).trim(),
  validate,
  ctrl.instantiate
);

router.get('/:id/antibodies', auth, adminOnly, ctrl.getAntibodies);
router.post('/:id/antibodies', auth, adminOnly,
  body('antibody_id').isInt({ min: 1 }).withMessage('antibody_id required'),
  body('titration_ratio').isInt({ min: 1 }).withMessage('titration_ratio must be > 0'),
  validate,
  ctrl.addAntibody
);
router.put('/:id/antibodies/:tabId', auth, adminOnly,
  body('titration_ratio').isInt({ min: 1 }).withMessage('titration_ratio must be > 0'),
  validate,
  ctrl.updateAntibody
);
router.delete('/:id/antibodies/:tabId', auth, adminOnly, ctrl.removeAntibody);

module.exports = router;
