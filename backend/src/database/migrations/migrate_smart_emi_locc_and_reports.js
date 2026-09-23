const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateSmartEmiAndLoccSchema() {
  logger.info('[Migration] Adding Smart EMI and Loan on Credit Card columns to applications table...');
  try {
    // 1. Smart EMI fields on applications table
    await query(`
      ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS smart_emi_amount DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS smart_emi_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS bank_smart_emi_offer DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS bank_smart_emi_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS disbursed_smart_emi DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS disbursed_smart_emi_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS smart_emi_reference_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS smart_emi_offer_status VARCHAR(20),
      ADD COLUMN IF NOT EXISTS final_smart_emi_disbursed DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS final_smart_emi_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS smart_emi_offer_decline_reason TEXT,
      ADD COLUMN IF NOT EXISTS smart_emi_incentive_eligible BOOLEAN DEFAULT TRUE;
    `);

    // 2. Loan on Credit Card (LOCC) fields on applications table
    await query(`
      ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS loan_on_cc_required_amount DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS loan_on_cc_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS instant_jumbo_offer_status VARCHAR(20),
      ADD COLUMN IF NOT EXISTS customer_loan_offer DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS loan_offer_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS loan_on_cc_disbursed_amount DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS loan_on_cc_disbursed_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS loan_on_cc_reference_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS final_loan_disbursed DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS final_loan_tenure_months INTEGER,
      ADD COLUMN IF NOT EXISTS loan_on_cc_decline_reason TEXT,
      ADD COLUMN IF NOT EXISTS loan_on_cc_incentive_eligible BOOLEAN DEFAULT TRUE;
    `);

    // Add indexes for reference numbers for fast searching
    await query(`CREATE INDEX IF NOT EXISTS idx_apps_smart_emi_ref ON applications(smart_emi_reference_number) WHERE smart_emi_reference_number IS NOT NULL;`);
    await query(`CREATE INDEX IF NOT EXISTS idx_apps_loan_on_cc_ref ON applications(loan_on_cc_reference_number) WHERE loan_on_cc_reference_number IS NOT NULL;`);

    logger.info('[Migration] Smart EMI & LOCC database migration completed successfully.');
  } catch (err) {
    logger.error('[Migration] Smart EMI & LOCC database migration error:', err);
  }
}

if (require.main === module) {
  migrateSmartEmiAndLoccSchema().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { migrateSmartEmiAndLoccSchema };
