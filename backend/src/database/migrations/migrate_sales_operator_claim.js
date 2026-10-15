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

    // 4. Ensure HDFC and SBI Bank assignments for Administrative Sales Executive / Operator users
    await query(`
      INSERT INTO admin_bank_assignments (admin_id, bank_id, category, is_active)
      SELECT u.id, b.id, 'credit_card', true
      FROM users u
      CROSS JOIN banks b
      WHERE (
        UPPER(COALESCE(u.designation, '')) IN ('ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES OPERATOR', 'ADMINISTRATIVE_SALES_OPERATOR')
        OR UPPER(COALESCE(u.role, '')) IN ('ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES OPERATOR', 'ADMINISTRATIVE_SALES_OPERATOR')
      )
      AND (
        (LOWER(COALESCE(b.short_code, '')) IN ('hdfc', 'sbi') OR LOWER(COALESCE(b.name, '')) LIKE '%hdfc%' OR LOWER(COALESCE(b.name, '')) LIKE '%sbi%' OR LOWER(COALESCE(b.name, '')) LIKE '%state bank of india%')
        AND LOWER(COALESCE(b.name, '')) NOT LIKE '%tata%'
        AND LOWER(COALESCE(b.short_code, '')) NOT LIKE '%tata%'
      )
      ON CONFLICT DO NOTHING
    `).catch(err => {
      logger.warn('admin_bank_assignments auto-assignment notice:', err.message);
    });

    logger.info('Administrative Sales Operator Claim Schema Migration completed successfully.');
  } catch (err) {
    logger.error('Error during Administrative Sales Operator Claim Schema Migration:', err.message || err);
  }
};

module.exports = { migrateSalesOperatorClaim };
