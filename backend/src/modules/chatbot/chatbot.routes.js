const express = require('express');
const router = express.Router();
const chatbotController = require('./chatbot.controller');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const logger = require('../../config/logger');

// Public routes (no authentication required)
router.post('/message', chatbotController.sendMessage.bind(chatbotController));
router.post('/action', chatbotController.handleAction.bind(chatbotController));
router.post('/conversation', chatbotController.createConversation.bind(chatbotController));
router.post('/reset', chatbotController.resetConversation.bind(chatbotController));
router.get('/search', chatbotController.searchKnowledgeBase.bind(chatbotController));
router.get('/faq/:category', chatbotController.getFAQ.bind(chatbotController));

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
