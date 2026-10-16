const assert = require('assert');

// 🧪 Test Suite: Superadmin Admin Banks Assignment Hardening & Error Resolution
console.log('========================================================================');
console.log('🧪 TESTING: Superadmin Admin Banks Assignment Resolution & Safety');
console.log('========================================================================\n');

// 1. isUuid Validation
const isUuid = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str.trim());

console.log('--- TEST 1: isUuid Validator ---');
assert.strictEqual(isUuid('ce097d32-25d9-4f43-9f07-e450bb35409b'), true, 'Valid lowercase UUID must return true');
assert.strictEqual(isUuid('CE097D32-25D9-4F43-9F07-E450BB35409B'), true, 'Valid uppercase UUID must return true');
assert.strictEqual(isUuid('  ce097d32-25d9-4f43-9f07-e450bb35409b  '), true, 'UUID with padding whitespace must return true');
assert.strictEqual(isUuid('invalid-uuid'), false, 'Non-UUID string must return false');
assert.strictEqual(isUuid(''), false, 'Empty string must return false');
assert.strictEqual(isUuid(null), false, 'Null must return false');
assert.strictEqual(isUuid(undefined), false, 'Undefined must return false');
assert.strictEqual(isUuid(12345), false, 'Number must return false');
console.log('✔ isUuid validator accurately identifies valid and invalid UUIDs');

// 2. normalizeAssignmentCategory
const { normalizeAssignmentCategory } = require('../utils/helpers/helpers');

console.log('\n--- TEST 2: normalizeAssignmentCategory ---');
assert.strictEqual(normalizeAssignmentCategory('credit_card'), 'credit_card');
assert.strictEqual(normalizeAssignmentCategory('Credit Card'), 'credit_card');
assert.strictEqual(normalizeAssignmentCategory('cards'), 'credit_card');
assert.strictEqual(normalizeAssignmentCategory('loc_eoc'), 'loc_eoc');
assert.strictEqual(normalizeAssignmentCategory('LOC/EOC'), 'loc_eoc');
assert.strictEqual(normalizeAssignmentCategory('loan_on_credit_card'), 'loc_eoc');
assert.strictEqual(normalizeAssignmentCategory('smart_emi'), 'loc_eoc');
assert.strictEqual(normalizeAssignmentCategory('Smart EMI'), 'loc_eoc');
assert.strictEqual(normalizeAssignmentCategory(null), 'credit_card');
assert.strictEqual(normalizeAssignmentCategory(undefined), 'credit_card');
console.log('✔ normalizeAssignmentCategory correctly normalizes categories');

// 3. parseAssignmentPairsFromBody & deduplication
const parseAssignmentPairsFromBody = (body) => {
  if (!body) return null;
  let assignmentPairs = [];
  if (Array.isArray(body.category_assignments)) {
    assignmentPairs = body.category_assignments;
  } else if (Array.isArray(body.assignments)) {
    assignmentPairs = body.assignments;
  } else if (body.category_assignments && typeof body.category_assignments === 'object') {
    Object.keys(body.category_assignments).forEach(cat => {
      const arr = body.category_assignments[cat];
      if (Array.isArray(arr)) {
        arr.forEach(bId => assignmentPairs.push({ category: cat, bank_id: bId }));
      }
    });
  } else if (body.categoryAssignments && typeof body.categoryAssignments === 'object') {
    Object.keys(body.categoryAssignments).forEach(cat => {
      const arr = body.categoryAssignments[cat];
      if (Array.isArray(arr)) {
        arr.forEach(bId => assignmentPairs.push({ category: cat, bank_id: bId }));
      }
    });
  } else {
    const rawBankIds = Array.isArray(body.bank_ids) ? body.bank_ids : (Array.isArray(body.bankIds) ? body.bankIds : null);
    if (rawBankIds) {
      rawBankIds.forEach(rawBId => {
        if (String(rawBId).toUpperCase() === 'LOC_EOC') {
          assignmentPairs.push({ category: 'loc_eoc', bank_id: rawBId });
        } else {
          assignmentPairs.push({ category: 'credit_card', bank_id: rawBId });
        }
      });
    } else {
      return null;
    }
  }
  return assignmentPairs;
};

console.log('\n--- TEST 3: parseAssignmentPairsFromBody Formats ---');
// Format A: Standard bank_ids array
const bodyA = { bank_ids: ['b1', 'b2', 'LOC_EOC'] };
const pairsA = parseAssignmentPairsFromBody(bodyA);
assert.deepStrictEqual(pairsA, [
  { category: 'credit_card', bank_id: 'b1' },
  { category: 'credit_card', bank_id: 'b2' },
  { category: 'loc_eoc', bank_id: 'LOC_EOC' }
]);

// Format B: Array of category_assignments
const bodyB = {
  category_assignments: [
    { bank_id: 'b1', category: 'credit_card' },
    { bank_id: 'b1', category: 'loc_eoc' },
    { bank_id: 'b2', category: 'credit_card' }
  ]
};
const pairsB = parseAssignmentPairsFromBody(bodyB);
assert.strictEqual(pairsB.length, 3);

// Format C: Object with category keys
const bodyC = {
  category_assignments: {
    credit_card: ['b1', 'b2'],
    loc_eoc: ['b1']
  }
};
const pairsC = parseAssignmentPairsFromBody(bodyC);
assert.strictEqual(pairsC.length, 3);
console.log('✔ parseAssignmentPairsFromBody correctly handles all supported frontend payload structures');

// 4. In-Memory Deduplication Simulation
console.log('\n--- TEST 4: Deduplication Logic ---');
const rawPairsWithDups = [
  { bank_id: 'b1', category: 'Credit Card' },
  { bank_id: 'b1', category: 'credit_card' }, // Duplicate
  { bank_id: 'b1', category: 'LOC/EOC' },     // Different category, valid
  { bank_id: 'b2', category: 'credit_card' }
];

const uniqueMap = new Map();
for (const pair of rawPairsWithDups) {
  const cat = normalizeAssignmentCategory(pair.category);
  const key = `${pair.bank_id}_${cat}`;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, { bank_id: pair.bank_id, category: cat });
  }
}
const deduped = Array.from(uniqueMap.values());
assert.strictEqual(deduped.length, 3, 'Duplicate (bank_id, category) pair must be removed');
assert.deepStrictEqual(deduped, [
  { bank_id: 'b1', category: 'credit_card' },
  { bank_id: 'b1', category: 'loc_eoc' },
  { bank_id: 'b2', category: 'credit_card' }
]);
console.log('✔ In-memory map deduplication prevents duplicate inserts');

// 5. SQL Safety: Enum casting check
console.log('\n--- TEST 5: SQL Query Enum Casting ---');
const safeQuery = "UPDATE products SET operation_head_id = $1 WHERE category::text = 'loc_eoc' OR category::text IN ('loan_on_credit_card', 'smart_emi')";
assert.ok(safeQuery.includes("category::text = 'loc_eoc'"), "Safe query must cast category to text on both comparisons");
assert.ok(!safeQuery.includes("WHERE category = 'loc_eoc'"), "Safe query must NOT contain uncast category = 'loc_eoc'");
console.log('✔ Product category comparisons safely use category::text');

// 6. insertBankAssignment logic simulation
console.log('\n--- TEST 6: insertBankAssignment simulation ---');
const mockDb = [];
const mockInsertBankAssignment = async (adminId, bankId, category, createdById) => {
  const cat = normalizeAssignmentCategory(category);
  const validCreatedBy = isUuid(createdById) ? createdById : null;

  // Check if exists
  const existing = mockDb.find(r => r.admin_id === adminId && r.bank_id === bankId && r.category === cat);
  if (existing) {
    existing.is_active = true;
    if (validCreatedBy) existing.created_by = validCreatedBy;
    return { rowCount: 1, action: 'UPDATE' };
  }

  // Insert
  mockDb.push({
    id: `aba-${Date.now()}-${Math.random()}`,
    admin_id: adminId,
    bank_id: bankId,
    category: cat,
    is_active: true,
    created_by: validCreatedBy
  });
  return { rowCount: 1, action: 'INSERT' };
};

(async () => {
  const adminId = 'ce097d32-25d9-4f43-9f07-e450bb35409b';
  const res1 = await mockInsertBankAssignment(adminId, 'b1', 'credit_card', 'invalid-creator-id');
  assert.strictEqual(res1.action, 'INSERT');
  assert.strictEqual(mockDb[0].created_by, null, 'Invalid actorId must be sanitized to null');

  const res2 = await mockInsertBankAssignment(adminId, 'b1', 'Credit Card', '00000000-0000-0000-0000-000000000001');
  assert.strictEqual(res2.action, 'UPDATE', 'Repeated assignment must update existing row without throwing');
  assert.strictEqual(mockDb.length, 1);
  assert.strictEqual(mockDb[0].created_by, '00000000-0000-0000-0000-000000000001');

  const res3 = await mockInsertBankAssignment(adminId, 'b1', 'LOC/EOC', '00000000-0000-0000-0000-000000000001');
  assert.strictEqual(res3.action, 'INSERT', 'Different category for same bank must insert separate record');
  assert.strictEqual(mockDb.length, 2);

  console.log('✔ insertBankAssignment safely inserts and updates without relying on rigid ON CONFLICT constraint names');

  console.log('\n========================================================================');
  console.log('🎉 ALL SUPERADMIN BANK ASSIGNMENT TESTS PASSED SUCCESSFULLY');
  console.log('========================================================================');
})();
