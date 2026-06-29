const express = require('express');
const router = express.Router();
const notifCtrl = require('../../controllers/notification/notification.controller.js');
const { authenticate, syncUser } = require('../../middleware/auth.middleware.js');

router.use(authenticate, syncUser);

router.get('/', notifCtrl.getNotifications);
router.patch('/read-all', notifCtrl.markAllRead);
router.patch('/:id/read', notifCtrl.markRead);

module.exports = router;
