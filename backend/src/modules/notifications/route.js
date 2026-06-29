const express = require('express');
const router = express.Router();
const notifCtrl = require('./controller.js');
const { authenticate, syncUser } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);

router.get('/', notifCtrl.getNotifications);
router.patch('/read-all', notifCtrl.markAllRead);
router.patch('/:id/read', notifCtrl.markRead);

module.exports = router;
