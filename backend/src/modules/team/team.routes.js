const express = require('express');
const router = express.Router();
const teamCtrl = require('./team.controller.js');
const { authenticate, syncUser, requireApprovedPartner } = require('../../middleware/authentication/auth.middleware.js');

// Public Referral Endpoints (No authentication required)
router.post('/referral/click', teamCtrl.handleReferralClick);

// Authenticated Team & Referral Routes
const authenticated = [authenticate, syncUser, requireApprovedPartner];

// Referral System
router.get('/referral/qr', authenticated, teamCtrl.handleGetReferralQR);
router.get('/referral/analytics', authenticated, teamCtrl.handleGetReferralAnalytics);

// Team Dashboard & Tree Hierarchy
router.get('/team/dashboard', authenticated, teamCtrl.handleGetTeamDashboard);
router.get('/team/tree', authenticated, teamCtrl.handleGetTeamTree);
router.get('/team/list', authenticated, teamCtrl.handleGetTeamList);
router.get('/team/activity', authenticated, teamCtrl.handleGetTeamActivity);
router.get('/team/:id', authenticated, teamCtrl.handleGetChildDetail);
router.patch('/team/settings', authenticated, teamCtrl.handleUpdateTeamSettings);

module.exports = router;
