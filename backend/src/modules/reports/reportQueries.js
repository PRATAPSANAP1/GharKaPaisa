const { query } = require('../../config/database');

/**
 * Mask sensitive values like PAN or Aadhaar or Bank Account
 */
function maskValue(val, type = 'general') {
  if (!val) return 'N/A';
  const str = String(val).trim();
  if (type === 'pan') {
    if (str.length === 10) return `${str.substring(0, 3)}****${str.substring(7)}`;
    return `${str.substring(0, 2)}****${str.slice(-2)}`;
  }
  if (type === 'aadhaar') {
    if (str.length >= 4) return `XXXX-XXXX-${str.slice(-4)}`;
    return 'XXXX-XXXX-XXXX';
  }
  if (type === 'account') {
    if (str.length >= 4) return `XXXXXX${str.slice(-4)}`;
    return 'XXXXXXXXXX';
  }
  return str;
}

/**
 * Build dynamic WHERE clause based on filters
 */
function buildWhereClause(filters = {}, prefix = '') {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  const colPrefix = prefix ? `${prefix}.` : '';

  if (filters.search) {
    conditions.push(`(
      ${colPrefix}full_name ILIKE $${paramIdx} OR
      ${colPrefix}email ILIKE $${paramIdx} OR
      ${colPrefix}mobile ILIKE $${paramIdx} OR
      ${colPrefix}employee_id ILIKE $${paramIdx}
    )`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  if (filters.status && filters.status !== 'all' && filters.status !== 'ALL') {
    conditions.push(`${colPrefix}status::text = $${paramIdx}`);
    params.push(filters.status.toLowerCase());
    paramIdx++;
  }

  if (filters.designation && filters.designation !== 'all') {
    conditions.push(`${colPrefix}designation ILIKE $${paramIdx}`);
    params.push(filters.designation);
    paramIdx++;
  }

  if (filters.department && filters.department !== 'all') {
    conditions.push(`${colPrefix}department ILIKE $${paramIdx}`);
    params.push(filters.department);
    paramIdx++;
  }

  if (filters.date_from) {
    conditions.push(`${colPrefix}created_at >= $${paramIdx}`);
    params.push(`${filters.date_from} 00:00:00`);
    paramIdx++;
  }

  if (filters.date_to) {
    conditions.push(`${colPrefix}created_at <= $${paramIdx}`);
    params.push(`${filters.date_to} 23:59:59`);
    paramIdx++;
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
    nextParamIdx: paramIdx
  };
}

/**
 * 1. EMPLOYEE REPORT QUERY (Summary & Detailed)
 */
async function getEmployeeReportData(filters = {}, maskSensitive = true) {
  const { whereClause, params } = buildWhereClause(filters, 'u');
  
  const sql = `
    SELECT 
      u.id AS user_id,
      COALESCE(u.employee_id, 'N/A') AS employee_id,
      u.full_name,
      u.mobile,
      u.email,
      COALESCE(e.gender, 'N/A') AS gender,
      e.dob,
      COALESCE(u.designation, e.designation, 'Employee') AS designation,
      COALESCE(u.department, e.department, 'Operations') AS department,
      e.joining_date,
      CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END AS employment_status,
      COALESCE(mgr.full_name, e.reporting_manager, 'N/A') AS reporting_manager,
      COALESCE(tl.full_name, e.team_leader, 'N/A') AS team_leader,
      COALESCE(e.branch, 'Head Office') AS branch,
      e.pan_number,
      e.aadhaar_number,
      e.bank_account_no,
      e.bank_name,
      e.ifsc_code,
      COALESCE(e.kyc_status, 'Pending') AS kyc_status,
      COALESCE(e.documents_status, 'Pending') AS documents_status,
      u.created_at,
      u.last_login,
      COUNT(DISTINCT c.id) AS total_customers,
      COUNT(DISTINCT a.id) AS total_applications,
      COUNT(DISTINCT CASE WHEN a.status::text IN ('approved', 'commission_received') OR a.final_status ILIKE '%approve%' THEN a.id END) AS approved_applications,
      COUNT(DISTINCT CASE WHEN a.status::text = 'disbursed' OR a.final_status ILIKE '%disbursed%' THEN a.id END) AS disbursed_applications,
      COALESCE(SUM(CASE WHEN a.status::text IN ('approved', 'disbursed', 'commission_received') THEN COALESCE(a.approved_amount, a.loan_amount, a.final_loan_disbursed, 0) ELSE 0 END), 0) AS total_business,
      COALESCE(SUM(CASE WHEN a.status::text IN ('approved', 'disbursed', 'commission_received') THEN COALESCE(a.commission_amount, 0) ELSE 0 END), 0) AS total_commission
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id OR e.employee_id = u.employee_id
    LEFT JOIN users mgr ON e.reporting_manager_id = mgr.id
    LEFT JOIN users tl ON e.team_leader_id = tl.id
    LEFT JOIN customers c ON c.created_by = u.id
    LEFT JOIN applications a ON a.submitted_by = u.id OR a.partner_id IN (SELECT id FROM partner_profiles WHERE user_id = u.id)
    ${whereClause ? whereClause + " AND u.role = 'EMPLOYEE'" : "WHERE u.role = 'EMPLOYEE'"}
    GROUP BY u.id, e.id, mgr.id, tl.id
    ORDER BY u.created_at DESC
  `;

  const { rows } = await query(sql, params);

  return rows.map(r => ({
    employee_id: r.employee_id,
    full_name: r.full_name || 'N/A',
    mobile: r.mobile || 'N/A',
    email: r.email || 'N/A',
    gender: r.gender || 'N/A',
    dob: r.dob ? new Date(r.dob).toLocaleDateString() : 'N/A',
    designation: r.designation || 'N/A',
    department: r.department || 'N/A',
    joining_date: r.joining_date ? new Date(r.joining_date).toLocaleDateString() : 'N/A',
    employment_status: r.employment_status,
    reporting_manager: r.reporting_manager,
    team_leader: r.team_leader,
    branch: r.branch,
    pan: maskSensitive ? maskValue(r.pan_number, 'pan') : (r.pan_number || 'N/A'),
    aadhaar: maskSensitive ? maskValue(r.aadhaar_number, 'aadhaar') : (r.aadhaar_number || 'N/A'),
    bank_account: maskSensitive ? maskValue(r.bank_account_no, 'account') : (r.bank_account_no || 'N/A'),
    bank_name: r.bank_name || 'N/A',
    ifsc: r.ifsc_code || 'N/A',
    kyc_status: r.kyc_status,
    documents_status: r.documents_status,
    created_date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
    last_login: r.last_login ? new Date(r.last_login).toLocaleString() : 'Never',
    total_customers: parseInt(r.total_customers || 0),
    total_applications: parseInt(r.total_applications || 0),
    approved_applications: parseInt(r.approved_applications || 0),
    disbursed_applications: parseInt(r.disbursed_applications || 0),
    total_business: parseFloat(r.total_business || 0),
    total_commission: parseFloat(r.total_commission || 0)
  }));
}

/**
 * 2. EMPLOYEE + CUSTOMER DETAILED REPORT QUERY
 */
async function getEmployeeCustomerDetailedReportData(filters = {}) {
  let whereClauses = ["u.role = 'EMPLOYEE'"];
  let params = [];
  let paramIdx = 1;

  if (filters.search) {
    whereClauses.push(`(u.full_name ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx} OR u.employee_id ILIKE $${paramIdx} OR c.mobile ILIKE $${paramIdx})`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  if (filters.date_from) {
    whereClauses.push(`a.created_at >= $${paramIdx}`);
    params.push(`${filters.date_from} 00:00:00`);
    paramIdx++;
  }

  if (filters.date_to) {
    whereClauses.push(`a.created_at <= $${paramIdx}`);
    params.push(`${filters.date_to} 23:59:59`);
    paramIdx++;
  }

  const sql = `
    SELECT 
      COALESCE(u.employee_id, 'N/A') AS employee_id,
      u.full_name AS employee_name,
      u.designation,
      c.id AS customer_id,
      c.full_name AS customer_name,
      c.mobile AS customer_mobile,
      a.app_number AS application_id,
      COALESCE(p.name, 'N/A') AS product_name,
      COALESCE(b.name, 'N/A') AS bank_name,
      a.status AS application_status,
      COALESCE(a.approved_amount, a.disbursed_amount, a.final_loan_disbursed, a.loan_amount, 0) AS disbursed_amount,
      COALESCE(a.commission_amount, 0) AS commission
    FROM users u
    JOIN customers c ON c.created_by = u.id
    LEFT JOIN applications a ON a.customer_id = c.id
    LEFT JOIN products p ON a.product_id = p.id
    LEFT JOIN banks b ON p.bank_id = b.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY u.full_name ASC, c.created_at DESC
  `;

  const { rows } = await query(sql, params);
  return rows.map(r => ({
    employee_id: r.employee_id,
    employee_name: r.employee_name || 'N/A',
    designation: r.designation || 'N/A',
    customer_id: r.customer_id || 'N/A',
    customer_name: r.customer_name || 'N/A',
    customer_mobile: r.customer_mobile || 'N/A',
    application_id: r.application_id || 'N/A',
    product_name: r.product_name,
    bank_name: r.bank_name,
    application_status: r.application_status ? String(r.application_status).toUpperCase().replace(/_/g, ' ') : 'N/A',
    disbursed_amount: parseFloat(r.disbursed_amount || 0),
    commission: parseFloat(r.commission || 0)
  }));
}

/**
 * 3. CUSTOMER REPORT QUERY
 */
async function getCustomerReportData(filters = {}, maskSensitive = true) {
  let whereClauses = [];
  let params = [];
  let paramIdx = 1;

  if (filters.search) {
    whereClauses.push(`(c.full_name ILIKE $${paramIdx} OR c.mobile ILIKE $${paramIdx} OR c.email ILIKE $${paramIdx} OR c.pan_number ILIKE $${paramIdx})`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  if (filters.date_from) {
    whereClauses.push(`c.created_at >= $${paramIdx}`);
    params.push(`${filters.date_from} 00:00:00`);
    paramIdx++;
  }

  if (filters.date_to) {
    whereClauses.push(`c.created_at <= $${paramIdx}`);
    params.push(`${filters.date_to} 23:59:59`);
    paramIdx++;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      c.id AS customer_id,
      c.full_name AS customer_name,
      c.mobile,
      COALESCE(c.email, 'N/A') AS email,
      c.dob,
      COALESCE(c.pan_number, 'N/A') AS pan,
      c.aadhaar_last4,
      c.city,
      c.state,
      c.pincode,
      COALESCE(u.full_name, 'N/A') AS assigned_employee,
      COALESCE(u.employee_id, 'N/A') AS employee_id,
      COALESCE(part.first_name || ' ' || part.last_name, 'N/A') AS assigned_partner,
      c.created_at,
      c.updated_at,
      COUNT(DISTINCT a.id) AS application_count,
      COUNT(DISTINCT CASE WHEN a.status::text IN ('approved', 'commission_received') THEN a.id END) AS approved_applications,
      COUNT(DISTINCT CASE WHEN a.status::text = 'disbursed' THEN a.id END) AS disbursed_applications,
      COALESCE(SUM(CASE WHEN a.status::text IN ('approved', 'disbursed') THEN COALESCE(a.approved_amount, a.loan_amount, 0) ELSE 0 END), 0) AS total_loan_amount,
      MAX(a.status::text) AS latest_application_status,
      MAX(p.name) AS product_name
    FROM customers c
    LEFT JOIN users u ON c.created_by = u.id AND u.role = 'EMPLOYEE'
    LEFT JOIN partner_profiles part ON c.created_by = part.user_id
    LEFT JOIN applications a ON a.customer_id = c.id
    LEFT JOIN products p ON a.product_id = p.id
    ${whereStr}
    GROUP BY c.id, u.id, part.id
    ORDER BY c.created_at DESC
  `;

  const { rows } = await query(sql, params);

  return rows.map(r => ({
    customer_id: r.customer_id,
    customer_name: r.customer_name || 'N/A',
    mobile_number: r.mobile || 'N/A',
    email: r.email,
    dob: r.dob ? new Date(r.dob).toLocaleDateString() : 'N/A',
    pan: maskSensitive ? maskValue(r.pan, 'pan') : r.pan,
    aadhaar_status: r.aadhaar_last4 ? `Verified (****-${r.aadhaar_last4})` : 'Pending',
    kyc_status: r.aadhaar_last4 ? 'Verified' : 'Pending',
    address: `${r.city || ''}, ${r.state || ''}`.trim() || 'N/A',
    city: r.city || 'N/A',
    state: r.state || 'N/A',
    pincode: r.pincode || 'N/A',
    assigned_employee: r.assigned_employee,
    employee_id: r.employee_id,
    assigned_partner: r.assigned_partner,
    product: r.product_name || 'N/A',
    application_count: parseInt(r.application_count || 0),
    approved_applications: parseInt(r.approved_applications || 0),
    disbursed_applications: parseInt(r.disbursed_applications || 0),
    total_loan_amount: parseFloat(r.total_loan_amount || 0),
    application_status: r.latest_application_status ? String(r.latest_application_status).toUpperCase().replace(/_/g, ' ') : 'N/A',
    created_date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
    last_updated: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'N/A'
  }));
}

/**
 * 4. ADMIN REPORT QUERY (NO SENSITIVE CREDENTIALS EXPORTED)
 */
async function getAdminReportData(filters = {}) {
  let whereClauses = ["u.role IN ('ADMIN', 'SUPER_ADMIN', 'KYC_OPERATOR')"];
  let params = [];
  let paramIdx = 1;

  if (filters.search) {
    whereClauses.push(`(u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.mobile ILIKE $${paramIdx} OR u.employee_id ILIKE $${paramIdx})`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  if (filters.status && filters.status !== 'all') {
    whereClauses.push(`u.status::text = $${paramIdx}`);
    params.push(filters.status.toLowerCase());
    paramIdx++;
  }

  if (filters.date_from) {
    whereClauses.push(`u.created_at >= $${paramIdx}`);
    params.push(`${filters.date_from} 00:00:00`);
    paramIdx++;
  }

  if (filters.date_to) {
    whereClauses.push(`u.created_at <= $${paramIdx}`);
    params.push(`${filters.date_to} 23:59:59`);
    paramIdx++;
  }

  const sql = `
    SELECT 
      u.id AS admin_id,
      COALESCE(u.employee_id, 'N/A') AS employee_id,
      u.full_name AS name,
      u.mobile,
      u.email,
      u.role,
      COALESCE(u.designation, 'Admin Officer') AS designation,
      COALESCE(u.department, 'Administration') AS department,
      'Head Office' AS branch,
      CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END AS status,
      u.created_at,
      u.last_login
    FROM users u
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY u.created_at DESC
  `;

  const { rows } = await query(sql, params);

  return rows.map(r => ({
    admin_id: r.admin_id,
    employee_id: r.employee_id,
    name: r.name || 'N/A',
    mobile: r.mobile || 'N/A',
    email: r.email || 'N/A',
    role: r.role,
    designation: r.designation,
    department: r.department,
    branch: r.branch,
    status: r.status,
    created_date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
    last_login: r.last_login ? new Date(r.last_login).toLocaleString() : 'Never',
    last_activity: r.last_login ? new Date(r.last_login).toLocaleString() : 'N/A',
    permissions: r.role === 'SUPER_ADMIN' ? 'FULL_CONTROL' : 'ADMIN_ACCESS'
  }));
}

/**
 * 5. PARTNER REPORT QUERY
 */
async function getPartnerReportData(filters = {}) {
  let whereClauses = [];
  let params = [];
  let paramIdx = 1;

  if (filters.search) {
    whereClauses.push(`(p.first_name ILIKE $${paramIdx} OR p.last_name ILIKE $${paramIdx} OR p.partner_code ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.mobile ILIKE $${paramIdx})`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  if (filters.date_from) {
    whereClauses.push(`p.created_at >= $${paramIdx}`);
    params.push(`${filters.date_from} 00:00:00`);
    paramIdx++;
  }

  if (filters.date_to) {
    whereClauses.push(`p.created_at <= $${paramIdx}`);
    params.push(`${filters.date_to} 23:59:59`);
    paramIdx++;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      p.partner_code,
      p.first_name || ' ' || p.last_name AS partner_name,
      u.mobile,
      u.email,
      COALESCE(p.company_name, 'N/A') AS company_name,
      COALESCE(p.pincode, 'N/A') AS pincode,
      COALESCE(p.kyc_status::text, 'pending') AS kyc_status,
      COUNT(DISTINCT a.id) AS total_applications,
      COUNT(DISTINCT CASE WHEN a.status::text IN ('approved', 'commission_received') THEN a.id END) AS approved_applications,
      COUNT(DISTINCT CASE WHEN a.status::text = 'disbursed' THEN a.id END) AS disbursed_applications,
      COALESCE(w.total_earned, 0) AS total_earnings,
      p.created_at
    FROM partner_profiles p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN applications a ON a.partner_id = p.id
    LEFT JOIN partner_wallets w ON w.partner_id = p.id
    ${whereStr}
    GROUP BY p.id, u.id, w.id
    ORDER BY p.created_at DESC
  `;

  const { rows } = await query(sql, params);

  return rows.map(r => ({
    partner_code: r.partner_code,
    partner_name: r.partner_name || 'N/A',
    mobile: r.mobile || 'N/A',
    email: r.email || 'N/A',
    company_name: r.company_name,
    pincode: r.pincode,
    kyc_status: String(r.kyc_status).toUpperCase(),
    total_applications: parseInt(r.total_applications || 0),
    approved_applications: parseInt(r.approved_applications || 0),
    disbursed_applications: parseInt(r.disbursed_applications || 0),
    total_earnings: parseFloat(r.total_earnings || 0),
    created_date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'
  }));
}

/**
 * 6. APPLICATION REPORT QUERY
 */
async function getApplicationReportData(filters = {}) {
  let whereClauses = [];
  let params = [];
  let paramIdx = 1;

  if (filters.search) {
    whereClauses.push(`(a.app_number ILIKE $${paramIdx} OR c.full_name ILIKE $${paramIdx} OR c.mobile ILIKE $${paramIdx} OR p.name ILIKE $${paramIdx} OR b.name ILIKE $${paramIdx})`);
    params.push(`%${filters.search.trim()}%`);
    paramIdx++;
  }

  if (filters.status && filters.status !== 'all') {
    whereClauses.push(`a.status::text = $${paramIdx}`);
    params.push(filters.status.toLowerCase());
    paramIdx++;
  }

  if (filters.date_from) {
    whereClauses.push(`a.created_at >= $${paramIdx}`);
    params.push(`${filters.date_from} 00:00:00`);
    paramIdx++;
  }

  if (filters.date_to) {
    whereClauses.push(`a.created_at <= $${paramIdx}`);
    params.push(`${filters.date_to} 23:59:59`);
    paramIdx++;
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      a.id AS application_id,
      a.app_number AS application_number,
      c.full_name AS customer_name,
      c.mobile AS customer_mobile,
      COALESCE(p.name, 'N/A') AS product,
      COALESCE(b.name, 'N/A') AS bank,
      COALESCE(u.full_name, 'N/A') AS employee_name,
      COALESCE(u.employee_id, 'N/A') AS employee_id,
      COALESCE(part.first_name || ' ' || part.last_name, 'Direct') AS partner_name,
      a.created_at AS application_date,
      a.status AS application_status,
      COALESCE(a.soft_approval_status, 'N/A') AS soft_approval_status,
      COALESCE(a.vkyc_status, 'pending') AS kyc_status,
      COALESCE(a.approved_amount, a.loan_amount, 0) AS sanction_amount,
      COALESCE(a.final_loan_disbursed, a.final_smart_emi_disbursed, a.disbursed_amount, 0) AS disbursed_amount,
      a.disbursal_date,
      COALESCE(a.commission_amount, 0) AS commission,
      COALESCE(a.commission_status, 'pending') AS commission_status,
      a.created_at,
      a.updated_at
    FROM applications a
    JOIN customers c ON a.customer_id = c.id
    LEFT JOIN products p ON a.product_id = p.id
    LEFT JOIN banks b ON p.bank_id = b.id
    LEFT JOIN users u ON a.submitted_by = u.id
    LEFT JOIN partner_profiles part ON a.partner_id = part.id
    ${whereStr}
    ORDER BY a.created_at DESC
  `;

  const { rows } = await query(sql, params);

  return rows.map(r => ({
    application_id: r.application_id,
    application_number: r.application_number || 'N/A',
    customer_name: r.customer_name || 'N/A',
    customer_mobile: r.customer_mobile || 'N/A',
    product: r.product,
    bank: r.bank,
    employee: r.employee_name,
    employee_id: r.employee_id,
    partner: r.partner_name,
    application_date: r.application_date ? new Date(r.application_date).toLocaleDateString() : 'N/A',
    application_status: r.application_status ? String(r.application_status).toUpperCase().replace(/_/g, ' ') : 'N/A',
    soft_approval_status: String(r.soft_approval_status).toUpperCase(),
    kyc_status: String(r.kyc_status).toUpperCase(),
    sanction_amount: parseFloat(r.sanction_amount || 0),
    disbursed_amount: parseFloat(r.disbursed_amount || 0),
    disbursement_date: r.disbursal_date ? new Date(r.disbursal_date).toLocaleDateString() : 'N/A',
    commission: parseFloat(r.commission || 0),
    commission_status: String(r.commission_status).toUpperCase(),
    created_date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
    updated_date: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'N/A'
  }));
}

/**
 * 7. COMPLETE SYSTEM SUMMARY METRICS
 */
async function getCompleteSystemSummaryMetrics() {
  const empCountRes = await query(`SELECT COUNT(*) FROM users WHERE role = 'EMPLOYEE' AND is_active = true`);
  const totalEmpRes = await query(`SELECT COUNT(*) FROM users WHERE role = 'EMPLOYEE'`);
  const custRes = await query(`SELECT COUNT(*) FROM customers`);
  const appRes = await query(`SELECT COUNT(*) FROM applications`);
  const approvedRes = await query(`SELECT COUNT(*) FROM applications WHERE status::text IN ('approved', 'commission_received')`);
  const disbursedRes = await query(`SELECT COUNT(*) FROM applications WHERE status::text = 'disbursed'`);
  const businessRes = await query(`SELECT COALESCE(SUM(COALESCE(final_loan_disbursed, final_smart_emi_disbursed, approved_amount, loan_amount, 0)), 0) FROM applications WHERE status::text IN ('approved', 'disbursed', 'commission_received')`);
  const commissionRes = await query(`SELECT COALESCE(SUM(commission_amount), 0) FROM applications WHERE status::text IN ('approved', 'disbursed', 'commission_received')`);

  return {
    total_employees: parseInt(totalEmpRes.rows[0]?.count || 0),
    active_employees: parseInt(empCountRes.rows[0]?.count || 0),
    total_customers: parseInt(custRes.rows[0]?.count || 0),
    total_applications: parseInt(appRes.rows[0]?.count || 0),
    approved_applications: parseInt(approvedRes.rows[0]?.count || 0),
    disbursed_applications: parseInt(disbursedRes.rows[0]?.count || 0),
    total_disbursed_amount: parseFloat(businessRes.rows[0]?.coalesce || 0),
    total_commission: parseFloat(commissionRes.rows[0]?.coalesce || 0)
  };
}

module.exports = {
  getEmployeeReportData,
  getEmployeeCustomerDetailedReportData,
  getCustomerReportData,
  getAdminReportData,
  getPartnerReportData,
  getApplicationReportData,
  getCompleteSystemSummaryMetrics
};
