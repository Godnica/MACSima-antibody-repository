const router = require('express').Router();
const ctrl = require('../controllers/billing.controller');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/experiment/:id',            auth, adminOnly, ctrl.getBillingData);
router.get('/experiment/:id/pdf/:labId', auth, adminOnly, ctrl.downloadPdf);

module.exports = router;
