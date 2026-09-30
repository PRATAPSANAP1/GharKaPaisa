const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAttendanceEnvironmentBypass() {
  logger.info('[MIGRATION] Running Attendance Environment Bypass table creation...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await query(`
      CREATE TABLE IF NOT EXISTS environment_bypass_approvals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        approved_by UUID NOT NULL REFERENCES users(id),
        bypass_reason TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_env_bypass_emp_dates 
      ON environment_bypass_approvals(employee_id, is_active, start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_env_bypass_approved_by 
      ON environment_bypass_approvals(approved_by);
    `);

    logger.info('[MIGRATION COMPLETE] Environment bypass approvals table setup successfully.');
  } catch (err) {
    logger.error('Attendance Environment Bypass Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAttendanceEnvironmentBypass()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAttendanceEnvironmentBypass };
