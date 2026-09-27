const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { formatIndianMobile, interpolateTemplate, getTemplateByNameOrId } = require('./whatsapp.template.service');
const { canUserSendWhatsApp, canDesignationSendCategory, validateDataScope } = require('./whatsapp.permission.service');

/**
 * Fetch WhatsApp Configuration
 */
async function getWhatsAppConfig() {
  let dbConfig = {};
  try {
    const { rows } = await query(`SELECT * FROM whatsapp_settings LIMIT 1`);
    dbConfig = rows[0] || {};
  } catch (err) {
    logger.warn('[WhatsApp Service] whatsapp_settings query note:', err.message);
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || dbConfig.phone_number_id || null;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || dbConfig.waba_id || null;
  const appId = process.env.WHATSAPP_APP_ID || process.env.META_APP_ID || dbConfig.meta_app_id || null;
  const apiToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN || dbConfig.access_token || null;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || dbConfig.webhook_verify_token || 'gharkapaisa_meta_webhook_secret_2026';
  const apiVersion = process.env.WHATSAPP_API_VERSION || process.env.META_API_VERSION || 'v19.0';
  const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER || process.env.META_PHONE_NUMBER || dbConfig.phone_number || '+91 92703 19438';

  return {
    businessName: process.env.META_BUSINESS_NAME || dbConfig.business_name || 'GharKaPaisa',
    phoneNumber,
    phoneNumberId,
    wabaId,
    appId,
    apiToken,
    verifyToken,
    apiVersion,
    isLive: Boolean(apiToken) && Boolean(phoneNumberId),
    mockMode: !Boolean(apiToken) || !Boolean(phoneNumberId),
    lastWebhookAt: dbConfig.last_webhook_at
  };
}

/**
 * Dispatch message to Meta WhatsApp Cloud API or simulate via Mock Engine
 */
async function dispatchMetaMessage({ recipientMobile, messagePayload }) {
  const config = await getWhatsAppConfig();

  if (config.isLive && config.apiToken && config.phoneNumberId) {
    try {
      const apiVersion = config.apiVersion || 'v19.0';
      const url = `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}/messages`;
      const res = await axios.post(url, messagePayload, {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      const metaMessageId = res.data?.messages?.[0]?.id || `wamid.${uuidv4()}`;
      return { success: true, metaMessageId, responseData: res.data };
    } catch (err) {
      logger.error('[WhatsApp Service] Meta API dispatch error:', err.response?.data || err.message);
      return {
        success: false,
        error: err.response?.data?.error?.message || err.message,
        metaMessageId: null,
        responseData: err.response?.data || null
      };
    }
  }

  // Mock Engine Simulation for safe development & testing
  const mockMetaId = `wamid.mock.${Date.now()}.${Math.floor(Math.random() * 100000)}`;
  logger.info(`[WhatsApp Mock Engine] Simulating message dispatch to ${recipientMobile} (ID: ${mockMetaId})`);
  return {
    success: true,
    metaMessageId: mockMetaId,
    responseData: { messaging_product: 'whatsapp', contacts: [{ input: recipientMobile, wa_id: recipientMobile.replace(/\D/g, '') }], messages: [{ id: mockMetaId }] }
  };
}

/**
 * Send WhatsApp Template Message
 */
async function sendTemplateMessage(senderUser, {
  templateName,
  recipientMobile,
  recipientName,
  recipientType = 'CUSTOMER',
  variables = {},
  applicationId = null,
  leadId = null,
  customerId = null,
  partnerId = null,
  employeeId = null,
  documentId = null,
  documentName = null,
  documentUrl = null
}) {
  if (!canUserSendWhatsApp(senderUser)) {
    throw new Error('Access denied: You do not have permission to send WhatsApp messages.');
  }

  const template = await getTemplateByNameOrId(templateName);
  if (!template) {
    throw new Error(`Template "${templateName}" not found or not approved.`);
  }

  // RBAC Category check
  const isCategoryAllowed = canDesignationSendCategory(senderUser.designation, senderUser.role, template.template_category);
  if (!isCategoryAllowed) {
    throw new Error(`Access denied: Your designation (${senderUser.designation || senderUser.role}) cannot send "${template.template_category}" templates.`);
  }

  // Scope validation
  const isScopeValid = await validateDataScope(senderUser, { customerId, applicationId, leadId, recipientMobile });
  if (!isScopeValid) {
    throw new Error('Access denied: You do not have permission to communicate with this recipient record.');
  }

  const formattedMobile = formatIndianMobile(recipientMobile);
  if (!formattedMobile || formattedMobile.length < 10) {
    throw new Error('Invalid Indian mobile number provided.');
  }

  // Populate dynamic variables into message body
  const renderedText = interpolateTemplate(template.body, {
    ...variables,
    customer_name: recipientName || variables.customer_name || 'Customer'
  });

  const messageUuid = `WA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

  // Meta Cloud API Payload structure
  const metaPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedMobile.replace('+', ''),
    type: 'text',
    text: { preview_url: true, body: renderedText }
  };

  // Dispatch
  const dispatchResult = await dispatchMetaMessage({ recipientMobile: formattedMobile, messagePayload: metaPayload });

  const status = dispatchResult.success ? 'SENT' : 'FAILED';
  const failureReason = dispatchResult.error || null;
  const metaMessageId = dispatchResult.metaMessageId || null;

  // Record in PostgreSQL `whatsapp_messages`
  const insertSql = `
    INSERT INTO whatsapp_messages (
      message_uuid, sender_user_id, sender_role, sender_designation,
      recipient_type, recipient_name, recipient_mobile,
      customer_id, partner_id, employee_id, application_id, lead_id,
      message_type, template_id, template_name,
      document_id, document_name, document_url, document_type,
      message_body, template_variables, meta_message_id,
      status, failure_reason, meta_response,
      sent_at, delivered_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21, $22,
      $23, $24, $25,
      NOW(), NULL
    ) RETURNING *;
  `;

  const { rows: [createdMsg] } = await query(insertSql, [
    messageUuid,
    senderUser.id,
    senderUser.role,
    senderUser.designation || null,
    recipientType,
    recipientName || 'Customer',
    formattedMobile,
    customerId || null,
    partnerId || null,
    employeeId || null,
    applicationId || null,
    leadId || null,
    documentUrl ? 'DOCUMENT' : 'TEMPLATE',
    template.id,
    template.template_name,
    documentId || null,
    documentName || null,
    documentUrl || null,
    documentUrl ? 'PDF' : null,
    renderedText,
    JSON.stringify(variables),
    metaMessageId,
    status,
    failureReason,
    JSON.stringify(dispatchResult.responseData || {})
  ]);

  // Log delivery event
  if (metaMessageId) {
    await query(`
      INSERT INTO whatsapp_delivery_events (message_id, meta_message_id, event_type, event_payload)
      VALUES ($1, $2, $3, $4);
    `, [createdMsg.id, metaMessageId, status, JSON.stringify(dispatchResult.responseData || {})]);
  }

  return createdMsg;
}

/**
 * Send WhatsApp Document Message (e.g. Sanction Letter, Form PDF)
 */
async function sendDocumentMessage(senderUser, {
  recipientMobile,
  recipientName,
  recipientType = 'CUSTOMER',
  documentUrl,
  documentName,
  caption = '',
  applicationId = null,
  leadId = null,
  customerId = null
}) {
  return await sendTemplateMessage(senderUser, {
    templateName: 'document_shared',
    recipientMobile,
    recipientName,
    recipientType,
    variables: {
      customer_name: recipientName || 'Customer',
      document_type: documentName || 'Document',
      application_id: applicationId || 'N/A'
    },
    applicationId,
    leadId,
    customerId,
    documentName,
    documentUrl
  });
}

/**
 * Fetch WhatsApp Audit Messages with advanced search and filters
 */
async function getWhatsAppMessages(user, { search = '', status = 'ALL', category = 'ALL', page = 1, limit = 50 }) {
  const role = (user?.role || '').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const desig = (user?.designation || '').toUpperCase();

  const conditions = [];
  const params = [];

  if (!isSuperAdmin && !desig.includes('OPERATIONAL_HEAD')) {
    // Regular users see only their own sent messages or assigned scope
    params.push(user.id);
    conditions.push(`m.sender_user_id = $${params.length}`);
  }

  if (status && status !== 'ALL') {
    params.push(status.toUpperCase());
    conditions.push(`m.status = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const sIdx = params.length;
    conditions.push(`(
      m.message_uuid ILIKE $${sIdx} OR 
      m.recipient_name ILIKE $${sIdx} OR 
      m.recipient_mobile ILIKE $${sIdx} OR 
      m.template_name ILIKE $${sIdx} OR 
      m.message_body ILIKE $${sIdx} OR
      m.meta_message_id ILIKE $${sIdx}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  const countSql = `SELECT COUNT(*)::INT AS total FROM whatsapp_messages m ${whereClause};`;
  const { rows: [countRes] } = await query(countSql, params);

  const sql = `
    SELECT 
      m.*,
      u.full_name AS sender_name,
      u.email AS sender_email,
      a.app_number AS application_number
    FROM whatsapp_messages m
    LEFT JOIN users u ON u.id = m.sender_user_id
    LEFT JOIN applications a ON a.id = m.application_id
    ${whereClause}
    ORDER BY m.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  params.push(parseInt(limit, 10), offset);
  const { rows } = await query(sql, params);

  return {
    messages: rows,
    pagination: {
      total: countRes?.total || 0,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil((countRes?.total || 0) / parseInt(limit, 10))
    }
  };
}

/**
 * Fetch WhatsApp Dashboard Metrics
 */
async function getDashboardMetrics() {
  const { rows: [stats] } = await query(`
    SELECT 
      COUNT(*)::INT AS total_messages,
      COUNT(*) FILTER (WHERE status = 'SENT')::INT AS sent_count,
      COUNT(*) FILTER (WHERE status = 'DELIVERED')::INT AS delivered_count,
      COUNT(*) FILTER (WHERE status = 'READ')::INT AS read_count,
      COUNT(*) FILTER (WHERE status = 'FAILED')::INT AS failed_count,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::INT AS today_total,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'SENT')::INT AS today_sent,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'DELIVERED')::INT AS today_delivered,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'READ')::INT AS today_read,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'FAILED')::INT AS today_failed,
      COUNT(*) FILTER (WHERE document_url IS NOT NULL AND created_at >= CURRENT_DATE)::INT AS today_documents_sent,
      COUNT(*) FILTER (WHERE document_url IS NOT NULL)::INT AS total_documents_sent
    FROM whatsapp_messages;
  `);

  const { rows: [tplStats] } = await query(`
    SELECT 
      COUNT(*)::INT AS total_templates,
      COUNT(*) FILTER (WHERE status = 'APPROVED')::INT AS approved_templates,
      COUNT(*) FILTER (WHERE status = 'PENDING')::INT AS pending_templates,
      COUNT(*) FILTER (WHERE status = 'REJECTED')::INT AS rejected_templates
    FROM whatsapp_templates;
  `);

  const config = await getWhatsAppConfig();

  return {
    today: {
      sent: stats?.today_sent || 0,
      delivered: stats?.today_delivered || 0,
      read: stats?.today_read || 0,
      failed: stats?.today_failed || 0,
      total: stats?.today_total || 0,
      documents: stats?.today_documents_sent || 0
    },
    lifetime: {
      sent: stats?.sent_count || 0,
      delivered: stats?.delivered_count || 0,
      read: stats?.read_count || 0,
      failed: stats?.failed_count || 0,
      total: stats?.total_messages || 0,
      documents: stats?.total_documents_sent || 0
    },
    templates: {
      approved: tplStats?.approved_templates || 0,
      pending: tplStats?.pending_templates || 0,
      rejected: tplStats?.rejected_templates || 0,
      total: tplStats?.total_templates || 0
    },
    config: {
      businessName: config.businessName,
      phoneNumber: config.phoneNumber,
      isLive: config.isLive,
      mockMode: config.mockMode,
      lastWebhookAt: config.lastWebhookAt
    }
  };
}

/**
 * Process incoming Meta Status Event (sent, delivered, read, failed)
 * Implements strict status hierarchy, idempotent event audit & timestamp handling.
 */
async function processMetaStatusEvent(st) {
  if (!st || !st.id) return null;

  const metaMessageId = st.id;
  const rawStatus = (st.status || '').toLowerCase(); // sent, delivered, read, failed
  const recipientId = st.recipient_id || null;

  // 1. Convert Meta Unix timestamp (seconds) to timestamptz Date
  let eventTimestamp = new Date();
  if (st.timestamp) {
    const parsedTs = parseInt(st.timestamp, 10);
    if (!isNaN(parsedTs) && parsedTs > 0) {
      eventTimestamp = new Date(parsedTs * 1000);
    }
  }

  // 2. Map raw status to uppercase application status
  let eventStatus = 'SENT';
  if (rawStatus === 'delivered') eventStatus = 'DELIVERED';
  else if (rawStatus === 'read') eventStatus = 'READ';
  else if (rawStatus === 'failed') eventStatus = 'FAILED';
  else if (rawStatus === 'sent') eventStatus = 'SENT';
  else eventStatus = rawStatus.toUpperCase();

  // 3. Extract failure details if status is failed
  let failureReasonText = null;
  if (eventStatus === 'FAILED') {
    if (st.errors && Array.isArray(st.errors) && st.errors.length > 0) {
      const errObj = st.errors[0];
      failureReasonText = errObj.message || errObj.title || `Error code ${errObj.code}`;
      if (errObj.error_data && errObj.error_data.details) {
        failureReasonText += `: ${errObj.error_data.details}`;
      }
    } else if (st.errors) {
      failureReasonText = typeof st.errors === 'string' ? st.errors : JSON.stringify(st.errors);
    } else {
      failureReasonText = 'Meta status indicated message failure';
    }
  }

  logger.info(`[WhatsApp Webhook] Status received | meta_message_id=${metaMessageId} | status=${rawStatus} | recipient=${recipientId || 'unknown'}`);

  // 4. Query existing record in `whatsapp_messages`
  const { rows: msgRows } = await query(
    `SELECT id, status, recipient_mobile FROM whatsapp_messages WHERE meta_message_id = $1 LIMIT 1`,
    [metaMessageId]
  );

  let messageId = null;
  if (msgRows.length > 0) {
    messageId = msgRows[0].id;

    // Status progression SQL enforcing status hierarchy: READ / FAILED > DELIVERED > SENT
    const updateSql = `
      UPDATE whatsapp_messages
      SET
        updated_at = NOW(),
        sent_at = CASE 
          WHEN $2 IN ('SENT', 'DELIVERED', 'READ') THEN COALESCE(sent_at, $3)
          ELSE sent_at
        END,
        delivered_at = CASE 
          WHEN $2 IN ('DELIVERED', 'READ') THEN COALESCE(delivered_at, $3)
          ELSE delivered_at
        END,
        read_at = CASE 
          WHEN $2 = 'READ' THEN COALESCE(read_at, $3)
          ELSE read_at
        END,
        failed_at = CASE 
          WHEN $2 = 'FAILED' THEN COALESCE(failed_at, $3)
          ELSE failed_at
        END,
        failure_reason = CASE 
          WHEN $2 = 'FAILED' THEN COALESCE($4, failure_reason)
          ELSE failure_reason
        END,
        status = CASE 
          WHEN status = 'READ' THEN 'READ'
          WHEN status = 'FAILED' AND $2 != 'FAILED' THEN 'FAILED'
          WHEN $2 = 'READ' THEN 'READ'
          WHEN status = 'DELIVERED' AND $2 = 'SENT' THEN 'DELIVERED'
          WHEN $2 = 'DELIVERED' THEN 'DELIVERED'
          WHEN $2 = 'FAILED' THEN 'FAILED'
          WHEN $2 = 'SENT' THEN COALESCE(status, 'SENT')
          ELSE status
        END
      WHERE meta_message_id = $1
      RETURNING id, status, recipient_mobile, sent_at, delivered_at, read_at, failed_at;
    `;

    const { rows: updatedRows } = await query(updateSql, [
      metaMessageId,
      eventStatus,
      eventTimestamp,
      failureReasonText
    ]);

    if (updatedRows.length > 0) {
      logger.info(`[WhatsApp Webhook] Message updated successfully | meta_message_id=${metaMessageId} | status=${updatedRows[0].status}`);
    }
  } else {
    logger.info(`[WhatsApp Webhook] Received webhook for unlinked meta_message_id: ${metaMessageId}`);
  }

  // 5. Idempotent Audit Event Logging in `whatsapp_delivery_events`
  try {
    const { rows: existingEvents } = await query(
      `SELECT id FROM whatsapp_delivery_events WHERE meta_message_id = $1 AND event_type = $2 AND event_time = $3 LIMIT 1`,
      [metaMessageId, eventStatus, eventTimestamp]
    );

    if (existingEvents.length === 0) {
      await query(
        `INSERT INTO whatsapp_delivery_events (message_id, meta_message_id, event_type, event_payload, event_time)
         VALUES ($1, $2, $3, $4, $5)`,
        [messageId, metaMessageId, eventStatus, JSON.stringify(st), eventTimestamp]
      );
    }
  } catch (auditErr) {
    logger.warn(`[WhatsApp Webhook] Audit event insertion note: ${auditErr.message}`);
  }

  return { metaMessageId, status: eventStatus, messageId };
}

module.exports = {
  getWhatsAppConfig,
  dispatchMetaMessage,
  sendTemplateMessage,
  sendDocumentMessage,
  processMetaStatusEvent,
  getWhatsAppMessages,
  getDashboardMetrics
};
