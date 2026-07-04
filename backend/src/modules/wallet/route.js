const express = require('express');
const router = express.Router();
const walletCtrl = require('./controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, requireApprovedPartnerOrAdmin, selfOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { withdrawalRules, validate } = require('../../middleware/validation/validation.middleware.js');

router.use(authenticate, syncUser);

// Admin: list/process withdrawals
router.get('/withdrawals', authorize('SUPER_ADMIN', 'ADMIN'), walletCtrl.listWithdrawals);
router.patch('/withdrawals/:id/process', authorize('SUPER_ADMIN'), walletCtrl.processWithdrawalRequest);

// Partner self-endpoints (no ID needed in URL)
router.get('/', requireApprovedPartner, walletCtrl.getWallet);
router.get('/balance', requireApprovedPartner, walletCtrl.getWallet);
router.get('/transactions', requireApprovedPartner, walletCtrl.getTransactions);
router.post('/withdraw', requireApprovedPartner, withdrawalRules, validate, walletCtrl.requestWithdrawal);

// Partner self or admin (with ID)
router.get('/:PartnerId', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, walletCtrl.getWallet);
router.get('/:PartnerId/transactions', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, walletCtrl.getTransactions);
router.get('/:PartnerId/case-summary', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, walletCtrl.getCaseSummary);
router.post('/:PartnerId/withdraw', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, withdrawalRules, validate, walletCtrl.requestWithdrawal);

module.exports = router;
