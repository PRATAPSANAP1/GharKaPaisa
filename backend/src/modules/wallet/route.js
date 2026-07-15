const express = require('express');
const router = express.Router();
const walletCtrl = require('./controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, requireApprovedPartnerOrAdmin, selfOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { withdrawalRules, validate } = require('../../middleware/validation/validation.middleware.js');
const { withdrawalOtpLimiter, validateBankDetails, validateWithdrawalAmount } = require('./middleware.js');

router.use(authenticate, syncUser);

// Bank Details: All (Sub-routes declared first to eliminate path conflicts)
router.get('/bank-details/all', requireApprovedPartnerOrAdmin, walletCtrl.getAllBankDetails);
router.get('/bank-details/history', requireApprovedPartnerOrAdmin, walletCtrl.getBankEditHistory);
router.post('/bank-details/secondary', requireApprovedPartner, validateBankDetails, walletCtrl.addSecondaryBankDetail);
router.post('/bank-details/primary', requireApprovedPartner, walletCtrl.setPrimaryBank);
router.post('/bank-details/verify/penny-drop', requireApprovedPartner, walletCtrl.verifyBankPennyDrop);
router.post('/bank-details/verify/upi', requireApprovedPartner, walletCtrl.verifyBankUPI);
router.get('/bank-details', requireApprovedPartnerOrAdmin, walletCtrl.getBankDetails);
router.post('/bank-details', requireApprovedPartnerOrAdmin, validateBankDetails, walletCtrl.saveBankDetails);
router.put('/bank-details', requireApprovedPartnerOrAdmin, validateBankDetails, walletCtrl.saveBankDetails);

// Withdrawals Routing (Admin & Polymorphic Partner Handlers)
router.get('/admin/withdrawals', requireApprovedPartnerOrAdmin, walletCtrl.listWithdrawals);
router.get('/my-withdrawals', requireApprovedPartner, walletCtrl.listPartnerWithdrawals);

// Withdrawals Routing (Admin & Polymorphic Partner Handlers)
router.get('/admin/withdrawals', requireApprovedPartnerOrAdmin, walletCtrl.listWithdrawals);
router.get('/my-withdrawals', requireApprovedPartner, walletCtrl.listPartnerWithdrawals);
router.get('/withdrawals', requireApprovedPartnerOrAdmin, walletCtrl.listWithdrawals);
router.patch('/withdrawals/:id/process', authorize('SUPER_ADMIN'), walletCtrl.processWithdrawalRequest);
router.post('/withdrawals/:id/cancel', requireApprovedPartner, walletCtrl.cancelWithdrawal);
router.post('/withdrawals/:id/retry', requireApprovedPartner, walletCtrl.retryWithdrawal);
router.get('/withdrawals/:id', requireApprovedPartnerOrAdmin, walletCtrl.getWithdrawalDetail);

// Partner self-endpoints (no ID needed in URL)
router.get('/', requireApprovedPartnerOrAdmin, walletCtrl.getWallet);
router.get('/dashboard', requireApprovedPartnerOrAdmin, walletCtrl.getWalletDashboard);
router.get('/balance', requireApprovedPartnerOrAdmin, walletCtrl.getWallet);
router.get('/ledger', requireApprovedPartnerOrAdmin, walletCtrl.getWalletLedger);
router.get('/transactions', requireApprovedPartnerOrAdmin, walletCtrl.getTransactions);
router.get('/commission-summary', requireApprovedPartnerOrAdmin, walletCtrl.getCommissionSummary);
router.get('/analytics', requireApprovedPartnerOrAdmin, walletCtrl.getWalletAnalyticsController);
router.get('/reconciliation', requireApprovedPartnerOrAdmin, walletCtrl.getWalletReconciliationController);
router.get('/statement', requireApprovedPartnerOrAdmin, walletCtrl.getWalletStatementController);

// Statement Export
router.get('/statement/pdf', requireApprovedPartnerOrAdmin, walletCtrl.exportStatementPDF);
router.get('/statement/excel', requireApprovedPartnerOrAdmin, walletCtrl.exportStatementExcel);

// OTP & Withdrawals (Partner)
router.post('/withdraw/otp/send', withdrawalOtpLimiter, requireApprovedPartnerOrAdmin, walletCtrl.sendWithdrawalOTP);
router.post('/withdraw/otp/verify', requireApprovedPartnerOrAdmin, walletCtrl.verifyWithdrawalOTP);
router.post('/withdraw', requireApprovedPartnerOrAdmin, validateWithdrawalAmount, withdrawalRules, validate, walletCtrl.requestWithdrawal);
router.post('/:PartnerId/withdraw', selfOrAdmin('PartnerId'), requireApprovedPartnerOrAdmin, withdrawalRules, validate, walletCtrl.requestWithdrawal);

module.exports = router;
