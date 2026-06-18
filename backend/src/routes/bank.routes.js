const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const ctrl = require('../controllers/bank.controller');

// Require authentication and admin or superadmin authorization globally for banks CRUD
router.use(jwtAuth);
router.use(roleCheck('admin', 'super_admin'));

router.get('/', ctrl.listAllBanks);
router.post('/', ctrl.createBank);
router.put('/:id', ctrl.updateBank);
router.delete('/:id', ctrl.deleteBank);

module.exports = router;
