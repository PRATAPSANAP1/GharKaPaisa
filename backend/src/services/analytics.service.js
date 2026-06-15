const { query } = require('../config/db');

const getSuperAdminDashboard = async () => {
  const { rows: [stats] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM Partner_profiles) as total_partners,
      (SELECT COUNT(*) FROM users WHERE role = 'employee') as total_employees,
      (SELECT COUNT(*) FROM Partner_profiles WHERE kyc_status = 'pending') as pending_kyc,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM applications WHERE commission_status IN ('approved', 'processed')) as total_revenue
  `);
  return stats;
};

const getAdminDashboard = async (adminId) => {
  const { rows: [stats] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM Partner_profiles WHERE approved_by = $1) as assigned_partners,
      (SELECT COUNT(*) FROM applications WHERE created_at::date = CURRENT_DATE) as daily_applications,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM applications WHERE status IN ('approved', 'disbursed')) as total_commission_generated
  `, [adminId]);
  return stats;
};

const getPartnerDashboard = async (partnerId) => {
  const { rows: [wallet] } = await query(`
    SELECT available_balance, hold_balance, total_earned FROM wallets WHERE Partner_id = $1
  `, [partnerId]);

  const { rows: [appStats] } = await query(`
    SELECT
      COUNT(*) as total_applications,
      COUNT(*) FILTER (WHERE status = 'submitted') as pending_applications,
      COUNT(*) FILTER (WHERE status = 'approved' OR status = 'disbursed') as approved_applications
    FROM applications WHERE Partner_id = $1
  `, [partnerId]);

  return {
    wallet: wallet || { available_balance: 0, hold_balance: 0, total_earned: 0 },
    applications: appStats
  };
};

module.exports = {
  getSuperAdminDashboard,
  getAdminDashboard,
  getPartnerDashboard
};
