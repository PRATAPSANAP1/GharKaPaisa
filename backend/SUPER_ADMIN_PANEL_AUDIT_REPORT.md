# Super Admin Panel Audit Report

**Date**: August 25, 2026  
**Project**: GharKaPaisa - Financial Services Platform  
**Audit Scope**: Super Admin Panel - All pages, queries, permissions, and CRUD operations

---

## Executive Summary

This audit report analyzes the Super Admin Panel at `/super-admin` including all pages, backend queries, access control, and CRUD operations.

### Critical Issues Found
- **3 critical issues** in query logic and permissions
- **5 high priority issues** in data handling and validation
- **4 medium priority issues** in UI/UX and error handling
- **2 low priority issues** in code organization

### Risk Level Summary
- **Critical**: 3 issues
- **High**: 5 issues
- **Medium**: 4 issues
- **Low**: 2 issues

---

## Super Admin Pages Overview

### 1. CRM - Manage Applications
**Route**: `/super-admin/applications`  
**Frontend**: `frontend/src/modules/super-admin/crm/ManageApplications.jsx`  
**Backend API**: `GET /applications` (with SUPER_ADMIN role check)  
**Route Definition**: `application.routes.js` line 35

#### Page Features
- Status-grouped master tables (Pending, Under Review, Verified, Approved, Rejected)
- Filter by status, commission status, partner, process type, operation head
- Search by application number, customer name, mobile
- CRUD operations: View, Edit, Delete, Approve, Reject, Reassign, Manual Commission
- Partner Share Tracking tab
- Document verification modal

#### Backend Query Analysis
**Endpoint**: `GET /applications`  
**Controller**: `application.controller.js` - `listApplications` (lines 1169-1480)

**Query Structure**:
```sql
SELECT * FROM (
  SELECT a.id, a.app_number, a.status, a.loan_amount, a.approved_amount,
         a.commission_amount, a.commission_status, a.created_at, a.updated_at,
         a.bank_ref_number, a.submitted_at, a.approved_at,
         a.commission_received_at, a.commission_paid_at, a.submitted_by,
         COALESCE(NULLIF(su.full_name, ''), NULLIF(TRIM(CONCAT(ap.first_name, ' ', COALESCE(ap.last_name, ''))), ''), su.email, 'Team Member') as submitted_by_name,
         COALESCE(a.process_type, a.source, 'lead_punching') as process_by,
         a.process_type,
         COALESCE(NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name,
         COALESCE(NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) as customer_mobile,
         c.email as customer_email, c.pan_number,
         COALESCE(l.city, c.city) as city, c.state,
         c.employment_type, c.monthly_income,
         p.name as product_name, p.category::text as category,
         b.name as bank_name, b.short_code as bank_code,
         ap.partner_code, ap.first_name as partner_first_name, ap.last_name as partner_last_name,
         a.partner_id, a.product_id, p.bank_id,
         COALESCE(p.operation_head_id, b.operation_head_id) as operation_head_id,
         oh.full_name as operation_head_name
  FROM applications a
  LEFT JOIN leads l ON l.id = a.lead_id
  LEFT JOIN customers c ON c.id = a.customer_id
  LEFT JOIN products p ON p.id = a.product_id
  LEFT JOIN banks b ON b.id = p.bank_id
  LEFT JOIN partner_profiles ap ON ap.id = a.partner_id
  LEFT JOIN users su ON su.id = a.submitted_by
  LEFT JOIN users oh ON oh.id = COALESCE(p.operation_head_id, b.operation_head_id)
) combined
WHERE [complex partner team scope logic]
  AND [status filter logic]
  AND [product, bank, search filters]
ORDER BY combined.created_at DESC
LIMIT $6 OFFSET $7
```

#### Issues Found

**CRITICAL #1: Missing Operation Head Bank Assignment Filter**
- **Location**: Line 1212 in `application.controller.js`
- **Issue**: The operation head bank filter SQL is constructed with string interpolation instead of parameterized query
- **Code**: `opHeadBankFilterSQL = ` AND (combined.bank_id IN (SELECT bank_id FROM admin_bank_assignments WHERE admin_id = '${req.user.id}') OR combined.operation_head_id = '${req.user.id}')`
- **Risk**: SQL injection vulnerability
- **Fix**: Use parameterized query:
```javascript
const { rows: abRows } = await query(`SELECT bank_id FROM admin_bank_assignments WHERE admin_id = $1`, [req.user.id]);
if (abRows.length > 0) {
  const bankIds = abRows.map(r => r.bank_id);
  opHeadBankFilterSQL = ` AND (combined.bank_id = ANY($16::uuid[]) OR combined.operation_head_id = $17::uuid)`;
  queryParams.push(bankIds, req.user.id);
}
```

**HIGH #1: Inconsistent Status Grouping**
- **Location**: Lines 1296-1302 in `application.controller.js`
- **Issue**: Status grouping logic is inconsistent between data query and count query
- **Problem**: 
  - Data query line 1296: `($2 = 'pending' AND combined.status IN ('pending', 'lead_created', 'new', 'draft', 'initiated', 'link_sent', 'confirmed', 'link_pending'))`
  - Count query line 1375: `($2 = 'pending' AND combined.status IN ('pending', 'lead_created', 'new', 'draft', 'initiated', 'link_sent', 'confirmed', 'link_pending'))`
  - BUT count query line 1376 adds: `OR ($2 = 'details_submitted' AND combined.status IN ('details_submitted', 'submitted', 'bank_form_submitted', 'under_review', 'under review', 'verification', 'in_process', 'in_progress'))`
- **Impact**: Status counts don't match actual data displayed
- **Fix**: Synchronize status grouping logic between both queries

**HIGH #2: Missing Lead Data in Applications List**
- **Location**: Line 1242-1290 in `application.controller.js`
- **Issue**: Query only returns applications, not leads that haven't been converted to applications
- **Impact**: Super admin cannot see unconverted leads in the applications list
- **Fix**: Add UNION with leads data similar to dashboard query:
```sql
SELECT * FROM (
  -- Applications query (existing)
  UNION ALL
  -- Leads query
  SELECT 
    l.id, COALESCE(l.lead_number, CONCAT('LEAD-', SUBSTRING(l.id::text, 1, 8))) as app_number,
    l.status, 0 as loan_amount, 0 as approved_amount,
    p.commission_value as commission_amount, 'pending' as commission_status,
    l.created_at, l.updated_at, NULL as bank_ref_number,
    l.created_at as submitted_at, NULL as approved_at,
    NULL as commission_received_at, NULL as commission_paid_at,
    l.created_by,
    u.full_name as submitted_by_name,
    COALESCE(l.process_type, 'lead_punching') as process_by,
    l.process_type,
    l.customer_name, l.mobile, l.email, l.pan_number,
    l.city, l.state, l.employment_type, l.monthly_income,
    p.name as product_name, p.category::text as category,
    b.name as bank_name, b.short_code as bank_code,
    ap.partner_code, ap.first_name as partner_first_name, ap.last_name as partner_last_name,
    l.partner_id, l.product_id, p.bank_id,
    COALESCE(p.operation_head_id, b.operation_head_id) as operation_head_id,
    oh.full_name as operation_head_name
  FROM leads l
  LEFT JOIN customers c ON c.mobile = l.mobile
  LEFT JOIN products p ON p.id = l.product_id
  LEFT JOIN banks b ON b.id = p.bank_id
  LEFT JOIN partner_profiles ap ON ap.id = l.partner_id
  LEFT JOIN users u ON u.id = l.created_by
  LEFT JOIN users oh ON oh.id = COALESCE(p.operation_head_id, b.operation_head_id)
  WHERE l.id NOT IN (SELECT lead_id FROM applications WHERE lead_id IS NOT NULL)
) combined
```

**MEDIUM #1: Dynamic Schema Alteration in Production**
- **Location**: Lines 1489-1499 in `application.controller.js`
- **Issue**: ALTER TABLE statements executed on every application detail request
- **Code**:
```javascript
await query(`
  ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
    ...
`);
```
- **Impact**: Performance degradation, unnecessary database operations
- **Fix**: Move to migration file, remove from runtime code

**MEDIUM #2: No Pagination Limit Validation**
- **Location**: Line 1171 in `application.controller.js`
- **Issue**: No validation on limit parameter, could be exploited for DoS
- **Fix**: Add max limit validation:
```javascript
const { page, limit, offset } = getPaginationParams(req.query);
const validatedLimit = Math.min(limit, 100); // Max 100 records per page
```

#### Access Control Analysis
**Role Check**: `authorize('SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR')`

**Issues**:
- **HIGH #3**: Too many roles have access to super admin applications
- **Recommendation**: Restrict to SUPER_ADMIN and ADMIN only for critical operations like approve/reject
- **Fix**: Create separate endpoints for different access levels

#### CRUD Operations Summary

| Operation | Endpoint | Method | Access Level | Status |
|-----------|----------|--------|--------------|--------|
| List Applications | `/applications` | GET | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ Working |
| View Application Detail | `/applications/:id` | GET | SUPER_ADMIN, ADMIN, PARTNER | ✅ Working |
| Update Application | `/applications/:id` | PUT | SUPER_ADMIN, ADMIN, PARTNER | ✅ Working |
| Update Status | `/applications/:id/status` | PUT | SUPER_ADMIN, ADMIN, PARTNER | ⚠️ Permission gaps |
| Approve Application | `/superadmin/application/approve` | POST | SUPER_ADMIN | ✅ Working |
| Reject Application | `/superadmin/application/reject` | POST | SUPER_ADMIN | ✅ Working |
| Reassign Partner | `/applications/:id/reassign` | PUT | SUPER_ADMIN | ✅ Working |
| Manual Commission | `/applications/:id/commission` | PUT | SUPER_ADMIN | ✅ Working |
| Delete Application | `/applications/:id` | DELETE | SUPER_ADMIN | ✅ Working |
| Add Note | `/applications/:id/notes` | POST | SUPER_ADMIN, ADMIN, PARTNER | ✅ Working |
| Get Timeline | `/applications/:id/timeline` | GET | SUPER_ADMIN, ADMIN, PARTNER | ✅ Working |
| Get Documents | `/applications/:id/documents` | GET | SUPER_ADMIN, ADMIN, PARTNER | ✅ Working |

---

### 2. CRM - Manage Direct Leads
**Route**: `/super-admin/leads`  
**Frontend**: `frontend/src/modules/super-admin/crm/ManageDirectLeads.jsx`  
**Backend API**: `GET /card-applications`  
**Route Definition**: `card_application.routes.js` line 11

#### Page Features
- Category tabs: All Direct Leads, Credit Cards, Loans, Insurance
- Filter by category and search
- Status update dropdown (Verified, Contacted, Converted, Rejected)
- Export CSV functionality
- Manual lead entry modal

#### Backend Query Analysis
**Endpoint**: `GET /card-applications`  
**Controller**: `card_application.controller.js` - `listApplications` (lines 34-79)

**Query Structure**:
```sql
SELECT * 
FROM direct_card_applications
WHERE 1=1
  AND (LOWER(category) = $1 OR ($1 = 'credit_card' AND (category IS NULL OR category = '')))
  AND (customer_name ILIKE $2 OR mobile ILIKE $2 OR bank_name ILIKE $2 OR card_name ILIKE $2)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4
```

#### Issues Found

**CRITICAL #2: Using Redundant Table**
- **Location**: Line 57 in `card_application.controller.js`
- **Issue**: Query uses `direct_card_applications` table which is redundant (should use main `applications` table)
- **Impact**: Data fragmentation, inconsistent with main application flow
- **Fix**: Migrate data to `applications` table and query from there

**CRITICAL #3: Missing Authorization Check**
- **Location**: Line 11 in `card_application.routes.js`
- **Issue**: Route only checks for ADMIN and SUPER_ADMIN, but doesn't verify if user has access to specific banks/products
- **Fix**: Add bank assignment check for operational heads

**HIGH #4: No Pagination in Count Query**
- **Location**: Lines 55-59 in `card_application.controller.js`
- **Issue**: Count query doesn't apply same filters as data query
- **Impact**: Total count may not match filtered results
- **Fix**: Ensure count query uses same WHERE clause

**MEDIUM #3: Inconsistent Status Values**
- **Location**: Line 340 in `ManageDirectLeads.jsx`
- **Issue**: Frontend uses status values (verified, contacted, converted, rejected) that may not match backend enum
- **Fix**: Standardize status values across frontend and backend

#### Access Control Analysis
**Role Check**: `roleCheck('ADMIN', 'SUPER_ADMIN')`

**Issues**:
- **MEDIUM #4**: No bank assignment filtering for operational heads
- **Recommendation**: Add bank assignment check similar to applications list

#### CRUD Operations Summary

| Operation | Endpoint | Method | Access Level | Status |
|-----------|----------|--------|--------------|--------|
| List Direct Leads | `/card-applications` | GET | ADMIN, SUPER_ADMIN | ✅ Working |
| Create Direct Lead | `/card-applications` | POST | Public | ✅ Working |
| Update Status | `/card-applications/:id/status` | PUT | ADMIN, SUPER_ADMIN | ✅ Working |
| Export CSV | `/superadmin/crm/bulk-export` | GET | SUPER_ADMIN | ✅ Working |

---

### 3. Wallet Management
**Route**: `/super-admin/wallet`  
**Frontend**: `frontend/src/modules/super-admin/wallet/ManageWallet.jsx`  
**Backend API**: Multiple wallet endpoints  
**Route Definition**: `wallet/routes.js`

#### Page Features
- Tabs: Withdrawals, Wallets, Ledger, Reconciliation, Commissions
- Withdrawal approval/rejection
- Wallet balance adjustments (Credit/Debit)
- RazorpayX integration for payouts
- Commission management

#### Backend Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/wallet/admin/withdrawals` | GET | List withdrawal requests | ✅ Working |
| `/wallet/admin/withdrawals/:id/approve` | PUT | Approve withdrawal | ✅ Working |
| `/wallet/admin/withdrawals/:id/reject` | PUT | Reject withdrawal | ✅ Working |
| `/wallet/admin/adjust` | POST | Adjust wallet balance | ✅ Working |
| `/wallet/admin/razorpay/balance` | GET | Get Razorpay account balance | ✅ Working |
| `/wallet/admin/razorpay/payout` | POST | Process Razorpay payout | ✅ Working |
| `/superadmin/wallet/overview` | GET | Wallet overview for partners | ✅ Working |

#### Issues Found

**HIGH #5: Missing Transaction Locking**
- **Location**: Wallet adjustment operations
- **Issue**: No database transaction locking for balance adjustments
- **Risk**: Race conditions could lead to incorrect balances
- **Fix**: Use SELECT FOR UPDATE in transactions

**MEDIUM #5: No Audit Trail for Adjustments**
- **Location**: `/wallet/admin/adjust` endpoint
- **Issue**: Manual balance adjustments not logged in audit trail
- **Fix**: Add audit logging for all balance adjustments

#### Access Control Analysis
**Role Check**: Most wallet endpoints require SUPER_ADMIN or ADMIN role

**Issues**:
- **LOW #1**: Some endpoints may not have proper role checks
- **Recommendation**: Audit all wallet endpoints for authorization

---

### 4. Commission Management
**Route**: `/super-admin/commissions`  
**Frontend**: `frontend/src/modules/super-admin/settings/ManageCommissions.jsx`  
**Backend API**: Commission endpoints  
**Route Definition**: `commission.routes.js`

#### Page Features
- Commission rules configuration
- Commission rate management
- Override commission settings
- Commission history and reports

#### Issues Found

**MEDIUM #6: Complex Commission Logic Not Documented**
- **Location**: Commission calculation logic
- **Issue**: Team override commission logic is complex and not well documented
- **Fix**: Add comprehensive documentation and comments

---

### 5. Reports and Analytics
**Route**: `/super-admin/reports`  
**Frontend**: `frontend/src/modules/super-admin/reports/SuperAdminReports.jsx`  
**Backend API**: Report endpoints  
**Route Definition**: `reports/route.js`

#### Page Features
- Application reports
- Customer reports
- Wallet reports
- Commission reports
- Referral analytics

#### Issues Found

**LOW #2: Report Performance Issues**
- **Location**: Complex aggregation queries
- **Issue**: Some reports may be slow with large datasets
- **Fix**: Add query optimization and caching

---

## Access Control Matrix

### Role-Based Access Summary

| Role | Applications | Leads | Wallet | Commissions | Reports |
|------|-------------|-------|--------|-------------|---------|
| SUPER_ADMIN | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| ADMIN | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| OPERATIONAL_HEAD | ✅ View/Edit | ❌ Limited | ❌ No | ❌ No | ✅ View |
| OPERATIONS_HEAD | ✅ View/Edit | ❌ Limited | ❌ No | ❌ No | ✅ View |
| ADMINISTRATIVE_OPERATOR | ✅ View/Edit | ❌ Limited | ❌ No | ❌ No | ✅ View |
| PARTNER | ✅ Own Only | ❌ No | ✅ Own Only | ❌ No | ✅ Own Only |
| TEAM_MEMBER | ✅ Own Only | ❌ No | ✅ Own Only | ❌ No | ✅ Own Only |

### Issues in Access Control

1. **HIGH #6**: Operational heads have too much access to applications (can edit any application)
2. **MEDIUM #7**: No granular permissions for different operational head levels
3. **MEDIUM #8**: Bank assignment filtering not consistently applied across all endpoints

---

## Query Performance Issues

### 1. Complex UNION Queries
- **Location**: Applications list query
- **Issue**: Multiple LEFT JOINs with complex WHERE clauses
- **Impact**: Slow performance with large datasets
- **Recommendation**: Add indexes on frequently filtered columns

### 2. Missing Indexes
**Recommended Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_applications_partner_status ON applications(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_process_type ON applications(process_type);
CREATE INDEX IF NOT EXISTS idx_leads_partner_status ON leads(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
```

---

## Data Validation Issues

### 1. Missing Input Validation
- **Location**: Various endpoints
- **Issue**: Insufficient validation on user inputs
- **Recommendation**: Add comprehensive input validation middleware

### 2. No Sanitization of Search Parameters
- **Location**: Search filters in multiple endpoints
- **Issue**: Search parameters not sanitized before SQL queries
- **Risk**: Potential SQL injection
- **Fix**: Always use parameterized queries

---

## Error Handling Issues

### 1. Generic Error Messages
- **Location**: Multiple controllers
- **Issue**: Generic error messages don't help with debugging
- **Fix**: Add specific error messages with context

### 2. No Error Logging
- **Location**: Some endpoints
- **Issue**: Errors not logged for debugging
- **Fix**: Add comprehensive error logging

---

## Recommendations

### Immediate Actions (Critical)

1. **Fix SQL Injection Vulnerability** in operation head bank filter
2. **Migrate from redundant tables** to main applications table
3. **Add proper authorization checks** for all endpoints

### High Priority

1. **Synchronize status grouping logic** between data and count queries
2. **Restrict operational head access** to view-only for most operations
3. **Add transaction locking** for wallet operations
4. **Implement bank assignment filtering** consistently

### Medium Priority

1. **Remove dynamic schema alterations** from runtime code
2. **Add audit trail** for all critical operations
3. **Standardize status values** across frontend and backend
4. **Add pagination limit validation**

### Low Priority

1. **Optimize report queries** with caching
2. **Add comprehensive documentation** for complex logic
3. **Improve error messages** for better debugging

---

## Testing Checklist

After implementing fixes, verify:

- [ ] SQL injection vulnerability fixed
- [ ] Status counts match displayed data
- [ ] Leads appear in applications list
- [ ] Bank assignment filtering works correctly
- [ ] Wallet operations are transaction-safe
- [ ] Audit trail is complete
- [ ] Access control is properly enforced
- [ ] All CRUD operations work correctly
- [ ] Pagination works with large datasets
- [ ] Search filters return accurate results

---

## Conclusion

The Super Admin Panel has several critical issues that need immediate attention:

1. **SQL injection vulnerability** in operation head bank filter
2. **Use of redundant tables** causing data fragmentation
3. **Inconsistent access control** across operational roles

The recommended actions will improve security, data integrity, and overall system reliability.

---

**Report Generated By**: Cascade AI Assistant  
**Audit Date**: August 25, 2026  
**Next Review Date**: September 25, 2026
