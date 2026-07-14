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

const getReferralAnalytics = async () => {
  const { rows: [summary] } = await query(`
    SELECT
      (SELECT COUNT(*) FROM partner_profiles) as total_partners,
      (SELECT COUNT(*) FROM users u JOIN partner_profiles p ON p.user_id = u.id WHERE u.status = 'active') as active_partners,
      (SELECT COUNT(*) FROM users u JOIN partner_profiles p ON p.user_id = u.id WHERE u.status IN ('inactive', 'pending')) as inactive_partners,
      (SELECT COUNT(*) FROM partner_profiles WHERE kyc_status = 'pending' OR kyc_status = 'under_review') as pending_kyc,
      (SELECT COUNT(*) FROM partner_profiles WHERE kyc_status = 'approved') as approved_kyc,
      (SELECT COUNT(*) FROM partner_profiles WHERE parent_partner_id IS NOT NULL) as total_team_members,
      (SELECT COALESCE(MAX(children_count), 0) FROM partner_profiles) as largest_team_size,
      (SELECT COALESCE(MAX(team_commission), 0) FROM partner_profiles) as highest_team_commission,
      (SELECT COUNT(*) FROM partner_profiles WHERE created_at >= NOW() - INTERVAL '1 day') as daily_registrations,
      (SELECT COUNT(*) FROM partner_profiles WHERE created_at >= NOW() - INTERVAL '7 days') as weekly_registrations,
      (SELECT COUNT(*) FROM partner_profiles WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_registrations
  `);

  const totalPartners = parseInt(summary.total_partners || 0);
  const totalTeamMembers = parseInt(summary.total_team_members || 0);

  const referralConversionRate = totalPartners > 0 
    ? parseFloat(((totalTeamMembers / totalPartners) * 100).toFixed(2)) 
    : 0;

  const { rows: [avgTeam] } = await query(`
    SELECT COALESCE(AVG(cnt), 0)::numeric(10,2) as avg_team_size
    FROM (
      SELECT parent_partner_id, COUNT(*) as cnt 
      FROM partner_profiles 
      WHERE parent_partner_id IS NOT NULL 
      GROUP BY parent_partner_id
    ) t
  `);

  const { rows: topReferrers } = await query(`
    SELECT p.id, p.first_name, p.last_name, p.partner_code, p.referral_count, p.children_count, p.team_commission,
           u.email, u.mobile, u.status
    FROM partner_profiles p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.referral_count DESC, p.children_count DESC
    LIMIT 5
  `);

  const { rows: topTeams } = await query(`
    SELECT p.id, p.first_name, p.last_name, p.partner_code, p.children_count, p.team_commission,
           u.email, u.mobile
    FROM partner_profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.children_count > 0
    ORDER BY p.team_commission DESC, p.children_count DESC
    LIMIT 5
  `);

  return {
    ...summary,
    total_partners: parseInt(summary.total_partners),
    active_partners: parseInt(summary.active_partners),
    inactive_partners: parseInt(summary.inactive_partners),
    pending_kyc: parseInt(summary.pending_kyc),
    approved_kyc: parseInt(summary.approved_kyc),
    total_team_members: parseInt(summary.total_team_members),
    largest_team_size: parseInt(summary.largest_team_size),
    highest_team_commission: parseFloat(summary.highest_team_commission),
    daily_registrations: parseInt(summary.daily_registrations),
    weekly_registrations: parseInt(summary.weekly_registrations),
    monthly_registrations: parseInt(summary.monthly_registrations),
    referral_conversion_rate: referralConversionRate,
    average_team_size: parseFloat(avgTeam?.avg_team_size || 0),
    top_referrers: topReferrers,
    top_performing_teams: topTeams
  };
};

module.exports = {
  getSuperAdminDashboard,
  getAdminDashboard,
  getPartnerDashboard,
  getReferralAnalytics
};
