const express = require('express');
const router = express.Router();
const ctrl = require('./bank_card_application.controller.js');
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);

router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.createBankCardApplication);
router.patch('/:id/assist', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.updateAssistFields);
router.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.updateStatusFields);
router.patch('/:id/decline', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.updateDeclineFields);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.listBankCardApplications);
router.get('/reports', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.getBankCardReports);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.getBankCardApplicationById);

module.exports = router;
