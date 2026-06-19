/**
 * role.middleware.js — RBAC Role Check
 * ─────────────────────────────────────────────────────────────────────────
 * Usage: roleCheck("admin", "super_admin")
 *
 * RULES:
 *  ✔ Never trust frontend role
 *  ✔ Always read role from DB (attached by jwtAuth middleware)
 *  ✔ Always verify JWT token first (use jwtAuth before roleCheck)
 *  ✔ PostgreSQL is the source of truth for roles
 *
 * Example:
 *  router.get('/admin/dashboard', jwtAuth, roleCheck('admin'), ctrl.dashboard);
 */

const roleCheck = (...allowedRoles) => {
  const allowedUpper = allowedRoles.map(role => String(role).toUpperCase());
  return (req, res, next) => {
    // jwtAuth / authenticate must run before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = String(req.user.role || '').toUpperCase();

    if (!allowedUpper.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${req.user.role}. Required: ${allowedUpper.join(' | ')}`
      });
    }

    next();
  };
};

module.exports = roleCheck;
