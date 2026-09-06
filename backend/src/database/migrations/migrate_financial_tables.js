const { query } = require('../../config/database');
const logger = require('../../utils/logger');

async function migrateFinancialTables() {
  console.log('[MIGRATION] Running financial engine tables migration...');

  // 1. razorpay_processed_payments (Idempotency tracking for top-ups)
  await query(`
    CREATE TABLE IF NOT EXISTS razorpay_processed_payments (
      payment_id VARCHAR(100) PRIMARY KEY,
      order_id VARCHAR(100) NOT NULL,
      partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
      amount NUMERIC(15,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'COMPLETED',
      processed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. razorpay_webhook_events (Stateful webhook deduplication & recovery)
  await query(`
    CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
      event_id VARCHAR(100) PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
      error_message TEXT,
      received_at TIMESTAMPTZ DEFAULT NOW(),
      processed_at TIMESTAMPTZ
    );
  `);

  // Index for fast lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_webhook_events_status_received 
    ON razorpay_webhook_events(status, received_at);
  `);

  // 3. Ensure ledger_transaction_type ENUM values exist for append-only operations
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_transaction_type') THEN
        ALTER TYPE ledger_transaction_type ADD VALUE IF NOT EXISTS 'COMMISSION_REJECTED';
        ALTER TYPE ledger_transaction_type ADD VALUE IF NOT EXISTS 'WITHDRAWAL_HOLD';
        ALTER TYPE ledger_transaction_type ADD VALUE IF NOT EXISTS 'WITHDRAWAL_SETTLED';
        ALTER TYPE ledger_transaction_type ADD VALUE IF NOT EXISTS 'WITHDRAWAL_CANCELLED';
      END IF;
    END $$;
  `);

  // 4. Unique Partial Indexes for Immutable Ledger Idempotency
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_commission_release_reference
    ON wallet_ledger (transaction_type, reference_number)
    WHERE transaction_type = 'COMMISSION_RELEASE' AND reference_number IS NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_commission_rejected_reference
    ON wallet_ledger (transaction_type, reference_number)
    WHERE transaction_type = 'COMMISSION_REJECTED' AND reference_number IS NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_withdrawal_settled_reference
    ON wallet_ledger (transaction_type, reference_number)
    WHERE transaction_type = 'WITHDRAWAL_SETTLED' AND reference_number IS NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_withdrawal_cancelled_reference
    ON wallet_ledger (transaction_type, reference_number)
    WHERE transaction_type = 'WITHDRAWAL_CANCELLED' AND reference_number IS NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_reversal_reference
    ON wallet_ledger (transaction_type, reference_number)
    WHERE transaction_type = 'REVERSAL' AND reference_number IS NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_commission_credit_app_partner
    ON wallet_ledger (application_id, partner_id, transaction_type)
    WHERE transaction_type IN ('PERSONAL_COMMISSION', 'TEAM_COMMISSION', 'REFERRAL_BONUS', 'OVERRIDE_COMMISSION')
      AND application_id IS NOT NULL;
  `);

  // 5. Commission Decisions Table (Strict Primary Key Gate for One Final Decision Per Commission)
  await query(`
    CREATE TABLE IF NOT EXISTS commission_decisions (
      commission_ledger_id UUID PRIMARY KEY REFERENCES wallet_ledger(id) ON DELETE RESTRICT,
      decision VARCHAR(30) NOT NULL CHECK (decision IN ('RELEASED', 'REJECTED')),
      decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
      decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      remarks TEXT
    );
  `);

  console.log('[MIGRATION COMPLETE] Financial engine tables migrated successfully.');
}

if (require.main === module) {
  migrateFinancialTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateFinancialTables;
