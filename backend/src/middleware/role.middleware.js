/**
 * role.middleware.js — RBAC Role Check (Step 4)
 * ─────────────────────────────────────────────────────────────────────────
 * Usage: roleCheck("admin", "super_admin")
 *
 * RULES (Step 8):
 *  ✔ Never trust frontend role
 *  ✔ Always read role from DB (attached by firebaseAuth middleware)
 *  ✔ Always verify Firebase token first (use firebaseAuth before roleCheck)
 *  ✔ PostgreSQL is the source of truth for roles
 *
 * Example:
 *  router.get('/admin/dashboard', firebaseAuth, roleCheck('admin'), ctrl.dashboard);
 */

const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    // firebaseAuth / authenticate must run before this middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${userRole}. Required: ${allowedRoles.join(' | ')}`
      });
    }

    next();
  };
};

module.exports = roleCheck;
