# GharKaPaisa — Phase 3.1: Final Pre-Flight Audit Report Before Staging

**Document Version:** 1.0.0  
**Audit Date:** October 2026  
**Auditors:** Senior Backend Engineer, PostgreSQL DBA, DevOps Engineer, Production Reliability Auditor  
**Scope:** Phase 1, Phase 2, and Phase 3 changes across database configuration, migrations, CRM controller, frontend exports, and indexing architecture.  
**Safety Protocol:** STRICT PREPARATION ONLY — No remote connections, zero DDL executed on remote DBs, zero AWS commands executed.

---

## 1. Executive Summary and Readiness Decision

### Overall Decision: `NEEDS OPERATOR VERIFICATION (BLOCKED ON STAGING READ-ONLY SCHEMA INSPECTION)`

While all local code improvements, dedicated transaction clients, retry safety filters, bounded export pagination, and frontend truncation warnings are **100% verified and tested locally**, the deployment to Staging is **intentionally blocked** pending empirical verification by the database operator.

| Audit Domain | Status | Key Risk / Blocking Factor |
| :--- | :---: | :--- |
| **Migration Transaction Handling** | `PASS` | Dedicated client from `pool.connect()`, explicit `BEGIN`/`COMMIT`/`ROLLBACK`, guaranteed release in `finally`. |
| **Fail-Closed Destination Guard** | `PASS` | Production database connection blocked unless `ALLOW_PRODUCTION_MIGRATION=true` explicitly provided. |
| **`bank_smart_emi_offer` Schema Definition** | `BLOCKED` | Undetermined whether target staging DB has column as `DECIMAL(15,2)` or `TEXT`. Inserting text into `DECIMAL` causes fatal `42804/22P02`. |
| **PM2 Startup Migration Coordination** | `NEEDS OPERATOR VERIFICATION` | 21 startup migration/seed calls in `server.js` execute concurrently across PM2 workers, causing `40P01` deadlocks in production logs. |
| **Connection Pool Budget** | `NEEDS OPERATOR VERIFICATION` | Direct TCP socket connections (no RDS Proxy). Connection budget must be verified against target RDS `max_connections`. |
| **Export Limits & Truncation Transparency** | `PASS` | Backend enforces 10,000 ceiling; frontend captures `is_truncated`, alerts user, and displays safety notice. |
| **Index Predicate Query Alignment** | `NEEDS OPERATOR VERIFICATION` | Proposed index predicate `COALESCE(remark_status, 'PENDING') = 'PENDING'` does NOT match controller query `to_jsonb(a)->>'remark_status'`. |
| **Runtime DDL Inventory** | `PASS` | All Category 1 runtime DDL formalized into `migrate_consolidated_application_stage_columns.js`. |

---

## 2. Files Inspected and Modified

### Inspected Files:
- `backend/src/config/database.js`
- `backend/src/database/migrations/migrate_consolidated_application_stage_columns.js`
- `backend/src/database/migrations/migrate_smart_emi_locc_and_reports.js`
- `backend/src/database/migrations/migrate_crm_application_performance.js`
- `backend/src/database/migrations/migrate_messenger.js`
- `backend/src/database/migrations/migrate_employee_system.js`
- `backend/src/database/migrations/migrate_employee_bonus_departments.js`
- `backend/src/database/migrations/create_versioned_incentive_history_tables.js`
- `backend/src/database/migrations/cleanup_employee_incentive_lifecycle.js`
- `backend/src/modules/crm/application.controller.js`
- `backend/src/modules/products/controller.js`
- `backend/src/modules/public/public.routes.js`
- `backend/src/modules/wallet/service.js`
- `backend/src/jobs/commissionHoldRelease.job.js`
- `backend/src/server.js`
- `frontend/src/components/Admin/ExportApplicationsModal.jsx`
- `frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx`
- `frontend/src/modules/partner/leads/PartnerApplications.jsx`
- `production_pm2_decoded.log`

### Modified Files (Narrowly Scoped & Reversible):
1. [`backend/src/database/migrations/migrate_consolidated_application_stage_columns.js`](file:///d:/Internship/yohesa/backend/src/database/migrations/migrate_consolidated_application_stage_columns.js):
   - Added fail-closed `validateMigrationDestination()` guard.
   - Added `information_schema` pre-check for `bank_smart_emi_offer` to warn of incompatible existing types.
   - Added missing Category 1 objects (`products.joining_fee`, `interest_rate`, `sub_category`, `commission_release_days`, `employee_candidates.referred_by_employee_id`, `candidate_reference_seq`, `otp_verifications`).
   - Scoped invalid index cleanup strictly to `public` schema and target table name.
   - Tracked concurrent index build failures in `failedIndexes` array and reported them accurately in the return payload.
2. [`backend/src/tests/test_phase3_preflight_audit.js`](file:///d:/Internship/yohesa/backend/src/tests/test_phase3_preflight_audit.js):
   - Comprehensive pre-flight audit test suite covering value classification, export truncation edge cases, migration client safety, and index predicate matching.

---

## 3. Actual Test Commands and Results

All test suites were executed locally in Node.js `v22.14.0` / npm `10.9.2`:

```bash
node backend/src/tests/test_phase1_safe_improvements.js
node backend/src/tests/test_sql_schema_and_parameter_mapping.js
node backend/src/tests/test_performance_and_to_jsonb_benchmark.js
node backend/src/tests/test_phase3_preflight_audit.js
```

### Test Output Summary:
- **Suite 1 (`test_phase1_safe_improvements.js`):** 7/7 PASSED (Exit Code: 0)
  - `DB_POOL_MAX` honors integer configuration; write retry protection verified; interactive vs export bounding verified; currency sanitization verified; dedicated client release verified.
- **Suite 2 (`test_sql_schema_and_parameter_mapping.js`):** 4/4 PASSED (Exit Code: 0)
  - Safe fallback for photo columns; eliminated direct `assigned_to` lookups; 16-parameter list mapping ($1-$16) & 14-parameter count mapping ($1-$14) with zero gaps; role-based isolation verified.
- **Suite 3 (`test_performance_and_to_jsonb_benchmark.js`):** 4/4 PASSED (Exit Code: 0)
  - Synthetic benchmark: direct column lookup is 60.8x–73.3x faster than in-memory row serialization; 100% parity across 6 null-coalescing test cases; retry idempotency classification verified.
- **Suite 4 (`test_phase3_preflight_audit.js`):** 5/5 PASSED (Exit Code: 0)
  - 5 value categories for `bank_smart_emi_offer` verified; export edge cases (<10k, =10k, >10k, malformed) verified; frontend alert verification passed; migration client & destination guard verified; index predicate semantic mismatch documented.

---

## 4. Migration Transaction-Safety Findings

| Requirement | Implementation in `migrate_consolidated_application_stage_columns.js` | Verification Result |
| :--- | :--- | :---: |
| **Dedicated Client** | `const client = await pool.connect();` | `PASS` |
| **Same Client Transaction Flow** | `client.query('BEGIN')` ... `client.query('COMMIT')` / `client.query('ROLLBACK')` | `PASS` |
| **Guaranteed Release** | `finally { client.release(); }` ensures client returned to pool even on fatal errors. | `PASS` |
| **Error Bubbling** | Errors logged and rethrown; CLI wrapper exits with `process.exit(1)`. | `PASS` |
| **Rerun Safety** | Uses `ADD COLUMN IF NOT EXISTS`, `CREATE SEQUENCE IF NOT EXISTS`, and `CREATE TABLE IF NOT EXISTS`. | `PASS` |
| **Out-of-Transaction Indexing** | Runs `CREATE INDEX CONCURRENTLY` on the pool after `client.release()`. | `PASS` |
| **Precise Invalid-Index Cleanup** | Queries `pg_index`, `pg_class`, and `pg_namespace` for `n.nspname = 'public'`, `t.relname = $2`, `c.relname = $1`, `i.indisvalid = false`. | `PASS` |
| **Accurate Failure Reporting** | Tracks index notices in `failedIndexes` array and returns `{ success: false, failedIndexes }`. | `PASS` |
| **Fail-Closed Destination Guard** | `validateMigrationDestination()` halts execution if destination appears to be production without `ALLOW_PRODUCTION_MIGRATION=true`. | `PASS` |

---

## 5. `bank_smart_emi_offer` Type Conflict Analysis

### Finding: `BLOCKED / NEEDS OPERATOR VERIFICATION`

1. **Repository Conflict:**
   - In [`migrate_smart_emi_locc_and_reports.js:14`](file:///d:/Internship/yohesa/backend/src/database/migrations/migrate_smart_emi_locc_and_reports.js#L14): defined as `DECIMAL(15,2)`.
   - In [`migrate_crm_application_performance.js:81`](file:///d:/Internship/yohesa/backend/src/database/migrations/migrate_crm_application_performance.js#L81): defined as `TEXT`.
   - In [`AdminDocumentVerificationModal.jsx:2501-2507`](file:///d:/Internship/yohesa/frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx#L2501): rendered as `type="text"` with `placeholder="Enter Bank Smart EMI Offer"`.
   - In [`application.controller.js:5080, 5155`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L5080): saved via `cleanStr(bank_smart_emi_offer)` without numeric casting.
2. **Usage Semantics:**
   - There are **ZERO** arithmetic operations or mathematical comparisons (`SUM`, `AVG`, `>`, `<`) on `bank_smart_emi_offer` anywhere in the codebase.
   - The monetary loan amount is stored in `smart_emi_amount DECIMAL(15,2)`.
   - `bank_smart_emi_offer` stores offer descriptions (e.g., `"Pre-approved 1.5 Lakh"`, `"₹50,000 / 24M"`, `"Eligible"`, or `"NA"`).
3. **Data Loss / Crash Hazard:**
   - If the staging database table has `bank_smart_emi_offer` defined as `DECIMAL(15,2)`, submitting any text string will cause PostgreSQL to abort the transaction with:
     `ERROR: invalid input syntax for type numeric: "Pre-approved"` (SQLState `22P02`).
   - Conversely, if converted from `TEXT` to `DECIMAL(15,2)` on a table that already contains descriptive text strings, PostgreSQL will fail the ALTER TABLE unless a lossy `USING` clause discards text data.
4. **Prerequisite Query for DBA:**
   ```sql
   SELECT data_type, character_maximum_length, numeric_precision 
   FROM information_schema.columns 
   WHERE table_name = 'applications' AND column_name = 'bank_smart_emi_offer';
   ```

---

## 6. PM2 Worker Startup Migration Coordination

### Finding: `NEEDS OPERATOR VERIFICATION / ARCHITECTURAL ACTION REQUIRED`

Inspection of [`backend/src/server.js:301-486`](file:///d:/Internship/yohesa/backend/src/server.js#L301) and [`production_pm2_decoded.log:109, 168`](file:///d:/Internship/yohesa/production_pm2_decoded.log#L109) confirms that 21 migration and seed routines execute on application boot:

1. `users.has_loc_eoc` raw ALTER TABLE
2. `admin_bank_assignments` DELETE duplicate rows + ADD CONSTRAINT (acquires `ACCESS EXCLUSIVE` table lock)
3. `banks` & `products` `operation_head_id`, `joining_fee`, `processing_fee` ALTER TABLE
4. `migrateLocEocCategory()`
5. `migrateMessenger()`
6. `migrateContests()`
7. `migrateWhatsApp()`
8. `migrateOperatorHistory()`
9. `migrateBiometricEnrollment()`
10. `migrateKycBiometricEnrollmentPhase6_9()`
11. `migrateAttendanceVerificationPhase3()`
12. `migrateEmployeeAttendancePhase4()`
13. `seedSmartEmiAndLoccProducts()`
14. `seedCibilPersonalLoanProducts()`
15. `migrateApplicationQueryIndexes()`
16. `migrateBulkSms()`
17. `migrateHdfcCuringDesignations()`
18. `migrateSalesOperatorClaim()`
19. `migrateApplicationEmployeeAssignment()`
20. `ensureAccountStatusSchema()`
21. `ensureWorkingHoursTables()`

### Contention Mechanics:
When PM2 cluster mode boots 4 workers simultaneously, each worker starts executing these 21 routines concurrently. The statement:
`ALTER TABLE admin_bank_assignments ADD CONSTRAINT ...`
competes with identical ALTER statements on other workers, producing:
`09:42:48 [ WARN ]: DB Connection status on error (Deadlock): Total=9, Idle=0, Waiting=1 {"error":"deadlock detected"}` (SQLState `40P01`).

### Advisory-Lock Architecture vs Single-Process Deployment:
- **Session-Level Advisory Lock:** `SELECT pg_try_advisory_lock(7429101)` acquires a lock scoped to the specific connection session. It **must** be unlocked on that exact same client via `SELECT pg_advisory_unlock(7429101)`. If the client disconnects or crashes, PostgreSQL releases it automatically.
- **Transaction-Level Advisory Lock:** `SELECT pg_try_advisory_xact_lock(7429101)` automatically releases at `COMMIT` or `ROLLBACK`, but cannot span multiple separate database transactions.
- **Recommended Architectural Solution:**
  Do not run migrations in PM2 worker boot. Instead, run migrations **once** during deployment via CI/CD or AWS SSM before PM2 reload:
  ```bash
  # Pre-deployment step (runs once on EC2 instance):
  NODE_ENV=staging node backend/src/database/migrations/migrate_consolidated_application_stage_columns.js
  
  # Then reload workers:
  pm2 reload gharkapaisa-backend --update-env
  ```

---

## 7. Connection-Pool Budget Worksheet

### Finding: `NEEDS OPERATOR VERIFICATION`

In [`backend/src/config/database.js`](file:///d:/Internship/yohesa/backend/src/config/database.js), connections connect directly to PostgreSQL via direct TCP socket (`DB_HOST`). **No AWS RDS Proxy is active.**

Every PM2 worker runs its own isolated `pg.Pool` instance. The database administrator must verify this budget against the staging RDS instance:

$$\text{Total Connections} = (N_{\text{instances}} \times W_{\text{pm2}} \times \text{DB\_POOL\_MAX}) + C_{\text{cron}} + C_{\text{admin}}$$

### Operator Worksheet:

| Parameter | Configuration Placeholder | Staging Value to Confirm |
| :--- | :---: | :--- |
| **PostgreSQL `max_connections`** | `SHOW max_connections;` | `[Operator to enter: e.g. 150]` |
| **Superuser Reserved Slots** | `SHOW superuser_reserved_connections;` | `[Default: 3]` |
| **Available Application Connections** | $\text{max\_connections} - \text{reserved}$ | `[Operator to calculate]` |
| **Number of EC2 Application Servers ($N_{\text{instances}}$)** | Architecture inventory | `[e.g. 1 on Staging]` |
| **PM2 Workers per Server ($W_{\text{pm2}}$)** | `pm2 list` | `[e.g. 2 or 4]` |
| **Configured `DB_POOL_MAX` per worker** | `process.env.DB_POOL_MAX` | `[Default: 30]` |
| **Total Max Worker Connections** | $N_{\text{instances}} \times W_{\text{pm2}} \times \text{DB\_POOL\_MAX}$ | `1 × 4 × 30 = 120` |
| **Background Cron / Migration Jobs ($C_{\text{cron}}$)** | Standalone runners | `[e.g. 2]` |
| **Direct DBA / psql Sessions ($C_{\text{admin}}$)** | Management headroom | `[e.g. 5]` |
| **Calculated Peak Demand** | Worker + Cron + Admin | `127` |
| **Safety Headroom Margin** | Available - Peak Demand | **Must be $\ge 15$ slots** |

> [!WARNING]
> If Staging RDS is configured with `db.t3.small` or `db.t4g.small` (default `max_connections = 112`), running 4 PM2 workers with `DB_POOL_MAX=30` will exceed available slots during traffic bursts, triggering `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
> **Recommendation:** On Staging, set `DB_POOL_MAX=15` if running 4 workers, or adjust instance parameter groups.

---

## 8. Export Truncation Verification

### Finding: `PASS`

1. **Interactive Requests:** In [`application.controller.js:1700`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L1700), interactive requests are bounded to a maximum of **200 rows**.
2. **Export Capping:** Export requests (`export === 'true'` or `limit > 1000`) are capped at **10,000 rows** to protect Node.js V8 heap and PostgreSQL buffer pools.
3. **Response Payload Disclosure:**
   ```json
   {
     "pagination": {
       "total": 14250,
       "page": 1,
       "limit": 10000,
       "totalPages": 2,
       "is_truncated": true,
       "total_matching": 14250,
       "returned_count": 10000,
       "max_export_limit": 10000
     }
   }
   ```
4. **Frontend Alert & Notice:**
   - In [`ExportApplicationsModal.jsx:713-717`](file:///d:/Internship/yohesa/frontend/src/components/Admin/ExportApplicationsModal.jsx#L713), if `isTruncated === true`:
     `⚠️ Export Limit Notice: Showing the most recent 10,000 records out of 14,250 matching applications. To export all records, please select a narrower date range or filter.`
   - In [`ExportApplicationsModal.jsx:911-915`](file:///d:/Internship/yohesa/frontend/src/components/Admin/ExportApplicationsModal.jsx#L911): A persistent notice is displayed in the modal footer.
5. **No False Completeness:** The exported CSV header and UI clearly reflect bounded data.

---

## 9. Review of Concurrent Indexes and Existing-Index Conflicts

### Finding: `NEEDS OPERATOR VERIFICATION / PREDICATE MISMATCH IDENTIFIED`

| Index Name | Table & Columns | Target Query | Potential Conflict / Issue |
| :--- | :--- | :--- | :--- |
| `idx_apps_status_created_desc` | `applications(status, created_at DESC)` | `WHERE status = $2 ORDER BY created_at DESC` | Safe. Accelerates dashboard filtering and eliminates sort step. |
| `idx_apps_sales_operator_code` | `applications(sales_operator_code) WHERE sales_operator_code IS NOT NULL` | `WHERE sales_operator_code = $X` | Safe partial index. Minimal write overhead. |
| `idx_apps_remark_operator_code` | `applications(remark_operator_code) WHERE remark_operator_code IS NOT NULL` | `WHERE remark_operator_code = $X` | Safe partial index. Minimal write overhead. |
| `idx_apps_remark_pending_prod` | `applications(product_id, created_at DESC) WHERE COALESCE(remark_status, 'PENDING') = 'PENDING'` | `getRemarkOperatorDashboard` | **CRITICAL MISMATCH:** The application query in `application.controller.js:6907` uses `COALESCE(NULLIF(to_jsonb(a)->>'remark_status', ''), 'PENDING') = 'PENDING'`. PostgreSQL's planner will **NOT** use this partial index because the expression does not match. |

### Architectural Resolution for Remark Index:
To enable PostgreSQL to use `idx_apps_remark_pending_prod`, the query in `application.controller.js:6907` must be updated after migration to:
```sql
AND COALESCE(a.remark_status, 'PENDING') = 'PENDING'
```
Until that query is modernized, creating this partial index will add index maintenance overhead without improving query execution time!

---

## 10. Runtime DDL and Migration Inventory

The following runtime schema mutations exist in active application routes. All Category 1 items have now been formalized into `migrate_consolidated_application_stage_columns.js`:

| Runtime Mutation Location | DDL Executed | Formalized in Migration? | Action for Phase 4 |
| :--- | :--- | :---: | :--- |
| `application.controller.js:1621` | Stage & curing columns (25 columns) | `YES` | Remove `ensureApplicationStageColumns()` call from request path. |
| `products/controller.js:274-279` | `joining_fee`, `processing_fee`, `interest_rate`, `sub_category`, `commission_release_days` | `YES` | Remove `ensureProductColumns()` call from `createProduct`. |
| `public/public.routes.js:20-33` | `candidate_reference_seq`, `otp_verifications`, `hr_name`, `target_role`, `referred_by_employee_id` | `YES` | Remove `ensurePublicTablesExist()` call from candidate registration. |
| `wallet/service.js:1122` | `commission_release_days` | `YES` | Remove runtime DDL call. |
| `commissionHoldRelease.job.js:9`| `commission_release_days` | `YES` | Remove runtime DDL call. |

---

## 11. Remaining Blockers and Risks

1. **Blocker 1 (DBA Inspection Required):** Staging column definition and current data format for `applications.bank_smart_emi_offer` must be verified via the read-only query before applying DDL.
2. **Blocker 2 (Connection Budget Confirmation):** Operator must confirm staging PostgreSQL instance `max_connections` can support the peak pool demand.
3. **Blocker 3 (Query Predicate Alignment):** The remark operator query in `application.controller.js:6907` must be updated to direct column matching before the partial index will be utilized by the PostgreSQL query planner.
4. **Blocker 4 (Boot Migration Decoupling):** Removing the 21 startup migrations from `server.js` requires coordination with the deployment script so migrations run once in a pre-flight step.

---

## 12. Staging Execution Prerequisites

Before the operator runs any migration on Staging:

- [ ] Verify automated RDS snapshot exists from within the last 24 hours.
- [ ] Execute read-only schema inspection queries (Section 14.1) and document results.
- [ ] Confirm staging PostgreSQL `max_connections` $\ge (\text{PM2 workers} \times \text{DB\_POOL\_MAX}) + 15$.
- [ ] Ensure `ALLOW_PRODUCTION_MIGRATION=true` is **NOT** set when targeting staging.
- [ ] Ensure no active user load testing is occurring during concurrent index builds.

---

## 13. Rollback Limitations & Non-Reversible DDL Analysis

1. **Additive Columns (`ADD COLUMN IF NOT EXISTS`):**
   - *Rollback:* Fully backward-compatible. Older code simply ignores new columns. Dropping columns is **NOT** recommended as it locks tables and discards data.
2. **Concurrent Indexes (`CREATE INDEX CONCURRENTLY`):**
   - *Rollback:* Non-blocking and instant:
     ```sql
     DROP INDEX CONCURRENTLY IF EXISTS idx_apps_status_created_desc;
     DROP INDEX CONCURRENTLY IF EXISTS idx_apps_remark_pending_prod;
     DROP INDEX CONCURRENTLY IF EXISTS idx_apps_sales_operator_code;
     DROP INDEX CONCURRENTLY IF EXISTS idx_apps_remark_operator_code;
     ```
3. **Sequences & Tables (`candidate_reference_seq`, `otp_verifications`):**
   - *Rollback:* Additive. Existing tables and sequences do not interfere with prior code versions.
4. **Data Type Conversions (`ALTER COLUMN TYPE`):**
   - *Rollback Limitation:* Any column type change (e.g. converting `bank_smart_emi_offer` from `TEXT` to `DECIMAL`) is **NOT** automatically reversible if text strings have been inserted.

---

## 14. Human Operator Commands (Execute Only After Approval)

### 14.1 Read-Only Schema Inspection Commands (Run in psql / pgAdmin):
```sql
-- 1. Inspect exact column types on target database
SELECT table_name, column_name, data_type, character_maximum_length, numeric_precision
FROM information_schema.columns
WHERE (table_name = 'applications' AND column_name IN ('bank_smart_emi_offer', 'smart_emi_amount', 'sales_operator_code', 'remark_status', 'ipa_stage'))
   OR (table_name = 'employee_candidates' AND column_name IN ('hr_name', 'target_role', 'referred_by_employee_id'))
   OR (table_name = 'products' AND column_name IN ('joining_fee', 'processing_fee', 'interest_rate'))
ORDER BY table_name, column_name;

-- 2. Check for any previously aborted/invalid indexes
SELECT c.relname AS invalid_index_name, t.relname AS table_name
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
JOIN pg_class t ON t.oid = i.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND i.indisvalid = false;

-- 3. Check bank_smart_emi_offer data pattern (if column exists)
SELECT 
    COUNT(*) AS total_rows,
    COUNT(bank_smart_emi_offer) AS non_null_count,
    COUNT(*) FILTER (WHERE bank_smart_emi_offer::text ~ '[^0-9.]') AS non_numeric_strings_count
FROM applications;
```

### 14.2 Single-Process Staging Migration Command:
```bash
# Execute standalone from EC2 / deployment runner (NOT inside PM2 boot):
export NODE_ENV=staging
cd /home/ubuntu/GharKaPaisa/backend
node src/database/migrations/migrate_consolidated_application_stage_columns.js
```

### 14.3 Post-Migration Smoke Test:
```bash
# Verify health endpoint
curl -s http://localhost:5000/api/v1/health

# Verify export pagination boundary
curl -s -H "Authorization: Bearer <STAGING_TOKEN>" \
  "http://localhost:5000/api/v1/applications?export=true&limit=10000" | jq '.pagination'
```
