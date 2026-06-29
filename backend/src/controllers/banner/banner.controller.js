const { query } = require('../../config/db');
const { uploadToS3, deleteFromS3 } = require('../../services/partner/s3.service.js');
const { success, created, error, notFound } = require('../../utils/response');
const logger = require('../../utils/logger');

// GET /banners — List all active banners (public)
const listBanners = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM banners WHERE is_active = true ORDER BY display_order ASC, created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /banners/all — List all banners including inactive ones (Admin/SuperAdmin)
const listAllBanners = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM banners ORDER BY display_order ASC, created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// POST /banners — Create a banner (SuperAdmin)
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, btn_text, display_order, is_active, link_type, click_url } = req.body;
    let image_url = req.body.image_url;

    // Check if a file is uploaded
    if (req.file) {
      const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 storage service is not configured. Upload failed.', 503);
      }
      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'banners');
      image_url = url;
    }

    if (!image_url) {
      return error(res, 'Banner image is required (either as S3 file upload or image_url text)', 400);
    }

    const { rows: [b] } = await query(
      `INSERT INTO banners (title, subtitle, btn_text, image_url, display_order, is_active, link_type, click_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title, 
        subtitle || null, 
        btn_text || null, 
        image_url, 
        display_order ? parseInt(display_order) : 0, 
        is_active === undefined ? true : (is_active === 'true' || is_active === true),
        link_type || 'custom',
        click_url || '/credit-cards'
      ]
    );

    return created(res, b, 'Banner created successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /banners/:id — Update a banner (SuperAdmin)
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, btn_text, display_order, is_active, link_type, click_url } = req.body;
    let image_url = req.body.image_url;

    const { rows: [existing] } = await query(`SELECT * FROM banners WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Banner not found');

    if (req.file) {
      const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 storage service is not configured. Upload failed.', 503);
      }
      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'banners');
      image_url = url;

      // Optionally delete the old file from S3 if it was an S3 key
      if (existing.image_url && existing.image_url.includes(process.env.AWS_S3_BUCKET)) {
        try {
          const parts = existing.image_url.split('.com/');
          if (parts[1]) await deleteFromS3(parts[1]);
        } catch (s3Err) {
          logger.warn('Failed to delete old banner image from S3', s3Err);
        }
      }
    }

    const { rows: [updated] } = await query(
      `UPDATE banners SET
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        btn_text = COALESCE($3, btn_text),
        image_url = COALESCE($4, image_url),
        display_order = COALESCE($5, display_order),
        is_active = COALESCE($6, is_active),
        link_type = COALESCE($8, link_type),
        click_url = COALESCE($9, click_url),
        updated_at = NOW()
      WHERE id = $7 RETURNING *`,
      [
        title,
        subtitle === undefined ? existing.subtitle : (subtitle || null),
        btn_text === undefined ? existing.btn_text : (btn_text || null),
        image_url || null,
        display_order ? parseInt(display_order) : existing.display_order,
        is_active === undefined ? existing.is_active : (is_active === 'true' || is_active === true),
        id,
        link_type || null,
        click_url || null
      ]
    );

    return success(res, updated, 'Banner updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /banners/:id — Delete a banner (SuperAdmin)
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [existing] } = await query(`SELECT * FROM banners WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Banner not found');

    await query(`DELETE FROM banners WHERE id = $1`, [id]);

    // Delete file from S3 if it was an S3 URL
    if (existing.image_url && existing.image_url.includes(process.env.AWS_S3_BUCKET)) {
      try {
        const parts = existing.image_url.split('.com/');
        if (parts[1]) await deleteFromS3(parts[1]);
      } catch (s3Err) {
        logger.warn('Failed to delete banner image from S3 on deletion', s3Err);
      }
    }

    return success(res, {}, 'Banner deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listBanners,
  listAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
};
