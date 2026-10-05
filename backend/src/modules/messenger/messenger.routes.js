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
router.put('/conversations/:id/name', requireSuperAdmin, messengerLimiter, controller.updateGroupName);

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

const path = require('path');
const multer = require('multer');

const FORBIDDEN_EXTS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.pl', '.cgi',
  '.jar', '.vbs', '.js', '.ts', '.html', '.htm', '.xhtml',
  '.scr', '.pif', '.application', '.gadget', '.msi', '.msp',
  '.com', '.hta', '.cpl', '.msc'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file?.originalname || '').toLowerCase();
  if (FORBIDDEN_EXTS.includes(ext)) {
    return cb(new Error('Forbidden file type: Executable and script files are not allowed.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const handleUploadMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size exceeds maximum allowed limit of 10 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post('/messages', messengerLimiter, handleUploadMiddleware, controller.sendMessage);
router.post('/attachments/upload', messengerLimiter, handleUploadMiddleware, controller.uploadAttachment);
router.post('/attachment/upload', messengerLimiter, handleUploadMiddleware, controller.uploadAttachment);
router.post('/upload', messengerLimiter, handleUploadMiddleware, controller.uploadAttachment);
router.post('/files/upload', messengerLimiter, handleUploadMiddleware, controller.uploadAttachment);
router.post('/attachments', messengerLimiter, handleUploadMiddleware, controller.uploadAttachment);
router.post('/attachment', messengerLimiter, handleUploadMiddleware, controller.uploadAttachment);
router.get('/media/:attachmentId', controller.getMediaAttachment);
router.get('/attachments/file/:attachmentId', controller.getMediaAttachment);
router.get('/attachments/:attachmentId', controller.getMediaAttachment);
router.put('/messages/:id', messengerLimiter, controller.editMessage);
router.delete('/messages/:id', messengerLimiter, controller.deleteMessage);
router.get('/unread-count', controller.getUnreadCount);
router.get('/contacts', controller.getContacts);
router.get('/turn-credentials', controller.getTurnCredentials);

module.exports = router;
