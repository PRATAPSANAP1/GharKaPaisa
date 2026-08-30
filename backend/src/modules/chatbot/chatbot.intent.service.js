const { INTENTS } = require('./chatbot.constants');
const searchService = require('./chatbot.search.service');

class ChatbotIntentService {
  /**
   * Parse user message text into intent & extracted entities
   * @param {string} text - User message
   * @returns {Object} { intent, entities: { bank, product_name, category, status } }
   */
  async detectIntentAndEntities(text) {
    const rawText = text.trim();
    const t = rawText.toLowerCase();

    const result = {
      intent: INTENTS.UNKNOWN,
      entities: {
        bank: null,
        productName: null,
        category: null,
        statusFilter: null,
        rawTerm: rawText
      }
    };

    // 1. Check Greetings
    if (/^(hi|hello|hey|namaste|good morning|good afternoon|good evening|hallo)/i.test(t)) {
      result.intent = INTENTS.GREETING;
      return result;
    }

    // 2. Check Lead Process
    if (t.includes('lead process') || t.includes('how to create lead') || t.includes('add lead') || t.includes('punch lead')) {
      result.intent = INTENTS.LEAD_PROCESS;
      return result;
    }

    // 3. Check Support
    if (t.includes('support') || t.includes('contact') || t.includes('help') || t.includes('customer care')) {
      result.intent = INTENTS.SUPPORT;
      return result;
    }

    // 4. Check Application Search & Status
    if (t.includes('application') || t.includes('my app') || t.includes('track app') || t.includes('app status')) {
      result.intent = INTENTS.APPLICATION_SEARCH;
      if (t.includes('pending')) result.entities.statusFilter = 'pending';
      else if (t.includes('approved')) result.entities.statusFilter = 'approved';
      else if (t.includes('rejected')) result.entities.statusFilter = 'rejected';
      return result;
    }

    // 5. Check Team / Network
    if (t.includes('my team') || t.includes('referral network') || t.includes('downline') || t.includes('team performance')) {
      result.intent = INTENTS.MY_TEAM;
      return result;
    }

    // 6. Check Incentives / Wallet
    if (t.includes('incentive') || t.includes('my incentive') || t.includes('earnings') || t.includes('payout') || t.includes('wallet')) {
      result.intent = t.includes('incentive') ? INTENTS.INCENTIVE_SEARCH : INTENTS.WALLET_INQUIRY;
      return result;
    }

    // 7. Check Onboarding / KYC Status
    if (t.includes('kyc') || t.includes('pan verification') || t.includes('aadhaar verification')) {
      result.intent = INTENTS.KYC_STATUS;
      return result;
    }
    if (t.includes('onboarding') || t.includes('joining status')) {
      result.intent = INTENTS.ONBOARDING_STATUS;
      return result;
    }

    // 8. Extract Category if present
    if (t.includes('card') || t.includes('credit card')) {
      result.entities.category = 'credit_card';
    } else if (t.includes('loan') || t.includes('personal loan') || t.includes('business loan')) {
      result.entities.category = 'loan';
    } else if (t.includes('insurance')) {
      result.entities.category = 'insurance';
    }

    // 9. Bank Detection from Database
    const words = t.split(/\s+/);
    for (const word of words) {
      if (word.length >= 2) {
        const foundBank = await searchService.searchBank(word);
        if (foundBank) {
          result.entities.bank = foundBank;
          break;
        }
      }
    }

    // 10. Determine Bank vs Product Search Intent
    if (result.entities.bank) {
      if (t.includes('all') || t.includes('give me all') || t.includes('list') || t.includes('cards') || t.includes('loans')) {
        result.intent = INTENTS.BANK_PRODUCTS;
      } else {
        result.intent = INTENTS.PRODUCT_SEARCH;
      }
      return result;
    }

    // 11. Check Exact or Partial Product Search
    const exactProd = await searchService.searchExactProduct(rawText);
    if (exactProd) {
      result.intent = INTENTS.EXACT_PRODUCT;
      result.entities.productName = exactProd.name;
      result.entities.matchedProduct = exactProd;
      return result;
    }

    // 12. Category Search Fallback
    if (result.entities.category) {
      result.intent = INTENTS.CATEGORY_SEARCH;
      return result;
    }

    return result;
  }
}

module.exports = new ChatbotIntentService();
