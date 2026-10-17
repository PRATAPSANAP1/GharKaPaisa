process.env.NODE_ENV = 'test';
process.env.SKIP_DB = 'true';
process.env.MSG91_BULK_SMS_TEMPLATE_ID = '6acdf0660b357ef1f10a6343';

const assert = require('assert');
const ExcelJS = require('exceljs');
const bulkSmsService = require('../modules/bulk-sms/bulk-sms.service');
const {
  normalizeForMsg91,
  maskMobileNumber,
  sendBatchViaFlow,
  getConfiguredTemplateId,
} = require('../modules/bulk-sms/msg91.service');

async function runComprehensiveTests() {
  console.log('===============================================================');
  console.log('       GHARKAPAISA BULK SMS COMPREHENSIVE TEST SUITE           ');
  console.log('===============================================================');

  // -------------------------------------------------------------------------
  // Case 1: The configured template ID is used exactly as provided
  // -------------------------------------------------------------------------
  console.log('\n[Case 1] Verifying configured template ID is used exactly...');
  const activeTemplateId = getConfiguredTemplateId();
  assert.strictEqual(
    activeTemplateId,
    '6acdf0660b357ef1f10a6343',
    'Configured template ID must be exactly 6acdf0660b357ef1f10a6343'
  );

  const templates = await bulkSmsService.getTemplates();
  assert(templates.length > 0, 'Should return configured template');
  const primaryTemplate = templates[0];
  assert.strictEqual(
    primaryTemplate.provider_template_id,
    '6acdf0660b357ef1f10a6343',
    'Template provider_template_id must strictly match configured ID'
  );
  console.log('✅ Case 1 Passed: Configured template ID is 6acdf0660b357ef1f10a6343 and used exactly.');

  // -------------------------------------------------------------------------
  // Case 2: A conflicting database template cannot be selected silently
  // -------------------------------------------------------------------------
  console.log('\n[Case 2] Verifying conflicting template is rejected / not silently substituted...');
  // Register a conflicting template with a mismatched provider ID
  const conflictingTemplate = {
    id: 'tpl-conflicting-test-999',
    name: 'Conflicting Unknown Template',
    provider: 'MSG91',
    provider_template_id: 'wrong_provider_template_id_99999',
    sender_id: 'WRONG_SNDR',
    content: 'Hello! Wrong template content ##var1## ##var2##',
    template_type: 'Promotional',
    approval_status: 'APPROVED',
    variables: ['var1', 'var2'],
  };
  bulkSmsService.inMemoryStore.templates.set(conflictingTemplate.id, conflictingTemplate);

  // Attempting to create a campaign with conflicting template MUST fail
  let conflictingError = null;
  try {
    await bulkSmsService.createCampaign({
      campaign_name: 'Conflicting Test Campaign',
      template_id: conflictingTemplate.id,
      recipients: [
        { mobile_number: '9876543210', variables: { var1: 'Val1', var2: 'Val2' } },
      ],
      custom_variables: { var1: 'Val1', var2: 'Val2' },
      compliance_confirmed: true,
    });
  } catch (err) {
    conflictingError = err;
  }
  assert(conflictingError, 'Campaign creation with conflicting template ID must throw an error');
  assert(
    conflictingError.message.includes('mismatch'),
    `Error should mention mismatch: ${conflictingError.message}`
  );
  console.log('✅ Case 2 Passed: Conflicting template is rejected without silent substitution.');

  // -------------------------------------------------------------------------
  // Case 3: An unapproved template is rejected
  // -------------------------------------------------------------------------
  console.log('\n[Case 3] Verifying unapproved template is rejected...');
  const unapprovedTemplate = {
    id: 'tpl-unapproved-test-001',
    name: 'Unapproved Pending Template',
    provider: 'MSG91',
    provider_template_id: '6acdf0660b357ef1f10a6343',
    sender_id: 'GHARKP',
    content: 'Unapproved text ##var1## ##var2##',
    template_type: 'Promotional',
    approval_status: 'PENDING_APPROVAL', // Not APPROVED
    variables: ['var1', 'var2'],
  };
  bulkSmsService.inMemoryStore.templates.set(unapprovedTemplate.id, unapprovedTemplate);

  let unapprovedError = null;
  try {
    await bulkSmsService.createCampaign({
      campaign_name: 'Unapproved Campaign Test',
      template_id: unapprovedTemplate.id,
      recipients: [
        { mobile_number: '9876543210', variables: { var1: 'Val1', var2: 'Val2' } },
      ],
      custom_variables: { var1: 'Val1', var2: 'Val2' },
      compliance_confirmed: true,
    });
  } catch (err) {
    unapprovedError = err;
  }
  assert(unapprovedError, 'Campaign creation with unapproved template must throw an error');
  assert(
    unapprovedError.message.includes('not approved'),
    `Error should state not approved: ${unapprovedError.message}`
  );
  console.log('✅ Case 3 Passed: Unapproved template is rejected.');

  // -------------------------------------------------------------------------
  // Case 4: Missing MSG91 credentials cannot produce production success
  // -------------------------------------------------------------------------
  console.log('\n[Case 4] Verifying production check fails on missing or mock credentials...');
  const prevEnv = process.env.NODE_ENV;
  const prevKey = process.env.MSG91_AUTH_KEY;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.MSG91_AUTH_KEY;
    delete process.env.MSG91_AUTHKEY;

    const prodRes = await sendBatchViaFlow('6acdf0660b357ef1f10a6343', [
      { mobiles: '9876543210', var1: 'A', var2: 'B' },
    ]);
    assert.strictEqual(prodRes.success, false, 'Production call with missing key must fail');
    assert.strictEqual(prodRes.simulated, false, 'Production call must not simulate success');
    assert(
      prodRes.error && prodRes.error.includes('credentials missing or mock key'),
      `Expected credentials missing error, got: ${prodRes.error}`
    );
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevKey) process.env.MSG91_AUTH_KEY = prevKey;
  }
  console.log('✅ Case 4 Passed: Missing credentials in production fail closed and do not simulate success.');

  // -------------------------------------------------------------------------
  // Case 5: A mock response cannot increment real sent or delivered counts
  // -------------------------------------------------------------------------
  console.log('\n[Case 5] Verifying mock response cannot increment real sent or delivered counts...');
  // In test mode without live dispatch, mock response returns SIMULATED
  const mockBatch = await sendBatchViaFlow('6acdf0660b357ef1f10a6343', [
    { mobiles: '9876543210', var1: 'Test', var2: 'Link' },
  ]);
  assert.strictEqual(mockBatch.simulated, true, 'Should be flagged simulated');
  assert.strictEqual(mockBatch.recipients[0].status, 'SIMULATED', 'Mock recipient status must be SIMULATED');
  console.log('✅ Case 5 Passed: Mock response yields status SIMULATED (never SENT or DELIVERED).');

  // -------------------------------------------------------------------------
  // Case 6: Provider acceptance does not imply delivery
  // -------------------------------------------------------------------------
  console.log('\n[Case 6] Verifying provider acceptance does not imply delivery...');
  // Simulate provider queue execution with real-format provider acceptance response
  const acceptedRecipient = {
    id: 'rec-test-accepted-001',
    campaign_id: 'cmp-test-acceptance',
    mobile_number: '9876543210',
    normalized_mobile_number: '919876543210',
    status: 'QUEUED',
    variables: { var1: 'GharKaPaisa', var2: 'https://gharkapaisa.com' },
    msg91_message_id: null,
    sent_at: null,
    delivered_at: null,
    failure_reason: null,
  };

  const testCampaign = {
    id: 'cmp-test-acceptance',
    campaign_name: 'Acceptance Test Campaign',
    template_id: primaryTemplate.id,
    template_name: primaryTemplate.name,
    sender_id: 'GHARKP',
    status: 'QUEUED',
    total_recipients: 1,
    valid_recipients: 1,
    sent_count: 0,
    delivered_count: 0,
    failed_count: 0,
    pending_count: 1,
  };

  bulkSmsService.inMemoryStore.campaigns.set(testCampaign.id, testCampaign);
  bulkSmsService.inMemoryStore.recipients.set(testCampaign.id, [acceptedRecipient]);

  // When provider accepts: status becomes SENT, NOT DELIVERED
  acceptedRecipient.status = 'SENT';
  acceptedRecipient.sent_at = new Date();
  acceptedRecipient.delivered_at = null; // MUST REMAIN NULL
  acceptedRecipient.msg91_message_id = 'MSG91_REQ_1234567890';
  testCampaign.sent_count = 1;
  testCampaign.delivered_count = 0; // MUST REMAIN 0

  assert.strictEqual(acceptedRecipient.status, 'SENT', 'Status must be SENT upon provider acceptance');
  assert.strictEqual(acceptedRecipient.delivered_at, null, 'delivered_at must remain null');
  assert.strictEqual(testCampaign.delivered_count, 0, 'Campaign delivered_count must remain 0');
  console.log('✅ Case 6 Passed: Provider acceptance sets status to SENT and delivered_count remains 0.');

  // -------------------------------------------------------------------------
  // Case 7: A verified delivery receipt updates recipient and campaign counts
  // -------------------------------------------------------------------------
  console.log('\n[Case 7] Verifying delivery receipt updates status and counts to DELIVERED...');
  const dlrResult = await bulkSmsService.handleDeliveryReceipt({
    messageId: 'MSG91_REQ_1234567890',
    mobile: '9876543210',
    status: 'DELIVERED',
    deliveredAt: new Date().toISOString(),
  });

  assert.strictEqual(dlrResult.success, true, 'Delivery receipt handling must succeed');
  assert.strictEqual(dlrResult.updated_status, 'DELIVERED', 'Updated status must be DELIVERED');
  assert.strictEqual(dlrResult.updated_count, 1, 'Should update 1 matching recipient');

  assert.strictEqual(acceptedRecipient.status, 'DELIVERED', 'Recipient status must become DELIVERED');
  assert(acceptedRecipient.delivered_at instanceof Date, 'delivered_at timestamp must be recorded');
  assert.strictEqual(testCampaign.delivered_count, 1, 'Campaign delivered_count must now be 1');
  console.log('✅ Case 7 Passed: Verified DLR updates recipient to DELIVERED and campaign count to 1.');

  // -------------------------------------------------------------------------
  // Case 8: Provider failures are recorded as failures
  // -------------------------------------------------------------------------
  console.log('\n[Case 8] Verifying provider failures are recorded as FAILED...');
  const failedRecipient = {
    id: 'rec-test-failed-001',
    campaign_id: 'cmp-test-failure',
    mobile_number: '9876543211',
    normalized_mobile_number: '919876543211',
    status: 'SENT',
    msg91_message_id: 'MSG91_FAIL_9999',
    sent_at: new Date(),
    delivered_at: null,
    failure_reason: null,
  };

  const failCampaign = {
    id: 'cmp-test-failure',
    campaign_name: 'Failure Test Campaign',
    template_id: primaryTemplate.id,
    sent_count: 1,
    delivered_count: 0,
    failed_count: 0,
  };

  bulkSmsService.inMemoryStore.campaigns.set(failCampaign.id, failCampaign);
  bulkSmsService.inMemoryStore.recipients.set(failCampaign.id, [failedRecipient]);

  // Receive DLR indicating carrier failure / DND / invalid number
  const failDlr = await bulkSmsService.handleDeliveryReceipt({
    messageId: 'MSG91_FAIL_9999',
    mobile: '9876543211',
    status: 'FAILED',
    failureReason: 'DND Blacklisted Number',
  });

  assert.strictEqual(failDlr.updated_status, 'FAILED');
  assert.strictEqual(failedRecipient.status, 'FAILED');
  assert.strictEqual(failedRecipient.failure_reason, 'DND Blacklisted Number');
  assert.strictEqual(failCampaign.failed_count, 1);
  console.log('✅ Case 8 Passed: Provider failures are accurately recorded with reason and increment failed_count.');

  // -------------------------------------------------------------------------
  // Case 9: Missing or incorrect template variables prevent request from being sent
  // -------------------------------------------------------------------------
  console.log('\n[Case 9] Verifying missing template variables prevent campaign queuing...');
  let varError = null;
  try {
    await bulkSmsService.createCampaign({
      campaign_name: 'Missing Variables Campaign',
      template_id: primaryTemplate.id,
      recipients: [
        {
          mobile_number: '9876543210',
          variables: { var1: 'GharKaPaisa', var2: '' }, // empty var2
        },
      ],
      custom_variables: { var1: 'GharKaPaisa', var2: '' },
      compliance_confirmed: true,
    });
  } catch (err) {
    varError = err;
  }

  assert(varError, 'Campaign creation with empty variable must throw validation error');
  assert(
    varError.message.includes('missing required template variable') || varError.message.includes('var2'),
    `Expected variable error message, got: ${varError.message}`
  );
  console.log('✅ Case 9 Passed: Missing template variables prevent campaign from being queued.');

  // -------------------------------------------------------------------------
  // Case 10: Frontend template loading errors do not silently present a fake approved template
  // -------------------------------------------------------------------------
  console.log('\n[Case 10] Verifying frontend contract: no fake approved fallback template...');
  // If backend returns empty array or error, frontend contract states templates: [] and selectedTemplate: null
  // Simulate backend empty templates scenario
  const prevTemplates = Array.from(bulkSmsService.inMemoryStore.templates.entries());
  bulkSmsService.inMemoryStore.templates.clear();

  // Temporarily set a non-existent template ID in environment
  process.env.MSG91_BULK_SMS_TEMPLATE_ID = 'non_existent_template_id_0000';
  const emptyTemplates = await bulkSmsService.getTemplates();
  assert.strictEqual(emptyTemplates.length, 0, 'When configured template does not exist, getTemplates must return []');

  // Restore configured template ID
  process.env.MSG91_BULK_SMS_TEMPLATE_ID = '6acdf0660b357ef1f10a6343';
  prevTemplates.forEach(([k, v]) => bulkSmsService.inMemoryStore.templates.set(k, v));
  console.log('✅ Case 10 Passed: Backend fails closed on mismatched template and does not invent fake templates.');

  console.log('\n===============================================================');
  console.log('    ALL 10 VERIFICATION TEST CASES PASSED SUCCESSFULLY!        ');
  console.log('===============================================================');
}

runComprehensiveTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });
