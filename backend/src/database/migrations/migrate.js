const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

// Helper to add an enum value idempotently
async function addEnumValue(typeName, valName) {
  try {
    const { rows } = await query(`
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = $1 AND e.enumlabel = $2
    `, [typeName, valName]);
    if (rows.length === 0) {
      await query(`ALTER TYPE ${typeName} ADD VALUE '${valName}'`);
      logger.info(`Added enum value '${valName}' to type '${typeName}'`);
    }
  } catch (err) {
    logger.error(`Failed to add enum value '${valName}' to type '${typeName}':`, err);
  }
}

// Helper to rename an enum value idempotently
async function renameEnumValue(typeName, oldVal, newVal) {
  try {
    const { rows: oldRows } = await query(`
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = $1 AND e.enumlabel = $2
    `, [typeName, oldVal]);
    
    const { rows: newRows } = await query(`
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = $1 AND e.enumlabel = $2
    `, [typeName, newVal]);

    if (oldRows.length > 0 && newRows.length === 0) {
      await query(`ALTER TYPE ${typeName} RENAME VALUE '${oldVal}' TO '${newVal}'`);
      logger.info(`Renamed enum value '${oldVal}' to '${newVal}' in type '${typeName}'`);
    }
  } catch (err) {
    logger.error(`Failed to rename enum value from '${oldVal}' to '${newVal}' in type '${typeName}':`, err);
  }
}

const migrate = async () => {
  logger.info('Running migrations...');

  // ── Extensions ────────────────────────────────────────────────
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  // ── ENUM types ────────────────────────────────────────────────
  await query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','ADMIN','EMPLOYEE','PARTNER');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await renameEnumValue('user_role', 'super_admin', 'SUPER_ADMIN');
  await renameEnumValue('user_role', 'admin', 'ADMIN');
  await renameEnumValue('user_role', 'employee', 'EMPLOYEE');
  await renameEnumValue('user_role', 'Partner', 'PARTNER');
  try { await query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'PARTNER'`); } catch (err) {}
  await query(`
    DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('pending','active','suspended','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await addEnumValue('user_status', 'inactive');
  await addEnumValue('user_status', 'pending_verification');
  await addEnumValue('user_status', 'blocked');
  await query(`
    DO $$ BEGIN
      CREATE TYPE kyc_status AS ENUM ('pending','under_review','approved','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await query(`
    DO $$ BEGIN
      CREATE TYPE application_status AS ENUM ('draft','submitted','under_review','approved','rejected','disbursed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await addEnumValue('application_status', 'confirmed');
  await query(`
    DO $$ BEGIN
      CREATE TYPE product_category AS ENUM ('credit_card','personal_loan','home_loan','business_loan',
        'instant_loan','used_car_loan','education_loan','lac','health_insurance',
        'life_insurance','general_insurance','fd_card','co_branded_card','investment','card_on_loan');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await addEnumValue('product_category', 'card_on_loan');
  await query(`
    DO $$ BEGIN
      CREATE TYPE wallet_txn_type AS ENUM ('credit','debit');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await query(`
    DO $$ BEGIN
      CREATE TYPE wallet_txn_status AS ENUM ('pending','approved','rejected','processed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await query(`
    DO $$ BEGIN
      CREATE TYPE commission_status AS ENUM ('pending','approved','rejected','processed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await query(`
    DO $$ BEGIN
      CREATE TYPE withdrawal_status AS ENUM ('pending','approved','processed','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);

  // Create sequence for Partner code generation
  await query(`CREATE SEQUENCE IF NOT EXISTS partner_code_seq START 1000`);
  await query(`CREATE SEQUENCE IF NOT EXISTS app_number_seq START 10000`);

  // ── Users (all roles) ─────────────────────────────────────────────────────
  // firebase_uid is the primary identity — email/mobile may be null for
  // phone-only or email-only Firebase accounts.
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      firebase_uid  VARCHAR(255) UNIQUE,
      email         VARCHAR(255) UNIQUE,
      mobile        VARCHAR(15)  UNIQUE,
      role          user_role NOT NULL DEFAULT 'PARTNER',
      status        user_status NOT NULL DEFAULT 'pending',
      password_hash VARCHAR(255),
      full_name     VARCHAR(255),
      employee_id   VARCHAR(50) UNIQUE,
      department    VARCHAR(100),
      designation   VARCHAR(100),
      is_active     BOOLEAN DEFAULT TRUE,
      created_by    UUID REFERENCES users(id),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    )
  `);

  // ── Firebase Auth migration ──────────────────────────────────────────────
  // Drop legacy OTP table (no longer needed — Firebase handles OTP)
  await query(`DROP TABLE IF EXISTS otps CASCADE`);

  // Add firebase_uid for Firebase Auth integration (idempotent)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid) WHERE firebase_uid IS NOT NULL`);

  // Add new schema columns dynamically if table exists (idempotent)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100)`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE`);

  // Table to track emails pre-verified via registration OTP
  await query(`
    CREATE TABLE IF NOT EXISTS pre_verified_emails (
      email VARCHAR(255) PRIMARY KEY,
      verified_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Drop password_hash — Firebase handles all credentials (idempotent)
  // await query(`ALTER TABLE users DROP COLUMN IF EXISTS password_hash`);

  // ── Partner Profiles ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS partner_profiles (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      partner_code        VARCHAR(20) UNIQUE NOT NULL,
      first_name        VARCHAR(100) NOT NULL,
      last_name         VARCHAR(100) NOT NULL,
      profile_photo_url VARCHAR(500),
      current_address   TEXT,
      business_location TEXT,
      company_name      VARCHAR(255),
      company_type      VARCHAR(100),
      gst_number        VARCHAR(20),
      pincode           VARCHAR(10),
      kyc_status        kyc_status DEFAULT 'pending',
      approved_by       UUID REFERENCES users(id),
      approved_at       TIMESTAMPTZ,
      rejection_reason  TEXT,
      aadhar_url        VARCHAR(500),
      pan_url           VARCHAR(500),
      gst_cert_url      VARCHAR(500),
      cancel_cheque_url VARCHAR(500),
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);
  await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS parent_partner_id UUID REFERENCES partner_profiles(id)`);


  // ── Partner Bank Details ────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS partner_bank_details (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id            UUID UNIQUE NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
      bank_name           VARCHAR(100) NOT NULL,
      account_number      VARCHAR(255) NOT NULL,
      ifsc_code           VARCHAR(15) NOT NULL,
      account_holder_name VARCHAR(255) NOT NULL,
      is_verified         BOOLEAN DEFAULT FALSE,
      verified_at         TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE partner_bank_details ALTER COLUMN account_number TYPE VARCHAR(255)`);

  // ── Database Schema Alignment (Migrate agent tables/columns to partner) ──
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agent_profiles') THEN
        INSERT INTO partner_profiles (id, user_id, partner_code, first_name, last_name, profile_photo_url, current_address, business_location, company_name, company_type, gst_number, kyc_status, approved_by, approved_at, rejection_reason, created_at, updated_at)
        SELECT id, user_id, agent_code, first_name, last_name, profile_photo_url, current_address, business_location, company_name, company_type, gst_number, kyc_status, approved_by, approved_at, rejection_reason, created_at, updated_at
        FROM agent_profiles
        ON CONFLICT (id) DO NOTHING;
        
        DROP TABLE agent_profiles CASCADE;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agent_bank_details') THEN
        INSERT INTO partner_bank_details (id, partner_id, bank_name, account_number, ifsc_code, account_holder_name, is_verified, verified_at, created_at, updated_at)
        SELECT id, agent_id, bank_name, account_number, ifsc_code, account_holder_name, is_verified, verified_at, created_at, updated_at
        FROM agent_bank_details
        ON CONFLICT (id) DO NOTHING;
        
        DROP TABLE agent_bank_details CASCADE;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='agent_id') THEN
        ALTER TABLE applications RENAME COLUMN agent_id TO partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='agent_id') THEN
        ALTER TABLE withdrawal_requests RENAME COLUMN agent_id TO partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='agent_id') THEN
        ALTER TABLE wallets RENAME COLUMN agent_id TO partner_id;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partner_wallets' AND column_name='agent_id') THEN
        ALTER TABLE partner_wallets RENAME COLUMN agent_id TO partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commission_structures' AND column_name='agent_id') THEN
        ALTER TABLE commission_structures RENAME COLUMN agent_id TO partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_documents' AND column_name='agent_id') THEN
        ALTER TABLE kyc_documents RENAME COLUMN agent_id TO partner_id;
      END IF;
    END $$;
  `);

  // ── KYC Documents ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS kyc_documents (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id      UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
      doc_type      VARCHAR(50) NOT NULL,  -- aadhaar, pan, gst_cert, cancelled_cheque
      doc_number    VARCHAR(50),
      file_url      VARCHAR(500) NOT NULL,
      s3_key        VARCHAR(500) NOT NULL,
      verified      BOOLEAN DEFAULT FALSE,
      verified_by   UUID REFERENCES users(id),
      verified_at   TIMESTAMPTZ,
      uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(partner_id, doc_type)
    )
  `);

  // ── Banks ─────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS banks (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name       VARCHAR(100) UNIQUE NOT NULL,
      short_code VARCHAR(20) UNIQUE NOT NULL,
      logo_url   VARCHAR(500),
      is_active  BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE banks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active'
  `);

  // ── Products ──────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      bank_id          UUID NOT NULL REFERENCES banks(id),
      name             VARCHAR(255) NOT NULL,
      category         product_category NOT NULL,
      description      TEXT,
      features         JSONB DEFAULT '[]',
      eligibility      JSONB DEFAULT '{}',
      commission_type  VARCHAR(20) DEFAULT 'fixed',  -- fixed | percentage
      commission_value DECIMAL(12,2) NOT NULL DEFAULT 0,
      min_age          INT,
      max_age          INT,
      min_income       DECIMAL(15,2),
      is_active        BOOLEAN DEFAULT TRUE,
      display_order    INT DEFAULT 0,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active'`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS annual_fee VARCHAR(255)`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS time_period VARCHAR(255)`);

  // ── Commission Structure (overrides per Partner/product) ────────
  await query(`
    CREATE TABLE IF NOT EXISTS commission_structures (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id       UUID NOT NULL REFERENCES products(id),
      partner_id         UUID REFERENCES partner_profiles(id),  -- NULL = global default
      commission_type  VARCHAR(20) DEFAULT 'fixed',
      commission_value DECIMAL(12,2) NOT NULL,
      effective_from   DATE NOT NULL DEFAULT CURRENT_DATE,
      effective_to     DATE,
      created_by       UUID NOT NULL REFERENCES users(id),
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Customers ────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS customers (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      full_name    VARCHAR(255) NOT NULL,
      mobile       VARCHAR(15) NOT NULL,
      email        VARCHAR(255),
      dob          DATE,
      pan_number   VARCHAR(12),
      aadhaar_last4 VARCHAR(4),
      city         VARCHAR(100),
      state        VARCHAR(100),
      pincode      VARCHAR(10),
      monthly_income DECIMAL(15,2),
      employer     VARCHAR(255),
      employment_type VARCHAR(50),  -- salaried | self_employed | business
      created_by   UUID NOT NULL REFERENCES users(id),
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Applications ─────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS applications (
      id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      app_number         VARCHAR(20) UNIQUE NOT NULL,
      customer_id        UUID NOT NULL REFERENCES customers(id),
      product_id         UUID NOT NULL REFERENCES products(id),
      partner_id           UUID NOT NULL REFERENCES partner_profiles(id),
      submitted_by       UUID NOT NULL REFERENCES users(id),
      status             application_status DEFAULT 'submitted',
      bank_ref_number    VARCHAR(100),
      loan_amount        DECIMAL(15,2),
      approved_amount    DECIMAL(15,2),
      credit_limit       DECIMAL(15,2),
      interest_rate      DECIMAL(5,2),
      tenure_months      INT,
      disbursal_date     DATE,
      rejection_reason   TEXT,
      notes              TEXT,
      documents          JSONB DEFAULT '[]',
      status_history     JSONB DEFAULT '[]',
      commission_amount  DECIMAL(12,2),
      commission_status  commission_status DEFAULT 'pending',
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Migrate existing commission_status column if needed
  await query(`
    DO $$ BEGIN
      ALTER TABLE applications ALTER COLUMN commission_status TYPE commission_status USING commission_status::text::commission_status;
    EXCEPTION WHEN OTHERS THEN NULL; END $$
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_applications_Partner ON applications(partner_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_customer ON applications(customer_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_product ON applications(product_id)`);

  // ── Wallet ────────────────────────────────────────────────────
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='pending_amount') THEN
        ALTER TABLE wallets RENAME COLUMN pending_amount TO hold_balance;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partner_wallets' AND column_name='pending_amount') THEN
        ALTER TABLE partner_wallets RENAME COLUMN pending_amount TO hold_balance;
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS partner_wallets (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id          UUID UNIQUE NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
      total_earned      DECIMAL(15,2) DEFAULT 0,
      total_withdrawn   DECIMAL(15,2) DEFAULT 0,
      hold_balance      DECIMAL(15,2) DEFAULT 0,
      available_balance DECIMAL(15,2) DEFAULT 0,
      last_updated      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Wallet Transactions ───────────────────────────────────────
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='txn_type') THEN
        ALTER TABLE wallet_transactions RENAME COLUMN txn_type TO type;
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      wallet_id      UUID NOT NULL REFERENCES partner_wallets(id),
      partner_id     UUID REFERENCES partner_profiles(id),
      application_id UUID REFERENCES applications(id),
      type           VARCHAR(20) NOT NULL,
      amount         DECIMAL(12,2) NOT NULL,
      balance_before DECIMAL(15,2),
      balance_after  DECIMAL(15,2),
      status         VARCHAR(20) DEFAULT 'pending',
      description    VARCHAR(500),
      reference_type VARCHAR(100),
      reference_id   VARCHAR(255),
      bank_name      VARCHAR(100),
      product_type   VARCHAR(100),
      processed_by   UUID REFERENCES users(id),
      processed_at   TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet ON wallet_transactions(wallet_id)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partner_profiles(id)`);
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_transactions' AND column_name='txn_type') THEN
        ALTER TABLE wallet_transactions RENAME COLUMN txn_type TO type;
      END IF;
    END $$;
  `);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20)`);
  await query(`ALTER TABLE wallet_transactions ALTER COLUMN type TYPE VARCHAR(20)`);
  await query(`ALTER TABLE wallet_transactions ALTER COLUMN status TYPE VARCHAR(20)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(100)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS product_type VARCHAR(100)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS balance_before DECIMAL(15,2)`);
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2)`);

  // ── Withdrawal Requests ───────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      wallet_id       UUID NOT NULL REFERENCES partner_wallets(id),
      partner_id        UUID NOT NULL REFERENCES partner_profiles(id),
      amount          DECIMAL(12,2) NOT NULL,
      status          VARCHAR(20) DEFAULT 'pending',
      bank_name       VARCHAR(100),
      account_number  VARCHAR(50),
      ifsc_code       VARCHAR(15),
      utr_number      VARCHAR(50),
      processed_by    UUID REFERENCES users(id),
      processed_at    TIMESTAMPTZ,
      rejection_reason TEXT,
      admin_note      TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE withdrawal_requests ALTER COLUMN status TYPE VARCHAR(20)`);
  await query(`ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS admin_note TEXT`);

  // ── Notifications ─────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      VARCHAR(255) NOT NULL,
      message    TEXT NOT NULL,
      type       VARCHAR(50) DEFAULT 'info',  -- info|success|warning|alert
      is_read    BOOLEAN DEFAULT FALSE,
      link       VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`);

  // ── Refresh Tokens ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked    BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Leads ─────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS leads (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id    UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
      product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_name VARCHAR(255) NOT NULL,
      mobile        VARCHAR(15) NOT NULL,
      city          VARCHAR(100),
      status        VARCHAR(50) DEFAULT 'pending',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_leads_partner ON leads(partner_id)`);
  // ── Lead Followups ─────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS lead_followups (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      scheduled_by  UUID NOT NULL REFERENCES users(id),
      follow_up_at  TIMESTAMPTZ NOT NULL,
      note          TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_lead_followups_lead ON lead_followups(lead_id)`);

  await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_customers_pan ON customers(pan_number)`);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_bank_name ON products(bank_id, name)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_txn_status ON wallet_transactions(status) WHERE status = 'pending'`);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_txn_release ON wallet_transactions(release_at) WHERE status = 'pending'`);
  await query(`CREATE INDEX IF NOT EXISTS idx_withdrawal_partner ON withdrawal_requests(partner_id, status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_partner_code ON partner_profiles(partner_code)`);

  // ── Audit Logs ────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
      action        VARCHAR(100) NOT NULL,
      target_id     UUID,
      details       JSONB,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS role VARCHAR(50)`);
  await query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`);

  // ── Wallet Audit Logs ─────────────────────────────────────────
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_audit_logs' AND column_name='old_pending_amount') THEN
        ALTER TABLE wallet_audit_logs RENAME COLUMN old_pending_amount TO old_hold_balance;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallet_audit_logs' AND column_name='new_pending_amount') THEN
        ALTER TABLE wallet_audit_logs RENAME COLUMN new_pending_amount TO new_hold_balance;
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS wallet_audit_logs (
      id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      wallet_id              UUID NOT NULL REFERENCES partner_wallets(id) ON DELETE CASCADE,
      action                 VARCHAR(50) NOT NULL,
      old_available_balance  DECIMAL(15,2),
      new_available_balance  DECIMAL(15,2),
      old_hold_balance       DECIMAL(15,2),
      new_hold_balance       DECIMAL(15,2),
      created_at             TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_created_at ON wallet_audit_logs(created_at DESC)`);

  // Fix FK constraint if it references old 'wallets' table instead of 'partner_wallets'
  await query(`
    DO $$
    DECLARE
      ref_table TEXT;
    BEGIN
      SELECT ccu.table_name INTO ref_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'wallet_audit_logs' AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name = 'wallet_audit_logs_wallet_id_fkey';

      IF ref_table IS NOT NULL AND ref_table <> 'partner_wallets' THEN
        ALTER TABLE wallet_audit_logs DROP CONSTRAINT wallet_audit_logs_wallet_id_fkey;
        -- Remove orphaned audit rows whose wallet_id doesn't exist in partner_wallets
        DELETE FROM wallet_audit_logs WHERE wallet_id NOT IN (SELECT id FROM partner_wallets);
        ALTER TABLE wallet_audit_logs ADD CONSTRAINT wallet_audit_logs_wallet_id_fkey
          FOREIGN KEY (wallet_id) REFERENCES partner_wallets(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed wallet_audit_logs FK to point to partner_wallets (orphaned rows cleaned)';
      END IF;
    END $$;
  `);

  // ── Wallet Trigger Function ───────────────────────────────────
  await query(`
    CREATE OR REPLACE FUNCTION log_wallet_changes()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO wallet_audit_logs (wallet_id, action, old_available_balance, new_available_balance, old_hold_balance, new_hold_balance)
        VALUES (NEW.id, 'INSERT', NULL, NEW.available_balance, NULL, NEW.hold_balance);
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.available_balance <> NEW.available_balance OR OLD.hold_balance <> NEW.hold_balance THEN
          INSERT INTO wallet_audit_logs (wallet_id, action, old_available_balance, new_available_balance, old_hold_balance, new_hold_balance)
          VALUES (NEW.id, 'UPDATE', OLD.available_balance, NEW.available_balance, OLD.hold_balance, NEW.hold_balance);
        END IF;
      ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO wallet_audit_logs (wallet_id, action, old_available_balance, new_available_balance, old_hold_balance, new_hold_balance)
        VALUES (OLD.id, 'DELETE', OLD.available_balance, NULL, OLD.hold_balance, NULL);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await query(`DROP TRIGGER IF EXISTS audit_wallet_trigger ON partner_wallets`);
  await query(`
    CREATE TRIGGER audit_wallet_trigger
    AFTER INSERT OR UPDATE OR DELETE ON partner_wallets
    FOR EACH ROW EXECUTE FUNCTION log_wallet_changes()
  `);

  // ── updated_at trigger function ───────────────────────────────
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `);
  const triggerTables = ['users', 'partner_profiles', 'partner_bank_details', 'products', 'customers', 'applications', 'withdrawal_requests', 'leads'];
  for (const t of triggerTables) {
    await query(`DROP TRIGGER IF EXISTS set_updated_at ON ${t}`);
    await query(`
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON ${t}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
  }

  // Seed super admins only when SUPER_ADMIN_SEED_PASSWORD is explicitly configured
  const seedPassword = process.env.SUPER_ADMIN_SEED_PASSWORD;
  const resetPassword = process.env.SUPER_ADMIN_RESET_PASSWORD === 'true';

  const parseSuperAdminSeeds = () => {
    const raw = process.env.SUPER_ADMIN_SEEDS;
    if (!raw) {
      return [
        { email: 'sharadyohesa@gmail.com', mobile: '8087179438', name: 'Sharad Yohesa' },
        { email: 'pratapsanap14@gmail.com', mobile: '9370470692', name: 'Pratap Sanap' },
      ];
    }
    return raw.split(',').map((entry) => {
      const [email, mobile, name] = entry.trim().split(':');
      return { email: email?.trim(), mobile: mobile?.trim(), name: name?.trim() };
    }).filter((admin) => admin.email && admin.mobile && admin.name);
  };

  if (!seedPassword) {
    logger.warn('SUPER_ADMIN_SEED_PASSWORD not set — skipping super admin seed (existing accounts unchanged).');
  } else {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(seedPassword, 10);
    const superAdmins = parseSuperAdminSeeds();

    for (const admin of superAdmins) {
      const { rows: [existing] } = await query(`SELECT id FROM users WHERE email = $1`, [admin.email]);
      if (!existing) {
        await query(`
          INSERT INTO users (email, mobile, role, status, full_name, password_hash, is_active, email_verified)
          VALUES ($1, $2, 'SUPER_ADMIN', 'active', $3, $4, true, true)
        `, [admin.email, admin.mobile, admin.name, hashedPassword]);
        logger.info(`Super admin seeded: ${admin.email}`);
      } else if (resetPassword) {
        await query(`
          UPDATE users
          SET role = 'SUPER_ADMIN', status = 'active', is_active = true, full_name = $1,
              mobile = $2, password_hash = $3, email_verified = true
          WHERE email = $4
        `, [admin.name, admin.mobile, hashedPassword, admin.email]);
        logger.info(`Super admin password reset: ${admin.email}`);
      } else {
        await query(`
          UPDATE users
          SET role = 'SUPER_ADMIN', status = 'active', is_active = true, full_name = $1,
              mobile = $2, email_verified = true
          WHERE email = $3
        `, [admin.name, admin.mobile, admin.email]);
        logger.info(`Super admin verified (password unchanged): ${admin.email}`);
      }
    }
  }


  // ── Banners Table ─────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS banners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(500),
      btn_text VARCHAR(100),
      image_url VARCHAR(500) NOT NULL,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Drop update trigger on banners if exists and recreate
  await query(`DROP TRIGGER IF EXISTS set_updated_at ON banners`);
  await query(`
    CREATE TRIGGER set_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);

  // Seed initial banners if table is empty
  const { rows: [{ count: bannerCount }] } = await query(`SELECT COUNT(*) FROM banners`);
  if (parseInt(bannerCount) === 0) {
    const initialBanners = [
      ['Special Offer', 'Exclusive credit card and loan deals', 'View Offers', 'offerbanner.png', 1],
      ['Lifetime Free Credit Cards', 'Zero Joining Fee • Zero Annual Fee', 'Explore Now', 'lifetimefree card.png', 2],
      ['Personal Loans', 'Low Interest Rates • Quick Disbursal', 'Apply Now', 'loan.png', 3],
      ['Business Loans', 'Flexible repayment options for growing businesses', 'Check Eligibility', 'loan.png', 4],
      ['Insurance Plans', 'Comprehensive health, life and general insurance cover', 'Get Quotes', 'insurance.png', 5],
      ['EMI Cards', 'Convert purchases to no-cost EMIs instantly', 'Get EMI Card', 'smart emi.png', 6],
      ['New EMI Schemes', 'Convert your spends into easy EMIs', 'Explore EMI', 'emi.jpeg', 7],
      ['HDFC Pixel Credit Cards', 'Customizable rewards on dining, shopping & entertainment', 'Explore Pixel Cards', 'hdfc pixel card.png', 8]
    ];
    for (const b of initialBanners) {
      await query(`
        INSERT INTO banners (title, subtitle, btn_text, image_url, display_order)
        VALUES ($1, $2, $3, $4, $5)
      `, b);
    }
    logger.info('Initial banners seeded successfully');
  }

  // ── System Settings Table ──────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    )
  `);

  // Seed default system setting if not exists
  await query(`
    INSERT INTO system_settings (key, value)
    VALUES ('admin_privacy_mode', 'off')
    ON CONFLICT (key) DO NOTHING
  `);

  // ── Homepage CMS Sections Table ──────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      key           VARCHAR(100) UNIQUE NOT NULL,
      title         VARCHAR(255) NOT NULL,
      subtitle      VARCHAR(500),
      is_active     BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 0,
      items         JSONB DEFAULT '[]',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── OTP Verifications Table ──────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      identity      VARCHAR(255) UNIQUE NOT NULL,
      otp_hash      VARCHAR(255) NOT NULL,
      expires_at    TIMESTAMPTZ NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS msg91_verified_tokens (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      token_hash  VARCHAR(64) UNIQUE NOT NULL,
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      used_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Seed initial homepage sections if empty
  const { rows: [{ count: sectionCount }] } = await query(`SELECT COUNT(*) FROM homepage_sections`);
  if (parseInt(sectionCount) === 0) {
    const initialSections = [
      [
        'money_transfer',
        'Money Transfer & Payments',
        'Send money instantly or pay utility bills',
        true,
        1,
        JSON.stringify([
          { "id": "tomobile", "label": "To Mobile", "icon": "FaMobileAlt", "desc": "Send money instantly", "color": "#27ae60" },
          { "id": "recharge", "label": "Recharge", "icon": "FaMobileAlt", "desc": "Mobile, DTH, FASTag", "color": "#2980b9" },
          { "id": "electricity", "label": "Electricity", "icon": "FaBolt", "desc": "Pay electricity bills", "color": "#f39c12" },
          { "id": "loanrepay", "label": "Loan Repay", "icon": "FaMoneyBillWave", "desc": "EMI & Loan Payments", "color": "#8e44ad" },
          { "id": "fastag", "label": "FASTag", "icon": "FaTags", "desc": "Recharge FASTag tag", "color": "#3498db" }
        ])
      ],
      [
        'attractive_cards',
        'Attractive Cards & Loans',
        'Handpicked financial solutions for your profile',
        true,
        2,
        JSON.stringify([
          { "id": "ltf-cards", "label": "Lifetime Free Cards", "icon": "FaRegCreditCard", "desc": "No annual fee forever" },
          { "id": "cibil-loans", "label": "CIBIL Score Based Loans", "icon": "FaUniversity", "desc": "Get loan based on score" },
          { "id": "hdfc-cc-loan", "label": "Loan on Credit Card", "icon": "FaLaptopHouse", "desc": "Pre-approved credit card loans" },
          { "id": "smart-emi", "label": "Smart EMI Cards", "icon": "FaMoneyCheckAlt", "desc": "Convert purchase to EMI" },
          { "id": "secured-cards", "label": "FD Backed Cards", "icon": "FaRegCreditCard", "desc": "Guaranteed approval cards" },
          { "id": "upi-cards", "label": "UPI Credit Cards", "icon": "FaBolt", "desc": "Link credit card to UPI" }
        ])
      ],
      [
        'loans',
        'Loans',
        'Instant approvals with minimum documentation',
        true,
        3,
        JSON.stringify([
          { "id": "personal-loan", "label": "Personal Loan", "icon": "FaUser", "desc": "Instant personal loans" },
          { "id": "home-loan", "label": "Home Loan", "icon": "FaHome", "desc": "Home purchase and renovation" },
          { "id": "business-loan", "label": "Business Loan", "icon": "FaBriefcase", "desc": "Expand your business" },
          { "id": "instant-loan", "label": "Instant Loan", "icon": "FaBolt", "desc": "Quick emergency funds" }
        ])
      ],
      [
        'insurance',
        'Insurance',
        'Secure your future with complete health & life plans',
        true,
        4,
        JSON.stringify([
          { "id": "health-insurance", "label": "Health Insurance", "icon": "FaHeartbeat", "desc": "Medical coverages" },
          { "id": "life-insurance", "label": "Life Insurance", "icon": "FaShieldAlt", "desc": "Term life coverage" },
          { "id": "general-insurance", "label": "General Insurance", "icon": "FaUmbrella", "desc": "Vehicle & assets" }
        ])
      ],
      [
        'travel',
        'Travel & Transit',
        'Book flights, trains, hotels, and buses instantly',
        true,
        5,
        JSON.stringify([
          { "id": "flight", "label": "Flight Booking", "icon": "FaPlane", "desc": "Domestic & international flights" },
          { "id": "train", "label": "Train Booking", "icon": "FaTrain", "desc": "IRCTC train tickets" },
          { "id": "bus", "label": "Bus Booking", "icon": "FaBus", "desc": "Intercity bus travels" },
          { "id": "hotels", "label": "Hotel Booking", "icon": "FaHotel", "desc": "Best hotels & resorts" }
        ])
      ]
    ];
    for (const s of initialSections) {
      await query(`
        INSERT INTO homepage_sections (key, title, subtitle, is_active, display_order, items)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, s);
    }
    logger.info('Initial homepage CMS sections seeded successfully');
  }

  // ── Services Catalog ────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS services_catalog (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(255),
      route VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      display_order INTEGER DEFAULT 1,
      clicks INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows: catalogCheck } = await query(`SELECT COUNT(*) FROM services_catalog`);
  if (parseInt(catalogCheck[0].count) === 0) {
    const initialServices = [
      ['Recharge', '📱', '/recharge', 'active', 1],
      ['Electricity', '⚡', '/electricity', 'active', 2],
      ['Loan Repay', '💰', '/loan-repay', 'active', 3],
      ['FASTag', '🚗', '/fastag', 'active', 4],
      ['Bus', '🚍', '/travel-transit/bus-booking', 'active', 5],
      ['Flight', '✈️', '/travel-transit/flight-booking', 'active', 6],
      ['Train', '🎛️', '/travel-transit/train-booking', 'active', 7],
      ['Hotel', '🏨', '/travel-transit/hotel-booking', 'active', 8]
    ];
    for (const s of initialServices) {
      await query(`
        INSERT INTO services_catalog (name, icon, route, status, display_order)
        VALUES ($1, $2, $3, $4, $5)
      `, s);
    }
    logger.info('Initial services catalog seeded successfully');
  }

  // ── Service Requests (Money Transfer & Payments) ─────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id SERIAL PRIMARY KEY,
      service_type VARCHAR(50) NOT NULL,
      mobile VARCHAR(20),
      operator VARCHAR(50),
      consumer_number VARCHAR(100),
      provider VARCHAR(100),
      loan_number VARCHAR(100),
      vehicle_number VARCHAR(100),
      amount NUMERIC(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Direct Card Applications (Visitor credit card leads) ─────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS direct_card_applications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_name VARCHAR(255) NOT NULL,
      mobile VARCHAR(15) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      card_name VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'verified',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);


  // Encrypt existing bank account numbers if not already encrypted
  try {
    const { encrypt } = require('../../utils/helpers/crypto');
    const { rows: bankDetails } = await query(`SELECT id, account_number FROM partner_bank_details`);
    for (const row of bankDetails) {
      if (row.account_number && !row.account_number.includes(':')) {
        const encrypted = encrypt(row.account_number);
        await query(`UPDATE partner_bank_details SET account_number = $1 WHERE id = $2`, [encrypted, row.id]);
      }
    }
    logger.info('Partner bank details encryption migration completed successfully');
  } catch (cryptoErr) {
    logger.warn('Failed to encrypt existing bank details:', cryptoErr.message);
  }

  // Banner redirect columns
  try {
    await query(`ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_type VARCHAR(50) DEFAULT 'custom'`);
    await query(`ALTER TABLE banners ADD COLUMN IF NOT EXISTS click_url VARCHAR(500) DEFAULT '/credit-cards'`);
    logger.info('Banner redirect columns migration completed successfully');
  } catch (bannerErr) {
    logger.warn('Failed to add banner redirect columns:', bannerErr.message);
  }

  // ── Product Application Settings & Click Logs Migration ───────────────────
  try {
    // 1. Create Enums
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_type_enum') THEN
          CREATE TYPE application_type_enum AS ENUM ('internal_form', 'external_url', 'affiliate_url', 'api_integration');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'open_type_enum') THEN
          CREATE TYPE open_type_enum AS ENUM ('same_tab', 'new_tab');
        END IF;
      END$$;
    `);

    // 2. Create product_application_settings table
    await query(`
      CREATE TABLE IF NOT EXISTS product_application_settings (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id        UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
        application_type  application_type_enum NOT NULL DEFAULT 'internal_form',
        application_url   VARCHAR(1000),
        provider_name     VARCHAR(255),
        open_type         open_type_enum NOT NULL DEFAULT 'same_tab',
        partner_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
        customer_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
        track_clicks      BOOLEAN NOT NULL DEFAULT TRUE,
        status            VARCHAR(20) NOT NULL DEFAULT 'active',
        created_by        UUID REFERENCES users(id),
        updated_by        UUID REFERENCES users(id),
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_app_settings_product ON product_application_settings(product_id)`);

    // 3. Create application_click_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS application_click_logs (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        partner_id        UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        customer_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        application_type  application_type_enum,
        ip_address        VARCHAR(64),
        user_agent        TEXT,
        device_type       VARCHAR(20),
        browser           VARCHAR(50),
        clicked_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_click_logs_product ON application_click_logs(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_click_logs_partner ON application_click_logs(partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_click_logs_clicked_at ON application_click_logs(clicked_at)`);

    logger.info('Product application settings and click logs migration completed successfully');
  } catch (appSettingsErr) {
    logger.error('Failed to run product application settings and click logs migration:', appSettingsErr);
    throw appSettingsErr;
  }

  // ── Partner Team Management Migration ─────────────────────────────────────
  try {
    await query(`
      ALTER TABLE partner_profiles 
      ADD COLUMN IF NOT EXISTS team_level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS team_status VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS allow_team_creation BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS team_joined_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0
    `);

    await query(`
      ALTER TABLE partner_wallets 
      ADD COLUMN IF NOT EXISTS personal_earnings DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS team_earnings DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS referral_bonus DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pending_team_commission DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS released_team_commission DECIMAL(15,2) DEFAULT 0
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS partner_team_relationships (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        child_partner_id  UUID NOT NULL UNIQUE REFERENCES partner_profiles(id) ON DELETE CASCADE,
        level             INTEGER NOT NULL,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        status            VARCHAR(20) DEFAULT 'ACTIVE'
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_team_rels_parent ON partner_team_relationships(parent_partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_team_rels_child ON partner_team_relationships(child_partner_id)`);

    await query(`
      CREATE TABLE IF NOT EXISTS partner_referrals (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id        UUID UNIQUE NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        referral_code     VARCHAR(50) UNIQUE NOT NULL,
        referral_link     VARCHAR(1000) NOT NULL,
        total_invites     INTEGER DEFAULT 0,
        total_registered  INTEGER DEFAULT 0,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_referrals_partner ON partner_referrals(partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_referrals_code ON partner_referrals(referral_code)`);

    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ('team_commission_child_pct', '90'), ('team_commission_parent_pct', '10')
      ON CONFLICT (key) DO NOTHING
    `);

    logger.info('Partner Team Management migration completed successfully');
  } catch (teamMigrateErr) {
    logger.error('Failed to run Partner Team Management migration:', teamMigrateErr);
    throw teamMigrateErr;
  }

  // ── Wallet Engine Migrations ──────────────────────────────
  try {
    logger.info('Running Wallet Engine Migrations...');
    
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
    
    logger.info('Wallet Engine Migrations completed successfully');
  } catch (walletMigrateErr) {
    logger.error('Failed to run Wallet Engine Migrations:', walletMigrateErr);
    throw walletMigrateErr;
  }

  // ── Video KYC & Document Status Migrations ──────────────────────
  try {
    logger.info('Running Video KYC Migrations...');
    
    // Add new columns to partner_profiles
    await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ`);
    await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ`);
    await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS kyc_reviewed_by UUID REFERENCES users(id)`);
    await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT`);

    // Add verification_status to kyc_documents
    await query(`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending'`);
    await query(`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);
    await query(`ALTER TABLE partner_videos ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);

    // Create partner_videos table
    await query(`
      CREATE TABLE IF NOT EXISTS partner_videos (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id          UUID UNIQUE NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        video_url           VARCHAR(500) NOT NULL,
        video_duration      INTEGER,
        video_size          INTEGER,
        storage_key         VARCHAR(500) NOT NULL,
        uploaded_at         TIMESTAMPTZ DEFAULT NOW(),
        verification_status VARCHAR(50) DEFAULT 'pending',
        rejection_reason    TEXT
      )
    `);

    logger.info('Video KYC Migrations completed successfully');
  } catch (videoMigrateErr) {
    logger.error('Failed to run Video KYC Migrations:', videoMigrateErr);
    throw videoMigrateErr;
  }

  // ── Product Links & Click Tracking Migrations ──────────────────────
  try {
    logger.info('Running Product Links & Click Tracking Migrations...');

    // Add new columns to products table
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS public_url VARCHAR(1000)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS partner_url VARCHAR(1000)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT TRUE`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Apply Now'`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS redirect_type VARCHAR(20) DEFAULT 'new_tab'`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES users(id)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW()`);

    // Create click_tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS click_tracking (
        click_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id        UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        bank_id           UUID REFERENCES banks(id) ON DELETE SET NULL,
        customer_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        customer_mobile   VARCHAR(15),
        tracking_url      VARCHAR(1000),
        original_url      VARCHAR(1000),
        ip_address        VARCHAR(45),
        browser           VARCHAR(100),
        device            VARCHAR(50),
        operating_system  VARCHAR(50),
        campaign          VARCHAR(100),
        referral_source   VARCHAR(255),
        location          VARCHAR(255),
        clicked_at        TIMESTAMPTZ DEFAULT NOW(),
        conversion_status VARCHAR(20) DEFAULT 'pending'
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_click_tracking_product ON click_tracking(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_click_tracking_partner ON click_tracking(partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_click_tracking_clicked_at ON click_tracking(clicked_at)`);

    // Create product_link_audits table
    await query(`
      CREATE TABLE IF NOT EXISTS product_link_audits (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        old_url       VARCHAR(1000),
        new_url       VARCHAR(1000),
        updated_by    UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        reason        TEXT,
        ip_address    VARCHAR(45)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_link_audits_product ON product_link_audits(product_id)`);

    logger.info('Product Links & Click Tracking Migrations completed successfully');
  } catch (linkMigrateErr) {
    logger.error('Failed to run Product Links & Click Tracking Migrations:', linkMigrateErr);
    throw linkMigrateErr;
  }

  // Wallet Schema Updates (Task 8)
  try {
    logger.info('Running Wallet Schema Updates (Task 8)...');
    
    // 0. Update ledger_transaction_type enum to include OVERRIDE_COMMISSION
    await addEnumValue('ledger_transaction_type', 'OVERRIDE_COMMISSION');

    // 1. Wallets table balance columns
    await query(`
      ALTER TABLE partner_wallets 
      ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS withdrawn_balance DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS override_balance DECIMAL(15,2) DEFAULT 0
    `);

    // 2. Wallet transactions table columns
    await query(`
      ALTER TABLE wallet_transactions 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
      ADD COLUMN IF NOT EXISTS commission_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS gst DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tds DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS remarks TEXT
    `);

    // 3. Partner bank details columns
    await query(`
      ALTER TABLE partner_bank_details 
      ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100)
    `);

    // 4. Partner settlements table
    await query(`
      CREATE TABLE IF NOT EXISTS partner_settlements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        withdrawal_id UUID REFERENCES withdrawal_requests(id) ON DELETE SET NULL,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        payment_mode VARCHAR(50),
        payment_gateway VARCHAR(50),
        utr_number VARCHAR(100),
        bank_reference VARCHAR(100),
        settled_at TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'completed'
      )
    `);

    logger.info('Wallet Schema Updates (Task 8) completed successfully');
  } catch (walletMigrateErr) {
    logger.error('Failed to run Wallet Schema Updates (Task 8):', walletMigrateErr);
    throw walletMigrateErr;
  }

  // Application Lifecycle Schema Updates (Task 9)
  try {
    logger.info('Running Application Lifecycle Schema Updates (Task 9)...');

    // 1. Applications table tracking updates
    await query(`
      ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS parent_partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS commission_received_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMPTZ NULL
    `);

    // 2. Application Timeline table
    await query(`
      CREATE TABLE IF NOT EXISTS application_timeline (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        activity VARCHAR(255) NOT NULL,
        remarks TEXT NULL,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        performed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_timeline_app ON application_timeline(application_id)`);

    // 3. Application Notes table
    await query(`
      CREATE TABLE IF NOT EXISTS application_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        visibility VARCHAR(50) DEFAULT 'public',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_notes_app ON application_notes(application_id)`);

    // 4. Application Documents table
    await query(`
      CREATE TABLE IF NOT EXISTS application_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(1000) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_docs_app ON application_documents(application_id)`);

    // 5. Commission Ledger table
    await query(`
      CREATE TABLE IF NOT EXISTS commission_ledger (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        parent_partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        commission_amount DECIMAL(15,2) DEFAULT 0,
        override_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_comm_ledger_app ON commission_ledger(application_id)`);

    logger.info('Application Lifecycle Schema Updates (Task 9) completed successfully');
  } catch (lifecycleMigrateErr) {
    logger.error('Failed to run Application Lifecycle Schema Updates (Task 9):', lifecycleMigrateErr);
    throw lifecycleMigrateErr;
  }

  // Notification System Schema Updates (Task 10)
  try {
    logger.info('Running Notification System Schema Updates (Task 10)...');

    // 1. Notifications table updates
    await query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'system',
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent',
      ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'in-app',
      ADD COLUMN IF NOT EXISTS redirect_url VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS icon VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL
    `);

    // 2. Notification Preferences
    await query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        email_enabled BOOLEAN DEFAULT TRUE,
        sms_enabled BOOLEAN DEFAULT TRUE,
        app_enabled BOOLEAN DEFAULT TRUE,
        marketing_enabled BOOLEAN DEFAULT TRUE,
        commission_enabled BOOLEAN DEFAULT TRUE,
        kyc_enabled BOOLEAN DEFAULT TRUE,
        application_enabled BOOLEAN DEFAULT TRUE,
        language VARCHAR(10) DEFAULT 'en',
        frequency VARCHAR(20) DEFAULT 'instant'
      )
    `);

    // 3. Announcements
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        banner_image VARCHAR(500) NULL,
        target_role VARCHAR(50) DEFAULT 'all',
        priority VARCHAR(20) DEFAULT 'normal',
        start_date DATE NULL,
        end_date DATE NULL,
        redirect_url VARCHAR(500) NULL,
        status VARCHAR(20) DEFAULT 'draft',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 4. Templates
    await query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_name VARCHAR(100) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        channel VARCHAR(50) DEFAULT 'in-app',
        variables JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active'
      )
    `);

    logger.info('Notification System Schema Updates (Task 10) completed successfully');
  } catch (notificationMigrateErr) {
    logger.error('Failed to run Notification System Schema Updates (Task 10):', notificationMigrateErr);
    throw notificationMigrateErr;
  }

  // Product Management System Schema Updates (Task 7)
  try {
    logger.info('Running Product Management System Schema Updates (Task 7)...');

    await query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS short_description VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS banner VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS commission_enabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS override_percentage DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS partner_visible BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT NULL,
      ADD COLUMN IF NOT EXISTS documents_required TEXT NULL,
      ADD COLUMN IF NOT EXISTS benefits TEXT NULL,
      ADD COLUMN IF NOT EXISTS fees_charges TEXT NULL,
      ADD COLUMN IF NOT EXISTS apply_button_text VARCHAR(100) DEFAULT 'Apply Now',
      ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500) NULL,
      ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500) NULL
    `);

    logger.info('Product Management System Schema Updates (Task 7) completed successfully');
  } catch (productMigrateErr) {
    logger.error('Failed to run Product Management System Schema Updates (Task 7):', productMigrateErr);
    throw productMigrateErr;
  }

  // ── Enterprise Database Schema Alignment ─────────────────────────────
  try {
    logger.info('Running Enterprise Database Schema Alignment...');

    // 1. users
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT FALSE;
    `);

    // 2. partner_profiles
    await query(`
      ALTER TABLE partner_profiles
      ADD COLUMN IF NOT EXISTS referral_level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
    `);

    // 3. partner_bank_details
    await query(`
      ALTER TABLE partner_bank_details
      ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS cancelled_cheque_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
    `);

    // 4. training_modules
    await query(`
      CREATE TABLE IF NOT EXISTS training_modules (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        video_url   VARCHAR(500),
        pdf_url     VARCHAR(500),
        is_active   BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. partner_training_progress
    await query(`
      CREATE TABLE IF NOT EXISTS partner_training_progress (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id    UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        training_id   UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
        progress      INTEGER DEFAULT 0, -- percentage
        completed     BOOLEAN DEFAULT FALSE,
        completed_at  TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(partner_id, training_id)
      );
    `);

    // 6. views for enterprise compatibility
    await query(`
      CREATE OR REPLACE VIEW referral_tree AS 
      SELECT id, parent_partner_id, child_partner_id, level, created_at AS joined_at 
      FROM partner_team_relationships;
    `);
    
    await query(`
      CREATE OR REPLACE VIEW cms_sections AS 
      SELECT id, key AS section_key, title, items AS content, NULL::VARCHAR AS language, is_active, updated_at 
      FROM homepage_sections;
    `);

    // 7. seed default training modules if empty
    const { rows: [{ count: trainCount }] } = await query(`SELECT COUNT(*) FROM training_modules`);
    if (parseInt(trainCount) === 0) {
      await query(`
        INSERT INTO training_modules (title, description, video_url, is_active)
        VALUES 
        ('Introduction to GharKaPaisa Platform', 'Essential platform rules and guides to start earning.', 'https://www.w3schools.com/html/mov_bbb.mp4', true),
        ('Pitching Credit Cards effectively', 'Learn best practices on how to recommend cards to customers.', 'https://www.w3schools.com/html/mov_bbb.mp4', true),
        ('Pitching Personal Loans effectively', 'Step-by-step guide for personal loan leads.', 'https://www.w3schools.com/html/mov_bbb.mp4', true);
      `);
    }

    logger.info('Enterprise Database Schema Alignment completed successfully');
  } catch (alignErr) {
    logger.error('Failed to run Enterprise Database Schema Alignment:', alignErr);
    throw alignErr;
  }

  // ── Wallet & Razorpay Payout System Alignment Migrations ──
  try {
    logger.info('Running Wallet & Razorpay Payout System Alignment Migrations...');

    // 1. Rename wallets table to partner_wallets
    await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallets') AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partner_wallets') THEN
          ALTER TABLE wallets RENAME TO partner_wallets;
          RAISE NOTICE 'Renamed table wallets to partner_wallets';
        END IF;
      END $$;
    `);

    // 2. Align partner_wallets columns
    await query(`
      ALTER TABLE partner_wallets ADD COLUMN IF NOT EXISTS locked_balance DECIMAL(15,2) DEFAULT 0.00;
      ALTER TABLE partner_wallets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
      ALTER TABLE partner_wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE partner_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // Fix wallet_ledger FK constraint if it references old 'wallets' table or view instead of 'partner_wallets'
    await query(`
      DO $$
      DECLARE
        ref_table TEXT;
      BEGIN
        SELECT ccu.table_name INTO ref_table
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = 'wallet_ledger' AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.constraint_name = 'wallet_ledger_wallet_id_fkey';

        IF ref_table IS NOT NULL AND ref_table <> 'partner_wallets' THEN
          ALTER TABLE wallet_ledger DROP CONSTRAINT wallet_ledger_wallet_id_fkey;
          ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_wallet_id_fkey
            FOREIGN KEY (wallet_id) REFERENCES partner_wallets(id);
          RAISE NOTICE 'Fixed wallet_ledger FK to point to partner_wallets';
        END IF;
      END $$;
    `);

    // 3. Rename withdrawal_requests table to wallet_withdrawals
    await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'withdrawal_requests') AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallet_withdrawals') THEN
          ALTER TABLE withdrawal_requests RENAME TO wallet_withdrawals;
          RAISE NOTICE 'Renamed table withdrawal_requests to wallet_withdrawals';
        END IF;
      END $$;
    `);

    // 4. Align wallet_withdrawals columns
    await query(`
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES partner_wallets(id);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES partner_bank_details(id);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS transferred_by UUID REFERENCES users(id);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS razorpay_contact_id VARCHAR(100);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS razorpay_fund_account_id VARCHAR(100);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS razorpay_payout_id VARCHAR(100);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS bank_reference VARCHAR(100);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS failure_reason TEXT;
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS utr VARCHAR(100);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS remarks TEXT;
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id);
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS admin_note TEXT;
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE wallet_withdrawals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `);
    await query(`DROP TRIGGER IF EXISTS set_updated_at ON wallet_withdrawals`);
    await query(`
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON wallet_withdrawals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);

    // Migrate existing data if needed (checking if columns exist to prevent errors)
    const { rows: utrNumCol } = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='wallet_withdrawals' AND column_name='utr_number'
    `);
    if (utrNumCol.length > 0) {
      await query(`
        UPDATE wallet_withdrawals 
        SET utr = utr_number 
        WHERE utr IS NULL AND utr_number IS NOT NULL
      `);
    }

    const { rows: txnRefCol } = await query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='wallet_withdrawals' AND column_name='transaction_reference'
    `);
    if (txnRefCol.length > 0) {
      await query(`
        UPDATE wallet_withdrawals 
        SET utr = transaction_reference 
        WHERE utr IS NULL AND transaction_reference IS NOT NULL
      `);
    }

    // 5. Create payout_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS payout_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        withdrawal_id UUID REFERENCES wallet_withdrawals(id) ON DELETE CASCADE,
        api_request JSONB,
        api_response JSONB,
        http_status INTEGER,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Create backwards compatibility views for SELECT queries (only if they don't already exist as tables)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets' AND table_type = 'BASE TABLE') THEN
          CREATE OR REPLACE VIEW wallets AS SELECT * FROM partner_wallets;
        END IF;
      END $$;
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests' AND table_type = 'BASE TABLE') THEN
          CREATE OR REPLACE VIEW withdrawal_requests AS
          SELECT
            id, wallet_id, partner_id, amount, status,
            bank_name, account_number, ifsc_code, utr as utr_number,
            processed_by, processed_at, rejection_reason, admin_note,
            created_at, updated_at
          FROM wallet_withdrawals;
        END IF;
      END $$;
    `);

    logger.info('Wallet & Razorpay Payout System Alignment Migrations completed successfully.');
  } catch (payoutMigrateErr) {
    logger.error('Failed to run Wallet & Razorpay Payout System Alignment Migrations:', payoutMigrateErr);
    throw payoutMigrateErr;
  }

  // ── GharKaPaisa Enhancements (V2 Features) ───────────────────────────
  try {
    logger.info('Running GharKaPaisa Enhancements (V2 Features) Migrations...');

    // 1. Alter partner_profiles to add nominee & emergency contact columns
    await query(`
      ALTER TABLE partner_profiles 
      ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS nominee_relation VARCHAR(100),
      ADD COLUMN IF NOT EXISTS nominee_dob DATE,
      ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS face_match_score DECIMAL(5,2)
    `);

    // 2. Drop unique constraint on partner_bank_details(partner_id) to allow multiple accounts
    await query(`
      ALTER TABLE partner_bank_details DROP CONSTRAINT IF EXISTS partner_bank_details_partner_id_key
    `);

    // 3. Add is_primary to partner_bank_details
    await query(`
      ALTER TABLE partner_bank_details 
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT TRUE
    `);

    // 4. Create bank_details_history table
    await query(`
      CREATE TABLE IF NOT EXISTS bank_details_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        bank_details_id UUID REFERENCES partner_bank_details(id) ON DELETE SET NULL,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        old_data JSONB,
        new_data JSONB,
        changed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 5. Add index on bank_details_history
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bank_details_history_partner ON bank_details_history(partner_id)
    `);

    // 6. Ensure KYC documents table has ocr_data JSONB
    await query(`
      ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS ocr_data JSONB
    `);

    // 7. Support Tickets, Marketing Materials, and Partner Training Progress Tables
    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id    UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        subject       VARCHAR(255) NOT NULL,
        description   TEXT NOT NULL,
        category      VARCHAR(100) NOT NULL,
        priority      VARCHAR(50) DEFAULT 'medium',
        status        VARCHAR(50) DEFAULT 'open',
        replies       JSONB DEFAULT '[]',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON support_tickets(partner_id)`);

    await query(`
      CREATE TABLE IF NOT EXISTS marketing_materials (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        category      VARCHAR(100) NOT NULL,
        file_url      VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed dummy marketing materials if empty
    const { rows: existingMaterials } = await query(`SELECT id FROM marketing_materials LIMIT 1`);
    if (existingMaterials.length === 0) {
      await query(`
        INSERT INTO marketing_materials (title, description, category, file_url, thumbnail_url)
        VALUES 
          ('GharKaPaisa Poster', 'High-res promotional poster for credit card referrals.', 'banners', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200'),
          ('Social Media Banner', 'Optimal dimensions for Instagram/Facebook posts.', 'social_media', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200'),
          ('Referral Campaign Leaflet', 'Print-ready trifold leaflet details.', 'leaflets', 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800', 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=200')
      `);
    }

    logger.info('GharKaPaisa Enhancements (V2 Features) Migrations completed successfully.');
  } catch (err) {
    logger.error('Failed to run GharKaPaisa Enhancements (V2 Features) Migrations:', err);
    throw err;
  }

  logger.info('✅ All migrations completed successfully');
  if (require.main === module) {
    process.exit(0);
  }
};

 if (require.main === module) {
   migrate().catch(err => {
     logger.error('Migration failed', err);
     process.exit(1);
   });
 }

 module.exports = { migrate };
