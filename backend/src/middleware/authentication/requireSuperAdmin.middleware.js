const { error } = require('../../utils/response/response');

const requireSuperAdmin = (req, res, next) => {
  const role = String(req.user?.role || '').trim().toUpperCase();

  if (role !== 'SUPER_ADMIN') {
    return error(res, 'Access denied. Only Super Admin can perform this action.', 403);
  }

  next();
};

module.exports = requireSuperAdmin;
