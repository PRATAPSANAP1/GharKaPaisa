# Employee Management System - Implementation Plan for GharKaPaisa

## EXECUTIVE SUMMARY

This document provides a complete implementation plan for integrating an Employee Management System into the existing GharKaPaisa platform. The system will handle the complete employee lifecycle from candidate registration through active employment, while maintaining full compatibility with existing Partner, Admin, and Super Admin functionality.

## EXISTING INFRASTRUCTURE AUDIT

### Database Schema
- **User Role System**: PostgreSQL ENUM `user_role` with values: SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER, TEAM_MEMBER
- **Users Table**: Already contains `employee_id`, `department`, `designation` columns
- **Products Table**: Has `partner_url`, `public_url`, commission structure
- **Applications Table**: Complex workflow with statuses: operational_verified, super_admin_approved, commission_released
- **KYC System**: Existing partner KYC structure can be reused

### Authentication & Security
- **JWT System**: 15-minute access tokens with refresh token rotation
- **Firebase Auth**: Primary authentication mechanism
- **Middleware**: Role-based access control (RBAC) with `authorize()` function
- **S3 Integration**: Secure file upload with AES256 encryption, signed URLs

### Communication
- **SMS**: MSG91 integration with DLT templates
- **Email**: Existing email service
- **Notifications**: Comprehensive notification service

### Application Pipeline
- **Four existing processes**: Administrative Operator → Operational Head → Super Admin → Commission Release
- **Status History**: JSONB-based tracking
- **Commission System**: Partner commission calculation and release

## INTEGRATION STRATEGY

### 1. Database Schema Extensions

#### New Tables Required
```sql
-- Employee Candidates (Interview Registration)
CREATE TABLE employee_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    email_id VARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE,
    current_address TEXT,
    highest_qualification VARCHAR(100) NOT NULL,
    passing_year INTEGER,
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
    how_did_you_hear VARCHAR(50),
    referred_by_employee_id UUID,
    resume_url TEXT,
    resume_file_name VARCHAR(255),
    mobile_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    otp_verified BOOLEAN DEFAULT false,
    interview_status VARCHAR(20) DEFAULT 'REGISTERED', -- 'REGISTERED', 'INTERVIEW_PENDING', 'INTERVIEWED', 'SELECTED', 'REJECTED', 'EMPLOYEE_CREATED'
    interviewer_id UUID REFERENCES users(id),
    interview_feedback TEXT,
    interview_date DATE,
    interview_rating INTEGER,
    offered_salary DECIMAL(12,2),
    offered_designation VARCHAR(100),
    offered_department VARCHAR(100),
    expected_joining_date DATE,
    rejection_reason TEXT,
    rejection_date DATE,
    converted_to_employee_id UUID REFERENCES users(id),
    conversion_date TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Employees (Main Employee Table)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) UNIQUE,
    candidate_id UUID REFERENCES employee_candidates(id),
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
    designation VARCHAR(100) NOT NULL, -- 'Manager', 'Team Leader', 'TC'
    department VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    work_location VARCHAR(100),
    employment_type VARCHAR(20) NOT NULL, -- 'Full-time', 'Part-time', 'Internship'
    offered_salary DECIMAL(12,2) NOT NULL,
    incentive_structure TEXT,
    target_applicable TEXT,
    notice_period_days INTEGER,
    referred_by VARCHAR(100),
    recruitment_source VARCHAR(50),
    interviewer_id UUID REFERENCES users(id),
    interview_feedback TEXT,
    interview_result VARCHAR(20),
    employee_status VARCHAR(20) DEFAULT 'ONBOARDING', -- 'ONBOARDING', 'ACTIVE', 'INACTIVE', 'TERMINATED'
    activation_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    activated_by UUID REFERENCES users(id)
);

-- Employee Joining Details
CREATE TABLE employee_joining_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
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
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    joining_date DATE NOT NULL,
    work_location VARCHAR(100) NOT NULL,
    reporting_manager VARCHAR(100),
    employment_type VARCHAR(50) NOT NULL,
    highest_qualification VARCHAR(100) NOT NULL,
    passing_year INTEGER,
    experience_type VARCHAR(20) NOT NULL,
    previous_company VARCHAR(100),
    previous_designation VARCHAR(100),
    total_experience_years DECIMAL(4,1),
    offered_salary DECIMAL(12,2) NOT NULL,
    incentive_structure TEXT,
    target_applicable TEXT,
    notice_period_days INTEGER,
    referred_by VARCHAR(100),
    recruitment_source VARCHAR(50),
    bank_account_holder_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    pan_number VARCHAR(20),
    aadhaar_number VARCHAR(20),
    declaration_accepted BOOLEAN DEFAULT false,
    declaration_date DATE,
    signature_ip_address VARCHAR(50),
    form_status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee KYC (Reuse existing KYC pattern)
CREATE TABLE employee_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    pan_number VARCHAR(20) UNIQUE,
    pan_document_url TEXT,
    pan_document_key TEXT,
    pan_verified BOOLEAN DEFAULT false,
    pan_verified_date TIMESTAMPTZ,
    pan_rejection_reason TEXT,
    aadhaar_number VARCHAR(20) UNIQUE,
    aadhaar_document_url TEXT,
    aadhaar_document_key TEXT,
    aadhaar_verified BOOLEAN DEFAULT false,
    aadhaar_verified_date TIMESTAMPTZ,
    aadhaar_rejection_reason TEXT,
    bank_account_number VARCHAR(50),
    bank_account_holder_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    bank_document_url TEXT,
    bank_document_key TEXT,
    bank_verified BOOLEAN DEFAULT false,
    bank_verified_date TIMESTAMPTZ,
    bank_rejection_reason TEXT,
    kyc_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Documents
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    document_type VARCHAR(50) NOT NULL, -- 'photo', 'aadhaar', 'pan', 'education_certificate', 'bank_proof', 'resume', 'experience_letter', 'terms_video'
    document_url TEXT NOT NULL,
    document_key TEXT NOT NULL,
    document_file_name VARCHAR(255),
    document_size INTEGER,
    document_mime_type VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Terms Acceptance
CREATE TABLE employee_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    terms_version VARCHAR(20) NOT NULL,
    terms_content TEXT NOT NULL,
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMPTZ,
    acceptance_ip_address VARCHAR(50),
    video_url TEXT,
    video_key TEXT,
    video_uploaded_at TIMESTAMPTZ,
    video_file_name VARCHAR(255),
    video_size INTEGER,
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Product Links (CRITICAL)
CREATE TABLE employee_product_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    product_id UUID NOT NULL REFERENCES products(id),
    employee_referral_url TEXT NOT NULL, -- Employee-specific URL
    base_apply_url TEXT,
    incentive_amount DECIMAL(10,2) NOT NULL,
    incentive_type VARCHAR(20) DEFAULT 'FIXED', -- 'FIXED', 'PERCENTAGE'
    incentive_tier VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'EXPIRED'
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, product_id)
);

-- Employee Incentive Transactions
CREATE TABLE employee_incentive_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    product_id UUID REFERENCES products(id),
    application_id UUID REFERENCES applications(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'EARNED', 'PAID', 'HELD', 'RELEASED', 'REVERSED'
    amount DECIMAL(10,2) NOT NULL,
    incentive_type VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
    hold_until DATE,
    release_date DATE,
    hold_reason TEXT,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    application_status VARCHAR(20),
    customer_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID REFERENCES users(id)
);

-- Employee Onboarding Checklist
CREATE TABLE employee_onboarding_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) UNIQUE,
    interview_completed BOOLEAN DEFAULT false,
    interview_completed_at TIMESTAMPTZ,
    employee_created BOOLEAN DEFAULT false,
    employee_created_at TIMESTAMPTZ,
    terms_pending BOOLEAN DEFAULT true,
    terms_completed BOOLEAN DEFAULT false,
    terms_completed_at TIMESTAMPTZ,
    joining_form_completed BOOLEAN DEFAULT false,
    joining_form_completed_at TIMESTAMPTZ,
    kyc_submitted BOOLEAN DEFAULT false,
    kyc_submitted_at TIMESTAMPTZ,
    kyc_verified BOOLEAN DEFAULT false,
    kyc_verified_at TIMESTAMPTZ,
    documents_completed BOOLEAN DEFAULT false,
    documents_completed_at TIMESTAMPTZ,
    hr_verified BOOLEAN DEFAULT false,
    hr_verified_at TIMESTAMPTZ,
    links_assigned BOOLEAN DEFAULT false,
    links_assigned_at TIMESTAMPTZ,
    activated BOOLEAN DEFAULT false,
    activated_at TIMESTAMPTZ,
    overall_progress INTEGER DEFAULT 0,
    current_stage VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Hierarchy (Denormalized Approach)
CREATE TABLE employee_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    team_leader_id UUID REFERENCES employees(id),
    manager_id UUID REFERENCES employees(id),
    hierarchy_level VARCHAR(20) NOT NULL, -- 'MANAGER', 'TEAM_LEADER', 'TC'
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Existing Table Modifications
```sql
-- Add employee tracking to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employee_link_id UUID REFERENCES employee_product_links(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'PARTNER'; -- 'PARTNER', 'EMPLOYEE'

-- Create indexes for employee-related queries
CREATE INDEX IF NOT EXISTS idx_applications_employee_id ON applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_applications_employee_link_id ON applications(employee_link_id);
CREATE INDEX IF NOT EXISTS idx_applications_source_type ON applications(source_type);

-- Employee-related indexes
CREATE INDEX idx_employee_candidates_reference_code ON employee_candidates(reference_code);
CREATE INDEX idx_employee_candidates_mobile ON employee_candidates(mobile_number);
CREATE INDEX idx_employee_candidates_email ON employee_candidates(email_id);
CREATE INDEX idx_employee_candidates_status ON employee_candidates(interview_status);

CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_mobile ON employees(mobile_number);
CREATE INDEX idx_employees_email ON employees(email_id);
CREATE INDEX idx_employees_designation ON employees(designation);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(employee_status);

CREATE INDEX idx_employee_kyc_employee_id ON employee_kyc(employee_id);
CREATE INDEX idx_employee_kyc_status ON employee_kyc(kyc_status);

CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);

CREATE INDEX idx_employee_product_links_employee_id ON employee_product_links(employee_id);
CREATE INDEX idx_employee_product_links_product_id ON employee_product_links(product_id);
CREATE INDEX idx_employee_product_links_status ON employee_product_links(status);

CREATE INDEX idx_employee_incentive_employee_id ON employee_incentive_transactions(employee_id);
CREATE INDEX idx_employee_incentive_application_id ON employee_incentive_transactions(application_id);

CREATE INDEX idx_employee_hierarchy_employee_id ON employee_hierarchy(employee_id);
CREATE INDEX idx_employee_hierarchy_team_leader_id ON employee_hierarchy(team_leader_id);
CREATE INDEX idx_employee_hierarchy_manager_id ON employee_hierarchy(manager_id);
```

### 2. Backend Module Structure

```
backend/src/modules/
├── employee/
│   ├── controller.js           # Employee panel endpoints
│   ├── service.js              # Employee business logic
│   ├── repository.js           # Database operations
│   ├── route.js                # API routes
│   ├── dto.js                  # Data transfer objects
│   ├── middleware.js           # Employee-specific middleware
│   ├── validator.js            # Request validation
│   └── constants.js            # Employee constants
├── hr/
│   ├── controller.js           # HR panel endpoints
│   ├── service.js              # HR business logic
│   ├── repository.js           # HR database operations
│   ├── route.js                # HR API routes
│   ├── dto.js                  # HR data transfer objects
│   └── constants.js            # HR constants
└── employee-management/        # Super Admin employee management
    ├── controller.js           # Employee management endpoints
    ├── service.js              # Employee management business logic
    ├── repository.js           # Employee management database operations
    ├── route.js                # Employee management API routes
    └── constants.js            # Employee management constants
```

### 3. Frontend Module Structure

```
frontend/src/modules/
├── employee/
│   ├── layout/
│   │   └── EmployeeLayout.jsx        # Employee panel layout
│   ├── dashboard/
│   │   ├── EmployeeDashboard.jsx      # Main dashboard
│   │   └── components/
│   │       ├── StatsCard.jsx
│   │       ├── OnboardingProgress.jsx
│   │       └── RecentApplications.jsx
│   ├── profile/
│   │   ├── EmployeeProfile.jsx        # Profile view/edit
│   │   ├── JoiningForm.jsx            # Joining form
│   │   ├── TermsAcceptance.jsx        # Terms & conditions
│   │   ├── KYCSubmission.jsx          # KYC document upload
│   │   ├── KYCStatus.jsx              # KYC status display
│   │   └── DocumentsUpload.jsx        # Document management
│   ├── credit-cards/
│   │   ├── EmployeeCreditCards.jsx    # Credit cards list
│   │   ├── EmployeeCardDetail.jsx     # Card detail with incentive
│   │   ├── AddLead.jsx               # Add lead form
│   │   └── components/
│   │       ├── CardIncentiveCard.jsx
│   │       └── EmployeeReferralLink.jsx
│   ├── applications/
│   │   ├── EmployeeApplications.jsx    # My applications
│   │   └── ApplicationDetail.jsx
│   ├── team/
│   │   ├── MyTeam.jsx                 # Team view (Manager/TL)
│   │   ├── TeamMembers.jsx            # Team members list
│   │   └── TeamApplications.jsx       # Team applications
│   ├── incentives/
│   │   ├── MyIncentives.jsx           # Incentive history
│   │   └── IncentiveDetail.jsx
│   └── store/
│       └── employeeStore.js           # Employee state management
├── hr/
│   ├── layout/
│   │   └── HRLayout.jsx               # HR panel layout
│   ├── dashboard/
│   │   ├── HRDashboard.jsx            # HR dashboard
│   │   └── components/
│   │       ├── CandidateStats.jsx
│   │       └── InterviewCalendar.jsx
│   ├── candidates/
│   │   ├── CandidateList.jsx          # All candidates
│   │   ├── CandidateDetail.jsx        # Candidate 360 view
│   │   ├── InterviewFeedback.jsx      # Interview feedback form
│   │   ├── CandidateSelection.jsx     # Selection form
│   │   └── components/
│   │       ├── CandidateCard.jsx
│   │       ├── StatusBadge.jsx
│   │       └── InterviewRating.jsx
│   ├── employees/
│   │   ├── EmployeeList.jsx           # Employee list
│   │   ├── EmployeeActivation.jsx     # Employee activation
│   │   └── KYCVerification.jsx        # KYC verification
│   └── store/
│       └── hrStore.js                 # HR state management
└── super-admin/employees/
    ├── EmployeeManagement.jsx          # Main employee management
    ├── EmployeeList.jsx               # Employee list with filters
    ├── EmployeeDetail.jsx             # Employee 360 view
    ├── EmployeeHierarchy.jsx          # Hierarchy management
    ├── EmployeeActivation.jsx         # Activation/deactivation
    ├── ProductLinks.jsx               # Product link management
    ├── BulkLinkAssign.jsx             # Bulk link assignment
    ├── KYCManagement.jsx              # KYC management
    ├── KYCVerification.jsx            # Detailed KYC verification
    └── components/
        ├── EmployeeCard.jsx
        ├── HierarchyTree.jsx
        ├── LinkAssignmentForm.jsx
        └── OnboardingTracker.jsx
```

### 4. API Endpoints

#### Public APIs (No Authentication)
```
POST /api/public/careers/register - Interview registration
POST /api/public/careers/verify-mobile - Send mobile OTP
POST /api/public/careers/verify-email - Send email OTP
POST /api/public/careers/verify-otp - Verify OTP
GET /api/public/careers/reference-code/:mobile - Get reference code
GET /api/public/careers/status/:reference_code - Check application status
```

#### HR Panel APIs (HR Admin)
```
GET /api/hr/candidates - List candidates
GET /api/hr/candidates/:id - Get candidate details
PUT /api/hr/candidates/:id/interview-feedback - Submit feedback
PUT /api/hr/candidates/:id/select - Select candidate (generates employee ID)
PUT /api/hr/candidates/:id/reject - Reject candidate
GET /api/hr/candidates/stats - Candidate statistics
GET /api/hr/candidates/export - Export candidates
GET /api/employees/kyc/pending - Get pending KYC verifications
GET /api/employees/kyc/:employee_id - Get employee KYC details
PUT /api/employees/kyc/:employee_id/verify - Verify employee KYC
PUT /api/employees/kyc/:employee_id/reject - Reject employee KYC
```

#### Employee Management APIs (Super Admin)
```
GET /api/employees/ - List employees
GET /api/employees/stats - Employee statistics
GET /api/employees/:id - Get employee 360° view
PUT /api/employees/:id/activate - Activate employee
PUT /api/employees/:id/deactivate - Deactivate employee
GET /api/employees/hierarchy - Get hierarchy tree
POST /api/employees/hierarchy/assign - Assign hierarchy
GET /api/employees/onboarding/:id - Get onboarding progress
GET /api/employees/join-pending - Get joining pending
GET /api/employees/kyc-pending - Get KYC pending
GET /api/employees/kyc/pending - Get pending KYC verifications
GET /api/employees/kyc/:employee_id - Get employee KYC details
PUT /api/employees/kyc/:employee_id/verify - Verify employee KYC
PUT /api/employees/kyc/:employee_id/reject - Reject employee KYC
GET /api/employees/kyc/audit/:employee_id - Get KYC audit trail
```

#### Product Link APIs (Super Admin)
```
GET /api/employees/product-links/ - List all links
POST /api/employees/product-links/ - Create link
PUT /api/employees/product-links/:id - Update link
DELETE /api/employees/product-links/:id - Delete link
GET /api/employees/product-links/employee/:employee_id - Get employee's links
POST /api/employees/product-links/bulk-assign - Bulk assign
```

#### Employee Panel APIs (Employee Auth)
```
GET /api/employee/profile - Get profile
PUT /api/employee/profile - Update profile
GET /api/employee/joining-form - Get joining form
POST /api/employee/joining-form - Submit joining form
GET /api/employee/terms - Get terms
POST /api/employee/terms/accept - Accept terms
GET /api/employee/kyc/status - Get KYC status
POST /api/employee/kyc/submit - Submit KYC
PUT /api/employee/kyc/resubmit - Re-submit KYC
GET /api/employee/kyc/documents - Get KYC document URLs
POST /api/employee/documents/upload - Upload document
GET /api/employee/documents - Get documents
GET /api/employee/onboarding-status - Get onboarding status
GET /api/employee/products - Get products with incentives
GET /api/employee/products/:product_id/link - Get employee-specific link
GET /api/employee/applications - Get applications
GET /api/employee/team - Get team (Manager/TL only)
GET /api/employee/team/applications - Get team applications
GET /api/employee/incentives - Get incentive history (READ-ONLY)
```

#### Auth APIs
```
POST /api/auth/employee/login - Employee login
POST /api/auth/employee/verify-otp - Verify OTP
POST /api/auth/employee/send-otp - Send OTP
```

### 5. Implementation Phases

#### Phase 1: Database Migration (Week 1)
- Create migration script for all new tables
- Add columns to existing tables
- Create indexes
- Test migration idempotency
- Backup existing data

#### Phase 2: Public Career Portal (Week 2)
- Update Careers page with "Why Join Yohesa" section
- Create Interview Registration form
- Implement OTP verification (mobile + email)
- Generate reference codes
- Application status check functionality

#### Phase 3: HR Panel (Week 3-4)
- HR dashboard with candidate statistics
- Candidate list with filters
- Candidate 360° view
- Interview feedback form
- Candidate selection with employee ID generation
- Candidate rejection workflow
- Export functionality

#### Phase 4: Employee Onboarding (Week 5-6)
- Employee login using existing auth system
- Terms & Conditions with video upload
- Joining form (8 sections)
- KYC submission using existing S3 pattern
- Document upload using existing S3 pattern
- Onboarding checklist tracking
- HR verification interface

#### Phase 5: Employee Dashboard (Week 7-8)
- Employee dashboard architecture
- Profile management
- Credit cards view with incentives (not commission)
- Application tracking using existing applications table
- Incentive tracking (read-only)

#### Phase 6: Hierarchy & Teams (Week 9-10)
- Employee hierarchy management (denormalized)
- Team assignment interface
- Team view for Manager/TL
- Team application tracking
- Access control middleware

#### Phase 7: Product Links (Week 11-12)
- Product link management interface
- Employee-specific URL assignment
- Bulk link assignment
- Incentive configuration
- UNIQUE constraint validation
- Link isolation testing

#### Phase 8: Integration & Testing (Week 13-14)
- Integrate with existing application pipeline
- Test employee application attribution
- Test incentive calculation
- Test hierarchy access control
- Test KYC verification workflow
- End-to-end testing

#### Phase 9: Super Admin Enhancements (Week 15-16)
- Employee management enhancements
- 360° employee view
- Advanced filtering
- Employee activation workflow
- Reporting and analytics
- Audit trail review

### 6. Critical Implementation Rules

#### DO NOT BREAK Existing Functionality
1. **Authentication**: Use existing JWT 15-minute token system
2. **Role System**: Use existing user_role ENUM (SUPER_ADMIN, ADMIN, EMPLOYEE, PARTNER)
3. **Applications**: Extend existing applications table, do not create parallel table
4. **Commission**: Keep existing partner commission system separate
5. **S3**: Use existing uploadToS3 and getSignedDownloadUrl functions
6. **Notifications**: Use existing notification service
7. **KYC Pattern**: Follow existing partner KYC structure

#### Employee-Specific Requirements
1. **Designation**: Store as employees.designation, not as role ENUM
2. **HR Roles**: Use existing ADMIN role with department scoping
3. **Product Links**: Employee-specific URLs in employee_product_links table
4. **Incentives**: Separate from partner commission, read-only for employees
5. **Hierarchy**: Denormalized approach using employee_hierarchy table
6. **Access Control**: Manager/TL can view team, TC sees only own data

#### Security Requirements
1. **KYC Data**: Encrypt PAN, Aadhaar, bank details at rest
2. **Document Access**: Use signed URLs with time limits
3. **Audit Logging**: Log all sensitive operations
4. **Input Validation**: Use existing express-validator patterns
5. **Rate Limiting**: Follow existing rate limiting patterns

### 7. Testing Strategy

#### Unit Testing
- Employee service functions
- HR service functions
- Database repository functions
- Validation functions
- Utility functions

#### Integration Testing
- Complete employee lifecycle
- Application attribution
- Incentive calculation
- Hierarchy access control
- KYC verification workflow
- Product link isolation

#### Regression Testing
- Existing partner functionality
- Existing admin functionality
- Existing application pipeline
- Existing commission system
- Authentication system
- S3 upload system

#### Performance Testing
- Hierarchy query performance
- Employee application filtering
- Bulk link assignment
- KYC document upload
- Dashboard loading

### 8. Success Criteria

#### Functional Requirements
- ✅ Complete candidate registration with OTP verification
- ✅ HR interview feedback and selection/rejection workflow
- ✅ Employee ID generation and candidate conversion
- ✅ Complete employee onboarding (terms, KYC, documents, joining form)
- ✅ KYC verification by Super Admin and HR Admin
- ✅ Employee-specific product link assignment and management
- ✅ Employee dashboard with applications and incentives
- ✅ Hierarchy management with proper access control
- ✅ Team visibility for Manager/TL
- ✅ Application tracking with employee attribution
- ✅ Incentive tracking (separate from partner commission)

#### Technical Requirements
- ✅ Integration with existing auth system (15-minute tokens)
- ✅ Use of existing role ENUM system
- ✅ Reuse of applications table with source_type flag
- ✅ Denormalized hierarchy for performance
- ✅ Proper indexing and constraints
- ✅ Secure file upload and document storage
- ✅ Comprehensive audit logging
- ✅ KYC data encryption at rest
- ✅ Time-limited signed URLs for document access

#### Business Requirements
- ✅ Employee-specific referral URLs (no shared links)
- ✅ Incentive tracking (not commission)
- ✅ No self-service withdrawals for employees
- ✅ Complete onboarding verification before activation
- ✅ KYC verification required before activation
- ✅ HR-managed interview and selection process
- ✅ Super Admin and HR can verify employee KYC
- ✅ Clear hierarchy-based access control
- ✅ Data isolation between employees
- ✅ Existing application workflow remains intact

This implementation plan ensures complete integration with the existing GharKaPaisa platform while adding comprehensive employee management functionality.