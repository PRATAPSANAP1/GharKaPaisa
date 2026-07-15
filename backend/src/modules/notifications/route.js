const express = require('express');
const router = express.Router();
const notifCtrl = require('./controller.js');
const { authenticate, syncUser } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);

const { authorize } = require('../../middleware/authentication/auth.middleware.js');

// Real-Time SSE stream
router.get('/stream', notifCtrl.handleSSEStream);

// Core notifications
router.get('/', notifCtrl.getNotifications);
router.get('/unread', notifCtrl.getUnreadNotifications);
router.post('/read', notifCtrl.markRead);
router.put('/read', notifCtrl.markRead);
router.put('/:id/read', notifCtrl.markRead);
router.patch('/:id/read', notifCtrl.markRead);
router.post('/read-all', notifCtrl.markAllRead);
router.put('/read-all', notifCtrl.markAllRead);
router.patch('/read-all', notifCtrl.markAllRead);
router.delete('/:id', notifCtrl.deleteNotification);

// User Preferences
router.get('/preferences', notifCtrl.getSettings);
router.put('/preferences', notifCtrl.saveSettings);
router.get('/settings', notifCtrl.getSettings);
router.put('/settings', notifCtrl.saveSettings);

// Activity Timeline & Audit Logs
router.get('/activity', notifCtrl.getActivityLogsController);
router.get('/audit', authorize('ADMIN', 'SUPER_ADMIN'), notifCtrl.getAuditLogsController);

// Announcements & Broadcasts
router.get('/announcements', notifCtrl.getAnnouncements);
router.get('/broadcast', notifCtrl.getAnnouncements);
router.post('/broadcast', authorize('SUPER_ADMIN'), notifCtrl.broadcastNotification);

module.exports = router;
