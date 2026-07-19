const express = require('express');
const router = express.Router();
const insCtrl = require('./insurance_application.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);

router.post('/', requireApprovedPartnerOrAdmin, insCtrl.submitInsuranceApplication);
router.get('/', requireApprovedPartnerOrAdmin, insCtrl.listInsuranceApplications);
router.get('/reports', requireApprovedPartnerOrAdmin, insCtrl.getInsuranceReports);
router.put('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), insCtrl.updateInsuranceStatus);

module.exports = router;
