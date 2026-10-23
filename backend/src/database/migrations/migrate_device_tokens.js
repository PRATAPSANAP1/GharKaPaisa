const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { pool } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateDeviceTokens() {
  logger.info('[MIGRATION] Running Device Push Token registration migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        device_type VARCHAR(30) DEFAULT 'mobile',
        platform VARCHAR(30),
        is_active BOOLEAN DEFAULT TRUE,
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(user_id, is_active);
    `);

    await client.query('COMMIT');
    logger.info('[MIGRATION COMPLETE] device_tokens table & indexes verified.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Device Tokens migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateDeviceTokens()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateDeviceTokens };
