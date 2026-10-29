/**
 * Migration: Add adobe_support_url column to products table
 *
 * Adds:
 *   products.adobe_support_url TEXT — product-level Adobe Support button URL for eligible HDFC products
 *
 * All operations are idempotent (IF NOT EXISTS).
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { pool } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateAddAdobeSupportUrl() {
  const client = await pool.connect();
  try {
    logger.info('[Migration] Starting adobe_support_url column migration on products table...');
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS adobe_support_url TEXT;
    `);
    logger.info('[Migration] Ensured column products.adobe_support_url exists');

    await client.query('COMMIT');
    logger.info('[Migration] adobe_support_url column migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('[Migration] adobe_support_url column migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateAddAdobeSupportUrl()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateAddAdobeSupportUrl };

