const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const crypto = require('node:crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Stateful In-Memory Relational Database Mock for Deterministic Testing
// ─────────────────────────────────────────────────────────────────────────────
const dbState = {
  users: new Map(),
  banks: new Map(),
  products: new Map(),
  bankDirectProcessLinks: new Map(), // key: bank_id
  partnerProfiles: new Map(),
  customers: new Map(),
  applications: new Map(),
  leads: new Map(),
  auditLogs: [],
  systemSettings: new Map([
    ['sbi_cc_digital_journey_link', 'https://www.sbicard.com/sprint/'],
    ['hdfc_fd_wes_cc_link', 'https://applyonline.hdfcbank.com/credit-cards.html'],
    ['digital_journey_link', 'https://www.sbicard.com/sprint/']
  ]),
  appSeq: 10000
};

const SUPER_ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID       = '22222222-2222-4222-8222-222222222222';
const PARTNER_USER_ID = '33333333-3333-4333-8333-333333333333';
const EMPLOYEE_USER_ID = '44444444-4444-4444-8444-444444444444';
const PARTNER_PROFILE_ID = '55555555-5555-4555-8555-555555555555';

const BANK_A_ID = 'aaaa1111-1111-4111-8111-111111111111';
const BANK_B_ID = 'bbbb2222-2222-4222-8222-222222222222';
const BANK_C_ID = 'cccc3333-3333-4333-8333-333333333333'; // No bank link configured, has product fallback
const BANK_D_ID = 'dddd4444-4444-4444-8444-444444444444'; // No bank link & no product link anywhere
const BANK_INACTIVE_ID = 'eeee5555-5555-4555-8555-555555555555';

const PROD_A_ID = 'f0011111-1111-4111-8111-111111111111';
const PROD_B_ID = 'f0022222-2222-4222-8222-222222222222';
const PROD_C_ID = 'f0033333-3333-4333-8333-333333333333';
const PROD_D_ID = 'f0044444-4444-4444-8444-444444444444';

function resetDbState() {
  dbState.users.clear();
  dbState.banks.clear();
  dbState.products.clear();
  dbState.bankDirectProcessLinks.clear();
  dbState.partnerProfiles.clear();
  dbState.customers.clear();
  dbState.applications.clear();
  dbState.leads.clear();
  dbState.auditLogs.length = 0;

  dbState.users.set(SUPER_ADMIN_ID, {
    id: SUPER_ADMIN_ID,
    role: 'SUPER_ADMIN',
    full_name: 'Super Admin Tester',
    email: 'superadmin@example.com',
    mobile: '9000000001',
    status: 'active',
    is_active: true
  });
  dbState.users.set(ADMIN_ID, {
    id: ADMIN_ID,
    role: 'ADMIN',
    full_name: 'Admin Tester',
    email: 'admin@example.com',
    mobile: '9000000002',
    status: 'active',
    is_active: true
  });
  dbState.users.set(PARTNER_USER_ID, {
    id: PARTNER_USER_ID,
    role: 'PARTNER',
    full_name: 'Partner Tester',
    email: 'partner@example.com',
    mobile: '9000000003',
    status: 'active',
    is_active: true
  });
  dbState.users.set(EMPLOYEE_USER_ID, {
    id: EMPLOYEE_USER_ID,
    role: 'EMPLOYEE',
    full_name: 'Employee Tester',
    email: 'employee@example.com',
    mobile: '9000000004',
    status: 'active',
    is_active: true
  });

  dbState.partnerProfiles.set(PARTNER_PROFILE_ID, {
    id: PARTNER_PROFILE_ID,
    user_id: PARTNER_USER_ID,
    partner_code: 'AG1001',
    first_name: 'Partner',
    last_name: 'Tester',
    kyc_status: 'approved',
    status: 'active'
  });

  dbState.banks.set(BANK_A_ID, {
    id: BANK_A_ID,
    name: 'Alpha National Bank',
    short_code: 'ALPHA',
    logo_url: 'https://cdn.example.com/alpha.png',
    is_active: true,
    status: 'Active',
    display_order: 1
  });
  dbState.banks.set(BANK_B_ID, {
    id: BANK_B_ID,
    name: 'Beta Commercial Bank',
    short_code: 'BETA',
    logo_url: 'https://cdn.example.com/beta.png',
    is_active: true,
    status: 'Active',
    display_order: 2
  });
  dbState.banks.set(BANK_C_ID, {
    id: BANK_C_ID,
    name: 'Gamma Fallback Bank',
    short_code: 'GAMMA',
    logo_url: 'https://cdn.example.com/gamma.png',
    is_active: true,
    status: 'Active',
    display_order: 3
  });
  dbState.banks.set(BANK_D_ID, {
    id: BANK_D_ID,
    name: 'Delta Unlinked Bank',
    short_code: 'DELTA',
    logo_url: 'https://cdn.example.com/delta.png',
    is_active: true,
    status: 'Active',
    display_order: 4
  });
  dbState.banks.set(BANK_INACTIVE_ID, {
    id: BANK_INACTIVE_ID,
    name: 'Retired Inactive Bank',
    short_code: 'RETIRED',
    logo_url: null,
    is_active: false,
    status: 'Inactive',
    display_order: 5
  });

  dbState.products.set(PROD_A_ID, {
    id: PROD_A_ID,
    bank_id: BANK_A_ID,
    name: 'Alpha Platinum Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    partner_url: 'https://alpha-legacy.example.com/partner-share',
    public_url: 'https://alpha-legacy.example.com/public',
    commission_value: 1200,
    display_order: 1
  });
  dbState.products.set(PROD_B_ID, {
    id: PROD_B_ID,
    bank_id: BANK_B_ID,
    name: 'Beta Rewards Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    partner_url: 'https://beta-legacy.example.com/partner-share',
    public_url: 'https://beta-legacy.example.com/public',
    commission_value: 1500,
    display_order: 2
  });
  dbState.products.set(PROD_C_ID, {
    id: PROD_C_ID,
    bank_id: BANK_C_ID,
    name: 'Gamma Classic Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    partner_url: 'https://gamma-product-fallback.example.com/apply',
    public_url: 'https://gamma-product-fallback.example.com/public',
    commission_value: 900,
    display_order: 3
  });
  dbState.products.set(PROD_D_ID, {
    id: PROD_D_ID,
    bank_id: BANK_D_ID,
    name: 'Delta Unconfigured Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    partner_url: null,
    public_url: null,
    commission_value: 500,
    display_order: 4
  });
}

resetDbState();

// Execute SQL against in-memory relational state
async function executeMockSql(sqlText, params = []) {
  const sql = String(sqlText || '').replace(/\s+/g, ' ').trim();

  if (/^(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE SAVEPOINT)/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }
  if (/^(CREATE TABLE|CREATE INDEX|ALTER TABLE)/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }
  if (/SELECT nextval\('app_number_seq'\)/i.test(sql)) {
    dbState.appSeq += 1;
    return { rows: [{ nextval: dbState.appSeq }], rowCount: 1 };
  }

  // system_settings
  if (/SELECT key, value FROM system_settings/i.test(sql)) {
    const rows = Array.from(dbState.systemSettings.entries()).map(([key, value]) => ({ key, value }));
    return { rows, rowCount: rows.length };
  }
  if (/INSERT INTO system_settings/i.test(sql)) {
    const [k, v] = params;
    dbState.systemSettings.set(k, v);
    return { rows: [], rowCount: 1 };
  }

  // audit_logs
  if (/INSERT INTO audit_logs/i.test(sql)) {
    const [user_id, action, target_id, details, role, ip_address] = params;
    const entry = {
      id: crypto.randomUUID(),
      user_id,
      action,
      target_id,
      details: details ? JSON.parse(details) : null,
      role,
      ip_address,
      created_at: new Date().toISOString()
    };
    dbState.auditLogs.push(entry);
    return { rows: [entry], rowCount: 1 };
  }

  // bank_direct_process_links list
  if (/FROM bank_direct_process_links bdpl JOIN banks b ON b\.id = bdpl\.bank_id/i.test(sql)) {
    const rows = [];
    for (const cfg of dbState.bankDirectProcessLinks.values()) {
      const bank = dbState.banks.get(cfg.bank_id);
      if (!bank) continue;
      const cu = cfg.created_by ? dbState.users.get(cfg.created_by) : null;
      const uu = cfg.updated_by ? dbState.users.get(cfg.updated_by) : null;
      rows.push({
        ...cfg,
        bank_name: bank.name,
        bank_short_code: bank.short_code,
        bank_logo: bank.logo_url,
        bank_is_active: bank.is_active,
        bank_status: bank.status,
        created_by_name: cu?.full_name || null,
        updated_by_name: uu?.full_name || null
      });
    }
    rows.sort((a, b) => a.bank_name.localeCompare(b.bank_name));
    return { rows, rowCount: rows.length };
  }

  // bank_direct_process_links by bank_id
  if (/FROM bank_direct_process_links(\s+bdpl)?\s+WHERE\s+(bdpl\.)?bank_id\s*=\s*\$1/i.test(sql)) {
    const bankId = params[0];
    const cfg = dbState.bankDirectProcessLinks.get(bankId);
    return { rows: cfg ? [{ ...cfg }] : [], rowCount: cfg ? 1 : 0 };
  }

  // Upsert bank_direct_process_links
  if (/INSERT INTO bank_direct_process_links/i.test(sql)) {
    const [bank_id, direct_process_link, actorId] = params;
    const now = new Date().toISOString();
    const existing = dbState.bankDirectProcessLinks.get(bank_id);
    const saved = existing
      ? {
          ...existing,
          direct_process_link,
          updated_by: actorId,
          updated_at: now
        }
      : {
          id: crypto.randomUUID(),
          bank_id,
          direct_process_link,
          created_by: actorId,
          updated_by: actorId,
          created_at: now,
          updated_at: now
        };
    dbState.bankDirectProcessLinks.set(bank_id, saved);
    return { rows: [{ ...saved }], rowCount: 1 };
  }

  // Banks lookup by ID
  if (/FROM banks(\s+b)?\s+.*WHERE\s+(b\.)?id\s*=\s*\$1/i.test(sql)) {
    const bankId = params[0];
    const bank = dbState.banks.get(bankId);
    if (!bank) return { rows: [], rowCount: 0 };
    const cfg = dbState.bankDirectProcessLinks.get(bank.id);
    const productsCount = Array.from(dbState.products.values()).filter(p => p.bank_id === bank.id).length;
    return {
      rows: [{
        ...bank,
        direct_process_link: cfg?.direct_process_link || null,
        products_count: productsCount
      }],
      rowCount: 1
    };
  }

  // Active banks list (/banks/active)
  if (/SELECT\s+b\.id,\s+b\.name as bank_name/i.test(sql)) {
    const rows = Array.from(dbState.banks.values())
      .filter(b => b.is_active && b.status === 'Active')
      .map(b => ({
        id: b.id,
        bank_name: b.name,
        short_code: b.short_code,
        logo: b.logo_url,
        display_order: b.display_order,
        direct_process_link: dbState.bankDirectProcessLinks.get(b.id)?.direct_process_link || null,
        products_count: Array.from(dbState.products.values()).filter(p => p.bank_id === b.id && p.is_active).length
      }));
    return { rows, rowCount: rows.length };
  }

  // Banks count & list (/banks)
  if (/SELECT COUNT\(\*\) FROM banks b/i.test(sql)) {
    const activeOnly = sql.includes("b.status = 'Active'");
    const list = Array.from(dbState.banks.values()).filter(b => !activeOnly || b.is_active);
    return { rows: [{ count: String(list.length) }], rowCount: 1 };
  }
  if (/FROM banks b LEFT JOIN bank_direct_process_links bdpl/i.test(sql)) {
    const activeOnly = sql.includes("b.status = 'Active'");
    const rows = Array.from(dbState.banks.values())
      .filter(b => !activeOnly || b.is_active)
      .map(b => ({
        ...b,
        direct_process_link: dbState.bankDirectProcessLinks.get(b.id)?.direct_process_link || null,
        products_count: Array.from(dbState.products.values()).filter(p => p.bank_id === b.id).length,
        categories: ['credit_card']
      }));
    return { rows, rowCount: rows.length };
  }

  // Products lookup by ID (with bank & bank_direct_process_links join)
  if (/FROM products p\s+LEFT JOIN banks b ON (b\.id = p\.bank_id|p\.bank_id = b\.id)\s+LEFT JOIN bank_direct_process_links bdpl ON bdpl\.bank_id = p\.bank_id\s+WHERE p\.id = \$1/i.test(sql)) {
    const prod = dbState.products.get(params[0]);
    if (!prod) return { rows: [], rowCount: 0 };
    const bank = dbState.banks.get(prod.bank_id);
    const bdpl = dbState.bankDirectProcessLinks.get(prod.bank_id);
    return {
      rows: [{
        ...prod,
        bank_name: bank?.name || null,
        bank_code: bank?.short_code || null,
        bank_logo: bank?.logo_url || null,
        bank_direct_process_link: bdpl?.direct_process_link || null
      }],
      rowCount: 1
    };
  }

  // Products list (/products)
  if (/FROM products p LEFT JOIN banks b ON b\.id = p\.bank_id LEFT JOIN bank_direct_process_links bdpl ON bdpl\.bank_id = p\.bank_id/i.test(sql) && /COUNT\(\*\) OVER\(\)/i.test(sql)) {
    const allProds = Array.from(dbState.products.values()).map(prod => {
      const bank = dbState.banks.get(prod.bank_id);
      const bdpl = dbState.bankDirectProcessLinks.get(prod.bank_id);
      return {
        ...prod,
        bank_name: bank?.name || null,
        bank_code: bank?.short_code || null,
        bank_logo: bank?.logo_url || null,
        bank_direct_process_link: bdpl?.direct_process_link || null,
        full_count: String(dbState.products.size)
      };
    });
    return { rows: allProds, rowCount: allProds.length };
  }

  // Sub-entity queries in getProduct
  if (/FROM (product_faq|product_videos|product_documents|product_offers|product_features)/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }
  if (/FROM product_ratings/i.test(sql)) {
    return { rows: [{ avg_rating: 0, total_reviews: 0 }], rowCount: 1 };
  }

  // Partner profiles lookup
  if (/FROM partner_profiles/i.test(sql) || /INSERT INTO partner_profiles/i.test(sql)) {
    const key = params[0];
    for (const p of dbState.partnerProfiles.values()) {
      if (p.id === key || p.user_id === key) {
        return { rows: [{ ...p }], rowCount: 1 };
      }
    }
    const fallbackProfile = dbState.partnerProfiles.get(PARTNER_PROFILE_ID);
    return { rows: fallbackProfile ? [{ ...fallbackProfile }] : [], rowCount: fallbackProfile ? 1 : 0 };
  }

  // Commission structures lookup
  if (/FROM commission_structures/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }
  if (/FROM products WHERE id = \$1/i.test(sql)) {
    const prod = dbState.products.get(params[0]);
    return { rows: prod ? [{ ...prod }] : [], rowCount: prod ? 1 : 0 };
  }

  // Duplicate application/lead checks
  if (/FROM applications a JOIN customers c/i.test(sql) || /FROM applications WHERE product_id/i.test(sql) || /FROM leads WHERE product_id/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  // Customers lookup / insert
  if (/SELECT id FROM customers WHERE mobile = \$1/i.test(sql)) {
    const mobile = params[0];
    for (const c of dbState.customers.values()) {
      if (c.mobile === mobile) return { rows: [{ id: c.id }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (/INSERT INTO customers/i.test(sql)) {
    const id = crypto.randomUUID();
    const cust = { id, full_name: params[0], mobile: params[1] };
    dbState.customers.set(id, cust);
    return { rows: [{ id }], rowCount: 1 };
  }
  if (/UPDATE customers SET/i.test(sql)) {
    return { rows: [], rowCount: 1 };
  }

  // Employees lookup
  if (/FROM employees/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  // Leads insert / update
  if (/INSERT INTO leads/i.test(sql)) {
    const id = crypto.randomUUID();
    const lead = {
      id,
      lead_number: params[0],
      partner_id: params[1],
      product_id: params[2],
      mobile: params[4] || params[7] || '9876543210'
    };
    dbState.leads.set(id, lead);
    return { rows: [lead], rowCount: 1 };
  }
  if (/UPDATE leads SET/i.test(sql)) {
    return { rows: [], rowCount: 1 };
  }

  // Applications insert / update
  if (/INSERT INTO applications/i.test(sql)) {
    const id = crypto.randomUUID();
    const appRow = {
      id,
      app_number: params[0],
      lead_id: params[1],
      customer_id: params[2],
      product_id: params[3],
      partner_id: params[4],
      bank_id: params[5],
      status: params[10] || 'pending',
      process_type: params[11] || 'direct_bank',
      bank_url: params[8] || null
    };
    dbState.applications.set(id, appRow);
    return { rows: [appRow], rowCount: 1 };
  }
  if (/UPDATE applications SET bank_url = \$1 WHERE id = \$2/i.test(sql)) {
    const [bankUrl, appId] = params;
    const appRow = dbState.applications.get(appId);
    if (appRow) appRow.bank_url = bankUrl;
    return { rows: appRow ? [appRow] : [], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

// Inject mock database and auth middleware into require.cache before loading controllers/routes
const dbPath = require.resolve('../config/database');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    query: (text, params) => executeMockSql(text, params),
    getClient: async () => ({
      query: (text, params) => executeMockSql(text, params),
      release: () => {}
    }),
    pool: { query: (text, params) => executeMockSql(text, params) }
  }
};

// Mock email & SMS services so tests never trigger network calls
const emailServicePath = require.resolve('../services/email/email.service');
require.cache[emailServicePath] = {
  id: emailServicePath,
  filename: emailServicePath,
  loaded: true,
  exports: {
    sendEmail: async () => ({ success: true }),
    sendLeadApplicationCreatedEmail: async () => ({ success: true })
  }
};

const smsServicePath = require.resolve('../services/sms/sms.service');
require.cache[smsServicePath] = {
  id: smsServicePath,
  filename: smsServicePath,
  loaded: true,
  exports: {
    sendLinkedShareSms: async () => ({ success: true }),
    sendApplicationStatusSms: async () => ({ success: true })
  }
};

// Mock auth middlewares to resolve user from `x-test-user-id` header using authoritative DB user lookup
const authMiddlewarePath = require.resolve('../middleware/authentication/auth.middleware.js');
const authenticateMock = (req, res, next) => {
  const userId = req.headers['x-test-user-id'];
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const dbUser = dbState.users.get(userId);
  if (!dbUser) {
    return res.status(401).json({ success: false, message: 'Invalid user token' });
  }
  // Authoritative role from DB — never trust any frontend role header/body
  req.user = { ...dbUser };
  if (dbUser.role === 'PARTNER') {
    req.partner = dbState.partnerProfiles.get(PARTNER_PROFILE_ID);
  }
  next();
};
const optionalAuthMock = (req, res, next) => {
  const userId = req.headers['x-test-user-id'];
  if (userId && dbState.users.has(userId)) {
    req.user = { ...dbState.users.get(userId) };
    if (req.user.role === 'PARTNER') {
      req.partner = dbState.partnerProfiles.get(PARTNER_PROFILE_ID);
    }
  }
  next();
};
const syncUserMock = (req, res, next) => next();
const authorizeMock = (...roles) => {
  const upper = roles.map(r => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!upper.includes(String(req.user.role || '').toUpperCase())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};
require.cache[authMiddlewarePath] = {
  id: authMiddlewarePath,
  filename: authMiddlewarePath,
  loaded: true,
  exports: {
    authenticate: authenticateMock,
    syncUser: syncUserMock,
    optionalAuth: optionalAuthMock,
    authorize: authorizeMock,
    requireApprovedPartner: authenticateMock,
    requireApprovedPartnerOrAdmin: authenticateMock
  }
};

const jwtAuthPath = require.resolve('../middleware/authentication/jwtAuth.middleware.js');
require.cache[jwtAuthPath] = {
  id: jwtAuthPath,
  filename: jwtAuthPath,
  loaded: true,
  exports: authenticateMock
};

// Load controllers and routers
const settingsRouter = require('../modules/super-admin/settings.routes');
const bankRouter = require('../modules/banks/route');
const productRouter = require('../modules/products/route');
const applicationRouter = require('../modules/crm/application.routes');
const leadRouter = require('../modules/crm/lead.routes');
const {
  validateDirectProcessUrl,
  sanitizeUrlForAudit,
  resolveDirectProcessLinkForProductRow
} = require('../modules/super-admin/bankDirectLinks.controller');

// Build Express test app
const app = express();
app.use(express.json());
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/banks', bankRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/applications', applicationRouter);
app.use('/api/v1/leads', leadRouter);

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api/v1`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

async function apiRequest(method, path, { userId = null, body = undefined } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers['x-test-user-id'] = userId;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. SUPER ADMIN CONFIGURATION TESTS
// ═════════════════════════════════════════════════════════════════════════════

test('Super Admin Configuration: Load active bank dropdown from backend', async () => {
  resetDbState();

  const res = await apiRequest('GET', '/banks?status=Active&limit=100', { userId: SUPER_ADMIN_ID });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.equal(res.body.data.length, 4); // 4 active banks, excluding retired inactive bank

  const bankIds = res.body.data.map(b => b.id);
  assert.ok(bankIds.includes(BANK_A_ID));
  assert.ok(bankIds.includes(BANK_B_ID));
  assert.ok(!bankIds.includes(BANK_INACTIVE_ID));
});

test('Super Admin Configuration: Save a valid URL for Bank A and record audit log', async () => {
  resetDbState();

  const res = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: SUPER_ADMIN_ID,
    body: {
      bank_id: BANK_A_ID,
      direct_process_link: '  https://alpha-bank.example.com/direct-apply?utm_source=gkp&token=secret123  '
    }
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.bank_id, BANK_A_ID);
  assert.equal(res.body.data.bank_name, 'Alpha National Bank');
  assert.equal(
    res.body.data.direct_process_link,
    'https://alpha-bank.example.com/direct-apply?utm_source=gkp&token=secret123'
  );
  assert.equal(res.body.data.created_by, SUPER_ADMIN_ID);

  // Verify audit log recorded CREATE action and redacted sensitive token query param
  assert.equal(dbState.auditLogs.length, 1);
  const log = dbState.auditLogs[0];
  assert.equal(log.user_id, SUPER_ADMIN_ID);
  assert.equal(log.action, 'CREATE_BANK_DIRECT_PROCESS_LINK');
  assert.equal(log.target_id, BANK_A_ID);
  assert.equal(log.details.action_type, 'CREATE');
  assert.equal(log.details.bank_id, BANK_A_ID);
  assert.ok(log.details.direct_process_link.includes('utm_source=gkp'));
  assert.ok(!log.details.direct_process_link.includes('secret123'));
  assert.ok(log.details.direct_process_link.includes('token=%5BREDACTED%5D'));
});

test('Super Admin Configuration: Update Bank A existing URL without creating duplicates', async () => {
  const updateRes = await apiRequest('PUT', `/settings/bank-direct-links/${BANK_A_ID}`, {
    userId: SUPER_ADMIN_ID,
    body: {
      direct_process_link: 'https://alpha-bank.example.com/v2/direct-apply'
    }
  });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body.data.bank_id, BANK_A_ID);
  assert.equal(updateRes.body.data.direct_process_link, 'https://alpha-bank.example.com/v2/direct-apply');
  assert.equal(updateRes.body.data.action, 'updated');

  // Ensure only 1 record exists for Bank A
  const listRes = await apiRequest('GET', '/settings/bank-direct-links', { userId: SUPER_ADMIN_ID });
  assert.equal(listRes.status, 200);
  const bankARecords = listRes.body.data.filter(r => r.bank_id === BANK_A_ID);
  assert.equal(bankARecords.length, 1);
  assert.equal(bankARecords[0].direct_process_link, 'https://alpha-bank.example.com/v2/direct-apply');

  // Verify UPDATE audit log
  assert.equal(dbState.auditLogs.length, 2);
  assert.equal(dbState.auditLogs[1].action, 'UPDATE_BANK_DIRECT_PROCESS_LINK');
  assert.equal(dbState.auditLogs[1].details.action_type, 'UPDATE');
});

test('Super Admin Configuration: Save a different URL for Bank B', async () => {
  const res = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: SUPER_ADMIN_ID,
    body: {
      bank_id: BANK_B_ID,
      direct_process_link: 'https://beta-bank.example.org/cards/apply-now'
    }
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.bank_id, BANK_B_ID);
  assert.equal(res.body.data.direct_process_link, 'https://beta-bank.example.org/cards/apply-now');

  // Retrieve Bank A and Bank B individually and verify distinct links
  const getA = await apiRequest('GET', `/settings/bank-direct-links/${BANK_A_ID}`, { userId: SUPER_ADMIN_ID });
  const getB = await apiRequest('GET', `/settings/bank-direct-links/${BANK_B_ID}`, { userId: SUPER_ADMIN_ID });
  assert.equal(getA.body.data.direct_process_link, 'https://alpha-bank.example.com/v2/direct-apply');
  assert.equal(getB.body.data.direct_process_link, 'https://beta-bank.example.org/cards/apply-now');
});

test('Super Admin Configuration: Reject empty bank selection, nonexistent bank ID, and inactive bank', async () => {
  // Empty bank_id
  const emptyBank = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: SUPER_ADMIN_ID,
    body: { bank_id: '', direct_process_link: 'https://bank.example.com/apply' }
  });
  assert.equal(emptyBank.status, 400);
  assert.equal(emptyBank.body.success, false);

  // Invalid UUID format
  const badUuid = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: SUPER_ADMIN_ID,
    body: { bank_id: 'not-a-uuid', direct_process_link: 'https://bank.example.com/apply' }
  });
  assert.equal(badUuid.status, 400);

  // Nonexistent bank UUID
  const missingBank = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: SUPER_ADMIN_ID,
    body: {
      bank_id: '99999999-9999-4999-8999-999999999999',
      direct_process_link: 'https://bank.example.com/apply'
    }
  });
  assert.equal(missingBank.status, 404);
  assert.equal(missingBank.body.success, false);

  // Inactive bank
  const inactiveBank = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: SUPER_ADMIN_ID,
    body: {
      bank_id: BANK_INACTIVE_ID,
      direct_process_link: 'https://bank.example.com/apply'
    }
  });
  assert.equal(inactiveBank.status, 400);
  assert.equal(inactiveBank.body.success, false);
});

test('Super Admin Configuration: Reject empty, malformed, and unsafe URL schemes', async () => {
  const invalidUrls = [
    '',
    '   ',
    'not-a-url',
    'http://',
    'https://invalid host with spaces.com/apply',
    'javascript:alert(1)',
    'JAVASCRIPT:alert(document.cookie)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'ftp://files.example.com/apply'
  ];

  for (const badUrl of invalidUrls) {
    const res = await apiRequest('POST', '/settings/bank-direct-links', {
      userId: SUPER_ADMIN_ID,
      body: {
        bank_id: BANK_A_ID,
        direct_process_link: badUrl
      }
    });
    assert.equal(res.status, 400, `Expected 400 for invalid URL: "${badUrl}"`);
    assert.equal(res.body.success, false);
  }
});

test('Super Admin Configuration: Reject unauthorized create/update requests (unauthenticated, PARTNER, EMPLOYEE, ADMIN)', async () => {
  // Unauthenticated -> 401
  const unauthRes = await apiRequest('POST', '/settings/bank-direct-links', {
    body: { bank_id: BANK_A_ID, direct_process_link: 'https://evil.example.com/apply' }
  });
  assert.equal(unauthRes.status, 401);

  // PARTNER -> 403
  const partnerRes = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: PARTNER_USER_ID,
    body: { bank_id: BANK_A_ID, direct_process_link: 'https://evil.example.com/apply', role: 'SUPER_ADMIN' }
  });
  assert.equal(partnerRes.status, 403);

  // EMPLOYEE -> 403
  const empRes = await apiRequest('PUT', `/settings/bank-direct-links/${BANK_A_ID}`, {
    userId: EMPLOYEE_USER_ID,
    body: { direct_process_link: 'https://evil.example.com/apply', role: 'SUPER_ADMIN' }
  });
  assert.equal(empRes.status, 403);

  // ADMIN (non-SUPER_ADMIN) -> 403
  const adminRes = await apiRequest('POST', '/settings/bank-direct-links', {
    userId: ADMIN_ID,
    body: { bank_id: BANK_A_ID, direct_process_link: 'https://evil.example.com/apply' }
  });
  assert.equal(adminRes.status, 403);

  // Verify Bank A link was NOT modified by any unauthorized attempt
  const checkA = await apiRequest('GET', `/settings/bank-direct-links/${BANK_A_ID}`, { userId: SUPER_ADMIN_ID });
  assert.equal(checkA.body.data.direct_process_link, 'https://alpha-bank.example.com/v2/direct-apply');
});

test('Super Admin Configuration: Concurrent updates for the same bank are deterministic and create no duplicates', async () => {
  const [res1, res2] = await Promise.all([
    apiRequest('PUT', `/settings/bank-direct-links/${BANK_A_ID}`, {
      userId: SUPER_ADMIN_ID,
      body: { direct_process_link: 'https://alpha-bank.example.com/concurrent-1' }
    }),
    apiRequest('PUT', `/settings/bank-direct-links/${BANK_A_ID}`, {
      userId: SUPER_ADMIN_ID,
      body: { direct_process_link: 'https://alpha-bank.example.com/concurrent-2' }
    })
  ]);

  assert.equal(res1.status, 200);
  assert.equal(res2.status, 200);

  // Restore canonical link for Bank A and verify single record
  const finalUpdate = await apiRequest('PUT', `/settings/bank-direct-links/${BANK_A_ID}`, {
    userId: SUPER_ADMIN_ID,
    body: { direct_process_link: 'https://alpha-bank.example.com/direct-process-final' }
  });
  assert.equal(finalUpdate.status, 200);

  const listRes = await apiRequest('GET', '/settings/bank-direct-links', { userId: SUPER_ADMIN_ID });
  const bankARows = listRes.body.data.filter(r => r.bank_id === BANK_A_ID);
  assert.equal(bankARows.length, 1);
  assert.equal(bankARows[0].direct_process_link, 'https://alpha-bank.example.com/direct-process-final');
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. DIRECT PROCESS BEHAVIOR & PRECEDENCE TESTS
// ═════════════════════════════════════════════════════════════════════════════

test('Direct Process Behavior: Product for Bank A uses Bank A configured link; Product for Bank B uses Bank B configured link (no cross-bank leakage)', async () => {
  // 1. Check /products list includes authoritative bank_direct_process_link per product's bank_id
  const prodsRes = await apiRequest('GET', '/products', { userId: PARTNER_USER_ID });
  assert.equal(prodsRes.status, 200);
  const prodA = prodsRes.body.data.find(p => p.id === PROD_A_ID);
  const prodB = prodsRes.body.data.find(p => p.id === PROD_B_ID);
  const prodC = prodsRes.body.data.find(p => p.id === PROD_C_ID);

  assert.equal(prodA.bank_direct_process_link, 'https://alpha-bank.example.com/direct-process-final');
  assert.equal(prodB.bank_direct_process_link, 'https://beta-bank.example.org/cards/apply-now');
  assert.equal(prodC.bank_direct_process_link, null);

  // 2. Submit Direct Process application for Product A -> uses Bank A link
  const applyARes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_A_ID,
      full_name: 'Customer Alpha',
      mobile: '9876543210',
      pincode: '400001',
      process_type: 'direct_bank',
      agree_terms: true
    }
  });
  assert.equal(applyARes.status, 200);
  assert.equal(applyARes.body.data.process_type, 'direct_bank');
  assert.equal(applyARes.body.data.bank_url, 'https://alpha-bank.example.com/direct-process-final');

  // 3. Submit Direct Process application for Product B -> uses Bank B link
  const applyBRes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_B_ID,
      full_name: 'Customer Beta',
      mobile: '9876543211',
      pincode: '400001',
      process_type: 'direct_bank',
      agree_terms: true
    }
  });
  assert.equal(applyBRes.status, 200);
  assert.equal(applyBRes.body.data.process_type, 'direct_bank');
  assert.equal(applyBRes.body.data.bank_url, 'https://beta-bank.example.org/cards/apply-now');
  assert.notEqual(applyARes.body.data.bank_url, applyBRes.body.data.bank_url);
});

test('Direct Process Behavior: Updating Bank A link immediately affects subsequent Direct Process actions', async () => {
  await apiRequest('PUT', `/settings/bank-direct-links/${BANK_A_ID}`, {
    userId: SUPER_ADMIN_ID,
    body: { direct_process_link: 'https://alpha-bank.example.com/updated-live-link' }
  });

  // Resolve via endpoint
  const resolveRes = await apiRequest('GET', `/settings/bank-direct-links/resolve-product/${PROD_A_ID}`, {
    userId: PARTNER_USER_ID
  });
  assert.equal(resolveRes.status, 200);
  assert.equal(resolveRes.body.data.direct_process_link, 'https://alpha-bank.example.com/updated-live-link');
  assert.equal(resolveRes.body.data.source, 'bank_direct_process_link');

  // Submit via POST /leads with process_type: 'direct_bank'
  const leadRes = await apiRequest('POST', '/leads', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_A_ID,
      customer_name: 'Customer Alpha Updated',
      mobile: '9876543212',
      pincode: '400001',
      process_type: 'direct_bank'
    }
  });
  assert.equal(leadRes.status, 201);
  assert.equal(leadRes.body.data.bank_url, 'https://alpha-bank.example.com/updated-live-link');
});

test('Direct Process Behavior: Bank without configured link (Bank C) follows product-level fallback; Bank without any link anywhere (Bank D) returns clear error', async () => {
  // Bank C has no bank_direct_process_link, so Product C falls back to its product.partner_url
  const applyCRes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_C_ID,
      full_name: 'Customer Gamma',
      mobile: '9876543213',
      pincode: '400001',
      process_type: 'direct_bank',
      agree_terms: true
    }
  });
  assert.equal(applyCRes.status, 200);
  assert.equal(applyCRes.body.data.bank_url, 'https://gamma-product-fallback.example.com/apply');

  // Bank D has neither bank_direct_process_link nor product-level URL -> returns 400 error instead of invalid redirect
  const applyDRes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_D_ID,
      full_name: 'Customer Delta',
      mobile: '9876543214',
      pincode: '400001',
      process_type: 'direct_bank',
      agree_terms: true
    }
  });
  assert.equal(applyDRes.status, 400);
  assert.equal(applyDRes.body.success, false);
  assert.match(applyDRes.body.message, /Direct Process link is not configured/i);
});

test('Direct Process Behavior: Other process types (linked_share, lead_punching, physical_process) remain completely unaffected', async () => {
  // Product A belongs to Bank A (which has direct_process_link = 'https://alpha-bank.example.com/updated-live-link')
  // AND has product.partner_url = 'https://alpha-legacy.example.com/partner-share'.
  // When process_type === 'linked_share', it MUST use product.partner_url, NOT bank_direct_process_link!
  const linkedShareRes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_A_ID,
      full_name: 'Customer Linked Share',
      mobile: '9876543215',
      pincode: '400001',
      process_type: 'linked_share',
      agree_terms: true
    }
  });
  assert.equal(linkedShareRes.status, 200);
  assert.equal(linkedShareRes.body.data.process_type, 'linked_share');
  assert.equal(linkedShareRes.body.data.share_url, 'https://alpha-legacy.example.com/partner-share');
  assert.equal(linkedShareRes.body.data.bank_url, null);

  // lead_punching
  const leadPunchRes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_A_ID,
      full_name: 'Customer Lead Punch',
      mobile: '9876543216',
      pincode: '400001',
      process_type: 'lead_punching',
      agree_terms: true
    }
  });
  assert.equal(leadPunchRes.status, 200);
  assert.equal(leadPunchRes.body.data.process_type, 'lead_punching');
  assert.equal(leadPunchRes.body.data.bank_url, null);

  // physical_process
  const physicalRes = await apiRequest('POST', '/applications/partner-apply', {
    userId: PARTNER_USER_ID,
    body: {
      product_id: PROD_A_ID,
      full_name: 'Customer Physical',
      mobile: '9876543217',
      pincode: '400001',
      process_type: 'physical_process',
      agree_terms: true
    }
  });
  assert.equal(physicalRes.status, 200);
  assert.equal(physicalRes.body.data.process_type, 'physical_process');
  assert.match(physicalRes.body.data.share_url, /\/physical-application\//);
  assert.equal(physicalRes.body.data.bank_url, null);
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. REGRESSION & HELPER UNIT TESTS
// ═════════════════════════════════════════════════════════════════════════════

test('Regression: Existing Super Admin system settings GET and POST continue working intact', async () => {
  const getRes = await apiRequest('GET', '/settings', { userId: SUPER_ADMIN_ID });
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.data.sbi_cc_digital_journey_link, 'https://www.sbicard.com/sprint/');

  const postRes = await apiRequest('POST', '/settings', {
    userId: SUPER_ADMIN_ID,
    body: {
      settings: {
        sbi_cc_digital_journey_link: 'https://www.sbicard.com/sprint/updated',
        hdfc_fd_wes_cc_link: 'https://applyonline.hdfcbank.com/credit-cards.html'
      }
    }
  });
  assert.equal(postRes.status, 200);

  const verifyRes = await apiRequest('GET', '/settings', { userId: SUPER_ADMIN_ID });
  assert.equal(verifyRes.body.data.sbi_cc_digital_journey_link, 'https://www.sbicard.com/sprint/updated');
});

test('Unit: validateDirectProcessUrl, sanitizeUrlForAudit, and resolveDirectProcessLinkForProductRow', () => {
  assert.equal(validateDirectProcessUrl('https://bank.example.com/apply').valid, true);
  assert.equal(validateDirectProcessUrl('http://localhost:3000/apply').valid, true);
  assert.equal(validateDirectProcessUrl('javascript:void(0)').valid, false);
  assert.equal(validateDirectProcessUrl('data:text/plain;base64,SGVsbG8=').valid, false);

  const sanitized = sanitizeUrlForAudit('https://user:pass@bank.example.com/apply?pan=ABCDE1234F&utm_source=gkp');
  assert.ok(!sanitized.includes('ABCDE1234F'));
  assert.ok(!sanitized.includes('user:pass'));
  assert.ok(sanitized.includes('utm_source=gkp'));

  const resolvedBank = resolveDirectProcessLinkForProductRow({
    name: 'Test Card',
    bank_direct_process_link: 'https://bank-level.example.com/apply',
    partner_url: 'https://product-level.example.com/apply'
  });
  assert.equal(resolvedBank.url, 'https://bank-level.example.com/apply');
  assert.equal(resolvedBank.source, 'bank_direct_process_link');

  const resolvedFallback = resolveDirectProcessLinkForProductRow({
    name: 'Test Card',
    bank_direct_process_link: null,
    partner_url: 'https://product-level.example.com/apply'
  });
  assert.equal(resolvedFallback.url, 'https://product-level.example.com/apply');
  assert.equal(resolvedFallback.source, 'product_fallback');
});

test('Frontend Helper Unit: getDirectProcessLink precedence, fallback, and cross-bank isolation', async () => {
  const path = require('node:path');
  const { pathToFileURL } = require('node:url');
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../../../frontend/src/modules/home/components/CreditCards/cardLinkHelper.js')
  ).href;
  const { getDirectProcessLink, getBankApplyLink, isSafeHttpUrl } = await import(helperUrl);

  // 1. Safe HTTP/HTTPS scheme check
  assert.equal(isSafeHttpUrl('https://bank.example.com/apply'), true);
  assert.equal(isSafeHttpUrl('http://bank.example.com/apply'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<h1>Hi</h1>'), false);
  assert.equal(isSafeHttpUrl('file:///C:/Windows/win.ini'), false);

  // 2. Bank A product uses Bank A's configured Direct Process link with precedence over product.partner_url
  const productA = {
    id: PROD_A_ID,
    name: 'Alpha Platinum Credit Card',
    bank_id: BANK_A_ID,
    bank_name: 'Alpha National Bank',
    bank_direct_process_link: 'https://alpha-bank.example.com/direct-apply',
    partner_url: 'https://alpha-legacy.example.com/partner-share'
  };
  assert.equal(getDirectProcessLink(productA), 'https://alpha-bank.example.com/direct-apply');
  // Meanwhile, getBankApplyLink (used by linked_share) still returns partner_url
  assert.equal(getBankApplyLink(productA.name, productA.bank_name, productA), 'https://alpha-legacy.example.com/partner-share');

  // 3. Bank B product uses Bank B's configured Direct Process link
  const productB = {
    id: PROD_B_ID,
    name: 'Beta Rewards Credit Card',
    bank_id: BANK_B_ID,
    bank_name: 'Beta Commercial Bank',
    bank_direct_process_link: 'https://beta-bank.example.org/apply',
    partner_url: 'https://beta-legacy.example.org/share'
  };
  assert.equal(getDirectProcessLink(productB), 'https://beta-bank.example.org/apply');

  // 4. Bank C product without configured bank link falls back to product.partner_url
  const productC = {
    id: PROD_C_ID,
    name: 'Gamma Classic Credit Card',
    bank_id: BANK_C_ID,
    bank_name: 'Gamma Fallback Bank',
    bank_direct_process_link: null,
    partner_url: 'https://gamma-product-fallback.example.com/apply'
  };
  assert.equal(getDirectProcessLink(productC), 'https://gamma-product-fallback.example.com/apply');

  // 5. Bank D product with neither bank link nor product fallback returns null
  const productD = {
    id: PROD_D_ID,
    name: 'Delta Unconfigured Card',
    bank_id: BANK_D_ID,
    bank_name: 'Delta Unlinked Bank',
    bank_direct_process_link: null,
    partner_url: null
  };
  assert.equal(getDirectProcessLink(productD), null);
});
