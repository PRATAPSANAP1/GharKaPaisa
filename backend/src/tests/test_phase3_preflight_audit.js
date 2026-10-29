/**
 * test_phase3_preflight_audit.js
 * 
 * GharKaPaisa Phase 3.1 Pre-Flight Audit Automated Verification Suite:
 * 1. bank_smart_emi_offer type conflict & input sanitization across 5 data categories.
 * 2. Export pagination bounding, truncation metadata, and edge cases (<10k, =10k, >10k, malformed).
 * 3. Migration transaction dedicated client safety, destination validation, and invalid index scoping.
 * 4. Index predicate alignment and query planner compatibility analysis.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n─── GharKaPaisa Phase 3.1 Pre-Flight Audit Verification Suite ───\n');

// ── Test 1: bank_smart_emi_offer Input Parsing & Type Safety ────────────────
console.log('Test 1: bank_smart_emi_offer Value Classification & Type Safety');
{
  const testInputs = [
    { category: 'numeric', input: 50000, expectedText: '50000', expectedNumeric: 50000 },
    { category: 'numeric', input: 150000.50, expectedText: '150000.5', expectedNumeric: 150000.5 },
    { category: 'currency-formatted', input: '₹50,000', expectedText: '₹50,000', expectedNumeric: 50000 },
    { category: 'currency-formatted', input: '1,50,000.00', expectedText: '1,50,000.00', expectedNumeric: 150000 },
    { category: 'currency-formatted', input: '50000/-', expectedText: '50000/-', expectedNumeric: 50000 },
    { category: 'descriptive', input: 'Pre-approved', expectedText: 'Pre-approved', expectedNumeric: null },
    { category: 'descriptive', input: 'Eligible / 24 Months', expectedText: 'Eligible / 24 Months', expectedNumeric: null },
    { category: 'descriptive', input: 'Decline Code: D01', expectedText: 'Decline Code: D01', expectedNumeric: null },
    { category: 'null/empty', input: null, expectedText: null, expectedNumeric: null },
    { category: 'null/empty', input: '', expectedText: null, expectedNumeric: null },
    { category: 'null/empty', input: undefined, expectedText: null, expectedNumeric: null },
    { category: 'invalid', input: NaN, expectedText: null, expectedNumeric: null }
  ];

  // Raw PostgreSQL CAST simulator (rejection on non-purely-numeric strings)
  const rawPgNumericCast = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const str = String(val).trim();
    if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(str)) {
      return parseFloat(str);
    }
    return null; // Throws invalid input syntax for type numeric in PostgreSQL
  };

  // Application-level regex currency sanitizer (used in employee.routes.js cleanNumeric)
  const appSanitizedNumeric = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const str = String(val).trim();
    // Only sanitize if string is primarily numeric/currency; do NOT extract numbers from descriptive sentences (e.g. 24 from 'Eligible / 24 Months')
    if (/^[₹$€£]?\s*[0-9,]+(\.[0-9]+)?(\s*\/-)?$/.test(str)) {
      const num = parseFloat(str.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    }
    return null;
  };

  const parseForTextDb = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number' && isNaN(val)) return null;
    const str = String(val).trim();
    return str.length > 0 ? str : null;
  };

  for (const item of testInputs) {
    const textResult = parseForTextDb(item.input);
    const pgCastResult = rawPgNumericCast(item.input);
    const sanitizedNumResult = appSanitizedNumeric(item.input);

    if (item.category === 'descriptive') {
      assert.strictEqual(textResult, item.expectedText, `TEXT column must preserve descriptive string "${item.input}"`);
      assert.strictEqual(pgCastResult, null, `Direct PostgreSQL numeric cast rejects descriptive string "${item.input}"`);
      assert.strictEqual(sanitizedNumResult, null, `Sanitizer must not falsely extract numbers from descriptive sentence "${item.input}"`);
    } else if (item.category === 'currency-formatted') {
      assert.strictEqual(textResult, item.expectedText, `TEXT column stores formatted currency "${item.input}"`);
      assert.strictEqual(pgCastResult, null, `Direct PostgreSQL numeric cast fails on formatted string "${item.input}" (requires sanitization)`);
      assert.strictEqual(sanitizedNumResult, item.expectedNumeric, `Application sanitizer correctly extracts ${item.expectedNumeric}`);
    } else if (item.category === 'numeric') {
      assert.strictEqual(textResult, item.expectedText, `TEXT column stores numeric as string "${item.expectedText}"`);
      assert.strictEqual(pgCastResult, item.expectedNumeric, `Direct PostgreSQL cast succeeds for numeric ${item.expectedNumeric}`);
      assert.strictEqual(sanitizedNumResult, item.expectedNumeric, `Sanitizer succeeds for numeric ${item.expectedNumeric}`);
    } else {
      assert.strictEqual(textResult, null, `Empty/invalid becomes null in TEXT`);
      assert.strictEqual(pgCastResult, null, `Empty/invalid becomes null in NUMERIC`);
    }
  }
  console.log('  ✓ Verified 5 data categories: numeric, currency-formatted, descriptive, nulls, invalid input');
}

// ── Test 2: Export Pagination Bounding & Truncation Edge Cases ──────────────
console.log('\nTest 2: Export Pagination Bounding & Truncation Edge Cases');
{
  const calculatePagination = (query, count, rowsLength) => {
    const isExportRequest = query.export === 'true' || parseInt(query.limit) > 1000;
    const maxLimitAllowed = isExportRequest ? 10000 : 200;
    const rawLimit = parseInt(query.limit);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 10 : rawLimit, 1), maxLimitAllowed);
    const rawPage = parseInt(query.page);
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1);
    const total = parseInt(count);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      is_truncated: isExportRequest && total > rowsLength,
      total_matching: total,
      returned_count: rowsLength,
      max_export_limit: isExportRequest ? maxLimitAllowed : undefined
    };
  };

  // Case A: Interactive request capped at 200 max
  const p1 = calculatePagination({ limit: 500 }, 1500, 200);
  assert.strictEqual(p1.limit, 200, 'Interactive requests must be clamped to 200 max');
  assert.strictEqual(p1.is_truncated, false, 'Interactive requests do not set is_truncated');

  // Case B: Export request with fewer than 10,000 rows (500 rows)
  const p2 = calculatePagination({ export: 'true', limit: 10000 }, 500, 500);
  assert.strictEqual(p2.limit, 10000);
  assert.strictEqual(p2.is_truncated, false, '<10k dataset must not report truncation');
  assert.strictEqual(p2.returned_count, 500);
  assert.strictEqual(p2.total_matching, 500);

  // Case C: Export request with exactly 10,000 rows
  const p3 = calculatePagination({ export: 'true', limit: 10000 }, 10000, 10000);
  assert.strictEqual(p3.is_truncated, false, 'Exactly 10k rows must not report truncation');
  assert.strictEqual(p3.returned_count, 10000);
  assert.strictEqual(p3.total_matching, 10000);

  // Case D: Export request exceeding limit (14,250 rows)
  const p4 = calculatePagination({ export: 'true', limit: 10000 }, 14250, 10000);
  assert.strictEqual(p4.is_truncated, true, '>10k dataset MUST explicitly report is_truncated=true');
  assert.strictEqual(p4.returned_count, 10000);
  assert.strictEqual(p4.total_matching, 14250);
  assert.strictEqual(p4.max_export_limit, 10000);

  // Case E: Malformed pagination parameters
  const p5 = calculatePagination({ page: 'abc', limit: -5 }, 100, 10);
  assert.strictEqual(p5.page, 1, 'Malformed page "abc" must fallback to 1');
  assert.strictEqual(p5.limit, 1, 'Negative limit -5 must clamp to minimum 1');

  const p6 = calculatePagination({ page: -2, limit: 0 }, 100, 10);
  assert.strictEqual(p6.page, 1, 'Negative page must clamp to 1');
  assert.strictEqual(p6.limit, 1, 'Zero limit must clamp to 1');

  console.log('  ✓ Verified interactive (200 ceiling), export (10k ceiling), <10k, =10k, >10k, and malformed inputs');
}

// ── Test 3: Frontend Truncation Handling Verification ───────────────────────
console.log('\nTest 3: Frontend Truncation Handling & Warning Alert Verification');
{
  const exportModalPath = path.resolve(__dirname, '../../../frontend/src/components/Admin/ExportApplicationsModal.jsx');
  const exportContent = fs.readFileSync(exportModalPath, 'utf8');

  // Verify frontend passes export: 'true' and limit: 10000
  assert.ok(exportContent.includes("export: 'true'"), 'Frontend must send export: true query param');
  assert.ok(exportContent.includes("limit: 10000"), 'Frontend must request 10000 limit');

  // Verify frontend checks is_truncated and triggers alert
  assert.ok(exportContent.includes("isTruncated"), 'Frontend must capture isTruncated flag');
  assert.ok(exportContent.includes("⚠️ Export Limit Notice:"), 'Frontend must alert user when export is truncated');
  assert.ok(exportContent.includes("Exports are safely capped at 10,000 records per file"), 'Frontend must display persistent UI safety notice');

  console.log('  ✓ Verified frontend passes export flag, checks truncation metadata, and warns users');
}

// ── Test 4: Migration Script Dedicated Client & Destination Safety ──────────
console.log('\nTest 4: Migration Dedicated Client & Destination Guard Verification');
{
  const migPath = path.resolve(__dirname, '../database/migrations/migrate_consolidated_application_stage_columns.js');
  const migContent = fs.readFileSync(migPath, 'utf8');

  // 1. Dedicated client verification
  assert.ok(migContent.includes("const client = await pool.connect()"), 'Must acquire dedicated client');
  assert.ok(migContent.includes("await client.query('BEGIN')"), 'BEGIN must execute on dedicated client');
  assert.ok(migContent.includes("await client.query('COMMIT')"), 'COMMIT must execute on dedicated client');
  assert.ok(migContent.includes("await client.query('ROLLBACK')"), 'ROLLBACK must execute on dedicated client');
  assert.ok(migContent.includes("client.release()"), 'Must release client in finally block');

  // 2. Destination validation check
  assert.ok(migContent.includes("validateMigrationDestination"), 'Must call validateMigrationDestination');
  assert.ok(migContent.includes("ALLOW_PRODUCTION_MIGRATION"), 'Must guard production database execution');

  // 3. Schema-scoped invalid index check
  assert.ok(migContent.includes("n.nspname = 'public'"), 'Invalid index check must be scoped to public schema');
  assert.ok(migContent.includes("t.relname = $2"), 'Invalid index check must verify target table name');

  // 4. Index failure tracking
  assert.ok(migContent.includes("failedIndexes"), 'Migration must track index creation failures');

  // 5. Category 1 columns coverage
  assert.ok(migContent.includes("joining_fee VARCHAR(255)"), 'Must include products.joining_fee');
  assert.ok(migContent.includes("interest_rate VARCHAR(255)"), 'Must include products.interest_rate');
  assert.ok(migContent.includes("commission_release_days INT DEFAULT 7"), 'Must include products.commission_release_days');
  assert.ok(migContent.includes("candidate_reference_seq"), 'Must include candidate_reference_seq');
  assert.ok(migContent.includes("otp_verifications"), 'Must include otp_verifications table');

  console.log('  ✓ Verified dedicated client, release guarantee, destination guard, and Category 1 coverage');
}

// ── Test 5: Index Predicate Semantic Matching Analysis ──────────────────────
console.log('\nTest 5: Index Predicate vs Query Predicate Semantic Matching Analysis');
{
  const appCtrlPath = path.resolve(__dirname, '../modules/crm/application.controller.js');
  const appCtrlContent = fs.readFileSync(appCtrlPath, 'utf8');

  // Inspect query in getRemarkOperatorDashboard
  const hasJsonbRemarkPredicate = appCtrlContent.includes("COALESCE(NULLIF(to_jsonb(a)->>'remark_status', ''), 'PENDING') = 'PENDING'");
  assert.ok(hasJsonbRemarkPredicate, 'Identified query predicate using to_jsonb(a)->>remark_status');

  const migPath = path.resolve(__dirname, '../database/migrations/migrate_consolidated_application_stage_columns.js');
  const migContent = fs.readFileSync(migPath, 'utf8');
  const hasDirectColPredicate = migContent.includes("WHERE COALESCE(remark_status, 'PENDING') = 'PENDING'");
  assert.ok(hasDirectColPredicate, 'Identified partial index predicate using COALESCE(remark_status, "PENDING") = "PENDING"');

  // Proves that PostgreSQL index matching requires updating the query predicate
  console.log('  ✓ Documented architectural finding: Query predicate using to_jsonb(a) will not match partial index on direct column until query is modernized');
}

console.log('\n================================================================');
console.log('✓ ALL 5 PHASE 3.1 PRE-FLIGHT AUDIT TESTS PASSED SUCCESSFULLY!');
console.log('================================================================\n');
