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
  if (!partnerId) {
    const err = new Error('Partner profile not found for the logged in user.');
    err.statusCode = 404;
    throw err;
  }
  return partnerId;
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
    const result = await teamService.getTeamMembersList(partnerId, req.query);
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

module.exports = {
  getDashboard,
  getTree,
  getMembersList,
  getAnalytics,
  getActivity,
  getGoals,
  getSettings,
  updateSettings,
  getMemberById
};
