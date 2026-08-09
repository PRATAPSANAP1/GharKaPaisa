const teamService = require('./team.service');
const logger = require('../../config/logger');

/**
 * Resolve target partner ID: if Admin and ?partner_id is specified, use that; otherwise use logged-in user's partner ID.
 */
async function resolvePartnerId(req) {
  const isElevated = ['ADMIN', 'SUPER_ADMIN'].includes((req.user?.role || '').toUpperCase());
  if (isElevated && req.query.partner_id) {
    return req.query.partner_id;
  }
  const partnerId = await teamService.getPartnerProfileIdByUserId(req.user.id);
  return partnerId || req.user.id;
}

/**
 * GET /api/v1/team/dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getTeamDashboard(partnerId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/tree
 */
async function getTree(req, res, next) {
  try {
    const rootPartnerId = await resolvePartnerId(req);
    const parentIdRequested = req.query.parent_id || null;

    if (parentIdRequested && parentIdRequested !== rootPartnerId) {
      const isElevated = ['ADMIN', 'SUPER_ADMIN'].includes((req.user?.role || '').toUpperCase());
      if (!isElevated) {
        const allowed = await teamService.isPartnerInDownline(rootPartnerId, parentIdRequested);
        if (!allowed) {
          return res.status(403).json({ success: false, message: 'Access denied: Target node is not in your downline.' });
        }
      }
    }

    const data = await teamService.getTeamTree(rootPartnerId, parentIdRequested);
    return res.json({ success: true, data: data.children || [], root: data.root || null });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/list or /api/v1/team/members
 */
async function getMembersList(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    
    // Pass viewer role for masking personal details
    const options = { 
      ...req.query, 
      viewerRole: req.user?.role 
    };
    
    // If CSV export is requested
    if (req.query.export === 'csv' || req.query.format === 'csv') {
      options.limit = 10000;
      options.page = 1;
      const result = await teamService.getTeamMembersList(partnerId, options);
      
      const headers = ['Partner Code', 'Full Name', 'Mobile', 'Email', 'Rank', 'Level', 'KYC Status', 'Status', 'Total Business (INR)', 'Applications Count', 'Joined Date'];
      const csvRows = [headers.join(',')];

      for (const m of result.members) {
        const row = [
          `"${m.partner_code || ''}"`,
          `"${m.full_name || ''}"`,
          `"${m.mobile || ''}"`,
          `"${m.email || ''}"`,
          `"${m.rank || 'Partner'}"`,
          m.level || 1,
          `"${m.kyc_status || 'pending'}"`,
          `"${m.status || 'active'}"`,
          m.total_business || 0,
          m.applications_count || 0,
          `"${m.joined_at ? new Date(m.joined_at).toISOString().split('T')[0] : ''}"`
        ];
        csvRows.push(row.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="team_members_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csvRows.join('\n'));
    }

    const result = await teamService.getTeamMembersList(partnerId, options);
    return res.json({
      success: true,
      data: result.members,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/analytics
 */
async function getAnalytics(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getTeamAnalytics(partnerId, req.query.period || '30d');
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/activity
 */
async function getActivity(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getTeamActivity(partnerId, req.query);
    return res.json({ success: true, data: data.activities, page: data.page, limit: data.limit });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/goals
 */
async function getGoals(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getTeamGoals(partnerId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/settings
 */
async function getSettings(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getTeamSettings(partnerId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/team/settings
 */
async function updateSettings(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.updateTeamSettings(partnerId, req.body);
    return res.json({ success: true, message: 'Settings updated successfully', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/:id
 */
async function getMemberById(req, res, next) {
  try {
    const rootPartnerId = await resolvePartnerId(req);
    const targetMemberId = req.params.id;
    const isElevated = ['ADMIN', 'SUPER_ADMIN'].includes((req.user?.role || '').toUpperCase());
    
    const data = await teamService.getTeamMemberById(rootPartnerId, targetMemberId, isElevated);
    return res.json({ success: true, data });
  } catch (err) {
    if (err.message.includes('Access denied')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * GET /api/v1/team/info
 */
async function getTeamInfo(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getPartnerTeamInfo(partnerId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/team/upgrade-request
 */
async function requestUpgrade(req, res, next) {
  try {
    let partnerId = null;
    try { partnerId = await resolvePartnerId(req); } catch (e) {}
    const data = await teamService.requestPartnerUpgrade(req.user.id, partnerId);
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/upgrade-status
 */
async function getUpgradeStatus(req, res, next) {
  try {
    const data = await teamService.getUpgradeStatus(req.user.id);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/team/invite
 */
async function sendInvite(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const { name, mobile, email } = req.body;
    if (!mobile && !email) {
      return res.status(400).json({ success: false, message: 'Provide at least a mobile number or email.' });
    }
    const data = await teamService.sendTeamInvitation(partnerId, { name, mobile, email });
    return res.json({ success: true, message: 'Invitation sent successfully', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/team/refers
 */
async function getRefersList(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const data = await teamService.getRefersList(partnerId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateMemberStatus(req, res, next) {
  try {
    const partnerId = await resolvePartnerId(req);
    const { id } = req.params;
    const { status } = req.body;
    const newStatus = status || 'inactive';
    const data = await teamService.updateTeamMemberStatus(partnerId, id, newStatus);
    return res.json({
      success: true,
      message: `Team member status updated to ${newStatus} successfully`,
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getTree,
  getMembersList,
  getAnalytics,
  getActivity,
  getGoals,
  getSettings,
  updateSettings,
  getMemberById,
  getTeamInfo,
  requestUpgrade,
  getUpgradeStatus,
  sendInvite,
  getRefersList,
  updateMemberStatus
};
