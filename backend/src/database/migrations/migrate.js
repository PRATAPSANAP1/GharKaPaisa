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
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`);

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
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_id VARCHAR(255)`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_name VARCHAR(255)`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS browser VARCHAR(255)`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS country VARCHAR(100)`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ`);
  await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ DEFAULT NOW()`);

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

  // ── Login History ──────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
      device         VARCHAR(255),
      browser        VARCHAR(255),
      ip_address     VARCHAR(45),
      city           VARCHAR(100),
      country        VARCHAR(100),
      login_time     TIMESTAMPTZ DEFAULT NOW(),
      logout_time    TIMESTAMPTZ,
      status         VARCHAR(20) NOT NULL,
      failure_reason VARCHAR(255),
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_login_history_time ON login_history(login_time DESC)`);

  // ── Security Alerts ─────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS security_alerts (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
      type       VARCHAR(50) NOT NULL,
      message    TEXT NOT NULL,
      metadata   JSONB,
      read_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC)`);

  // ── Password History ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS password_history (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
      password_hash VARCHAR(255) NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id)`);


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
      category VARCHAR(50) DEFAULT 'credit_card',
      status VARCHAR(50) DEFAULT 'verified',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE direct_card_applications
      ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'credit_card';
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
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallets') THEN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'partner_wallets') THEN
            IF (SELECT COUNT(*) FROM partner_wallets) = 0 THEN
              DROP TABLE partner_wallets CASCADE;
              ALTER TABLE wallets RENAME TO partner_wallets;
              RAISE NOTICE 'Dropped empty partner_wallets and renamed wallets to partner_wallets';
            ELSE
              RAISE NOTICE 'Both wallets and partner_wallets contain records. Manual merge needed.';
            END IF;
          ELSE
            ALTER TABLE wallets RENAME TO partner_wallets;
            RAISE NOTICE 'Renamed table wallets to partner_wallets';
          END IF;
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
          -- 1. Ensure partner_wallets exist for all partners in wallet_ledger
          INSERT INTO partner_wallets (partner_id)
          SELECT DISTINCT wl.partner_id
          FROM wallet_ledger wl
          WHERE wl.partner_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM partner_wallets pw WHERE pw.partner_id = wl.partner_id)
            AND EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = wl.partner_id)
          ON CONFLICT (partner_id) DO NOTHING;

          -- 2. Remap wallet_id in wallet_ledger if it stored partner_profiles.id instead of partner_wallets.id
          UPDATE wallet_ledger wl
          SET wallet_id = pw.id
          FROM partner_wallets pw
          WHERE (wl.wallet_id = pw.partner_id OR (wl.wallet_id IS NOT NULL AND wl.partner_id = pw.partner_id))
            AND NOT EXISTS (SELECT 1 FROM partner_wallets pw2 WHERE pw2.id = wl.wallet_id);

          -- 3. Create fallback partner_wallets records for any remaining orphan wallet_id in wallet_ledger
          INSERT INTO partner_wallets (id, partner_id)
          SELECT DISTINCT wl.wallet_id, wl.partner_id
          FROM wallet_ledger wl
          WHERE wl.wallet_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM partner_wallets pw WHERE pw.id = wl.wallet_id)
            AND EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = wl.partner_id)
          ON CONFLICT (id) DO NOTHING;

          -- 4. Clean up any remaining unresolvable orphan records from wallet_ledger
          DELETE FROM wallet_ledger wl
          WHERE NOT EXISTS (SELECT 1 FROM partner_wallets pw WHERE pw.id = wl.wallet_id);

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

    // 6. Clean up legacy wallets view/table to enforce partner_wallets schema
    await query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'wallets' AND relkind = 'v') THEN
          DROP VIEW wallets CASCADE;
        ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'wallets' AND relkind = 'r') THEN
          DROP TABLE wallets CASCADE;
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

  // ── Production Readiness & Referral Clicks Updates (Task 11) ────
  try {
    logger.info('Running Production Readiness & Referral Clicks Updates (Task 11)...');

    // 1. Notifications table updates
    await query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS entity_id UUID
    `);

    // 2. Audit Logs table updates
    await query(`
      ALTER TABLE audit_logs 
      ADD COLUMN IF NOT EXISTS old_data JSONB,
      ADD COLUMN IF NOT EXISTS new_data JSONB
    `);

    // 3. Wallet Ledger table updates (avoiding expensive joins)
    await query(`
      ALTER TABLE wallet_ledger 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES banks(id) ON DELETE SET NULL
    `);

    // 4. Partner Team Relationships table updates
    await query(`
      ALTER TABLE partner_team_relationships 
      ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS override_percentage DECIMAL(5,2)
    `);

    // 5. Support Tickets table updates
    await query(`
      ALTER TABLE support_tickets 
      ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);

    // 6. Partner Training Progress table updates
    await query(`
      ALTER TABLE partner_training_progress 
      ADD COLUMN IF NOT EXISTS quiz_score DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS certificate_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS attempt_count INT DEFAULT 1
    `);

    // Ensure unique constraint exists for upserts
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'partner_training_progress_partner_id_training_id_key' 
             OR conname = 'unique_partner_training'
        ) THEN
          ALTER TABLE partner_training_progress ADD CONSTRAINT unique_partner_training UNIQUE (partner_id, training_id);
        END IF;
      END $$;
    `);

    // 7. Marketing Materials table updates
    await query(`
      ALTER TABLE marketing_materials 
      ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS downloads INT DEFAULT 0
    `);

    // 8. Applications table updates
    await query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS commission_released BOOLEAN DEFAULT FALSE
    `);

    // 9. Products table updates and slug generation
    await query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255)
    `);
    
    // Check if unique index is already created, if not create it
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL
    `);

    // Generate slugs for existing products based on name
    await query(`
      UPDATE products 
      SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) 
      WHERE slug IS NULL;
    `);

    // 10. Referral Clicks table creation
    await query(`
      CREATE TABLE IF NOT EXISTS referral_clicks (
        id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id           UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        referral_code        VARCHAR(50) NOT NULL,
        ip_address           VARCHAR(45),
        user_agent           TEXT,
        source               VARCHAR(50) DEFAULT 'direct',
        campaign             VARCHAR(100),
        clicked_at           TIMESTAMPTZ DEFAULT NOW(),
        converted            BOOLEAN DEFAULT FALSE,
        converted_partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        converted_at         TIMESTAMPTZ
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_referral_clicks_partner ON referral_clicks(partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_referral_clicks_converted ON referral_clicks(converted)`);

    // 11. Reports Views
    await query(`
      CREATE OR REPLACE VIEW daily_wallet_summary AS
      SELECT 
        partner_id,
        created_at::date AS summary_date,
        SUM(credit) AS total_credit,
        SUM(debit) AS total_debit,
        COUNT(*) AS transaction_count
      FROM wallet_ledger
      GROUP BY partner_id, created_at::date;
    `);

    await query(`
      CREATE OR REPLACE VIEW daily_application_summary AS
      SELECT 
        partner_id,
        created_at::date AS summary_date,
        status,
        COUNT(*) AS application_count,
        SUM(COALESCE(loan_amount, 0)) AS total_loan_amount,
        SUM(COALESCE(commission_amount, 0)) AS total_commission_amount
      FROM applications
      GROUP BY partner_id, created_at::date, status;
    `);

    await query(`
      CREATE OR REPLACE VIEW partner_monthly_summary AS
      SELECT 
        partner_id,
        DATE_TRUNC('month', created_at)::date AS summary_month,
        SUM(credit) AS monthly_earned,
        SUM(debit) AS monthly_withdrawn
      FROM wallet_ledger
      WHERE status = 'completed'
      GROUP BY partner_id, DATE_TRUNC('month', created_at)::date;
    `);

    logger.info('Production Readiness & Referral Clicks Updates (Task 11) completed successfully.');
  } catch (task11Err) {
    logger.error('Failed to run Production Readiness & Referral Clicks Updates (Task 11):', task11Err);
    throw task11Err;
  }

  // ── Partner Onboarding & Team Metrics Schema Migration (Task 12) ──
  try {
    logger.info('Running Partner Onboarding & Team Metrics Schema Migration (Task 12)...');

    await query(`
      ALTER TABLE partner_profiles 
        ADD COLUMN IF NOT EXISTS active_children INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS inactive_children INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS verified_children INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pending_children INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS blocked_children INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_leads INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_applications INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_approved INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS team_commission DECIMAL(15,2) DEFAULT 0.00;
    `);

    logger.info('Partner Onboarding & Team Metrics Schema Migration (Task 12) completed successfully.');
  } catch (task12Err) {
    logger.error('Failed to run Partner Onboarding & Team Metrics Schema Migration (Task 12):', task12Err);
    throw task12Err;
  }

  // ── 360 Customer Module Architecture Schema Migration (Task 13) ──
  try {
    logger.info('Running 360 Customer Module Architecture Schema Migration (Task 13)...');

    // 1. Customers table extensions
    await query(`
      ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS pipeline_status VARCHAR(50) DEFAULT 'new',
        ADD COLUMN IF NOT EXISTS status_reason TEXT,
        ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(15),
        ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS nominee_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS nominee_relation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS product_interests JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES customers(id) ON DELETE SET NULL;
    `);

    // 2. Customer Notes
    await query(`
      CREATE TABLE IF NOT EXISTS customer_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        note TEXT NOT NULL,
        visibility VARCHAR(20) DEFAULT 'public',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cust_notes_customer ON customer_notes(customer_id);
    `);

    // 3. Customer Documents
    await query(`
      CREATE TABLE IF NOT EXISTS customer_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(1000) NOT NULL,
        s3_key VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending',
        verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cust_docs_customer ON customer_documents(customer_id);
    `);

    // 4. Customer Timeline
    await query(`
      CREATE TABLE IF NOT EXISTS customer_timeline (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        event_title VARCHAR(255) NOT NULL,
        event_description TEXT,
        reference_type VARCHAR(50),
        reference_id UUID,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cust_timeline_customer ON customer_timeline(customer_id);
    `);

    // 5. Customer Followups
    await query(`
      CREATE TABLE IF NOT EXISTS customer_followups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        followup_date TIMESTAMPTZ NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        remarks TEXT,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cust_followups_customer ON customer_followups(customer_id);
    `);

    // 6. Customer Tags
    await query(`
      CREATE TABLE IF NOT EXISTS customer_tags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        tag_name VARCHAR(50) NOT NULL,
        tag_color VARCHAR(20) DEFAULT '#3B82F6',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_cust_tag UNIQUE(customer_id, tag_name)
      );
      CREATE INDEX IF NOT EXISTS idx_cust_tags_customer ON customer_tags(customer_id);
    `);

    // 7. Customer Activity Logs
    await query(`
      CREATE TABLE IF NOT EXISTS customer_activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        ip_address VARCHAR(45),
        device VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cust_activity_customer ON customer_activity_logs(customer_id);
    `);

    // 8. Customer Communications
    await query(`
      CREATE TABLE IF NOT EXISTS customer_communications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'sent',
        sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cust_comm_customer ON customer_communications(customer_id);
    `);

    logger.info('360 Customer Module Architecture Schema Migration (Task 13) completed successfully.');
  } catch (task13Err) {
    logger.error('Failed to run 360 Customer Module Architecture Schema Migration (Task 13):', task13Err);
    throw task13Err;
  }

  // ── Enterprise Lead Management Architecture Migration (Task 14) ──
  try {
    logger.info('Running Enterprise Lead Management Architecture Migration (Task 14)...');

    // 1. Extend leads table
    await query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'partner',
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
        ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'created',
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS sla_status VARCHAR(20) DEFAULT 'on_track',
        ADD COLUMN IF NOT EXISTS expected_completion_at TIMESTAMPTZ;
    `);

    // 2. Lead Documents
    await query(`
      CREATE TABLE IF NOT EXISTS lead_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(1000) NOT NULL,
        s3_key VARCHAR(500),
        verification_status VARCHAR(50) DEFAULT 'pending',
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lead_docs_lead ON lead_documents(lead_id);
    `);

    // 3. Lead Timeline
    await query(`
      CREATE TABLE IF NOT EXISTS lead_timeline (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reference_type VARCHAR(50),
        reference_id UUID,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lead_timeline_lead ON lead_timeline(lead_id);
    `);

    // 4. Lead Notes (Visibility: partner | admin | operations | private)
    await query(`
      CREATE TABLE IF NOT EXISTS lead_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        role VARCHAR(50),
        note TEXT NOT NULL,
        visibility VARCHAR(20) DEFAULT 'partner',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
    `);

    // 5. Lead Assignments
    await query(`
      CREATE TABLE IF NOT EXISTS lead_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
        team VARCHAR(50) DEFAULT 'operations',
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'active'
      );
      CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
    `);

    // 6. Lead Activity Logs
    await query(`
      CREATE TABLE IF NOT EXISTS lead_activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        ip_address VARCHAR(45),
        device VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity_logs(lead_id);
    `);

    // 7. Lead Status History
    await query(`
      CREATE TABLE IF NOT EXISTS lead_status_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON lead_status_history(lead_id);
    `);

    // 8. Lead Verification Checklist
    await query(`
      CREATE TABLE IF NOT EXISTS lead_checklist (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        item VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMPTZ,
        CONSTRAINT unique_lead_check_item UNIQUE(lead_id, item)
      );
      CREATE INDEX IF NOT EXISTS idx_lead_check_lead ON lead_checklist(lead_id);
    `);

    // 9. Lead SLA Engine Tracker
    await query(`
      CREATE TABLE IF NOT EXISTS lead_sla (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        stage_name VARCHAR(50) NOT NULL,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        expected_time_hours INT DEFAULT 48,
        completed_at TIMESTAMPTZ,
        is_overdue BOOLEAN DEFAULT FALSE,
        delay_minutes INT DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_lead_sla_lead ON lead_sla(lead_id);
    `);

    // 10. Bank Executive Assignments
    await query(`
      CREATE TABLE IF NOT EXISTS bank_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
        executive_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(15),
        email VARCHAR(255),
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'assigned'
      );
      CREATE INDEX IF NOT EXISTS idx_bank_assign_lead ON bank_assignments(lead_id);
    `);

    logger.info('Enterprise Lead Management Architecture Migration (Task 14) completed successfully.');
  } catch (task14Err) {
    logger.error('Failed to run Enterprise Lead Management Architecture Migration (Task 14):', task14Err);
    throw task14Err;
  }

  // ── Wallet & Commission Engine Migration (Task 15) ──
  try {
    logger.info('Running Wallet & Commission Engine Migration (Task 15)...');

    // 1. Partner Wallets Table
    await query(`
      CREATE TABLE IF NOT EXISTS partner_wallets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID UNIQUE NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        available_balance DECIMAL(15,2) DEFAULT 0.00,
        hold_balance DECIMAL(15,2) DEFAULT 0.00,
        bonus_balance DECIMAL(15,2) DEFAULT 0.00,
        total_earned DECIMAL(15,2) DEFAULT 0.00,
        total_withdrawn DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_partner_wallets_partner ON partner_wallets(partner_id);
    `);

    // 2. Wallet Ledger Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_ledger (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL,
        credit DECIMAL(15,2) DEFAULT 0.00,
        debit DECIMAL(15,2) DEFAULT 0.00,
        balance_after DECIMAL(15,2) DEFAULT 0.00,
        reference_number VARCHAR(100),
        description TEXT,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        hold_until TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'completed',
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_partner ON wallet_ledger(partner_id);
    `);

    // 3. Wallet Transactions Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        wallet_id UUID REFERENCES partner_wallets(id) ON DELETE CASCADE,
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        description TEXT,
        reference_number VARCHAR(100),
        release_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_txns_partner ON wallet_transactions(partner_id);
    `);

    // 4. Wallet Withdrawals Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_withdrawals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        bank_detail_id UUID REFERENCES partner_bank_details(id) ON DELETE SET NULL,
        amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        otp_code VARCHAR(10),
        otp_expires_at TIMESTAMPTZ,
        utr_number VARCHAR(100),
        bank_reference VARCHAR(100),
        transfer_id VARCHAR(100),
        transferred_by UUID REFERENCES users(id) ON DELETE SET NULL,
        transferred_at TIMESTAMPTZ,
        settlement_date TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_partner ON wallet_withdrawals(partner_id);
    `);

    // 5. Commission Rules Table
    await query(`
      CREATE TABLE IF NOT EXISTS commission_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        commission_type VARCHAR(20) DEFAULT 'fixed',
        commission_value DECIMAL(15,2) DEFAULT 0.00,
        parent_override_type VARCHAR(20) DEFAULT 'fixed',
        parent_override_value DECIMAL(15,2) DEFAULT 0.00,
        effective_from DATE DEFAULT CURRENT_DATE,
        effective_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_comm_rules_product ON commission_rules(product_id);
    `);

    // 6. Commission Release Jobs Table
    await query(`
      CREATE TABLE IF NOT EXISTS commission_release_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ledger_id UUID REFERENCES wallet_ledger(id) ON DELETE CASCADE,
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        release_date TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_comm_release_jobs_date ON commission_release_jobs(release_date, status);
    `);

    // 7. Withdrawal Audit Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS withdrawal_audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        withdrawal_id UUID NOT NULL REFERENCES wallet_withdrawals(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        old_status VARCHAR(30),
        new_status VARCHAR(30),
        remarks TEXT,
        ip_address VARCHAR(45),
        device VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_w ON withdrawal_audit_logs(withdrawal_id);
    `);

    // 8. Wallet Reconciliation Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_reconciliation (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        reconciliation_date DATE DEFAULT CURRENT_DATE,
        wallet_balance DECIMAL(15,2) DEFAULT 0.00,
        ledger_balance DECIMAL(15,2) DEFAULT 0.00,
        discrepancy DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'matched',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_recon_partner ON wallet_reconciliation(partner_id);
    `);

    // 9. Wallet Bonus Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_bonus (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        bonus_type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_bonus_partner ON wallet_bonus(partner_id);
    `);

    // 10. Wallet Adjustments Table
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_adjustments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        reason TEXT NOT NULL,
        adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_adj_partner ON wallet_adjustments(partner_id);
    `);

    logger.info('Wallet & Commission Engine Migration (Task 15) completed successfully.');
  } catch (task15Err) {
    logger.error('Failed to run Wallet & Commission Engine Migration (Task 15):', task15Err);
    throw task15Err;
  }

  // ── Team & Referral Management System Migration (Task 16) ──
  try {
    logger.info('Running Team & Referral Management System Migration (Task 16)...');

    // 1. Extend partner_profiles table
    await query(`
      ALTER TABLE partner_profiles
        ADD COLUMN IF NOT EXISTS children_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS direct_team_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS active_team_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_team_join TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS team_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS referral_message TEXT DEFAULT 'Join my team on GharKaPaisa and earn highest financial commission payouts!',
        ADD COLUMN IF NOT EXISTS referral_banner VARCHAR(500);
    `);

    // 2. Referral Clicks Table
    await query(`
      CREATE TABLE IF NOT EXISTS referral_clicks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        referral_code VARCHAR(50) NOT NULL,
        campaign VARCHAR(100) DEFAULT 'direct',
        source VARCHAR(100) DEFAULT 'web',
        ip_address VARCHAR(45),
        browser VARCHAR(100),
        device VARCHAR(100),
        country VARCHAR(100),
        state VARCHAR(100),
        city VARCHAR(100),
        referrer VARCHAR(1000),
        landing_url VARCHAR(1000),
        clicked_at TIMESTAMPTZ DEFAULT NOW(),
        registered BOOLEAN DEFAULT FALSE,
        registration_id UUID REFERENCES users(id) ON DELETE SET NULL,
        converted BOOLEAN DEFAULT FALSE,
        application_created BOOLEAN DEFAULT FALSE,
        commission_generated BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_ref_clicks_code ON referral_clicks(referral_code);
      CREATE INDEX IF NOT EXISTS idx_ref_clicks_partner ON referral_clicks(partner_id);
    `);

    // 3. Invitation History Table
    await query(`
      CREATE TABLE IF NOT EXISTS invitation_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        method VARCHAR(50) NOT NULL,
        recipient VARCHAR(255),
        sent_time TIMESTAMPTZ DEFAULT NOW(),
        opened_time TIMESTAMPTZ,
        registered BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'sent'
      );
      CREATE INDEX IF NOT EXISTS idx_inv_history_partner ON invitation_history(partner_id);
    `);

    // 4. Referral Campaigns Table
    await query(`
      CREATE TABLE IF NOT EXISTS referral_campaigns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        campaign_name VARCHAR(255) NOT NULL,
        platform VARCHAR(100) DEFAULT 'WhatsApp',
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        budget DECIMAL(15,2) DEFAULT 0,
        clicks INT DEFAULT 0,
        registrations INT DEFAULT 0,
        conversions INT DEFAULT 0,
        commission DECIMAL(15,2) DEFAULT 0,
        roi DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await query(`
      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE;

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS platform VARCHAR(100) DEFAULT 'WhatsApp';

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2) DEFAULT 0;

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0;

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS registrations INT DEFAULT 0;

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS conversions INT DEFAULT 0;

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS commission DECIMAL(15,2) DEFAULT 0;

      ALTER TABLE referral_campaigns
      ADD COLUMN IF NOT EXISTS roi DECIMAL(10,2) DEFAULT 0;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ref_campaigns_partner
      ON referral_campaigns(partner_id);
    `);

    // 5. Team Activity Table
    await query(`
      CREATE TABLE IF NOT EXISTS team_activity (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        child_partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        activity_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_team_act_partner ON team_activity(partner_id);
    `);

    // 6. Team Commissions Overrides Table
    await query(`
      CREATE TABLE IF NOT EXISTS team_commissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        child_partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
        commission_amount DECIMAL(15,2) DEFAULT 0.00,
        level INT DEFAULT 1,
        released BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending',
        released_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_team_comm_parent ON team_commissions(parent_partner_id);
    `);

    // 7. Team Goals Table
    await query(`
      CREATE TABLE IF NOT EXISTS team_goals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        goal_title VARCHAR(255) NOT NULL,
        target_count INT DEFAULT 10,
        current_count INT DEFAULT 0,
        reward_amount DECIMAL(15,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'in_progress',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_team_goals_partner ON team_goals(partner_id);
    `);

    // 8. Team Notifications Table
    await query(`
      CREATE TABLE IF NOT EXISTS team_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        child_partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_team_notif_partner ON team_notifications(partner_id);
    `);

    logger.info('Team & Referral Management System Migration (Task 16) completed successfully.');
  } catch (task16Err) {
    logger.error('Failed to run Team & Referral Management System Migration (Task 16):', task16Err);
    throw task16Err;
  }

  // ── Reports Module Architecture Migration (Task 17) ──
  try {
    logger.info('Running Reports Module Architecture Migration (Task 17)...');

    // 1. Report Cache Table
    await query(`
      CREATE TABLE IF NOT EXISTS report_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        report_type VARCHAR(100) NOT NULL,
        filter_hash VARCHAR(64) NOT NULL,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        report_json JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'ready',
        CONSTRAINT unique_report_cache UNIQUE(report_type, filter_hash, partner_id)
      );
      CREATE INDEX IF NOT EXISTS idx_report_cache_lookup ON report_cache(report_type, filter_hash, partner_id);
    `);

    // 2. Report Exports Table
    await query(`
      CREATE TABLE IF NOT EXISTS report_exports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        report_type VARCHAR(100) NOT NULL,
        format VARCHAR(20) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        storage_path TEXT,
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        downloaded_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'completed'
      );
      CREATE INDEX IF NOT EXISTS idx_report_exports_partner ON report_exports(partner_id);
    `);

    // 3. Scheduled Reports Table
    await query(`
      CREATE TABLE IF NOT EXISTS scheduled_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        report_type VARCHAR(100) NOT NULL,
        frequency VARCHAR(20) DEFAULT 'monthly',
        recipient_email VARCHAR(255) NOT NULL,
        next_run TIMESTAMPTZ,
        last_run TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sched_reports_partner ON scheduled_reports(partner_id);
    `);

    logger.info('Reports Module Architecture Migration (Task 17) completed successfully.');
  } catch (task17Err) {
    logger.error('Failed to run Reports Module Architecture Migration (Task 17):', task17Err);
    throw task17Err;
  }

  // ── Notification & Activity System Migration (Task 18) ──
  try {
    logger.info('Running Notification & Activity System Migration (Task 18)...');

    // 1. Extend notifications table schema
    await query(`
      ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS action_url TEXT,
        ADD COLUMN IF NOT EXISTS reference_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS reference_id UUID,
        ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    `);

    // 2. Notification Preferences Table
    await query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        email_enabled BOOLEAN DEFAULT TRUE,
        sms_enabled BOOLEAN DEFAULT TRUE,
        browser_enabled BOOLEAN DEFAULT TRUE,
        push_enabled BOOLEAN DEFAULT TRUE,
        wallet_notifications BOOLEAN DEFAULT TRUE,
        commission_notifications BOOLEAN DEFAULT TRUE,
        application_notifications BOOLEAN DEFAULT TRUE,
        marketing_notifications BOOLEAN DEFAULT TRUE,
        system_notifications BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Activity Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        module VARCHAR(100) DEFAULT 'system',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reference_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        performed_by UUID REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_act_logs_partner ON activity_logs(partner_id);
    `);

    // 4. Audit Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        role VARCHAR(50),
        module VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        ip VARCHAR(45),
        device VARCHAR(100),
        browser VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    `);

    // 5. Broadcast Notifications Table
    await query(`
      CREATE TABLE IF NOT EXISTS broadcast_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        target VARCHAR(50) DEFAULT 'all',
        priority VARCHAR(20) DEFAULT 'information',
        scheduled_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'active',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Login Activity Table
    await query(`
      CREATE TABLE IF NOT EXISTS login_activity (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        device VARCHAR(100),
        browser VARCHAR(100),
        location VARCHAR(100),
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_login_act_user ON login_activity(user_id);
    `);

    logger.info('Notification & Activity System Migration (Task 18) completed successfully.');
  } catch (task18Err) {
    logger.error('Failed to run Notification & Activity System Migration (Task 18):', task18Err);
    throw task18Err;
  }

  // ── Registration Validation & Business Rules Updates (Task 13) ──
  try {
    logger.info('Running Registration Validation & Business Rules Updates (Task 13)...');

    // 1. Add fields to partner_profiles
    await query(`
      ALTER TABLE partner_profiles 
        ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10) UNIQUE,
        ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12) UNIQUE,
        ADD COLUMN IF NOT EXISTS can_create_team BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS rank VARCHAR(50) DEFAULT 'Silver';
    `);

    // 2. Create referral_campaigns table
    await query(`
      CREATE TABLE IF NOT EXISTS referral_campaigns (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4()
      );
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS campaign_code VARCHAR(100) UNIQUE;
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS target INT DEFAULT 0;
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS bonus_type VARCHAR(50);
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(15,2) DEFAULT 0.00;
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE referral_campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // 3. Create registration_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS registration_logs (
        id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email              VARCHAR(255),
        mobile             VARCHAR(15),
        referral_code      VARCHAR(50),
        parent_partner_id  UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        status             VARCHAR(50),
        failure_reason     TEXT,
        ip_address         VARCHAR(45),
        device             VARCHAR(255),
        browser            VARCHAR(255),
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Create invitation_history table
    await query(`
      CREATE TABLE IF NOT EXISTS invitation_history (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id       UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
        invite_type      VARCHAR(50),
        recipient_name   VARCHAR(255),
        recipient_email  VARCHAR(255),
        recipient_mobile VARCHAR(15),
        referral_code    VARCHAR(50),
        status           VARCHAR(50) DEFAULT 'PENDING',
        sent_at          TIMESTAMPTZ DEFAULT NOW(),
        opened_at        TIMESTAMPTZ,
        registered_at    TIMESTAMPTZ,
        expired_at       TIMESTAMPTZ
      );
    `);

    // 5. Create blacklist table
    await query(`
      CREATE TABLE IF NOT EXISTS blacklist (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type       VARCHAR(50),
        value      VARCHAR(255) UNIQUE NOT NULL,
        reason     TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Alter referral_clicks to add campaign_id
    await query(`
      ALTER TABLE referral_clicks 
        ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES referral_campaigns(id) ON DELETE SET NULL;
    `);

    logger.info('Registration Validation & Business Rules Updates (Task 13) completed successfully.');
  } catch (task13Err) {
    logger.error('Failed to run Registration Validation & Business Rules Updates (Task 13):', task13Err);
    throw task13Err;
  }

  // ── Product Lifecycle Management (Task 14) ──
  try {
    logger.info('Running Product Lifecycle Management Schema Migration (Task 14)...');

    // 1. Alter products table with new columns
    await query(`
      ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS joining_fee VARCHAR(255),
        ADD COLUMN IF NOT EXISTS interest_rate VARCHAR(255),
        ADD COLUMN IF NOT EXISTS rewards TEXT,
        ADD COLUMN IF NOT EXISTS cashback TEXT,
        ADD COLUMN IF NOT EXISTS lounge_access TEXT,
        ADD COLUMN IF NOT EXISTS fuel_surcharge TEXT,
        ADD COLUMN IF NOT EXISTS travel_benefits TEXT,
        ADD COLUMN IF NOT EXISTS company_margin DECIMAL(12,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS hold_days INT DEFAULT 7,
        ADD COLUMN IF NOT EXISTS approval_rate INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS trending BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS internal_notes TEXT;
    `);

    // 2. Product Features (structured, separate from JSONB)
    await query(`
      CREATE TABLE IF NOT EXISTS product_features (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        display_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_features_product ON product_features(product_id);
    `);

    // 3. Product Documents / Brochures
    await query(`
      CREATE TABLE IF NOT EXISTS product_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        document_type VARCHAR(50) DEFAULT 'brochure',
        file_url VARCHAR(500) NOT NULL,
        file_size INT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_docs_product ON product_documents(product_id);
    `);

    // 4. Product FAQs
    await query(`
      CREATE TABLE IF NOT EXISTS product_faq (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_faq_product ON product_faq(product_id);
    `);

    // 5. Product Videos
    await query(`
      CREATE TABLE IF NOT EXISTS product_videos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        youtube_url VARCHAR(500),
        video_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        duration VARCHAR(20),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_videos_product ON product_videos(product_id);
    `);

    // 6. Product Offers
    await query(`
      CREATE TABLE IF NOT EXISTS product_offers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        offer_type VARCHAR(50) DEFAULT 'discount',
        discount_value DECIMAL(12,2) DEFAULT 0,
        start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        end_date TIMESTAMPTZ NOT NULL,
        badge_text VARCHAR(100),
        banner_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_offers_product ON product_offers(product_id);
      CREATE INDEX IF NOT EXISTS idx_prod_offers_active ON product_offers(is_active, start_date, end_date);
    `);

    // 7. Product Ratings
    await query(`
      CREATE TABLE IF NOT EXISTS product_ratings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_product_rating UNIQUE(product_id, partner_id)
      );
      CREATE INDEX IF NOT EXISTS idx_prod_ratings_product ON product_ratings(product_id);
    `);

    // 8. Product Share Logs
    await query(`
      CREATE TABLE IF NOT EXISTS product_share_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        share_method VARCHAR(50) NOT NULL,
        customer_contact VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_share_partner ON product_share_logs(partner_id);
    `);

    // 9. Partner Saved/Bookmarked Products
    await query(`
      CREATE TABLE IF NOT EXISTS partner_saved_products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_partner_bookmark UNIQUE(partner_id, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_saved_partner ON partner_saved_products(partner_id);
    `);

    // 10. Partner Recently Viewed Products
    await query(`
      CREATE TABLE IF NOT EXISTS partner_recent_products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_partner_recent UNIQUE(partner_id, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_recent_partner ON partner_recent_products(partner_id);
    `);

    // 11. Product Views (analytics)
    await query(`
      CREATE TABLE IF NOT EXISTS product_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL,
        viewer_ip VARCHAR(45),
        user_agent TEXT,
        viewed_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prod_views_product ON product_views(product_id);
      CREATE INDEX IF NOT EXISTS idx_prod_views_date ON product_views(viewed_at);
    `);

    // 12. Partner Preferences (for recommendation engine)
    await query(`
      CREATE TABLE IF NOT EXISTS partner_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        partner_id UUID UNIQUE NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
        preferred_categories JSONB DEFAULT '[]',
        preferred_banks JSONB DEFAULT '[]',
        preferred_commission_type VARCHAR(20),
        min_commission DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    logger.info('Product Lifecycle Management Schema Migration (Task 14) completed successfully.');

    // 13. Alter partner_profiles to support company logos
    await query(`
      ALTER TABLE partner_profiles
      ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500) NULL;
    `);

    // 14. Alter referral_clicks to ensure missing tracking columns exist
    await query(`
      ALTER TABLE referral_clicks
        ADD COLUMN IF NOT EXISTS partner_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS visitor_ip VARCHAR(45),
        ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
        ADD COLUMN IF NOT EXISTS os VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
        ADD COLUMN IF NOT EXISTS referrer VARCHAR(1000),
        ADD COLUMN IF NOT EXISTS landing_page VARCHAR(1000),
        ADD COLUMN IF NOT EXISTS registered BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'CLICKED',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS application_id UUID;
    `);
    
    // Run Wallet Engine Migrations
    const runWalletEngineMigrations = require('./migrate_wallet_engine');
    await runWalletEngineMigrations();

    // Task 15: New Commission Flow (Manual approval, drop hold fields, rename statuses)
    try {
      logger.info('Running New Commission Flow Schema Migration (Task 15)...');
      
      // Update statuses to simplified values
      await query(`
        UPDATE wallet_ledger 
        SET status = CASE 
          WHEN status IN ('pending', 'held') THEN 'Pending Approval'
          WHEN status = 'completed' THEN 'Released'
          WHEN status = 'rejected' THEN 'Rejected'
          WHEN status IN ('cancelled', 'expired') THEN 'Cancelled'
          ELSE status
        END;
      `);
      
      await query(`
        UPDATE wallet_transactions 
        SET status = CASE 
          WHEN status IN ('pending', 'held') THEN 'Pending Approval'
          WHEN status = 'completed' THEN 'Released'
          WHEN status = 'rejected' THEN 'Rejected'
          WHEN status IN ('cancelled', 'expired') THEN 'Cancelled'
          ELSE status
        END;
      `);

      // Drop hold/release columns if they exist
      await query(`ALTER TABLE wallet_transactions DROP COLUMN IF EXISTS release_at`);
      await query(`ALTER TABLE wallet_transactions DROP COLUMN IF EXISTS auto_release`);
      await query(`ALTER TABLE wallet_ledger DROP COLUMN IF EXISTS hold_until`);
      await query(`ALTER TABLE commission_ledger DROP COLUMN IF EXISTS hold_until`);
      
      logger.info('New Commission Flow Schema Migration (Task 15) completed successfully.');
    } catch (task15Err) {
      logger.error('Failed to run New Commission Flow Schema Migration (Task 15):', task15Err.message);
      throw task15Err;
    }

    // Task 16: Customer Document Collection & Application Tracking Workflow
    try {
      logger.info('Running Customer Document Workflow Schema Migration (Task 16)...');

      // Add required_documents column to products table
      await query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '["pan_card", "aadhaar", "income_proof", "salary_slip", "bank_statement", "selfie", "address_proof"]'::jsonb;
      `);

      // Customer Access Tokens
      await query(`
        CREATE TABLE IF NOT EXISTS customer_access_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          is_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_cat_token ON customer_access_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_cat_app ON customer_access_tokens(application_id);
      `);

      // Application Documents
      await query(`
        CREATE TABLE IF NOT EXISTS application_documents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          document_type VARCHAR(100) NOT NULL,
          file_url TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'uploaded',
          uploaded_by_customer BOOLEAN DEFAULT TRUE,
          uploaded_at TIMESTAMPTZ DEFAULT NOW(),
          verified_by UUID REFERENCES users(id),
          verified_at TIMESTAMPTZ,
          rejection_reason TEXT,
          version INT DEFAULT 1,
          is_latest BOOLEAN DEFAULT TRUE
        );
        CREATE INDEX IF NOT EXISTS idx_app_docs_app ON application_documents(application_id);
        CREATE INDEX IF NOT EXISTS idx_app_docs_type ON application_documents(document_type);
      `);

      // Application Timeline
      await query(`
        CREATE TABLE IF NOT EXISTS application_timeline (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          event_type VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          actor_type VARCHAR(50) DEFAULT 'system',
          actor_id UUID,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE application_timeline
          ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) NULL,
          ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL,
          ADD COLUMN IF NOT EXISTS description TEXT NULL,
          ADD COLUMN IF NOT EXISTS actor_type VARCHAR(50) DEFAULT 'system',
          ADD COLUMN IF NOT EXISTS actor_id UUID NULL,
          ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        CREATE INDEX IF NOT EXISTS idx_app_timeline_app ON application_timeline(application_id);
        CREATE INDEX IF NOT EXISTS idx_app_timeline_created ON application_timeline(created_at ASC);
      `);

      logger.info('Customer Document Workflow Schema Migration (Task 16) completed successfully.');
    } catch (task16Err) {
      logger.error('Failed to run Customer Document Workflow Schema Migration (Task 16):', task16Err.message);
      throw task16Err;
    }

    // Task 17: Enhanced Partner Product Application Form Schema
    try {
      logger.info('Running Enhanced Partner Product Application Schema Migration (Task 17)...');

      await addEnumValue('application_status', 'draft');
      await addEnumValue('application_status', 'link_sent');
      await addEnumValue('application_status', 'verification_completed');

      await query(`
        ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS process_type VARCHAR(50) DEFAULT 'partner_cell',
        ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS trade_license_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT '+91',
        ADD COLUMN IF NOT EXISTS agree_terms BOOLEAN DEFAULT TRUE;
      `);

      await query(`
        ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS trade_license_number VARCHAR(50);
      `);

      logger.info('Enhanced Partner Product Application Schema Migration (Task 17) completed successfully.');
    } catch (task17Err) {
      logger.error('Failed to run Enhanced Partner Product Application Schema Migration (Task 17):', task17Err.message);
      throw task17Err;
    }

    // Task 18: Loans & Insurance Application Tables and Section Renaming
    try {
      logger.info('Running Loans & Insurance Applications Schema Migration (Task 18)...');

      await query(`
        CREATE TABLE IF NOT EXISTS loan_applications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          loan_type_slug VARCHAR(100) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          mobile VARCHAR(15) NOT NULL,
          email VARCHAR(255),
          loan_amount NUMERIC(15, 2),
          tenure_months INT,
          interest_rate NUMERIC(5, 2),
          monthly_income NUMERIC(15, 2),
          employer_name VARCHAR(255),
          pincode VARCHAR(10),
          city VARCHAR(100),
          state VARCHAR(100),
          partner_id UUID REFERENCES partner_profiles(id),
          status VARCHAR(50) DEFAULT 'submitted',
          remarks TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_loan_app_type ON loan_applications(loan_type_slug);
        CREATE INDEX IF NOT EXISTS idx_loan_app_status ON loan_applications(status);
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS insurance_applications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          insurance_type_slug VARCHAR(100) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          mobile VARCHAR(15) NOT NULL,
          email VARCHAR(255),
          policy_type VARCHAR(100),
          sum_insured NUMERIC(15, 2),
          premium_amount NUMERIC(15, 2),
          pincode VARCHAR(10),
          city VARCHAR(100),
          state VARCHAR(100),
          nominee_name VARCHAR(255),
          partner_id UUID REFERENCES partner_profiles(id),
          status VARCHAR(50) DEFAULT 'submitted',
          remarks TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_ins_app_type ON insurance_applications(insurance_type_slug);
        CREATE INDEX IF NOT EXISTS idx_ins_app_status ON insurance_applications(status);
      `);

      await query(`
        UPDATE homepage_sections
        SET title = 'Recharge & Bills'
        WHERE key = 'money_transfer';
      `).catch(() => {});

      logger.info('Loans & Insurance Applications Schema Migration (Task 18) completed successfully.');
    } catch (task18Err) {
      logger.error('Failed to run Loans & Insurance Applications Schema Migration (Task 18):', task18Err.message);
      throw task18Err;
    }

    // Task 19: Bank-Wise Credit Card Application Module Tables
    try {
      logger.info('Running Bank-Wise Credit Card Application Schema Migration (Task 19)...');

      await query(`
        CREATE TABLE IF NOT EXISTS bank_card_applications (
          id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_no            VARCHAR(30) UNIQUE NOT NULL,
          bank_id                   UUID NOT NULL REFERENCES banks(id),
          customer_id               UUID REFERENCES customers(id),
          partner_id                UUID REFERENCES partner_profiles(id),

          -- Step 1: Credit Card Application
          credit_card_category      VARCHAR(100),
          customer_name             VARCHAR(255) NOT NULL,
          customer_mobile           VARCHAR(15) NOT NULL,
          pan_number                VARCHAR(10) NOT NULL,
          resident_pincode          VARCHAR(10),
          process_by                UUID REFERENCES users(id),
          pan_check_comments        TEXT,
          qd_executive_name         VARCHAR(255),
          resident_pin_comments     TEXT,
          next_qd_date              DATE,

          -- Step 2: Credit Card Assist
          dob                       DATE,
          mother_name               VARCHAR(255),
          residence_address         TEXT,
          company_name              VARCHAR(255),
          designation               VARCHAR(255),
          email                     VARCHAR(255),
          official_email            VARCHAR(255),
          gross_monthly_income      DECIMAL(12,2),
          pan_check_executive_name  VARCHAR(255),

          -- Status Information
          app_code_status           VARCHAR(50),
          qd_status                 VARCHAR(50),
          surrogate                 VARCHAR(100),
          income_status             VARCHAR(50),
          blaze_status               VARCHAR(50),
          telco_stage                VARCHAR(50),
          official_mail_status       VARCHAR(50),
          vkyc_status                VARCHAR(50),
          dispatch_stage              VARCHAR(50),
          final_stage                 VARCHAR(50) DEFAULT 'Customer Details',

          -- Rejection Information
          decline_description        TEXT,
          decline_code                VARCHAR(50),
          curable_solved              VARCHAR(50),
          curable_executive           VARCHAR(255),
          other_comments               TEXT,

          not_interested_comment      TEXT,
          kyc_pending_comment          TEXT,

          created_by                   UUID REFERENCES users(id),
          updated_by                   UUID REFERENCES users(id),
          created_at                   TIMESTAMPTZ DEFAULT NOW(),
          updated_at                   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_bcca_bank ON bank_card_applications(bank_id);
        CREATE INDEX IF NOT EXISTS idx_bcca_status ON bank_card_applications(final_stage);
        CREATE INDEX IF NOT EXISTS idx_bcca_pan ON bank_card_applications(pan_number);

        CREATE TABLE IF NOT EXISTS bank_card_application_timeline (
          id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_id UUID NOT NULL REFERENCES bank_card_applications(id) ON DELETE CASCADE,
          stage          VARCHAR(50) NOT NULL,
          note           TEXT,
          changed_by     UUID REFERENCES users(id),
          created_at     TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_bcat_app ON bank_card_application_timeline(application_id);
      `);

      logger.info('Bank-Wise Credit Card Application Schema Migration (Task 19) completed successfully.');
    } catch (task19Err) {
      logger.error('Failed to run Bank-Wise Credit Card Application Schema Migration (Task 19):', task19Err.message);
      throw task19Err;
    }

    // Task 20: Dynamic Bank & Product Management Schema Extensions
    try {
      logger.info('Running Dynamic Bank & Product Management Schema Migration (Task 20)...');

      await query(`
        ALTER TABLE banks ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
        ALTER TABLE banks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
        ALTER TABLE banks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS fees_structure JSONB DEFAULT '{}';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT '{}';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS commissions_json JSONB DEFAULT '{}';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS features_list JSONB DEFAULT '[]';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits_list JSONB DEFAULT '[]';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_specs JSONB DEFAULT '{}';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility JSONB DEFAULT '{"show_on_website":true,"show_in_partner":true,"is_featured":false,"is_popular":false}';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_metadata JSONB DEFAULT '{}';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS card_image_url VARCHAR(500);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
      `);

      logger.info('Dynamic Bank & Product Management Schema Migration (Task 20) completed successfully.');
    } catch (task20Err) {
      logger.error('Failed to run Dynamic Bank & Product Management Schema Migration (Task 20):', task20Err.message);
      throw task20Err;
    }

    // Task 21: SBI Credit Card Application Module Tables
    try {
      logger.info('Running SBI Credit Card Application Schema Migration (Task 21)...');

      await query(`
        CREATE SEQUENCE IF NOT EXISTS sbi_app_number_seq START 1245;

        CREATE TABLE IF NOT EXISTS sbi_credit_card_applications (
          id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_no            VARCHAR(30) UNIQUE NOT NULL,
          customer_id               UUID REFERENCES customers(id),
          partner_id                UUID REFERENCES partner_profiles(id),
          credit_card_category      VARCHAR(100),
          customer_name             VARCHAR(255) NOT NULL,
          customer_mobile           VARCHAR(15) NOT NULL,
          pan_number                VARCHAR(10) NOT NULL,
          resident_pincode          VARCHAR(10),
          process_by                UUID REFERENCES users(id),
          pan_check_comments        TEXT,
          qd_executive_name         VARCHAR(255),
          resident_pin_comments     TEXT,
          next_qd_date              DATE,
          dob                       DATE,
          mother_name               VARCHAR(255),
          residence_address         TEXT,
          company_name              VARCHAR(255),
          designation               VARCHAR(255),
          email                     VARCHAR(255),
          official_email            VARCHAR(255),
          gross_monthly_income      DECIMAL(12,2),
          resident_pin_comment      TEXT,
          pan_check_executive       VARCHAR(255),
          application_code_status   VARCHAR(50),
          qd_status                 VARCHAR(50),
          surrogate                 VARCHAR(100),
          income_status             VARCHAR(50),
          blaze_status               VARCHAR(50),
          telco_stage                VARCHAR(50),
          official_mail_status       VARCHAR(50),
          vkyc_status                VARCHAR(50),
          dispatch_stage              VARCHAR(50),
          final_stage                 VARCHAR(50) DEFAULT 'Customer Details',
          decline_description        TEXT,
          decline_code                VARCHAR(50),
          curable_solved              VARCHAR(50),
          curable_executive           VARCHAR(255),
          other_comments               TEXT,
          created_by                   UUID REFERENCES users(id),
          updated_by                   UUID REFERENCES users(id),
          created_at                   TIMESTAMPTZ DEFAULT NOW(),
          updated_at                   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sbi_cc_application_timeline (
          id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          application_id UUID NOT NULL REFERENCES sbi_credit_card_applications(id) ON DELETE CASCADE,
          stage          VARCHAR(50) NOT NULL,
          activity       VARCHAR(100),
          note           TEXT,
          changed_by     UUID REFERENCES users(id),
          created_at     TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_sbi_cca_pan ON sbi_credit_card_applications(pan_number);
        CREATE INDEX IF NOT EXISTS idx_sbi_cca_status ON sbi_credit_card_applications(final_stage);
        CREATE INDEX IF NOT EXISTS idx_sbi_ccat_app ON sbi_cc_application_timeline(application_id);
      `);

      logger.info('SBI Credit Card Application Schema Migration (Task 21) completed successfully.');
    } catch (task21Err) {
      logger.error('Failed to run SBI Credit Card Application Schema Migration (Task 21):', task21Err.message);
      throw task21Err;
    }
    
  } catch (task14Err) {
    logger.error('Failed to run Product Lifecycle Management Schema Migration (Task 14):', task14Err);
    throw task14Err;
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
