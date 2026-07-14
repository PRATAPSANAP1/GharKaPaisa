const { query } = require('../../config/database');
const { success, created, error } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');

// List all marketing materials
const listMarketingMaterials = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT * FROM marketing_materials
      ORDER BY created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// Create marketing material (Admin only)
const createMarketingMaterial = async (req, res, next) => {
  try {
    const { title, description, category, file_url, thumbnail_url } = req.body;
    if (!title || !category || !file_url) {
      return error(res, 'Title, category, and file_url are required', 400);
    }

    const { rows: [material] } = await query(`
      INSERT INTO marketing_materials (title, description, category, file_url, thumbnail_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [title.trim(), description || null, category, file_url, thumbnail_url || null]);

    await logAction(req, 'CREATE_MARKETING_MATERIAL', material.id, { title });

    return created(res, material, 'Marketing material created successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listMarketingMaterials,
  createMarketingMaterial
};
