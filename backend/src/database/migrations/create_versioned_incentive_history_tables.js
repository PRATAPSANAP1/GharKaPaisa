const path = require('path');
const fs = require('fs');
const envPath = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env')
].find(p => fs.existsSync(p));

if (envPath) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}
const { query, pool } = require('../../config/database');
const logger = require('../../config/logger');

const migrateVersionedIncentiveTables = async () => {
  logger.info('Running Versioned Incentive Rules & Monthly Performance Snapshot migrations...');

  try {
    await query('BEGIN');

    // 1. Versioned Incentive Rules Table
    await query(`
      CREATE TABLE IF NOT EXISTS employee_incentive_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        department_assigned BOOLEAN DEFAULT false,
        target_cards INTEGER DEFAULT 0,
        incentive_per_card DECIMAL(12,2) DEFAULT 0.00,
        bonus_per_card DECIMAL(12,2) DEFAULT 0.00,
        effective_from DATE NOT NULL,
        effective_to DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_emp_inc_rules_emp ON employee_incentive_rules(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_emp_inc_rules_bank ON employee_incentive_rules(bank_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_emp_inc_rules_dates ON employee_incentive_rules(effective_from, effective_to)`);

    // 2. Frozen Monthly Performance Snapshots Table
    await query(`
      CREATE TABLE IF NOT EXISTS employee_incentive_monthly_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        department_assigned BOOLEAN DEFAULT false,
        target_cards INTEGER DEFAULT 0,
        approved_cards INTEGER DEFAULT 0,
        target_achieved BOOLEAN DEFAULT false,
        incentive_per_card DECIMAL(12,2) DEFAULT 0.00,
        bonus_per_card DECIMAL(12,2) DEFAULT 0.00,
        total_incentive DECIMAL(12,2) DEFAULT 0.00,
        total_bonus DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(30) DEFAULT 'COMPLETED',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_emp_month_bank UNIQUE(employee_id, year, month, bank_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_emp_inc_monthly_emp ON employee_incentive_monthly_records(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_emp_inc_monthly_ym ON employee_incentive_monthly_records(year, month)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_emp_inc_monthly_bank ON employee_incentive_monthly_records(bank_id)`);

    await query('COMMIT');
    logger.info('Versioned Incentive Rules & Monthly Performance Snapshot migrations completed successfully');

    return {
      success: true,
      message: 'Versioned Incentive Rules & Monthly Performance Snapshot migrations completed successfully'
    };
  } catch (error) {
    await query('ROLLBACK');
    logger.error('Versioned Incentive migration failed:', error);
    throw error;
  }
};

if (require.main === module) {
  migrateVersionedIncentiveTables()
    .then(async (result) => {
      console.log('Migration result:', result);
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Migration failed:', error);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrateVersionedIncentiveTables;
