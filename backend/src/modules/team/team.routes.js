const express = require('express');
const router = express.Router();
const teamCtrl = require('./team.controller.js');
const { authenticate, syncUser, requireApprovedPartner } = require('../../middleware/authentication/auth.middleware.js');

// Public Referral Endpoints (No authentication required)
router.post('/referral/click', teamCtrl.handleReferralClick);

// Helper array for authenticated routes
const authMiddlewares = [authenticate, syncUser, requireApprovedPartner];

// Referral System
router.get('/referral/qr', authMiddlewares, teamCtrl.handleGetReferralQR);
router.get('/referral/analytics', authMiddlewares, teamCtrl.handleGetReferralAnalytics);

// Team Dashboard & Tree Hierarchy
router.get('/team/dashboard', authMiddlewares, teamCtrl.handleGetTeamDashboard);
router.get('/team/tree', authMiddlewares, teamCtrl.handleGetTeamTree);
router.get('/team/list', authMiddlewares, teamCtrl.handleGetTeamList);
router.get('/team/activity', authMiddlewares, teamCtrl.handleGetTeamActivity);
router.get('/team/:id', authMiddlewares, teamCtrl.handleGetChildDetail);
router.patch('/team/settings', authMiddlewares, teamCtrl.handleUpdateTeamSettings);

module.exports = router;
