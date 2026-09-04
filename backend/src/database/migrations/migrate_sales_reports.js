const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { pool } = require('../../config/database');

async function migrateSalesReports() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running Sales Reports Migration...');

    await client.query('BEGIN');

    // 1. Employee Sales Reports Master Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_sales_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        report_date DATE NOT NULL DEFAULT CURRENT_DATE,
        total_cards INTEGER NOT NULL DEFAULT 0,
        remark TEXT,
        photo_url TEXT,
        photo_key TEXT,
        status VARCHAR(20) DEFAULT 'Submitted', -- 'Draft', 'Submitted', 'Reviewed', 'Rejected', 'Resubmitted'
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        review_remark TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Employee Sales Report Bank Breakdown Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employee_sales_report_banks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        report_id UUID NOT NULL REFERENCES employee_sales_reports(id) ON DELETE CASCADE,
        bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
        bank_name VARCHAR(100) NOT NULL,
        cards_sold INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create Indexes for fast hierarchical & date range querying
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_reports_emp_date ON employee_sales_reports(employee_id, report_date DESC);
      CREATE INDEX IF NOT EXISTS idx_sales_reports_status ON employee_sales_reports(status);
      CREATE INDEX IF NOT EXISTS idx_sales_report_banks_report_id ON employee_sales_report_banks(report_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Sales Reports tables & indexes created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Sales Reports migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateSalesReports()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateSalesReports;
