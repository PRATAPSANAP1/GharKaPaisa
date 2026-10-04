const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateMessenger48hPurge() {
  logger.info('[MIGRATION] Running Messenger 48-Hour Purge indexing migration...');
  try {
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_message_attachments_created_at ON message_attachments(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_message_reads_read_at ON message_reads(read_at DESC)`);
    logger.info('[MIGRATION COMPLETE] Messenger 48-Hour Purge indexes verified.');
  } catch (err) {
    logger.error('Messenger 48-Hour Purge Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateMessenger48hPurge()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateMessenger48hPurge };
