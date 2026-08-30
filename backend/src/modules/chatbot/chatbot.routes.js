const express = require('express');
const router = express.Router();
const chatbotController = require('./chatbot.controller');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const { chatbotLimiter } = require('../../middleware/rate-limit/rateLimit.middleware');
const logger = require('../../config/logger');

// Optional JWT middleware helper to hydrate req.user if Bearer token is provided
const optionalJwt = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return jwtAuth(req, res, (err) => {
      // If token verification fails, continue as unauthenticated PUBLIC visitor
      next();
    });
  }
  next();
};

// Public routes (with optional JWT context hydration and rate limiting)
router.post('/message', optionalJwt, chatbotLimiter, chatbotController.sendMessage.bind(chatbotController));
router.post('/action', optionalJwt, chatbotController.handleAction.bind(chatbotController));
router.post('/conversation', optionalJwt, chatbotController.createConversation.bind(chatbotController));
router.post('/reset', optionalJwt, chatbotController.resetConversation.bind(chatbotController));
router.get('/search', optionalJwt, chatbotController.searchKnowledgeBase.bind(chatbotController));
router.get('/faq/:category', optionalJwt, chatbotController.getFAQ.bind(chatbotController));

// Protected routes (authentication required)
router.use(jwtAuth);

// User routes
router.post('/feedback', chatbotController.submitFeedback.bind(chatbotController));
router.get('/conversation/:id', chatbotController.getConversation.bind(chatbotController));

// Admin/Super Admin only routes
router.use(roleCheck('ADMIN', 'SUPER_ADMIN'));

router.get('/analytics', chatbotController.getAnalytics.bind(chatbotController));
router.post('/escalate', chatbotController.escalateToAgent.bind(chatbotController));

// Intent management (Admin/Super Admin only)
router.get('/intents', chatbotController.getIntents.bind(chatbotController));
router.post('/intents', chatbotController.createIntent.bind(chatbotController));
router.put('/intents/:id', chatbotController.updateIntent.bind(chatbotController));
router.delete('/intents/:id', chatbotController.deleteIntent.bind(chatbotController));

module.exports = router;
