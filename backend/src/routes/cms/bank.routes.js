const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/role.middleware.js');
const ctrl = require('../../controllers/bank/bank.controller.js');
const { upload } = require('../../services/partner/s3.service.js');

// Require authentication and admin or superadmin authorization globally for banks CRUD
router.use(jwtAuth);
router.use(roleCheck('ADMIN', 'SUPER_ADMIN'));

router.get('/', ctrl.listAllBanks);
router.post('/', upload.single('logo'), ctrl.createBank);
router.put('/:id', upload.single('logo'), ctrl.updateBank);
router.delete('/:id', roleCheck('SUPER_ADMIN'), ctrl.deleteBank);

module.exports = router;
