const { query } = require('../config/db');
const { uploadToS3, getSignedDownloadUrl } = require('../services/s3.service');
const { ensureWallet } = require('../services/wallet.service');
const { notify } = require('../services/notification.service');
const { getPaginationParams, paginate } = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

// GET /agents/:agentId/profile
const getProfile = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { rows: [agent] } = await query(`
      SELECT ap.*, u.email, u.mobile, u.status as account_status, u.last_login,
        abd.bank_name, abd.account_number, abd.ifsc_code, abd.account_holder_name, abd.is_verified as bank_verified
      FROM agent_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN agent_bank_details abd ON abd.agent_id = ap.id
      WHERE ap.id = $1
    `, [agentId]);
    if (!agent) return notFound(res);

    const { rows: kyc } = await query(
      `SELECT doc_type, doc_number, file_url, verified, uploaded_at FROM kyc_documents WHERE agent_id = $1`, [agentId]
    );

    return success(res, { ...agent, kyc_documents: kyc });
  } catch (err) {
    next(err);
  }
};

// PUT /agents/:agentId/profile
const updateProfile = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { first_name, last_name, current_address, business_location, company_name, company_type, gst_number } = req.body;
    await query(`
      UPDATE agent_profiles SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        current_address = COALESCE($3, current_address),
        business_location = COALESCE($4, business_location),
        company_name = COALESCE($5, company_name),
        company_type = COALESCE($6, company_type),
        gst_number = COALESCE($7, gst_number),
        updated_at = NOW()
      WHERE id = $8
    `, [first_name, last_name, current_address, business_location, company_name, company_type, gst_number, agentId]);
    return success(res, {}, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// POST /agents/:agentId/kyc-documents  (multer fields: aadhaar, pan, gst_cert, cancelled_cheque)
const uploadKYCDocuments = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { aadhaar_number, pan_number } = req.body;
    const files = req.files;
    const uploaded = [];

    const docMap = {
      aadhaar: { number: aadhaar_number, label: 'Aadhaar' },
      pan: { number: pan_number, label: 'PAN' },
      gst_cert: { number: null, label: 'GST Certificate' },
      cancelled_cheque: { number: null, label: 'Cancelled Cheque' },
    };

    for (const [field, meta] of Object.entries(docMap)) {
      if (files[field] && files[field][0]) {
        const file = files[field][0];
        const { url, key } = await uploadToS3(file.buffer, file.originalname, `kyc/${agentId}`);
        await query(`
          INSERT INTO kyc_documents (agent_id, doc_type, doc_number, file_url, s3_key)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (agent_id, doc_type) DO UPDATE SET
            doc_number = EXCLUDED.doc_number,
            file_url = EXCLUDED.file_url,
            s3_key = EXCLUDED.s3_key,
            verified = false,
            uploaded_at = NOW()
        `, [agentId, field, meta.number || null, url, key]);
        uploaded.push(field);
      }
    }

    // Update KYC status to under_review
    await query(`UPDATE agent_profiles SET kyc_status = 'under_review' WHERE id = $1`, [agentId]);

    return success(res, { uploaded }, `${uploaded.length} document(s) uploaded. KYC under review.`);
  } catch (err) {
    next(err);
  }
};

// GET /agents/:agentId/dashboard — stats summary
const getDashboardStats = async (req, res, next) => {
  try {
    const { agentId } = req.params;

    const [appStats, wallet, recentApps] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'approved' OR status = 'disbursed') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status IN ('submitted','under_review')) as pending
        FROM applications WHERE agent_id = $1
      `, [agentId]),
      query(`SELECT * FROM wallets WHERE agent_id = $1`, [agentId]),
      query(`
        SELECT a.app_number, a.status, a.commission_amount, a.created_at,
          c.full_name as customer_name,
          p.name as product_name, b.short_code as bank_code
        FROM applications a
        JOIN customers c ON c.id = a.customer_id
        JOIN products p ON p.id = a.product_id
        JOIN banks b ON b.id = p.bank_id
        WHERE a.agent_id = $1
        ORDER BY a.created_at DESC LIMIT 5
      `, [agentId]),
    ]);

    return success(res, {
      applications: appStats.rows[0],
      wallet: wallet.rows[0] || { total_earned: 0, available_balance: 0, pending_amount: 0, total_withdrawn: 0 },
      recent_applications: recentApps.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /agents (Admin — list all agents)
const listAgents = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, kyc_status, search } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (status) { where += ` AND u.status = $${idx++}`; values.push(status); }
    if (kyc_status) { where += ` AND ap.kyc_status = $${idx++}`; values.push(kyc_status); }
    if (search) {
      where += ` AND (ap.first_name ILIKE $${idx} OR ap.last_name ILIKE $${idx} OR u.mobile ILIKE $${idx} OR ap.agent_code ILIKE $${idx})`;
      values.push(`%${search}%`); idx++;
    }

    const countQuery = `SELECT COUNT(*) FROM agent_profiles ap JOIN users u ON u.id = ap.user_id ${where}`;
    const dataQuery = `
      SELECT ap.id, ap.agent_code, ap.first_name, ap.last_name, ap.kyc_status, ap.company_name,
        u.email, u.mobile, u.status, u.created_at
      FROM agent_profiles ap JOIN users u ON u.id = ap.user_id
      ${where} ORDER BY u.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [count, data] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// PATCH /agents/:agentId/approve (Admin)
const approveAgent = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { approved, rejection_reason } = req.body;

    const { rows: [agent] } = await query(`SELECT user_id FROM agent_profiles WHERE id = $1`, [agentId]);
    if (!agent) return notFound(res, 'Agent not found');

    if (approved) {
      await query(`
        UPDATE agent_profiles SET kyc_status = 'approved', approved_by = $1, approved_at = NOW() WHERE id = $2
      `, [req.user.id, agentId]);
      await query(`UPDATE users SET status = 'active' WHERE id = $1`, [agent.user_id]);
      await ensureWallet(agentId);
      await notify.kycApproved(agent.user_id);
    } else {
      await query(`
        UPDATE agent_profiles SET kyc_status = 'rejected', rejection_reason = $1 WHERE id = $2
      `, [rejection_reason, agentId]);
      await notify.kycRejected(agent.user_id, rejection_reason);
    }

    return success(res, {}, `Agent ${approved ? 'approved' : 'rejected'} successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, uploadKYCDocuments, getDashboardStats, listAgents, approveAgent };
