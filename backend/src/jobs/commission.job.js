const cron = require('node-cron');
const { query } = require('../config/database');
const { releaseHold } = require('../modules/wallet/service.js');
const logger = require('../config/logger');

// Run every hour to check for pending commissions that have passed their hold period
const processCommissionReleases = async () => {
  try {
    const { rows: pendingHolds } = await query(`
      SELECT * FROM wallet_transactions 
      WHERE type = 'credit' 
        AND status = 'pending' 
        AND release_at <= NOW()
    `);

    if (pendingHolds.length === 0) return;

    logger.info(`Found ${pendingHolds.length} pending commissions to release`);

    for (const hold of pendingHolds) {
      try {
        await releaseHold(hold.partner_id, hold.amount, {
          txn_id: hold.id,
          reference_type: hold.reference_type,
          reference_id: hold.reference_id,
          description: hold.description,
          processed_by: null // System process
        });
      } catch (err) {
        logger.error(`Failed to release hold ${hold.id}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Commission release job failed: ${err.message}`);
  }
};

// 0 * * * * = Every hour at minute 0
const initCommissionJobs = () => {
  cron.schedule('0 * * * *', processCommissionReleases);
  logger.info('Commission release CRON job scheduled (hourly).');
};

module.exports = { initCommissionJobs };
