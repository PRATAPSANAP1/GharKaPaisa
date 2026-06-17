const express = require('express');
const router = express.Router();
const notifCtrl = require('../controllers/notification.controller');
const { authenticate, syncUser } = require('../middleware/auth.middleware');

router.use(authenticate, syncUser);

router.get('/', notifCtrl.getNotifications);
router.patch('/read-all', notifCtrl.markAllRead);
router.patch('/:id/read', notifCtrl.markRead);

module.exports = router;
