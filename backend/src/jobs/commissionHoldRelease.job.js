const { query } = require('../config/database');
const { releaseHold } = require('../modules/wallet/service');
const logger = require('../config/logger');

/**
 * Automated Cron/Interval Job to release commissions held beyond the product's
 * configured commission_release_days (default 7 days).
 * Runs every 6 hours and once on server startup.
 */
const processCommissionHoldReleases = async () => {
  try {
    // Find all applications where:
    // 1. commission_status is 'approved' (which means commission was credited to hold_balance)
    // 2. approved_at + commission_release_days <= NOW()
    const { rows: eligibleApps } = await query(`
      SELECT 
        a.id AS application_id,
        a.app_number,
        a.partner_id,
        a.commission_amount,
        a.approved_at,
        COALESCE(p.commission_release_days, 7) AS release_days
      FROM applications a
      JOIN products p ON p.id = a.product_id
      WHERE a.commission_status = 'approved'
        AND a.partner_id IS NOT NULL
        AND a.commission_amount > 0
        AND COALESCE(a.approved_at, a.updated_at, a.created_at) <= NOW() - (COALESCE(p.commission_release_days, 7) * INTERVAL '1 day')
    `);

    if (!eligibleApps || eligibleApps.length === 0) {
      return { releasedCount: 0 };
    }

    logger.info(`[CommissionHoldReleaseJob] Found ${eligibleApps.length} applications eligible for commission hold release.`);

    let releasedCount = 0;
    for (const app of eligibleApps) {
      try {
        await releaseHold(
          app.partner_id,
          app.application_id,
          null // System automated release
        );
        releasedCount++;
        logger.info(`[CommissionHoldReleaseJob] Released hold for Application ${app.app_number || app.application_id} (Partner: ${app.partner_id}, Amount: ₹${app.commission_amount})`);
      } catch (releaseErr) {
        logger.warn(`[CommissionHoldReleaseJob] Skipped/Failed hold release for Application ${app.app_number || app.application_id}: ${releaseErr.message}`);
      }
    }

    return { releasedCount };
  } catch (err) {
    logger.error('[CommissionHoldReleaseJob] Error executing commission hold release job:', err.message);
    return { releasedCount: 0, error: err.message };
  }
};

module.exports = { processCommissionHoldReleases };
