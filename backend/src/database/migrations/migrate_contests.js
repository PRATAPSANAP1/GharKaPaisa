const { query, pool } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateContests() {
  logger.info('[Migration] Running Contests table migration...');

  // 1. contests table
  await query(`
    CREATE TABLE IF NOT EXISTS contests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      short_description TEXT,
      description TEXT,
      image_url TEXT,
      image_key TEXT,
      contest_type VARCHAR(100) DEFAULT 'credit_card',
      target_value NUMERIC NOT NULL DEFAULT 50,
      target_unit VARCHAR(100) DEFAULT 'Approved Applications',
      reward_type VARCHAR(50) DEFAULT 'Fixed Amount',
      reward_value NUMERIC DEFAULT 5000,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      department_id VARCHAR(100) DEFAULT 'All',
      eligible_employees VARCHAR(100) DEFAULT 'All',
      status VARCHAR(30) DEFAULT 'ACTIVE',
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date)`);

  // 2. contest_participants table
  await query(`
    CREATE TABLE IF NOT EXISTS contest_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      current_value NUMERIC DEFAULT 0,
      target_value NUMERIC NOT NULL,
      status VARCHAR(30) DEFAULT 'ACTIVE',
      qualified_at TIMESTAMPTZ,
      reward_status VARCHAR(30) DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(contest_id, employee_id)
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_contest_participants_employee ON contest_participants(employee_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id)`);

  // 3. Insert default sample contest if empty
  const { rows } = await query(`SELECT COUNT(*) FROM contests`);
  if (parseInt(rows[0].count, 10) === 0) {
    await query(`
      INSERT INTO contests (
        title,
        short_description,
        description,
        image_url,
        contest_type,
        target_value,
        target_unit,
        reward_type,
        reward_value,
        start_date,
        end_date,
        department_id,
        eligible_employees,
        status
      ) VALUES (
        'Credit Card Champions',
        'Achieve your monthly credit card target and unlock exciting rewards.',
        'This month''s Credit Card Champions contest rewards employees for achieving the required number of approved credit card applications during the contest period. Applications will be counted according to the contest eligibility and approval rules configured by the administrator.',
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        'credit_card',
        50,
        'Approved Applications',
        'Fixed Amount',
        5000,
        NOW() - INTERVAL '5 days',
        NOW() + INTERVAL '25 days',
        'Credit Card',
        'All eligible employees',
        'ACTIVE'
      )
    `);
    logger.info('[Migration] Default sample contest created.');
  }

  logger.info('[Migration] Contests migration completed successfully.');
}

module.exports = migrateContests;

if (require.main === module) {
  migrateContests()
    .then(async () => {
      logger.info('[Migration] Contests migration execution finished.');
      if (pool) await pool.end();
      process.exit(0);
    })
    .catch((err) => {
      logger.error('[Migration] Contests migration execution failed:', err);
      process.exit(1);
    });
}
