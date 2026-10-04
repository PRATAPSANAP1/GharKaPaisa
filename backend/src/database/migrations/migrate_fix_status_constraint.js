const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateFixStatusConstraint() {
  logger.info('[MIGRATION] Fixing attendance_verification_sessions status constraint...');

  try {
    // Drop the existing check constraint
    await query(`
      ALTER TABLE attendance_verification_sessions 
      DROP CONSTRAINT IF EXISTS attendance_verification_sessions_status_check
    `);

    // Re-add the check constraint with CONSUMED included
    await query(`
      ALTER TABLE attendance_verification_sessions 
      ADD CONSTRAINT attendance_verification_sessions_status_check 
      CHECK (
        status IN (
          'CREATED', 
          'LIVENESS_PENDING', 
          'LIVENESS_PASSED', 
          'LIVENESS_FAILED', 
          'FACE_PENDING', 
          'FACE_PASSED', 
          'FACE_MISMATCH', 
          'ENVIRONMENT_PENDING', 
          'ENVIRONMENT_PASSED', 
          'ENVIRONMENT_MISMATCH', 
          'PASSED', 
          'FAILED', 
          'EXPIRED',
          'CONSUMED'
        )
      )
    `);

    logger.info('[MIGRATION COMPLETE] Status constraint fixed successfully. Added CONSUMED to allowed values.');
  } catch (err) {
    logger.error('Status constraint fix migration error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateFixStatusConstraint()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateFixStatusConstraint };
