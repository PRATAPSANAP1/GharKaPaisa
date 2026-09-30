const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAttendanceHardenPhase2() {
  logger.info('[MIGRATION] Running Attendance Hardening Phase 2 migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Add adaptive background anchor fields to attendance_environment_references
    await query(`
      ALTER TABLE attendance_environment_references
      ADD COLUMN IF NOT EXISTS lighting_condition VARCHAR(20) CHECK (
        lighting_condition IN ('UNKNOWN', 'MORNING_DIRECT', 'MORNING_DIFFUSED', 'EVENING_FLUORESCENT', 'EVENING_NATURAL', 'NIGHT_ARTIFICIAL')
      ),
      ADD COLUMN IF NOT EXISTS capture_angle VARCHAR(20) CHECK (
        capture_angle IN ('FRONTAL', 'LEFT_45', 'RIGHT_45', 'OVERHEAD', 'LOW_ANGLE')
      ),
      ADD COLUMN IF NOT EXISTS reference_group VARCHAR(50),
      ADD COLUMN IF NOT EXISTS priority_order INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS active_from_time TIME,
      ADD COLUMN IF NOT EXISTS active_to_time TIME,
      ADD COLUMN IF NOT EXISTS seasonal_validity VARCHAR(20) CHECK (
        seasonal_validity IN ('ALL_YEAR', 'SUMMER', 'WINTER', 'MONSOON')
      );
    `);

    // 2. Add twin detection and PIN fallback fields to employee_attendance
    await query(`
      ALTER TABLE employee_attendance
      ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS pin_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS pin_verification_method VARCHAR(20) CHECK (
        pin_verification_method IN ('NONE', 'SMS_OTP', 'EMAIL_OTP', 'APP_PIN', 'MANUAL_OVERRIDE')
      ),
      ADD COLUMN IF NOT EXISTS twin_suspected BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS twin_verification_required BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS environment_bypass_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS environment_bypass_reason VARCHAR(100),
      ADD COLUMN IF NOT EXISTS environment_bypass_approved_by UUID REFERENCES employees(id),
      ADD COLUMN IF NOT EXISTS environment_bypass_approved_at TIMESTAMPTZ;
    `);

    // 3. Add offline queue fields for AWS Rekognition outages
    await query(`
      ALTER TABLE attendance_verification_sessions
      ADD COLUMN IF NOT EXISTS offline_mode BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS offline_queue_id UUID,
      ADD COLUMN IF NOT EXISTS offline_synced_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS offline_sync_status VARCHAR(20) CHECK (
        offline_sync_status IN ('PENDING', 'SYNCED', 'FAILED')
      );
    `);

    // 4. Create offline attendance queue table
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_offline_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        check_in_time TIMESTAMPTZ NOT NULL,
        check_out_time TIMESTAMPTZ,
        captured_image_hash VARCHAR(64) NOT NULL,
        captured_image_path TEXT,
        device_nonce VARCHAR(64) NOT NULL,
        device_signature TEXT,
        location_latitude DECIMAL(10, 8),
        location_longitude DECIMAL(11, 8),
        location_accuracy DECIMAL(10, 2),
        mock_location_detected BOOLEAN DEFAULT FALSE,
        sync_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
          sync_status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'CONFLICT')
        ),
        sync_attempts INT DEFAULT 0,
        sync_error TEXT,
        synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_offline_queue_emp_id ON attendance_offline_queue(employee_id);
      CREATE INDEX IF NOT EXISTS idx_offline_queue_sync_status ON attendance_offline_queue(sync_status);
      CREATE INDEX IF NOT EXISTS idx_offline_queue_date ON attendance_offline_queue(attendance_date);
    `);

    // 5. Create device integrity log table
    await query(`
      CREATE TABLE IF NOT EXISTS device_integrity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        verification_session_id UUID REFERENCES attendance_verification_sessions(id) ON DELETE SET NULL,
        platform VARCHAR(20) NOT NULL CHECK (
          platform IN ('ios', 'android', 'web')
        ),
        device_model VARCHAR(100),
        os_version VARCHAR(50),
        app_version VARCHAR(50),
        integrity_token_valid BOOLEAN,
        integrity_score INT,
        integrity_checks JSONB,
        risk_flags TEXT[],
        rooted_jailbroken BOOLEAN DEFAULT FALSE,
        emulator_detected BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_device_integrity_emp_id ON device_integrity_logs(employee_id);
      CREATE INDEX IF NOT EXISTS idx_device_integrity_session ON device_integrity_logs(verification_session_id);
      CREATE INDEX IF NOT EXISTS idx_device_integrity_created ON device_integrity_logs(created_at);
    `);

    // 6. Add compound indexes for performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON employee_attendance(employee_id, attendance_date);
      CREATE INDEX IF NOT EXISTS idx_attendance_session_status ON attendance_verification_sessions(employee_id, status, expires_at);
      CREATE INDEX IF NOT EXISTS idx_attendance_session_token ON attendance_verification_sessions(challenge_token);
    `);

    // 7. Add PIN verification table for twin detection fallback
    await query(`
      CREATE TABLE IF NOT EXISTS employee_attendance_pins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        pin_hash VARCHAR(255) NOT NULL,
        pin_method VARCHAR(20) DEFAULT 'APP_PIN' CHECK (
          pin_method IN ('APP_PIN', 'SMS_OTP', 'EMAIL_OTP')
        ),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        UNIQUE(employee_id, is_active)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_pins_emp_id ON employee_attendance_pins(employee_id);
    `);

    // 8. Add environment bypass approval table
    await query(`
      CREATE TABLE IF NOT EXISTS environment_bypass_approvals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        requested_by UUID REFERENCES employees(id),
        approved_by UUID REFERENCES employees(id),
        bypass_reason TEXT NOT NULL,
        bypass_start_date DATE NOT NULL,
        bypass_end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (
          status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED')
        ),
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_env_bypass_emp_id ON environment_bypass_approvals(employee_id);
      CREATE INDEX IF NOT EXISTS idx_env_bypass_status ON environment_bypass_approvals(status);
      CREATE INDEX IF NOT EXISTS idx_env_bypass_dates ON environment_bypass_approvals(bypass_start_date, bypass_end_date);
    `);

    logger.info('[MIGRATION COMPLETE] Attendance Hardening Phase 2 migration completed successfully.');
    logger.info('[MIGRATION] Added: Adaptive anchors, twin detection, offline queue, device integrity logging');
  } catch (err) {
    logger.error('Attendance Hardening Phase 2 Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAttendanceHardenPhase2()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAttendanceHardenPhase2 };
