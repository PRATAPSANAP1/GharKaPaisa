const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAddAdminReviewColumns() {
  logger.info('[MIGRATION] Adding admin review columns to employee_biometric_templates table...');

  try {
    const { rows: colRows } = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'employee_biometric_templates' AND column_name = 'admin_review_status'
    `).catch(() => ({ rows: [] }));

    if (colRows.length === 0) {
      // Add admin review columns to employee_biometric_templates table
      await query(`
        ALTER TABLE employee_biometric_templates 
          ADD COLUMN IF NOT EXISTS admin_review_status VARCHAR(20) CHECK (admin_review_status IN ('APPROVED', 'REJECTED', 'FLAGGED', 'PENDING')),
          ADD COLUMN IF NOT EXISTS admin_reviewed_by UUID REFERENCES users(id),
          ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS admin_review_notes TEXT
      `);

      // Set default value for existing records
      await query(`
        UPDATE employee_biometric_templates 
        SET admin_review_status = 'PENDING' 
        WHERE admin_review_status IS NULL
      `).catch(() => {});
    }

    logger.info('[MIGRATION COMPLETE] Admin review columns added successfully to employee_biometric_templates table.');
    return true;
  } catch (err) {
    logger.error('Migration Error:', err.message);
    throw err;
  }
}

if (require.main === module) {
  migrateAddAdminReviewColumns()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAddAdminReviewColumns };
