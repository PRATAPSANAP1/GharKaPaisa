const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const ctrl = require('./controller.js');
const bankDirectLinksCtrl = require('../super-admin/bankDirectLinks.controller.js');
const { upload } = require('../../services/aws/s3.service.js');

// Bank-Specific Direct Process Link endpoints
router.get('/direct-process-links', jwtAuth, bankDirectLinksCtrl.listBankDirectProcessLinks);
router.get('/:bankId/direct-process-link', jwtAuth, bankDirectLinksCtrl.getBankDirectProcessLinkByBankId);
router.post('/direct-process-links', jwtAuth, roleCheck('SUPER_ADMIN'), bankDirectLinksCtrl.upsertBankDirectProcessLink);
router.put('/:bankId/direct-process-link', jwtAuth, roleCheck('SUPER_ADMIN'), bankDirectLinksCtrl.upsertBankDirectProcessLink);

// Public endpoints to fetch banks (Home page, partner panel, etc.)
router.get('/', ctrl.listAllBanks);
router.get('/active', ctrl.getActiveBanks);
router.get('/:slug/cards', ctrl.getBankCardsBySlug);
router.get('/:id', ctrl.getBankById);

// Admin / Super Admin protected endpoints for Bank CRUD
router.post('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), ctrl.createBank);
router.put('/:id', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), ctrl.updateBank);
router.put('/:id/direct-link', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_HEAD'), ctrl.updateBankDirectLink);
router.patch('/:id/direct-link', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_HEAD'), ctrl.updateBankDirectLink);
router.patch('/:id/status', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateBankStatus);
router.delete('/:id', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.deleteBank);

module.exports = router;
