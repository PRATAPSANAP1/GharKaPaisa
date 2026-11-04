/**
 * Performance indexes and schema hardening for Lead Orchestration
 * Fixes:
 * - LATERAL join and subquery performance on bank_assignments, lead_documents, and lead_checklist
 * - Leads listing by partner and created_at sorting
 * - Ensures customer_mobile column exists on leads table
 * - Ensures unique constraint on lead_checklist (lead_id, item)
 */

const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateLeadOrchestrationPerformanceIndexes() {
  logger.info('Starting Lead Orchestration Performance Indexes & Schema Hardening migration...');

  try {
    // 1. Index on lead_documents(lead_id)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id 
      ON lead_documents(lead_id);
    `);
    logger.info('✓ Index: lead_documents(lead_id)');

    // 2. Composite index on lead_checklist(lead_id, status)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lead_checklist_lead_status 
      ON lead_checklist(lead_id, status);
    `);
    logger.info('✓ Index: lead_checklist(lead_id, status)');

    // 3. Composite index on bank_assignments(lead_id, assigned_at DESC)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bank_assignments_lead_assigned 
      ON bank_assignments(lead_id, assigned_at DESC);
    `);
    logger.info('✓ Index: bank_assignments(lead_id, assigned_at DESC)');

    // 4. Composite index on leads(partner_id, created_at DESC)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_leads_partner_created 
      ON leads(partner_id, created_at DESC);
    `);
    logger.info('✓ Index: leads(partner_id, created_at DESC)');

    // 5. Ensure customer_mobile column exists on leads
    await query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(15);
    `);
    logger.info('✓ Column: leads.customer_mobile verified');

    // 6. Ensure unique constraint on lead_checklist(lead_id, item)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_lead_check_item'
        ) THEN
          ALTER TABLE lead_checklist ADD CONSTRAINT unique_lead_check_item UNIQUE(lead_id, item);
        END IF;
      EXCEPTION
        WHEN duplicate_table OR duplicate_object THEN
          NULL;
      END $$;
    `);
    logger.info('✓ Constraint: lead_checklist.unique_lead_check_item verified');

    logger.info('Lead Orchestration Performance Indexes migration completed successfully.');
  } catch (err) {
    logger.error('Error in Lead Orchestration Performance Indexes migration:', err.message);
    throw err;
  }
}

if (require.main === module) {
  migrateLeadOrchestrationPerformanceIndexes()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateLeadOrchestrationPerformanceIndexes };

