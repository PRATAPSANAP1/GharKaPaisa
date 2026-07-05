const express = require('express');
const router = express.Router();
const notifCtrl = require('./controller.js');
const { authenticate, syncUser } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);

// Real-Time stream link
router.get('/stream', notifCtrl.handleSSEStream);

// Core notifications
router.get('/', notifCtrl.getNotifications);
router.get('/unread', notifCtrl.getUnreadNotifications);
router.put('/read', notifCtrl.markRead);
router.put('/:id/read', notifCtrl.markRead); // Support both parameter and body-based routing
router.patch('/:id/read', notifCtrl.markRead);
router.put('/read-all', notifCtrl.markAllRead);
router.patch('/read-all', notifCtrl.markAllRead);
router.delete('/:id', notifCtrl.deleteNotification);

// User preferences
router.get('/settings', notifCtrl.getSettings);
router.put('/settings', notifCtrl.saveSettings);

// Announcements
router.get('/announcements', notifCtrl.getAnnouncements);

module.exports = router;
