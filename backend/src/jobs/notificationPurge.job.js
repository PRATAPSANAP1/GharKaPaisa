const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * 48-Hour Notification Purge & 2-Hour Read Purge Job
 * Rules:
 * 1. ALL notifications across all panels (Super Admin, Admin, Partner, Employee, Customer)
 *    that are older than 48 hours MUST be automatically deleted from the database.
 * 2. Notifications that have been read (is_read = true) for more than 2 hours are also cleaned up.
 */
const purgeExpiredNotifications = async () => {
  try {
    // 1. Permanently delete all notifications older than 48 hours (whether read or unread)
    const { rowCount: deleted48hCount } = await query(`
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '48 hours'
    `);

    // 2. Delete read notifications older than 2 hours
    const { rowCount: deleted2hReadCount } = await query(`
      DELETE FROM notifications
      WHERE is_read = true 
        AND (
          read_at < NOW() - INTERVAL '2 hours'
          OR (read_at IS NULL AND created_at < NOW() - INTERVAL '2 hours')
        )
    `);

    const totalDeleted = (deleted48hCount || 0) + (deleted2hReadCount || 0);
    if (totalDeleted > 0) {
      logger.info(`[Notification Purge] Deleted ${deleted48hCount || 0} notifications older than 48 hours and ${deleted2hReadCount || 0} read notifications older than 2 hours.`);
    }

    // 3. Clean up any read team/broadcast notification recipient logs older than 48 hours
    try {
      await query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'announcement_recipients') THEN
            DELETE FROM announcement_recipients WHERE created_at < NOW() - INTERVAL '48 hours';
          END IF;
          IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'announcement_reads') THEN
            DELETE FROM announcement_reads WHERE read_at < NOW() - INTERVAL '48 hours';
          END IF;
          IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'team_notification_reads') THEN
            DELETE FROM team_notification_reads WHERE read_at < NOW() - INTERVAL '48 hours';
          END IF;
        END $$;
      `);
    } catch (e) {}

    return { success: true, deleted48h: deleted48hCount || 0, deleted2hRead: deleted2hReadCount || 0 };
  } catch (err) {
    logger.error('[Notification Purge] Error executing notification purge job:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  purgeExpiredNotifications,
  purgeExpiredReadNotifications: purgeExpiredNotifications
};
