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
router.get('/dashboard', authenticated, teamCtrl.handleGetTeamDashboard);
router.get('/tree', authenticated, teamCtrl.handleGetTeamTree);
router.get('/list', authenticated, teamCtrl.handleGetTeamList);
router.get('/activity', authenticated, teamCtrl.handleGetTeamActivity);
router.get('/:id', authenticated, teamCtrl.handleGetChildDetail);
router.patch('/settings', authenticated, teamCtrl.handleUpdateTeamSettings);

module.exports = router;
