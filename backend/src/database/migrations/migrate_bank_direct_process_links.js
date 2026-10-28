const { query } = require('../../config/database');
const logger = require('../../config/logger');

let schemaEnsured = false;

/**
 * Idempotent migration for bank_direct_process_links table.
 * Stores one active Direct Process link per bank (unique on bank_id)
 * with full audit metadata (created_at, updated_at, created_by, updated_by).
 */
const migrateBankDirectProcessLinks = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS bank_direct_process_links (
        id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        bank_id             UUID NOT NULL UNIQUE REFERENCES banks(id) ON DELETE CASCADE,
        direct_process_link TEXT NOT NULL,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW(),
        created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by          UUID REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bank_direct_process_links_bank_id
        ON bank_direct_process_links(bank_id);

      ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_url TEXT;
    `);
    schemaEnsured = true;
    logger.info('[Migration] Verified bank_direct_process_links table and indexes.');
  } catch (err) {
    logger.error('[Migration] Failed to initialize bank_direct_process_links table:', err.message);
    throw err;
  }
};

const ensureBankDirectProcessLinksTable = async () => {
  if (schemaEnsured) return;
  await migrateBankDirectProcessLinks();
};

module.exports = {
  migrateBankDirectProcessLinks,
  ensureBankDirectProcessLinksTable
};
