# GharKaPaisa Mobile Application

**Phase 1: Architecture Audit & Planning Document**

---

## 1. Existing Web Architecture

### Frontend Stack
- **Framework:** React 19.2.6
- **Build Tool:** Vite 8.0.12
- **Routing:** React Router DOM 7.17.0
- **State Management:** Zustand 5.0.14
- **HTTP Client:** Axios 1.17.0
- **UI Components:** Framer Motion, Lucide React, React Icons
- **Charts:** Recharts 3.8.1
- **Internationalization:** i18next

### Frontend Directory Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── App.jsx              # Root component
│   │   └── store/
│   │       └── authStore.js     # Zustand auth state
│   ├── routes/
│   │   ├── AppRoutes.jsx        # Route definitions
│   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   └── RoleRoute.jsx        # Role-based guard
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   ├── PartnerLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── SuperAdminLayout.jsx
│   │   └── EmployeeLayout.jsx
│   ├── modules/
│   │   ├── authentication/     # Login, Register, Reset Password
│   │   ├── home/               # Public pages
│   │   ├── partner/            # Partner dashboard & features
│   │   ├── admin/              # Admin modules
│   │   ├── super-admin/        # Super Admin modules
│   │   ├── employee/           # Employee modules
│   │   ├── customer/           # Customer portals
│   │   ├── products/           # Product catalog
│   │   ├── notifications/      # Notification center
│   │   └── chatbot/            # AI chatbot
│   ├── services/
│   │   └── api.js              # Axios instance with interceptors
│   ├── config/
│   │   └── api.js              # API URL configuration
│   └── components/
│       └── ...
```

### Frontend Authentication Flow
1. **OTP-Based Login:** Email/mobile OTP verification (no password login)
2. **Token Storage:** 
   - Access token: In-memory + localStorage fallback
   - Refresh token: HttpOnly cookie (server-side)
3. **Token Refresh:** Automatic rotation on 401 responses
4. **Session Restoration:** Silent refresh on app load using cookie
5. **Session Expiry:** Clears state on 401 refresh failure

---

## 2. Existing Backend API Architecture

### Backend Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (jsonwebtoken)
- **File Storage:** AWS S3 + CloudFront
- **Email:** AWS SES
- **SMS:** MSG91
- **Payment:** Razorpay
- **OTP:** MSG91 SendOTP SDK

### Backend Directory Structure
```
backend/
├── src/
│   ├── server.js                    # Express server entry
│   ├── config/
│   │   ├── database.js              # PostgreSQL connection
│   │   ├── jwt.js                   # JWT configuration
│   │   └── logger.js                # Winston logger
│   ├── routes/
│   │   └── index.js                 # Route aggregation
│   ├── middleware/
│   │   ├── authentication/
│   │   │   ├── jwtAuth.middleware.js
│   │   │   └── auth.middleware.js
│   │   └── authorization/
│   │       └── role.middleware.js   # RBAC check
│   ├── modules/
│   │   ├── auth/                    # Authentication (login, OTP, refresh)
│   │   ├── partner/                 # Partner operations
│   │   ├── admin/                   # Admin operations
│   │   ├── super-admin/             # Super Admin operations
│   │   ├── crm/                     # Applications, Leads, Bank Cards
│   │   ├── wallet/                  # Wallet & commissions
│   │   ├── notifications/           # Notifications & announcements
│   │   ├── reports/                 # Reports & analytics
│   │   ├── whatsapp/                # WhatsApp messaging
│   │   ├── employee/                # Employee management
│   │   ├── hr/                      # HR operations
│   │   ├── kyc-operator/            # KYC verification
│   │   ├── banks/                   # Bank management
│   │   ├── products/                # Product catalog
│   │   ├── cms/                     # Content management
│   │   └── support/                 # Support tickets
│   ├── database/
│   │   ├── migrations/
│   │   │   └── migrate.js           # Schema migrations
│   │   └── seeds/                   # Seed data
│   └── utils/
│       └── helpers/
│           └── helpers.js           # Utility functions
```

### API Base URL
- **Production:** `https://api.gharkapaisa.in/api/v1`
- **Development:** `http://localhost:5000/api/v1`

### API Route Structure
```
/api/v1/
├── /auth                    # Authentication endpoints
├── /partner                 # Partner self-service
├── /Partners                # Partner management (admin)
├── /kyc                     # KYC operations
├── /admin                   # Admin operations
├── /superadmin              # Super Admin operations
├── /applications            # Applications CRM
├── /leads                   # Lead management
├── /customers               # Customer management
├── /wallet                  # Wallet & transactions
├── /notifications           # Notifications
├── /reports                 # Reports
├── /banks                   # Bank management
├── /products                # Product catalog
├── /support/tickets         # Support tickets
├── /whatsapp                # WhatsApp messaging
├── /hr                      # HR operations
├── /employees               # Employee management
├── /employee                # Employee self-service
├── /chatbot                 # AI chatbot
├── /public/                 # Public endpoints (no auth)
└── /analytics               # Analytics tracking
```

---

## 3. Authentication Flow

### Current Backend Authentication
1. **OTP Login Flow:**
   ```
   POST /auth/send-otp    → Send OTP to email/mobile
   POST /auth/login       → Verify OTP, return JWT access token
   POST /auth/refresh     → Refresh access token (HttpOnly cookie)
   POST /auth/logout      → Clear session
   GET  /auth/me          → Get current user profile
   ```

2. **JWT Configuration:**
   - Access token expires: 1 hour (configurable)
   - Refresh token cookie: 30 days (HttpOnly, Secure, SameSite)
   - Secret: `JWT_SECRET` environment variable

3. **Security Features:**
   - Account lockout after failed attempts
   - Working hours restriction enforcement
   - OTP rate limiting
   - Suspended/blocked account checks

### Mobile Authentication Requirements
1. **Reuse Existing Endpoints:**
   - Use same `/auth/send-otp` and `/auth/login` endpoints
   - Use same `/auth/refresh` for token rotation
   - Use same `/auth/me` for profile fetch

2. **Token Storage:**
   - Access token: `expo-secure-store` (encrypted)
   - Refresh token: NOT stored on mobile (use HttpOnly cookie)
   - Session persistence: Secure storage

3. **Authentication Flow:**
   ```
   Mobile App
     ↓
   POST /auth/send-otp (mobile/email)
     ↓
   User enters OTP
     ↓
   POST /auth/login (with OTP)
     ↓
   Receive JWT access token
     ↓
   Store in expo-secure-store
     ↓
   Use Authorization: Bearer <token> header
     ↓
   On 401: POST /auth/refresh (withCredentials)
     ↓
   Receive new access token
     ↓
   Update stored token
   ```

4. **Biometric Authentication (Optional Enhancement):**
   - Store OTP or refresh credential securely
   - Use expo-local-authentication for biometric unlock
   - Backend remains authoritative for authentication

---

## 4. Existing Roles

### User Roles (PostgreSQL enum)
```javascript
{
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  PARTNER: 'PARTNER',
  TEAM_MEMBER: 'TEAM_MEMBER'
}
```

### Designations (VARCHAR in database)
```javascript
{
  OPERATIONAL_HEAD: 'Operational Head',
  ADMINISTRATIVE_OPERATOR: 'Administrative Operator',
  ADMINISTRATIVE_SALES_EXECUTIVE: 'Administrative Sales Executive',
  PAN_CHECKER: 'PAN Checker',
  REMARK_OPERATOR: 'Remark Operator',
  QD_OPERATOR: 'QD Operator',
  FINAL_STATUS_OPERATOR: 'Final Status Operator',
  SUPER_ADMIN: 'Super Admin'
}
```

### Role Hierarchy
```
SUPER_ADMIN (highest)
  └── ADMIN
      └── EMPLOYEE
          └── PARTNER
              └── TEAM_MEMBER (lowest)
```

### Designation-Based Access
Designations determine which operational queues a user can access:
- **PAN Checker:** PAN verification queue
- **Remark Operator:** Remark processing queue
- **QD Operator:** QD verification queue
- **Final Status Operator:** Final status approval queue
- **KYC Operator:** KYC verification queue
- **Administrative Sales Executive:** Lead punching queue
- **Operational Head:** All queues + administrative functions

---

## 5. Existing Major Modules

### Core Modules

#### 1. Authentication Module
**Backend:** `backend/src/modules/auth/`
- OTP-based login (email/mobile)
- Password reset via OTP
- Email verification
- Working hours check
- Session management
- Refresh token rotation

**Frontend:** `frontend/src/modules/authentication/`
- Partner Login (`PartnerLogin.jsx`)
- Admin Login (`AdminLogin.jsx`)
- Partner Register (`PartnerRegister.jsx`)
- Verify Email (`VerifyEmail.jsx`)
- Reset Password (`ResetPassword.jsx`)

---

#### 2. Partner Module
**Backend:** `backend/src/modules/partner/`
- Partner registration
- Partner profile management
- Partner KYC
- Partner wallet
- Team management
- Referral system
- Share link generation

**Frontend:** `frontend/src/modules/partner/`
- Dashboard (`PartnerDashboard.jsx`)
- Add Lead (`PartnerAddLead.jsx`)
- Applications (`PartnerApplications.jsx`)
- Wallet (`PartnerWallet.jsx`)
- Profile (`PartnerProfile.jsx`)
- Products (`PartnerProducts.jsx`)
- KYC (`PartnerKyc.jsx`)
- Team (`PartnerTeam.jsx`)
- CRM (`PartnerCrm.jsx`)
- Reports (`PartnerReports.jsx`)
- Notifications (`PartnerNotifications.jsx`)

---

#### 3. Admin Module
**Backend:** `backend/src/modules/admin/`
- Application management
- Lead management
- Partner management
- Withdrawal approvals
- KYC operations
- Credit card applications
- Loan applications
- Insurance applications

**Frontend:** `frontend/src/modules/admin/`
- Dashboard (`AdminDashboard.jsx`)
- Manage Applications (`ManageApplications.jsx`)
- Manage Partners (`ManagePartners.jsx`)
- Manage Leads (`ManageLeads.jsx`)
- Manage Withdrawals (`ManageWithdrawals.jsx`)
- KYC Operator (`KycOperatorDashboard.jsx`)
- Bank Card Applications (`ManageBankCardApplications.jsx`)
- Loans (`ManageAdminLoans.jsx`)
- Insurance (`ManageAdminInsurance.jsx`)

---

#### 4. Super Admin Module
**Backend:** `backend/src/modules/super-admin/`
- System overview
- Employee management
- Commission management
- Incentive management
- Bank management
- Product management
- Banner management
- Announcement management
- Working hours management
- Audit logs
- Reports

**Frontend:** `frontend/src/modules/super-admin/`
- Overview (`SuperAdminOverview.jsx`)
- Dashboard (`SuperAdminDashboard.jsx`)
- Reports (`SuperAdminReports.jsx`)
- Employee Management (`EmployeeManagement.jsx`)
- Commissions (`ManageCommissions.jsx`)
- Incentives (`ManageEmployeeIncentives.jsx`)
- Banks (`ManageBanks.jsx`)
- Products (`ManageProducts.jsx`)
- Banners (`ManageBanners.jsx`)
- Announcements (`ManageAnnouncements.jsx`)
- Working Hours (`AdminWorkingHours.jsx`)
- Audit Logs (`AuditLogs.jsx`)
- WhatsApp (`SuperAdminWhatsApp.jsx`)

---

#### 5. Employee Module
**Backend:** `backend/src/modules/employee/`
- Employee dashboard
- Application management
- Credit card tools
- Incentives
- Team management
- KYC submission
- Profile management

**Frontend:** `frontend/src/modules/employee/`
- Dashboard (`EmployeeDashboard.jsx`)
- Applications (`EmployeeApplications.jsx`)
- Credit Cards (`EmployeeCreditCards.jsx`)
- Loan on Card (`EmployeeLoanOnCreditCard.jsx`)
- Smart EMI (`EmployeeSmartEmi.jsx`)
- Incentives (`MyIncentives.jsx`)
- Team (`MyTeam.jsx`)
- Profile (`EmployeeProfile.jsx`)
- KYC (`KYCSubmission.jsx`)
- Verification (`EmployeeVerification.jsx`)
- Reports (`EmployeeSalesReports.jsx`)
- Settings (`EmployeeSettingsPortal.jsx`)

---

#### 6. CRM Module
**Backend:** `backend/src/modules/crm/`
- Application creation and tracking
- Lead management
- Bank card applications
- Loan applications
- Insurance applications
- Application status updates
- Timeline tracking

**Key Tables:**
- `applications` - General applications
- `bank_card_applications` - Credit card specific
- `leads` - Lead management
- `customers` - Customer data

---

#### 7. Wallet Module
**Backend:** `backend/src/modules/wallet/`
- Partner wallet management
- Transaction history
- Withdrawal requests
- Commission tracking
- TDS calculation (2%)
- Razorpay integration

**Frontend:** `frontend/src/modules/partner/wallet/PartnerWallet.jsx`

---

#### 8. Notifications Module
**Backend:** `backend/src/modules/notifications/`
- User notifications
- Announcements
- SSE streaming
- Notification preferences
- Read/unread tracking

**Frontend:** `frontend/src/modules/notifications/NotificationCenter.jsx`

---

#### 9. WhatsApp Module
**Backend:** `backend/src/modules/whatsapp/`
- Template-based messaging
- Document attachment
- Message history
- Delivery tracking
- Permission-based access
- Meta Cloud API integration

**Frontend:** `frontend/src/modules/super-admin/whatsapp/SuperAdminWhatsApp.jsx`

---

#### 10. Working Hours Module
**Backend:** `backend/src/modules/auth/workingHours.service.js`
- Global working hours
- Role-based policies
- Designation-based policies
- User-specific policies
- Holiday management
- Extensions
- Timezone support (Asia/Kolkata)

**Frontend:** `frontend/src/modules/super-admin/working-hours/AdminWorkingHours.jsx`

---

## 6. API Endpoints That Mobile Can Reuse

### Authentication Endpoints
```
POST   /auth/send-otp              Send OTP to email/mobile
POST   /auth/login                 Verify OTP, get access token
POST   /auth/refresh               Refresh access token (cookie-based)
POST   /auth/logout                Clear session
GET    /auth/me                    Get current user profile
POST   /auth/lookup                Check if identity exists
POST   /auth/forgot-password       Initiate password reset
POST   /auth/update-password       Update password
```

### Partner Endpoints
```
GET    /partner/dashboard          Partner dashboard data
GET    /partner/profile           Partner profile
PUT    /partner/profile           Update partner profile
GET    /partner/kyc                KYC status
POST   /partner/kyc/submit         Submit KYC
GET    /partner/wallet             Wallet balance & transactions
POST   /partner/wallet/withdraw    Request withdrawal
GET    /partner/team               Team members
POST   /partner/team/invite        Invite team member
GET    /partner/leads              Partner leads
POST   /partner/leads              Create lead
GET    /partner/applications       Partner applications
GET    /partner/products           Product catalog
GET    /partner/reports            Partner reports
```

### Application Endpoints
```
GET    /applications               List applications (with filters)
POST   /applications               Create application
GET    /applications/:id          Application details
PATCH  /applications/:id          Update application
DELETE /applications/:id          Delete application
GET    /applications/my-leads     My leads/applications
GET    /applications/team-leads   Team leads/applications
```

### Lead Endpoints
```
GET    /leads                      List leads
POST   /leads                      Create lead
GET    /leads/:id                  Lead details
PATCH  /leads/:id                  Update lead
DELETE /leads/:id                  Delete lead
```

### Customer Endpoints
```
GET    /customers                  List customers
GET    /customers/:id              Customer details
POST   /customers                  Create customer
PATCH  /customers/:id              Update customer
```

### Bank Card Application Endpoints
```
GET    /admin/bank-cards           List bank card applications
GET    /admin/bank-cards/:id      Application details
PATCH  /admin/bank-cards/:id/status  Update status/stage
POST   /admin/bank-cards/:id/assist  Add assist details
```

### Wallet Endpoints
```
GET    /wallet                     Wallet summary
GET    /wallet/transactions        Transaction history
POST   /wallet/withdraw           Request withdrawal
GET    /wallet/commission         Commission history
```

### Notification Endpoints
```
GET    /notifications              User notifications
GET    /notifications/unread       Unread notifications
PUT    /notifications/read        Mark as read
PUT    /notifications/read-all    Mark all as read
DELETE /notifications/:id         Delete notification
GET    /notifications/settings    Notification preferences
PUT    /notifications/settings    Update preferences
```

### Announcement Endpoints
```
GET    /announcements              Public announcements
POST   /super-admin/announcements  Create announcement (admin)
PUT    /super-admin/announcements/:id  Update announcement
DELETE /super-admin/announcements/:id  Delete announcement
```

### WhatsApp Endpoints
```
GET    /whatsapp/config            WhatsApp configuration
GET    /whatsapp/templates        Available templates
POST   /whatsapp/send             Send message
GET    /whatsapp/history          Message history
GET    /whatsapp/consents         Marketing consents
```

### Product Endpoints
```
GET    /products                   Product catalog
GET    /products/:id              Product details
GET    /products/category/:cat    Products by category
GET    /banks                     Bank list
```

### Report Endpoints
```
GET    /reports                    General reports
GET    /super-admin/reports       Super Admin reports
GET    /partner/reports           Partner reports
```

### Employee Endpoints
```
GET    /employee/dashboard         Employee dashboard
GET    /employee/applications      Employee applications
GET    /employee/incentives       Employee incentives
GET    /employee/team             Employee team
PUT    /employee/profile          Update profile
POST   /employee/kyc              Submit KYC
POST   /employee/terms            Accept terms
```

### HR Endpoints
```
GET    /hr/dashboard               HR dashboard
GET    /hr/candidates             Candidate pipeline
POST   /hr/candidates/:id/status   Update candidate status
```

### Public Endpoints (No Auth)
```
GET    /public/products            Public product catalog
GET    /public/share/:token       Share link details
POST   /public/share/submit       Submit share lead
GET    /public/apply/:token        Apply token details
PATCH  /public/apply/:token        Update apply token
GET    /public/careers             Careers page
POST   /public/careers/apply      Apply for job
```

---

## 7. Pages/Modules Identified for Mobile

### Priority 1: Core Features (Must Have)

#### 1. Authentication
- Login screen (OTP-based)
- Registration screen (Partner)
- Forgot password
- Email verification

**Mobile UX Requirements:**
- Bottom sheet for OTP input
- Biometric unlock option
- Remember me toggle
- Auto-fill for email/mobile

---

#### 2. Partner Dashboard
- KPI cards (Balance, Applications, Team, Earnings)
- Quick actions (Add Lead, Products, Wallet)
- Recent activity
- KYC status alert

**Mobile UX Requirements:**
- Bottom navigation
- Card-based layout
- Pull-to-refresh
- Swipe actions for quick tasks

---

#### 3. Applications List
- List view with filters
- Search functionality
- Status badges
- Pull-to-refresh
- Infinite scroll

**Mobile UX Requirements:**
- Card-based list (not table)
- Swipe to view details
- Filter sheet (bottom sheet)
- Status color coding

---

#### 4. Application 360°
- Overview tab
- Customer tab
- Product tab
- Status tab
- KYC tab
- Documents tab
- Timeline tab
- Remarks tab

**Mobile UX Requirements:**
- Segmented control for tabs
- Lazy loading per tab
- Horizontal scrolling for timeline
- Expandable sections

---

#### 5. Wallet
- Balance display
- Transaction history
- Withdrawal request
- TDS information
- Commission breakdown

**Mobile UX Requirements:**
- Large balance display
- Swipe to view transaction details
- Bottom sheet for withdrawal
- Filter by transaction type

---

#### 6. Profile
- Personal information
- Bank details
- KYC status
- Settings

**Mobile UX Requirements:**
- Avatar upload (camera/gallery)
- Form-based editing
- Collapsible sections
- Toggle switches for settings

---

### Priority 2: Important Features (Should Have)

#### 7. Lead Management
- Add lead form
- Lead list
- Lead conversion to application
- Follow-up tracking

**Mobile UX Requirements:**
- Form wizard for lead creation
- Quick action buttons
- Status badges
- Conversion indicators

---

#### 8. Products Catalog
- Product list by category
- Product details
- Commission information
- Share functionality

**Mobile UX Requirements:**
- Grid layout for products
- Horizontal scroll for categories
- Share sheet (WhatsApp, etc.)
- Card-based product display

---

#### 9. Team Management
- Team members list
- Invite team member
- Team performance
- Hierarchy view

**Mobile UX Requirements:**
- Avatar list
- Invite modal
- Performance cards
- Tree view for hierarchy

---

#### 10. Notifications
- Notification list
- Unread count
- Mark as read
- Notification settings

**Mobile UX Requirements:**
- Push notifications (Expo)
- Swipe to mark read
- Group by category
- Settings modal

---

### Priority 3: Nice to Have (Can Add Later)

#### 11. Reports
- Performance reports
- Earnings reports
- Export functionality

**Mobile UX Requirements:**
- Chart integration
- Date range picker
- Export sheet
- PDF preview

---

#### 12. Chatbot
- AI assistant
- Quick links
- Product recommendations

**Mobile UX Requirements:**
- Floating action button
- Chat interface
- Quick reply chips
- Product cards in chat

---

#### 13. WhatsApp Integration
- Send WhatsApp messages
- Template selection
- Document attachment
- Message history

**Mobile UX Requirements:**
- Template picker
- Document picker
- Message composer
- Status indicators

---

#### 14. Working Hours
- Working hours display
- Holiday notifications
- Extension requests

**Mobile UX Requirements:**
- Time display
- Holiday banner
- Request modal
- Countdown timer

---

### Priority 4: Admin/Employee Features

#### 15. Employee Dashboard
- Designation-specific queue
- Assigned tasks
- Performance metrics
- Incentives

**Mobile UX Requirements:**
- Queue-based navigation
- Task cards
- Performance charts
- Incentive breakdown

---

#### 16. KYC Operator
- KYC verification queue
- Document review
- Approval/rejection

**Mobile UX Requirements:**
- Document viewer
- Zoom/pan for documents
- Approve/Reject buttons
- Remark input

---

#### 17. PAN Checker
- PAN verification queue
- PAN details display
- Remark options

**Mobile UX Requirements:**
- PAN lookup
- Remark picker
- Status update
- History view

---

#### 18. QD Operator
- QD verification queue
- QD details
- Approval workflow

**Mobile UX Requirements:**
- Queue cards
- Detail view
- Action buttons
- Timeline

---

#### 19. Remark Operator
- Remark queue
- Remark input
- Status update

**Mobile UX Requirements:**
- Comment input
- Status picker
- Submit button
- History

---

#### 20. Final Status Operator
- Final status queue
- Approve/Decline actions
- Dispatch tracking

**Mobile UX Requirements:**
- Queue cards
- Action sheet
- Status update
- Dispatch info

---

## 8. Pages That Require Mobile-Specific UX

### 1. Application List
**Web:** Data table with columns
**Mobile:** Card-based list with swipe actions

**Mobile Design:**
```
┌─────────────────────────────┐
│ APP49842408        Approved  │
│ Rahul Sharma                 │
│ HDFC • Credit Card          │
│                             │
│ Status: KYC Pending         │
│ Last Updated: 28 Sep        │
│                             │
│ [View Details]          →   │
└─────────────────────────────┘
```

---

### 2. Application 360°
**Web:** Tabbed modal with all data
**Mobile:** Full-screen with segmented tabs

**Mobile Design:**
- Top: Segmented control (Overview | Customer | Product | Status | KYC | Docs | Timeline)
- Bottom: Scrollable content area
- Lazy loading per tab
- Horizontal timeline scroll

---

### 3. Forms (Lead Creation, Application)
**Web:** Multi-column form with desktop layout
**Mobile:** Single-column wizard with steps

**Mobile Design:**
- Step indicator at top
- One field per row
- Native date/time pickers
- Native file picker
- Bottom sheet for dropdowns
- Progress indicator

---

### 4. Filters
**Web:** Sidebar with filter checkboxes
**Mobile:** Bottom sheet with filter options

**Mobile Design:**
- Filter button → opens bottom sheet
- Vertical scrollable filter list
- Apply/Reset buttons at bottom
- Active filter count badge

---

### 5. Tables (Reports, Lists)
**Web:** Data tables with pagination
**Mobile:** Card lists with infinite scroll

**Mobile Design:**
- Card-based layout
- Swipe for actions
- Pull-to-refresh
- Load more on scroll
- Search bar at top

---

### 6. Navigation
**Web:** Sidebar navigation
**Mobile:** Bottom navigation + hamburger menu

**Mobile Design:**
```
Bottom Nav (Primary):
┌─────────────────────────────────┐
│  Home    Work    Notify   Profile  │
└─────────────────────────────────┘

Hamburger Menu (Secondary):
- Dashboard
- Applications
- Leads
- Products
- Wallet
- Team
- Reports
- Settings
- Logout
```

---

### 7. Modals
**Web:** Centered modal with desktop sizing
**Mobile:** Bottom sheet or full-screen modal

**Mobile Design:**
- Slide-up bottom sheet for simple forms
- Full-screen modal for complex forms
- Swipe down to dismiss
- Back button in navigation bar

---

### 8. Documents
**Web:** Link to download
**Mobile:** Native document viewer with preview

**Mobile Design:**
- Camera/Gallery picker
- Document preview
- Zoom/pan support
- Progress indicator for upload

---

### 9. Timeline
**Web:** Vertical timeline in sidebar
**Mobile:** Horizontal scrollable timeline

**Mobile Design:**
- Horizontal scroll
- Tap to view details
- Status dots
- Timestamp badges

---

### 10. Multi-select Actions
**Web:** Checkbox in table row
**Mobile:** Long press to select, swipe actions

**Mobile Design:**
- Long press enters selection mode
- Checkbox appears on card
- Batch action bar appears at bottom
- Swipe for single actions

---

## 9. Missing APIs That Need to Be Added to Backend

### 1. Mobile-Specific Endpoints

#### 1.1 Device Registration
```
POST /auth/register-device
Body: { device_id, device_type, push_token }
Purpose: Register device for push notifications
```

#### 1.2 Mobile Settings
```
GET  /mobile/settings
PUT  /mobile/settings
Purpose: Mobile-specific settings (theme, language, etc.)
```

#### 1.3 Offline Sync
```
GET  /mobile/sync/data
POST /mobile/sync/submit
Purpose: Offline data sync (if implemented)
```

---

### 2. Enhanced Existing Endpoints

#### 2.1 Application List (Mobile-Optimized)
```
GET /applications?mobile=true&compact=true
Purpose: Return compact data for mobile card list
```

#### 2.2 Search Suggestions
```
GET /applications/suggestions?q=
GET /customers/suggestions?q=
Purpose: Autocomplete for search inputs
```

#### 2.3 Batch Operations
```
POST /applications/batch-status
POST /leads/batch-assign
Purpose: Batch update operations
```

---

### 3. Push Notification Infrastructure

#### 3.1 Push Token Management
```
POST /notifications/push-token
Body: { push_token, platform }
Purpose: Register Expo push token
```

#### 3.2 Push Notification Send
```
POST /notifications/send-push
Body: { user_ids, title, message, data }
Purpose: Send push notification to users
```

---

### 4. File Upload (Mobile-Optimized)

#### 4.1 Multipart Upload
```
POST /upload/document
Content-Type: multipart/form-data
Purpose: Handle mobile file uploads
```

#### 4.2 Upload Progress
```
GET /upload/status/:upload_id
Purpose: Track upload progress
```

---

### 5. Deep Linking Support

#### 5.1 Deep Link Resolution
```
GET /deep-link/resolve/:type/:id
Purpose: Resolve deep links to mobile screens
```

---

### 6. Working Hours Check (Mobile-Optimized)

#### 6.1 Current Status
```
GET /auth/working-hours-status
Purpose: Check if user can perform actions now
```

---

### 7. Biometric Authentication (Optional)

#### 7.1 Biometric Registration
```
POST /auth/register-biometric
Body: { biometric_token }
Purpose: Register biometric credential
```

#### 7.2 Biometric Login
```
POST /auth/login-biometric
Body: { biometric_token }
Purpose: Login using biometric
```

---

## 10. Recommended Mobile Navigation Structure

### Proposed Navigation Architecture

#### Bottom Navigation (4 tabs)
```
┌─────────────────────────────────────────┐
│  Home     Work     Notify     Profile   │
└─────────────────────────────────────────┘
```

---

#### Tab 1: Home
**Purpose:** Landing page for unauthenticated users, Dashboard for authenticated users

**Unauthenticated:**
- Product categories
- Featured products
- Partner benefits
- Register button
- Login button

**Authenticated (Partner):**
- Dashboard summary
- Quick actions
- Recent activity
- Announcements

**Authenticated (Employee):**
- Dashboard summary
- Designation queue
- Assigned tasks
- Performance

**Authenticated (Admin/Super Admin):**
- Executive metrics
- Pending work
- Quick admin actions
- System status

---

#### Tab 2: Work
**Purpose:** Main work area - dynamically shows relevant modules based on role

**Partner:**
- Applications
- Leads
- Products
- Team
- Wallet

**Employee (by designation):**
- Applications
- Assigned queue (PAN/QD/Remark/Final based on designation)
- Tools (EMI calculator, etc.)
- Incentives

**Admin:**
- Applications
- KYC queue
- Verification queue
- Reports

**Super Admin:**
- All modules via hamburger menu
- Dashboard
- Reports
- Management

**Navigation Pattern:**
- Use hamburger menu (⋮) in top-right for secondary navigation
- Bottom navigation stays fixed
- Stack-based navigation within modules

---

#### Tab 3: Notifications
**Purpose:** Notification center

**Features:**
- Notification list
- Unread count badge
- Filter by category
- Mark as read (swipe)
- Notification settings

**Navigation:**
- List view
- Tap to view detail
- Back to list

---

#### Tab 4: Profile
**Purpose:** User profile and settings

**Features:**
- Profile photo
- Personal information
- KYC status
- Bank details
- Settings
- Logout

**Navigation:**
- Settings as sub-menu
- Each setting in separate screen

---

### Secondary Navigation (Hamburger Menu)

**Menu Items (Role-Based):**

**Partner:**
- Dashboard
- Applications
- Leads
- Products
- Wallet
- Team
- Reports
- Settings
- Help/Support
- Logout

**Employee:**
- Dashboard
- Applications
- Tools
- Incentives
- Team
- Reports
- Settings
- Help/Support
- Logout

**Admin:**
- Dashboard
- Applications
- KYC Queue
- Reports
- Settings
- Help/Support
- Logout

**Super Admin:**
- Overview
- Dashboard
- Applications
- Employees
- Partners
- Banks
- Products
- Reports
- Announcements
- Working Hours
- Audit Logs
- Settings
- Help/Support
- Logout

---

### Navigation Flow Examples

#### Example 1: Partner Views Application
```
Home (tab)
  → Work (tab)
    → Applications (hamburger menu)
      → Application List
        → Tap Application Card
          → Application 360° (full screen)
            → Customer Tab
            → Status Tab
            → Documents Tab
```

#### Example 2: Employee Updates Status
```
Home (tab)
  → Work (tab)
    → Designation Queue (auto)
      → Application Card
        → Tap Application
          → Application Detail
            → Update Status (bottom sheet)
              → Submit
```

#### Example 3: Partner Creates Lead
```
Home (tab)
  → Work (tab)
    → Leads (hamburger menu)
      → Add Lead (FAB)
        → Lead Form Wizard
          → Step 1: Customer Info
          → Step 2: Product Selection
          → Step 3: Confirmation
            → Submit
```

---

### Deep Link Structure

**Supported Deep Links:**
```
gharkapaisa://application/{applicationId}
gharkapaisa://lead/{leadId}
gharkapaisa://customer/{customerId}
gharkapaisa://notification/{notificationId}
gharkapaisa://product/{productId}
gharkapaisa://wallet
gharkapaisa://profile
gharkapaisa://settings
```

**Deep Link Handling:**
- Parse URL in app start
- Check authentication
- Navigate to appropriate screen
- Pass parameters to screen

---

## 11. Technology Stack for Mobile

### Core Technologies
- **Framework:** React Native 0.81.x
- **Runtime:** Expo SDK ~54.0.x
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand (same as web)
- **HTTP Client:** Axios (same as web)

### Key Dependencies
```json
{
  "expo": "~54.0.33",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo-router": "~4.0.20",
  "expo-secure-store": "~13.0.2",
  "expo-local-authentication": "~15.0.5",
  "expo-image-picker": "~16.0.6",
  "expo-document-picker": "~13.0.3",
  "expo-file-system": "~18.0.7",
  "expo-notifications": "~0.29.14",
  "axios": "^1.17.0",
  "zustand": "^5.0.14",
  "@react-navigation/native": "^7.0.15",
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "^15.10.0",
  "victory-native": "^37.0.0"
}
```

---

## 12. Development Phases

### Phase 1: Audit & Planning ✅ (Current)
- [x] Audit existing frontend architecture
- [x] Audit existing backend architecture
- [x] Document authentication flow
- [x] Document roles and designations
- [x] Document existing API endpoints
- [x] Identify pages for mobile
- [x] Identify mobile-specific UX requirements
- [x] Identify missing APIs
- [x] Create mobile README

---

### Phase 2: Mobile Foundation
- [ ] Initialize Expo project with TypeScript
- [ ] Set up Expo Router navigation
- [ ] Create design system (theme, colors, typography)
- [ ] Create reusable components
- [ ] Set up API client (Axios)
- [ ] Implement authentication context
- [ ] Implement secure token storage
- [ ] Set up error handling
- [ ] Configure environment variables

---

### Phase 3: Core Authentication
- [ ] Login screen (OTP-based)
- [ ] Registration screen (Partner)
- [ ] Forgot password
- [ ] Email verification
- [ ] Token refresh implementation
- [ ] Session restoration
- [ ] Logout implementation
- [ ] Biometric authentication (optional)

---

### Phase 4: Core Screens
- [ ] Home screen (unauthenticated)
- [ ] Partner dashboard
- [ ] Application list
- [ ] Application 360°
- [ ] Profile screen
- [ ] Settings screen
- [ ] Notifications screen

---

### Phase 5: Partner Features
- [ ] Add lead form
- [ ] Lead list
- [ ] Products catalog
- [ ] Product details
- [ ] Wallet screen
- [ ] Withdrawal request
- [ ] Team management
- [ ] Partner reports

---

### Phase 6: Employee Features
- [ ] Employee dashboard
- [ ] Designation-specific queues
- [ ] Application management
- [ ] Tools (EMI calculator, etc.)
- [ ] Incentives screen
- [ ] Employee profile
- [ ] KYC submission

---

### Phase 7: Admin Features
- [ ] Admin dashboard
- [ ] KYC operator queue
- [ ] PAN checker queue
- [ ] QD operator queue
- [ ] Remark operator queue
- [ ] Final status operator queue
- [ ] Admin reports

---

### Phase 8: Advanced Features
- [ ] WhatsApp integration
- [ ] Push notifications
- [ ] Deep linking
- [ ] Document upload
- [ ] Report exports
- [ ] Offline support (basic)

---

### Phase 9: Testing & Build
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Android build (APK/AAB)
- [ ] iOS build
- [ ] Production configuration
- [ ] Deployment

---

## 13. Security Considerations

### Token Storage
- **Access Token:** `expo-secure-store` (encrypted)
- **Refresh Token:** NOT stored (use HttpOnly cookie)
- **User Data:** `expo-secure-store` (encrypted)

### API Security
- Always use HTTPS in production
- Validate SSL certificates
- Never expose secrets in code
- Use environment variables for configuration

### Data Masking
- Mask PAN numbers (show last 4)
- Mask account numbers (show last 4)
- Mask Aadhaar (show last 4)
- Respect backend permissions

### Device Security
- Biometric authentication (optional)
- Screen capture prevention (if needed)
- Root/jailbreak detection (optional)

---

## 14. Environment Variables

### Required Variables
```env
EXPO_PUBLIC_API_URL=https://api.gharkapaisa.in/api/v1
EXPO_PUBLIC_APP_NAME=GharKaPaisa
```

### Optional Variables
```env
EXPO_PUBLIC_MSG91_WIDGET_ID=
EXPO_PUBLIC_MSG91_TOKEN_AUTH=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_ANALYTICS_ID=
```

### Build Variables
```env
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_BUILD_NUMBER=1
```

---

## 15. Next Steps

1. **Review this README** with the team
2. **Approve the navigation structure**
3. **Approve the phased approach**
4. **Identify any missing APIs** from backend team
5. **Begin Phase 2: Mobile Foundation**

---

**Document Version:** 1.0  
**Last Updated:** September 28, 2026  
**Status:** Phase 1 Complete - Ready for Phase 2
