# Employee Management System - Complete Architecture Document

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Database Architecture](#database-architecture)
4. [Backend API Architecture](#backend-api-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [User Workflows](#user-workflows)
7. [File Structure](#file-structure)
8. [Security & Validation](#security--validation)

---

## 1. System Overview

### 1.1 Purpose
The Employee Management System handles the complete employee lifecycle from recruitment to active employment, including:
- Interview registration and candidate management
- HR interview workflow and feedback
- Employee onboarding and KYC verification
- Employee hierarchy management (Manager → TL → TC)
- Employee-specific product link management
- Employee dashboard and application tracking

### 1.2 Key Panels
1. **Public Career Portal** - Interview registration
2. **HR Panel** - Interview management and candidate processing
3. **Super Admin Panel** - Employee management, hierarchy, product links
4. **Employee Panel** - Dashboard, credit cards, leads, team management

### 1.3 System Flow
```
Career Registration → OTP Verification → Reference Code Generation → 
HR Review → Interview Feedback → Selection/Rejection → 
Employee ID Generation → Login → Terms & KYC → 
Joining Form → HR Verification → Employee Activation → 
Employee Dashboard → Product Links → Applications
```

---

## 2. User Roles & Permissions

### 2.1 Role Definitions

| Role | Code | Description | Panel Access |
|------|------|-------------|--------------|
| Super Admin | SUPER_ADMIN | Full system control | Super Admin Panel |
| HR Admin | HR_ADMIN | HR operations management | HR Panel |
| HR Operator | HR_OPERATOR | Interview feedback and candidate processing | HR Panel |
| Manager | EMPLOYEE_MANAGER | Team management and application oversight | Employee Panel |
| Team Leader | EMPLOYEE_TL | TC management and application tracking | Employee Panel |
| TC (Telecaller) | EMPLOYEE_TC | Lead generation and applications | Employee Panel |
| Candidate | CANDIDATE | Interview registration | Public Portal |

### 2.2 Permission Matrix

| Feature | Super Admin | HR Admin | HR Operator | Manager | TL | TC | Candidate |
|---------|-------------|----------|-------------|---------|----|----|-----------|
| View All Candidates | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Interview Feedback | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Select/Reject Candidates | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Employees | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Employee Hierarchy | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Product Links | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activate Employees | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Own Applications | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| View Team Applications | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Add Leads | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| View Own Profile | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Complete Joining Form | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Submit KYC Documents | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## 3. Database Architecture

### 3.1 Core Tables

#### 3.1.1 employee_candidates
**Purpose**: Store interview registration candidates

```sql
CREATE TABLE employee_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(20) UNIQUE NOT NULL, -- Candidate ID (e.g., CAND00001)
    
    -- Personal Information
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    email_id VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    current_address TEXT,
    permanent_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    
    -- Education
    highest_qualification VARCHAR(100) NOT NULL,
    passing_year INTEGER,
    
    -- Experience
    experience_type VARCHAR(20) NOT NULL, -- 'Fresher' or 'Experienced'
    total_experience_years DECIMAL(4,1),
    current_company VARCHAR(100),
    current_designation VARCHAR(100),
    last_salary_ctc DECIMAL(12,2),
    expected_salary DECIMAL(12,2),
    immediate_joining BOOLEAN DEFAULT false,
    notice_period_days INTEGER,
    comfortable_with_location BOOLEAN DEFAULT true,
    relevant_experience BOOLEAN,
    
    -- Source Information
    how_did_you_hear VARCHAR(50), -- 'Employee Reference', 'WhatsApp', 'Instagram', etc.
    referred_by_employee_id UUID REFERENCES employees(id),
    
    -- Resume
    resume_url TEXT,
    resume_file_name VARCHAR(255),
    
    -- Verification
    mobile_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    otp_verified BOOLEAN DEFAULT false,
    
    -- Interview Status
    interview_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SELECTED', 'REJECTED'
    interviewer_id UUID REFERENCES users(id),
    interview_feedback TEXT,
    interview_date DATE,
    interview_rating INTEGER,
    
    -- Selection Details (if selected)
    offered_salary DECIMAL(12,2),
    offered_designation VARCHAR(100),
    offered_department VARCHAR(100),
    expected_joining_date DATE,
    
    -- Rejection Details (if rejected)
    rejection_reason TEXT,
    rejection_date DATE,
    
    -- Employee Conversion
    converted_to_employee_id UUID REFERENCES employees(id),
    conversion_date TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_employee_candidates_reference_code ON employee_candidates(reference_code);
CREATE INDEX idx_employee_candidates_mobile ON employee_candidates(mobile_number);
CREATE INDEX idx_employee_candidates_email ON employee_candidates(email_id);
CREATE INDEX idx_employee_candidates_status ON employee_candidates(interview_status);
CREATE INDEX idx_employee_candidates_interviewer ON employee_candidates(interviewer_id);
```

#### 3.1.2 employees
**Purpose**: Main employee table after selection

```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- Employee ID (e.g., EMP00001)
    
    -- User Account Reference
    user_id UUID REFERENCES users(id) UNIQUE,
    
    -- Personal Information
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(15),
    email_id VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    current_address TEXT,
    permanent_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    
    -- Employment Details
    designation VARCHAR(100) NOT NULL, -- 'Manager', 'Team Leader', 'TC'
    department VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    work_location VARCHAR(100),
    reporting_manager_id UUID REFERENCES employees(id),
    employment_type VARCHAR(20) NOT NULL, -- 'Full-time', 'Part-time', 'Internship'
    offered_salary DECIMAL(12,2) NOT NULL,
    incentive_structure TEXT,
    target_applicable TEXT,
    notice_period_days INTEGER,
    
    -- Recruitment Details
    referred_by VARCHAR(100),
    recruitment_source VARCHAR(50),
    interviewer_id UUID REFERENCES users(id),
    interview_feedback TEXT,
    interview_result VARCHAR(20), -- 'SELECTED', 'REJECTED'
    
    -- Status
    employee_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'INACTIVE', 'TERMINATED'
    joining_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    kyc_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'
    terms_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    activated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_mobile ON employees(mobile_number);
CREATE INDEX idx_employees_email ON employees(email_id);
CREATE INDEX idx_employees_designation ON employees(designation);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(employee_status);
CREATE INDEX idx_employees_reporting_manager ON employees(reporting_manager_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
```

#### 3.1.3 employee_joining_details
**Purpose**: Detailed joining form information

```sql
CREATE TABLE employee_joining_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    
    -- Personal Details (from joining form)
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    whatsapp_number VARCHAR(15),
    email_id VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    current_address TEXT NOT NULL,
    permanent_address TEXT,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_number VARCHAR(15) NOT NULL,
    
    -- Job Details
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    joining_date DATE NOT NULL,
    work_location VARCHAR(100) NOT NULL,
    reporting_manager VARCHAR(100),
    employment_type VARCHAR(50) NOT NULL,
    
    -- Education & Experience
    highest_qualification VARCHAR(100) NOT NULL,
    passing_year INTEGER,
    experience_type VARCHAR(20) NOT NULL,
    previous_company VARCHAR(100),
    previous_designation VARCHAR(100),
    total_experience_years DECIMAL(4,1),
    
    -- Salary & Incentives
    offered_salary DECIMAL(12,2) NOT NULL,
    incentive_structure TEXT,
    target_applicable TEXT,
    notice_period_days INTEGER,
    
    -- Recruitment Details
    referred_by VARCHAR(100),
    recruitment_source VARCHAR(50),
    
    -- Bank & Statutory Details
    bank_account_holder_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    pan_number VARCHAR(20),
    aadhaar_number VARCHAR(20),
    
    -- Declaration
    declaration_accepted BOOLEAN DEFAULT false,
    declaration_date DATE,
    signature_ip_address VARCHAR(50),
    
    -- Status
    form_status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
    submitted_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_joining_details_employee_id ON employee_joining_details(employee_id);
CREATE INDEX idx_employee_joining_details_status ON employee_joining_details(form_status);
```

#### 3.1.4 employee_kyc
**Purpose**: KYC verification details

```sql
CREATE TABLE employee_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    
    -- KYC Documents
    pan_number VARCHAR(20) UNIQUE,
    pan_document_url TEXT,
    pan_verified BOOLEAN DEFAULT false,
    pan_verified_date TIMESTAMP,
    pan_rejection_reason TEXT,
    
    aadhaar_number VARCHAR(20) UNIQUE,
    aadhaar_document_url TEXT,
    aadhaar_verified BOOLEAN DEFAULT false,
    aadhaar_verified_date TIMESTAMP,
    aadhaar_rejection_reason TEXT,
    
    bank_account_number VARCHAR(50),
    bank_account_holder_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    bank_document_url TEXT,
    bank_verified BOOLEAN DEFAULT false,
    bank_verified_date TIMESTAMP,
    bank_rejection_reason TEXT,
    
    -- Overall KYC Status
    kyc_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'
    submitted_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_kyc_employee_id ON employee_kyc(employee_id);
CREATE INDEX idx_employee_kyc_status ON employee_kyc(kyc_status);
CREATE INDEX idx_employee_kyc_pan ON employee_kyc(pan_number);
CREATE INDEX idx_employee_kyc_aadhaar ON employee_kyc(aadhaar_number);
```

#### 3.1.5 employee_documents
**Purpose**: Employee document management

```sql
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    
    -- Document Types
    document_type VARCHAR(50) NOT NULL, -- 'photo', 'aadhaar', 'pan', 'education_certificate', 'bank_proof', 'resume', 'experience_letter', 'terms_video'
    document_url TEXT NOT NULL,
    document_file_name VARCHAR(255),
    document_size INTEGER,
    document_mime_type VARCHAR(100),
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX idx_employee_documents_status ON employee_documents(verification_status);
```

#### 3.1.6 employee_terms_acceptance
**Purpose**: Terms and conditions acceptance with video verification

```sql
CREATE TABLE employee_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    
    -- Terms Content
    terms_version VARCHAR(20) NOT NULL,
    terms_content TEXT NOT NULL,
    
    -- Acceptance Details
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP,
    acceptance_ip_address VARCHAR(50),
    
    -- Video Verification
    video_url TEXT,
    video_uploaded_at TIMESTAMP,
    video_file_name VARCHAR(255),
    video_size INTEGER,
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_terms_employee_id ON employee_terms_acceptance(employee_id);
CREATE INDEX idx_employee_terms_status ON employee_terms_acceptance(verification_status);
```

#### 3.1.7 employee_product_links
**Purpose**: Employee-specific product referral links (CRITICAL TABLE)

```sql
CREATE TABLE employee_product_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Links
    partner_url TEXT NOT NULL, -- Employee-specific referral URL (e.g., https://example.com/apply?ref=EMP00025)
    public_url TEXT, -- Public facing URL if different
    
    -- Incentive
    incentive_amount DECIMAL(10,2) NOT NULL,
    incentive_type VARCHAR(20) DEFAULT 'FIXED', -- 'FIXED', 'PERCENTAGE'
    incentive_tier VARCHAR(20), -- For tiered incentives
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'EXPIRED'
    
    -- Assignment
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one link per employee per product
    UNIQUE(employee_id, product_id)
);

CREATE INDEX idx_employee_product_links_employee_id ON employee_product_links(employee_id);
CREATE INDEX idx_employee_product_links_product_id ON employee_product_links(product_id);
CREATE INDEX idx_employee_product_links_status ON employee_product_links(status);
```

#### 3.1.8 employee_incentive_transactions
**Purpose**: Track incentive earnings and payouts

```sql
CREATE TABLE employee_incentive_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    product_id UUID REFERENCES products(id),
    application_id UUID REFERENCES applications(id),
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL, -- 'EARNED', 'PAID', 'HELD', 'RELEASED', 'REVERSED'
    amount DECIMAL(10,2) NOT NULL,
    incentive_type VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
    
    -- Hold/Release (if applicable)
    hold_until DATE,
    release_date DATE,
    hold_reason TEXT,
    
    -- Payment Details (if paid)
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP,
    
    -- Application Reference
    application_status VARCHAR(20),
    customer_name VARCHAR(100),
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_employee_incentive_employee_id ON employee_incentive_transactions(employee_id);
CREATE INDEX idx_employee_incentive_application_id ON employee_incentive_transactions(application_id);
CREATE INDEX idx_employee_incentive_status ON employee_incentive_transactions(status);
CREATE INDEX idx_employee_incentive_type ON employee_incentive_transactions(transaction_type);
```

#### 3.1.9 employee_onboarding_checklist
**Purpose**: Track onboarding progress

```sql
CREATE TABLE employee_onboarding_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    
    -- Checklist Items
    interview_completed BOOLEAN DEFAULT false,
    interview_completed_at TIMESTAMP,
    
    reference_generated BOOLEAN DEFAULT false,
    reference_generated_at TIMESTAMP,
    
    login_verified BOOLEAN DEFAULT false,
    login_verified_at TIMESTAMP,
    
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP,
    
    joining_form_completed BOOLEAN DEFAULT false,
    joining_form_completed_at TIMESTAMP,
    
    kyc_submitted BOOLEAN DEFAULT false,
    kyc_submitted_at TIMESTAMP,
    
    kyc_verified BOOLEAN DEFAULT false,
    kyc_verified_at TIMESTAMP,
    
    documents_submitted BOOLEAN DEFAULT false,
    documents_submitted_at TIMESTAMP,
    
    employee_activated BOOLEAN DEFAULT false,
    employee_activated_at TIMESTAMP,
    
    -- Overall Progress
    overall_progress INTEGER DEFAULT 0, -- 0-100 percentage
    current_stage VARCHAR(50), -- Current stage in onboarding
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_onboarding_employee_id ON employee_onboarding_checklist(employee_id);
CREATE INDEX idx_employee_onboarding_progress ON employee_onboarding_checklist(overall_progress);
```

#### 3.1.10 employee_hierarchy
**Purpose**: Explicit hierarchy management (optional, can use reporting_manager_id in employees)

```sql
CREATE TABLE employee_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES employees(id),
    team_leader_id UUID REFERENCES employees(id),
    tc_id UUID NOT NULL REFERENCES employees(id),
    
    -- Hierarchy Level
    hierarchy_level VARCHAR(20) NOT NULL, -- 'MANAGER', 'TEAM_LEADER', 'TC'
    
    -- Assignment Details
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_hierarchy_manager ON employee_hierarchy(manager_id);
CREATE INDEX idx_employee_hierarchy_tl ON employee_hierarchy(team_leader_id);
CREATE INDEX idx_employee_hierarchy_tc ON employee_hierarchy(tc_id);
CREATE INDEX idx_employee_hierarchy_level ON employee_hierarchy(hierarchy_level);
```

### 3.2 Existing Table Modifications

#### 3.2.1 users Table (Additions)
```sql
-- Add employee role support
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT false;
```

#### 3.2.2 applications Table (Additions)
```sql
-- Add employee tracking
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employee_link_id UUID REFERENCES employee_product_links(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'PARTNER'; -- 'PARTNER', 'EMPLOYEE'

CREATE INDEX idx_applications_employee_id ON applications(employee_id);
CREATE INDEX idx_applications_employee_link_id ON applications(employee_link_id);
CREATE INDEX idx_applications_source_type ON applications(source_type);
```

#### 3.2.3 roles Table (Additions)
```sql
-- Add employee roles
INSERT INTO roles (role_code, role_name, description) VALUES
('EMPLOYEE_MANAGER', 'Employee Manager', 'Manager role with team oversight'),
('EMPLOYEE_TL', 'Team Leader', 'Team Leader with TC management'),
('EMPLOYEE_TC', 'Telecaller', 'TC role for lead generation'),
('HR_ADMIN', 'HR Admin', 'HR operations administrator'),
('HR_OPERATOR', 'HR Operator', 'HR interview operator'),
('CANDIDATE', 'Candidate', 'Interview registration candidate');
```

---

## 4. Backend API Architecture

### 4.1 Module Structure

```
backend/src/modules/employee/
├── controller.js           # Request handlers
├── service.js              # Business logic
├── repository.js           # Database operations
├── route.js                # API routes
├── dto.js                  # Data transfer objects
├── middleware.js           # Custom middleware
├── validator.js            # Request validation
└── constants.js            # Constants and enums
```

### 4.2 API Endpoints

#### 4.2.1 Public Career Portal (No Authentication)

**Base Path:** `/api/public/careers`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/register` | Interview registration | Candidate registration form | Candidate with reference code |
| POST | `/verify-mobile` | Send OTP to mobile | `{ mobile_number }` | OTP sent confirmation |
| POST | `/verify-email` | Send OTP to email | `{ email_id }` | OTP sent confirmation |
| POST | `/verify-otp` | Verify OTP | `{ mobile_number, email_id, otp }` | Verification success |
| GET | `/reference-code/:mobile` | Get reference code | - | Reference code |
| GET | `/status/:reference_code` | Check application status | - | Application status |

#### 4.2.2 HR Panel (HR Admin/Operator Authentication)

**Base Path:** `/api/hr`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/candidates` | List all candidates | Query params (status, date range) | Paginated candidates list |
| GET | `/candidates/:id` | Get candidate details | - | Candidate full details |
| GET | `/candidates/reference/:code` | Get by reference code | - | Candidate details |
| PUT | `/candidates/:id/interview-feedback` | Submit interview feedback | `{ interview_status, feedback, rating, offered_salary, offered_designation }` | Updated candidate |
| PUT | `/candidates/:id/select` | Select candidate | `{ offered_salary, offered_designation, offered_department, expected_joining_date }` | Selected candidate with employee ID |
| PUT | `/candidates/:id/reject` | Reject candidate | `{ rejection_reason }` | Rejected candidate |
| GET | `/candidates/stats` | Candidate statistics | - | Stats (pending, selected, rejected) |
| GET | `/candidates/export` | Export candidates | Query params | Excel/CSV file |

#### 4.2.3 Employee Management (Super Admin/HR Admin)

**Base Path:** `/api/employees`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | List all employees | Query params (status, department, designation) | Paginated employees list |
| GET | `/stats` | Employee statistics | - | Stats by status, department |
| GET | `/:id` | Get employee details | - | Employee 360° view |
| GET | `/:employee_id/applications` | Get employee applications | Query params | Employee applications |
| PUT | `/:id/activate` | Activate employee | `{ activation_notes }` | Activated employee |
| PUT | `/:id/deactivate` | Deactivate employee | `{ deactivation_reason }` | Deactivated employee |
| PUT | `/:id/details` | Update employee details | Employee details object | Updated employee |
| GET | `/hierarchy` | Get employee hierarchy | - | Hierarchy tree |
| POST | `/hierarchy/assign` | Assign reporting manager | `{ employee_id, manager_id }` | Assignment confirmation |
| GET | `/onboarding/:id` | Get onboarding progress | - | Onboarding checklist |
| GET | `/join-pending` | Get joining pending employees | - | List of pending employees |
| GET | `/kyc-pending` | Get KYC pending employees | - | List of KYC pending employees |
| GET | `/active` | Get active employees | - | List of active employees |
| GET | `/inactive` | Get inactive employees | - | List of inactive employees |

#### 4.2.4 Employee Product Links (Super Admin)

**Base Path:** `/api/employees/product-links`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | List all product links | Query params (employee_id, product_id) | Paginated links |
| POST | `/` | Create product link | `{ employee_id, product_id, partner_url, public_url, incentive_amount, incentive_type }` | Created link |
| PUT | `/:id` | Update product link | Link update object | Updated link |
| DELETE | `/:id` | Delete product link | - | Deletion confirmation |
| GET | `/employee/:employee_id` | Get employee's product links | - | Employee's all product links |
| POST | `/bulk-assign` | Bulk assign links to employee | `{ employee_id, links: [{ product_id, partner_url, incentive_amount }] }` | Bulk assignment result |
| GET | `/product/:product_id` | Get all employees with this product | - | List of employees with product |

#### 4.2.5 Employee KYC Management (HR Admin/Super Admin)

**Base Path:** `/api/employees/kyc`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/pending` | Get pending KYC verifications | - | Pending KYC list |
| GET | `/:employee_id` | Get employee KYC details | - | KYC details |
| PUT | `/:employee_id/verify` | Verify employee KYC | `{ pan_verified, aadhaar_verified, bank_verified, notes }` | Verification result |
| PUT | `/:employee_id/reject` | Reject employee KYC | `{ rejection_reason }` | Rejection result |
| GET | `/documents/:employee_id` | Get employee documents | - | Documents list |
| PUT | `/documents/:id/verify` | Verify document | `{ verification_status, rejection_reason }` | Verification result |

#### 4.2.6 Employee Panel (Employee Authentication)

**Base Path:** `/api/employee`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/profile` | Get employee profile | - | Employee profile |
| PUT | `/profile` | Update employee profile | Profile update object | Updated profile |
| GET | `/joining-form` | Get joining form details | - | Joining form data |
| POST | `/joining-form` | Submit joining form | Joining form data | Submitted form |
| GET | `/terms` | Get terms and conditions | - | Terms content |
| POST | `/terms/accept` | Accept terms and conditions | `{ accepted, video_url }` | Acceptance confirmation |
| POST | `/kyc/submit` | Submit KYC documents | `{ pan_document, aadhaar_document, bank_document, pan_number, aadhaar_number }` | KYC submission |
| POST | `/documents/upload` | Upload document | `{ document_type, file }` | Uploaded document |
| GET | `/documents` | Get my documents | - | My documents |
| GET | `/onboarding-status` | Get onboarding status | - | Onboarding progress |
| GET | `/products` | Get available products | - | Products with my incentives |
| GET | `/products/:product_id/link` | Get my product link | - | My referral URL |
| GET | `/applications` | Get my applications | Query params | My applications |
| GET | `/team` | Get my team (Manager/TL only) | - | Team members and their stats |
| GET | `/team/applications` | Get team applications (Manager/TL only) | Query params | Team applications |
| GET | `/incentives` | Get my incentive transactions | Query params | Incentive history |
| GET | `/dashboard-stats` | Get dashboard statistics | - | Dashboard stats |

#### 4.2.7 Authentication Endpoints

**Base Path:** `/api/auth`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/employee/login` | Employee login | `{ reference_code, mobile_number, otp }` | JWT token + employee data |
| POST | `/employee/verify-otp` | Verify employee OTP | `{ mobile_number, otp }` | Verification success |
| POST | `/employee/send-otp` | Send OTP to employee | `{ mobile_number }` | OTP sent confirmation |

---

## 5. Frontend Architecture

### 5.1 Module Structure

```
frontend/src/modules/
├── employee/                      # Employee Panel
│   ├── layout/
│   │   └── EmployeeLayout.jsx    # Employee panel layout
│   ├── dashboard/
│   │   ├── EmployeeDashboard.jsx  # Main dashboard
│   │   └── components/
│   │       ├── StatsCard.jsx
│   │       ├── OnboardingProgress.jsx
│   │       └── RecentApplications.jsx
│   ├── profile/
│   │   ├── EmployeeProfile.jsx    # Profile view/edit
│   │   ├── JoiningForm.jsx        # Joining form
│   │   ├── KYCSubmission.jsx      # KYC document upload
│   │   ├── TermsAcceptance.jsx    # Terms & conditions
│   │   └── DocumentsUpload.jsx    # Document management
│   ├── credit-cards/
│   │   ├── EmployeeCreditCards.jsx # Credit cards list
│   │   ├── EmployeeCardDetail.jsx  # Card detail with incentive
│   │   ├── AddLead.jsx             # Add lead form
│   │   └── components/
│   │       ├── CardIncentiveCard.jsx
│   │       └── EmployeeReferralLink.jsx
│   ├── loans/
│   │   ├── EmployeeLoans.jsx      # Loans list
│   │   └── EmployeeLoanDetail.jsx
│   ├── applications/
│   │   ├── EmployeeApplications.jsx # My applications
│   │   └── ApplicationDetail.jsx
│   ├── team/
│   │   ├── MyTeam.jsx             # Team view (Manager/TL)
│   │   ├── TeamMembers.jsx        # Team members list
│   │   └── TeamApplications.jsx   # Team applications
│   ├── incentives/
│   │   ├── MyIncentives.jsx       # Incentive history
│   │   └── IncentiveDetail.jsx
│   └── store/
│       └── employeeStore.js       # Employee state management
│
├── hr/                            # HR Panel
│   ├── layout/
│   │   └── HRLayout.jsx           # HR panel layout
│   ├── dashboard/
│   │   ├── HRDashboard.jsx        # HR dashboard
│   │   └── components/
│   │       ├── CandidateStats.jsx
│   │       └── InterviewCalendar.jsx
│   ├── candidates/
│   │   ├── CandidateList.jsx      # All candidates
│   │   ├── CandidateDetail.jsx    # Candidate 360 view
│   │   ├── InterviewFeedback.jsx  # Interview feedback form
│   │   ├── CandidateSelection.jsx # Selection form
│   │   └── components/
│   │       ├── CandidateCard.jsx
│   │       ├── StatusBadge.jsx
│   │       └── InterviewRating.jsx
│   ├── employees/
│   │   ├── EmployeeList.jsx       # Employee list
│   │   ├── EmployeeActivation.jsx # Employee activation
│   │   └── KYCVerification.jsx    # KYC verification
│   └── store/
│       └── hrStore.js             # HR state management
│
└── super-admin/
    ├── employees/
    │   ├── EmployeeManagement.jsx  # Main employee management
    │   ├── EmployeeList.jsx       # Employee list with filters
    │   ├── EmployeeDetail.jsx     # Employee 360 view
    │   ├── EmployeeHierarchy.jsx  # Hierarchy management
    │   ├── EmployeeActivation.jsx # Activation/deactivation
    │   ├── ProductLinks.jsx       # Product link management
    │   ├── BulkLinkAssign.jsx     # Bulk link assignment
    │   └── components/
    │       ├── EmployeeCard.jsx
    │       ├── HierarchyTree.jsx
    │       ├── LinkAssignmentForm.jsx
    │       └── OnboardingTracker.jsx
    └── dashboard/
        └── SuperAdminDashboard.jsx # Updated dashboard with employee stats
```

### 5.2 Key Frontend Pages Summary

#### Employee Panel Pages
- **EmployeeDashboard**: Stats, onboarding progress, quick actions, recent applications
- **EmployeeProfile**: View/edit personal and employment information
- **JoiningForm**: Complete 8-section joining registration form
- **TermsAcceptance**: Terms display with video verification
- **KYCSubmission**: PAN, Aadhaar, Bank document submission
- **DocumentsUpload**: Document management and upload
- **EmployeeCreditCards**: Product list with employee incentives (not commission)
- **AddLead**: Lead generation with employee-specific referral URL
- **EmployeeApplications**: Personal application tracking
- **MyTeam**: Team view for Manager/TL only
- **MyIncentives**: Incentive transaction history

#### HR Panel Pages
- **HRDashboard**: Candidate statistics, interview calendar
- **CandidateList**: All candidates with filters and bulk actions
- **CandidateDetail**: Complete candidate 360° view
- **InterviewFeedback**: Interview rating and feedback form
- **CandidateSelection**: Offer details and employee ID generation
- **EmployeeList**: Employee management for HR
- **KYCVerification**: KYC document verification

#### Super Admin Pages
- **EmployeeManagement**: Main employee management with tabs
- **EmployeeDetail**: Complete employee 360° view
- **EmployeeHierarchy**: Hierarchy tree management
- **ProductLinks**: Employee-specific product link assignment
- **BulkLinkAssign**: Bulk link assignment tool
- **EmployeeActivation**: Onboarding completion and activation

#### Public Pages
- **Careers**: Career page with 12 benefits and open positions
- **InterviewRegistration**: Complete candidate registration form
- **ApplicationStatus**: Status check using reference code

---

## 6. User Workflows

### 6.1 Candidate Registration Workflow

```
1. User visits: Home → Footer → Careers → Interview Registration
2. Fills Interview Registration Form
   - Personal Details
   - Education
   - Experience
   - Resume Upload
   - Source Information
3. Submits form
4. System sends OTP to mobile and email
5. User verifies OTP
6. System generates Reference Code (e.g., CAND00001)
7. System displays Reference Code to user
8. User can check status later using Reference Code
```

### 6.2 HR Interview Workflow

```
1. HR Operator logs into HR Panel
2. Views candidate list (filter by status = PENDING)
3. Reviews candidate details
4. Contacts candidate for interview
5. Conducts interview
6. Submits interview feedback
   - Rating
   - Feedback comments
   - Status (SELECTED/REJECTED)
7. If SELECTED:
   - Enters offered salary
   - Enters offered designation
   - Enters expected joining date
   - System generates Employee ID (e.g., EMP00025)
   - System converts candidate to employee
   - System sends login credentials to candidate
8. If REJECTED:
   - Enters rejection reason
   - System updates candidate status
```

### 6.3 Employee Onboarding Workflow

```
1. Selected candidate receives Employee ID and login instructions
2. Employee logs in using Reference Code + Mobile + OTP
3. System shows onboarding checklist with pending items
4. Employee completes Terms & Conditions with video
5. Employee completes Joining Form with all sections
6. Employee submits KYC documents
7. HR reviews and verifies all submissions
8. Super Admin assigns product links with employee-specific URLs
9. Super Admin activates employee
10. Employee gains full dashboard access
```

### 6.4 Employee Application Workflow

```
1. Active employee logs into Employee Panel
2. Views dashboard with stats
3. Goes to Credit Cards
4. Selects product (e.g., SBI Cashback)
5. Views product with employee incentive (e.g., ₹1,000)
6. Gets employee-specific URL: https://example.com/apply?ref=EMP00025
7. Shares URL with customer
8. Customer applies through URL
9. Application created with employee_id
10. Application visible to employee and Manager/TL
11. Incentive calculated and tracked
```

### 6.5 Product Link Assignment Workflow

```
1. Super Admin goes to Employee Management → Product Links
2. Selects employee (e.g., EMP00025 - Rahul)
3. For each product:
   - Enters employee-specific referral URL
   - Sets incentive amount
   - Saves
4. System validates UNIQUE constraint (employee_id, product_id)
5. Rahul's SBI URL change doesn't affect Priya's URL
6. Can use bulk assignment for multiple employees
```

### 6.6 Team Hierarchy Workflow

```
1. Super Admin manages hierarchy: Manager → TL → TC
2. Assigns reporting manager to each employee
3. Manager can view complete team structure
4. TL can view assigned TCs
5. TC can only view own applications
6. Applications tracked by hierarchy
```

---

## 7. File Structure

### 7.1 Backend File Structure

```
backend/src/modules/employee/
├── controller.js                 # Request handlers
├── service.js                    # Business logic
├── repository.js                 # Database operations
├── route.js                      # API routes
├── dto.js                        # Data transfer objects
├── middleware.js                 # Custom middleware
├── validator.js                  # Request validation
└── constants.js                  # Constants and enums

backend/src/modules/hr/
├── controller.js                 # HR request handlers
├── service.js                    # HR business logic
├── repository.js                 # HR database operations
├── route.js                      # HR API routes
├── dto.js                        # HR data transfer objects
├── middleware.js                 # HR custom middleware
├── validator.js                  # HR request validation
└── constants.js                  # HR constants

backend/src/database/migrations/
├── migrate_employee_system.js    # Employee system migration
└── migrate_employee_tables.js    # Create employee tables
```

### 7.2 Frontend File Structure

```
frontend/src/modules/employee/
├── layout/
│   └── EmployeeLayout.jsx
├── dashboard/
│   ├── EmployeeDashboard.jsx
│   └── components/
├── profile/
│   ├── EmployeeProfile.jsx
│   ├── JoiningForm.jsx
│   ├── KYCSubmission.jsx
│   ├── TermsAcceptance.jsx
│   └── DocumentsUpload.jsx
├── credit-cards/
│   ├── EmployeeCreditCards.jsx
│   ├── EmployeeCardDetail.jsx
│   ├── AddLead.jsx
│   └── components/
├── applications/
│   ├── EmployeeApplications.jsx
│   └── ApplicationDetail.jsx
├── team/
│   ├── MyTeam.jsx
│   ├── TeamMembers.jsx
│   └── TeamApplications.jsx
├── incentives/
│   ├── MyIncentives.jsx
│   └── IncentiveDetail.jsx
└── store/
    └── employeeStore.js

frontend/src/modules/hr/
├── layout/
│   └── HRLayout.jsx
├── dashboard/
│   ├── HRDashboard.jsx
│   └── components/
├── candidates/
│   ├── CandidateList.jsx
│   ├── CandidateDetail.jsx
│   ├── InterviewFeedback.jsx
│   ├── CandidateSelection.jsx
│   └── components/
├── employees/
│   ├── EmployeeList.jsx
│   ├── EmployeeActivation.jsx
│   └── KYCVerification.jsx
└── store/
    └── hrStore.js

frontend/src/modules/super-admin/employees/
├── EmployeeManagement.jsx
├── EmployeeList.jsx
├── EmployeeDetail.jsx
├── EmployeeHierarchy.jsx
├── EmployeeActivation.jsx
├── ProductLinks.jsx
├── BulkLinkAssign.jsx
└── components/

frontend/src/modules/home/
├── Careers.jsx                   # Updated
├── InterviewRegistration.jsx     # New
└── ApplicationStatus.jsx         # New
```

---

## 8. Security & Validation

### 8.1 Authentication & Authorization

**Employee Authentication**:
- Login using Reference Code + Mobile Number + OTP
- JWT token with employee role and designation
- Token expiration: 24 hours

**Role-Based Access Control**:
- Middleware for each role type
- Team access restricted to Manager/TL
- Employee data access based on hierarchy

### 8.2 Data Validation

**Input Validation**:
- All form inputs validated using express-validator
- File upload validation (type, size)
- Email, mobile, PAN, Aadhaar format validation

**Database Validation**:
- UNIQUE constraints on critical fields
- Foreign key constraints
- CHECK constraints for status fields

### 8.3 Data Privacy

**Sensitive Data Protection**:
- PAN, Aadhaar, bank details encrypted at rest
- Mobile numbers partially masked in UI
- Document access restricted by role
- Audit logging for all sensitive operations

### 8.4 API Security

**Rate Limiting**:
- OTP endpoint: 5 requests per hour
- Registration: 3 requests per day
- Login: 10 requests per hour

**Security Measures**:
- SQL injection prevention
- XSS prevention
- CSRF protection
- Parameterized queries

---

## 9. Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. Database schema creation
2. Basic CRUD operations for candidates
3. Interview registration form
4. OTP verification system
5. Reference code generation

### Phase 2: HR Panel (Week 3-4)
1. HR dashboard
2. Candidate list and filters
3. Interview feedback system
4. Candidate selection/rejection
5. Employee ID generation

### Phase 3: Employee Onboarding (Week 5-6)
1. Employee login system
2. Terms and conditions
3. Joining form
4. KYC submission
5. Document upload
6. Onboarding checklist

### Phase 4: Employee Dashboard (Week 7-8)
1. Employee dashboard
2. Profile management
3. Credit cards view
4. Application tracking
5. Incentive tracking

### Phase 5: Hierarchy & Teams (Week 9-10)
1. Employee hierarchy management
2. Team assignment
3. Team view for Manager/TL
4. Team application tracking

### Phase 6: Product Links (Week 11-12)
1. Product link management
2. Employee-specific URLs
3. Bulk link assignment
4. Incentive configuration

### Phase 7: Super Admin Enhancements (Week 13-14)
1. Employee management enhancements
2. 360° employee view
3. Advanced filtering
4. Employee activation
5. Reporting and analytics

### Phase 8: Testing & Deployment (Week 15-16)
1. Integration testing
2. User acceptance testing
3. Performance testing
4. Security testing
5. Deployment
6. Documentation

---

## 10. Summary

This architecture provides a comprehensive Employee Management System that:

1. **Handles Complete Employee Lifecycle**: From candidate registration to active employment
2. **Separates Responsibilities**: HR handles recruitment, Super Admin manages employees, Employees use their panel
3. **Ensures Data Isolation**: Employee-specific product links don't affect each other
4. **Provides Hierarchy Management**: Manager → TL → TC structure with proper access control
5. **Tracks Onboarding Progress**: Clear checklist and progress tracking
6. **Manages KYC & Documents**: Comprehensive document management and verification
7. **Tracks Incentives**: Complete incentive calculation and tracking system
8. **Provides Role-Based Access**: Proper permissions for each user type
9. **Ensures Security**: Authentication, authorization, data protection, and audit logging
10. **Scales Effectively**: Modular architecture allows for future enhancements

The system follows the client's requirements exactly while maintaining best practices for security, performance, and maintainability.