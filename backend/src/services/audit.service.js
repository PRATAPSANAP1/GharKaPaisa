const { query } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Log an administrative action to the audit_logs table
 * @param {string} userId - UUID of the user performing the action
 * @param {string} action - Action description (e.g. 'CREATE_ADMIN', 'BLOCK_USER', 'APPROVE_KYC')
 * @param {string} [targetId] - UUID of the target resource/user if applicable
 * @param {object} [details] - Additional JSON metadata details
 */
const logAction = async (userId, action, targetId = null, details = null) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, target_id, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    logger.error(`Failed to write to audit logs: ${err.message}`, { userId, action, targetId });
  }
};

module.exports = { logAction };
