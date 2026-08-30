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

        // Main Menu
        main_menu: {
          text: "Here is the main menu. What would you like to explore today?",
          chips: [
            { label: 'Find Credit Card', action: 'cards_start' },
            { label: 'Apply for Loan', action: 'loans_start' },
            { label: 'Partner Earnings', action: 'partner_start' },
            { label: 'Contact Support', action: 'support_start' }
          ]
        },

        // Navigation Actions (these should trigger redirects)
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
        go_cibil: { text: 'Redirecting to CIBIL check...', chips: [], redirect: 'https://cibil.com' }
      };

      return actionResponses[action] || this.getDefaultResponse();
    } catch (error) {
      logger.error('Error getting action response:', error);
      return this.getDefaultResponse();
    }
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
