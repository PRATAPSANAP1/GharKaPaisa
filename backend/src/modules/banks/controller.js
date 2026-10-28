const { query } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3, deleteFromS3 } = require('../../services/aws/s3.service.js');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { ensureBankDirectProcessLinksTable } = require('../../database/migrations/migrate_bank_direct_process_links');

const mapBankRow = (bank) => {
  if (!bank) return bank;

  const CDN =
    process.env.CLOUDFRONT_URL ||
    "https://d18qh1l6j6vziz.cloudfront.net";

  const logo = bank.logo
    ? bank.logo.replace(
        "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
        CDN
      )
    : null;

  const logo_url = bank.logo_url
    ? bank.logo_url.replace(
        "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
        CDN
      )
    : null;

  return {
    ...bank,
    logo,
    logo_url
  };
};

// GET /api/v1/banks (Admin/Super Admin/Public — list all banks)
const listAllBanks = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search, status, category } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (b.name ILIKE $${idx} OR b.short_code ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    if (status && status !== 'all') {
      if (status === 'Active') {
        whereClause += ` AND (b.status = 'Active' OR b.is_active = true)`;
      } else if (status === 'Inactive') {
        whereClause += ` AND (b.status = 'Inactive' OR b.is_active = false)`;
      } else {
        whereClause += ` AND b.status = $${idx++}`;
        values.push(status);
      }
    }

    if (category) {
      if (category === 'credit_card' || category === 'cards') {
        whereClause += ` AND EXISTS (
          SELECT 1 FROM products p_cat 
          WHERE p_cat.bank_id = b.id 
            AND (p_cat.category::text IN ('credit_card', 'co_branded_card', 'fd_card') OR p_cat.category::text ILIKE '%card%')
            AND (p_cat.status = 'Active' OR p_cat.is_active = true)
        )`;
      } else {
        whereClause += ` AND EXISTS (
          SELECT 1 FROM products p_cat 
          WHERE p_cat.bank_id = b.id 
            AND p_cat.category::text = $${idx++}
            AND (p_cat.status = 'Active' OR p_cat.is_active = true)
        )`;
        values.push(category);
      }
    }

    const countQuery = `SELECT COUNT(*) FROM banks b ${whereClause}`;
    const dataQuery = `
      SELECT 
        b.*,
        MAX(bdpl.direct_process_link) as direct_process_link,
        COUNT(p.id)::int as products_count,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT p.category::text), NULL) as categories
      FROM banks b
      LEFT JOIN bank_direct_process_links bdpl ON bdpl.bank_id = b.id
      LEFT JOIN products p ON p.bank_id = b.id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.display_order ASC, b.name ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    return paginate(res, dataResult.rows.map(mapBankRow), total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/banks/:id
const getBankById = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { id } = req.params;

    const { rows: [bank] } = await query(`
      SELECT b.*, MAX(bdpl.direct_process_link) as direct_process_link, COUNT(p.id)::int as products_count
      FROM banks b
      LEFT JOIN bank_direct_process_links bdpl ON bdpl.bank_id = b.id
      LEFT JOIN products p ON p.bank_id = b.id
      WHERE b.id = $1
      GROUP BY b.id
    `, [id]);

    if (!bank) return notFound(res, 'Bank partner not found');
    return success(res, mapBankRow(bank));
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/banks (Admin/Super Admin — create new bank)
const createBank = async (req, res, next) => {
  try {
    const {
      name, short_code, is_active, status, display_order,
      hero_title, hero_description, theme_color, secondary_color, gradient,
      button_color, accent_color, banner, seo_title, seo_description
    } = req.body;
    let logo_url = req.body.logo_url;
    let banner_url = req.body.banner;

    if (!name || !short_code) {
      return error(res, 'Bank Name and Short Code are required', 400);
    }

    // Handle file uploads (logo and banner)
    const logoFile = req.file || req.files?.logo?.[0];
    const bannerFile = req.files?.banner?.[0];

    if (logoFile || bannerFile) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 bucket is not configured.', 503);
      }

      if (logoFile) {
        const { url } = await uploadToS3(logoFile.buffer, logoFile.originalname, 'banks');
        logo_url = url;
      }

      if (bannerFile) {
        const { url } = await uploadToS3(bannerFile.buffer, bannerFile.originalname, 'banners');
        banner_url = url;
      }
    }

    // Check if short_code already exists
    const { rows: [existingShort] } = await query('SELECT id FROM banks WHERE short_code = $1', [short_code]);
    if (existingShort) {
      return error(res, 'A bank with this Short Code already exists', 400);
    }

    // Check if name already exists
    const { rows: [existingName] } = await query('SELECT id FROM banks WHERE name = $1', [name]);
    if (existingName) {
      return error(res, 'A bank with this Name already exists', 400);
    }

    const finalStatus = status || (is_active === false || is_active === 'false' ? 'Inactive' : 'Active');
    const finalIsActive = finalStatus === 'Active';

    const { rows: [bank] } = await query(`
      INSERT INTO banks (
        name, short_code, logo_url, is_active, status, display_order,
        hero_title, hero_description, theme_color, secondary_color, gradient,
        button_color, accent_color, banner, seo_title, seo_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      name, short_code, logo_url || null, finalIsActive, finalStatus, display_order || 0,
      hero_title || null, hero_description || null, theme_color || null, secondary_color || null, gradient || null,
      button_color || null, accent_color || null, banner_url || null, seo_title || null, seo_description || null
    ]);

    // Log action to audit logs
    await logAction(req, 'CREATE_BANK', bank.id, { name, short_code });

    return created(res, mapBankRow(bank), 'Bank partner created successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/banks/:id (Admin/Super Admin — update bank)
const updateBank = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { id } = req.params;
    const {
      name, short_code, is_active, status, display_order,
      hero_title, hero_description, theme_color, secondary_color, gradient,
      button_color, accent_color, banner, seo_title, seo_description
    } = req.body;
    let logo_url = req.body.logo_url || req.body.logo;
    let banner_url = req.body.banner || req.body.banner_url;

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) {
      return notFound(res, 'Bank partner not found');
    }

    const logoFile = req.file || req.files?.logo?.[0];
    const bannerFile = req.files?.banner?.[0];

    if (logoFile || bannerFile) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 bucket is not configured.', 503);
      }

      if (logoFile) {
        const { url } = await uploadToS3(logoFile.buffer, logoFile.originalname, 'banks');
        logo_url = url;

        if (existing.logo_url && existing.logo_url.includes(process.env.AWS_S3_BUCKET)) {
          try {
            const parts = existing.logo_url.split('.com/');
            if (parts[1]) await deleteFromS3(parts[1]);
          } catch (s3Err) {
            console.error('Failed to delete old bank logo from S3', s3Err);
          }
        }
      }

      if (bannerFile) {
        const { url } = await uploadToS3(bannerFile.buffer, bannerFile.originalname, 'banners');
        banner_url = url;

        if (existing.banner && existing.banner.includes(process.env.AWS_S3_BUCKET)) {
          try {
            const parts = existing.banner.split('.com/');
            if (parts[1]) await deleteFromS3(parts[1]);
          } catch (s3Err) {
            console.error('Failed to delete old bank banner from S3', s3Err);
          }
        }
      }
    }

    if (name && name !== existing.name) {
      const { rows: [dupName] } = await query('SELECT id FROM banks WHERE name = $1', [name]);
      if (dupName) return error(res, 'A bank with this Name already exists', 400);
    }

    if (short_code && short_code !== existing.short_code) {
      const { rows: [dupShort] } = await query('SELECT id FROM banks WHERE short_code = $1', [short_code]);
      if (dupShort) return error(res, 'A bank with this Short Code already exists', 400);
    }

    const finalStatus = status || (is_active !== undefined ? (is_active ? 'Active' : 'Inactive') : existing.status);
    const finalIsActive = finalStatus === 'Active';

    const { rows: [bank] } = await query(`
      UPDATE banks SET
        name = COALESCE($1, name),
        short_code = COALESCE($2, short_code),
        logo_url = COALESCE($3, logo_url),
        is_active = $4,
        status = $5,
        display_order = COALESCE($6, display_order),
        hero_title = COALESCE($7, hero_title),
        hero_description = COALESCE($8, hero_description),
        theme_color = COALESCE($9, theme_color),
        secondary_color = COALESCE($10, secondary_color),
        gradient = COALESCE($11, gradient),
        button_color = COALESCE($12, button_color),
        accent_color = COALESCE($13, accent_color),
        banner = COALESCE($14, banner),
        seo_title = COALESCE($15, seo_title),
        seo_description = COALESCE($16, seo_description),
        updated_at = NOW()
      WHERE id = $17
      RETURNING *
    `, [
      name || null,
      short_code || null,
      logo_url || null,
      finalIsActive,
      finalStatus,
      display_order !== undefined ? parseInt(display_order) : null,
      hero_title || null,
      hero_description || null,
      theme_color || null,
      secondary_color || null,
      gradient || null,
      button_color || null,
      accent_color || null,
      banner_url || null,
      seo_title || null,
      seo_description || null,
      id
    ]);

    await logAction(req, 'UPDATE_BANK', bank.id, { name: bank.name, status: bank.status, is_active: bank.is_active });

    return success(res, mapBankRow(bank), 'Bank partner updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/banks/:id/status
const updateBankStatus = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { id } = req.params;
    const { status } = req.body;

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) return notFound(res, 'Bank partner not found');

    const newStatus = status || (existing.status === 'Active' ? 'Inactive' : 'Active');
    const newIsActive = newStatus === 'Active';

    const { rows: [updated] } = await query(`
      UPDATE banks SET status = $1, is_active = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [newStatus, newIsActive, id]);

    await logAction(req, 'UPDATE_BANK_STATUS', id, { status: newStatus });
    return success(res, mapBankRow(updated), 'Bank status updated successfully');
  } catch (err) {
    next(err);
  }
};

// PUT or PATCH /api/v1/banks/:id/direct-link (Super Admin & Admin — Direct Process Link management)
const updateBankDirectLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      direct_process_url,
      direct_process_enabled,
      dsa_code,
      channel_code,
      utm_source,
      utm_medium,
      utm_campaign,
      direct_process_notes
    } = req.body;

    // Self-healing schema check to ensure columns exist
    await query(`
      ALTER TABLE banks 
        ADD COLUMN IF NOT EXISTS direct_process_url TEXT,
        ADD COLUMN IF NOT EXISTS direct_process_enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS dsa_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS channel_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
        ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
        ADD COLUMN IF NOT EXISTS direct_process_notes TEXT
    `).catch(() => {});

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) return notFound(res, 'Bank partner not found');

    // URL validation if non-empty string is provided
    if (direct_process_url && typeof direct_process_url === 'string' && direct_process_url.trim()) {
      const trimmedUrl = direct_process_url.trim();
      if (!trimmedUrl.match(/^https?:\/\//i) && !trimmedUrl.includes('.')) {
        return error(res, 'Invalid Direct Process URL format. Please provide a valid URL (e.g. https://apply.bank.com).', 400);
      }
    }

    const isEnabled = direct_process_enabled !== undefined ? !!direct_process_enabled : (existing.direct_process_enabled ?? true);

    const { rows: [updated] } = await query(`
      UPDATE banks SET
        direct_process_url = $1,
        direct_process_enabled = $2,
        dsa_code = $3,
        channel_code = $4,
        utm_source = $5,
        utm_medium = $6,
        utm_campaign = $7,
        direct_process_notes = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      direct_process_url !== undefined ? (direct_process_url ? direct_process_url.trim() : null) : existing.direct_process_url,
      isEnabled,
      dsa_code !== undefined ? (dsa_code ? dsa_code.trim() : null) : existing.dsa_code,
      channel_code !== undefined ? (channel_code ? channel_code.trim() : null) : existing.channel_code,
      utm_source !== undefined ? (utm_source ? utm_source.trim() : null) : existing.utm_source,
      utm_medium !== undefined ? (utm_medium ? utm_medium.trim() : null) : existing.utm_medium,
      utm_campaign !== undefined ? (utm_campaign ? utm_campaign.trim() : null) : existing.utm_campaign,
      direct_process_notes !== undefined ? (direct_process_notes ? direct_process_notes.trim() : null) : existing.direct_process_notes,
      id
    ]);

    await logAction(req, 'UPDATE_BANK_DIRECT_LINK', id, {
      name: updated.name,
      direct_process_url: updated.direct_process_url,
      direct_process_enabled: updated.direct_process_enabled,
      dsa_code: updated.dsa_code
    });

    return success(res, mapBankRow(updated), `Direct process link for ${updated.name} updated successfully`);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/banks/:id (Admin/Super Admin — delete bank)
const deleteBank = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { id } = req.params;

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) {
      return notFound(res, 'Bank partner not found');
    }

    await query('ALTER TABLE products ALTER COLUMN bank_id DROP NOT NULL').catch(() => {});
    await query('UPDATE products SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});

    await query('ALTER TABLE applications ALTER COLUMN bank_id DROP NOT NULL').catch(() => {});
    await query('UPDATE applications SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});

    await query('UPDATE bank_card_applications SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});

    await query('DELETE FROM banks WHERE id = $1', [id]);

    await logAction(req, 'DELETE_BANK', id, { name: existing.name });

    return success(res, {}, 'Bank partner deleted successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/banks/active — Public, lightweight, no auth
const getActiveBanks = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { category } = req.query;
    let categoryClause = '';
    const values = [];

    if (category) {
      if (category === 'credit_card' || category === 'cards') {
        categoryClause = ` AND EXISTS (
          SELECT 1 FROM products p_cat 
          WHERE p_cat.bank_id = b.id 
            AND (p_cat.category::text IN ('credit_card', 'co_branded_card', 'fd_card') OR p_cat.category::text ILIKE '%card%')
            AND (p_cat.status = 'Active' OR p_cat.is_active = true)
        )`;
      } else {
        categoryClause = ` AND EXISTS (
          SELECT 1 FROM products p_cat 
          WHERE p_cat.bank_id = b.id 
            AND p_cat.category::text = $1
            AND (p_cat.status = 'Active' OR p_cat.is_active = true)
        )`;
        values.push(category);
      }
    }

    const { rows } = await query(`
      SELECT
        b.id,
        b.name as bank_name,
        b.short_code,
        b.logo_url as logo,
        b.display_order,
        MAX(bdpl.direct_process_link) as direct_process_link,
        COUNT(p.id) FILTER (WHERE p.status = 'Active' OR p.is_active = true)::int as products_count
      FROM banks b
      LEFT JOIN bank_direct_process_links bdpl ON bdpl.bank_id = b.id
      LEFT JOIN products p ON p.bank_id = b.id
      WHERE (b.is_active = true OR b.status = 'Active')
      ${categoryClause}
      GROUP BY b.id
      ORDER BY b.display_order ASC, b.name ASC
    `, values);

    const cloudfrontUrl =
      process.env.CLOUDFRONT_URL ||
      "https://d18qh1l6j6vziz.cloudfront.net";

    const data = rows.map((bank) => ({
      ...bank,
      logo: bank.logo
        ? bank.logo.replace(
            "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
            cloudfrontUrl
          )
        : null,
    }));

    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getBankCardsBySlug = async (req, res, next) => {
  try {
    await ensureBankDirectProcessLinksTable();
    const { slug } = req.params;
    const cleanSlug = slug ? slug.replace(/-bank$/i, '').trim() : '';

    // 1. Fetch the bank matching short_code, name, cleanSlug, or id
    const { rows: [bank] } = await query(`
      SELECT * FROM banks 
      WHERE LOWER(short_code) = LOWER($1) 
         OR LOWER(short_code) = LOWER($2)
         OR LOWER(name) = LOWER($1)
         OR LOWER(name) = LOWER($2)
         OR LOWER(REPLACE(name, ' ', '')) = LOWER(REPLACE($2, ' ', ''))
         OR id::text = $1
    `, [slug, cleanSlug]);

    if (!bank) {
      return notFound(res, 'Bank partner not found');
    }

    const cloudfrontUrl = process.env.CLOUDFRONT_URL || "https://d18qh1l6j6vziz.cloudfront.net";

    // Map logo S3 URL if any
    if (bank.logo_url) {
      bank.logo_url = bank.logo_url.replace(
        "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
        cloudfrontUrl
      );
    }

    if (bank.banner) {
      bank.banner = bank.banner.replace(
        "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
        cloudfrontUrl
      );
    }

    // 2. Fetch the active cards (products) of this bank
    const { rows: cards } = await query(`
      SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo, bdpl.direct_process_link as bank_direct_process_link
      FROM products p
      JOIN banks b ON b.id = p.bank_id
      LEFT JOIN bank_direct_process_links bdpl ON bdpl.bank_id = p.bank_id
      WHERE p.bank_id = $1 
        AND (p.category::text ILIKE '%card%' OR p.category::text IN ('credit_card', 'co_branded_card', 'fd_card')) 
        AND (p.is_active = true OR p.status = 'Active')
      ORDER BY p.priority ASC, p.display_order ASC
    `, [bank.id]);

    // Map S3 image_url and banner_url to CloudFront if any
    const mappedCards = cards.map(c => {
      const mapped = { ...c };
      if (mapped.image_url) {
        mapped.image_url = mapped.image_url.replace(
          "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
          cloudfrontUrl
        );
      }
      if (mapped.banner_url) {
        mapped.banner_url = mapped.banner_url.replace(
          "https://gharkapaisa-documents.s3.ap-south-1.amazonaws.com",
          cloudfrontUrl
        );
      }
      // Make sure features and benefits are arrays
      try {
        if (typeof mapped.features === 'string') mapped.features = JSON.parse(mapped.features);
      } catch (e) {
        if (!Array.isArray(mapped.features)) mapped.features = [];
      }
      try {
        if (typeof mapped.benefits === 'string') mapped.benefits = JSON.parse(mapped.benefits);
      } catch (e) {
        if (!Array.isArray(mapped.benefits)) mapped.benefits = [];
      }
      return mapped;
    });

    // 3. Fetch distinct subcategories
    const { rows: catRows } = await query(`
      SELECT DISTINCT sub_category as cat
      FROM products
      WHERE category IN ('credit_card', 'co_branded_card', 'fd_card')
        AND is_active = true 
        AND status = 'Active'
        AND sub_category IS NOT NULL 
        AND sub_category != ''
    `);

    let distinctCategories = catRows.map(r => r.cat);
    if (distinctCategories.length === 0) {
      distinctCategories = ["Rewards", "Travel", "Cashback", "Business"];
    }

    // 4. Construct response structures
    const categories = distinctCategories;
    const filters = ["All", ...categories];

    const seo = {
      title: bank.seo_title || `${bank.name} Credit Cards - Apply Online & Compare`,
      description: bank.seo_description || `Compare ${bank.name} Credit Cards, benefits, rewards, annual fees and eligibility. Apply online for instant approval.`,
      keywords: `${bank.short_code.toLowerCase()} credit cards, compare ${bank.short_code.toLowerCase()} cards, apply ${bank.short_code.toLowerCase()} cards`
    };

    return success(res, {
      bank,
      cards: mappedCards,
      categories,
      filters,
      seo
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAllBanks,
  getBankById,
  getActiveBanks,
  createBank,
  updateBank,
  updateBankStatus,
  updateBankDirectLink,
  deleteBank,
  getBankCardsBySlug
};
