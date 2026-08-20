const { query, getClient } = require('../../config/database');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3 } = require('../../services/aws/s3.service.js');
const logger = require('../../config/logger');

const {
  logCustomerTimeline,
  logCustomerActivity,
  getCustomerDashboardMetrics,
  checkDuplicateCustomer,
  get360CustomerProfile,
  mergeCustomers
} = require('./customer.service');

/**
 * 360 Customer Profile Controller
 */

// GET /customers — List customers as CRM Cards or Table with filters
const listCustomers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, tag, search, partner_id, from_date, to_date, is_archived } = req.query;

    let whereClause = 'WHERE c.is_merged = false';
    const values = [];
    let idx = 1;

    if (is_archived === 'true') {
      whereClause += ` AND c.is_archived = true`;
    } else {
      whereClause += ` AND c.is_archived = false`;
    }

    if (req.user.role === 'PARTNER') {
      const partnerId = req.partner?.id;
      whereClause += ` AND (c.created_by = $${idx} OR c.id IN (SELECT customer_id FROM applications WHERE partner_id = $${idx + 1}) OR c.id IN (SELECT customer_id FROM leads WHERE partner_id = $${idx + 1}))`;
      values.push(req.user.id, partnerId);
      idx += 2;
    } else if (partner_id) {
      whereClause += ` AND c.created_by IN (SELECT user_id FROM partner_profiles WHERE id = $${idx})`;
      values.push(partner_id);
      idx++;
    }

    if (status) {
      whereClause += ` AND c.pipeline_status = $${idx++}`;
      values.push(status);
    }

    if (tag && tag !== 'All') {
      whereClause += ` AND c.id IN (SELECT customer_id FROM customer_tags WHERE tag_name = $${idx++})`;
      values.push(tag);
    }

    if (search) {
      whereClause += ` AND (c.full_name ILIKE $${idx} OR c.mobile ILIKE $${idx} OR c.email ILIKE $${idx} OR c.pan_number ILIKE $${idx} OR c.city ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    if (from_date) {
      whereClause += ` AND c.created_at >= $${idx++}`;
      values.push(from_date);
    }
    if (to_date) {
      whereClause += ` AND c.created_at <= $${idx++}`;
      values.push(to_date + ' 23:59:59');
    }

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(DISTINCT c.id) FROM customers c ${whereClause}`, values),
      query(`
        SELECT c.*,
               CASE
                 WHEN (SELECT COUNT(*) FROM applications WHERE customer_id = c.id AND LOWER(status::text) IN ('approved', 'disbursed', 'confirmed', 'super_admin_approved', 'commission_processing', 'commission_released')) > 0 THEN 'approved'
                 WHEN (SELECT COUNT(*) FROM applications WHERE customer_id = c.id AND LOWER(status::text) IN ('bank_verification', 'under_review', 'operational_verified')) > 0 THEN 'bank_verification'
                 WHEN (SELECT COUNT(*) FROM applications WHERE customer_id = c.id AND LOWER(status::text) IN ('submitted', 'details_submitted', 'lead_created', 'in_progress')) > 0 THEN 'application_submitted'
                 WHEN (SELECT COUNT(*) FROM applications WHERE customer_id = c.id AND LOWER(status::text) IN ('correction_required', 'documents_pending')) > 0 THEN 'documents_pending'
                 WHEN (SELECT COUNT(*) FROM applications WHERE customer_id = c.id) > 0 AND (SELECT COUNT(*) FROM applications WHERE customer_id = c.id AND LOWER(status::text) != 'rejected') = 0 THEN 'rejected'
                 WHEN (SELECT COUNT(*) FROM applications WHERE customer_id = c.id) > 0 THEN 'interested'
                 ELSE COALESCE(NULLIF(c.pipeline_status, ''), 'new')
               END AS pipeline_status,
               u.full_name as created_by_name, u.role as created_by_role,
               p.partner_code, p.first_name as partner_first_name, p.last_name as partner_last_name,
               (SELECT json_agg(json_build_object('name', tag_name, 'color', tag_color)) FROM customer_tags WHERE customer_id = c.id) as tags,
               (SELECT COUNT(*)::int FROM applications WHERE customer_id = c.id) as applications_count,
               (SELECT status FROM applications WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_app_status,
               (SELECT created_at FROM customer_timeline WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as last_activity_at
        FROM customers c
        LEFT JOIN users u ON u.id = c.created_by
        LEFT JOIN partner_profiles p ON p.user_id = c.created_by
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].count);
    return paginate(res, dataRes.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /customers/dashboard/metrics — CRM Summary Dashboard Metrics
const getDashboardMetrics = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || null;
    const metrics = await getCustomerDashboardMetrics(partnerId, req.user?.id);
    return success(res, metrics, 'Customer CRM Dashboard metrics loaded successfully');
  } catch (err) {
    next(err);
  }
};

// POST /customers — Add Customer with Duplicate Detection
const createCustomer = async (req, res, next) => {
  try {
    const {
      full_name, mobile, email, dob, pan_number, aadhaar_last4,
      city, state, pincode, monthly_income, employer, employment_type,
      alternate_mobile, occupation, nominee_name, nominee_relation, product_interests, tags
    } = req.body;

    if (!full_name || !mobile) {
      return error(res, 'Full Name and Mobile number are required', 400);
    }

    const trimmedMobile = String(mobile).trim();
    const trimmedName = String(full_name).trim();

    // Check duplicates
    const duplicates = await checkDuplicateCustomer(trimmedMobile, email, pan_number);
    if (duplicates.length > 0 && req.body.force_create !== true) {
      return res.status(409).json({
        success: false,
        is_duplicate: true,
        message: `⚠️ Customer Already Exists (${duplicates[0].full_name} - ${duplicates[0].mobile})`,
        duplicate_records: duplicates
      });
    }

    const { rows: [customer] } = await query(`
      INSERT INTO customers (
        full_name, mobile, email, dob, pan_number, aadhaar_last4,
        city, state, pincode, monthly_income, employer, employment_type,
        alternate_mobile, occupation, nominee_name, nominee_relation, product_interests,
        pipeline_status, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,'new',$18)
      RETURNING *
    `, [
      trimmedName, trimmedMobile, email || null, dob || null, pan_number ? pan_number.toUpperCase() : null, aadhaar_last4 || null,
      city || null, state || null, pincode || null, monthly_income || null, employer || null, employment_type || 'salaried',
      alternate_mobile || null, occupation || null, nominee_name || null, nominee_relation || null,
      JSON.stringify(product_interests || []), req.user.id
    ]);

    // Initial Timeline Event
    await logCustomerTimeline(null, customer.id, 'customer_added', 'Customer Profile Created', `Customer ${customer.full_name} created in system`, 'customer', customer.id, req.user.id);
    await logCustomerActivity(null, customer.id, 'create_profile', req.user.id, 'customer', customer.id, req);

    // Attach tags if provided
    if (Array.isArray(tags) && tags.length > 0) {
      for (const t of tags) {
        await query(`INSERT INTO customer_tags (customer_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [customer.id, t]);
      }
    }

    return created(res, customer, 'Customer profile created successfully');
  } catch (err) {
    next(err);
  }
};

// GET /customers/:id — 360 Degree Customer Profile
const getCustomerProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return error(res, 'Customer ID is required', 400);

    const profile = await get360CustomerProfile(id, req.user?.id);
    if (!profile) return notFound(res, 'Customer profile not found');

    try {
      await logCustomerActivity(null, id, 'view_360_profile', req.user?.id, 'customer', id, req);
    } catch (logErr) {
      logger.warn(`Activity logging failed for customer ${id}:`, logErr.message);
    }

    return success(res, profile, 'Customer 360 profile loaded');
  } catch (err) {
    logger.error(`Failed to fetch 360 profile for customer ${req.params.id}:`, err);
    next(err);
  }
};

// PUT /customers/:id — Edit Customer Profile
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name, mobile, email, dob, pan_number, aadhaar_number, aadhaar_last4,
      city, state, pincode, monthly_income, employer, employment_type,
      alternate_mobile, occupation, nominee_name, nominee_relation, product_interests, pipeline_status
    } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Customer not found');

    const cleanAadhaar = aadhaar_number ? aadhaar_number.toString().replace(/\D/g, '') : null;
    const cleanLast4 = cleanAadhaar && cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : (aadhaar_last4 || null);

    try {
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20)`);
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(15)`);
    } catch (_) {}

    const { rows: [updated] } = await query(`
      UPDATE customers SET
        full_name = COALESCE($1, full_name),
        mobile = COALESCE($2, mobile),
        email = COALESCE($3, email),
        dob = COALESCE($4, dob),
        pan_number = COALESCE($5, pan_number),
        aadhaar_number = COALESCE($6, aadhaar_number),
        aadhaar_last4 = COALESCE($7, aadhaar_last4),
        city = COALESCE($8, city),
        state = COALESCE($9, state),
        pincode = COALESCE($10, pincode),
        monthly_income = COALESCE($11, monthly_income),
        employer = COALESCE($12, employer),
        employment_type = COALESCE($13, employment_type),
        alternate_mobile = COALESCE($14, alternate_mobile),
        occupation = COALESCE($15, occupation),
        nominee_name = COALESCE($16, nominee_name),
        nominee_relation = COALESCE($17, nominee_relation),
        product_interests = COALESCE($18::jsonb, product_interests),
        pipeline_status = COALESCE($19, pipeline_status),
        updated_at = NOW()
      WHERE id = $20
      RETURNING *
    `, [
      full_name || null, mobile || null, email || null, dob || null, pan_number ? pan_number.toUpperCase() : null,
      cleanAadhaar, cleanLast4, city || null, state || null, pincode || null,
      monthly_income || null, employer || null, employment_type || null, alternate_mobile || null,
      occupation || null, nominee_name || null, nominee_relation || null,
      product_interests ? JSON.stringify(product_interests) : null, pipeline_status || null, id
    ]);

    await logCustomerTimeline(null, id, 'profile_updated', 'Profile Updated', `Updated profile fields by ${req.user?.full_name || req.user?.email || 'User'}`, 'customer', id, req.user?.id);
    await logCustomerActivity(null, id, 'update_profile', req.user?.id, 'customer', id, req);

    return success(res, updated, 'Customer profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /customers/:id/status — Pipeline status update
const updatePipelineStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) return error(res, 'Pipeline status is required', 400);

    const { rows: [updated] } = await query(`
      UPDATE customers 
      SET pipeline_status = $1, status_reason = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, reason || null, id]);

    if (!updated) return notFound(res, 'Customer not found');

    await logCustomerTimeline(null, id, 'status_changed', `Status: ${status.replace('_', ' ').toUpperCase()}`, `Pipeline state updated to ${status}${reason ? `: ${reason}` : ''}`, 'customer', id, req.user.id);
    await logCustomerActivity(null, id, 'status_change', req.user.id, 'customer', id, req);

    return success(res, updated, `Customer pipeline status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

// DELETE /customers/:id — Soft delete / Archiving
const archiveCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [updated] } = await query(`
      UPDATE customers 
      SET is_archived = true, archived_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (!updated) return notFound(res, 'Customer not found');

    await logCustomerActivity(null, id, 'archive_customer', req.user.id, 'customer', id, req);
    return success(res, {}, 'Customer archived successfully');
  } catch (err) {
    next(err);
  }
};

// POST /customers/merge — Merge duplicate customers
const processMergeCustomers = async (req, res, next) => {
  try {
    const { primary_id, duplicate_id } = req.body;
    if (!primary_id || !duplicate_id) return error(res, 'Primary customer ID and Duplicate customer ID are required', 400);

    await mergeCustomers(primary_id, duplicate_id, req.user.id);
    return success(res, {}, 'Customer records merged successfully');
  } catch (err) {
    next(err);
  }
};

// ── Sub-Resource APIs ────────────────────────────────────────────────

// Notes
const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, visibility, is_pinned } = req.body;
    if (!note) return error(res, 'Note text is required', 400);

    const partnerId = req.partner?.id || null;
    const { rows: [newNote] } = await query(`
      INSERT INTO customer_notes (customer_id, partner_id, user_id, note, visibility, is_pinned)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, partnerId, req.user.id, note, visibility || 'public', Boolean(is_pinned)]);

    await logCustomerTimeline(null, id, 'note_added', 'Note Added', note.substring(0, 100), 'note', newNote.id, req.user.id);
    return created(res, newNote, 'Note added successfully');
  } catch (err) {
    next(err);
  }
};

// Follow-ups
const addFollowup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { followup_date, priority, remarks } = req.body;
    if (!followup_date) return error(res, 'Follow-up date is required', 400);

    const partnerId = req.partner?.id || null;
    const { rows: [f] } = await query(`
      INSERT INTO customer_followups (customer_id, partner_id, user_id, followup_date, priority, status, remarks)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING *
    `, [id, partnerId, req.user.id, followup_date, priority || 'medium', remarks || '']);

    await logCustomerTimeline(null, id, 'followup_scheduled', 'Follow-up Scheduled', `Followup set for ${new Date(followup_date).toLocaleString()}`, 'followup', f.id, req.user.id);
    return created(res, f, 'Follow-up scheduled successfully');
  } catch (err) {
    next(err);
  }
};

// Communications: Log Call / WhatsApp / SMS
const logCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, message, status } = req.body;
    if (!type || !message) return error(res, 'Communication type and message are required', 400);

    const { rows: [comm] } = await query(`
      INSERT INTO customer_communications (customer_id, type, message, status, sent_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, type, message, status || 'sent', req.user.id]);

    await logCustomerTimeline(null, id, 'communication_sent', `${type} Recorded`, message.substring(0, 120), 'communication', comm.id, req.user.id);
    return created(res, comm, `${type} logged successfully`);
  } catch (err) {
    next(err);
  }
};

// Partner Direct Document Upload
const uploadCustomerDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_type } = req.body;

    if (!document_type) return error(res, 'document_type is required', 400);
    if (!req.file) return error(res, 'No document file uploaded', 400);

    const { rows: [customer] } = await query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if (!customer) return notFound(res, 'Customer not found');

    let fileUrl = '';
    try {
      const s3Res = await uploadToS3(req.file.buffer, req.file.originalname, 'customer-documents');
      fileUrl = s3Res.url;
    } catch (uploadErr) {
      logger.warn('S3 upload fallback to local path:', uploadErr.message);
      const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      fileUrl = `/uploads/documents/${Date.now()}_${cleanName}`;
    }

    const docTypeLabel = document_type.toLowerCase();
    const { rows: [doc] } = await query(`
      INSERT INTO customer_documents (customer_id, document_type, file_url, status, uploaded_at)
      VALUES ($1, $2, $3, 'verified', NOW())
      RETURNING *
    `, [id, docTypeLabel, fileUrl]);

    await logCustomerTimeline(null, id, 'document_uploaded', `${docTypeLabel.toUpperCase()} Uploaded`, `Document ${docTypeLabel} uploaded by partner`, 'document', doc.id, req.user?.id);
    await logCustomerActivity(null, id, 'upload_document', req.user?.id, 'customer', id, req);

    return created(res, doc, 'Customer document uploaded successfully');
  } catch (err) {
    next(err);
  }
};

// Delete Customer Document
const deleteCustomerDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const { rows: [existing] } = await query(`SELECT * FROM customer_documents WHERE id = $1 AND customer_id = $2`, [docId, id]);
    if (!existing) return notFound(res, 'Document not found');

    await query(`DELETE FROM customer_documents WHERE id = $1`, [docId]);
    await logCustomerTimeline(null, id, 'document_deleted', 'Document Removed', `Deleted document ${existing.document_type}`, 'document', docId, req.user?.id);

    return success(res, {}, 'Document deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Generate Customer Document Upload Share Link
const generateShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [customer] } = await query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if (!customer) return notFound(res, 'Customer not found');

    // Ensure application_id can be NULL in customer_access_tokens
    await query(`ALTER TABLE customer_access_tokens ALTER COLUMN application_id DROP NOT NULL;`).catch(() => {});

    const { rows: existingTokens } = await query(
      `SELECT * FROM customer_access_tokens WHERE customer_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    let token = '';
    let expiresAt = '';

    if (existingTokens.length > 0) {
      token = existingTokens[0].token;
      expiresAt = existingTokens[0].expires_at;
    } else {
      const { v4: uuidv4 } = require('uuid');
      token = `c_${uuidv4().replace(/-/g, '')}`;
      const { rows: [newToken] } = await query(
        `INSERT INTO customer_access_tokens (customer_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')
         RETURNING *`,
        [id, token]
      );
      expiresAt = newToken.expires_at;
    }

    const host = req.get('host') || 'gharkapaisa.in';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    const uploadUrl = `${baseUrl.replace(/\/$/, '')}/customer-upload/${token}`;

    const customerName = customer.full_name || 'Customer';
    const whatsappMessage = `Hello ${customerName}, please click this secure link to update your details and upload your required documents for GharKaPaisa: ${uploadUrl}`;
    const cleanMobile = String(customer.mobile || '').replace(/[^0-9]/g, '');
    const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const whatsappLink = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(whatsappMessage)}`;

    return success(res, {
      token,
      upload_url: uploadUrl,
      whatsapp_message: whatsappMessage,
      whatsapp_link: whatsappLink,
      expires_at: expiresAt
    }, 'Share link generated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCustomers,
  getDashboardMetrics,
  createCustomer,
  getCustomerProfile,
  updateCustomer,
  updatePipelineStatus,
  archiveCustomer,
  processMergeCustomers,
  addNote,
  addFollowup,
  logCommunication,
  uploadCustomerDocument,
  deleteCustomerDocument,
  generateShareLink
};
