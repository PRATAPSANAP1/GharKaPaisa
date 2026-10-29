const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { query, pool } = require('../../config/database');

async function runCleanup() {
  console.log('Running Employee Incentive Lifecycle Cleanup SQL Migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Standardize statuses to PENDING, HOLD, RELEASE
    const relRes = await client.query(`
      UPDATE employee_incentive_transactions
      SET status = 'RELEASE'
      WHERE status IN ('RELEASED', 'PAID', 'COMPLETED')
    `);
    console.log(`Updated ${relRes.rowCount} records to status 'RELEASE'`);

    const holdRes = await client.query(`
      UPDATE employee_incentive_transactions
      SET status = 'HOLD'
      WHERE status IN ('ON_HOLD', 'HELD', 'HELD_APPFILE_PENDING', 'HELD_TARGET_PENDING')
    `);
    console.log(`Updated ${holdRes.rowCount} records to status 'HOLD'`);

    const pendRes = await client.query(`
      UPDATE employee_incentive_transactions
      SET status = 'PENDING'
      WHERE status NOT IN ('RELEASE', 'HOLD')
    `);
    console.log(`Updated ${pendRes.rowCount} remaining records to status 'PENDING'`);

    // 2) Delete orphaned incentives attached to non-approved applications
    const delRes = await client.query(`
      DELETE FROM employee_incentive_transactions it
      USING applications a
      WHERE it.application_id = a.id
        AND LOWER(TRIM(a.status::text)) NOT IN ('approved', 'super_admin_approved', 'sanctioned', 'disbursed', 'commission_released', 'commission_received', 'released')
    `);
    console.log(`Deleted ${delRes.rowCount} orphaned/invalid incentive records linked to non-approved applications`);

    await client.query('COMMIT');
    console.log('Employee Incentive Lifecycle Cleanup SQL Migration completed successfully!');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Cleanup migration rollback failed:', rollbackErr);
    }
    console.error('Cleanup migration failed:', err);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runCleanup()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { runCleanup };
