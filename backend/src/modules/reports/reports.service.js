const ExcelJS = require('exceljs');
const {
  getEmployeeReportData,
  getEmployeeCustomerDetailedReportData,
  getCustomerReportData,
  getAdminReportData,
  getPartnerReportData,
  getApplicationReportData,
  getCompleteSystemSummaryMetrics
} = require('./reportQueries');

/**
 * Apply standard header styling to an ExcelJS worksheet
 */
function applyHeaderStyles(worksheet, headers) {
  const headerRow = worksheet.getRow(1);
  headerRow.values = headers;
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Dark blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;
}

/**
 * Auto-fit column widths
 */
function autoFitColumns(worksheet) {
  worksheet.columns.forEach(column => {
    let maxLen = 12;
    column.eachCell({ includeEmpty: true }, cell => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(maxLen + 4, 40);
  });
}

/**
 * 1. Generate Employee Report Excel (Summary or Detailed)
 */
async function generateEmployeeExcel(filters = {}, variant = 'summary') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa System';
  workbook.created = new Date();

  const employeeData = await getEmployeeReportData(filters, true);

  if (variant === 'detailed') {
    // Sheet 1: Detailed Employee + Customer breakdown
    const detailedSheet = workbook.addWorksheet('Employee Detailed');
    const detailedHeaders = [
      'Employee ID', 'Employee Name', 'Designation', 'Customer ID', 'Customer Name',
      'Customer Mobile', 'Application ID', 'Product', 'Bank', 'Application Status',
      'Disbursed Amount (₹)', 'Commission (₹)'
    ];
    applyHeaderStyles(detailedSheet, detailedHeaders);

    const detailedData = await getEmployeeCustomerDetailedReportData(filters);
    detailedData.forEach(row => {
      detailedSheet.addRow([
        row.employee_id, row.employee_name, row.designation, row.customer_id,
        row.customer_name, row.customer_mobile, row.application_id, row.product_name,
        row.bank_name, row.application_status, row.disbursed_amount, row.commission
      ]);
    });
    autoFitColumns(detailedSheet);
  }

  // Sheet 2 / Main Sheet: Employee Summary
  const summarySheet = workbook.addWorksheet('Employee Summary');
  const summaryHeaders = [
    'Employee ID', 'Full Name', 'Mobile', 'Email', 'Gender', 'DOB', 'Designation',
    'Department', 'Joining Date', 'Status', 'Reporting Manager', 'Team Leader',
    'Branch', 'PAN', 'Aadhaar', 'Bank Name', 'Account No', 'IFSC', 'KYC Status',
    'Docs Status', 'Created Date', 'Last Login', 'Total Customers', 'Total Apps',
    'Approved Apps', 'Disbursed Apps', 'Total Business (₹)', 'Total Commission (₹)'
  ];
  applyHeaderStyles(summarySheet, summaryHeaders);

  employeeData.forEach(row => {
    summarySheet.addRow([
      row.employee_id, row.full_name, row.mobile, row.email, row.gender, row.dob,
      row.designation, row.department, row.joining_date, row.employment_status,
      row.reporting_manager, row.team_leader, row.branch, row.pan, row.aadhaar,
      row.bank_name, row.bank_account, row.ifsc, row.kyc_status, row.documents_status,
      row.created_date, row.last_login, row.total_customers, row.total_applications,
      row.approved_applications, row.disbursed_applications, row.total_business, row.total_commission
    ]);
  });
  autoFitColumns(summarySheet);

  return workbook;
}

/**
 * 2. Generate Customer Report Excel
 */
async function generateCustomerExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa System';
  const sheet = workbook.addWorksheet('Customer Report');

  const headers = [
    'Customer ID', 'Customer Name', 'Mobile Number', 'Email', 'Date of Birth',
    'PAN', 'Aadhaar Status', 'KYC Status', 'Address', 'City', 'State', 'Pincode',
    'Assigned Employee', 'Employee ID', 'Assigned Partner', 'Product', 'App Count',
    'Approved Apps', 'Disbursed Apps', 'Total Loan Amount (₹)', 'Application Status',
    'Created Date', 'Last Updated'
  ];
  applyHeaderStyles(sheet, headers);

  const customerData = await getCustomerReportData(filters, true);
  customerData.forEach(row => {
    sheet.addRow([
      row.customer_id, row.customer_name, row.mobile_number, row.email, row.dob,
      row.pan, row.aadhaar_status, row.kyc_status, row.address, row.city, row.state,
      row.pincode, row.assigned_employee, row.employee_id, row.assigned_partner,
      row.product, row.application_count, row.approved_applications, row.disbursed_applications,
      row.total_loan_amount, row.application_status, row.created_date, row.last_updated
    ]);
  });
  autoFitColumns(sheet);

  return workbook;
}

/**
 * 3. Generate Admin Report Excel (NO SENSITIVE CREDENTIALS)
 */
async function generateAdminExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa System';
  const sheet = workbook.addWorksheet('Admin Report');

  const headers = [
    'Admin ID', 'Employee ID', 'Name', 'Mobile', 'Email', 'Role', 'Designation',
    'Department', 'Branch', 'Status', 'Created Date', 'Last Login', 'Last Activity', 'Permissions'
  ];
  applyHeaderStyles(sheet, headers);

  const adminData = await getAdminReportData(filters);
  adminData.forEach(row => {
    sheet.addRow([
      row.admin_id, row.employee_id, row.name, row.mobile, row.email, row.role,
      row.designation, row.department, row.branch, row.status, row.created_date,
      row.last_login, row.last_activity, row.permissions
    ]);
  });
  autoFitColumns(sheet);

  return workbook;
}

/**
 * 4. Generate Partner Report Excel
 */
async function generatePartnerExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa System';
  const sheet = workbook.addWorksheet('Partner Report');

  const headers = [
    'Partner Code', 'Partner Name', 'Mobile', 'Email', 'Company / Business',
    'Pincode', 'KYC Status', 'Total Applications', 'Approved Apps',
    'Disbursed Apps', 'Total Earnings (₹)', 'Registration Date'
  ];
  applyHeaderStyles(sheet, headers);

  const partnerData = await getPartnerReportData(filters);
  partnerData.forEach(row => {
    sheet.addRow([
      row.partner_code, row.partner_name, row.mobile, row.email, row.company_name,
      row.pincode, row.kyc_status, row.total_applications, row.approved_applications,
      row.disbursed_applications, row.total_earnings, row.created_date
    ]);
  });
  autoFitColumns(sheet);

  return workbook;
}

/**
 * 5. Generate Application Report Excel
 */
async function generateApplicationExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa System';
  const sheet = workbook.addWorksheet('Application Report');

  const headers = [
    'Application ID', 'Application Number', 'Customer Name', 'Customer Mobile',
    'Product', 'Bank', 'Employee Name', 'Employee ID', 'Partner', 'Application Date',
    'Application Status', 'Soft Approval Status', 'KYC Status', 'Sanction Amount (₹)',
    'Disbursed Amount (₹)', 'Disbursement Date', 'Commission (₹)', 'Commission Status',
    'Created Date', 'Updated Date'
  ];
  applyHeaderStyles(sheet, headers);

  const appData = await getApplicationReportData(filters);
  appData.forEach(row => {
    sheet.addRow([
      row.application_id, row.application_number, row.customer_name, row.customer_mobile,
      row.product, row.bank, row.employee, row.employee_id, row.partner, row.application_date,
      row.application_status, row.soft_approval_status, row.kyc_status, row.sanction_amount,
      row.disbursed_amount, row.disbursement_date, row.commission, row.commission_status,
      row.created_date, row.updated_date
    ]);
  });
  autoFitColumns(sheet);

  return workbook;
}

/**
 * 6. Generate Complete System Report Excel (Multi-Sheet Workbook)
 */
async function generateCompleteSystemExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa System';

  // Sheet 1: Executive Summary Metrics
  const summarySheet = workbook.addWorksheet('Executive Summary');
  summarySheet.addRow(['GHARKAPAISA COMPLETE SYSTEM REPORT']);
  summarySheet.getRow(1).font = { bold: true, size: 16, color: { argb: '1E3A8A' } };
  summarySheet.addRow([`Report Generated: ${new Date().toLocaleString()}`]);
  summarySheet.addRow([]);

  const metrics = await getCompleteSystemSummaryMetrics();
  summarySheet.addRow(['Metric Name', 'Value']);
  summarySheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' } };
  summarySheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };

  summarySheet.addRow(['Total Employees', metrics.total_employees]);
  summarySheet.addRow(['Active Employees', metrics.active_employees]);
  summarySheet.addRow(['Total Customers', metrics.total_customers]);
  summarySheet.addRow(['Total Applications', metrics.total_applications]);
  summarySheet.addRow(['Approved Applications', metrics.approved_applications]);
  summarySheet.addRow(['Disbursed Applications', metrics.disbursed_applications]);
  summarySheet.addRow(['Total Disbursed Business Amount (₹)', metrics.total_disbursed_amount]);
  summarySheet.addRow(['Total System Commission (₹)', metrics.total_commission]);
  autoFitColumns(summarySheet);

  // Sheet 2: Employee Summary
  const empSheet = workbook.addWorksheet('Employees');
  const empHeaders = ['Employee ID', 'Full Name', 'Mobile', 'Email', 'Designation', 'Department', 'Status', 'Total Customers', 'Total Apps', 'Approved', 'Disbursed', 'Total Business (₹)'];
  applyHeaderStyles(empSheet, empHeaders);
  const empData = await getEmployeeReportData(filters, true);
  empData.forEach(r => empSheet.addRow([r.employee_id, r.full_name, r.mobile, r.email, r.designation, r.department, r.employment_status, r.total_customers, r.total_applications, r.approved_applications, r.disbursed_applications, r.total_business]));
  autoFitColumns(empSheet);

  // Sheet 3: Customers
  const custSheet = workbook.addWorksheet('Customers');
  const custHeaders = ['Customer ID', 'Name', 'Mobile', 'Email', 'City', 'Assigned Employee', 'Total Apps', 'Approved Apps', 'Loan Amount (₹)'];
  applyHeaderStyles(custSheet, custHeaders);
  const custData = await getCustomerReportData(filters, true);
  custData.forEach(r => custSheet.addRow([r.customer_id, r.customer_name, r.mobile_number, r.email, r.city, r.assigned_employee, r.application_count, r.approved_applications, r.total_loan_amount]));
  autoFitColumns(custSheet);

  // Sheet 4: Applications
  const appSheet = workbook.addWorksheet('Applications');
  const appHeaders = ['App Number', 'Customer Name', 'Product', 'Bank', 'Status', 'Soft Approval', 'Sanction Amount (₹)', 'Disbursed Amount (₹)', 'Commission (₹)'];
  applyHeaderStyles(appSheet, appHeaders);
  const appData = await getApplicationReportData(filters);
  appData.forEach(r => appSheet.addRow([r.application_number, r.customer_name, r.product, r.bank, r.application_status, r.soft_approval_status, r.sanction_amount, r.disbursed_amount, r.commission]));
  autoFitColumns(appSheet);

  // Sheet 5: Partners
  const partSheet = workbook.addWorksheet('Partners');
  const partHeaders = ['Partner Code', 'Name', 'Mobile', 'Email', 'Company', 'KYC Status', 'Total Apps', 'Approved', 'Total Earnings (₹)'];
  applyHeaderStyles(partSheet, partHeaders);
  const partData = await getPartnerReportData(filters);
  partData.forEach(r => partSheet.addRow([r.partner_code, r.partner_name, r.mobile, r.email, r.company_name, r.kyc_status, r.total_applications, r.approved_applications, r.total_earnings]));
  autoFitColumns(partSheet);

  return workbook;
}

module.exports = {
  generateEmployeeExcel,
  generateCustomerExcel,
  generateAdminExcel,
  generatePartnerExcel,
  generateApplicationExcel,
  generateCompleteSystemExcel
};
