const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const controller = require('./messenger.controller');

// All messenger endpoints require authentication
router.use(jwtAuth);

// Super Admin Read-Only Audit Endpoints
router.get('/admin/search-users', controller.adminSearchUsers);
router.get('/admin/conversations', controller.adminGetUserConversations);
router.get('/admin/messages/:id', controller.adminGetUserMessages);

router.get('/conversations', controller.getConversations);
router.post('/conversations/direct', controller.createDirectChat);
router.post('/conversations/application', controller.createApplicationChat);
router.post('/conversations/group', controller.createGroupChat);

router.get('/conversations/:id', controller.getConversation);
router.get('/conversations/:id/messages', controller.getMessages);
router.post('/conversations/:id/read', controller.markRead);
router.post('/conversations/:id/pin', controller.togglePin);

router.post('/messages', controller.sendMessage);
router.get('/unread-count', controller.getUnreadCount);
router.get('/contacts', controller.getContacts);

module.exports = router;
