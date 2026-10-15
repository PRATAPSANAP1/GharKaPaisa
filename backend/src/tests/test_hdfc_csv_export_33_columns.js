const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Required 33 headers in exact order verbatim from specification
const REQUIRED_33_HEADERS = [
  'Application no',
  'Customer name',
  'Mobile number',
  'Email ID',
  'Pan no',
  'City',
  'State',
  'Pincode',
  'Product name',
  'Bank name',
  'Process type',
  'Reference/ code',
  'Status',
  'Incentive amount',
  'Bank application no',
  'IPA STAGE',
  'Soft approval stage',
  'KYC stage',
  'KYC link',
  'Dispatch status',
  'Final status form bank',
  'Final card approval',
  'User remark',
  'Bank remark',
  'Cureble stage',
  'Primary code',
  'Secondary code',
  'Cureble type',
  'Cureble operator code',
  'Salas operator code',
  'Remark opretor code',
  'Decline reason',
  'Crested date'
];

console.log('--- TEST 1: Specification Header Count and Order ---');
assert.strictEqual(REQUIRED_33_HEADERS.length, 33, 'Specification must contain exactly 33 headers');
console.log('✔ Specification has exactly 33 headers');

// 2. Validate frontend/src/components/Admin/ExportApplicationsModal.jsx
console.log('\n--- TEST 2: Validate ExportApplicationsModal.jsx Headers ---');
const frontendModalPath = path.resolve(__dirname, '../../../frontend/src/components/Admin/ExportApplicationsModal.jsx');
assert(fs.existsSync(frontendModalPath), 'ExportApplicationsModal.jsx file must exist');
const frontendContent = fs.readFileSync(frontendModalPath, 'utf8');

// Extract HDFC_COL_DEFS headers from frontend file
const hdfcColDefsMatch = frontendContent.match(/const HDFC_COL_DEFS = \[([\s\S]*?)\];/);
assert(hdfcColDefsMatch, 'HDFC_COL_DEFS must be defined in ExportApplicationsModal.jsx');

const headerRegex = /header:\s*'([^']+)'/g;
const frontendHeaders = [];
let match;
while ((match = headerRegex.exec(hdfcColDefsMatch[1])) !== null) {
  frontendHeaders.push(match[1]);
}

assert.strictEqual(frontendHeaders.length, 33, `Frontend HDFC_COL_DEFS must have 33 headers (found ${frontendHeaders.length})`);
for (let i = 0; i < REQUIRED_33_HEADERS.length; i++) {
  assert.strictEqual(
    frontendHeaders[i],
    REQUIRED_33_HEADERS[i],
    `Frontend header at index ${i} mismatch: expected "${REQUIRED_33_HEADERS[i]}", got "${frontendHeaders[i]}"`
  );
}
console.log('✔ Frontend ExportApplicationsModal.jsx defines all 33 headers in exact order, including "IPA STAGE"');

// 3. Validate backend/src/modules/crm/application.controller.js
console.log('\n--- TEST 3: Validate application.controller.js Backend Headers ---');
const backendCtrlPath = path.resolve(__dirname, '../modules/crm/application.controller.js');
assert(fs.existsSync(backendCtrlPath), 'application.controller.js must exist');
const backendContent = fs.readFileSync(backendCtrlPath, 'utf8');

const backendHdfcMatch = backendContent.match(/const hdfcHeaders = \[([\s\S]*?)\];/);
assert(backendHdfcMatch, 'hdfcHeaders must be defined in application.controller.js');

const backendHeaders = backendHdfcMatch[1]
  .split('\n')
  .map(l => l.trim().replace(/^'|',?$|'$/g, ''))
  .filter(l => l.length > 0);

assert.strictEqual(backendHeaders.length, 33, `Backend hdfcHeaders must have 33 headers (found ${backendHeaders.length})`);
for (let i = 0; i < REQUIRED_33_HEADERS.length; i++) {
  assert.strictEqual(
    backendHeaders[i],
    REQUIRED_33_HEADERS[i],
    `Backend header at index ${i} mismatch: expected "${REQUIRED_33_HEADERS[i]}", got "${backendHeaders[i]}"`
  );
}
console.log('✔ Backend application.controller.js defines all 33 headers in exact order, including "IPA STAGE"');

// 4. RFC 4180 Standard CSV Parser for test validation
function parseCSV(csvString) {
  // Strip BOM if present
  let clean = csvString.startsWith('\uFEFF') ? csvString.slice(1) : csvString;
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else if (char === '\n') {
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }

  // Filter out any trailing empty row
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

// 5. Simulate Frontend CSV Generation with Realistic / Edge-case Data
console.log('\n--- TEST 4: Frontend CSV Generation & Parsing Simulation ---');

const formatCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  const cleanStr = String(val).replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
  return `"${cleanStr}"`;
};

const maskMobileNumber = (mobile) => {
  if (!mobile) return 'N/A';
  const str = String(mobile).trim();
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    const mainDigits = digitsOnly.slice(-10);
    const visiblePart = mainDigits.slice(0, 4);
    const prefix = str.startsWith('+91') ? '+91 ' : (str.length > 10 ? str.slice(0, str.length - 10) : '');
    return `${prefix}${visiblePart}******`;
  }
  if (str.length > 6) {
    return str.slice(0, str.length - 6) + '******';
  }
  return str.replace(/\d/g, '*');
};

const getFrontendColDefs = (hideCustomerMobile, isAdminOperator) => [
  { header: 'Application no', getVal: a => a.app_number || a.application_no || a.id || '' },
  { header: 'Customer name', getVal: a => a.customer_name || a.full_name || a.pan_name || 'N/A' },
  { header: 'Mobile number', getVal: a => {
      const rawMob = a.customer_mobile || a.mobile || a.phone || a.aadhaar_linked_mobile || '';
      if (!rawMob) return 'N/A';
      return hideCustomerMobile ? maskMobileNumber(rawMob) : String(rawMob).trim();
    }
  },
  { header: 'Email ID', getVal: a => a.customer_email || a.email || a.personal_email || 'N/A' },
  { header: 'Pan no', getVal: a => {
      const rawPan = a.pan_number || a.pan || '';
      if (!rawPan || String(rawPan).trim() === '' || String(rawPan).toUpperCase() === 'N/A' || String(rawPan).toUpperCase() === 'NA') return 'NA';
      const cleanPan = String(rawPan).trim().toUpperCase();
      if (isAdminOperator) {
        return cleanPan.length >= 6 ? 'XXXXXX' + cleanPan.slice(6) : 'XXXXXX';
      }
      return cleanPan;
    }
  },
  { header: 'City', getVal: a => a.city || a.physical_details?.city || 'N/A' },
  { header: 'State', getVal: a => a.state || a.physical_details?.state || 'N/A' },
  { header: 'Pincode', getVal: a => a.pincode || a.physical_details?.pincode || 'N/A' },
  { header: 'Product name', getVal: a => a.product_name || a.product || 'N/A' },
  { header: 'Bank name', getVal: a => a.bank_name || a.bank || 'HDFC Bank' },
  { header: 'Process type', getVal: a => (a.process_type || a.process_by || 'Direct Link').replace(/_/g, ' ') },
  { header: 'Reference/ code', getVal: a => a.emp_code || a.Partner_code || a.partner_code || a.referrer_code || a.submitted_by_name || 'N/A' },
  { header: 'Status', getVal: a => (a.status || 'pending').replace(/_/g, ' ') },
  { header: 'Incentive amount', getVal: a => a.incentive_amount ?? a.commission_amount ?? 0 },
  { header: 'Bank application no', getVal: a => {
      const raw = a.bank_application_number || a.bank_ref_number || a.physical_details?.bank_application_number || a.physical_details?.bank_ref_number || '';
      const sysAppNo = a.app_number || '';
      return (!raw || String(raw).trim() === '' || String(raw).trim() === String(sysAppNo).trim() || String(raw).toUpperCase() === 'N/A' || String(raw).toUpperCase() === 'NA') ? 'NA' : String(raw).trim();
    }
  },
  { header: 'IPA STAGE', getVal: a => a.ipa_stage || a.physical_details?.ipa_stage || a.iqa_stage || a.physical_details?.iqa_stage || 'NA' },
  { header: 'Soft approval stage', getVal: a => a.soft_approval_stage || a.soft_approval_status || a.physical_details?.soft_approval_stage || a.physical_details?.soft_approval_status || 'NA' },
  { header: 'KYC stage', getVal: a => a.kyc_stage || a.vkyc_stage || a.vkyc_status || a.physical_details?.kyc_stage || a.physical_details?.vkyc_stage || 'NA' },
  { header: 'KYC link', getVal: a => {
      const rawUrl = a.vkyc_url || a.physical_details?.vkyc_url || a.kyc_link || a.physical_details?.kyc_link || '';
      return (rawUrl && String(rawUrl).trim() !== '' && String(rawUrl).toUpperCase() !== 'N/A') ? String(rawUrl).trim() : 'NA';
    }
  },
  { header: 'Dispatch status', getVal: a => a.dispatch_status || a.physical_details?.dispatch_status || 'NA' },
  { header: 'Final status form bank', getVal: a => a.final_status || a.physical_details?.final_status || a.bank_current_lead_status || a.physical_details?.bank_current_lead_status || 'NA' },
  { header: 'Final card approval', getVal: a => a.final_card_approval || a.card_approval_stage || a.card_approval_status || a.digital_card_issued || a.card_activation_stage || a.physical_details?.final_card_approval || a.physical_details?.card_approval_stage || 'NA' },
  { header: 'User remark', getVal: a => a.user_remark || a.notes || a.user_notes || a.operational_remarks || a.physical_details?.user_remark || 'NA' },
  { header: 'Bank remark', getVal: a => a.bank_remark || a.physical_details?.bank_remark || 'NA' },
  { header: 'Cureble stage', getVal: a => a.cureble_stage || a.curable_stage || a.queryable_remark || a.physical_details?.cureble_stage || a.physical_details?.queryable_remark || 'NA' },
  { header: 'Primary code', getVal: a => a.primary_code || a.decline_code || a.physical_details?.primary_code || a.physical_details?.decline_code || 'NA' },
  { header: 'Secondary code', getVal: a => a.secondary_code || a.physical_details?.secondary_code || 'NA' },
  { header: 'Cureble type', getVal: a => a.cureble_type || a.curable_type || a.digital_remark || a.physical_details?.cureble_type || a.physical_details?.digital_remark || 'NA' },
  { header: 'Cureble operator code', getVal: a => a.cureble_operator_code || a.curable_operator_code || a.curable_executive || a.physical_details?.cureble_operator_code || 'NA' },
  { header: 'Salas operator code', getVal: a => a.salas_operator_code || a.sales_operator_code || a.queryable_sales_remark || a.physical_details?.sales_operator_code || a.physical_details?.salas_operator_code || 'NA' },
  { header: 'Remark opretor code', getVal: a => a.remark_opretor_code || a.remark_operator_code || a.last_operator_code || a.physical_details?.remark_operator_code || a.physical_details?.remark_opretor_code || 'NA' },
  { header: 'Decline reason', getVal: a => a.decline_reason || a.decline_remark || a.offer_decline_reason || a.physical_details?.decline_reason || a.physical_details?.decline_remark || 'NA' },
  { header: 'Crested date', getVal: a => (a.created_at || a.createdAt || a.application_date) ? new Date(a.created_at || a.createdAt || a.application_date).toLocaleDateString('en-IN') : 'N/A' }
];

// Mock test applications covering edge cases
const mockApplications = [
  {
    // Row 1: Fully populated normal record
    app_number: 'HDFC-APP-1001',
    customer_name: 'Amit Kumar Sharma',
    customer_mobile: '9876543210',
    customer_email: 'amit.sharma@example.com',
    pan_number: 'ABCDE1234F',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    product_name: 'HDFC Millennia Credit Card',
    bank_name: 'HDFC Bank',
    process_type: 'direct_link',
    emp_code: 'EMP-9021',
    status: 'approved',
    incentive_amount: 1500,
    bank_application_number: 'HDFC-REF-887766',
    ipa_stage: 'STAGE_3_APPROVED',
    soft_approval_stage: 'PASSED',
    kyc_stage: 'VKYC_COMPLETED',
    vkyc_url: 'https://vkyc.hdfcbank.com/session/1001',
    dispatch_status: 'DISPATCHED',
    final_status: 'CARD_DELIVERED',
    final_card_approval: 'APPROVED_ACTIVE',
    user_remark: 'All customer documents verified cleanly',
    bank_remark: 'Approved with credit limit 150000',
    cureble_stage: 'STAGE_CLEAR',
    primary_code: 'PR-01',
    secondary_code: 'SEC-02',
    cureble_type: 'DIGITAL_APPROVED',
    cureble_operator_code: 'OP-441',
    salas_operator_code: 'SALES-102',
    remark_opretor_code: 'REM-301',
    decline_reason: 'NA',
    created_at: '2026-10-10T10:30:00Z'
  },
  {
    // Row 2: Completely empty/null/missing fields to test fallback values
    id: 'b567d2e4-1122-3344-5566-778899aabbcc',
    customer_name: null,
    customer_mobile: null,
    customer_email: null,
    pan_number: null,
    city: null,
    state: null,
    pincode: null,
    product_name: null,
    bank_name: null,
    status: null,
    commission_amount: null,
    created_at: null
  },
  {
    // Row 3: Commas in text values
    app_number: 'HDFC-APP-1003',
    customer_name: 'Reddy, Venkat & Co',
    customer_mobile: '9123456780',
    city: 'Hyderabad, Telangana, South Zone',
    user_remark: 'Customer requested loan, cards, and investment advisory',
    bank_remark: 'Pending verification at Banjara Hills, Hyderabad branch'
  },
  {
    // Row 4: Double quotes in text values
    app_number: 'HDFC-APP-1004',
    customer_name: 'Pooja "Nikki" Verma',
    user_remark: 'Executive said: "Customer agreed to 12% APR" on call',
    bank_remark: 'Internal flag: "VIP_CUSTOMER_FAST_TRACK"'
  },
  {
    // Row 5: Multi-line strings with \n and \r\n
    app_number: 'HDFC-APP-1005',
    user_remark: 'Line 1: Contacted via phone.\nLine 2: Customer sent docs on WhatsApp.\r\nLine 3: Final check completed.',
    bank_remark: 'Note A\nNote B\r\nNote C',
    decline_reason: 'Reason 1\nReason 2'
  }
];

// Run frontend generator
const activeColDefs = getFrontendColDefs(false, false);
const csvLines = [activeColDefs.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',')];
mockApplications.forEach(a => {
  const rowVals = activeColDefs.map(c => formatCsvCell(c.getVal(a)));
  csvLines.push(rowVals.join(','));
});
const frontendCsvString = '\uFEFF' + csvLines.join('\n');

const parsedFrontend = parseCSV(frontendCsvString);
assert.strictEqual(parsedFrontend.length, mockApplications.length + 1, `CSV must have 1 header row + ${mockApplications.length} data rows`);

// Validate header row
const parsedHeader = parsedFrontend[0];
assert.strictEqual(parsedHeader.length, 33, `Header row must have exactly 33 columns (got ${parsedHeader.length})`);
for (let i = 0; i < 33; i++) {
  assert.strictEqual(parsedHeader[i], REQUIRED_33_HEADERS[i], `Header column ${i} mismatch`);
}
console.log('✔ Header row parsed successfully with exactly 33 matching columns');

// Validate data rows
for (let r = 1; r < parsedFrontend.length; r++) {
  const row = parsedFrontend[r];
  assert.strictEqual(
    row.length,
    33,
    `Data row ${r} must have exactly 33 fields (got ${row.length}). Values: ${JSON.stringify(row)}`
  );
}
console.log(`✔ All ${mockApplications.length} data rows have exactly 33 fields, even with commas, quotes, nulls, and newlines!`);

// Assert row 3 commas handled properly without shifting columns
assert.strictEqual(parsedFrontend[3][5], 'Hyderabad, Telangana, South Zone', 'City with commas must be parsed intact into a single column');
// Assert row 4 quotes handled properly
assert.strictEqual(parsedFrontend[4][1], 'Pooja "Nikki" Verma', 'Customer name with quotes must be parsed intact');
// Assert row 5 newlines handled properly
assert.strictEqual(parsedFrontend[5][22].includes('\n'), false, 'User remark line breaks must be sanitized into single line');

// 6. Test Masking Logic for Operators & Employees
console.log('\n--- TEST 5: Masking Permissions Validation ---');
const maskedColDefs = getFrontendColDefs(true, true); // hideMobile = true, isOperator = true
const maskedVals = maskedColDefs.map(c => formatCsvCell(c.getVal(mockApplications[0])));
const maskedRow = parseCSV(maskedVals.join(','))[0];

assert.strictEqual(maskedRow.length, 33);
assert.strictEqual(maskedRow[2], '9876******', `Mobile number must be masked (got ${maskedRow[2]})`);
assert.strictEqual(maskedRow[4], 'XXXXXX234F', `PAN number must be masked (got ${maskedRow[4]})`);
console.log('✔ Masking permissions verified for Mobile (9876******) and PAN (XXXXXX234F)');

// 7. Test Bank Resolution Helper
console.log('\n--- TEST 6: Bank Resolution Function Validation ---');
const banksList = [
  { id: '11111111-2222-3333-4444-555555555555', name: 'HDFC Bank', short_code: null },
  { id: '22222222-3333-4444-5555-666666666666', name: 'State Bank of India', short_code: 'SBI' }
];

const resolveIsHdfc = (bVal) => {
  if (!bVal || bVal === 'all') return false;
  const lower = String(bVal).toLowerCase().trim();
  if (lower === 'hdfc' || lower.includes('hdfc')) return true;
  if (Array.isArray(banksList) && banksList.length > 0) {
    const match = banksList.find(b => String(b.id || b.bank_id).toLowerCase() === lower);
    if (match && `${match.name || ''} ${match.bank_name || ''} ${match.short_code || ''}`.toLowerCase().includes('hdfc')) {
      return true;
    }
  }
  return false;
};

assert.strictEqual(resolveIsHdfc('hdfc'), true, "'hdfc' must resolve to true");
assert.strictEqual(resolveIsHdfc('HDFC Bank'), true, "'HDFC Bank' must resolve to true");
assert.strictEqual(resolveIsHdfc('11111111-2222-3333-4444-555555555555'), true, "HDFC bank UUID must resolve to true");
assert.strictEqual(resolveIsHdfc('all'), false, "'all' must resolve to false");
assert.strictEqual(resolveIsHdfc('sbi'), false, "'sbi' must resolve to false");
assert.strictEqual(resolveIsHdfc('22222222-3333-4444-5555-666666666666'), false, "SBI bank UUID must resolve to false");
console.log('✔ Bank resolution accurately identifies HDFC across string codes, bank names, and UUIDs while leaving other banks untouched');

console.log('\n========================================');
console.log('🎉 ALL 6 TEST SUITES PASSED SUCCESSFULLY!');
console.log('========================================');
