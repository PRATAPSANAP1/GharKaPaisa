const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateEmployeeDashboardPerformanceIndexes = async () => {
  try {
    logger.info('Running Employee Dashboard Performance Indexes Migration...');

    // Index for employee_attendance queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_attendance_emp_date 
      ON employee_attendance(employee_id, attendance_date)
    `);
    logger.info('Created index: idx_employee_attendance_emp_date');

    // Index for employee_documents queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_documents_emp_created 
      ON employee_documents(employee_id, created_at DESC)
    `);
    logger.info('Created index: idx_employee_documents_emp_created');

    // Index for employee_joining_details queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_joining_emp_created 
      ON employee_joining_details(employee_id, created_at DESC)
    `);
    logger.info('Created index: idx_employee_joining_emp_created');

    // Index for employee_kyc queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_kyc_emp_created 
      ON employee_kyc(employee_id, created_at DESC)
    `);
    logger.info('Created index: idx_employee_kyc_emp_created');

    // Index for employee_terms_acceptance queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_terms_emp_created 
      ON employee_terms_acceptance(employee_id, accepted_at DESC)
    `);
    logger.info('Created index: idx_employee_terms_emp_created');

    // Index for employee_hierarchy queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_emp_active 
      ON employee_hierarchy(employee_id) WHERE is_active = true
    `);
    logger.info('Created index: idx_employee_hierarchy_emp_active');

    // Index for employee_hierarchy manager/team_leader lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_manager 
      ON employee_hierarchy(manager_id) WHERE is_active = true
    `);
    logger.info('Created index: idx_employee_hierarchy_manager');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_hierarchy_team_leader 
      ON employee_hierarchy(team_leader_id) WHERE is_active = true
    `);
    logger.info('Created index: idx_employee_hierarchy_team_leader');

    // Index for applications employee_id lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_employee_id 
      ON applications(employee_id) WHERE employee_id IS NOT NULL
    `);
    logger.info('Created index: idx_applications_employee_id');

    // Index for applications submitted_by lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_by 
      ON applications(submitted_by) WHERE submitted_by IS NOT NULL
    `);
    logger.info('Created index: idx_applications_submitted_by');

    // Index for employee_incentive_transactions employee_id lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_incentive_emp 
      ON employee_incentive_transactions(employee_id)
    `);
    logger.info('Created index: idx_employee_incentive_emp');

    // Index for employee_biometric_templates employee_id lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_biometric_emp_status 
      ON employee_biometric_templates(employee_id, status DESC, created_at DESC)
    `);
    logger.info('Created index: idx_employee_biometric_emp_status');

    // Index for employee_verification_reminders employee_id lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_employee_verification_reminders_emp_created 
      ON employee_verification_reminders(employee_id, created_at DESC)
    `);
    logger.info('Created index: idx_employee_verification_reminders_emp_created');

    // Index for admin_working_hour_extensions date lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_working_hour_extensions_date 
      ON admin_working_hour_extensions(extension_date, is_revoked) WHERE is_revoked IS NOT TRUE
    `);
    logger.info('Created index: idx_working_hour_extensions_date');

    logger.info('Employee Dashboard Performance Indexes Migration completed successfully');
  } catch (err) {
    logger.error('Failed to run Employee Dashboard Performance Indexes Migration:', err);
    throw err;
  }
};

// Run migration if executed directly
if (require.main === module) {
  migrateEmployeeDashboardPerformanceIndexes()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateEmployeeDashboardPerformanceIndexes;
