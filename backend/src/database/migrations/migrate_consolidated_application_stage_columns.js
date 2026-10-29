/**
 * migrate_consolidated_application_stage_columns.js
 * 
 * Consolidated, Idempotent Database Migration:
 * 1. Permanently ensures all application stage, operator code, and curing columns
 *    exist on `applications` and `physical_application_details` tables.
 * 2. Formalizes all previously unmigrated runtime columns on `employee_candidates`,
 *    `partner_profiles`, and `products`.
 * 3. Safely manages transaction boundaries: DDL column additions run inside an atomic
 *    transaction, while performance indexes run CONCURRENTLY outside transaction blocks.
 * 
 * Safety:
 * - 100% idempotent (uses ADD COLUMN IF NOT EXISTS).
 * - Safe default values preserved.
 * - Non-blocking CREATE INDEX CONCURRENTLY execution with invalid-index cleanup.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { pool, query } = require('../../config/database');
const logger = require('../../config/logger');

// Helper: Validate database destination to prevent accidental execution against production
function validateMigrationDestination() {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const dbHost = (process.env.DB_HOST || '').toLowerCase();
  const dbUrl = (process.env.DATABASE_URL || '').toLowerCase();

  const isProdHost = dbHost.includes('prod') || dbUrl.includes('prod');
  const isProdEnv = nodeEnv === 'production';

  if ((isProdHost || isProdEnv) && process.env.ALLOW_PRODUCTION_MIGRATION !== 'true') {
    const errorMsg = '[Migration Safety] Execution blocked: Target environment indicates production, but ALLOW_PRODUCTION_MIGRATION=true was not supplied. Aborting.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

async function migrateConsolidatedApplicationColumns() {
  logger.info('[Migration] Starting consolidated application schema verification...');
  validateMigrationDestination();

  const client = await pool.connect();

  // ── 1. Column Additions inside an Atomic Transaction ────────────────────────
  try {
    await client.query('BEGIN');

    // 1.0 Check existing type of bank_smart_emi_offer to detect incompatible DECIMAL(15,2) vs TEXT
    const { rows: colCheck } = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications' AND column_name = 'bank_smart_emi_offer'
    `);
    if (colCheck.length > 0 && colCheck[0].data_type !== 'text') {
      logger.warn(`[Migration Warning] applications.bank_smart_emi_offer exists with data_type '${colCheck[0].data_type}'. Expected 'text'. Incompatible type requires DBA review.`);
    }

    // 1.1 Columns on applications Table
    await client.query(`
      ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS ipa_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS kyc_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS card_approval_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS digital_card_issued VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_status VARCHAR(20) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS remark_updated BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS remark_updated_by UUID,
        ADD COLUMN IF NOT EXISTS remark_updated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS pan_check VARCHAR(10) DEFAULT 'no',
        ADD COLUMN IF NOT EXISTS bank_current_lead_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS approved_by UUID,
        ADD COLUMN IF NOT EXISTS sales_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pan_checker_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS backend_remark TEXT,
        ADD COLUMN IF NOT EXISTS cureble_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS primary_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS cureble_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS cureble_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_card_approval VARCHAR(100),
        ADD COLUMN IF NOT EXISTS soft_approval_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS salas_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_opretor_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS user_remark TEXT,
        ADD COLUMN IF NOT EXISTS smart_emi_amount DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS bank_smart_emi_offer TEXT,
        ADD COLUMN IF NOT EXISTS bank_smart_emi_tenure VARCHAR(50);
    `);

    // 1.2 Columns on physical_application_details Table
    await client.query(`
      ALTER TABLE physical_application_details
        ADD COLUMN IF NOT EXISTS sales_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pan_checker_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS backend_remark TEXT,
        ADD COLUMN IF NOT EXISTS cureble_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS primary_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS cureble_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS cureble_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_card_approval VARCHAR(100),
        ADD COLUMN IF NOT EXISTS queryable_remark VARCHAR(100),
        ADD COLUMN IF NOT EXISTS queryable_sales_remark TEXT,
        ADD COLUMN IF NOT EXISTS digital_remark VARCHAR(100),
        ADD COLUMN IF NOT EXISTS decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS decline_remark TEXT,
        ADD COLUMN IF NOT EXISTS ipa_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS soft_approval_stage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS salas_operator_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS remark_opretor_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS user_remark TEXT,
        ADD COLUMN IF NOT EXISTS bank_smart_emi_offer TEXT;
    `);

    // 1.3 Formalize Category 1 Runtime Columns & Objects
    await client.query(`
      ALTER TABLE employee_candidates
        ADD COLUMN IF NOT EXISTS hr_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS target_role VARCHAR(100),
        ADD COLUMN IF NOT EXISTS referred_by_employee_id UUID;

      ALTER TABLE partner_profiles
        ADD COLUMN IF NOT EXISTS referred_by_employee_id UUID;

      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS joining_fee VARCHAR(255),
        ADD COLUMN IF NOT EXISTS processing_fee VARCHAR(255),
        ADD COLUMN IF NOT EXISTS interest_rate VARCHAR(255),
        ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS commission_release_days INT DEFAULT 7;

      CREATE SEQUENCE IF NOT EXISTS candidate_reference_seq START 10001;

      CREATE TABLE IF NOT EXISTS otp_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identity VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    logger.info('[Migration] All stage and runtime columns verified successfully inside transaction.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      logger.error('[Migration] Rollback failed:', rbErr.message);
    }
    logger.error('[Migration] Column verification failed:', err.message);
    throw err;
  } finally {
    client.release();
  }

  // ── 2. Concurrent Performance Indexes (Executed Outside Transaction) ─────────
  // Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction block in PostgreSQL.
  const performanceIndexes = [
    {
      name: 'idx_apps_status_created_desc',
      table: 'applications',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_status_created_desc ON applications(status, created_at DESC)`
    },
    {
      name: 'idx_apps_remark_pending_prod',
      table: 'applications',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_remark_pending_prod ON applications(product_id, created_at DESC) WHERE COALESCE(remark_status, 'PENDING') = 'PENDING'`
    },
    {
      name: 'idx_apps_sales_operator_code',
      table: 'applications',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_sales_operator_code ON applications(sales_operator_code) WHERE sales_operator_code IS NOT NULL`
    },
    {
      name: 'idx_apps_remark_operator_code',
      table: 'applications',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_remark_operator_code ON applications(remark_operator_code) WHERE remark_operator_code IS NOT NULL`
    }
  ];

  const failedIndexes = [];

  for (const idx of performanceIndexes) {
    try {
      // 2.1 Check for and clean up any prior invalid index build attempts in public schema on target table
      const { rows: invalidIdx } = await query(`
        SELECT c.relname as index_name
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = $1 
          AND t.relname = $2 
          AND i.indisvalid = false
      `, [idx.name, idx.table]);

      if (invalidIdx.length > 0) {
        logger.warn(`[Migration] Found invalid index ${idx.name} on table ${idx.table} from earlier aborted run. Dropping concurrently...`);
        await query(`DROP INDEX CONCURRENTLY IF EXISTS ${idx.name}`);
      }

      await query(idx.sql);
      logger.info(`[Migration] Performance index verified: ${idx.name}`);
    } catch (idxErr) {
      failedIndexes.push({ name: idx.name, error: idxErr.message });
      logger.error(`[Migration] Concurrent index notice/failure for ${idx.name}:`, idxErr.message);
    }
  }

  if (failedIndexes.length > 0) {
    const warnMsg = `[Migration Notice] Column migration succeeded, but ${failedIndexes.length} concurrent index(es) encountered notices/errors: ${failedIndexes.map(f => f.name).join(', ')}`;
    logger.warn(warnMsg);
    return { success: false, message: warnMsg, failedIndexes };
  }

  logger.info('[Migration] Consolidated application schema migration completed successfully.');
  return { success: true, message: 'Consolidated application schema migration complete.' };
}

if (require.main === module) {
  migrateConsolidatedApplicationColumns()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { migrateConsolidatedApplicationColumns };
