const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');

const partnerCtrl = require('../controllers/partner.controller');
const authCtrl = require('../controllers/auth.controller');
const appCtrl = require('../controllers/application.controller');
const productCtrl = require('../controllers/product.controller');
const walletCtrl = require('../controllers/wallet.controller');

const { validate, commissionRules } = require('../middleware/validation.middleware');

// All admin routes require authenticated Firebase token
router.use(jwtAuth);

// ── GET /admin/partners ──────────────────────────────────────────────────────
router.get('/partners', roleCheck('admin', 'super_admin'), partnerCtrl.listPartners);

// ── POST /admin/approve-kyc ──────────────────────────────────────────────────
router.post('/approve-kyc', roleCheck('admin', 'super_admin'), partnerCtrl.approvePartnerKYC);

// ── POST /admin/update-role ──────────────────────────────────────────────────
router.post('/update-role', roleCheck('admin', 'super_admin'), authCtrl.setRole);

// ── GET /admin/applications ──────────────────────────────────────────────────
router.get('/applications', roleCheck('admin', 'super_admin', 'employee'), appCtrl.listApplications);

// ── POST /admin/commission-rule ──────────────────────────────────────────────
router.post('/commission-rule', roleCheck('super_admin'), commissionRules, validate, productCtrl.setCommission);

// ── POST /admin/withdrawal/approve ───────────────────────────────────────────
router.post('/withdrawal/approve', roleCheck('admin', 'super_admin'), walletCtrl.approveWithdrawalController);

// ── POST /admin/withdrawal/reject ────────────────────────────────────────────
router.post('/withdrawal/reject', roleCheck('admin', 'super_admin'), walletCtrl.rejectWithdrawalController);

// ── POST /admin/wallet/adjust ────────────────────────────────────────────────
router.post('/wallet/adjust', roleCheck('admin', 'super_admin'), walletCtrl.adminAdjustWalletController);

module.exports = router;
