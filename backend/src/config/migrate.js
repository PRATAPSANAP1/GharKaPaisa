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
      CREATE TYPE user_role AS ENUM ('super_admin','admin','employee','agent');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);
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
  await query(`
    DO $$ BEGIN
      CREATE TYPE product_category AS ENUM ('credit_card','personal_loan','home_loan','business_loan',
        'instant_loan','used_car_loan','education_loan','lac','health_insurance',
        'life_insurance','general_insurance','fd_card','co_branded_card','investment');
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
      CREATE TYPE withdrawal_status AS ENUM ('pending','approved','processed','rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `);

  // ── Users (all roles) ─────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email         VARCHAR(255) UNIQUE NOT NULL,
      mobile        VARCHAR(15) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          user_role NOT NULL DEFAULT 'agent',
      status        user_status NOT NULL DEFAULT 'pending',
      created_by    UUID REFERENCES users(id),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    )
  `);

  // ── OTP Store ─────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS otps (
      id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      mobile     VARCHAR(15) NOT NULL,
      otp_hash   VARCHAR(255) NOT NULL,
      purpose    VARCHAR(50) NOT NULL DEFAULT 'login',
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile)`);

  // ── Agent Profiles ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS agent_profiles (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_code        VARCHAR(20) UNIQUE NOT NULL,
      first_name        VARCHAR(100) NOT NULL,
      last_name         VARCHAR(100) NOT NULL,
      profile_photo_url VARCHAR(500),
      current_address   TEXT,
      business_location TEXT,
      company_name      VARCHAR(255),
      company_type      VARCHAR(100),
      gst_number        VARCHAR(20),
      kyc_status        kyc_status DEFAULT 'pending',
      approved_by       UUID REFERENCES users(id),
      approved_at       TIMESTAMPTZ,
      rejection_reason  TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Agent Bank Details ────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS agent_bank_details (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      agent_id            UUID UNIQUE NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
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

  // ── KYC Documents ────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS kyc_documents (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      agent_id      UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
      doc_type      VARCHAR(50) NOT NULL,  -- aadhaar, pan, gst_cert, cancelled_cheque
      doc_number    VARCHAR(50),
      file_url      VARCHAR(500) NOT NULL,
      s3_key        VARCHAR(500) NOT NULL,
      verified      BOOLEAN DEFAULT FALSE,
      verified_by   UUID REFERENCES users(id),
      verified_at   TIMESTAMPTZ,
      uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(agent_id, doc_type)
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

  // ── Commission Structure (overrides per agent/product) ────────
  await query(`
    CREATE TABLE IF NOT EXISTS commission_structures (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id       UUID NOT NULL REFERENCES products(id),
      agent_id         UUID REFERENCES agent_profiles(id),  -- NULL = global default
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
      agent_id           UUID NOT NULL REFERENCES agent_profiles(id),
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
      commission_status  wallet_txn_status DEFAULT 'pending',
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_agent ON applications(agent_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC)`);

  // ── Wallet ────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      agent_id          UUID UNIQUE NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
      total_earned      DECIMAL(15,2) DEFAULT 0,
      total_withdrawn   DECIMAL(15,2) DEFAULT 0,
      pending_amount    DECIMAL(15,2) DEFAULT 0,
      available_balance DECIMAL(15,2) DEFAULT 0,
      last_updated      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // ── Wallet Transactions ───────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      wallet_id      UUID NOT NULL REFERENCES wallets(id),
      application_id UUID REFERENCES applications(id),
      txn_type       wallet_txn_type NOT NULL,
      amount         DECIMAL(12,2) NOT NULL,
      status         wallet_txn_status DEFAULT 'pending',
      description    VARCHAR(500),
      processed_by   UUID REFERENCES users(id),
      processed_at   TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet ON wallet_transactions(wallet_id)`);

  // ── Withdrawal Requests ───────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      wallet_id       UUID NOT NULL REFERENCES wallets(id),
      agent_id        UUID NOT NULL REFERENCES agent_profiles(id),
      amount          DECIMAL(12,2) NOT NULL,
      status          withdrawal_status DEFAULT 'pending',
      bank_name       VARCHAR(100),
      account_number  VARCHAR(50),
      ifsc_code       VARCHAR(15),
      utr_number      VARCHAR(50),
      processed_by    UUID REFERENCES users(id),
      processed_at    TIMESTAMPTZ,
      rejection_reason TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

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

  // ── updated_at trigger function ───────────────────────────────
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql
  `);
  const triggerTables = ['users','agent_profiles','agent_bank_details','products','customers','applications','withdrawal_requests'];
  for (const t of triggerTables) {
    await query(`
      DROP TRIGGER IF EXISTS set_updated_at ON ${t};
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON ${t}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
  }

  logger.info('✅ All migrations completed successfully');
  process.exit(0);
};

migrate().catch(err => {
  logger.error('Migration failed', err);
  process.exit(1);
});
