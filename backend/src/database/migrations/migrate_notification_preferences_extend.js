const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { pool } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateNotificationPreferencesExtend() {
  logger.info('[MIGRATION] Extending notification_preferences with mobile app toggles...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE notification_preferences
        ADD COLUMN IF NOT EXISTS messenger_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT TRUE;
    `);

    await client.query('COMMIT');
    logger.info('[MIGRATION COMPLETE] notification_preferences extended columns verified.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('notification_preferences extend migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateNotificationPreferencesExtend()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateNotificationPreferencesExtend };
