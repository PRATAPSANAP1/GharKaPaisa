const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateApplicationQueryIndexes = async () => {
  logger.info('[Migration] Ensuring CRM Application & Assignment performance indexes...');
  try {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_apps_bank_id ON applications(bank_id)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_product_id ON applications(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_partner_id ON applications(partner_id)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_dispatch_status ON applications(dispatch_status)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_pan_check ON applications(pan_check)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_sales_claimed_by ON applications(sales_claimed_by)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_process_type ON applications(process_type)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_created_at_desc ON applications(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_partner_created ON applications(partner_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_status_created ON applications(status, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_submitted_by ON applications(submitted_by)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_employee_id ON applications(employee_id)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_customer_id ON applications(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_apps_lead_id ON applications(lead_id)`,
      `CREATE INDEX IF NOT EXISTS idx_admin_bank_assignments_admin_category ON admin_bank_assignments(admin_id, category)`,
      `CREATE INDEX IF NOT EXISTS idx_timeline_app_id ON application_timeline(application_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pad_app ON physical_application_details(application_id)`
    ];

    for (const sql of indexes) {
      await query(sql).catch((err) => {
        logger.debug(`Index note: ${err.message}`);
      });
    }

    logger.info('[Migration] CRM Application performance indexes verified successfully.');
  } catch (err) {
    logger.warn('[Migration] Application indexes creation note:', err.message);
  }
};

module.exports = { migrateApplicationQueryIndexes };
