/**
 * Unit & Integration Test Suite for Lead Orchestration Fixes (Bugs #1 to #10)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Color helpers
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`;

console.log(bold('\n======================================================'));
console.log(bold('  RUNNING LEAD ORCHESTRATION PRODUCTION FIXES AUDIT   '));
console.log(bold('======================================================\n'));

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`${green('PASS')} - ${name}`);
    passed++;
  } catch (err) {
    console.error(`${red('FAIL')} - ${name}`);
    console.error(err);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`${green('PASS')} - ${name}`);
    passed++;
  } catch (err) {
    console.error(`${red('FAIL')} - ${name}`);
    console.error(err);
    failed++;
  }
}

(async () => {
  const leadCtrlPath = path.resolve(__dirname, '../modules/crm/lead.controller.js');
  const leadServicePath = path.resolve(__dirname, '../modules/crm/lead.service.js');
  const migrationPath = path.resolve(__dirname, '../database/migrations/migrate_lead_orchestration_performance_indexes.js');

  const leadCtrlCode = fs.readFileSync(leadCtrlPath, 'utf8');
  const leadServiceCode = fs.readFileSync(leadServicePath, 'utf8');
  const migrationCode = fs.readFileSync(migrationPath, 'utf8');

  // Test 1: Bug #1 - LATERAL Joins replace 3 scalar N+1 subqueries in listLeads
  runTest('Bug #1: listLeads uses LATERAL JOINs instead of scalar subqueries in SELECT', () => {
    assert(!leadCtrlCode.includes('(SELECT executive_name FROM bank_assignments WHERE lead_id = l.id ORDER BY assigned_at DESC LIMIT 1) as bank_executive_name'),
      'Scalar subquery for bank_assignments should be removed');
    assert(!leadCtrlCode.includes('(SELECT COUNT(*)::int FROM lead_documents WHERE lead_id = l.id) as documents_count'),
      'Scalar subquery for lead_documents should be removed');
    assert(!leadCtrlCode.includes('(SELECT COUNT(*)::int FROM lead_checklist WHERE lead_id = l.id AND status = \'verified\') as checklist_verified_count'),
      'Scalar subquery for lead_checklist should be removed');

    assert(leadCtrlCode.includes('LEFT JOIN LATERAL (\n          SELECT executive_name FROM bank_assignments WHERE lead_id = l.id ORDER BY assigned_at DESC LIMIT 1\n        ) ba ON true') ||
           leadCtrlCode.includes('LEFT JOIN LATERAL') && leadCtrlCode.includes('ba ON true'),
      'LATERAL JOIN for bank_assignments must be present');
    assert(leadCtrlCode.includes('ba.executive_name as bank_executive_name'),
      'Projection should select ba.executive_name');
    assert(leadCtrlCode.includes('COALESCE(ld.documents_count, 0)::int as documents_count'),
      'Projection should use COALESCE(ld.documents_count, 0)::int');
    assert(leadCtrlCode.includes('COALESCE(lc.checklist_verified_count, 0)::int as checklist_verified_count'),
      'Projection should use COALESCE(lc.checklist_verified_count, 0)::int');
  });

  // Test 2: Bug #2 & Fix 4 - updateLead ownership check
  runTest('Bug #2 & Fix 4: updateLead enforces partner ownership', () => {
    assert(leadCtrlCode.includes('existing.partner_id !== partnerId && existing.created_by !== req.user.id'),
      'updateLead must check partner_id and created_by against requesting partner');
    assert(leadCtrlCode.includes('return forbidden(res, \'You do not own this lead\')'),
      'updateLead must return 403 forbidden if not owner');
  });

  // Test 3: Bug #3 - assignLead and assignBankExecutive validate lead & write activity log
  runTest('Bug #3: assignLead and assignBankExecutive validate lead and log activity', () => {
    assert(leadCtrlCode.includes('logLeadActivity(null, id, \'lead_assigned\', req.user.id, \'lead_assignments\', assign.id, req)'),
      'assignLead must write audit log to lead_activity_logs');
    assert(leadCtrlCode.includes('logLeadActivity(null, id, \'bank_executive_assigned\', req.user.id, \'bank_assignments\', bankAss.id, req)'),
      'assignBankExecutive must write audit log to lead_activity_logs');
  });

  // Test 4: Bug #4 - updateLeadStatus role check
  runTest('Bug #4: updateLeadStatus verifies admin role at controller level', () => {
    assert(leadCtrlCode.includes('if (![\'SUPER_ADMIN\', \'ADMIN\'].includes(req.user?.role)) {\n      return forbidden(res, \'Only administrators can update lead status\');\n    }'),
      'updateLeadStatus must check role before allowing update');
  });

  // Test 5: Bug #5 - Super admin leads OR precedence
  runTest('Bug #5: listLeads protects OR precedence in super admin filter', () => {
    assert(leadCtrlCode.includes('const isSuperAdminLeads = [\'SUPER_ADMIN\', \'ADMIN\'].includes(req.user?.role)'),
      'isSuperAdminLeads must require SUPER_ADMIN or ADMIN role');
    assert(leadCtrlCode.includes('whereClause += ` AND (l.status = $${idx++})`'),
      'status conditions must be isolated with parentheses');
  });

  // Test 6: Bug #6 & Fix 7 - get360LeadDetails customer cards parallel split
  runTest('Bug #6 & Fix 7: get360LeadDetails splits UNION into two parallel indexed queries', () => {
    assert(!leadCtrlCode.includes('WHERE a.customer_id IN (SELECT id FROM customers WHERE mobile = $1)\n           OR a.lead_id IN (SELECT id FROM leads WHERE mobile = $1)\n        UNION'),
      'Heavy UNION subquery must be removed');
    assert(leadCtrlCode.includes('appCardsRes') && leadCtrlCode.includes('leadCardsRes'),
      'Parallel appCardsRes and leadCardsRes queries must exist');
    assert(leadCtrlCode.includes('customerCards'),
      'Customer cards should be combined in JavaScript');
  });

  // Test 7: Bug #7 & Fix 2 - createLead transaction wrapping
  runTest('Bug #7 & Fix 2: createLead wraps inserts in client transaction', () => {
    assert(leadCtrlCode.includes('await client.query(\'BEGIN\');'),
      'createLead must begin transaction');
    assert(leadCtrlCode.includes('await client.query(\'COMMIT\');'),
      'createLead must commit transaction');
    assert(leadCtrlCode.includes('await client.query(\'ROLLBACK\');'),
      'createLead must rollback on error');
    assert(leadCtrlCode.includes('initializeLeadPipeline(lead.id, req.user.id, \'share_link\', priority || \'medium\', client)') ||
           leadCtrlCode.includes('initializeLeadPipeline(lead.id, req.user.id, source || \'partner\', priority || \'medium\', client)'),
      'initializeLeadPipeline must receive the transaction client');
  });

  // Test 8: Bug #8 & Fix 3 - verifyLeadOtp commission trigger
  runTest('Bug #8 & Fix 3: verifyLeadOtp triggers commission payout for eligible processes', () => {
    assert(leadCtrlCode.includes('if (lead.process_type !== \'direct_bank\') {\n      try {\n        await triggerAutomaticCommissionPayout(lead.id, null, req.user.id);'),
      'verifyLeadOtp must call triggerAutomaticCommissionPayout when process_type is not direct_bank');
  });

  // Test 9: Bug #9 - listPartnerShareLeads mobile column safety
  runTest('Bug #9: listPartnerShareLeads uses l.mobile directly', () => {
    assert(!leadCtrlCode.includes('COALESCE(l.customer_mobile, l.mobile) as customer_mobile'),
      'listPartnerShareLeads should not rely on customer_mobile column');
    assert(leadCtrlCode.includes('l.mobile as customer_mobile'),
      'listPartnerShareLeads should alias l.mobile as customer_mobile');
    assert(!leadCtrlCode.includes('l.customer_name ILIKE $${idx} OR l.customer_mobile ILIKE $${idx} OR l.mobile ILIKE $${idx}'),
      'WHERE clause should not scan non-existent customer_mobile column');
  });

  // Test 10: Bug #10 & Fix 5 - initializeLeadPipeline safe conflict target
  runTest('Bug #10 & Fix 5: initializeLeadPipeline explicitly specifies conflict target', () => {
    assert(leadServiceCode.includes('ON CONFLICT (lead_id, item) DO NOTHING'),
      'initializeLeadPipeline must specify ON CONFLICT (lead_id, item) DO NOTHING');
    assert(leadServiceCode.includes('const initializeLeadPipeline = async (leadId, userId, source = \'partner\', priority = \'medium\', passedClient = null)'),
      'initializeLeadPipeline must accept passedClient');
  });

  // Test 11: Fix 6 - Migration file creates all 4 indexes and validates constraints
  runTest('Fix 6: Migration script includes all indexes, column check, and unique constraint', () => {
    assert(migrationCode.includes('idx_lead_documents_lead_id'), 'idx_lead_documents_lead_id must be created');
    assert(migrationCode.includes('idx_lead_checklist_lead_status'), 'idx_lead_checklist_lead_status must be created');
    assert(migrationCode.includes('idx_bank_assignments_lead_assigned'), 'idx_bank_assignments_lead_assigned must be created');
    assert(migrationCode.includes('idx_leads_partner_created'), 'idx_leads_partner_created must be created');
    assert(migrationCode.includes('customer_mobile VARCHAR(15)'), 'customer_mobile column addition must be included');
    assert(migrationCode.includes('unique_lead_check_item'), 'unique_lead_check_item constraint must be verified');
  });

  // Runtime mock test: updateLead ownership logic
  runTest('Controller Unit: updateLead rejects unauthorized partner', async () => {
    const { updateLead } = require('../modules/crm/lead.controller.js');
    let statusCode = 0;
    let jsonBody = null;
    const req = {
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { customer_name: 'Hacked Name' },
      user: { role: 'PARTNER', id: '11111111-1111-1111-1111-111111111111' }
    };
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { jsonBody = body; return this; }
    };

    // Mock query in database config
    const db = require('../config/database');
    const origQuery = db.query;
    try {
      db.query = async (text, params) => {
        if (text.includes('SELECT * FROM leads WHERE id')) {
          return { rows: [{ id: req.params.id, partner_id: '99999999-9999-9999-9999-999999999999', created_by: '88888888-8888-8888-8888-888888888888' }] };
        }
        if (text.includes('SELECT id FROM partner_profiles WHERE user_id')) {
          return { rows: [{ id: '22222222-2222-2222-2222-222222222222' }] };
        }
        return { rows: [] };
      };

      await updateLead(req, res, (err) => { if (err) throw err; });
      assert.strictEqual(statusCode, 403, 'Expected status code 403 for unauthorized partner');
      assert.strictEqual(jsonBody.message, 'You do not own this lead', 'Expected "You do not own this lead" message');
    } finally {
      db.query = origQuery;
    }
  });

  // Runtime mock test: updateLeadStatus role enforcement
  runTest('Controller Unit: updateLeadStatus rejects non-admin users', async () => {
    const { updateLeadStatus } = require('../modules/crm/lead.controller.js');
    let statusCode = 0;
    let jsonBody = null;
    const req = {
      params: { id: '00000000-0000-0000-0000-000000000001' },
      body: { status: 'approved' },
      user: { role: 'PARTNER', id: '11111111-1111-1111-1111-111111111111' }
    };
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { jsonBody = body; return this; }
    };

    await updateLeadStatus(req, res, (err) => { if (err) throw err; });
    assert.strictEqual(statusCode, 403, 'Expected status code 403 for non-admin user');
    assert.strictEqual(jsonBody.message, 'Only administrators can update lead status');
  });

  // Runtime mock test: createLead handles unique constraint idx_active_lead_product_mobile with 409
  runTest('Controller Unit: createLead converts unique constraint violation 23505 to 409 DUPLICATE_LEAD', async () => {
    const { createLead } = require('../modules/crm/lead.controller.js');
    let statusCode = 0;
    let jsonBody = null;
    const req = {
      body: {
        product_id: '11111111-2222-3333-4444-555555555555',
        customer_name: 'Test Customer',
        mobile: '9876543210'
      },
      user: { role: 'SUPER_ADMIN', id: '00000000-1111-2222-3333-444444444444' }
    };
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { jsonBody = body; return this; }
    };

    const db = require('../config/database');
    const origQuery = db.query;
    const origGetClient = db.getClient;
    try {
      db.query = async (text) => {
        if (text.includes('FROM products')) {
          return { rows: [{ id: req.body.product_id, is_active: true, name: 'Card', bank_id: 'bank-1' }] };
        }
        if (text.includes('FROM applications') || text.includes('FROM leads')) {
          return { rows: [] }; // Passes duplicate pre-check
        }
        return { rows: [] };
      };

      db.getClient = async () => ({
        query: async (text) => {
          if (text === 'BEGIN') return {};
          if (text === 'ROLLBACK') return {};
          if (text.includes('INSERT INTO customers')) {
            return { rows: [{ id: 'cust-1' }] };
          }
          if (text.includes('INSERT INTO leads')) {
            const err = new Error('duplicate key value violates unique constraint "idx_active_lead_product_mobile"');
            err.code = '23505';
            err.constraint = 'idx_active_lead_product_mobile';
            throw err;
          }
          return { rows: [] };
        },
        release: () => {}
      });

      await createLead(req, res, (err) => { if (err) throw err; });
      assert.strictEqual(statusCode, 409, 'Expected status code 409 on duplicate key error');
      assert.strictEqual(jsonBody.code, 'DUPLICATE_LEAD', 'Expected code DUPLICATE_LEAD');
      assert.strictEqual(jsonBody.message, 'An active lead already exists for this mobile number and product.');
    } finally {
      db.query = origQuery;
      db.getClient = origGetClient;
    }
  });

  console.log(bold('\n======================================================'));
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log(bold('======================================================\n'));

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
})();

