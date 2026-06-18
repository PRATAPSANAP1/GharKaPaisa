const { query } = require('../config/db');
const { success, created, error, notFound } = require('../utils/response');
const { logAction } = require('../services/audit.service');

// GET /cms/sections — List all active layout sections (public/partner)
const listActiveSections = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM homepage_sections WHERE is_active = true ORDER BY display_order ASC, created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /cms/sections/all — List all layout sections (Admin/SuperAdmin)
const listAllSections = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM homepage_sections ORDER BY display_order ASC, created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// POST /cms/sections — Create a new layout section (SuperAdmin only)
const createSection = async (req, res, next) => {
  try {
    const { key, title, subtitle, is_active, display_order, items } = req.body;
    if (!key || !title) {
      return error(res, 'Key and Title are required', 400);
    }

    // Check if key already exists
    const { rows: [existing] } = await query(`SELECT id FROM homepage_sections WHERE key = $1`, [key]);
    if (existing) {
      return error(res, `A section with key '${key}' already exists`, 409);
    }

    const { rows: [section] } = await query(
      `INSERT INTO homepage_sections (key, title, subtitle, is_active, display_order, items)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        key,
        title,
        subtitle || null,
        is_active === undefined ? true : is_active,
        display_order ? parseInt(display_order) : 0,
        JSON.stringify(items || [])
      ]
    );

    await logAction(req, 'CREATE_CMS_SECTION', section.id, { key, title });

    return created(res, section, 'CMS layout section created successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /cms/sections/:key — Update layout section or items array (Admin/SuperAdmin)
const updateSection = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { title, subtitle, is_active, display_order, items } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM homepage_sections WHERE key = $1`, [key]);
    if (!existing) return notFound(res, 'CMS layout section not found');

    const { rows: [updated] } = await query(
      `UPDATE homepage_sections SET
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        is_active = COALESCE($3, is_active),
        display_order = COALESCE($4, display_order),
        items = COALESCE($5, items),
        updated_at = NOW()
      WHERE key = $6 RETURNING *`,
      [
        title,
        subtitle === undefined ? existing.subtitle : (subtitle || null),
        is_active === undefined ? existing.is_active : is_active,
        display_order ? parseInt(display_order) : existing.display_order,
        items ? JSON.stringify(items) : null,
        key
      ]
    );

    await logAction(req, 'UPDATE_CMS_SECTION', updated.id, { key, title });

    return success(res, updated, 'CMS layout section updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /cms/sections/:key — Delete layout section (SuperAdmin only)
const deleteSection = async (req, res, next) => {
  try {
    const { key } = req.params;

    const { rows: [existing] } = await query(`SELECT * FROM homepage_sections WHERE key = $1`, [key]);
    if (!existing) return notFound(res, 'CMS layout section not found');

    await query(`DELETE FROM homepage_sections WHERE key = $1`, [key]);

    await logAction(req, 'DELETE_CMS_SECTION', existing.id, { key });

    return success(res, {}, 'CMS layout section deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listActiveSections,
  listAllSections,
  createSection,
  updateSection,
  deleteSection
};
