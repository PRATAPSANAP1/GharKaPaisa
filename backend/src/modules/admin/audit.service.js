const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Log an administrative action to the audit_logs table
 * @param {object|string} userIdOrReq - Request object or UUID of the user performing the action
 * @param {string} action - Action description (e.g. 'CREATE_ADMIN', 'BLOCK_USER', 'APPROVE_KYC')
 * @param {string} [targetId] - UUID of the target resource/user if applicable
 * @param {object} [details] - Additional JSON metadata details
 * @param {string} [role] - User role (if not using request object)
 * @param {string} [ipAddress] - Request IP (if not using request object)
 */
const logAction = async (userIdOrReq, action, targetId = null, details = null, role = null, ipAddress = null) => {
  let userId = userIdOrReq;
  let finalRole = role;
  let finalIp = ipAddress;

  if (userIdOrReq && typeof userIdOrReq === 'object' && userIdOrReq.user) {
    const req = userIdOrReq;
    userId = req.user.id;
    finalRole = req.user.role;
    finalIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    // Normalize IP format (e.g. ::ffff:127.0.0.1 to 127.0.0.1)
    if (finalIp && finalIp.includes('::ffff:')) {
      finalIp = finalIp.split('::ffff:')[1];
    }
  }

  // Ensure targetId is a valid UUID or null to prevent database type mismatch crashes
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
  const finalTargetId = isUuid ? targetId : null;

  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, target_id, details, role, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, finalTargetId, details ? JSON.stringify(details) : null, finalRole, finalIp]
    );
  } catch (err) {
    logger.error(`Failed to write to audit logs: ${err.message}`, { userId, action, targetId });
  }
};

module.exports = { logAction };
