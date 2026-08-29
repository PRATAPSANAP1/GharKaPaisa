# Employee Management System - Implementation Prompt

## Overview
Implement a complete Employee Management System for the Yohesa platform that handles the full employee lifecycle from candidate registration through active employment, including HR interview workflows, employee onboarding with KYC verification, hierarchy management (Manager → TL → TC), and employee-specific product referral links with incentive tracking.

## Core Requirements

### 1. User Roles & Authentication
- **Existing Role System**: Use the existing Postgres ENUM `user_role` ('SUPER_ADMIN','ADMIN','EMPLOYEE','PARTNER')
- **Employee Role**: New employees get `users.role = 'EMPLOYEE'` (reusing existing enum value)
- **Designation System**: Manager/TL/TC distinction stored as `employees.designation` column, NOT as separate role enum values
- **HR Roles**: HR Admin/HR Operator use `role = 'ADMIN'` scoped by department (no new enum values needed)
- **Candidates**: No users row or role until selected and converted to employee
- **Authentication**: Use existing 15-minute access token + refresh token rotation system (NOT 24-hour flat tokens)
- **Employee Login**: Reference Code + Mobile Number + OTP verification

### 2. Database Schema Changes

#### New Tables Required
1. **employee_candidates** - Interview registration candidates
2. **employees** - Main employee table (after selection)
3. **employee_joining_details** - Detailed joining form information
4. **employee_kyc** - KYC verification details
5. **employee_documents** - Document management
6. **employee_terms_acceptance** - Terms & conditions with video verification
7. **employee_product_links** - Employee-specific product referral links (CRITICAL)
8. **employee_incentive_transactions** - Incentive tracking
9. **employee_onboarding_checklist** - Onboarding progress tracking
10. **employee_hierarchy** - Hierarchy management (denormalized approach)

#### Existing Table Modifications
- **users**: Add `employee_id VARCHAR(20)` (optional, for reference)
- **applications**: Add `employee_id UUID`, `employee_link_id UUID`, `source_type VARCHAR(20) DEFAULT 'PARTNER'`
- **NO roles table changes** - use existing ENUM system

#### Critical Naming Conventions
- `employee_product_links.employee_referral_url` (NOT `partner_url` to avoid collision with `products.partner_url`)
- `employee_product_links.base_apply_url` (NOT `public_url` for clarity)
- UNIQUE constraint on `(employee_id, product_id)` in employee_product_links

### 3. Hierarchy Architecture
- **Use ONLY employee_hierarchy table** (Option B - denormalized approach)
- **DO NOT** maintain `employees.reporting_manager_id` as separate source of truth
- **Structure**: One row per TC with both `team_leader_id` and `manager_id` stored
- **Benefit**: Single flat filter for two-level rollup, no recursive queries needed
- **Access Control**: Manager/TL can view team applications, TC sees only own applications

### 4. Key Workflows

#### Candidate Registration Flow
1. Public Career Portal → Interview Registration Form
2. OTP verification (mobile + email)
3. Reference code generation (e.g., CAND00001)
4. Status tracking via reference code

#### HR Interview Flow
1. HR views pending candidates
2. Conducts interview and submits feedback
3. If SELECTED: Enter offer details → Generate Employee ID (e.g., EMP00025) → Convert to employee
4. If REJECTED: Enter rejection reason → Update status

#### Employee Onboarding Flow
1. Employee login (Reference Code + Mobile + OTP)
2. Complete Terms & Conditions (with video verification)
3. Submit Joining Form (8 sections: Personal, Job, Education, Salary, Recruitment, Bank, Documents, Declaration)
4. Submit KYC documents (PAN, Aadhaar, Bank proof) → Goes to Super Admin/HR for verification
5. Upload required documents (Photo, Aadhaar, PAN, Education, Bank proof, Resume, Experience letter)
6. HR/Super Admin review and verify KYC (can reject with reasons for re-submission)
7. Super Admin assigns employee-specific product links
8. Super Admin activates employee (KYC must be verified before activation)
9. Employee gains full dashboard access

#### Employee Application Flow
1. Active employee views products with employee-specific incentives (NOT commission)
2. Gets employee-specific referral URL (e.g., https://example.com/apply?ref=EMP00025)
3. Shares URL with customer
4. Customer applies through URL
5. Application created with `employee_id` and `source_type = 'EMPLOYEE'`
6. Application visible to employee + Manager/TL based on hierarchy
7. Incentive calculated and tracked

### 5. Product Link Management (CRITICAL)
- **Each employee gets unique URL per product**
- **URL format**: `https://example.com/apply?ref={employee_id}`
- **Data isolation**: Changing one employee's link must NOT affect others
- **Assignment**: Super Admin assigns links per employee per product
- **Incentive**: Set per employee per product (fixed or percentage)
- **Validation**: UNIQUE constraint on `(employee_id, product_id)` prevents duplicate assignments

### 6. KYC Management System (CRITICAL - Super Admin & HR Verification)
- **KYC Creation**: Employees submit KYC details through Employee Panel after selection
- **KYC Verification**: Verified by Super Admin and HR Admin (both roles can verify)
- **KYC Components**: PAN card, Aadhaar card, Bank account details
- **Document Upload**: Each KYC component requires document proof upload
- **Verification Status**: PENDING → SUBMITTED → UNDER_REVIEW → VERIFIED/REJECTED
- **Audit Trail**: Complete tracking of who verified what and when
- **Access Control**: Only Super Admin and HR Admin can view full KYC details and verify
- **Security**: PAN, Aadhaar, bank details encrypted at rest; partial masking in UI

#### KYC Data Structure
**employee_kyc Table Fields**:
- `employee_id` (UUID FK → employees.id) - UNIQUE
- `pan_number` (VARCHAR) - UNIQUE, encrypted at rest
- `pan_document_url` (TEXT) - S3 location
- `pan_verified` (BOOLEAN) - Verification status
- `pan_verified_date` (TIMESTAMP) - When verified
- `pan_rejection_reason` (TEXT) - If rejected
- `aadhaar_number` (VARCHAR) - UNIQUE, encrypted at rest
- `aadhaar_document_url` (TEXT) - S3 location
- `aadhaar_verified` (BOOLEAN) - Verification status
- `aadhaar_verified_date` (TIMESTAMP) - When verified
- `aadhaar_rejection_reason` (TEXT) - If rejected
- `bank_account_number` (VARCHAR) - Encrypted at rest
- `bank_account_holder_name` (VARCHAR) - Encrypted at rest
- `ifsc_code` (VARCHAR) - Encrypted at rest
- `bank_document_url` (TEXT) - S3 location (cancelled cheque/passbook)
- `bank_verified` (BOOLEAN) - Verification status
- `bank_verified_date` (TIMESTAMP) - When verified
- `bank_rejection_reason` (TEXT) - If rejected
- `kyc_status` (VARCHAR) - Overall status: PENDING/SUBMITTED/UNDER_REVIEW/VERIFIED/REJECTED
- `submitted_at` (TIMESTAMP) - When employee submitted
- `reviewed_by` (UUID FK → users.id) - Who verified (Super Admin or HR)
- `reviewed_at` (TIMESTAMP) - When verification completed
- `review_notes` (TEXT) - Verification comments

#### KYC Submission Workflow (Employee Side)
1. **Access**: Employee logs in → Dashboard → Shows "KYC Pending" status
2. **Navigation**: Employee goes to Profile → KYC Submission
3. **PAN Card Section**:
   - Enter PAN number (format validation: ABCDE1234F)
   - Upload PAN card document (PDF/JPG, max 2MB)
   - Preview uploaded document
   - Document is stored in S3 with signed URL
4. **Aadhaar Card Section**:
   - Enter Aadhaar number (12 digits, format validation)
   - Upload Aadhaar card front and back (PDF/JPG, max 2MB each)
   - Preview uploaded documents
   - Documents stored in S3 with signed URLs
5. **Bank Details Section**:
   - Enter bank account holder name
   - Enter bank account number
   - Enter IFSC code (format validation: 11 characters)
   - Upload bank proof (cancelled cheque/passbook, PDF/JPG, max 2MB)
   - Preview uploaded document
6. **Submission**:
   - Review all entered information
   - Accept declaration: "I confirm that all provided KYC details are accurate and authentic"
   - Submit KYC
   - System updates `kyc_status = 'SUBMITTED'`
   - System updates onboarding checklist: `kyc_submitted = true`
   - System sends notification to HR/Super Admin for review
7. **Post-Submission**:
   - Employee can view submitted KYC status
   - Employee can re-submit if rejected (with corrections)
   - Employee cannot edit while UNDER_REVIEW or VERIFIED

#### KYC Verification Workflow (Super Admin/HR Side)
1. **Access**: Super Admin or HR Admin logs in → Employee Management → KYC Pending tab
2. **KYC Queue**: Shows list of employees with `kyc_status = 'SUBMITTED'` or `'UNDER_REVIEW'`
3. **Queue Display**:
   - Employee ID and name
   - Submitted date
   - Current KYC status
   - Components pending verification
   - Action button: "Verify KYC"
4. **Verification Interface**:
   - Employee basic information (ID, name, designation, department)
   - PAN Card Section:
     - View PAN number (partially masked: ABCDE****F)
     - View uploaded PAN document (secure S3 signed URL)
     - Verify/Reject options
     - If reject: Enter rejection reason (dropdown + custom text)
     - Verify button: Updates `pan_verified = true`, `pan_verified_date = NOW()`
   - Aadhaar Card Section:
     - View Aadhaar number (partially masked: ****56****78)
     - View uploaded Aadhaar documents (secure S3 signed URLs)
     - Verify/Reject options
     - If reject: Enter rejection reason
     - Verify button: Updates `aadhaar_verified = true`, `aadhaar_verified_date = NOW()`
   - Bank Details Section:
     - View bank details (partially masked for security)
     - View uploaded bank proof (secure S3 signed URL)
     - Verify/Reject options
     - If reject: Enter rejection reason
     - Verify button: Updates `bank_verified = true`, `bank_verified_date = NOW()`
5. **Overall KYC Decision**:
   - **Approve All**: If all three components verified → `kyc_status = 'VERIFIED'`
   - **Partial Rejection**: If any component rejected → `kyc_status = 'REJECTED'`
   - **Rejection Reason**: Combined reasons from all rejected components
   - **Review Notes**: Additional comments from verifier
   - **Audit Trail**: `reviewed_by = current_user_id`, `reviewed_at = NOW()`
6. **Post-Verification**:
   - System updates onboarding checklist: `kyc_verified = true` (if all verified)
   - System sends notification to employee about verification result
   - If rejected: Employee can re-submit with corrections
   - If verified: Employee can proceed to next onboarding steps
7. **Re-Verification**:
   - If employee re-submits after rejection, KYC goes back to `SUBMITTED`
   - Previous verification history is preserved in audit trail
   - Verifier can see previous rejection reasons

#### KYC Security & Privacy
- **Data Encryption**: PAN, Aadhaar, bank details encrypted at rest using AES-256
- **Partial Masking**: Sensitive data partially masked in UI (****56****78)
- **Document Security**: KYC documents stored in separate S3 bucket with restricted access
- **Signed URLs**: Document access via time-limited signed URLs (15-minute expiry)
- **Access Control**: Only Super Admin and HR Admin can view full KYC details
- **Audit Logging**: Every KYC view, verification, rejection logged with user ID and timestamp
- **Data Retention**: KYC data retained as per legal requirements, document archival policy
- **Compliance**: Follows RBI KYC guidelines and data protection regulations

#### KYC Access Control & Permissions
- **Super Admin**: Full KYC access - can view, verify, reject any employee KYC
- **HR Admin**: Full KYC access - can view, verify, reject any employee KYC 
- **HR Operator**: Read-only KYC access - can view but not verify (configurable based on business needs)
- **Employee**: Can only view own KYC status and submitted data (partially masked)
- **Verification Permission**: Both Super Admin and HR Admin have equal KYC verification rights
- **Department Scoping**: HR can be scoped to specific departments for KYC verification (optional)
- **Audit Requirement**: All KYC verification actions must include verifier ID and timestamp

#### KYC-Related APIs

**Employee Panel APIs**:
- `GET /api/employee/kyc/status` - Get current KYC submission status
- `POST /api/employee/kyc/submit` - Submit KYC details and documents
  - Request body: `{ pan_number, pan_document, aadhaar_number, aadhaar_document_front, aadhaar_document_back, bank_account_holder_name, bank_account_number, ifsc_code, bank_document }`
  - Response: KYC submission confirmation with status
- `PUT /api/employee/kyc/resubmit` - Re-submit KYC after rejection
  - Request body: Same as submit, includes corrections
  - Response: Updated KYC status
- `GET /api/employee/kyc/documents` - Get own KYC document URLs (signed, time-limited)

**Super Admin/HR APIs**:
- `GET /api/employees/kyc/pending` - Get list of pending KYC verifications
  - Query params: `?status=SUBMITTED&department=Sales&limit=20`
  - Response: Paginated list of employees with submitted KYC
- `GET /api/employees/kyc/:employee_id` - Get complete KYC details for an employee
  - Response: Full KYC data with document URLs (admin access)
- `PUT /api/employees/kyc/:employee_id/verify` - Verify employee KYC
  - Request body: `{ pan_verified, aadhaar_verified, bank_verified, review_notes }`
  - Response: Updated KYC status with verification details
- `PUT /api/employees/kyc/:employee_id/reject` - Reject employee KYC
  - Request body: `{ rejection_reason, component_rejections: { pan: reason, aadhaar: reason, bank: reason } }`
  - Response: Rejection confirmation with reasons
- `GET /api/employees/kyc/audit/:employee_id` - Get KYC verification audit trail
  - Response: Complete history of KYC submissions and verifications

#### KYC UI Components

**Employee Panel**:
- `profile/KYCSubmission.jsx` - Main KYC submission form
  - PAN card input and upload
  - Aadhaar card input and upload (front/back)
  - Bank details input and upload
  - Document preview components
  - Validation and error handling
  - Submit/re-submit functionality
- `profile/KYCStatus.jsx` - KYC status display
  - Current status badge
  - Submission history
  - Rejection reasons (if any)
  - Next steps guidance

**Super Admin/HR Panel**:
- `employees/KYCVerification.jsx` - KYC verification interface
  - Pending KYC queue
  - Employee selection
  - Document viewer (secure)
  - Verify/reject forms
  - Bulk verification actions
- `employees/KYCAuditTrail.jsx` - KYC audit history
  - Complete verification timeline
  - Who verified what and when
  - Rejection history
  - Status changes

#### KYC Integration Points
- **Onboarding Checklist**: KYC submission and verification tracked in `employee_onboarding_checklist`
- **Employee Activation**: KYC must be VERIFIED before employee can be activated
- **Document Management**: KYC documents also stored in `employee_documents` table for tracking
- **Notifications**: KYC submission triggers notification to HR/Super Admin
- **Terms Acceptance**: KYC verification happens after terms acceptance in onboarding flow
- **Joining Form**: Bank details from joining form should match KYC bank details (validation)

#### KYC Validation Rules
- **PAN Format**: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
- **Aadhaar Format**: Exactly 12 digits
- **IFSC Format**: 11 characters (4 letters + 0 + 6 alphanumeric)
- **Bank Account**: 9-18 digits
- **Document Types**: PDF, JPG, PNG only
- **Document Size**: Max 2MB per document
- **Name Matching**: Name on PAN should match name on Aadhaar (soft validation)
- **Bank Account Matching**: Bank account number should match bank proof (soft validation)

#### KYC Error Handling
- **Duplicate PAN**: If PAN already exists in system, reject with appropriate message
- **Duplicate Aadhaar**: If Aadhaar already exists, reject with appropriate message
- **Document Upload Failure**: Handle S3 upload errors gracefully
- **Verification Conflicts**: Handle case where two admins try to verify simultaneously
- **Status Inconsistencies**: Ensure KYC status matches individual component verification status
- **Re-submission Limits**: Limit re-submission attempts to prevent abuse (e.g., max 3 re-submissions)

#### KYC Reporting
- **KYC Completion Rate**: Percentage of employees with verified KYC
- **KYC Pending Time**: Average time from submission to verification
- **Rejection Rate**: Percentage of KYC submissions rejected
- **Component Breakdown**: Verification rates by component (PAN, Aadhaar, Bank)
- **Verifier Performance**: KYC verification count by verifier
- **Re-submission Analysis**: Most common rejection reasons

### 6. Panel Structure

#### Public Career Portal
- Careers page with 12 company benefits
- Interview registration form (Personal, Education, Experience, Resume, Source)
- OTP verification system
- Reference code generation
- Application status check

#### HR Panel
- Dashboard with candidate statistics
- Candidate list with filters (status, date range, experience, etc.)
- Candidate 360° view
- Interview feedback form with ratings
- Candidate selection with offer details
- Employee list (HR view)
- KYC verification interface (HR can verify employee KYC)
- KYC pending queue with verification actions

#### Super Admin Panel
- Employee Management with tabs:
  - All Employees
  - Interview Candidates
  - Joining Pending
  - KYC Pending (Super Admin can verify)
  - Active Employees
  - Inactive Employees
  - Employee Team (hierarchy management)
  - Employee Product Links
- Employee 360° view (complete profile, KYC, documents, terms, onboarding, links, applications, incentives)
- Hierarchy tree management
- Product link assignment (individual and bulk)
- Employee activation workflow (requires verified KYC)
- KYC verification interface (Super Admin can verify employee KYC)
- KYC audit trail and verification history

#### Employee Panel
- Dashboard (stats, onboarding progress, quick actions, recent applications)
- Profile management
- Joining form completion
- Terms & Conditions acceptance
- KYC document submission
- Document upload/management
- Credit Cards (with employee incentives, NOT commission)
- Add Lead (with employee-specific referral URL)
- Applications tracking
- My Team (Manager/TL only)
- Incentive history (read-only - NO self-service withdrawal)

### 7. Security & Validation

#### Authentication
- Use existing JWT 15-minute access + refresh token system
- Employee login: Reference Code + Mobile + OTP
- Role-based middleware: `authorize('EMPLOYEE')`, `authorize('ADMIN')`, etc.
- Team access middleware for Manager/TL only
- KYC verification middleware: `authorize('ADMIN')` for both Super Admin and HR Admin
- KYC view middleware: `authorize('ADMIN')` for full access, `authorize('EMPLOYEE')` for own data only

#### Data Validation
- Express-validator for all form inputs
- File upload validation (type, size, virus scanning)
- Email, mobile, PAN, Aadhaar format validation
- Database constraints (UNIQUE, FOREIGN KEY, CHECK)

#### Data Privacy
- Encrypt PAN, Aadhaar, bank details at rest
- Partially mask mobile numbers in UI
- Role-based document access
- Audit logging for sensitive operations

#### Rate Limiting
- OTP endpoint: 5 requests per hour
- Registration: 3 requests per day (consider increasing for user experience)
- Login: 10 requests per hour
- Data export: 1 request per hour

### 8. API Structure

#### Public APIs (No Auth)
- `POST /api/public/careers/register` - Interview registration
- `POST /api/public/careers/verify-mobile` - Send mobile OTP
- `POST /api/public/careers/verify-email` - Send email OTP
- `POST /api/public/careers/verify-otp` - Verify OTP
- `GET /api/public/careers/reference-code/:mobile` - Get reference code
- `GET /api/public/careers/status/:reference_code` - Check status

#### HR APIs (HR Admin/Operator)
- `GET /api/hr/candidates` - List candidates
- `GET /api/hr/candidates/:id` - Get candidate details
- `PUT /api/hr/candidates/:id/interview-feedback` - Submit feedback
- `PUT /api/hr/candidates/:id/select` - Select candidate (generates employee ID)
- `PUT /api/hr/candidates/:id/reject` - Reject candidate
- `GET /api/hr/candidates/stats` - Candidate statistics
- `GET /api/hr/candidates/export` - Export candidates
- `GET /api/employees/kyc/pending` - Get pending KYC verifications (HR can verify)
- `GET /api/employees/kyc/:employee_id` - Get employee KYC details for verification
- `PUT /api/employees/kyc/:employee_id/verify` - Verify employee KYC (HR role permitted)
- `PUT /api/employees/kyc/:employee_id/reject` - Reject employee KYC with reasons

#### Employee Management APIs (Super Admin/HR Admin)
- `GET /api/employees/` - List employees
- `GET /api/employees/stats` - Employee statistics
- `GET /api/employees/:id` - Get employee 360° view
- `PUT /api/employees/:id/activate` - Activate employee (requires verified KYC)
- `PUT /api/employees/:id/deactivate` - Deactivate employee
- `GET /api/employees/hierarchy` - Get hierarchy tree
- `POST /api/employees/hierarchy/assign` - Assign hierarchy
- `GET /api/employees/onboarding/:id` - Get onboarding progress
- `GET /api/employees/join-pending` - Get joining pending
- `GET /api/employees/kyc-pending` - Get KYC pending
- `GET /api/employees/kyc/pending` - Get pending KYC verifications (detailed)
- `GET /api/employees/kyc/:employee_id` - Get employee KYC details
- `PUT /api/employees/kyc/:employee_id/verify` - Verify employee KYC (Super Admin & HR)
- `PUT /api/employees/kyc/:employee_id/reject` - Reject employee KYC with reasons
- `GET /api/employees/kyc/audit/:employee_id` - Get KYC verification audit trail

#### Product Link APIs (Super Admin)
- `GET /api/employees/product-links/` - List all links
- `POST /api/employees/product-links/` - Create link
- `PUT /api/employees/product-links/:id` - Update link
- `DELETE /api/employees/product-links/:id` - Delete link
- `GET /api/employees/product-links/employee/:employee_id` - Get employee's links
- `POST /api/employees/product-links/bulk-assign` - Bulk assign

#### Employee Panel APIs (Employee Auth)
- `GET /api/employee/profile` - Get profile
- `PUT /api/employee/profile` - Update profile
- `GET /api/employee/joining-form` - Get joining form
- `POST /api/employee/joining-form` - Submit joining form
- `GET /api/employee/terms` - Get terms
- `POST /api/employee/terms/accept` - Accept terms
- `GET /api/employee/kyc/status` - Get current KYC submission status
- `POST /api/employee/kyc/submit` - Submit KYC details and documents
- `PUT /api/employee/kyc/resubmit` - Re-submit KYC after rejection
- `GET /api/employee/kyc/documents` - Get own KYC document URLs (signed, time-limited)
- `POST /api/employee/documents/upload` - Upload document
- `GET /api/employee/documents` - Get documents
- `GET /api/employee/onboarding-status` - Get onboarding status
- `GET /api/employee/products` - Get products with incentives
- `GET /api/employee/products/:product_id/link` - Get employee-specific link
- `GET /api/employee/applications` - Get applications
- `GET /api/employee/team` - Get team (Manager/TL only)
- `GET /api/employee/team/applications` - Get team applications
- `GET /api/employee/incentives` - Get incentive history (READ-ONLY)

#### Auth APIs
- `POST /api/auth/employee/login` - Employee login
- `POST /api/auth/employee/verify-otp` - Verify OTP
- `POST /api/auth/employee/send-otp` - Send OTP

### 9. Frontend Module Structure

#### Employee Panel
- `layout/EmployeeLayout.jsx` - Employee panel layout
- `dashboard/EmployeeDashboard.jsx` - Main dashboard
- `profile/` - Profile, JoiningForm, KYCSubmission, KYCStatus, TermsAcceptance, DocumentsUpload
- `kyc/` - KYCSubmission, KYCStatus, DocumentPreview
- `credit-cards/` - EmployeeCreditCards, EmployeeCardDetail, AddLead
- `applications/` - EmployeeApplications, ApplicationDetail
- `team/` - MyTeam, TeamMembers, TeamApplications (Manager/TL only)
- `incentives/` - MyIncentives, IncentiveDetail (read-only)
- `store/employeeStore.js` - State management

#### HR Panel
- `layout/HRLayout.jsx` - HR panel layout
- `dashboard/HRDashboard.jsx` - HR dashboard
- `candidates/` - CandidateList, CandidateDetail, InterviewFeedback, CandidateSelection
- `employees/` - EmployeeList, EmployeeActivation, KYCVerification
- `kyc/` - KYCPendingQueue, KYCVerification, KYCAuditTrail
- `store/hrStore.js` - State management

#### Super Admin Panel
- `employees/EmployeeManagement.jsx` - Main employee management
- `employees/EmployeeDetail.jsx` - Employee 360° view
- `employees/EmployeeHierarchy.jsx` - Hierarchy management
- `employees/ProductLinks.jsx` - Product link management
- `employees/BulkLinkAssign.jsx` - Bulk assignment
- `employees/KYCManagement.jsx` - KYC verification and audit trail
- `employees/KYCVerification.jsx` - Detailed KYC verification interface
- `dashboard/SuperAdminDashboard.jsx` - Updated with employee stats

#### Public Pages
- `home/Careers.jsx` - Updated career page
- `home/InterviewRegistration.jsx` - Interview registration form
- `home/ApplicationStatus.jsx` - Status check

### 10. Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- Database schema creation (all 10 new tables)
- Basic CRUD operations for candidates
- Interview registration form
- OTP verification system
- Reference code generation

#### Phase 2: HR Panel (Week 3-4)
- HR dashboard
- Candidate list and filters
- Interview feedback system
- Candidate selection/rejection
- Employee ID generation
- Candidate to employee conversion

#### Phase 3: Employee Onboarding (Week 5-6)
- Employee login system (using existing auth pattern)
- Terms and conditions with video upload
- Joining form (8 sections)
- KYC submission (PAN, Aadhaar, Bank details with document uploads)
- Document upload (Photo, Aadhaar, PAN, Education, Bank proof, Resume, Experience letter)
- Onboarding checklist with KYC tracking
- KYC verification system (Super Admin & HR can verify)
- HR verification system for other components

#### Phase 4: Employee Dashboard (Week 7-8)
- Employee dashboard
- Profile management
- Credit cards view (with incentives, not commission)
- Application tracking
- Incentive tracking (read-only)

#### Phase 5: Hierarchy & Teams (Week 9-10)
- Employee hierarchy management (denormalized approach)
- Team assignment
- Team view for Manager/TL
- Team application tracking
- Access control middleware

#### Phase 6: Product Links (Week 11-12)
- Product link management
- Employee-specific URLs
- Bulk link assignment
- Incentive configuration
- UNIQUE constraint validation

#### Phase 7: Super Admin Enhancements (Week 13-14)
- Employee management enhancements
- 360° employee view
- Advanced filtering
- Employee activation workflow
- Reporting and analytics

#### Phase 8: Testing & Deployment (Week 15-16)
- Integration testing
- User acceptance testing
- Performance testing
- Security testing
- Deployment
- Documentation

### 11. Critical Design Decisions

#### Deliberate Architecture Choices
1. **No Employee Self-Service Withdrawals**: Employees are salaried staff, not partners with wallet machinery. Incentive tracking is read-only (`GET /api/employee/incentives` only, no withdrawal endpoint).

2. **Reuse Existing Applications Table**: Use `source_type` flag ('PARTNER'/'EMPLOYEE') instead of parallel table - leaner and consistent with existing architecture.

3. **Denormalized Hierarchy**: Use `employee_hierarchy` table only (no `reporting_manager_id` in employees) for clean two-level rollup without recursive queries.

4. **Existing Auth Pattern**: Use 15-minute access + refresh token system, not 24-hour flat tokens, for security and consistency.

5. **ENUM-Based Roles**: Use existing `user_role` ENUM, not lookup table. Manager/TL/TC as designation column, HR as ADMIN scoped by department.

6. **Employee-Specific URLs**: Each employee gets unique referral URLs per product with UNIQUE constraint to prevent data conflicts.

### 12. Validation Requirements

#### Before Implementation
- Confirm UNIQUE constraints on mobile/email allow re-registration if needed
- Verify rate limiting (3 requests/day for registration) aligns with user experience
- Ensure file upload size limits match business requirements
- Validate incentive calculation logic with finance team

#### During Implementation
- Test employee-specific URL isolation (changing one doesn't affect others)
- Verify hierarchy access control (Manager/TL team visibility)
- Test onboarding checklist progress tracking
- Validate KYC verification workflow
- Test incentive calculation and tracking

#### Post-Implementation
- Performance test hierarchy queries
- Security test employee access controls
- Load test document upload system
- User acceptance testing with HR team
- End-to-end testing of complete employee lifecycle

### 13. Success Criteria

#### Functional Requirements
- ✅ Complete candidate registration with OTP verification
- ✅ HR interview feedback and selection/rejection workflow
- ✅ Employee ID generation and candidate conversion
- ✅ Complete employee onboarding (terms, KYC, documents, joining form)
- ✅ KYC submission by employees (PAN, Aadhaar, Bank details with documents)
- ✅ KYC verification by Super Admin and HR Admin (both roles can verify)
- ✅ KYC rejection with reasons and re-submission workflow
- ✅ KYC audit trail and verification history
- ✅ Employee-specific product link assignment and management
- ✅ Employee dashboard with applications and incentives
- ✅ Hierarchy management with proper access control
- ✅ Team visibility for Manager/TL
- ✅ Application tracking with employee attribution

#### Technical Requirements
- ✅ Integration with existing auth system (15-minute tokens)
- ✅ Use of existing role ENUM system
- ✅ Reuse of applications table with source_type flag
- ✅ Denormalized hierarchy for performance
- ✅ Proper indexing and constraints
- ✅ Secure file upload and document storage
- ✅ Comprehensive audit logging
- ✅ KYC data encryption at rest (PAN, Aadhaar, bank details)
- ✅ Time-limited signed URLs for KYC document access
- ✅ KYC verification access control (Super Admin & HR only)

#### Business Requirements
- ✅ Employee-specific referral URLs (no shared links)
- ✅ Incentive tracking (not commission)
- ✅ No self-service withdrawals for employees
- ✅ Complete onboarding verification before activation
- ✅ KYC verification required before employee activation
- ✅ HR-managed interview and selection process
- ✅ Super Admin and HR can verify employee KYC
- ✅ KYC rejection with clear reasons and re-submission process
- ✅ Super Admin control over employee management
- ✅ Clear hierarchy-based access control
- ✅ KYC data privacy and compliance with regulations

## Implementation Notes

### Database Migration Priority
1. Create new tables in dependency order
2. Add columns to existing tables (users, applications)
3. Create indexes for performance
4. Add constraints for data integrity
5. NO changes to roles table (use existing ENUM)

### Backend Module Priority
1. Employee module (candidates, employees, onboarding)
2. HR module (interview workflow)
3. Product links module (critical for employee operations)
4. Employee panel APIs (dashboard, applications)
5. Hierarchy and team management

### Frontend Module Priority
1. Public career portal (registration)
2. HR panel (candidate management)
3. Employee onboarding pages
4. Employee dashboard
5. Super Admin employee management
6. Product link management UI

### Testing Priority
1. Candidate registration and OTP flow
2. HR interview and selection workflow
3. Employee onboarding process
4. KYC submission and verification workflow (Super Admin & HR)
5. KYC rejection and re-submission process
6. KYC data encryption and security
7. Product link assignment and isolation
8. Hierarchy access control
9. Application tracking with employee attribution
10. Incentive calculation

### Key Integration Points
- **Auth System**: Use existing JWT 15-minute token pattern
- **Applications Table**: Reuse with source_type flag
- **Products Table**: Reference for product link assignment
- **Users Table**: Add employee_id, use existing role ENUM
- **File Storage**: Use existing S3 configuration
- **Notification System**: Use existing notification infrastructure

### Risk Mitigation
- **Data Isolation**: Test employee-specific URL changes don't affect others
- **Access Control**: Comprehensive testing of hierarchy-based permissions
- **Performance**: Index critical columns, test hierarchy queries
- **Security**: Audit logging, encryption of sensitive data, rate limiting
- **Scalability**: Design for volume of employees and applications

This implementation prompt provides a complete blueprint for building the Employee Management System while maintaining consistency with the existing Yohesa platform architecture and addressing all identified architectural decisions and constraints.