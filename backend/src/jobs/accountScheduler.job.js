const logger = require('../config/logger');
const { processScheduledAccountTransitions } = require('../modules/super-admin/accountStatus.service');

/**
 * Account Status Transition Scheduler Job
 * 
 * Periodically checks for scheduled account activations and deactivations
 * that have reached their target execution timestamp, applies status changes
 * atomically, revokes sessions if deactivating, and logs audit events.
 */
async function processAccountStatusScheduler() {
  try {
    await processScheduledAccountTransitions();
  } catch (err) {
    logger.error('[Account Scheduler] Job execution failure:', err);
  }
}

module.exports = {
  processAccountStatusScheduler
};
