const { query } = require('../../config/database');
const { success, created, error, notFound } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3 } = require('../../services/aws/s3.service.js');
const logger = require('../../config/logger');

// ═══════════════════════════════════════════════════════════════════
// FAQs
// ═══════════════════════════════════════════════════════════════════

const getProductFaqs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT * FROM product_faq WHERE product_id = $1 AND is_active = true ORDER BY display_order ASC, created_at ASC`,
      [id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const upsertProductFaq = async (req, res, next) => {
  try {
    const { id } = req.params; // product_id
    const { faq_id, question, answer, display_order } = req.body;
    if (!question || !answer) return error(res, 'question and answer are required', 400);

    if (faq_id) {
      // Update existing FAQ
      await query(
        `UPDATE product_faq SET question = $1, answer = $2, display_order = COALESCE($3, display_order), updated_at = NOW() WHERE id = $4 AND product_id = $5`,
        [question, answer, display_order, faq_id, id]
      );
      await logAction(req, 'UPDATE_PRODUCT_FAQ', id, { faq_id, question });
      return success(res, {}, 'FAQ updated');
    }

    // Create new FAQ
    const { rows: [faq] } = await query(
      `INSERT INTO product_faq (product_id, question, answer, display_order) VALUES ($1, $2, $3, $4) RETURNING id`,
      [id, question, answer, display_order || 0]
    );
    await logAction(req, 'CREATE_PRODUCT_FAQ', id, { faq_id: faq.id, question });
    return created(res, { id: faq.id }, 'FAQ created');
  } catch (err) {
    next(err);
  }
};

const deleteProductFaq = async (req, res, next) => {
  try {
    const { id, faqId } = req.params;
    const { rowCount } = await query(`DELETE FROM product_faq WHERE id = $1 AND product_id = $2`, [faqId, id]);
    if (rowCount === 0) return notFound(res, 'FAQ not found');
    await logAction(req, 'DELETE_PRODUCT_FAQ', id, { faq_id: faqId });
    return success(res, {}, 'FAQ deleted');
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// Videos
// ═══════════════════════════════════════════════════════════════════

const getProductVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT * FROM product_videos WHERE product_id = $1 AND is_active = true ORDER BY display_order ASC, created_at ASC`,
      [id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const upsertProductVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { video_id, title, youtube_url, video_url, thumbnail_url, duration, display_order } = req.body;
    if (!title) return error(res, 'title is required', 400);

    if (video_id) {
      await query(
        `UPDATE product_videos SET title = $1, youtube_url = COALESCE($2, youtube_url), video_url = COALESCE($3, video_url),
         thumbnail_url = COALESCE($4, thumbnail_url), duration = COALESCE($5, duration), display_order = COALESCE($6, display_order)
         WHERE id = $7 AND product_id = $8`,
        [title, youtube_url, video_url, thumbnail_url, duration, display_order, video_id, id]
      );
      await logAction(req, 'UPDATE_PRODUCT_VIDEO', id, { video_id, title });
      return success(res, {}, 'Video updated');
    }

    const { rows: [video] } = await query(
      `INSERT INTO product_videos (product_id, title, youtube_url, video_url, thumbnail_url, duration, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [id, title, youtube_url || null, video_url || null, thumbnail_url || null, duration || null, display_order || 0]
    );
    await logAction(req, 'CREATE_PRODUCT_VIDEO', id, { video_id: video.id, title });
    return created(res, { id: video.id }, 'Video added');
  } catch (err) {
    next(err);
  }
};

const deleteProductVideo = async (req, res, next) => {
  try {
    const { id, videoId } = req.params;
    const { rowCount } = await query(`DELETE FROM product_videos WHERE id = $1 AND product_id = $2`, [videoId, id]);
    if (rowCount === 0) return notFound(res, 'Video not found');
    await logAction(req, 'DELETE_PRODUCT_VIDEO', id, { video_id: videoId });
    return success(res, {}, 'Video deleted');
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// Documents / Brochures
// ═══════════════════════════════════════════════════════════════════

const getProductDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT * FROM product_documents WHERE product_id = $1 AND is_active = true ORDER BY display_order ASC, created_at ASC`,
      [id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const uploadProductDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, document_type, file_url, display_order } = req.body;
    let finalUrl = file_url;

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (isS3Configured) {
        const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'product-documents');
        finalUrl = url;
      }
    }

    if (!title || !finalUrl) return error(res, 'title and file_url (or uploaded file) are required', 400);

    const { rows: [doc] } = await query(
      `INSERT INTO product_documents (product_id, title, document_type, file_url, file_size, display_order, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [id, title, document_type || 'brochure', finalUrl, req.file?.size || null, display_order || 0, req.user?.id || null]
    );
    await logAction(req, 'UPLOAD_PRODUCT_DOCUMENT', id, { doc_id: doc.id, title, document_type });
    return created(res, { id: doc.id }, 'Document uploaded');
  } catch (err) {
    next(err);
  }
};

const deleteProductDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const { rowCount } = await query(`DELETE FROM product_documents WHERE id = $1 AND product_id = $2`, [docId, id]);
    if (rowCount === 0) return notFound(res, 'Document not found');
    await logAction(req, 'DELETE_PRODUCT_DOCUMENT', id, { doc_id: docId });
    return success(res, {}, 'Document deleted');
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// Offers
// ═══════════════════════════════════════════════════════════════════

const getProductOffers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { include_expired } = req.query;
    let condition = `WHERE product_id = $1`;
    if (!include_expired || include_expired !== 'true') {
      condition += ` AND is_active = true AND NOW() BETWEEN start_date AND end_date`;
    }
    const { rows } = await query(
      `SELECT * FROM product_offers ${condition} ORDER BY start_date DESC`,
      [id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const upsertProductOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { offer_id, title, description, offer_type, discount_value, start_date, end_date, badge_text, banner_url, is_active } = req.body;
    if (!title || !end_date) return error(res, 'title and end_date are required', 400);

    if (offer_id) {
      await query(`
        UPDATE product_offers SET
          title = COALESCE($1, title), description = COALESCE($2, description),
          offer_type = COALESCE($3, offer_type), discount_value = COALESCE($4, discount_value),
          start_date = COALESCE($5, start_date), end_date = COALESCE($6, end_date),
          badge_text = COALESCE($7, badge_text), banner_url = COALESCE($8, banner_url),
          is_active = COALESCE($9, is_active), updated_at = NOW()
        WHERE id = $10 AND product_id = $11
      `, [title, description, offer_type, discount_value, start_date, end_date, badge_text, banner_url, is_active, offer_id, id]);
      await logAction(req, 'UPDATE_PRODUCT_OFFER', id, { offer_id, title });
      return success(res, {}, 'Offer updated');
    }

    const { rows: [offer] } = await query(`
      INSERT INTO product_offers (product_id, title, description, offer_type, discount_value, start_date, end_date, badge_text, banner_url, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `, [id, title, description || null, offer_type || 'discount', discount_value || 0, start_date || new Date(), end_date, badge_text || null, banner_url || null, is_active !== false, req.user?.id || null]);
    await logAction(req, 'CREATE_PRODUCT_OFFER', id, { offer_id: offer.id, title });
    return created(res, { id: offer.id }, 'Offer created');
  } catch (err) {
    next(err);
  }
};

const deleteProductOffer = async (req, res, next) => {
  try {
    const { id, offerId } = req.params;
    const { rowCount } = await query(`DELETE FROM product_offers WHERE id = $1 AND product_id = $2`, [offerId, id]);
    if (rowCount === 0) return notFound(res, 'Offer not found');
    await logAction(req, 'DELETE_PRODUCT_OFFER', id, { offer_id: offerId });
    return success(res, {}, 'Offer deleted');
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// Ratings
// ═══════════════════════════════════════════════════════════════════

const getProductRatings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [statsRes, ratingsRes] = await Promise.all([
      query(`SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews FROM product_ratings WHERE product_id = $1`, [id]),
      query(`
        SELECT pr.*, pp.first_name, pp.last_name, pp.partner_code
        FROM product_ratings pr
        JOIN partner_profiles pp ON pp.id = pr.partner_id
        WHERE pr.product_id = $1
        ORDER BY pr.created_at DESC
        LIMIT 20
      `, [id])
    ]);

    return success(res, {
      avg_rating: parseFloat(statsRes.rows[0].avg_rating).toFixed(1),
      total_reviews: parseInt(statsRes.rows[0].total_reviews),
      reviews: ratingsRes.rows
    });
  } catch (err) {
    next(err);
  }
};

const submitProductRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const partnerId = req.partner?.id;

    if (!partnerId) return error(res, 'Partner profile not found', 403);
    if (!rating || rating < 1 || rating > 5) return error(res, 'Rating must be between 1 and 5', 400);

    await query(`
      INSERT INTO product_ratings (product_id, partner_id, rating, feedback)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, partner_id) DO UPDATE SET rating = $3, feedback = COALESCE($4, product_ratings.feedback), created_at = NOW()
    `, [id, partnerId, rating, feedback || null]);

    return created(res, {}, 'Rating submitted');
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// Product Analytics
// ═══════════════════════════════════════════════════════════════════

const getProductAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days } = req.query;
    const dayLimit = parseInt(days) || 30;

    const [views, shares, ratings, bookmarks, applications] = await Promise.all([
      query(`SELECT COUNT(*) as total_views, COUNT(DISTINCT partner_id) as unique_viewers 
             FROM product_views WHERE product_id = $1 AND viewed_at >= NOW() - INTERVAL '1 day' * $2`, [id, dayLimit]),
      query(`SELECT COUNT(*) as total_shares FROM product_share_logs WHERE product_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2`, [id, dayLimit]),
      query(`SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews FROM product_ratings WHERE product_id = $1`, [id]),
      query(`SELECT COUNT(*) as total_bookmarks FROM partner_saved_products WHERE product_id = $1`, [id]),
      query(`SELECT COUNT(*) as total_applications, 
             COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
             COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
             FROM applications WHERE product_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2`, [id, dayLimit])
    ]);

    return success(res, {
      period_days: dayLimit,
      views: {
        total: parseInt(views.rows[0].total_views),
        unique_viewers: parseInt(views.rows[0].unique_viewers)
      },
      shares: parseInt(shares.rows[0].total_shares),
      ratings: {
        avg_rating: parseFloat(ratings.rows[0].avg_rating).toFixed(1),
        total_reviews: parseInt(ratings.rows[0].total_reviews)
      },
      bookmarks: parseInt(bookmarks.rows[0].total_bookmarks),
      applications: {
        total: parseInt(applications.rows[0].total_applications),
        approved: parseInt(applications.rows[0].approved),
        rejected: parseInt(applications.rows[0].rejected),
        conversion_rate: applications.rows[0].total_applications > 0
          ? ((applications.rows[0].approved / applications.rows[0].total_applications) * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProductFaqs, upsertProductFaq, deleteProductFaq,
  getProductVideos, upsertProductVideo, deleteProductVideo,
  getProductDocuments, uploadProductDocument, deleteProductDocument,
  getProductOffers, upsertProductOffer, deleteProductOffer,
  getProductRatings, submitProductRating,
  getProductAnalytics
};
