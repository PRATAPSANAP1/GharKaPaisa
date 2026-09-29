const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAttendanceVerificationPhase3() {
  logger.info('[MIGRATION] Running Attendance Verification Phase 3 migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Attendance Verification Sessions Table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_verification_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        status VARCHAR(40) NOT NULL DEFAULT 'CREATED' CHECK (
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
            'EXPIRED'
          )
        ),
        liveness_status VARCHAR(40) NOT NULL DEFAULT 'PENDING' CHECK (
          liveness_status IN ('PENDING', 'PASSED', 'FAILED', 'EXPIRED', 'PROVIDER_NOT_CONFIGURED')
        ),
        face_status VARCHAR(40) NOT NULL DEFAULT 'PENDING' CHECK (
          face_status IN ('PENDING', 'PASSED', 'FAILED', 'MISMATCH', 'REFERENCE_NOT_FOUND', 'PROVIDER_NOT_CONFIGURED')
        ),
        environment_status VARCHAR(40) NOT NULL DEFAULT 'PENDING' CHECK (
          environment_status IN ('PENDING', 'PASSED', 'FAILED', 'MISMATCH', 'NO_ACTIVE_REFERENCES', 'PROVIDER_NOT_CONFIGURED')
        ),
        matched_environment_code VARCHAR(20),
        failure_reason VARCHAR(100),
        provider_liveness_session_id TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ver_session_emp_id ON attendance_verification_sessions(employee_id);
      CREATE INDEX IF NOT EXISTS idx_ver_session_status ON attendance_verification_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_ver_session_expires ON attendance_verification_sessions(expires_at);
    `);

    logger.info('[MIGRATION COMPLETE] Attendance Verification Phase 3 session table and indexes created successfully.');
  } catch (err) {
    logger.error('Attendance Verification Phase 3 Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAttendanceVerificationPhase3()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAttendanceVerificationPhase3 };
