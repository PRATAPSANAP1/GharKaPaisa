const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateBulkSms = async () => {
  logger.info('[Bulk SMS Migration] Starting Bulk SMS tables and seed migration...');

  try {
    // 1. UUID Extension (optional/defensive)
    try {
      await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    } catch (extErr) {
      logger.warn('[Bulk SMS Migration] Extension uuid-ossp note:', extErr.message);
    }

    // 2. SMS Templates Table
    await query(`
      CREATE TABLE IF NOT EXISTS sms_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(50) DEFAULT 'MSG91',
        provider_template_id VARCHAR(100) NOT NULL UNIQUE,
        sender_id VARCHAR(50) NOT NULL DEFAULT 'GHARKP',
        content TEXT NOT NULL,
        template_type VARCHAR(50) DEFAULT 'Promotional',
        approval_status VARCHAR(50) DEFAULT 'APPROVED',
        variables JSONB DEFAULT '[]',
        preview_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Bulk SMS Campaigns Table
    await query(`
      CREATE TABLE IF NOT EXISTS bulk_sms_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        campaign_name VARCHAR(255) NOT NULL,
        template_id VARCHAR(255) REFERENCES sms_templates(id) ON DELETE SET NULL,
        sender_id VARCHAR(50) NOT NULL DEFAULT 'GHARKP',
        status VARCHAR(50) DEFAULT 'DRAFT',
        total_recipients INT DEFAULT 0,
        valid_recipients INT DEFAULT 0,
        invalid_recipients INT DEFAULT 0,
        duplicate_recipients INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        delivered_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        pending_count INT DEFAULT 0,
        file_name VARCHAR(255),
        file_size INT DEFAULT 0,
        scheduled_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_by VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Bulk SMS Recipients Table
    await query(`
      CREATE TABLE IF NOT EXISTS bulk_sms_recipients (
        id VARCHAR(255) PRIMARY KEY,
        campaign_id VARCHAR(255) NOT NULL REFERENCES bulk_sms_campaigns(id) ON DELETE CASCADE,
        mobile_number VARCHAR(30) NOT NULL,
        normalized_mobile_number VARCHAR(30) NOT NULL,
        recipient_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'QUEUED',
        variables JSONB DEFAULT '{}',
        msg91_message_id VARCHAR(100),
        sent_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        failure_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_bulk_sms_campaigns_created_at ON bulk_sms_campaigns(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bulk_sms_campaigns_status ON bulk_sms_campaigns(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bulk_sms_recipients_campaign ON bulk_sms_recipients(campaign_id, status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bulk_sms_recipients_mobile ON bulk_sms_recipients(normalized_mobile_number)`);

    // 6. Seed Standard Approved Templates
    const defaultTemplates = [
      {
        id: 'tpl-hdfc-loan-001',
        name: 'HDFC Pre-Approved Loan',
        provider: 'MSG91',
        provider_template_id: '6a8b2b479cac2288a3094b42',
        sender_id: 'GHARKP',
        content: `Hello! Greetings from HDFC BANK.\n\nYou have a pre-approved loan on your credit card with instant disbursal in 10 seconds.\n\nHow much loan amount are you looking for?\n\nApply Here: https://gharkapaisa.com/apply\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
        template_type: 'Promotional',
        approval_status: 'APPROVED',
        variables: JSON.stringify(['customer_name', 'loan_amount', 'bank_name']),
        preview_url: 'https://gharkapaisa.com/apply',
      },
      {
        id: 'tpl-gkp-personal-002',
        name: 'GharKaPaisa Instant Personal Loan',
        provider: 'MSG91',
        provider_template_id: '6a8b2ba19aad595e3402bb84',
        sender_id: 'GHARKP',
        content: `Dear {{customer_name}}, congratulations! You are eligible for an instant personal loan up to Rs. {{loan_amount}} at lowest interest rates from GharKaPaisa partner banks.\n\nCheck offer & apply: https://gharkapaisa.com/loans\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
        template_type: 'Promotional',
        approval_status: 'APPROVED',
        variables: JSON.stringify(['customer_name', 'loan_amount']),
        preview_url: 'https://gharkapaisa.com/loans',
      },
      {
        id: 'tpl-cards-preapproved-003',
        name: 'SBI & HDFC Credit Card Pre-Approved',
        provider: 'MSG91',
        provider_template_id: '6a8b2c5e05a2ec7fac0b3909',
        sender_id: 'GHARKP',
        content: `Hi {{customer_name}}, get Lifetime Free Credit Card with zero joining fee, instant approval & exclusive rewards.\n\nApply now: https://gharkapaisa.com/cards\n\nYOHESA MARKETING CONSULTATION PRIVATE LIMITED`,
        template_type: 'Promotional',
        approval_status: 'APPROVED',
        variables: JSON.stringify(['customer_name']),
        preview_url: 'https://gharkapaisa.com/cards',
      },
    ];

    for (const t of defaultTemplates) {
      await query(
        `INSERT INTO sms_templates (
          id, name, provider, provider_template_id, sender_id, content, template_type, approval_status, variables, preview_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (provider_template_id) DO UPDATE SET
          name = EXCLUDED.name,
          content = EXCLUDED.content,
          sender_id = EXCLUDED.sender_id,
          variables = EXCLUDED.variables,
          approval_status = EXCLUDED.approval_status,
          updated_at = NOW();
      `,
        [
          t.id,
          t.name,
          t.provider,
          t.provider_template_id,
          t.sender_id,
          t.content,
          t.template_type,
          t.approval_status,
          t.variables,
          t.preview_url,
        ]
      );
    }

    logger.info('[Bulk SMS Migration] Migration completed successfully.');
    return true;
  } catch (err) {
    logger.error('[Bulk SMS Migration] Migration error:', err.message);
    throw err;
  }
};

if (require.main === module) {
  migrateBulkSms()
    .then(() => {
      logger.info('Migration complete');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateBulkSms;
