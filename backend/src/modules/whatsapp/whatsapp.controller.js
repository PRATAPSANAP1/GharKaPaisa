const service = require('./whatsapp.service');
const templateService = require('./whatsapp.template.service');
const { query } = require('../../config/database');
const { success, error } = require('../../utils/response/response');
const logger = require('../../config/logger');

async function getDashboard(req, res, next) {
  try {
    const metrics = await service.getDashboardMetrics();
    return success(res, metrics, 'WhatsApp dashboard metrics retrieved');
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const user = req.user;
    const { search, status, category, page, limit } = req.query;
    const data = await service.getWhatsAppMessages(user, { search, status, category, page, limit });
    return success(res, data, 'WhatsApp messages retrieved');
  } catch (err) {
    next(err);
  }
}

async function getMessageById(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: [msg] } = await query(`
      SELECT 
        m.*,
        u.full_name AS sender_name,
        u.email AS sender_email,
        u.role AS sender_role,
        a.app_number AS application_number,
        (
          SELECT json_agg(json_build_object(
            'id', e.id,
            'event_type', e.event_type,
            'event_time', e.event_time,
            'created_at', e.created_at
          ) ORDER BY e.event_time ASC)
          FROM whatsapp_delivery_events e
          WHERE e.message_id = m.id
        ) AS delivery_events
      FROM whatsapp_messages m
      LEFT JOIN users u ON u.id = m.sender_user_id
      LEFT JOIN applications a ON a.id = m.application_id
      WHERE m.id = $1;
    `, [id]);

    if (!msg) {
      return error(res, 'WhatsApp message not found', 404);
    }
    return success(res, msg, 'Message details retrieved');
  } catch (err) {
    next(err);
  }
}

async function sendTemplate(req, res, next) {
  try {
    const sender = req.user;
    const {
      template_name,
      recipient_mobile,
      recipient_name,
      recipient_type,
      variables,
      application_id,
      lead_id,
      customer_id,
      partner_id,
      employee_id,
      document_id,
      document_name,
      document_url
    } = req.body;

    if (!template_name || !recipient_mobile) {
      return error(res, 'Template name and recipient mobile are required', 400);
    }

    const message = await service.sendTemplateMessage(sender, {
      templateName: template_name,
      recipientMobile: recipient_mobile,
      recipientName: recipient_name,
      recipientType: recipient_type || 'CUSTOMER',
      variables: variables || {},
      applicationId: application_id,
      leadId: lead_id,
      customerId: customer_id,
      partnerId: partner_id,
      employeeId: employee_id,
      documentId: document_id,
      documentName: document_name,
      documentUrl: document_url
    });

    return success(res, message, 'WhatsApp message sent successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function sendDocument(req, res, next) {
  try {
    const sender = req.user;
    const {
      recipient_mobile,
      recipient_name,
      recipient_type,
      document_url,
      document_name,
      caption,
      application_id,
      lead_id,
      customer_id
    } = req.body;

    if (!recipient_mobile || !document_url || !document_name) {
      return error(res, 'Recipient mobile, document URL, and document name are required', 400);
    }

    const message = await service.sendDocumentMessage(sender, {
      recipientMobile: recipient_mobile,
      recipientName: recipient_name,
      recipientType: recipient_type || 'CUSTOMER',
      documentUrl: document_url,
      documentName: document_name,
      caption: caption || '',
      applicationId: application_id,
      leadId: lead_id,
      customerId: customer_id
    });

    return success(res, message, 'WhatsApp document sent successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getTemplates(req, res, next) {
  try {
    const templates = await templateService.listTemplatesForUser(req.user);
    return success(res, templates, 'Templates retrieved');
  } catch (err) {
    next(err);
  }
}

async function createTemplate(req, res, next) {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return error(res, 'Access denied: Only Super Admin can create templates', 403);
    }

    const {
      template_name,
      template_category,
      language = 'en',
      header_type = 'NONE',
      header_content,
      body,
      footer,
      variables = [],
      sample_values = {},
      allowed_roles = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'PARTNER', 'TEAM_MEMBER'],
      allowed_designations = []
    } = req.body;

    if (!template_name || !template_category || !body) {
      return error(res, 'Template name, category, and body text are required', 400);
    }

    const cleanName = template_name.toLowerCase().trim().replace(/[\s-]+/g, '_');

    const sql = `
      INSERT INTO whatsapp_templates (
        template_name, template_category, language, header_type, header_content,
        body, footer, variables, sample_values, allowed_roles, allowed_designations,
        status, created_by, approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'APPROVED', $12, NOW())
      ON CONFLICT (template_name) DO UPDATE SET
        template_category = $2,
        header_type = $4,
        header_content = $5,
        body = $6,
        footer = $7,
        variables = $8,
        sample_values = $9,
        allowed_roles = $10,
        allowed_designations = $11,
        updated_at = NOW()
      RETURNING *;
    `;

    const { rows: [created] } = await query(sql, [
      cleanName,
      template_category,
      language,
      header_type,
      header_content || null,
      body,
      footer || 'GharKaPaisa',
      JSON.stringify(variables),
      JSON.stringify(sample_values),
      JSON.stringify(allowed_roles),
      JSON.stringify(allowed_designations),
      req.user.id
    ]);

    return success(res, created, 'Template created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateTemplateStatus(req, res, next) {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return error(res, 'Access denied', 403);
    }
    const { id } = req.params;
    const { status } = req.body;
    const { rows: [updated] } = await query(`
      UPDATE whatsapp_templates
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [id, status]);
    return success(res, updated, 'Template status updated');
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return error(res, 'Access denied', 403);
    }
    const config = await service.getWhatsAppConfig();
    return success(res, config, 'WhatsApp settings retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return error(res, 'Access denied: Only Super Admin can modify WhatsApp settings', 403);
    }

    const {
      business_name,
      phone_number,
      phone_number_id,
      waba_id,
      meta_app_id,
      webhook_verify_token,
      mock_mode
    } = req.body;

    const { rows: [updated] } = await query(`
      UPDATE whatsapp_settings
      SET 
        business_name = COALESCE($1, business_name),
        phone_number = COALESCE($2, phone_number),
        phone_number_id = COALESCE($3, phone_number_id),
        waba_id = COALESCE($4, waba_id),
        meta_app_id = COALESCE($5, meta_app_id),
        webhook_verify_token = COALESCE($6, webhook_verify_token),
        mock_mode = COALESCE($7, mock_mode),
        updated_by = $8,
        updated_at = NOW()
      WHERE id = (SELECT id FROM whatsapp_settings LIMIT 1)
      RETURNING *;
    `, [
      business_name,
      phone_number,
      phone_number_id,
      waba_id,
      meta_app_id,
      webhook_verify_token,
      mock_mode,
      req.user.id
    ]);

    return success(res, updated, 'WhatsApp settings updated successfully');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/whatsapp/designation-report
 * Compute periodic admin designation report (Approved Cards, KYC Queue, Employee Performance, etc.)
 * and resolve matching target staff phone numbers for WhatsApp dispatch.
 */
async function getDesignationReport(req, res, next) {
  try {
    const {
      report_type = 'APPROVED_CARDS',
      period = 'THIS_MONTH',
      start_date,
      end_date,
      designation = 'ALL'
    } = req.query;

    const { getKolkataTimeInfo } = require('../auth/workingHours.service');
    const { dateStr } = getKolkataTimeInfo();

    let startDate = start_date;
    let endDate = end_date;

    if (!startDate || !endDate) {
      const now = new Date();
      if (period === 'TODAY') {
        startDate = dateStr;
        endDate = dateStr;
      } else if (period === 'YESTERDAY') {
        const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = y.toISOString().slice(0, 10);
        endDate = startDate;
      } else if (period === 'THIS_WEEK') {
        const dayOfWeek = now.getDay() || 7;
        const monday = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
        startDate = monday.toISOString().slice(0, 10);
        endDate = dateStr;
      } else {
        startDate = `${dateStr.slice(0, 7)}-01`;
        endDate = dateStr;
      }
    }

    let metrics = {};
    if (report_type === 'APPROVED_CARDS') {
      const { rows } = await query(`
        SELECT 
          COUNT(*)::int as total_applications,
          COUNT(CASE WHEN UPPER(status::text) IN ('APPROVED', 'CARD_ISSUED', 'DISBURSED', 'COMPLETED') THEN 1 END)::int as approved_cards,
          COUNT(CASE WHEN UPPER(status::text) IN ('REJECTED', 'DECLINED') THEN 1 END)::int as rejected_cards,
          COUNT(CASE WHEN UPPER(status::text) NOT IN ('APPROVED', 'CARD_ISSUED', 'DISBURSED', 'COMPLETED', 'REJECTED', 'DECLINED') THEN 1 END)::int as in_process_cards,
          COALESCE(SUM(CASE WHEN UPPER(status::text) IN ('APPROVED', 'CARD_ISSUED', 'DISBURSED', 'COMPLETED') THEN COALESCE(approved_amount, loan_amount, 0) ELSE 0 END), 0)::numeric as approved_amount_sum
        FROM applications
        WHERE created_at::date >= $1::date AND created_at::date <= $2::date
      `, [startDate, endDate]);
      metrics = rows[0] || {};
    } else if (report_type === 'KYC_OPERATOR_SUMMARY') {
      const { rows } = await query(`
        SELECT 
          COUNT(*)::int as total_applications,
          COUNT(CASE WHEN (to_jsonb(a)->>'kyc_stage') IS NOT NULL AND (to_jsonb(a)->>'kyc_stage') != '' THEN 1 END)::int as kyc_processed,
          COUNT(CASE WHEN UPPER(status::text) LIKE '%KYC%' OR UPPER(status::text) LIKE '%VERIF%' THEN 1 END)::int as pending_kyc
        FROM applications a
        WHERE created_at::date >= $1::date AND created_at::date <= $2::date
      `, [startDate, endDate]);
      metrics = rows[0] || {};
    } else if (report_type === 'PAN_CHECKER_SUMMARY') {
      const { rows } = await query(`
        SELECT 
          COUNT(*)::int as total_checked,
          COUNT(CASE WHEN (to_jsonb(a)->>'kyc_stage') = 'PAN_VERIFIED' THEN 1 END)::int as pan_verified,
          COUNT(CASE WHEN (to_jsonb(a)->>'kyc_stage') = 'PAN_REJECTED' THEN 1 END)::int as pan_rejected
        FROM applications a
        WHERE created_at::date >= $1::date AND created_at::date <= $2::date
      `, [startDate, endDate]);
      metrics = rows[0] || {};
    } else if (report_type === 'QD_FINAL_STATUS_SUMMARY') {
      const { rows } = await query(`
        SELECT 
          COUNT(*)::int as total_processed,
          COUNT(CASE WHEN UPPER(status::text) IN ('APPROVED', 'FINAL_APPROVED') THEN 1 END)::int as final_approved,
          COUNT(CASE WHEN UPPER(status::text) IN ('REJECTED', 'FINAL_REJECTED') THEN 1 END)::int as final_rejected
        FROM applications a
        WHERE created_at::date >= $1::date AND created_at::date <= $2::date
      `, [startDate, endDate]);
      metrics = rows[0] || {};
    } else {
      const { rows } = await query(`
        SELECT 
          COUNT(*)::int as total_applications,
          COUNT(CASE WHEN UPPER(status::text) IN ('APPROVED', 'CARD_ISSUED', 'DISBURSED', 'COMPLETED') THEN 1 END)::int as approved_count,
          COUNT(CASE WHEN UPPER(status::text) IN ('REJECTED', 'DECLINED') THEN 1 END)::int as rejected_count,
          COALESCE(SUM(loan_amount), 0)::numeric as total_loan_amount
        FROM applications
        WHERE created_at::date >= $1::date AND created_at::date <= $2::date
      `, [startDate, endDate]);
      metrics = rows[0] || {};
    }

    let targetStaff = [];
    if (designation && designation !== 'ALL') {
      const { rows } = await query(`
        SELECT DISTINCT u.id, u.full_name, u.mobile, u.email, u.designation, u.role
        FROM users u
        LEFT JOIN employees e ON e.user_id = u.id OR e.employee_id = u.employee_id
        WHERE u.is_active = true
          AND (
            UPPER(COALESCE(u.designation, '')) = UPPER($1)
            OR UPPER(COALESCE(e.designation, '')) = UPPER($1)
            OR REPLACE(UPPER(COALESCE(u.designation, '')), '_', ' ') = UPPER(REPLACE($1, '_', ' '))
            OR REPLACE(UPPER(COALESCE(e.designation, '')), '_', ' ') = UPPER(REPLACE($1, '_', ' '))
          )
        ORDER BY u.full_name ASC
      `, [designation]);
      targetStaff = rows;
    } else {
      const { rows } = await query(`
        SELECT DISTINCT u.id, u.full_name, u.mobile, u.email, u.designation, u.role
        FROM users u
        WHERE u.is_active = true
          AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        ORDER BY u.full_name ASC
      `);
      targetStaff = rows;
    }

    const repTitleMap = {
      APPROVED_CARDS: 'Credit Cards Approved & Dispatched Report',
      EMPLOYEE_PERFORMANCE: 'Employee & Operations Performance Report',
      KYC_OPERATOR_SUMMARY: 'KYC Operator Queue Summary',
      PAN_CHECKER_SUMMARY: 'PAN Checker & Verification Summary',
      QD_FINAL_STATUS_SUMMARY: 'QD & Final Status Approval Report',
      APPLICATIONS_OVERVIEW: 'GharKaPaisa Applications Overview'
    };

    const title = repTitleMap[report_type] || 'GharKaPaisa Operations Report';
    const totalApps = metrics.total_applications || metrics.total_processed || metrics.total_checked || 0;
    const approvedVal = metrics.approved_cards || metrics.final_approved || metrics.approved_count || metrics.pan_verified || 0;
    const totalAmt = metrics.approved_amount_sum || metrics.total_loan_amount || 0;

    const summaryText = `*${title}*\nPeriod: ${startDate} to ${endDate}\nTarget Role: ${designation || 'All Admins'}\n\n• Total Volume: ${totalApps}\n• Approved / Cleared: ${approvedVal}\n• Total Amount: ₹${Number(totalAmt).toLocaleString('en-IN')}\n\nGenerated by GharKaPaisa Central WhatsApp Service.`;

    return success(res, {
      reportType: report_type,
      period,
      startDate,
      endDate,
      designation,
      metrics,
      targetStaff,
      summaryText
    }, 'Designation report metrics retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/whatsapp/send-designation-report
 * Dispatch report summary via WhatsApp to all resolved staff members for a designation or custom mobile.
 */
async function sendDesignationReport(req, res, next) {
  try {
    const sender = req.user;
    const {
      report_type = 'APPROVED_CARDS',
      period = 'THIS_MONTH',
      start_date,
      end_date,
      designation = 'ALL',
      custom_mobile,
      custom_name,
      summary_text,
      document_url
    } = req.body;

    let recipients = [];

    if (custom_mobile) {
      recipients.push({
        name: custom_name || 'Designated Recipient',
        mobile: custom_mobile
      });
    } else {
      const { rows } = await query(`
        SELECT DISTINCT u.id, u.full_name, u.mobile, u.email, u.designation, u.role
        FROM users u
        LEFT JOIN employees e ON e.user_id = u.id OR e.employee_id = u.employee_id
        WHERE u.is_active = true
          AND u.mobile IS NOT NULL AND LENGTH(TRIM(u.mobile)) >= 10
          AND (
            $1 = 'ALL'
            OR UPPER(COALESCE(u.designation, '')) = UPPER($1)
            OR UPPER(COALESCE(e.designation, '')) = UPPER($1)
            OR REPLACE(UPPER(COALESCE(u.designation, '')), '_', ' ') = UPPER(REPLACE($1, '_', ' '))
            OR REPLACE(UPPER(COALESCE(e.designation, '')), '_', ' ') = UPPER(REPLACE($1, '_', ' '))
          )
      `, [designation || 'ALL']);
      
      recipients = rows.map(r => ({ name: r.full_name || r.email, mobile: r.mobile }));
    }

    if (recipients.length === 0) {
      return error(res, 'No active staff members found with a valid mobile number for this designation.', 400);
    }

    const dispatchResults = [];
    for (const rec of recipients) {
      try {
        if (document_url) {
          const result = await service.sendDocumentMessage(sender, {
            recipientMobile: rec.mobile,
            recipientName: rec.name,
            recipientType: 'EMPLOYEE',
            documentUrl: document_url,
            documentName: `GharKaPaisa_${report_type}_Report.pdf`,
            caption: summary_text || `GharKaPaisa ${report_type} Report`
          });
          dispatchResults.push({ recipient: rec, success: true, id: result.id });
        } else {
          const result = await service.sendTemplateMessage(sender, {
            templateName: 'kyc_status_update',
            recipientMobile: rec.mobile,
            recipientName: rec.name,
            recipientType: 'EMPLOYEE',
            variables: {
              customer_name: rec.name,
              application_id: `${report_type}_${period}`,
              status: 'Report Ready',
              remarks: summary_text || 'Periodic Operations Summary'
            }
          });
          dispatchResults.push({ recipient: rec, success: true, id: result.id });
        }
      } catch (err) {
        logger.error(`Failed report dispatch to ${rec.mobile}:`, err.message);
        dispatchResults.push({ recipient: rec, success: false, error: err.message });
      }
    }

    const successCount = dispatchResults.filter(r => r.success).length;

    return success(res, {
      totalRecipients: recipients.length,
      successCount,
      details: dispatchResults
    }, `Report dispatched to ${successCount} of ${recipients.length} recipients successfully.`);
  } catch (err) {
    next(err);
  }
}

async function searchApplications(req, res, next) {
  try {
    const term = (req.query.q || req.query.search || '').trim();
    const limit = parseInt(req.query.limit || 15);

    const sql = `
      SELECT 
        a.id,
        a.app_number,
        a.status,
        COALESCE(to_jsonb(a)->>'kyc_stage', 'PAN Verification') as kyc_stage,
        COALESCE(to_jsonb(a)->>'bank_app_number', to_jsonb(a)->>'bank_application_number', 'XXXXXXXX') as bank_app_number,
        COALESCE(a.customer_name, c.full_name, 'Customer') as customer_name,
        COALESCE(a.customer_mobile, c.mobile, '') as customer_mobile,
        c.pan_number,
        p.name as product_name,
        b.name as bank_name
      FROM applications a
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN banks b ON b.id = a.bank_id OR b.id = p.bank_id
      LEFT JOIN customers c ON c.id = a.customer_id
      WHERE $1 = '' OR (
        a.app_number ILIKE '%' || $1 || '%' OR
        a.customer_name ILIKE '%' || $1 || '%' OR
        a.customer_mobile ILIKE '%' || $1 || '%' OR
        c.full_name ILIKE '%' || $1 || '%' OR
        c.mobile ILIKE '%' || $1 || '%' OR
        c.pan_number ILIKE '%' || $1 || '%' OR
        (to_jsonb(a)->>'bank_app_number') ILIKE '%' || $1 || '%' OR
        a.id::text ILIKE '%' || $1 || '%'
      )
      ORDER BY a.created_at DESC
      LIMIT $2;
    `;

    const { rows } = await query(sql, [term, limit]);

    const formatted = rows.map(app => {
      let mob = (app.customer_mobile || '').replace(/\D/g, '');
      let mobileMasked = mob ? (mob.length >= 10 ? `+91 ${mob.slice(0, 4)}******` : `+91 ${mob}`) : 'N/A';
      
      let panMasked = 'ABCD******';
      if (app.pan_number && String(app.pan_number).trim().length >= 5) {
        panMasked = String(app.pan_number).trim().toUpperCase().slice(0, 4) + '******';
      }

      return {
        id: app.id,
        app_number: app.app_number || app.id,
        customer_name: app.customer_name,
        customer_mobile: app.customer_mobile,
        customer_mobile_masked: mobileMasked,
        pan_masked: panMasked,
        bank_name: app.bank_name || 'HDFC Bank',
        product_name: app.product_name || 'Credit Card',
        status: app.status || 'KYC Pending',
        kyc_stage: app.kyc_stage || 'PAN Verification',
        bank_app_number: app.bank_app_number || 'XXXXXXXX'
      };
    });

    return success(res, formatted, 'Applications search matches retrieved');
  } catch (err) {
    next(err);
  }
}

async function searchStaff(req, res, next) {
  try {
    const term = (req.query.q || req.query.search || '').trim();
    const limit = parseInt(req.query.limit || 15);

    const sql = `
      SELECT 
        e.id,
        COALESCE(e.employee_id, u.employee_id, 'YOH-TC0042') as staff_code,
        COALESCE(e.full_name, u.full_name, 'Sharad Yohesa') as full_name,
        COALESCE(e.designation, u.designation, 'Team Coordinator') as designation,
        COALESCE(u.role, 'EMPLOYEE') as role,
        COALESCE(e.department, 'Operations') as department,
        COALESCE(e.branch_location, 'Pune') as branch,
        COALESCE(u.mobile, e.mobile, '') as mobile,
        COALESCE(u.email, e.email, '') as email
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id OR u.employee_id = e.employee_id
      WHERE (UPPER(COALESCE(e.status::text, 'ACTIVE')) IN ('ACTIVE', 'ENABLED', 'TRUE') OR e.status IS NULL)
        AND ($1 = '' OR (
          e.full_name ILIKE '%' || $1 || '%' OR
          u.full_name ILIKE '%' || $1 || '%' OR
          e.employee_id ILIKE '%' || $1 || '%' OR
          u.employee_id ILIKE '%' || $1 || '%' OR
          e.designation ILIKE '%' || $1 || '%' OR
          COALESCE(u.mobile, e.mobile) ILIKE '%' || $1 || '%' OR
          COALESCE(u.email, e.email) ILIKE '%' || $1 || '%'
        ))
      ORDER BY e.full_name ASC
      LIMIT $2;
    `;

    const { rows } = await query(sql, [term, limit]);

    const formatted = rows.map(s => {
      let mob = (s.mobile || '').replace(/\D/g, '');
      let mobileMasked = mob ? (mob.length >= 10 ? `+91 ${mob.slice(0, 2)}******${mob.slice(-2)}` : `+91 ${mob}`) : 'N/A';
      return {
        id: s.id,
        full_name: s.full_name,
        staff_code: s.staff_code,
        designation: s.designation,
        role: s.role,
        mobile: s.mobile,
        mobile_masked: mobileMasked,
        email: s.email,
        branch: s.branch,
        department: s.department
      };
    });

    return success(res, formatted, 'Staff search matches retrieved');
  } catch (err) {
    next(err);
  }
}

async function searchProducts(req, res, next) {
  try {
    const term = (req.query.q || req.query.search || '').trim();
    const limit = parseInt(req.query.limit || 50);

    const sql = `
      SELECT 
        p.id,
        p.name as product_name,
        p.category,
        p.apply_url,
        COALESCE(p.commission_amount, p.commission_value, 0) as commission_amount,
        p.description,
        b.name as bank_name,
        b.logo_url as bank_logo
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE (p.is_active = true OR p.is_active IS NULL)
        AND ($1 = '' OR (
          p.name ILIKE '%' || $1 || '%' OR
          b.name ILIKE '%' || $1 || '%' OR
          p.category ILIKE '%' || $1 || '%'
        ))
      ORDER BY p.name ASC
      LIMIT $2;
    `;

    const { rows } = await query(sql, [term, limit]);
    return success(res, rows, 'Products search results retrieved');
  } catch (err) {
    next(err);
  }
}

async function getApplicationRecipientContext(req, res, next) {
  try {
    const { applicationId } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId);

    const sql = `
      SELECT 
        a.id,
        a.app_number,
        a.status,
        COALESCE(to_jsonb(a)->>'kyc_stage', 'PAN Verification') as kyc_stage,
        COALESCE(to_jsonb(a)->>'bank_app_number', to_jsonb(a)->>'bank_application_number', 'XXXXXXXX') as bank_app_number,
        a.created_at,
        COALESCE(a.customer_name, c.full_name, 'Customer') as customer_name,
        COALESCE(a.customer_mobile, c.mobile, '') as customer_mobile,
        c.id as customer_id,
        c.email as customer_email,
        c.pan_number,
        p.id as product_id,
        p.name as product_name,
        b.id as bank_id,
        b.name as bank_name
      FROM applications a
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN banks b ON b.id = a.bank_id OR b.id = p.bank_id
      LEFT JOIN customers c ON c.id = a.customer_id
      WHERE ${isUuid ? 'a.id = $1 OR a.app_number = $1' : 'a.app_number = $1 OR a.id::text = $1'}
      LIMIT 1;
    `;

    const { rows } = await query(sql, [applicationId]);
    if (rows.length === 0) {
      return error(res, 'Application record not found', 404);
    }

    const app = rows[0];
    let mob = (app.customer_mobile || '').replace(/\D/g, '');
    let mobileMasked = mob ? (mob.length >= 10 ? `+91 ${mob.slice(0, 4)}******` : `+91 ${mob}`) : 'N/A';

    let panMasked = 'ABCD******';
    if (app.pan_number && String(app.pan_number).trim().length >= 5) {
      panMasked = String(app.pan_number).trim().toUpperCase().slice(0, 4) + '******';
    }

    const responsePayload = {
      type: 'CUSTOMER',
      application: {
        id: app.id,
        application_number: app.app_number || app.id,
        bank_application_number: app.bank_app_number,
        status: app.status || 'KYC Pending',
        kyc_stage: app.kyc_stage,
        created_at: app.created_at
      },
      customer: {
        id: app.customer_id,
        name: app.customer_name,
        mobile: app.customer_mobile,
        mobile_masked: mobileMasked,
        pan_masked: panMasked,
        email: app.customer_email
      },
      bank: {
        id: app.bank_id,
        name: app.bank_name || 'HDFC Bank'
      },
      product: {
        id: app.product_id,
        name: app.product_name || 'Credit Card'
      },
      template_variables: {
        customer_name: app.customer_name,
        pan_masked: panMasked,
        application_id: app.app_number || app.id,
        bank_name: app.bank_name || 'HDFC Bank',
        product_name: app.product_name || 'Credit Card',
        status: app.status || 'KYC Pending',
        bank_application_number: app.bank_app_number
      }
    };

    return success(res, responsePayload, 'Application context retrieved');
  } catch (err) {
    next(err);
  }
}

async function getStaffRecipientContext(req, res, next) {
  try {
    const { staffId } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId);

    const sql = `
      SELECT 
        e.id,
        COALESCE(e.employee_id, u.employee_id, 'YOH-TC0042') as staff_code,
        COALESCE(e.full_name, u.full_name, 'Sharad Yohesa') as full_name,
        COALESCE(e.designation, u.designation, 'Team Coordinator') as designation,
        COALESCE(u.role, 'EMPLOYEE') as role,
        COALESCE(e.department, 'Operations') as department,
        COALESCE(e.branch_location, 'Pune') as branch,
        COALESCE(u.mobile, e.mobile, '') as mobile,
        COALESCE(u.email, e.email, '') as email
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id OR u.employee_id = e.employee_id
      WHERE ${isUuid ? 'e.id = $1 OR e.employee_id = $1' : 'e.employee_id = $1 OR e.id::text = $1 OR e.full_name ILIKE $1'}
      LIMIT 1;
    `;

    const { rows } = await query(sql, [staffId]);
    if (rows.length === 0) {
      return error(res, 'Staff member record not found', 404);
    }

    const stf = rows[0];
    let mob = (stf.mobile || '').replace(/\D/g, '');
    let mobileMasked = mob ? (mob.length >= 10 ? `+91 ${mob.slice(0, 2)}******${mob.slice(-2)}` : `+91 ${mob}`) : 'N/A';

    const responsePayload = {
      type: 'STAFF',
      staff: {
        id: stf.id,
        name: stf.full_name,
        staff_code: stf.staff_code,
        role: stf.role,
        designation: stf.designation,
        mobile: stf.mobile,
        mobile_masked: mobileMasked,
        email: stf.email,
        branch: stf.branch,
        department: stf.department
      },
      template_variables: {
        customer_name: stf.full_name,
        staff_name: stf.full_name,
        staff_code: stf.staff_code,
        designation: stf.designation,
        department: stf.department,
        branch: stf.branch
      }
    };

    return success(res, responsePayload, 'Staff context retrieved');
  } catch (err) {
    next(err);
  }
}

async function getProductContext(req, res, next) {
  try {
    const { productId } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

    const sql = `
      SELECT 
        p.id,
        p.name as product_name,
        p.category,
        p.description,
        p.joining_fee,
        p.processing_fee,
        p.annual_fee,
        p.apply_url,
        p.features,
        p.eligibility,
        p.documents_required,
        COALESCE(p.commission_amount, p.commission_value, 0) as commission_amount,
        b.id as bank_id,
        b.name as bank_name
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE ${isUuid ? 'p.id = $1' : 'LOWER(p.slug) = LOWER($1) OR p.name ILIKE $1'}
      LIMIT 1;
    `;

    const { rows } = await query(sql, [productId]);
    if (rows.length === 0) {
      return error(res, 'Product record not found', 404);
    }

    const prod = rows[0];

    const responsePayload = {
      id: prod.id,
      product_name: prod.product_name,
      bank_id: prod.bank_id,
      bank_name: prod.bank_name || 'HDFC Bank',
      category: prod.category || 'Credit Card',
      interest_rate: '12.5%',
      processing_fee: prod.processing_fee || '₹999',
      joining_fee: prod.joining_fee || prod.annual_fee || '₹500',
      loan_amount: '₹5,00,000',
      tenure: '60 months',
      eligibility: prod.eligibility || 'Salary > ₹25,000 / month, Age 21-60',
      documents_required: prod.documents_required || 'PAN Card, Aadhaar Card, 3 Months Bank Statement',
      apply_url: prod.apply_url || 'https://gharkapaisa.in/apply',
      brochure_url: prod.apply_url || 'https://gharkapaisa.in/brochure.pdf',
      template_variables: {
        product_name: prod.product_name,
        bank_name: prod.bank_name || 'HDFC Bank',
        interest_rate: '12.5%',
        processing_fee: prod.processing_fee || '₹999',
        loan_amount: '₹5,00,000',
        tenure: '60 months',
        eligibility: typeof prod.eligibility === 'string' ? prod.eligibility : 'Salary > ₹25,000 / month, Age 21-60',
        documents_required: typeof prod.documents_required === 'string' ? prod.documents_required : 'PAN Card, Aadhaar Card, 3 Months Bank Statement',
        product_link: prod.apply_url || 'https://gharkapaisa.in/apply'
      }
    };

    return success(res, responsePayload, 'Product context retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getMessages,
  getMessageById,
  sendTemplate,
  sendDocument,
  getTemplates,
  createTemplate,
  updateTemplateStatus,
  getSettings,
  updateSettings,
  getDesignationReport,
  sendDesignationReport,
  searchApplications,
  searchStaff,
  searchProducts,
  getApplicationRecipientContext,
  getStaffRecipientContext,
  getProductContext
};

