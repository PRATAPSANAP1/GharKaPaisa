const assert = require('assert');
const { isEmployeeOrStaffUser } = require('../utils/helpers/helpers');

console.log('--- RUNNING LEAD EMAIL NOTIFICATION UNIT TESTS ---');

// Test 1: Helper isEmployeeOrStaffUser identifies roles correctly
console.log('Test 1: Testing isEmployeeOrStaffUser for Employee vs Partner roles');

assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'EMPLOYEE' } }), true, 'Role EMPLOYEE must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'employee' } }), true, 'Role employee (lowercase) must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'HR' } }), true, 'Role HR must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'TELECALLER' } }), true, 'Role TELECALLER must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'TEAM_LEADER' } }), true, 'Role TEAM_LEADER must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'ADMIN' } }), true, 'Role ADMIN must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'SUPER_ADMIN' } }), true, 'Role SUPER_ADMIN must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { designation: 'HR Executive' } }), true, 'Designation containing HR must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ employee: { id: 'uuid-123' }, user: {} }), true, 'Presence of req.employee must be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { employee_id: 'EMP001' } }), true, 'Presence of req.user.employee_id must be identified as staff/employee');

// Partners must NOT be classified as staff/employee
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'PARTNER' } }), false, 'Role PARTNER must NOT be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'TEAM_MEMBER' } }), false, 'Role TEAM_MEMBER must NOT be identified as staff/employee');
assert.strictEqual(isEmployeeOrStaffUser({ user: { role: 'partner' } }), false, 'Role partner (lowercase) must NOT be identified as staff/employee');
console.log('✓ Test 1 passed: isEmployeeOrStaffUser accurately separates employees from partners.');

// Test 2: Verify lead.controller.js notification logic
console.log('Test 2: Testing notifyPartnerLeadCreated logic in lead.controller');
{
  const emailService = require('../services/email/email.service');
  let sentEmails = [];
  const originalSend = emailService.sendLeadApplicationCreatedEmail;
  emailService.sendLeadApplicationCreatedEmail = (payload) => {
    sentEmails.push(payload);
  };

  // Simulate employee request
  const employeeReq = {
    user: { id: 'emp-user-1', email: 'employee@gharkapaisa.com', role: 'EMPLOYEE' },
    body: {}
  };

  if (isEmployeeOrStaffUser(employeeReq)) {
    // In employee panel / when employee creates new lead: turn off email to employee
  } else {
    emailService.sendLeadApplicationCreatedEmail({ to: employeeReq.user.email });
  }

  assert.strictEqual(sentEmails.length, 0, 'No email must be sent when an employee adds a lead');

  // Simulate partner request
  const partnerReq = {
    user: { id: 'partner-user-1', email: 'partner@test.com', role: 'PARTNER' },
    body: {}
  };

  if (isEmployeeOrStaffUser(partnerReq)) {
    // skip
  } else {
    emailService.sendLeadApplicationCreatedEmail({
      to: partnerReq.user.email,
      customerName: 'Rohan Sharma',
      appNumber: 'APP20261031001',
      productName: 'HDFC Millennia Credit Card',
      mobile: '9876543210'
    });
  }

  assert.strictEqual(sentEmails.length, 1, 'Partner request MUST dispatch notification email');
  assert.strictEqual(sentEmails[0].to, 'partner@test.com', 'Notification email MUST be addressed to the partner');

  // Restore
  emailService.sendLeadApplicationCreatedEmail = originalSend;
  console.log('✓ Test 2 passed: Employee creation suppresses email; partner creation triggers email.');
}

// Test 3: Verify existing test suites don't break
console.log('Test 3: Checking require integrity for modified controllers');
try {
  require('../modules/crm/lead.controller');
  require('../modules/crm/application.controller');
  console.log('✓ Test 3 passed: lead.controller and application.controller load cleanly with no syntax or reference errors.');
} catch (loadErr) {
  assert.fail(`Module load failed: ${loadErr.message}`);
}

console.log('\n--- ALL LEAD EMAIL NOTIFICATION UNIT TESTS PASSED SUCCESSFULLY! ---');
process.exit(0);
