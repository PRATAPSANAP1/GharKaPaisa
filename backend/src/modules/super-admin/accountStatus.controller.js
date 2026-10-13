const { success, error, notFound } = require('../../utils/response/response');
const accountStatusService = require('./accountStatus.service');
const logger = require('../../config/logger');

/**
 * GET /api/v1/superadmin/accounts
 * List accounts with status badges, filters, search, and working hours metadata
 */
const listAccounts = async (req, res, next) => {
  try {
    const { role, status, search, page, limit } = req.query;
    const result = await accountStatusService.listAccounts({
      role,
      status,
      search,
      page,
      limit
    });
    return success(res, result);
  } catch (err) {
    logger.error('Error listing accounts:', err);
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/accounts/:id/activate
 * or POST /api/v1/superadmin/accounts/activate
 */
const activateAccount = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.body.userId || req.body.id;
    if (!targetUserId) {
      return error(res, 'Target user ID is required.', 400);
    }

    const { isScheduled, scheduledAt, reason } = req.body;
    const actorAdminId = req.user.id;

    const result = await accountStatusService.activateAccount(
      targetUserId,
      actorAdminId,
      { isScheduled: Boolean(isScheduled), scheduledAt, reason },
      req
    );

    return success(res, result, result.message);
  } catch (err) {
    logger.error('Error activating account:', err);
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/accounts/:id/deactivate
 * or POST /api/v1/superadmin/accounts/deactivate
 */
const deactivateAccount = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.body.userId || req.body.id;
    if (!targetUserId) {
      return error(res, 'Target user ID is required.', 400);
    }

    const { isScheduled, scheduledAt, reason } = req.body;
    const actorAdminId = req.user.id;

    const result = await accountStatusService.deactivateAccount(
      targetUserId,
      actorAdminId,
      { isScheduled: Boolean(isScheduled), scheduledAt, reason },
      req
    );

    return success(res, result, result.message);
  } catch (err) {
    logger.error('Error deactivating account:', err);
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/accounts/:id/schedule
 */
const scheduleAccountStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.body.userId || req.body.id;
    const { action, scheduledAt, reason } = req.body;

    if (!targetUserId) return error(res, 'Target user ID is required.', 400);
    if (!scheduledAt) return error(res, 'Scheduled timestamp is required.', 400);

    const normAction = String(action || 'ACTIVATE').trim().toUpperCase();
    const actorAdminId = req.user.id;

    let result;
    if (normAction === 'DEACTIVATE') {
      result = await accountStatusService.deactivateAccount(
        targetUserId,
        actorAdminId,
        { isScheduled: true, scheduledAt, reason },
        req
      );
    } else {
      result = await accountStatusService.activateAccount(
        targetUserId,
        actorAdminId,
        { isScheduled: true, scheduledAt, reason },
        req
      );
    }

    return success(res, result, result.message);
  } catch (err) {
    logger.error('Error scheduling account status change:', err);
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/accounts/:id/cancel-schedule
 */
const cancelScheduledStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.body.userId || req.body.id;
    if (!targetUserId) return error(res, 'Target user ID is required.', 400);

    const actorAdminId = req.user.id;
    const result = await accountStatusService.cancelScheduledStatus(targetUserId, actorAdminId, req);

    return success(res, result, result.message);
  } catch (err) {
    logger.error('Error cancelling scheduled status:', err);
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * GET /api/v1/superadmin/accounts/:id/audit-history
 */
const getAccountAuditHistory = async (req, res, next) => {
  try {
    const targetUserId = req.params.id || req.query.userId;
    if (!targetUserId) return error(res, 'Target user ID is required.', 400);

    const logs = await accountStatusService.getAccountAuditHistory(targetUserId);
    return success(res, logs);
  } catch (err) {
    logger.error('Error fetching account audit history:', err);
    next(err);
  }
};

module.exports = {
  listAccounts,
  activateAccount,
  deactivateAccount,
  scheduleAccountStatus,
  cancelScheduledStatus,
  getAccountAuditHistory
};
