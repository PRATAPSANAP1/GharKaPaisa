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
const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const logAction = async (userIdOrReq, action, targetId = null, details = null, role = null, ipAddress = null, dbClient = null) => {
  let userId = userIdOrReq;
  let finalRole = role;
  let finalIp = ipAddress;

  if (userIdOrReq && typeof userIdOrReq === 'object') {
    if (userIdOrReq.user) {
      // It's an Express req object
      const req = userIdOrReq;
      userId = req.user?.id;
      finalRole = req.user?.role || role;
      finalIp = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress;
    } else {
      // It's a reqUser object directly
      userId = userIdOrReq.id || userIdOrReq.userId || userIdOrReq.user_id;
      finalRole = userIdOrReq.role || role;
    }
    
    // Normalize IP format (e.g. ::ffff:127.0.0.1 to 127.0.0.1)
    if (finalIp && typeof finalIp === 'string' && finalIp.includes('::ffff:')) {
      finalIp = finalIp.split('::ffff:')[1];
    }
  }

  // Ensure userId and targetId are valid UUIDs or null to prevent database type mismatch crashes
  const finalUserId = isValidUuid(userId) ? userId : null;
  const finalTargetId = isValidUuid(targetId) ? targetId : null;

  try {
    const queryFn = (dbClient && typeof dbClient.query === 'function')
      ? (text, params) => dbClient.query(text, params)
      : query;

    await queryFn(
      `INSERT INTO audit_logs (user_id, action, target_id, details, role, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [finalUserId, action, finalTargetId, details ? JSON.stringify(details) : null, finalRole, finalIp]
    );
  } catch (err) {
    logger.error(`Failed to write to audit logs: ${err.message}`, { userId: finalUserId, action, targetId: finalTargetId });
  }
};

module.exports = { logAction };
