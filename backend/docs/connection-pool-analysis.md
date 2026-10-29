# GharKaPaisa Connection Pool Analysis & Capacity Budget

**Version:** 1.0.0  
**Date:** October 2026  
**Subsystem:** PostgreSQL Connection Pool, RDS Proxy & PM2 Process Architecture

---

## 1. Production Topology & Architecture

An audit of the infrastructure configuration in [`.github/workflows/backend-deploy.yml`](file:///d:/Internship/yohesa/.github/workflows/backend-deploy.yml), production PM2 logs, and backend source files reveals the following infrastructure profile:

### Topology Components
- **Hosting Environment:** AWS EC2 instances (`ap-south-1`) registered with:
  - Application Load Balancer Target Group: `arn:aws:elasticloadbalancing:ap-south-1:537124932736:targetgroup/gkp-backend-tg/065557a60e0d51af`
  - Auto-Scaling Group: `gharkapaisa-asg` (typically 1 to 2 active instances, e.g. `ip-172-31-11-149`, `i-07600948e01bb2aa3`)
- **Process Manager:** PM2 managing `gharkapaisa-backend` across available vCPUs.
- **Database Engine:** Amazon RDS PostgreSQL (instance class `db.t3.small` / `db.t3.medium`).
- **Connection Layer:** Node.js `pg` pool connecting either directly or via AWS RDS Proxy.

---

## 2. Current Connection Pool Configuration

In [`backend/src/config/database.js`](file:///d:/Internship/yohesa/backend/src/config/database.js):

```javascript
// Lines 27-34:
poolOptions.max = Math.max(parseInt(process.env.DB_POOL_MAX) || 40, 30);
poolOptions.min = (process.env.NODE_ENV === 'test' || process.env.SKIP_DB === 'true') ? 0 : (parseInt(process.env.DB_POOL_MIN) || 2);
poolOptions.idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT) || 30000;
const envConnTimeout = parseInt(process.env.DB_CONN_TIMEOUT) || 20000;
poolOptions.connectionTimeoutMillis = Math.max(envConnTimeout, 20000);
poolOptions.acquireTimeoutMillis = 20000;
poolOptions.query_timeout = 45000;
```

### Critical Flaws in Current Configuration
1. **Hardcoded Minimum Pool Max (`Math.max(..., 30)`):** Even if an administrator sets `DB_POOL_MAX=10` in `.env`, the code overrides it and enforces at least 30 connections per worker.
2. **Per-Process Multiplier:** Node.js connection pools exist **per process**, not globally. If PM2 spawns 2 cluster workers per EC2 instance, each worker allocates up to 40 connections (80 connections per instance).
3. **Triple Query Concurrency:** A single request to `/crm/applications` launches `listQuerySQL`, `statusCountsSQL`, and `countQuerySQL` simultaneously using `Promise.all()`, claiming 3 pool slots per user.

---

## 3. Total Connection Budget Mathematics

### Scenario A: Current Unbounded Configuration (Failure State)
- **Active EC2 Instances:** 2 instances
- **PM2 Workers per Instance:** 2 workers (cluster mode)
- **Total Node.js Processes:** $2 \times 2 = 4 \text{ processes}$
- **Configured Pool Max per Process:** 40 connections (enforced minimum 30)
- **Application Pool Ceiling:** $4 \times 40 = 160 \text{ connections}$
- **Background Schedulers (`server.js`):** 6 interval tasks per process
- **RDS PostgreSQL `max_connections` (`db.t3.small`):** $\approx 150 \text{ connections}$
- **RDS Superuser Reserved Slots:** $3 \text{ slots}$

$$\text{Total Potential Demand} = 160 \text{ (app)} + 5 \text{ (admin/SSM)} = 165 \text{ connections}$$
$$\text{Deficit} = 165 - 147 = 18 \text{ connection deficit (OUTAGE)}$$

When demand exceeds 147 connections, PostgreSQL rejects new clients with:
`FATAL: remaining connection slots are reserved for non-replication superuser connections`.

### Scenario B: Recommended Calibrated Budget (Stable State)
To ensure reliable operation without saturation:

- **Total PostgreSQL Capacity (`db.t3.small`):** 150 connections
- **Safety Reserve (RDS maintenance, admin, migrations, CLI):** 30 connections
- **Usable Application Budget:** $150 - 30 = 120 \text{ connections}$
- **Allocated across 4 PM2 Workers (2 instances × 2 workers):**
  $$\text{Safe Max per Worker} = \frac{120}{4} = 30 \text{ connections total}$$
  Or for a conservative footprint with RDS Proxy: **12 to 15 connections per worker**.
  $$4 \text{ processes} \times 12 \text{ connections} = 48 \text{ total connections}$$

This leaves over 100 idle connection slots on RDS, eliminating connection starvation completely.

---

## 4. Application-to-Proxy vs Proxy-to-Database Dynamics

When connecting through AWS RDS Proxy:
1. **Connection Multiplexing:** RDS Proxy multiplexes many client connections over a smaller pool of database connections.
2. **Connection Pinning:** If a transaction is held open, or if session-level parameters are set (`SET statement_timeout`), RDS Proxy pins the client connection to a specific backend database connection, disabling multiplexing.
3. **Best Practice:** 
   - Keep transactions as short as possible (`BEGIN ... COMMIT` with minimal network waits).
   - Never make external HTTP calls (e.g. AWS S3, Razorpay, MSG91) while holding an active database transaction.
   - Set statement timeouts at the pool level via `query_timeout` rather than executing SQL `SET statement_timeout`.

---

## 5. Retry Storm Prevention & Circuit Breaker Architecture

In [`src/config/database.js:66-116`](file:///d:/Internship/yohesa/backend/src/config/database.js#L66):

### Current Flaw:
The existing query retry mechanism retries any query on transient error or deadlock up to 2 times, regardless of whether the query is a `SELECT` or an `INSERT`/`UPDATE`.

### Hardened Protocol:
1. **Idempotency Check:**
   - Only retry read queries (`SELECT`) or queries explicitly marked idempotent.
   - Never automatically retry transactions or write operations (`INSERT`, `UPDATE`, `DELETE`) without an explicit idempotency key.
2. **Backoff and Jitter:**
   - Exponential backoff: $\text{delay} = \text{base} \times 2^{\text{attempt}} + \text{jitter}$
   - Jitter prevents "thundering herd" synchronization where all retrying workers strike the database at the exact same millisecond.
3. **Fast-Failure on Pool Saturation:**
   - If `currentPool.waitingCount > 0 && currentPool.idleCount === 0`, fail fast rather than retrying to allow active queries to complete and release connections back to the pool.
