let columnsChecked = false;
const ensureBannerColumns = async () => {
  if (columnsChecked) return;
  try {
    await query(`
      ALTER TABLE banners 
      ADD COLUMN IF NOT EXISTS target_page VARCHAR(255) DEFAULT 'all',
      ADD COLUMN IF NOT EXISTS link_type VARCHAR(50) DEFAULT 'custom',
      ADD COLUMN IF NOT EXISTS click_url VARCHAR(500) DEFAULT '/credit-cards',
      ADD COLUMN IF NOT EXISTS click_url_home VARCHAR(500),
      ADD COLUMN IF NOT EXISTS click_url_partner VARCHAR(500),
      ADD COLUMN IF NOT EXISTS click_url_employee VARCHAR(500);
    `);
    columnsChecked = true;
  } catch (err) {
    logger.warn('Failed to auto-ensure banner columns:', err.message);
  }
};

// GET /banners — List all active banners (public)
const listBanners = async (req, res, next) => {
  try {
    await ensureBannerColumns();
    const pageFilter = req.query.page || req.query.target_page;
    let sql = `SELECT * FROM banners WHERE is_active = true`;
    const params = [];

    if (pageFilter && pageFilter !== 'all') {
      if (pageFilter === 'team' || pageFilter === 'partner') {
        sql += ` AND (target_page LIKE '%partner%' OR target_page LIKE '%team%' OR target_page = 'all' OR target_page IS NULL)`;
      } else if (pageFilter === 'employee') {
        sql += ` AND (target_page LIKE '%employee%' OR target_page = 'all' OR target_page IS NULL)`;
      } else if (pageFilter === 'referral' || pageFilter === 'refer') {
        sql += ` AND (target_page LIKE '%referral%' OR target_page LIKE '%refer%' OR target_page = 'all' OR target_page IS NULL)`;
      } else if (pageFilter === 'offer' || pageFilter === 'home') {
        sql += ` AND (target_page LIKE '%home%' OR target_page LIKE '%offer%' OR target_page = 'all' OR target_page IS NULL)`;
      } else {
        sql += ` AND (target_page LIKE $1 OR target_page = 'all' OR target_page IS NULL)`;
        params.push(`%${pageFilter}%`);
      }
    }

    sql += ` ORDER BY display_order ASC, created_at DESC`;
    const { rows } = await query(sql, params);
    const sanitizedRows = rows.map(b => {
      // Determine panel-specific click_url if available
      let effectiveClickUrl = b.click_url;
      if ((pageFilter === 'home' || pageFilter === 'offer') && b.click_url_home) {
        effectiveClickUrl = b.click_url_home;
      } else if ((pageFilter === 'partner' || pageFilter === 'team') && b.click_url_partner) {
        effectiveClickUrl = b.click_url_partner;
      } else if (pageFilter === 'employee' && b.click_url_employee) {
        effectiveClickUrl = b.click_url_employee;
      }

      return {
        ...b,
        click_url: effectiveClickUrl || b.click_url || '/credit-cards',
        image_url: getCloudFrontUrl(b.image_url)
      };
    });
    return success(res, sanitizedRows);
  } catch (err) {
    next(err);
  }
};

// GET /banners/all — List all banners including inactive ones (Admin/SuperAdmin)
const listAllBanners = async (req, res, next) => {
  try {
    await ensureBannerColumns();
    const pageFilter = req.query.page || req.query.target_page;
    let sql = `SELECT * FROM banners`;
    const params = [];

    if (pageFilter && pageFilter !== 'all') {
      if (pageFilter === 'team' || pageFilter === 'partner') {
        sql += ` WHERE (target_page LIKE '%partner%' OR target_page LIKE '%team%' OR target_page = 'all' OR target_page IS NULL)`;
      } else if (pageFilter === 'employee') {
        sql += ` WHERE (target_page LIKE '%employee%' OR target_page = 'all' OR target_page IS NULL)`;
      } else if (pageFilter === 'referral' || pageFilter === 'refer') {
        sql += ` WHERE (target_page LIKE '%referral%' OR target_page LIKE '%refer%' OR target_page = 'all' OR target_page IS NULL)`;
      } else if (pageFilter === 'offer' || pageFilter === 'home') {
        sql += ` WHERE (target_page LIKE '%home%' OR target_page LIKE '%offer%' OR target_page = 'all' OR target_page IS NULL)`;
      } else {
        sql += ` WHERE (target_page LIKE $1 OR target_page = 'all' OR target_page IS NULL)`;
        params.push(`%${pageFilter}%`);
      }
    }

    sql += ` ORDER BY display_order ASC, created_at DESC`;
    const { rows } = await query(sql, params);
    const sanitizedRows = rows.map(b => ({
      ...b,
      image_url: getCloudFrontUrl(b.image_url)
    }));
    return success(res, sanitizedRows);
  } catch (err) {
    next(err);
  }
};

// POST /banners — Create a banner (SuperAdmin)
const createBanner = async (req, res, next) => {
  try {
    await ensureBannerColumns();
    const { 
      title, subtitle, btn_text, display_order, is_active, 
      link_type, click_url, target_page,
      click_url_home, click_url_partner, click_url_employee 
    } = req.body;
    let image_url = req.body.image_url;

    // Check if a file is uploaded
    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 bucket is not configured.', 503);
      }
      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'banners');
      image_url = url;
    }

    if (!image_url) {
      return error(res, 'Banner image is required (either as S3 file upload or image_url text)', 400);
    }

    const { rows: [b] } = await query(
      `INSERT INTO banners (
        title, subtitle, btn_text, image_url, display_order, is_active, 
        link_type, click_url, target_page, click_url_home, click_url_partner, click_url_employee
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        title, 
        subtitle || null, 
        btn_text || null, 
        image_url, 
        display_order ? parseInt(display_order) : 0, 
        is_active === undefined ? true : (is_active === 'true' || is_active === true),
        link_type || 'custom',
        click_url || '/credit-cards',
        target_page || 'all',
        click_url_home || null,
        click_url_partner || null,
        click_url_employee || null
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
    await ensureBannerColumns();
    const { id } = req.params;
    const { 
      title, subtitle, btn_text, display_order, is_active, 
      link_type, click_url, target_page,
      click_url_home, click_url_partner, click_url_employee 
    } = req.body;
    let image_url = req.body.image_url;

    const { rows: [existing] } = await query(`SELECT * FROM banners WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Banner not found');

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 bucket is not configured.', 503);
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
        target_page = COALESCE($10, target_page),
        click_url_home = $11,
        click_url_partner = $12,
        click_url_employee = $13,
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
        click_url || null,
        target_page || existing.target_page || 'all',
        click_url_home === undefined ? existing.click_url_home : (click_url_home || null),
        click_url_partner === undefined ? existing.click_url_partner : (click_url_partner || null),
        click_url_employee === undefined ? existing.click_url_employee : (click_url_employee || null)
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
