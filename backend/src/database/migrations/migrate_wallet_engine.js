const { query, pool } = require('../../config/database');
const logger = require('../../config/logger');

const runWalletEngineMigrations = async () => {
  logger.info('Starting Wallet Engine Database Migrations...');

  try {
    // 1. Transaction Type Enum
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_transaction_type') THEN
          CREATE TYPE ledger_transaction_type AS ENUM (
            'PERSONAL_COMMISSION', 
            'TEAM_COMMISSION', 
            'REFERRAL_BONUS', 
            'CAMPAIGN_BONUS', 
            'SETTLEMENT', 
            'WITHDRAWAL', 
            'ADJUSTMENT', 
            'REVERSAL', 
            'REFUND'
          );
        END IF;
      END $$;
    `);

    // 2. Wallet Ledger Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_ledger (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        wallet_id UUID NOT NULL REFERENCES partner_wallets(id),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id),
        application_id UUID REFERENCES applications(id),
        transaction_type ledger_transaction_type NOT NULL,
        credit DECIMAL(15,2) DEFAULT 0,
        debit DECIMAL(15,2) DEFAULT 0,
        balance_after_transaction DECIMAL(15,2) DEFAULT 0,
        description VARCHAR(500),
        reference_number VARCHAR(100),
        status VARCHAR(50) DEFAULT 'completed',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 3. Commission Rules Table
    await query(`
      CREATE TABLE IF NOT EXISTS commission_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES products(id),
        partner_percentage DECIMAL(5,2) DEFAULT 90.00,
        parent_percentage DECIMAL(5,2) DEFAULT 10.00,
        campaign_bonus DECIMAL(15,2) DEFAULT 0.00,
        effective_from TIMESTAMPTZ DEFAULT NOW(),
        effective_to TIMESTAMPTZ,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 4. Wallet Withdrawals Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_withdrawals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID REFERENCES partner_profiles(id),
        amount DECIMAL(15,2) NOT NULL,
        bank_account VARCHAR(100),
        ifsc VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        requested_at TIMESTAMPTZ DEFAULT NOW(),
        approved_at TIMESTAMPTZ,
        approved_by UUID REFERENCES users(id),
        transaction_reference VARCHAR(100)
      )
    `);

    // 5. Wallet Withdrawal Events Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_withdrawal_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        withdrawal_id UUID NOT NULL REFERENCES wallet_withdrawals(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        remarks TEXT,
        changed_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    logger.info('Wallet Engine database migrations completed successfully.');
  } catch (err) {
    logger.error('Error during wallet engine migrations:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  require('dotenv').config();
  runWalletEngineMigrations().then(() => pool.end());
}

module.exports = runWalletEngineMigrations;
