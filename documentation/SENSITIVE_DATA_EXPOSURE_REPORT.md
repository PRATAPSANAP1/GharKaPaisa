# Sensitive Data Exposure Report

**Date**: August 24, 2026  
**Project**: GharKaPaisa - Financial Services Platform  
**Analysis Scope**: API responses, error messages, frontend/mobile display

---

## Executive Summary

This report identifies sensitive data that is currently exposed to users through API responses, error messages, and other user-facing content. These exposures pose security risks and should be addressed to protect user privacy and prevent data leakage.

### Risk Level Summary
- **Critical**: 2 issues
- **High**: 3 issues
- **Medium**: 2 issues
- **Low**: 1 issue

---

## Critical Issues

### 1. Full Bank Account Numbers Exposed in API Responses

**Location**: `backend/src/modules/wallet/controller.js`

**Severity**: Critical  
**Impact**: Complete bank account numbers exposed to users and admins

**Affected Endpoints**:

#### a. GET /wallet/bank-details (Line 249-268)
```javascript
const { rows: [bank] } = await query(`
  SELECT id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_verified 
  FROM partner_bank_details 
  WHERE partner_id = $1
`, [PartnerId]);

// Decrypt if encrypted
if (bank.account_number && bank.account_number.includes(':')) {
  try {
    bank.account_number = decrypt(bank.account_number);  // ⚠️ FULL ACCOUNT NUMBER EXPOSED
  } catch (decErr) {
    logger.warn('Failed to decrypt account number:', decErr.message);
  }
}

return success(res, bank);  // ⚠️ Returns full account number
```

**Issue**: The endpoint decrypts and returns the complete bank account number to the partner viewing their own bank details.

**Recommendation**: Mask account numbers showing only last 4 digits (e.g., "XXXX1234")

---

#### b. GET /wallet/bank-details/all (Lines 1252-1280)
```javascript
const { rows } = await query(`
  SELECT
    pp.id as partner_id,
    pp.partner_code,
    pp.first_name,
    pp.last_name,
    u.email,
    u.mobile,
    bd.id,
    bd.account_holder_name,
    bd.bank_name,
    bd.account_number,  // ⚠️ SELECTED
    bd.ifsc_code,
    bd.upi_id,
    bd.is_verified,
    bd.is_primary,
    bd.created_at
  FROM partner_bank_details bd
  JOIN partner_profiles pp ON bd.partner_id = pp.id
  JOIN users u ON pp.user_id = u.id
  ORDER BY pp.created_at DESC
`);

const processed = rows.map(r => {
  if (r.account_number && r.account_number.includes(':')) {
    try { r.account_number = decrypt(r.account_number); } catch (_) {}  // ⚠️ FULL ACCOUNT NUMBER EXPOSED
  }
  return r;
});

return success(res, processed);  // ⚠️ Returns full account numbers to admins/employees
```

**Issue**: Admin and employee roles can view complete bank account numbers of all partners.

**Recommendation**: 
- Mask account numbers for all roles except SUPER_ADMIN
- Implement audit logging for SUPER_ADMIN access to full account numbers
- Consider requiring additional authentication for viewing full account numbers

---

#### c. GET /wallet/withdrawals/:id (Lines 1235-1237)
```javascript
if (wr.account_number && wr.account_number.includes(':')) {
  try { wr.account_number = decrypt(wr.account_number); } catch (_) {}  // ⚠️ FULL ACCOUNT NUMBER EXPOSED
}

return success(res, wr);  // ⚠️ Returns full account number
```

**Issue**: Withdrawal details include complete bank account numbers.

**Recommendation**: Mask account numbers in withdrawal responses

---

#### d. GET /wallet/bank-details (Partner Self-View) (Lines 1292-1304)
```javascript
const { rows } = await query(`
  SELECT id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_verified, is_primary, created_at, updated_at
  FROM partner_bank_details
  WHERE partner_id = $1
  ORDER BY is_primary DESC, created_at ASC
`, [partnerId]);

const processed = rows.map(r => {
  if (r.account_number && r.account_number.includes(':')) {
    try { r.account_number = decrypt(r.account_number); } catch (_) {}  // ⚠️ FULL ACCOUNT NUMBER EXPOSED
  }
  return r;
});
```

**Issue**: Partners can view their complete account numbers when listing their bank details.

**Recommendation**: Mask account numbers showing only last 4 digits

---

### 2. SQL Queries and Parameters Logged to Console

**Location**: `backend/src/config/database.js` (Lines 50-57)

**Severity**: Critical  
**Impact**: SQL queries and parameters exposed in console logs

**Code**:
```javascript
console.error("\n================ SQL ERROR ================");
console.error("SQL:");
console.error(text);  // ⚠️ SQL QUERY EXPOSED
console.error("\nParameters:");
console.dir(params, { depth: null });  // ⚠️ QUERY PARAMETERS EXPOSED
console.error("\nPostgres Error:");
console.error(err);  // ⚠️ DATABASE ERROR EXPOSED
console.error("===========================================\n");
```

**Issue**: SQL queries and their parameters are logged to the console, which may include sensitive data like passwords, PII, or financial information.

**Recommendation**:
1. Remove console.error statements entirely
2. Use the existing logger for all error logging
3. Implement parameter masking for sensitive fields before logging
4. Ensure logs are not accessible to end users

---

## High Priority Issues

### 3. Stack Traces Exposed in Development Mode

**Location**: `backend/src/middleware/error/error.middleware.js` (Line 63)

**Severity**: High  
**Impact**: Stack traces exposed in development mode, potentially in production if NODE_ENV misconfigured

**Code**:
```javascript
if (process.env.NODE_ENV === 'development') {
  return res.status(500).json({ 
    success: false, 
    message: err.message, 
    stack: err.stack  // ⚠️ STACK TRACE EXPOSED
  });
}
```

**Issue**: Stack traces are returned in API responses in development mode. If NODE_ENV is accidentally set to 'development' in production, this exposes internal implementation details.

**Recommendation**:
1. Remove stack traces from API responses entirely
2. Log stack traces server-side only
3. Use environment-specific logging levels instead of response content
4. Consider adding a separate debug endpoint that requires authentication

---

### 4. Database Error Messages Exposed to Users

**Location**: `backend/src/middleware/error/error.middleware.js` (Line 42)

**Severity**: High  
**Impact**: Database-specific error messages exposed to users

**Code**:
```javascript
if (err.code === '22P02') {  // invalid UUID
  return error(res, `Invalid ID format: ${err.message}`, 400);  // ⚠️ DB ERROR MESSAGE EXPOSED
}
```

**Issue**: Raw database error messages are included in API responses, potentially exposing internal database structure.

**Recommendation**:
1. Use generic error messages for users
2. Log detailed error messages server-side
3. Map database error codes to user-friendly messages

---

### 5. Partner Profile Account Number Exposure

**Location**: `backend/src/modules/partner/partner.controller.js` (Lines 38-50)

**Severity**: High  
**Impact**: Account numbers exposed in partner profile endpoint

**Code**:
```javascript
// Decrypt bank account number
if (Partner && Partner.account_number) {
  const { decrypt } = require('../../utils/helpers/crypto');
  try {
    const decrypted = decrypt(Partner.account_number);
    if (shouldMask) {
      Partner.account_number = 'HIDDEN';  // ✅ GOOD: Masks for non-super-admins
    } else {
      Partner.account_number = decrypted;  // ⚠️ EXPOSED for super-admins
    }
  } catch (err) {
    logger.error('Failed to decrypt bank account number:', err.message);
  }
}
```

**Issue**: While there is masking logic, super-admins can still view complete account numbers without audit logging.

**Recommendation**:
1. Implement audit logging for all super-admin access to full account numbers
2. Consider requiring additional authentication for viewing full account numbers
3. Implement time-limited access to sensitive data

---

## Medium Priority Issues

### 6. Email Addresses Not Masked in Some Responses

**Location**: Various API endpoints

**Severity**: Medium  
**Impact**: Email addresses exposed in API responses

**Examples**:
- `backend/src/modules/auth/controller.js` (Line 69): Returns full email in `/auth/me`
- `backend/src/modules/partner/partner.controller.js` (Line 15): Returns full email in partner profile

**Current Good Practice**:
```javascript
const maskEmail = (email) => {
  const at = email.indexOf('@');
  if (at <= 1) return email;
  return email[0] + '*'.repeat(Math.min(at - 1, 6)) + email.slice(at);  // ✅ GOOD: Masks email
};
```

**Issue**: While a maskEmail function exists, it's not consistently used across all endpoints.

**Recommendation**:
1. Consistently apply email masking in all API responses
2. Implement a response middleware that automatically masks PII
3. Create a whitelist of roles that can view unmasked data

---

### 7. Mobile Numbers Not Masked in Some Responses

**Location**: Various API endpoints

**Severity**: Medium  
**Impact**: Mobile numbers exposed in API responses

**Examples**:
- `backend/src/modules/auth/controller.js` (Line 69): Returns full mobile in `/auth/me`
- `backend/src/modules/partner/partner.controller.js` (Line 15): Returns full mobile in partner profile

**Issue**: Mobile numbers are returned without masking in many endpoints.

**Recommendation**:
1. Implement mobile number masking (e.g., "+91*****1234")
2. Apply masking consistently across all endpoints
3. Implement role-based access to unmasked mobile numbers

---

## Low Priority Issues

### 8. Internal IDs Exposed in URLs

**Location**: Various API endpoints

**Severity**: Low  
**Impact**: Database UUIDs exposed in URLs and API responses

**Examples**:
- `/Partners/:PartnerId/profile`
- `/wallet/withdrawals/:id`
- `/applications/:id`

**Issue**: Database UUIDs are exposed in URLs, which could be used for enumeration attacks.

**Recommendation**:
1. Consider使用 short, non-guessable IDs for public URLs
2. Implement rate limiting on ID-based endpoints
3. Add access control checks on all ID-based endpoints

---

## Positive Security Practices Found

### ✅ Good Practices Identified

1. **Account Number Masking in Auth Controller** (`backend/src/modules/auth/controller.js` lines 85-89):
```javascript
if (user.account_number) {
  const decrypted = decrypt(user.account_number);
  user.account_number_last4 = decrypted.slice(-4);  // ✅ GOOD
  user.account_number = 'XXXX' + decrypted.slice(-4);  // ✅ GOOD
}
```

2. **Email Masking Function Implemented**:
```javascript
const maskEmail = (email) => {
  const at = email.indexOf('@');
  if (at <= 1) return email;
  return email[0] + '*'.repeat(Math.min(at - 1, 6)) + email.slice(at);  // ✅ GOOD
};
```

3. **Privacy Mode for Admin Views** (`backend/src/modules/partner/partner.controller.js` lines 24-36):
```javascript
const shouldMask = (isAdmin && isPrivacyOn) || (!isSuperAdmin && !isAdmin) || isTeamMemberViewingPartner || isPartnerViewingTeamMember;  // ✅ GOOD
```

4. **Encryption at Rest**:
- Bank account numbers are encrypted using AES-256-GCM
- Encryption/decryption utilities implemented

5. **Environment-Based Error Handling**:
- Stack traces only shown in development mode
- Generic error messages in production

---

## Recommendations Summary

### Immediate Actions (Critical)

1. **Mask All Bank Account Numbers in API Responses**
   - Implement consistent masking showing only last 4 digits
   - Apply to all wallet endpoints
   - Add audit logging for super-admin access to full numbers

2. **Remove Console Logging of SQL Queries**
   - Remove all console.error statements from database.js
   - Use logger only for server-side logging
   - Implement parameter masking for sensitive fields

### Short-term Actions (High Priority)

3. **Remove Stack Traces from API Responses**
   - Never include stack traces in API responses
   - Log stack traces server-side only
   - Implement separate debug endpoint if needed

4. **Generic Error Messages**
   - Replace database-specific error messages with generic ones
   - Log detailed errors server-side
   - Map error codes to user-friendly messages

5. **Audit Logging for Sensitive Data Access**
   - Log all super-admin access to full account numbers
   - Log all admin access to unmasked PII
   - Implement time-limited access tokens

### Medium-term Actions (Medium Priority)

6. **Consistent PII Masking**
   - Implement response middleware for automatic PII masking
   - Apply email masking consistently
   - Apply mobile number masking consistently

7. **Role-Based Data Access**
   - Define clear data access rules per role
   - Implement data access policies
   - Regular access audits

### Long-term Actions (Low Priority)

8. **ID Obfuscation**
   - Consider using short, non-guessable IDs for public URLs
   - Implement rate limiting on ID-based endpoints
   - Add access control checks

---

## Data Classification Guidelines

### Sensitive Data (Never Expose)
- Complete bank account numbers
- Passwords (even hashed)
- Encryption keys
- API keys
- OTP secrets

### Personal Identifiable Information (PII) (Mask by Default)
- Email addresses (mask: a***@domain.com)
- Mobile numbers (mask: +91*****1234)
- PAN numbers (mask: *****ABCD)
- Aadhaar numbers (mask: ****-****-1234)
- Full addresses (mask: show city/state only)

### Financial Information (Restrict Access)
- Complete wallet balances (show only to owner)
- Transaction details (show only to owner)
- Commission details (show only to owner)
- Bank details (mask account numbers)

### Internal Data (Never Expose)
- Database IDs (use public IDs where possible)
- Internal status codes
- Error stack traces
- SQL queries
- System configuration

---

## Implementation Priority Matrix

| Issue | Severity | Effort | Priority |
|-------|----------|--------|----------|
| Bank account number exposure | Critical | Medium | P0 |
| SQL query logging | Critical | Low | P0 |
| Stack trace exposure | High | Low | P1 |
| DB error messages | High | Medium | P1 |
| Partner profile exposure | High | Medium | P1 |
| Email masking | Medium | Medium | P2 |
| Mobile masking | Medium | Medium | P2 |
| ID exposure | Low | High | P3 |

---

## Conclusion

The GharKaPaisa application has several critical and high-priority issues regarding sensitive data exposure. The most concerning is the exposure of complete bank account numbers in multiple API endpoints. While the application implements good practices like encryption at rest and some masking logic, these need to be consistently applied across all endpoints.

Immediate attention should be focused on:
1. Masking all bank account numbers in API responses
2. Removing console logging of SQL queries
3. Implementing audit logging for sensitive data access

The application shows good security awareness with encryption and some masking, but needs consistent implementation across all endpoints to fully protect user data.

---

**Report Generated By**: Cascade AI Assistant  
**Analysis Date**: August 24, 2026  
**Next Review Date**: September 24, 2026
