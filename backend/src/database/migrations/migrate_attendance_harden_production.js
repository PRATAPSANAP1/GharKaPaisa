const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAttendanceHardenProduction() {
  logger.info('[MIGRATION] Running Attendance Production Hardening migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Add secondary validation anchor fields to attendance_verification_sessions
    await query(`
      ALTER TABLE attendance_verification_sessions
      ADD COLUMN IF NOT EXISTS challenge_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS challenge_type VARCHAR(20) DEFAULT 'NONE' CHECK (
        challenge_type IN ('NONE', 'HEAD_TURN_LEFT', 'HEAD_TURN_RIGHT', 'SMILE', 'BLINK', 'RANDOM_GESTURE')
      ),
      ADD COLUMN IF NOT EXISTS challenge_completed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS client_ip_address VARCHAR(45),
      ADD COLUMN IF NOT EXISTS client_user_agent TEXT,
      ADD COLUMN IF NOT EXISTS client_network_bssid VARCHAR(100),
      ADD COLUMN IF NOT EXISTS client_latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS client_longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS client_location_accuracy DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS network_verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        network_verification_status IN ('PENDING', 'PASSED', 'FAILED', 'BYPASSED')
      ),
      ADD COLUMN IF NOT EXISTS geo_verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        geo_verification_status IN ('PENDING', 'PASSED', 'FAILED', 'BYPASSED')
      ),
      ADD COLUMN IF NOT EXISTS face_quality_score DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS lighting_condition VARCHAR(20) CHECK (
        lighting_condition IN ('UNKNOWN', 'GOOD', 'LOW_LIGHT', 'BRIGHT', 'BACKLIT')
      ),
      ADD COLUMN IF NOT EXISTS occlusion_detected BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS rollback_reason VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ;
    `);

    // 2. Create indexes for new fields
    await query(`
      CREATE INDEX IF NOT EXISTS idx_ver_session_challenge_token ON attendance_verification_sessions(challenge_token);
      CREATE INDEX IF NOT EXISTS idx_ver_session_client_ip ON attendance_verification_sessions(client_ip_address);
      CREATE INDEX IF NOT EXISTS idx_ver_session_created_at ON attendance_verification_sessions(created_at);
    `);

    // 3. Create office network whitelist table for BSSID/IP validation
    await query(`
      CREATE TABLE IF NOT EXISTS office_network_whitelist (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_code VARCHAR(20) NOT NULL UNIQUE,
        office_name VARCHAR(255) NOT NULL,
        allowed_bssids TEXT[], -- Array of Wi-Fi BSSIDs
        allowed_ip_ranges TEXT[], -- Array of CIDR ranges
        allowed_ip_addresses TEXT[], -- Individual IP addresses
        geo_fence_enabled BOOLEAN DEFAULT FALSE,
        geo_fence_center_lat DECIMAL(10, 8),
        geo_fence_center_lon DECIMAL(11, 8),
        geo_fence_radius_meters INT DEFAULT 100,
        fallback_enabled BOOLEAN DEFAULT TRUE, -- Allow fallback if network verification fails
        network_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (
          network_status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')
        ),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_office_network_code ON office_network_whitelist(office_code);
      CREATE INDEX IF NOT EXISTS idx_office_network_status ON office_network_whitelist(network_status);
    `);

    // 4. Create attendance rate limiting table for circuit-breaker
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_rate_limits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        rate_limit_window_minutes INT DEFAULT 15,
        max_attempts_per_window INT DEFAULT 5,
        current_attempt_count INT DEFAULT 0,
        window_start_at TIMESTAMPTZ DEFAULT NOW(),
        is_blocked BOOLEAN DEFAULT FALSE,
        blocked_until TIMESTAMPTZ,
        block_reason VARCHAR(100),
        total_attempts_today INT DEFAULT 0,
        last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_emp_id ON attendance_rate_limits(employee_id);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON attendance_rate_limits(is_blocked, blocked_until);
    `);

    // 5. Create attendance queue for handling traffic spikes
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_verification_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        verification_session_id UUID NOT NULL REFERENCES attendance_verification_sessions(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        queue_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
          queue_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'TIMEOUT')
        ),
        priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 3,
        error_message TEXT,
        processing_started_at TIMESTAMPTZ,
        processing_completed_at TIMESTAMPTZ,
        timeout_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_att_queue_status ON attendance_verification_queue(queue_status);
      CREATE INDEX IF NOT EXISTS idx_att_queue_priority ON attendance_verification_queue(priority, created_at);
      CREATE INDEX IF NOT EXISTS idx_att_queue_session ON attendance_verification_queue(verification_session_id);
    `);

    // 6. Add environment fallback reason to attendance_environment_references
    await query(`
      ALTER TABLE attendance_environment_references
      ADD COLUMN IF NOT EXISTS fallback_enabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS fallback_reason TEXT;
    `);

    logger.info('[MIGRATION COMPLETE] Attendance Production Hardening migration completed successfully.');
    logger.info('[MIGRATION] Added: Challenge-response, Network/Geo validation, Rate limiting, Queue system');
  } catch (err) {
    logger.error('Attendance Production Hardening Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAttendanceHardenProduction()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAttendanceHardenProduction };
