# Phase 4C — Shared Advanced Features & Mobile Capability Audit

This document provides a comprehensive capability audit of the existing backend APIs and mobile infrastructure for **Phase 4C** of the GharKaPaisa React Native application.

---

## 1. Executive API Capability Matrix

| Feature | Existing Backend API | Existing Mobile Service | Existing Mobile Screen | Backend RBAC | Mobile Ready |
|---------|----------------------|-------------------------|------------------------|--------------|--------------|
| **Notifications** | `GET /api/v1/notifications`, `PUT /api/v1/notifications/:id/read`, `PUT /api/v1/notifications/read-all`, `GET/PUT /api/v1/notifications/preferences` | `application.service.ts` (partial) | `notifications.tsx` (basic) | All Authenticated | AVAILABLE |
| **WhatsApp Integration** | `POST /api/v1/whatsapp/send-template`, `POST /api/v1/whatsapp/send-document`, `GET /api/v1/whatsapp/templates`, `GET /api/v1/whatsapp/search/applications`, `GET /api/v1/whatsapp/search/staff`, `GET /api/v1/whatsapp/recipient-context/*`, `POST /api/v1/whatsapp/send-designation-report` | Missing | Missing | `SUPER_ADMIN`, `ADMIN`, `PARTNER`, `EMPLOYEE` | AVAILABLE |
| **Reports & Analytics** | `GET /api/v1/reports/dashboard`, `GET /api/v1/reports/applications`, `GET /api/v1/reports/customers`, `GET /api/v1/reports/wallet`, `GET /api/v1/reports/products`, `GET /api/v1/super-admin/reports/*` | Missing | Missing | `PARTNER` (Partner Reports), `ADMIN`, `SUPER_ADMIN`, `OPERATIONAL_HEAD` (System Reports) | AVAILABLE |
| **Working Hours Management** | `GET /api/v1/superadmin/working-hours`, `PUT /api/v1/superadmin/working-hours`, `POST /api/v1/superadmin/working-hours/extend`, `POST /api/v1/superadmin/working-hours/policy`, `POST /api/v1/superadmin/working-hours/holiday` | Missing | Missing | `SUPER_ADMIN` | AVAILABLE (Admin Config) |
| **Employee Attendance / Check-In** | None (`/api/v1/employee/check-in` does not exist) | Missing | Missing | N/A | MISSING BACKEND CAPABILITY |
| **Finance Buddy / Chatbot** | `POST /api/v1/chatbot/message`, `POST /api/v1/chatbot/action`, `POST /api/v1/chatbot/conversation`, `POST /api/v1/chatbot/reset`, `GET /api/v1/chatbot/search`, `GET /api/v1/chatbot/faq/:category` | Missing | Missing | All Roles (Public + Auth Hydration) | AVAILABLE |
| **Shared Profile & Security** | `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, `POST /api/v1/auth/change-password`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/devices` | `auth.service.ts` | `profile.tsx` | All Authenticated | PARTIAL |
| **Deep Links & Referral Sharing** | `GET /api/v1/app/:trackingToken`, `GET /api/v1/public/share/:trackingToken`, `GET /api/v1/redirect/:productId` | `partner.service.ts` | Shared directly via Expo Router & Native Share API | All Roles | AVAILABLE |

---

## 2. Capability Audits by Candidate Area

### 2.1 Notifications
- **Backend Endpoints**:
  - `GET /api/v1/notifications` — List user notifications (paginated)
  - `GET /api/v1/notifications/unread` — List unread notifications & count
  - `PUT /api/v1/notifications/:id/read` — Mark notification as read
  - `PUT /api/v1/notifications/read-all` — Mark all user notifications as read
  - `DELETE /api/v1/notifications/:id` — Delete notification
  - `GET /api/v1/notifications/preferences` — Get notification preferences
  - `PUT /api/v1/notifications/preferences` — Save notification preferences
- **Mobile State**: `notifications.tsx` exists with basic rendering. Dedicated service `notification.service.ts` to be created.
- **RBAC**: Enforced per user session.

### 2.2 WhatsApp Operational Suite
- **Backend Endpoints**:
  - `GET /api/v1/whatsapp/templates` — Fetch approved Meta WhatsApp templates
  - `POST /api/v1/whatsapp/send-template` — Send template message
  - `POST /api/v1/whatsapp/send-document` — Send document using signed S3 URL
  - `GET /api/v1/whatsapp/search/applications` — Autocomplete applications for recipient context
  - `GET /api/v1/whatsapp/search/staff` — Autocomplete internal staff
  - `GET /api/v1/whatsapp/recipient-context/application/:applicationId` — Application context details
  - `GET /api/v1/whatsapp/recipient-context/staff/:staffId` — Staff context details
  - `POST /api/v1/whatsapp/send-designation-report` — Send operational report to designation via WhatsApp
- **Security Guard**: Mobile calls backend only; Meta API tokens and AWS S3 credentials remain completely hidden on the backend. Permissions checked via `whatsapp.permission.service.js`.
- **Mobile State**: Backend fully ready (`AVAILABLE`). Service `whatsapp.service.ts` to be added.

### 2.3 Reports & Analytics
- **Backend Endpoints**:
  - **Partner & General Reports**: `GET /api/v1/reports/dashboard`, `GET /api/v1/reports/applications`, `GET /api/v1/reports/customers`, `GET /api/v1/reports/wallet`, `GET /api/v1/reports/commission`, `GET /api/v1/reports/products`
  - **Super Admin System Reports**: `GET /api/v1/super-admin/reports/employees`, `GET /api/v1/super-admin/reports/applications`, `GET /api/v1/super-admin/reports/complete`, with `/export` Excel handlers.
- **Mobile State**: Backend fully ready (`AVAILABLE`). Service `report.service.ts` to be added.
- **RBAC**: Server-side filtering enforces role visibility (Partners see partner data, Super Admins see system data).

### 2.4 Working Hours & Attendance
- **Working Hours Policy & Extensions**:
  - `GET /api/v1/superadmin/working-hours` — Config, extensions, policies
  - `PUT /api/v1/superadmin/working-hours` — Update working hours schedule
  - `POST /api/v1/superadmin/working-hours/extend` — Extend working hours
  - `POST /api/v1/superadmin/working-hours/policy` — Create/update day-wise policy
  - `POST /api/v1/superadmin/working-hours/holiday` — Create/update holiday calendar
- **Login Enforcement**: Backend `checkUserWorkingHours` automatically enforces working windows during authentication for restricted roles (`ADMIN`).
- **Employee Daily Attendance / Check-In**: **MISSING BACKEND CAPABILITY**. No `/api/v1/employee/check-in` or time-clock endpoint exists on the backend. Mobile will not invent attendance logging.

### 2.5 Finance Buddy / Chatbot (NLU Assistant)
- **Backend Endpoints**:
  - `POST /api/v1/chatbot/message` — Send message with NLU intent detection (supports optional/required Bearer token for role-aware context)
  - `POST /api/v1/chatbot/action` — Handle interactive quick-action buttons
  - `POST /api/v1/chatbot/conversation` — Initialize conversation
  - `POST /api/v1/chatbot/reset` — Reset conversation
  - `GET /api/v1/chatbot/search` — Search knowledge base
  - `GET /api/v1/chatbot/faq/:category` — Retrieve category FAQs
- **Mobile State**: Backend ready (`AVAILABLE`). Service `chatbot.service.ts` to be created.
- **NLU Architecture**: Chatbot NLU, entity recognition, and lead creation workflows remain entirely server-side.

### 2.6 Shared Profile & Settings
- **Backend Endpoints**:
  - `GET /api/v1/auth/me` — Authenticated profile details
  - `PUT /api/v1/auth/profile` — Profile update
  - `POST /api/v1/auth/change-password` — Change password
  - `POST /api/v1/auth/logout` — Revoke session
  - `GET /api/v1/notifications/preferences` — Notification preferences
- **Mobile State**: `profile.tsx` exists; service integration can be consolidated into `auth.service.ts`.

### 2.7 Deep Linking & Navigation Integration
- **Backend Endpoints**: `GET /api/v1/app/:trackingToken`, `GET /api/v1/public/share/:trackingToken`, `GET /api/v1/redirect/:productId`
- **Mobile Handling**: Expo Router path-based deep linking (`/applications/[id]`, `/leads/[id]`, `/products`, `/notifications`).

---

## 3. Role Capability Matrix

| Capability | PARTNER | TEAM_MEMBER | EMPLOYEE | ADMIN | SUPER_ADMIN |
|------------|---------|-------------|----------|-------|------------|
| **Notifications List & Read** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Notification Preferences** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **WhatsApp Template Send** | ✅ Allowed | ❌ Restricted | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **WhatsApp Designation Reports** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ✅ Allowed | ✅ Allowed |
| **WhatsApp Template Creation** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted | ✅ Allowed |
| **Partner Performance Reports** | ✅ Allowed | ❌ Restricted | ❌ Restricted | ✅ Allowed | ✅ Allowed |
| **System Complete Reports** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ✅ Allowed | ✅ Allowed |
| **Working Hours Config & Extensions** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted | ✅ Allowed |
| **Finance Buddy / Chatbot** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Profile & Security Settings** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

---

## 4. Security Audit Findings

1. **Authentication Headers**: All Phase 4C endpoints operate securely under JWT Bearer authorization (`Authorization: Bearer <token>`).
2. **Meta & AWS Credentials Security**: All Meta WhatsApp credentials, access tokens, webhook secrets, and S3 AWS credentials are kept on the backend. No secret keys or `EXPO_PUBLIC_*` tokens are exposed to the mobile app.
3. **Signed URLs for Documents**: Document and report sharing via WhatsApp and mobile downloads use signed, time-limited S3 URLs generated by backend `whatsapp.service.js`.
4. **Data Privacy**: Customer PANs and mobile numbers continue to be masked appropriately based on role permissions.

---

## 5. Network & Performance Findings

1. **Single Client Architecture**: All new capabilities will strictly reuse `mobile/services/api.ts` (no duplicate Axios instances).
2. **Rate Limit Awareness**: 429 status codes returned by global limiters will be caught cleanly without triggering unnecessary token refresh or retry loops.
3. **Search Debounce**: WhatsApp autocomplete (applications/staff) and Chatbot KB search will enforce a 400ms debounce.
4. **No Unnecessary Polling**: Notifications will use manual pull-to-refresh or unread count fetch on screen focus rather than periodic background polling.

---

## 6. Missing Backend Capabilities

| Missing Capability | Required Endpoint | Purpose | Workaround / Action |
|--------------------|-------------------|---------|---------------------|
| **Employee Daily Check-In / Attendance** | `POST /api/v1/employee/check-in` | Mobile employee punch-in / punch-out attendance recording | **MISSING BACKEND CAPABILITY**. Mobile will NOT create fake attendance records or invent endpoints. Feature deferred until backend support is added. |

---

## 7. Recommended Phase 4C Implementation Order

Based on backend readiness, shared operational value, security, and low network complexity:

1. **Notifications & Preferences Module** (High readiness, shared across all roles, existing UI screen).
2. **Finance Buddy / Chatbot Assistant** (High readiness, server-side NLU complete, accessible to all user roles).
3. **WhatsApp Operational & Document Suite** (High operational value for Partners, Employees, Admins; backend fully ready).
4. **Reports & Export Downloads** (Role-specific reporting for Partners, Admins, Super Admins; backend ready).
5. **Shared Profile & Security Settings Enhancement** (Profile management, notification preferences, session info).
6. **Deep Linking & Navigation Integration** (Route link handling for shared products and applications).

---

## 8. Overall Audit Status

**AUDIT COMPLETE — READY FOR IMPLEMENTATION**
