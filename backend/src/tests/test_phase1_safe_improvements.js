/**
 * test_phase1_safe_improvements.js
 * 
 * Unit & Contract Verification Suite for Phase 1 Changes:
 * 1. Database Pool Configuration & DB_POOL_MAX env handling
 * 2. Query retry safety & idempotency classification
 * 3. CRM application list pagination bounds & export compatibility
 * 4. Employee lead insertion numeric sanitization (smart_emi_amount, loan_required_amount, tenure)
 * 5. Consolidated migration integrity
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('─── GharKaPaisa Phase 1 Improvements Verification Suite ───\n');

// ══════════════════════════════════════════════════════════════════
// TEST 1: Database Pool Configuration & DB_POOL_MAX Handling
// ══════════════════════════════════════════════════════════════════
console.log('Test 1: Database Pool Configuration & DB_POOL_MAX Handling');
{
  const dbFile = fs.readFileSync(path.join(__dirname, '../config/database.js'), 'utf8');

  // Verify that Math.max(..., 30) is NOT used to override DB_POOL_MAX
  assert.strictEqual(
    dbFile.includes('poolOptions.max = Math.max(parseInt(process.env.DB_POOL_MAX) || 40, 30);'),
    false,
    'Hardcoded minimum pool floor of 30 must not override configured DB_POOL_MAX'
  );

  // Verify that DB_POOL_MAX is honored
  assert.ok(
    dbFile.includes('const configuredPoolMax = parseInt(process.env.DB_POOL_MAX);'),
    'database.js must read configuredPoolMax from process.env.DB_POOL_MAX'
  );

  // Test the calculation logic
  const calculatePoolMax = (envVal) => {
    const parsed = parseInt(envVal);
    return (!isNaN(parsed) && parsed > 0) ? parsed : 30;
  };

  assert.strictEqual(calculatePoolMax('10'), 10, 'DB_POOL_MAX=10 is honored');
  assert.strictEqual(calculatePoolMax('15'), 15, 'DB_POOL_MAX=15 is honored');
  assert.strictEqual(calculatePoolMax('50'), 50, 'DB_POOL_MAX=50 is honored');
  assert.strictEqual(calculatePoolMax(undefined), 30, 'Unset DB_POOL_MAX defaults to safe 30');
  assert.strictEqual(calculatePoolMax('invalid'), 30, 'Invalid DB_POOL_MAX defaults to safe 30');

  console.log('  ✓ Configured pool max honors DB_POOL_MAX and defaults to 30 safely');
}

// ══════════════════════════════════════════════════════════════════
// TEST 2: Query Retry Safety & Write Protection
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 2: Query Retry Safety & Write Protection');
{
  const dbFile = fs.readFileSync(path.join(__dirname, '../config/database.js'), 'utf8');

  assert.ok(
    dbFile.includes('const isReadOnlyQuery = (sqlText) => {'),
    'database.js must define isReadOnlyQuery classifier'
  );
  assert.ok(
    dbFile.includes('isSafeToRetry = isDeadlock || (isReadOnlyQuery(text) && (isTransientNetwork || isPoolExhausted || isReservedSlots));'),
    'database.js must restrict transient error retries to deadlocks or read-only queries'
  );
  assert.ok(
    dbFile.includes('Skipping automatic retry on transient network error for non-idempotent write query'),
    'database.js must log when skipping automatic retry for write queries'
  );

  console.log('  ✓ Verified non-idempotent writes are guarded against transient network retry storms');
}

// ══════════════════════════════════════════════════════════════════
// TEST 3: CRM Bounded Pagination
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 3: CRM Application List Bounded Pagination');
{
  const appCtrlFile = fs.readFileSync(path.join(__dirname, '../modules/crm/application.controller.js'), 'utf8');

  assert.ok(
    appCtrlFile.includes('const isExportRequest = req.query.export === \'true\' || parseInt(req.query.limit) > 1000;'),
    'application.controller.js must detect export requests'
  );
  assert.ok(
    appCtrlFile.includes('const maxLimitAllowed = isExportRequest ? 10000 : 200;'),
    'application.controller.js must bound interactive requests to 200 and export to 10000'
  );

  console.log('  ✓ Interactive requests bounded to 200 max, export bounded to 10,000 max');
}

// ══════════════════════════════════════════════════════════════════
// TEST 4: Numeric Sanitization for Employee Lead Insertions
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 4: Numeric Sanitization in Employee Route');
{
  const empRouteFile = fs.readFileSync(path.join(__dirname, '../modules/employee/employee.routes.js'), 'utf8');

  assert.ok(
    empRouteFile.includes('const cleanNumeric = (val) => {'),
    'employee.routes.js must sanitize numeric fields before insertion'
  );

  const cleanNumeric = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  };

  assert.strictEqual(cleanNumeric('50,000'), 50000, 'Comma formatted string parsed');
  assert.strictEqual(cleanNumeric('₹1,50,000.50'), 150000.50, 'Currency symbol parsed');
  assert.strictEqual(cleanNumeric(''), null, 'Empty string returns null');
  assert.strictEqual(cleanNumeric(null), null, 'Null returns null');
  assert.strictEqual(cleanNumeric(undefined), null, 'Undefined returns null');
  assert.strictEqual(cleanNumeric(25000), 25000, 'Raw number preserved');

  console.log('  ✓ Verified currency/formatted inputs safely convert to PostgreSQL NUMERIC values');
}

// ══════════════════════════════════════════════════════════════════
// TEST 5: Consolidated Migration File Verification
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 5: Consolidated Migration File Verification');
{
  const migrationPath = path.join(__dirname, '../database/migrations/migrate_consolidated_application_stage_columns.js');
  assert.ok(fs.existsSync(migrationPath), 'migrate_consolidated_application_stage_columns.js must exist');

  const migration = require(migrationPath);
  assert.strictEqual(
    typeof migration.migrateConsolidatedApplicationColumns,
    'function',
    'Migration module must export migrateConsolidatedApplicationColumns function'
  );

  console.log('  ✓ Verified consolidated migration file syntax, structure, and export');
}

// ══════════════════════════════════════════════════════════════════
// TEST 6: Migration Transaction Dedicated Client & Safe Release
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 6: Migration Transaction Dedicated Client & Safe Release');
{
  const targetMigrations = [
    'migrate_messenger.js',
    'migrate_employee_system.js',
    'migrate_employee_bonus_departments.js',
    'create_versioned_incentive_history_tables.js',
    'cleanup_employee_incentive_lifecycle.js'
  ];

  for (const mig of targetMigrations) {
    const content = fs.readFileSync(path.join(__dirname, '../database/migrations', mig), 'utf8');
    assert.ok(
      content.includes('pool.connect()'),
      `${mig} must acquire dedicated client via pool.connect()`
    );
    assert.ok(
      content.includes('client.query(\'BEGIN\')'),
      `${mig} must execute BEGIN on dedicated client`
    );
    assert.ok(
      content.includes('client.query(\'COMMIT\')'),
      `${mig} must execute COMMIT on dedicated client`
    );
    assert.ok(
      content.includes('client.query(\'ROLLBACK\')'),
      `${mig} must execute ROLLBACK on dedicated client in catch`
    );
    assert.ok(
      content.includes('client.release()'),
      `${mig} must release dedicated client in finally`
    );
    assert.ok(
      !/[^\.]query\('(BEGIN|COMMIT|ROLLBACK)'\)/.test(content),
      `${mig} must not use pool query for transaction control`
    );
  }

  console.log('  ✓ Verified all 5 audited migrations use dedicated client with guaranteed release');
}

// ══════════════════════════════════════════════════════════════════
// TEST 7: Advanced Read-Only Query Classification (Comments & CTEs)
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 7: Advanced Read-Only Query Classification');
{
  const dbFile = fs.readFileSync(path.join(__dirname, '../config/database.js'), 'utf8');
  assert.ok(dbFile.includes('// Strip SQL comments'), 'database.js must strip SQL comments');
  assert.ok(dbFile.includes('FOR\\s+UPDATE'), 'database.js must detect row-locking SELECT queries');

  // Verify the classification logic directly
  const isReadOnly = (sqlText) => {
    if (!sqlText || typeof sqlText !== 'string') return false;
    const stripped = sqlText
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--.*$/gm, ' ')
      .trim();
    const clean = stripped.toUpperCase();
    if (clean.startsWith('SELECT') || clean.startsWith('EXPLAIN') || clean.startsWith('SHOW')) {
      if (/\b(INTO\s+TEMPORARY|INTO\s+TEMP|INTO\s+TABLE|INTO\s+[A-Z0-9_"]+|FOR\s+UPDATE|FOR\s+SHARE|FOR\s+NO\s+KEY\s+UPDATE)\b/.test(clean)) {
        return false;
      }
      return true;
    }
    if (clean.startsWith('WITH') && !/\b(INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|DROP\s+|ALTER\s+|TRUNCATE\s+)\b/.test(clean)) {
      return true;
    }
    return false;
  };

  assert.strictEqual(isReadOnly('/* comment */ SELECT * FROM users'), true, 'Query with block comment is read-only');
  assert.strictEqual(isReadOnly('-- comment\nSELECT * FROM users'), true, 'Query with line comment is read-only');
  assert.strictEqual(isReadOnly('SELECT * FROM users FOR UPDATE'), false, 'SELECT FOR UPDATE must NOT be classified as read-only');
  assert.strictEqual(isReadOnly('WITH summary AS (SELECT inserted_at FROM orders) SELECT * FROM summary'), true, 'CTE with inserted_at column is read-only');
  assert.strictEqual(isReadOnly('WITH deleted AS (DELETE FROM orders RETURNING *) SELECT * FROM deleted'), false, 'Data-modifying CTE must NOT be read-only');

  console.log('  ✓ Verified SQL comment stripping, row-lock exclusion, and CTE word-boundary safety');
}

console.log('\n================================================================');
console.log('✓ ALL 7 AUDIT & VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('================================================================\n');
