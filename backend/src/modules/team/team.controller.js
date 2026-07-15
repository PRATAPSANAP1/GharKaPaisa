const { query } = require('../../config/database');
const { success, error, notFound, paginate } = require('../../utils/response/response');
const {
  logReferralClick,
  generateReferralQR,
  getReferralAnalytics,
  getLazyTeamTree,
  getTeamDashboardSummary
} = require('./team.service.js');

// Helper to resolve partner ID
const resolvePartnerId = async (req) => {
  if (req.partner?.id) return req.partner.id;
  if (req.user?.id) {
    const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
    if (p) return p.id;
  }
  return null;
};

// POST /referral/click — Public Referral Click Logger
const handleReferralClick = async (req, res, next) => {
  try {
    const clickData = {
      ...req.body,
      ip_address: req.ip || req.headers['x-forwarded-for'],
      browser: req.headers['user-agent'],
      referrer: req.headers['referer']
    };
    const result = await logReferralClick(clickData);
    return success(res, result, 'Referral click logged successfully');
  } catch (err) {
    next(err);
  }
};

// GET /referral/qr — Generate Referral QR Code Data URL
const handleGetReferralQR = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const qrResult = await generateReferralQR(partnerId);
    return success(res, qrResult, 'Referral QR generated successfully');
  } catch (err) {
    next(err);
  }
};

// GET /referral/analytics — Conversion Funnel Analytics
const handleGetReferralAnalytics = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const analytics = await getReferralAnalytics(partnerId);
    return success(res, analytics, 'Referral analytics loaded successfully');
  } catch (err) {
    next(err);
  }
};

// GET /team/dashboard — Minimalist Summary Metrics
const handleGetTeamDashboard = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const dashboard = await getTeamDashboardSummary(partnerId);
    return success(res, dashboard, 'Team dashboard summary loaded');
  } catch (err) {
    next(err);
  }
};

// GET /team/tree — Expandable Lazy-loaded Node Tree
const handleGetTeamTree = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const parentId = req.query.parent_id || null;
    const tree = await getLazyTeamTree(partnerId, parentId);
    return success(res, tree, 'Team tree nodes loaded successfully');
  } catch (err) {
    next(err);
  }
};

// GET /team/list — Filtered Server-side Team List
const handleGetTeamList = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { status, kyc_status, search, joined_period } = req.query;

    let where = `WHERE ptr.parent_partner_id = $1`;
    const values = [partnerId];
    let idx = 2;

    if (status) {
      where += ` AND p.status = $${idx++}`;
      values.push(status);
    }
    if (kyc_status) {
      where += ` AND p.kyc_status = $${idx++}`;
      values.push(kyc_status);
    }
    if (search) {
      where += ` AND (p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx} OR p.partner_code ILIKE $${idx} OR u.phone ILIKE $${idx} OR u.email ILIKE $${idx})`;
      idx++;
      values.push(`%${search}%`);
    }
    if (joined_period === 'today') {
      where += ` AND p.created_at >= CURRENT_DATE`;
    } else if (joined_period === 'this_month') {
      where += ` AND p.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    }

    const { rows: members } = await query(`
      SELECT 
        ptr.child_partner_id as id,
        ptr.level,
        p.partner_code,
        p.first_name,
        p.last_name,
        p.kyc_status,
        p.status,
        p.children_count,
        p.active_team_count,
        p.created_at as joined_at,
        u.email,
        u.phone as mobile
      FROM partner_team_relationships ptr
      JOIN partner_profiles p ON p.id = ptr.child_partner_id
      JOIN users u ON u.id = p.user_id
      ${where}
      ORDER BY p.created_at DESC
    `, values);

    return success(res, members, 'Team members list loaded');
  } catch (err) {
    next(err);
  }
};

// GET /team/:id — 360° Child Details Hub
const handleGetChildDetail = async (req, res, next) => {
  try {
    const childId = req.params.id;
    const { rows: [profile] } = await query(`
      SELECT 
        p.*, u.email, u.phone as mobile,
        pw.available_balance, pw.hold_balance, pw.total_earned
      FROM partner_profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN partner_wallets pw ON pw.partner_id = p.id
      WHERE p.id = $1
    `, [childId]);

    if (!profile) return notFound(res, 'Child partner profile not found');

    const { rows: apps } = await query(`SELECT * FROM applications WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 20`, [childId]);
    const { rows: comms } = await query(`SELECT * FROM team_commissions WHERE child_partner_id = $1 ORDER BY created_at DESC LIMIT 20`, [childId]);
    const { rows: acts } = await query(`SELECT * FROM team_activity WHERE child_partner_id = $1 ORDER BY created_at DESC LIMIT 20`, [childId]);

    return success(res, {
      profile,
      applications: apps,
      commissions: comms,
      activity: acts
    }, 'Child 360° profile details loaded');
  } catch (err) {
    next(err);
  }
};

// GET /team/activity — Team Timeline Stream
const handleGetTeamActivity = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { rows: acts } = await query(`
      SELECT ta.*, p.first_name as child_first_name, p.last_name as child_last_name
      FROM team_activity ta
      LEFT JOIN partner_profiles p ON p.id = ta.child_partner_id
      WHERE ta.partner_id = $1
      ORDER BY ta.created_at DESC LIMIT 50
    `, [partnerId]);

    return success(res, acts, 'Team activity log loaded');
  } catch (err) {
    next(err);
  }
};

// PATCH /team/settings — Team & Referral Preferences
const handleUpdateTeamSettings = async (req, res, next) => {
  try {
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { team_enabled, referral_enabled, referral_message } = req.body;
    const { rows: [p] } = await query(`
      UPDATE partner_profiles
      SET team_enabled = COALESCE($1, team_enabled),
          referral_enabled = COALESCE($2, referral_enabled),
          referral_message = COALESCE($3, referral_message),
          updated_at = NOW()
      WHERE id = $4
      RETURNING team_enabled, referral_enabled, referral_message
    `, [team_enabled, referral_enabled, referral_message, partnerId]);

    return success(res, p, 'Team settings updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleReferralClick,
  handleGetReferralQR,
  handleGetReferralAnalytics,
  handleGetTeamDashboard,
  handleGetTeamTree,
  handleGetTeamList,
  handleGetChildDetail,
  handleGetTeamActivity,
  handleUpdateTeamSettings
};
