const express = require('express');
const router = express.Router();
const walletCtrl = require('./controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, requireApprovedPartnerOrAdmin, selfOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { withdrawalRules, validate } = require('../../middleware/validation/validation.middleware.js');

router.use(authenticate, syncUser);

// Admin endpoints
router.get('/admin/withdrawals', authorize('ADMIN', 'SUPER_ADMIN'), walletCtrl.listWithdrawals);
router.get('/bank-details/all', authorize('ADMIN', 'SUPER_ADMIN'), walletCtrl.getAllBankDetails);
router.patch('/withdrawals/:id/process', authorize('SUPER_ADMIN'), walletCtrl.processWithdrawalRequest);

// Partner self-endpoints (no ID needed in URL)
router.get('/', requireApprovedPartner, walletCtrl.getWallet);
router.get('/dashboard', requireApprovedPartner, walletCtrl.getWalletDashboard);
router.get('/balance', requireApprovedPartner, walletCtrl.getWallet);
router.get('/transactions', requireApprovedPartner, walletCtrl.getTransactions);
router.get('/commission-summary', requireApprovedPartner, walletCtrl.getCommissionSummary);

// Statement Export
router.get('/statement/pdf', requireApprovedPartner, walletCtrl.exportStatementPDF);
router.get('/statement/excel', requireApprovedPartner, walletCtrl.exportStatementExcel);

// OTP & Withdrawals (Partner)
router.post('/withdraw/otp/send', requireApprovedPartner, walletCtrl.sendWithdrawalOTP);
router.post('/withdraw/otp/verify', requireApprovedPartner, walletCtrl.verifyWithdrawalOTP);
router.post('/withdraw', requireApprovedPartner, withdrawalRules, validate, walletCtrl.requestWithdrawal);
router.get('/withdrawals', requireApprovedPartner, walletCtrl.listPartnerWithdrawals);
router.post('/withdrawals/:id/cancel', requireApprovedPartner, walletCtrl.cancelWithdrawal);
router.post('/withdrawals/:id/retry', requireApprovedPartner, walletCtrl.retryWithdrawal);
router.get('/withdrawals/:id', requireApprovedPartner, walletCtrl.getWithdrawalDetail);

// Bank details management (Partner)
router.get('/bank-details/history', requireApprovedPartner, walletCtrl.getBankEditHistory);
router.post('/bank-details/secondary', requireApprovedPartner, walletCtrl.addSecondaryBankDetail);
router.post('/bank-details/primary', requireApprovedPartner, walletCtrl.setPrimaryBank);
router.post('/bank-details/verify/penny-drop', requireApprovedPartner, walletCtrl.verifyBankPennyDrop);
router.post('/bank-details/verify/upi', requireApprovedPartner, walletCtrl.verifyBankUPI);
router.get('/bank-details', requireApprovedPartner, walletCtrl.getBankDetails);
router.post('/bank-details', requireApprovedPartner, walletCtrl.saveBankDetails);
router.put('/bank-details', requireApprovedPartner, walletCtrl.saveBankDetails);

router.get('/reports', requireApprovedPartner, walletCtrl.getWalletReports);

// Partner self or admin (with ID)
router.get('/:PartnerId', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, walletCtrl.getWallet);
router.get('/:PartnerId/transactions', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, walletCtrl.getTransactions);
router.get('/:PartnerId/case-summary', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, walletCtrl.getCaseSummary);
router.post('/:PartnerId/withdraw', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, withdrawalRules, validate, walletCtrl.requestWithdrawal);

module.exports = router;
