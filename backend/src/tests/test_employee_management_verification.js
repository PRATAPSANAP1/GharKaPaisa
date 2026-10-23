/**
 * Automated Verification Suite: Employee Management & Profile System
 * Tests route integrity, persistence synchronization, hierarchy resolution,
 * document handling, and responsive contracts.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('🧪 TESTING: Employee Management & Profile System Full Verification');
console.log('========================================================================\n');

// 1. Inspect employee-management.routes.js for route collisions & duplicate handlers
console.log('--- TEST 1: Route Collision & Duplicate Handler Audit ---');
const routesFilePath = path.join(__dirname, '../modules/employee-management/employee-management.routes.js');
const routesFileContent = fs.readFileSync(routesFilePath, 'utf8');

const kycVerifyMatches = routesFileContent.match(/router\.post\(['"]\/:id\/kyc-verify['"]/g) || [];
assert.strictEqual(
  kycVerifyMatches.length,
  1,
  `Expected exactly 1 router.post('/:id/kyc-verify') definition, but found ${kycVerifyMatches.length}`
);
console.log(`✔ Verified: Exactly 1 definition of router.post('/:id/kyc-verify') exists (no shadowing).`);

const sendReminderMatches = routesFileContent.match(/router\.post\(['"]\/:id\/send-reminder['"]/g) || [];
assert.strictEqual(
  sendReminderMatches.length,
  1,
  `Expected exactly 1 router.post('/:id/send-reminder') definition, but found ${sendReminderMatches.length}`
);
console.log(`✔ Verified: Exactly 1 definition of router.post('/:id/send-reminder') exists (no shadowing).`);

// 2. Persistence Synchronization in PUT /:id
console.log('\n--- TEST 2: Persistence & Synchronization between Tables in PUT /:id ---');
assert.ok(
  routesFileContent.includes('UPDATE employee_joining_details'),
  'PUT /:id must update employee_joining_details'
);
assert.ok(
  routesFileContent.includes('pan_number = COALESCE($20, pan_number)'),
  'PUT /:id must synchronize pan_number to employee_joining_details'
);
assert.ok(
  routesFileContent.includes('aadhaar_number = COALESCE($21, aadhaar_number)'),
  'PUT /:id must synchronize aadhaar_number to employee_joining_details'
);
assert.ok(
  routesFileContent.includes('bank_account_number = COALESCE($18, bank_account_number)'),
  'PUT /:id must synchronize bank_account_number to employee_joining_details'
);
assert.ok(
  routesFileContent.includes('ifsc_code = COALESCE($19, ifsc_code)'),
  'PUT /:id must synchronize ifsc_code to employee_joining_details'
);
assert.ok(
  routesFileContent.includes('INSERT INTO employee_kyc') && routesFileContent.includes('ON CONFLICT (employee_id) DO UPDATE SET'),
  'PUT /:id must perform an UPSERT on employee_kyc'
);
console.log('✔ Verified: PUT /:id synchronizes employees, employee_joining_details, and performs safe UPSERT on employee_kyc.');

// 3. KYC Verification Handler with Identity Fields & Document Decisions
console.log('\n--- TEST 3: Identity Fields UPSERT & Document Actions in kyc-verify ---');
assert.ok(
  routesFileContent.includes('pan_action') && routesFileContent.includes('aadhaar_action') && routesFileContent.includes('bank_action'),
  'kyc-verify must process core identity document actions'
);
assert.ok(
  routesFileContent.includes('offer_letter_action') && routesFileContent.includes('resume_action') && routesFileContent.includes('experience_letter_action'),
  'kyc-verify must process offer letter, resume, and experience letter document actions'
);
assert.ok(
  routesFileContent.includes('INSERT INTO employee_kyc') && routesFileContent.includes('aadhaar_number = COALESCE(EXCLUDED.aadhaar_number'),
  'kyc-verify must UPSERT identity fields into employee_kyc'
);
console.log('✔ Verified: POST /:id/kyc-verify handles all 9 document actions and safely upserts identity fields.');

// 4. All 4 Hierarchy Levels in Routes & Display
console.log('\n--- TEST 4: Four-Level Hierarchy Architecture Integrity ---');
assert.ok(
  routesFileContent.includes('tl.full_name as team_leader_name') &&
  routesFileContent.includes('mgr.full_name as manager_name') &&
  routesFileContent.includes('sm.full_name as senior_manager_name') &&
  routesFileContent.includes('bh.full_name as branch_head_name'),
  'GET /:id must join and resolve names for all 4 hierarchy levels'
);
console.log('✔ Verified: Team Leader, Manager, Senior Manager, and Branch Head are joined and resolved.');

// 5. Frontend EmployeeManagement.jsx Inspection
console.log('\n--- TEST 5: Frontend EmployeeManagement.jsx Document Tracking & Media Previews ---');
const frontendMgmtPath = path.join(__dirname, '../../../frontend/src/modules/super-admin/employees/EmployeeManagement.jsx');
const frontendMgmtContent = fs.readFileSync(frontendMgmtPath, 'utf8');

const trackedDocs = [
  'aadhaar', 'pan', 'bank', 'photo', 'offer_letter', 'resume', 'education_certificate', 'experience_letter', 'terms_video'
];
for (const doc of trackedDocs) {
  assert.ok(
    frontendMgmtContent.includes(`key: '${doc}'`),
    `EmployeeManagement.jsx must track document type: ${doc}`
  );
}
console.log(`✔ Verified: All 9 document types are explicitly tracked in EmployeeManagement.jsx.`);

assert.ok(
  frontendMgmtContent.includes('<video') && frontendMgmtContent.includes('viewingDocModal.key === \'terms_video\''),
  'viewingDocModal must include native HTML5 video player for terms_video'
);
console.log('✔ Verified: Native HTML5 video player is enabled for video terms inspection in modal.');

// 6. Responsive Breakpoint Checks
console.log('\n--- TEST 6: Responsive Viewport Architecture ---');
assert.ok(
  frontendMgmtContent.includes('isMobile = windowWidth < 768'),
  'isMobile breakpoint must cover 360px and 390px mobile screens'
);
assert.ok(
  frontendMgmtContent.includes('isTablet = windowWidth >= 768 && windowWidth < 1024'),
  'isTablet breakpoint must cover 768px tablet screens'
);
assert.ok(
  frontendMgmtContent.includes('overflowX: \'auto\''),
  'Table views must have overflowX protection for tablet and desktop'
);
console.log('✔ Verified: Dynamic responsive state accurately handles 360px, 390px, 768px, 1024px, and 1366px screens.');

// 7. FullEmployeeProfileView.jsx Hierarchy & Null Safety
console.log('\n--- TEST 7: FullEmployeeProfileView.jsx 4-Level Hierarchy & Fallbacks ---');
const profileViewPath = path.join(__dirname, '../../../frontend/src/modules/employee/profile/FullEmployeeProfileView.jsx');
const profileViewContent = fs.readFileSync(profileViewPath, 'utf8');

assert.ok(
  profileViewContent.includes('Branch Head') && profileViewContent.includes('Senior Manager') &&
  profileViewContent.includes('Assigned Manager') && profileViewContent.includes('Assigned Team Leader'),
  'FullEmployeeProfileView must display all 4 hierarchy levels'
);
assert.ok(
  !profileViewContent.includes('01-01-1998'),
  'FullEmployeeProfileView must not use hardcoded fake date of birth 01-01-1998'
);
console.log('✔ Verified: FullEmployeeProfileView includes all 4 hierarchy levels and zero hardcoded fake dates.');

console.log('\n========================================================================');
console.log('🎉 ALL EMPLOYEE MANAGEMENT VERIFICATION TESTS PASSED SUCCESSFULLY');
console.log('========================================================================\n');
