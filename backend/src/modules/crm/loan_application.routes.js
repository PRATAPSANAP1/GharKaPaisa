const express = require('express');
const router = express.Router();
const loanCtrl = require('./loan_application.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);

router.post('/', requireApprovedPartnerOrAdmin, loanCtrl.submitLoanApplication);
router.get('/', requireApprovedPartnerOrAdmin, loanCtrl.listLoanApplications);
router.get('/reports', requireApprovedPartnerOrAdmin, loanCtrl.getLoanReports);
router.put('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), loanCtrl.updateLoanStatus);

module.exports = router;
