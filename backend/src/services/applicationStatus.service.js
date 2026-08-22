const { query, getClient } = require('../config/database');
const logger = require('../config/logger');
const { APPLICATION_STATUS, VALID_TRANSITIONS, ROLE_PERMISSIONS } = require('../constants/applicationStatus');

/**
 * Validate status transition and check user permissions
 */
const validateStatusTransition = (currentStatus, newStatus, userRole) => {
  const normCurrent = (currentStatus || 'pending').toLowerCase();
  const normNew = (newStatus || '').toLowerCase();
  const normRole = (userRole || '').toUpperCase();

  if (!Object.values(APPLICATION_STATUS).includes(normNew)) {
    throw new Error(`Invalid status '${newStatus}'. Must be one of: ${Object.values(APPLICATION_STATUS).join(', ')}`);
  }

  if (normCurrent === normNew) {
    return true; // No status change
  }

  const allowedNext = VALID_TRANSITIONS[normCurrent] || [];
  if (!allowedNext.includes(normNew)) {
    throw new Error(`Invalid status transition from '${normCurrent}' to '${normNew}'. Allowed transitions from '${normCurrent}': ${allowedNext.join(', ') || 'none'}`);
  }

  const requiredRoles = ROLE_PERMISSIONS[normNew] || [];
  if (requiredRoles.length > 0 && !requiredRoles.includes(normRole)) {
    throw new Error(`Role '${normRole}' is not authorized to transition status to '${normNew}'. Required roles: ${requiredRoles.join(', ')}`);
  }

  return true;
};

/**
 * Centralized function to transition application status cleanly across the 6-stage lifecycle
 */
const transitionApplicationStatus = async (applicationId, newStatus, user, metadata = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;

  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Fetch current application record
    const { rows: [app] } = await client.query(
      `SELECT id, status, partner_id, customer_id, product_id, app_number, lead_id FROM applications WHERE id = $1 FOR UPDATE`,
      [applicationId]
    );

    if (!app) {
      throw new Error(`Application not found with id: ${applicationId}`);
    }

    const currentStatus = app.status || 'pending';
    const userRole = (user?.role || '').toUpperCase();

    // Validate transition & permissions
    validateStatusTransition(currentStatus, newStatus, userRole);

    if (currentStatus !== newStatus) {
      // Update application primary status
      await client.query(`
        UPDATE applications 
        SET status = $1,
            updated_at = NOW(),
            ${newStatus === 'approved' ? 'approved_at = COALESCE(approved_at, NOW()),' : ''}
            ${newStatus === 'commission_released' ? 'commission_released = TRUE,' : ''}
            status_history = status_history || $2::jsonb
        WHERE id = $3
      `, [
        newStatus,
        JSON.stringify([{ status: newStatus, updated_by: user?.id, updated_at: new Date().toISOString(), remarks: metadata.remarks || null }]),
        applicationId
      ]);

      // Sync corresponding lead status
      if (app.lead_id) {
        await client.query(`
          UPDATE leads 
          SET status = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [newStatus, app.lead_id]);
      }

      // Add record to application_timeline
      await client.query(`
        INSERT INTO application_timeline (application_id, status, title, description, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        applicationId,
        newStatus,
        `Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
        metadata.remarks || `Status transitioned from ${currentStatus} to ${newStatus}`,
        user?.id || null
      ]);

      logger.info(`[STATUS_TRANSITION] App ${app.app_number} (${applicationId}): ${currentStatus} -> ${newStatus} by user ${user?.id} (${userRole})`);
    }

    if (isInternalTxn) await client.query('COMMIT');
    return { success: true, previousStatus: currentStatus, newStatus };
  } catch (err) {
    if (isInternalTxn) await client.query('ROLLBACK');
    logger.error(`[STATUS_TRANSITION_FAILED] App ${applicationId}:`, err.message);
    throw err;
  } finally {
    if (isInternalTxn) client.release();
  }
};

module.exports = {
  validateStatusTransition,
  transitionApplicationStatus
};
