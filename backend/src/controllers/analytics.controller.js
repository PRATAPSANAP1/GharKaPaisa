const analyticsService = require('../services/analytics.service');
const { success, error } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const { role, id, partner_id } = req.user;
    let data;

    if (role === 'SUPER_ADMIN') {
      data = await analyticsService.getSuperAdminDashboard();
    } else if (role === 'ADMIN') {
      data = await analyticsService.getAdminDashboard(id);
    } else if (role === 'PARTNER') {
      if (!partner_id) return error(res, 'Partner profile missing');
      data = await analyticsService.getPartnerDashboard(partner_id);
    } else {
      return error(res, 'Role not authorized for analytics', 403);
    }

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard
};
