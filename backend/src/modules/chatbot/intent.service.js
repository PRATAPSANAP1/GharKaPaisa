const { query } = require('../../config/database');
const logger = require('../../config/logger');

const knowledgeBaseService = require('./knowledge-base.service');

/**
 * Intent Service - Handles NLP intent detection and matching
 * Uses keyword matching + dynamic PostgreSQL product & bank search
 */
class IntentService {
  /**
   * Detect intent from user message using keyword matching + dynamic DB lookup
   * @param {string} message - User message text
   * @param {string} userRole - User role (PUBLIC, PARTNER, ADMIN, SUPER_ADMIN, EMPLOYEE)
   * @returns {Object} - Detected intent with confidence score
   */
  async detectIntent(message, userRole = 'PUBLIC') {
    try {
      const messageLower = message.toLowerCase();

      // 1. Get all active intents that match the user role
      const { rows } = await query(
        `SELECT * FROM chatbot_intents
         WHERE is_active = true
         AND ($1 = 'PUBLIC' OR $1 = ANY(required_role))
         ORDER BY priority DESC, created_at ASC`,
        [userRole]
      );

      let bestMatch = null;
      let highestScore = 0;

      for (const intent of rows) {
        const score = this.calculateMatchScore(messageLower, intent.training_phrases);
        
        if (score > highestScore && score > 0.3) {
          highestScore = score;
          bestMatch = {
            intent_name: intent.intent_name,
            response_template: intent.response_template,
            chips: intent.chips,
            confidence_score: score,
            intent_id: intent.id
          };
        }
      }

      if (bestMatch) {
        return bestMatch;
      }

      // 2. Dynamic Database Product & Bank Search
      const dbSearchResult = await knowledgeBaseService.searchProducts(messageLower, userRole);
      if (dbSearchResult) {
        return {
          intent_name: 'product_db_search',
          response_template: dbSearchResult.response_template,
          chips: JSON.stringify(dbSearchResult.chips || []),
          confidence_score: 0.85
        };
      }

      return this.getDefaultIntent(userRole);
    } catch (error) {
      logger.error('Error detecting intent:', error);
      return this.getDefaultIntent(userRole);
    }
  }

  /**
   * Calculate match score based on keyword matching
   * @param {string} message - Lowercase user message
   * @param {Array} trainingPhrases - Array of training phrases
   * @returns {number} - Match score between 0 and 1
   */
  calculateMatchScore(message, trainingPhrases) {
    if (!trainingPhrases || trainingPhrases.length === 0) return 0;

    let totalScore = 0;
    let matchedPhrases = 0;

    for (const phrase of trainingPhrases) {
      const phraseLower = phrase.toLowerCase();
      
      // Exact match
      if (message === phraseLower) {
        totalScore += 1.0;
        matchedPhrases++;
      }
      // Contains phrase
      else if (message.includes(phraseLower)) {
        totalScore += 0.8;
        matchedPhrases++;
      }
      // Word-by-word match
      else {
        const phraseWords = phraseLower.split(' ');
        const messageWords = message.split(' ');
        const matchedWords = phraseWords.filter(word => messageWords.includes(word));
        
        if (matchedWords.length > 0) {
          const wordScore = matchedWords.length / phraseWords.length;
          totalScore += wordScore * 0.5;
          matchedPhrases++;
        }
      }
    }

    return matchedPhrases > 0 ? totalScore / trainingPhrases.length : 0;
  }

  /**
   * Get default fallback intent
   * @param {string} userRole - User role
   * @returns {Object} - Default intent
   */
  getDefaultIntent(userRole) {
    return {
      intent_name: 'fallback',
      response_template: "I couldn't find an exact match for your question. You can use our quick links below or type details like 'loan', 'credit card', or 'partner' to search.",
      chips: JSON.stringify([
        { label: 'Find Credit Card', action: 'cards_start' },
        { label: 'Apply for Loan', action: 'loans_start' },
        { label: 'Partner Earnings', action: 'partner_start' },
        { label: 'Contact Support', action: 'support_start' }
      ]),
      confidence_score: 0
    };
  }

  /**
   * Get all intents (for admin panel)
   * @param {Object} filters - Optional filters
   * @returns {Array} - List of intents
   */
  async getIntents(filters = {}) {
    try {
      let queryStr = `SELECT * FROM chatbot_intents WHERE 1=1`;
      const params = [];

      if (filters.is_active !== undefined) {
        params.push(filters.is_active);
        queryStr += ` AND is_active = $${params.length}`;
      }

      if (filters.required_role) {
        params.push(filters.required_role);
        queryStr += ` AND $${params.length} = ANY(required_role)`;
      }

      queryStr += ` ORDER BY priority DESC, created_at DESC`;

      const { rows } = await query(queryStr, params);
      return rows;
    } catch (error) {
      logger.error('Error fetching intents:', error);
      throw error;
    }
  }

  /**
   * Create new intent
   * @param {Object} intentData - Intent data
   * @returns {Object} - Created intent
   */
  async createIntent(intentData) {
    try {
      const {
        intent_name,
        description,
        training_phrases,
        response_template,
        chips,
        required_role,
        is_active,
        priority
      } = intentData;

      const { rows } = await query(
        `INSERT INTO chatbot_intents (
          intent_name, description, training_phrases, response_template, chips,
          required_role, is_active, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          intent_name,
          description,
          training_phrases,
          response_template,
          JSON.stringify(chips || []),
          required_role || ['PUBLIC'],
          is_active !== undefined ? is_active : true,
          priority || 0
        ]
      );

      return rows[0];
    } catch (error) {
      logger.error('Error creating intent:', error);
      throw error;
    }
  }

  /**
   * Update intent
   * @param {string} intentId - Intent ID
   * @param {Object} intentData - Intent data to update
   * @returns {Object} - Updated intent
   */
  async updateIntent(intentId, intentData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      const allowedFields = [
        'intent_name', 'description', 'training_phrases',
        'response_template', 'chips', 'required_role',
        'is_active', 'priority'
      ];

      for (const field of allowedFields) {
        if (intentData[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          values.push(field === 'chips' ? JSON.stringify(intentData[field]) : intentData[field]);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(intentId);
      const queryStr = `
        UPDATE chatbot_intents
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const { rows } = await query(queryStr, values);
      return rows[0];
    } catch (error) {
      logger.error('Error updating intent:', error);
      throw error;
    }
  }

  /**
   * Delete intent
   * @param {string} intentId - Intent ID
   * @returns {boolean} - Success status
   */
  async deleteIntent(intentId) {
    try {
      const { rows } = await query(
        `DELETE FROM chatbot_intents WHERE id = $1 RETURNING id`,
        [intentId]
      );
      return rows.length > 0;
    } catch (error) {
      logger.error('Error deleting intent:', error);
      throw error;
    }
  }
}

module.exports = new IntentService();
