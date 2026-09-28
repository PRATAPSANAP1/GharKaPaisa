const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateWhatsApp = async () => {
  logger.info('[WhatsApp Migration] Starting WhatsApp tables & seed migration...');

  try {
    // 1. Extensions
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 2. WhatsApp Sender Configuration Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_sender_configs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_name VARCHAR(100) DEFAULT 'GharKaPaisa',
        display_name VARCHAR(100) DEFAULT 'GharKaPaisa Official',
        phone_number VARCHAR(50) DEFAULT '+91 92703 19438',
        phone_number_id VARCHAR(100) DEFAULT '1374538775742787',
        waba_id VARCHAR(100) DEFAULT '2311979219210283',
        meta_app_id VARCHAR(100) DEFAULT '38773576468924779',
        status VARCHAR(20) DEFAULT 'LIVE',
        is_default BOOLEAN DEFAULT TRUE,
        purpose VARCHAR(50) DEFAULT 'ALL',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure default sender config row exists
    const { rows: senderRows } = await query(`SELECT id FROM whatsapp_sender_configs LIMIT 1`);
    if (senderRows.length === 0) {
      await query(`
        INSERT INTO whatsapp_sender_configs (
          business_name, display_name, phone_number, phone_number_id, waba_id, meta_app_id, status, is_default, purpose
        ) VALUES (
          'GharKaPaisa', 'GharKaPaisa Official', '+91 92703 19438', '1374538775742787', '2311979219210283', '38773576468924779', 'LIVE', true, 'ALL'
        );
      `);
    }

    // 3. WhatsApp Settings Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_name VARCHAR(100) DEFAULT 'GharKaPaisa',
        phone_number VARCHAR(50) DEFAULT '+919999999999',
        phone_number_id VARCHAR(100) DEFAULT 'WABA_PHONE_ID',
        waba_id VARCHAR(100) DEFAULT 'WABA_ACCOUNT_ID',
        meta_app_id VARCHAR(100) DEFAULT 'META_APP_ID',
        webhook_verify_token VARCHAR(255) DEFAULT 'gharkapaisa_meta_webhook_secret_2026',
        is_live BOOLEAN DEFAULT FALSE,
        mock_mode BOOLEAN DEFAULT TRUE,
        last_webhook_at TIMESTAMPTZ,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure default row exists
    const { rows: settingRows } = await query(`SELECT id FROM whatsapp_settings LIMIT 1`);
    if (settingRows.length === 0) {
      await query(`
        INSERT INTO whatsapp_settings (
          business_name, phone_number, phone_number_id, waba_id, meta_app_id, 
          webhook_verify_token, is_live, mock_mode
        ) VALUES (
          'GharKaPaisa', '+91 92703 19438', '1374538775742787', '2311979219210283', '38773576468924779',
          'gharkapaisa_meta_webhook_secret_2026', true, false
        );
      `);
    }

    // 4. WhatsApp Consent Tracking Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_consents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        mobile VARCHAR(20) NOT NULL,
        marketing_opt_in BOOLEAN DEFAULT TRUE,
        utility_opt_in BOOLEAN DEFAULT TRUE,
        product_offer_opt_in BOOLEAN DEFAULT TRUE,
        consent_source VARCHAR(100) DEFAULT 'APPLICATION_FORM',
        consent_at TIMESTAMPTZ DEFAULT NOW(),
        opted_out_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. WhatsApp Message Identity Policies Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_message_policies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category VARCHAR(50) NOT NULL UNIQUE,
        sender_presentation VARCHAR(100) DEFAULT 'GharKaPaisa Official',
        template_header VARCHAR(100) DEFAULT 'GharKaPaisa',
        is_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed default message policies
    const defaultPolicies = [
      { category: 'KYC / Application', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' },
      { category: 'Application Status', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' },
      { category: 'Document Required', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' },
      { category: 'Approval / Decline', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' },
      { category: 'Marketing', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' },
      { category: 'Product Promotion', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' },
      { category: 'Staff Communication', sender_presentation: 'GharKaPaisa Official', template_header: 'GharKaPaisa' }
    ];

    for (const p of defaultPolicies) {
      await query(`
        INSERT INTO whatsapp_message_policies (category, sender_presentation, template_header, is_enabled)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (category) DO NOTHING;
      `, [p.category, p.sender_presentation, p.template_header]);
    }

    // 6. WhatsApp Templates Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_name VARCHAR(100) UNIQUE NOT NULL,
        meta_template_name VARCHAR(100),
        template_category VARCHAR(50) NOT NULL,
        language VARCHAR(10) DEFAULT 'en',
        meta_template_id VARCHAR(100),
        header_type VARCHAR(20) DEFAULT 'TEXT',
        header_content TEXT DEFAULT 'GharKaPaisa',
        body TEXT NOT NULL,
        footer TEXT DEFAULT 'GharKaPaisa Financial Services',
        buttons JSONB DEFAULT '[]',
        variables JSONB DEFAULT '[]',
        sample_values JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'APPROVED',
        allowed_roles JSONB DEFAULT '["SUPER_ADMIN","ADMIN","EMPLOYEE","PARTNER","TEAM_MEMBER"]',
        allowed_designations JSONB DEFAULT '[]',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. WhatsApp Messages Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_uuid VARCHAR(100) UNIQUE NOT NULL,
        sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_role VARCHAR(50),
        sender_designation VARCHAR(100),
        recipient_type VARCHAR(50) DEFAULT 'CUSTOMER',
        recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        recipient_name VARCHAR(255),
        recipient_mobile VARCHAR(20) NOT NULL,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
        application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        message_type VARCHAR(50) DEFAULT 'TEMPLATE',
        template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
        template_name VARCHAR(100),
        document_id VARCHAR(255),
        document_name VARCHAR(255),
        document_url TEXT,
        document_type VARCHAR(50),
        message_body TEXT,
        template_variables JSONB DEFAULT '{}',
        meta_message_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'SENT',
        failure_reason TEXT,
        meta_response JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        delivered_at TIMESTAMPTZ,
        read_at TIMESTAMPTZ,
        failed_at TIMESTAMPTZ
      );
    `);

    // 5. WhatsApp Delivery Events Table
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_delivery_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
        meta_message_id VARCHAR(255),
        event_type VARCHAR(50) NOT NULL,
        event_payload JSONB DEFAULT '{}',
        event_time TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Indexes for high performance
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_msg_uuid ON whatsapp_messages(message_uuid);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_msg_meta_id ON whatsapp_messages(meta_message_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_msg_sender ON whatsapp_messages(sender_user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_msg_recipient_mobile ON whatsapp_messages(recipient_mobile);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_msg_application_id ON whatsapp_messages(application_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_msg_created_at ON whatsapp_messages(created_at DESC);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_wa_deliv_meta_id ON whatsapp_delivery_events(meta_message_id);`);

    // 6. Seed Default Standard GharKaPaisa Templates
    const defaultTemplates = [
      // KYC Templates
      {
        template_name: 'kyc_document_required',
        template_category: 'kyc',
        body: 'Hello {{customer_name}}, your KYC verification for Application #{{application_id}} requires {{document_name}}. Please upload the document at your earliest convenience to proceed with approval.',
        variables: ['customer_name', 'application_id', 'document_name'],
        sample_values: { customer_name: 'Rahul Patil', application_id: 'APP-10291', document_name: 'PAN Card' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER', 'TEAM_MEMBER'],
        allowed_designations: ['KYC_OPERATOR', 'OPERATIONAL_HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'TELECALLER', 'MANAGER', 'BRANCH_HEAD']
      },
      {
        template_name: 'kyc_reminder',
        template_category: 'kyc',
        body: 'Dear {{customer_name}}, this is a gentle reminder regarding your Application #{{application_id}}. Please complete your KYC verification today to ensure timely processing of your application.',
        variables: ['customer_name', 'application_id'],
        sample_values: { customer_name: 'Rahul Patil', application_id: 'APP-10291' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER', 'TEAM_MEMBER'],
        allowed_designations: ['KYC_OPERATOR', 'OPERATIONAL_HEAD', 'ADMINISTRATIVE_OPERATOR', 'TELECALLER', 'MANAGER']
      },
      {
        template_name: 'kyc_verified',
        template_category: 'kyc',
        body: 'Congratulations {{customer_name}}! Your KYC verification for Application #{{application_id}} has been successfully verified and approved.',
        variables: ['customer_name', 'application_id'],
        sample_values: { customer_name: 'Rahul Patil', application_id: 'APP-10291' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
        allowed_designations: ['KYC_OPERATOR', 'OPERATIONAL_HEAD', 'ADMINISTRATIVE_OPERATOR']
      },

      // Application Templates
      {
        template_name: 'application_received',
        template_category: 'application',
        body: 'Hello {{customer_name}}, thank you for choosing GharKaPaisa. We have received your application for {{product_name}} (Application #{{application_id}}). Our operations team is currently reviewing your details.',
        variables: ['customer_name', 'product_name', 'application_id'],
        sample_values: { customer_name: 'Amit Sharma', product_name: 'HDFC Credit Card', application_id: 'APP-10025' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER', 'TEAM_MEMBER'],
        allowed_designations: []
      },
      {
        template_name: 'application_status_update',
        template_category: 'application',
        body: 'Dear {{customer_name}}, your Application #{{application_id}} for {{product_name}} status is now updated to: {{status}}. Remarks: {{remarks}}.',
        variables: ['customer_name', 'application_id', 'product_name', 'status', 'remarks'],
        sample_values: { customer_name: 'Amit Sharma', application_id: 'APP-10025', product_name: 'Personal Loan', status: 'In Review', remarks: 'Bank executive assigned' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER'],
        allowed_designations: ['OPERATIONAL_HEAD', 'FINAL_STATUS_OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE_OPERATOR', 'MANAGER', 'BRANCH_HEAD']
      },
      {
        template_name: 'application_approved',
        template_category: 'final_status',
        body: 'Great news {{customer_name}}! Your application #{{application_id}} for {{product_name}} has been APPROVED for amount ₹{{approved_amount}}. Thank you for partnering with GharKaPaisa.',
        variables: ['customer_name', 'application_id', 'product_name', 'approved_amount'],
        sample_values: { customer_name: 'Pooja Verma', application_id: 'APP-10492', product_name: 'Personal Loan', approved_amount: '3,50,000' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN'],
        allowed_designations: ['OPERATIONAL_HEAD', 'FINAL_STATUS_OPERATOR']
      },
      {
        template_name: 'application_rejected',
        template_category: 'final_status',
        body: 'Dear {{customer_name}}, we regret to inform you that Application #{{application_id}} could not be approved at this time. Reason: {{rejection_reason}}. You may re-apply after 90 days.',
        variables: ['customer_name', 'application_id', 'rejection_reason'],
        sample_values: { customer_name: 'Pooja Verma', application_id: 'APP-10492', rejection_reason: 'CIBIL score below policy requirement' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN'],
        allowed_designations: ['OPERATIONAL_HEAD', 'FINAL_STATUS_OPERATOR']
      },

      // PAN Checker Templates
      {
        template_name: 'pan_verification_failed',
        template_category: 'kyc',
        body: 'Hello {{customer_name}}, the PAN details provided ({{pan_masked}}) for Application #{{application_id}} could not be verified. Please provide a clear copy of your valid PAN card.',
        variables: ['customer_name', 'pan_masked', 'application_id'],
        sample_values: { customer_name: 'Suresh Raina', pan_masked: 'ABCD******', application_id: 'APP-10882' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN'],
        allowed_designations: ['PAN_CHECKER', 'OPERATIONAL_HEAD', 'ADMINISTRATIVE_OPERATOR']
      },

      // QD Operator Templates
      {
        template_name: 'qd_requirement',
        template_category: 'qd',
        body: 'Dear {{customer_name}}, your Quick Decision (QD) process for Application #{{application_id}} requires the following: {{qd_requirement_details}}. Please coordinate with our representative.',
        variables: ['customer_name', 'application_id', 'qd_requirement_details'],
        sample_values: { customer_name: 'Vikas Gupta', application_id: 'APP-10993', qd_requirement_details: 'Latest 3 months bank statement with salary credits' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN'],
        allowed_designations: ['QD_OPERATOR', 'OPERATIONAL_HEAD']
      },

      // Lead & Followup
      {
        template_name: 'lead_followup',
        template_category: 'lead',
        body: 'Hello {{customer_name}}, thank you for your interest in {{product_name}} with GharKaPaisa. Click here to complete your application: {{application_link}} or reply to this message for any assistance.',
        variables: ['customer_name', 'product_name', 'application_link'],
        sample_values: { customer_name: 'Rohan Joshi', product_name: 'Credit Card', application_link: 'https://gharkapaisa.in/apply/hdfc-card' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER', 'TEAM_MEMBER'],
        allowed_designations: ['ADMINISTRATIVE_SALES_EXECUTIVE', 'TELECALLER', 'MANAGER', 'TEAM_LEADER', 'BRANCH_HEAD']
      },

      // Document Sharing Template
      {
        template_name: 'document_shared',
        template_category: 'application',
        body: 'Dear {{customer_name}}, please find attached your official {{document_type}} for Application #{{application_id}} from GharKaPaisa.',
        variables: ['customer_name', 'document_type', 'application_id'],
        sample_values: { customer_name: 'Rahul Patil', document_type: 'Sanction Letter', application_id: 'APP-10291' },
        allowed_roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER'],
        allowed_designations: ['OPERATIONAL_HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'BRANCH_HEAD', 'MANAGER']
      }
    ];

    for (const tpl of defaultTemplates) {
      await query(`
        INSERT INTO whatsapp_templates (
          template_name, template_category, body, variables, sample_values, 
          status, allowed_roles, allowed_designations
        ) VALUES ($1, $2, $3, $4, $5, 'APPROVED', $6, $7)
        ON CONFLICT (template_name) DO UPDATE SET
          template_category = $2,
          body = $3,
          variables = $4,
          sample_values = $5,
          allowed_roles = $6,
          allowed_designations = $7,
          updated_at = NOW();
      `, [
        tpl.template_name,
        tpl.template_category,
        tpl.body,
        JSON.stringify(tpl.variables),
        JSON.stringify(tpl.sample_values),
        JSON.stringify(tpl.allowed_roles),
        JSON.stringify(tpl.allowed_designations)
      ]);
    }

    logger.info(`[WhatsApp Migration] Successfully migrated WhatsApp tables & ${defaultTemplates.length} default templates.`);
    return { success: true };
  } catch (err) {
    logger.error('[WhatsApp Migration] Error:', err);
    throw err;
  }
};

if (require.main === module) {
  migrateWhatsApp()
    .then(() => {
      console.log('WhatsApp migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('WhatsApp migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateWhatsApp };
