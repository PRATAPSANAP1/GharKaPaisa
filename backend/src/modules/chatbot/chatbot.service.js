const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { v4: uuidv4 } = require('uuid');
const intentService = require('./intent.service');
const knowledgeBaseService = require('./knowledge-base.service');

/**
 * Chatbot Service - Main service for chatbot operations
 */
class ChatbotService {
  /**
   * Create or get existing conversation
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID (optional)
   * @param {string} userRole - User role
   * @returns {Object} - Conversation data
   */
  async getOrCreateConversation(sessionId, userId = null, userRole = 'PUBLIC') {
    try {
      // Check if conversation exists
      const { rows } = await query(
        `SELECT * FROM chatbot_conversations
         WHERE session_id = $1
         AND status = 'ACTIVE'
         ORDER BY started_at DESC
         LIMIT 1`,
        [sessionId]
      );

      if (rows.length > 0) {
        // Update last activity
        await query(
          `UPDATE chatbot_conversations
           SET last_activity_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [rows[0].id]
        );
        return rows[0];
      }

      // Create new conversation
      const { rows: newConv } = await query(
        `INSERT INTO chatbot_conversations (session_id, user_id, user_role, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING *`,
        [sessionId, userId, userRole]
      );

      return newConv[0];
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Process user message and generate bot response
   * @param {string} sessionId - Session ID
   * @param {string} message - User message
   * @param {string} userId - User ID (optional)
   * @param {string} userRole - User role
   * @returns {Object} - Bot response with metadata
   */
  async processMessage(sessionId, message, userId = null, userRole = 'PUBLIC') {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(sessionId, userId, userRole);

      // Save user message
      await this.saveMessage(conversation.id, 'USER', message, 'TEXT', null, null);

      // Detect intent
      const detectedIntent = await intentService.detectIntent(message, userRole);

      // Save bot's intent detection
      await this.saveMessage(
        conversation.id,
        'BOT',
        detectedIntent.response_template,
        'TEXT',
        detectedIntent.intent_name,
        detectedIntent.confidence_score
      );

      // Log analytics
      await this.logAnalytics(
        sessionId,
        userId,
        userRole,
        detectedIntent.intent_name,
        'message_processed'
      );

      return {
        conversation_id: conversation.id,
        message: detectedIntent.response_template,
        chips: detectedIntent.chips,
        intent: detectedIntent.intent_name,
        confidence: detectedIntent.confidence_score
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Handle chip/action click
   * @param {string} sessionId - Session ID
   * @param {string} action - Action identifier
   * @param {string} label - Chip label
   * @param {string} userId - User ID (optional)
   * @param {string} userRole - User role
   * @returns {Object} - Response with potential redirect
   */
  async handleAction(sessionId, action, label, userId = null, userRole = 'PUBLIC') {
    try {
      const conversation = await this.getOrCreateConversation(sessionId, userId, userRole);

      // Save user action as message
      await this.saveMessage(conversation.id, 'USER', label, 'BUTTON', action, null);

      // Get action response from knowledge base
      const response = await knowledgeBaseService.getActionResponse(action, userRole);

      // Save bot response
      await this.saveMessage(
        conversation.id,
        'BOT',
        response.text,
        response.redirect ? 'REDIRECT' : 'TEXT',
        action,
        1.0
      );

      // Log analytics
      await this.logAnalytics(
        sessionId,
        userId,
        userRole,
        action,
        'chip_clicked'
      );

      return {
        conversation_id: conversation.id,
        message: response.text,
        chips: response.chips,
        redirect: response.redirect || null,
        action: action
      };
    } catch (error) {
      logger.error('Error handling action:', error);
      throw error;
    }
  }

  /**
   * Save message to database
   * @param {string} conversationId - Conversation ID
   * @param {string} sender - Sender (USER or BOT)
   * @param {string} messageText - Message text
   * @param {string} messageType - Message type
   * @param {string} intent - Detected intent (optional)
   * @param {number} confidenceScore - Confidence score (optional)
   */
  async saveMessage(conversationId, sender, messageText, messageType, intent, confidenceScore) {
    try {
      await query(
        `INSERT INTO chatbot_messages (conversation_id, sender, message_text, message_type, intent, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [conversationId, sender, messageText, messageType, intent, confidenceScore]
      );
    } catch (error) {
      logger.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Array} - Message history
   */
  async getConversationHistory(conversationId, limit = 50) {
    try {
      const { rows } = await query(
        `SELECT * FROM chatbot_messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC
         LIMIT $2`,
        [conversationId, limit]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Log chatbot analytics
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {string} intentDetected - Detected intent
   * @param {string} actionTaken - Action taken
   */
  async logAnalytics(sessionId, userId, userRole, intentDetected, actionTaken) {
    try {
      await query(
        `INSERT INTO chatbot_analytics (session_id, user_id, user_role, intent_detected, action_taken)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, userId, userRole, intentDetected, actionTaken]
      );
    } catch (error) {
      logger.error('Error logging analytics:', error);
      // Don't throw - analytics shouldn't break the flow
    }
  }

  /**
   * Submit user feedback
   * @param {string} sessionId - Session ID
   * @param {number} rating - Rating (1-5)
   * @param {string} userId - User ID (optional)
   */
  async submitFeedback(sessionId, rating, userId = null) {
    try {
      // Update analytics with satisfaction rating
      await query(
        `UPDATE chatbot_analytics
         SET satisfaction_rating = $1
         WHERE session_id = $2
         AND created_at = (
           SELECT MAX(created_at) FROM chatbot_analytics WHERE session_id = $2
         )`,
        [rating, sessionId]
      );

      // Update conversation status
      await query(
        `UPDATE chatbot_conversations
         SET status = 'RESOLVED',
             updated_at = NOW()
         WHERE session_id = $1`,
        [sessionId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Escalate conversation to human agent
   * @param {string} conversationId - Conversation ID
   * @param {string} notes - Escalation notes
   * @returns {Object} - Handoff data
   */
  async escalateToAgent(conversationId, notes) {
    try {
      // Update conversation status
      await query(
        `UPDATE chatbot_conversations
         SET status = 'ESCALATED',
             updated_at = NOW()
         WHERE id = $1`,
        [conversationId]
      );

      // Create handoff record
      const { rows } = await query(
        `INSERT INTO chatbot_handoffs (conversation_id, notes, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [conversationId, notes]
      );

      // Log analytics
      await query(
        `UPDATE chatbot_analytics
         SET resolution_status = 'ESCALATED'
         WHERE conversation_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [conversationId]
      );

      return rows[0];
    } catch (error) {
      logger.error('Error escalating to agent:', error);
      throw error;
    }
  }

  /**
   * Get chatbot analytics
   * @param {Object} filters - Optional filters
   * @returns {Object} - Analytics data
   */
  async getAnalytics(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filters.startDate) {
        params.push(filters.startDate);
        whereClause += ` AND created_at >= $${paramIndex}`;
        paramIndex++;
      }

      if (filters.endDate) {
        params.push(filters.endDate);
        whereClause += ` AND created_at <= $${paramIndex}`;
        paramIndex++;
      }

      if (filters.userRole) {
        params.push(filters.userRole);
        whereClause += ` AND user_role = $${paramIndex}`;
        paramIndex++;
      }

      // Total conversations
      const { rows: totalConv } = await query(
        `SELECT COUNT(DISTINCT session_id) as total FROM chatbot_conversations ${whereClause}`,
        params
      );

      // Total messages
      const { rows: totalMsgs } = await query(
        `SELECT COUNT(*) as total FROM chatbot_messages ${whereClause}`,
        params
      );

      // Intent distribution
      const { rows: intentDist } = await query(
        `SELECT intent, COUNT(*) as count
         FROM chatbot_messages
         WHERE intent IS NOT NULL ${whereClause.replace('WHERE 1=1', 'AND')}
         GROUP BY intent
         ORDER BY count DESC
         LIMIT 10`,
        params
      );

      // Resolution status
      const { rows: resolutionStats } = await query(
        `SELECT resolution_status, COUNT(*) as count
         FROM chatbot_analytics ${whereClause}
         GROUP BY resolution_status`,
        params
      );

      // Average satisfaction
      const { rows: satisfaction } = await query(
        `SELECT AVG(satisfaction_rating) as avg_rating,
                COUNT(satisfaction_rating) as total_ratings
         FROM chatbot_analytics
         WHERE satisfaction_rating IS NOT NULL ${whereClause.replace('WHERE 1=1', 'AND')}`,
        params
      );

      return {
        total_conversations: parseInt(totalConv[0].total),
        total_messages: parseInt(totalMsgs[0].total),
        intent_distribution: intentDist,
        resolution_stats: resolutionStats,
        average_satisfaction: satisfaction[0].avg_rating
          ? parseFloat(satisfaction[0].avg_rating).toFixed(2)
          : null,
        total_ratings: parseInt(satisfaction[0].total_ratings || 0)
      };
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Reset conversation
   * @param {string} sessionId - Session ID
   * @returns {Object} - New conversation
   */
  async resetConversation(sessionId) {
    try {
      // Mark existing conversation as resolved
      await query(
        `UPDATE chatbot_conversations
         SET status = 'RESOLVED',
             updated_at = NOW()
         WHERE session_id = $1
         AND status = 'ACTIVE'`,
        [sessionId]
      );

      // Create new conversation with same session ID
      const { rows } = await query(
        `INSERT INTO chatbot_conversations (session_id, status)
         VALUES ($1, 'ACTIVE')
         RETURNING *`,
        [sessionId]
      );

      return rows[0];
    } catch (error) {
      logger.error('Error resetting conversation:', error);
      throw error;
    }
  }
}

module.exports = new ChatbotService();
