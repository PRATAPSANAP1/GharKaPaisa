const { USER_ROLES } = require('./chatbot.constants');

class ChatbotPermissionService {
  /**
   * Check if user context can view products
   */
  canViewProducts(context) {
    return true; // All roles including PUBLIC can view product catalog
  }

  /**
   * Check if user context can view applications
   */
  canViewApplications(context) {
    if (!context.isAuthenticated) return false; // Public visitors CANNOT view applications
    return [
      USER_ROLES.PARTNER,
      USER_ROLES.TEAM_MEMBER,
      USER_ROLES.EMPLOYEE,
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN
    ].includes(context.role);
  }

  /**
   * Check if user context can view customer sensitive PII (PAN/Aadhaar)
   * The chatbot must NEVER leak customer PAN or Aadhaar to partners or employees!
   */
  canViewCustomerPII(context) {
    // Only Admin/SuperAdmin with explicit audit logging can view full PII
    return [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(context.role);
  }

  /**
   * Check if user context can view team metrics
   */
  canViewTeam(context) {
    if (!context.isAuthenticated) return false;
    if (context.role === USER_ROLES.PARTNER || context.role === USER_ROLES.TEAM_MEMBER) return true;
    if (context.role === USER_ROLES.EMPLOYEE) {
      return context.isManagerOrTL; // TC cannot view team performance, only Manager/TL
    }
    return [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(context.role);
  }

  /**
   * Check if user context can view incentives (Employees use Incentive, Partners use Commission)
   */
  canViewIncentives(context) {
    if (!context.isAuthenticated) return false;
    return [USER_ROLES.EMPLOYEE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(context.role);
  }

  /**
   * Check if user context can view partner earnings/commission
   */
  canViewPartnerEarnings(context) {
    if (!context.isAuthenticated) return false;
    return [USER_ROLES.PARTNER, USER_ROLES.TEAM_MEMBER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(context.role);
  }

  /**
   * Check if user context can view internal employee data / candidates
   */
  canViewEmployees(context) {
    if (!context.isAuthenticated) return false;
    return [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(context.role);
  }

  /**
   * Sanitize application records according to user role permissions
   */
  sanitizeApplication(app, context) {
    if (!app) return null;
    const sanitized = { ...app };

    // Strip sensitive customer PII if not admin
    if (!this.canViewCustomerPII(context)) {
      delete sanitized.customer_pan;
      delete sanitized.pan_number;
      delete sanitized.aadhaar_number;
      delete sanitized.aadhaar_last4;
      if (sanitized.customer_mobile) {
        sanitized.customer_mobile = sanitized.customer_mobile.replace(/^(\d{2})\d{4}(\d{4})$/, '$1****$2');
      }
    }

    // Role specific labeling: Employee sees "incentive_amount", Partner sees "commission_amount"
    if (context.role === USER_ROLES.EMPLOYEE) {
      sanitized.display_amount_type = 'INCENTIVE';
      sanitized.display_amount = sanitized.incentive_amount || sanitized.commission_amount || 0;
      delete sanitized.commission_amount;
    } else if (context.role === USER_ROLES.PARTNER || context.role === USER_ROLES.TEAM_MEMBER) {
      sanitized.display_amount_type = 'COMMISSION';
      sanitized.display_amount = sanitized.commission_amount || 0;
    }

    return sanitized;
  }
}

module.exports = new ChatbotPermissionService();
