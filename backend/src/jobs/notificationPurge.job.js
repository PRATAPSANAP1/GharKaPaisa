const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * 2-Hour Read Notification Purge Job
 * Rule: Any notification across all panels (Super Admin, Admin, Partner, Employee, Customer)
 * that has been read (is_read = true) for more than 2 hours MUST be automatically
 * removed from the database.
 */
const purgeExpiredReadNotifications = async () => {
  try {
    const { rowCount } = await query(`
      DELETE FROM notifications
      WHERE is_read = true 
        AND (
          read_at < NOW() - INTERVAL '2 hours'
          OR (read_at IS NULL AND created_at < NOW() - INTERVAL '2 hours')
        )
    `);

    if (rowCount > 0) {
      logger.info(`[Notification Purge] Successfully deleted ${rowCount} read notifications older than 2 hours from database.`);
    }

    // Also clean up any read team/broadcast notification recipient logs older than 2 hours if table exists
    try {
      await query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'announcement_reads') THEN
            DELETE FROM announcement_reads WHERE read_at < NOW() - INTERVAL '2 hours';
          END IF;
          IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'team_notification_reads') THEN
            DELETE FROM team_notification_reads WHERE read_at < NOW() - INTERVAL '2 hours';
          END IF;
        END $$;
      `);
    } catch (e) {}

    return { success: true, deletedCount: rowCount || 0 };
  } catch (err) {
    logger.error('[Notification Purge] Error executing 2-hour read notification purge job:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  purgeExpiredReadNotifications
};
