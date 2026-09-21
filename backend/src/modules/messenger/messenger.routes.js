const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const { messengerLimiter } = require('../../middleware/rate-limit/rateLimit.middleware');
const controller = require('./messenger.controller');

// All messenger endpoints require authentication & rate limiting
router.use(jwtAuth);

// Super Admin Read-Only Audit Endpoints
router.get('/admin/search-users', controller.adminSearchUsers);
router.get('/admin/conversations', controller.adminGetUserConversations);
router.get('/admin/messages/:id', controller.adminGetUserMessages);

router.get('/conversations', controller.getConversations);
router.post('/conversations/direct', messengerLimiter, controller.createDirectChat);
router.post('/conversations/application', messengerLimiter, controller.createApplicationChat);
router.post('/conversations/group', messengerLimiter, controller.createGroupChat);

router.get('/conversations/:id', controller.getConversation);
router.get('/conversations/:id/messages', controller.getMessages);
router.post('/conversations/:id/read', controller.markRead);
router.post('/conversations/:id/pin', controller.togglePin);
router.delete('/conversations/:id', messengerLimiter, controller.deleteConversation);

router.post('/messages', messengerLimiter, controller.sendMessage);
router.get('/unread-count', controller.getUnreadCount);
router.get('/contacts', controller.getContacts);

module.exports = router;
