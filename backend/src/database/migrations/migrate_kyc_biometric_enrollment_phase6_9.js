const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateKycBiometricEnrollmentPhase6_9() {
  logger.info('[MIGRATION] Running Phase 6-9: KYC-Based Employee Biometric Enrollment migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. Ensure employee_biometric_templates table exists
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

    // 2. Add Phase 6-9 enhanced columns idempotently
    await query(`ALTER TABLE employee_biometric_templates ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50)`);
    await query(`ALTER TABLE employee_biometric_templates ADD COLUMN IF NOT EXISTS rekognition_collection_id VARCHAR(255)`);
    await query(`ALTER TABLE employee_biometric_templates ADD COLUMN IF NOT EXISTS rekognition_face_id TEXT`);
    await query(`ALTER TABLE employee_biometric_templates ADD COLUMN IF NOT EXISTS provider_user_id TEXT`);

    // 3. Ensure unique constraint: Only ONE active biometric template per employee at a time
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_emp_biometric_active_unique 
      ON employee_biometric_templates (employee_id) 
      WHERE status = 'ACTIVE';
    `);

    // 4. Additional lookup indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_emp_biometric_emp_id ON employee_biometric_templates(employee_id);
      CREATE INDEX IF NOT EXISTS idx_emp_biometric_status ON employee_biometric_templates(status);
      CREATE INDEX IF NOT EXISTS idx_emp_biometric_emp_code ON employee_biometric_templates(employee_code);
    `);

    // 5. Create compatibility view for employee_face_biometric_templates
    await query(`
      CREATE OR REPLACE VIEW employee_face_biometric_templates AS
      SELECT 
        id,
        employee_id,
        employee_code,
        version,
        status,
        s3_bucket,
        s3_key,
        face_provider,
        face_provider_id,
        rekognition_collection_id,
        rekognition_face_id,
        provider_user_id,
        image_hash,
        enrollment_source,
        enrolled_by,
        enrolled_at,
        revoked_at,
        revoked_by,
        revocation_reason,
        created_at,
        updated_at
      FROM employee_biometric_templates;
    `);

    logger.info('[MIGRATION COMPLETE] Phase 6-9 KYC Biometric Enrollment migration executed successfully.');
    return true;
  } catch (err) {
    logger.error('Phase 6-9 KYC Biometric Enrollment Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateKycBiometricEnrollmentPhase6_9()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateKycBiometricEnrollmentPhase6_9 };
