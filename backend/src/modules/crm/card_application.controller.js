const { query } = require('../../config/database');
const { success, created, error, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');

// Public & Admin route to submit verified card / loan / insurance application lead
const submitApplication = async (req, res, next) => {
  try {
    const { customerName, mobile, bankName, cardName, category } = req.body;

    if (!customerName || !mobile || !bankName || !cardName) {
      return error(res, 'Customer Name, Mobile Number, Bank/Provider Name, and Product/Card Name are required', 400);
    }

    // Basic mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return error(res, 'Please provide a valid 10-digit mobile number', 400);
    }

    const leadCategory = category ? category.trim().toLowerCase() : 'credit_card';

    const { rows: [application] } = await query(
      `INSERT INTO direct_card_applications (customer_name, mobile, bank_name, card_name, category, status)
       VALUES ($1, $2, $3, $4, $5, 'verified') RETURNING *`,
      [customerName.trim(), mobile.trim(), bankName.trim(), cardName.trim(), leadCategory]
    );

    // Dual-sync to main applications table to preserve single source of truth
    try {
      // Find matching bank and product if available
      const { rows: [bank] } = await query(`SELECT id FROM banks WHERE LOWER(name) ILIKE $1 OR LOWER(short_code) ILIKE $1 LIMIT 1`, [`%${bankName.trim()}%`]);
      let productId = null;
      let bankId = bank ? bank.id : null;

      if (bankId) {
        const { rows: [prod] } = await query(`SELECT id FROM products WHERE bank_id = $1 AND LOWER(name) ILIKE $2 LIMIT 1`, [bankId, `%${cardName.trim()}%`]);
        productId = prod ? prod.id : null;
      }

      // Upsert lead
      const { rows: [lead] } = await query(
        `INSERT INTO leads (customer_name, mobile, status, source) VALUES ($1, $2, 'details_submitted', 'direct_card') RETURNING id`,
        [customerName.trim(), mobile.trim()]
      );

      const appNum = `DIR${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

      await query(
        `INSERT INTO applications (app_number, lead_id, bank_id, product_id, status, process_type, source, customer_name, customer_mobile)
         VALUES ($1, $2, $3, $4, 'details_submitted', 'direct_lead', 'direct_card_applications', $5, $6)
         ON CONFLICT (app_number) DO NOTHING`,
        [appNum, lead.id, bankId, productId, customerName.trim(), mobile.trim()]
      );
    } catch (syncErr) {
      // Non-blocking sync error logging
      console.error('Direct application single-source sync warning:', syncErr.message);
    }

    return created(res, application, 'Direct lead recorded successfully');
  } catch (err) {
    next(err);
  }
};

// Admin & Super Admin route to list direct applications with category filter
const listApplications = async (req, res, next) => {
  try {
    let { page, limit, offset } = getPaginationParams(req.query);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

    const { search, category } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    const userRole = (req.user?.role || '').toUpperCase();
    if (userRole !== 'SUPER_ADMIN' && req.user?.id) {
      const { rows: abRows } = await query(`
        SELECT aba.bank_id, b.short_code, b.name 
        FROM admin_bank_assignments aba
        LEFT JOIN banks b ON b.id = aba.bank_id
        WHERE aba.admin_id = $1
      `, [req.user.id]);
      if (abRows.length > 0) {
        const hasLocEoc = abRows.some(b => (b.short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card|smart\s*emi/i.test(b.name || ''));
        const regBankRows = abRows.filter(b => (b.short_code || '').toUpperCase() !== 'LOC_EOC' && !/loc[\s/_]*eoc|loan\s+on\s+card|smart\s*emi/i.test(b.name || ''));
        const locCondition = `(LOWER(COALESCE(category, '')) IN ('loc_eoc', 'loan_on_credit_card', 'smart_emi') OR LOWER(COALESCE(card_name, '')) LIKE '%insta loan%' OR LOWER(COALESCE(card_name, '')) LIKE '%jumbo loan%' OR LOWER(COALESCE(card_name, '')) LIKE '%smartemi%')`;
        if (hasLocEoc && regBankRows.length === 0) {
          whereClause += ` AND ${locCondition}`;
        } else if (hasLocEoc && regBankRows.length > 0) {
          const regIds = regBankRows.map(b => b.bank_id);
          whereClause += ` AND (bank_name IN (SELECT name FROM banks WHERE id = ANY($${idx}::uuid[])) OR ${locCondition})`;
          values.push(regIds);
          idx++;
        } else {
          const regIds = regBankRows.map(b => b.bank_id);
          whereClause += ` AND (bank_name IN (SELECT name FROM banks WHERE id = ANY($${idx}::uuid[])))`;
          values.push(regIds);
          idx++;
        }
      } else {
        whereClause += ` AND 1=0`;
      }

      const userDesignation = (req.user?.designation || '').toUpperCase();
      const isQuerableOperatorUser = ['QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR'].includes(userDesignation) || ['QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR'].includes(userRole);
      if (isQuerableOperatorUser && req.user?.id) {
        whereClause += ` AND (LOWER(COALESCE(status, '')) IN ('rejected', 'declined', 'decline') OR LOWER(COALESCE(status, '')) LIKE '%reject%' OR LOWER(COALESCE(status, '')) LIKE '%decline%')`;
      }
    }

    if (category === 'loc_eoc' || category === 'LOC/EOC' || category === 'loc-eoc') {
      whereClause += ` AND (LOWER(category) IN ('loc_eoc', 'loan_on_credit_card', 'smart_emi') OR LOWER(card_name) LIKE '%insta loan%' OR LOWER(card_name) LIKE '%jumbo loan%' OR LOWER(card_name) LIKE '%smartemi%')`;
    } else if (category === 'loan_applications' || category === 'loan' || category === 'loans') {
      whereClause += ` AND (LOWER(category) IN ('loan', 'personal_loan', 'home_loan', 'business_loan', 'instant_loan', 'used_car_loan', 'education_loan') OR (LOWER(card_name) LIKE '%loan%' AND LOWER(card_name) NOT LIKE '%credit card%' AND LOWER(card_name) NOT LIKE '%insta loan%' AND LOWER(card_name) NOT LIKE '%jumbo loan%')) AND LOWER(COALESCE(category,'')) NOT IN ('loc_eoc', 'loan_on_credit_card', 'smart_emi')`;
    } else {
      whereClause += ` AND COALESCE(LOWER(category), '') NOT IN ('loan_on_credit_card', 'smart_emi', 'loc_eoc') AND LOWER(COALESCE(card_name, '')) NOT LIKE '%loan on credit card%' AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smart emi%'`;
      if (category && category !== 'all') {
        whereClause += ` AND (LOWER(category) = $${idx} OR ($${idx} = 'credit_card' AND (category IS NULL OR category = '')))`;
        values.push(category.trim().toLowerCase());
        idx++;
      }
    }

    if (search) {
      whereClause += ` AND (customer_name ILIKE $${idx} OR mobile ILIKE $${idx} OR bank_name ILIKE $${idx} OR card_name ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM direct_card_applications
      ${whereClause}
    `;

    const dataQuery = `
      SELECT * 
      FROM direct_card_applications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    return paginate(res, dataResult.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// Admin route to update direct lead status
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return error(res, 'Status is required', 400);

    const { rows: [application] } = await query(
      `UPDATE direct_card_applications SET status = $1 WHERE id = $2 RETURNING *`,
      [status.trim(), id]
    );

    if (!application) return error(res, 'Direct lead not found', 404);

    return success(res, application, 'Direct lead status updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus
};
