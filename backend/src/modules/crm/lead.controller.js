const { query, getClient } = require('../../config/database');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const logger = require('../../config/logger');

const {
  logLeadTimeline,
  logLeadActivity,
  initializeLeadPipeline,
  triggerAutomaticCommissionPayout
} = require('./lead.service.js');

/**
 * Enterprise Lead Orchestration Controller
 */

// GET /leads — List leads with search, filters, and priority/SLA badges
const listLeads = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, priority, source, bank_id, search, from_date, to_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (req.user.role === 'PARTNER') {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!partner) return error(res, 'Partner profile not found', 404);
      whereClause += ` AND l.partner_id = $${idx++}`;
      values.push(partner.id);
    }

    if (status) {
      whereClause += ` AND l.status = $${idx++}`;
      values.push(status);
    }
    if (priority) {
      whereClause += ` AND l.priority = $${idx++}`;
      values.push(priority);
    }
    if (source) {
      whereClause += ` AND l.source = $${idx++}`;
      values.push(source);
    }
    if (bank_id) {
      whereClause += ` AND p.bank_id = $${idx++}`;
      values.push(bank_id);
    }

    if (search) {
      whereClause += ` AND (
        l.customer_name ILIKE $${idx} OR 
        l.mobile ILIKE $${idx} OR 
        l.city ILIKE $${idx} OR
        l.id::text ILIKE $${idx} OR
        c.pan_number ILIKE $${idx} OR
        p.name ILIKE $${idx} OR
        b.name ILIKE $${idx}
      )`;
      values.push(`%${search}%`);
      idx++;
    }

    if (from_date) {
      whereClause += ` AND l.created_at >= $${idx++}`;
      values.push(from_date);
    }
    if (to_date) {
      whereClause += ` AND l.created_at <= $${idx++}`;
      values.push(to_date + ' 23:59:59');
    }

    const [countRes, dataRes] = await Promise.all([
      query(`
        SELECT COUNT(DISTINCT l.id) 
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN customers c ON c.mobile = l.mobile
        ${whereClause}
      `, values),
      query(`
        SELECT l.*, 
               p.name as product_name, p.category as product_category, p.commission_value,
               b.name as bank_name, b.short_code as bank_code,
               pp.partner_code, pp.first_name as partner_first_name, pp.last_name as partner_last_name,
               (SELECT executive_name FROM bank_assignments WHERE lead_id = l.id ORDER BY assigned_at DESC LIMIT 1) as bank_executive_name,
               (SELECT COUNT(*)::int FROM lead_documents WHERE lead_id = l.id) as documents_count,
               (SELECT COUNT(*)::int FROM lead_checklist WHERE lead_id = l.id AND status = 'verified') as checklist_verified_count
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles pp ON pp.id = l.partner_id
        LEFT JOIN customers c ON c.mobile = l.mobile
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].count);
    return paginate(res, dataRes.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /leads/:id — Full 360 Degree Lead Orchestration Details
const get360LeadDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [lead] } = await query(`
      SELECT l.*,
             p.name as product_name, p.category as product_category, p.commission_type, p.commission_value,
             b.name as bank_name, b.short_code as bank_code,
             pp.partner_code, pp.first_name as partner_first_name, pp.last_name as partner_last_name,
             c.id as customer_id, c.email as customer_email, c.pan_number, c.dob, c.employment_type, c.monthly_income
      FROM leads l
      LEFT JOIN products p ON p.id = l.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN partner_profiles pp ON pp.id = l.partner_id
      LEFT JOIN customers c ON (c.mobile = l.mobile OR c.id = l.customer_id)
      WHERE l.id = $1
    `, [id]);

    if (!lead) return notFound(res, 'Lead not found');

    // Parallel fetch for 360 details
    const [docsRes, timelineRes, historyRes, notesRes, assignRes, bankAssignRes, checkRes, slaRes, walletRes] = await Promise.all([
      query(`SELECT ld.*, u.full_name as uploader_name FROM lead_documents ld LEFT JOIN users u ON u.id = ld.uploaded_by WHERE ld.lead_id = $1 ORDER BY ld.uploaded_at DESC`, [id]),
      query(`SELECT lt.*, u.full_name as author_name FROM lead_timeline lt LEFT JOIN users u ON u.id = lt.created_by WHERE lt.lead_id = $1 ORDER BY lt.created_at DESC`, [id]),
      query(`SELECT sh.*, u.full_name as author_name FROM lead_status_history sh LEFT JOIN users u ON u.id = sh.changed_by WHERE sh.lead_id = $1 ORDER BY sh.created_at DESC`, [id]),
      query(`
        SELECT ln.*, u.full_name as author_name 
        FROM lead_notes ln 
        LEFT JOIN users u ON u.id = ln.user_id 
        WHERE ln.lead_id = $1 ${req.user.role === 'PARTNER' ? "AND ln.visibility = 'partner'" : ""}
        ORDER BY ln.created_at DESC
      `, [id]),
      query(`SELECT la.*, u.full_name as staff_name FROM lead_assignments la LEFT JOIN users u ON u.id = la.assigned_to WHERE la.lead_id = $1 ORDER BY la.assigned_at DESC`, [id]),
      query(`SELECT * FROM bank_assignments WHERE lead_id = $1 ORDER BY assigned_at DESC`, [id]),
      query(`SELECT lc.*, u.full_name as verifier_name FROM lead_checklist lc LEFT JOIN users u ON u.id = lc.verified_by WHERE lc.lead_id = $1 ORDER BY lc.item ASC`, [id]),
      query(`SELECT * FROM lead_sla WHERE lead_id = $1 ORDER BY started_at DESC`, [id]),
      query(`SELECT * FROM commission_ledger WHERE lead_id = $1`, [id])
    ]);

    await logLeadActivity(null, id, 'view_360_lead', req.user.id, 'lead', id, req);

    return success(res, {
      overview: lead,
      documents: docsRes.rows,
      timeline: timelineRes.rows,
      status_history: historyRes.rows,
      notes: notesRes.rows,
      assignments: assignRes.rows,
      bank_assignment: bankAssignRes.rows[0] || null,
      checklist: checkRes.rows,
      sla_tracker: slaRes.rows,
      commission_ledger: walletRes.rows[0] || null
    }, 'Lead 360 overview loaded');
  } catch (err) {
    next(err);
  }
};

// POST /leads — Create Lead with Auto Pipeline Initialization
const createLead = async (req, res, next) => {
  try {
    const { productId, customerName, mobile, city, source, priority } = req.body;
    if (!productId || !customerName || !mobile || !city) {
      return error(res, 'Product ID, Customer Name, Mobile, and City are required', 400);
    }

    let { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
    if (!partner) {
      const partnerCode = 'AG' + String(Math.floor(10000 + Math.random() * 90000));
      const { rows: [newP] } = await query(`
        INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status)
        VALUES ($1, $2, $3, $4, 'active', 'pending') RETURNING id
      `, [req.user.id, partnerCode, req.user.first_name || 'Partner', req.user.last_name || '']);
      partner = newP;
    }

    const trimmedMobile = String(mobile).trim();
    const trimmedName = String(customerName).trim();
    const trimmedCity = String(city).trim();

    // Auto-upsert into customers
    const { rows: [customer] } = await query(`
      INSERT INTO customers (full_name, mobile, city, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (mobile) DO UPDATE
      SET full_name = EXCLUDED.full_name, city = COALESCE(customers.city, EXCLUDED.city), updated_at = NOW()
      RETURNING id
    `, [trimmedName, trimmedMobile, trimmedCity, req.user.id]);

    const { rows: [lead] } = await query(`
      INSERT INTO leads (partner_id, product_id, customer_name, mobile, city, status, source, priority, pipeline_stage)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, 'created')
      RETURNING *
    `, [partner.id, productId, trimmedName, trimmedMobile, trimmedCity, source || 'partner', priority || 'medium']);

    // Initialize lead pipeline, timeline, SLA & checklist
    await initializeLeadPipeline(lead.id, req.user.id, source || 'partner', priority || 'medium');

    return created(res, lead, 'Lead created successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /leads/:id/status — Status & Stage Pipeline Transition
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, pipeline_stage, remarks, rejection_reason, approved_amount } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Lead not found');

    const newStatus = status || existing.status;
    const newStage = pipeline_stage || (newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : existing.pipeline_stage);

    const { rows: [updated] } = await query(`
      UPDATE leads 
      SET status = $1, pipeline_stage = $2, rejection_reason = COALESCE($3, rejection_reason), updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [newStatus, newStage, rejection_reason || null, id]);

    // Record Status History
    await query(`
      INSERT INTO lead_status_history (lead_id, old_status, new_status, changed_by, remarks)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, existing.status, newStatus, req.user.id, remarks || `Status transitioned to ${newStatus}`]);

    // Record Timeline
    await logLeadTimeline(null, id, `Status: ${newStatus.toUpperCase()}`, remarks || `Lead stage changed to ${newStage}`, 'lead', id, req.user.id);
    await logLeadActivity(null, id, 'status_update', req.user.id, 'lead', id, req);

    // IF APPROVED -> Trigger Automatic Commission Calculation & Partner Wallet Credit!
    if (newStatus === 'approved' && existing.status !== 'approved') {
      try {
        await triggerAutomaticCommissionPayout(id, approved_amount, req.user.id);
      } catch (commErr) {
        logger.error(`Automatic commission calculation failed for lead ${id}:`, commErr);
      }
    }

    return success(res, updated, `Lead status updated to ${newStatus}`);
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/document — Document Upload
const addLeadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_type, file_url, verification_status } = req.body;
    if (!document_type || !file_url) return error(res, 'Document type and file URL are required', 400);

    const { rows: [doc] } = await query(`
      INSERT INTO lead_documents (lead_id, document_type, file_url, verification_status, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, document_type, file_url, verification_status || 'pending', req.user.id]);

    await logLeadTimeline(null, id, 'Document Uploaded', `${document_type.replace('_', ' ').toUpperCase()} uploaded`, 'lead_documents', doc.id, req.user.id);
    return created(res, doc, 'Document attached to lead successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/note — Public or Internal Note
const addLeadNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, visibility } = req.body;
    if (!note) return error(res, 'Note content is required', 400);

    const { rows: [n] } = await query(`
      INSERT INTO lead_notes (lead_id, user_id, role, note, visibility)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, req.user.id, req.user.role, note, visibility || 'partner']);

    await logLeadTimeline(null, id, 'Note Added', note.substring(0, 100), 'lead_notes', n.id, req.user.id);
    return created(res, n, 'Note recorded successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/assign — Assign to Operations Team
const assignLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigned_to, team } = req.body;
    if (!assigned_to) return error(res, 'Target staff user ID is required', 400);

    const { rows: [assign] } = await query(`
      INSERT INTO lead_assignments (lead_id, assigned_to, team, assigned_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, assigned_to, team || 'operations', req.user.id]);

    await logLeadTimeline(null, id, 'Lead Assigned', `Lead assigned to staff member (${team || 'operations'})`, 'lead_assignments', assign.id, req.user.id);
    return created(res, assign, 'Lead assigned successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/bank-assign — Assign Bank Executive
const assignBankExecutive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bank_id, executive_name, mobile, email } = req.body;
    if (!executive_name) return error(res, 'Bank Executive Name is required', 400);

    const { rows: [bankAss] } = await query(`
      INSERT INTO bank_assignments (lead_id, bank_id, executive_name, mobile, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, bank_id || null, executive_name, mobile || null, email || null]);

    await logLeadTimeline(null, id, 'Bank Executive Assigned', `Assigned to ${executive_name} (${mobile || 'No phone'})`, 'bank_assignments', bankAss.id, req.user.id);
    return created(res, bankAss, 'Bank executive assigned successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/checklist — Verification Checklist Update
const updateLeadChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item, status } = req.body;
    if (!item || !status) return error(res, 'Item and status are required', 400);

    const { rows: [check] } = await query(`
      INSERT INTO lead_checklist (lead_id, item, status, verified_by, verified_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (lead_id, item) DO UPDATE
      SET status = EXCLUDED.status, verified_by = EXCLUDED.verified_by, verified_at = NOW()
      RETURNING *
    `, [id, item, status, req.user.id]);

    await logLeadTimeline(null, id, 'Checklist Verified', `${item}: ${status.toUpperCase()}`, 'lead_checklist', check.id, req.user.id);
    return success(res, check, 'Checklist status updated');
  } catch (err) {
    next(err);
  }
};

// Bulk Assign Leads
const bulkAssignLeads = async (req, res, next) => {
  try {
    const { lead_ids, assigned_partner_id } = req.body;
    if (!Array.isArray(lead_ids) || !assigned_partner_id) {
      return error(res, 'Lead IDs array and Assigned Partner ID are required', 400);
    }

    await query(`
      UPDATE leads 
      SET partner_id = $1, updated_at = NOW()
      WHERE id = ANY($2::uuid[])
    `, [assigned_partner_id, lead_ids]);

    return success(res, {}, `Successfully reassigned ${lead_ids.length} leads`);
  } catch (err) {
    next(err);
  }
};

// Follow-up handler legacy compatibility
const addLeadFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { follow_up_at, note } = req.body;
    if (!follow_up_at) return error(res, 'Follow-up date/time is required', 400);

    const { rows: [f] } = await query(`
      INSERT INTO lead_followups (lead_id, scheduled_by, follow_up_at, note)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, req.user.id, follow_up_at, note || '']);

    await logLeadTimeline(null, id, 'Followup Scheduled', note || 'Followup scheduled', 'lead_followups', f.id, req.user.id);
    return created(res, f, 'Follow-up reminder set');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listLeads,
  get360LeadDetails,
  createLead,
  updateLeadStatus,
  addLeadDocument,
  addLeadNote,
  assignLead,
  assignBankExecutive,
  updateLeadChecklist,
  bulkAssignLeads,
  addLeadFollowUp
};
