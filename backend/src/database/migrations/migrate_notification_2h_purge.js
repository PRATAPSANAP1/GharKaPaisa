const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateNotification2hPurge() {
  logger.info('[MIGRATION] Running Notification 2-Hour Read Purge indexing migration...');
  try {
    await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL`);
    await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(is_read, read_at)`);
    logger.info('[MIGRATION COMPLETE] Notification 2-Hour Read Purge indexes verified.');
  } catch (err) {
    logger.error('Notification 2-Hour Purge Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateNotification2hPurge()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateNotification2hPurge };
