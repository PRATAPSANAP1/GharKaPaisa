process.env.NODE_ENV = 'test';
process.env.SKIP_DB = 'true';
const assert = require('assert');

// ── In-Memory PostgreSQL Mock Engine ─────────────────────────────────────────
class MockDatabaseEngine {
  constructor() {
    this.users = new Map();
    this.refreshTokens = new Map();
    this.auditLogs = [];
    this.columns = new Set([
      'id', 'email', 'mobile', 'role', 'status', 'is_active', 'full_name',
      'employee_id', 'department', 'designation', 'created_at', 'updated_at',
      'deactivated_at', 'deactivated_by', 'deactivation_reason',
      'activated_at', 'activated_by', 'activation_scheduled_at',
      'deactivation_scheduled_at', 'scheduled_status_action', 'scheduled_by', 'scheduled_reason'
    ]);
  }

  reset() {
    this.users.clear();
    this.refreshTokens.clear();
    this.auditLogs = [];
  }

  async executeQuery(sql, params = []) {
    const s = sql.trim();

    // 1. Schema introspection
    if (s.includes('information_schema.columns')) {
      return { rows: Array.from(this.columns).map(c => ({ column_name: c })) };
    }

    // 2. DDL queries (CREATE, ALTER, DROP)
    if (/^(CREATE|ALTER|DROP|DO \$\$)/i.test(s)) {
      if (s.includes('ADD COLUMN IF NOT EXISTS')) {
        const match = s.match(/ADD COLUMN IF NOT EXISTS\s+([a-z_0-9]+)/i);
        if (match) this.columns.add(match[1]);
      }
      return { rows: [], rowCount: 0 };
    }

    // 3. Counting active Super Admins
    if (s.includes("COUNT(*)::int as active_count") && s.includes("role = 'SUPER_ADMIN'")) {
      const excludeId = params[0];
      let count = 0;
      for (const u of this.users.values()) {
        if (u.role === 'SUPER_ADMIN' && u.is_active === true && u.status === 'active' && u.id !== excludeId) {
          count++;
        }
      }
      return { rows: [{ active_count: count }] };
    }

    // 4. INSERT into users
    if (s.startsWith('INSERT INTO users')) {
      const crypto = require('crypto');
      const id = crypto.randomUUID();
      const email = params[0];
      const mobile = params[1];
      const role = s.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : 'ADMIN';
      const user = {
        id,
        _id: id,
        email,
        mobile,
        role,
        status: 'active',
        is_active: true,
        full_name: params[2] || (role === 'SUPER_ADMIN' ? 'Test Super Admin' : 'Test Admin'),
        employee_id: 'EMP' + Math.floor(1000 + Math.random() * 9000),
        designation: params[3] || 'Staff',
        created_at: new Date(),
        updated_at: new Date(),
        activated_at: null,
        activated_by: null,
        deactivated_at: null,
        deactivated_by: null,
        deactivation_reason: null,
        activation_scheduled_at: null,
        deactivation_scheduled_at: null,
        scheduled_status_action: null,
        scheduled_by: null,
        scheduled_reason: null
      };
      this.users.set(id, user);
      return { rows: [user], rowCount: 1 };
    }

    // 5. SELECT from users
    if (s.startsWith('SELECT') && s.includes('FROM users')) {
      // Find single user by ID
      if (s.includes('WHERE id::text = $1') || s.includes('WHERE id = $1')) {
        const targetId = params[0];
        const user = this.users.get(targetId);
        return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
      }

      // Scheduled activations due
      if (/\bactivation_scheduled_at\s+IS\s+NOT\s+NULL/i.test(s)) {
        const due = Array.from(this.users.values()).filter(u => u.activation_scheduled_at && new Date(u.activation_scheduled_at) <= new Date(params[0]));
        return { rows: due, rowCount: due.length };
      }

      // Scheduled deactivations due
      if (/\bdeactivation_scheduled_at\s+IS\s+NOT\s+NULL/i.test(s)) {
        const due = Array.from(this.users.values()).filter(u => u.deactivation_scheduled_at && new Date(u.deactivation_scheduled_at) <= new Date(params[0]));
        return { rows: due, rowCount: due.length };
      }

      // List all users
      let matched = Array.from(this.users.values());
      if (s.includes('WHERE u.role::text = $1') || s.includes('WHERE role::text = $1')) {
        const filterRole = params[0];
        matched = matched.filter(u => u.role === filterRole);
      }
      return { rows: matched, rowCount: matched.length };
    }

    // 6. UPDATE users
    if (s.startsWith('UPDATE users')) {
      // Targeted update by ID
      const targetId = params[params.length - 1];
      const user = this.users.get(targetId);
      if (user) {
        if (s.includes('is_active = TRUE')) {
          user.is_active = true;
          user.status = 'active';
          user.activated_at = new Date();
          user.activated_by = params[0] || null;
          user.activation_scheduled_at = null;
          user.deactivation_scheduled_at = null;
          user.scheduled_status_action = null;
          user.scheduled_by = null;
          user.scheduled_reason = null;
        } else if (s.includes('is_active = FALSE')) {
          user.is_active = false;
          user.status = 'inactive';
          user.deactivated_at = new Date();
          user.deactivated_by = params[0] || null;
          user.deactivation_reason = params[1] || 'Deactivated';
          user.activation_scheduled_at = null;
          user.deactivation_scheduled_at = null;
          user.scheduled_status_action = null;
          user.scheduled_by = null;
          user.scheduled_reason = null;
        } else if (s.includes("scheduled_status_action = 'DEACTIVATE'")) {
          user.deactivation_scheduled_at = new Date(params[0]);
          user.activation_scheduled_at = null;
          user.scheduled_status_action = 'DEACTIVATE';
          user.scheduled_by = params[1] || null;
          user.scheduled_reason = params[2] || null;
        } else if (s.includes("scheduled_status_action = 'ACTIVATE'")) {
          user.activation_scheduled_at = new Date(params[0]);
          user.deactivation_scheduled_at = null;
          user.scheduled_status_action = 'ACTIVATE';
          user.scheduled_by = params[1] || null;
          user.scheduled_reason = params[2] || null;
        } else if (s.includes('activation_scheduled_at = NULL')) {
          user.activation_scheduled_at = null;
          user.deactivation_scheduled_at = null;
          user.scheduled_status_action = null;
          user.scheduled_by = null;
          user.scheduled_reason = null;
        }
        user.updated_at = new Date();
        this.users.set(targetId, user);
      }
      return { rows: [], rowCount: user ? 1 : 0 };
    }

    // 7. Refresh tokens
    if (/INSERT\s+INTO\s+refresh_tokens/i.test(s)) {
      const tokenId = 'tok_' + Math.random().toString(36).substring(2, 10);
      const record = { id: tokenId, user_id: params[0], token_hash: params[1], expires_at: new Date(Date.now() + 86400000), revoked: false };
      this.refreshTokens.set(tokenId, record);
      return { rows: [record], rowCount: 1 };
    }

    if (/UPDATE\s+refresh_tokens\s+SET\s+revoked\s*=\s*true/i.test(s)) {
      const userId = params[0];
      for (const tok of this.refreshTokens.values()) {
        if (tok.user_id === userId) {
          tok.revoked = true;
          tok.revoked_at = new Date();
        }
      }
      return { rows: [], rowCount: 1 };
    }

    if (s.includes('FROM refresh_tokens rt')) {
      const hash = params[0];
      for (const tok of this.refreshTokens.values()) {
        if (tok.token_hash === hash && !tok.revoked) {
          const u = this.users.get(tok.user_id) || {};
          return { rows: [{ ...tok, email: u.email, mobile: u.mobile, role: u.role, is_active: u.is_active, status: u.status }], rowCount: 1 };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    // 8. Audit logs
    if (/INSERT\s+INTO\s+audit_logs/i.test(s)) {
      const logEntry = {
        id: 'aud_' + Math.random().toString(36).substring(2, 10),
        user_id: params[0],
        action: params[1],
        target_id: params[2],
        details: params[3] ? JSON.parse(params[3]) : null,
        actor_role: params[4],
        ip_address: params[5],
        created_at: new Date()
      };
      this.auditLogs.unshift(logEntry);
      return { rows: [logEntry], rowCount: 1 };
    }

    if (s.includes('FROM audit_logs al')) {
      const targetId = params[0];
      const matched = this.auditLogs.filter(l => l.target_id === targetId);
      return { rows: matched, rowCount: matched.length };
    }

    // 9. Working hours policies & holidays
    if (s.includes('admin_working_hour_policies') || s.includes('admin_working_hours')) {
      return {
        rows: [{
          id: 'pol_default',
          name: 'Global Default Operating Schedule',
          scope_type: 'GLOBAL',
          is_enabled: true,
          start_time: '09:30 AM',
          end_time: '08:00 PM',
          timezone: 'Asia/Kolkata',
          schedule_config: {
            monday: { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' },
            tuesday: { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' },
            wednesday: { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' },
            thursday: { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' },
            friday: { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' },
            saturday: { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' },
            sunday: { is_working: false, start_time: '09:30 AM', end_time: '08:00 PM' }
          }
        }]
      };
    }

    if (s.includes('admin_working_hour_holidays') || s.includes('admin_working_hour_extensions')) {
      return { rows: [] };
    }

    // Default fallback
    return { rows: [], rowCount: 0 };
  }
}

// Intercept database module
const mockDb = new MockDatabaseEngine();
const dbConfig = require('../config/database');
dbConfig.query = (sql, params) => mockDb.executeQuery(sql, params);

const {
  ensureAccountStatusSchema,
  determineAccountStatus,
  getWorkingHoursSummary,
  listAccounts,
  activateAccount,
  deactivateAccount,
  cancelScheduledStatus,
  getAccountAuditHistory,
  processScheduledAccountTransitions
} = require('../modules/super-admin/accountStatus.service');

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ACCOUNT ACTIVATION & DEACTIVATION LIFECYCLE TESTS       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  mockDb.reset();

  // ── 1. Schema Migration & Introspection ───────────────────────────────────
  console.log('\n[TEST 1] Ensuring account activation lifecycle schema...');
  await ensureAccountStatusSchema();
  const introspection = await mockDb.executeQuery('SELECT column_name FROM information_schema.columns');
  const cols = introspection.rows.map(r => r.column_name);
  assert(cols.includes('is_active'), 'is_active column must exist');
  assert(cols.includes('deactivated_at'), 'deactivated_at column must exist');
  assert(cols.includes('deactivated_by'), 'deactivated_by column must exist');
  assert(cols.includes('deactivation_reason'), 'deactivation_reason column must exist');
  assert(cols.includes('activation_scheduled_at'), 'activation_scheduled_at column must exist');
  assert(cols.includes('deactivation_scheduled_at'), 'deactivation_scheduled_at column must exist');
  assert(cols.includes('scheduled_status_action'), 'scheduled_status_action column must exist');
  console.log('✓ PASS: Database schema verified with all required lifecycle columns.');

  // ── 2. Create Users Fixture ───────────────────────────────────────────────
  console.log('\n[TEST 2] Setting up Super Admin and Admin user accounts...');
  const saInsert = await mockDb.executeQuery(`INSERT INTO users (email, mobile, role) VALUES ($1, $2, 'SUPER_ADMIN')`, ['superadmin@gharkapaisa.in', '9876543210', 'Primary Super Admin', 'Super Admin']);
  const saUser = saInsert.rows[0];

  const adminInsert = await mockDb.executeQuery(`INSERT INTO users (email, mobile, role) VALUES ($1, $2, 'ADMIN')`, ['op.head@gharkapaisa.in', '9876543211', 'Operational Lead', 'Operational Head']);
  const adminUser = adminInsert.rows[0];

  assert(saUser && saUser.id, 'Super Admin must be created');
  assert(adminUser && adminUser.id, 'Admin must be created');
  console.log(`✓ PASS: Test users initialized (SuperAdmin: ${saUser.id}, Admin: ${adminUser.id}).`);

  // ── 3. Immediate Deactivation ─────────────────────────────────────────────
  console.log('\n[TEST 3] Testing immediate account deactivation & token revocation...');
  await mockDb.executeQuery(`INSERT INTO refresh_tokens (user_id, token_hash) VALUES ($1, $2)`, [adminUser.id, 'hash_abc123']);
  
  const deactRes = await deactivateAccount(adminUser.id, saUser.id, {
    isScheduled: false,
    reason: 'Temporary compliance review'
  });

  assert.strictEqual(deactRes.status, 'inactive');
  assert.strictEqual(deactRes.is_active, false);

  const adminInDb = mockDb.users.get(adminUser.id);
  assert.strictEqual(adminInDb.is_active, false);
  assert.strictEqual(adminInDb.status, 'inactive');
  assert.strictEqual(adminInDb.deactivation_reason, 'Temporary compliance review');
  assert(adminInDb.deactivated_at !== null, 'deactivated_at must be set');

  // Verify tokens were revoked
  const tokens = Array.from(mockDb.refreshTokens.values()).filter(t => t.user_id === adminUser.id);
  assert(tokens.length > 0 && tokens.every(t => t.revoked === true), 'All user refresh tokens must be revoked');
  console.log('✓ PASS: Immediate deactivation correctly updated user record and revoked sessions.');

  // ── 4. Immediate Activation ───────────────────────────────────────────────
  console.log('\n[TEST 4] Testing immediate account activation...');
  const actRes = await activateAccount(adminUser.id, saUser.id, {
    isScheduled: false,
    reason: 'Compliance review completed'
  });

  assert.strictEqual(actRes.status, 'active');
  assert.strictEqual(actRes.is_active, true);

  const reactivatedAdmin = mockDb.users.get(adminUser.id);
  assert.strictEqual(reactivatedAdmin.is_active, true);
  assert.strictEqual(reactivatedAdmin.status, 'active');
  assert(reactivatedAdmin.activated_at !== null, 'activated_at must be set');
  console.log('✓ PASS: Immediate activation restored active status.');

  // ── 5. Safety: Self-Deactivation Prevention ───────────────────────────────
  console.log('\n[TEST 5] Testing self-deactivation prevention...');
  let selfDeactBlocked = false;
  try {
    await deactivateAccount(saUser.id, saUser.id, { reason: 'Accidental self-deactivation' });
  } catch (err) {
    selfDeactBlocked = true;
    assert(err.message.includes('cannot deactivate your own'), 'Expected self-deactivation error message');
  }
  assert(selfDeactBlocked, 'Self-deactivation must be rejected');
  console.log('✓ PASS: Super Admin self-deactivation properly blocked.');

  // ── 6. Safety: Last Active Super Admin Protection ─────────────────────────
  console.log('\n[TEST 6] Testing last active Super Admin protection...');
  let lastSuperAdminBlocked = false;
  try {
    // Attempting deactivation of the only active Super Admin
    await deactivateAccount(saUser.id, adminUser.id, { reason: 'Deactivating last SA' });
  } catch (err) {
    lastSuperAdminBlocked = true;
    assert(err.message.includes('last active Super Admin'), 'Expected last active Super Admin error message');
  }
  assert(lastSuperAdminBlocked, 'Deactivation of the last active Super Admin must be rejected');
  console.log('✓ PASS: Last active Super Admin protection verified.');

  // ── 7. Working Hours & Timezone Rules Integration ─────────────────────────
  console.log('\n[TEST 7] Testing working hours schedule & timezone resolution...');
  const whSummary = await getWorkingHoursSummary(reactivatedAdmin);
  assert.strictEqual(whSummary.timezone, 'Asia/Kolkata');
  assert(whSummary.schedule_str && whSummary.schedule_str.length > 0);
  assert(whSummary.live_state && whSummary.live_label);
  console.log(`✓ PASS: Working hours resolved (${whSummary.schedule_str}, ${whSummary.live_label}, ${whSummary.timezone}).`);

  // ── 8. Scheduled Status Changes ───────────────────────────────────────────
  console.log('\n[TEST 8] Testing scheduled deactivation and cancellation...');
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 hours
  const schedRes = await deactivateAccount(adminUser.id, saUser.id, {
    isScheduled: true,
    scheduledAt: futureTime.toISOString(),
    reason: 'Planned maintenance'
  });

  assert.strictEqual(schedRes.status, 'scheduled');
  assert.strictEqual(schedRes.action, 'DEACTIVATE');

  const scheduledUser = mockDb.users.get(adminUser.id);
  assert.strictEqual(determineAccountStatus(scheduledUser), 'scheduled');
  assert.strictEqual(scheduledUser.scheduled_status_action, 'DEACTIVATE');
  console.log('✓ PASS: Deactivation scheduled with future timestamp.');

  // Cancel scheduled transition
  await cancelScheduledStatus(adminUser.id, saUser.id);
  const unScheduledUser = mockDb.users.get(adminUser.id);
  assert.strictEqual(unScheduledUser.deactivation_scheduled_at, null);
  assert.strictEqual(determineAccountStatus(unScheduledUser), 'active');
  console.log('✓ PASS: Scheduled deactivation cancellation verified.');

  // ── 9. Background Scheduler Worker Execution ──────────────────────────────
  console.log('\n[TEST 9] Testing background scheduler worker automatic execution...');
  // Force scheduled deactivation to a past timestamp
  const pastTime = new Date(Date.now() - 60 * 1000);
  scheduledUser.deactivation_scheduled_at = pastTime;
  scheduledUser.scheduled_status_action = 'DEACTIVATE';
  scheduledUser.scheduled_by = saUser.id;
  scheduledUser.scheduled_reason = 'Worker automated test deactivation';
  mockDb.users.set(adminUser.id, scheduledUser);

  await processScheduledAccountTransitions();

  const workerResult = mockDb.users.get(adminUser.id);
  assert.strictEqual(workerResult.is_active, false);
  assert.strictEqual(workerResult.status, 'inactive');
  assert.strictEqual(workerResult.deactivation_scheduled_at, null);
  assert.strictEqual(determineAccountStatus(workerResult), 'inactive');
  console.log('✓ PASS: Background worker automatically processed due scheduled transition.');

  // ── 10. List Accounts with Filters and Status Counts ──────────────────────
  console.log('\n[TEST 10] Testing listAccounts API filtering and counts...');
  const listRes = await listAccounts({ role: 'ALL', status: 'ALL' });
  assert.strictEqual(listRes.counts.total, 2);
  assert.strictEqual(listRes.counts.active, 1);   // saUser
  assert.strictEqual(listRes.counts.inactive, 1); // adminUser
  assert.strictEqual(listRes.counts.scheduled, 0);

  const inactiveList = await listAccounts({ status: 'inactive' });
  assert.strictEqual(inactiveList.accounts.length, 1);
  assert.strictEqual(inactiveList.accounts[0].account_status, 'inactive');
  console.log(`✓ PASS: Account listing with counts verified (Total: ${listRes.counts.total}, Active: ${listRes.counts.active}, Inactive: ${listRes.counts.inactive}).`);

  // ── 11. Audit History Retrieval ───────────────────────────────────────────
  console.log('\n[TEST 11] Testing audit history retrieval...');
  const auditLogs = await getAccountAuditHistory(adminUser.id);
  assert(auditLogs.length > 0, 'Audit history must contain records');
  const actions = auditLogs.map(l => l.action);
  assert(actions.includes('DEACTIVATE_ACCOUNT'), 'Must include DEACTIVATE_ACCOUNT');
  assert(actions.includes('ACTIVATE_ACCOUNT'), 'Must include ACTIVATE_ACCOUNT');
  console.log(`✓ PASS: Audit history verified with ${auditLogs.length} chronological audit entries.`);

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🎉 ALL 11 ACCOUNT ACTIVATION LIFECYCLE TESTS PASSED!');
  console.log('════════════════════════════════════════════════════════════\n');
}

if (require.main === module) {
  runTests().then(() => process.exit(0)).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
