# GharKaPaisa Backend Performance Audit & Root-Cause Analysis

**Version:** 1.0.0  
**Date:** October 2026  
**Auditor:** Senior Backend, DevOps & PostgreSQL Performance Engineering  
**Application:** GharKaPaisa (Fintech Application Platform)  
**Target Subsystem:** `backend/` (Node.js, Express, PostgreSQL `pg`, AWS EC2 / RDS / PM2)

---

## 1. Executive Summary

A comprehensive, evidence-based performance and reliability audit was conducted on the GharKaPaisa backend repository. The audit analyzed static source code, git commit trajectory, deployment workflows, database migration architecture, and real production runtime telemetry from EC2 instances (`production_pm2_decoded.log`).

### Primary Root Causes Identified
1. **Request-Path & Boot-Time DDL (Severe P0):** Route controllers, service initializers, and the `server.js` boot sequence execute `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements during live traffic and process restarts. In PostgreSQL, `ALTER TABLE` acquires an `AccessExclusiveLock`, blocking all concurrent reads and writes, leading directly to query queueing, connection pool exhaustion, and documented `40P01` deadlocks.
2. **`to_jsonb(row)` Row Deserialization Bottlenecks (Severe P1):** Over 100 instances of `to_jsonb(a)->>'col'` exist in the primary CRM application list, count, status-count, and dashboard queries. These were introduced as defensive compatibility tricks when columns were missing in production. Each execution forces PostgreSQL to serialize every scanned row into a JSONB document in memory, completely invalidating B-Tree indexes, spiking CPU utilization, and resulting in query execution times of 9.8s to 83s.
3. **Connection Pool Sizing & Blind Retry Amplification (Severe P1):** The database configuration enforces a minimum pool floor of 30 connections per worker (`Math.max(DB_POOL_MAX || 40, 30)`). With PM2 workers running on EC2 instances, the aggregate potential connections exceed RDS instance limits. Furthermore, queries that fail or time out are blindly retried up to 2 additional times—even for non-idempotent writes—causing connection retry storms during peak traffic.
4. **Triple Query Dispatch in CRM Application List:** The `/api/v1/crm/applications` endpoint concurrently dispatches three heavy 13-table join queries (`listQuerySQL`, `statusCountsSQL`, and `countQuerySQL`) via `Promise.all()`, claiming three database pool connections per single user request.
5. **Pagination & Client Export Dynamics:** While standard frontend navigation uses page limits of 10, 25, 50, and 100, `ExportApplicationsModal.jsx` requests `limit: 50000` via `GET /applications` to assemble client-side spreadsheets, creating sudden bursts of memory consumption and long-running table scans.

---

## 2. Issues Ranked by Severity

| Severity | Category | Finding | Exact Source Location | Production Impact |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | Availability | Request-path schema alteration via `ALTER TABLE` | [`application.controller.js:1621`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L1621), [`kyc-operator.controller.js:14`](file:///d:/Internship/yohesa/backend/src/modules/kyc-operator/kyc-operator.controller.js#L14) | Acquires `AccessExclusiveLock`; blocks concurrent queries; confirmed `40P01` deadlocks in PM2 log. |
| **P0** | Availability | Boot-time DDL execution during PM2 restarts | [`server.js:311-341, 380-486`](file:///d:/Internship/yohesa/backend/src/server.js#L311-L341) | PM2 cluster workers race to execute 13+ migration scripts sequentially on every restart. |
| **P1** | Performance | In-memory row serialization via `to_jsonb(a)` | [`application.controller.js:2236-2282, 6882`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L2236-L2282) | Sequential table scans; CPU spikes; 9.8s to 83s query latency. |
| **P1** | Stability | Database pool saturation & write retry storms | [`config/database.js:27, 66-116`](file:///d:/Internship/yohesa/backend/src/config/database.js#L27) | Hard pool floor (min 30/worker); retries non-idempotent writes; amplifies queueing. |
| **P1** | Resource | Triple query concurrency per single HTTP request | [`application.controller.js:2624-2630`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L2624-L2630) | Claims 3 connections simultaneously per list request; 10 users exhaust 30 pool slots. |
| **P2** | Data Integrity | Inconsistent schema definitions across migrations | `migrate_smart_emi_locc_and_reports.js` vs `migrate_crm_application_performance.js` | `bank_smart_emi_offer` defined as both `TEXT` and `DECIMAL(15,2)`; potential cast failures. |
| **P2** | Performance | Leading-wildcard text search on 6 unindexed columns | [`application.controller.js:2383`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L2383) | `ILIKE '%search%'` forces full scan of joined subquery without trigram index acceleration. |
| **P3** | Maintainability | Unversioned imperative migrations | `database/migrations/` | 42 migration files without a `schema_migrations` tracking table. |

---

## 3. Deep-Dive Root-Cause Analysis

### 3.1 Request-Path & Boot-Path DDL Lock Contention
- **Mechanism:** PostgreSQL table modification operations (`ALTER TABLE ... ADD COLUMN`) require an `AccessExclusiveLock`. This lock conflicts with ALL other lock modes (including `AccessShareLock` acquired by simple `SELECT` queries).
- **Code Path:** In [`application.controller.js:6865`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L6865), `getRemarkOperatorDashboard` awaits `ensureApplicationStageColumns()`. This function executes an `ALTER TABLE applications ADD COLUMN IF NOT EXISTS ...` with 25 column definitions.
- **Production Telemetry Evidence:** Decoded production PM2 logs from EC2 instance `ip-172-31-11-149` (`production_pm2_decoded.log`):
  ```
  09:43:17 [INFO]: [Operator History Migration] Ensuring application_operator_history table and operator columns...
  09:43:40 [WARN]: DB Connection status on error (Deadlock): Total=9, Idle=0, Waiting=1 {"error":"deadlock detected"}
  09:43:40 [WARN]: Transient DB error / Deadlock detected. Retrying in 113ms (2 left)...
  09:44:31 [INFO]: [MIGRATION] Running Working Hours Phase 2 schema migration...
  09:44:48 [WARN]: DB Connection status on error (Deadlock): Total=9, Idle=0, Waiting=5 {"error":"deadlock detected"}
  ```
  The logs prove that runtime migrations and helper DDL directly collide with concurrent API requests, creating deadlocks and exhausting pool connections (`Waiting=5`).

### 3.2 The Genesis of `to_jsonb(a)` and its Computational Cost
- **Historical Origin:** Git investigation revealed commit `e289955b` (*"fix(database): resolve PostgreSQL parameter mapping and schema column mismatches"*) and commit `087907d7` (*"Fix application tracking query error - remove reference to non-existent a.category column"*). When columns like `assigned_to`, `category`, or `ipa_stage` were added in application code but missing from production databases, direct SQL references (`a.assigned_to`) caused queries to fail immediately with `error: column a.assigned_to does not exist`.
- **The Defective Fix:** Rather than maintaining a strict migration pipeline, developers replaced bare column references with `to_jsonb(a)->>'col'`. In PostgreSQL:
  - If column `x` exists on table `a`, `to_jsonb(a)->>'x'` returns its string value.
  - If column `x` does NOT exist, `to_jsonb(a)->>'x'` safely returns `NULL` without a SQL syntax error.
- **The Performance Disaster:** When applied to queries scanning thousands of rows in `applications` and `physical_application_details`, PostgreSQL must serialize every row into a JSONB document in memory. Furthermore, `WHERE COALESCE(NULLIF(to_jsonb(a)->>'remark_status', ''), 'PENDING') = 'PENDING'` ([`application.controller.js:6882`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L6882)) cannot use standard B-Tree indexes on `applications(remark_status)`. This forces a sequential scan across the entire table for every dashboard refresh.

### 3.3 Connection Pool Sizing vs RDS Capacity
- **Configuration in Code:** [`backend/src/config/database.js:27`](file:///d:/Internship/yohesa/backend/src/config/database.js#L27):
  ```javascript
  poolOptions.max = Math.max(parseInt(process.env.DB_POOL_MAX) || 40, 30);
  ```
- **Connection Calculation:**
  - 2 EC2 instances × 2 PM2 workers per instance = 4 Node.js processes.
  - 4 processes × 40 connections = 160 potential connections.
  - An AWS RDS PostgreSQL instance on `db.t3.small` defaults to `max_connections = 150`.
  - 160 application connections + administrative connections + background workers exceeds the database limit, resulting in `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
- **Retry Amplification:** When queries fail due to connection timeouts (`timeout exceeded when trying to connect`) or deadlocks (`40P01`), [`src/config/database.js:105-115`](file:///d:/Internship/yohesa/backend/src/config/database.js#L105-L115) retries the query up to 2 times. Retrying into a saturated pool acts as an amplifier: 10 failing requests produce 20 additional queued queries, deepening the outage.

---

## 4. Evidence-Based Optimization Strategy

1. **Eliminate All Request-Path DDL:**
   - Formalize all required dynamic columns (`ipa_stage`, `kyc_stage`, `sales_operator_code`, `remark_operator_code`, `pan_checker_code`, `backend_remark`, `smart_emi_amount`, etc.) into an idempotent, versioned migration.
   - Remove `ensureApplicationStageColumns()` and all inline `ALTER TABLE` statements from controllers and route handlers.
2. **Transition from `to_jsonb()` to Direct Indexed Column Access:**
   - Once all columns are verified present in the database, replace `to_jsonb(a)->>'column'` with direct column access `a.column`.
   - Maintain strict null-coalescing compatibility (`COALESCE(NULLIF(a.col, ''), ...)`).
3. **Connection Budget Calibration & Retry Hardening:**
   - Remove the `Math.max(..., 30)` hard floor. Configure `poolOptions.max` to a safe, budgeted value (e.g. 10–12 per process for 4 processes = 40–48 total connections, well below RDS limits).
   - Restrict automatic retries strictly to idempotent read queries (`SELECT`). Never retry non-idempotent writes (`INSERT`, `UPDATE`, `DELETE`) or explicit transactions blindly.
4. **Decouple CRM List, Count, and Status Queries:**
   - Optimize `statusCountsSQL` and `countQuerySQL` to query only the necessary indexed columns on `applications` without joining 13 tables when calculating numerical counts.
5. **Harmonize Export vs List Pagination:**
   - Bound standard paginated list queries to a safe maximum (e.g. 100–200 rows).
   - Ensure `ExportApplicationsModal.jsx` and bulk CSV workflows use optimized streaming or dedicated export pipelines without destabilizing interactive dashboard requests.
