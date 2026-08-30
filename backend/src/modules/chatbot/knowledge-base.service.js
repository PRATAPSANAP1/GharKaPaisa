const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Knowledge Base Service - Manages chatbot knowledge base and FAQ
 */
class KnowledgeBaseService {
  /**
   * Get response for a specific action
   * @param {string} action - Action identifier
   * @param {string} userRole - User role
   * @returns {Object} - Response with text and chips
   */
  async getActionResponse(action, userRole = 'PUBLIC') {
    try {
      // Predefined action responses
      const actionResponses = {
        // Credit Card Actions
        cards_start: {
          text: "Awesome! Let's find your perfect credit card. Which category interests you the most?",
          chips: [
            { label: 'Lifetime Free Cards', action: 'cards_ltf' },
            { label: 'Cashback & Shopping', action: 'cards_cashback' },
            { label: 'Travel & Transit', action: 'cards_travel' },
            { label: 'Rewards & Lifestyle', action: 'cards_rewards' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },
        cards_ltf: {
          text: "We offer multiple Lifetime Free (LTF) credit cards with ₹0 annual fee and ₹0 joining fee. You can view bank options like Axis Bank, HDFC Pixel, or Kotak. You can read the benefits details and apply online.",
          chips: [
            { label: 'Explore LTF Cards Now', action: 'go_ltf' },
            { label: 'Card Categories', action: 'cards_start' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },
        cards_cashback: {
          text: "For shopping enthusiasts, our cashback cards offer up to 5% cashback on top e-commerce websites like Flipkart and Amazon (Axis Flipkart, ICICI Amazon Pay). They are great for saving money on everyday purchases.",
          chips: [
            { label: 'View Credit Cards list', action: 'go_cards' },
            { label: 'Card Categories', action: 'cards_start' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },
        cards_travel: {
          text: "If you travel frequently, co-branded travel cards give you complimentary lounge access, air miles, and hotel points to save on flights and transit.",
          chips: [
            { label: 'View Travel Benefits', action: 'go_travel' },
            { label: 'Card Categories', action: 'cards_start' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },
        cards_rewards: {
          text: "Our premium reward and lifestyle cards reward your dining, movies, and utility spends with high multipliers, which you can redeem for vouchers or items.",
          chips: [
            { label: 'Compare All Cards', action: 'go_cards' },
            { label: 'Card Categories', action: 'cards_start' }
          ]
        },

        // Loan Actions
        loans_start: {
          text: "We offer quick loans via our top banking partners. What kind of loan are you looking for?",
          chips: [
            { label: 'Personal Loan', action: 'loans_personal' },
            { label: 'Business Loan', action: 'loans_business' },
            { label: 'Home Loan / LAP', action: 'loans_home' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },
        loans_personal: {
          text: "Personal loans have minimum documentation and quick approval, starting from 10.5% interest. You can check your eligibility and submit details on our Loans page.",
          chips: [
            { label: 'Check Loan Options', action: 'go_loans' },
            { label: 'Loan Options', action: 'loans_start' }
          ]
        },
        loans_business: {
          text: "Expand your business with unsecured lines of credit up to ₹50 Lakhs. Rates start from 13.5%.",
          chips: [
            { label: 'Go to Loans Page', action: 'go_loans' },
            { label: 'Loan Options', action: 'loans_start' }
          ]
        },
        loans_home: {
          text: "Get home loans or Loans Against Property (LAP) starting from 8.4% interest rate with flexible tenure options.",
          chips: [
            { label: 'Go to Loans Page', action: 'go_loans' },
            { label: 'Loan Options', action: 'loans_start' }
          ]
        },

        // Partner Actions
        partner_start: {
          text: "As a GharKaPaisa Partner, you can submit leads for financial products and earn huge commission payouts on every approval. How can I help you?",
          chips: [
            { label: 'How to Join?', action: 'partner_join' },
            { label: 'Commission Rates', action: 'partner_rates' },
            { label: 'Wallet & Payouts', action: 'partner_payouts' },
            { label: 'Referral Network', action: 'partner_referral' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },
        partner_join: {
          text: "It is free and fast! 1. Go to register. 2. Sign up with your mobile number. 3. Upload KYC files (PAN, Aadhaar) inside your panel. 4. Share links and start earning!",
          chips: [
            { label: 'Register Now', action: 'go_register' },
            { label: 'Login to Account', action: 'go_login' }
          ]
        },
        partner_rates: {
          text: "Partners earn up to ₹3,500 per credit card approval and up to 3.5% payout on loan disbursements. Commission slabs are tier-based so you earn more as your monthly volume grows.",
          chips: [
            { label: 'Become a Partner', action: 'go_register' },
            { label: 'Partner Info', action: 'partner_start' }
          ]
        },
        partner_payouts: {
          text: "Your approved lead payouts are credited directly to your GKP Wallet. You can withdraw withdrawable funds instantly to your registered bank account or UPI ID with one click.",
          chips: [
            { label: 'Login & Check Wallet', action: 'go_login' },
            { label: 'Partner Info', action: 'partner_start' }
          ]
        },
        partner_referral: {
          text: "Build your network and earn passive income! You get commissions on Level 1 (direct), Level 2, and Level 3 sub-agents' earnings. Check the Team Referral tab in your Dashboard.",
          chips: [
            { label: 'Register as Agent', action: 'go_register' },
            { label: 'Partner Info', action: 'partner_start' }
          ]
        },

        // Support Actions
        support_start: {
          text: "Our dedicated support team is available Mon-Sat, 10 AM to 7 PM. You can call us, send a message on WhatsApp, or email us at support@gharkapaisa.com.",
          chips: [
            { label: 'Go to Contact Page', action: 'go_contact' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        },

        // Role-Specific Lead Creation Process Flow
        lead_process: this.getLeadProcessResponse(userRole),

        // Main Menu
        main_menu: this.getMainMenuResponse(userRole),

        // Navigation Actions (these trigger redirects)
        go_ltf: { text: 'Redirecting to Lifetime Free Cards...', chips: [], redirect: '/credit-cards/lifetime-free-credit-cards-ltf' },
        go_cards: { text: 'Redirecting to Credit Cards...', chips: [], redirect: '/credit-cards' },
        go_travel: { text: 'Redirecting to Travel & Transit...', chips: [], redirect: '/travel-transit' },
        go_loans: { text: 'Redirecting to Loans...', chips: [], redirect: '/loans' },
        go_register: { text: 'Redirecting to Registration...', chips: [], redirect: '/register' },
        go_login: { text: 'Redirecting to Login...', chips: [], redirect: '/login' },
        go_contact: { text: 'Redirecting to Contact Page...', chips: [], redirect: '/contact' },
        go_careers: { text: 'Redirecting to Careers...', chips: [], redirect: '/careers' },
        go_interview: { text: 'Redirecting to Interview Registration...', chips: [], redirect: '/careers/register' },
        go_whatsapp: { text: 'Opening WhatsApp...', chips: [], redirect: 'https://wa.me/919876543210' },
        go_cibil: { text: 'Redirecting to CIBIL check...', chips: [], redirect: 'https://cibil.com' },

        // Panel-Specific Lead Redirects
        go_partner_products: { text: 'Opening Partner Products Page...', chips: [], redirect: '/partner/products' },
        go_partner_add_lead: { text: 'Opening Add Lead Form...', chips: [], redirect: '/partner/leads/add' },
        go_partner_applications: { text: 'Opening Partner Applications...', chips: [], redirect: '/partner/applications' },
        go_employee_cards: { text: 'Opening Employee Credit Cards...', chips: [], redirect: '/employee/credit-cards' },
        go_employee_applications: { text: 'Opening Employee Applications...', chips: [], redirect: '/employee/applications' },
        go_employee_incentives: { text: 'Opening Employee Incentives...', chips: [], redirect: '/employee/incentives' },
        go_admin_leads: { text: 'Opening Lead Management...', chips: [], redirect: userRole === 'SUPER_ADMIN' ? '/super-admin/leads' : '/admin/leads' },
        go_admin_direct_leads: { text: 'Opening Direct Leads...', chips: [], redirect: userRole === 'SUPER_ADMIN' ? '/super-admin/direct-leads' : '/admin/direct-leads' },
        go_admin_applications: { text: 'Opening Applications CRM...', chips: [], redirect: userRole === 'SUPER_ADMIN' ? '/super-admin/applications' : '/admin/applications' }
      };

      return actionResponses[action] || this.getDefaultResponse();
    } catch (error) {
      logger.error('Error getting action response:', error);
      return this.getDefaultResponse();
    }
  }

  /**
   * Get role-specific lead process response
   */
  getLeadProcessResponse(userRole) {
    const role = (userRole || 'PUBLIC').toUpperCase();

    if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
      return {
        text: "📋 Partner Lead Creation Process:\n\nStep 1: Select Financial Product (Credit Card, Personal/Business Loan, Insurance).\nStep 2: Generate referral share link or open the Add Lead form.\nStep 3: Enter Customer details (Name, Mobile, PAN, Income).\nStep 4: Customer completes OTP verification & document upload.\nStep 5: Track lead status & payout credit in 'My Applications'.",
        chips: [
          { label: 'Step 1: Select Product', action: 'go_partner_products' },
          { label: 'Step 2: Add Lead Form', action: 'go_partner_add_lead' },
          { label: 'Step 5: Track Applications', action: 'go_partner_applications' },
          { label: 'Main Menu', action: 'main_menu' }
        ]
      };
    }

    if (role === 'EMPLOYEE') {
      return {
        text: "📋 Employee Lead Punching Process:\n\nStep 1: Select Bank Credit Card or Loan product.\nStep 2: Punch customer details (Name, Mobile Number, PAN, Salary/Income).\nStep 3: Trigger customer OTP & KYC verification link.\nStep 4: Track application stage progress & earned incentives in Applications.",
        chips: [
          { label: 'Step 1: Select Product', action: 'go_employee_cards' },
          { label: 'Step 4: Track Applications', action: 'go_employee_applications' },
          { label: 'My Incentives', action: 'go_employee_incentives' },
          { label: 'Main Menu', action: 'main_menu' }
        ]
      };
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return {
        text: "📋 Admin Lead Management Workflow:\n\nStep 1: Open Manage Leads to review incoming lead queue.\nStep 2: Assign leads to Partners/Executives or process direct punching.\nStep 3: Audit customer documents, CIBIL, and verification state.\nStep 4: Update application stage and monitor conversions in CRM.",
        chips: [
          { label: 'Step 1: Manage Leads', action: 'go_admin_leads' },
          { label: 'Step 1: Direct Leads', action: 'go_admin_direct_leads' },
          { label: 'Step 4: Applications CRM', action: 'go_admin_applications' },
          { label: 'Main Menu', action: 'main_menu' }
        ]
      };
    }

    // Public / Visitor default
    return {
      text: "📋 Lead Submission & Referral Process:\n\nStep 1: Register as a Partner on GharKaPaisa.\nStep 2: Complete quick KYC verification with PAN & Aadhaar.\nStep 3: Select Product (Credit Card, Loan) & share direct referral link.\nStep 4: Earn up to ₹3,500 per credit card approval credited directly to your GKP Wallet!",
      chips: [
        { label: 'Step 1: Register as Partner', action: 'go_register' },
        { label: 'Step 1: Login Account', action: 'go_login' },
        { label: 'Explore Credit Cards', action: 'go_cards' },
        { label: 'Main Menu', action: 'main_menu' }
      ]
    };
  }

  /**
   * Get role-specific main menu response
   */
  getMainMenuResponse(userRole) {
    const role = (userRole || 'PUBLIC').toUpperCase();

    if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
      return {
        text: "Here is your Partner Main Menu. What would you like to explore today?",
        chips: [
          { label: 'Select Product', action: 'go_partner_products' },
          { label: 'Add Lead', action: 'go_partner_add_lead' },
          { label: 'Lead Process', action: 'lead_process' },
          { label: 'My Applications', action: 'go_partner_applications' }
        ]
      };
    }

    if (role === 'EMPLOYEE') {
      return {
        text: "Here is your Employee Main Menu. How can I assist you today?",
        chips: [
          { label: 'Punch Credit Card', action: 'go_employee_cards' },
          { label: 'Lead Process', action: 'lead_process' },
          { label: 'My Applications', action: 'go_employee_applications' },
          { label: 'My Incentives', action: 'go_employee_incentives' }
        ]
      };
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return {
        text: "Here is your Admin Main Menu. What would you like to manage?",
        chips: [
          { label: 'Manage Leads', action: 'go_admin_leads' },
          { label: 'Lead Process', action: 'lead_process' },
          { label: 'Applications CRM', action: 'go_admin_applications' },
          { label: 'Direct Cards', action: 'go_admin_direct_leads' }
        ]
      };
    }

    return {
      text: "Here is the main menu. What would you like to explore today?",
      chips: [
        { label: 'Find Credit Card', action: 'cards_start' },
        { label: 'Apply for Loan', action: 'loans_start' },
        { label: 'Lead Process', action: 'lead_process' },
        { label: 'Partner Earnings', action: 'partner_start' }
      ]
    };
  }

  /**
   * Get default response for unknown actions
   * @returns {Object} - Default response
   */
  getDefaultResponse() {
    return {
      text: "I'm not sure about that. You can use the quick links below or type 'help' for assistance.",
      chips: [
        { label: 'Find Credit Card', action: 'cards_start' },
        { label: 'Apply for Loan', action: 'loans_start' },
        { label: 'Partner Earnings', action: 'partner_start' },
        { label: 'Contact Support', action: 'support_start' }
      ]
    };
  }

  /**
   * Search products & banks dynamically in PostgreSQL
   * @param {string} keyword - Search term (e.g. "axis flipkart", "hdfc", "personal loan")
   * @param {string} userRole - User role (PUBLIC, PARTNER, EMPLOYEE, ADMIN, SUPER_ADMIN)
   * @returns {Object|null} - Formatted response object with template and chips
   */
  async searchProducts(keyword, userRole = 'PUBLIC') {
    try {
      const cleanKeyword = keyword.trim().toLowerCase();
      const role = (userRole || 'PUBLIC').toUpperCase();

      // 1. Check if search term matches a bank name or bank short code
      const { rows: bankRows } = await query(
        `SELECT id, name, short_code, logo_url FROM banks 
         WHERE (LOWER(name) LIKE $1 OR LOWER(short_code) LIKE $1)
         AND (is_active = true OR status = 'Active') LIMIT 1`,
        [`%${cleanKeyword}%`]
      );

      if (bankRows.length > 0) {
        return await this.getProductsByBank(bankRows[0], userRole);
      }

      // 2. Search products by name, category, or sub_category
      const { rows: productRows } = await query(
        `SELECT p.*, b.name as bank_name, b.short_code as bank_short_code, b.logo_url as bank_logo
         FROM products p
         JOIN banks b ON b.id = p.bank_id
         WHERE (p.name ILIKE $1 OR p.category::text ILIKE $1 OR p.sub_category ILIKE $1 OR p.best_for ILIKE $1)
         AND (p.is_active = true OR p.status = 'Active')
         ORDER BY p.priority DESC, p.created_at DESC
         LIMIT 6`,
        [`%${cleanKeyword}%`]
      );

      if (productRows.length === 0) {
        return null;
      }

      return this.formatProductSearchResult(productRows, cleanKeyword, role);
    } catch (error) {
      logger.error('Error searching products in chatbot KB:', error);
      return null;
    }
  }

  /**
   * Get products by bank
   */
  async getProductsByBank(bankObj, userRole = 'PUBLIC') {
    try {
      const bankId = bankObj.id;
      const bankName = bankObj.name;
      const role = (userRole || 'PUBLIC').toUpperCase();

      const { rows: products } = await query(
        `SELECT p.*, b.name as bank_name, b.short_code as bank_short_code
         FROM products p
         JOIN banks b ON b.id = p.bank_id
         WHERE p.bank_id = $1 AND (p.is_active = true OR p.status = 'Active')
         ORDER BY p.priority DESC, p.created_at DESC
         LIMIT 8`,
        [bankId]
      );

      if (products.length === 0) {
        return {
          response_template: `Currently there are no active credit cards or loan products listed for ${bankName} in our database. Please check back soon or explore other top banking partners!`,
          chips: [
            { label: 'Explore Credit Cards', action: 'cards_start' },
            { label: 'Explore Loans', action: 'loans_start' },
            { label: 'Main Menu', action: 'main_menu' }
          ]
        };
      }

      let text = `💳 Here are the active ${bankName} financial products available on GharKaPaisa:\n\n`;
      const chips = [];

      products.forEach((p, idx) => {
        const categoryLabel = p.category ? p.category.replace('_', ' ').toUpperCase() : 'PRODUCT';
        const feeInfo = p.is_lifetime_free ? '₹0 Lifetime Free' : (p.annual_fee ? `Fee: ${p.annual_fee}` : '');
        text += `${idx + 1}. *${p.name}* [${categoryLabel}]\n`;
        if (p.short_description || p.welcome_benefits || p.rewards) {
          text += `   • ${p.short_description || p.welcome_benefits || p.rewards}\n`;
        }
        if (feeInfo) text += `   • ${feeInfo}\n`;
        text += `\n`;

        let chipAction = 'go_cards';
        if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
          chipAction = 'go_partner_products';
        } else if (role === 'EMPLOYEE') {
          chipAction = 'go_employee_cards';
        } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          chipAction = 'go_admin_leads';
        } else {
          chipAction = p.slug ? `go_prod_${p.slug}` : 'go_cards';
        }

        chips.push({
          label: `View ${p.name}`,
          action: chipAction
        });
      });

      chips.push({ label: 'Main Menu', action: 'main_menu' });

      return {
        response_template: text,
        chips: chips
      };
    } catch (error) {
      logger.error('Error fetching bank products in KB:', error);
      return null;
    }
  }

  /**
   * Format product search results
   */
  formatProductSearchResult(products, keyword, role) {
    if (products.length === 1) {
      const p = products[0];
      const categoryLabel = p.category ? p.category.replace('_', ' ').toUpperCase() : 'FINANCIAL PRODUCT';
      
      let text = `⭐ *${p.name}* (${p.bank_name})\n`;
      text += `Category: ${categoryLabel}\n\n`;
      
      if (p.short_description) text += `📌 *Overview:* ${p.short_description}\n`;
      if (p.welcome_benefits) text += `🎁 *Welcome Benefits:* ${p.welcome_benefits}\n`;
      if (p.rewards || p.cashback) text += `💰 *Rewards & Cashback:* ${p.rewards || p.cashback}\n`;
      if (p.annual_fee) text += `💳 *Fee Structure:* ${p.is_lifetime_free ? '₹0 Lifetime Free (LTF)' : p.annual_fee}\n`;

      const chips = [];

      if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
        chips.push({ label: `View ${p.name} in Partner Catalog`, action: 'go_partner_products' });
        chips.push({ label: `Add Lead for ${p.name}`, action: 'go_partner_add_lead' });
      } else if (role === 'EMPLOYEE') {
        chips.push({ label: `Punch Lead for ${p.name}`, action: 'go_employee_cards' });
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        chips.push({ label: `Manage Applications`, action: 'go_admin_applications' });
      } else {
        chips.push({ label: `View ${p.name} Full Benefits Page`, action: p.slug ? `go_prod_${p.slug}` : 'go_cards' });
        chips.push({ label: 'Explore All Cards', action: 'go_cards' });
      }
      chips.push({ label: 'Main Menu', action: 'main_menu' });

      return {
        response_template: text,
        chips: chips
      };
    }

    let text = `🔍 Found ${products.length} matching products for "${keyword}":\n\n`;
    const chips = [];

    products.forEach((p, idx) => {
      text += `${idx + 1}. *${p.name}* (${p.bank_name})\n`;
      if (p.short_description || p.rewards) {
        text += `   • ${p.short_description || p.rewards}\n`;
      }
      text += `\n`;

      let chipAction = 'go_cards';
      if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
        chipAction = 'go_partner_products';
      } else if (role === 'EMPLOYEE') {
        chipAction = 'go_employee_cards';
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        chipAction = 'go_admin_leads';
      } else {
        chipAction = p.slug ? `go_prod_${p.slug}` : 'go_cards';
      }

      chips.push({
        label: p.name,
        action: chipAction
      });
    });

    chips.push({ label: 'Main Menu', action: 'main_menu' });

    return {
      response_template: text,
      chips: chips
    };
  }

  /**
   * Search knowledge base by keyword
   * @param {string} keyword - Search keyword
   * @returns {Array} - Matching knowledge base entries
   */
  async searchKnowledgeBase(keyword) {
    try {
      const keywordLower = keyword.toLowerCase();
      
      // Search in training phrases and descriptions
      const { rows } = await query(
        `SELECT intent_name, description, response_template, chips
         FROM chatbot_intents
         WHERE is_active = true
         AND (
           intent_name ILIKE $1
           OR description ILIKE $1
           OR $1 = ANY(training_phrases)
         )
         ORDER BY priority DESC
         LIMIT 10`,
        [`%${keywordLower}%`]
      );

      return rows.map(row => ({
        intent_name: row.intent_name,
        description: row.description,
        response: row.response_template,
        chips: row.chips
      }));
    } catch (error) {
      logger.error('Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * Get FAQ for specific category
   * @param {string} category - FAQ category
   * @returns {Array} - FAQ items
   */
  async getFAQ(category) {
    try {
      // Map categories to intent groups
      const categoryMap = {
        'cards': ['credit_card_inquiry', 'cards_ltf', 'cards_cashback', 'cards_travel', 'cards_rewards'],
        'loans': ['loan_inquiry', 'loans_personal', 'loans_business', 'loans_home'],
        'partner': ['partner_inquiry', 'partner_join', 'partner_rates', 'partner_payouts', 'partner_referral'],
        'kyc': ['kyc_inquiry'],
        'support': ['support_inquiry'],
        'wallet': ['wallet_inquiry'],
        'employee': ['employee_inquiry']
      };

      const intentNames = categoryMap[category] || [];
      
      if (intentNames.length === 0) {
        return [];
      }

      const { rows } = await query(
        `SELECT intent_name, description, response_template, chips
         FROM chatbot_intents
         WHERE intent_name = ANY($1)
         AND is_active = true
         ORDER BY priority DESC`,
        [intentNames]
      );

      return rows;
    } catch (error) {
      logger.error('Error getting FAQ:', error);
      return [];
    }
  }
}

module.exports = new KnowledgeBaseService();
