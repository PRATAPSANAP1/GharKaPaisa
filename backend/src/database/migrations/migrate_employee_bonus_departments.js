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

const migrateEmployeeBonusDepartments = async () => {
  logger.info('Running Employee Bonus & Department Assignment System migrations...');

  try {
    await query('BEGIN');

    // 1. Employee Bank / Department Assignments Table
    await query(`
      CREATE TABLE IF NOT EXISTS employee_bank_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id, bank_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bank_assignments_emp ON employee_bank_assignments(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bank_assignments_bank ON employee_bank_assignments(bank_id)`);

    // 2. Employee Bonus Rules Table
    await query(`
      CREATE TABLE IF NOT EXISTS employee_bonus_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        target_count INTEGER NOT NULL DEFAULT 0,
        bonus_per_card DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_rules_emp ON employee_bonus_rules(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_rules_bank ON employee_bonus_rules(bank_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_rules_dates ON employee_bonus_rules(start_date, end_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_rules_status ON employee_bonus_rules(status)`);

    // 3. Employee Bonus Transactions Table (Historical ledger)
    await query(`
      CREATE TABLE IF NOT EXISTS employee_bonus_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
        bonus_rule_id UUID REFERENCES employee_bonus_rules(id) ON DELETE CASCADE,
        bonus_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'EARNED',
        earned_at TIMESTAMPTZ DEFAULT NOW(),
        paid_at TIMESTAMPTZ,
        UNIQUE(application_id, bonus_rule_id)
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_tx_emp ON employee_bonus_transactions(employee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_tx_bank ON employee_bonus_transactions(bank_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_tx_app ON employee_bonus_transactions(application_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_employee_bonus_tx_rule ON employee_bonus_transactions(bonus_rule_id)`);

    await query('COMMIT');
    logger.info('Employee Bonus & Department Assignment migrations completed successfully');

    return {
      success: true,
      message: 'Employee Bonus & Department Assignment System migrations completed successfully'
    };
  } catch (error) {
    await query('ROLLBACK');
    logger.error('Employee Bonus & Department Assignment migration failed:', error);
    throw error;
  }
};

if (require.main === module) {
  migrateEmployeeBonusDepartments()
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

module.exports = migrateEmployeeBonusDepartments;
