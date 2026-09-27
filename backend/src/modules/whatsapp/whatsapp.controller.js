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
  updateSettings
};
