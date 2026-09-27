const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const requireSuperAdmin = require('../../middleware/authentication/requireSuperAdmin.middleware');
const { globalLimiter } = require('../../middleware/rate-limit/rateLimit.middleware');
const controller = require('./whatsapp.controller');
const webhookCtrl = require('./whatsapp.webhook.controller');

// ── Meta Webhook Endpoints (Public — No JWT required) ────────
router.get('/webhook', webhookCtrl.verifyWebhook);
router.post('/webhook', webhookCtrl.handleWebhookEvent);

// ── Protected WhatsApp Endpoints (Requires User Authentication) ─
router.use(jwtAuth);

// Dashboard Metrics
router.get('/dashboard', controller.getDashboard);

// Message History & Details
router.get('/messages', controller.getMessages);
router.get('/messages/:id', controller.getMessageById);

// Send Actions
router.post('/send-template', globalLimiter, controller.sendTemplate);
router.post('/send-document', globalLimiter, controller.sendDocument);

// Templates
router.get('/templates', controller.getTemplates);
router.post('/templates', requireSuperAdmin, controller.createTemplate);
router.patch('/templates/:id/status', requireSuperAdmin, controller.updateTemplateStatus);

// Super Admin Settings & Webhook Diagnostics
router.get('/settings', requireSuperAdmin, controller.getSettings);
router.put('/settings', requireSuperAdmin, controller.updateSettings);
router.get('/webhook-logs', requireSuperAdmin, webhookCtrl.getWebhookLogs);

module.exports = router;
