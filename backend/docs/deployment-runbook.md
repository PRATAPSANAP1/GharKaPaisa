# GharKaPaisa Production Deployment & Rollback Runbook

**Version:** 1.0.0  
**Date:** October 2026  
**Audience:** DevOps Engineers, Backend Engineers & System Administrators  
**Subsystem:** CI/CD Deployment Pipeline, AWS EC2, PM2 & PostgreSQL Migration Rollout

---

## 1. Pre-Deployment Verification Checklist

Before triggering or approving any production deployment:

- [ ] **Git Working Tree Cleanliness:** Ensure the local working tree is clean and matches the intended commit.
- [ ] **Syntax Verification:** Run `node --check` across all modified files.
- [ ] **Local Verification Tests:** Run the test suite:
  ```bash
  node src/tests/test_sql_schema_and_parameter_mapping.js
  ```
- [ ] **Database Backup Verification:** Confirm that an automated RDS snapshot exists from within the last 24 hours:
  ```bash
  aws rds describe-db-snapshots \
    --db-instance-identifier gharkapaisa-db \
    --region ap-south-1 \
    --query "DBSnapshots[-1].[DBSnapshotIdentifier,SnapshotCreateTime,Status]" \
    --output table
  ```
- [ ] **SSM Connectivity Check:** Confirm target EC2 instances are online and responding to SSM:
  ```bash
  aws ssm describe-instance-information \
    --region ap-south-1 \
    --query "InstanceInformationList[?PingStatus=='Online'].[InstanceId,IPAddress]" \
    --output table
  ```

---

## 2. Staged Deployment Procedure

Deployments should follow an **Expand-and-Contract** phased rollout to ensure zero downtime.

### Stage 1: Compatible Database Schema Migration (Pre-Deployment)
*Rule:* Apply schema additions before deploying new code. The new columns must be nullable or have safe defaults so existing running code is unaffected.

1. Execute the migration script standalone (not inside `server.js` boot):
   ```bash
   node src/database/migrations/migrate_crm_application_performance.js
   ```
2. Verify column existence in PostgreSQL:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'applications' 
     AND column_name IN ('sales_operator_code', 'remark_operator_code', 'ipa_stage', 'kyc_stage');
   ```

### Stage 2: Concurrent Index Creation (Out-of-Transaction)
Create indexes with `CONCURRENTLY` so production reads and writes are not locked:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apps_status_created_at 
ON applications(status, created_at DESC);
```

### Stage 3: Application Code Deployment & Graceful Reload
Deploy the application code via AWS SSM or GitHub Actions:
```bash
sudo -u ubuntu -H bash -c '
  cd /home/ubuntu/GharKaPaisa/backend &&
  git fetch origin master &&
  git reset --hard origin/master &&
  npm ci --production &&
  node --check src/server.js &&
  pm2 reload gharkapaisa-backend --update-env
'
```
*Note:* Use `pm2 reload` (zero-downtime rolling reload) rather than `pm2 restart` (hard stop/start).

---

## 3. Post-Deployment Health Verification

Immediately after reload, verify service health across all instances:

### 1. Application HTTP Health Check
```bash
curl -I -s http://localhost:5000/api/v1/health || curl -I -s http://localhost:5000/
```
Expected: `HTTP/1.1 200 OK`

### 2. Verify PM2 Process State & Logs
```bash
pm2 status
pm2 logs gharkapaisa-backend --lines 50 --nostream
```
Inspect logs for:
- Zero `deadlock detected` (`40P01`) errors.
- Zero `timeout exceeded when trying to connect` pool errors.
- Clean database pool initialization.

### 3. Critical API Smoke Test
Send a synthetic authenticated request to `/api/v1/crm/applications?page=1&limit=10`:
- Confirm response status is `200 OK`.
- Confirm response payload includes expected keys: `data`, `count`, `statusCounts`.
- Confirm response time is under 500ms.

---

## 4. Rollback and Disaster Recovery Protocol

If an unexpected regression, elevated error rate, or database lock occurs post-deployment:

### Scenario A: Application Code Rollback (Fastest, < 2 minutes)
If the regression is caused by application code (not database schema):
1. Identify the previous stable commit SHA (e.g. `PREV_SHA`).
2. Roll back via AWS SSM on all EC2 instances:
   ```bash
   sudo -u ubuntu -H bash -c '
     cd /home/ubuntu/GharKaPaisa/backend &&
     git reset --hard PREV_SHA &&
     pm2 reload gharkapaisa-backend --update-env
   '
   ```
3. Because Phase 1 schema changes are additive (`ADD COLUMN IF NOT EXISTS`), older code continues to function seamlessly with the new columns.

### Scenario B: Database Schema Rollback
If a newly applied migration causes unexpected locks or performance degradation:
1. Drop any non-critical index created concurrently:
   ```sql
   DROP INDEX CONCURRENTLY IF EXISTS idx_apps_status_created_at;
   ```
2. *Important:* Do **NOT** drop columns (`ALTER TABLE ... DROP COLUMN`) during an incident. Dropping a column acquires an `AccessExclusiveLock` and permanently deletes data. Leave the column in place and revert the application code referencing it.

### Scenario C: Database Restoration from RDS Snapshot (Extreme Disaster Recovery)
If critical data corruption occurs:
1. Identify the latest clean automated snapshot.
2. Restore to a new RDS instance (point-in-time recovery).
3. Update `DB_HOST` in `.env` to point to the restored RDS endpoint.
4. Issue `pm2 reload gharkapaisa-backend --update-env`.
