const logger = require('../../config/logger');

/**
 * Row-Level Security Middleware
 * Ensures users can only access resources they own or are authorized to access
 */

/**
 * Partner ownership check - ensures user can only access their own partner data
 * @param {string} idParam - The parameter name containing the partner ID (default: 'partnerId')
 */
const requirePartnerOwnership = (idParam = 'partnerId') => {
  return (req, res, next) => {
    try {
      const user = req.user;
      const targetPartnerId = req.params[idParam] || req.body[idParam] || req.query[idParam];

      // Super admins can access any partner data
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        return next();
      }

      // Partners can only access their own data
      if (user?.role === 'PARTNER' || user?.partner_id) {
        const userPartnerId = user.partner_id || user.id;
        if (targetPartnerId && targetPartnerId !== userPartnerId) {
          logger.warn(`[RowLevelSecurity] Partner ownership check failed. User: ${userPartnerId}, Target: ${targetPartnerId}`);
          return res.status(403).json({ success: false, message: 'Access denied. You can only access your own data.' });
        }
      }

      next();
    } catch (err) {
      logger.error('[RowLevelSecurity] Partner ownership check error:', err);
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

/**
 * Employee ownership check - ensures user can only access their own employee data
 * @param {string} idParam - The parameter name containing the employee ID (default: 'employeeId')
 */
const requireEmployeeOwnership = (idParam = 'employeeId') => {
  return (req, res, next) => {
    try {
      const user = req.user;
      const targetEmployeeId = req.params[idParam] || req.body[idParam] || req.query[idParam];

      // Super admins and admins can access any employee data
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR') {
        return next();
      }

      // Employees can only access their own data
      if (user?.role === 'EMPLOYEE' || user?.employee_id) {
        const userEmployeeId = user.employee_id || user.id;
        if (targetEmployeeId && targetEmployeeId !== userEmployeeId) {
          logger.warn(`[RowLevelSecurity] Employee ownership check failed. User: ${userEmployeeId}, Target: ${targetEmployeeId}`);
          return res.status(403).json({ success: false, message: 'Access denied. You can only access your own data.' });
        }
      }

      next();
    } catch (err) {
      logger.error('[RowLevelSecurity] Employee ownership check error:', err);
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

/**
 * Application ownership check - ensures users can only access applications they're authorized to see
 * Partners can only see their own applications
 * Employees can only see applications assigned to them or in their scope
 */
const requireApplicationAccess = () => {
  return (req, res, next) => {
    try {
      const user = req.user;
      const applicationId = req.params.id || req.params.applicationId;

      // Super admins and admins can access any application
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        return next();
      }

      // Partners can only access their own applications
      if (user?.role === 'PARTNER' && applicationId) {
        // This check will be enforced at the query level with WHERE partner_id = $1
        req.partnerOnly = true;
      }

      // Employees can access applications in their scope
      if (user?.role === 'EMPLOYEE') {
        // This check will be enforced at the query level with appropriate filters
        req.employeeScope = true;
      }

      next();
    } catch (err) {
      logger.error('[RowLevelSecurity] Application access check error:', err);
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

/**
 * Lead ownership check - ensures partners can only access their own leads
 */
const requireLeadOwnership = () => {
  return (req, res, next) => {
    try {
      const user = req.user;

      // Super admins and admins can access any lead
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        return next();
      }

      // Partners can only access their own leads
      if (user?.role === 'PARTNER') {
        req.partnerOnly = true;
      }

      next();
    } catch (err) {
      logger.error('[RowLevelSecurity] Lead ownership check error:', err);
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};

/**
 * Admin action logger - logs all admin/moderator actions for audit trail
 */
const logAdminAction = (actionType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const user = req.user;

    res.send = function (data) {
      // Only log successful admin actions
      if (res.statusCode < 400 && user?.role && ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(user.role)) {
        logger.info(`[ADMIN_ACTION] ${actionType}`, {
          action: actionType,
          userId: user.id,
          userRole: user.role,
          method: req.method,
          path: req.path,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  requirePartnerOwnership,
  requireEmployeeOwnership,
  requireApplicationAccess,
  requireLeadOwnership,
  logAdminAction
};
