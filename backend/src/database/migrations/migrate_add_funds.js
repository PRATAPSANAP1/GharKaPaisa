const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateAddFunds = async () => {
  logger.info('Running Add Funds & Razorpay Bank Verification migration...');
  try {
    // 1. Table for Razorpay Add Funds requests
    await query(`
      CREATE TABLE IF NOT EXISTS razorpay_fund_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        amount DECIMAL(15,2) NOT NULL,
        requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        reference_number VARCHAR(100),
        notes TEXT,
        reconciled_at TIMESTAMPTZ,
        reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add indexes for fund requests
    await query(`CREATE INDEX IF NOT EXISTS idx_rfr_requested_by ON razorpay_fund_requests(requested_by);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_rfr_status ON razorpay_fund_requests(status);`);

    // 2. Add columns to partner_bank_details for Razorpay Contact & Fund Account & Validation Status
    await query(`ALTER TABLE partner_bank_details ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(100);`);
    await query(`ALTER TABLE partner_bank_details ADD COLUMN IF NOT EXISTS razorpay_fund_account_id VARCHAR(100);`);
    await query(`ALTER TABLE partner_bank_details ADD COLUMN IF NOT EXISTS validation_id VARCHAR(100);`);
    await query(`ALTER TABLE partner_bank_details ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'UNVERIFIED';`);
    
    // 3. Add column to partner_profiles for Razorpay Contact ID
    await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(100);`);

    logger.info('Add Funds & Razorpay Bank Verification migration completed successfully.');
  } catch (err) {
    logger.error('Error running Add Funds migration:', err);
    throw err;
  }
};

if (require.main === module) {
  migrateAddFunds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migrateAddFunds;
