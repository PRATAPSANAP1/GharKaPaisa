const { RESPONSE_TYPES, USER_ROLES } = require('./chatbot.constants');

class ChatbotResponseService {
  /**
   * Build contextual quick links array tailored to user's panel & role
   */
  getQuickLinks(context) {
    const role = (context.role || USER_ROLES.PUBLIC).toUpperCase();

    if (role === USER_ROLES.PARTNER || role === USER_ROLES.TEAM_MEMBER) {
      return [
        { label: 'Select Product', action: 'go_partner_products' },
        { label: 'Add Lead', action: 'go_partner_add_lead' },
        { label: 'My Applications', action: 'go_partner_applications' },
        { label: 'Lead Process', action: 'lead_process' }
      ];
    }

    if (role === USER_ROLES.EMPLOYEE) {
      const links = [
        { label: 'Punch Credit Card', action: 'go_employee_cards' },
        { label: 'My Applications', action: 'go_employee_applications' },
        { label: 'My Incentives', action: 'go_employee_incentives' },
        { label: 'Lead Process', action: 'lead_process' }
      ];
      return links;
    }

    if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
      return [
        { label: 'Manage Applications', action: 'go_admin_applications' },
        { label: 'Manage Leads', action: 'go_admin_leads' },
        { label: 'Manage Products', action: 'go_admin_products' },
        { label: 'Lead Process', action: 'lead_process' }
      ];
    }

    // Public Visitor Default
    return [
      { label: 'Find Credit Card', action: 'cards_start' },
      { label: 'Apply for Loan', action: 'loans_start' },
      { label: 'Partner Earnings', action: 'partner_start' },
      { label: 'Contact Support', action: 'support_start' }
    ];
  }

  /**
   * Format generic text response
   */
  buildTextResponse(message, context, chips = null) {
    return {
      success: true,
      type: RESPONSE_TYPES.TEXT,
      message,
      data: null,
      chips: chips || this.getQuickLinks(context)
    };
  }

  /**
   * Format "No result" message intelligently based on search query
   */
  buildNoResultResponse(searchQuery, context) {
    const queryLower = searchQuery.toLowerCase();

    if (queryLower.includes('card') || queryLower.includes('loan')) {
      return {
        success: true,
        type: RESPONSE_TYPES.TEXT,
        message: `I couldn't find an exact product matching "${searchQuery}".\n\nTry searching for:\n• HDFC credit cards\n• SBI credit cards\n• Personal loans\n• Insurance`,
        chips: this.getQuickLinks(context)
      };
    }

    return {
      success: true,
      type: RESPONSE_TYPES.TEXT,
      message: `I couldn't find an exact match for "${searchQuery}".\n\nTry asking:\n"Show HDFC cards"\n"Show SBI loans"\n"Find Cashback Credit Card"\n"Lead process"`,
      chips: this.getQuickLinks(context)
    };
  }
}

module.exports = new ChatbotResponseService();
