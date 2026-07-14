# Wallet Module Analysis Report

**Date**: July 14, 2026  
**Project**: GharKaPaisa  
**Module**: Wallet & Commission System

---

## Executive Summary

The wallet module is functionally complete with core features implemented, but has several areas requiring improvement including code organization, missing security features, and incomplete documentation of some advanced features.

---

## File Structure Analysis

### Backend Files
```
backend/src/modules/wallet/
├── controller.js (1501 lines) - ⚠️ Too large
├── service.js (821 lines) - ✅ Well-structured
├── route.js (54 lines) - ✅ Clean
├── constants.js (3 lines) - ❌ Empty stub
├── dto.js (3 lines) - ❌ Empty stub
├── middleware.js (45 bytes) - ❌ Empty stub
└── repository.js (45 bytes) - ❌ Empty stub
```

### Frontend Files
```
frontend/src/modules/partner/wallet/
└── PartnerWallet.jsx (86,710 bytes) - ⚠️ Very large component

frontend/src/modules/super-admin/wallet/
└── ManageWallet.jsx (12,453 bytes) - ✅ Reasonable size

frontend/src/services/
└── wallet.api.js - ✅ API client

frontend/src/app/store/
└── walletStore.js - ✅ State management
```

---

## Critical Issues Found

### 1. **Controller Size Issue** (HIGH PRIORITY)
**Location**: `backend/src/modules/wallet/controller.js` (1501 lines)

**Issue**: Controller file is too large and handles too many responsibilities:
- Wallet operations
- Bank details management
- Withdrawal processing
- OTP handling
- Export functionality
- Razorpay webhook handling
- Bank verification

**Impact**: 
- Difficult to maintain
- Hard to test
- Violates Single Responsibility Principle

**Recommendation**: Split into separate controllers:
- `wallet.controller.js` - Core wallet operations
- `bank-details.controller.js` - Bank management
- `withdrawal.controller.js` - Withdrawal operations
- `export.controller.js` - Export functionality
- `webhook.controller.js` - Razorpay webhook

---

### 2. **Missing Export in Service** (HIGH PRIORITY)
**Location**: `backend/src/modules/wallet/service.js` line 809

**Issue**: `syncWalletBalance` function is used in controller but not exported from service.js

**Current Code**:
```javascript
module.exports = {
  ensureWallet,
  creditHold,
  releaseHold,
  debitAvailable,
  creditCommission,
  releaseCommission,
  processWithdrawal,
  getWalletSummary,
  releaseMaturedCommissions,
  adminAdjustWallet
  // syncWalletBalance is missing!
};
```

**Impact**: Controller imports fail at runtime

**Fix**:
```javascript
module.exports = {
  ensureWallet,
  creditHold,
  releaseHold,
  debitAvailable,
  creditCommission,
  releaseCommission,
  processWithdrawal,
  getWalletSummary,
  releaseMaturedCommissions,
  adminAdjustWallet,
  syncWalletBalance  // Add this
};
```

---

### 3. **Security Issue - OTP Exposure** (HIGH PRIORITY)
**Location**: `backend/src/modules/wallet/controller.js` line 910

**Issue**: OTP is exposed in development mode response

**Current Code**:
```javascript
return success(res, { 
  email_sent_to: maskedEmail, 
  dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined 
}, `OTP sent to ${maskedEmail}`);
```

**Impact**: OTP exposure even in non-production environments can be a security risk

**Recommendation**: Remove OTP from response entirely, use only for logging

---

### 4. **Missing Rate Limiting** (HIGH PRIORITY)
**Location**: `backend/src/modules/wallet/route.js` line 41

**Issue**: Withdrawal OTP endpoint has no rate limiting

**Current Code**:
```javascript
router.post('/withdraw/otp/send', requireApprovedPartnerOrAdmin, walletCtrl.sendWithdrawalOTP);
```

**Impact**: Vulnerable to OTP spam attacks

**Recommendation**: Add rate limiting middleware:
```javascript
const rateLimit = require('express-rate-limit');

const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTPs per 15 minutes
  message: 'Too many OTP requests, please try again later'
});

router.post('/withdraw/otp/send', otpRateLimit, requireApprovedPartnerOrAdmin, walletCtrl.sendWithdrawalOTP);
```

---

### 5. **Race Condition in Withdrawal** (MEDIUM PRIORITY)
**Location**: `backend/src/modules/wallet/controller.js` lines 350-356

**Issue**: Pending withdrawal check happens outside transaction lock

**Current Code**:
```javascript
const { rows: pending } = await client.query(
  `SELECT id FROM wallet_withdrawals WHERE partner_id = $1 AND status = 'pending'`, [PartnerId]
);
if (pending.length) {
  await client.query('ROLLBACK');
  return error(res, 'A withdrawal request is already pending');
}
```

**Impact**: Race condition - two simultaneous requests could both pass this check

**Recommendation**: Move check inside transaction with FOR UPDATE lock

---

### 6. **Missing Input Validation** (MEDIUM PRIORITY)
**Location**: Multiple locations in controller.js

**Issues**:
- Bank account number format not validated
- IFSC code format not validated
- UPI ID format not validated
- Amount precision not validated

**Recommendation**: Add validation middleware:
```javascript
const validateBankAccount = (req, res, next) => {
  const { account_number, ifsc_code, upi_id } = req.body;
  
  if (account_number && !/^\d{9,18}$/.test(account_number.replace(/\s/g, ''))) {
    return error(res, 'Invalid account number format');
  }
  
  if (ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code.toUpperCase())) {
    return error(res, 'Invalid IFSC code format');
  }
  
  if (upi_id && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) {
    return error(res, 'Invalid UPI ID format');
  }
  
  next();
};
```

---

### 7. **Missing Audit Logging** (MEDIUM PRIORITY)
**Location**: Several critical operations lack audit logging

**Missing Audit Logs**:
- Bank details changes (except primary)
- Withdrawal cancellation
- Withdrawal retry
- Bank verification attempts

**Recommendation**: Add audit logging for all sensitive operations

---

### 8. **Duplicate Code Patterns** (LOW PRIORITY)
**Location**: Multiple functions in controller.js

**Issue**: Similar patterns repeated:
- Partner ID resolution logic (lines 32-41, 131-137, 862-869, 919-924)
- Account number decryption (lines 230-236, 472-476, 704-710, 1083-1085, 1123-1127, 1147-1151)

**Recommendation**: Extract to helper functions

---

## Missing Features/Modules

### 1. **TDS Certificate Generation** (HIGH PRIORITY)
**Status**: Not implemented

**Required**: 
- Financial year-wise TDS calculation
- PDF certificate generation
- Download endpoint
- TDS rate configuration

**Reference**: Algorithm 13.22 in PROCESS_ALGORITHMS.md

---

### 2. **Payout Receipt Download** (HIGH PRIORITY)
**Status**: Partially implemented

**Missing**:
- Receipt template
- UTR display
- Receipt download endpoint
- Receipt history

**Reference**: Algorithm 13.21 in PROCESS_ALGORITHMS.md

---

### 3. **Withdrawal History Timeline** (MEDIUM PRIORITY)
**Status**: Not implemented

**Required**:
- Timeline visualization
- Status change history
- Monthly breakdown
- Status filters

**Reference**: Algorithm 13.19 in PROCESS_ALGORITHMS.md

---

### 4. **Commission Breakup Per Application** (MEDIUM PRIORITY)
**Status**: Not implemented

**Required**:
- API endpoint for commission breakup
- Multi-tier commission split display
- Parent override information
- GST/TDS breakdown

**Reference**: Algorithm 13.15 in PROCESS_ALGORITHMS.md

---

### 5. **Duplicate Withdrawal Prevention** (HIGH PRIORITY)
**Status**: Partially implemented

**Current**: Only checks for pending withdrawals

**Missing**:
- Amount pattern detection
- Time-based duplicate prevention
- Frequency limits
- Suspicious pattern detection

**Reference**: Algorithm 13.23 in PROCESS_ALGORITHMS.md

---

### 6. **Daily/Weekly Withdrawal Limits** (MEDIUM PRIORITY)
**Status**: Not implemented

**Required**:
- Configurable daily limit
- Configurable weekly limit
- Limit reset after period
- Limit override for admins

---

### 7. **Withdrawal Remarks Field** (LOW PRIORITY)
**Status**: Not implemented

**Required**:
- Remarks field in withdrawal request
- Remarks display in admin panel
- Remarks in receipt

---

### 8. **Wallet Notifications Integration** (MEDIUM PRIORITY)
**Status**: Partially implemented

**Current**: Basic notifications for commission credit and withdrawal

**Missing**:
- Bank verification notifications
- Withdrawal status change notifications
- Low balance alerts
- Hold release notifications

**Reference**: Algorithm 13.17 in PROCESS_ALGORITHMS.md

---

### 9. **Security Dashboard Integration** (MEDIUM PRIORITY)
**Status**: Not implemented

**Required**:
- Wallet security score
- Recent login display
- Device management integration
- Security alerts for wallet

**Reference**: Section 20 in PROCESS_ALGORITHMS.md

---

### 10. **Empty Stub Files** (LOW PRIORITY)
**Status**: constants.js, dto.js, middleware.js, repository.js are empty

**Recommendation**: Either implement or remove these files

---

## Code Quality Issues

### 1. **Inconsistent Error Handling**
- Some functions use try-catch with proper error handling
- Others rely on middleware
- Error messages are inconsistent

### 2. **Magic Numbers**
- Hard-coded values like 48 hours (line 733)
- Hard-coded TDS rate 5% (line 23)
- Hard-coded withdrawal limits ₹100-₹50,000

**Recommendation**: Move to configuration

### 3. **SQL Injection Risk**
- Most queries use parameterized queries ✅
- Some dynamic query building exists ⚠️

### 4. **Transaction Management**
- Generally well-handled ✅
- Some transactions could be more granular

---

## Database Schema Issues

### Missing Tables/Columns
1. `partner_settlements` - Referenced but may not exist
2. `bank_details_history` - Referenced but may not exist
3. `blacklisted_tokens` - Referenced in security middleware but may not exist

### Index Recommendations
- Add index on `wallet_ledger(partner_id, created_at)`
- Add index on `wallet_withdrawals(partner_id, status, created_at)`
- Add composite index on `wallet_ledger(partner_id, status)`

---

## Performance Issues

### 1. **N+1 Query Problem**
**Location**: `getTransactions` function (lines 83-120)

**Issue**: Multiple joins in single query, but could be optimized

**Recommendation**: Consider query optimization for large datasets

### 2. **Missing Caching**
**Location**: `getWalletSummary` function

**Issue**: Wallet summary queried frequently without caching

**Recommendation**: Implement Redis caching for wallet summary

---

## Security Recommendations

### 1. **Implement Refresh Token Rotation**
**Status**: Not implemented

**Reference**: Algorithm 20.4 in PROCESS_ALGORITHMS.md

### 2. **Add Login History Tracking**
**Status**: Not implemented

**Reference**: Algorithm 20.1 in PROCESS_ALGORITHMS.md

### 3. **Add Device Management**
**Status**: Not implemented

**Reference**: Algorithm 20.2 in PROCESS_ALGORITHMS.md

### 4. **Add Account Lock After Failed Attempts**
**Status**: Not implemented

**Reference**: Algorithm 20.6 in PROCESS_ALGORITHMS.md

### 5. **Add Suspicious Login Detection**
**Status**: Not implemented

**Reference**: Algorithm 20.7 in PROCESS_ALGORITHMS.md

---

## Testing Recommendations

### Missing Tests
1. Unit tests for service functions
2. Integration tests for withdrawal flow
3. Edge case tests (insufficient balance, concurrent withdrawals)
4. Webhook handling tests
5. Export functionality tests

### Test Coverage Goals
- Service layer: 80%+
- Controller layer: 70%+
- Critical paths: 90%+

---

## Documentation Issues

### 1. **Missing JSDoc Comments**
- Most functions lack documentation
- Parameters not documented
- Return values not documented

### 2. **Missing API Documentation**
- No OpenAPI/Swagger specs
- Request/response examples missing

---

## Priority Action Items

### Immediate (This Week)
1. ✅ Fix missing `syncWalletBalance` export
2. ✅ Add rate limiting to OTP endpoint
3. ✅ Remove OTP from response
4. ✅ Fix race condition in withdrawal

### High Priority (This Month)
1. Implement TDS certificate generation
2. Implement payout receipt download
3. Add duplicate withdrawal prevention
4. Split controller into smaller files
5. Add comprehensive audit logging

### Medium Priority (Next Quarter)
1. Implement withdrawal history timeline
2. Implement commission breakup API
3. Add daily/weekly withdrawal limits
4. Implement security dashboard integration
5. Add comprehensive testing

### Low Priority (Future)
1. Refactor duplicate code
2. Add caching layer
3. Implement empty stub files or remove them
4. Add JSDoc documentation
5. Create OpenAPI specs

---

## Conclusion

The wallet module is functionally sound with core features working correctly. However, it requires significant refactoring for maintainability, security hardening, and implementation of advanced features documented in the process algorithms. The most critical issues are the missing export, security vulnerabilities, and the oversized controller file.

**Overall Assessment**: 7/10 - Functional but needs improvement

**Estimated Effort to Complete**: 40-60 developer days

---

**Report Generated By**: Cascade AI Assistant  
**Analysis Date**: July 14, 2026
