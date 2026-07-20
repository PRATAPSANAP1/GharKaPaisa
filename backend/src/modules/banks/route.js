const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const ctrl = require('./controller.js');
const { upload } = require('../../services/aws/s3.service.js');

// Public endpoints to fetch banks (Home page, partner panel, etc.)
router.get('/', ctrl.listAllBanks);
router.get('/active', ctrl.getActiveBanks);
router.get('/:id', ctrl.getBankById);
router.get('/:slug/cards', ctrl.getBankCardsBySlug);

// Admin / Super Admin protected endpoints for Bank CRUD
router.post('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), upload.single('logo'), ctrl.createBank);
router.put('/:id', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), upload.single('logo'), ctrl.updateBank);
router.patch('/:id/status', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateBankStatus);
router.delete('/:id', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.deleteBank);

module.exports = router;
