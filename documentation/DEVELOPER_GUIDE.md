# GharKaPaisa — Complete Developer Handover & Technical Documentation

**Project:** GharKaPaisa (yohesa)  
**Purpose:** Financial Products, Partner, CRM, Lead, Application, Wallet & Commission Management Platform  
**Latest Source Reviewed:** `GharKaPaisa-master`

---

## 1. Project Overview

**GharKaPaisa** is a financial-services platform designed for the Indian market.

The system contains multiple portals:

```
                         GHARKAPAISA
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       PUBLIC              PARTNER             ADMIN
       WEBSITE              PANEL               PANEL
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                        SUPER ADMIN
                              │
                         BACKEND API
                              │
                     PostgreSQL Database
```

### The platform supports financial products such as:
- Credit Cards
- Personal Loans
- Home Loans
- Business Loans
- FD-backed Cards
- Loan on Credit Cards & Smart EMIs
- Insurance
- Bill Payment
- Money Transfer
- Travel/Transit-related services
- Partner referral, lead generation, and commission management

**Primary Business Model:** Partner-led financial-product lead generation and commission management.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19, Vite
- **Routing:** React Router v6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Internationalization:** i18next, react-i18next
- **Styling:** CSS / CSS Variables / Dynamic Theme Tokens
- **Icons:** FontAwesome / React Icons (`react-icons/fa`)

### Backend
- **Runtime & Framework:** Node.js, Express.js
- **Database:** PostgreSQL (AWS RDS PostgreSQL) using connection pool (`pg`)
- **Authentication & Security:** JWT (Access + Refresh Tokens), bcrypt/bcryptjs, express-rate-limit
- **Validation:** express-validator
- **Job Scheduling:** node-cron
- **External Integrations:**
  - AWS SDK (S3 for Private Documents, SES for Email)
  - MSG91 (SMS & OTP)
  - Razorpay (Payments, Payouts, Webhooks)
  - Meta WhatsApp Cloud API

### Backend Architecture:
```
Routes
   ↓
Middleware (Auth, Role, Rate Limit, Validation)
   ↓
Controllers
   ↓
Services
   ↓
Repositories / Database / External Services
```

---

## 3. High-Level Architecture

```
                     USER BROWSER
                          │
                          ▼
                    React Frontend
                          │
                       HTTPS
                          │
                          ▼
                    AWS / ALB / Nginx
                          │
                          ▼
                   Node.js / Express
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
      PostgreSQL        AWS S3          External APIs
                                      │
                          ┌───────────┼───────────┐
                          ▼           ▼           ▼
                        MSG91        SES        Razorpay
                                                  +
                                             Meta WhatsApp
```

---

## 4. Frontend Structure

The main frontend structure is organized inside `frontend/src/`:

```
frontend/
└── src/
    ├── app/               # Zustand global stores (authStore.js, etc.)
    ├── assets/            # Static images, logos, product banners
    ├── components/        # Reusable UI components (Modals, Loaders, Topbars)
    ├── contexts/          # ThemeContext (Dark/Light mode)
    ├── hooks/             # Custom React hooks
    ├── layouts/           # Role-based Layouts (Public, Partner, Admin, SuperAdmin, Employee)
    ├── modules/           # Feature views grouped by domain & user role
    ├── routes/            # AppRoutes.jsx and Route Guards
    ├── services/          # Central Axios API client (api.js, auth.api.js)
    ├── main.jsx           # Main React DOM entry point
    └── index.css          # Global design tokens and utilities
```

---

## 5. Frontend Entry Point

**File:** `frontend/src/main.jsx`

This is the primary frontend entry point.

### Execution Flow:
```
main.jsx
   ↓
React Application Root
   ↓
ThemeContext / Global Providers
   ↓
BrowserRouter & AppRoutes
   ↓
Layout Wrappers (Role-specific)
   ↓
Pages / Modules Views
```

---

## 6. Frontend Routing

**File:** `frontend/src/routes/AppRoutes.jsx`

This file controls the complete frontend route structure and protection boundaries:

### Route Structure:
- **Public Routes:**
  - `/` (Home)
  - `/products` (Products Catalog)
  - `/credit-cards`
  - `/loans`
  - `/insurance`
  - `/apply/:slug` (Customer Referral Landing)
- **Partner Routes:**
  - `/partner/dashboard`
  - `/partner/kyc`
  - `/partner/leads`
  - `/partner/applications`
  - `/partner/wallet`
  - `/partner/products`
  - `/partner/messenger`
  - `/partner/profile`
- **Employee Routes:**
  - `/employee/dashboard`
  - `/employee/credit-cards`
  - `/employee/loan-on-card`
  - `/employee/smart-emi`
  - `/employee/messenger`
- **Admin Routes:**
  - `/admin/dashboard`
  - `/admin/direct-leads`
  - `/admin/applications`
  - `/admin/kyc-operator`
  - `/admin/reports`
  - `/admin/messenger`
- **Super Admin Routes:**
  - `/super-admin/overview`
  - `/super-admin/direct-leads`
  - `/super-admin/loan-applications`
  - `/super-admin/applications`
  - `/super-admin/employees`
  - `/super-admin/incentives`
  - `/super-admin/cms/products`
  - `/super-admin/cms/banks`
  - `/super-admin/cms/banners`
  - `/super-admin/audit`
  - `/super-admin/messenger`
  - `/super-admin/settings`

---

## 7. Frontend Layouts

**Directory:** `frontend/src/layouts/`

Important layouts include:
- `PublicLayout.jsx`: Header, Footer, and Navigation for consumer pages.
- `PartnerLayout.jsx`: Partner-specific sidebar, wallet balance badge, notifications, and navigation.
- `AdminLayout.jsx`: Admin and Operational operator workspace layout.
- `SuperAdminLayout.jsx`: Complete administrator console layout with audit log access and system controls.
- `EmployeeLayout.jsx`: Employee dashboard layout with real-time messenger badge.

---

## 8. Frontend Services & API Client

**Directory:** `frontend/src/services/`

### Central API Client: `api.js`
Responsibilities include:
- API base URL configuration (`import.meta.env.VITE_API_URL` or fallback to `/api/v1`)
- Automatic injection of Bearer token (`Authorization: Bearer <token>`)
- Request interceptor for headers and credentials
- Response interceptor for error normalization
- Automatic refresh token rotation upon encountering `401 Unauthorized`
- Consistent handling of rate limits and network errors

Other service files include `auth.api.js`, `partner.api.js`, `crm.api.js`.

---

## 9. Authentication Frontend

**Directory:** `frontend/src/modules/authentication/`

Key components:
- `PartnerLogin.jsx` & `AdminLogin.jsx`
- `PartnerRegister.jsx`
- `ForgotPassword.jsx` & `ResetPassword.jsx`

Supports:
- Email/Password login
- Mobile number + OTP authentication via MSG91
- Password reset flow with secure token validation
- Token refresh rotation and secure logout

---

## 10. Partner Panel

**Directory:** `frontend/src/modules/partner/`

### Partner Portal Features:
```
Partner
 │
 ├── Dashboard (`dashboard/PartnerDashboard.jsx`)
 ├── Profile (`profile/PartnerProfile.jsx`)
 ├── KYC (`kyc/PartnerKyc.jsx`)
 ├── Products Catalog (`products/PartnerProducts.jsx`)
 ├── Leads Management (`leads/PartnerCrm.jsx`)
 ├── Applications Tracker (`applications/PartnerApplications.jsx`)
 ├── Wallet & Withdrawals (`wallet/PartnerWallet.jsx`)
 ├── Commission Logs
 ├── Vault Document Storage (`vault/PartnerVault.jsx`)
 ├── Real-time Messenger (`messenger/PartnerMessenger.jsx`)
 └── In-App Notifications
```

---

## 11. Partner KYC

The KYC system processes confidential verification documents:
- PAN Card
- Bank Cheque / Passbook
- Selfie / Video Verification
- Aadhaar / Address Proof

### Backend KYC Routes:
- `POST /partner/kyc/upload-pan`
- `POST /partner/kyc/upload-cheque`
- `POST /partner/kyc/upload-video`
- `POST /partner/kyc/verify`
- `GET /partner/kyc/documents/:docId/view` (Generates temporary presigned S3 URL)

All uploaded documents are stored in private S3 buckets and accessed exclusively via short-lived presigned URLs.

---

## 12. Product System

**Backend Module:** `backend/src/modules/products/`  
**Frontend Module:** `frontend/src/modules/products/` & `frontend/src/modules/super-admin/cms/`

### Features:
- Financial product catalog (Credit Cards, Personal Loans, Home Loans, Insurance, FD Cards, Smart EMIs)
- Bank linking and category assignment
- Dynamic commission percentage and fixed payout rules
- Shareable referral link generation with click tracking and customer redirection

### Key APIs:
- `GET /products` — List active products
- `GET /products/links` — Referral tracking links
- `GET /redirect/:productId` — Partner referral redirection
- `POST /products/click` — Analytics click recording

---

## 13. CRM (Customer Relationship Management)

**Backend Module:** `backend/src/modules/crm/`  
**Frontend Module:** `frontend/src/modules/super-admin/crm/` & `frontend/src/modules/admin/`

The CRM manages:
- Customers & Contact Details
- Direct Leads & Telecaller Outreach
- Application Lifecycle & Status Transitions
- Multi-step Quick Decision (QD) Workflows
- Timeline notes and document attachments
- Lead-to-Employee and Lead-to-Partner assignments

---

## 14. Lead Management Flow

```
Partner / Public Link
         ↓
    Create Lead
         ↓
  Customer Profile
         ↓
 Application Created
         ↓
 Bank / Product Routed
         ↓
  Processing & QD
         ↓
Approval / Disbursement
         ↓
 Commission Released
```

### Developer Code Tracing:
1. Frontend Lead Page (`ManageDirectLeads.jsx` or `PartnerCrm.jsx`)
2. API service (`crm.api.js` / `api.js`)
3. Route (`backend/src/routes/index.js` → `modules/crm/card_application.route.js`)
4. Controller (`card_application.controller.js`)
5. Service (`card_application.service.js`)
6. Database (`direct_card_applications` table in PostgreSQL)

---

## 15. Application Management

Applications contain:
- Customer Data & Verified PAN
- Partner Reference (`partner_id`)
- Product & Bank (`product_id`, `bank_id`)
- Application Status (`PENDING`, `IN_PROGRESS`, `APPROVED`, `REJECTED`, `DISBURSED`)
- Uploaded Application Documents
- Activity Timeline & Audit Trail
- Generated Commission & Payout Status

When modifying application logic, start inside `backend/src/modules/crm/`.

---

## 16. Wallet System

The wallet handles partner financial transactions using a double-entry ledger.

```
Partner Earning
       ↓
Commission Generated
       ↓
Wallet Ledger Entry
       ↓
Available vs. Held Balance
       ↓
Withdrawal Request
       ↓
Admin / Super Admin Approval
       ↓
Settlement (Razorpay Payout)
```

### Key Tables:
- `wallets`: Total balance, available balance, held balance
- `wallet_transactions`: Credit/Debit transaction entries
- `wallet_ledger`: Detailed audit ledger for every transaction
- `withdrawal_requests`: Payout requests, bank details, processing status

---

## 17. Commission System

```
Application Approved / Disbursed
              ↓
  Eligibility Verification
              ↓
Commission Generated (Status: HELD)
              ↓
   Maturity / Holding Period
              ↓
   Automated Release Job
              ↓
Credit to Partner Available Wallet
```

### Status Values:
- `PENDING`: Awaiting verification
- `HELD`: In mandatory holding/cooling period
- `RELEASED` / `PAID`: Credited to wallet / settled

---

## 18. Scheduled Jobs

**Directory:** `backend/src/jobs/`

Scheduled tasks managed with `node-cron`:
- `commissionRelease.job.js`: Releases mature held commissions to partner wallets.
- `messengerPurge.job.js`: Cleans up messages and disk files older than 48 hours according to privacy policy.
- `financialReport.job.js`: Aggregates daily financial performance and commission summaries.

---

## 19. Admin Panel

Admin users handle day-to-day operations:
- Direct Leads Verification
- Application Processing & Document Review
- Partner Support & Account Verification
- Daily Reports & Withdrawal Queue
- In-App Messenger & Notification Center

---

## 20. Super Admin Panel

Super Admin possesses unrestricted system permissions:
- Master User & Employee Management
- Admin Role & Permission Assignments
- Product & Bank Master Catalog Management
- Homepage Banners & CMS Configuration
- Financial & Commission Master Settings
- Audit Trail Inspection & Read-only Messenger Audit Mode

---

## 21. Authentication Backend

**Directories:** `backend/src/modules/auth/`, `backend/src/middleware/authentication/`

Features:
- Access Token (Short-lived JWT) & Refresh Token (Long-lived secure token)
- bcrypt password hashing with salt rounds
- MSG91 OTP generation and verification
- Role-based authorization tokens

### Key Endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`

---

## 22. Authentication Middleware

**File:** `backend/src/middleware/authentication/jwtAuth.middleware.js`

Responsibilities:
1. Extract Bearer token from `Authorization` header
2. Verify token signature with `JWT_SECRET`
3. Load active user from PostgreSQL (`users` table)
4. Verify user account status (`is_active = true`)
5. Attach user object to `req.user` for downstream handlers

---

## 23. Request Validation

**Directory:** `backend/src/middleware/validation/`

Uses `express-validator` to sanitize and validate request bodies, query params, and URL params before reaching controllers.

---

## 24. Global Error Handling

**File:** `backend/src/middleware/error/error.middleware.js`

Standardizes all API error responses:
- PostgreSQL Unique Constraint (`23505`) → `409 Conflict`
- Foreign Key Violation (`23503`) → `400 Bad Request`
- Invalid UUID Format (`22P02`) → `400 Bad Request`
- JWT Expiry / Validation Errors → `401 Unauthorized`
- Uncaught Internal Errors → `500 Internal Server Error` (with sanitized output in production)

---

## 25. Backend Entry Point

**File:** `backend/src/server.js`

Initialization flow:
```
server.js
   │
   ├── 1. Load Environment Config (.env)
   ├── 2. Initialize Security Middlewares (CORS, Helmet, Rate Limiters)
   ├── 3. Initialize Database Connection Pool (PostgreSQL)
   ├── 4. Mount Master API Router (/api/v1)
   ├── 5. Initialize node-cron Scheduled Background Jobs
   ├── 6. Mount Global Error Handler
   └── 7. Start HTTP Server on Port 5000
```

---

## 26. Master Backend Routes

**File:** `backend/src/routes/index.js`

Central router mounting modules under `/api/v1`:
- `/api/v1/auth` → Authentication & OTP
- `/api/v1/partner` → Partner profiles & KYC
- `/api/v1/crm` → Direct leads & Applications
- `/api/v1/products` → Product catalog & referral links
- `/api/v1/banks` → Partner banks
- `/api/v1/wallet` → Partner wallet, ledger & payouts
- `/api/v1/messenger` → Team chat & real-time messaging
- `/api/v1/notifications` → System notifications & SSE
- `/api/v1/superadmin` → Super admin console & audit

---

## 27. Database (PostgreSQL)

40+ relational tables with foreign keys and indexes:
- `users`: Core authentication identity for all roles
- `partner_profiles`: Partner code, business type, parent partner
- `employees` & `employee_hierarchy`: Designation, manager ID, team leader ID
- `products` & `banks`: Financial product parameters, fees, interest rates
- `direct_card_applications`: Direct leads from public portal
- `applications`: End-to-end loan and credit card applications
- `wallets`, `wallet_transactions`, `wallet_ledger`: Financial ledger
- `messenger_conversations`, `conversation_participants`, `messages`, `message_attachments`: Chat system
- `notifications`: In-app notification store
- `audit_logs`: Activity logs for compliance

---

## 28. Database Migrations

**Directory:** `backend/src/database/migrations/`  
**Master Runner:** `backend/src/database/migrations/migrate.js`

Executes sequential DDL scripts to create tables, foreign keys, unique constraints, and performance indexes.

---

## 29. AWS S3 Integration

Private bucket (`gharkapaisa-documents`) stores:
- Partner PAN, Cheque & Video KYC files
- Customer identity & financial documents
- Application attachments & generated reports

**Security Rule:** Never make bucket publicly accessible. Access files solely via temporary presigned URLs (`AWS S3 presigned URL`) generated on the backend.

---

## 30. MSG91 (SMS & OTP)

Provides SMS delivery for:
- User registration & mobile verification OTP
- Application status updates
- Payout and commission release alerts

---

## 31. Email (AWS SES / SMTP)

Used for:
- Official email verification
- Password reset links
- Monthly statement and payout summaries
- Operational administrative alerts

All email configurations (`SES_FROM_EMAIL`, AWS credentials) must be configured in backend `.env`.

---

## 32. Razorpay Integration

Used for payment processing and automated partner payouts.

```
Frontend Action
      ↓
Backend Payment Initiation
      ↓
Razorpay Gateway
      ↓
Webhook Callback (`/api/v1/wallet/razorpay-webhook`)
      ↓
Signature Verification
      ↓
Database Ledger & Wallet Settlement
```

**Rule:** Always verify Razorpay webhook signature before updating transaction state in the database.

---

## 33. Real-Time Notifications & Messenger

**Backend Module:** `backend/src/modules/notifications/` & `backend/src/modules/messenger/`

- **Notifications:** Delivered in-app and synced via Server-Sent Events (SSE). Unread counts exclude `category = 'chat'` to prevent double badge counts.
- **Messenger:** Real-time team messaging supporting Direct, Group, and Application channels. Automatically supports up to 5,000 messages per conversation with sensitive number/PAN masking.

---

## 34. Multi-Language System

The platform supports 9 Indian languages:
1. English (`en`)
2. Hindi (`hi`)
3. Marathi (`mr`)
4. Gujarati (`gu`)
5. Bengali (`bn`)
6. Kannada (`kn`)
7. Tamil (`ta`)
8. Telugu (`te`)
9. Odia (`or`)

Translations are stored in `frontend/public/locales/{lang}/translation.json` and managed via `react-i18next`.

---

## 35. Theme System

Supports **Light Mode** and **Dark Mode**.
- Configured via `frontend/src/contexts/ThemeContext.jsx`
- Dynamically updates root CSS variables for background, surfaces, borders, and typography.

---

## 36. Complete API Request Flow

```
React Component
      ↓
API Service (`api.js`)
      ↓
Axios HTTP Request with JWT
      ↓
AWS ALB / Nginx Reverse Proxy
      ↓
Express.js (`server.js`)
      ↓
Route Definition (`routes/index.js`)
      ↓
Authentication Middleware (`jwtAuth.middleware.js`)
      ↓
Role Authorization Middleware (`role.middleware.js`)
      ↓
Rate Limiter Middleware (`rateLimit.middleware.js`)
      ↓
Validation Middleware (`validation.middleware.js`)
      ↓
Controller Layer
      ↓
Service Layer (Business Logic)
      ↓
PostgreSQL / AWS S3 / External APIs
      ↓
Standardized JSON Response
      ↓
Axios Response Interceptor
      ↓
React State Update (Zustand / useState)
```

---

## 37. Feature Development Protocol (How to Trace & Add Features)

When asked to implement or modify a feature (e.g., *"Add a WhatsApp button to send a partner report"*):

1. **Find Frontend Page** → Locate relevant view in `frontend/src/modules/`.
2. **Find API Service** → Check API calls in `frontend/src/services/`.
3. **Find Backend Route** → Check endpoint in `backend/src/routes/index.js`.
4. **Find Controller** → Inspect controller in `backend/src/modules/{feature}/`.
5. **Find Service** → Inspect business logic in `{feature}.service.js`.
6. **Find Database Model** → Check PostgreSQL schema and migrations.
7. **Check Authorization** → Ensure proper role guards (`role.middleware.js`).
8. **Implement Changes** → Modify backend and frontend cleanly.
9. **Test API Endpoints** → Verify status codes, payloads, and error conditions.
10. **Test UI** → Confirm responsive design, themes, and translations.

---

## 38. Example: Partner Wallet Tracing

- **Frontend:** `frontend/src/modules/partner/wallet/PartnerWallet.jsx`
- **API Service:** `frontend/src/services/partner.api.js`
- **Backend Route:** `backend/src/routes/index.js` → `modules/wallet/route.js`
- **Controller:** `backend/src/modules/wallet/controller.js`
- **Service:** `backend/src/modules/wallet/service.js`
- **Database Tables:** `wallets`, `wallet_transactions`, `wallet_ledger`

---

## 39. Example: Partner KYC Tracing

- **Frontend:** `frontend/src/modules/partner/kyc/PartnerKyc.jsx`
- **API Service:** `frontend/src/services/partner.api.js`
- **Backend Route:** `backend/src/modules/partner/route.js`
- **Controller:** `backend/src/modules/partner/controller.js`
- **Service:** `backend/src/modules/partner/service.js`
- **Storage:** AWS S3 Private Bucket via Presigned URLs
- **Database Tables:** `partner_profiles`, `partner_kyc_documents`

---

## 40. Example: Login Tracing

- **Frontend:** `frontend/src/modules/authentication/login/PartnerLogin.jsx`
- **API Service:** `frontend/src/services/auth.api.js` (`POST /api/v1/auth/login`)
- **Backend Route:** `backend/src/modules/auth/route.js`
- **Controller:** `backend/src/modules/auth/controller.js`
- **Service:** `backend/src/modules/auth/service.js`
- **Database Tables:** `users`
- **Output:** JWT Access & Refresh tokens

---

## 41. WhatsApp Integration — Planned Architecture

For sending reports and documents to Partners or Employees while presenting a single unified business identity:

```
Super Admin / Admin / HR
            │
            ▼
GharKaPaisa Admin Portal
            │
            ▼
Role & Permission Verification
            │
            ▼
WhatsApp Service (`backend/src/modules/whatsapp/`)
            │
            ▼
Meta WhatsApp Cloud API Gateway
            │
            ▼
GharKaPaisa Official Business Number
            │
            ▼
Partner / Employee Recipient
```

*The external recipient always interacts with the official GharKaPaisa WhatsApp number, while internal database records log the initiating staff member.*

---

## 42. Recommended WhatsApp Backend Structure

Module path: `backend/src/modules/whatsapp/`
- `whatsapp.routes.js`: Public webhook and admin send endpoints
- `whatsapp.controller.js`: Request validation and response dispatch
- `whatsapp.service.js`: Meta API HTTP communication and template formatting
- `whatsapp.webhook.controller.js`: Inbound message & delivery event handlers
- `whatsapp.template.service.js`: Template definitions and parameter binding

### Database Schema (`whatsapp_messages`):
- `id`, `sender_user_id`, `recipient_user_id`, `recipient_mobile`, `template_name`, `message_type`, `document_id`, `meta_message_id`, `status` (`queued`, `sent`, `delivered`, `read`, `failed`), `sent_at`, `delivered_at`, `read_at`, `failed_at`

---

## 43. WhatsApp Webhook Architecture

- **Verification:** `GET /api/v1/whatsapp/webhook` (Meta Hub Challenge Verification)
- **Delivery Events:** `POST /api/v1/whatsapp/webhook` (Sent, Delivered, Read, Inbound replies)

```
Meta Cloud
    ↓ (HTTPS)
AWS ALB / Nginx
    ↓
Express.js
    ↓
WhatsApp Webhook Controller
    ↓
PostgreSQL Event Log
```

---

## 44. Environment Variables

Production secrets are managed via environment variables:

```env
# Server Config
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/gharkapaisa
DB_HOST=rds-endpoint
DB_PORT=5432
DB_NAME=gharkapaisa
DB_USER=postgres
DB_PASSWORD=secret

# Security & JWT
JWT_SECRET=super-secret-jwt-key
REFRESH_TOKEN_SECRET=super-secret-refresh-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS S3 & SES
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=secret...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=gharkapaisa-documents
SES_FROM_EMAIL=no-reply@gharkapaisa.in

# MSG91 (SMS & OTP)
MSG91_AUTH_KEY=...
MSG91_OTP_TEMPLATE_ID=...

# Razorpay
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# WhatsApp Meta API
META_WHATSAPP_TOKEN=...
META_PHONE_NUMBER_ID=...
META_WHATSAPP_BUSINESS_ACCOUNT_ID=...
```

---

## 45. Production Architecture

- **Web / Frontend:** Nginx serving compiled Vite production build (`https://gharkapaisa.in`)
- **API / Backend:** Node.js Express managed via PM2 (`https://api.gharkapaisa.in`) listening on `127.0.0.1:5000`
- **Database:** AWS RDS PostgreSQL Multi-AZ
- **Storage:** AWS S3 Private Bucket (`gharkapaisa-documents`)

---

## 46. PM2 Process Management

Backend PM2 process name: `gharkapaisa-backend`

### Common PM2 Commands:
```bash
# Check status
pm2 status

# View live backend logs
pm2 logs gharkapaisa-backend

# Restart with updated environment variables
pm2 restart gharkapaisa-backend --update-env

# Process details
pm2 describe gharkapaisa-backend
```

---

## 47. Backend Port & Health Check

- **Port:** `5000`
- **Health Check Endpoint:** `GET /health`
- **Expected Response:** `{"status":"ok"}` with HTTP 200

*Always verify `/health` before investigating application-level failures.*

---

## 48. Current AWS Infrastructure

```
AWS Infrastructure
 ├── Application Load Balancer (ALB)
 ├── Auto Scaling Group (ASG)
 ├── EC2 Instances (Amazon Linux 2023 / Ubuntu)
 ├── Security Groups (Port 80/443 public, Port 5000 internal)
 ├── Amazon RDS PostgreSQL
 ├── Amazon S3 (Document Storage)
 └── IAM Roles & Policies
```

---

## 49. ALB Health Check Rule

- **Protocol:** `HTTP`
- **Port:** `5000`
- **Path:** `/health`
- **Rule:** `/health` must NEVER be protected with JWT authentication. It must respond with HTTP 200.

---

## 50. Rate Limiting & 429 Prevention

The backend uses `express-rate-limit`:
- Global API limiter
- Login limiter (20 attempts per 15 min on failed attempts)
- OTP limiter (10 requests per 10 min)
- Messenger limiter (60 requests per minute)

When investigating `429 Too Many Requests`:
1. Check for infinite loops in `useEffect` hooks
2. Check for duplicate button clicks / missing debounces
3. Check Axios retry interceptors

---

## 51. Form Submit Best Practices

Avoid attaching click handlers to submit buttons inside forms:
```jsx
// ❌ WRONG (May trigger duplicate requests)
<form onSubmit={handleLogin}>
  <button onClick={handleLogin}>Login</button>
</form>

// ✅ CORRECT
<form onSubmit={handleLogin}>
  <button type="submit" disabled={loading}>
    {loading ? 'Logging in...' : 'Login'}
  </button>
</form>
```

---

## 52. Database Foreign Keys & Safe Deletions

The PostgreSQL database maintains strict relational integrity:
```
users
 ├── partner_profiles
 ├── employees
 ├── customers
 ├── applications
 ├── direct_card_applications
 ├── wallets & wallet_transactions
 ├── messenger_conversations & messages
 ├── notifications
 └── audit_logs
```

**Rule:** Never directly execute `DELETE FROM users WHERE id = ...` without safely handling or soft-deleting dependent records.

---

## 53. Developer Security Rules

1. **NEVER** commit `.env`, credentials, or keys to Git.
2. **NEVER** expose AWS Secret Keys, S3 credentials, Meta Tokens, or DB passwords to frontend code.
3. Keep all private file downloads behind presigned URLs.
4. Always validate user roles and permissions on the backend.

---

## 54. Developer Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/pratapsanap1/GharKaPaisa.git
cd GharKaPaisa

# 2. Setup Backend
cd backend
npm install
cp .env.example .env # Configure local database and JWT secrets
npm run dev

# 3. Setup Frontend
cd ../frontend
npm install
npm run dev
```

---

## 55. Recommended Reading Order for New Developers

1. `DEVELOPER_GUIDE.md` (This document)
2. `README.md`
3. `backend/src/server.js` & `backend/src/routes/index.js`
4. `backend/src/middleware/`
5. `backend/src/modules/`
6. `backend/src/database/migrations/`
7. `frontend/src/main.jsx` & `frontend/src/routes/AppRoutes.jsx`
8. `frontend/src/services/api.js`
9. `frontend/src/layouts/`
10. `frontend/src/modules/`

---

## 56. Code Reuse & Feature Extension Rule

Before writing any new component, service, or API:
1. **Search First:** Look for existing implementations (e.g., S3 uploaders, modal wrappers, response formatters).
2. **Extend Existing Modules:** Add to existing domain modules rather than creating duplicate standalone files.

---

## 57. Debugging Checklist

### When an API Fails:
1. Browser DevTools → Network tab → Request URL, Payload & Response body
2. Check HTTP Status (`401`, `403`, `404`, `422`, `429`, `500`)
3. Check PM2 live logs: `pm2 logs gharkapaisa-backend`
4. Trace Route → Controller → Service → PostgreSQL query

### When ALB / EC2 Target is Unhealthy:
1. Check PM2: `pm2 status`
2. Check Port: `ss -lntp | grep :5000`
3. Test locally: `curl -I http://127.0.0.1:5000/health`
4. Check ALB Target Group health reason and Security Groups

---

## 58. How to Trace Database Issues

```
API Endpoint
     ↓
Controller
     ↓
Service Method
     ↓
SQL Query / Query Builder
     ↓
PostgreSQL Table
     ↓
Foreign Keys & Indexes
```

---

## 59. How to Trace Frontend Issues

```
Page View
     ↓
Component Hierarchy
     ↓
React State / Zustand Store
     ↓
API Client (`services/api.js`)
     ↓
Axios Network Request
     ↓
Backend Response
```

---

## 60. Complete Architecture Mental Model

```
                    GHARKAPAISA
                         │
                 ┌───────┴────────┐
                 │                │
             FRONTEND          BACKEND
                 │                │
              React           Express
                 │                │
              Router          Middleware
                 │                │
             Modules           Routes
                 │                │
             Services        Controllers
                 │                │
              Axios            Services
                 │                │
                 └───────┬────────┘
                         │
                    PostgreSQL
                         │
              ┌──────────┼──────────┐
              │          │          │
             S3        MSG91       SES
                                   
                         +
                     Razorpay
                         +
                 WhatsApp / Meta API
```

---

## 61. Most Important Directories

### Frontend (`frontend/src/`)
- `app/` — Global stores (Zustand)
- `components/` — Reusable UI elements
- `contexts/` — Context providers (ThemeContext)
- `hooks/` — Custom hooks
- `layouts/` — Role-based shell layouts
- `modules/` — Domain pages & views
- `routes/` — App routing & route guards
- `services/` — Axios API client & helpers

### Backend (`backend/src/`)
- `config/` — Database pool & logger config
- `database/` — Migrations & seeders
- `jobs/` — Cron background workers
- `middleware/` — Auth, role, rate limit & error handling
- `modules/` — Domain controllers, services, repositories & routes
- `routes/` — Global API routing table (`index.js`)
- `services/` — Shared external services (S3, SES, MSG91)
- `utils/` — Response helpers, money math & formatters
- `server.js` — Application entry point

---

## 62. Developer Golden Rule

```
UI (React Component)
        ↓
API Service (`services/api.js`)
        ↓
Route (`routes/index.js`)
        ↓
Middleware (JWT Auth, Role Guard, Rate Limit, Validation)
        ↓
Controller Layer
        ↓
Service Layer (Business Logic)
        ↓
Database (PostgreSQL) / External APIs (S3, MSG91, SES, Razorpay)
        ↓
Standard Response
        ↓
UI Update
```

*By following this chain, any developer can quickly locate, debug, and implement features anywhere in the GharKaPaisa platform.*

---

## 63. Detailed Portals, Roles & Designation Permissions Matrix

### 🛠️ Technology Stack & External Tools Used

#### **Frontend Stack**
- **Core Framework:** React 19 + Vite
- **Routing:** React Router v6
- **State Management:** Zustand (e.g., `authStore.js`)
- **HTTP Client:** Axios (Centralized API client with auto JWT refresh rotation)
- **Internationalization (i18n):** `react-i18next` (Supports 9 Indian Languages: English, Hindi, Marathi, Gujarati, Bengali, Kannada, Tamil, Telugu, Odia)
- **Styling:** Vanilla CSS, CSS Variables, ThemeContext (Dynamic Light / Dark mode)
- **Icons:** Lucide React, FontAwesome, React Icons (`react-icons/fa`, `react-icons/md`)

#### **Backend Stack**
- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL (AWS RDS PostgreSQL) with `pg` connection pool
- **Authentication:** JWT (Short-lived Access Token + Long-lived Refresh Token) & `bcryptjs`
- **Validation:** `express-validator`
- **Background Job Scheduler:** `node-cron`
- **Process Manager:** PM2 (`gharkapaisa-backend`)

#### **Third-Party Tools & Services**
| Service / Tool | Domain / Usage | Key Capabilities |
| :--- | :--- | :--- |
| **AWS S3** | Private Document Storage | Secure storage for KYC documents, PAN, cheques, application attachments. Accessed via short-lived AWS S3 Presigned URLs. |
| **AWS SES** | Transactional Email | Email verification, password resets, monthly statements, administrative notifications. |
| **MSG91** | SMS & OTP Gateway | Mobile OTP login/registration, application stage updates, payout alerts. |
| **Razorpay** | Payments & Payouts | Gateway integration, automated partner wallet withdrawals, webhook signature verification. |
| **Meta WhatsApp Cloud API** | Official Messaging | Sending template notifications, application tracking updates, and partner reports via official business number. |

---

### 🏛️ Panels (Portals) Breakdown

The platform consists of **5 main panels/portals**:

```
                       GHARKAPAISA PLATFORM
                                │
   ┌───────────────┬────────────┼────────────┬───────────────┐
   │               │            │            │               │
PUBLIC          PARTNER      EMPLOYEE      ADMIN        SUPER ADMIN
WEBSITE          PANEL        PANEL        PANEL          PANEL
```

#### 1️⃣ **Public Portal (Consumer Facing)**
- **Purpose:** Public marketing website, product browsing, and direct customer loan/card applications via partner referral links.
- **Pages:**
  - `/` — Homepage (Banners, top product showcase, lead forms)
  - `/products` — Product Catalog (Credit cards, Personal loans, Home loans, Smart EMIs, Insurance)
  - `/credit-cards` — Credit Card catalog & filtering
  - `/loans` — Personal & Business Loan options
  - `/insurance` — Insurance products
  - `/apply/:slug` — Partner Referral Landing Page (tracks `partner_code`)
  - `/privacy-policy` & `/terms` — Legal & policy pages
- **Key Features:**
  - Dynamic referral link landing with partner referral tracking
  - Customer direct lead submission form
  - Language switcher (9 Indian languages)
  - Dynamic product search & bank filter

#### 2️⃣ **Partner Panel (DSA / Agent Portal)**
- **Purpose:** Direct Sales Agents (DSAs), channel partners, and sub-agents to submit customer leads, track applications, view wallet balances, and request commission withdrawals.
- **Pages:**
  - `/partner/dashboard` — Overview (Total leads, approved earnings, pending payouts, quick action links)
  - `/partner/kyc` — Partner Identity & Document Verification (PAN, Cheque, Video KYC)
  - `/partner/products` — Product catalog with commission rates & custom shareable referral links
  - `/partner/leads` — Lead management CRM (Add leads, track telecaller outreach)
  - `/partner/applications` — Real-time tracking of submitted card/loan applications
  - `/partner/wallet` — Double-entry ledger (Available balance, Held earnings, Payout history, Withdrawal requests)
  - `/partner/vault` — Document vault for uploaded partner files
  - `/partner/messenger` — Team & support chat with admins
  - `/partner/profile` — Account settings & referral code management
- **Key Features:**
  - Unique shareable referral link generator with automatic partner ID injection
  - Double-entry wallet system (Held vs. Released balance tracking)
  - Multi-step lead creation & status progression
  - Presigned S3 document upload for confidential KYC files

#### 3️⃣ **Employee Panel (Internal Sales Staff)**
- **Purpose:** Internal sales executive workspace for managing assigned customer leads, processing Smart EMI / Loan on Credit Card applications, and team messaging.
- **Pages:**
  - `/employee/dashboard` — Personal performance stats, assigned leads summary, monthly targets
  - `/employee/credit-cards` — Credit Card lead processing
  - `/employee/loan-on-card` — Loan on Credit Card (Insta Jumbo) applications
  - `/employee/smart-emi` — Smart EMI conversion leads
  - `/employee/messenger` — Internal team chat & notification hub
- **Key Features:**
  - View assigned customer leads
  - Real-time unread messenger badge in navbar
  - Customer follow-up logging and stage updates

#### 4️⃣ **Admin Panel (Operations & Operator Portal)**
- **Purpose:** Operational workspace for verification operators, lead processing teams, document verification staff, and withdrawal handling.
- **Pages:**
  - `/admin/dashboard` — Operational metrics, lead pipeline, daily processing statistics
  - `/admin/direct-leads` — Customer direct lead assignment & verification
  - `/admin/applications` — Multi-stage application processing list
  - `/admin/kyc-operator` — Partner KYC review & approval queue
  - `/admin/reports` — Verification report generator & modal workspace
  - `/admin/messenger` — Administrative chat console
- **Key Features:**
  - Document Verification Modal with Quick Decision (QD), Remark, and Final Status workflows
  - Operator-specific workspace filters (PAN Checker, Remark Operator, Final Status Operator)
  - S3 Private Document Viewer with presigned links

#### 5️⃣ **Super Admin Panel (Master Control Console)**
- **Purpose:** Full administrative control over the entire system, product masters, employee management, commission payouts, CMS settings, and audit logs.
- **Pages:**
  - `/super-admin/overview` — High-level KPI dashboard (Total volume, payout release metrics, lead breakdown)
  - `/super-admin/direct-leads` — System-wide lead management & reassignment
  - `/super-admin/loan-applications` — Dedicated Loan & Smart EMI management workspace
  - `/super-admin/applications` — Master application tracking list with 360° drawer
  - `/super-admin/employees` — Employee master management, designation assignment, manager hierarchy
  - `/super-admin/incentives` — Employee incentive analytics, release tracking, payout summary
  - `/super-admin/cms/products` — CMS Product Catalog builder (Commission rates, eligibility, bank linking)
  - `/super-admin/cms/banks` — Bank Master Management (SBI, HDFC, TATA HDFC, ICICI, etc.)
  - `/super-admin/cms/banners` — Public portal homepage banner editor
  - `/super-admin/audit` — System-wide audit log inspector & read-only chat audit
  - `/super-admin/settings` — System-wide configuration (Digital journey default links, API keys)
  - `/super-admin/messenger` — Master chat console
- **Key Features:**
  - Unrestricted data access and operational overrides
  - Incentive payout release & commission matrix configuration
  - Role & Designation assignment for operational staff
  - Complete audit trail logging across all user actions

---

### 🔐 Roles & Designation Access Permission Matrix

Access in GharKaPaisa is governed by both **Primary System Roles** (`role`) and **Operational Designations** (`designation`).

#### Primary System Roles (`role`)

| Role | Access Level / Permissions | Visible Panels & Pages |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Unrestricted read/write/delete access across all modules, CMS settings, audit logs, employee hierarchy, and financial settings. | Super Admin Panel (All `/super-admin/*` routes) |
| **`ADMIN` / `OPERATIONS_HEAD`** | System-wide operational control, operational verification, partner KYC approvals, report views, but restricted from structural CMS/settings edits. | Admin Panel (`/admin/*`) & Selected Super Admin views |
| **`OPERATOR`** | Day-to-day document processing, lead verification, QD processing based on specific assigned designation. | Admin Panel (`/admin/*`) |
| **`PARTNER`** | Access restricted strictly to own leads, own application tracking, own wallet balance, referral link generator, and KYC upload. | Partner Panel (`/partner/*`) |
| **`TEAM_MEMBER`** | Sub-partner under a main partner with lead submission rights. Cannot request withdrawals directly. | Partner Panel (`/partner/*`) |
| **`EMPLOYEE`** | Access restricted to assigned leads, card processing, loan-on-card processing, and employee dashboard. | Employee Panel (`/employee/*`) |

#### Operational Operator Designations (`designation`)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ADMIN DOCUMENT VERIFICATION WORKFLOW                       │
├───────────────────┬───────────────────┬───────────────────┬─────────────────────┤
│   PAN CHECKER     │  REMARK OPERATOR  │    QD OPERATOR    │ FINAL STATUS OPERATOR│
│ (Pan Check Mode)  │  (Stage Tracking) │   (Quick Details) │  (Bank Final Status)│
└───────────────────┴───────────────────┴───────────────────┴─────────────────────┘
```

| Designation | Allowed Actions / Viewable Tabs | PAN Number Visibility Rule | Mobile Number Rule | Special Controls / Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **`PAN CHECKER`** | • Can review PAN status.<br>• Access to **QD / PAN Check Review Card**.<br>• Restricted from editing Bank Remarks or Final Status. | Visible in PAN Check review section for verification. | Masked (e.g. `9876******`) to protect customer privacy. | Quick PAN Remark dropdown options (`PAN OK`, `S5`, `RS5`, `DUXP`, `FD1`, etc.). |
| **`REMARK OPERATOR`** | • Access to **Application Remark & Stage Tracking** tab.<br>• Edits Appcode Status, Soft Approval, VKYC Stage, IQA Stage, Dispatch Status.<br>• Enters Bank Application Number. | Visible in header/form. | Masked (e.g. `9876******`). | Special Remark Operator Review & Submit panel. |
| **`QD OPERATOR`** | • Access to **QD / Customer Details** tab.<br>• Edits customer name, DOB, email, address, company, income details.<br>• Restricted from final status approval. | Visible in QD form. | Unmasked for verification. | Quick customer detail updating & Re-QD triggering. |
| **`FINAL STATUS OPERATOR`** | • Access to **BOTH Remark & Final** action buttons side-by-side.<br>• Edits Bank Final Status, Digital Card Issued, Bank Current Lead Status, In Process Stage, Rejection Reasons.<br>• Edits Smart EMI / Loan-on-Card disburse amounts & tenure. | 🔒 **Hidden** by default (`🔒 Fill Bank App No. to reveal PAN`).<br>✨ **Unlocked & Revealed** automatically when **Bank Application Number** is filled! | Unmasked. | Dedicated **Final Status Operator Workspace Card** with dual 1-click **Remark** & **Final** buttons. |
| **`ADMINISTRATIVE SALES EXECUTIVE`** | • View customer details & stage remarks.<br>• Restricted from setting Final Bank Approved/Rejected status. | Visible. | Unmasked. | Read-only mode on Bank Final Status tab. |
| **`SUPER ADMIN / ADMIN`** | • Full read/write access to all tabs (QD, Remark, Final, Audit Timeline).<br>• Operational verification & Super Admin approval overrides. | Always Visible. | Unmasked. | Unlocked status override button ("Mark Operational Verified", "Super Admin Approved"). |

