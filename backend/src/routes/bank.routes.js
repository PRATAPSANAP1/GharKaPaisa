const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const ctrl = require('../controllers/bank.controller');

// Require authentication and admin or superadmin authorization globally for banks CRUD
router.use(jwtAuth);
router.use(roleCheck('ADMIN', 'SUPER_ADMIN'));

router.get('/', ctrl.listAllBanks);
router.post('/', ctrl.createBank);
router.put('/:id', ctrl.updateBank);
router.delete('/:id', roleCheck('SUPER_ADMIN'), ctrl.deleteBank);

module.exports = router;
