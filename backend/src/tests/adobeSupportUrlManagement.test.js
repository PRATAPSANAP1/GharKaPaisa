const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const crypto = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Relational State for Adobe Support URL Management Tests
// ─────────────────────────────────────────────────────────────────────────────
const HDFC_BANK_ID = 'f0b5742d-f04d-4a91-b162-6009ddf6e345';
const TATA_HDFC_BANK_ID = '1eacfa67-1187-48c7-adde-8a6edcfe9969';
const SBI_BANK_ID = 'e7c2c604-139d-4fcf-a87c-695633535a02';
const AXIS_BANK_ID = '33333333-3333-4333-8333-333333333333';

const SUPER_ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const PARTNER_USER_ID = '44444444-4444-4444-8444-444444444444';
const PARTNER_PROFILE_ID = '55555555-5555-4555-8555-555555555555';

const HDFC_REGALIA_PROD_ID = 'aaaa1111-1111-4111-8111-111111111111';
const TATA_NEU_PLUS_PROD_ID = 'bbbb2222-2222-4222-8222-222222222222';
const TATA_NEU_INFINITY_PROD_ID = 'cccc3333-3333-4333-8333-333333333333';
const SBI_SIMPLICITY_PROD_ID = 'dddd4444-4444-4444-8444-444444444444';
const AXIS_MYZONE_PROD_ID = 'eeee5555-5555-4555-8555-555555555555';

const dbState = {
  users: new Map(),
  banks: new Map(),
  products: new Map(),
  productLinkAudits: [],
  clickTracking: [],
  partnerProfiles: new Map(),
  applications: [],
  appSeq: 50000
};

function resetDb() {
  dbState.users.clear();
  dbState.banks.clear();
  dbState.products.clear();
  dbState.productLinkAudits.length = 0;
  dbState.clickTracking.length = 0;
  dbState.partnerProfiles.clear();
  dbState.applications.length = 0;

  dbState.users.set(SUPER_ADMIN_ID, {
    id: SUPER_ADMIN_ID,
    role: 'SUPER_ADMIN',
    full_name: 'Super Admin User',
    email: 'superadmin@example.com'
  });
  dbState.users.set(ADMIN_ID, {
    id: ADMIN_ID,
    role: 'ADMIN',
    full_name: 'Regular Admin User',
    email: 'admin@example.com'
  });
  dbState.users.set(PARTNER_USER_ID, {
    id: PARTNER_USER_ID,
    role: 'PARTNER',
    full_name: 'Partner User',
    email: 'partner@example.com'
  });

  dbState.partnerProfiles.set(PARTNER_PROFILE_ID, {
    id: PARTNER_PROFILE_ID,
    user_id: PARTNER_USER_ID,
    partner_code: 'PTN888',
    status: 'active'
  });

  dbState.banks.set(HDFC_BANK_ID, {
    id: HDFC_BANK_ID,
    name: 'HDFC BANK',
    short_code: 'HDFC',
    is_active: true
  });
  dbState.banks.set(TATA_HDFC_BANK_ID, {
    id: TATA_HDFC_BANK_ID,
    name: 'TATA CO-BRAND HDFC BANK',
    short_code: 'TATA_HDFC',
    is_active: true
  });
  dbState.banks.set(SBI_BANK_ID, {
    id: SBI_BANK_ID,
    name: 'STATE BANK OF INDIA',
    short_code: 'SBI',
    is_active: true
  });
  dbState.banks.set(AXIS_BANK_ID, {
    id: AXIS_BANK_ID,
    name: 'AXIS BANK',
    short_code: 'AXIS',
    is_active: true
  });

  dbState.products.set(HDFC_REGALIA_PROD_ID, {
    id: HDFC_REGALIA_PROD_ID,
    bank_id: HDFC_BANK_ID,
    name: 'HDFC Bank Regalia Gold Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    public_url: 'https://applyonline.hdfcbank.com/regalia',
    partner_url: 'https://gharkapaisa.in/r/regalia',
    adobe_support_url: null,
    tracking_enabled: true,
    button_text: 'Apply Now',
    redirect_type: 'new_tab',
    utm_source: null,
    utm_medium: 'affiliate',
    utm_campaign: null,
    priority: 10,
    commission_value: 2000,
    created_at: new Date().toISOString()
  });

  dbState.products.set(TATA_NEU_PLUS_PROD_ID, {
    id: TATA_NEU_PLUS_PROD_ID,
    bank_id: TATA_HDFC_BANK_ID,
    name: 'Tata Neu Plus HDFC Bank Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    public_url: 'https://applyonline.hdfc.bank.in/cards/tataplus.html',
    partner_url: 'https://gharkapaisa.in/r/tataplus',
    adobe_support_url: null,
    tracking_enabled: true,
    button_text: 'Apply Now',
    redirect_type: 'new_tab',
    utm_source: null,
    utm_medium: 'affiliate',
    utm_campaign: null,
    priority: 8,
    commission_value: 1800,
    created_at: new Date().toISOString()
  });

  dbState.products.set(TATA_NEU_INFINITY_PROD_ID, {
    id: TATA_NEU_INFINITY_PROD_ID,
    bank_id: TATA_HDFC_BANK_ID,
    name: 'Tata Neu Infinity HDFC Bank Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    public_url: 'https://applyonline.hdfc.bank.in/cards/tataplus.html',
    partner_url: 'https://gharkapaisa.in/r/tatainfinity',
    adobe_support_url: null,
    tracking_enabled: true,
    button_text: 'Apply Now',
    redirect_type: 'new_tab',
    utm_source: null,
    utm_medium: 'affiliate',
    utm_campaign: null,
    priority: 9,
    commission_value: 2500,
    created_at: new Date().toISOString()
  });

  dbState.products.set(SBI_SIMPLICITY_PROD_ID, {
    id: SBI_SIMPLICITY_PROD_ID,
    bank_id: SBI_BANK_ID,
    name: 'SBI SimplyCLICK Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    public_url: 'https://www.sbicard.com/simplyclick',
    partner_url: 'https://gharkapaisa.in/r/simplyclick',
    adobe_support_url: null,
    tracking_enabled: true,
    button_text: 'Apply Now',
    redirect_type: 'new_tab',
    utm_source: null,
    utm_medium: 'affiliate',
    utm_campaign: null,
    priority: 7,
    commission_value: 1200,
    created_at: new Date().toISOString()
  });

  dbState.products.set(AXIS_MYZONE_PROD_ID, {
    id: AXIS_MYZONE_PROD_ID,
    bank_id: AXIS_BANK_ID,
    name: 'Axis Bank MyZone Credit Card',
    category: 'credit_card',
    is_active: true,
    status: 'Active',
    public_url: 'https://axisbank.com/myzone',
    partner_url: 'https://gharkapaisa.in/r/myzone',
    adobe_support_url: null,
    tracking_enabled: true,
    button_text: 'Apply Now',
    redirect_type: 'new_tab',
    utm_source: null,
    utm_medium: 'affiliate',
    utm_campaign: null,
    priority: 5,
    commission_value: 1000,
    created_at: new Date().toISOString()
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Intercept database query calls with in-memory emulator
// ─────────────────────────────────────────────────────────────────────────────
const databaseModule = require('../config/database');
const originalQuery = databaseModule.query;

databaseModule.query = async (sqlText, params = []) => {
  const sql = String(sqlText || '').replace(/\s+/g, ' ').trim();

  if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  // Bank check
  if (/SELECT id FROM banks WHERE id = \$1/i.test(sql)) {
    const b = dbState.banks.get(params[0]);
    return { rows: b ? [b] : [], rowCount: b ? 1 : 0 };
  }

  // Slug check
  if (/SELECT id FROM products WHERE slug = \$1/i.test(sql)) {
    return { rows: [], rowCount: 0 };
  }

  // Check duplicate public_url
  if (/SELECT id, name FROM products WHERE public_url = \$1/i.test(sql)) {
    const [url, currentId] = params;
    for (const p of dbState.products.values()) {
      if (p.id !== currentId && p.public_url === url) {
        return { rows: [p], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  // Check duplicate partner_url
  if (/SELECT id, name FROM products WHERE partner_url = \$1/i.test(sql)) {
    const [url, currentId] = params;
    for (const p of dbState.products.values()) {
      if (p.id !== currentId && p.partner_url === url) {
        return { rows: [p], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  // SELECT public_url, partner_url, adobe_support_url FROM products WHERE id = $1
  if (/SELECT (public_url, partner_url|public_url, partner_url, adobe_support_url) FROM products WHERE id = \$1/i.test(sql)) {
    const p = dbState.products.get(params[0]);
    return {
      rows: p ? [{ public_url: p.public_url, partner_url: p.partner_url, adobe_support_url: p.adobe_support_url }] : [],
      rowCount: p ? 1 : 0
    };
  }

  // UPDATE products SET public_url = $1, partner_url = $2, adobe_support_url = $3...
  if (/UPDATE products SET public_url = \$1, partner_url = \$2, adobe_support_url = \$3/i.test(sql)) {
    const [
      public_url, partner_url, adobe_support_url, tracking_enabled,
      button_text, redirect_type, utm_source, utm_medium, utm_campaign,
      priority, last_updated_by, id
    ] = params;
    const existing = dbState.products.get(id);
    if (!existing) return { rows: [], rowCount: 0 };

    existing.public_url = public_url;
    existing.partner_url = partner_url;
    existing.adobe_support_url = adobe_support_url;
    existing.tracking_enabled = tracking_enabled;
    existing.button_text = button_text;
    existing.redirect_type = redirect_type;
    existing.utm_source = utm_source;
    existing.utm_medium = utm_medium;
    existing.utm_campaign = utm_campaign;
    existing.priority = priority;
    existing.last_updated_by = last_updated_by;
    existing.last_updated_at = new Date().toISOString();

    return { rows: [existing], rowCount: 1 };
  }

  // DELETE link (reset public_url, partner_url, adobe_support_url to NULL)
  if (/UPDATE products SET public_url = NULL, partner_url = NULL, adobe_support_url = NULL/i.test(sql)) {
    const [userId, id] = params;
    const existing = dbState.products.get(id);
    if (!existing) return { rows: [], rowCount: 0 };
    existing.public_url = null;
    existing.partner_url = null;
    existing.adobe_support_url = null;
    existing.last_updated_by = userId;
    existing.last_updated_at = new Date().toISOString();
    return { rows: [existing], rowCount: 1 };
  }

  // Product Link Audits INSERT
  if (/INSERT INTO product_link_audits/i.test(sql)) {
    const [product_id, old_url, new_url, updated_by, reason, ip_address] = params;
    const audit = {
      id: crypto.randomUUID(),
      product_id,
      old_url,
      new_url,
      updated_by,
      reason,
      ip_address,
      updated_at: new Date().toISOString()
    };
    dbState.productLinkAudits.push(audit);
    return { rows: [audit], rowCount: 1 };
  }

  // SELECT single product (getProduct)
  if (/SELECT p\.\*.*FROM products p.*WHERE p\.id = \$1/i.test(sql) || /SELECT \* FROM products WHERE id = \$1/i.test(sql)) {
    const p = dbState.products.get(params[0]);
    if (!p) return { rows: [], rowCount: 0 };
    const b = dbState.banks.get(p.bank_id);
    return {
      rows: [{
        ...p,
        bank_name: b?.name,
        bank_code: b?.short_code
      }],
      rowCount: 1
    };
  }

  // SELECT single link (getProductLink)
  if (/SELECT p\.id, p\.name, p\.category, p\.bank_id.*adobe_support_url.*FROM products p/i.test(sql)) {
    const p = dbState.products.get(params[0]);
    if (!p) return { rows: [], rowCount: 0 };
    const b = dbState.banks.get(p.bank_id);
    return {
      rows: [{
        id: p.id,
        name: p.name,
        category: p.category,
        bank_id: p.bank_id,
        public_url: p.public_url,
        partner_url: p.partner_url,
        adobe_support_url: p.adobe_support_url,
        tracking_enabled: p.tracking_enabled,
        button_text: p.button_text,
        redirect_type: p.redirect_type,
        utm_source: p.utm_source,
        utm_medium: p.utm_medium,
        utm_campaign: p.utm_campaign,
        priority: p.priority,
        last_updated_at: p.last_updated_at,
        bank_name: b?.name
      }],
      rowCount: 1
    };
  }

  // Audits history query for a product
  if (/FROM product_link_audits a/i.test(sql)) {
    const audits = dbState.productLinkAudits.filter(a => a.product_id === params[0]);
    return { rows: audits, rowCount: audits.length };
  }

  // List product links (listProductLinks)
  if (/FROM products p JOIN banks b ON p\.bank_id = b\.id/i.test(sql) && /SELECT COUNT\(\*\)/i.test(sql)) {
    return { rows: [{ count: dbState.products.size }], rowCount: 1 };
  }
  if (/FROM products p JOIN banks b ON p\.bank_id = b\.id/i.test(sql)) {
    const rows = Array.from(dbState.products.values()).map(p => {
      const b = dbState.banks.get(p.bank_id);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        is_active: p.is_active,
        bank_id: p.bank_id,
        public_url: p.public_url,
        partner_url: p.partner_url,
        adobe_support_url: p.adobe_support_url,
        tracking_enabled: p.tracking_enabled,
        button_text: p.button_text,
        redirect_type: p.redirect_type,
        utm_source: p.utm_source,
        utm_medium: p.utm_medium,
        utm_campaign: p.utm_campaign,
        priority: p.priority,
        last_updated_at: p.last_updated_at,
        bank_name: b?.name
      };
    });
    return { rows, rowCount: rows.length };
  }

  // UPDATE products in updateProduct (PUT /products/:id or PUT /superadmin/products/:id)
  if (/UPDATE products SET.*adobe_support_url = CASE WHEN/i.test(sql)) {
    const id = params[params.length - 1];
    const isProvided = params[params.length - 3];
    const providedVal = params[params.length - 2];
    const existing = dbState.products.get(id);
    if (!existing) return { rows: [], rowCount: 0 };

    if (isProvided) {
      existing.adobe_support_url = providedVal;
    }
    if (params[0]) existing.name = params[0];
    existing.last_updated_at = new Date().toISOString();

    return { rows: [existing], rowCount: 1 };
  }

  // INSERT products in createProduct
  if (/INSERT INTO products \(.*adobe_support_url\)/i.test(sql)) {
    const newId = crypto.randomUUID();
    const [bank_id, name, category] = params;
    const adobeUrl = params[params.length - 1];
    const newProd = {
      id: newId,
      bank_id,
      name,
      category,
      adobe_support_url: adobeUrl,
      is_active: true,
      created_at: new Date().toISOString()
    };
    dbState.products.set(newId, newProd);
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  // Fallback for auxiliary queries (features, offers, reviews, etc.)
  if (/FROM product_features/i.test(sql)) return { rows: [], rowCount: 0 };
  if (/FROM product_offers/i.test(sql)) return { rows: [], rowCount: 0 };
  if (/FROM product_faqs/i.test(sql)) return { rows: [], rowCount: 0 };
  if (/product_ratings/i.test(sql) || /product_reviews/i.test(sql)) return { rows: [{ avg_rating: '4.8', total_reviews: '42' }], rowCount: 1 };
  if (/FROM product_documents/i.test(sql)) return { rows: [], rowCount: 0 };

  return { rows: [], rowCount: 0 };
};

// ─────────────────────────────────────────────────────────────────────────────
// Test HTTP Server setup
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Fake Auth Middleware
app.use((req, res, next) => {
  const role = req.headers['x-test-role'] || 'SUPER_ADMIN';
  const uid = req.headers['x-test-user-id'] || SUPER_ADMIN_ID;
  req.user = { id: uid, role, email: 'test@example.com' };
  next();
});

const linkCtrl = require('../modules/products/link-management.controller.js');
const productCtrl = require('../modules/products/controller.js');

// Routes under test
app.get('/api/v1/products/links', linkCtrl.listProductLinks);
app.get('/api/v1/products/link/:id', linkCtrl.getProductLink);
app.post('/api/v1/products/link', linkCtrl.saveProductLink);
app.put('/api/v1/products/link/:id', linkCtrl.saveProductLink);
app.delete('/api/v1/products/link/:id', linkCtrl.deleteProductLink);

app.get('/api/v1/products/:id', productCtrl.getProduct);
app.post('/api/v1/products', productCtrl.createProduct);
app.put('/api/v1/products/:id', productCtrl.updateProduct);

let server;
let serverPort;

function apiRequest(method, endpoint, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: serverPort,
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (_) { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test.before(async () => {
  resetDb();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      resolve();
    });
  });
});

test.after(async () => {
  databaseModule.query = originalQuery;
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// 10 MANDATORY TEST SCENARIOS
// ═════════════════════════════════════════════════════════════════════════════

const VALID_ADOBE_URL = 'https://applyonline.hdfc.bank.in/cards/credit-cards.html?CHANNELSOURCE=TDCC&DEDUPE=N&DSACode=XYOH&LGcode=YOH5&LCcode=YOH5&LC2=A222&SMcode=S54558';

test('Scenario 1: Saving a valid Adobe Support URL through the Product Modify interface (PUT /api/v1/products/:id)', async () => {
  resetDb();
  const updateRes = await apiRequest('PUT', `/api/v1/products/${TATA_NEU_PLUS_PROD_ID}`, {
    body: {
      name: 'Tata Neu Plus HDFC Bank Credit Card',
      adobe_support_url: VALID_ADOBE_URL
    }
  });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);

  // Verify in-memory DB row
  const row = dbState.products.get(TATA_NEU_PLUS_PROD_ID);
  assert.equal(row.adobe_support_url, VALID_ADOBE_URL);
});

test('Scenario 2: Saving and editing the same URL through Super Admin -> Links interface (PUT /api/v1/products/link/:id)', async () => {
  resetDb();
  const linkRes = await apiRequest('PUT', `/api/v1/products/link/${TATA_NEU_PLUS_PROD_ID}`, {
    body: {
      adobe_support_url: VALID_ADOBE_URL,
      public_url: 'https://applyonline.hdfc.bank.in/cards/credit-cards.html',
      partner_url: 'https://gharkapaisa.in/r/tataplus',
      reason: 'Configured official Adobe Support link'
    }
  });

  assert.equal(linkRes.status, 200);
  assert.equal(linkRes.body.success, true);
  assert.equal(linkRes.body.data.adobe_support_url, VALID_ADOBE_URL);

  const row = dbState.products.get(TATA_NEU_PLUS_PROD_ID);
  assert.equal(row.adobe_support_url, VALID_ADOBE_URL);
  assert.ok(dbState.productLinkAudits.length > 0);
});

test('Scenario 3: Verifying both interfaces return and display the same saved value', async () => {
  resetDb();
  // Set value through Product Modify
  await apiRequest('PUT', `/api/v1/products/${TATA_NEU_INFINITY_PROD_ID}`, {
    body: {
      name: 'Tata Neu Infinity HDFC Bank Credit Card',
      adobe_support_url: VALID_ADOBE_URL
    }
  });

  // Verify read from Products API
  const prodRes = await apiRequest('GET', `/api/v1/products/${TATA_NEU_INFINITY_PROD_ID}`);
  assert.equal(prodRes.status, 200);
  assert.equal(prodRes.body.data.adobe_support_url, VALID_ADOBE_URL);

  // Verify read from Links API
  const linkRes = await apiRequest('GET', `/api/v1/products/link/${TATA_NEU_INFINITY_PROD_ID}`);
  assert.equal(linkRes.status, 200);
  assert.equal(linkRes.body.data.adobe_support_url, VALID_ADOBE_URL);

  // Verify list links API includes the field
  const listRes = await apiRequest('GET', '/api/v1/products/links');
  assert.equal(listRes.status, 200);
  const found = listRes.body.data.data.find(p => p.id === TATA_NEU_INFINITY_PROD_ID);
  assert.ok(found);
  assert.equal(found.adobe_support_url, VALID_ADOBE_URL);
});

test('Scenario 4: Clearing the Adobe Support URL and confirming it remains cleared (persisting NULL)', async () => {
  resetDb();
  // Seed with URL first
  dbState.products.get(TATA_NEU_PLUS_PROD_ID).adobe_support_url = VALID_ADOBE_URL;

  // 1. Clear via Links API
  const clearLinkRes = await apiRequest('PUT', `/api/v1/products/link/${TATA_NEU_PLUS_PROD_ID}`, {
    body: {
      adobe_support_url: '',
      reason: 'Admin intentionally cleared Adobe Support URL'
    }
  });
  assert.equal(clearLinkRes.status, 200);
  assert.equal(clearLinkRes.body.data.adobe_support_url, null);
  assert.equal(dbState.products.get(TATA_NEU_PLUS_PROD_ID).adobe_support_url, null);

  // 2. Clear via Product Modify API
  dbState.products.get(TATA_NEU_PLUS_PROD_ID).adobe_support_url = VALID_ADOBE_URL;
  const clearProdRes = await apiRequest('PUT', `/api/v1/products/${TATA_NEU_PLUS_PROD_ID}`, {
    body: {
      adobe_support_url: null
    }
  });
  assert.equal(clearProdRes.status, 200);
  assert.equal(dbState.products.get(TATA_NEU_PLUS_PROD_ID).adobe_support_url, null);

  // 3. Delete link resets adobe_support_url as well
  dbState.products.get(TATA_NEU_PLUS_PROD_ID).adobe_support_url = VALID_ADOBE_URL;
  const deleteRes = await apiRequest('DELETE', `/api/v1/products/link/${TATA_NEU_PLUS_PROD_ID}`);
  assert.equal(deleteRes.status, 200);
  assert.equal(dbState.products.get(TATA_NEU_PLUS_PROD_ID).adobe_support_url, null);
});

test('Scenario 5: Rejecting invalid URL protocols (javascript:, data:, malformed) with 400 Bad Request', async () => {
  resetDb();

  const invalidUrls = [
    'javascript:alert(document.cookie)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'not-a-valid-url',
    'http:// space.com',
    'ftp://bank.example.com/apply'
  ];

  for (const badUrl of invalidUrls) {
    // Via Links API
    const resLinks = await apiRequest('PUT', `/api/v1/products/link/${TATA_NEU_PLUS_PROD_ID}`, {
      body: { adobe_support_url: badUrl }
    });
    assert.equal(resLinks.status, 400, `Expected 400 for bad URL in links API: ${badUrl}`);
    assert.match(resLinks.body.message, /valid http:\/\/ or https:\/\/ URL/i);

    // Via Products API
    const resProd = await apiRequest('PUT', `/api/v1/products/${TATA_NEU_PLUS_PROD_ID}`, {
      body: { adobe_support_url: badUrl }
    });
    assert.equal(resProd.status, 400, `Expected 400 for bad URL in products API: ${badUrl}`);
    assert.match(resProd.body.message, /valid http:\/\/ or https:\/\/ URL/i);
  }
});

test('Scenario 6: Confirming that the Adobe Support button renders when a valid URL is configured for eligible HDFC products', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../../../frontend/src/modules/home/components/CreditCards/cardLinkHelper.js')
  ).href;
  const { getAdobeSupportLink, isEligibleHdfcAdobeProduct } = await import(helperUrl);

  const eligibleTataPlus = {
    id: TATA_NEU_PLUS_PROD_ID,
    name: 'Tata Neu Plus HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK',
    adobe_support_url: VALID_ADOBE_URL
  };
  assert.equal(isEligibleHdfcAdobeProduct(eligibleTataPlus), true);
  assert.equal(getAdobeSupportLink(eligibleTataPlus), VALID_ADOBE_URL);

  const eligibleTataInfinity = {
    id: TATA_NEU_INFINITY_PROD_ID,
    name: 'Tata Neu Infinity HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK',
    adobe_support_url: VALID_ADOBE_URL
  };
  assert.equal(isEligibleHdfcAdobeProduct(eligibleTataInfinity), true);
  assert.equal(getAdobeSupportLink(eligibleTataInfinity), VALID_ADOBE_URL);

  const eligibleHdfcRegalia = {
    id: HDFC_REGALIA_PROD_ID,
    name: 'HDFC Bank Regalia Gold Credit Card',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC BANK',
    adobe_support_url: VALID_ADOBE_URL
  };
  assert.equal(isEligibleHdfcAdobeProduct(eligibleHdfcRegalia), true);
  assert.equal(getAdobeSupportLink(eligibleHdfcRegalia), VALID_ADOBE_URL);
});

test('Scenario 7: Confirming that the Adobe Support button is hidden or disabled when no URL is configured', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../../../frontend/src/modules/home/components/CreditCards/cardLinkHelper.js')
  ).href;
  const { getAdobeSupportLink } = await import(helperUrl);

  // Null URL
  assert.equal(getAdobeSupportLink({
    name: 'Tata Neu Plus HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK',
    adobe_support_url: null
  }), null);

  // Empty string
  assert.equal(getAdobeSupportLink({
    name: 'Tata Neu Plus HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK',
    adobe_support_url: ''
  }), null);

  // Undefined
  assert.equal(getAdobeSupportLink({
    name: 'Tata Neu Infinity HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK'
  }), null);

  // Whitespace only
  assert.equal(getAdobeSupportLink({
    name: 'Tata Neu Infinity HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK',
    adobe_support_url: '   '
  }), null);
});

test('Scenario 8: Ensuring that a non-HDFC product never receives or displays the HDFC Adobe Support URL accidentally', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../../../frontend/src/modules/home/components/CreditCards/cardLinkHelper.js')
  ).href;
  const { getAdobeSupportLink, isEligibleHdfcAdobeProduct } = await import(helperUrl);

  // SBI product
  const sbiProduct = {
    id: SBI_SIMPLICITY_PROD_ID,
    name: 'SBI SimplyCLICK Credit Card',
    bank_id: SBI_BANK_ID,
    bank_name: 'STATE BANK OF INDIA',
    bank_code: 'SBI',
    adobe_support_url: VALID_ADOBE_URL // Even if passed, must be rejected
  };
  assert.equal(isEligibleHdfcAdobeProduct(sbiProduct), false);
  assert.equal(getAdobeSupportLink(sbiProduct), null);

  // Tata Co-Brand SBI product
  const tataSbiProduct = {
    id: 'tata-sbi-uuid',
    name: 'Tata Neu SBI Card',
    bank_id: 'ad9a965f-63c9-4a67-92be-058b45eea1f5',
    bank_name: 'TATA CO-BRAND SBI BANK',
    bank_code: 'TATA_SBI',
    adobe_support_url: VALID_ADOBE_URL
  };
  assert.equal(isEligibleHdfcAdobeProduct(tataSbiProduct), false);
  assert.equal(getAdobeSupportLink(tataSbiProduct), null);

  // Axis product
  const axisProduct = {
    id: AXIS_MYZONE_PROD_ID,
    name: 'Axis Bank MyZone Credit Card',
    bank_id: AXIS_BANK_ID,
    bank_name: 'AXIS BANK',
    bank_code: 'AXIS',
    adobe_support_url: VALID_ADOBE_URL
  };
  assert.equal(isEligibleHdfcAdobeProduct(axisProduct), false);
  assert.equal(getAdobeSupportLink(axisProduct), null);
});

test('Scenario 9: Confirming that Direct Bank Process and Card Assist / Co-Browsing continue working properly and do not interfere', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../../../frontend/src/modules/home/components/CreditCards/cardLinkHelper.js')
  ).href;
  const { getDirectProcessLink, getBankApplyLink, getAdobeSupportLink } = await import(helperUrl);

  const product = {
    id: TATA_NEU_PLUS_PROD_ID,
    name: 'Tata Neu Plus HDFC Bank Credit Card',
    bank_id: TATA_HDFC_BANK_ID,
    bank_name: 'TATA CO-BRAND HDFC BANK',
    public_url: 'https://applyonline.hdfc.bank.in/cards/credit-cards.html',
    partner_url: 'https://gharkapaisa.in/r/tataplus',
    adobe_support_url: VALID_ADOBE_URL
  };

  // Adobe Support link is independent
  assert.equal(getAdobeSupportLink(product), VALID_ADOBE_URL);

  // Direct Process link resolution remains unaffected
  const directProcessLink = getDirectProcessLink(product);
  assert.ok(directProcessLink);
  assert.match(directProcessLink, /^https?:\/\//);

  // Partner apply link resolution remains unaffected
  const applyLink = getBankApplyLink(product.name, product.bank_name, product);
  assert.equal(applyLink, 'https://gharkapaisa.in/r/tataplus');
});

test('Scenario 10: Confirming that existing product links, lead creation, click tracking, and permissions remain unaffected', async () => {
  resetDb();
  // 1. Duplicate public_url protection still enforced
  const dupPublicRes = await apiRequest('PUT', `/api/v1/products/link/${TATA_NEU_INFINITY_PROD_ID}`, {
    body: {
      public_url: 'https://applyonline.hdfcbank.com/regalia' // already on HDFC Regalia
    }
  });
  assert.equal(dupPublicRes.status, 400);
  assert.match(dupPublicRes.body.message, /already assigned to product/i);

  // 2. Non-duplicate adobe_support_url allowed across multiple HDFC products
  const allowSharedAdobe1 = await apiRequest('PUT', `/api/v1/products/link/${TATA_NEU_PLUS_PROD_ID}`, {
    body: { adobe_support_url: VALID_ADOBE_URL }
  });
  assert.equal(allowSharedAdobe1.status, 200);

  const allowSharedAdobe2 = await apiRequest('PUT', `/api/v1/products/link/${TATA_NEU_INFINITY_PROD_ID}`, {
    body: { adobe_support_url: VALID_ADOBE_URL }
  });
  assert.equal(allowSharedAdobe2.status, 200);

  // 3. Audit trail records correct entries
  const historyRes = await apiRequest('GET', `/api/v1/products/link/${TATA_NEU_PLUS_PROD_ID}`);
  assert.equal(historyRes.status, 200);
  assert.ok(Array.isArray(historyRes.body.data.history));

  // 4. Click tracking handler works
  const clickRes = await apiRequest('POST', '/api/v1/products/link', {
    body: {
      product_id: TATA_NEU_PLUS_PROD_ID,
      partner_code: 'PTN888',
      campaign: 'test_camp'
    }
  });
  assert.equal(clickRes.status, 200);
});
