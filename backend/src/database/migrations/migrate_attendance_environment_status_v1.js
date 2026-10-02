const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAttendanceEnvironmentStatusV1() {
  logger.info('[MIGRATION] Running Attendance Environment Status V1 migration...');

  try {
    // 1. Drop existing CHECK constraint on environment_status
    await query(`
      ALTER TABLE attendance_verification_sessions
      DROP CONSTRAINT IF EXISTS attendance_verification_sessions_environment_status_check;
    `);

    // 2. Add updated CHECK constraint including PENDING_INTEGRATION
    await query(`
      ALTER TABLE attendance_verification_sessions
      ADD CONSTRAINT attendance_verification_sessions_environment_status_check
      CHECK (
        environment_status IN (
          'PENDING',
          'PENDING_INTEGRATION',
          'PASSED',
          'FAILED',
          'MISMATCH',
          'NO_ACTIVE_REFERENCES',
          'PROVIDER_NOT_CONFIGURED'
        )
      );
    `);

    logger.info('[MIGRATION COMPLETE] Added PENDING_INTEGRATION to environment_status check constraint successfully.');
  } catch (err) {
    logger.error('Attendance Environment Status V1 Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAttendanceEnvironmentStatusV1()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAttendanceEnvironmentStatusV1 };
