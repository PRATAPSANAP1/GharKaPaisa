const { query } = require('../../config/database');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const logger = require('../../config/logger');

// ── Bookmark / Save Product ──────────────────────────────────────────────────

const bookmarkProduct = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return error(res, 'product_id is required', 400);

    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found', 403);

    // Toggle bookmark: insert or delete
    const { rows: existing } = await query(
      `SELECT id FROM partner_saved_products WHERE partner_id = $1 AND product_id = $2`,
      [partnerId, product_id]
    );

    if (existing.length > 0) {
      await query(`DELETE FROM partner_saved_products WHERE partner_id = $1 AND product_id = $2`, [partnerId, product_id]);
      return success(res, { bookmarked: false }, 'Product removed from bookmarks');
    }

    await query(
      `INSERT INTO partner_saved_products (partner_id, product_id) VALUES ($1, $2) ON CONFLICT (partner_id, product_id) DO NOTHING`,
      [partnerId, product_id]
    );
    return created(res, { bookmarked: true }, 'Product bookmarked successfully');
  } catch (err) {
    next(err);
  }
};

const getBookmarks = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found', 403);

    const { page, limit, offset } = getPaginationParams(req.query);
    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM partner_saved_products WHERE partner_id = $1`, [partnerId]),
      query(`
        SELECT sp.id as bookmark_id, sp.created_at as bookmarked_at,
               p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM partner_saved_products sp
        JOIN products p ON p.id = sp.product_id
        JOIN banks b ON b.id = p.bank_id
        WHERE sp.partner_id = $1
        ORDER BY sp.created_at DESC
        LIMIT $2 OFFSET $3
      `, [partnerId, limit, offset])
    ]);

    return paginate(res, dataRes.rows, parseInt(countRes.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// ── Recently Viewed ──────────────────────────────────────────────────────────

const trackProductView = async (productId, partnerId, ip, userAgent) => {
  try {
    // Log to product_views (analytics, always append)
    await query(
      `INSERT INTO product_views (product_id, partner_id, viewer_ip, user_agent) VALUES ($1, $2, $3, $4)`,
      [productId, partnerId || null, ip || null, userAgent || null]
    );

    // Upsert recently viewed for the partner
    if (partnerId) {
      await query(`
        INSERT INTO partner_recent_products (partner_id, product_id, last_viewed_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (partner_id, product_id) DO UPDATE SET last_viewed_at = NOW()
      `, [partnerId, productId]);
    }
  } catch (err) {
    logger.error('Failed to track product view:', err.message);
  }
};

const getRecentlyViewed = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found', 403);

    const { rows } = await query(`
      SELECT rp.last_viewed_at,
             p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM partner_recent_products rp
      JOIN products p ON p.id = rp.product_id
      JOIN banks b ON b.id = p.bank_id
      WHERE rp.partner_id = $1
      ORDER BY rp.last_viewed_at DESC
      LIMIT 20
    `, [partnerId]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// ── Compare Products ─────────────────────────────────────────────────────────

const compareProducts = async (req, res, next) => {
  try {
    const { product_ids } = req.body;
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length < 2 || product_ids.length > 4) {
      return error(res, 'Please provide 2-4 product IDs for comparison', 400);
    }

    const placeholders = product_ids.map((_, i) => `$${i + 1}`).join(',');
    const { rows: products } = await query(`
      SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM products p
      JOIN banks b ON b.id = p.bank_id
      WHERE p.id IN (${placeholders})
    `, product_ids);

    if (products.length < 2) {
      return error(res, 'Could not find enough products to compare', 404);
    }

    // Fetch ratings for each product
    const ratingPromises = product_ids.map(id =>
      query(`SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM product_ratings WHERE product_id = $1`, [id])
    );
    const ratingResults = await Promise.all(ratingPromises);

    // Fetch active offers
    const offerPromises = product_ids.map(id =>
      query(`SELECT title, badge_text, discount_value FROM product_offers WHERE product_id = $1 AND is_active = true AND NOW() BETWEEN start_date AND end_date LIMIT 3`, [id])
    );
    const offerResults = await Promise.all(offerPromises);

    const enrichedProducts = products.map((p, i) => {
      const idx = product_ids.indexOf(p.id);
      return {
        ...p,
        avg_rating: parseFloat(ratingResults[idx]?.rows[0]?.avg_rating || 0).toFixed(1),
        review_count: parseInt(ratingResults[idx]?.rows[0]?.review_count || 0),
        active_offers: offerResults[idx]?.rows || []
      };
    });

    // Build comparison matrix
    const comparisonFields = [
      'name', 'category', 'bank_name', 'annual_fee', 'joining_fee', 'interest_rate',
      'commission_value', 'commission_type', 'rewards', 'cashback', 'lounge_access',
      'fuel_surcharge', 'travel_benefits', 'min_age', 'max_age', 'min_income',
      'hold_days', 'approval_rate', 'avg_rating', 'review_count'
    ];

    const comparisonMatrix = {};
    comparisonFields.forEach(field => {
      comparisonMatrix[field] = enrichedProducts.map(p => p[field] ?? 'N/A');
    });

    return success(res, { products: enrichedProducts, comparison: comparisonMatrix });
  } catch (err) {
    next(err);
  }
};

// ── Share Product ────────────────────────────────────────────────────────────

const shareProduct = async (req, res, next) => {
  try {
    const { product_id, share_method, customer_contact } = req.body;
    if (!product_id || !share_method) return error(res, 'product_id and share_method are required', 400);

    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found', 403);

    const validMethods = ['whatsapp', 'email', 'copy_link', 'qr', 'sms'];
    if (!validMethods.includes(share_method.toLowerCase())) {
      return error(res, `share_method must be one of: ${validMethods.join(', ')}`, 400);
    }

    await query(
      `INSERT INTO product_share_logs (product_id, partner_id, share_method, customer_contact) VALUES ($1, $2, $3, $4)`,
      [product_id, partnerId, share_method.toLowerCase(), customer_contact || null]
    );

    // Generate share link with partner referral code
    const partnerCode = req.partner?.partner_code || '';
    const frontendUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
    const shareLink = `${frontendUrl}/products/${product_id}?ref=${partnerCode}`;

    return created(res, { share_link: shareLink, method: share_method }, 'Product share logged');
  } catch (err) {
    next(err);
  }
};

// ── Eligibility Checker ──────────────────────────────────────────────────────

const checkEligibility = async (req, res, next) => {
  try {
    const { product_id, age, salary, occupation, employment_type, city, cibil_score } = req.body;
    if (!product_id) return error(res, 'product_id is required', 400);

    // Fetch product & its application settings
    const { rows: [product] } = await query(
      `SELECT p.*, pas.min_salary, pas.max_salary, pas.min_age as settings_min_age, pas.max_age as settings_max_age,
              pas.min_cibil, pas.allowed_employment_types, pas.allowed_cities
       FROM products p
       LEFT JOIN product_application_settings pas ON pas.product_id = p.id
       WHERE p.id = $1`,
      [product_id]
    );

    if (!product) return notFound(res, 'Product not found');

    const reasons = [];
    let eligible = true;

    // Age check
    const minAge = product.settings_min_age || product.min_age || 18;
    const maxAge = product.settings_max_age || product.max_age || 65;
    if (age && (age < minAge || age > maxAge)) {
      eligible = false;
      reasons.push(`Age must be between ${minAge} and ${maxAge} years`);
    }

    // Salary check
    const minSalary = product.min_salary || product.min_income || 0;
    const maxSalary = product.max_salary || 99999999;
    if (salary && salary < minSalary) {
      eligible = false;
      reasons.push(`Minimum salary requirement is ₹${minSalary.toLocaleString('en-IN')}`);
    }
    if (salary && salary > maxSalary) {
      eligible = false;
      reasons.push(`Maximum salary limit is ₹${maxSalary.toLocaleString('en-IN')}`);
    }

    // CIBIL check
    if (product.min_cibil && cibil_score && cibil_score < product.min_cibil) {
      eligible = false;
      reasons.push(`Minimum CIBIL score requirement is ${product.min_cibil}`);
    }

    // Employment type check
    if (product.allowed_employment_types && employment_type) {
      const allowed = Array.isArray(product.allowed_employment_types)
        ? product.allowed_employment_types
        : [product.allowed_employment_types];
      if (allowed.length > 0 && !allowed.includes(employment_type)) {
        eligible = false;
        reasons.push(`Employment type "${employment_type}" is not eligible. Allowed: ${allowed.join(', ')}`);
      }
    }

    // City check
    if (product.allowed_cities && city) {
      const allowedCities = Array.isArray(product.allowed_cities)
        ? product.allowed_cities.map(c => c.toLowerCase())
        : [];
      if (allowedCities.length > 0 && !allowedCities.includes(city.toLowerCase())) {
        eligible = false;
        reasons.push(`This product is not available in ${city}`);
      }
    }

    // Fetch recommended alternatives if not eligible
    let recommendations = [];
    if (!eligible) {
      const { rows } = await query(`
        SELECT p.id, p.name, p.category, p.commission_value, p.annual_fee, p.min_income,
               b.name as bank_name, b.logo_url as bank_logo
        FROM products p
        JOIN banks b ON b.id = p.bank_id
        WHERE p.is_active = true AND p.category = $1
        AND (p.min_income IS NULL OR p.min_income <= $2)
        AND (p.min_age IS NULL OR p.min_age <= $3)
        AND p.id <> $4
        ORDER BY p.commission_value DESC
        LIMIT 5
      `, [product.category, salary || 999999, age || 30, product_id]);
      recommendations = rows;
    }

    return success(res, {
      eligible,
      product_name: product.name,
      reasons,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};

// ── Recommendation Engine ────────────────────────────────────────────────────

const getRecommendations = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found', 403);

    const { age, salary, occupation, city, cibil_score, limit: reqLimit } = req.query;
    const resultLimit = parseInt(reqLimit) || 10;

    // Fetch partner preferences if they exist
    const { rows: [prefs] } = await query(
      `SELECT * FROM partner_preferences WHERE partner_id = $1`, [partnerId]
    );

    // Fetch partner's recent activity for context
    const { rows: recentViews } = await query(
      `SELECT product_id FROM partner_recent_products WHERE partner_id = $1 ORDER BY last_viewed_at DESC LIMIT 10`,
      [partnerId]
    );
    const viewedIds = recentViews.map(r => r.product_id);

    // Build dynamic scoring query
    let scoreParts = [];
    let values = [];
    let idx = 1;

    // Base: active products
    let where = `WHERE p.is_active = true AND b.is_active = true`;

    // Exclude already viewed (boost novelty)
    if (viewedIds.length > 0) {
      const viewPlaceholders = viewedIds.map((_, i) => `$${idx + i}`).join(',');
      scoreParts.push(`CASE WHEN p.id NOT IN (${viewPlaceholders}) THEN 5 ELSE 0 END`);
      values.push(...viewedIds);
      idx += viewedIds.length;
    }

    // Preference-based scoring
    if (prefs?.preferred_categories && prefs.preferred_categories.length > 0) {
      scoreParts.push(`CASE WHEN p.category::text = ANY($${idx}::text[]) THEN 10 ELSE 0 END`);
      values.push(prefs.preferred_categories);
      idx++;
    }

    // Commission scoring (higher commission = better for partner)
    scoreParts.push(`CASE WHEN p.commission_value > 500 THEN 8 WHEN p.commission_value > 200 THEN 5 ELSE 2 END`);

    // Featured/trending boost
    scoreParts.push(`CASE WHEN p.featured = true THEN 6 ELSE 0 END`);
    scoreParts.push(`CASE WHEN p.trending = true THEN 4 ELSE 0 END`);

    // Approval rate boost
    scoreParts.push(`CASE WHEN p.approval_rate > 80 THEN 3 WHEN p.approval_rate > 60 THEN 1 ELSE 0 END`);

    // Eligibility filter
    if (salary) {
      where += ` AND (p.min_income IS NULL OR p.min_income <= $${idx})`;
      values.push(parseFloat(salary));
      idx++;
    }
    if (age) {
      where += ` AND (p.min_age IS NULL OR p.min_age <= $${idx}) AND (p.max_age IS NULL OR p.max_age >= $${idx})`;
      values.push(parseInt(age));
      idx++;
    }

    const scoreExpr = scoreParts.length > 0 ? scoreParts.join(' + ') : '0';

    const { rows } = await query(`
      SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo,
             (${scoreExpr}) as relevance_score
      FROM products p
      JOIN banks b ON b.id = p.bank_id
      ${where}
      ORDER BY relevance_score DESC, p.commission_value DESC
      LIMIT $${idx}
    `, [...values, resultLimit]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookmarkProduct,
  getBookmarks,
  trackProductView,
  getRecentlyViewed,
  compareProducts,
  shareProduct,
  checkEligibility,
  getRecommendations
};
