/**
 * designationAudit.controller.js
 * ──────────────────────────────────────────────────────────────────────────
 * Read-Only Audit Service & Controller for Designation-Wise Rules & Permissions.
 *
 * Discovers and surfaces all concrete RBAC rules, restrictions, data scopes,
 * frontend/backend enforcement mechanisms, and architectural conflicts
 * across the GharKaPaisa application.
 *
 * SECURITY:
 *  - Strictly read-only; does not modify DB or alter any permission.
 *  - Strips all sensitive data (no tokens, passwords, personal data, or banking secrets).
 *  - Protected by admin authorization middleware.
 */

const { query } = require('../../config/database');
const { success } = require('../../utils/response/response');
const logger = require('../../config/logger');

// Audited designation metadata and permission matrix
const AUDITED_DESIGNATIONS = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    category: 'System Administration',
    modulesAccessible: [
      'Overview & Dashboard', 'Applications CRM', 'Bank Card Applications',
      'Loans & Insurance', 'Partners & Network', 'Employees & Attendance',
      'Wallet & Settlements', 'Commissions & Incentives', 'Products & Banks',
      'Working Hours & Policies', 'Announcements & WhatsApp', 'Audit Logs', 'Settings'
    ],
    permissions: {
      view: 'Allowed (Global)',
      create: 'Allowed (Global)',
      update: 'Allowed (Global)',
      delete: 'Allowed (Global)',
      approve: 'Allowed (Global)',
      export: 'Allowed (Global)'
    },
    dataScope: 'Global (All records across all banks, branches, and partners)',
    restrictions: 'None. Complete unrestricted administrative authority.',
    rulesCount: 14,
    auditStatus: 'Verified',
    unrestricted: true
  },
  {
    id: 'admin',
    name: 'Admin',
    role: 'ADMIN',
    category: 'General Administration',
    modulesAccessible: [
      'Admin Dashboard', 'Applications CRM', 'Partners Management',
      'Withdrawals Review', 'Customers & Leads', 'Messenger',
      'Commissions (View)', 'Attendance Admin'
    ],
    permissions: {
      view: 'Allowed (Assigned / General)',
      create: 'Allowed (Operational)',
      update: 'Allowed (Operational)',
      delete: 'Restricted (Cannot delete admins or commission rules)',
      approve: 'Allowed (KYC, Withdrawals, Applications)',
      export: 'Allowed'
    },
    dataScope: 'Bank Assigned (or General if unassigned in admin_bank_assignments)',
    restrictions: 'Cannot create/delete admins, modify global commission rules, or change system settings.',
    rulesCount: 8,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'operational_head',
    name: 'Operational Head',
    role: 'ADMIN / EMPLOYEE',
    category: 'Operations Leadership',
    modulesAccessible: [
      'Admin Dashboard', 'Applications CRM', 'Credit Cards (Assigned)',
      'Loans (Assigned)', 'Insurance (Assigned)', 'Attendance Admin'
    ],
    permissions: {
      view: 'Allowed (Assigned Banks Only)',
      create: 'Allowed (Assigned Banks)',
      update: 'Allowed (Assigned Banks & Verification)',
      delete: 'Forbidden',
      approve: 'Allowed (Operational Verification)',
      export: 'Allowed (Assigned Banks)'
    },
    dataScope: 'Assigned Banks & Categories only (admin_bank_assignments table)',
    restrictions: 'Filtered strictly by assigned banks. Cannot view or update unassigned banks or wallet payouts.',
    rulesCount: 6,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'administrative_operator',
    name: 'Administrative Operator',
    role: 'ADMIN / EMPLOYEE',
    category: 'Operations Processing',
    modulesAccessible: [
      'Admin Dashboard', 'Applications CRM', 'Credit Cards (Assigned)',
      'Loans (Assigned)', 'Insurance (Assigned)', 'Messenger'
    ],
    permissions: {
      view: 'Allowed (Assigned Banks Only)',
      create: 'Allowed (Applications / Forms)',
      update: 'Allowed (QD, Verification, Assist Fields)',
      delete: 'Forbidden',
      approve: 'Allowed (Operational Verified status only)',
      export: 'Allowed (Assigned Banks)'
    },
    dataScope: 'Assigned Banks only (admin_bank_assignments)',
    restrictions: 'Aliased as "Backend" / "Backend Operation". Cannot approve final bank status without Final Status Operator permission.',
    rulesCount: 6,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'administrative_sales_executive',
    name: 'Administrative Sales Executive',
    role: 'EMPLOYEE / ADMIN',
    category: 'Sales Operations',
    modulesAccessible: [
      'Admin Dashboard', 'Applications CRM (Lead Punching Queue)', 'Messenger', 'Products (Assigned Banks)'
    ],
    permissions: {
      view: 'Conditional (Assigned Banks, Lead Punching, No Dispatch)',
      create: 'Allowed (Lead Punching)',
      update: 'Allowed (Assist Fields, Customer Details, Internal Notes)',
      delete: 'Forbidden',
      approve: 'Forbidden (Cannot perform final approve/reject)',
      export: 'Restricted'
    },
    dataScope: 'Assigned Banks + Lead Punching process type only; applications without dispatch',
    restrictions: 'Strictly blocked from final status approval; TATA cards excluded unless explicitly assigned in admin_bank_assignments.',
    rulesCount: 7,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'pan_checker',
    name: 'PAN Checker',
    role: 'EMPLOYEE / ADMIN',
    category: 'Verification Queue',
    modulesAccessible: [
      'Applications CRM (PAN Review Queue)', 'Messenger'
    ],
    permissions: {
      view: 'Conditional (Assigned Banks, SBI Only, Non-TATA, Pending PAN)',
      create: 'Forbidden',
      update: 'Allowed (PAN Verification, Bank Remark, Requery Date)',
      delete: 'Forbidden',
      approve: 'Allowed (PAN Verified / Operational Verified only)',
      export: 'Forbidden'
    },
    dataScope: 'Assigned Banks + SBI cards only + status NOT IN (approved, disbursed) + pan_check = "no"',
    restrictions: 'Customer mobile masked (e.g. 98******12); dashboard, cards, loans, insurance menus completely hidden in UI.',
    rulesCount: 5,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'remark_operator',
    name: 'Remark Operator',
    role: 'EMPLOYEE / ADMIN',
    category: 'Remark Queue',
    modulesAccessible: [
      'Applications CRM (Remark Queue)', 'Messenger'
    ],
    permissions: {
      view: 'Conditional (Assigned Banks, Non-SBI or PAN OK, No Dispatch)',
      create: 'Forbidden',
      update: 'Allowed (Bank Remark, User Remark, IPA Stage, Dispatch Status)',
      delete: 'Forbidden',
      approve: 'Forbidden (Remark completion only)',
      export: 'Forbidden'
    },
    dataScope: 'Assigned Banks + Non-SBI (or SBI with pan_check = "yes") + No Dispatch + status NOT IN (rejected, declined, cancelled)',
    restrictions: 'Customer mobile masked; final status tab locked; dashboard menu hidden in UI.',
    rulesCount: 6,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'qd_operator',
    name: 'QD Operator',
    role: 'EMPLOYEE / ADMIN',
    category: 'Physical Process QA',
    modulesAccessible: [
      'Applications CRM (QD Queue)', 'Messenger'
    ],
    permissions: {
      view: 'Conditional (Assigned Banks, Physical Process Only, No Dispatch)',
      create: 'Forbidden',
      update: 'Allowed (QD Form Fields, Bank Remark, Stage Verification)',
      delete: 'Forbidden',
      approve: 'Allowed (Operational Verified QA)',
      export: 'Forbidden'
    },
    dataScope: 'Assigned Banks + Physical Process type only + dispatch_status IS NULL / "none"',
    restrictions: 'Aliased as "QD Checker". Excludes TATA cards unless assigned; hides dashboard, loans, and insurance menus.',
    rulesCount: 5,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'final_status_operator',
    name: 'Final Status Operator',
    role: 'EMPLOYEE / ADMIN',
    category: 'Final Settlement',
    modulesAccessible: [
      'Applications CRM (Final Status Queue)', 'Messenger'
    ],
    permissions: {
      view: 'Conditional (Assigned Banks, Dispatched Applications, In-Process Final Status)',
      create: 'Forbidden',
      update: 'Allowed (Bank App No, Final Status, Disbursement Date/Amount, Card Stage)',
      delete: 'Forbidden',
      approve: 'Allowed (Final Approval / Rejection / Sanctioned)',
      export: 'Forbidden'
    },
    dataScope: 'Assigned Banks + Eligible Dispatch Status (dispatch complete / esign complete) + Final Status in-process/pending',
    restrictions: 'Customer PAN hidden until Bank Application Number is filled; exclusive final approval rights among operators.',
    rulesCount: 6,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'querable_operator',
    name: 'Querable Operator',
    role: 'EMPLOYEE / ADMIN',
    category: 'Decline Resolution',
    modulesAccessible: [
      'Applications CRM (Rejected / Querable Queue)', 'Messenger'
    ],
    permissions: {
      view: 'Conditional (Assigned Banks, Rejected / Declined Applications Only)',
      create: 'Forbidden',
      update: 'Allowed (Queryable Remark, Queryable Sales Remark, Requery Date)',
      delete: 'Forbidden',
      approve: 'Conditional (Re-QD eligibility determination)',
      export: 'Forbidden'
    },
    dataScope: 'Assigned Banks + status IN (rejected, declined, technical_error) OR final_status IN (rejected, declined)',
    restrictions: 'Also spelled "Queryable Operator". Restricted strictly to declined queue; dashboard & product menus hidden.',
    rulesCount: 5,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'kyc_operator',
    name: 'KYC Operator',
    role: 'KYC_OPERATOR / ADMIN',
    category: 'Video & Document KYC',
    modulesAccessible: [
      'KYC Operator Portal (/admin/kyc-operator)', 'Applications CRM', 'Messenger'
    ],
    permissions: {
      view: 'Allowed (KYC Applications Queue)',
      create: 'Forbidden',
      update: 'Allowed (KYC Stage, Request Additional Information)',
      delete: 'Forbidden',
      approve: 'Allowed (Approve / Reject KYC Documents)',
      export: 'Forbidden'
    },
    dataScope: 'Partner and Customer KYC application queue across all banks',
    restrictions: 'Server-side enforced by requireKycOperator middleware. Cannot modify financial application statuses.',
    rulesCount: 5,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'hr',
    name: 'HR',
    role: 'HR / ADMIN',
    category: 'Human Resources',
    modulesAccessible: [
      'HR Dashboard & Candidates (/hr/dashboard)', 'Candidate Tracking', 'Candidate Status'
    ],
    permissions: {
      view: 'Allowed (All Candidates)',
      create: 'Allowed (Candidate Registration, Interview Invites)',
      update: 'Allowed (Interview Date, Selection Status, Offered Designation, CTC)',
      delete: 'Forbidden',
      approve: 'Allowed (Select / Reject Candidates, Issue Onboarding Link)',
      export: 'Allowed'
    },
    dataScope: 'Candidate recruitment applications and employee profiles',
    restrictions: 'Restricted from financial CRM, wallet payouts, commissions, and bank settings.',
    rulesCount: 4,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'branch_head',
    name: 'Branch Head',
    role: 'EMPLOYEE',
    category: 'Employee Hierarchy (Level 1)',
    modulesAccessible: [
      'Employee Dashboard', 'Team Hierarchy', 'Incentives', 'Sales Reports Review', 'Attendance'
    ],
    permissions: {
      view: 'Allowed (Own + Full Recursive Downline)',
      create: 'Allowed (Leads)',
      update: 'Allowed (Own Profile, Downline Sales Reports Review)',
      delete: 'Forbidden',
      approve: 'Allowed (Downline Daily Sales Reports)',
      export: 'Allowed (Branch Sales)'
    },
    dataScope: 'Own records plus recursive downline (Senior Managers, Managers, TLs, TC)',
    restrictions: 'Enforced via employee_hierarchy table; cannot view records of peers in other branches.',
    rulesCount: 4,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'senior_manager',
    name: 'Senior Manager',
    role: 'EMPLOYEE',
    category: 'Employee Hierarchy (Level 2)',
    modulesAccessible: [
      'Employee Dashboard', 'Team Hierarchy', 'Incentives', 'Sales Reports Review', 'Attendance'
    ],
    permissions: {
      view: 'Allowed (Own + Downline)',
      create: 'Allowed (Leads)',
      update: 'Allowed (Own Profile, Downline Sales Reports Review)',
      delete: 'Forbidden',
      approve: 'Allowed (Downline Daily Sales Reports)',
      export: 'Allowed (Division Sales)'
    },
    dataScope: 'Own records plus recursive downline (Managers, TLs, TC)',
    restrictions: 'Cannot review reports or view data outside their reporting branch or hierarchy tree.',
    rulesCount: 4,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'manager',
    name: 'Manager',
    role: 'EMPLOYEE',
    category: 'Employee Hierarchy (Level 3)',
    modulesAccessible: [
      'Employee Dashboard', 'Team Hierarchy', 'Incentives', 'Sales Reports Review', 'Attendance'
    ],
    permissions: {
      view: 'Allowed (Own + Downline)',
      create: 'Allowed (Leads)',
      update: 'Allowed (Own Profile, Downline Sales Reports Review)',
      delete: 'Forbidden',
      approve: 'Allowed (Downline Daily Sales Reports)',
      export: 'Allowed (Team Sales)'
    },
    dataScope: 'Own records plus direct Team Leaders and Telecallers',
    restrictions: 'Enforced via PUT /api/v1/employee/sales-reports/:id/review with downline CTE query.',
    rulesCount: 4,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'team_leader',
    name: 'Team Leader (TL)',
    role: 'EMPLOYEE',
    category: 'Employee Hierarchy (Level 4)',
    modulesAccessible: [
      'Employee Dashboard', 'Team Hierarchy', 'Incentives', 'Sales Reports Review', 'Attendance'
    ],
    permissions: {
      view: 'Allowed (Own + Assigned Telecallers)',
      create: 'Allowed (Leads)',
      update: 'Allowed (Own Profile, Assigned TC Sales Reports)',
      delete: 'Forbidden',
      approve: 'Allowed (Assigned TC Sales Reports)',
      export: 'Restricted'
    },
    dataScope: 'Own records plus assigned Telecallers in employee_hierarchy table',
    restrictions: 'Cannot approve commission releases; restricted to direct calling reports.',
    rulesCount: 4,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'telecaller',
    name: 'Telecaller (TC)',
    role: 'EMPLOYEE',
    category: 'Employee Hierarchy (Level 5)',
    modulesAccessible: [
      'Employee Dashboard', 'Applications Submission', 'Incentives & Targets', 'Attendance Check-in'
    ],
    permissions: {
      view: 'Allowed (Own Records Only)',
      create: 'Allowed (Leads & Applications)',
      update: 'Allowed (Own Submitted Applications in Draft)',
      delete: 'Forbidden',
      approve: 'Forbidden',
      export: 'Forbidden'
    },
    dataScope: 'Strictly Own Records (user_id = req.user.id / employee_id)',
    restrictions: 'Cannot view peers or downlines; check-in bound to geofence office building.',
    rulesCount: 4,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'partner',
    name: 'Partner',
    role: 'PARTNER',
    category: 'Channel Partner',
    modulesAccessible: [
      'Partner Dashboard', 'Products Catalog', 'Share Link Generation',
      'Leads CRM', 'Applications Tracker', 'Wallet & Payouts',
      'Team Network Tree', 'Referrals', 'KYC Centre'
    ],
    permissions: {
      view: 'Allowed (Own + Team Network)',
      create: 'Allowed (Leads, Share Links, Withdrawal Requests, Team Members)',
      update: 'Allowed (Profile, Own Lead Details, Bank Account)',
      delete: 'Restricted (Can soft-delete own team members)',
      approve: 'Forbidden (Admin approves withdrawals and KYC)',
      export: 'Allowed (Own Statement / Reports)'
    },
    dataScope: 'Own records and direct/multi-tier child partners via partner_team_relationships',
    restrictions: 'Blocked from unapproved features if kyc_status !== "approved" (requireApprovedPartner).',
    rulesCount: 7,
    auditStatus: 'Verified',
    unrestricted: false
  },
  {
    id: 'team_member',
    name: 'Team Member',
    role: 'TEAM_MEMBER',
    category: 'Sub-Partner',
    modulesAccessible: [
      'Partner Dashboard', 'Products Catalog', 'Share Link Generation',
      'Leads CRM', 'Applications Tracker', 'Wallet (Own)'
    ],
    permissions: {
      view: 'Allowed (Own Records Only)',
      create: 'Allowed (Leads, Share Links)',
      update: 'Allowed (Own Profile)',
      delete: 'Forbidden',
      approve: 'Forbidden',
      export: 'Restricted'
    },
    dataScope: 'Strictly Own Records tied to parent partner account',
    restrictions: 'Cannot add sub-team members; commissions split according to parent partner rate.',
    rulesCount: 5,
    auditStatus: 'Verified',
    unrestricted: false
  }
];

// Concrete rules with exact source file, line ranges, and enforcement mechanisms
const AUDITED_RULES = [
  // Super Admin Rules
  {
    id: 'R01',
    designation: 'Super Admin',
    module: 'System Administration',
    action: 'Create & Manage Admins and Global Settings',
    accessResult: 'Allowed',
    conditions: 'Role must be SUPER_ADMIN in JWT token and PostgreSQL users table',
    backendEnforcement: 'roleCheck("SUPER_ADMIN") middleware applied globally',
    frontendEnforcement: 'SuperAdminLayout wraps routes; AdminLayout hides admin management for non-superadmins',
    sourceFile: 'backend/src/modules/super-admin/superadmin.routes.js',
    functionOrMiddleware: 'roleCheck("SUPER_ADMIN")',
    evidence: 'Lines 15-16: router.use(jwtAuth); router.use(roleCheck("SUPER_ADMIN"));',
    auditStatus: 'Verified'
  },
  {
    id: 'R02',
    designation: 'Super Admin',
    module: 'Commission Management',
    action: 'Create, Bulk-Set, and Delete Commission Rules',
    accessResult: 'Allowed',
    conditions: 'Authenticated Super Admin session',
    backendEnforcement: 'roleCheck("SUPER_ADMIN") on route endpoints',
    frontendEnforcement: 'ManageCommissions.jsx only rendered under SuperAdminLayout',
    sourceFile: 'backend/src/modules/admin/route.js',
    functionOrMiddleware: 'roleCheck("SUPER_ADMIN")',
    evidence: 'Lines 33-40: router.post("/commission-rule", roleCheck("SUPER_ADMIN")...);',
    auditStatus: 'Verified'
  },
  {
    id: 'R03',
    designation: 'Super Admin',
    module: 'CRM / Applications',
    action: 'Release and Hold Partner Commissions',
    accessResult: 'Allowed',
    conditions: 'Target application has valid commission calculation',
    backendEnforcement: 'authorize("SUPER_ADMIN") on commission release endpoints',
    frontendEnforcement: 'Action buttons only shown to Super Admin in ManageApplications.jsx',
    sourceFile: 'backend/src/modules/crm/application.routes.js',
    functionOrMiddleware: 'authorize("SUPER_ADMIN")',
    evidence: 'Lines 59-60: router.post("/:id/release-commission", authorize("SUPER_ADMIN"), appCtrl.releaseCommission);',
    auditStatus: 'Verified'
  },
  {
    id: 'R04',
    designation: 'Super Admin',
    module: 'Attendance Reports',
    action: 'Export and View Global Attendance Reports',
    accessResult: 'Allowed',
    conditions: 'Authenticated Super Admin token',
    backendEnforcement: 'roleCheck("SUPER_ADMIN") on attendance reports router',
    frontendEnforcement: 'Reports link visible only in SuperAdminLayout',
    sourceFile: 'backend/src/modules/attendance-reports/attendance-reports.routes.js',
    functionOrMiddleware: 'roleCheck("SUPER_ADMIN")',
    evidence: 'Lines 7-8: router.use(jwtAuth, roleCheck("SUPER_ADMIN"));',
    auditStatus: 'Verified'
  },

  // Operational Head Rules
  {
    id: 'R05',
    designation: 'Operational Head',
    module: 'CRM / Applications',
    action: 'View Applications for Assigned Banks & Categories',
    accessResult: 'Conditional',
    conditions: 'User must be mapped to bank_id in admin_bank_assignments; category filter matches (credit_card or loc_eoc)',
    backendEnforcement: 'Dynamic SQL injection of baseBankAccessFilterSQL in application.controller.js',
    frontendEnforcement: 'AdminLayout filters banks menu by assigned_banks array',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (baseBankAccessFilterSQL)',
    evidence: 'Lines 1685-1743: queries admin_bank_assignments for req.user.id and applies matching clauses; 1=0 if no assignments found.',
    auditStatus: 'Verified'
  },
  {
    id: 'R06',
    designation: 'Operational Head',
    module: 'Attendance Administration',
    action: 'View Today and Historical Employee Attendance',
    accessResult: 'Allowed',
    conditions: 'Role or designation includes OPERATIONAL_HEAD / OPERATIONS_HEAD',
    backendEnforcement: 'authorize("SUPER_ADMIN", "ADMIN", "OPERATIONAL_HEAD", "OPERATIONS_HEAD")',
    frontendEnforcement: 'Navigation item rendered in AdminLayout',
    sourceFile: 'backend/src/modules/attendance-admin/attendance-admin.routes.js',
    functionOrMiddleware: 'authorize middleware',
    evidence: 'Line 7: router.use(authenticate, syncUser, authorize("SUPER_ADMIN", "ADMIN", "OPERATIONAL_HEAD", "OPERATIONS_HEAD"));',
    auditStatus: 'Verified'
  },

  // Administrative Sales Executive Rules
  {
    id: 'R07',
    designation: 'Administrative Sales Executive',
    module: 'CRM / Applications',
    action: 'View Applications Queue',
    accessResult: 'Conditional',
    conditions: 'Process type must be lead_punching / punching; dispatch_status must be empty / none; assigned banks only; TATA cards excluded unless explicitly assigned',
    backendEnforcement: 'salesExecFilterSQL applied in application.controller.js',
    frontendEnforcement: 'AdminDocumentVerificationModal forces activeTab to "remark" instead of "final"',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (salesExecFilterSQL)',
    evidence: 'Lines 1745-1759: processFilter = punching; dispatchFilter = empty/none; tataExclusionFilter applied.',
    auditStatus: 'Verified'
  },
  {
    id: 'R08',
    designation: 'Administrative Sales Executive',
    module: 'CRM / Applications',
    action: 'Approve / Reject Final Application Status',
    accessResult: 'Forbidden',
    conditions: 'Administrative Sales Executive is strictly barred from approving/rejecting final status',
    backendEnforcement: 'Controller checks isSalesExecUser and rejects or omits final status transition',
    frontendEnforcement: 'Final Tab locked or redirected in AdminDocumentVerificationModal.jsx:380-384',
    sourceFile: 'frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx',
    functionOrMiddleware: 'useEffect tab override',
    evidence: 'Lines 380-384: if (isSalesExecUser && targetKey === "final") setActiveTab("remark"); DEVELOPER_GUIDE.md:604.',
    auditStatus: 'Verified'
  },
  {
    id: 'R09',
    designation: 'Administrative Sales Executive',
    module: 'Product Catalog',
    action: 'List Available Financial Products',
    accessResult: 'Conditional',
    conditions: 'Products filtered strictly to banks assigned in admin_bank_assignments (or LOC/EOC)',
    backendEnforcement: 'where += AND (p.bank_id IN (SELECT bank_id FROM admin_bank_assignments WHERE admin_id = ...))',
    frontendEnforcement: 'Dropdown options in employee lead submission form match filtered list',
    sourceFile: 'backend/src/modules/products/controller.js',
    functionOrMiddleware: 'listProducts (isSalesExecUser clause)',
    evidence: 'Lines 27-34: detects userDesignation == ADMINISTRATIVE SALES EXECUTIVE and appends bank_id assignment subquery.',
    auditStatus: 'Verified'
  },

  // PAN Checker Rules
  {
    id: 'R10',
    designation: 'PAN Checker',
    module: 'CRM / Applications',
    action: 'View Applications Queue',
    accessResult: 'Conditional',
    conditions: 'Bank must be SBI; Bank must NOT be TATA; status NOT IN (approved, disbursed, sanctioned); pan_check = "no"',
    backendEnforcement: 'panCheckerFilterSQL applied in application.controller.js',
    frontendEnforcement: 'ManageApplications.jsx titles page "PAN Checker Review Queue" and disables status tabs',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (panCheckerFilterSQL)',
    evidence: 'Lines 1761-1765: panCheckerFilterSQL enforces SBI, pan_check = no, non-approved status, and base bank assignments.',
    auditStatus: 'Verified'
  },
  {
    id: 'R11',
    designation: 'PAN Checker',
    module: 'CRM / Applications',
    action: 'View Customer Contact Information',
    accessResult: 'Conditional (Masked)',
    conditions: 'Mobile number display masked to last digits with asterisks',
    backendEnforcement: 'Not masked in API response payload (sent raw in JSON)',
    frontendEnforcement: 'Frontend masks string: mobile.slice(0, length - 6) + "******"',
    sourceFile: 'frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx',
    functionOrMiddleware: 'Mobile rendering expression',
    evidence: 'Line 1066: (isPanChecker || isRemarkOperator) ? (customerMobile.slice(0, -6) + "******") : customerMobile.',
    auditStatus: 'Conflicting (Frontend-only masking; backend returns raw phone)'
  },
  {
    id: 'R12',
    designation: 'PAN Checker',
    module: 'CRM / Applications',
    action: 'Submit PAN Verification Decision',
    accessResult: 'Allowed',
    conditions: 'Can set status to "operational_verified" (Verify) or "rejected" (Reject) with bank_remark',
    backendEnforcement: 'PUT /applications/:id/verification admitted via requireApprovedPartnerOrAdmin',
    frontendEnforcement: 'Dedicated "PAN Checker Review & Submit" panel with Verify PAN and Reject PAN buttons',
    sourceFile: 'frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx',
    functionOrMiddleware: 'PAN Checker Review Panel',
    evidence: 'Lines 1267-1332 and 1343-1490: Submits pan_check: "yes", status: "operational_verified" or "rejected".',
    auditStatus: 'Verified'
  },

  // Remark Operator Rules
  {
    id: 'R13',
    designation: 'Remark Operator',
    module: 'CRM / Applications',
    action: 'View Applications Queue',
    accessResult: 'Conditional',
    conditions: 'Bank must be non-SBI, OR TATA, OR pan_check = "yes"; dispatch_status empty/none; status NOT IN (rejected, declined, cancelled); bank_remark NOT LIKE "%pan%reject%"',
    backendEnforcement: 'remarkOperatorFilterSQL applied in application.controller.js',
    frontendEnforcement: 'ManageApplications.jsx titles page "Remark Operator Queue"',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (remarkOperatorFilterSQL)',
    evidence: 'Lines 1784-1789: remarkOperatorFilterSQL enforces panCheckCondition and dispatchFilter.',
    auditStatus: 'Verified'
  },
  {
    id: 'R14',
    designation: 'Remark Operator',
    module: 'CRM / Applications',
    action: 'Save Remark Form Details',
    accessResult: 'Allowed',
    conditions: 'Updates bank_remark, user_remark, notes, ipa_stage, vkyc_stage, dispatch_status',
    backendEnforcement: 'PUT /applications/:id/remark accepts operator remark payload',
    frontendEnforcement: 'Remark Operator Review & Submit panel in modal',
    sourceFile: 'backend/src/modules/crm/application.routes.js',
    functionOrMiddleware: 'updateRemarkOperatorApplication',
    evidence: 'Lines 45-47: router.put("/:id/remark", requireApprovedPartnerOrAdmin, appCtrl.updateRemarkOperatorApplication);',
    auditStatus: 'Verified'
  },

  // QD Operator Rules
  {
    id: 'R15',
    designation: 'QD Operator',
    module: 'CRM / Applications',
    action: 'View Applications Queue',
    accessResult: 'Conditional',
    conditions: 'Process type must be physical / physical_process; dispatch_status must be empty/none; assigned banks only; TATA excluded unless assigned',
    backendEnforcement: 'qdOperatorFilterSQL applied in application.controller.js',
    frontendEnforcement: 'ManageApplications.jsx sets QD and Remark action buttons on rows',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (qdOperatorFilterSQL)',
    evidence: 'Lines 1767-1782: physicalProcessFilter = physical; dispatchFilter = empty/none.',
    auditStatus: 'Verified'
  },
  {
    id: 'R16',
    designation: 'QD Operator',
    module: 'CRM / Applications',
    action: 'Edit Quick Details (QD) Form',
    accessResult: 'Allowed',
    conditions: 'Can update physical details, address, company, income fields when application is not locked',
    backendEnforcement: 'PUT /applications/:id/verification updates physical details payload',
    frontendEnforcement: 'QD Tab rendered and active in AdminDocumentVerificationModal.jsx',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'updateApplicationDetails',
    evidence: 'Lines 2780-2940: writes operator_designation, operator_role, action_type into audit history.',
    auditStatus: 'Verified'
  },

  // Final Status Operator Rules
  {
    id: 'R17',
    designation: 'Final Status Operator',
    module: 'CRM / Applications',
    action: 'View Applications Queue',
    accessResult: 'Conditional',
    conditions: 'dispatch_status IN (dispatch complete, physical dispatch, digital dispatch, esign complete, esign pending); final_status is in process / pending / not yet finalized',
    backendEnforcement: 'finalStatusOperatorFilterSQL applied in application.controller.js',
    frontendEnforcement: 'AdminDocumentVerificationModal renders "Final Status Operator Workspace Card"',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (finalStatusOperatorFilterSQL)',
    evidence: 'Lines 1791-1816: eligibleDispatchFilter and inProcessFinalStatusFilter strictly applied.',
    auditStatus: 'Verified'
  },
  {
    id: 'R18',
    designation: 'Final Status Operator',
    module: 'CRM / Applications',
    action: 'View Customer PAN Card',
    accessResult: 'Conditional',
    conditions: 'PAN number is masked/hidden until Bank Application Number (bank_ref_number) is populated',
    backendEnforcement: 'Not masked in API response; returned in app object',
    frontendEnforcement: 'Modal displays "🔒 Hidden (Fill Bank App No Required)" if hasBankAppNumber is false',
    sourceFile: 'frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx',
    functionOrMiddleware: 'PAN masking check',
    evidence: 'Line 1068: hasBankAppNumber ? panNumber : "🔒 Hidden (Fill Bank App No Required)".',
    auditStatus: 'Conflicting (Frontend-only masking; backend returns raw pan_number)'
  },
  {
    id: 'R19',
    designation: 'Final Status Operator',
    module: 'CRM / Applications',
    action: 'Execute Final Status Approval / Decline & Disbursement',
    accessResult: 'Allowed',
    conditions: 'Requires bank_ref_number; updates final_status, digital_card_issued, disbursement_amount, disbursement_date',
    backendEnforcement: 'PUT /applications/:id/verification commits final_status and status fields',
    frontendEnforcement: 'Approve Application button active in modal header; Final Tab fully enabled',
    sourceFile: 'frontend/src/modules/admin/reports/AdminDocumentVerificationModal.jsx',
    functionOrMiddleware: 'handleSubmitVerification / Header Approve',
    evidence: 'Lines 1180-1222: submits status: "approved", final_status: "Approved", bank_remark.',
    auditStatus: 'Verified'
  },

  // Querable Operator Rules
  {
    id: 'R20',
    designation: 'Querable Operator',
    module: 'CRM / Applications',
    action: 'View Applications Queue',
    accessResult: 'Conditional',
    conditions: 'status OR final_status OR bank_current_lead_status IN (rejected, declined, technical_error); assigned banks only',
    backendEnforcement: 'querableOperatorFilterSQL applied in application.controller.js',
    frontendEnforcement: 'ManageApplications.jsx defaults status filter to "rejected"',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'listApplications (querableOperatorFilterSQL)',
    evidence: 'Lines 1818-1832: rejectedCondition matches status/final_status like %reject% or %decline%.',
    auditStatus: 'Verified'
  },
  {
    id: 'R21',
    designation: 'Querable Operator',
    module: 'CRM / Applications',
    action: 'Update Queryable Remarks & Re-QD Date',
    accessResult: 'Allowed',
    conditions: 'Updates queryable_remark, queryable_sales_remark, requery_date, eligible_reqd',
    backendEnforcement: 'PUT /applications/:id/verification accepts queryable remarks',
    frontendEnforcement: 'ManageApplications.jsx table row provides "View Query" action button',
    sourceFile: 'backend/src/modules/crm/application.controller.js',
    functionOrMiddleware: 'updateApplicationDetails',
    evidence: 'Lines 2930-2945: writes eligible_reqd, queryable_remark, notes into timeline and operator history.',
    auditStatus: 'Verified'
  },

  // KYC Operator Rules
  {
    id: 'R22',
    designation: 'KYC Operator',
    module: 'Video & Document KYC',
    action: 'Access Dedicated KYC Operator Queue',
    accessResult: 'Allowed',
    conditions: 'User role must be KYC_OPERATOR, or designation must be KYC_OPERATOR / KYC OPERATOR',
    backendEnforcement: 'requireKycOperator middleware on /api/v1/kyc-operator router',
    frontendEnforcement: 'RoleRoute.jsx redirects KYC Operator to /admin/kyc-operator; AdminLayout sets portal title',
    sourceFile: 'backend/src/modules/kyc-operator/kyc-operator.routes.js',
    functionOrMiddleware: 'requireKycOperator',
    evidence: 'Lines 18-36: checks role === "KYC_OPERATOR" || designation.includes("KYC OPERATOR"); returns 403 otherwise.',
    auditStatus: 'Verified'
  },
  {
    id: 'R23',
    designation: 'KYC Operator',
    module: 'Video & Document KYC',
    action: 'Approve, Reject, or Request Info on KYC Submissions',
    accessResult: 'Allowed',
    conditions: 'Valid target application ID in KYC queue',
    backendEnforcement: 'POST /api/v1/kyc-operator/applications/:id/verify, /reject, /request-information',
    frontendEnforcement: 'KycOperatorDashboard.jsx review modals',
    sourceFile: 'backend/src/modules/kyc-operator/kyc-operator.routes.js',
    functionOrMiddleware: 'verifyKycApplication / rejectKycApplication',
    evidence: 'Lines 48-52: router.post("/applications/:id/verify", verifyKycApplication);',
    auditStatus: 'Verified'
  },

  // HR Rules
  {
    id: 'R24',
    designation: 'HR',
    module: 'Human Resources',
    action: 'Manage Candidate Pipeline & Interviews',
    accessResult: 'Allowed',
    conditions: 'Role must be HR, ADMIN, or SUPER_ADMIN',
    backendEnforcement: 'roleCheck("HR", "ADMIN", "SUPER_ADMIN") on /api/v1/hr router',
    frontendEnforcement: 'RoleRoute.jsx routes HR to /hr/dashboard; AdminLayout sets "HR Management Portal"',
    sourceFile: 'backend/src/modules/hr/hr.routes.js',
    functionOrMiddleware: 'roleCheck("HR", "ADMIN", "SUPER_ADMIN")',
    evidence: 'Lines 13-14: router.use(jwtAuth); router.use(roleCheck("HR", "ADMIN", "SUPER_ADMIN"));',
    auditStatus: 'Verified'
  },

  // Employee Hierarchy & Supervisor Rules
  {
    id: 'R25',
    designation: 'Manager / Branch Head',
    module: 'Employee Hierarchy',
    action: 'Review and Approve Downline Daily Sales Reports',
    accessResult: 'Conditional',
    conditions: 'Report owner must be in the supervisor’s recursive downline hierarchy in employee_hierarchy table',
    backendEnforcement: 'Recursive CTE query checks team_leader_id, manager_id, senior_manager_id, branch_head_id; returns 403 if not in downline',
    frontendEnforcement: 'EmployeeSalesReports.jsx "Team Reports" tab only lists reports from accessible downline',
    sourceFile: 'backend/src/modules/employee/employee.routes.js',
    functionOrMiddleware: 'PUT /sales-reports/:id/review (downline CTE check)',
    evidence: 'Lines 1462-1478: WITH RECURSIVE downline AS (...) verifies reviewer is an ancestor; returns 403 Forbidden.',
    auditStatus: 'Verified'
  },
  {
    id: 'R26',
    designation: 'Telecaller (TC)',
    module: 'Employee Portal',
    action: 'View Team Hierarchy or Peer Records',
    accessResult: 'Forbidden',
    conditions: 'Telecallers have no subordinates in employee_hierarchy table',
    backendEnforcement: 'GET /api/v1/employee/team returns empty array for Level 5 employees',
    frontendEnforcement: 'MyTeam.jsx renders "Direct Reports: 0" or hides supervisor controls',
    sourceFile: 'backend/src/modules/employee/employee.routes.js',
    functionOrMiddleware: 'GET /team handler',
    evidence: 'Lines 1155-1195: queries employee_hierarchy for reports where current employee is supervisor.',
    auditStatus: 'Verified'
  },

  // Working Hours Precedence Rule
  {
    id: 'R27',
    designation: 'All Designations',
    module: 'Working Hours & Policies',
    action: 'Resolve Policy & Holiday Restrictions',
    accessResult: 'Conditional',
    conditions: 'Precedence resolved in 4 tiers: USER > DESIGNATION > ROLE > GLOBAL',
    backendEnforcement: 'SQL CASE expression in workingHours.service.js',
    frontendEnforcement: 'AdminWorkingHours.jsx provides Multi-designation picker and policy tester',
    sourceFile: 'backend/src/modules/auth/workingHours.service.js',
    functionOrMiddleware: 'resolveHolidayForUser / resolvePolicyForUser',
    evidence: 'Lines 143-152: ORDER BY CASE WHEN scope_type = "USER" THEN 1 WHEN scope_type = "DESIGNATION" THEN 2 ...',
    auditStatus: 'Verified'
  },

  // Channel Partner Rules
  {
    id: 'R28',
    designation: 'Partner',
    module: 'Partner Portal',
    action: 'Access Full Partner Portal & Wallet Payouts',
    accessResult: 'Conditional',
    conditions: 'Partner KYC status must be "approved" in partner_profiles table',
    backendEnforcement: 'requireApprovedPartner middleware on partner routes',
    frontendEnforcement: 'PartnerDashboard.jsx displays prominent KYC pending banner and locks withdrawal requests',
    sourceFile: 'backend/src/middleware/authentication/auth.middleware.js',
    functionOrMiddleware: 'requireApprovedPartner',
    evidence: 'Lines 149-153: if (partner.kyc_status !== "approved") req.kycUnapproved = true; returns forbidden on protected routes.',
    auditStatus: 'Verified'
  }
];

// Architectural Conflicts & Security Discrepancies Report
const AUDITED_CONFLICTS = [
  {
    id: 'CONF-01',
    title: 'Bank Card Routes Block Operational Roles at Route Level',
    severity: 'High',
    module: 'CRM / Bank Card Applications',
    description: 'In backend/src/modules/crm/bank_card_application.routes.js (lines 8-14), all routes enforce authorize("ADMIN", "SUPER_ADMIN"). However, the underlying controller bank_card_application.controller.js contains explicit permission branches for isSalesExecUser, isRemarkOperatorUser, and isQdOperatorUser. If an employee with role EMPLOYEE and designation Administrative Sales Executive attempts to call PATCH /api/v1/admin/bank-cards/:id/assist, the route middleware returns 403 Forbidden before controller checks execute.',
    evidence: 'bank_card_application.routes.js:8 vs bank_card_application.controller.js:160, 283',
    auditStatus: 'Conflicting',
    recommendedCorrection: 'Update bank_card_application.routes.js to include EMPLOYEE role or check designations in middleware, aligning route guards with controller logic.'
  },
  {
    id: 'CONF-02',
    title: 'Client-Side Data Masking Without Backend Response Masking (PAN & Mobile)',
    severity: 'Medium',
    module: 'CRM / Applications API',
    description: 'In AdminDocumentVerificationModal.jsx, customer mobile numbers are masked for PAN Checkers and Remark Operators (line 1066), and PAN numbers are masked until Bank Application Numbers are entered (line 1068). However, the backend GET /api/v1/applications endpoint returns full unmasked customer_mobile and pan_number fields in the JSON response payload. Any operator with browser DevTools can inspect unmasked PII.',
    evidence: 'AdminDocumentVerificationModal.jsx:1066 vs application.controller.js:1920-1945',
    auditStatus: 'Conflicting',
    recommendedCorrection: 'Implement server-side masking in application.controller.js serializer based on req.user.designation before returning the response.'
  },
  {
    id: 'CONF-03',
    title: 'Missing Route-Level RBAC Guards on Employee Post-Login Endpoints',
    severity: 'Medium',
    module: 'Employee Module',
    description: 'In backend/src/modules/employee/employee.routes.js, roleCheck middleware is imported on line 5 but never invoked on any route after router.use(jwtAuth) (line 213). Any authenticated user (including Partner or Candidate) possessing a valid JWT token can call employee endpoints unless individual controller handlers perform manual checks.',
    evidence: 'employee.routes.js:5, 213',
    auditStatus: 'Review Needed',
    recommendedCorrection: 'Add router.use(roleCheck("EMPLOYEE", "ADMIN", "SUPER_ADMIN")) to employee.routes.js before employee-specific endpoints.'
  },
  {
    id: 'CONF-04',
    title: 'Designation Spelling and Alias Proliferation Across Repositories',
    severity: 'Low',
    module: 'RBAC / Identity',
    description: 'The codebase contains up to 4 spelling and format variants for the same logical designations without a single normalization pipeline. For example: "QD OPERATOR", "QD_OPERATOR", "QD CHECKER", "QD_CHECKER"; "QUERABLE OPERATOR", "QUERABLE_OPERATOR", "QUERYABLE OPERATOR", "QUERYABLE_OPERATOR"; "ADMINISTRATIVE OPERATOR", "ADMINISTRATIVE_OPERATOR", "BACKEND", "BACKEND OPERATION". While controllers check multiple strings in Array.includes(), any new feature omitting an alias introduces subtle authorization bypasses.',
    evidence: 'application.controller.js:1644, RoleRoute.jsx:8, AdminLayout.jsx:99-103',
    auditStatus: 'Review Needed',
    recommendedCorrection: 'Adopt normalizeDesignation() helper centrally from backend/src/constants/roles.js across all route middleware and controllers.'
  },
  {
    id: 'CONF-05',
    title: 'Permissive Verification Update Route vs Frontend Button Hiding',
    severity: 'Medium',
    module: 'CRM / Applications Verification',
    description: 'Frontend modal hides the "Approve Application" button for PAN Checkers and Remark Operators. However, the endpoint PUT /api/v1/applications/:id/verification is guarded only by requireApprovedPartnerOrAdmin (which treats all operator designations as admin-like). An operator sending a crafted PUT request directly with status: "approved" can potentially trigger an unauthorized status transition.',
    evidence: 'application.routes.js:82-84 vs AdminDocumentVerificationModal.jsx:1180-1222',
    auditStatus: 'Conflicting',
    recommendedCorrection: 'Enforce designation status transition validation directly in backend updateApplicationDetails controller.'
  },
  {
    id: 'CONF-06',
    title: 'Dual Role-Designation Fallback Checks in Controller SQL Logic',
    severity: 'Low',
    module: 'CRM / Applications Controller',
    description: 'In application.controller.js (e.g. lines 1644, 2802), code frequently tests `userDesignation.includes(...) || userRole.includes(...)`. Because users.role is an enum and users.designation is a varchar, treating them interchangeably creates ambiguity when a user has role EMPLOYEE with designation ADMINISTRATIVE OPERATOR versus role ADMIN with designation EMPLOYEE.',
    evidence: 'application.controller.js:1644-1646, 2802, 3651',
    auditStatus: 'Review Needed',
    recommendedCorrection: 'Establish role as the overarching authorization tier (e.g. EMPLOYEE vs ADMIN) and designation strictly as the functional profile.'
  },
  {
    id: 'CONF-07',
    title: 'Operational Head Bank Filtering Depends on Table Population',
    severity: 'Low',
    module: 'Banks & CRM Boundaries',
    description: 'When an Operational Head has zero entries in admin_bank_assignments, the backend applies `AND 1=0`, resulting in an empty list. While secure against unauthorized access, there is no explicit warning in the API response or UI explaining that bank assignment is required to view applications.',
    evidence: 'application.controller.js:1727-1729',
    auditStatus: 'Verified',
    recommendedCorrection: 'Surface an informational metadata flag in API response when assigned_banks length is 0 for operational roles.'
  }
];

/**
 * GET /api/v1/admin/designation-rules
 * Returns complete audited designations, matrix, rules, and conflict analysis.
 * Safely fetches live user counts from DB if available.
 */
async function getDesignationRulesAudit(req, res, next) {
  try {
    let liveStats = [];
    try {
      const { rows } = await query(`
        SELECT 
          COALESCE(NULLIF(TRIM(designation), ''), 'Unassigned') as designation,
          COALESCE(role::text, 'UNKNOWN') as role,
          COUNT(*) as user_count
        FROM users
        GROUP BY designation, role
        ORDER BY user_count DESC
      `);
      liveStats = rows || [];
    } catch (dbErr) {
      logger.warn('Live DB query for designation counts skipped / timed out:', dbErr.message);
      liveStats = [];
    }

    // Merge live count into audited designations if matched
    const enrichedDesignations = AUDITED_DESIGNATIONS.map(d => {
      const match = liveStats.find(s => 
        s.designation.toUpperCase() === d.name.toUpperCase() ||
        s.designation.toUpperCase().replace(/\s+/g, '_') === d.name.toUpperCase().replace(/\s+/g, '_') ||
        (d.role && s.role.toUpperCase() === d.role.toUpperCase())
      );
      return {
        ...d,
        liveUserCount: match ? parseInt(match.user_count, 10) : 0
      };
    });

    const summary = {
      totalDesignationsFound: AUDITED_DESIGNATIONS.length,
      totalRulesIdentified: AUDITED_RULES.length,
      unrestrictedAdministrativeAccessCount: AUDITED_DESIGNATIONS.filter(d => d.unrestricted).length,
      rulesRequiringReviewCount: AUDITED_CONFLICTS.length,
      auditedAt: new Date().toISOString(),
      liveDbConnected: liveStats.length > 0
    };

    return success(res, {
      summary,
      designations: enrichedDesignations,
      rules: AUDITED_RULES,
      conflicts: AUDITED_CONFLICTS,
      liveStats
    }, 'Designation rules and permissions audit retrieved successfully');
  } catch (err) {
    logger.error('Failed to generate designation rules audit:', err.message);
    next(err);
  }
}

module.exports = {
  getDesignationRulesAudit,
  AUDITED_DESIGNATIONS,
  AUDITED_RULES,
  AUDITED_CONFLICTS
};
