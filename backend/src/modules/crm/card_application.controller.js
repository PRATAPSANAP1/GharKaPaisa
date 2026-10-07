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
          const bankMatchSql = `(bank_name IN (SELECT name FROM banks WHERE id = ANY($${idx}::uuid[])) OR bank_name IN (SELECT short_code FROM banks WHERE id = ANY($${idx}::uuid[])) OR EXISTS (SELECT 1 FROM banks b WHERE b.id = ANY($${idx}::uuid[]) AND (LOWER(bank_name) LIKE '%' || LOWER(b.short_code) || '%' OR LOWER(b.name) LIKE '%' || LOWER(bank_name) || '%')))`;
          whereClause += ` AND (${bankMatchSql} OR ${locCondition})`;
          values.push(regIds);
          idx++;
        } else {
          const regIds = regBankRows.map(b => b.bank_id);
          const bankMatchSql = `(bank_name IN (SELECT name FROM banks WHERE id = ANY($${idx}::uuid[])) OR bank_name IN (SELECT short_code FROM banks WHERE id = ANY($${idx}::uuid[])) OR EXISTS (SELECT 1 FROM banks b WHERE b.id = ANY($${idx}::uuid[]) AND (LOWER(bank_name) LIKE '%' || LOWER(b.short_code) || '%' OR LOWER(b.name) LIKE '%' || LOWER(bank_name) || '%')))`;
          whereClause += ` AND ${bankMatchSql}`;
          values.push(regIds);
          idx++;
        }
      } else {
        whereClause += ` AND 1=0`;
      }

      const userDesignation = (req.user?.designation || '').toUpperCase();
      const isQuerableOperatorUser = ['QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR'].includes(userDesignation) || ['QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR'].includes(userRole);
      if (isQuerableOperatorUser && req.user?.id) {
        whereClause += ` AND (LOWER(COALESCE(status, '')) IN ('rejected', 'declined', 'decline', 'technical_error') OR LOWER(COALESCE(status, '')) LIKE '%reject%' OR LOWER(COALESCE(status, '')) LIKE '%decline%')`;
      }
    }

    const catLower = (category || '').trim().toLowerCase();

    if (['loc_eoc', 'loc-eoc', 'loc/eoc', 'loc_eoc_all'].includes(catLower)) {
      whereClause += ` AND (
        LOWER(COALESCE(category, '')) IN ('loc_eoc', 'loc', 'eoc', 'loan_on_credit_card', 'smart_emi', 'loan', 'loans')
        OR LOWER(COALESCE(card_name, '')) LIKE '%loan%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%jumbo%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%insta%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%instant%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%smartemi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%smart emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%encash%'
      )`;
    } else if (catLower === 'loan_on_credit_card' || catLower === 'loc' || catLower === 'loan_on_card') {
      whereClause += ` AND (
        LOWER(COALESCE(category, '')) IN ('loan_on_credit_card', 'loc', 'loan_on_card')
        OR (
          (
            LOWER(COALESCE(category, '')) IN ('loc_eoc', 'loan', 'loans', 'loan_applications', 'credit_card', 'all')
            OR LOWER(COALESCE(card_name, '')) LIKE '%loan%'
            OR LOWER(COALESCE(card_name, '')) LIKE '%jumbo%'
            OR LOWER(COALESCE(card_name, '')) LIKE '%insta%'
            OR LOWER(COALESCE(card_name, '')) LIKE '%instant%'
            OR LOWER(COALESCE(card_name, '')) LIKE '%encash%'
          )
          AND LOWER(COALESCE(category, '')) NOT IN ('smart_emi', 'eoc', 'smartemi', 'emi')
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smartemi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smart emi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%emi on card%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%emi on credit card%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%easy emi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%flexi emi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%instant emi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%quick emi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%convert to emi%'
          AND LOWER(COALESCE(card_name, '')) NOT LIKE '%emi%'
        )
      )`;
    } else if (catLower === 'smart_emi' || catLower === 'eoc' || catLower === 'smartemi' || catLower === 'emi') {
      whereClause += ` AND (
        LOWER(COALESCE(category, '')) IN ('smart_emi', 'eoc', 'smartemi', 'emi')
        OR (
          LOWER(COALESCE(category, '')) IN ('loc_eoc', 'loan', 'loans', 'loan_applications', 'credit_card', 'all')
          AND (
            LOWER(COALESCE(card_name, '')) LIKE '%emi%'
            OR LOWER(COALESCE(card_name, '')) LIKE '%smartemi%'
            OR LOWER(COALESCE(card_name, '')) LIKE '%smart emi%'
          )
        )
        OR LOWER(COALESCE(card_name, '')) LIKE '%smartemi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%smart emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%emi on card%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%emi on credit card%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%easy emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%flexi emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%instant emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%quick emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%convert to emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%emi%'
      )`;
    } else if (['loan_applications', 'loan', 'loans', 'all_loans', 'all_loan_applications'].includes(catLower)) {
      whereClause += ` AND (
        LOWER(COALESCE(category, '')) IN ('loc_eoc', 'loc', 'eoc', 'loan_on_credit_card', 'smart_emi', 'loan', 'loans', 'personal_loan', 'home_loan', 'business_loan', 'instant_loan', 'used_car_loan', 'education_loan')
        OR LOWER(COALESCE(card_name, '')) LIKE '%loan%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%smartemi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%smart emi%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%insta%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%instant%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%jumbo%'
        OR LOWER(COALESCE(card_name, '')) LIKE '%encash%'
      )`;
    } else if (catLower === 'credit_card') {
      whereClause += ` AND (
        (LOWER(COALESCE(category, '')) = 'credit_card' OR category IS NULL OR category = '')
        AND LOWER(COALESCE(category, '')) NOT IN ('loc_eoc', 'loc', 'eoc', 'loan_on_credit_card', 'smart_emi', 'loan', 'loans')
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%loan%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smart emi%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smartemi%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%emi%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%insta%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%jumbo%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%encash%'
      )`;
    } else if (catLower && catLower !== 'all') {
      whereClause += ` AND LOWER(category) = $${idx}`;
      values.push(catLower);
      idx++;
    } else {
      whereClause += ` AND COALESCE(LOWER(category), '') NOT IN ('loan_on_credit_card', 'smart_emi', 'loc_eoc', 'loc', 'eoc')
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%loan on credit card%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%loan on card%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smart emi%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%smartemi%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%insta%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%jumbo%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%loan%'
        AND LOWER(COALESCE(card_name, '')) NOT LIKE '%emi%'`;
    }

    if (search) {
      whereClause += ` AND (customer_name ILIKE $${idx} OR mobile ILIKE $${idx} OR bank_name ILIKE $${idx} OR card_name ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const baseTableSql = `(
      SELECT 
        id::text as id,
        customer_name,
        mobile,
        bank_name,
        card_name,
        COALESCE(
          CASE 
            WHEN LOWER(COALESCE(category, '')) IN ('smart_emi', 'eoc', 'smartemi', 'emi') THEN 'smart_emi'
            WHEN LOWER(COALESCE(category, '')) IN ('loan_on_credit_card', 'loc', 'loan_on_card') THEN 'loan_on_credit_card'
            WHEN LOWER(COALESCE(card_name, '')) LIKE '%smartemi%' 
              OR LOWER(COALESCE(card_name, '')) LIKE '%smart emi%' 
              OR LOWER(COALESCE(card_name, '')) LIKE '%emi on card%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%emi on credit card%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%easy emi%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%flexi emi%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%instant emi%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%quick emi%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%convert to emi%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%emi%' THEN 'smart_emi'
            WHEN LOWER(COALESCE(card_name, '')) LIKE '%loan%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%jumbo%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%insta%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%instant%'
              OR LOWER(COALESCE(card_name, '')) LIKE '%encash%' THEN 'loan_on_credit_card'
            ELSE category
          END,
          category,
          'credit_card'
        ) as category,
        status,
        created_at
      FROM direct_card_applications
      UNION ALL
      SELECT 
        a.id::text as id,
        COALESCE(NULLIF(a.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name,
        COALESCE(NULLIF(a.customer_mobile, ''), NULLIF(c.mobile, ''), '') as mobile,
        COALESCE(b.name, 'Partner Bank') as bank_name,
        COALESCE(p.name, 'LOC/EOC Loan') as card_name,
        COALESCE(
          CASE 
            WHEN LOWER(COALESCE(p.sub_category, '')) IN ('eoc', 'smart emi', 'smart_emi', 'emi', 'smartemi', 'emi on credit card', 'emi on card') THEN 'smart_emi'
            WHEN LOWER(COALESCE(p.sub_category, '')) IN ('loc', 'loan on credit card', 'loan_on_credit_card', 'loan on card', 'loan') THEN 'loan_on_credit_card'
            WHEN LOWER(COALESCE(to_jsonb(a)->>'sub_category', '')) IN ('eoc', 'smart emi', 'smart_emi', 'emi', 'smartemi') THEN 'smart_emi'
            WHEN LOWER(COALESCE(to_jsonb(a)->>'sub_category', '')) IN ('loc', 'loan on credit card', 'loan_on_credit_card') THEN 'loan_on_credit_card'
            WHEN LOWER(COALESCE(p.category::text, '')) IN ('smart_emi', 'eoc', 'smartemi', 'emi') THEN 'smart_emi'
            WHEN LOWER(COALESCE(p.category::text, '')) IN ('loan_on_credit_card', 'loc', 'loan_on_card') THEN 'loan_on_credit_card'
            WHEN LOWER(COALESCE(p.name, '')) LIKE '%smartemi%' 
              OR LOWER(COALESCE(p.name, '')) LIKE '%smart emi%' 
              OR LOWER(COALESCE(p.name, '')) LIKE '%emi on card%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%emi on credit card%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%easy emi%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%flexi emi%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%instant emi%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%quick emi%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%convert to emi%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%emi%' THEN 'smart_emi'
            WHEN LOWER(COALESCE(p.name, '')) LIKE '%loan%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%jumbo%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%insta%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%instant%'
              OR LOWER(COALESCE(p.name, '')) LIKE '%encash%' THEN 'loan_on_credit_card'
            ELSE p.category::text
          END,
          to_jsonb(a)->>'category', 
          'loc_eoc'
        ) as category,
        a.status::text as status,
        a.created_at
      FROM applications a
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN banks b ON b.id = COALESCE(a.bank_id, p.bank_id)
      LEFT JOIN customers c ON c.id = a.customer_id
      WHERE (
        p.category::text IN ('loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loc', 'eoc', 'loan', 'loans', 'personal_loan')
        OR p.sub_category IN ('loc', 'eoc', 'LOC', 'EOC', 'Loan on Credit Card', 'Smart EMI', 'EMI on Credit Card', 'loan_on_credit_card', 'smart_emi')
        OR to_jsonb(a)->>'category' IN ('loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loc', 'eoc', 'loan', 'loans')
        OR to_jsonb(a)->>'product_category' IN ('loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loc', 'eoc')
        OR LOWER(COALESCE(p.name, '')) LIKE '%loan%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%jumbo%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%insta%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%instant%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%smartemi%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%smart emi%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%emi%'
        OR LOWER(COALESCE(p.name, '')) LIKE '%encash%'
      )
      AND COALESCE(a.source, '') != 'direct_card_applications'
      AND NOT EXISTS (
        SELECT 1 FROM direct_card_applications d2 
        WHERE d2.mobile = COALESCE(NULLIF(a.customer_mobile, ''), c.mobile) 
        AND d2.created_at >= a.created_at - INTERVAL '1 hour'
        AND d2.created_at <= a.created_at + INTERVAL '1 hour'
      )
    ) direct_card_applications`;

    const countQuery = `
      SELECT COUNT(*) 
      FROM ${baseTableSql}
      ${whereClause}
    `;

    const dataQuery = `
      SELECT * 
      FROM ${baseTableSql}
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
      `UPDATE direct_card_applications SET status = $1 WHERE id::text = $2 RETURNING *`,
      [status.trim(), id]
    );

    if (!application) {
      const { rows: [mainApp] } = await query(
        `UPDATE applications SET status = $1, updated_at = NOW() WHERE id::text = $2 RETURNING *`,
        [status.trim(), id]
      );
      if (mainApp) {
        return success(res, mainApp, 'Application status updated successfully');
      }
      return error(res, 'Application lead not found', 404);
    }

    try {
      await query(
        `UPDATE applications SET status = $1, updated_at = NOW() 
         WHERE (customer_name = $2 AND customer_mobile = $3) OR id::text = $4`,
        [status.trim(), application.customer_name, application.mobile, id]
      );
    } catch (_) {}

    return success(res, application, 'Application status updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus
};
