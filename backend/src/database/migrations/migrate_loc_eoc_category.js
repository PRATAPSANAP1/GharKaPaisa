const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateLocEocCategory() {
  logger.info('[Migration] Running LOC/EOC category migration...');

  try {
    // 1. Add 'loc_eoc' to product_category enum if missing
    const { rows: enumRows } = await query(`
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'product_category' AND e.enumlabel = 'loc_eoc'
    `);
    if (enumRows.length === 0) {
      await query(`ALTER TYPE product_category ADD VALUE 'loc_eoc'`);
      logger.info("[Migration] Added enum value 'loc_eoc' to 'product_category'");
    }

    // 2. Update existing products in 'products' table
    await query(`
      UPDATE products
      SET category = 'loc_eoc'::product_category, sub_category = 'LOC'
      WHERE LOWER(name) LIKE '%insta loan%' OR LOWER(name) LIKE '%jumbo loan%' OR category::text = 'loan_on_credit_card'
    `);

    await query(`
      UPDATE products
      SET category = 'loc_eoc'::product_category, sub_category = 'EOC'
      WHERE LOWER(name) LIKE '%smartemi%' OR LOWER(name) LIKE '%smart emi%' OR category::text = 'smart_emi'
    `);

    // 3. Reclassify existing applications in 'applications' table
    await query(`
      UPDATE applications
      SET category = 'loc_eoc'
      WHERE category IN ('loan_on_credit_card', 'smart_emi', 'card_on_loan')
         OR product_id IN (SELECT id FROM products WHERE category::text = 'loc_eoc')
    `);

    // 4. Ensure LOC/EOC remark columns exist on applications & physical_application_details
    await query(`
      ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS insta_jumbo_offer VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_loan_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS customer_loan_offer VARCHAR(50),
        ADD COLUMN IF NOT EXISTS offer_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS los_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_bank_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_completed VARCHAR(20),
        ADD COLUMN IF NOT EXISTS disbursement_date DATE,
        ADD COLUMN IF NOT EXISTS disbursal_date DATE;

      ALTER TABLE physical_application_details 
        ADD COLUMN IF NOT EXISTS insta_jumbo_offer VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_loan_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS customer_loan_offer VARCHAR(50),
        ADD COLUMN IF NOT EXISTS offer_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_amount VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursed_tenure VARCHAR(50),
        ADD COLUMN IF NOT EXISTS los_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_bank_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS disbursement_completed VARCHAR(20),
        ADD COLUMN IF NOT EXISTS disbursement_date DATE,
        ADD COLUMN IF NOT EXISTS disbursal_date DATE;
    `);

    logger.info('[Migration] LOC/EOC category migration completed successfully.');
  } catch (err) {
    logger.error('[Migration] Error in LOC/EOC category migration:', err);
  }
}

if (require.main === module) {
  migrateLocEocCategory().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { migrateLocEocCategory };
