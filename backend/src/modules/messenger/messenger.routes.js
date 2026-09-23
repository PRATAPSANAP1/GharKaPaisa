const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const { messengerLimiter } = require('../../middleware/rate-limit/rateLimit.middleware');
const requireSuperAdmin = require('../../middleware/authentication/requireSuperAdmin.middleware');
const controller = require('./messenger.controller');

// All messenger endpoints require authentication & rate limiting
router.use(jwtAuth);

// Super Admin Audit & Assignment Endpoints
router.get('/admin/search-users', requireSuperAdmin, controller.adminSearchUsers);
router.get('/admin/conversations', requireSuperAdmin, controller.adminGetUserConversations);
router.get('/admin/messages/:id', requireSuperAdmin, controller.adminGetUserMessages);
router.get('/admin/accounts', requireSuperAdmin, controller.getCandidateAccounts);
router.get('/admin/assignments', requireSuperAdmin, controller.getAssignments);
router.post('/admin/assignments', requireSuperAdmin, messengerLimiter, controller.assignMessengers);
router.delete('/admin/assignments/:id', requireSuperAdmin, messengerLimiter, controller.removeAssignment);

router.get('/conversations', controller.getConversations);
router.post('/conversations/direct', messengerLimiter, controller.createDirectChat);
router.post('/conversations/application', messengerLimiter, controller.createApplicationChat);
router.post('/conversations/group', messengerLimiter, controller.createGroupChat);

router.get('/conversations/:id', controller.getConversation);
router.get('/conversations/:id/messages', controller.getMessages);
router.get('/conversations/:id/members', controller.getGroupMembers);
router.post('/conversations/:id/members', messengerLimiter, controller.addGroupMembers);
router.delete('/conversations/:id/members/:targetUserId', messengerLimiter, controller.removeGroupMember);
router.post('/conversations/:id/read', controller.markRead);
router.post('/conversations/:id/pin', controller.togglePin);
router.post('/conversations/:id/clear', messengerLimiter, controller.clearChat);
router.post('/conversations/:id/leave', messengerLimiter, controller.leaveGroup);
router.delete('/conversations/:id', messengerLimiter, controller.deleteConversation);

router.post('/messages', messengerLimiter, controller.sendMessage);
router.put('/messages/:id', messengerLimiter, controller.editMessage);
router.delete('/messages/:id', messengerLimiter, controller.deleteMessage);
router.get('/unread-count', controller.getUnreadCount);
router.get('/contacts', controller.getContacts);

module.exports = router;
