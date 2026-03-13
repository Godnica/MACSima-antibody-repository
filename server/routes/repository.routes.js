const router = require('express').Router();
const ctrl = require('../controllers/repository.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);

module.exports = router;
