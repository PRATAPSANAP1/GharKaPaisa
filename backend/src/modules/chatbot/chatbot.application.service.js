const searchService = require('./chatbot.search.service');
const permissionService = require('./chatbot.permission.service');

class ChatbotApplicationService {
  /**
   * Handle application queries with strict role-based permission checks & scoping
   */
  async handleApplicationSearch(statusFilter, context) {
    if (!permissionService.canViewApplications(context)) {
      return {
        type: 'TEXT',
        message: "Application tracking is available for authorized Partners and Employees. Please log in to view your applications.",
        data: null
      };
    }

    const apps = await searchService.searchApplications(context, statusFilter);

    if (apps.length === 0) {
      const statusText = statusFilter ? ` ${statusFilter}` : '';
      return {
        type: 'TEXT',
        message: `No${statusText} applications found matching your account scope.`,
        data: { applications: [] }
      };
    }

    const sanitizedApps = apps.map(app => permissionService.sanitizeApplication(app, context));

    return {
      type: 'APPLICATION_LIST',
      message: `Found ${sanitizedApps.length} application(s) in your dashboard:`,
      data: {
        applications: sanitizedApps.map(a => ({
          id: a.id,
          appNumber: a.app_number,
          status: a.status,
          productName: a.product_name,
          bankName: a.bank_name || 'GharKaPaisa',
          customerName: a.customer_name,
          customerMobile: a.customer_mobile,
          createdAt: a.created_at,
          amountType: a.display_amount_type,
          amount: a.display_amount
        }))
      }
    };
  }
}

module.exports = new ChatbotApplicationService();
