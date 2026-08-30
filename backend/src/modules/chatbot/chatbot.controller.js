const chatbotService = require('./chatbot.service');
const intentService = require('./intent.service');
const knowledgeBaseService = require('./knowledge-base.service');
const logger = require('../../config/logger');

/**
 * Chatbot Controller - Handles HTTP requests for chatbot
 */
class ChatbotController {
  /**
   * Send message to chatbot
   * POST /api/v1/chatbot/message
   */
  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;

      if (message === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Message field is required'
        });
      }

      const response = await chatbotService.processMessage(req);

      res.json(response);
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      next(error);
    }
  }

  /**
   * Handle chip/action click
   * POST /api/v1/chatbot/action
   */
  async handleAction(req, res, next) {
    try {
      const { action, label, session_id } = req.body;
      const userId = req.user?.id || null;
      const userRole = req.user?.role || 'PUBLIC';

      if (!action || !label || !session_id) {
        return res.status(400).json({
          success: false,
          message: 'Action, label, and session_id are required'
        });
      }

      const response = await chatbotService.handleAction(
        session_id,
        action,
        label,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Error in handleAction:', error);
      next(error);
    }
  }

  /**
   * Get conversation history
   * GET /api/v1/chatbot/conversation/:id
   */
  async getConversation(req, res, next) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const history = await chatbotService.getConversationHistory(id, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error in getConversation:', error);
      next(error);
    }
  }

  /**
   * Create new conversation
   * POST /api/v1/chatbot/conversation
   */
  async createConversation(req, res, next) {
    try {
      const { session_id } = req.body;
      const userId = req.user?.id || null;
      const userRole = req.user?.role || 'PUBLIC';

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'session_id is required'
        });
      }

      const conversation = await chatbotService.getOrCreateConversation(
        session_id,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      logger.error('Error in createConversation:', error);
      next(error);
    }
  }

  /**
   * Reset conversation
   * POST /api/v1/chatbot/reset
   */
  async resetConversation(req, res, next) {
    try {
      const { session_id } = req.body;

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'session_id is required'
        });
      }

      const conversation = await chatbotService.resetConversation(session_id);

      res.json({
        success: true,
        message: 'Conversation reset successfully',
        data: conversation
      });
    } catch (error) {
      logger.error('Error in resetConversation:', error);
      next(error);
    }
  }

  /**
   * Submit feedback
   * POST /api/v1/chatbot/feedback
   */
  async submitFeedback(req, res, next) {
    try {
      const { session_id, rating } = req.body;
      const userId = req.user?.id || null;

      if (!session_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'session_id and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const result = await chatbotService.submitFeedback(session_id, rating, userId);

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in submitFeedback:', error);
      next(error);
    }
  }

  /**
   * Escalate to human agent
   * POST /api/v1/chatbot/escalate
   */
  async escalateToAgent(req, res, next) {
    try {
      const { conversation_id, notes } = req.body;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          message: 'conversation_id is required'
        });
      }

      const handoff = await chatbotService.escalateToAgent(conversation_id, notes);

      res.json({
        success: true,
        message: 'Conversation escalated to agent',
        data: handoff
      });
    } catch (error) {
      logger.error('Error in escalateToAgent:', error);
      next(error);
    }
  }

  /**
   * Get chatbot analytics (Admin only)
   * GET /api/v1/chatbot/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const filters = {
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        userRole: req.query.user_role
      };

      const analytics = await chatbotService.getAnalytics(filters);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error in getAnalytics:', error);
      next(error);
    }
  }

  /**
   * Get all intents (Admin only)
   * GET /api/v1/chatbot/intents
   */
  async getIntents(req, res, next) {
    try {
      const filters = {
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        required_role: req.query.required_role
      };

      const intents = await intentService.getIntents(filters);

      res.json({
        success: true,
        data: intents
      });
    } catch (error) {
      logger.error('Error in getIntents:', error);
      next(error);
    }
  }

  /**
   * Create intent (Admin only)
   * POST /api/v1/chatbot/intents
   */
  async createIntent(req, res, next) {
    try {
      const intentData = req.body;

      const intent = await intentService.createIntent(intentData);

      res.status(201).json({
        success: true,
        message: 'Intent created successfully',
        data: intent
      });
    } catch (error) {
      logger.error('Error in createIntent:', error);
      next(error);
    }
  }

  /**
   * Update intent (Admin only)
   * PUT /api/v1/chatbot/intents/:id
   */
  async updateIntent(req, res, next) {
    try {
      const { id } = req.params;
      const intentData = req.body;

      const intent = await intentService.updateIntent(id, intentData);

      res.json({
        success: true,
        message: 'Intent updated successfully',
        data: intent
      });
    } catch (error) {
      logger.error('Error in updateIntent:', error);
      next(error);
    }
  }

  /**
   * Delete intent (Admin only)
   * DELETE /api/v1/chatbot/intents/:id
   */
  async deleteIntent(req, res, next) {
    try {
      const { id } = req.params;

      const success = await intentService.deleteIntent(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Intent not found'
        });
      }

      res.json({
        success: true,
        message: 'Intent deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteIntent:', error);
      next(error);
    }
  }

  /**
   * Search knowledge base
   * GET /api/v1/chatbot/search
   */
  async searchKnowledgeBase(req, res, next) {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'keyword is required'
        });
      }

      const results = await knowledgeBaseService.searchKnowledgeBase(keyword);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error in searchKnowledgeBase:', error);
      next(error);
    }
  }

  /**
   * Get FAQ by category
   * GET /api/v1/chatbot/faq/:category
   */
  async getFAQ(req, res, next) {
    try {
      const { category } = req.params;

      const faq = await knowledgeBaseService.getFAQ(category);

      res.json({
        success: true,
        data: faq
      });
    } catch (error) {
      logger.error('Error in getFAQ:', error);
      next(error);
    }
  }
}

module.exports = new ChatbotController();
