const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { query, pool } = require('../../config/database');

async function runCleanup() {
  console.log('Running Employee Incentive Lifecycle Cleanup SQL Migration...');
  try {
    await query('BEGIN');

    // 1) Standardize statuses to PENDING, HOLD, RELEASE
    const relRes = await query(`
      UPDATE employee_incentive_transactions
      SET status = 'RELEASE'
      WHERE status IN ('RELEASED', 'PAID', 'COMPLETED')
    `);
    console.log(`Updated ${relRes.rowCount} records to status 'RELEASE'`);

    const holdRes = await query(`
      UPDATE employee_incentive_transactions
      SET status = 'HOLD'
      WHERE status IN ('ON_HOLD', 'HELD', 'HELD_APPFILE_PENDING', 'HELD_TARGET_PENDING')
    `);
    console.log(`Updated ${holdRes.rowCount} records to status 'HOLD'`);

    const pendRes = await query(`
      UPDATE employee_incentive_transactions
      SET status = 'PENDING'
      WHERE status NOT IN ('RELEASE', 'HOLD')
    `);
    console.log(`Updated ${pendRes.rowCount} remaining records to status 'PENDING'`);

    // 2) Delete orphaned incentives attached to non-approved applications
    const delRes = await query(`
      DELETE FROM employee_incentive_transactions it
      USING applications a
      WHERE it.application_id = a.id
        AND LOWER(TRIM(a.status::text)) NOT IN ('approved', 'super_admin_approved', 'sanctioned', 'disbursed', 'commission_released', 'commission_received', 'released')
    `);
    console.log(`Deleted ${delRes.rowCount} orphaned/invalid incentive records linked to non-approved applications`);

    await query('COMMIT');
    console.log('Employee Incentive Lifecycle Cleanup SQL Migration completed successfully!');
  } catch (err) {
    await query('ROLLBACK');
    console.error('Cleanup migration failed:', err);
  } finally {
    await pool.end();
  }
}

runCleanup();
