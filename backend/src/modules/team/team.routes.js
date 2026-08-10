const express = require('express');
const router = express.Router();
const ctrl = require('./team.controller');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');

// All team routes require valid authentication
router.use(jwtAuth);

// Team endpoints
router.get('/info', ctrl.getTeamInfo);
router.post('/upgrade-request', ctrl.requestUpgrade);
router.get('/upgrade-status', ctrl.getUpgradeStatus);
router.get('/dashboard', ctrl.getDashboard);
router.get('/team-dashboard', ctrl.getDashboard);
router.get('/tree', ctrl.getTree);
router.get('/list', ctrl.getMembersList);
router.get('/members', ctrl.getMembersList);
router.get('/analytics', ctrl.getAnalytics);
router.get('/activity', ctrl.getActivity);
router.get('/goals', ctrl.getGoals);

router.get('/settings', ctrl.getSettings);
router.patch('/settings', ctrl.updateSettings);
router.put('/settings', ctrl.updateSettings);

router.post('/invite', ctrl.sendInvite);
router.get('/refers', ctrl.getRefersList);

router.patch('/:id/status', ctrl.updateMemberStatus);
router.post('/:id/reactivate', (req, res, next) => { req.body.status = 'active'; ctrl.updateMemberStatus(req, res, next); });
router.delete('/:id', ctrl.deleteMember);

router.get('/:id', ctrl.getMemberById);

module.exports = router;
