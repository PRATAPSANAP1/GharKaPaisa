# GharKaPaisa Database Schema & Migration Audit

**Version:** 1.0.0  
**Date:** October 2026  
**Subsystem:** PostgreSQL Database Schema, Migrations & Indexing Architecture

---

## 1. Inventory of Runtime & Boot-Time DDL Statements

The codebase was audited for DDL statements (`ALTER TABLE`, `CREATE TABLE`, `CREATE INDEX`) executed outside of formal migration files. Every occurrence is cataloged below:

| File Location | Function / Context | DDL Executed | Hazard Level | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| [`src/modules/crm/application.controller.js:1621-1648`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L1621) | `ensureApplicationStageColumns()` | `ALTER TABLE applications ADD COLUMN IF NOT EXISTS ...` (25 columns) | **CRITICAL (P0)**: Locks table during request; blocks concurrent traffic. | Remove function from request path; consolidate all 25 columns into an idempotent migration. |
| [`src/modules/crm/application.controller.js:1650-1670`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L1650) | `ensureApplicationStageColumns()` | `ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS ...` (19 columns) | **CRITICAL (P0)**: Locks table during request. | Remove from request path; consolidate into idempotent migration. |
| [`src/modules/kyc-operator/kyc-operator.controller.js:14-23`](file:///d:/Internship/yohesa/backend/src/modules/kyc-operator/kyc-operator.controller.js#L14) | Top-level module execution | `ALTER TABLE applications ADD COLUMN IF NOT EXISTS ...` (10 columns: `kyc_status`, `vkyc_status`, `bank_application_number`, `pan_number`, etc.) | **HIGH (P0)**: Executes on every module load or API route import. | Remove from controller file; verify columns exist in formal migrations. |
| [`src/modules/public/public.routes.js:30-35`](file:///d:/Internship/yohesa/backend/src/modules/public/public.routes.js#L30) | Public candidate registration route | `ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS hr_name ...`, `ALTER TABLE employee_candidates ALTER COLUMN total_experience_years TYPE NUMERIC(10,2)` | **HIGH (P1)**: Type rewrite table lock during public user registration. | Remove from route handler; migrate column types via migration. |
| [`src/modules/hr/hr.routes.js:64-70`](file:///d:/Internship/yohesa/backend/src/modules/hr/hr.routes.js#L64) | HR candidate review route | `ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS assigned_hr_id ...` (7 columns) | **HIGH (P1)**: DDL executed on candidate status update. | Remove from route handler; include in candidate migration. |
| [`src/server.js:311-341`](file:///d:/Internship/yohesa/backend/src/server.js#L311) | Server bootstrap `startServer()` | `ALTER TABLE users ADD COLUMN IF NOT EXISTS has_loc_eoc ...`, `ALTER TABLE admin_bank_assignments ...` | **MEDIUM (P1)**: Locks tables on every PM2 restart across all workers. | Move to pre-deployment migration script; decouple from HTTP listen. |
| [`src/server.js:380-486`](file:///d:/Internship/yohesa/backend/src/server.js#L380) | Server bootstrap migration loop | Sequential execution of 13+ migration scripts (`migrateMessenger`, `migrateContests`, `migrateWhatsappTables`, etc.) | **CRITICAL (P0)**: Multiple PM2 workers run identical migrations concurrently on boot. | Decouple migrations from application boot; execute once during CI/CD deploy. |

---

## 2. Schema Conflicts and Data Type Discrepancies

### 2.1 The `bank_smart_emi_offer` Conflict
- **Migration A:** [`migrate_smart_emi_locc_and_reports.js:14`](file:///d:/Internship/yohesa/backend/src/database/migrations/migrate_smart_emi_locc_and_reports.js#L14):
  ```sql
  ADD COLUMN IF NOT EXISTS bank_smart_emi_offer DECIMAL(15,2),
  ```
- **Migration B:** [`migrate_crm_application_performance.js:81, 147`](file:///d:/Internship/yohesa/backend/src/database/migrations/migrate_crm_application_performance.js#L81):
  ```sql
  ADD COLUMN IF NOT EXISTS bank_smart_emi_offer TEXT,
  ```
- **Application Controller Usage:** [`application.controller.js:5130, 5470`](file:///d:/Internship/yohesa/backend/src/modules/crm/application.controller.js#L5130):
  ```javascript
  cleanStr(bank_smart_emi_offer) // Treated as string/text
  ```
- **Analysis:**
  If the column was created as `DECIMAL(15,2)` by `migrate_smart_emi_locc_and_reports.js`, inserting formatted strings (e.g., `"₹50,000 / 24M"`) or uncleaned text from `cleanStr()` will cause PostgreSQL to throw a fatal error: `invalid input syntax for type numeric`.
  Conversely, if created as `TEXT`, mathematical comparisons (`WHERE bank_smart_emi_offer > 100000`) or numeric sorting will produce string-order errors (`"200" > "1000"`).
- **Corrective Strategy:**
  Standardize `bank_smart_emi_offer` as `NUMERIC(15,2)` for financial calculations, or use a companion column (`bank_smart_emi_offer_details TEXT`) if textual offer terms must be stored. For backward compatibility, sanitize input in the controller before binding:
  ```javascript
  const numericSmartEmiOffer = bank_smart_emi_offer 
    ? parseFloat(String(bank_smart_emi_offer).replace(/[^0-9.]/g, '')) || null 
    : null;
  ```

### 2.2 The `smart_emi_amount` Discrepancy
- **Migration Definition:** [`migrate_smart_emi_locc_and_reports.js:12`](file:///d:/Internship/yohesa/backend/src/database/migrations/migrate_smart_emi_locc_and_reports.js#L12):
  ```sql
  ADD COLUMN IF NOT EXISTS smart_emi_amount DECIMAL(15,2),
  ```
- **Employee Route Insertion:** [`employee.routes.js:1121`](file:///d:/Internship/yohesa/backend/src/modules/employee/employee.routes.js#L1121):
  ```javascript
  smart_emi_amount || null
  ```
- **Analysis:**
  If the employee inputs `"50,000"` (with a comma) or `"50k"`, PostgreSQL driver fails with numeric syntax errors.
- **Corrective Strategy:**
  Sanitize and parse in `employee.routes.js`:
  ```javascript
  const parsedSmartEmiAmount = smart_emi_amount 
    ? parseFloat(String(smart_emi_amount).replace(/[^0-9.]/g, '')) || null 
    : null;
  ```

---

## 3. Existing Indexes vs Required Performance Indexes

### Existing Indexes Audit
An audit of `migrate_application_query_indexes.js` and `migrate.js` confirms the following indexes exist:
- `idx_apps_bank_id ON applications(bank_id)`
- `idx_apps_product_id ON applications(product_id)`
- `idx_apps_partner_id ON applications(partner_id)`
- `idx_apps_status ON applications(status)`
- `idx_apps_dispatch_status ON applications(dispatch_status)`
- `idx_apps_pan_check ON applications(pan_check)`
- `idx_apps_sales_claimed_by ON applications(sales_claimed_by)`
- `idx_apps_process_type ON applications(process_type)`
- `idx_apps_created_at_desc ON applications(created_at DESC)`

### Missing Performance Indexes
The following indexes are required to support hot filter combinations without full table scans:

1. **Composite Status & Creation Index:**
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_status_created_at 
   ON applications(status, created_at DESC);
   ```
   *Rationale:* High-volume dashboard filtering (`status = 'approved' ORDER BY created_at DESC`) currently performs an index scan on `status` followed by an expensive in-memory sort on `created_at`.
2. **Partial Index for Pending Remark Operator Dashboard:**
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_remark_pending 
   ON applications(product_id, created_at DESC) 
   WHERE COALESCE(remark_status, 'PENDING') = 'PENDING';
   ```
   *Rationale:* Eliminates table scan in `getRemarkOperatorDashboard`.
3. **Trigram Extension & Search Indexes:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_app_number_trgm 
   ON applications USING gin (app_number gin_trgm_ops);
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_bank_app_num_trgm 
   ON applications USING gin (bank_application_number gin_trgm_ops);
   ```
   *Rationale:* Enables indexed searches for `ILIKE '%APP123%'` and `ILIKE '%HDFC%'` wildcard text queries.

---

## 4. Transactional vs Non-Transactional Migration Safety

1. **Transactional Migrations:**
   - Standard DDL (`ADD COLUMN`, `ALTER COLUMN DEFAULT`, `CREATE TABLE`) should be wrapped in an explicit `BEGIN ... COMMIT` block so that any failure automatically rolls back without leaving a partial schema.
2. **`CREATE INDEX CONCURRENTLY` Safety:**
   - PostgreSQL **strictly forbids** `CREATE INDEX CONCURRENTLY` inside a transaction block (`ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`).
   - Any migration adding concurrent indexes must execute outside a transaction, catching errors gracefully.
3. **Idempotency Guarantee:**
   - Every column addition must use `ADD COLUMN IF NOT EXISTS`.
   - Every index creation must use `CREATE INDEX IF NOT EXISTS`.
   - Constraint additions must check `pg_constraint` before executing `ADD CONSTRAINT`.
