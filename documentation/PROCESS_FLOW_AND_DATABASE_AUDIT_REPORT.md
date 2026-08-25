# Process Flow and Database Audit Report

**Date**: August 25, 2026  
**Project**: GharKaPaisa - Financial Services Platform  
**Audit Scope**: All process flows, database schema, field usage analysis

---

## Executive Summary

This audit report identifies issues in process flows, database schema inconsistencies, and redundant fields/tables that should be removed or consolidated.

### Critical Issues Found
- **5 redundant application tables** that should be consolidated into the main `applications` table
- **11 missing fields** in `leads` table schema that are being used in code
- **Application lookup issue** for LINKED SHARE process type
- **Inconsistent field naming** across similar tables

### Risk Level Summary
- **Critical**: 2 issues
- **High**: 4 issues
- **Medium**: 3 issues
- **Low**: 2 issues

---

## Critical Issues

### 1. Redundant Application Tables

**Severity**: Critical  
**Impact**: Data fragmentation, maintenance overhead, potential data inconsistency

**Issue**: The database contains 5 separate application tables that appear to be legacy tables serving the same purpose as the main `applications` table:

| Table Name | Purpose | Status |
|------------|---------|--------|
| `applications` (TABLE 15) | Main application table | ✅ Active |
| `direct_card_applications` (TABLE 48) | Direct card applications | ❌ Redundant |
| `loan_applications` (TABLE 77) | Loan applications | ❌ Redundant |
| `insurance_applications` (TABLE 78) | Insurance applications | ❌ Redundant |
| `bank_card_applications` (TABLE 79) | Bank card applications | ❌ Redundant |
| `sbi_credit_card_applications` (TABLE 81) | SBI credit card applications | ❌ Redundant |

**Evidence**: 
- The main `applications` table has fields for all product types (credit cards, loans, insurance)
- Code references show INSERT operations only into the main `applications` table
- No SELECT queries found referencing the redundant tables in recent code

**Recommendation**:
1. **Immediate Action**: Migrate any data from redundant tables to the main `applications` table using the `process_type` field to distinguish product types
2. **Add `product_category` field** to `applications` table if needed for categorization
3. **Drop redundant tables** after migration:
   ```sql
   DROP TABLE IF EXISTS direct_card_applications;
   DROP TABLE IF EXISTS loan_applications;
   DROP TABLE IF EXISTS insurance_applications;
   DROP TABLE IF EXISTS bank_card_applications;
   DROP TABLE IF EXISTS sbi_credit_card_applications;
   ```

**Migration Script**:
```sql
-- Migrate direct_card_applications
INSERT INTO applications (app_number, customer_name, customer_mobile, product_id, partner_id, bank_id, status, process_type, created_at)
SELECT 
  'APP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(ROW_NUMBER() OVER (), 4, '0'),
  customer_name, 
  mobile, 
  (SELECT id FROM products WHERE name LIKE '%' || card_name || '%' LIMIT 1),
  (SELECT id FROM partner_profiles WHERE id = partner_id LIMIT 1),
  (SELECT id FROM banks WHERE name = bank_name LIMIT 1),
  status,
  'direct_bank',
  created_at
FROM direct_card_applications;

-- Similar migration for other tables
```

---

### 2. Missing Fields in Leads Table Schema

**Severity**: Critical  
**Impact**: Schema documentation mismatch, potential migration failures

**Issue**: The `leads` table schema (TABLE 20) is missing 11 fields that are actively used in INSERT operations:

**Missing Fields**:

| Field Name | Data Type | Used In Code | Description |
|------------|-----------|--------------|-------------|
| `lead_number` | VARCHAR(50) | ✅ Yes | Unique lead identifier |
| `parent_partner_id` | UUID | ✅ Yes | Parent partner reference |
| `created_by` | UUID | ✅ Yes | Creator user ID |
| `customer_id` | UUID | ✅ Yes | Customer reference |
| `customer_email` | VARCHAR(255) | ✅ Yes | Customer email |
| `customer_mobile` | VARCHAR(15) | ✅ Yes | Customer mobile (separate from mobile) |
| `source` | VARCHAR(100) | ✅ Yes | Lead source |
| `pipeline_stage` | VARCHAR(50) | ✅ Yes | Pipeline stage |
| `priority` | VARCHAR(50) | ✅ Yes | Lead priority |
| `tracking_token` | VARCHAR(100) | ✅ Yes | Tracking token for share links |
| `application_id` | UUID | ✅ Yes | Linked application ID |

**Evidence** from code (`crm/application.controller.js` lines 146-153):
```javascript
INSERT INTO leads (
  lead_number, partner_id, parent_partner_id, created_by, customer_id,
  product_id, customer_name, mobile, city, status, process_type,
  otp_verified, source, pipeline_stage
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed', $10, TRUE, 'partner', 'submitted')
```

**Recommendation**:
1. **Update DATABASE_SCHEMA.md** to include all missing fields
2. **Verify actual database schema** matches the code usage
3. **Run migration** to add missing columns if they don't exist:

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_number VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS parent_partner_id UUID REFERENCES partner_profiles(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(15);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);
```

---

## High Priority Issues

### 3. Application Lookup Issue for LINKED SHARE Process

**Severity**: High  
**Impact**: Applications created via LINKED SHARE process may not be found by ID

**Issue**: The `getApplication` function in `application.controller.js` (line 1556) searches for applications using multiple fields, but the fallback logic for LINKED SHARE applications may not be working correctly.

**Current Query**:
```sql
WHERE a.id::text = $1 OR a.app_number = $1 OR a.tracking_token = $1 OR a.lead_id::text = $1 OR a.bank_application_number = $1 OR a.bank_ref_number = $1
```

**Problem**: For LINKED SHARE applications, the application is linked via `partner_share_links` table with a `tracking_token`. The current query checks `a.tracking_token` but LINKED SHARE applications store the tracking token in the `partner_share_links` table, not directly in the `applications` table.

**Evidence**: Code at lines 1588-1593 shows fallback logic for `physical_application_details` but not for `partner_share_links`.

**Recommendation**:
1. Add fallback query for `partner_share_links` table:
```javascript
if (!app) {
  const { rows: [pslRec] } = await query(`
    SELECT a.*
    FROM partner_share_links psl
    JOIN applications a ON a.id = psl.application_id
    WHERE psl.tracking_token = $1
  `, [id]);
  if (pslRec) app = pslRec;
}
```

2. Ensure `tracking_token` is properly set in the `applications` table when creating LINKED SHARE applications.

---

### 4. Inconsistent Application Number Generation

**Severity**: High  
**Impact**: Application numbers may not be unique or sequential

**Issue**: Two different methods are used to generate application numbers:

**Method 1** (used in `submitApplication` - line 161):
```javascript
const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
const appNumber = `APP${datePart}${nextval}`;
```

**Method 2** (used in helper function `generateAppNumber`):
```javascript
const generateAppNumber = () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APP${datePart}${rand}`;
};
```

**Problem**: 
- Method 1 uses a sequence (sequential, predictable)
- Method 2 uses random numbers (non-sequential, potential collisions)
- Both methods are used in different parts of the code

**Recommendation**:
1. **Standardize on Method 1** (sequence-based) for all application number generation
2. Remove the `generateAppNumber` helper function
3. Update all code to use the sequence-based approach

---

### 5. Missing `lead_id` in Applications Schema

**Severity**: High  
**Impact**: Cannot track which lead converted to which application

**Issue**: The `applications` table schema (TABLE 15) lists `lead_id` as a field, but it's not marked as a foreign key constraint in the schema documentation.

**Current Schema**:
```
| 3 | `customer_id` | UUID | FOREIGN KEY → customers(id), NOT NULL | Link to customer |
```

**Missing**:
- `lead_id` should be listed as a foreign key to `leads(id)`

**Evidence**: Code at line 172 shows `lead_id` being inserted:
```javascript
INSERT INTO applications
  (app_number, application_number, lead_id, customer_id, ...)
```

**Recommendation**:
1. Update DATABASE_SCHEMA.md to include `lead_id` field with proper foreign key constraint
2. Verify the actual database has the foreign key constraint

**Updated Schema Entry**:
```
| 3 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE SET NULL, NULLABLE | Link to originating lead |
| 4 | `customer_id` | UUID | FOREIGN KEY → customers(id), NOT NULL | Link to customer |
```

---

### 6. Duplicate `final_status` Field in Applications Table

**Severity**: High  
**Impact**: Confusion about which field to use for final status

**Issue**: The `applications` table has two fields that appear to serve similar purposes:
- Line 33: `final_status` - "Bank/ops outcome"
- Line 56: `final_status` - "Final status"

**Evidence**: The field is listed twice in the schema (lines 33 and 56).

**Recommendation**:
1. Remove the duplicate entry from DATABASE_SCHEMA.md
2. Verify the actual database only has one `final_status` column
3. Ensure all code references use the same field consistently

---

## Medium Priority Issues

### 7. Unused `tracking_id` Field in Applications

**Severity**: Medium  
**Impact**: Database bloat

**Issue**: The `applications` table has a `tracking_id` field (line 36) that is not used in any INSERT operations.

**Evidence**: No INSERT statements in the code include `tracking_id`.

**Recommendation**:
1. Verify if `tracking_id` is used anywhere in the codebase
2. If unused, remove the field from the database and schema
3. If used, document its purpose in the schema

---

### 8. Missing `team_member_id` in Applications Schema

**Severity**: Medium  
**Impact**: Cannot track team member involvement

**Issue**: Code at line 167 shows `team_member_id` being inserted into applications, but it's not listed in the schema.

**Evidence**:
```javascript
INSERT INTO applications
  (app_number, application_number, lead_id, customer_id, product_id, partner_id, parent_partner_id, team_member_id, ...)
```

**Recommendation**:
1. Add `team_member_id` to the schema:
```
| 8 | `team_member_id` | UUID | FOREIGN KEY → users(id), NULLABLE | Team member who processed |
```

---

### 9. Inconsistent Status Values

**Severity**: Medium  
**Impact**: Status filtering may not work correctly

**Issue**: Different parts of the code use different status values for the same concept:

**Application Status Values Found**:
- `submitted`
- `details_submitted`
- `pending`
- `under_review`
- `approved`
- `rejected`
- `cancelled`
- `link_sent`
- `verification_completed`
- `disbursed`
- `confirmed`
- `operational_verified`

**Problem**: Too many status values without clear documentation of the status flow.

**Recommendation**:
1. Create a documented status flow diagram
2. Standardize on a minimal set of status values
3. Add status transition validation in the code

---

## Low Priority Issues

### 10. Missing Indexes on Applications Table

**Severity**: Low  
**Impact**: Query performance

**Issue**: The applications table is missing indexes on frequently queried fields:
- `process_type` - Used in filtering
- `source` - Used in filtering
- `final_status` - Used in filtering

**Recommendation**:
```sql
CREATE INDEX IF NOT EXISTS idx_applications_process_type ON applications(process_type);
CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);
CREATE INDEX IF NOT EXISTS idx_applications_final_status ON applications(final_status);
```

---

### 11. Unused `commission_released` Field

**Severity**: Low  
**Impact**: Potential confusion

**Issue**: Code at line 893 sets `commission_released = TRUE`, but this field is not listed in the schema.

**Recommendation**:
1. Add `commission_released` to the schema:
```
| 57 | `commission_released` | BOOLEAN | DEFAULT FALSE | Commission released flag |
```

---

## Process Flow Analysis

### Application Process Flows

#### 1. Partner Punch Process
**Flow**: Partner creates application directly in portal
**Status Flow**: `details_submitted` → `under_review` → `approved`/`rejected`
**Process Type**: `partner_punching`
**Source**: `partner_portal`
**Status**: ✅ Working correctly

#### 2. Linked Share Process
**Flow**: Partner shares link → Customer fills form → Application created
**Status Flow**: `pending` → `details_submitted` → `under_review` → `approved`/`rejected`
**Process Type**: `linked_share`
**Source**: `share_link`
**Status**: ⚠️ Issue with application lookup (see Issue #3)

#### 3. Direct Bank Process
**Flow**: Partner redirects customer to bank website
**Status Flow**: `pending` → `approved`/`rejected`
**Process Type**: `direct_bank`
**Source**: `bank_redirect`
**Status**: ✅ Working correctly

#### 4. Physical Process
**Flow**: Partner generates physical form link → Customer fills form
**Status Flow**: `pending` → `details_submitted` → `operational_verified` → `approved`/`rejected`
**Process Type**: `physical_process`
**Source**: `physical`
**Status**: ✅ Working correctly

### Lead Process Flows

#### 1. Lead Creation
**Flow**: Partner creates lead → Lead stored → Can convert to application
**Status Flow**: `new` → `contacted` → `converted` → `rejected`
**Status**: ✅ Working correctly

#### 2. Lead to Application Conversion
**Flow**: Lead converted → Application created → Lead linked to application
**Status**: ✅ Working correctly

### Commission Process Flows

#### 1. Commission Credit
**Flow**: Application submitted → Commission calculated → Commission credited (on hold) → Commission released after approval
**Status**: ✅ Working correctly with hold/release mechanism

#### 2. Team Override Commission
**Flow**: Application approved → Team override commission calculated → Distributed to team members
**Status**: ✅ Working correctly

---

## Database Schema Recommendations

### Required Schema Updates

#### 1. Update `leads` Table Schema
Add the following fields to TABLE 20 in DATABASE_SCHEMA.md:

```markdown
| 15 | `lead_number` | VARCHAR(50) | UNIQUE, NULLABLE | Unique lead identifier |
| 16 | `parent_partner_id` | UUID | FOREIGN KEY → partner_profiles(id), NULLABLE | Parent partner |
| 17 | `created_by` | UUID | FOREIGN KEY → users(id), NULLABLE | Creator user |
| 18 | `customer_id` | UUID | FOREIGN KEY → customers(id), NULLABLE | Customer reference |
| 19 | `customer_email` | VARCHAR(255) | NULLABLE | Customer email |
| 20 | `customer_mobile` | VARCHAR(15) | NULLABLE | Customer mobile |
| 21 | `source` | VARCHAR(100) | NULLABLE | Lead source |
| 22 | `pipeline_stage` | VARCHAR(50) | NULLABLE | Pipeline stage |
| 23 | `priority` | VARCHAR(50) | NULLABLE | Lead priority |
| 24 | `tracking_token` | VARCHAR(100) | NULLABLE | Tracking token |
| 25 | `application_id` | UUID | FOREIGN KEY → applications(id), NULLABLE | Linked application |
```

#### 2. Update `applications` Table Schema
Add/Update the following fields in TABLE 15:

```markdown
| 3 | `lead_id` | UUID | FOREIGN KEY → leads(id) ON DELETE SET NULL, NULLABLE | Link to originating lead |
| 8 | `team_member_id` | UUID | FOREIGN KEY → users(id), NULLABLE | Team member who processed |
| 57 | `commission_released` | BOOLEAN | DEFAULT FALSE | Commission released flag |
```

Remove duplicate `final_status` entry (keep only at line 33).

#### 3. Remove Redundant Tables
Remove the following tables from DATABASE_SCHEMA.md after migration:
- TABLE 48: `direct_card_applications`
- TABLE 77: `loan_applications`
- TABLE 78: `insurance_applications`
- TABLE 79: `bank_card_applications`
- TABLE 81: `sbi_credit_card_applications`

---

## Migration Script

### Complete Migration to Fix All Issues

```sql
-- Step 1: Add missing fields to leads table
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS lead_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parent_partner_id UUID REFERENCES partner_profiles(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(15),
  ADD COLUMN IF NOT EXISTS source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50),
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(100),
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id);

-- Step 2: Add missing fields to applications table
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS commission_released BOOLEAN DEFAULT FALSE;

-- Step 3: Add missing indexes
CREATE INDEX IF NOT EXISTS idx_applications_process_type ON applications(process_type);
CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);
CREATE INDEX IF NOT EXISTS idx_applications_final_status ON applications(final_status);
CREATE INDEX IF NOT EXISTS idx_leads_tracking_token ON leads(tracking_token);

-- Step 4: Migrate data from redundant tables (if any data exists)
-- Note: Run these only after verifying data exists
-- INSERT INTO applications (...)
-- SELECT ... FROM direct_card_applications;

-- Step 5: Drop redundant tables (after confirming migration)
-- DROP TABLE IF EXISTS direct_card_applications;
-- DROP TABLE IF EXISTS loan_applications;
-- DROP TABLE IF EXISTS insurance_applications;
-- DROP TABLE IF EXISTS bank_card_applications;
-- DROP TABLE IF EXISTS sbi_credit_card_applications;
```

---

## Code Fixes Required

### 1. Fix Application Lookup for LINKED SHARE

**File**: `backend/src/modules/crm/application.controller.js`  
**Location**: After line 1593  
**Add**:

```javascript
if (!app) {
  const { rows: [pslRec] } = await query(`
    SELECT a.*
    FROM partner_share_links psl
    JOIN applications a ON a.id = psl.application_id
    WHERE psl.tracking_token = $1
  `, [id]);
  if (pslRec) app = pslRec;
}
```

### 2. Standardize Application Number Generation

**File**: `backend/src/utils/helpers/helpers.js`  
**Action**: Remove `generateAppNumber` function and update all calls to use sequence-based generation

### 3. Update Application Insert to Include All Fields

**File**: `backend/src/modules/crm/application.controller.js`  
**Action**: Ensure all INSERT statements include `team_member_id` and `commission_released` where applicable

---

## Testing Checklist

After implementing fixes, verify:

- [ ] All application process flows work correctly
- [ ] LINKED SHARE applications can be retrieved by ID
- [ ] Lead to application conversion works
- [ ] Commission hold/release mechanism works
- [ ] Team override commission distribution works
- [ ] No duplicate application numbers are generated
- [ ] All database foreign key constraints are valid
- [ ] All indexes are created and used by queries
- [ ] Redundant tables are safely removed after migration

---

## Conclusion

The audit identified several critical issues that need immediate attention:

1. **Redundant application tables** should be consolidated to avoid data fragmentation
2. **Missing fields in leads table** need to be added to match code usage
3. **Application lookup for LINKED SHARE** needs to be fixed
4. **Application number generation** should be standardized

The recommended actions will improve data integrity, reduce maintenance overhead, and ensure all process flows work correctly.

---

**Report Generated By**: Cascade AI Assistant  
**Audit Date**: August 25, 2026  
**Next Review Date**: September 25, 2026
