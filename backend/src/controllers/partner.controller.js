const { query, getClient } = require('../config/db');
const { uploadToS3, getSignedDownloadUrl } = require('../services/s3.service');
const { ensureWallet } = require('../services/wallet.service');
const { notify } = require('../services/notification.service');
const { getPaginationParams } = require('../utils/helpers');
const { success, created, error, notFound, paginate } = require('../utils/response');
const { logAction } = require('../services/audit.service');
const logger = require('../utils/logger');

// GET /Partners/:PartnerId/profile (Partner profile)
const getProfile = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    const { rows: [Partner] } = await query(`
      SELECT ap.*, u.email, u.mobile, u.status as account_status, u.last_login,
        abd.bank_name, abd.account_number, abd.ifsc_code, abd.account_holder_name, abd.is_verified as bank_verified
      FROM Partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN Partner_bank_details abd ON abd.Partner_id = ap.id
      WHERE ap.id = $1
    `, [PartnerId]);
    if (!Partner) return notFound(res);

    // Mask bank account number
    if (Partner && Partner.account_number) {
      const { decrypt } = require('../utils/crypto');
      const decrypted = decrypt(Partner.account_number);
      const accLen = decrypted.length;
      if (accLen > 4) {
        Partner.account_number = '*'.repeat(accLen - 4) + decrypted.slice(-4);
      } else {
        Partner.account_number = '*'.repeat(accLen);
      }
    }

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    if (shouldMask) {
      Partner.first_name = 'Partner';
      Partner.last_name = Partner.Partner_code;
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
      `SELECT doc_type, doc_number, file_url, verified, uploaded_at FROM kyc_documents WHERE Partner_id = $1`, [PartnerId]
    );

    const processedKyc = shouldMask ? [] : kyc;

    return success(res, { ...Partner, kyc_documents: processedKyc });
  } catch (err) {
    next(err);
  }
};

// PUT /Partners/:PartnerId/profile (Update partner profile)
const updateProfile = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    const { first_name, last_name, current_address, business_location, company_name, company_type, gst_number, pincode } = req.body;
    await query(`
      UPDATE Partner_profiles SET
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
    const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
    if (!isS3Configured) {
      return error(res, 'S3 storage service is not configured. Upload failed.', 503);
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
          INSERT INTO kyc_documents (Partner_id, doc_type, doc_number, file_url, s3_key)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (Partner_id, doc_type) DO UPDATE SET
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
    await query(`UPDATE Partner_profiles SET kyc_status = 'under_review' WHERE id = $1`, [PartnerId]);

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
        FROM applications WHERE Partner_id = $1
      `, [PartnerId]),
      query(`SELECT * FROM wallets WHERE Partner_id = $1`, [PartnerId]),
      query(`
        SELECT a.app_number, a.status, a.commission_amount, a.created_at,
          c.full_name as customer_name,
          p.name as product_name, b.short_code as bank_code
        FROM applications a
        JOIN customers c ON c.id = a.customer_id
        JOIN products p ON p.id = a.product_id
        JOIN banks b ON b.id = p.bank_id
        WHERE a.Partner_id = $1
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
    const { status, kyc_status, search } = req.query;

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (status) { where += ` AND u.status = $${idx++}`; values.push(status); }
    if (kyc_status) { where += ` AND ap.kyc_status = $${idx++}`; values.push(kyc_status); }
    if (search) {
      if (shouldMask) {
        where += ` AND ap.Partner_code ILIKE $${idx}`;
      } else {
        where += ` AND (ap.first_name ILIKE $${idx} OR ap.last_name ILIKE $${idx} OR u.mobile ILIKE $${idx} OR ap.Partner_code ILIKE $${idx})`;
      }
      values.push(`%${search}%`); idx++;
    }

    let hasParentCol = true;
    try {
      await query(`SELECT parent_partner_id FROM Partner_profiles LIMIT 1`);
    } catch(e) {
      hasParentCol = false;
    }

    const countQuery = `SELECT COUNT(*) FROM Partner_profiles ap JOIN users u ON u.id = ap.user_id ${where}`;
    
    let selectFields = `ap.id, ap.Partner_code, ap.first_name, ap.last_name, ap.kyc_status, ap.company_name, u.email, u.mobile, u.status, u.created_at`;
    let joinClause = ``;
    if (hasParentCol) {
      selectFields += `, ap.parent_partner_id, pap.Partner_code as parent_code`;
      joinClause = `LEFT JOIN Partner_profiles pap ON pap.id = ap.parent_partner_id`;
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM Partner_profiles ap JOIN users u ON u.id = ap.user_id
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
          last_name: row.Partner_code,
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

    const { rows: [Partner] } = await client.query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [PartnerId]);
    if (!Partner) return notFound(res, 'Partner not found');

    await client.query('BEGIN');

    if (approved) {
      await client.query(`
        UPDATE Partner_profiles SET kyc_status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2
      `, [req.user.id, PartnerId]);
      await client.query(`UPDATE users SET status = 'active' WHERE id = $1`, [Partner.user_id]);
      await client.query(`
        INSERT INTO wallets (Partner_id) VALUES ($1)
        ON CONFLICT (Partner_id) DO NOTHING
      `, [PartnerId]);
      await client.query('COMMIT');
      await logAction(req, 'APPROVE_KYC', PartnerId, { userId: Partner.user_id });
      await notify.kycApproved(Partner.user_id);
    } else {
      await client.query(`
        UPDATE Partner_profiles SET kyc_status = 'rejected', rejection_reason = $1 WHERE id = $2
      `, [rejection_reason, PartnerId]);
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
      FROM Partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN Partner_bank_details abd ON abd.Partner_id = ap.id
      WHERE ap.user_id = $1
    `, [userId]);
    if (!Partner) return notFound(res, 'Partner profile not found');

    // Mask bank account number
    if (Partner && Partner.account_number) {
      const { decrypt } = require('../utils/crypto');
      const decrypted = decrypt(Partner.account_number);
      const accLen = decrypted.length;
      if (accLen > 4) {
        Partner.account_number = '*'.repeat(accLen - 4) + decrypted.slice(-4);
      } else {
        Partner.account_number = '*'.repeat(accLen);
      }
    }

    const { rows: kyc } = await query(
      `SELECT doc_type, doc_number, file_url, verified, uploaded_at FROM kyc_documents WHERE Partner_id = $1`, [Partner.id]
    );

    return success(res, { ...Partner, kyc_documents: kyc });
  } catch (err) {
    next(err);
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
    const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
    if (!isS3Configured) {
      return error(res, 'S3 storage service is not configured. Upload failed.', 503);
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
          INSERT INTO kyc_documents (Partner_id, doc_type, doc_number, file_url, s3_key)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (Partner_id, doc_type) DO UPDATE SET
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
    await query(`UPDATE Partner_profiles SET kyc_status = 'under_review' WHERE id = $1`, [PartnerId]);

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

    // Check if parent exists
    const { rows: [parentPartner] } = await client.query(`SELECT id FROM Partner_profiles WHERE id = $1`, [PartnerId]);
    if (!parentPartner) return error(res, 'Parent partner not found', 404);

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
    const { generatePartnerCode } = require('../utils/helpers');
    const partnerCode = generatePartnerCode(parseInt(nextval));

    // Create child partner profile
    const { rows: [childPartner] } = await client.query(`
      INSERT INTO Partner_profiles (
        user_id, Partner_code, first_name, last_name, parent_partner_id, kyc_status
      )
      VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id
    `, [user.id, partnerCode, first_name, last_name || '', PartnerId]);

    // Create wallet
    await client.query(`INSERT INTO wallets (Partner_id) VALUES ($1)`, [childPartner.id]);

    await client.query('COMMIT');
    return created(res, { partner_code: partnerCode }, 'Team member created successfully. They can now log in using their email and password.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /partner/:PartnerId/team (List child partners)
const getTeamMembers = async (req, res, next) => {
  try {
    const { PartnerId } = req.params;
    
    // Check if parent_partner_id column exists safely (in case migration is pending)
    let hasParentCol = true;
    try {
      await query(`SELECT parent_partner_id FROM Partner_profiles LIMIT 1`);
    } catch(e) {
      hasParentCol = false;
    }

    if (!hasParentCol) {
       return success(res, [], 'Team management not fully initialized yet.');
    }

    const { rows: team } = await query(`
      SELECT ap.id, ap.Partner_code, ap.first_name, ap.last_name, ap.kyc_status,
             u.email, u.mobile, u.status, u.created_at
      FROM Partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.parent_partner_id = $1
      ORDER BY u.created_at DESC
    `, [PartnerId]);

    return success(res, team);
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
  getTeamMembers
};
