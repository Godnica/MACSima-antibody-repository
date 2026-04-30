const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/experiments.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');

const expValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('macswell_slides').isInt({ min: 1 }).withMessage('Slides must be >= 1'),
  body('total_cocktail_volume').isFloat({ gt: 0 }).withMessage('Cocktail volume must be > 0'),
  body('experiment_type').optional({ values: 'falsy' }).trim(),
  validate,
];

router.get('/',    auth, adminOnly, ctrl.getAll);
router.post('/',   auth, adminOnly, ...expValidators, ctrl.create);
router.get('/:id', auth, adminOnly, ctrl.getById);
router.put('/:id', auth, adminOnly, ...expValidators, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

router.get('/:id/quote-pdf',    auth, adminOnly, ctrl.quotePdf);
router.get('/:id/execution-csv',auth, adminOnly, ctrl.executionCsv);
router.post('/:id/save-as-template', auth, adminOnly,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('notes').optional({ values: 'falsy' }).trim(),
  validate,
  require('../controllers/templates.controller').saveExperimentAsTemplate
);
router.post('/:id/execute',     auth, adminOnly, ctrl.execute);
router.post('/:id/mark-billed', auth, adminOnly, ctrl.markBilled);

router.get('/:id/antibodies',          auth, adminOnly, ctrl.getAntibodies);
router.post('/:id/antibodies',         auth, adminOnly,
  body('antibody_id').isInt({ min: 1 }).withMessage('antibody_id required'),
  body('titration_ratio').isInt({ min: 1 }).withMessage('titration_ratio must be > 0'),
  validate,
  ctrl.addAntibody
);
router.post('/:id/antibodies/import',  auth, adminOnly, ctrl.importAntibodies);
router.put('/:id/antibodies/:eaId',    auth, adminOnly,
  body('titration_ratio').isInt({ min: 1 }).withMessage('titration_ratio must be > 0'),
  validate,
  ctrl.updateAntibody
);
router.delete('/:id/antibodies/:eaId', auth, adminOnly, ctrl.removeAntibody);

module.exports = router;
