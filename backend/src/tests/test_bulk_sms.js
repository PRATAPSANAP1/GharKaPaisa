process.env.NODE_ENV = 'test';
process.env.SKIP_DB = 'true';
const assert = require('assert');
const ExcelJS = require('exceljs');
const bulkSmsService = require('../modules/bulk-sms/bulk-sms.service');
const { normalizeForMsg91, maskMobileNumber, sendBatchViaFlow } = require('../modules/bulk-sms/msg91.service');

async function runTests() {
  console.log('--- STARTING BULK SMS BACKEND TESTS ---');

  // Test 1: Normalization & Validation
  console.log('Test 1: Testing Indian mobile normalization...');
  assert.strictEqual(normalizeForMsg91('9876543210'), '919876543210', '10-digit number should normalize to 91XXXXXXXXXX');
  assert.strictEqual(normalizeForMsg91('+919876543210'), '919876543210', '+91 should normalize to 91XXXXXXXXXX');
  assert.strictEqual(normalizeForMsg91('09876543210'), '919876543210', '0 prefix should normalize to 91XXXXXXXXXX');
  assert.strictEqual(normalizeForMsg91('919876543210'), '919876543210', '91 prefix should normalize to 91XXXXXXXXXX');
  assert.strictEqual(normalizeForMsg91('12345'), null, 'Short invalid number should return null');
  assert.strictEqual(normalizeForMsg91('5876543210'), null, 'Number not starting with 6-9 should return null');
  console.log('✓ Test 1 passed: Normalization logic is correct');

  // Test 2: Masking
  console.log('Test 2: Testing Mobile Masking in UI...');
  assert.strictEqual(maskMobileNumber('9876543210'), '98******10', '10-digit number masked format 98******10');
  assert.strictEqual(maskMobileNumber('919876543210'), '98******10', '12-digit number masked format 98******10');
  console.log('✓ Test 2 passed: Masking logic is correct');

  // Test 3: CSV Parsing & Deduplication
  console.log('Test 3: Testing CSV file parsing and deduplication...');
  const csvContent = [
    'name,mobile,loan_amount',
    'Rahul,9876543210,500000',
    'Priya,+919876543211,300000',
    'Amit,9876543210,200000',    // Duplicate of Rahul
    'Invalid User,12345,100000', // Invalid
    'Sneha,919876543212,400000',
  ].join('\n');

  const csvResult = await bulkSmsService.parseRecipientFile({
    fileBuffer: Buffer.from(csvContent, 'utf-8'),
    fileName: 'customers_test.csv',
    fileSize: csvContent.length,
  });

  assert.strictEqual(csvResult.total_records, 5, 'Should parse 5 data rows');
  assert.strictEqual(csvResult.valid_numbers, 3, 'Should have 3 valid numbers (Rahul, Priya, Sneha)');
  assert.strictEqual(csvResult.duplicate_numbers, 1, 'Should have 1 duplicate (Amit)');
  assert.strictEqual(csvResult.invalid_numbers, 1, 'Should have 1 invalid number');
  assert.strictEqual(csvResult.valid_recipients.length, 3, '3 valid recipients ready for campaign');
  console.log('✓ Test 3 passed: CSV parsing & deduplication verified');

  // Test 4: Excel XLSX Parsing
  console.log('Test 4: Testing XLSX workbook creation and parsing...');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Recipients');
  sheet.addRow(['Customer Name', 'Phone Number', 'City']);
  sheet.addRow(['Anand Sharma', '9820011223', 'Mumbai']);
  sheet.addRow(['Deepak Verma', '9820011224', 'Delhi']);
  sheet.addRow(['Duplicate Person', '9820011223', 'Pune']);
  const xlsxBuffer = await workbook.xlsx.writeBuffer();

  const xlsxResult = await bulkSmsService.parseRecipientFile({
    fileBuffer: xlsxBuffer,
    fileName: 'leads_october.xlsx',
    fileSize: xlsxBuffer.length,
  });

  assert.strictEqual(xlsxResult.total_records, 3);
  assert.strictEqual(xlsxResult.valid_numbers, 2);
  assert.strictEqual(xlsxResult.duplicate_numbers, 1);
  console.log('✓ Test 4 passed: XLSX parsing verified');

  // Test 5: Templates & Approval Check
  console.log('Test 5: Testing templates listing and approval verification...');
  const templates = await bulkSmsService.getTemplates();
  assert(templates.length >= 3, 'Should have at least 3 seeded templates');
  const hdfcTemplate = templates.find((t) => t.name.includes('HDFC'));
  assert(hdfcTemplate, 'HDFC Pre-Approved Loan template must exist');
  assert.strictEqual(hdfcTemplate.approval_status, 'APPROVED', 'Template must be APPROVED');
  console.log('✓ Test 5 passed: Approved templates ready');

  // Test 6: Campaign Creation & Queue Dispatch
  console.log('Test 6: Testing Campaign Creation and Async Queue Dispatch...');
  const campaign = await bulkSmsService.createCampaign({
    campaign_name: 'HDFC Loan Campaign - October 2026 Test',
    template_id: hdfcTemplate.id,
    schedule_type: 'SEND_NOW',
    recipients: csvResult.valid_recipients,
    file_name: 'customers_test.csv',
    file_size: csvContent.length,
    compliance_confirmed: true,
  });

  assert(campaign.campaign_id, 'Campaign ID should be generated');
  assert.strictEqual(campaign.total_recipients, 3);
  console.log('✓ Test 6 passed: Campaign created with ID: ' + campaign.campaign_id);

  // Allow brief tick for asynchronous queue processor
  await new Promise((resolve) => setTimeout(resolve, 300));

  const stats = await bulkSmsService.getCampaignStats();
  assert(stats.total_campaigns >= 1, 'Total campaigns count should be at least 1');
  console.log('✓ Campaign Stats:', stats);

  // Test 7: Export CSV Delivery Report
  console.log('Test 7: Testing CSV Delivery Report generation...');
  const reportCsv = await bulkSmsService.exportCampaignCsv(campaign.campaign_id);
  assert(reportCsv.includes('Mobile Number'), 'Report should include headers');
  assert(reportCsv.includes('DELIVERED') || reportCsv.includes('SENT') || reportCsv.includes('QUEUED'), 'Report should have status');
  console.log('✓ Test 7 passed: Delivery report generated');

  console.log('\n--- ALL BULK SMS BACKEND TESTS COMPLETED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
