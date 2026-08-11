const express = require('express');
const router = express.Router();
const ctrl = require('./lead.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const { requireApprovedPartner, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');

// Require authentication for all lead endpoints
router.use(jwtAuth);

// Partner Share Tracking Leads (Super Admin only)
router.get('/partner-share-tracking', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.listPartnerShareLeads);

// Core Lead Listing, Creation, & Bulk Actions
router.get('/', requireApprovedPartnerOrAdmin, ctrl.listLeads);
router.post('/', requireApprovedPartner, ctrl.createLead);
router.post('/bulk-assign', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.bulkAssignLeads);

// OTP & Lead-to-Application Conversion Endpoints
router.post('/:id/send-otp', requireApprovedPartnerOrAdmin, ctrl.sendLeadOtp);
router.post('/:id/verify-otp', requireApprovedPartnerOrAdmin, ctrl.verifyLeadOtp);

// 360 Lead Profile & Operations Details
router.get('/:id', requireApprovedPartnerOrAdmin, ctrl.get360LeadDetails);

router.patch('/:id/status', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateLeadStatus);

// Sub-resource Endpoints
router.post('/:id/document', requireApprovedPartnerOrAdmin, ctrl.addLeadDocument);
router.post('/:id/note', requireApprovedPartnerOrAdmin, ctrl.addLeadNote);
router.post('/:id/internal-note', roleCheck('ADMIN', 'SUPER_ADMIN'), (req, res, next) => { req.body.visibility = 'private'; ctrl.addLeadNote(req, res, next); });
router.post('/:id/assign', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.assignLead);
router.post('/:id/bank-assign', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.assignBankExecutive);
router.post('/:id/checklist', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateLeadChecklist);
router.post('/:id/follow-ups', requireApprovedPartnerOrAdmin, ctrl.addLeadFollowUp);

module.exports = router;
