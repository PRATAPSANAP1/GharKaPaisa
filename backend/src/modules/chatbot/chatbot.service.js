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

      const lowerMsg = userMessage.toLowerCase().trim();
      if (
        lowerMsg === 'find credit card' ||
        lowerMsg === 'credit card' ||
        lowerMsg === 'credit cards' ||
        lowerMsg === 'apply credit card' ||
        lowerMsg === 'find card' ||
        lowerMsg === 'cards'
      ) {
        return await this.handleFindCreditCardFlow(context);
      }

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

      if (action === 'cards_start' || action === 'cards_find') {
        return await this.handleFindCreditCardFlow(context);
      }

      if (action.startsWith('select_bank_')) {
        const bankId = action.replace('select_bank_', '');
        return await this.handleSelectBankFlow(bankId, context);
      }

      if (action.startsWith('select_product_')) {
        const productId = action.replace('select_product_', '');
        return await this.handleSelectProductFlow(productId, context);
      }

      if (action.startsWith('select_role_partner_')) {
        const productId = action.replace('select_role_partner_', '');
        return await this.handleRolePartnerFlow(productId, context);
      }

      if (action.startsWith('select_role_employee_')) {
        const productId = action.replace('select_role_employee_', '');
        return await this.handleRoleEmployeeFlow(productId, context);
      }

      if (action.startsWith('select_role_customer_')) {
        const productId = action.replace('select_role_customer_', '');
        return await this.handleRoleCustomerFlow(productId, context);
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
   * Interactive Credit Card Flow - Step 1: Bank Selection
   */
  async handleFindCreditCardFlow(context) {
    try {
      const banks = await searchService.getAllActiveBanks();
      if (!banks || banks.length === 0) {
        return responseService.buildTextResponse(
          "We could not find any active banks in the database at the moment.",
          context,
          responseService.getQuickLinks(context)
        );
      }

      const chips = banks.slice(0, 10).map(b => ({
        label: b.name,
        action: `select_bank_${b.id}`
      }));
      chips.push({ label: 'Main Menu', action: 'main_menu' });

      return responseService.buildTextResponse(
        "💳 *Find Credit Card*\n\nWhich bank credit card are you looking for? Please select a bank below or type the bank name:",
        context,
        chips
      );
    } catch (error) {
      logger.error('Error in handleFindCreditCardFlow:', error);
      return responseService.buildTextResponse(
        "Which bank credit card are you looking for? Please select a bank below:",
        context,
        responseService.getQuickLinks(context)
      );
    }
  }

  /**
   * Interactive Credit Card Flow - Step 2: Product Selection for Bank
   */
  async handleSelectBankFlow(bankId, context) {
    try {
      const bank = await searchService.getBankById(bankId);
      const products = await searchService.searchProductsByBank(bankId, 'credit_card');

      const bankName = bank ? bank.name : 'Selected Bank';

      if (!products || products.length === 0) {
        return responseService.buildTextResponse(
          `I found **${bankName}**, but there are currently no active credit card products listed for it in our database.`,
          context,
          [
            { label: 'Select Another Bank', action: 'cards_start' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        );
      }

      const chips = products.map(p => ({
        label: p.name,
        action: `select_product_${p.id}`
      }));
      chips.push({ label: 'Back to Banks', action: 'cards_start' });
      chips.push({ label: 'Main Menu', action: 'main_menu' });

      return responseService.buildTextResponse(
        `🏦 *${bankName} Credit Cards*\n\nGreat choice! Here are the active credit cards available for **${bankName}**. Please select a card to proceed:`,
        context,
        chips
      );
    } catch (error) {
      logger.error('Error in handleSelectBankFlow:', error);
      return responseService.buildTextResponse(
        "Please select a product from the options below:",
        context,
        [{ label: 'Find Credit Card', action: 'cards_start' }]
      );
    }
  }

  /**
   * Interactive Credit Card Flow - Step 3: Role Selection for Selected Product
   */
  async handleSelectProductFlow(productId, context) {
    try {
      const product = await searchService.getProductById(productId);
      if (!product) {
        return responseService.buildTextResponse(
          "The selected card product details could not be found. Please try selecting a bank again.",
          context,
          [{ label: 'Find Credit Card', action: 'cards_start' }, { label: 'Main Menu', action: 'main_menu' }]
        );
      }

      const chips = [
        { label: 'As Partner', action: `select_role_partner_${product.id}` },
        { label: 'As Employee', action: `select_role_employee_${product.id}` },
        { label: 'As Customer (Direct)', action: `select_role_customer_${product.id}` },
        { label: 'Main Menu', action: 'main_menu' }
      ];

      return responseService.buildTextResponse(
        `📌 *Selected Card: ${product.name}*\n\nHow would you like to process the credit card application for **${product.name}**?\n\nPlease select your role below:`,
        context,
        chips
      );
    } catch (error) {
      logger.error('Error in handleSelectProductFlow:', error);
      return responseService.buildTextResponse(
        "Please select how you would like to process your application:",
        context,
        [{ label: 'Find Credit Card', action: 'cards_start' }]
      );
    }
  }

  /**
   * Interactive Credit Card Flow - Role: Partner
   */
  async handleRolePartnerFlow(productId, context) {
    try {
      const product = await searchService.getProductById(productId);
      const productName = product ? product.name : 'Credit Card';
      const productSlug = product ? product.slug : '';

      if (context.role === 'PARTNER' || context.role === 'TEAM_MEMBER') {
        return responseService.buildTextResponse(
          `💼 *Partner Processing - ${productName}*\n\nWelcome Partner! You are logged in. Click **'Create Partner Lead'** below to submit a lead for **${productName}** and earn commission.`,
          context,
          [
            { label: 'Create Partner Lead', action: 'go_partner_add_lead' },
            { label: 'View Card Details', action: `go_prod_${productSlug}` },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        );
      }

      return responseService.buildTextResponse(
        `💼 *Partner Processing - ${productName}*\n\nTo process as a Partner and earn commission on **${productName}**, please log in to your Partner account or register as a new Partner.`,
        context,
        [
          { label: 'Login to Partner Portal', action: 'go_login' },
          { label: 'Register as Partner', action: 'go_register' },
          { label: 'Process as Customer (No Login)', action: `select_role_customer_${productId}` }
        ]
      );
    } catch (error) {
      logger.error('Error in handleRolePartnerFlow:', error);
      return responseService.buildTextResponse(
        "Please log in or register to continue as a Partner.",
        context,
        [{ label: 'Login', action: 'go_login' }, { label: 'Register', action: 'go_register' }]
      );
    }
  }

  /**
   * Interactive Credit Card Flow - Role: Employee
   */
  async handleRoleEmployeeFlow(productId, context) {
    try {
      const product = await searchService.getProductById(productId);
      const productName = product ? product.name : 'Credit Card';
      const productSlug = product ? product.slug : '';

      if (context.role === 'EMPLOYEE') {
        return responseService.buildTextResponse(
          `👔 *Employee Processing - ${productName}*\n\nHello! You are logged in as an Employee. Click **'Punch Employee Lead'** below to process **${productName}** and log your incentive.`,
          context,
          [
            { label: 'Punch Employee Lead', action: 'go_employee_cards' },
            { label: 'View Card Details', action: `go_prod_${productSlug}` },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        );
      }

      return responseService.buildTextResponse(
        `👔 *Employee Processing - ${productName}*\n\nTo process as an Employee and log incentives for **${productName}**, please log in to your Employee Portal.`,
        context,
        [
          { label: 'Login to Employee Portal', action: 'go_login' },
          { label: 'Process as Customer (No Login)', action: `select_role_customer_${productId}` }
        ]
      );
    } catch (error) {
      logger.error('Error in handleRoleEmployeeFlow:', error);
      return responseService.buildTextResponse(
        "Please log in to continue as an Employee.",
        context,
        [{ label: 'Login', action: 'go_login' }]
      );
    }
  }

  /**
   * Interactive Credit Card Flow - Role: Customer (Direct Application Without Login)
   */
  async handleRoleCustomerFlow(productId, context) {
    try {
      const product = await searchService.getProductById(productId);
      const productName = product ? product.name : 'Credit Card';
      const productSlug = product ? product.slug : '';

      return responseService.buildTextResponse(
        `👤 *Customer Application - ${productName}*\n\nGreat! You are applying directly as a Customer for **${productName}**. **No login required!**\n\nClick **'Open Application Form'** below to fill out your details directly:`,
        context,
        [
          { label: 'Open Application Form', action: `apply_direct_${productSlug}` },
          { label: 'View Card Features', action: `go_prod_${productSlug}` },
          { label: 'Main Menu', action: 'main_menu' }
        ]
      );
    } catch (error) {
      logger.error('Error in handleRoleCustomerFlow:', error);
      return responseService.buildTextResponse(
        "Click below to fill out your application form directly:",
        context,
        [{ label: 'Main Menu', action: 'main_menu' }]
      );
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
