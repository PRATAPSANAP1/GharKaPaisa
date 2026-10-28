/**
 * Phase 2 & Phase 3 Verification Test Suite
 * Tests:
 *  - Fix 1: PostgreSQL transaction client reuse & release guarantees in migrations
 *  - Fix 2: Removal of runtime DDL from request/job handlers & migration coverage
 *  - Fix 3: CRM query optimization (direct column references vs legacy to_jsonb compatibility)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('─── GharKaPaisa Phase 2 & 3 Verification Suite ───\n');

const poolPath = require.resolve('../config/database');
const loggerPath = require.resolve('../config/logger');

// Silence logger during tests
require.cache[loggerPath] = {
    id: loggerPath,
    filename: loggerPath,
    loaded: true,
    exports: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {}
    }
};

async function testMigrationClientReuse(moduleRelPath, exportKey, options = {}) {
    const { expectPreBeginPoolQueries = 0, failOnQueryIndex = null } = options;

    const poolQueries = [];
    const clientQueries = [];
    let connectCount = 0;
    let releaseCount = 0;
    let queryCounter = 0;

    const mockClient = {
        query: async (sql, params) => {
            queryCounter++;
            const normalized = String(sql).trim();
            clientQueries.push({ sql: normalized, params });
            if (failOnQueryIndex !== null && queryCounter === failOnQueryIndex) {
                throw new Error('Simulated SQL failure inside transaction');
            }
            return { rows: [{ count: '0' }], rowCount: 0 };
        },
        release: () => {
            releaseCount++;
        }
    };

    const mockPool = {
        connect: async () => {
            connectCount++;
            return mockClient;
        },
        query: async (sql, params) => {
            poolQueries.push({ sql: String(sql).trim(), params });
            return { rows: [], rowCount: 0 };
        }
    };
    mockPool.pool = mockPool;

    require.cache[poolPath] = {
        id: poolPath,
        filename: poolPath,
        loaded: true,
        exports: mockPool
    };

    const targetPath = require.resolve(moduleRelPath);
    delete require.cache[targetPath];
    const mod = require(targetPath);
    const fn = exportKey ? mod[exportKey] : mod;

    let caughtError = null;
    try {
        await fn();
    } catch (err) {
        caughtError = err;
    }

    return {
        connectCount,
        releaseCount,
        poolQueries,
        clientQueries,
        caughtError,
        expectPreBeginPoolQueries
    };
}

async function runTests() {
    // =========================================================================
    // TEST SUITE 1: Fix 1 — Dedicated Client Transaction Handling & Release
    // =========================================================================
    console.log('Test 1: Fix 1 — PostgreSQL Transaction Client Reuse & Release');

    const migrationTargets = [
        { name: 'migrate_messenger.js', path: '../database/migrations/migrate_messenger', key: null, prePool: 0 },
        { name: 'migrate_employee_system.js', path: '../database/migrations/migrate_employee_system', key: null, prePool: 4 },
        { name: 'migrate_employee_bonus_departments.js', path: '../database/migrations/migrate_employee_bonus_departments', key: null, prePool: 0 },
        { name: 'create_versioned_incentive_history_tables.js', path: '../database/migrations/create_versioned_incentive_history_tables', key: null, prePool: 0 },
        { name: 'cleanup_employee_incentive_lifecycle.js', path: '../database/migrations/cleanup_employee_incentive_lifecycle', key: null, prePool: 0 }
    ];

    for (const target of migrationTargets) {
        // 1a. Success path: BEGIN -> statements -> COMMIT on same client, release() called once
        const successRun = await testMigrationClientReuse(target.path, target.key, {
            expectPreBeginPoolQueries: target.prePool
        });

        assert.strictEqual(successRun.caughtError, null, `${target.name} should succeed on happy path`);
        assert.strictEqual(successRun.connectCount, 1, `${target.name} must acquire exactly 1 client via pool.connect()`);
        assert.strictEqual(successRun.releaseCount, 1, `${target.name} must call client.release() once in finally`);
        assert.strictEqual(
            successRun.poolQueries.length,
            target.prePool,
            `${target.name} must not call pool.query() for transactional statements`
        );

        // Verify no BEGIN/COMMIT/ROLLBACK leaked to pool.query
        for (const pq of successRun.poolQueries) {
            assert.strictEqual(
                /^(BEGIN|COMMIT|ROLLBACK)$/i.test(pq.sql),
                false,
                `${target.name} must never execute BEGIN/COMMIT/ROLLBACK on pool.query()`
            );
        }

        // Verify client queries start with BEGIN and end with COMMIT
        assert.ok(successRun.clientQueries.length >= 3, `${target.name} must run BEGIN, statements, and COMMIT on client`);
        assert.strictEqual(successRun.clientQueries[0].sql.toUpperCase(), 'BEGIN', `${target.name} first client query must be BEGIN`);
        assert.strictEqual(
            successRun.clientQueries[successRun.clientQueries.length - 1].sql.toUpperCase(),
            'COMMIT',
            `${target.name} last client query on success must be COMMIT`
        );

        // 1b. Failure path: BEGIN -> statement throws -> ROLLBACK on same client, release() still called once
        const failRun = await testMigrationClientReuse(target.path, target.key, {
            expectPreBeginPoolQueries: target.prePool,
            failOnQueryIndex: 2 // Fail on first query after BEGIN
        });

        assert.ok(failRun.caughtError, `${target.name} must rethrow error after ROLLBACK`);
        assert.strictEqual(failRun.connectCount, 1, `${target.name} must acquire 1 client on failure path`);
        assert.strictEqual(failRun.releaseCount, 1, `${target.name} must still call client.release() in finally on error`);
        assert.strictEqual(failRun.clientQueries[0].sql.toUpperCase(), 'BEGIN', `${target.name} first client query must be BEGIN`);
        assert.strictEqual(
            failRun.clientQueries[failRun.clientQueries.length - 1].sql.toUpperCase(),
            'ROLLBACK',
            `${target.name} last client query on failure must be ROLLBACK on same client`
        );

        console.log(`  ✓ ${target.name}: verified single client for BEGIN/queries/COMMIT/ROLLBACK + guaranteed client.release()`);
    }

    // =========================================================================
    // TEST SUITE 2: Fix 2 — No Runtime Schema DDL in Request/Job Paths
    // =========================================================================
    console.log('\nTest 2: Fix 2 — Runtime Schema DDL Removed & Migration Coverage Verified');

    const runtimeFiles = [
        '../modules/public/public.routes.js',
        '../modules/crm/application.controller.js',
        '../modules/products/controller.js',
        '../jobs/commissionHoldRelease.job.js'
    ];

    const ddlRegex = /\b(CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+SEQUENCE|DROP\s+TABLE)\b/i;

    for (const relFile of runtimeFiles) {
        const absPath = path.join(__dirname, relFile);
        const content = fs.readFileSync(absPath, 'utf8');
        assert.strictEqual(
            ddlRegex.test(content),
            false,
            `${relFile} must not contain runtime DDL (CREATE TABLE / ALTER TABLE / CREATE SEQUENCE)`
        );
        console.log(`  ✓ ${relFile}: 0 runtime DDL statements`);
    }

    // Verify migration files contain the moved schema definitions
    const migrateSrc = fs.readFileSync(path.join(__dirname, '../database/migrations/migrate.js'), 'utf8');
    const migrateEmpSrc = fs.readFileSync(path.join(__dirname, '../database/migrations/migrate_employee_system.js'), 'utf8');
    const migrateCrmPerfSrc = fs.readFileSync(path.join(__dirname, '../database/migrations/migrate_crm_application_performance.js'), 'utf8');

    assert.ok(migrateSrc.includes('CREATE TABLE IF NOT EXISTS bank_requirements'), 'migrate.js must create bank_requirements');
    assert.ok(migrateSrc.includes('migrateApplicationEmployeeAssignment'), 'migrate.js must invoke migrateApplicationEmployeeAssignment');
    assert.ok(migrateSrc.includes('ADD COLUMN IF NOT EXISTS joining_fee'), 'migrate.js must add products.joining_fee');
    assert.ok(migrateSrc.includes('ADD COLUMN IF NOT EXISTS processing_fee'), 'migrate.js must add products.processing_fee');
    assert.ok(migrateSrc.includes('ADD COLUMN IF NOT EXISTS interest_rate'), 'migrate.js must add products.interest_rate');
    assert.ok(migrateSrc.includes('ADD COLUMN IF NOT EXISTS operation_head_id'), 'migrate.js must add products.operation_head_id');
    assert.ok(migrateEmpSrc.includes('CREATE TABLE IF NOT EXISTS otp_verifications'), 'migrate_employee_system.js must create otp_verifications');
    assert.ok(migrateEmpSrc.includes('identity VARCHAR(100) NOT NULL'), 'migrate_employee_system.js must define otp_verifications.identity');
    assert.ok(migrateEmpSrc.includes('otp_hash VARCHAR(255) NOT NULL'), 'migrate_employee_system.js must define otp_verifications.otp_hash');
    assert.ok(migrateCrmPerfSrc.includes('cureble_stage'), 'migrate_crm_application_performance.js must include cureble_stage');
    assert.ok(migrateCrmPerfSrc.includes('salas_operator_code'), 'migrate_crm_application_performance.js must include salas_operator_code');
    assert.ok(migrateCrmPerfSrc.includes('remark_opretor_code'), 'migrate_crm_application_performance.js must include remark_opretor_code');
    console.log('  ✓ All required tables and columns verified in migration files');

    // =========================================================================
    // TEST SUITE 3: Fix 3 — CRM Query Optimization Verification
    // =========================================================================
    console.log('\nTest 3: Fix 3 — CRM listApplications to_jsonb() Reduction & Direct Column Parity');

    const appCtrlSrc = fs.readFileSync(path.join(__dirname, '../modules/crm/application.controller.js'), 'utf8');
    const listStart = appCtrlSrc.indexOf('const listQuerySQL =');
    const countStart = appCtrlSrc.indexOf('const countQuerySQL =');
    assert.ok(listStart !== -1 && countStart !== -1, 'Could not locate listQuerySQL');
    const listQuerySQL = appCtrlSrc.slice(listStart, countStart);

    const toJsonbMatches = listQuerySQL.match(/to_jsonb\((a|pad)\)/g) || [];
    assert.ok(
        toJsonbMatches.length <= 12,
        `Expected listQuerySQL to_jsonb(a|pad) calls to be reduced from 89 to <=12, got ${toJsonbMatches.length}`
    );

    // Verify direct column references are used for verified columns
    assert.ok(listQuerySQL.includes('a.bank_application_number'), 'listQuerySQL should reference a.bank_application_number directly');
    assert.ok(listQuerySQL.includes('pad.bank_application_number'), 'listQuerySQL should reference pad.bank_application_number directly');
    assert.ok(listQuerySQL.includes('a.ipa_stage'), 'listQuerySQL should reference a.ipa_stage directly');
    assert.ok(listQuerySQL.includes('pad.ipa_stage'), 'listQuerySQL should reference pad.ipa_stage directly');
    assert.ok(listQuerySQL.includes('a.sales_claimed_by'), 'listQuerySQL should reference a.sales_claimed_by directly');

    console.log(`  ✓ Reduced listQuerySQL to_jsonb(a/pad) evaluations from 89 down to ${toJsonbMatches.length} legacy compatibility fallbacks`);
    console.log('\n================================================================');
    console.log('✓ ALL PHASE 2 & PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
}

runTests().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
