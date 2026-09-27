const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * WhatsApp Webhook Controller
 * Handles Meta Challenge Verification (GET) and Incoming Events (POST)
 */

/**
 * Meta Webhook Verification Handler (GET /api/v1/whatsapp/webhook)
 */
async function verifyWebhook(req, res) {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    let settings = null;
    try {
      const { rows } = await query(`SELECT webhook_verify_token FROM whatsapp_settings LIMIT 1`);
      settings = rows[0];
    } catch (dbErr) {
      logger.warn('[WhatsApp Webhook] whatsapp_settings query note:', dbErr.message);
    }

    const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || settings?.webhook_verify_token || 'gharkapaisa_meta_webhook_secret_2026';

    if (mode === 'subscribe' && token === configuredToken) {
      logger.info('[WhatsApp Webhook] Meta challenge verification successful.');
      try {
        await query(`UPDATE whatsapp_settings SET last_webhook_at = NOW()`);
      } catch (e) {}
      return res.status(200).send(challenge);
    }

    logger.warn('[WhatsApp Webhook] Verification token mismatch. Provided:', token);
    return res.status(403).json({ success: false, message: 'Verification failed. Invalid token.' });
  } catch (err) {
    logger.error('[WhatsApp Webhook] Verification error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

/**
 * Meta Incoming Event Processor (POST /api/v1/whatsapp/webhook)
 */
async function handleWebhookEvent(req, res) {
  try {
    const body = req.body;
    logger.info('[WhatsApp Webhook] Received Meta payload:', JSON.stringify(body));

    try {
      await query(`UPDATE whatsapp_settings SET last_webhook_at = NOW()`);
    } catch (e) {}

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value || {};
          const statuses = value.statuses || [];

          for (const st of statuses) {
            const metaMessageId = st.id;
            const eventStatus = (st.status || '').toUpperCase(); // sent, delivered, read, failed
            const timestamp = st.timestamp ? new Date(parseInt(st.timestamp, 10) * 1000) : new Date();

            logger.info(`[WhatsApp Webhook] Updating message ${metaMessageId} -> ${eventStatus}`);

            let statusColumnUpdate = '';
            if (eventStatus === 'DELIVERED') {
              statusColumnUpdate = `, delivered_at = COALESCE(delivered_at, $2), status = 'DELIVERED'`;
            } else if (eventStatus === 'READ') {
              statusColumnUpdate = `, read_at = COALESCE(read_at, $2), status = 'READ'`;
            } else if (eventStatus === 'FAILED') {
              statusColumnUpdate = `, failed_at = COALESCE(failed_at, $2), status = 'FAILED', failure_reason = $3`;
            } else if (eventStatus === 'SENT') {
              statusColumnUpdate = `, sent_at = COALESCE(sent_at, $2), status = 'SENT'`;
            }

            if (statusColumnUpdate) {
              const failureReasonText = st.errors ? JSON.stringify(st.errors) : null;
              const updateSql = `
                UPDATE whatsapp_messages
                SET updated_at = NOW() ${statusColumnUpdate}
                WHERE meta_message_id = $1
                RETURNING id;
              `;
              const { rows: updatedRows } = await query(updateSql, [metaMessageId, timestamp, failureReasonText]);

              if (updatedRows.length > 0) {
                await query(`
                  INSERT INTO whatsapp_delivery_events (message_id, meta_message_id, event_type, event_payload, event_time)
                  VALUES ($1, $2, $3, $4, $5);
                `, [updatedRows[0].id, metaMessageId, eventStatus, JSON.stringify(st), timestamp]);
              }
            }
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: 'EVENT_RECEIVED' });
  } catch (err) {
    logger.error('[WhatsApp Webhook] Event processing error:', err);
    return res.status(200).json({ success: true, message: 'EVENT_RECEIVED_WITH_ERROR' });
  }
}

/**
 * Fetch Webhook Events Log for Diagnostics
 */
async function getWebhookLogs(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT e.*, m.recipient_name, m.recipient_mobile, m.template_name
      FROM whatsapp_delivery_events e
      LEFT JOIN whatsapp_messages m ON m.id = e.message_id
      ORDER BY e.created_at DESC
      LIMIT 50;
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  verifyWebhook,
  handleWebhookEvent,
  getWebhookLogs
};
