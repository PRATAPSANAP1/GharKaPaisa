const { query } = require('../../config/database');
const logger = require('../../config/logger');
const qrcode = require('qrcode');

/**
 * Get logged-in partner profile ID for a user ID
 */
async function getPartnerProfileIdByUserId(userId) {
  const { rows } = await query(
    `SELECT id FROM partner_profiles WHERE user_id = $1`,
    [userId]
  );
  return rows[0]?.id || null;
}

/**
 * Check if targetPartnerId is in rootPartnerId's downline (or is rootPartnerId)
 */
async function isPartnerInDownline(rootPartnerId, targetPartnerId) {
  if (rootPartnerId === targetPartnerId) return true;
  const { rows } = await query(
    `SELECT 1 FROM partner_team_relationships 
     WHERE parent_partner_id = $1 AND child_partner_id = $2 LIMIT 1`,
    [rootPartnerId, targetPartnerId]
  );
  return rows.length > 0;
}

/**
 * 1. GET TEAM DASHBOARD KPI METRICS
 */
async function getTeamDashboard(partnerId) {
  // Direct members count
  const { rows: [{ direct_count }] } = await query(
    `SELECT COUNT(*)::int AS direct_count 
     FROM partner_team_relationships 
     WHERE parent_partner_id = $1 AND level = 1`,
    [partnerId]
  );

  // Total downline count & Indirect count
  const { rows: [{ total_members, indirect_members }] } = await query(
    `SELECT 
       COUNT(*)::int AS total_members,
       COUNT(CASE WHEN level > 1 THEN 1 END)::int AS indirect_members
     FROM partner_team_relationships 
     WHERE parent_partner_id = $1`,
    [partnerId]
  );

  // Joinings: Today & Month
  const { rows: [{ today_joinings, month_joinings }] } = await query(
    `SELECT 
       COUNT(CASE WHEN p.created_at >= CURRENT_DATE THEN 1 END)::int AS today_joinings,
       COUNT(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::int AS month_joinings
     FROM partner_team_relationships r
     JOIN partner_profiles p ON p.id = r.child_partner_id
     WHERE r.parent_partner_id = $1`,
    [partnerId]
  );

  // Account Statuses & KYC Statuses
  const { rows: [{ active_members, inactive_members, verified_members, pending_kyc }] } = await query(
    `SELECT 
       COUNT(CASE WHEN u.status = 'active' THEN 1 END)::int AS active_members,
       COUNT(CASE WHEN u.status IN ('inactive', 'suspended', 'pending') THEN 1 END)::int AS inactive_members,
       COUNT(CASE WHEN p.kyc_status = 'approved' THEN 1 END)::int AS verified_members,
       COUNT(CASE WHEN p.kyc_status IN ('pending', 'under_review') THEN 1 END)::int AS pending_kyc
     FROM partner_team_relationships r
     JOIN partner_profiles p ON p.id = r.child_partner_id
     JOIN users u ON u.id = p.user_id
     WHERE r.parent_partner_id = $1`,
    [partnerId]
  );

  // Downline Applications Metrics
  const { rows: [{ applications_submitted, applications_approved, applications_pending, team_business }] } = await query(
    `SELECT 
       COUNT(*)::int AS applications_submitted,
       COUNT(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN 1 END)::int AS applications_approved,
       COUNT(CASE WHEN a.status IN ('submitted', 'under_review', 'draft', 'pending') THEN 1 END)::int AS applications_pending,
       COALESCE(SUM(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') 
         THEN COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0) ELSE 0 END), 0)::numeric AS team_business
     FROM partner_team_relationships r
     JOIN applications a ON a.partner_id = r.child_partner_id
     WHERE r.parent_partner_id = $1`,
    [partnerId]
  );

  // Commissions Metrics (10% override earnings for team)
  const { rows: [{ today_commission, monthly_commission, lifetime_commission }] } = await query(
    `SELECT 
       COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN COALESCE(amount, commission_amount, 0) ELSE 0 END), 0)::numeric AS today_commission,
       COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN COALESCE(amount, commission_amount, 0) ELSE 0 END), 0)::numeric AS monthly_commission,
       COALESCE(SUM(COALESCE(amount, commission_amount, 0)), 0)::numeric AS lifetime_commission
     FROM team_commissions
     WHERE parent_partner_id = $1`,
    [partnerId]
  );

  // Average Conversion Rate
  const totalApps = parseInt(applications_submitted) || 0;
  const approvedApps = parseInt(applications_approved) || 0;
  const average_conversion_rate = totalApps > 0 ? parseFloat(((approvedApps / totalApps) * 100).toFixed(1)) : 0;

  // Top Performer (Downline member with highest business)
  const { rows: [topPerformerRow] } = await query(
    `SELECT 
       p.id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url, p.rank,
       COUNT(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN 1 END)::int AS approved_count,
       COALESCE(SUM(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') 
         THEN COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0) ELSE 0 END), 0)::numeric AS business
     FROM partner_team_relationships r
     JOIN partner_profiles p ON p.id = r.child_partner_id
     LEFT JOIN applications a ON a.partner_id = p.id
     WHERE r.parent_partner_id = $1
     GROUP BY p.id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url, p.rank
     ORDER BY business DESC, approved_count DESC
     LIMIT 1`,
    [partnerId]
  );

  // Lowest Performer (Downline member with lowest business)
  const { rows: [lowestPerformerRow] } = await query(
    `SELECT 
       p.id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url, p.rank,
       COUNT(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN 1 END)::int AS approved_count,
       COALESCE(SUM(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') 
         THEN COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0) ELSE 0 END), 0)::numeric AS business
     FROM partner_team_relationships r
     JOIN partner_profiles p ON p.id = r.child_partner_id
     LEFT JOIN applications a ON a.partner_id = p.id
     WHERE r.parent_partner_id = $1
     GROUP BY p.id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url, p.rank
     ORDER BY business ASC, approved_count ASC
     LIMIT 1`,
    [partnerId]
  );

  // Recent 5 Joinings
  const { rows: recentJoinings } = await query(
    `SELECT 
       p.id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url, p.rank, p.kyc_status,
       u.mobile, u.email, u.status AS user_status, r.level, p.created_at
     FROM partner_team_relationships r
     JOIN partner_profiles p ON p.id = r.child_partner_id
     JOIN users u ON u.id = p.user_id
     WHERE r.parent_partner_id = $1
     ORDER BY p.created_at DESC
     LIMIT 5`,
    [partnerId]
  );

  return {
    total_members: parseInt(total_members) || 0,
    direct_members: parseInt(direct_count) || 0,
    indirect_members: parseInt(indirect_members) || 0,
    today_joinings: parseInt(today_joinings) || 0,
    this_month_joinings: parseInt(month_joinings) || 0,
    active_members: parseInt(active_members) || 0,
    inactive_members: parseInt(inactive_members) || 0,
    verified_members: parseInt(verified_members) || 0,
    pending_kyc: parseInt(pending_kyc) || 0,
    applications_submitted: parseInt(applications_submitted) || 0,
    applications_approved: parseInt(applications_approved) || 0,
    applications_pending: parseInt(applications_pending) || 0,
    team_business: parseFloat(team_business) || 0,
    today_commission: parseFloat(today_commission) || 0,
    monthly_commission: parseFloat(monthly_commission) || 0,
    lifetime_commission: parseFloat(lifetime_commission) || 0,
    average_conversion_rate,
    top_performer: topPerformerRow ? {
      id: topPerformerRow.id,
      name: `${topPerformerRow.first_name || ''} ${topPerformerRow.last_name || ''}`.trim(),
      code: topPerformerRow.partner_code,
      photo: topPerformerRow.profile_photo_url,
      rank: topPerformerRow.rank || 'Partner',
      business: parseFloat(topPerformerRow.business),
      apps: parseInt(topPerformerRow.approved_count)
    } : null,
    lowest_performer: lowestPerformerRow ? {
      id: lowestPerformerRow.id,
      name: `${lowestPerformerRow.first_name || ''} ${lowestPerformerRow.last_name || ''}`.trim(),
      code: lowestPerformerRow.partner_code,
      photo: lowestPerformerRow.profile_photo_url,
      rank: lowestPerformerRow.rank || 'Partner',
      business: parseFloat(lowestPerformerRow.business),
      apps: parseInt(lowestPerformerRow.approved_count)
    } : null,
    recent_joinings: recentJoinings.map(j => ({
      id: j.id,
      name: `${j.first_name || ''} ${j.last_name || ''}`.trim(),
      code: j.partner_code,
      photo: j.profile_photo_url,
      rank: j.rank || 'Partner',
      level: j.level,
      status: j.user_status,
      kyc_status: j.kyc_status,
      joined_at: j.created_at
    }))
  };
}

/**
 * 2. GET LAZY-LOADED HIERARCHICAL TREE NODES
 */
async function getTeamTree(rootPartnerId, targetParentId = null) {
  const actualParentId = targetParentId || rootPartnerId;

  // Root node details if requesting top level
  let rootNode = null;
  if (!targetParentId || targetParentId === rootPartnerId) {
    const { rows: [root] } = await query(
      `SELECT p.id, p.user_id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url,
              p.rank, p.kyc_status, u.status AS user_status, p.created_at
       FROM partner_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [rootPartnerId]
    );

    if (root) {
      // Calculate root direct children count
      const { rows: [{ direct_count }] } = await query(
        `SELECT COUNT(*)::int AS direct_count FROM partner_team_relationships WHERE parent_partner_id = $1 AND level = 1`,
        [rootPartnerId]
      );
      // Calculate root team business
      const { rows: [{ business }] } = await query(
        `SELECT COALESCE(SUM(COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0)), 0)::numeric AS business
         FROM partner_team_relationships r
         JOIN applications a ON a.partner_id = r.child_partner_id
         WHERE r.parent_partner_id = $1 AND a.status IN ('approved', 'disbursed', 'confirmed')`,
        [rootPartnerId]
      );
      // Calculate root commission
      const { rows: [{ commission }] } = await query(
        `SELECT COALESCE(SUM(COALESCE(amount, commission_amount, 0)), 0)::numeric AS commission FROM team_commissions WHERE parent_partner_id = $1`,
        [rootPartnerId]
      );

      rootNode = {
        id: root.id,
        user_id: root.user_id,
        partner_code: root.partner_code,
        full_name: `${root.first_name || ''} ${root.last_name || ''}`.trim(),
        profile_photo_url: root.profile_photo_url,
        rank: root.rank || 'Partner',
        status: root.user_status,
        kyc_status: root.kyc_status,
        level: 0,
        business: parseFloat(business) || 0,
        commission: parseFloat(commission) || 0,
        direct_children_count: parseInt(direct_count) || 0,
        has_children: (parseInt(direct_count) || 0) > 0,
        joined_at: root.created_at
      };
    }
  }

  // Fetch direct children of actualParentId
  const { rows: children } = await query(
    `SELECT 
       cp.id, cp.user_id, cp.partner_code, cp.first_name, cp.last_name, cp.profile_photo_url,
       cp.rank, cp.kyc_status, u.status AS user_status, cp.created_at,
       (SELECT COUNT(*)::int FROM partner_team_relationships WHERE parent_partner_id = cp.id AND level = 1) AS direct_children_count,
       (SELECT COALESCE(SUM(COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0)), 0)::numeric 
        FROM partner_team_relationships r JOIN applications a ON a.partner_id = r.child_partner_id 
        WHERE r.parent_partner_id = cp.id AND a.status IN ('approved', 'disbursed', 'confirmed')) AS team_business,
       (SELECT COALESCE(SUM(COALESCE(amount, commission_amount, 0)), 0)::numeric FROM team_commissions WHERE parent_partner_id = cp.id) AS team_commission,
       rel.level AS relative_level
     FROM partner_team_relationships rel
     JOIN partner_profiles cp ON cp.id = rel.child_partner_id
     JOIN users u ON u.id = cp.user_id
     WHERE rel.parent_partner_id = $1 AND rel.level = 1
     ORDER BY cp.created_at DESC`,
    [actualParentId]
  );

  const formattedChildren = children.map(c => ({
    id: c.id,
    user_id: c.user_id,
    partner_code: c.partner_code,
    full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
    first_name: c.first_name,
    last_name: c.last_name,
    profile_photo_url: c.profile_photo_url,
    rank: c.rank || 'Partner',
    status: c.user_status,
    kyc_status: c.kyc_status,
    level: c.relative_level,
    business: parseFloat(c.team_business) || 0,
    commission: parseFloat(c.team_commission) || 0,
    direct_children_count: parseInt(c.direct_children_count) || 0,
    has_children: (parseInt(c.direct_children_count) || 0) > 0,
    joined_at: c.created_at
  }));

  if (rootNode) {
    return { root: rootNode, children: formattedChildren };
  }
  return { children: formattedChildren };
}

/**
 * 3. GET FLAT PAGINATED TEAM MEMBERS LIST WITH FILTERS & SEARCH
 */
async function getTeamMembersList(partnerId, options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
  const offset = (page - 1) * limit;

  let whereClauses = [`r.parent_partner_id = $1`];
  let params = [partnerId];
  let paramIdx = 2;

  if (options.search) {
    whereClauses.push(`(
      cp.first_name ILIKE $${paramIdx} OR 
      cp.last_name ILIKE $${paramIdx} OR 
      cp.partner_code ILIKE $${paramIdx} OR 
      u.email ILIKE $${paramIdx} OR 
      u.mobile ILIKE $${paramIdx}
    )`);
    params.push(`%${options.search}%`);
    paramIdx++;
  }

  if (options.status) {
    whereClauses.push(`u.status = $${paramIdx}`);
    params.push(options.status);
    paramIdx++;
  }

  if (options.rank) {
    whereClauses.push(`cp.rank = $${paramIdx}`);
    params.push(options.rank);
    paramIdx++;
  }

  if (options.kyc_status) {
    whereClauses.push(`cp.kyc_status = $${paramIdx}`);
    params.push(options.kyc_status);
    paramIdx++;
  }

  if (options.level) {
    whereClauses.push(`r.level = $${paramIdx}`);
    params.push(parseInt(options.level));
    paramIdx++;
  }

  if (options.joined_period === 'today') {
    whereClauses.push(`cp.created_at >= CURRENT_DATE`);
  } else if (options.joined_period === 'this_month') {
    whereClauses.push(`cp.created_at >= DATE_TRUNC('month', CURRENT_DATE)`);
  }

  const whereStr = whereClauses.join(' AND ');

  // Total count
  const { rows: [{ total }] } = await query(
    `SELECT COUNT(*)::int AS total
     FROM partner_team_relationships r
     JOIN partner_profiles cp ON cp.id = r.child_partner_id
     JOIN users u ON u.id = cp.user_id
     WHERE ${whereStr}`,
    params
  );

  // Paginated query
  const queryStr = `
    SELECT 
      cp.id, cp.user_id, cp.partner_code, cp.first_name, cp.last_name, cp.profile_photo_url,
      cp.rank, cp.kyc_status, u.status AS user_status, u.mobile, u.email, cp.created_at,
      r.level,
      parent.first_name AS parent_first_name, parent.last_name AS parent_last_name, parent.partner_code AS parent_partner_code,
      (SELECT COUNT(*)::int FROM partner_team_relationships WHERE parent_partner_id = cp.id AND level = 1) AS children_count,
      (SELECT COUNT(*)::int FROM applications WHERE partner_id = cp.id) AS applications_count,
      (SELECT COALESCE(SUM(COALESCE(approved_amount, loan_amount, credit_limit, 0)), 0)::numeric 
       FROM applications WHERE partner_id = cp.id AND status IN ('approved', 'disbursed', 'confirmed')) AS total_business,
      (SELECT COALESCE(SUM(COALESCE(amount, commission_amount, 0)), 0)::numeric FROM team_commissions WHERE child_partner_id = cp.id) AS total_commission
    FROM partner_team_relationships r
    JOIN partner_profiles cp ON cp.id = r.child_partner_id
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN partner_profiles parent ON parent.id = cp.parent_partner_id
    WHERE ${whereStr}
    ORDER BY cp.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);

  const { rows } = await query(queryStr, params);

  const members = rows.map(m => ({
    id: m.id,
    user_id: m.user_id,
    partner_code: m.partner_code,
    full_name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
    first_name: m.first_name,
    last_name: m.last_name,
    profile_photo_url: m.profile_photo_url,
    mobile: m.mobile || 'N/A',
    email: m.email || 'N/A',
    rank: m.rank || 'Partner',
    status: m.user_status,
    kyc_status: m.kyc_status,
    level: m.level,
    parent_name: m.parent_first_name ? `${m.parent_first_name} ${m.parent_last_name || ''}`.trim() : 'N/A',
    parent_code: m.parent_partner_code || 'N/A',
    children_count: parseInt(m.children_count) || 0,
    applications_count: parseInt(m.applications_count) || 0,
    total_business: parseFloat(m.total_business) || 0,
    total_commission: parseFloat(m.total_commission) || 0,
    joined_at: m.created_at
  }));

  const totalNum = parseInt(total) || 0;
  return {
    members,
    pagination: {
      total: totalNum,
      page,
      limit,
      total_pages: Math.ceil(totalNum / limit) || 1
    }
  };
}

/**
 * 4. GET TEAM ANALYTICS DATA FOR CHARTS & CONVERSION FUNNEL
 */
async function getTeamAnalytics(partnerId, period = '30d') {
  let intervalDays = 30;
  if (period === '7d') intervalDays = 7;
  if (period === '90d') intervalDays = 90;
  if (period === '1y') intervalDays = 365;

  // Daily joining trend
  const { rows: dailyJoiningTrend } = await query(
    `SELECT 
       TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
       COUNT(cp.id)::int AS joinings
     FROM GENERATE_SERIES(CURRENT_DATE - INTERVAL '${intervalDays} days', CURRENT_DATE, '1 day'::interval) d(day)
     LEFT JOIN partner_team_relationships r ON r.parent_partner_id = $1
     LEFT JOIN partner_profiles cp ON cp.id = r.child_partner_id AND DATE(cp.created_at) = DATE(d.day)
     GROUP BY d.day
     ORDER BY d.day ASC`,
    [partnerId]
  );

  // Monthly joining trend (last 12 months)
  const { rows: monthlyJoiningTrend } = await query(
    `SELECT 
       TO_CHAR(d.month, 'Mon YYYY') AS month,
       COUNT(cp.id)::int AS joinings
     FROM GENERATE_SERIES(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'), DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) d(month)
     LEFT JOIN partner_team_relationships r ON r.parent_partner_id = $1
     LEFT JOIN partner_profiles cp ON cp.id = r.child_partner_id AND DATE_TRUNC('month', cp.created_at) = d.month
     GROUP BY d.month
     ORDER BY d.month ASC`,
    [partnerId]
  );

  // Business trend
  const { rows: businessTrend } = await query(
    `SELECT 
       TO_CHAR(d.month, 'Mon YYYY') AS month,
       COALESCE(SUM(COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0)), 0)::numeric AS business,
       COUNT(a.id)::int AS applications
     FROM GENERATE_SERIES(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'), DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) d(month)
     LEFT JOIN partner_team_relationships r ON r.parent_partner_id = $1
     LEFT JOIN applications a ON a.partner_id = r.child_partner_id 
       AND DATE_TRUNC('month', a.created_at) = d.month 
       AND a.status IN ('approved', 'disbursed', 'confirmed')
     GROUP BY d.month
     ORDER BY d.month ASC`,
    [partnerId]
  );

  // Commission trend
  const { rows: commissionTrend } = await query(
    `SELECT 
       TO_CHAR(d.month, 'Mon YYYY') AS month,
       COALESCE(SUM(COALESCE(tc.amount, tc.commission_amount, 0)), 0)::numeric AS commission
     FROM GENERATE_SERIES(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'), DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) d(month)
     LEFT JOIN team_commissions tc ON tc.parent_partner_id = $1 AND DATE_TRUNC('month', tc.created_at) = d.month
     GROUP BY d.month
     ORDER BY d.month ASC`,
    [partnerId]
  );

  // Top products breakdown by downline sales
  const { rows: topProducts } = await query(
    `SELECT 
       p.name AS product_name, p.category,
       COUNT(a.id)::int AS sales_count,
       COALESCE(SUM(COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0)), 0)::numeric AS total_amount
     FROM partner_team_relationships r
     JOIN applications a ON a.partner_id = r.child_partner_id
     JOIN products p ON p.id = a.product_id
     WHERE r.parent_partner_id = $1 AND a.status IN ('approved', 'disbursed', 'confirmed')
     GROUP BY p.id, p.name, p.category
     ORDER BY sales_count DESC, total_amount DESC
     LIMIT 5`,
    [partnerId]
  );

  // Conversion Funnel metrics
  const { rows: referralRows } = await query(
    `SELECT 
       COALESCE(total_invites, 0)::int AS total_invites,
       COALESCE(total_registered, 0)::int AS total_registrations
     FROM partner_referrals WHERE partner_id = $1`,
    [partnerId]
  );
  const ref = referralRows[0] || { total_invites: 0, total_registrations: 0 };

  const { rows: [{ kyc_approved_count, apps_submitted_count, apps_approved_count, total_commission_earned }] } = await query(
    `SELECT 
       COUNT(DISTINCT CASE WHEN cp.kyc_status = 'approved' THEN cp.id END)::int AS kyc_approved_count,
       COUNT(DISTINCT a.id)::int AS apps_submitted_count,
       COUNT(DISTINCT CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN a.id END)::int AS apps_approved_count,
       COALESCE(SUM(COALESCE(tc.amount, tc.commission_amount, 0)), 0)::numeric AS total_commission_earned
     FROM partner_team_relationships r
     JOIN partner_profiles cp ON cp.id = r.child_partner_id
     LEFT JOIN applications a ON a.partner_id = cp.id
     LEFT JOIN team_commissions tc ON tc.parent_partner_id = $1
     WHERE r.parent_partner_id = $1`,
    [partnerId]
  );

  const clicks = Math.max(parseInt(ref.total_invites) || 0, parseInt(ref.total_registrations) || 0);
  const funnel = {
    referral_clicks: clicks,
    registrations: parseInt(ref.total_registrations) || 0,
    kyc_approved: parseInt(kyc_approved_count) || 0,
    applications_submitted: parseInt(apps_submitted_count) || 0,
    applications_approved: parseInt(apps_approved_count) || 0,
    commissions_earned: parseFloat(total_commission_earned) || 0
  };

  return {
    daily_joining_trend: dailyJoiningTrend,
    monthly_joining_trend: monthlyJoiningTrend,
    business_trend: businessTrend.map(b => ({ ...b, business: parseFloat(b.business) })),
    commission_trend: commissionTrend.map(c => ({ ...c, commission: parseFloat(c.commission) })),
    top_products: topProducts.map(tp => ({ ...tp, total_amount: parseFloat(tp.total_amount) })),
    conversion_funnel: funnel
  };
}

/**
 * 5. GET TEAM ACTIVITY TIMELINE STREAM
 */
async function getTeamActivity(partnerId, options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
  const offset = (page - 1) * limit;

  // We unify logged team_activity and dynamic downline registration & app events
  const queryStr = `
    SELECT 
      act.id, act.activity_type, act.description, act.created_at,
      child.first_name, child.last_name, child.partner_code, child.profile_photo_url
    FROM (
      SELECT id, child_partner_id, activity_type, description, created_at
      FROM team_activity
      WHERE parent_partner_id = $1

      UNION ALL

      SELECT 
        r.id, r.child_partner_id, 'MEMBER_JOINED' AS activity_type,
        CONCAT(cp.first_name, ' ', COALESCE(cp.last_name, ''), ' joined your team as Level ', r.level) AS description,
        cp.created_at
      FROM partner_team_relationships r
      JOIN partner_profiles cp ON cp.id = r.child_partner_id
      WHERE r.parent_partner_id = $1

      UNION ALL

      SELECT 
        a.id, a.partner_id AS child_partner_id,
        CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN 'APPLICATION_APPROVED' ELSE 'APPLICATION_SUBMITTED' END AS activity_type,
        CONCAT(cp.first_name, ' ', COALESCE(cp.last_name, ''), ' ', 
          CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN 'had an application APPROVED' ELSE 'submitted a new application' END) AS description,
        a.created_at
      FROM partner_team_relationships r
      JOIN partner_profiles cp ON cp.id = r.child_partner_id
      JOIN applications a ON a.partner_id = cp.id
      WHERE r.parent_partner_id = $1
    ) act
    JOIN partner_profiles child ON child.id = act.child_partner_id
    ORDER BY act.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const { rows } = await query(queryStr, [partnerId, limit, offset]);

  const activities = rows.map(a => ({
    id: a.id,
    type: a.activity_type,
    description: a.description,
    actor_name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
    actor_code: a.partner_code,
    actor_photo: a.profile_photo_url,
    created_at: a.created_at
  }));

  return { activities, page, limit };
}

/**
 * 6. GET TEAM GOALS, LEADERBOARD, AND BADGES
 */
async function getTeamGoals(partnerId) {
  // Fetch existing goal or default
  const { rows: [goalsRow] } = await query(
    `SELECT * FROM team_goals WHERE partner_id = $1`,
    [partnerId]
  );

  const memberTarget = goalsRow?.monthly_member_target || 10;
  const businessTarget = parseFloat(goalsRow?.monthly_business_target) || 100000;
  const commissionTarget = parseFloat(goalsRow?.monthly_commission_target) || 25000;
  const appTarget = goalsRow?.monthly_app_target || 20;

  // Actual current month metrics
  const { rows: [{ current_month_members, current_month_business, current_month_commission, current_month_apps }] } = await query(
    `SELECT 
       COUNT(DISTINCT cp.id)::int AS current_month_members,
       COALESCE(SUM(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') 
         THEN COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0) ELSE 0 END), 0)::numeric AS current_month_business,
       COALESCE(SUM(COALESCE(tc.amount, tc.commission_amount, 0)), 0)::numeric AS current_month_commission,
       COUNT(DISTINCT a.id)::int AS current_month_apps
     FROM partner_team_relationships r
     JOIN partner_profiles cp ON cp.id = r.child_partner_id AND cp.created_at >= DATE_TRUNC('month', CURRENT_DATE)
     LEFT JOIN applications a ON a.partner_id = cp.id AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
     LEFT JOIN team_commissions tc ON tc.parent_partner_id = $1 AND tc.created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
    [partnerId]
  );

  // Leaderboard: Top 10 Performers in Downline
  const { rows: leaderboard } = await query(
    `SELECT 
       cp.id, cp.partner_code, cp.first_name, cp.last_name, cp.profile_photo_url, cp.rank,
       COUNT(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') THEN 1 END)::int AS approved_apps,
       COALESCE(SUM(CASE WHEN a.status IN ('approved', 'disbursed', 'confirmed') 
         THEN COALESCE(a.approved_amount, a.loan_amount, a.credit_limit, 0) ELSE 0 END), 0)::numeric AS total_business,
       COALESCE(SUM(COALESCE(tc.amount, tc.commission_amount, 0)), 0)::numeric AS total_commission
     FROM partner_team_relationships r
     JOIN partner_profiles cp ON cp.id = r.child_partner_id
     LEFT JOIN applications a ON a.partner_id = cp.id
     LEFT JOIN team_commissions tc ON tc.child_partner_id = cp.id
     WHERE r.parent_partner_id = $1
     GROUP BY cp.id, cp.partner_code, cp.first_name, cp.last_name, cp.profile_photo_url, cp.rank
     ORDER BY total_business DESC, approved_apps DESC
     LIMIT 10`,
    [partnerId]
  );

  const formattedLeaderboard = leaderboard.map((l, index) => ({
    rank_position: index + 1,
    id: l.id,
    name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
    code: l.partner_code,
    photo: l.profile_photo_url,
    badge: index === 0 ? '🥇 Champion' : index === 1 ? '🥈 Runner Up' : index === 2 ? '🥉 Bronze Star' : '⭐ Top Performer',
    business: parseFloat(l.total_business) || 0,
    apps: parseInt(l.approved_apps) || 0,
    commission: parseFloat(l.total_commission) || 0
  }));

  // Badges Earned
  const badges = [];
  if (parseInt(current_month_members) >= 5) badges.push({ title: 'Star Recruiter', icon: '🚀', desc: 'Recruited 5+ team members' });
  if (parseFloat(current_month_business) >= 50000) badges.push({ title: 'High Volume', icon: '💰', desc: 'Generated ₹50k+ in business' });
  if (parseFloat(current_month_commission) >= 10000) badges.push({ title: 'Top Earner', icon: '👑', desc: 'Earned ₹10k+ team commission' });
  if (parseInt(current_month_apps) >= 10) badges.push({ title: 'Fast Mover', icon: '⚡', desc: 'Submitted 10+ applications' });

  return {
    goals: {
      member_target: memberTarget,
      current_month_members: parseInt(current_month_members) || 0,
      business_target: businessTarget,
      current_month_business: parseFloat(current_month_business) || 0,
      commission_target: commissionTarget,
      current_month_commission: parseFloat(current_month_commission) || 0,
      app_target: appTarget,
      current_month_apps: parseInt(current_month_apps) || 0
    },
    leaderboard: formattedLeaderboard,
    badges
  };
}

/**
 * 7. GET & UPDATE TEAM SETTINGS
 */
async function getTeamSettings(partnerId) {
  const { rows: [p] } = await query(
    `SELECT partner_code, team_enabled, referral_enabled, referral_message 
     FROM partner_profiles WHERE id = $1`,
    [partnerId]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
  const referral_code = p?.partner_code || '';
  const referral_link = `${frontendUrl}/register?ref=${referral_code}`;

  let qr_code_data_url = null;
  try {
    qr_code_data_url = await qrcode.toDataURL(referral_link, { width: 300, margin: 2 });
  } catch (qrErr) {
    logger.warn('Failed to generate QR Code:', qrErr.message);
  }

  return {
    team_enabled: p?.team_enabled !== false,
    referral_enabled: p?.referral_enabled !== false,
    referral_message: p?.referral_message || 'Join my team on GharKaPaisa and earn highest financial commission payouts!',
    referral_code,
    referral_link,
    qr_code_data_url
  };
}

async function updateTeamSettings(partnerId, settings) {
  const { team_enabled, referral_enabled, referral_message } = settings;

  await query(
    `UPDATE partner_profiles 
     SET team_enabled = COALESCE($1, team_enabled),
         referral_enabled = COALESCE($2, referral_enabled),
         referral_message = COALESCE($3, referral_message),
         updated_at = NOW()
     WHERE id = $4`,
    [team_enabled, referral_enabled, referral_message, partnerId]
  );

  return getTeamSettings(partnerId);
}

/**
 * 8. GET 360° MEMBER DETAILS FOR DRAWER PROFILE
 */
async function getTeamMemberById(rootPartnerId, targetMemberId, isAdmin = false) {
  if (!isAdmin) {
    const isAllowed = await isPartnerInDownline(rootPartnerId, targetMemberId);
    if (!isAllowed) {
      throw new Error('Access denied: Selected member is not in your team downline.');
    }
  }

  // Profile details
  const { rows: [p] } = await query(
    `SELECT 
       p.id, p.user_id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url,
       p.current_address, p.business_location, p.company_name, p.company_type, p.gst_number, p.pincode,
       p.kyc_status, p.rank, p.created_at,
       u.email, u.mobile, u.status AS user_status, u.is_active, u.last_login,
       parent.first_name AS parent_first_name, parent.last_name AS parent_last_name, parent.partner_code AS parent_partner_code
     FROM partner_profiles p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN partner_profiles parent ON parent.id = p.parent_partner_id
     WHERE p.id = $1`,
    [targetMemberId]
  );

  if (!p) throw new Error('Partner profile not found');

  // Bank details
  const { rows: [bank] } = await query(
    `SELECT bank_name, account_number, ifsc_code, account_holder_name, is_verified 
     FROM partner_bank_details WHERE partner_id = $1`,
    [targetMemberId]
  );

  // KYC Docs
  const { rows: kycDocs } = await query(
    `SELECT doc_type, doc_number, file_url, verified 
     FROM kyc_documents WHERE partner_id = $1`,
    [targetMemberId]
  );

  // Applications
  const { rows: apps } = await query(
    `SELECT a.id, a.app_number, a.status, a.loan_amount, a.approved_amount, a.credit_limit, a.created_at,
            pr.name AS product_name, pr.category
     FROM applications a
     JOIN products pr ON pr.id = a.product_id
     WHERE a.partner_id = $1
     ORDER BY a.created_at DESC`,
    [targetMemberId]
  );

  // Commissions
  const { rows: commissions } = await query(
    `SELECT COALESCE(amount, commission_amount, 0) as amount, level, status, created_at FROM team_commissions WHERE child_partner_id = $1 ORDER BY created_at DESC`,
    [targetMemberId]
  );

  // Wallet
  const { rows: [wallet] } = await query(
    `SELECT total_earned, total_withdrawn, available_balance, hold_balance 
     FROM partner_wallets WHERE partner_id = $1`,
    [targetMemberId]
  );

  // Direct Children
  const { rows: children } = await query(
    `SELECT cp.id, cp.partner_code, cp.first_name, cp.last_name, cp.profile_photo_url, cp.rank, cp.kyc_status, u.status AS user_status, cp.created_at
     FROM partner_team_relationships r
     JOIN partner_profiles cp ON cp.id = r.child_partner_id
     JOIN users u ON u.id = cp.user_id
     WHERE r.parent_partner_id = $1 AND r.level = 1
     ORDER BY cp.created_at DESC`,
    [targetMemberId]
  );

  return {
    profile: {
      id: p.id,
      user_id: p.user_id,
      partner_code: p.partner_code,
      full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      mobile: p.mobile,
      photo: p.profile_photo_url,
      company_name: p.company_name,
      company_type: p.company_type,
      address: p.current_address,
      pincode: p.pincode,
      rank: p.rank || 'Partner',
      status: p.user_status,
      kyc_status: p.kyc_status,
      parent_name: p.parent_first_name ? `${p.parent_first_name} ${p.parent_last_name || ''}`.trim() : 'N/A',
      parent_code: p.parent_partner_code || 'N/A',
      joined_at: p.created_at,
      last_login: p.last_login
    },
    bank: bank ? {
      bank_name: bank.bank_name,
      account_number: bank.account_number ? '••••' + bank.account_number.slice(-4) : 'N/A',
      ifsc_code: bank.ifsc_code,
      account_holder_name: bank.account_holder_name,
      is_verified: bank.is_verified
    } : null,
    kyc_docs: kycDocs,
    applications: apps,
    commissions: commissions.map(c => ({ ...c, amount: parseFloat(c.amount) })),
    wallet: wallet ? {
      total_earned: parseFloat(wallet.total_earned) || 0,
      total_withdrawn: parseFloat(wallet.total_withdrawn) || 0,
      available_balance: parseFloat(wallet.available_balance) || 0,
      hold_balance: parseFloat(wallet.hold_balance) || 0
    } : { total_earned: 0, total_withdrawn: 0, available_balance: 0, hold_balance: 0 },
    direct_children: children.map(c => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      code: c.partner_code,
      photo: c.profile_photo_url,
      rank: c.rank || 'Partner',
      status: c.user_status,
      kyc_status: c.kyc_status,
      joined_at: c.created_at
    }))
  };
}

/**
 * 9. PROCESS TEAM OVERRIDE COMMISSION PAYOUTS (Level 1: 10%, Level 2: 5%)
 */
async function processTeamOverrideCommission(applicationId, childPartnerId, baseCommissionAmount) {
  try {
    if (!applicationId || !childPartnerId || !baseCommissionAmount || parseFloat(baseCommissionAmount) <= 0) {
      return null;
    }

    const commVal = parseFloat(baseCommissionAmount);

    // Find parent (Level 1) and grandparent (Level 2)
    const { rows: parents } = await query(
      `SELECT parent_partner_id, level 
       FROM partner_team_relationships 
       WHERE child_partner_id = $1 AND level IN (1, 2)
       ORDER BY level ASC`,
      [childPartnerId]
    );

    for (const p of parents) {
      const parentPartnerId = p.parent_partner_id;
      const levelDepth = p.level;

      // 10% override for Level 1, 5% override for Level 2
      const overridePercentage = levelDepth === 1 ? 0.10 : 0.05;
      const overrideAmount = parseFloat((commVal * overridePercentage).toFixed(2));

      if (overrideAmount <= 0) continue;

      // Avoid duplicate payouts for the same application and level
      const { rows: existing } = await query(
        `SELECT id FROM team_commissions 
         WHERE application_id = $1 AND parent_partner_id = $2 AND level = $3 LIMIT 1`,
        [applicationId, parentPartnerId, levelDepth]
      );
      if (existing.length > 0) continue;

      // 1. Insert into team_commissions table
      await query(
        `INSERT INTO team_commissions (
           parent_partner_id, child_partner_id, application_id, amount, level, status
         ) VALUES ($1, $2, $3, $4, $5, 'paid')`,
        [parentPartnerId, childPartnerId, applicationId, overrideAmount, levelDepth]
      );

      // 2. Credit parent partner's wallet
      await query(
        `INSERT INTO partner_wallets (partner_id, available_balance, total_earned)
         VALUES ($1, $2, $2)
         ON CONFLICT (partner_id) DO UPDATE SET 
           available_balance = partner_wallets.available_balance + EXCLUDED.available_balance,
           total_earned = partner_wallets.total_earned + EXCLUDED.total_earned,
           updated_at = NOW()`,
        [parentPartnerId, overrideAmount]
      );

      // 3. Log to wallet_ledger
      await query(
        `INSERT INTO wallet_ledger (
           partner_id, application_id, type, credit, debit, balance_after, status, description
         ) VALUES (
           $1, $2, 'team_override', $3, 0,
           (SELECT available_balance FROM partner_wallets WHERE partner_id = $1),
           'completed', $4
         )`,
        [
          parentPartnerId, applicationId, overrideAmount,
          `Level ${levelDepth} Team Override Commission (${(overridePercentage * 100)}%) from downline sales`
        ]
      );

      // 4. Log to team_activity
      await query(
        `INSERT INTO team_activity (
           parent_partner_id, child_partner_id, activity_type, description
         ) VALUES ($1, $2, 'OVERRIDE_COMMISSION_EARNED', $3)`,
        [
          parentPartnerId, childPartnerId,
          `Earned ₹${overrideAmount} Level ${levelDepth} team override commission on application`
        ]
      );

      logger.info(`Successfully processed Level ${levelDepth} team override commission: ₹${overrideAmount} for partner ${parentPartnerId}`);
    }

    return true;
  } catch (err) {
    logger.error(`Error processing team override commission for app ${applicationId}:`, err);
    return false;
  }
}

const { generateTeamCode, generateRandomReferralCode } = require('../../utils/helpers/helpers');

/**
 * 16. SEND TEAM INVITATION (WhatsApp / SMS / Email)
 */
async function sendTeamInvitation(partnerId, { name, mobile, email }) {
  const { rows: [p] } = await query(
    `SELECT first_name, partner_code FROM partner_profiles WHERE id = $1`,
    [partnerId]
  );
  if (!p) throw new Error('Partner profile not found');

  const frontendUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
  const referralLink = `${frontendUrl}/register?ref=${p.partner_code}`;
  const inviterName = p.first_name || 'Your Partner';
  const message = `Hi ${name || 'there'}! ${inviterName} has invited you to join GharKaPaisa — India's top credit card & loan referral platform. Earn commissions on every approved application! Register here: ${referralLink}`;

  const channels = [];

  // WhatsApp deep link
  if (mobile) {
    const cleaned = mobile.replace(/\D/g, '');
    const waLink = `https://wa.me/91${cleaned}?text=${encodeURIComponent(message)}`;
    channels.push({ channel: 'whatsapp', link: waLink });

    // SMS via MSG91 if configured
    if (process.env.MSG91_AUTH_KEY) {
      try {
        const axios = require('axios');
        await axios.post('https://api.msg91.com/api/v5/flow/', {
          template_id: process.env.MSG91_INVITE_TEMPLATE_ID || '',
          short_url: '0',
          mobiles: `91${cleaned}`,
          VAR1: name || 'there',
          VAR2: inviterName,
          VAR3: referralLink,
        }, {
          headers: { authkey: process.env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' }
        });
        channels.push({ channel: 'sms', status: 'sent' });
      } catch (smsErr) {
        logger.warn('SMS invite failed:', smsErr.message);
        channels.push({ channel: 'sms', status: 'failed' });
      }
    }
  }

  // Email via nodemailer if configured
  if (email && process.env.SMTP_HOST) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"GharKaPaisa" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: `${inviterName} invited you to join GharKaPaisa`,
        html: `<p>Hi ${name || 'there'},</p><p>${inviterName} has invited you to join <strong>GharKaPaisa</strong> — India's top credit card &amp; loan referral platform.</p><p>Earn commissions on every approved application!</p><p><a href="${referralLink}" style="background:#0D5CAB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Register Now</a></p>`,
      });
      channels.push({ channel: 'email', status: 'sent' });
    } catch (emailErr) {
      logger.warn('Email invite failed:', emailErr.message);
      channels.push({ channel: 'email', status: 'failed' });
    }
  }

  // Log invitation
  await query(
    `INSERT INTO invitation_history (partner_id, invite_type, recipient_name, recipient_email, recipient_mobile, referral_code, status, sent_at)
     VALUES ($1, 'manual', $2, $3, $4, $5, 'SENT', NOW())`,
    [partnerId, name || null, email || null, mobile || null, p.partner_code]
  ).catch(() => {});

  return { success: true, referral_link: referralLink, whatsapp_link: channels.find(c => c.channel === 'whatsapp')?.link, channels };
}

/**
 * 17. GET REFERS LIST (invitation history + referral stats)
 */
async function getRefersList(partnerId) {
  const { rows: [p] } = await query(
    `SELECT partner_code FROM partner_profiles WHERE id = $1`,
    [partnerId]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
  const referralLink = `${frontendUrl}/register?ref=${p?.partner_code}`;

  const { rows: invites } = await query(
    `SELECT id, recipient_name, recipient_email, recipient_mobile, status, sent_at, registered_at
     FROM invitation_history WHERE partner_id = $1 ORDER BY sent_at DESC LIMIT 50`,
    [partnerId]
  );

  const { rows: [stats] } = await query(
    `SELECT 
       COALESCE(total_invites, 0) AS total_invites,
       COALESCE(total_registered, 0) AS total_registered
     FROM partner_referrals WHERE partner_id = $1`,
    [partnerId]
  );

  return {
    referral_code: p?.partner_code,
    referral_link: referralLink,
    total_invites: parseInt(stats?.total_invites) || invites.length,
    total_registered: parseInt(stats?.total_registered) || 0,
    invites,
  };
}

/**
 * 10. GET OR CREATE PARTNER TEAM INFO (Team Name, Team Code, Team Link)
 */
async function getPartnerTeamInfo(partnerId) {
  const { rows: [p] } = await query(
    `SELECT first_name, last_name, partner_code FROM partner_profiles WHERE id = $1`,
    [partnerId]
  );
  if (!p) throw new Error('Partner profile not found');

  const { rows: [existingTeam] } = await query(
    `SELECT * FROM partner_teams WHERE partner_id = $1`,
    [partnerId]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';

  if (existingTeam) {
    return {
      team_id: existingTeam.id,
      team_name: existingTeam.team_name,
      team_code: existingTeam.team_code,
      team_link: `${frontendUrl}/register?team=${existingTeam.team_code}`
    };
  }

  // Create team entry
  const defaultTeamName = `${p.first_name || 'Partner'}'s Team`;
  const newTeamCode = generateTeamCode(11);

  const { rows: [newTeam] } = await query(
    `INSERT INTO partner_teams (partner_id, team_name, team_code)
     VALUES ($1, $2, $3)
     ON CONFLICT (partner_id) DO UPDATE SET team_name = EXCLUDED.team_name RETURNING *`,
    [partnerId, defaultTeamName, newTeamCode]
  );

  return {
    team_id: newTeam.id,
    team_name: newTeam.team_name,
    team_code: newTeam.team_code,
    team_link: `${frontendUrl}/register?team=${newTeam.team_code}`
  };
}

/**
 * 11. SUBMIT PARTNER UPGRADE REQUEST (Team Member -> Partner)
 */
async function requestPartnerUpgrade(userId, partnerId) {
  const { rows: [user] } = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (!user) throw new Error('User not found');

  const { rows: [pending] } = await query(
    `SELECT id FROM partner_upgrade_requests WHERE user_id = $1 AND status = 'PENDING'`,
    [userId]
  );
  if (pending) {
    return { status: 'PENDING', message: 'An upgrade request is already pending review.' };
  }

  const { rows: [reqRow] } = await query(
    `INSERT INTO partner_upgrade_requests (user_id, partner_id, status)
     VALUES ($1, $2, 'PENDING') RETURNING *`,
    [userId, partnerId || null]
  );

  return { status: 'PENDING', request: reqRow, message: 'Upgrade request submitted successfully.' };
}

/**
 * 12. GET UPGRADE REQUEST STATUS
 */
async function getUpgradeStatus(userId) {
  const { rows: [reqRow] } = await query(
    `SELECT * FROM partner_upgrade_requests WHERE user_id = $1 ORDER BY requested_at DESC LIMIT 1`,
    [userId]
  );
  return reqRow || null;
}

/**
 * 13. SUPER ADMIN - LIST UPGRADE REQUESTS
 */
async function getAllUpgradeRequests(statusFilter = null) {
  let whereStr = '';
  const params = [];
  if (statusFilter) {
    whereStr = 'WHERE r.status = $1';
    params.push(statusFilter);
  }

  const { rows } = await query(
    `SELECT r.*, u.email, u.mobile, u.full_name, u.role, p.partner_code, p.first_name, p.last_name
     FROM partner_upgrade_requests r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN partner_profiles p ON p.user_id = u.id
     ${whereStr}
     ORDER BY r.requested_at DESC`,
    params
  );
  return rows;
}

/**
 * 14. SUPER ADMIN - APPROVE UPGRADE REQUEST
 */
async function approveUpgradeRequest(requestId, adminUserId) {
  const { rows: [reqRow] } = await query(
    `SELECT * FROM partner_upgrade_requests WHERE id = $1`,
    [requestId]
  );
  if (!reqRow) throw new Error('Upgrade request not found');

  if (reqRow.status === 'APPROVED') {
    return { success: true, message: 'Already approved' };
  }

  // Update request
  await query(
    `UPDATE partner_upgrade_requests 
     SET status = 'APPROVED', reviewed_at = NOW(), reviewed_by = $1 WHERE id = $2`,
    [adminUserId, requestId]
  );

  // Upgrade user role to PARTNER
  await query(
    `UPDATE users SET role = 'PARTNER' WHERE id = $1`,
    [reqRow.user_id]
  );

  // Enable team creation
  await query(
    `UPDATE partner_profiles SET allow_team_creation = TRUE WHERE user_id = $1`,
    [reqRow.user_id]
  );

  return { success: true, message: 'User successfully upgraded to PARTNER' };
}

/**
 * 15. SUPER ADMIN - REJECT UPGRADE REQUEST
 */
async function rejectUpgradeRequest(requestId, adminUserId, reason) {
  const { rows: [reqRow] } = await query(
    `SELECT * FROM partner_upgrade_requests WHERE id = $1`,
    [requestId]
  );
  if (!reqRow) throw new Error('Upgrade request not found');

  await query(
    `UPDATE partner_upgrade_requests 
     SET status = 'REJECTED', rejection_reason = $1, reviewed_at = NOW(), reviewed_by = $2 WHERE id = $3`,
    [reason || 'Request rejected by admin', adminUserId, requestId]
  );

  return { success: true, message: 'Upgrade request rejected' };
}

module.exports = {
  getPartnerProfileIdByUserId,
  isPartnerInDownline,
  getTeamDashboard,
  getTeamTree,
  getTeamMembersList,
  getTeamAnalytics,
  getTeamActivity,
  getTeamGoals,
  getTeamSettings,
  updateTeamSettings,
  getTeamMemberById,
  processTeamOverrideCommission,
  getPartnerTeamInfo,
  requestPartnerUpgrade,
  getUpgradeStatus,
  getAllUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  sendTeamInvitation,
  getRefersList
};

