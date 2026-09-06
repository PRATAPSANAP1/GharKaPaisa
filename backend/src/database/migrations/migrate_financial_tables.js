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
