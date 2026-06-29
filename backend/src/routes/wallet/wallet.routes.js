const express = require('express');
const router = express.Router();
const walletCtrl = require('../../controllers/wallet/wallet.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, selfOrAdmin } = require('../../middleware/auth.middleware.js');
const { withdrawalRules, validate } = require('../../middleware/validation.middleware.js');

router.use(authenticate, syncUser);

// Admin: list/process withdrawals
router.get('/withdrawals', authorize('SUPER_ADMIN', 'ADMIN'), walletCtrl.listWithdrawals);
router.patch('/withdrawals/:id/process', authorize('SUPER_ADMIN'), walletCtrl.processWithdrawalRequest);

// Partner self-endpoints (no ID needed in URL)
router.get('/', walletCtrl.getWallet);
router.get('/balance', walletCtrl.getWallet);
router.get('/transactions', walletCtrl.getTransactions);
router.post('/withdraw', requireApprovedPartner, withdrawalRules, validate, walletCtrl.requestWithdrawal);

// Partner self or admin (with ID)
router.get('/:PartnerId', selfOrAdmin('PartnerId'), walletCtrl.getWallet);
router.get('/:PartnerId/transactions', selfOrAdmin('PartnerId'), walletCtrl.getTransactions);
router.get('/:PartnerId/case-summary', selfOrAdmin('PartnerId'), walletCtrl.getCaseSummary);
router.post('/:PartnerId/withdraw', selfOrAdmin('PartnerId'), requireApprovedPartner, withdrawalRules, validate, walletCtrl.requestWithdrawal);

module.exports = router;
