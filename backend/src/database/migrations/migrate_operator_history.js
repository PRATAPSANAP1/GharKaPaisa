const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateOperatorHistory = async () => {
  logger.info('[Operator History Migration] Ensuring application_operator_history table and operator columns...');
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await query(`
      CREATE TABLE IF NOT EXISTS application_operator_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        operator_name VARCHAR(255),
        operator_role VARCHAR(100),
        operator_designation VARCHAR(100),
        operator_code VARCHAR(100),
        action_type VARCHAR(100) NOT NULL,
        field_changes JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_app_op_hist_app_id ON application_operator_history(application_id);
      CREATE INDEX IF NOT EXISTS idx_app_op_hist_op_id ON application_operator_history(operator_id);
      CREATE INDEX IF NOT EXISTS idx_app_op_hist_created ON application_operator_history(created_at DESC);

      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS last_operator_id UUID,
      ADD COLUMN IF NOT EXISTS last_operator_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_operator_role VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_operator_designation VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_operator_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS final_status_operator_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_operated_at TIMESTAMPTZ;

      ALTER TABLE physical_application_details 
      ADD COLUMN IF NOT EXISTS last_operator_id UUID,
      ADD COLUMN IF NOT EXISTS last_operator_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_operator_role VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_operator_designation VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_operator_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS final_status_operator_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS last_operated_at TIMESTAMPTZ;
    `);
    logger.info('[Operator History Migration] application_operator_history migration completed successfully.');
    return { success: true };
  } catch (err) {
    logger.error('[Operator History Migration] Error:', err.message);
    throw err;
  }
};

if (require.main === module) {
  migrateOperatorHistory()
    .then(() => {
      console.log('Operator history migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Operator history migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateOperatorHistory };
