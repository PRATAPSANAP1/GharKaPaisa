require('dotenv').config();
const { query } = require('./db');
const logger = require('../utils/logger');

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
  try { await query(`ALTER TYPE user_role RENAME VALUE 'super_admin' TO 'SUPER_ADMIN'`); } catch (err) {}
  try { await query(`ALTER TYPE user_role RENAME VALUE 'admin' TO 'ADMIN'`); } catch (err) {}
  try { await query(`ALTER TYPE user_role RENAME VALUE 'employee' TO 'EMPLOYEE'`); } catch (err) {}
  try { await query(`ALTER TYPE user_role RENAME VALUE 'Partner' TO 'PARTNER'`); } catch (err) {}
  try { await query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'PARTNER'`); } catch (err) {}
  await query(`
    DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('pending','active','suspended','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
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
  try {
    await query(`ALTER TYPE application_status ADD VALUE 'confirmed'`);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      throw err;
    }
  }
  await query(`
    DO $$ BEGIN
      CREATE TYPE product_category AS ENUM ('credit_card','personal_loan','home_loan','business_loan',
        'instant_loan','used_car_loan','education_loan','lac','health_insurance',
        'life_insurance','general_insurance','fd_card','co_branded_card','investment','card_on_loan');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
  await query(`
    DO $$ BEGIN
      ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'card_on_loan';
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
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
    CREATE TABLE IF NOT EXISTS Partner_profiles (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      Partner_code        VARCHAR(20) UNIQUE NOT NULL,
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

  await query(`ALTER TABLE Partner_profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);


  // ── Partner Bank Details ────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS Partner_bank_details (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      Partner_id            UUID UNIQUE NOT NULL REFERENCES Partner_profiles(id) ON DELETE CASCADE,
      bank_name           VARCHAR(100) NOT NULL,
      account_number      VARCHAR(50) NOT NULL,
      ifsc_code           VARCHAR(15) NOT NULL,
      account_holder_name VARCHAR(255) NOT NULL,
      is_verified         BOOLEAN DEFAULT FALSE,
      verified_at         TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Database Schema Alignment (Migrate agent tables/columns to partner) ──
  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agent_profiles') THEN
        INSERT INTO Partner_profiles (id, user_id, Partner_code, first_name, last_name, profile_photo_url, current_address, business_location, company_name, company_type, gst_number, kyc_status, approved_by, approved_at, rejection_reason, created_at, updated_at)
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
        INSERT INTO Partner_bank_details (id, Partner_id, bank_name, account_number, ifsc_code, account_holder_name, is_verified, verified_at, created_at, updated_at)
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
        ALTER TABLE applications RENAME COLUMN agent_id TO Partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='agent_id') THEN
        ALTER TABLE withdrawal_requests RENAME COLUMN agent_id TO Partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='agent_id') THEN
        ALTER TABLE wallets RENAME COLUMN agent_id TO Partner_id;
      END IF;
    END $$;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commission_structures' AND column_name='agent_id') THEN
        ALTER TABLE commission_structures RENAME COLUMN agent_id TO Partner_id;
      END IF;
    END $$;
  `);

  // ── KYC Documents ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS kyc_documents (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      Partner_id      UUID NOT NULL REFERENCES Partner_profiles(id) ON DELETE CASCADE,
      doc_type      VARCHAR(50) NOT NULL,  -- aadhaar, pan, gst_cert, cancelled_cheque
      doc_number    VARCHAR(50),
      file_url      VARCHAR(500) NOT NULL,
      s3_key        VARCHAR(500) NOT NULL,
      verified      BOOLEAN DEFAULT FALSE,
      verified_by   UUID REFERENCES users(id),
      verified_at   TIMESTAMPTZ,
      uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(Partner_id, doc_type)
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

  // ── Commission Structure (overrides per Partner/product) ────────
  await query(`
    CREATE TABLE IF NOT EXISTS commission_structures (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id       UUID NOT NULL REFERENCES products(id),
      Partner_id         UUID REFERENCES Partner_profiles(id),  -- NULL = global default
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
      Partner_id           UUID NOT NULL REFERENCES Partner_profiles(id),
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

  await query(`CREATE INDEX IF NOT EXISTS idx_applications_Partner ON applications(Partner_id)`);
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
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      Partner_id          UUID UNIQUE NOT NULL REFERENCES Partner_profiles(id) ON DELETE CASCADE,
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
      wallet_id      UUID NOT NULL REFERENCES wallets(id),
      partner_id     UUID REFERENCES Partner_profiles(id),
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
  await query(`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES Partner_profiles(id)`);
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
      wallet_id       UUID NOT NULL REFERENCES wallets(id),
      Partner_id        UUID NOT NULL REFERENCES Partner_profiles(id),
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
      partner_id    UUID NOT NULL REFERENCES Partner_profiles(id) ON DELETE CASCADE,
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
  await query(`CREATE INDEX IF NOT EXISTS idx_leads_product ON leads(product_id)`);


  await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_customers_pan ON customers(pan_number)`);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_bank_name ON products(bank_id, name)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_txn_status ON wallet_transactions(status) WHERE status = 'pending'`);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_txn_release ON wallet_transactions(release_at) WHERE status = 'pending'`);
  await query(`CREATE INDEX IF NOT EXISTS idx_withdrawal_partner ON withdrawal_requests(Partner_id, status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_partner_code ON Partner_profiles(Partner_code)`);

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
      wallet_id              UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      action                 VARCHAR(50) NOT NULL,
      old_available_balance  DECIMAL(15,2),
      new_available_balance  DECIMAL(15,2),
      old_hold_balance       DECIMAL(15,2),
      new_hold_balance       DECIMAL(15,2),
      created_at             TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_audit_logs_created_at ON wallet_audit_logs(created_at DESC)`);

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

  await query(`DROP TRIGGER IF EXISTS audit_wallet_trigger ON wallets`);
  await query(`
    CREATE TRIGGER audit_wallet_trigger
    AFTER INSERT OR UPDATE OR DELETE ON wallets
    FOR EACH ROW EXECUTE FUNCTION log_wallet_changes()
  `);

  // ── updated_at trigger function ───────────────────────────────
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `);
  const triggerTables = ['users', 'Partner_profiles', 'Partner_bank_details', 'products', 'customers', 'applications', 'withdrawal_requests', 'leads'];
  for (const t of triggerTables) {
    await query(`DROP TRIGGER IF EXISTS set_updated_at ON ${t}`);
    await query(`
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON ${t}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
  }

  // Clean up all old super admin records
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('gharkapaisa.in', 10);
  await query(`DELETE FROM users WHERE role = 'SUPER_ADMIN' AND email NOT IN ($1, $2)`, ['sharadyohesa@gmail.com', 'pratapsanap14@gmail.com']);

  // Seed Super Admin Sharad Yohesa if not exists
  const { rows: [existingSuper] } = await query(`SELECT id FROM users WHERE email = $1`, ['sharadyohesa@gmail.com']);
  if (!existingSuper) {
    await query(`
      INSERT INTO users (email, mobile, role, status, full_name, password_hash, is_active, email_verified)
      VALUES ($1, $2, 'SUPER_ADMIN', 'active', $3, $4, true, true)
    `, ['sharadyohesa@gmail.com', '8087179438', 'Sharad Yohesa', hashedPassword]);
    logger.info('Super admin Sharad Yohesa seeded successfully');
  } else {
    // Make sure role, status, mobile, and password are set correctly
    await query(`
      UPDATE users 
      SET role = 'SUPER_ADMIN', status = 'active', is_active = true, full_name = 'Sharad Yohesa', mobile = '8087179438', password_hash = $1, email_verified = true
      WHERE email = 'sharadyohesa@gmail.com'
    `, [hashedPassword]);
    logger.info('Super admin Sharad Yohesa configuration verified');
  }

  // Seed Super Admin Pratap Sanap if not exists
  const { rows: [existingSuper2] } = await query(`SELECT id FROM users WHERE email = $1`, ['pratapsanap14@gmail.com']);
  if (!existingSuper2) {
    await query(`
      INSERT INTO users (email, mobile, role, status, full_name, password_hash, is_active, email_verified)
      VALUES ($1, $2, 'SUPER_ADMIN', 'active', $3, $4, true, true)
    `, ['pratapsanap14@gmail.com', '9370470692', 'Pratap Sanap', hashedPassword]);
    logger.info('Super admin Pratap Sanap seeded successfully');
  } else {
    await query(`
      UPDATE users 
      SET role = 'SUPER_ADMIN', status = 'active', is_active = true, full_name = 'Pratap Sanap', mobile = '9370470692', password_hash = $1, email_verified = true
      WHERE email = 'pratapsanap14@gmail.com'
    `, [hashedPassword]);
    logger.info('Super admin Pratap Sanap configuration verified');
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
    const { encrypt } = require('../utils/crypto');
    const { rows: bankDetails } = await query(`SELECT id, account_number FROM Partner_bank_details`);
    for (const row of bankDetails) {
      if (row.account_number && !row.account_number.includes(':')) {
        const encrypted = encrypt(row.account_number);
        await query(`UPDATE Partner_bank_details SET account_number = $1 WHERE id = $2`, [encrypted, row.id]);
      }
    }
    logger.info('Partner bank details encryption migration completed successfully');
  } catch (cryptoErr) {
    logger.warn('Failed to encrypt existing bank details:', cryptoErr.message);
  }

  logger.info('✅ All migrations completed successfully');
  process.exit(0);
};

migrate().catch(err => {
  logger.error('Migration failed', err);
  process.exit(1);
});
