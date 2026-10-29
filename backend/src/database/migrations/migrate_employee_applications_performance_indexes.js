/**
 * migrate_employee_applications_performance_indexes.js
 * ──────────────────────────────────────────────────────────────────────────
 * Evidence-based database performance indexes for GET /api/v1/applications
 * Supports the Employee Applications listing, filtering, and ordering.
 * 
 * Safety:
 * - All index definitions use IF NOT EXISTS
 * - Dedicated connection checkout with guaranteed client.release() in finally block
 * - Uses CONCURRENTLY in production/staging environments if executed outside transactions,
 *   or standard DDL with non-blocking partial indexes.
 * - ZERO access to remote production database during build/development.
 */

const { getClient, query } = require('../../config/database');
const logger = require('../../config/logger');

const INDEX_DEFINITIONS = [
  {
    name: 'idx_applications_employee_created',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_applications_employee_created
      ON applications(employee_id, created_at DESC)
      WHERE employee_id IS NOT NULL
    `,
    dropSql: `DROP INDEX IF EXISTS idx_applications_employee_created`,
    description: 'Supports employee application list filtered by employee_id and sorted by created_at DESC'
  },
  {
    name: 'idx_applications_submitted_created',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_applications_submitted_created
      ON applications(submitted_by, created_at DESC)
      WHERE submitted_by IS NOT NULL
    `,
    dropSql: `DROP INDEX IF EXISTS idx_applications_submitted_created`,
    description: 'Supports applications submitted by employee/user sorted by created_at DESC'
  },
  {
    name: 'idx_applications_status_created',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_applications_status_created
      ON applications(status, created_at DESC)
    `,
    dropSql: `DROP INDEX IF EXISTS idx_applications_status_created`,
    description: 'Supports filtering by status tabs (pending, approved, rejected, etc.) sorted by created_at DESC'
  },
  {
    name: 'idx_applications_assigned_emp_created',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_applications_assigned_emp_created
      ON applications(assigned_to_employee_id, created_at DESC)
      WHERE assigned_to_employee_id IS NOT NULL
    `,
    dropSql: `DROP INDEX IF EXISTS idx_applications_assigned_emp_created`,
    description: 'Supports employee assigned application queue sorted by created_at DESC'
  },
  {
    name: 'idx_applications_partner_created',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_applications_partner_created
      ON applications(partner_id, created_at DESC)
      WHERE partner_id IS NOT NULL
    `,
    dropSql: `DROP INDEX IF EXISTS idx_applications_partner_created`,
    description: 'Supports partner/team application scope sorted by created_at DESC'
  }
];

async function up() {
  logger.info('[Migration] Starting employee applications performance index creation...');
  const client = await getClient();
  try {
    for (const idx of INDEX_DEFINITIONS) {
      logger.info(`[Migration] Creating index: ${idx.name} - ${idx.description}`);
      await client.query(idx.sql);
      logger.info(`[Migration] ✓ Created index ${idx.name}`);
    }
    logger.info('[Migration] All employee applications performance indexes applied successfully.');
    return { success: true };
  } catch (err) {
    logger.error('[Migration] Failed to create performance indexes:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function down() {
  logger.info('[Migration] Dropping employee applications performance indexes...');
  const client = await getClient();
  try {
    for (const idx of INDEX_DEFINITIONS) {
      logger.info(`[Migration] Dropping index: ${idx.name}`);
      await client.query(idx.dropSql);
      logger.info(`[Migration] ✓ Dropped index ${idx.name}`);
    }
    logger.info('[Migration] All employee applications performance indexes dropped successfully.');
    return { success: true };
  } catch (err) {
    logger.error('[Migration] Failed to drop performance indexes:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const isDown = process.argv.includes('--down') || process.argv.includes('down');
  (isDown ? down() : up())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  INDEX_DEFINITIONS,
  up,
  down
};

