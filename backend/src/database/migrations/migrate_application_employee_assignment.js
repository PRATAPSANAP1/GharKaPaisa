const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateApplicationEmployeeAssignment = async () => {
  logger.info('Running Application Employee Assignment Migration...');

  try {
    // 1. Ensure employee assignment columns on applications table
    await query(`
      ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS assigned_to_employee_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS assigned_to_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS assigned_by_user_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_by_employee_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_by_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS assigned_by_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS assignment_notes TEXT;
    `);

    // 2. Also ensure columns on physical_application_details table
    await query(`
      ALTER TABLE physical_application_details 
        ADD COLUMN IF NOT EXISTS assigned_to_employee_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS assigned_to_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS assigned_by_user_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_by_employee_id UUID,
        ADD COLUMN IF NOT EXISTS assigned_by_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS assigned_by_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS assignment_notes TEXT;
    `);

    // 3. Create indexes for efficient filtering and employee lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_assigned_to_emp 
        ON applications (assigned_to_employee_id) 
        WHERE assigned_to_employee_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_applications_assigned_to_user 
        ON applications (assigned_to_user_id) 
        WHERE assigned_to_user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_applications_assigned_by_user 
        ON applications (assigned_by_user_id) 
        WHERE assigned_by_user_id IS NOT NULL;
    `);

    // 4. Create history/audit table for employee assignments
    await query(`
      CREATE TABLE IF NOT EXISTS application_employee_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        assigned_to_employee_id UUID,
        assigned_to_user_id UUID,
        assigned_to_name VARCHAR(150),
        assigned_to_code VARCHAR(50),
        assigned_by_user_id UUID,
        assigned_by_employee_id UUID,
        assigned_by_name VARCHAR(150),
        assigned_by_code VARCHAR(50),
        assignment_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_app_emp_assignments_app_id ON application_employee_assignments(application_id);
      CREATE INDEX IF NOT EXISTS idx_app_emp_assignments_to_emp ON application_employee_assignments(assigned_to_employee_id);
      CREATE INDEX IF NOT EXISTS idx_app_emp_assignments_to_user ON application_employee_assignments(assigned_to_user_id);
    `);

    logger.info('Application Employee Assignment Migration completed successfully.');
  } catch (err) {
    logger.error('Error during Application Employee Assignment Migration:', err.message || err);
  }
};

module.exports = { migrateApplicationEmployeeAssignment };
