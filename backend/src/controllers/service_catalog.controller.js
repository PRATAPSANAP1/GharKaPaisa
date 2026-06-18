const { query } = require('../config/db');
const { success, error } = require('../utils/response');
const { logAction } = require('../services/audit.service');

// GET /api/v1/service-catalog
// Public can fetch active services, Admin can fetch all
const listServices = async (req, res, next) => {
  try {
    const isAdmin = req.user && ['admin', 'super_admin'].includes(req.user.role);
    
    let sql = `SELECT * FROM services_catalog`;
    let params = [];

    if (!isAdmin) {
      sql += ` WHERE status = $1`;
      params.push('active');
    }

    sql += ` ORDER BY display_order ASC, id ASC`;

    const { rows } = await query(sql, params);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/service-catalog (Admin only)
const createService = async (req, res, next) => {
  try {
    const { name, icon, route, status, display_order } = req.body;
    
    const { rows } = await query(`
      INSERT INTO services_catalog (name, icon, route, status, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, icon, route, status || 'active', display_order || 1]);

    await logAction(req, 'CREATE_SERVICE_CATALOG', null, { service_id: rows[0].id, name });
    
    return success(res, rows[0], 'Service created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/service-catalog/:id (Admin only)
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, route, status, display_order } = req.body;

    const { rows } = await query(`
      UPDATE services_catalog
      SET name = COALESCE($1, name),
          icon = COALESCE($2, icon),
          route = COALESCE($3, route),
          status = COALESCE($4, status),
          display_order = COALESCE($5, display_order),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, icon, route, status, display_order, id]);

    if (rows.length === 0) return error(res, 'Service not found', 404);

    await logAction(req, 'UPDATE_SERVICE_CATALOG', null, { service_id: id, updates: req.body });

    return success(res, rows[0], 'Service updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/service-catalog/:id (Admin only)
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await query(`
      DELETE FROM services_catalog WHERE id = $1 RETURNING id, name
    `, [id]);

    if (rows.length === 0) return error(res, 'Service not found', 404);

    await logAction(req, 'DELETE_SERVICE_CATALOG', null, { service_id: id, name: rows[0].name });

    return success(res, null, 'Service deleted successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/service-catalog/:id/click (Public)
const trackClick = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Increment clicks
    const { rows } = await query(`
      UPDATE services_catalog
      SET clicks = clicks + 1
      WHERE id = $1
      RETURNING id, name, clicks
    `, [id]);

    if (rows.length === 0) return error(res, 'Service not found', 404);

    return success(res, { clicks: rows[0].clicks }, 'Click tracked');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listServices,
  createService,
  updateService,
  deleteService,
  trackClick
};
