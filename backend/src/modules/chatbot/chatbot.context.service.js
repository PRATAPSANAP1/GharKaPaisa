const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { USER_ROLES } = require('./chatbot.constants');

class ChatbotContextService {
  /**
   * Extract & resolve user context from request and database
   * @param {Object} req - Express request
   * @returns {Object} Context object
   */
  async buildContext(req) {
    const user = req?.user || null;
    const role = (user?.role || req?.body?.user_role || req?.headers?.['x-user-role'] || USER_ROLES.PUBLIC).toUpperCase();
    const panel = (req?.body?.panel || req?.headers?.['x-user-panel'] || role.toLowerCase());

    const context = {
      userId: user?.id || null,
      email: user?.email || null,
      mobile: user?.mobile || null,
      fullName: user?.full_name || 'User',
      role: role,
      panel: panel,
      partnerId: null,
      employeeId: null,
      designation: null,
      department: null,
      hierarchyLevel: null,
      isManagerOrTL: false,
      isAuthenticated: !!user
    };

    if (!user) {
      return context;
    }

    try {
      // Resolve Partner Context
      if (role === USER_ROLES.PARTNER || role === USER_ROLES.TEAM_MEMBER) {
        const { rows } = await query(
          `SELECT id, partner_code, kyc_status FROM partner_profiles WHERE user_id = $1 LIMIT 1`,
          [user.id]
        );
        if (rows.length > 0) {
          context.partnerId = rows[0].id;
          context.partnerCode = rows[0].partner_code;
          context.kycStatus = rows[0].kyc_status;
        }
      }

      // Resolve Employee Context
      if (role === USER_ROLES.EMPLOYEE) {
        const { rows } = await query(
          `SELECT e.id, e.employee_id, e.designation, e.department, h.hierarchy_level
           FROM employees e
           LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
           WHERE e.user_id = $1 LIMIT 1`,
          [user.id]
        );
        if (rows.length > 0) {
          context.employeeId = rows[0].id;
          context.employeeCode = rows[0].employee_id;
          context.designation = rows[0].designation;
          context.department = rows[0].department;
          context.hierarchyLevel = rows[0].hierarchy_level || (
            rows[0].designation === 'Manager' ? 'MANAGER' :
            rows[0].designation === 'Team Leader' ? 'TEAM_LEADER' : 'TC'
          );
          context.isManagerOrTL = ['Manager', 'Team Leader'].includes(rows[0].designation) || 
                                  ['MANAGER', 'TEAM_LEADER'].includes(context.hierarchyLevel);
        }
      }
    } catch (error) {
      logger.error('Error building chatbot context:', error);
    }

    return context;
  }
}

module.exports = new ChatbotContextService();
