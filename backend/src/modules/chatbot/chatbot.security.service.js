const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Chatbot Security Service - Implements core security algorithms
 * This service handles authentication, authorization, ownership checks, and data protection
 */
class ChatbotSecurityService {
  /**
   * Check if user is authenticated
   * @param {Object} req - Express request
   * @returns {Object} - Authentication status and user info
   */
  checkAuthentication(req) {
    const user = req.user || null;
    const isAuthenticated = !!user;

    return {
      isAuthenticated,
      userId: user?.id || null,
      userRole: user?.role || 'PUBLIC',
      userDesignation: user?.designation || null,
      userDepartment: user?.department || null
    };
  }

  /**
   * Check if user has authorization for action
   * @param {string} userRole - User role
   * @param {string} action - Action to check
   * @returns {boolean} - Authorization status
   */
  checkAuthorization(userRole, action) {
    const role = (userRole || 'PUBLIC').toUpperCase();

    // Role-based action permissions
    const permissions = {
      'PUBLIC': ['view_products', 'check_status', 'register', 'login'],
      'PARTNER': [
        'view_products', 'check_status', 'create_lead', 'view_own_leads',
        'view_own_applications', 'view_own_wallet', 'view_own_team',
        'view_own_profile', 'update_own_profile'
      ],
      'TEAM_MEMBER': [
        'view_products', 'check_status', 'create_lead', 'view_own_leads',
        'view_own_applications', 'view_own_wallet', 'view_own_team',
        'view_own_profile', 'update_own_profile'
      ],
      'EMPLOYEE': [
        'view_products', 'check_status', 'create_lead', 'view_own_leads',
        'view_own_applications', 'view_own_incentives', 'view_own_profile',
        'update_own_profile', 'view_team_hierarchy', 'complete_kyc',
        'upload_documents', 'accept_terms'
      ],
      'ADMIN': [
        'view_products', 'check_status', 'view_all_applications',
        'view_all_leads', 'verify_applications', 'manage_partners',
        'verify_kyc', 'view_analytics', 'manage_candidates'
      ],
      'SUPER_ADMIN': [
        'view_products', 'check_status', 'view_all_applications',
        'view_all_leads', 'verify_applications', 'manage_partners',
        'verify_kyc', 'view_analytics', 'manage_candidates',
        'manage_employees', 'assign_employee_links', 'approve_commissions',
        'manage_banks', 'manage_products', 'system_settings'
      ]
    };

    const rolePermissions = permissions[role] || [];
    return rolePermissions.includes(action);
  }

  /**
   * Check data ownership based on role and hierarchy
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @param {string} dataId - Data ID (application, lead, etc.)
   * @param {string} dataType - Data type ('application', 'lead', 'incentive')
   * @returns {Promise<Object>} - Ownership check result
   */
  async checkOwnership(userRole, userId, dataId, dataType) {
    try {
      const role = (userRole || 'PUBLIC').toUpperCase();

      // Admin and Super Admin can access all data
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return { hasAccess: true, reason: 'admin_access' };
      }

      // Partner can only access own data
      if (role === 'PARTNER' || role === 'TEAM_MEMBER') {
        if (dataType === 'application') {
          const { rows } = await query(
            `SELECT id FROM applications WHERE id = $1 AND partner_id = $2`,
            [dataId, userId]
          );
          return { hasAccess: rows.length > 0, reason: rows.length > 0 ? 'owner' : 'not_owner' };
        }
        if (dataType === 'lead') {
          const { rows } = await query(
            `SELECT id FROM leads WHERE id = $1 AND partner_id = $2`,
            [dataId, userId]
          );
          return { hasAccess: rows.length > 0, reason: rows.length > 0 ? 'owner' : 'not_owner' };
        }
      }

      // Employee ownership with hierarchy support
      if (role === 'EMPLOYEE') {
        if (dataType === 'application') {
          const { rows } = await query(
            `SELECT id FROM applications WHERE id = $1 AND employee_id = $2`,
            [dataId, userId]
          );
          if (rows.length > 0) {
            return { hasAccess: true, reason: 'owner' };
          }

          // Check hierarchy access for Manager/TL
          const hierarchyCheck = await this.checkHierarchyAccess(userId, dataId, 'application');
          return hierarchyCheck;
        }
        if (dataType === 'incentive') {
          const { rows } = await query(
            `SELECT id FROM employee_incentives WHERE id = $1 AND employee_id = $2`,
            [dataId, userId]
          );
          return { hasAccess: rows.length > 0, reason: rows.length > 0 ? 'owner' : 'not_owner' };
        }
      }

      return { hasAccess: false, reason: 'unknown_role' };
    } catch (error) {
      logger.error('Error checking ownership:', error);
      return { hasAccess: false, reason: 'error' };
    }
  }

  /**
   * Check hierarchy access for Manager/TL
   * @param {string} userId - User ID
   * @param {string} dataId - Data ID
   * @param {string} dataType - Data type
   * @returns {Promise<Object>} - Hierarchy access result
   */
  async checkHierarchyAccess(userId, dataId, dataType) {
    try {
      // Get user designation
      const { rows: userRows } = await query(
        `SELECT designation FROM employees WHERE id = $1`,
        [userId]
      );

      if (userRows.length === 0) {
        return { hasAccess: false, reason: 'employee_not_found' };
      }

      const desgUpper = String(userRows[0].designation || '').toUpperCase();

      // TC only sees own data (already checked above)
      if (desgUpper === 'TC') {
        return { hasAccess: false, reason: 'tc_hierarchy_restriction' };
      }

      // Manager and TL can see team data
      if (desgUpper.includes('MANAGER') || desgUpper.includes('TEAM') || desgUpper === 'TL') {
        const { rows: teamRows } = await query(
          `SELECT employee_id FROM employee_hierarchy WHERE (manager_id = $1 OR team_leader_id = $1) AND is_active = true`,
          [userId]
        );

        const teamMemberIds = teamRows.map(row => row.employee_id);

        if (teamMemberIds.length === 0) {
          return { hasAccess: false, reason: 'no_team_members' };
        }

        if (dataType === 'application') {
          const { rows } = await query(
            `SELECT id FROM applications WHERE id = $1 AND employee_id = ANY($2)`,
            [dataId, teamMemberIds]
          );
          return { hasAccess: rows.length > 0, reason: rows.length > 0 ? 'hierarchy_access' : 'not_in_team' };
        }
      }

      return { hasAccess: false, reason: 'insufficient_hierarchy' };
    } catch (error) {
      logger.error('Error checking hierarchy access:', error);
      return { hasAccess: false, reason: 'error' };
    }
  }

  /**
   * Cross-employee data protection - prevent data leakage
   * @param {string} requesterUserId - Requesting user ID
   * @param {string} targetUserId - Target user ID
   * @param {string} requesterRole - Requesting user role
   * @returns {Promise<Object>} - Access check result
   */
  async checkCrossEmployeeAccess(requesterUserId, targetUserId, requesterRole) {
    try {
      const role = (requesterRole || 'PUBLIC').toUpperCase();

      // Admin and Super Admin can access all employee data
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return { hasAccess: true, reason: 'admin_access' };
      }

      // Requesting own data
      if (requesterUserId === targetUserId) {
        return { hasAccess: true, reason: 'self_access' };
      }

      // Employee hierarchy check
      if (role === 'EMPLOYEE') {
        const { rows: requesterRows } = await query(
          `SELECT designation FROM employees WHERE id = $1`,
          [requesterUserId]
        );

        if (requesterRows.length === 0) {
          return { hasAccess: false, reason: 'requester_not_found' };
        }

        const desgUpper = String(requesterRows[0].designation || '').toUpperCase();

        // TC cannot access other employee data
        if (desgUpper === 'TC') {
          return { hasAccess: false, reason: 'tc_cross_employee_restriction' };
        }

        // Manager/TL can access team member data
        if (desgUpper.includes('MANAGER') || desgUpper.includes('TEAM') || desgUpper === 'TL') {
          const { rows } = await query(
            `SELECT employee_id FROM employee_hierarchy WHERE (manager_id = $1 OR team_leader_id = $1) AND employee_id = $2 AND is_active = true`,
            [requesterUserId, targetUserId]
          );
          return { hasAccess: rows.length > 0, reason: rows.length > 0 ? 'team_hierarchy' : 'not_in_team' };
        }
      }

      return { hasAccess: false, reason: 'cross_employee_restriction' };
    } catch (error) {
      logger.error('Error checking cross-employee access:', error);
      return { hasAccess: false, reason: 'error' };
    }
  }

  /**
   * Validate employee product link access
   * @param {string} employeeId - Employee ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Link access validation
   */
  async validateEmployeeProductLink(employeeId, productId) {
    try {
      const { rows } = await query(
        `SELECT id, employee_referral_url, status FROM employee_product_links
         WHERE employee_id = $1 AND product_id = $2`,
        [employeeId, productId]
      );

      if (rows.length === 0) {
        return { hasAccess: false, reason: 'link_not_found' };
      }

      const link = rows[0];

      if (link.status !== 'ACTIVE') {
        return { hasAccess: false, reason: 'link_inactive' };
      }

      return {
        hasAccess: true,
        reason: 'active_link',
        linkUrl: link.employee_referral_url,
        linkId: link.id
      };
    } catch (error) {
      logger.error('Error validating employee product link:', error);
      return { hasAccess: false, reason: 'error' };
    }
  }

  /**
   * Complete security check for chatbot action
   * @param {Object} req - Express request
   * @param {string} action - Action to perform
   * @param {string} dataId - Data ID (if applicable)
   * @param {string} dataType - Data type (if applicable)
   * @returns {Promise<Object>} - Complete security check result
   */
  async performSecurityCheck(req, action, dataId = null, dataType = null) {
    try {
      // 1. Check Authentication
      const authCheck = this.checkAuthentication(req);

      if (!authCheck.isAuthenticated) {
        return {
          authorized: false,
          reason: 'not_authenticated',
          action: 'login_required',
          userRole: 'PUBLIC'
        };
      }

      // 2. Check Authorization
      const authzCheck = this.checkAuthorization(authCheck.userRole, action);

      if (!authzCheck) {
        return {
          authorized: false,
          reason: 'not_authorized',
          action: 'access_denied',
          userRole: authCheck.userRole
        };
      }

      // 3. Check Ownership (if data is involved)
      if (dataId && dataType) {
        const ownershipCheck = await this.checkOwnership(
          authCheck.userRole,
          authCheck.userId,
          dataId,
          dataType
        );

        if (!ownershipCheck.hasAccess) {
          return {
            authorized: false,
            reason: 'not_owner',
            action: 'access_denied',
            userRole: authCheck.userRole,
            details: ownershipCheck
          };
        }
      }

      // All checks passed
      return {
        authorized: true,
        reason: 'authorized',
        userRole: authCheck.userRole,
        userId: authCheck.userId,
        userDesignation: authCheck.userDesignation
      };
    } catch (error) {
      logger.error('Error performing security check:', error);
      return {
        authorized: false,
        reason: 'security_error',
        action: 'error'
      };
    }
  }

  /**
   * Get safe response for unauthorized access
   * @param {string} reason - Unauthorized reason
   * @param {string} userRole - User role
   * @returns {Object} - Safe response without data leakage
   */
  getUnauthorizedResponse(reason, userRole) {
    const role = (userRole || 'PUBLIC').toUpperCase();

    // Never reveal data existence to unauthorized users
    const responses = {
      'not_authenticated': {
        message: 'Please login to access this feature.',
        chips: [
          { label: 'Login', action: 'go_login' },
          { label: 'Register', action: 'go_register' }
        ]
      },
      'not_authorized': {
        message: 'You do not have permission for this action.',
        chips: [
          { label: 'View My Applications', action: 'my_applications' },
          { label: 'Contact Support', action: 'go_contact' }
        ]
      },
      'not_owner': {
        message: 'You do not have access to this data.',
        chips: [
          { label: 'View My Applications', action: 'my_applications' },
          { label: 'Contact Support', action: 'go_contact' }
        ]
      },
      'tc_hierarchy_restriction': {
        message: 'Team access is available only to Manager/TL.',
        chips: [
          { label: 'View My Applications', action: 'my_applications' },
          { label: 'My Profile', action: 'update_profile' }
        ]
      },
      'cross_employee_restriction': {
        message: 'You do not have permission to access this information.',
        chips: [
          { label: 'View My Applications', action: 'my_applications' },
          { label: 'Contact Support', action: 'go_contact' }
        ]
      }
    };

    return responses[reason] || responses['not_authorized'];
  }
}

module.exports = new ChatbotSecurityService();
