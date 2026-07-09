const { query, getClient } = require('../../config/database');
const { uploadToS3, getSignedDownloadUrl } = require('../../services/aws/s3.service.js');
const { ensureWallet } = require('../wallet/service.js');
const { notify } = require('../notifications/service.js');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const logger = require('../../config/logger');

// GET /Partners/:PartnerId/profile (Partner profile)
const getProfile = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    const { rows: [Partner] } = await query(`
      SELECT ap.*, u.email, u.mobile, u.status as account_status, u.last_login,
        abd.bank_name, abd.account_number, abd.ifsc_code, abd.account_holder_name, abd.is_verified as bank_verified
      FROM partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN partner_bank_details abd ON abd.partner_id = ap.id
      WHERE ap.id::text = $1
    `, [PartnerId]);
    if (!Partner) return notFound(res);

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const isSuperAdmin = req.user && req.user.role === 'SUPER_ADMIN';
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const shouldMask = (isAdmin && isPrivacyOn) || (!isSuperAdmin && !isAdmin);

    // Decrypt bank account number
    if (Partner && Partner.account_number) {
      const { decrypt } = require('../../utils/helpers/crypto');
      try {
        const decrypted = decrypt(Partner.account_number);
        if (shouldMask) {
          Partner.account_number = 'HIDDEN';
        } else {
          Partner.account_number = decrypted;
        }
      } catch (err) {
        logger.error('Failed to decrypt bank account number:', err.message);
      }
    }

    if (shouldMask) {
      Partner.first_name = 'Partner';
      Partner.last_name = Partner.partner_code;
      Partner.email = 'masked@gharkapaisa.in';
      Partner.mobile = '**********';
      Partner.current_address = 'HIDDEN';
      Partner.business_location = 'HIDDEN';
      Partner.company_name = 'HIDDEN';
      Partner.gst_number = 'HIDDEN';
      Partner.pincode = 'HIDDEN';
      Partner.bank_name = 'HIDDEN';
      Partner.account_number = 'HIDDEN';
      Partner.ifsc_code = 'HIDDEN';
      Partner.account_holder_name = 'HIDDEN';
    }

    const { rows: kyc } = await query(
      `SELECT id, doc_type, doc_number, file_url, s3_key, verified, verification_status, uploaded_at FROM kyc_documents WHERE partner_id = $1`, [PartnerId]
    );

    const { rows: [video] } = await query(
      `SELECT id, video_url, video_duration, video_size, storage_key, uploaded_at, verification_status FROM partner_videos WHERE partner_id = $1`, [PartnerId]
    );

    const processedKyc = shouldMask ? [] : kyc;
    const processedVideo = shouldMask ? null : video;

    return success(res, { ...Partner, kyc_documents: processedKyc, partner_video: processedVideo });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};

// PUT /Partners/:PartnerId/profile (Update partner profile)
const updateProfile = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    const { first_name, last_name, current_address, business_location, company_name, company_type, gst_number, pincode } = req.body;
    await query(`
      UPDATE partner_profiles SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        current_address = COALESCE($3, current_address),
        business_location = COALESCE($4, business_location),
        company_name = COALESCE($5, company_name),
        company_type = COALESCE($6, company_type),
        gst_number = COALESCE($7, gst_number),
        pincode = COALESCE($8, pincode),
        updated_at = NOW()
      WHERE id = $9
    `, [first_name, last_name, current_address, business_location, company_name, company_type, gst_number, pincode, PartnerId]);
    return success(res, {}, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// POST /Partners/:PartnerId/kyc-documents — Partner KYC (multer fields: aadhaar, pan, gst_cert, cancelled_cheque)
const uploadKYCDocuments = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    const { aadhaar_number, pan_number } = req.body;
    const files = req.files;

    // S3 configuration check
    const isS3Configured = !!process.env.AWS_S3_BUCKET;
    if (!isS3Configured) {
      return error(res, 'S3 bucket is not configured.', 503);
    }

    const uploaded = [];

    const docMap = {
      aadhaar: { number: aadhaar_number, label: 'Aadhaar' },
      pan: { number: pan_number, label: 'PAN' },
      gst_cert: { number: null, label: 'GST Certificate' },
      cancelled_cheque: { number: null, label: 'Cancelled Cheque' },
    };

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    // Validate size and types before starting any upload
    for (const [field, meta] of Object.entries(docMap)) {
      if (files && files[field] && files[field][0]) {
        const file = files[field][0];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return error(res, `Invalid file type for ${meta.label}. Only PDF, PNG, and JPEG are allowed.`, 400);
        }
        if (file.size > maxFileSize) {
          return error(res, `File size too large for ${meta.label}. Maximum size is 5MB.`, 400);
        }
      }
    }

    for (const [field, meta] of Object.entries(docMap)) {
      if (files && files[field] && files[field][0]) {
        const file = files[field][0];
        const { url, key } = await uploadToS3(file.buffer, file.originalname, `kyc/${PartnerId}`);
        await query(`
          INSERT INTO kyc_documents (partner_id, doc_type, doc_number, file_url, s3_key)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (partner_id, doc_type) DO UPDATE SET
            doc_number = EXCLUDED.doc_number,
            file_url = EXCLUDED.file_url,
            s3_key = EXCLUDED.s3_key,
            verified = false,
            uploaded_at = NOW()
        `, [PartnerId, field, meta.number || null, url, key]);
        uploaded.push(field);
      }
    }

    // Update KYC status to under_review
    await query(`UPDATE partner_profiles SET kyc_status = 'under_review' WHERE id = $1`, [PartnerId]);

    return success(res, { uploaded }, `${uploaded.length} document(s) uploaded. KYC under review.`);
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;

    const [appStats, wallet, recentApps, leadStats, topProducts] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'approved' OR status = 'disbursed') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status IN ('submitted','under_review')) as pending
        FROM applications WHERE partner_id = $1
      `, [PartnerId]),
      query(`SELECT * FROM wallets WHERE partner_id = $1`, [PartnerId]),
      query(`
        SELECT a.app_number, a.status, a.commission_amount, a.created_at,
          c.full_name as customer_name,
          p.name as product_name, b.short_code as bank_code
        FROM applications a
        JOIN customers c ON c.id = a.customer_id
        JOIN products p ON p.id = a.product_id
        JOIN banks b ON b.id = p.bank_id
        WHERE a.partner_id = $1
        ORDER BY a.created_at DESC LIMIT 5
      `, [PartnerId]),
      query(`
        SELECT
          COUNT(*) as total_leads,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_leads,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leads,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_leads
        FROM leads WHERE partner_id = $1
      `, [PartnerId]),
      query(`
        SELECT p.id, p.name, p.image_url, b.short_code as bank_code, COUNT(l.id) as sales_count
        FROM products p
        JOIN banks b ON b.id = p.bank_id
        LEFT JOIN leads l ON l.product_id = p.id AND l.partner_id = $1 AND l.status IN ('approved', 'confirmed')
        GROUP BY p.id, p.name, p.image_url, b.short_code
        ORDER BY sales_count DESC
        LIMIT 5
      `, [PartnerId])
    ]);

    const walletData = wallet.rows[0] ? {
      ...wallet.rows[0],
      pending_amount: wallet.rows[0].hold_balance
    } : { total_earned: 0, available_balance: 0, hold_balance: 0, pending_amount: 0, total_withdrawn: 0 };

    return success(res, {
      applications: appStats.rows[0],
      wallet: walletData,
      recent_applications: recentApps.rows,
      leads: leadStats.rows[0] || { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 },
      top_products: topProducts.rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /Partners (Admin — list all partners)
const listPartners = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, kyc_status, search, kyc_filter } = req.query;

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (status) { where += ` AND u.status = $${idx++}`; values.push(status); }
    if (kyc_status) {
      where += ` AND ap.kyc_status = $${idx++}`;
      values.push(kyc_status);
    }
    if (kyc_filter === 'new') {
      where += ` AND (ap.kyc_status IS NULL OR ap.kyc_status NOT IN ('approved', 'rejected'))`;
    } else if (kyc_filter === 'old') {
      where += ` AND ap.kyc_status IN ('approved', 'rejected')`;
    }
    if (search) {
      if (shouldMask) {
        where += ` AND ap.partner_code ILIKE $${idx}`;
      } else {
        where += ` AND (ap.first_name ILIKE $${idx} OR ap.last_name ILIKE $${idx} OR u.mobile ILIKE $${idx} OR ap.partner_code ILIKE $${idx})`;
      }
      values.push(`%${search}%`); idx++;
    }

    let hasParentCol = true;
    try {
      await query(`SELECT parent_partner_id FROM partner_profiles LIMIT 1`);
    } catch(e) {
      hasParentCol = false;
    }

    const countQuery = `SELECT COUNT(*) FROM partner_profiles ap JOIN users u ON u.id = ap.user_id ${where}`;
    
    let selectFields = `ap.id, ap.partner_code, ap.first_name, ap.last_name, ap.kyc_status, ap.company_name, u.email, u.mobile, u.status, u.created_at`;
    let joinClause = ``;
    if (hasParentCol) {
      selectFields += `, ap.parent_partner_id, pap.partner_code as parent_code`;
      joinClause = `LEFT JOIN partner_profiles pap ON pap.id = ap.parent_partner_id`;
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM partner_profiles ap JOIN users u ON u.id = ap.user_id
      ${joinClause}
      ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [count, data] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    const processedRows = data.rows.map(row => {
      if (shouldMask) {
        return {
          ...row,
          first_name: 'Partner',
          last_name: row.partner_code,
          company_name: 'HIDDEN',
          email: 'masked@gharkapaisa.in',
          mobile: '**********'
        };
      }
      return row;
    });

    return paginate(res, processedRows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// PATCH /Partners/:PartnerId/approve (Admin — approve partner)
const approvePartner = async (req, res, next) => {
  const client = await getClient();
  try {
    const { PartnerId } = req.params;
    const { approved, rejection_reason } = req.body;

    const { rows: [Partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [PartnerId]);
    if (!Partner) return notFound(res, 'Partner not found');

    await client.query('BEGIN');

    if (approved) {
      await client.query(`
        UPDATE partner_profiles SET kyc_status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2
      `, [req.user.id, PartnerId]);
      await client.query(`UPDATE users SET status = 'active' WHERE id = $1`, [Partner.user_id]);
      await client.query(`
        INSERT INTO wallets (partner_id) VALUES ($1)
        ON CONFLICT (partner_id) DO NOTHING
      `, [PartnerId]);
      await client.query('COMMIT');
      await logAction(req, 'APPROVE_KYC', PartnerId, { userId: Partner.user_id });
      await notify.kycApproved(Partner.user_id);
    } else {
      await client.query(`
        UPDATE partner_profiles SET kyc_status = 'rejected', rejection_reason = $1 WHERE id = $2
      `, [rejection_reason, PartnerId]);
      await client.query(`UPDATE users SET status = 'rejected' WHERE id = $1`, [Partner.user_id]);
      await client.query('COMMIT');
      await logAction(req, 'REJECT_KYC', PartnerId, { userId: Partner.user_id, rejection_reason });
      await notify.kycRejected(Partner.user_id, rejection_reason);
    }

    return success(res, {}, `Partner ${approved ? 'approved' : 'rejected'} successfully`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /partner/profile (Self profile)
const getSelfProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Find the partner profile associated with the user
    const { rows: [Partner] } = await query(`
      SELECT ap.*, u.email, u.mobile, u.status as account_status, u.last_login,
        abd.bank_name, abd.account_number, abd.ifsc_code, abd.account_holder_name, abd.is_verified as bank_verified
      FROM partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN partner_bank_details abd ON abd.partner_id = ap.id
      WHERE ap.user_id = $1
    `, [userId]);
    if (!Partner) return notFound(res, 'Partner profile not found');

    // Mask bank account number
    if (Partner && Partner.account_number) {
      const { decrypt } = require('../../utils/helpers/crypto');
      const decrypted = decrypt(Partner.account_number);
      const accLen = decrypted.length;
      if (accLen > 4) {
        Partner.account_number = '*'.repeat(accLen - 4) + decrypted.slice(-4);
      } else {
        Partner.account_number = '*'.repeat(accLen);
      }
    }

    const { rows: kyc } = await query(
      `SELECT id, doc_type, doc_number, file_url, s3_key, verified, uploaded_at FROM kyc_documents WHERE partner_id = $1`, [Partner.id]
    );

    return success(res, { ...Partner, kyc_documents: kyc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
};

// POST /partner/upload-docs (Self upload KYC)
const uploadSelfKYC = async (req, res, next) => {
  try {
    if (!req.partner) {
      return error(res, 'Partner profile not found. Please complete registration first.', 404);
    }
    const PartnerId = req.partner.id;
    const { aadhaar_number, pan_number } = req.body;
    const files = req.files;

    // S3 configuration check
    const isS3Configured = !!process.env.AWS_S3_BUCKET;
    if (!isS3Configured) {
      return error(res, 'S3 bucket is not configured.', 503);
    }

    const uploaded = [];

    const docMap = {
      aadhaar: { number: aadhaar_number, label: 'Aadhaar' },
      pan: { number: pan_number, label: 'PAN' },
      gst_cert: { number: null, label: 'GST Certificate' },
      cancelled_cheque: { number: null, label: 'Cancelled Cheque' },
    };

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    // Validate size and types before starting any upload
    for (const [field, meta] of Object.entries(docMap)) {
      if (files && files[field] && files[field][0]) {
        const file = files[field][0];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return error(res, `Invalid file type for ${meta.label}. Only PDF, PNG, and JPEG are allowed.`, 400);
        }
        if (file.size > maxFileSize) {
          return error(res, `File size too large for ${meta.label}. Maximum size is 5MB.`, 400);
        }
      }
    }

    for (const [field, meta] of Object.entries(docMap)) {
      if (files && files[field] && files[field][0]) {
        const file = files[field][0];
        const { url, key } = await uploadToS3(file.buffer, file.originalname, `kyc/${PartnerId}`);
        await query(`
          INSERT INTO kyc_documents (partner_id, doc_type, doc_number, file_url, s3_key)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (partner_id, doc_type) DO UPDATE SET
            doc_number = EXCLUDED.doc_number,
            file_url = EXCLUDED.file_url,
            s3_key = EXCLUDED.s3_key,
            verified = false,
            uploaded_at = NOW()
        `, [PartnerId, field, meta.number || null, url, key]);
        uploaded.push(field);
      }
    }

    // Update KYC status to under_review
    await query(`UPDATE partner_profiles SET kyc_status = 'under_review' WHERE id = $1`, [PartnerId]);

    // Log the KYC upload to audit logs
    await logAction(req, 'UPLOAD_KYC', PartnerId, { uploaded });

    return success(res, { uploaded }, `${uploaded.length} document(s) uploaded. KYC under review.`);
  } catch (err) {
    next(err);
  }
};

// POST /admin/approve-kyc (Admin)
const approvePartnerKYC = async (req, res, next) => {
  try {
    const partnerId = req.body.partnerId || req.params.PartnerId;
    if (!partnerId) {
      return error(res, 'partnerId is required', 400);
    }
    req.params.PartnerId = partnerId;
    return approvePartner(req, res, next);
  } catch (err) {
    next(err);
  }
};

// POST /partner/:PartnerId/team (Create child partner)
const addTeamMember = async (req, res, next) => {
  const client = await getClient();
  try {
    const { PartnerId } = req.params;
    const { first_name, last_name, email, mobile, password } = req.body;

    if (!first_name || !email || !mobile || !password) {
      return error(res, 'First name, email, mobile, and password are required', 400);
    }

    // Check if parent exists and allows team creation
    const { rows: [parentPartner] } = await client.query(`
      SELECT id, allow_team_creation, team_status FROM partner_profiles WHERE id = $1
    `, [PartnerId]);
    if (!parentPartner) return error(res, 'Parent partner not found', 404);
    if (parentPartner.allow_team_creation === false) {
      return error(res, 'Your profile does not allow team creation. Please contact support.', 403);
    }
    if (parentPartner.team_status === 'INACTIVE') {
      return error(res, 'Your team status is currently inactive. You cannot add team members.', 403);
    }

    await client.query('BEGIN');

    // Check if user exists
    const { rows: existingUser } = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2`,
      [email, mobile]
    );

    if (existingUser.length) {
      await client.query('ROLLBACK');
      return error(res, 'User with this email or mobile already exists', 409);
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user (must_change_password = true)
    const { rows: [user] } = await client.query(
      `INSERT INTO users (email, mobile, password_hash, role, status, email_verified, must_change_password)
       VALUES ($1, $2, $3, 'PARTNER', 'active', true, true) RETURNING id`,
      [email, mobile, passwordHash]
    );

    // Generate Partner code
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('partner_code_seq')`);
    const { generatePartnerCode } = require('../../utils/helpers/helpers');
    const partnerCode = generatePartnerCode(parseInt(nextval));

    // Create child partner profile
    const { rows: [childPartner] } = await client.query(`
      INSERT INTO partner_profiles (
        user_id, partner_code, first_name, last_name, parent_partner_id, kyc_status
      )
      VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id
    `, [user.id, partnerCode, first_name, last_name || '', PartnerId]);

    // Create wallet
    await client.query(`INSERT INTO wallets (partner_id) VALUES ($1)`, [childPartner.id]);

    await client.query('COMMIT');
    return created(res, { partner_code: partnerCode }, 'Team member created successfully. They can now log in using their email and password.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /partner/customers — CRM customer list for logged-in partner
const listPartnerCustomers = async (req, res, next) => {
  try {
    if (req.kycUnapproved) {
      return success(res, []);
    }
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { rows } = await query(`
      SELECT
        c.id,
        c.full_name,
        c.mobile,
        c.email,
        c.pan_number,
        c.aadhaar_last4,
        c.city,
        c.state,
        c.employment_type,
        c.monthly_income,
        c.employer,
        MIN(a.created_at) AS first_application_at,
        COUNT(a.id)::int AS application_count,
        json_agg(json_build_object(
          'id', a.id,
          'app_number', a.app_number,
          'status', a.status,
          'product_name', p.name,
          'bank_name', b.name,
          'bank_code', b.short_code,
          'commission_amount', a.commission_amount,
          'created_at', a.created_at
        ) ORDER BY a.created_at DESC) AS applications
      FROM customers c
      JOIN applications a ON a.customer_id = c.id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      WHERE a.partner_id = $1
      GROUP BY c.id
      ORDER BY MAX(a.created_at) DESC
    `, [partnerId]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /partner/training — training academy module catalog
const getTrainingModules = async (req, res, next) => {
  try {
    const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
    const partnerId = partner ? partner.id : null;

    const { rows: dbModules } = await query(`
      SELECT m.*, COALESCE(p.progress, 0) as progress_pct, 
             COALESCE(p.completed, false) as is_completed,
             p.completed_at
      FROM training_modules m
      LEFT JOIN partner_training_progress p ON m.id = p.training_id AND p.partner_id = $1
      WHERE m.is_active = true
      ORDER BY m.created_at ASC
    `, [partnerId]);

    const modules = dbModules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.video_url ? 'Video' : 'Document',
      duration: m.video_url ? '15:00' : '5 Pages',
      category: 'Sales Training',
      status: m.is_completed ? 'completed' : (m.progress_pct > 0 ? 'in_progress' : 'not_started'),
      video_url: m.video_url,
      pdf_url: m.pdf_url
    }));

    return success(res, modules);
  } catch (err) {
    next(err);
  }
};

// POST /partner/training/:moduleId/complete — mark training module as completed
const completeTrainingModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
    const partnerId = partner ? partner.id : null;

    if (!partnerId) {
      return error(res, 'Partner profile not found', 404);
    }

    // Upsert progress to completed
    await query(`
      INSERT INTO partner_training_progress (partner_id, training_id, progress, completed, completed_at)
      VALUES ($1, $2, 100, true, NOW())
      ON CONFLICT (partner_id, training_id) 
      DO UPDATE SET progress = 100, completed = true, completed_at = NOW(), updated_at = NOW()
    `, [partnerId, moduleId]);

    return success(res, { message: 'Module marked as completed successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /partner/:PartnerId/team (List child partners)
const getTeamMembers = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    
    // Check if parent_partner_id column exists safely (in case migration is pending)
    let hasParentCol = true;
    try {
      await query(`SELECT parent_partner_id FROM partner_profiles LIMIT 1`);
    } catch(e) {
      hasParentCol = false;
    }

    if (!hasParentCol) {
       return success(res, [], 'Team management not fully initialized yet.');
    }

    const { rows: team } = await query(`
      SELECT ap.id, ap.partner_code, ap.first_name, ap.last_name, ap.kyc_status,
             u.email, u.mobile, u.status, u.created_at
      FROM partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.parent_partner_id = $1
      ORDER BY u.created_at DESC
    `, [PartnerId]);

    return success(res, team);
  } catch (err) {
    next(err);
  }
};

const invitePartnerClick = async (req, res, next) => {
  try {
    const { ref } = req.query;
    if (!ref) return error(res, 'Referral code is required', 400);

    await query(`
      UPDATE partner_referrals 
      SET total_invites = total_invites + 1 
      WHERE referral_code = $1
    `, [ref]);

    return success(res, {}, 'Invite recorded');
  } catch (err) {
    next(err);
  }
};

const getTeamTree = async (req, res, next) => {
  try {
    const partnerId = req.params.PartnerId || req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    if (req.kycUnapproved) {
      return success(res, {
        id: partnerId,
        label: 'Me',
        children: []
      });
    }

    const { rows } = await query(`
      SELECT 
        ap.id, ap.partner_code, ap.first_name, ap.last_name, ap.kyc_status, ap.parent_partner_id,
        u.email, u.mobile, u.status as account_status, u.created_at, r.level
      FROM partner_team_relationships r
      JOIN partner_profiles ap ON ap.id = r.child_partner_id
      JOIN users u ON u.id = ap.user_id
      WHERE r.parent_partner_id = $1
      ORDER BY r.level ASC, u.created_at DESC
    `, [partnerId]);

    const nodeMap = {
      [partnerId]: {
        id: partnerId,
        label: 'Me',
        children: []
      }
    };

    rows.forEach(r => {
      nodeMap[r.id] = {
        id: r.id,
        partner_code: r.partner_code,
        first_name: r.first_name,
        last_name: r.last_name,
        kyc_status: r.kyc_status,
        parent_partner_id: r.parent_partner_id,
        email: r.email,
        mobile: r.mobile,
        account_status: r.account_status,
        created_at: r.created_at,
        level: r.level,
        children: []
      };
    });

    rows.forEach(r => {
      const parentId = r.parent_partner_id;
      if (nodeMap[parentId]) {
        nodeMap[parentId].children.push(nodeMap[r.id]);
      } else {
        nodeMap[partnerId].children.push(nodeMap[r.id]);
      }
    });

    return success(res, nodeMap[partnerId].children);
  } catch (err) {
    next(err);
  }
};

const getTeamDashboard = async (req, res, next) => {
  try {
    const partnerId = req.params.PartnerId || req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    if (req.kycUnapproved) {
      return success(res, {
        total_members: 0,
        joined_today: 0,
        pending_kyc: 0,
        approved_partners: 0,
        rejected_partners: 0,
        suspended_partners: 0,
        blocked_partners: 0,
        monthly_team_earnings: 0,
        today_team_commission: 0
      });
    }

    const { rows: summary } = await query(`
      SELECT 
        COUNT(*)::int as total_members,
        COUNT(CASE WHEN ap.team_joined_at >= CURRENT_DATE THEN 1 END)::int as joined_today,
        COUNT(CASE WHEN ap.kyc_status = 'pending' THEN 1 END)::int as pending_kyc,
        COUNT(CASE WHEN ap.kyc_status = 'approved' THEN 1 END)::int as approved_partners,
        COUNT(CASE WHEN ap.kyc_status = 'rejected' THEN 1 END)::int as rejected_partners,
        COUNT(CASE WHEN u.status = 'suspended' THEN 1 END)::int as suspended_partners,
        COUNT(CASE WHEN u.status = 'blocked' THEN 1 END)::int as blocked_partners
      FROM partner_team_relationships r
      JOIN partner_profiles ap ON ap.id = r.child_partner_id
      JOIN users u ON u.id = ap.user_id
      WHERE r.parent_partner_id = $1
    `, [partnerId]);

    const { rows: [commissions] } = await query(`
      SELECT
        COALESCE(SUM(wt.amount) FILTER (WHERE wt.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0)::float as monthly_earnings,
        COALESCE(SUM(wt.amount) FILTER (WHERE wt.created_at >= CURRENT_DATE), 0)::float as today_earnings
      FROM wallets w
      JOIN wallet_transactions wt ON wt.wallet_id = w.id
      WHERE w.partner_id = $1 AND wt.reference_type = 'team_commission'
    `, [partnerId]);

    const dashboard = {
      ...(summary[0] || {
        total_members: 0,
        joined_today: 0,
        pending_kyc: 0,
        approved_partners: 0,
        rejected_partners: 0,
        suspended_partners: 0,
        blocked_partners: 0
      }),
      monthly_team_earnings: commissions?.monthly_earnings || 0,
      today_team_commission: commissions?.today_earnings || 0
    };

    return success(res, dashboard);
  } catch (err) {
    next(err);
  }
};

const getTeamEarnings = async (req, res, next) => {
  try {
    const partnerId = req.params.PartnerId || req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    if (req.kycUnapproved) {
      return success(res, []);
    }

    const { rows: earnings } = await query(`
      SELECT wt.*, p.name as product_name
      FROM wallets w
      JOIN wallet_transactions wt ON wt.wallet_id = w.id
      LEFT JOIN applications a ON a.id = wt.reference_id::uuid
      LEFT JOIN products p ON p.id = a.product_id
      WHERE w.partner_id = $1 AND wt.reference_type = 'team_commission'
      ORDER BY wt.created_at DESC
    `, [partnerId]);

    return success(res, earnings);
  } catch (err) {
    next(err);
  }
};

const getReferralInfo = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    if (req.kycUnapproved) {
      return success(res, {
        referral_code: '',
        referral_link: '',
        total_invites: 0,
        total_registered: 0
      });
    }

    let { rows: [referral] } = await query(`
      SELECT * FROM partner_referrals WHERE partner_id = $1
    `, [partnerId]);

    if (!referral) {
      const { rows: [partner] } = await query(`
        SELECT partner_code FROM partner_profiles WHERE id = $1
      `, [partnerId]);
      
      const code = partner?.partner_code || partner?.partner_code || 'GKP' + Math.floor(100000 + Math.random() * 900000);
      const referralLink = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/register?ref=${code}`;
      
      const { rows: [newRef] } = await query(`
        INSERT INTO partner_referrals (partner_id, referral_code, referral_link)
        VALUES ($1, $2, $3)
        ON CONFLICT (partner_id) DO UPDATE SET referral_code = EXCLUDED.referral_code RETURNING *
      `, [partnerId, code, referralLink]);
      referral = newRef;
    }

    return success(res, referral);
  } catch (err) {
    next(err);
  }
};

const changeParentPartner = async (req, res, next) => {
  const client = await getClient();
  try {
    const { PartnerId } = req.params;
    const { new_parent_id } = req.body;

    await client.query('BEGIN');

    const { rows: [partner] } = await client.query(`
      SELECT id, parent_partner_id, team_level FROM partner_profiles WHERE id = $1 FOR UPDATE
    `, [PartnerId]);

    if (!partner) {
      await client.query('ROLLBACK');
      return notFound(res, 'Partner not found');
    }

    if (new_parent_id && new_parent_id === PartnerId) {
      await client.query('ROLLBACK');
      return error(res, 'Cannot set a partner as their own parent', 400);
    }

    if (new_parent_id) {
      const { rows: [cycleCheck] } = await client.query(`
        SELECT 1 FROM partner_team_relationships 
        WHERE parent_partner_id = $1 AND child_partner_id = $2
      `, [PartnerId, new_parent_id]);
      if (cycleCheck) {
        await client.query('ROLLBACK');
        return error(res, 'Cycle detected: new parent is a child/descendant of this partner', 400);
      }
    }

    const { rows: descendants } = await client.query(`
      SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1
      UNION
      SELECT $1::uuid as child_partner_id
    `, [PartnerId]);

    const descendantIds = descendants.map(d => d.child_partner_id);

    await client.query(`
      DELETE FROM partner_team_relationships
      WHERE child_partner_id = ANY($1)
        AND NOT (parent_partner_id = ANY($1))
    `, [descendantIds]);

    if (partner.parent_partner_id) {
      await client.query(`
        UPDATE partner_profiles 
        SET children_count = GREATEST(0, children_count - 1) 
        WHERE id = $1
      `, [partner.parent_partner_id]);

      await client.query(`
        UPDATE partner_referrals
        SET total_registered = GREATEST(0, total_registered - 1)
        WHERE partner_id = $1
      `, [partner.parent_partner_id]);
    }

    let newTeamLevel = 1;
    if (new_parent_id) {
      const { rows: [newParent] } = await client.query(`
        SELECT team_level FROM partner_profiles WHERE id = $1
      `, [new_parent_id]);
      newTeamLevel = parseInt(newParent?.team_level || 1) + 1;
    }

    await client.query(`
      UPDATE partner_profiles
      SET parent_partner_id = $1, team_level = $2, team_joined_at = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE NULL END
      WHERE id = $3
    `, [new_parent_id, newTeamLevel, PartnerId]);

    if (new_parent_id) {
      const { rows: ancestors } = await client.query(`
        SELECT parent_partner_id, level FROM partner_team_relationships
        WHERE child_partner_id = $1
        UNION
        SELECT $1::uuid as parent_partner_id, 0 as level
      `, [new_parent_id]);

      ancestors.sort((a, b) => a.level - b.level);

      for (const descId of descendantIds) {
        let relLevel = 0;
        if (descId !== PartnerId) {
          const { rows: [rel] } = await client.query(`
            SELECT level FROM partner_team_relationships WHERE parent_partner_id = $1 AND child_partner_id = $2
          `, [PartnerId, descId]);
          relLevel = rel ? rel.level : 1;
        }

        for (const anc of ancestors) {
          const newRelLevel = anc.level + 1 + relLevel;
          await client.query(`
            INSERT INTO partner_team_relationships (parent_partner_id, child_partner_id, level)
            VALUES ($1, $2, $3)
            ON CONFLICT (parent_partner_id, child_partner_id) DO NOTHING
          `, [anc.parent_partner_id, descId, newRelLevel]);
        }
      }

      await client.query(`
        UPDATE partner_profiles SET children_count = children_count + 1 WHERE id = $1
      `, [new_parent_id]);
      await client.query(`
        UPDATE partner_referrals SET total_registered = total_registered + 1 WHERE partner_id = $1
      `, [new_parent_id]);
    }

    const updateDescendantLevels = async (parentId, parentLevel) => {
      const { rows: children } = await client.query(`
        SELECT id FROM partner_profiles WHERE parent_partner_id = $1
      `, [parentId]);
      for (const child of children) {
        const nextLevel = parentLevel + 1;
        await client.query(`
          UPDATE partner_profiles SET team_level = $1 WHERE id = $2
        `, [nextLevel, child.id]);
        await updateDescendantLevels(child.id, nextLevel);
      }
    };
    await updateDescendantLevels(PartnerId, newTeamLevel);

    await client.query('COMMIT');
    return success(res, {}, 'Parent partner changed successfully. Team hierarchy rebuilt.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const deactivateTeam = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    const { team_status, allow_team_creation } = req.body;

    const updates = [];
    const params = [];
    let idx = 1;

    if (team_status) {
      updates.push(`team_status = $${idx++}`);
      params.push(team_status);
    }
    if (allow_team_creation !== undefined) {
      updates.push(`allow_team_creation = $${idx++}`);
      params.push(allow_team_creation);
    }

    if (updates.length === 0) return error(res, 'No update parameters provided', 400);

    params.push(PartnerId);
    await query(`
      UPDATE partner_profiles
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
    `, params);

    return success(res, {}, 'Team status updated successfully');
  } catch (err) {
    next(err);
  }
};

const getWholeNetwork = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT 
        ap.id, ap.partner_code, ap.first_name, ap.last_name, ap.kyc_status, ap.parent_partner_id, ap.team_level, ap.team_status, ap.children_count,
        u.email, u.mobile, u.status as account_status,
        pap.partner_code as parent_code, pap.first_name as parent_first_name, pap.last_name as parent_last_name
      FROM partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN partner_profiles pap ON pap.id = ap.parent_partner_id
      ORDER BY ap.team_level ASC, ap.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const uploadPan = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);
    if (!req.file) return error(res, 'File is required', 400);

    const { pan_number } = req.body;
    const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, `kyc/${partnerId}`);

    const { rows: [doc] } = await query(`
      INSERT INTO kyc_documents (partner_id, doc_type, doc_number, file_url, s3_key, verification_status, verified)
      VALUES ($1, 'pan', $2, $3, $4, 'pending', false)
      ON CONFLICT (partner_id, doc_type) DO UPDATE SET
        doc_number = COALESCE(EXCLUDED.doc_number, kyc_documents.doc_number),
        file_url = EXCLUDED.file_url,
        s3_key = EXCLUDED.s3_key,
        verification_status = 'pending',
        verified = false,
        uploaded_at = NOW()
      RETURNING *
    `, [partnerId, pan_number || null, url, key]);

    return success(res, doc, 'PAN document uploaded successfully');
  } catch (err) {
    next(err);
  }
};

const uploadCheque = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);
    if (!req.file) return error(res, 'File is required', 400);

    const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, `kyc/${partnerId}`);

    const { rows: [doc] } = await query(`
      INSERT INTO kyc_documents (partner_id, doc_type, file_url, s3_key, verification_status, verified)
      VALUES ($1, 'cancelled_cheque', $2, $3, 'pending', false)
      ON CONFLICT (partner_id, doc_type) DO UPDATE SET
        file_url = EXCLUDED.file_url,
        s3_key = EXCLUDED.s3_key,
        verification_status = 'pending',
        verified = false,
        uploaded_at = NOW()
      RETURNING *
    `, [partnerId, url, key]);

    return success(res, doc, 'Cancelled cheque uploaded successfully');
  } catch (err) {
    next(err);
  }
};

const uploadVideo = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);
    if (!req.file) return error(res, 'Video file is required', 400);

    const { duration } = req.body;
    const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, `kyc/${partnerId}`);

    const { rows: [video] } = await query(`
      INSERT INTO partner_videos (partner_id, video_url, video_duration, video_size, storage_key, verification_status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      ON CONFLICT (partner_id) DO UPDATE SET
        video_url = EXCLUDED.video_url,
        video_duration = EXCLUDED.video_duration,
        video_size = EXCLUDED.video_size,
        storage_key = EXCLUDED.storage_key,
        verification_status = 'pending',
        rejection_reason = NULL,
        uploaded_at = NOW()
      RETURNING *
    `, [partnerId, url, parseInt(duration || 0), req.file.size, key]);

    // Reset overall KYC to pending so recalculation runs fresh after re-upload
    await query(`
      UPDATE partner_profiles 
      SET kyc_status = 'pending', rejection_reason = NULL, kyc_rejection_reason = NULL 
      WHERE id = $1
    `, [partnerId]);

    return success(res, video, 'Verification video uploaded successfully');
  } catch (err) {
    next(err);
  }
};


const submitKyc = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { rows: [pan] } = await query(
      `SELECT 1 FROM kyc_documents WHERE partner_id = $1 AND doc_type = 'pan'`,
      [partnerId]
    );

    const { rows: [cheque] } = await query(
      `SELECT 1 FROM kyc_documents WHERE partner_id = $1 AND doc_type = 'cancelled_cheque'`,
      [partnerId]
    );

    const { rows: [video] } = await query(
      `SELECT 1 FROM partner_videos WHERE partner_id = $1`,
      [partnerId]
    );

    if (!pan || !cheque || !video) {
      return error(res, 'Cannot submit KYC. Please upload all required documents: PAN Card, Cancelled Cheque, and Verification Video.', 400);
    }

    await query(`
      UPDATE partner_profiles 
      SET kyc_status = 'pending', 
          kyc_submitted_at = NOW(), 
          rejection_reason = NULL,
          kyc_rejection_reason = NULL
      WHERE id = $1
    `, [partnerId]);

    try {
      const { notify } = require('../notifications/service.js');
      const { sendKycSubmittedEmail } = require('../../services/email/email.service.js');
      await notify.kycSubmitted(req.user.id);
      if (req.user.email) {
        await sendKycSubmittedEmail(req.user.email);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC submission notifications:', notifErr.message);
    }

    return success(res, {}, 'KYC documents submitted successfully. Status is now pending review.');
  } catch (err) {
    next(err);
  }
};

const getKycStatus = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { rows: [partner] } = await query(`
      SELECT kyc_status, kyc_rejection_reason, rejection_reason FROM partner_profiles WHERE id = $1
    `, [partnerId]);

    const { rows: [pan] } = await query(`SELECT id, verification_status, verified FROM kyc_documents WHERE partner_id = $1 AND doc_type = 'pan'`, [partnerId]);
    const { rows: [cheque] } = await query(`SELECT id, verification_status, verified FROM kyc_documents WHERE partner_id = $1 AND doc_type = 'cancelled_cheque'`, [partnerId]);
    const { rows: [video] } = await query(`SELECT id, verification_status FROM partner_videos WHERE partner_id = $1`, [partnerId]);

    let progress = 0;
    if (pan) progress += 33;
    if (cheque) progress += 33;
    if (video) progress += 34;

    return success(res, {
      kyc_status: partner?.kyc_status || 'draft',
      rejection_reason: partner?.kyc_rejection_reason || partner?.rejection_reason || null,
      progress,
      kyc_completed: partner?.kyc_status === 'approved',
      documents: {
        pan: pan ? { status: pan.verification_status } : null,
        cancelled_cheque: cheque ? { status: cheque.verification_status } : null,
        verification_video: video ? { status: video.verification_status } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

const getKycDetails = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner profile not found', 404);

    const { rows: [partner] } = await query(`
      SELECT kyc_status, kyc_rejection_reason, rejection_reason, kyc_submitted_at, kyc_reviewed_at FROM partner_profiles WHERE id = $1
    `, [partnerId]);

    const { rows: documents } = await query(`
      SELECT id, doc_type, doc_number, file_url, s3_key, verification_status, verified, uploaded_at 
      FROM kyc_documents 
      WHERE partner_id = $1
    `, [partnerId]);

    const { rows: [video] } = await query(`
      SELECT id, video_url, video_duration, video_size, storage_key, uploaded_at, verification_status 
      FROM partner_videos 
      WHERE partner_id = $1
    `, [partnerId]);

    return success(res, {
      kyc_status: partner?.kyc_status || 'draft',
      rejection_reason: partner?.kyc_rejection_reason || partner?.rejection_reason || null,
      kyc_submitted_at: partner?.kyc_submitted_at,
      kyc_reviewed_at: partner?.kyc_reviewed_at,
      documents,
      video
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadKYCDocuments,
  getDashboardStats,
  listPartners,
  approvePartner,
  getSelfProfile,
  uploadSelfKYC,
  approvePartnerKYC,
  addTeamMember,
  getTeamMembers,
  listPartnerCustomers,
  getTrainingModules,
  completeTrainingModule,
  invitePartnerClick,
  getTeamTree,
  getTeamDashboard,
  getTeamEarnings,
  getReferralInfo,
  changeParentPartner,
  deactivateTeam,
  getWholeNetwork,
  uploadPan,
  uploadCheque,
  uploadVideo,
  submitKyc,
  getKycStatus,
  getKycDetails
};
