const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');

let migrationRunning = null;
let migrationDone = false;

const migrateApplicationEmployeeAssignment = async () => {
  if (migrationDone) return { success: true };
  if (migrationRunning) return migrationRunning;

  migrationRunning = (async () => {
    let client = null;
    let lockAcquired = false;
    try {
      client = await getClient();
      const { rows: lockRows } = await client.query('SELECT pg_try_advisory_lock(928172911) as acquired').catch(() => ({ rows: [] }));
      lockAcquired = Boolean(lockRows && lockRows[0] && lockRows[0].acquired);
      if (!lockAcquired) {
        logger.info('Application Employee Assignment migration already running in another process/worker. Skipping.');
        migrationDone = true;
        return { success: true };
      }

      logger.info('Running Application Employee Assignment Migration...');

      // 1. Check if employee assignment columns on applications table exist before ALTER TABLE
      const { rows: appCols } = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'applications' AND column_name = 'assigned_to_employee_id'
      `).catch(() => ({ rows: [] }));

      if (appCols.length === 0) {
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
      }

      // 2. Check if columns exist on physical_application_details table before ALTER TABLE
      const { rows: padCols } = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'physical_application_details' AND column_name = 'assigned_to_employee_id'
      `).catch(() => ({ rows: [] }));

      if (padCols.length === 0) {
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
      }

      // 3. Create indexes only if not existing
      const { rows: idxRows } = await query(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'applications' AND indexname = 'idx_applications_assigned_to_emp'
      `).catch(() => ({ rows: [] }));

      if (idxRows.length === 0) {
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
      }

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
      migrationDone = true;
      return { success: true };
    } catch (err) {
      logger.error('Error during Application Employee Assignment Migration:', err.message || err);
      return { success: false, error: err.message };
    } finally {
      if (client) {
        if (lockAcquired) {
          await client.query('SELECT pg_advisory_unlock(928172911)').catch(() => {});
        }
        client.release();
      }
      migrationRunning = null;
    }
  })();

  return migrationRunning;
};

module.exports = { migrateApplicationEmployeeAssignment };
