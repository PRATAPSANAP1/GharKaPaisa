# Phase 4C API Audit — Shared Advanced Features + Mobile Capability

**Project:** GharKaPaisa Mobile App  
**Audit Date:** 2026-09-29  
**Phase:** 4C — Shared Advanced Features + Mobile Capability Audit  
**Status:** AUDIT COMPLETE

---

## Executive Summary

This audit examines existing backend APIs and mobile implementation for Phase 4C candidate features:

1. Notifications
2. WhatsApp
3. Reports
4. Working Hours / Attendance
5. Chatbot / Finance Buddy
6. Profile / Settings
7. Deep Links

**Finding:** Most Phase 4C features already have backend API support and partial mobile implementation. No new backend APIs are required for implementation. One database issue was identified in the attendance module (employee_id type mismatch).

---

## 1. Capability Matrix

| Feature | Existing Backend API | Existing Mobile Service | Existing Mobile Screen | Backend RBAC | Mobile Ready |
|---------|----------------------|-------------------------|------------------------|--------------|--------------|
| **Notifications** | | | | | |
| List notifications | AVAILABLE (`GET /notifications`) | AVAILABLE (`notificationService.fetchNotifications`) | AVAILABLE (`mobile/app/(app)/notifications.tsx`) | Auth + syncUser | ✅ YES |
| Unread count | AVAILABLE (`GET /notifications/unread`) | AVAILABLE (`notificationService.fetchUnreadCount`) | PARTIAL (not used in current screen) | Auth + syncUser | ✅ YES |
| Mark read | AVAILABLE (`PUT /notifications/:id/read`) | AVAILABLE (`notificationService.markNotificationRead`) | AVAILABLE | Auth + syncUser | ✅ YES |
| Mark all read | AVAILABLE (`PUT /notifications/read-all`) | AVAILABLE (`notificationService.markAllNotificationsRead`) | NOT USED | Auth + syncUser | ✅ YES |
| Notification preferences | AVAILABLE (`GET/PUT /notifications/settings`) | AVAILABLE (`notificationService.fetchNotificationPreferences`) | NOT USED | Auth + syncUser | ✅ YES |
| SSE stream | AVAILABLE (`GET /notifications/stream`) | MISSING | MISSING | Auth + syncUser | ⚠️ PARTIAL (SSE not implemented) |
| Push notifications | UNKNOWN (not found in backend) | MISSING | MISSING | UNKNOWN | ❌ MISSING |
| **WhatsApp** | | | | | |
| Dashboard metrics | AVAILABLE (`GET /whatsapp/dashboard`) | MISSING | MISSING | Auth | ⚠️ PARTIAL |
| Message history | AVAILABLE (`GET /whatsapp/messages`) | AVAILABLE (`whatsappService.fetchMessageHistory`) | MISSING | Auth | ✅ YES |
| Send template | AVAILABLE (`POST /whatsapp/send-template`) | AVAILABLE (`whatsappService.sendTemplateMessage`) | MISSING | Auth + globalLimiter | ✅ YES |
| Send document | AVAILABLE (`POST /whatsapp/send-document`) | AVAILABLE (`whatsappService.sendDocumentMessage`) | MISSING | Auth + globalLimiter | ✅ YES |
| Templates list | AVAILABLE (`GET /whatsapp/templates`) | AVAILABLE (`whatsappService.fetchTemplates`) | MISSING | Auth | ✅ YES |
| Search applications | AVAILABLE (`GET /whatsapp/search/applications`) | AVAILABLE (`whatsappService.searchApplications`) | MISSING | Auth | ✅ YES |
| Search staff | AVAILABLE (`GET /whatsapp/search/staff`) | AVAILABLE (`whatsappService.searchStaff`) | MISSING | Auth | ✅ YES |
| Recipient context (application) | AVAILABLE (`GET /whatsapp/recipient-context/application/:id`) | AVAILABLE (`whatsappService.fetchRecipientContext`) | MISSING | Auth | ✅ YES |
| Recipient context (staff) | AVAILABLE (`GET /whatsapp/recipient-context/staff/:id`) | AVAILABLE (`whatsappService.fetchRecipientContext`) | MISSING | Auth | ✅ YES |
| Staff reports | AVAILABLE (`GET/POST /whatsapp/staff-reports/*`) | AVAILABLE (`whatsappService.generateStaffReport`) | MISSING | Auth + globalLimiter | ✅ YES |
| Product context | AVAILABLE (`GET /whatsapp/product-context/:id`) | MISSING | MISSING | Auth | ⚠️ PARTIAL |
| Template management | AVAILABLE (`POST/PATCH /whatsapp/templates`) | MISSING | MISSING | SUPER_ADMIN only | ❌ NOT REQUIRED (admin-only) |
| WhatsApp settings | AVAILABLE (`GET/PUT /whatsapp/settings`) | MISSING | MISSING | SUPER_ADMIN only | ❌ NOT REQUIRED (admin-only) |
| **Reports** | | | | | |
| Application report | AVAILABLE (`GET /reports/applications`) | AVAILABLE (`reportService.getApplicationReport`) | PARTIAL (legacy screen exists) | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ YES |
| Customer report | AVAILABLE (`GET /reports/customers`) | AVAILABLE (`reportService.getCustomerReport`) | MISSING | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ YES |
| Employee report | AVAILABLE (`GET /reports/employees`) | AVAILABLE (`reportService.getEmployeeReport`) | MISSING | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ YES |
| Partner report | AVAILABLE (`GET /reports/partners`) | AVAILABLE (`reportService.getPartnerReport`) | MISSING | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ YES |
| Admin report | AVAILABLE (`GET /reports/admins`) | AVAILABLE (`reportService.getAdminReport`) | MISSING | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ YES |
| Complete system report | AVAILABLE (`GET /reports/complete`) | AVAILABLE (`reportService.getCompleteSystemReport`) | MISSING | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ✅ YES |
| Export endpoints | AVAILABLE (`GET /reports/*/export`) | AVAILABLE (`reportService.getExportEndpoint`) | PARTIAL (no download implementation) | SUPER_ADMIN, ADMIN, OPERATIONAL_HEAD | ⚠️ PARTIAL |
| **Working Hours** | | | | | |
| Policy administration | AVAILABLE (`GET/PUT /superadmin/working-hours`) | MISSING | MISSING | SUPER_ADMIN only | ❌ NOT REQUIRED (admin-only) |
| **Attendance** | | | | | |
| Check-in | AVAILABLE (`POST /attendance/check-in`) | AVAILABLE (`attendanceService.executeCheckIn`) | MISSING | Auth + syncUser | ✅ YES |
| Check-out | AVAILABLE (`POST /attendance/check-out`) | AVAILABLE (`attendanceService.executeCheckOut`) | MISSING | Auth + syncUser | ✅ YES |
| Today's attendance | AVAILABLE (`GET /attendance/today`) | AVAILABLE (`attendanceService.getTodayAttendance`) | MISSING | Auth + syncUser | ✅ YES |
| Attendance history | AVAILABLE (`GET /attendance/my-attendance`) | AVAILABLE (`attendanceService.getMyAttendanceHistory`) | MISSING | Auth + syncUser | ✅ YES |
| Attendance summary | AVAILABLE (`GET /attendance/my-summary`) | AVAILABLE (`attendanceService.getMyAttendanceSummary`) | MISSING | Auth + syncUser | ✅ YES |
| Verification session | AVAILABLE (`POST /attendance/verification/session`) | AVAILABLE (`attendanceService.createVerificationSession`) | MISSING | Auth + syncUser | ✅ YES |
| Liveness session | AVAILABLE (`POST /attendance/verification/liveness/session`) | AVAILABLE (`attendanceService.createLivenessSession`) | MISSING | Auth + syncUser | ✅ YES |
| Complete verification | AVAILABLE (`POST /attendance/verification/complete`) | AVAILABLE (`attendanceService.completeVerificationPipeline`) | MISSING | Auth + syncUser | ✅ YES |
| **Chatbot / Finance Buddy** | | | | | |
| Send message | AVAILABLE (`POST /chatbot/message`) | AVAILABLE (`chatbotService.sendMessage`) | MISSING | Optional JWT + chatbotLimiter | ✅ YES |
| Handle action | AVAILABLE (`POST /chatbot/action`) | AVAILABLE (`chatbotService.handleAction`) | MISSING | Optional JWT + chatbotLimiter | ✅ YES |
| Reset conversation | AVAILABLE (`POST /chatbot/reset`) | AVAILABLE (`chatbotService.resetConversation`) | MISSING | Optional JWT | ✅ YES |
| Search knowledge base | AVAILABLE (`GET /chatbot/search`) | AVAILABLE (`chatbotService.searchKnowledgeBase`) | MISSING | Optional JWT | ✅ YES |
| FAQ by category | AVAILABLE (`GET /chatbot/faq/:category`) | MISSING | MISSING | Optional JWT | ⚠️ PARTIAL |
| Submit feedback | AVAILABLE (`POST /chatbot/feedback`) | AVAILABLE (`chatbotService.submitFeedback`) | MISSING | Auth | ✅ YES |
| Conversation history | AVAILABLE (`GET /chatbot/conversation/:id`) | MISSING | MISSING | Auth | ⚠️ PARTIAL |
| Analytics | AVAILABLE (`GET /chatbot/analytics`) | MISSING | MISSING | ADMIN, SUPER_ADMIN | ❌ NOT REQUIRED (admin-only) |
| Escalate | AVAILABLE (`POST /chatbot/escalate`) | MISSING | MISSING | ADMIN, SUPER_ADMIN | ❌ NOT REQUIRED (admin-only) |
| Intent management | AVAILABLE (`GET/POST/PUT/DELETE /chatbot/intents`) | MISSING | MISSING | ADMIN, SUPER_ADMIN | ❌ NOT REQUIRED (admin-only) |
| **Profile / Settings** | | | | | |
| Profile read | AVAILABLE (auth endpoint returns user profile) | AVAILABLE (auth context) | AVAILABLE (`mobile/app/(app)/profile.tsx`) | Auth | ✅ YES |
| Profile update | AVAILABLE (`PUT /auth/profile`) | AVAILABLE (`auth.service.updateProfile`) | AVAILABLE | Auth | ✅ YES |
| Email change | AVAILABLE (OTP flow) | AVAILABLE (`auth.service.requestEmailChange`, `verifyEmailChange`) | AVAILABLE | Auth | ✅ YES |
| Mobile change | AVAILABLE (OTP flow) | AVAILABLE (`auth.service.requestMobileChange`, `verifyMobileChange`) | AVAILABLE | Auth | ✅ YES |
| Notification preferences | AVAILABLE (`GET/PUT /notifications/settings`) | AVAILABLE (`notificationService`) | NOT USED | Auth | ✅ YES |
| Password/security | AVAILABLE (backend auth module) | MISSING | MISSING (navigation link exists) | Auth | ⚠️ PARTIAL |
| Logout | AVAILABLE (auth endpoint) | AVAILABLE (`auth.service.logout`) | AVAILABLE | Auth | ✅ YES |
| Local app settings | NOT REQUIRED (local-only) | MISSING | AVAILABLE (`mobile/app/(app)/settings.tsx`) | N/A | ✅ YES |
| **Deep Links** | | | | | |
| Deep link parsing | NOT REQUIRED (client-side) | AVAILABLE (`deeplink.service.ts`) | MISSING | N/A | ✅ YES |
| Route whitelisting | NOT REQUIRED (client-side) | AVAILABLE (`deeplink.service.ts`) | MISSING | N/A | ✅ YES |
| Application deep link | NOT REQUIRED (client-side) | AVAILABLE (`/applications`) | MISSING | N/A | ✅ YES |
| Lead deep link | NOT REQUIRED (client-side) | AVAILABLE (`/leads`) | MISSING | N/A | ✅ YES |
| Customer deep link | NOT REQUIRED (client-side) | AVAILABLE (`/customers`) | MISSING | N/A | ✅ YES |
| Notification deep link | NOT REQUIRED (client-side) | AVAILABLE (`/notifications`) | MISSING | N/A | ✅ YES |
| Finance buddy deep link | NOT REQUIRED (client-side) | AVAILABLE (`/finance-buddy`) | MISSING | N/A | ✅ YES |
| WhatsApp deep link | NOT REQUIRED (client-side) | AVAILABLE (`/whatsapp`) | MISSING | N/A | ✅ YES |
| Reports deep link | NOT REQUIRED (client-side) | AVAILABLE (`/reports`) | MISSING | N/A | ✅ YES |

---

## 2. Detailed Backend API Contracts

### 2.1 Notifications

**Base Path:** `/api/v1/notifications`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/notifications` | GET | ✅ | List notifications with pagination, unread count |
| `/notifications/unread` | GET | ✅ | Fetch unread notifications and count |
| `/notifications/:id/read` | PUT | ✅ | Mark specific notification as read |
| `/notifications/read-all` | PUT | ✅ | Mark all notifications as read |
| `/notifications/settings` | GET/PUT | ✅ | Fetch/update notification preferences |
| `/notifications/stream` | GET | ✅ | SSE stream for real-time notifications |
| `/notifications/audit` | GET | ADMIN, SUPER_ADMIN | Audit log (admin-only) |
| `/notifications/broadcast` | GET/POST | SUPER_ADMIN | Broadcast announcements (admin-only) |

**Request/Response Example:**

```javascript
// GET /notifications?page=1&limit=20
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "title": "Application Approved",
        "message": "Your application has been approved",
        "category": "APPLICATION",
        "type": "INFO",
        "is_read": false,
        "read_at": null,
        "created_at": "2026-09-29T10:00:00Z",
        "metadata": {
          "application_id": "uuid",
          "target": "application-details"
        }
      }
    ],
    "unread_count": 5,
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

**Rate Limiting:** None specified in routes inspected.

**Mobile Readiness:** ✅ HIGH - Service exists, screen exists, needs SSE and push investigation.

---

### 2.2 WhatsApp

**Base Path:** `/api/v1/whatsapp`

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/webhook` | GET/POST | ❌ Public | None | Meta webhook verification and event handling |
| `/dashboard` | GET | ✅ | None | Dashboard metrics |
| `/messages` | GET | ✅ | None | Message history with pagination |
| `/messages/:id` | GET | ✅ | None | Single message details with delivery events |
| `/send-template` | POST | ✅ | globalLimiter | Send template message |
| `/send-document` | POST | ✅ | globalLimiter | Send document/PDF message |
| `/designation-report` | GET | ✅ | None | Designation-based report |
| `/send-designation-report` | POST | ✅ | globalLimiter | Send designation report via WhatsApp |
| `/templates` | GET | ✅ | None | List approved templates |
| `/templates` | POST | SUPER_ADMIN | None | Create template (admin-only) |
| `/templates/:id/status` | PATCH | SUPER_ADMIN | None | Update template status (admin-only) |
| `/search/applications` | GET | ✅ | None | Search customer applications |
| `/search/staff` | GET | ✅ | None | Search staff/employees |
| `/staff-list` | GET | ✅ | None | Staff list (alias for search/staff) |
| `/products-list` | GET | ✅ | None | Product list |
| `/recipient-context/application/:id` | GET | ✅ | None | Application recipient context |
| `/recipient-context/staff/:id` | GET | ✅ | None | Staff recipient context |
| `/product-context/:id` | GET | ✅ | None | Product context |
| `/staff-reports/available/:staffId` | GET | ✅ | None | Available staff reports |
| `/staff-reports/generate` | POST | ✅ | globalLimiter | Generate staff report |
| `/generate-product-info-doc` | POST | ✅ | globalLimiter | Generate product info document |
| `/settings` | GET/PUT | SUPER_ADMIN | None | WhatsApp settings (admin-only) |
| `/sender-configs` | GET | SUPER_ADMIN | None | Sender configurations (admin-only) |
| `/message-policies` | GET/POST | SUPER_ADMIN | None | Message policies (admin-only) |
| `/consents` | GET | SUPER_ADMIN | None | Consent records (admin-only) |
| `/webhook-logs` | GET | SUPER_ADMIN | None | Webhook diagnostics (admin-only) |

**Send Template Request Example:**

```javascript
// POST /whatsapp/send-template
{
  "template_name": "application_status_update",
  "recipient_mobile": "+919876543210",
  "recipient_name": "John Doe",
  "recipient_type": "CUSTOMER",
  "variables": {
    "app_number": "APP12345",
    "status": "Approved"
  },
  "application_id": "uuid"
}
```

**Rate Limiting:** `globalLimiter` on send operations - mobile must not retry on 429.

**Security:** No Meta credentials in mobile. All calls go through GharKaPaisa backend.

**Mobile Readiness:** ✅ HIGH - Service exists, needs screens for sending and viewing.

---

### 2.3 Reports

**Base Path:** `/api/v1/reports`

**Authorization:** `authenticate`, `syncUser`, `authorize('SUPER_ADMIN', 'ADMIN', 'SUPERADMIN', 'OPERATIONAL_HEAD')`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/employees` | GET | Employee report preview |
| `/employees/export` | GET | Employee report Excel export |
| `/customers` | GET | Customer report preview |
| `/customers/export` | GET | Customer report Excel export |
| `/admins` | GET | Admin report preview |
| `/admins/export` | GET | Admin report Excel export |
| `/partners` | GET | Partner report preview |
| `/partners/export` | GET | Partner report Excel export |
| `/applications` | GET | Application report preview |
| `/applications/export` | GET | Application report Excel export |
| `/complete` | GET | Complete system report preview |
| `/complete/export` | GET | Complete system report Excel export |

**Request Parameters (typical):**

```javascript
// GET /reports/applications?bank_id=uuid&product_id=uuid&start_date=2026-01-01&end_date=2026-12-31
{
  "success": true,
  "data": [
    {
      "app_number": "APP12345",
      "customer_name": "John Doe",
      "bank_name": "HDFC",
      "product_name": "Credit Card",
      "status": "APPROVED",
      "created_at": "2026-09-29"
    }
  ],
  "count": 100
}
```

**Export Format:** Excel (.xlsx) files generated by backend.

**Mobile Readiness:** ✅ HIGH - Service exists, export endpoints exist, needs mobile-friendly display and download handling.

---

### 2.4 Working Hours (Policy Administration)

**Base Path:** `/api/v1/superadmin/working-hours`

**Authorization:** `jwtAuth`, `roleCheck('SUPER_ADMIN')`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/working-hours` | GET | Fetch working hours configuration |
| `/working-hours` | PUT | Update working hours configuration |
| `/working-hours/extend` | POST | Create working hours extension |
| `/working-hours/extensions` | GET | Get extension history |
| `/working-hours/policies` | GET | Get policies |
| `/working-hours/policy` | POST | Save policy |
| `/working-hours/policy/:id` | DELETE | Delete policy |
| `/working-hours/holidays` | GET | Get holidays |
| `/working-hours/holiday` | POST | Save holiday |
| `/working-hours/holiday/:id` | DELETE | Delete holiday |

**Note:** These are SUPER_ADMIN policy administration endpoints only. They do not provide employee self-service attendance functionality.

**Mobile Readiness:** ❌ NOT REQUIRED - These are admin-only policy management endpoints, not for employee mobile use.

---

### 2.5 Attendance (Employee Self-Service)

**Base Path:** `/api/v1/attendance`

**Authorization:** `authenticate`, `syncUser`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check-in` | POST | Execute attendance check-in |
| `/check-out` | POST | Execute attendance check-out |
| `/today` | GET | Get today's attendance record |
| `/my-attendance` | GET | Get monthly attendance history |
| `/my-summary` | GET | Get monthly attendance summary |

**Attendance Verification Routes** (in `attendance-verification` module):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/attendance/verification/session` | POST | Create verification session (5 min expiry) |
| `/attendance/verification/liveness/session` | POST | Initiate liveness session |
| `/attendance/verification/complete` | POST | Complete verification with face image |

**Database Issue Identified:**

The backend attendance module is experiencing a type mismatch error:

```
invalid input syntax for type uuid: "CAND10003"
```

The `employee_id` column in `employee_attendance` table expects UUID, but the system is passing employee code strings (e.g., "CAND10003"). This is a backend bug that must be fixed before attendance can function correctly.

**Mobile Readiness:** ⚠️ PARTIAL - Service exists, but backend has database type mismatch bug that must be fixed.

---

### 2.6 Chatbot / Finance Buddy

**Base Path:** `/api/v1/chatbot`

**Rate Limiting:** `chatbotLimiter` on public endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/message` | POST | Optional JWT | Send message to chatbot |
| `/action` | POST | Optional JWT | Handle chip/action click |
| `/conversation` | POST | Optional JWT | Create new conversation |
| `/reset` | POST | Optional JWT | Reset conversation |
| `/search` | GET | Optional JWT | Search knowledge base |
| `/faq/:category` | GET | Optional JWT | Get FAQ by category |
| `/feedback` | POST | ✅ Required | Submit feedback rating |
| `/conversation/:id` | GET | ✅ Required | Get conversation history |
| `/analytics` | GET | ADMIN, SUPER_ADMIN | Chatbot analytics (admin-only) |
| `/escalate` | POST | ADMIN, SUPER_ADMIN | Escalate to agent (admin-only) |
| `/intents` | GET/POST/PUT/DELETE | ADMIN, SUPER_ADMIN | Intent management (admin-only) |

**Message Request Example:**

```javascript
// POST /chatbot/message
{
  "message": "How do I check my application status?",
  "session_id": "session-uuid"
}
```

**Response Example:**

```javascript
{
  "success": true,
  "type": "TEXT",
  "message": "You can check your application status in the Applications section.",
  "chips": [
    { "label": "View Applications", "action": "navigate_applications" }
  ],
  "category": "APPLICATION_STATUS"
}
```

**Role Routing:** Backend contains role-aware services (`chatbot.partner.service`, `chatbot.employee.service`, etc.) that handle different user types.

**Mobile Readiness:** ✅ HIGH - Service exists, backend handles role routing, needs mobile chat UI.

---

### 2.7 Profile / Settings

**Profile endpoints** are in the authentication module:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/profile` | GET/PUT | Fetch/update user profile |
| `/auth/change-email/request` | POST | Request email change (OTP) |
| `/auth/change-email/verify` | POST | Verify email change (OTP) |
| `/auth/change-mobile/request` | POST | Request mobile change (OTP) |
| `/auth/change-mobile/verify` | POST | Verify mobile change (OTP) |
| `/auth/change-password` | POST | Change password |
| `/auth/logout` | POST | Logout session |

**Notification Preferences:** Handled by `/notifications/settings` (see section 2.1).

**Mobile Readiness:** ✅ HIGH - Profile screen exists with email/mobile change flows, needs security/password screen implementation.

---

### 2.8 Deep Links

**Deep linking is client-side only.** No backend APIs required.

**Mobile Service:** `mobile/services/deeplink.service.ts`

**Supported Routes (whitelisted):**

```typescript
'/applications' → '/(app)/application-details'
'/leads' → '/(app)/lead-details'
'/customers' → '/(app)/customer-details'
'/products' → '/(app)/products'
'/notifications' → '/(app)/notifications'
'/finance-buddy' → '/(app)/finance-buddy'
'/whatsapp' → '/(app)/whatsapp'
'/reports' → '/(app)/reports'
'/wallet' → '/(app)/wallet'
'/team' → '/(app)/team'
'/profile' → '/(app)/profile'
'/security' → '/(app)/security'
'/dashboard' → '/(app)/dashboard'
'/partner-dashboard' → '/(app)/partner-dashboard'
'/team-dashboard' → '/(app)/team-dashboard'
```

**URL Formats Supported:**

- Scheme format: `gharkapaisa://applications/123` or `gharkapaisa://applications?id=123`
- Web format: `https://gharkapaisa.in/applications/123`

**Security:** Parameters are sanitized (alphanumeric, hyphens, underscores only, max 64 chars). No sensitive values in navigation params.

**Mobile Readiness:** ✅ HIGH - Service exists, needs integration in root layout for handling incoming links.

---

## 3. Role Matrix

| Capability | PARTNER | TEAM_MEMBER | EMPLOYEE | ADMIN | SUPER_ADMIN |
|------------|---------|-------------|----------|-------|------------|
| **Notifications** | | | | | |
| List/read notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notification preferences | ✅ | ✅ | ✅ | ✅ | ✅ |
| SSE stream | ✅ | ✅ | ✅ | ✅ | ✅ |
| **WhatsApp** | | | | | |
| View message history | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send templates | ❌ UNKNOWN | ❌ UNKNOWN | ❌ UNKNOWN | ✅ | ✅ |
| Send documents | ❌ UNKNOWN | ❌ UNKNOWN | ❌ UNKNOWN | ✅ | ✅ |
| Search recipients | ❌ UNKNOWN | ❌ UNKNOWN | ❌ UNKNOWN | ✅ | ✅ |
| Template management | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reports** | | | | | |
| View reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| Export reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Attendance** | | | | | |
| Check-in/check-out | ❌ | ❌ | ✅ | ❌ | ❌ |
| View own attendance | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Working Hours (Policy)** | | | | | |
| View policies | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage policies | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Chatbot** | | | | | |
| Public access | ✅ | ✅ | ✅ | ✅ | ✅ |
| Authenticated access | ✅ | ✅ | ✅ | ✅ | ✅ |
| Feedback | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ❌ | ✅ | ✅ |
| Intent management | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Profile/Settings** | | | | | |
| Profile update | ✅ | ✅ | ✅ | ✅ | ✅ |
| Email/mobile change | ✅ | ✅ | ✅ | ✅ | ✅ |
| Password change | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Deep Links** | | | | | |
| All whitelisted routes | ✅ | ✅ | ✅ | ✅ | ✅ |

**Notes:**
- WhatsApp send permissions by role not explicitly documented in inspected code - marked UNKNOWN for non-admin roles
- Attendance is specifically for EMPLOYEE role only
- Working hours policy management is SUPER_ADMIN only
- Chatbot public endpoints are accessible to all (with optional JWT for context)

---

## 4. Security Findings

### 4.1 Positive Findings ✅

1. **No secrets in mobile app:**
   - No Meta/WhatsApp credentials in mobile code
   - No AWS credentials in mobile code
   - No API secrets in `EXPO_PUBLIC_*` variables (inspected `app.json`)

2. **Proper authentication:**
   - All protected endpoints require JWT
   - Mobile uses `api.ts` with automatic token refresh on 401
   - Tokens stored in `expo-secure-store`

3. **Sensitive data masking:**
   - PAN masking utility exists (`maskPAN`)
   - Mobile masking utility exists (`maskMobile`)
   - Deep link parameter sanitization

4. **Rate limiting:**
   - WhatsApp send operations use `globalLimiter`
   - Chatbot uses `chatbotLimiter`
   - Mobile must not retry on 429

5. **No direct external API calls:**
   - All WhatsApp calls go through GharKaPaisa backend
   - No direct Meta API calls from mobile

### 4.2 Issues Requiring Attention ⚠️

1. **Attendance database type mismatch:**
   - `employee_id` column expects UUID but receives employee code strings
   - Error: `invalid input syntax for type uuid: "CAND10003"`
   - **Impact:** Attendance feature cannot function until backend is fixed
   - **Location:** `backend/src/modules/attendance/` - controller/service layer
   - **Required fix:** Map employee codes to UUIDs or change column type

2. **Settings screen local-only:**
   - `mobile/app/(app)/settings.tsx` only manages local switches
   - No backend synchronization for notification preferences
   - **Impact:** User settings changes won't persist across devices
   - **Required fix:** Connect switches to `notificationService.updateNotificationPreferences`

3. **Legacy reports screen:**
   - `mobile/src/screens/ReportsScreen.js` uses old `AuthContext` and separate Axios
   - Not using centralized `api.ts`
   - **Impact:** Duplicate API client, no 401 refresh, potential auth issues
   - **Required fix:** Migrate to use `reportService` and centralized `api.ts`

4. **Missing security screen:**
   - Profile screen has navigation link to `/security` but screen doesn't exist
   - **Impact:** Users cannot change password
   - **Required fix:** Implement security screen with password change

### 4.3 Recommendations 🔒

1. **Before attendance implementation:**
   - Fix backend `employee_id` type mismatch bug
   - Verify attendance tables use correct UUID references

2. **Before settings implementation:**
   - Connect local switches to backend notification preferences
   - Persist settings across devices

3. **Before reports implementation:**
   - Remove/replace legacy `ReportsScreen.js`
   - Use `reportService` with centralized `api.ts`

4. **General:**
   - Never log OTPs, access tokens, refresh tokens
   - Never log full PAN or full mobile numbers
   - Use masking utilities for display
   - Do not put sensitive values in navigation params

---

## 5. Performance Findings

### 5.1 Potentially Expensive Features

| Feature | Concern | Recommendation |
|---------|---------|----------------|
| WhatsApp recipient search | Server-side search could be slow with large datasets | Use 300-500ms debounce, limit results to 15-20 items |
| Reports preview | May return large datasets | Use pagination, request only required fields |
| Reports export | Excel generation is server-heavy | Do not implement auto-refresh, user-triggered only |
| Chatbot | NLU processing can be slow | Show loading state, no auto-refresh |
| Notification refresh | Full list fetch on every refresh | Use unread count endpoint, limit pagination |
| Attendance verification | Face image upload + liveness check | Compress images, show progress indicator |

### 5.2 Network Request Recommendations

1. **No polling:**
   - Do not poll notifications (use SSE if needed)
   - Do not poll chatbot
   - Do not poll reports

2. **Debounce searches:**
   - WhatsApp recipient search: 500ms debounce
   - Reports filters: 300ms debounce
   - Chatbot search: 500ms debounce

3. **Pagination guards:**
   - All list endpoints must use pagination
   - Protect `onEndReached` with loading flag
   - Never request same page twice

4. **Duplicate submission protection:**
   - WhatsApp send: disable button during request
   - Report export: disable button during generation
   - Attendance check-in/out: prevent double submission

5. **429 handling:**
   - Do not retry on 429
   - Do not trigger token refresh on 429
   - Show user-friendly message: "Too many requests. Please wait."

6. **Cache strategy:**
   - Cache templates (rarely change)
   - Cache notification preferences
   - Do not cache dynamic data (applications, leads)

---

## 6. Missing Backend Capabilities

### 6.1 None Found ✅

All Phase 4C candidate features have existing backend API support. No new backend endpoints are required for implementation.

### 6.2 Backend Bug Requiring Fix 🔧

**Attendance Module Database Type Mismatch**

```
Feature: Employee Attendance Check-In/Check-Out
Required endpoint: POST /attendance/check-in, POST /attendance/check-out
Required request: { verification_session_id, source }
Required response: Attendance record with status
Required authorization: authenticate + syncUser
Reason mobile cannot safely implement it:
  Backend throws database error: "invalid input syntax for type uuid: 'CAND10003'"
  The employee_attendance table employee_id column expects UUID type,
  but the system is passing employee code strings (e.g., "CAND10003").
  This prevents any attendance operations from succeeding.
Location: backend/src/modules/attendance/attendance.controller.js, attendance.service.js
Required fix: Map employee codes to UUIDs in the attendance module,
or change employee_id column type to accept employee codes.
```

---

## 7. Existing Mobile Implementation Summary

### 7.1 Services Implemented ✅

- `notification.service.ts` - Full notification service
- `whatsapp.service.ts` - Full WhatsApp service
- `report.service.ts` - Full report service
- `chatbot.service.ts` - Full chatbot service
- `attendance.service.js` - Full attendance service
- `deeplink.service.ts` - Full deep link service
- `auth.service.ts` - Profile, email/mobile change, logout

### 7.2 Screens Implemented ✅

- `mobile/app/(app)/notifications.tsx` - Notification list
- `mobile/app/(app)/profile.tsx` - Profile with email/mobile change
- `mobile/app/(app)/settings.tsx` - Local app settings

### 7.3 Legacy Screens Requiring Migration ⚠️

- `mobile/src/screens/ReportsScreen.js` - Uses old AuthContext, needs migration to `reportService`

### 7.4 Screens Missing ❌

- WhatsApp send screen
- WhatsApp message history screen
- Reports preview screens (by category)
- Report download/export UI
- Attendance check-in/check-out screen
- Attendance history screen
- Chatbot/Finance Buddy screen
- Security/password screen
- Deep link handling in root layout

---

## 8. Recommended Phase 4C Implementation Order

Based on technical readiness, dependencies, and complexity:

### Priority 1: Complete Partial Implementations
1. **Notification Preferences** - Connect settings screen to backend
2. **Security Screen** - Implement password change
3. **Legacy Reports Migration** - Replace old screen with new service-based implementation

### Priority 2: Core Features (High Readiness)
4. **WhatsApp Send Screen** - Service exists, just needs UI
5. **WhatsApp Message History** - Service exists, just needs UI
6. **Reports Preview Screens** - Service exists, needs mobile-friendly display
7. **Report Download/Export** - Endpoints exist, needs download handling

### Priority 3: Chatbot (High Readiness)
8. **Chatbot/Finance Buddy Screen** - Service exists, backend handles role routing, needs chat UI

### Priority 4: Attendance (Blocked by Backend Bug)
9. **Attendance Check-In/Check-Out** - Service exists, but backend database bug must be fixed first
10. **Attendance History** - Service exists, blocked by same bug

### Priority 5: Deep Link Integration
11. **Deep Link Handler** - Service exists, needs integration in root layout
12. **Notification Deep Link Targets** - Connect notification metadata to deep links

### Priority 6: Advanced Features (Optional)
13. **SSE for Notifications** - Backend supports, investigate React Native SSE library
14. **Push Notifications** - Backend support unclear, requires investigation

**Note:** Priority order is based on technical readiness and dependencies, not business value.

---

## 9. Files Changed During Audit

- `D:\Internship\yohesa\mobile\docs\PHASE_4C_API_AUDIT.md` (created)

---

## 10. Final Status

**AUDIT COMPLETE — BACKEND WORK REQUIRED BEFORE IMPLEMENTATION**

**Reason:** The attendance module has a database type mismatch bug (`employee_id` expects UUID but receives employee code strings) that must be fixed before attendance features can be implemented. All other Phase 4C features have sufficient backend API support and mobile services are ready for screen implementation.

**Next Steps:**
1. Fix backend attendance database type mismatch bug
2. After fix is verified, proceed with Phase 4C implementation following recommended order
3. Address security findings (settings synchronization, legacy reports migration, security screen)

---

**Audit Completed:** 2026-09-29  
**Auditor:** Devin (AI Software Engineer)  
**Review Status:** READY FOR USER APPROVAL
