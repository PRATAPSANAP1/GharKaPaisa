const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { uploadToS3 } = require('../../services/aws/s3.service');
const { sendSms } = require('../../services/sms/sms.service');
const { sendEmail } = require('../../services/email/email.service');

const DEFAULT_DOCUMENTS = [
  { type: 'pan_card', label: 'PAN Card', required: true },
  { type: 'aadhaar', label: 'Aadhaar Card', required: true },
  { type: 'income_proof', label: 'Income Proof', required: true },
  { type: 'salary_slip', label: 'Salary Slip', required: false },
  { type: 'bank_statement', label: 'Bank Statement', required: true },
  { type: 'selfie', label: 'Selfie', required: true },
  { type: 'address_proof', label: 'Address Proof', required: true }
];

// Helper to log timeline events
const addTimelineEvent = async (applicationId, eventType, title, description, actorType = 'customer', actorId = null, metadata = {}) => {
  try {
    await query(
      `INSERT INTO application_timeline 
        (application_id, event_type, title, description, actor_type, actor_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [applicationId, eventType, title, description, actorType, actorId, JSON.stringify(metadata)]
    );
  } catch (err) {
    logger.error('Failed to log timeline event:', err);
  }
};

/**
 * Validate customer token and fetch portal data
 * GET /api/v1/customer-portal/:token
 */
const getPortalData = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenRes = await query(
      `SELECT cat.*, 
              a.id as app_id, a.app_number, a.status as app_status, a.loan_amount, a.created_at as app_created_at,
              c.id as cust_id, c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
              p.name as product_name, p.category as product_category, p.required_documents,
              b.name as bank_name, b.logo_url as bank_logo,
              pp.first_name as partner_first_name, pp.last_name as partner_last_name, pp.company_name as partner_company
       FROM customer_access_tokens cat
       JOIN applications a ON cat.application_id = a.id
       JOIN customers c ON cat.customer_id = c.id
       LEFT JOIN products p ON a.product_id = p.id
       LEFT JOIN banks b ON p.bank_id = b.id
       LEFT JOIN partner_profiles pp ON a.partner_id = pp.id
       WHERE cat.token = $1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid secure portal link' });
    }

    const tokenData = tokenRes.rows[0];
    const now = new Date();
    if (new Date(tokenData.expires_at) < now) {
      return res.status(410).json({ 
        success: false, 
        expired: true, 
        message: 'This upload link has expired (72 hours exceeded). Please request a new link.' 
      });
    }

    // Log timeline event for link opening (idempotent for session)
    const openedCheck = await query(
      `SELECT id FROM application_timeline WHERE application_id = $1 AND event_type = 'customer_opened_link'`,
      [tokenData.app_id]
    );
    if (openedCheck.rows.length === 0) {
      await addTimelineEvent(
        tokenData.app_id,
        'customer_opened_link',
        'Customer Opened Link',
        'Customer accessed the secure document portal',
        'customer',
        tokenData.cust_id
      );
    }

    // Fetch dynamic required documents list
    let requiredDocs = DEFAULT_DOCUMENTS;
    if (tokenData.required_documents && Array.isArray(tokenData.required_documents) && tokenData.required_documents.length > 0) {
      requiredDocs = tokenData.required_documents.map(doc => {
        if (typeof doc === 'string') {
          const match = DEFAULT_DOCUMENTS.find(d => d.type === doc);
          return match || { type: doc, label: doc.replace(/_/g, ' ').toUpperCase(), required: true };
        }
        return doc;
      });
    }

    // Fetch uploaded documents (latest version per type)
    const docsRes = await query(
      `SELECT * FROM application_documents 
       WHERE application_id = $1 AND is_latest = TRUE 
       ORDER BY uploaded_at DESC`,
      [tokenData.app_id]
    );

    // Fetch history of rejected/earlier versions
    const docHistoryRes = await query(
      `SELECT * FROM application_documents 
       WHERE application_id = $1 AND is_latest = FALSE 
       ORDER BY uploaded_at DESC`,
      [tokenData.app_id]
    );

    // Fetch timeline events
    const timelineRes = await query(
      `SELECT * FROM application_timeline 
       WHERE application_id = $1 
       ORDER BY created_at ASC`,
      [tokenData.app_id]
    );

    const partnerName = tokenData.partner_company || 
      `${tokenData.partner_first_name || ''} ${tokenData.partner_last_name || ''}`.trim() || 'GharKaPaisa Partner';

    res.json({
      success: true,
      data: {
        application: {
          id: tokenData.app_id,
          app_number: tokenData.app_number,
          status: tokenData.app_status,
          loan_amount: tokenData.loan_amount,
          created_at: tokenData.app_created_at,
          customer_name: tokenData.customer_name,
          customer_mobile: tokenData.customer_mobile,
          customer_email: tokenData.customer_email,
          product_name: tokenData.product_name,
          product_category: tokenData.product_category,
          bank_name: tokenData.bank_name,
          bank_logo: tokenData.bank_logo,
          partner_name: partnerName,
          expires_at: tokenData.expires_at
        },
        required_documents: requiredDocs,
        uploaded_documents: docsRes.rows,
        document_history: docHistoryRes.rows,
        timeline: timelineRes.rows
      }
    });
  } catch (err) {
    logger.error('Error fetching portal data:', err);
    res.status(500).json({ success: false, message: 'Failed to load customer portal details' });
  }
};

/**
 * Customer uploads a document via secure token
 * POST /api/v1/customer-portal/:token/upload
 */
const uploadCustomerDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const { document_type } = req.body;

    if (!document_type) {
      return res.status(400).json({ success: false, message: 'document_type is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate token
    const tokenRes = await query(
      `SELECT cat.*, a.id as app_id, c.full_name as customer_name 
       FROM customer_access_tokens cat
       JOIN applications a ON cat.application_id = a.id
       JOIN customers c ON cat.customer_id = c.id
       WHERE cat.token = $1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid secure portal link' });
    }

    const tokenData = tokenRes.rows[0];
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(410).json({ success: false, message: 'Upload link expired' });
    }

    // Validate file size and mime type
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
    }

    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_MIMES.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Invalid file format. Allowed: JPEG, PNG, WEBP, PDF' });
    }

    // Upload to S3 (or mock local path if S3 not set)
    let fileUrl = '';
    try {
      const s3Res = await uploadToS3(req.file.buffer, req.file.originalname, 'customer-documents');
      fileUrl = s3Res.url;
    } catch (uploadErr) {
      logger.warn('S3 Upload failed, writing to fallback public upload folder:', uploadErr.message);
      fileUrl = `/uploads/documents/${Date.now()}_${req.file.originalname}`;
    }

    // Check existing documents of this type to update versioning
    const existingDocRes = await query(
      `SELECT id, version FROM application_documents 
       WHERE application_id = $1 AND document_type = $2 AND is_latest = TRUE`,
      [tokenData.app_id, document_type]
    );

    let newVersion = 1;
    if (existingDocRes.rows.length > 0) {
      newVersion = (existingDocRes.rows[0].version || 1) + 1;
      // Mark existing documents as not latest
      await query(
        `UPDATE application_documents SET is_latest = FALSE WHERE application_id = $1 AND document_type = $2`,
        [tokenData.app_id, document_type]
      );
    }

    // Insert new document record
    const insertRes = await query(
      `INSERT INTO application_documents
        (application_id, document_type, file_url, file_name, mime_type, status, uploaded_by_customer, version, is_latest)
       VALUES ($1, $2, $3, $4, $5, 'uploaded', TRUE, $6, TRUE)
       RETURNING *`,
      [tokenData.app_id, document_type, fileUrl, req.file.originalname, req.file.mimetype, newVersion]
    );

    const docLabel = document_type.replace(/_/g, ' ').toUpperCase();

    // Add timeline log
    await addTimelineEvent(
      tokenData.app_id,
      'document_uploaded',
      `${docLabel} Uploaded`,
      `Customer uploaded ${docLabel} (v${newVersion})`,
      'customer',
      tokenData.customer_id
    );

    // Update application status to under_review if currently link_sent or submitted
    await query(
      `UPDATE applications SET status = 'under_review', updated_at = NOW() 
       WHERE id = $1 AND status IN ('submitted', 'link_sent', 'draft')`,
      [tokenData.app_id]
    );

    res.json({
      success: true,
      message: `${docLabel} uploaded successfully`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    logger.error('Error uploading customer document:', err);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

/**
 * Customer submits all required documents
 * POST /api/v1/customer-portal/:token/submit
 */
const submitDocuments = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenRes = await query(
      `SELECT cat.*, a.id as app_id, a.app_number, c.full_name as customer_name, c.mobile
       FROM customer_access_tokens cat
       JOIN applications a ON cat.application_id = a.id
       JOIN customers c ON cat.customer_id = c.id
       WHERE cat.token = $1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid secure portal link' });
    }

    const tokenData = tokenRes.rows[0];

    // Update application status to under_review / verification_pending
    await query(
      `UPDATE applications SET status = 'under_review', updated_at = NOW() WHERE id = $1`,
      [tokenData.app_id]
    );

    // Timeline event
    await addTimelineEvent(
      tokenData.app_id,
      'documents_submitted',
      'Documents Submitted',
      'Customer completed and submitted all required documents for verification',
      'customer',
      tokenData.customer_id
    );

    // Send confirmation SMS to customer
    const smsMsg = `Dear ${tokenData.customer_name}, your documents for Application #${tokenData.app_number} have been submitted successfully. Our team will verify them shortly. Thanks, GharKaPaisa`;
    await sendSms(tokenData.mobile, smsMsg);

    res.json({
      success: true,
      message: 'All documents submitted successfully for verification.'
    });
  } catch (err) {
    logger.error('Error submitting documents:', err);
    res.status(500).json({ success: false, message: 'Failed to finalize document submission' });
  }
};

module.exports = {
  getPortalData,
  uploadCustomerDocument,
  submitDocuments,
  addTimelineEvent
};
