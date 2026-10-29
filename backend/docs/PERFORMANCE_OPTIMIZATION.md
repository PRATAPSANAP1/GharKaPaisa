# Employee Dashboard Performance Optimization

## Overview
This document outlines the performance optimizations implemented to resolve slow loading issues on the GharKaPaisa employee dashboard.

## Problem Statement
The employee dashboard at `/employee/dashboard` was taking **3-8 seconds** to load, causing poor user experience.

## Root Causes Identified

### 1. Multiple Sequential Database Queries
- Employee profile endpoint: 8+ sequential DB queries
- Verification status endpoint: 6+ DB queries + 5-6 S3 presigned URL generations
- Attendance endpoint: 8-10 DB queries with complex working hours resolution
- Total: 22-28 DB queries per dashboard load

### 2. No Caching Strategy
- All data fetched fresh on every request
- No Redis/memcached layer
- No HTTP caching headers

### 3. Runtime Schema Alteration
- `ensureWorkingHoursTables()` called on every attendance request
- Added unnecessary DB overhead

### 4. Missing Database Indexes
- No composite indexes on frequently queried columns
- Full table scans on employee_attendance, employee_documents, etc.

### 5. Heavy S3 Operations
- Presigned S3 URLs generated for every document on verification status
- Each S3 SDK call adds 100-300ms latency

## Implemented Optimizations

### Phase 1: Database Indexes ✅
**File:** `backend/src/database/migrations/migrate_employee_dashboard_performance_indexes.js`

Created 15 performance indexes:
- `idx_employee_attendance_emp_date` on (employee_id, attendance_date)
- `idx_employee_documents_emp_created` on (employee_id, created_at DESC)
- `idx_employee_joining_emp_created` on (employee_id, created_at DESC)
- `idx_employee_kyc_emp_created` on (employee_id, created_at DESC)
- `idx_employee_terms_emp_created` on (employee_id, accepted_at DESC)
- `idx_employee_hierarchy_emp_active` on (employee_id) WHERE is_active = true
- `idx_employee_hierarchy_manager` on (manager_id) WHERE is_active = true
- `idx_employee_hierarchy_team_leader` on (team_leader_id) WHERE is_active = true
- `idx_applications_employee_id` on (employee_id) WHERE employee_id IS NOT NULL
- `idx_applications_submitted_by` on (submitted_by) WHERE submitted_by IS NOT NULL
- `idx_employee_incentive_emp` on (employee_id)
- `idx_employee_biometric_emp_status` on (employee_id, status DESC, created_at DESC)
- `idx_employee_verification_reminders_emp_created` on (employee_id, created_at DESC)
- `idx_working_hour_extensions_date` on (extension_date, is_revoked) WHERE is_revoked IS NOT TRUE

**Deployment:**
```bash
cd backend
node src/database/migrations/migrate_employee_dashboard_performance_indexes.js
```

### Phase 2: Redis Caching ✅
**File:** `backend/src/services/cache.service.js`

Created a new cache service with:
- Redis client initialization (reuses existing Valkey/Redis infrastructure)
- Graceful fallback if Redis unavailable
- Cache helpers: `get()`, `set()`, `del()`, `delPattern()`

**Cached Endpoints:**
1. **Employee Profile** (`/api/v1/employee/profile`)
   - Cache key: `employee:profile:{empId}`
   - TTL: 5 minutes (300 seconds)
   - Invalidated on: joining-form, terms-acceptance, kyc, upload-document, submit-verification

2. **Verification Status** (`/api/v1/employee/verification-status`)
   - Cache key: `employee:verification:{empId}`
   - TTL: 5 minutes (300 seconds)
   - Invalidated on: joining-form, terms-acceptance, kyc, upload-document, submit-verification

3. **Banners** (`/api/v1/banners`)
   - Cache key: `banners:{pageFilter}`
   - TTL: 1 hour (3600 seconds)
   - HTTP Cache-Control header: `public, max-age=3600`
   - Invalidated on: create-banner, update-banner, delete-banner

### Phase 3: Remove Runtime Schema Checks ✅
**File:** `backend/src/modules/attendance/attendance.service.js`

Removed `await ensureWorkingHoursTables()` from `resolveEmployeeWorkingHoursContext()`.
- Tables should be created via migrations, not runtime
- Eliminates unnecessary DB overhead on every attendance request

### Phase 4: Cache Initialization ✅
**File:** `backend/src/server.js`

Added cache client initialization in `startServer()`:
```javascript
await cache.initCacheClient();
```

Updated health check endpoint to include cache status:
```javascript
cache: cache.isEnabled() ? 'enabled' : 'disabled'
```

### Phase 5: Cache Invalidation ✅
**File:** `backend/src/modules/employee/employee.routes.js`

Added cache invalidation on data mutations:
- `POST /joining-form` → invalidates profile + verification cache
- `POST /terms-acceptance` → invalidates profile + verification cache
- `POST /kyc` → invalidates profile + verification cache
- `POST /upload-document` → invalidates profile + verification cache
- `POST /submit-verification` → invalidates profile + verification cache

**File:** `backend/src/modules/banner/controller.js`

Added cache invalidation on banner mutations:
- `POST /banners` → invalidates all banner caches (`banners:*`)
- `PUT /banners/:id` → invalidates all banner caches
- `DELETE /banners/:id` → invalidates all banner caches

## Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Employee Profile | 500ms-2s | 50ms-200ms (cached) | **80-90% faster** |
| Verification Status | 500ms-2s | 100ms-300ms (cached) | **70-85% faster** |
| Attendance | 300ms-1.5s | 50ms-150ms | **80-90% faster** |
| Banners | 50ms-200ms | 10ms-50ms (cached) | **80-90% faster** |
| Dashboard Load (Total) | 3-8s | 0.5-1.5s | **80-85% faster** |

## Deployment Steps

### 1. Apply Database Indexes
```bash
cd backend
node src/database/migrations/migrate_employee_dashboard_performance_indexes.js
```

### 2. Verify Redis Connection
Ensure `REDIS_URL` or `VALKEY_URL` is set in `.env`:
```
REDIS_URL=rediss://gharkapaisa-messenger-i7mh8d.serverless.aps1.cache.amazonaws.com:6379
```

### 3. Deploy Code Changes
Deploy the following modified files:
- `backend/src/services/cache.service.js` (new)
- `backend/src/modules/employee/employee.routes.js`
- `backend/src/modules/attendance/attendance.service.js`
- `backend/src/modules/banner/controller.js`
- `backend/src/server.js`

### 4. Restart Server
```bash
npm run dev  # or pm2 restart
```

### 5. Verify Health Check
```bash
curl http://localhost:5000/health
```
Should return:
```json
{
  "cache": "enabled",
  "database": "connected",
  ...
}
```

## Monitoring

### Cache Hit Rate
Monitor cache effectiveness by checking logs for:
```
[Cache] Employee profile cache hit for empId: xxx
[Cache] Verification status cache hit for empId: xxx
[Cache] Banners cache hit for page: xxx
```

### Database Query Performance
Monitor slow queries ( > 100ms):
```
[WARN] Slow Query (150ms): SELECT ...
```

## Rollback Plan

If issues arise:

### Disable Caching
Set environment variable:
```bash
CACHE_DISABLED=true
```

Or comment out cache initialization in `server.js`.

### Drop Indexes
```sql
DROP INDEX IF EXISTS idx_employee_attendance_emp_date;
DROP INDEX IF EXISTS idx_employee_documents_emp_created;
-- ... drop other indexes
```

### Revert Code Changes
```bash
git checkout backend/src/services/cache.service.js
git checkout backend/src/modules/employee/employee.routes.js
git checkout backend/src/modules/attendance/attendance.service.js
git checkout backend/src/modules/banner/controller.js
git checkout backend/src/server.js
```

## Future Optimizations (Not Implemented)

### Phase 2: Higher Impact
1. **Combine Dashboard API** - Single endpoint returning all dashboard data
2. **Use CloudFront URLs** - Replace presigned S3 URLs with static CloudFront URLs
3. **Optimize Profile Query** - Single JOIN query instead of 8+ separate queries
4. **React Query** - Client-side caching with React Query or SWR

### Phase 3: Infrastructure
1. **Code Splitting** - Lazy load heavy dependencies (AWS Amplify, Recharts)
2. **Bundle Optimization** - Implement Vite code splitting
3. **CDN for Static Assets** - Serve banner images via CloudFront with WebP
4. **GraphQL** - Replace REST with GraphQL for efficient data fetching

## Files Changed

### New Files
- `backend/src/services/cache.service.js` - Redis cache service
- `backend/src/database/migrations/migrate_employee_dashboard_performance_indexes.js` - Performance indexes

### Modified Files
- `backend/src/modules/employee/employee.routes.js` - Added caching + invalidation
- `backend/src/modules/attendance/attendance.service.js` - Removed runtime schema checks
- `backend/src/modules/banner/controller.js` - Added caching + invalidation
- `backend/src/server.js` - Initialize cache client + health check update

## Testing Checklist

- [ ] Database indexes created successfully
- [ ] Redis cache client connects on startup
- [ ] Health check shows cache: "enabled"
- [ ] Employee profile loads faster on subsequent requests
- [ ] Verification status loads faster on subsequent requests
- [ ] Banners load faster and have Cache-Control header
- [ ] Cache invalidates when joining form is submitted
- [ ] Cache invalidates when document is uploaded
- [ ] Cache invalidates when banner is created/updated/deleted
- [ ] Dashboard loads in < 2 seconds (target: < 1.5s)

## Support
For issues or questions, contact the DevOps team.
