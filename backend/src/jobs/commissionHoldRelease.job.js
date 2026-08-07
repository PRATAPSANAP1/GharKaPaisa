const { query } = require('../config/database');
const { releaseHold } = require('../modules/wallet/service');
const logger = require('../config/logger');

/**
 * Job to automatically release matured commission holds.
 * Rules:
 * - Credit Cards & Insurance: Released after 7 days hold.
 * - Loans: Released after 30 days hold (or immediate upon disbursal approval).
 */
const processCommissionHoldReleases = async () => {
  logger.info('Running Commission Hold Release Job...');
  try {
    // Find all wallet_ledger entries pending approval older than 7 days
    const { rows: pendingHolds } = await query(`
      SELECT l.id, l.partner_id, l.application_id, l.credit, l.transaction_type, l.created_at,
             p.category::text as product_category
      FROM wallet_ledger l
      LEFT JOIN applications a ON a.id = l.application_id
      LEFT JOIN products p ON p.id = a.product_id
      WHERE l.status = 'Pending Approval'
        AND l.credit > 0
        AND (
          (COALESCE(p.category::text, 'credit_card') IN ('credit_card', 'insurance', 'health_insurance', 'life_insurance', 'general_insurance') AND l.created_at <= NOW() - INTERVAL '7 days')
          OR (COALESCE(p.category::text, 'credit_card') NOT IN ('credit_card', 'insurance', 'health_insurance', 'life_insurance', 'general_insurance') AND l.created_at <= NOW() - INTERVAL '30 days')
        )
    `);

    logger.info(`Found ${pendingHolds.length} matured commission hold entries to release.`);

    let successCount = 0;
    let failCount = 0;

    for (const hold of pendingHolds) {
      try {
        await releaseHold(hold.partner_id, hold.credit, {
          txn_id: hold.id,
          application_id: hold.application_id,
          reference_type: 'automated_hold_release',
          description: `Automated 7-day hold release for ${hold.product_category || 'commission'}`
        });
        successCount++;
      } catch (err) {
        failCount++;
        logger.error(`Failed to release hold ID ${hold.id} for partner ${hold.partner_id}:`, err.message);
      }
    }

    logger.info(`Commission Hold Release Job Completed: ${successCount} released, ${failCount} failed.`);
    return { total: pendingHolds.length, success: successCount, failed: failCount };
  } catch (err) {
    logger.error('Error executing Commission Hold Release Job:', err.message);
    throw err;
  }
};

module.exports = {
  processCommissionHoldReleases
};
