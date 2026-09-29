const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateBiometricEnrollment() {
  logger.info('[MIGRATION] Running Biometric Enrollment Phase 2 migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. Employee Biometric Templates Table
    await query(`
      CREATE TABLE IF NOT EXISTS employee_biometric_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        version INT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'REVOKED', 'FAILED')),
        s3_bucket VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        face_provider VARCHAR(50) DEFAULT 'LOCAL_S3',
        face_provider_id TEXT,
        image_hash VARCHAR(64) NOT NULL,
        enrollment_source VARCHAR(50) NOT NULL DEFAULT 'KYC_FACE_ENROLLMENT' CHECK (enrollment_source IN ('KYC_FACE_ENROLLMENT', 'SUPER_ADMIN_RE_ENROLLMENT', 'ADMIN_ENROLLMENT')),
        enrolled_by UUID REFERENCES users(id),
        enrolled_at TIMESTAMPTZ DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        revoked_by UUID REFERENCES users(id),
        revocation_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Unique constraint: Only ONE active biometric template per employee at a time
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_emp_biometric_active_unique 
      ON employee_biometric_templates (employee_id) 
      WHERE status = 'ACTIVE';
    `);

    // Additional lookup indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_emp_biometric_emp_id ON employee_biometric_templates(employee_id);
      CREATE INDEX IF NOT EXISTS idx_emp_biometric_status ON employee_biometric_templates(status);
    `);

    // 2. Attendance Office Environment References Table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_environment_references (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reference_code VARCHAR(20) NOT NULL UNIQUE,
        reference_name VARCHAR(255) NOT NULL,
        s3_bucket VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        image_hash VARCHAR(64) NOT NULL,
        environment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (environment_status IN ('ACTIVE', 'REVOKED')),
        provider VARCHAR(50) DEFAULT 'LOCAL_S3',
        provider_reference_id TEXT,
        capture_description TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_env_ref_code ON attendance_environment_references(reference_code);
      CREATE INDEX IF NOT EXISTS idx_env_ref_status ON attendance_environment_references(environment_status);
    `);

    logger.info('[MIGRATION COMPLETE] Biometric Enrollment Phase 2 tables and indexes created successfully.');
  } catch (err) {
    logger.error('Biometric Enrollment Phase 2 Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateBiometricEnrollment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateBiometricEnrollment };
