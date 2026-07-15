const express = require('express');
const router = express.Router();
const teamCtrl = require('./team.controller.js');
const { authenticate, syncUser, requireApprovedPartner } = require('../../middleware/authentication/auth.middleware.js');

// Public Referral Endpoints (No authentication required)
router.post('/referral/click', teamCtrl.handleReferralClick);

// Authenticated Team & Referral Routes
router.use(authenticate, syncUser);

// Referral System
router.get('/referral/qr', requireApprovedPartner, teamCtrl.handleGetReferralQR);
router.get('/referral/analytics', requireApprovedPartner, teamCtrl.handleGetReferralAnalytics);

// Team Dashboard & Tree Hierarchy
router.get('/team/dashboard', requireApprovedPartner, teamCtrl.handleGetTeamDashboard);
router.get('/team/tree', requireApprovedPartner, teamCtrl.handleGetTeamTree);
router.get('/team/list', requireApprovedPartner, teamCtrl.handleGetTeamList);
router.get('/team/activity', requireApprovedPartner, teamCtrl.handleGetTeamActivity);
router.get('/team/:id', requireApprovedPartner, teamCtrl.handleGetChildDetail);
router.patch('/team/settings', requireApprovedPartner, teamCtrl.handleUpdateTeamSettings);

module.exports = router;
