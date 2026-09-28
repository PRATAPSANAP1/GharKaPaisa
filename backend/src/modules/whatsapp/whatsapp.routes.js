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
router.get('/designation-report', controller.getDesignationReport);
router.post('/send-designation-report', globalLimiter, controller.sendDesignationReport);

// Templates
router.get('/templates', controller.getTemplates);
router.post('/templates', requireSuperAdmin, controller.createTemplate);
router.patch('/templates/:id/status', requireSuperAdmin, controller.updateTemplateStatus);

// Auto-Fetch & Search Helpers for WhatsApp Modal
router.get('/search/applications', controller.searchApplications);
router.get('/search/staff', controller.searchStaff);
router.get('/search-applications', controller.searchApplications);
router.get('/staff-list', controller.searchStaff);
router.get('/products-list', controller.searchProducts);

// Centralized Context APIs
router.get('/recipient-context/application/:applicationId', controller.getApplicationRecipientContext);
router.get('/recipient-context/staff/:staffId', controller.getStaffRecipientContext);
router.get('/product-context/:productId', controller.getProductContext);

// Staff-Aware Report Generator & Product Doc Generation APIs
router.get('/staff-reports/available/:staffId', controller.getAvailableStaffReports);
router.post('/staff-reports/generate', globalLimiter, controller.generateStaffReport);
router.post('/generate-product-info-doc', globalLimiter, controller.generateProductInfoDoc);

// Super Admin Settings, Policy & Webhook Diagnostics
router.get('/settings', requireSuperAdmin, controller.getSettings);
router.put('/settings', requireSuperAdmin, controller.updateSettings);
router.get('/sender-configs', requireSuperAdmin, controller.getSenderConfigs);
router.get('/message-policies', requireSuperAdmin, controller.getMessagePolicies);
router.post('/message-policies', requireSuperAdmin, controller.updateMessagePolicy);
router.get('/consents', requireSuperAdmin, controller.getConsents);
router.get('/webhook-logs', requireSuperAdmin, webhookCtrl.getWebhookLogs);

module.exports = router;

