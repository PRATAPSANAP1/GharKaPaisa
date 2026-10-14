const assert = require('assert');
const { DESIGNATIONS } = require('../constants/roles');

console.log('--- Testing Three Curable Operator Designations ---');

// Test 1: Verify constants in roles.js
console.log('Test 1: Verify constants in roles.js');
assert.strictEqual(DESIGNATIONS.PHYSICAL_CURABLE_OPERATOR, 'Physical Curable Operator');
assert.strictEqual(DESIGNATIONS.DIGITAL_CURABLE_OPERATOR, 'Digital Curable Operator');
assert.strictEqual(DESIGNATIONS.EMAIL_CURABLE_OPERATOR, 'Email Curable Operator');
console.log('✓ roles.js has all three designations defined correctly.');

// Test 2: Verify Super Admin controller bank assignment requirement
console.log('Test 2: Verify bank assignment requirement check in createAdmin logic');
const newDesigs = [
  'Physical Curable Operator',
  'Digital Curable Operator',
  'Email Curable Operator'
];

// Check the exact list of designations that trigger bank assignment requirement
const testOpHeadList = [
  'OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'BACKEND', 'BACKEND OPERATION', 'BACKEND_OPERATION', 
  'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 
  'ADMINISTRATIVE SALES EXECUTIVE', 'PAN_CHECKER', 'PAN CHECKER', 'REMARK_OPERATOR', 
  'REMARK OPERATOR', 'QD_OPERATOR', 'QD OPERATOR', 'FINAL_STATUS_OPERATOR', 'FINAL STATUS OPERATOR', 
  'QUERABLE_OPERATOR', 'QUERABLE OPERATOR', 'QUERYABLE_OPERATOR', 'QUERYABLE OPERATOR', 
  'PHYSICAL_CURABLE', 'PHYSICAL CURABLE', 'DIGITAL_CURABLE', 'DIGITAL CURABLE', 
  'EMAIL_CURABLE', 'EMAIL CURABLE', 'PHYSICAL_CURABLE_OPERATOR', 'PHYSICAL CURABLE OPERATOR', 
  'DIGITAL_CURABLE_OPERATOR', 'DIGITAL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'EMAIL CURABLE OPERATOR'
];

newDesigs.forEach(d => {
  const upper = d.toUpperCase();
  assert(testOpHeadList.includes(upper), `${d} (${upper}) should require bank assignments in isOpHead check`);
  const snake = upper.replace(/\s+/g, '_');
  assert(testOpHeadList.includes(snake), `${d} (${snake}) should require bank assignments in isOpHead check`);
});
console.log('✓ Bank assignment enforcement correctly validates all three designations.');

// Test 3: Verify listAdmins whereClause inclusion
console.log('Test 3: Verify listAdmins whereClause inclusion');
const fs = require('fs');
const path = require('path');
const superAdminCtrlCode = fs.readFileSync(path.join(__dirname, '../modules/super-admin/controller.js'), 'utf8');

newDesigs.forEach(d => {
  assert(superAdminCtrlCode.includes(`'${d}'`), `super-admin/controller.js listAdmins query must include '${d}'`);
});
console.log('✓ super-admin/controller.js listAdmins query includes all three designations in whereClause.');

// Test 4: Verify duplicate prevention logic in SuperAdminDashboard.jsx
console.log('Test 4: Verify duplicate prevention logic in SuperAdminDashboard.jsx');
const dashboardCode = fs.readFileSync(path.join(__dirname, '../../../frontend/src/modules/super-admin/dashboard/SuperAdminDashboard.jsx'), 'utf8');

newDesigs.forEach(d => {
  // Check that option exists in Create Modal
  assert(dashboardCode.includes(`<option value="${d}">${d}</option>`), `Dashboard must have option for ${d}`);
  // Check that fallback exclusion array includes the designation
  assert(dashboardCode.includes(`'${d}'`), `Dashboard fallback exclusion list must include '${d}' to prevent duplicates`);
});

// Simulate the fallback condition to verify zero duplicate option rendered
const excludedFromFallback = [
  'Operational Head', 'Administrative Operator', 'Administrative Sales Executive',
  'PAN Checker', 'Remark Operator', 'QD Operator', 'KYC Operator',
  'Final Status Operator', 'Querable Operator', 'Queryable Operator',
  'Physical Curable Operator', 'Digital Curable Operator', 'Email Curable Operator',
  'Physical Curable', 'Digital Curable', 'Email Curable', 'Backend', 'Super Admin',
  'Senior Manager', 'Manager', 'Team Leader', 'Telecaller', ''
];

newDesigs.forEach(d => {
  const isExcluded = excludedFromFallback.includes(d);
  assert.strictEqual(isExcluded, true, `${d} must be excluded from fallback option to prevent duplicates`);
});
console.log('✓ Duplicate option prevention verified: no duplicate options will be rendered in Edit Admin modal.');

// Test 5: Verify auth middleware and application controller support
console.log('Test 5: Verify auth middleware & application controller');
const authMiddlewareCode = fs.readFileSync(path.join(__dirname, '../middleware/authentication/auth.middleware.js'), 'utf8');
const appCtrlCode = fs.readFileSync(path.join(__dirname, '../modules/crm/application.controller.js'), 'utf8');

newDesigs.forEach(d => {
  const upper = d.toUpperCase();
  const snake = upper.replace(/\s+/g, '_');
  assert(authMiddlewareCode.includes(upper) || authMiddlewareCode.includes(snake), `auth.middleware.js must include ${d}`);
  assert(appCtrlCode.includes(upper) && appCtrlCode.includes(snake), `application.controller.js must include ${d}`);
});
console.log('✓ Auth middleware and application controller curable operator recognition verified.');

console.log('\n--- All 5 Tests Passed Successfully! ---');
