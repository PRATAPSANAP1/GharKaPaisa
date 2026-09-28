# GharKaPaisa Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Modules](#frontend-modules)
8. [Credit Card Application Workflow](#credit-card-application-workflow)
9. [Bank-Specific Form Fields](#bank-specific-form-fields)
10. [Role-Based Access Control](#role-based-access-control)
11. [Key Workflows](#key-workflows)
12. [Environment Configuration](#environment-configuration)
13. [Development Setup](#development-setup)
14. [Testing & Deployment](#testing--deployment)

---

## Project Overview

GharKaPaisa is a comprehensive financial services management platform that facilitates:
- Credit card application processing
- Partner onboarding and management
- Lead generation and processing
- Employee management and incentive tracking
- Commission management
- Customer relationship management (CRM)
- Analytics and reporting

The platform supports multiple banks and handles both digital and physical application processes with specialized workflows for different operator roles.

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL (v15+)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **SMS Gateway**: MSG91
- **Payment Gateway**: Razorpay
- **Additional Libraries**:
  - bcryptjs (password hashing)
  - multer (file uploads)
  - node-cron (scheduled jobs)
  - winston (logging)
  - exceljs (Excel operations)
  - pdfkit (PDF generation)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **UI Components**: Custom components with Lucide icons
- **Charts**: Recharts
- **Internationalization**: i18next
- **Animation**: Framer Motion

---

## Architecture

### Backend Architecture
The backend follows a modular architecture with clear separation of concerns:

```
backend/src/
├── config/           # Configuration files (database, JWT, logger)
├── constants/        # Application constants (roles, statuses, error codes)
├── data/            # Static data (pin codes, training modules)
├── database/        # Database migrations and seeders
├── jobs/            # Scheduled jobs (cron tasks)
├── middleware/      # Express middleware (auth, validation, rate limiting)
├── modules/         # Feature modules (auth, CRM, banks, etc.)
├── routes/          # API route definitions
├── services/        # Business logic services
├── templates/       # Email/PDF templates
├── utils/           # Utility functions
└── server.js        # Application entry point
```

### Frontend Architecture
The frontend uses a component-based architecture with modular organization:

```
frontend/src/
├── app/             # Application-level stores and contexts
├── assets/          # Static assets
├── components/      # Reusable UI components
├── contexts/        # React contexts (theme, banks, etc.)
├── hooks/           # Custom React hooks
├── layouts/         # Page layouts
├── modules/         # Feature modules (admin, partner, employee, etc.)
├── routes/          # Route definitions
├── services/        # API service layer
└── utils/           # Utility functions
```

---

## Directory Structure

### Root Directory
```
yohesa/
├── backend/                 # Backend application
├── frontend/                # Frontend application
├── mobile/                 # Mobile application
├── documentation/           # Project documentation
├── .gitignore
├── README.md
└── DEVELOPER_GUIDE.md      # This file
```

### Backend Key Files
- `backend/src/server.js` - Express server entry point
- `backend/src/config/database.js` - PostgreSQL connection configuration
- `backend/src/config/jwt.js` - JWT configuration
- `backend/src/config/logger.js` - Winston logger configuration
- `backend/.env.example` - Environment variables template

### Frontend Key Files
- `frontend/src/main.jsx` - React application entry point
- `frontend/vite.config.js` - Vite build configuration
- `frontend/src/services/api.js` - Axios API client configuration
- `frontend/src/app/store/authStore.js` - Zustand authentication store

---

## Database Schema

### Core Tables

#### Users
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50), -- SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER, TEAM_MEMBER
  designation VARCHAR(100), -- Operational Head, PAN Checker, Remark Operator, etc.
  mobile VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Banks
```sql
banks (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  short_code VARCHAR(50),
  logo_url TEXT,
  operation_head_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
)
```

#### Products (Credit Cards)
```sql
products (
  id UUID PRIMARY KEY,
  bank_id UUID REFERENCES banks(id),
  name VARCHAR(255),
  category VARCHAR(100), -- credit_card, co_branded_card, fd_card
  sub_category VARCHAR(100),
  description TEXT,
  annual_fee VARCHAR(100),
  features JSONB,
  benefits TEXT,
  eligibility JSONB,
  documents_required TEXT,
  display_order INTEGER,
  priority INTEGER
)
```

#### Applications
```sql
applications (
  id UUID PRIMARY KEY,
  app_number VARCHAR(50) UNIQUE,
  bank_id UUID REFERENCES banks(id),
  product_id UUID REFERENCES products(id),
  lead_id UUID REFERENCES leads(id),
  customer_id UUID REFERENCES customers(id),
  partner_id UUID REFERENCES users(id),
  status VARCHAR(100),
  process_type VARCHAR(100), -- linked_share, direct_bank, physical, lead_punching
  bank_application_number VARCHAR(100),
  bank_ref_number VARCHAR(100),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Bank Card Applications (Credit Card Specific)
```sql
bank_card_applications (
  id UUID PRIMARY KEY,
  application_no VARCHAR(50) UNIQUE,
  bank_id UUID REFERENCES banks(id),
  credit_card_category VARCHAR(100),
  customer_name VARCHAR(255),
  customer_mobile VARCHAR(20),
  pan_number VARCHAR(20),
  dob DATE,
  mother_name VARCHAR(255),
  residence_address TEXT,
  company_name VARCHAR(255),
  designation VARCHAR(255),
  email VARCHAR(255),
  official_email VARCHAR(255),
  gross_monthly_income DECIMAL,
  resident_pincode VARCHAR(10),
  process_by UUID REFERENCES users(id),
  
  -- Verification Stages
  pan_check_comments TEXT,
  qd_executive_name VARCHAR(255),
  resident_pin_comments TEXT,
  next_qd_date DATE,
  pan_check_executive_name VARCHAR(255),
  
  -- Status Fields
  app_code_status VARCHAR(100),
  qd_status VARCHAR(100),
  surrogate VARCHAR(100),
  income_status VARCHAR(100),
  blaze_status VARCHAR(100),
  telco_stage VARCHAR(100),
  official_mail_status VARCHAR(100),
  vkyc_status VARCHAR(100),
  dispatch_stage VARCHAR(100),
  final_stage VARCHAR(100),
  
  -- Rejection Fields
  decline_description TEXT,
  decline_code VARCHAR(100),
  curable_solved VARCHAR(50),
  curable_executive VARCHAR(255),
  other_comments TEXT,
  
  not_interested_comment TEXT,
  kyc_pending_comment TEXT,
  
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Bank Card Application Timeline
```sql
bank_card_application_timeline (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES bank_card_applications(id),
  stage VARCHAR(100),
  note TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ
)
```

#### Admin Bank Assignments
```sql
admin_bank_assignments (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  bank_id UUID REFERENCES banks(id),
  assigned_at TIMESTAMPTZ
)
```

---

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh JWT token
- `GET /me` - Get current user profile

### Banks (`/api/v1/banks`)
- `GET /banks` - List all banks
- `GET /banks/:id` - Get bank details
- `POST /banks` - Create bank (Super Admin only)
- `PATCH /banks/:id` - Update bank
- `DELETE /banks/:id` - Delete bank

### Credit Card Applications (`/api/v1/admin/bank-cards`)
- `POST /admin/bank-cards` - Create credit card application (Step 1)
- `PATCH /admin/bank-cards/:id/assist` - Update assist fields (Step 2)
- `PATCH /admin/bank-cards/:id/status` - Update status information
- `PATCH /admin/bank-cards/:id/decline` - Update rejection details
- `GET /admin/bank-cards` - List applications with filters
- `GET /admin/bank-cards/:id` - Get application details with timeline
- `GET /admin/bank-cards/reports` - Get application reports

### SBI Credit Card Applications (`/api/v1/sbi-credit-card-applications`)
- `GET /sbi-credit-card-applications` - List SBI applications
- `GET /sbi-credit-card-applications/:id` - Get SBI application details
- `POST /sbi-credit-card-applications` - Create SBI application
- `PATCH /sbi-credit-card-applications/:id` - Update SBI application
- `GET /sbi-credit-card-applications/executives` - Get executives list
- `GET /sbi-credit-card-applications/reports` - Get SBI reports

### CRM (`/api/v1/crm`)
- `POST /crm/leads` - Create lead
- `GET /crm/leads` - List leads
- `GET /crm/leads/:id` - Get lead details
- `POST /crm/applications` - Create application
- `GET /crm/applications` - List applications
- `PATCH /crm/applications/:id/status` - Update application status
- `GET /crm/applications/:id` - Get application details

### Admin (`/api/v1/admin`)
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `PATCH /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/analytics` - Get analytics data
- `GET /admin/audit-logs` - Get audit logs

---

## Frontend Modules

### Admin Module (`frontend/src/modules/admin/`)
- **Credit Cards**: `credit-cards/ManageBankCardApplications.jsx` - Bank card application management
- **Reports**: `reports/AdminDocumentVerificationModal.jsx` - Document verification with QD, Remark, Final tabs
- **Users**: User management interface
- **Analytics**: Dashboard and analytics

### Partner Module (`frontend/src/modules/partner/`)
- Lead management
- Application tracking
- Commission overview
- Profile management

### Employee Module (`frontend/src/modules/employee/`)
- Credit card applications
- Loan on credit card
- Smart EMI
- Performance tracking

### Home Module (`frontend/src/modules/home/`)
- Credit card display (bank-specific)
- Product catalog
- Landing page components

### Super Admin Module (`frontend/src/modules/super-admin/`)
- Bank management (`cms/ManageBanks.jsx`)
- User management
- System settings

---

## Credit Card Application Workflow

### Application Stages

The credit card application process follows these stages:

1. **Customer Details** - Initial customer information collection
2. **PAN Check** - PAN verification and remark assignment
3. **Resident Pincode Verification** - Address verification
4. **QD Verification** - Quality assurance verification
5. **Income Verification** - Income document verification
6. **Office Mail Verification** - Employment verification
7. **Telco Verification** - Telecom verification
8. **Application Generated** - Application submission to bank
9. **V-KYC** - Video KYC verification
10. **Dispatch** - Card dispatch tracking
11. **Approved** - Final approval
12. **Delivered** - Card delivery confirmation
13. **Declined** - Application rejection

### Process Types

- **linked_share** - Digital journey via linked share
- **direct_bank** - Direct bank digital process
- **physical** - Physical application process
- **lead_punching** - Lead punching process

---

## Bank-Specific Form Fields

### Common Fields (All Banks)

#### Step 1: Basic Information
- `credit_card_category` - Card category selection
- `customer_name` - Customer full name
- `customer_mobile` - Mobile number (10 digits)
- `pan_number` - PAN number (10 characters)
- `resident_pincode` - Residential pincode
- `process_by` - Processing method (lead_punching, linked_share, direct_bank, physical)
- `pan_check_comments` - PAN verification comments
- `qd_executive_name` - QD executive name
- `resident_pin_comments` - Pincode verification comments
- `next_qd_date` - Next QD verification date

#### Step 2: Assist Fields
- `dob` - Date of birth (DD-MM-YYYY format)
- `mother_name` - Mother's name
- `residence_address` - Full residential address
- `company_name` - Employer/company name
- `designation` - Job designation
- `email` - Personal email
- `official_email` - Official/work email
- `gross_monthly_income` - Monthly income
- `pan_check_executive_name` - PAN checker name

#### Status Information Fields
- `app_code_status` - Application code status (Generated, Pending, etc.)
- `qd_status` - QD verification status (Pending, Completed, Failed)
- `surrogate` - Surrogate type (Income Proof, Address Proof, etc.)
- `income_status` - Income verification status (Verified, Pending, Failed)
- `blaze_status` - Blaze verification status (Clear, Pending, Failed)
- `telco_stage` - Telecom verification stage (Verified, Pending, Failed)
- `official_mail_status` - Official mail verification status (Verified, Pending, Failed)
- `vkyc_status` - Video KYC status (Pending, Completed, Failed)
- `dispatch_stage` - Dispatch stage (In Transit, Delivered, Pending)
- `final_stage` - Final application stage (from Customer Details to Declined)
- `not_interested_comment` - Customer not interested comments
- `kyc_pending_comment` - KYC pending comments
- `timeline_note` - Timeline notes

#### Rejection Fields (Only when final_stage = 'Declined')
- `decline_description` - Description of decline reason
- `decline_code` - Bank decline code
- `curable_solved` - Whether decline is curable (Yes/No)
- `curable_executive` - Executive handling curable decline
- `other_comments` - Additional comments

### Bank-Specific Features

#### HDFC Bank
- **Card Categories**: Core Cards, Co-Branded Cards, Secured Cards
- **Popular Cards**: Freedom, MoneyBack+, Millennia, Regalia Gold, Regalia, BizGrow, BizPower, BizFirst, Diners Club Privilege, Diners Club Black, Infinia
- **Co-Branded**: Swiggy HDFC, Tata Neu Plus, Tata Neu Infinity, IndianOil HDFC, IRCTC HDFC, Marriott Bonvoy, Shoppers Stop, Paytm HDFC
- **Extra Fields**: Standard fields only
- **Special Features**: 
  - FD-backed cards available
  - Multiple co-branded options
  - Premium travel cards with lounge access

#### SBI (State Bank of India)
- **Card Categories**: Simply Save, Simply Click, Prime, Elite, Pulse
- **Popular Cards**: SBI SimplySAVE, SBI SimplyCLICK, SBI Card PRIME, SBI Card ELITE, SBI Card PULSE
- **Co-Branded**: Tata Card Select, Tata Card Platinum, Tata Card Titanium
- **Extra Fields**: Standard fields only
- **Special Features**:
  - Pincode validation using SBI listed pincodes
  - Special commission structure
  - Reward point system (Empower Points)

#### ICICI Bank
- **Card Categories**: Coral, Rubyx, Amazon Pay
- **Popular Cards**: Amazon Pay ICICI, ICICI Coral, ICICI Rubyx
- **Extra Fields**: Standard fields only
- **Special Features**:
  - Dual card options (Visa & Amex)
  - Welcome vouchers
  - Movie and entertainment benefits

#### Axis Bank
- **Card Categories**: ACE, Flipkart, MY ZONE
- **Popular Cards**: Axis ACE, Axis Flipkart, Axis MY ZONE
- **Extra Fields**: Standard fields only
- **Special Features**:
  - Cashback-focused cards
  - Entertainment benefits
  - Utility bill cashback

#### AU Bank
- **Card Categories**: Core Cards
- **Popular Cards**: AU LIT, AU Zenith, AU Vetta, AU Altura Plus
- **Extra Fields**: Standard fields only
- **Special Features**:
  - Customizable card features (AU LIT)
  - Lifetime free options
  - Taj Epicure membership (Zenith)

#### BOB (Bank of Baroda)
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: Government bank benefits

#### IDFC First Bank
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: Competitive interest rates

#### IndusInd Bank
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: Lifestyle-focused cards

#### Kotak Bank
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: Premium banking services

#### Yes Bank
- **Card Categories**: BYOC, Paisabazaar Step Up
- **Popular Cards**: Yes Bank BYOC Credit Card, Yes Bank Paisabazaar Step Up Credit Card
- **Extra Fields**: Standard fields only
- **Special Features**: Build Your Own Card feature

#### Federal Bank
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: South India focus

#### DCB Bank
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: Regional bank benefits

#### SBM Bank
- **Card Categories**: Various
- **Extra Fields**: Standard fields only
- **Special Features**: Mauritius-origin bank

---

## Role-Based Access Control

### User Roles

1. **SUPER_ADMIN** - Full system access
2. **ADMIN** - Administrative access (except some super admin functions)
3. **EMPLOYEE** - Employee access with designation-based permissions
4. **PARTNER** - Partner portal access
5. **TEAM_MEMBER** - Team member access

### Designations (for EMPLOYEE role)

1. **Operational Head** - Can view all applications, manage teams
2. **Administrative Operator** - Full operational access
3. **Administrative Sales Executive** - Sales operations, limited final status access
4. **PAN Checker** - PAN verification only
5. **Remark Operator** - Remark assignment only
6. **QD Operator** - QD verification only (physical process)
7. **Final Status Operator** - Final status updates only

### Tab Access (Document Verification Modal)

#### QD Tab
- **Can Edit**: All roles except PARTNER when status is not locked
- **Purpose**: Quality assurance verification

#### Remark Tab
- **Can Edit**: All roles except PARTNER when status is not locked
- **Purpose**: PAN check remark assignment
- **Remark Options** (PAN_CHECK_REMARK_OPTIONS):
  - PAN OK - OK (Immediate)
  - ALLREADY PROCESS - ALLREADY INPROCESS (One Month)
  - NO RECORD FOUND - OK (Immediate)
  - S5 - S5-SCORE REJECT (90 Days)
  - RS5 - RS5-SCORE REFER (45 Days)
  - CB4. PCB4 - Income cut-off not met (90 days)
  - RT1 - RT1-CURRENT CARD BLOCKED (Never)
  - DUXP - DUXP (Duplicate Application) (One Month)
  - DR4 (Never)
  - PSE - Pre-Screening Error (Immediate)
  - DR1 (90 days)
  - P11 - P11-BLUE COLLARED WORKER (Never)
  - P15 - P15-SALES REJECT (Immediate)
  - NRR - NRR-NRR REJECT (90 days and change address)
  - FV15 - Customer Not interested (Immediate)
  - FV16 - CMR NOT CONTACTABLE (Immediate)
  - FV17 - FV17 CMR NOT CONTACTABLE (Immediate)
  - FD1 - FD1-E-PHOTO NOT PROPERLY CAPTURED (Immediate)
  - FD2 - FD2-FCU PHOTO DOC NOT READABLE (Immediate)
  - F55 - F55-DATABASE DEFAULTER (6 Month)
  - F57 - PAN Mismatch (Immediate)
  - F77 - F77 FRAUD SUSPECTED (Immediate)
  - FV5 - Multiple calls customer not interested (45 days)
  - FV6 - Incorrect Land line / Mobile Number (Immediate)
  - V1 - MISMATCH IN COMPANY NAME, DESIGNATION OR OFFICE ADD
  - V2 - MISMATCH IN RESI ADD
  - V3 - RESIDENCE ADD UNTRACEABLE
  - V4 - OFFICE ADD UNTRACEABLE

#### Final Tab
- **Can Edit**: SUPER_ADMIN, ADMIN, FINAL STATUS OPERATOR (not Sales Executive)
- **Purpose**: Final status updates and dispatch tracking
- **Restriction**: Administrative Sales Executive cannot perform final approval/rejection

### Bank Assignment Filter
- Non-super-admin users are filtered by their assigned banks
- Bank assignments stored in `admin_bank_assignments` table
- Operation heads can see all banks they are assigned to

---

## Key Workflows

### Credit Card Application Creation

1. **Step 1: Create Application**
   - POST `/api/v1/admin/bank-cards`
   - Required fields: bank_id, customer_name, customer_mobile, pan_number
   - Generates unique application number based on bank short code
   - Sets initial final_stage to 'Customer Details'

2. **Step 2: Update Assist Fields**
   - PATCH `/api/v1/admin/bank-cards/:id/assist`
   - Updates: dob, mother_name, residence_address, company_name, designation, email, official_email, gross_monthly_income, pan_check_executive_name

3. **Step 3: Update Status**
   - PATCH `/api/v1/admin/bank-cards/:id/status`
   - Updates all status fields and final_stage
   - Creates timeline entry
   - Role-based restrictions apply

4. **Step 4: Update Decline (if applicable)**
   - PATCH `/api/v1/admin/bank-cards/:id/decline`
   - Only allowed when final_stage = 'Declined'
   - Records decline details and timeline

### Application Filtering

Applications are filtered based on user role and designation:

- **Sales Executive**: Only sees lead_punching applications without dispatch
- **QD Operator**: Only sees physical_process applications without dispatch
- **Remark Operator**: Sees applications with bank assignments and PAN check conditions
- **Final Status Operator**: Can see all applications for final status updates
- **Super Admin/Admin**: Can see all applications

### Timeline Tracking

Every status change creates a timeline entry:
- `bank_card_application_timeline` table stores all stage changes
- Includes: stage, note, changed_by, created_at
- Visible in Document Verification Modal (Timeline tab)

---

## Environment Configuration

### Backend Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gharkapaisa
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL=false

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,http://localhost:3000

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name

# MSG91 SMS
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=GKPAIS

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (SES)
AWS_SES_REGION=ap-south-1
AWS_SES_FROM_EMAIL=noreply@gharkapaisa.com
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=GharKaPaisa
```

---

## Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate  # Run database migrations
npm run seed     # Seed initial data (optional)
npm run dev      # Start development server
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev      # Start development server
```

### Database Migrations

```bash
cd backend
npm run migrate  # Run all pending migrations
```

### Seeding Data

```bash
cd backend
npm run seed              # Seed all data
npm run seed:cards        # Seed credit card products only
```

---

## Testing & Deployment

### Build Commands

**Backend:**
```bash
npm start        # Production start
npm run dev      # Development with nodemon
```

**Frontend:**
```bash
npm run build    # Production build
npm run preview  # Preview production build
```

### Key Files Reference

#### Backend
- **Server**: `backend/src/server.js`
- **Database Config**: `backend/src/config/database.js`
- **Auth Controller**: `backend/src/modules/auth/controller.js`
- **CRM Controller**: `backend/src/modules/crm/application.controller.js`
- **Bank Card Controller**: `backend/src/modules/crm/bank_card_application.controller.js`
- **Credit Card Seeds**: `backend/src/database/seeds/seed-credit-cards.js`
- **Bank Seeds**: `backend/src/database/seeds/seed-new-banks.js`

#### Frontend
- **Entry Point**: `frontend/src/main.jsx`
- **API Service**: `frontend/src/services/api.js`
- **Auth Store**: `frontend/src/app/store/authStore.js`
- **Bank Card Management**: `frontend/src/modules/admin/credit-cards/ManageBankCardApplications.jsx`
- **Document Verification**: `frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx`
- **Credit Card Components**: `frontend/src/modules/home/components/CreditCards/`

#### Configuration
- **Backend Package**: `backend/package.json`
- **Frontend Package**: `frontend/package.json`
- **Vite Config**: `frontend/vite.config.js`

---

## Additional Resources

### Credit Card Data Files
- HDFC Cards: `frontend/src/modules/home/components/CreditCards/HDFCCards.js`
- SBI Cards: `frontend/src/modules/home/components/CreditCards/SBICards.js`
- ICICI Cards: `frontend/src/modules/home/components/CreditCards/ICICICards.js`
- Axis Cards: `frontend/src/modules/home/components/CreditCards/AxisCards.js`
- Yes Bank Cards: `frontend/src/modules/home/components/CreditCards/YesBankCards.js`
- BOB Cards: `frontend/src/modules/home/components/CreditCards/BOBCards.js`
- Kotak Cards: `frontend/src/modules/home/components/CreditCards/KotakCards.js`

### Pincode Data
- S8 Pincodes: `backend/src/data/s8_pincodes.json`
- SBI Pincodes: `backend/src/data/sbi_pincodes.json`

### Utilities
- Bank App Number Utils: `frontend/src/utils/bankAppNumberUtils.js`
- Card Image Helper: `frontend/src/modules/home/components/CreditCards/cardImageHelper.js`

---

## Support & Maintenance

For issues or questions:
1. Check this developer guide
2. Review code comments in relevant files
3. Check existing issues in the repository
4. Contact the development team

---

## License

Private & Confidential. All rights reserved.

---

*Last Updated: September 2026*