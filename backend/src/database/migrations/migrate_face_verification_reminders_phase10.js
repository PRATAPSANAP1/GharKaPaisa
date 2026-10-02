const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateFaceVerificationRemindersPhase10() {
  logger.info('[MIGRATION] Running Phase 10: Face Verification Reminders migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. Create face_verification_reminders table
    await query(`
      CREATE TABLE IF NOT EXISTS face_verification_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        sent_by UUID REFERENCES users(id),
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'SEEN', 'COMPLETED', 'CANCELLED')),
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        seen_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Lookup Indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_face_reminders_emp_id ON face_verification_reminders(employee_id);
      CREATE INDEX IF NOT EXISTS idx_face_reminders_status ON face_verification_reminders(status);
      CREATE INDEX IF NOT EXISTS idx_face_reminders_sent_at ON face_verification_reminders(sent_at DESC);
    `);

    logger.info('[MIGRATION COMPLETE] Phase 10 Face Verification Reminders migration executed successfully.');
    return true;
  } catch (err) {
    logger.error('Phase 10 Face Verification Reminders Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateFaceVerificationRemindersPhase10()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateFaceVerificationRemindersPhase10 };
