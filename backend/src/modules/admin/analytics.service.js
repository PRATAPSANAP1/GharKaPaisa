const { query } = require('../../config/database');

const getSuperAdminDashboard = async () => {
  const { rows: [stats] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM partner_profiles) as total_partners,
      (SELECT COUNT(*) FROM users u JOIN partner_profiles p ON p.user_id = u.id WHERE u.status = 'active') as active_partners,
      (SELECT COUNT(*) FROM partner_profiles WHERE kyc_status = 'pending') as pending_kyc,
      (SELECT COUNT(*) FROM leads) as total_leads,
      (SELECT COUNT(*) FROM leads WHERE status = 'approved') as approved_leads,
      (SELECT COUNT(*) FROM leads WHERE status = 'rejected') as rejected_leads,
      (SELECT COALESCE(SUM(amount), 0) FROM withdrawal_requests WHERE status = 'processed') as total_commission_paid,
      (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
      (SELECT COUNT(*) FROM banks) as total_banks,
      (SELECT COUNT(*) FROM products) as total_products
  `);
  return stats;
};

const getAdminDashboard = async (adminId) => {
  const { rows: [stats] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM leads WHERE status = 'pending') as pending_leads,
      (SELECT COUNT(*) FROM leads WHERE created_at::date = CURRENT_DATE) as todays_leads,
      (SELECT COUNT(*) FROM partner_profiles WHERE kyc_status = 'pending') as pending_kyc,
      (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals
  `);

  const { rows: recentPartners } = await query(`
    SELECT p.id, p.first_name, p.last_name, p.partner_code, p.created_at, u.email, u.mobile, u.status
    FROM partner_profiles p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT 5
  `);

  return {
    ...stats,
    recent_partners: recentPartners
  };
};

const getPartnerDashboard = async (partnerId) => {
  const { rows: [wallet] } = await query(`
    SELECT available_balance, hold_balance, total_earned FROM partner_wallets WHERE partner_id = $1
  `, [partnerId]);

  const { rows: [leadStats] } = await query(`
    SELECT
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_leads,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leads,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_leads
    FROM leads WHERE partner_id = $1
  `, [partnerId]);

  const { rows: topProducts } = await query(`
    SELECT p.id, p.name, p.image_url, b.short_code as bank_code, COUNT(l.id) as sales_count
    FROM products p
    JOIN banks b ON b.id = p.bank_id
    LEFT JOIN leads l ON l.product_id = p.id AND l.partner_id = $1 AND l.status IN ('approved', 'confirmed')
    GROUP BY p.id, p.name, p.image_url, b.short_code
    ORDER BY sales_count DESC
    LIMIT 5
  `, [partnerId]);

  return {
    wallet: wallet || { available_balance: 0, hold_balance: 0, total_earned: 0 },
    leads: leadStats || { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 },
    top_products: topProducts
  };
};

module.exports = {
  getSuperAdminDashboard,
  getAdminDashboard,
  getPartnerDashboard
};
