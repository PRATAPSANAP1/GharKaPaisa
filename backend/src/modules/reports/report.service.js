const { query } = require('../../config/database');
const logger = require('../../config/logger');
const crypto = require('crypto');

/**
 * Compute MD5 Filter Hash
 */
const computeFilterHash = (filters) => {
  const sortedString = JSON.stringify(filters || {}, Object.keys(filters || {}).sort());
  return crypto.createHash('md5').update(sortedString).digest('hex');
};

/**
 * Check & Read Report Cache
 */
const getCachedReport = async (reportType, filters, partnerId = null) => {
  const hash = computeFilterHash(filters);
  const { rows: [cached] } = await query(`
    SELECT report_json FROM report_cache
    WHERE report_type = $1 AND filter_hash = $2 AND (partner_id = $3 OR partner_id IS NULL) AND expires_at > NOW()
  `, [reportType, hash, partnerId]);

  return cached ? cached.report_json : null;
};

/**
 * Write Report Cache Output Payload
 */
const setCachedReport = async (reportType, filters, partnerId, payload, ttlMinutes = 15) => {
  const hash = computeFilterHash(filters);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  try {
    await query(`
      INSERT INTO report_cache (report_type, filter_hash, partner_id, expires_at, report_json, status)
      VALUES ($1, $2, $3, $4, $5, 'ready')
      ON CONFLICT (report_type, filter_hash, partner_id)
      DO UPDATE SET report_json = $5, expires_at = $4, generated_at = NOW()
    `, [reportType, hash, partnerId || null, expiresAt, JSON.stringify(payload)]);
  } catch (err) {
    logger.error('Failed to set report cache:', err.message);
  }
};

/**
 * 1. Dashboard Report Aggregate (Partner/Admin)
 */
const getDashboardReport = async (partnerId, filters) => {
  const cached = await getCachedReport('dashboard', filters, partnerId);
  if (cached) return cached;

  let whereApp = partnerId ? `WHERE partner_id = $1` : `WHERE 1=1`;
  const valuesApp = partnerId ? [partnerId] : [];

  const { rows: [apps] } = await query(`
    SELECT 
      COUNT(*) as total_applications,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
      COUNT(*) FILTER (WHERE status IN ('pending','submitted','under_review')) as pending
    FROM applications ${whereApp}
  `, valuesApp);

  let whereW = partnerId ? `WHERE partner_id = $1` : `WHERE 1=1`;
  const { rows: [w] } = await query(`
    SELECT available_balance, hold_balance, total_earned, total_withdrawn FROM partner_wallets ${whereW} LIMIT 1
  `, valuesApp);

  const payload = {
    applications: parseInt(apps?.total_applications || 0),
    approved: parseInt(apps?.approved || 0),
    rejected: parseInt(apps?.rejected || 0),
    pending: parseInt(apps?.pending || 0),
    commission: parseFloat(w?.total_earned || 0),
    available_balance: parseFloat(w?.available_balance || 0),
    held_balance: parseFloat(w?.hold_balance || 0),
    total_withdrawn: parseFloat(w?.total_withdrawn || 0)
  };

  await setCachedReport('dashboard', filters, partnerId, payload);
  return payload;
};

/**
 * 2. Applications Report
 */
const getApplicationsReport = async (partnerId, filters) => {
  const cached = await getCachedReport('applications', filters, partnerId);
  if (cached) return cached;

  let where = partnerId ? `WHERE a.partner_id = $1` : `WHERE 1=1`;
  const values = partnerId ? [partnerId] : [];

  const { rows } = await query(`
    SELECT 
      a.id, a.app_number, a.status, a.payout_amount, a.created_at,
      p.name as product_name, b.name as bank_name,
      CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as customer_name
    FROM applications a
    LEFT JOIN products p ON p.id = a.product_id
    LEFT JOIN banks b ON b.id = p.bank_id
    LEFT JOIN customers c ON c.id = a.customer_id
    ${where}
    ORDER BY a.created_at DESC LIMIT 100
  `, values);

  await setCachedReport('applications', filters, partnerId, rows);
  return rows;
};

/**
 * 3. Customers Report
 */
const getCustomersReport = async (partnerId, filters) => {
  const cached = await getCachedReport('customers', filters, partnerId);
  if (cached) return cached;

  let where = partnerId ? `WHERE c.partner_id = $1` : `WHERE 1=1`;
  const values = partnerId ? [partnerId] : [];

  const { rows } = await query(`
    SELECT 
      c.id, c.first_name, c.last_name, c.mobile, c.email, c.city, c.created_at,
      COUNT(a.id) as total_applications
    FROM customers c
    LEFT JOIN applications a ON a.customer_id = c.id
    ${where}
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100
  `, values);

  await setCachedReport('customers', filters, partnerId, rows);
  return rows;
};

/**
 * 4. Wallet Report
 */
const getWalletReport = async (partnerId, filters) => {
  const cached = await getCachedReport('wallet', filters, partnerId);
  if (cached) return cached;

  let where = partnerId ? `WHERE wl.partner_id = $1` : `WHERE 1=1`;
  const values = partnerId ? [partnerId] : [];

  const { rows } = await query(`
    SELECT 
      wl.id, wl.transaction_type, wl.credit, wl.debit, wl.balance_after,
      wl.description, wl.reference_number, wl.status, wl.created_at
    FROM wallet_ledger wl
    ${where}
    ORDER BY wl.created_at DESC LIMIT 100
  `, values);

  await setCachedReport('wallet', filters, partnerId, rows);
  return rows;
};

/**
 * 5. Commission Report
 */
const getCommissionReport = async (partnerId, filters) => {
  const cached = await getCachedReport('commission', filters, partnerId);
  if (cached) return cached;

  let where = partnerId ? `WHERE cl.partner_id = $1` : `WHERE 1=1`;
  const values = partnerId ? [partnerId] : [];

  const { rows } = await query(`
    SELECT 
      cl.id, cl.commission_earned, cl.commission_rate, cl.status, cl.created_at,
      p.name as product_name, a.app_number
    FROM commission_ledger cl
    LEFT JOIN applications a ON a.id = cl.application_id
    LEFT JOIN products p ON p.id = cl.product_id
    ${where}
    ORDER BY cl.created_at DESC LIMIT 100
  `, values);

  await setCachedReport('commission', filters, partnerId, rows);
  return rows;
};

/**
 * 6. Team Report
 */
const getTeamReport = async (partnerId, filters) => {
  const cached = await getCachedReport('team', filters, partnerId);
  if (cached) return cached;

  const { rows } = await query(`
    SELECT 
      ptr.child_partner_id as id,
      p.first_name, p.last_name, p.partner_code, p.kyc_status, p.status, p.created_at,
      COALESCE(SUM(tc.commission_amount), 0) as total_override
    FROM partner_team_relationships ptr
    JOIN partner_profiles p ON p.id = ptr.child_partner_id
    LEFT JOIN team_commissions tc ON tc.child_partner_id = p.id AND tc.parent_partner_id = ptr.parent_partner_id
    WHERE ptr.parent_partner_id = $1
    GROUP BY ptr.child_partner_id, p.id ORDER BY p.created_at DESC
  `, [partnerId]);

  await setCachedReport('team', filters, partnerId, rows);
  return rows;
};

/**
 * 7. Withdrawals Report
 */
const getWithdrawalsReport = async (partnerId, filters) => {
  const cached = await getCachedReport('withdrawals', filters, partnerId);
  if (cached) return cached;

  let where = partnerId ? `WHERE w.partner_id = $1` : `WHERE 1=1`;
  const values = partnerId ? [partnerId] : [];

  const { rows } = await query(`
    SELECT 
      w.id, w.amount, w.status, w.utr_number, w.bank_reference, w.created_at, w.transferred_at,
      bd.bank_name, bd.account_number
    FROM wallet_withdrawals w
    LEFT JOIN partner_bank_details bd ON bd.id = w.bank_detail_id
    ${where}
    ORDER BY w.created_at DESC LIMIT 100
  `, values);

  await setCachedReport('withdrawals', filters, partnerId, rows);
  return rows;
};

/**
 * 8. Products Report
 */
const getProductsReport = async (partnerId, filters) => {
  const cached = await getCachedReport('products', filters, partnerId);
  if (cached) return cached;

  const { rows } = await query(`
    SELECT 
      p.id, p.name, p.category, b.name as bank_name,
      COUNT(a.id) as total_applications,
      COUNT(a.id) FILTER (WHERE a.status = 'approved') as approved_applications,
      COALESCE(SUM(a.payout_amount) FILTER (WHERE a.status = 'approved'), 0) as total_payout
    FROM products p
    LEFT JOIN banks b ON b.id = p.bank_id
    LEFT JOIN applications a ON a.product_id = p.id ${partnerId ? 'AND a.partner_id = $1' : ''}
    GROUP BY p.id, b.name ORDER BY total_applications DESC
  `, partnerId ? [partnerId] : []);

  await setCachedReport('products', filters, partnerId, rows);
  return rows;
};

/**
 * 9. Banks Report
 */
const getBanksReport = async (partnerId, filters) => {
  const cached = await getCachedReport('banks', filters, partnerId);
  if (cached) return cached;

  const { rows } = await query(`
    SELECT 
      b.id, b.name,
      COUNT(a.id) as total_applications,
      COUNT(a.id) FILTER (WHERE a.status = 'approved') as approved_applications,
      COALESCE(ROUND((COUNT(a.id) FILTER (WHERE a.status = 'approved')::decimal / NULLIF(COUNT(a.id),0)) * 100, 2), 0) as approval_percentage
    FROM banks b
    LEFT JOIN products p ON p.bank_id = b.id
    LEFT JOIN applications a ON a.product_id = p.id ${partnerId ? 'AND a.partner_id = $1' : ''}
    GROUP BY b.id ORDER BY total_applications DESC
  `, partnerId ? [partnerId] : []);

  await setCachedReport('banks', filters, partnerId, rows);
  return rows;
};

/**
 * 10. Revenue Report (Super Admin Platform Level)
 */
const getRevenueReport = async (filters) => {
  const cached = await getCachedReport('revenue', filters, null);
  if (cached) return cached;

  const { rows: [rev] } = await query(`
    SELECT 
      COALESCE(SUM(credit), 0) as total_platform_credits,
      COALESCE(SUM(debit), 0) as total_platform_debits
    FROM wallet_ledger WHERE status = 'completed'
  `);

  const { rows: [withd] } = await query(`
    SELECT COALESCE(SUM(amount), 0) as total_withdrawals FROM wallet_withdrawals WHERE status = 'completed'
  `);

  const { rows: [apps] } = await query(`
    SELECT COUNT(*) as total_apps FROM applications
  `);

  const payload = {
    total_platform_revenue: parseFloat(rev?.total_platform_credits || 0),
    total_commission_credited: parseFloat(rev?.total_platform_credits || 0),
    total_withdrawals_paid: parseFloat(withd?.total_withdrawals || 0),
    total_applications_processed: parseInt(apps?.total_apps || 0)
  };

  await setCachedReport('revenue', filters, null, payload);
  return payload;
};

/**
 * Generate Multi-Format Export File
 */
const generateReportExport = async (partnerId, reportType, format = 'csv', filters = {}) => {
  const fileName = `GharKaPaisa_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.${format}`;

  await query(`
    INSERT INTO report_exports (partner_id, report_type, format, file_name, status)
    VALUES ($1, $2, $3, $4, 'completed')
  `, [partnerId, reportType, format, fileName]);

  return { file_name: fileName, format, download_url: `/api/v1/reports/${reportType}` };
};

/**
 * Schedule Recurring Report
 */
const createScheduledReport = async (partnerId, reportType, frequency, recipientEmail) => {
  const { rows: [sched] } = await query(`
    INSERT INTO scheduled_reports (partner_id, report_type, frequency, recipient_email, next_run, status)
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 month', 'active')
    RETURNING *
  `, [partnerId, reportType, frequency, recipientEmail]);

  return sched;
};

module.exports = {
  getDashboardReport,
  getApplicationsReport,
  getCustomersReport,
  getWalletReport,
  getCommissionReport,
  getTeamReport,
  getWithdrawalsReport,
  getProductsReport,
  getBanksReport,
  getRevenueReport,
  generateReportExport,
  createScheduledReport
};
