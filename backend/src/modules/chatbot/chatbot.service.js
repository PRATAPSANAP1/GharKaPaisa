const { query } = require('../../config/database');
const contextService = require('./chatbot.context.service');
const intentService = require('./chatbot.intent.service');
const searchService = require('./chatbot.search.service');
const productService = require('./chatbot.product.service');
const bankService = require('./chatbot.bank.service');
const applicationService = require('./chatbot.application.service');
const partnerService = require('./chatbot.partner.service');
const employeeService = require('./chatbot.employee.service');
const responseService = require('./chatbot.response.service');
const securityService = require('./chatbot.security.service');
const { INTENTS } = require('./chatbot.constants');
const logger = require('../../config/logger');

class ChatbotService {
  /**
   * Main message processing engine
   * @param {Object} req - Express request
   * @returns {Object} Structured JSON response
   */
  async processMessage(req) {
    try {
      const userMessage = (req.body?.message || '').trim();
      const context = await contextService.buildContext(req);

      if (!userMessage) {
        return responseService.buildTextResponse(
          "Hello! How can I assist you with credit cards, loans, or applications today?",
          context
        );
      }

      // 1. Detect Intent using new intent service with FAQ support
      const intentResult = await intentService.detectIntent(userMessage, context.role, req);

      // 2. Security Check for sensitive actions
      const sensitiveActions = ['approve_application', 'reject_application', 'delete_application', 'admin_action'];
      if (sensitiveActions.includes(intentResult.intent_name)) {
        const securityCheck = await securityService.performSecurityCheck(req, intentResult.intent_name);
        if (!securityCheck.authorized) {
          const unauthorizedResponse = securityService.getUnauthorizedResponse(
            securityCheck.reason,
            securityCheck.userRole
          );
          return responseService.buildTextResponse(
            unauthorizedResponse.message,
            context,
            unauthorizedResponse.chips
          );
        }
      }

      // 3. If FAQ response, return directly
      if (intentResult.intent_name === 'faq_response') {
        return {
          success: true,
          message: intentResult.response_template,
          chips: JSON.parse(intentResult.chips),
          category: 'faq'
        };
      }

      // 4. Continue with existing logic for other intents
      const { intent, entities } = await intentService.detectIntentAndEntities(userMessage);

      // 5. Dispatch to appropriate sub-service based on intent
      switch (intent) {
        case INTENTS.GREETING:
          return responseService.buildTextResponse(
            `Hello ${context.fullName !== 'User' ? context.fullName : ''}! Welcome to GharKaPaisa. How can I assist you today?`,
            context
          );

        case INTENTS.LEAD_PROCESS:
          return this.handleLeadProcess(context);

        case INTENTS.SUPPORT:
          return responseService.buildTextResponse(
            "Our dedicated support team is available Mon-Sat, 10 AM to 7 PM.\n\n• Email: support@gharkapaisa.com\n• Helpline: 1800-GKP-HELP",
            context,
            [{ label: 'Contact Page', action: 'go_contact' }, { label: 'Main Menu', action: 'main_menu' }]
          );

        case INTENTS.EXACT_PRODUCT:
          if (entities.matchedProduct) {
            const res = await productService.formatExactProductResponse(entities.matchedProduct, context);
            res.chips = responseService.getQuickLinks(context);
            return res;
          }
          break;

        case INTENTS.BANK_PRODUCTS:
          if (entities.bank) {
            const res = await bankService.handleBankProducts(entities.bank, entities.category, context);
            res.chips = responseService.getQuickLinks(context);
            return res;
          }
          break;

        case INTENTS.PRODUCT_SEARCH:
        case INTENTS.CATEGORY_SEARCH: {
          let products = [];
          if (entities.bank) {
            products = await searchService.searchProductsByBank(entities.bank.id, entities.category);
          } else {
            products = await searchService.searchProducts(userMessage);
          }

          if (products.length === 1) {
            const res = await productService.formatExactProductResponse(products[0], context);
            res.chips = responseService.getQuickLinks(context);
            return res;
          }

          if (products.length > 1) {
            const title = entities.bank
              ? `Found ${products.length} ${entities.bank.name} products:`
              : `Found ${products.length} matching products:`;
            const res = await productService.formatProductListResponse(products, title, context);
            res.chips = responseService.getQuickLinks(context);
            return res;
          }
          break;
        }

        case INTENTS.APPLICATION_SEARCH:
        case INTENTS.APPLICATION_STATUS: {
          const res = await applicationService.handleApplicationSearch(entities.statusFilter, context);
          res.chips = responseService.getQuickLinks(context);
          return res;
        }

        case INTENTS.WALLET_INQUIRY: {
          const res = await partnerService.handlePartnerEarnings(context);
          res.chips = responseService.getQuickLinks(context);
          return res;
        }

        case INTENTS.MY_TEAM: {
          const res = await partnerService.handlePartnerTeam(context);
          res.chips = responseService.getQuickLinks(context);
          return res;
        }

        case INTENTS.INCENTIVE_SEARCH: {
          const res = await employeeService.handleEmployeeIncentives(context);
          res.chips = responseService.getQuickLinks(context);
          return res;
        }

        case INTENTS.ONBOARDING_STATUS:
        case INTENTS.KYC_STATUS: {
          const res = await employeeService.handleEmployeeOnboarding(context);
          res.chips = responseService.getQuickLinks(context);
          return res;
        }
      }

      // 6. Dynamic Database Search Fallback
      const dbProducts = await searchService.searchProducts(userMessage);
      if (dbProducts.length === 1) {
        const res = await productService.formatExactProductResponse(dbProducts[0], context);
        res.chips = responseService.getQuickLinks(context);
        return res;
      }
      if (dbProducts.length > 1) {
        const res = await productService.formatProductListResponse(dbProducts, `Found ${dbProducts.length} matching products:`, context);
        res.chips = responseService.getQuickLinks(context);
        return res;
      }

      // 7. Smart No-Result Fallback
      return responseService.buildNoResultResponse(userMessage, context);
    } catch (error) {
      logger.error('Error processing chatbot message:', error);
      return {
        success: false,
        type: 'ERROR',
        message: 'Something went wrong while processing your query. Please try again.',
        chips: responseService.getQuickLinks({ role: 'PUBLIC' })
      };
    }
  }

  /**
   * Role-specific Lead Process Flow
   */
  handleLeadProcess(context) {
    const role = (context.role || 'PUBLIC').toUpperCase();

    if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
      return responseService.buildTextResponse(
        "📋 *Partner Lead Creation Process:*\n\n1. Select Product (Credit Card, Loan, Insurance)\n2. Add Customer details or share referral link\n3. Customer completes OTP & KYC\n4. Track lead status & payout in 'My Applications'.",
        context,
        [
          { label: 'Step 1: Select Product', action: 'go_partner_products' },
          { label: 'Step 2: Add Lead Form', action: 'go_partner_add_lead' },
          { label: 'Step 4: Track Applications', action: 'go_partner_applications' },
          { label: 'Main Menu', action: 'main_menu' }
        ]
      );
    }

    if (role === 'EMPLOYEE') {
      return responseService.buildTextResponse(
        "📋 *Employee Lead Punching Process:*\n\n1. Select Bank Credit Card / Loan\n2. Punch customer details\n3. Customer completes verification link\n4. Track application stage & incentives in Applications.",
        context,
        [
          { label: 'Step 1: Select Product', action: 'go_employee_cards' },
          { label: 'Step 4: Track Applications', action: 'go_employee_applications' },
          { label: 'My Incentives', action: 'go_employee_incentives' },
          { label: 'Main Menu', action: 'main_menu' }
        ]
      );
    }

    return responseService.buildTextResponse(
      "📋 *GharKaPaisa Lead Submission Process:*\n\n1. Register as a Partner\n2. Complete quick KYC verification\n3. Select Product & share link with customers\n4. Earn up to ₹3,500 per approval!",
      context,
      [
        { label: 'Register as Partner', action: 'go_register' },
        { label: 'Login to Account', action: 'go_login' },
        { label: 'Explore Cards', action: 'go_cards' }
      ]
    );
  }

  /**
   * Handle Action chip click
   */
  async handleAction(sessionId, action, label, userId, userRole) {
    try {
      const context = {
        sessionId,
        userId,
        role: (userRole || 'PUBLIC').toUpperCase(),
        panel: (userRole || 'PUBLIC').toLowerCase()
      };

      if (action === 'main_menu') {
        const res = responseService.buildTextResponse(
          "Here is the main menu. What would you like to explore today?",
          context
        );
        res.chips = responseService.getQuickLinks(context);
        return res;
      }

      if (action === 'lead_process') {
        return this.handleLeadProcess(context);
      }

      if (action === 'go_partner_products' || action === 'go_employee_cards') {
        const products = await searchService.searchProducts('');
        const title = context.role === 'EMPLOYEE' ? 'Active Employee Cards:' : 'Partner Product Catalog:';
        const res = await productService.formatProductListResponse(products, title, context);
        res.chips = responseService.getQuickLinks(context);
        return res;
      }

      // Default process message with chip label text
      const reqMock = {
        body: { message: label, session_id: sessionId, user_role: userRole },
        headers: {},
        user: userId ? { id: userId, role: userRole } : null
      };

      return await this.processMessage(reqMock);
    } catch (error) {
      logger.error('Error handling chatbot action:', error);
      return responseService.buildTextResponse(`Processing action: ${label}`, { role: userRole });
    }
  }

  /**
   * Get or create active conversation session
   */
  async getOrCreateConversation(sessionId, userId, userRole) {
    try {
      const { rows } = await query(
        `SELECT * FROM chatbot_conversations WHERE session_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        [sessionId]
      );
      if (rows.length > 0) return rows[0];

      const { rows: newConv } = await query(
        `INSERT INTO chatbot_conversations (session_id, user_id, user_role, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [sessionId, userId, userRole]
      );
      return newConv[0];
    } catch (error) {
      logger.error('Error getting/creating conversation:', error);
      return { id: sessionId, session_id: sessionId, user_role: userRole, status: 'ACTIVE' };
    }
  }

  /**
   * Get conversation history
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
      logger.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Reset conversation session
   */
  async resetConversation(sessionId) {
    try {
      await query(
        `UPDATE chatbot_conversations SET status = 'RESOLVED', updated_at = NOW() WHERE session_id = $1`,
        [sessionId]
      );
      return { session_id: sessionId, status: 'RESET' };
    } catch (error) {
      logger.error('Error resetting conversation:', error);
      return { session_id: sessionId, status: 'RESET' };
    }
  }

  /**
   * Submit satisfaction feedback rating
   */
  async submitFeedback(sessionId, rating, userId) {
    try {
      const { rows } = await query(
        `INSERT INTO chatbot_analytics (session_id, user_id, satisfaction_rating)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [sessionId, userId, rating]
      );
      return rows[0] || { success: true };
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      return { success: true };
    }
  }

  /**
   * Escalate conversation to human agent
   */
  async escalateToAgent(conversationId, notes) {
    try {
      const { rows } = await query(
        `INSERT INTO chatbot_handoffs (conversation_id, notes, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [conversationId, notes]
      );
      return rows[0] || { conversation_id: conversationId, status: 'PENDING' };
    } catch (error) {
      logger.error('Error escalating to agent:', error);
      return { conversation_id: conversationId, status: 'PENDING' };
    }
  }

  /**
   * Get chatbot analytics summary
   */
  async getAnalytics(filters = {}) {
    try {
      const { rows } = await query(
        `SELECT 
           COUNT(*) AS total_conversations,
           AVG(satisfaction_rating) AS avg_satisfaction
         FROM chatbot_analytics`
      );
      return rows[0] || { total_conversations: 0, avg_satisfaction: 0 };
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      return { total_conversations: 0, avg_satisfaction: 0 };
    }
  }
}

module.exports = new ChatbotService();
