const { query } = require('../../config/database');

/**
 * bankAccess.middleware.js — Enforces Operational Head Bank Authorization
 * ─────────────────────────────────────────────────────────────────────────
 * Rules:
 *  1. SUPER_ADMIN -> Full global access (bypasses restriction)
 *  2. ADMIN / OPERATIONAL_HEAD -> Reads admin_bank_assignments from DB
 *  3. Verifies if requested bank_id is within the assigned bank IDs.
 *  4. Returns 403 Forbidden if unauthorized.
 */

const getAdminAssignedBankIds = async (adminId) => {
  const { rows } = await query(
    `SELECT bank_id FROM admin_bank_assignments WHERE admin_id = $1`,
    [adminId]
  );
  return rows.map(r => r.bank_id);
};

const checkBankAccess = (source = 'auto') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const userRole = String(req.user.role || '').toUpperCase();

      // SUPER_ADMIN has global access
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Determine requested bank_id
      let bankId = null;
      if (source === 'params') bankId = req.params.bankId || req.params.bank_id;
      else if (source === 'body') bankId = req.body.bank_id || req.body.bankId;
      else if (source === 'query') bankId = req.query.bank_id || req.query.bankId;
      else {
        bankId = req.params.bankId || req.params.bank_id || req.body.bank_id || req.body.bankId || req.query.bank_id || req.query.bankId;
      }

      // Fetch user's assigned banks from DB
      const assignedBankIds = await getAdminAssignedBankIds(req.user.id);
      req.user.assigned_bank_ids = assignedBankIds;

      // If user has bank assignments (is an Operational Head) and a specific bankId was requested:
      if (bankId && assignedBankIds.length > 0) {
        if (!assignedBankIds.includes(bankId)) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this bank.'
          });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  checkBankAccess,
  getAdminAssignedBankIds
};
