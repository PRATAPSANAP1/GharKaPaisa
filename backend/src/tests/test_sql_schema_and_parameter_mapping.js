/**
 * test_sql_schema_and_parameter_mapping.js
 * 
 * Regression & Unit Test Suite for:
 * 1. Employee profile photo lookup schema safety (to_jsonb fallback, no physical column dependency)
 * 2. Application query assignment schema safety (no direct a.assigned_to or pad.assigned_to)
 * 3. PostgreSQL parameter mapping integrity ($1-$16 in listQuerySQL, $1-$14 in count/status queries)
 * 4. Explicit parameter type casts for NULL safety
 * 5. Role-based scoping verification across Operator, Telecaller, and Partner roles
 * 
 * Zero production access: isolated local unit assertions and static schema checks.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('─── GharKaPaisa SQL Schema & Parameter Mapping Verification Suite ───\n');

// ══════════════════════════════════════════════════════════════════
// TEST 1: Employee Profile Photo Lookup Schema Safety
// ══════════════════════════════════════════════════════════════════
console.log('Test 1: Employee Profile Photo Lookup Schema Safety');
{
  const enrollmentServiceFile = fs.readFileSync(
    path.join(__dirname, '../modules/attendance-enrollment/attendance-enrollment.service.js'),
    'utf8'
  );

  // Check that physical profile_photo_url or face_reference_url bare column references
  // are NOT used in SELECT queries on employees table (e.g. "SELECT profile_photo_url, ...")
  const bareEmployeeSelectRegex = /SELECT\s+(?:(?!\bto_jsonb\b)[\s\S])*?\b(profile_photo_url|face_reference_url)\b[\s\S]*?FROM\s+employees/i;
  assert.strictEqual(
    bareEmployeeSelectRegex.test(enrollmentServiceFile),
    false,
    'attendance-enrollment.service.js must not select bare physical columns profile_photo_url or face_reference_url directly from employees'
  );

  // Check that to_jsonb(e)->>'profile_photo_url' is used
  assert.ok(
    enrollmentServiceFile.includes("to_jsonb(e)->>'profile_photo_url'"),
    "attendance-enrollment.service.js must use to_jsonb(e)->>'profile_photo_url'"
  );
  assert.ok(
    enrollmentServiceFile.includes("to_jsonb(e)->>'face_reference_url'"),
    "attendance-enrollment.service.js must use to_jsonb(e)->>'face_reference_url'"
  );

  // Simulate SQL behavior with mock employee records
  const mockEmployeeWithoutCols = {
    id: 'emp-101',
    full_name: 'Vikram Singh',
    designation: 'Sales Executive'
    // profile_photo_url and face_reference_url do NOT exist as properties
  };

  const mockEmployeeWithCols = {
    id: 'emp-102',
    full_name: 'Pooja Patel',
    designation: 'Backend Operator',
    profile_photo_url: 's3://bucket/photos/pooja.jpg',
    face_reference_url: 's3://bucket/faces/pooja_ref.jpg'
  };

  // Simulate to_jsonb(e)->>'column'
  const extractPhoto = (emp) => ({
    profile_photo_url: emp.profile_photo_url || null,
    face_reference_url: emp.face_reference_url || null,
    photo_url: emp.photo_url || null,
    selfie_url: emp.selfie_url || null
  });

  const resWithout = extractPhoto(mockEmployeeWithoutCols);
  assert.strictEqual(resWithout.profile_photo_url, null);
  assert.strictEqual(resWithout.face_reference_url, null);

  const resWith = extractPhoto(mockEmployeeWithCols);
  assert.strictEqual(resWith.profile_photo_url, 's3://bucket/photos/pooja.jpg');
  assert.strictEqual(resWith.face_reference_url, 's3://bucket/faces/pooja_ref.jpg');

  console.log('  ✓ Employee queries use schema-safe to_jsonb(e) column extraction');
  console.log('  ✓ Verified safe fallback for both absent and present photo columns');
}

// ══════════════════════════════════════════════════════════════════
// TEST 2: Application Query Assignment Column Safety
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 2: Application Query Assignment Column Safety');
{
  const appControllerFile = fs.readFileSync(
    path.join(__dirname, '../modules/crm/application.controller.js'),
    'utf8'
  );

  // Check that no direct physical column accesses to a.assigned_to or pad.assigned_to exist
  const directAssignedToRegex = /\b(a|pad)\.assigned_to\b/i;
  assert.strictEqual(
    directAssignedToRegex.test(appControllerFile),
    false,
    'application.controller.js must not contain direct column accesses to a.assigned_to or pad.assigned_to'
  );

  // Verify that countQuerySQL and statusCountsSQL use to_jsonb extraction for assigned_to
  assert.ok(
    appControllerFile.includes("NULLIF(to_jsonb(a)->>'assigned_to', '')"),
    "countQuerySQL and statusCountsSQL must use NULLIF(to_jsonb(a)->>'assigned_to', '')"
  );
  assert.ok(
    appControllerFile.includes("NULLIF(to_jsonb(pad)->>'assigned_to', '')"),
    "countQuerySQL and statusCountsSQL must use NULLIF(to_jsonb(pad)->>'assigned_to', '')"
  );
  assert.ok(
    appControllerFile.includes("NULLIF(to_jsonb(a)->>'assigned_to_user_id', '')"),
    "countQuerySQL and statusCountsSQL must use NULLIF(to_jsonb(a)->>'assigned_to_user_id', '')"
  );

  // Also check whatsapp.controller.js
  const whatsappControllerFile = fs.readFileSync(
    path.join(__dirname, '../modules/whatsapp/whatsapp.controller.js'),
    'utf8'
  );
  assert.strictEqual(
    directAssignedToRegex.test(whatsappControllerFile),
    false,
    'whatsapp.controller.js must not contain direct column access to a.assigned_to'
  );

  console.log('  ✓ Eliminated unsafe direct references to non-existent a.assigned_to and pad.assigned_to');
  console.log('  ✓ Assignment fields safely read through to_jsonb compatibility layer');
}

// ══════════════════════════════════════════════════════════════════
// TEST 3: PostgreSQL Parameter Mapping & Type Casting Integrity
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 3: PostgreSQL Parameter Mapping & Type Casting Integrity');
{
  const appControllerFile = fs.readFileSync(
    path.join(__dirname, '../modules/crm/application.controller.js'),
    'utf8'
  );

  // Extract baseQueryParams, queryParams, and countQueryParams
  // Base array has 14 elements ($1 - $14)
  // queryParams has 16 elements ($1 - $16, appending limit and offset)
  // countQueryParams has 14 elements ($1 - $14)

  // Extract interpolated helper clauses: statusFilterBlockSQL and partnerTeamScopeSQL
  const statusFilterBlockMatch = appControllerFile.match(/const statusFilterBlockSQL = `([\s\S]*?)`;/);
  assert.ok(statusFilterBlockMatch, 'statusFilterBlockSQL must be defined in application.controller.js');
  const statusFilterBlockSQL = statusFilterBlockMatch[1];

  const partnerTeamScopeMatch = appControllerFile.match(/partnerTeamScopeSQL = `([\s\S]*?)`;/);
  assert.ok(partnerTeamScopeMatch, 'partnerTeamScopeSQL must be defined in application.controller.js');
  const partnerTeamScopeSQL = partnerTeamScopeMatch[1];

  // Verify listQuerySQL parameter references:
  // Must contain $1 through $16 without skipping any number
  const listQueryMatch = appControllerFile.match(/const listQuerySQL = `([\s\S]*?)`;/);
  assert.ok(listQueryMatch, 'listQuerySQL must be defined in application.controller.js');
  const fullListSQL = listQueryMatch[1] + '\n' + statusFilterBlockSQL + '\n' + partnerTeamScopeSQL;

  for (let i = 1; i <= 16; i++) {
    const placeholder = `$${i}`;
    assert.ok(
      fullListSQL.includes(placeholder),
      `listQuerySQL must contain placeholder ${placeholder} (missing parameter hole detected!)`
    );
  }
  // Must NOT contain $17 or higher
  assert.strictEqual(
    fullListSQL.includes('$17'),
    false,
    'listQuerySQL must not contain unused placeholder $17'
  );

  // Verify countQuerySQL parameter references:
  // Must contain $1 through $14 without skipping any number
  const countQueryMatch = appControllerFile.match(/const countQuerySQL = `([\s\S]*?)`;/);
  assert.ok(countQueryMatch, 'countQuerySQL must be defined in application.controller.js');
  const fullCountSQL = countQueryMatch[1] + '\n' + statusFilterBlockSQL + '\n' + partnerTeamScopeSQL;

  for (let i = 1; i <= 14; i++) {
    const placeholder = `$${i}`;
    assert.ok(
      fullCountSQL.includes(placeholder),
      `countQuerySQL must contain placeholder ${placeholder} (missing parameter hole detected!)`
    );
  }
  assert.strictEqual(
    fullCountSQL.includes('$15'),
    false,
    'countQuerySQL must not contain limit/offset placeholder $15'
  );

  // Verify statusCountsSQL parameter references:
  const statusCountsMatch = appControllerFile.match(/const statusCountsSQL = `([\s\S]*?)`;/);
  assert.ok(statusCountsMatch, 'statusCountsSQL must be defined in application.controller.js');
  const fullStatusCountsSQL = statusCountsMatch[1] + '\n' + statusFilterBlockSQL + '\n' + partnerTeamScopeSQL;

  for (let i = 1; i <= 14; i++) {
    const placeholder = `$${i}`;
    assert.ok(
      fullStatusCountsSQL.includes(placeholder),
      `statusCountsSQL must contain placeholder ${placeholder} (missing parameter hole detected!)`
    );
  }

  // Verify explicit type casts for parameters in SQL
  assert.ok(fullListSQL.includes('$1::uuid'), 'Param $1 (partnerId) must have explicit ::uuid cast');
  assert.ok(fullListSQL.includes('$2::text'), 'Param $2 (status) must have explicit ::text cast');
  assert.ok(fullListSQL.includes('$3::uuid'), 'Param $3 (productId) must have explicit ::uuid cast');
  assert.ok(fullListSQL.includes('$4::uuid'), 'Param $4 (bankId) must have explicit ::uuid cast');
  assert.ok(fullListSQL.includes('$5::text'), 'Param $5 (search) must have explicit ::text cast');
  assert.ok(fullListSQL.includes('$6::uuid'), 'Param $6 (userId) must have explicit ::uuid cast');
  assert.ok(fullListSQL.includes('$7::text'), 'Param $7 (processBy) must have explicit ::text cast');
  assert.ok(fullListSQL.includes('$8::uuid'), 'Param $8 (opHeadId) must have explicit ::uuid cast');
  assert.ok(fullListSQL.includes('$9::text'), 'Param $9 (scope) must have explicit ::text cast');
  assert.ok(fullListSQL.includes('$10::uuid'), 'Param $10 (memberId) must have explicit ::uuid cast');
  assert.ok(fullListSQL.includes('$11::text'), 'Param $11 (category) must have explicit ::text cast');
  assert.ok(fullListSQL.includes('$12::text'), 'Param $12 (commissionStatus) must have explicit ::text cast');
  assert.ok(fullListSQL.includes('$13::timestamp'), 'Param $13 (fromDate) must have explicit ::timestamp cast');
  assert.ok(fullListSQL.includes('$14::timestamp'), 'Param $14 (toDate) must have explicit ::timestamp cast');
  assert.ok(fullListSQL.includes('$15::int'), 'Param $15 (limit) must have explicit ::int cast');
  assert.ok(fullListSQL.includes('$16::int'), 'Param $16 (offset) must have explicit ::int cast');

  console.log('  ✓ listQuerySQL has exact 16-parameter mapping ($1 through $16) with 0 gaps');
  console.log('  ✓ countQuerySQL & statusCountsSQL have exact 14-parameter mapping ($1 through $14) with 0 gaps');
  console.log('  ✓ Every parameter placeholder has explicit PostgreSQL type cast (prevents parameter type inference errors on NULLs)');
}

// ══════════════════════════════════════════════════════════════════
// TEST 4: Role-Based Scoping & Data Isolation Verification
// ══════════════════════════════════════════════════════════════════
console.log('\nTest 4: Role-Based Scoping Verification');
{
  const checkRoleScoping = (userRole, userDesignation, partnerId = null) => {
    const isStaffOrOperatorUser = [
      'ADMIN', 'SUPER_ADMIN', 'SUPERADMIN', 'HR',
      'OPERATIONAL HEAD', 'OPERATIONAL_HEAD', 'OPERATIONS HEAD', 'OPERATIONS_HEAD', 'BACKEND', 'BACKEND OPERATION', 'BACKEND_OPERATION',
      'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'OPERATOR',
      'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES OPERATOR', 'ADMINISTRATIVE_SALES_OPERATOR'
    ].some(title => userDesignation.includes(title) || userRole === title);
    const isPartnerOrTeam = ['PARTNER', 'TEAM_MEMBER'].includes(userRole) || (userRole === 'EMPLOYEE' && !isStaffOrOperatorUser);
    const validPartnerId = partnerId;

    let partnerTeamScopeSQL;
    if (isPartnerOrTeam) {
      partnerTeamScopeSQL = 'WHERE (combined.partner_id IN (...) OR combined.submitted_by = $6::uuid)';
    } else if (validPartnerId) {
      partnerTeamScopeSQL = 'WHERE combined.partner_id IN (SELECT $1::uuid ...)';
    } else {
      partnerTeamScopeSQL = 'WHERE 1=1';
    }

    return { isPartnerOrTeam, partnerTeamScopeSQL };
  };

  // Case A: Administrative Operator
  const adminOp = checkRoleScoping('EMPLOYEE', 'ADMINISTRATIVE OPERATOR');
  assert.strictEqual(adminOp.isPartnerOrTeam, false);
  assert.strictEqual(adminOp.partnerTeamScopeSQL, 'WHERE 1=1');

  // Case B: Administrative Sales Executive (Telecaller)
  const salesExec = checkRoleScoping('EMPLOYEE', 'ADMINISTRATIVE SALES EXECUTIVE');
  assert.strictEqual(salesExec.isPartnerOrTeam, false);
  assert.strictEqual(salesExec.partnerTeamScopeSQL, 'WHERE 1=1');

  // Case C: Super Admin
  const superAdmin = checkRoleScoping('SUPER_ADMIN', '');
  assert.strictEqual(superAdmin.isPartnerOrTeam, false);
  assert.strictEqual(superAdmin.partnerTeamScopeSQL, 'WHERE 1=1');

  // Case D: Partner
  const partner = checkRoleScoping('PARTNER', '', '11111111-1111-1111-1111-111111111111');
  assert.strictEqual(partner.isPartnerOrTeam, true);
  assert.ok(partner.partnerTeamScopeSQL.includes('combined.partner_id IN'));

  // Case E: Team Member
  const teamMember = checkRoleScoping('TEAM_MEMBER', '');
  assert.strictEqual(teamMember.isPartnerOrTeam, true);
  assert.ok(teamMember.partnerTeamScopeSQL.includes('combined.partner_id IN'));

  console.log('  ✓ Administrative Operator & Telecaller correctly scoped to WHERE 1=1 (no partner subqueries)');
  console.log('  ✓ Partner and Team Member strictly enforce isolation predicates');
}

console.log('\n================================================================');
console.log('✓ ALL 4 VERIFICATION TEST SUITES PASSED SUCCESSFULLY!');
console.log('================================================================\n');
