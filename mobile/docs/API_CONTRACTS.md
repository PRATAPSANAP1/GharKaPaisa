# API Contracts Documentation

This document documents all verified backend APIs used by the GharKaPaisa mobile application.

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [KYC Operator APIs](#kyc-operator-apis)
3. [Admin Queue APIs](#admin-queue-apis)
4. [Application Action APIs](#application-action-apis)
5. [Operator History & Timeline APIs](#operator-history--timeline-apis)
6. [Error Codes](#error-codes)

---

## Authentication APIs

### POST /auth/login
Authenticate user with OTP.

**Request:**
```json
{
  "identity": "string", // email or mobile
  "otp": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "mobile": "string",
    "role": "string",
    "designation": "string",
    "full_name": "string"
  }
}
```

**Errors:**
- 400: Invalid OTP or identity
- 401: Authentication failed
- 429: Too many attempts

---

### POST /auth/refresh
Refresh access token using refresh token (HttpOnly cookie).

**Request:**
- Body: Empty (uses HttpOnly cookie)
- Headers: `withCredentials: true`

**Response (200):**
```json
{
  "success": true,
  "token": "string",
  "refreshToken": "string"
}
```

**Errors:**
- 401: Refresh token expired or invalid

---

### GET /auth/me
Get current authenticated user profile.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "mobile": "string",
    "role": "string",
    "designation": "string",
    "full_name": "string",
    "permissions": {}
  }
}
```

**Errors:**
- 401: Unauthorized

---

## KYC Operator APIs

### GET /kyc-operator/applications
List KYC-eligible applications for the logged-in operator.

**Authorization:** KYC Operator designation OR Super Admin

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `bank_id` (string, optional): Filter by bank
- `status` (string, optional): Filter by status
- `search` (string, optional): Search query

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "app_number": "string",
      "customer_name": "string",
      "customer_mobile": "string",
      "pan_number": "string",
      "bank_application_number": "string",
      "kyc_status": "PENDING",
      "kyc_remarks": "string",
      "kyc_stage": "string",
      "vkyc_stage": "string",
      "bio_stage": "string",
      "digilocker_stage": "string",
      "soft_approval_status": "string",
      "vkyc_link": "string",
      "user_remark": "string",
      "last_operator_name": "string",
      "last_operator_code": "string",
      "product_name": "string",
      "bank_name": "string",
      "created_at": "ISO8601"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Errors:**
- 403: Access denied (not KYC Operator or Super Admin)
- 401: Unauthorized

---

### GET /kyc-operator/applications/:id
Get specific KYC application details with operator history.

**Authorization:** KYC Operator designation OR Super Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "app_number": "string",
    "customer_name": "string",
    "customer_mobile": "string",
    "pan_number": "string",
    "bank_application_number": "string",
    "kyc_status": "PENDING",
    "kyc_remarks": "string",
    "kyc_stage": "string",
    "vkyc_stage": "string",
    "bio_stage": "string",
    "digilocker_stage": "string",
    "soft_approval_status": "string",
    "vkyc_link": "string",
    "user_remark": "string",
    "product_name": "string",
    "bank_name": "string",
    "documents": [],
    "operator_history": [
      {
        "id": "uuid",
        "operator_name": "string",
        "operator_code": "string",
        "operator_role": "string",
        "operator_designation": "string",
        "action_type": "KYC_VERIFIED",
        "field_changes": {},
        "notes": "string",
        "created_at": "ISO8601"
      }
    ]
  }
}
```

**Errors:**
- 403: Access denied (soft approval declined)
- 404: Application not found
- 401: Unauthorized

---

### POST /kyc-operator/applications/:id/verify
Verify KYC for an application.

**Authorization:** KYC Operator designation OR Super Admin

**Request:**
```json
{
  "remarks": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "KYC status updated to VERIFIED successfully."
}
```

**Errors:**
- 400: Invalid request
- 403: Access denied
- 404: Application not found
- 401: Unauthorized

---

### POST /kyc-operator/applications/:id/reject
Reject KYC for an application.

**Authorization:** KYC Operator designation OR Super Admin

**Request:**
```json
{
  "remarks": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "KYC status updated to REJECTED successfully."
}
```

**Errors:**
- 400: Remarks required
- 403: Access denied
- 404: Application not found
- 401: Unauthorized

---

### POST /kyc-operator/applications/:id/request-information
Request additional information for KYC.

**Authorization:** KYC Operator designation OR Super Admin

**Request:**
```json
{
  "remarks": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Information request sent successfully."
}
```

**Errors:**
- 400: Invalid request
- 403: Access denied
- 404: Application not found
- 401: Unauthorized

---

### POST /kyc-operator/applications/:id/update-stage
Update KYC stage information.

**Authorization:** KYC Operator designation OR Super Admin

**Request:**
```json
{
  "kyc_stage": "string",
  "vkyc_stage": "string",
  "bio_stage": "string",
  "digilocker_stage": "string",
  "notes": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "KYC stage updated successfully."
}
```

**Errors:**
- 400: Invalid request
- 403: Access denied
- 404: Application not found
- 401: Unauthorized

---

## Admin Queue APIs

### GET /applications/admin/applications
List applications for admin operators (PAN, QD, Remark, Final Status).

**Authorization:** ADMIN, SUPER_ADMIN, OPERATIONAL_HEAD, ADMINISTRATIVE_OPERATOR, PAN_CHECKER, REMARK_OPERATOR, QD_OPERATOR, FINAL_STATUS_OPERATOR

**Note:** Backend applies designation-based SQL filters automatically.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (string, optional): Filter by status
- `bank_id` (string, optional): Filter by bank
- `product_id` (string, optional): Filter by product
- `search` (string, optional): Search query
- `process_by` (string, optional): Filter by process type
- `operation_head_id` (string, optional): Filter by operation head
- `category` (string, optional): Filter by category
- `commission_status` (string, optional): Filter by commission status
- `from_date` (string, optional): Filter from date
- `to_date` (string, optional): Filter to date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "app_number": "string",
      "customer_name": "string",
      "customer_mobile": "string",
      "pan_number": "string",
      "bank_application_number": "string",
      "bank_name": "string",
      "product_name": "string",
      "status": "string",
      "final_status": "string",
      "dispatch_status": "string",
      "last_operator_name": "string",
      "last_operator_code": "string",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**Errors:**
- 403: Access denied
- 401: Unauthorized

---

### GET /applications/super-admin/applications
Super Admin applications list (same as admin/applications).

**Authorization:** SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD, ADMINISTRATIVE_OPERATOR, PAN_CHECKER, REMARK_OPERATOR, QD_OPERATOR, FINAL_STATUS_OPERATOR

**Query Parameters:** Same as /applications/admin/applications

**Response:** Same as /applications/admin/applications

---

### GET /applications/remark-operator/dashboard
Remark operator specific dashboard.

**Authorization:** ADMIN, SUPER_ADMIN

**Query Parameters:** Same as /applications/admin/applications

**Response:** Same as /applications/admin/applications

---

## Application Action APIs

### PUT /applications/:id/bank-status
Update bank processing status (used by PAN, QD, Final Status operators).

**Authorization:** PARTNER, TEAM_MEMBER, ADMIN, SUPER_ADMIN
**Additional for final_status:** OPERATIONS_HEAD, ADMIN, SUPER_ADMIN, ADMINISTRATIVE_OPERATOR, FINAL_STATUS_OPERATOR

**Request:**
```json
{
  "status": "string",
  "bank_ref_number": "string",
  "bank_application_number": "string",
  "vkyc_stage": "string",
  "iqa_stage": "string",
  "dispatch_status": "string",
  "bank_remark": "string",
  "final_status": "string",
  "decline_reason": "string",
  "eligible_reqd": "string",
  "app_file_generated": "string",
  "ipa_stage": "string",
  "kyc_stage": "string",
  "card_approval_stage": "string",
  "digital_card_issued": "string",
  "income_details": "string",
  "mail_status": "string",
  "pan_check": "string",
  "qd_status": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Application status updated successfully"
}
```

**Errors:**
- 400: Invalid request
- 403: Access denied (e.g., non-authorized user updating final_status)
- 404: Application not found
- 401: Unauthorized

---

### PUT /applications/:id/remark
Update remark (used by Remark Operator).

**Authorization:** PARTNER, TEAM_MEMBER, ADMIN, SUPER_ADMIN

**Request:**
```json
{
  "remark_status": "string",
  "remark": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Remark updated successfully"
}
```

**Errors:**
- 400: Invalid request
- 404: Application not found
- 401: Unauthorized

---

## Operator History & Timeline APIs

### GET /applications/:id/operator-history
Get operator audit history for an application.

**Authorization:** PARTNER, TEAM_MEMBER, ADMIN, SUPER_ADMIN

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "application_id": "uuid",
      "operator_id": "uuid",
      "operator_name": "string",
      "operator_role": "string",
      "operator_designation": "string",
      "operator_code": "string",
      "action_type": "string",
      "field_changes": {},
      "notes": "string",
      "created_at": "ISO8601"
    }
  ]
}
```

**Errors:**
- 404: Application not found
- 401: Unauthorized

---

### GET /applications/:id/timeline
Get application timeline.

**Authorization:** PARTNER, TEAM_MEMBER, ADMIN, SUPER_ADMIN

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "application_id": "uuid",
      "event_type": "string",
      "title": "string",
      "description": "string",
      "actor_type": "string",
      "actor_id": "uuid",
      "created_at": "ISO8601"
    }
  ]
}
```

**Errors:**
- 404: Application not found
- 401: Unauthorized

---

## Error Codes

### HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: User lacks permission
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., concurrent modification)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

### 429 Handling

When receiving 429:
- Check `Retry-After` header for wait time (in seconds)
- Do NOT auto-retry
- Show user-friendly message: "Too many requests. Please wait X seconds and try again."

---

## Notes

1. **Authentication**: All API calls (except login/refresh) require `Authorization: Bearer <token>` header
2. **Pagination**: Use server-side pagination, do not fetch all data
3. **Search**: Use server-side search with 300-500ms debounce
4. **Authorization**: Backend is authoritative, mobile handles 403 gracefully
5. **Audit**: All actions are recorded by backend, mobile displays history
6. **Concurrency**: Backend handles concurrent updates, last write wins
7. **Data Masking**: Backend masks sensitive data (PAN, mobile), mobile respects masking
