const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');

let migrationRunning = null;
let migrationDone = false;

const migrateHrProfilesAndBankRequirements = async () => {
  if (migrationDone) return { success: true };
  if (migrationRunning) return migrationRunning;

  migrationRunning = (async () => {
    let client = null;
    let lockAcquired = false;
    try {
      client = await getClient();
      const { rows: lockRows } = await client.query('SELECT pg_try_advisory_lock(948291022) as acquired').catch(() => ({ rows: [] }));
      lockAcquired = Boolean(lockRows && lockRows[0] && lockRows[0].acquired);
      if (!lockAcquired) {
        logger.info('HR profiles & Bank requirements migration already running in another process/worker. Skipping.');
        migrationDone = true;
        return { success: true };
      }

      logger.info('Running HR profiles & Bank requirements Schema Migration...');

      await client.query(`
        -- 1. bank_requirements
        CREATE TABLE IF NOT EXISTS bank_requirements (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          fields JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_bank_requirements_bank_product 
          ON bank_requirements (bank_id, product_id);

        -- 2. hr_profiles
        CREATE TABLE IF NOT EXISTS hr_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          employee_id VARCHAR(50) UNIQUE,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(150),
          mobile_number VARCHAR(20),
          designation VARCHAR(100) DEFAULT 'HR Manager',
          department VARCHAR(100) DEFAULT 'Human Resources',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_hr_profiles_user_id ON hr_profiles (user_id);
        CREATE INDEX IF NOT EXISTS idx_hr_profiles_mobile ON hr_profiles (mobile_number);
      `);

      logger.info('HR profiles & Bank requirements Schema Migration completed successfully.');
      migrationDone = true;
      return { success: true };
    } catch (err) {
      logger.error('Error during HR profiles & Bank requirements Migration:', err.message || err);
      return { success: false, error: err.message };
    } finally {
      if (client) {
        if (lockAcquired) {
          await client.query('SELECT pg_advisory_unlock(948291022)').catch(() => {});
        }
        client.release();
      }
      migrationRunning = null;
    }
  })();

  return migrationRunning;
};

if (require.main === module) {
  migrateHrProfilesAndBankRequirements()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateHrProfilesAndBankRequirements };

