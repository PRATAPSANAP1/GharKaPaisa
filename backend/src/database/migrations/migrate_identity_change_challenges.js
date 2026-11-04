const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');

let migrationRunning = null;
let migrationDone = false;

const migrateIdentityChangeChallenges = async () => {
  if (migrationDone) return { success: true };
  if (migrationRunning) return migrationRunning;

  migrationRunning = (async () => {
    let client = null;
    let lockAcquired = false;
    try {
      client = await getClient();
      const { rows: lockRows } = await client.query('SELECT pg_try_advisory_lock(938192019) as acquired').catch(() => ({ rows: [] }));
      lockAcquired = Boolean(lockRows && lockRows[0] && lockRows[0].acquired);
      if (!lockAcquired) {
        logger.info('Identity Change Challenges migration already running in another process/worker. Skipping.');
        migrationDone = true;
        return { success: true };
      }

      logger.info('Running Identity Change Challenges Schema Migration...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS identity_change_challenges (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          new_value VARCHAR(255) NOT NULL,
          old_otp_hash VARCHAR(255) NOT NULL,
          new_otp_hash VARCHAR(255) NOT NULL,
          verified_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_identity_challenges_user_type 
          ON identity_change_challenges (user_id, type) 
          WHERE verified_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_identity_challenges_expires_at 
          ON identity_change_challenges (expires_at);
      `);

      logger.info('Identity Change Challenges Schema Migration completed successfully.');
      migrationDone = true;
      return { success: true };
    } catch (err) {
      logger.error('Error during Identity Change Challenges Migration:', err.message || err);
      return { success: false, error: err.message };
    } finally {
      if (client) {
        if (lockAcquired) {
          await client.query('SELECT pg_advisory_unlock(938192019)').catch(() => {});
        }
        client.release();
      }
      migrationRunning = null;
    }
  })();

  return migrationRunning;
};

if (require.main === module) {
  migrateIdentityChangeChallenges()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateIdentityChangeChallenges };

