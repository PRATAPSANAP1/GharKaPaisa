# GharKaPaisa (yohesa) - Developer Guide & Project Code Map

Welcome to the **GharKaPaisa** project codebase! This document provides a complete technical blueprint of the application architecture, directory structure, module mapping, backend database models, role-based security, key workflows, and exact file locations for every feature.

---

## 📍 1. Executive Summary & Tech Stack

**GharKaPaisa** is an end-to-end financial product distribution platform designed to process applications for **Credit Cards, Personal/Home/Business Loans, Loan on Credit Cards, Smart EMIs, Insurance, and Savings Accounts**. 

It serves **Super Admins, Admins, KYC Operators, HR, Employees (Telecallers, Team Leaders), Partners (DSA/Agents), and Customers**.

### Tech Stack Breakdown
* **Frontend**: React 19, Vite, React Router v6, Zustand (State Management), Vanilla CSS with Dynamic Theme Context, FontAwesome / React Icons (`fa`).
* **Backend**: Node.js, Express.js (Modular Monolith Controller-Service-Repository Pattern).
* **Database**: PostgreSQL (AWS RDS PostgreSQL) using `pg` connection pool with automatic retry logic.
* **Storage & CDN**: AWS S3 Bucket (`gharkapaisa-documents`) & Amazon CloudFront.
* **Communication & OTP**: MSG91 SMS & WhatsApp API gateway.
* **Payments**: Razorpay Payment & Payout Webhooks.

---

## 📁 2. Repository Directory Map

```
yohesa/
├── backend/
│   ├── src/
│   │   ├── config/             # DB & Logger configuration
│   │   ├── database/           # Migrations & Database Seeding scripts
│   │   ├── middleware/         # JWT Auth & Role Authorization Middlewares
│   │   ├── modules/            # Domain-driven backend modules
│   │   ├── routes/             # Global API routing table (index.js)
│   │   ├── utils/              # Response helpers, pagination & S3 uploaders
│   │   └── server.js           # Express app entry point
│   └── .env                    # Backend environment config
├── frontend/
│   ├── src/
│   │   ├── app/                # Zustand global stores (authStore, etc.)
│   │   ├── assets/             # Logos, icons, static assets
│   │   ├── components/         # Reusable UI components (Loaders, Modals, Topbar)
│   │   ├── contexts/           # ThemeContext (Dark/Light mode)
│   │   ├── layouts/            # Role-specific Layout wrappers
│   │   ├── modules/            # Page Views grouped by role/feature
│   │   ├── routes/             # AppRoutes routing engine & Protected Routes
│   │   ├── services/           # Axios API client setup
│   │   └── index.css           # Global design tokens and utilities
│   └── vite.config.js          # Vite configuration
├── DEVELOPER_GUIDE.md          # Complete project overview (This file)
└── README.md                   # Quick start instructions
```

---

## 🗺️ 3. Frontend Architecture & File Locations

All routes are defined in `frontend/src/routes/AppRoutes.jsx`.

### Layouts (`frontend/src/layouts/`)
* `SuperAdminLayout.jsx`: Topbar, Sidebar, Notification counter, and Navigation for Super Admins.
* `AdminLayout.jsx`: Layout for Admins, KYC Operators, and HR managers.
* `PartnerLayout.jsx`: Partner Portal dashboard wrapper with Wallet, Leads, and Products links.
* `EmployeeLayout.jsx`: Employee dashboard layout with real-time Messenger badge and notification counter.
* `PublicLayout.jsx`: Public header and footer wrapper for landing pages.

### Module Map (`frontend/src/modules/`)

| Module / Feature | Frontend File Path | Purpose / Description |
| :--- | :--- | :--- |
| **Authentication** | `frontend/src/modules/authentication/login/` | PartnerLogin, AdminLogin, ResetPassword, Register |
| **Super Admin Overview** | `frontend/src/modules/super-admin/dashboard/SuperAdminOverview.jsx` | High-level metrics, revenue stats, application volume |
| **Direct Leads CRM** | `frontend/src/modules/super-admin/crm/ManageDirectLeads.jsx` | Super Admin page (`/super-admin/direct-leads`) listing credit card, loan, and insurance direct leads (excludes Loan on Credit Card) |
| **Loan Applications CRM** | `frontend/src/modules/super-admin/crm/ManageLoanApplications.jsx` | Super Admin page (`/super-admin/loan-applications`) for Loan on Credit Card & Smart EMI processing with 3-step QD forms |
| **Applications CRM** | `frontend/src/modules/super-admin/crm/ManageApplications.jsx` | Unified application list and status updater |
| **Employee Management** | `frontend/src/modules/super-admin/employees/EmployeeManagement.jsx` | Super Admin UI to add, manage, and verify employees |
| **Employee Incentives** | `frontend/src/modules/super-admin/incentives/ManageEmployeeIncentives.jsx` | Incentive breakdown, payout releases, monthly analytics |
| **CMS Product Management** | `frontend/src/modules/super-admin/cms/ManageAdminProducts.jsx` | Add/Edit credit cards, loans, insurance, and bank details |
| **CMS Banks Management** | `frontend/src/modules/super-admin/cms/ManageBanks.jsx` | Manage partner banks and provider details |
| **CMS Banners & Sections** | `frontend/src/modules/super-admin/banners/ManageBanners.jsx` | Homepage slider banners and section management |
| **Audit Logs** | `frontend/src/modules/super-admin/audit/AuditLogs.jsx` | Security audit trail of user actions |
| **Admin Direct Leads** | `frontend/src/modules/admin/users/ManageLeads.jsx` | Admin direct leads management |
| **Admin Applications** | `frontend/src/modules/admin/reports/ManageApplications.jsx` | Admin application tracking |
| **KYC Operator Portal** | `frontend/src/modules/admin/kyc-operator/KycOperatorDashboard.jsx` | Verification queue for customer/partner document verification |
| **Partner Dashboard** | `frontend/src/modules/partner/dashboard/PartnerDashboard.jsx` | Partner overview, metrics, share link generator |
| **Partner Products** | `frontend/src/modules/partner/products/PartnerProducts.jsx` | List of products available for partners to sell |
| **Partner CRM / Leads** | `frontend/src/modules/partner/leads/PartnerCrm.jsx` | Lead tracking for partners |
| **Partner Wallet** | `frontend/src/modules/partner/wallet/PartnerWallet.jsx` | Partner commission earnings, balance, and withdrawal requests |
| **Employee Dashboard** | `frontend/src/modules/employee/EmployeeDashboard.jsx` | Telecaller / Employee sales targets, leads, daily summary |
| **Employee Credit Cards** | `frontend/src/modules/employee/credit-cards/EmployeeCreditCards.jsx` | Product catalog for employees |
| **Employee Loan on Card** | `frontend/src/modules/employee/credit-cards/EmployeeLoanOnCreditCard.jsx` | Dedicated loan on credit card portal for employees |
| **Employee Smart EMI** | `frontend/src/modules/employee/credit-cards/EmployeeSmartEmi.jsx` | Smart EMI conversion portal for employees |
| **HR Dashboard** | `frontend/src/modules/hr/HRDashboard.jsx` | Candidate management and onboarding overview |
| **Messenger View** | `frontend/src/modules/messenger/MessengerView.jsx` | Real-time chat & team messaging UI across all roles |
| **Notification Center** | `frontend/src/modules/notifications/NotificationCenter.jsx` | Bell notification list and read status toggles |
| **Public Landing Page** | `frontend/src/modules/home/Home.jsx` | Main consumer website |
| **Product Apply Landing** | `frontend/src/modules/products/ProductApplyLanding.jsx` | Public referral link landing page for customer application |

---

## ⚡ 4. Backend Architecture & Module Map

The backend is built around a domain-centric structure inside `backend/src/modules/`.

### Entry Point & Central Routing
* **Server Entry Point**: `backend/src/server.js`
* **Central Router**: `backend/src/routes/index.js`
* **Database Connection**: `backend/src/config/database.js` (Handles AWS RDS connection pool and retry logic)

### Key Backend Modules (`backend/src/modules/`)

| Module | File Path | Responsibilities |
| :--- | :--- | :--- |
| **Auth** | `modules/auth/` (`controller.js`, `route.js`) | User login, JWT token issue, password reset, token refresh |
| **CRM / Applications** | `modules/crm/` (`card_application.controller.js`, `application.controller.js`) | Lead submission, direct applications, loan applications filtering |
| **Messenger System** | `modules/messenger/` (`messenger.repository.js`, `messenger.service.js`, `messenger.controller.js`, `messenger.routes.js`) | Real-time messaging, conversation management, message read sync |
| **Notifications** | `modules/notifications/` (`controller.js`, `route.js`) | System notifications, unread count badge calculation (excludes chat category to prevent double counting) |
| **Products & Banks** | `modules/products/` & `modules/banks/` | Financial product CRUD, slug generation, bank linking |
| **Partner & Wallet** | `modules/partner/` & `modules/wallet/` | Partner onboarding, referral tracking, wallet balance, withdrawal approval & Razorpay webhooks |
| **Employee & Incentives**| `modules/employee/` & `modules/employee-management/` | Employee KYC, team hierarchies, incentive payout calculations |
| **Super Admin** | `modules/super-admin/` (`controller.js`, `route.js`, `workingHours.controller.js`) | System settings, admin bank assignments, audit log queries |
| **Database Seeds** | `database/seeds/` (`seed-smart-emi-locc.js`, `seed-credit-cards.js`, `seed-new-banks.js`) | Automated product and bank seeders |

---

## 🔒 5. Roles & Access Security Model

System permissions are enforced via two backend middleware layers:
1. `jwtAuth` (`backend/src/middleware/authentication/jwtAuth.middleware.js`): Validates incoming `Authorization: Bearer <token>` header.
2. `roleCheck` (`backend/src/middleware/authorization/role.middleware.js`): Enforces allowed roles.

### Recognized User Roles:
* **`SUPER_ADMIN`**: Unrestricted access to all pages, financial overview, audit logs, and settings.
* **`ADMIN`**: Manages applications, partners, assigned bank products, and leads.
* **`KYC_OPERATOR`**: Reviews customer document uploads and approves/rejects KYC status.
* **`HR`**: Candidate onboarding, interview schedules, employee documentation.
* **`TELECALLER` / `TEAM_LEADER` / `EMPLOYEE`**: Customer outreach, application submissions, team lead management.
* **`PARTNER` / `TEAM_MEMBER`**: Direct Selling Agents (DSA) who generate leads, earn commissions, and request payouts.

---

## 📊 6. Core Database Schema & Tables Map

PostgreSQL tables managed via migrations (`backend/src/database/migrations/`):

1. **`users`**:
   - `id`, `name`, `email`, `password_hash`, `mobile`, `role`, `is_active`, `created_at`
2. **`banks`**:
   - `id`, `name`, `short_code`, `logo_url`, `is_active`
3. **`products`**:
   - `id`, `bank_id`, `name`, `category`, `sub_category`, `description`, `slug` (UNIQUE), `annual_fee`, `joining_fee`, `interest_rate`, `is_active`, `status`
4. **`direct_card_applications`** (Direct Product Leads):
   - `id`, `customer_name`, `mobile`, `bank_name`, `card_name`, `category`, `status` (`verified`, `contacted`, `converted`, `rejected`)
5. **`applications`**:
   - `id`, `app_number`, `lead_id`, `bank_id`, `product_id`, `customer_name`, `customer_mobile`, `status`
6. **`partner_commissions` & `partner_wallets`**:
   - Tracks earnings, hold periods, payout logs, and withdrawal requests.
7. **`employee_incentive_transactions`**:
   - `id`, `employee_id`, `application_id`, `amount`, `status` (`pending`, `released`, `paid`)
8. **`messenger_conversations` & `messenger_messages`**:
   - Real-time chat messages, participant tracking, and cleared conversation timestamps (`cleared_at`).
9. **`notifications`**:
   - `id`, `user_id`, `title`, `message`, `category`, `is_read`

---

## 🔄 7. Key System Workflows

### A. Direct Leads vs Loan Applications Handling
* **Direct Product Leads (`/super-admin/direct-leads`)**: Fetches from `GET /card-applications`. Back-end explicitly excludes `loan_on_credit_card` and `smart_emi` categories to ensure only direct credit cards, loans, and insurance appear here.
* **Loan Applications (`/super-admin/loan-applications`)**: Fetches from `GET /card-applications?category=loan_applications`. Specifically processes `loan_on_credit_card` and `smart_emi` applications using a 3-step Quick Decision (QD) workflow modal.

### B. Product Seeding Safety (`seed-smart-emi-locc.js`)
* Seeding scripts check product existence using `SELECT id FROM products WHERE slug = $1 OR (bank_id = $2 AND LOWER(name) = LOWER($3)) OR LOWER(name) = LOWER($3) LIMIT 1`.
* If found, the product record is updated by `id`, preventing unique constraint collisions on `slug` (`idx_products_slug`).

### C. Notification & Messenger Counter Sync
* System notifications for messenger chats (`category = 'chat'`) are automatically marked `is_read = true` when a user reads a chat conversation (`messenger.repository.js`).
* Unread counters (`notifications/controller.js`) exclude `chat` notifications from system bell badges to prevent double-counting.

---

## 🚀 8. Developer Quick Start Commands

### Backend Setup:
```bash
cd backend
npm install
# Configure your .env file with DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
npm run dev
```

### Database Seeding:
```bash
node backend/src/database/seeds/seed-new-banks.js
node backend/src/database/seeds/seed-credit-cards.js
node backend/src/database/seeds/seed-smart-emi-locc.js
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---
*Documented for GharKaPaisa Engineering Team. Maintain and update this guide when adding new modules or backend API routes.*
