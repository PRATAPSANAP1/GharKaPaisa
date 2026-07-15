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
    const { uploadToS3 } = require('../../services/aws/s3.service.js');
    const { title, description, category } = req.body;
    let { file_url, thumbnail_url } = req.body;

    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        const fileResult = await uploadToS3(req.files.file[0].buffer, req.files.file[0].originalname, 'marketing');
        file_url = fileResult.url;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const thumbResult = await uploadToS3(req.files.thumbnail[0].buffer, req.files.thumbnail[0].originalname, 'marketing/thumbnails');
        thumbnail_url = thumbResult.url;
      }
    }

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
