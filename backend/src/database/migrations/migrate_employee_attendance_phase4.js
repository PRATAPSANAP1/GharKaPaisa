const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateEmployeeAttendancePhase4() {
  logger.info('[MIGRATION] Running Employee Attendance Phase 4 migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Employee Attendance Table
    await query(`
      CREATE TABLE IF NOT EXISTS employee_attendance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        check_in_time TIMESTAMPTZ NULL,
        check_out_time TIMESTAMPTZ NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (
          status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE')
        ),
        verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED' CHECK (
          verification_status IN ('VERIFIED', 'FAILED', 'MANUAL')
        ),
        verification_session_id UUID REFERENCES attendance_verification_sessions(id) ON DELETE SET NULL,
        verification_reference TEXT,
        source VARCHAR(20) NOT NULL DEFAULT 'WEB' CHECK (
          source IN ('WEB', 'MOBILE')
        ),
        liveness_status VARCHAR(40),
        face_status VARCHAR(40),
        environment_status VARCHAR(40),
        matched_environment_code VARCHAR(20),
        device_info JSONB,
        location_lat NUMERIC,
        location_lng NUMERIC,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_employee_attendance_date UNIQUE(employee_id, attendance_date)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_emp_att_emp_date ON employee_attendance(employee_id, attendance_date);
      CREATE INDEX IF NOT EXISTS idx_emp_att_status ON employee_attendance(status);
      CREATE INDEX IF NOT EXISTS idx_emp_att_date ON employee_attendance(attendance_date);
    `);

    logger.info('[MIGRATION COMPLETE] Employee Attendance table and unique constraints created successfully.');
  } catch (err) {
    logger.error('Employee Attendance Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateEmployeeAttendancePhase4()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateEmployeeAttendancePhase4 };
