const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateSalesOperatorClaim = async () => {
  logger.info('Running Administrative Sales Operator Claim Schema Migration...');

  try {
    // 1. Ensure columns on applications table
    await query(`
      ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS sales_claimed_by VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sales_claimed_by_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS sales_claimed_by_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sales_claimed_at TIMESTAMPTZ
    `);

    // 2. Ensure columns on physical_application_details table
    await query(`
      ALTER TABLE physical_application_details 
        ADD COLUMN IF NOT EXISTS sales_claimed_by VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sales_claimed_by_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS sales_claimed_by_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sales_claimed_at TIMESTAMPTZ
    `);

    // 3. Create index for efficient filtering by sales_claimed_by
    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_sales_claimed_by 
        ON applications (sales_claimed_by) 
        WHERE sales_claimed_by IS NOT NULL;
    `);

    logger.info('Administrative Sales Operator Claim Schema Migration completed successfully.');
  } catch (err) {
    logger.error('Error during Administrative Sales Operator Claim Schema Migration:', err.message || err);
  }
};

module.exports = { migrateSalesOperatorClaim };
