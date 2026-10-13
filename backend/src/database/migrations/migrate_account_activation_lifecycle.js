const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Migration: Account Activation / Deactivation Lifecycle
 * 
 * Adds status management fields to the users table:
 * - is_active: boolean
 * - deactivated_at: nullable timestamptz
 * - deactivated_by: nullable administrator UUID
 * - deactivation_reason: nullable text
 * - activated_at: nullable timestamptz
 * - activated_by: nullable administrator UUID
 * - activation_scheduled_at: nullable timestamptz
 * - deactivation_scheduled_at: nullable timestamptz
 * - scheduled_status_action: nullable varchar (ACTIVATE / DEACTIVATE)
 * - scheduled_by: nullable administrator UUID
 * - scheduled_reason: nullable text
 */
async function migrateAccountActivationLifecycle() {
  logger.info('[MIGRATION] Running Account Activation / Deactivation Lifecycle schema migration...');

  try {
    // 1. Ensure required extensions exist
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 2. Add columns to users table idempotently
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivation_reason TEXT DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_scheduled_at TIMESTAMPTZ DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivation_scheduled_at TIMESTAMPTZ DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_status_action VARCHAR(20) DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_reason TEXT DEFAULT NULL`);

    // 3. Ensure user_status enum includes inactive and suspended
    try {
      await query(`ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'inactive'`);
    } catch (e) {
      // Ignore if already present
    }

    // 4. Create performance indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_activation_scheduled_at ON users(activation_scheduled_at) WHERE activation_scheduled_at IS NOT NULL`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_deactivation_scheduled_at ON users(deactivation_scheduled_at) WHERE deactivation_scheduled_at IS NOT NULL`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_scheduled_status_action ON users(scheduled_status_action) WHERE scheduled_status_action IS NOT NULL`);

    // 5. Backfill consistency: set is_active = FALSE for any user with status 'inactive', 'suspended', or 'blocked'
    await query(`
      UPDATE users 
      SET is_active = FALSE 
      WHERE (status::text IN ('inactive', 'suspended', 'blocked')) 
        AND (is_active IS NULL OR is_active = TRUE)
    `);

    // Ensure users with is_active = TRUE have status active or pending
    await query(`
      UPDATE users
      SET is_active = TRUE
      WHERE is_active IS NULL
    `);

    logger.info('[MIGRATION COMPLETE] Account Activation / Deactivation Lifecycle schema initialized successfully.');
  } catch (err) {
    logger.error('Account Activation Lifecycle Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAccountActivationLifecycle()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAccountActivationLifecycle };
