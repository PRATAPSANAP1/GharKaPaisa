const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Migration: Add consumed_at column to attendance_verification_sessions table
 */
async function migrateAttendanceConsumedAtV1() {
  try {
    logger.info('[MIGRATION START] Adding consumed_at column to attendance_verification_sessions...');

    await query(`
      ALTER TABLE attendance_verification_sessions 
      ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ver_session_consumed 
      ON attendance_verification_sessions(consumed_at);
    `);

    logger.info('[MIGRATION COMPLETE] Attendance verification sessions consumed_at column added successfully.');
  } catch (err) {
    logger.error('Attendance Consumed At V1 Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAttendanceConsumedAtV1()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateAttendanceConsumedAtV1 };
