const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

const partnerCtrl = require('../partner/partner.controller.js');
const authCtrl = require('../auth/controller.js');
const appCtrl = require('../crm/application.controller.js');
const leadCtrl = require('../crm/lead.controller.js');
const productCtrl = require('../products/controller.js');
const walletCtrl = require('../wallet/controller.js');

const { validate, commissionRules } = require('../../middleware/validation/validation.middleware.js');

// All admin routes require authenticated Firebase token
router.use(jwtAuth);

// ── GET /admin/partners ──────────────────────────────────────────────────────
router.get('/partners', roleCheck('ADMIN', 'SUPER_ADMIN'), partnerCtrl.listPartners);

// ── POST /admin/approve-kyc ──────────────────────────────────────────────────
router.post('/approve-kyc', roleCheck('ADMIN', 'SUPER_ADMIN'), partnerCtrl.approvePartnerKYC);

// ── POST /admin/update-role ──────────────────────────────────────────────────
router.post('/update-role', roleCheck('ADMIN', 'SUPER_ADMIN'), authCtrl.setRole);

// ── GET /admin/applications ──────────────────────────────────────────────────
router.get('/applications', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), appCtrl.listApplications);

// ── POST /admin/leads/bulk-assign ──────────────────────────────────────────────
router.post('/leads/bulk-assign', roleCheck('ADMIN', 'SUPER_ADMIN'), leadCtrl.bulkAssignLeads);

// ── POST /admin/commission-rule ──────────────────────────────────────────────
router.post('/commission-rule', roleCheck('SUPER_ADMIN'), commissionRules, validate, productCtrl.setCommission);

// ── GET /admin/commission-rules ──────────────────────────────────────────────
router.get('/commission-rules', roleCheck('SUPER_ADMIN'), productCtrl.listCommissionRules);

// ── DELETE /admin/commission-rules/:id ─────────────────────────────────────────
router.delete('/commission-rules/:id', roleCheck('SUPER_ADMIN'), productCtrl.deleteCommissionRule);

// ── POST /admin/withdrawal/approve ───────────────────────────────────────────
router.post('/withdrawal/approve', roleCheck('ADMIN', 'SUPER_ADMIN'), walletCtrl.approveWithdrawalController);

// ── POST /admin/withdrawal/reject ────────────────────────────────────────────
router.post('/withdrawal/reject', roleCheck('ADMIN', 'SUPER_ADMIN'), walletCtrl.rejectWithdrawalController);

// ── POST /admin/wallet/adjust ────────────────────────────────────────────────
router.post('/wallet/adjust', roleCheck('ADMIN', 'SUPER_ADMIN'), walletCtrl.adminAdjustWalletController);

module.exports = router;
