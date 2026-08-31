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

      // 0. Check for unauthorized admin actions (security check)
      if (this.isUnauthorizedAction(messageLower) && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return this.getUnauthorizedActionResponse();
      }

      // 0.5. Check for password-related intents (fallback before DB)
      if (this.isPasswordReset(messageLower)) {
        return {
          intent_name: 'reset_password',
          response_template: 'I can help you reset your password. You can reset your password through the login page.',
          chips: JSON.stringify([
            { label: 'Go to Login', action: 'go_login' },
            { label: 'Contact Support', action: 'go_contact' }
          ]),
          confidence_score: 0.9
        };
      }

      // 1. Check for create lead intent with authentication handling
      if (this.isCreateLeadIntent(messageLower)) {
        return this.getCreateLeadResponse(userRole);
      }

      // 2. Get all active intents that match the user role
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

      // 3. Dynamic Database Product & Bank Search
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
   * Check if message is about creating a lead
   * @param {string} message - Lowercase user message
   * @returns {boolean} - True if create lead related
   */
  isCreateLeadIntent(message) {
    const leadKeywords = [
      'create a new lead', 'create new lead', 'i want create lead',
      'i want to create a new lead', 'i want to create lead',
      'add lead', 'new lead', 'create lead', 'customer lead'
    ];
    return leadKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Get create lead response based on authentication and role
   * @param {string} userRole - User role
   * @returns {Object} - Response with authentication check and role-based routing
   */
  getCreateLeadResponse(userRole) {
    const role = (userRole || 'PUBLIC').toUpperCase();

    // If user is not authenticated (PUBLIC)
    if (role === 'PUBLIC') {
      return {
        intent_name: 'public_create_lead',
        response_template: 'To create leads and earn commissions, you need to be a registered Partner. Do you already have a Partner account?',
        chips: JSON.stringify([
          { label: 'Login (Existing Partner)', action: 'go_login' },
          { label: 'Register (New Partner)', action: 'go_register' }
        ]),
        confidence_score: 0.95
      };
    }

    // If user is authenticated, route based on role
    const roleRoutes = {
      'PARTNER': {
        response_template: 'Great! I can help you create a new lead. Which product category would you like to create a lead for?',
        chips: JSON.stringify([
          { label: 'Credit Card', action: 'go_add_lead_card' },
          { label: 'Loan', action: 'go_add_lead_loan' },
          { label: 'Insurance', action: 'go_add_lead_insurance' }
        ])
      },
      'TEAM_MEMBER': {
        response_template: 'Great! I can help you create a new lead. Which product category would you like to create a lead for?',
        chips: JSON.stringify([
          { label: 'Credit Card', action: 'go_add_lead_card' },
          { label: 'Loan', action: 'go_add_lead_loan' },
          { label: 'Insurance', action: 'go_add_lead_insurance' }
        ])
      },
      'EMPLOYEE': {
        response_template: 'Great! I can help you create a new lead. Which product category would you like to create a lead for?',
        chips: JSON.stringify([
          { label: 'Credit Card', action: 'go_add_lead_card' },
          { label: 'Loan', action: 'go_add_lead_loan' },
          { label: 'Insurance', action: 'go_add_lead_insurance' }
        ])
      },
      'ADMIN': {
        response_template: 'As an Admin, you can access the CRM and Lead Management tools. Would you like to go to the admin tools?',
        chips: JSON.stringify([
          { label: 'Manage Leads', action: 'go_admin_leads' },
          { label: 'Applications CRM', action: 'go_admin_applications' }
        ])
      },
      'SUPER_ADMIN': {
        response_template: 'As Super Admin, you have full access to all lead management tools. Where would you like to go?',
        chips: JSON.stringify([
          { label: 'Manage Leads', action: 'go_admin_leads' },
          { label: 'Employee Leads', action: 'go_employee_cards' },
          { label: 'Partner Products', action: 'go_partner_products' }
        ])
      }
    };

    const roleResponse = roleRoutes[role] || roleRoutes['PARTNER'];

    return {
      intent_name: `${role.toLowerCase()}_create_lead`,
      response_template: roleResponse.response_template,
      chips: roleResponse.chips,
      confidence_score: 0.95
    };
  }

  /**
   * Check if message is about password reset
   * @param {string} message - Lowercase user message
   * @returns {boolean} - True if password reset related
   */
  isPasswordReset(message) {
    const passwordKeywords = [
      'reset password', 'forgot password', 'change password',
      'password reset', 'forgot my password', 'change my password',
      'reset my password', 'new password', 'password recovery'
    ];
    return passwordKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is about unauthorized admin actions
   * @param {string} message - Lowercase user message
   * @returns {boolean} - True if unauthorized action detected
   */
  isUnauthorizedAction(message) {
    const unauthorizedKeywords = [
      'approve application', 'reject application', 'delete application',
      'admin action', 'super admin action', 'approve commission',
      'release commission', 'manage bank', 'manage product'
    ];
    return unauthorizedKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Get unauthorized action response
   * @returns {Object} - Unauthorized action response
   */
  getUnauthorizedActionResponse() {
    return {
      intent_name: 'unauthorized_action',
      response_template: 'This action requires administrative authorization. You do not have permission for this action.',
      chips: JSON.stringify([
        { label: 'View My Applications', action: 'my_applications' },
        { label: 'Contact Support', action: 'go_contact' }
      ]),
      confidence_score: 0.95
    };
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
