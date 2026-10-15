const db = require('../../config/database');
const logger = require('../../config/logger');

let migrationRunning = null;
let migrationDone = false;

async function migrateWorkingHoursPhase2() {
  if (migrationDone) return;
  if (migrationRunning) return migrationRunning;

  migrationRunning = (async () => {
    let client = null;
    let lockAcquired = false;

    try {
      if (typeof db.getClient === 'function') {
        try {
          client = await db.getClient();
        } catch (cErr) {
          client = null;
        }
      }

      const executor = client || db;

      // Acquire advisory lock 749281728 so that across PM2 workers, only one runs DDL at a time
      if (client) {
        try {
          const { rows } = await client.query('SELECT pg_try_advisory_lock(749281728) as acquired');
          lockAcquired = Boolean(rows && rows[0] && rows[0].acquired);
          if (!lockAcquired) {
            logger.info('[MIGRATION] Working Hours Phase 2 migration is currently running in another worker/process. Skipping concurrent execution.');
            migrationDone = true;
            return;
          }
        } catch (lockErr) {
          // Fall through if advisory locks aren't supported (e.g. mock db)
          lockAcquired = false;
        }
      }

      logger.info('[MIGRATION] Running Working Hours Phase 2 schema migration...');

      await executor.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      await executor.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

      // 1. Core Policies Table with Scope, Multi-Role, Multi-Designation, and Day-Wise Schedule Config
      await executor.query(`
        CREATE TABLE IF NOT EXISTS admin_working_hour_policies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL DEFAULT 'Working Hours Policy',
          scope_type VARCHAR(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope_type IN ('GLOBAL', 'ROLE', 'DESIGNATION', 'USER')),
          roles VARCHAR(50)[] DEFAULT '{}',
          designations VARCHAR(100)[] DEFAULT '{}',
          user_ids UUID[] DEFAULT '{}',
          grace_period INT DEFAULT 0,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
          is_enabled BOOLEAN DEFAULT TRUE,
          priority INT DEFAULT 0,
          schedule_config JSONB NOT NULL DEFAULT '{
            "monday":    {"is_working": true,  "start_time": "09:30 AM", "end_time": "08:00 PM"},
            "tuesday":   {"is_working": true,  "start_time": "09:30 AM", "end_time": "08:00 PM"},
            "wednesday": {"is_working": true,  "start_time": "09:30 AM", "end_time": "08:00 PM"},
            "thursday":  {"is_working": true,  "start_time": "09:30 AM", "end_time": "08:00 PM"},
            "friday":    {"is_working": true,  "start_time": "09:30 AM", "end_time": "08:00 PM"},
            "saturday":  {"is_working": true,  "start_time": "09:30 AM", "end_time": "08:00 PM"},
            "sunday":    {"is_working": false, "start_time": "09:30 AM", "end_time": "08:00 PM"}
          }'::jsonb,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Ensure user_ids & grace_period columns exist if table already existed previously
      await executor.query(`
        ALTER TABLE admin_working_hour_policies ADD COLUMN IF NOT EXISTS user_ids UUID[] DEFAULT '{}';
        ALTER TABLE admin_working_hour_policies ADD COLUMN IF NOT EXISTS grace_period INT DEFAULT 0;
      `);

      // 2. Normalized Day-Wise Schedules Table (Monday - Sunday)
      await executor.query(`
        CREATE TABLE IF NOT EXISTS admin_working_hour_schedule_days (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          policy_id UUID NOT NULL REFERENCES admin_working_hour_policies(id) ON DELETE CASCADE,
          day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
          day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
          is_working BOOLEAN DEFAULT TRUE,
          start_time VARCHAR(10) DEFAULT '09:30 AM',
          end_time VARCHAR(10) DEFAULT '08:00 PM',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(policy_id, day_of_week)
        );
      `);

      // 3. Holidays Management Table with Scope, Multi-Role, Multi-Designation, and User Override
      await executor.query(`
        CREATE TABLE IF NOT EXISTS admin_working_hour_holidays (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          holiday_name VARCHAR(255) NOT NULL,
          holiday_date DATE NOT NULL,
          reason TEXT,
          scope_type VARCHAR(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope_type IN ('GLOBAL', 'ROLE', 'DESIGNATION', 'USER')),
          roles VARCHAR(50)[] DEFAULT '{}',
          designations VARCHAR(100)[] DEFAULT '{}',
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT TRUE,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 4. Backward Compatibility: Add optional JSONB schedule column to existing admin_working_hours table
      await executor.query(`
        ALTER TABLE admin_working_hours ADD COLUMN IF NOT EXISTS days_schedule JSONB;
      `);

      // 5. Indexes for fast lookup
      await executor.query(`
        CREATE INDEX IF NOT EXISTS idx_awhp_scope_enabled ON admin_working_hour_policies(scope_type, is_enabled);
        CREATE INDEX IF NOT EXISTS idx_awhp_user_id ON admin_working_hour_policies(user_id) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_awhp_roles_gin ON admin_working_hour_policies USING GIN (roles);
        CREATE INDEX IF NOT EXISTS idx_awhp_designations_gin ON admin_working_hour_policies USING GIN (designations);

        CREATE INDEX IF NOT EXISTS idx_awhsd_policy_day ON admin_working_hour_schedule_days(policy_id, day_number);

        CREATE INDEX IF NOT EXISTS idx_awhh_date_active ON admin_working_hour_holidays(holiday_date, is_active);
        CREATE INDEX IF NOT EXISTS idx_awhh_scope ON admin_working_hour_holidays(scope_type, is_active);
        CREATE INDEX IF NOT EXISTS idx_awhh_user_id ON admin_working_hour_holidays(user_id) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_awhh_roles_gin ON admin_working_hour_holidays USING GIN (roles);
        CREATE INDEX IF NOT EXISTS idx_awhh_designations_gin ON admin_working_hour_holidays USING GIN (designations);
      `);

      // 6. Data Seeding: Seed default Global Policy if empty
      const { rows: existingGlobal } = await executor.query(`
        SELECT id FROM admin_working_hour_policies WHERE scope_type = 'GLOBAL' LIMIT 1
      `);

      if (existingGlobal.length === 0) {
        const defaultGlobalSchedule = {
          monday:    { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
          tuesday:   { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
          wednesday: { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
          thursday:  { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
          friday:    { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
          saturday:  { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
          sunday:    { is_working: false, start_time: '09:30 AM', end_time: '08:00 PM' }
        };

        const { rows: [newPolicy] } = await executor.query(`
          INSERT INTO admin_working_hour_policies (name, scope_type, is_enabled, priority, schedule_config)
          VALUES ('Global Default Operating Schedule', 'GLOBAL', TRUE, 10, $1::jsonb)
          RETURNING id
        `, [JSON.stringify(defaultGlobalSchedule)]);

        if (newPolicy?.id) {
          const days = [
            { day: 'MONDAY', num: 1, working: true },
            { day: 'TUESDAY', num: 2, working: true },
            { day: 'WEDNESDAY', num: 3, working: true },
            { day: 'THURSDAY', num: 4, working: true },
            { day: 'FRIDAY', num: 5, working: true },
            { day: 'SATURDAY', num: 6, working: true },
            { day: 'SUNDAY', num: 7, working: false }
          ];

          for (const d of days) {
            await executor.query(`
              INSERT INTO admin_working_hour_schedule_days (policy_id, day_of_week, day_number, is_working, start_time, end_time)
              VALUES ($1, $2, $3, $4, '09:30 AM', '08:00 PM')
              ON CONFLICT (policy_id, day_of_week) DO NOTHING
            `, [newPolicy.id, d.day, d.num, d.working]);
          }
        }
      }

      logger.info('[MIGRATION COMPLETE] Working Hours Phase 2 tables and indexes created successfully.');
      migrationDone = true;
    } catch (err) {
      logger.error('Working Hours Phase 2 Migration Error:', err);
      throw err;
    } finally {
      if (lockAcquired && client) {
        try {
          await client.query('SELECT pg_advisory_unlock(749281728)');
        } catch (unlErr) {}
      }
      if (client) {
        try {
          client.release();
        } catch (relErr) {}
      }
      migrationRunning = null;
    }
  })();

  return migrationRunning;
}

if (require.main === module) {
  migrateWorkingHoursPhase2()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateWorkingHoursPhase2;
