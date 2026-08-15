const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const ctrl = require('./customer.controller.js');
const { upload } = require('../../services/aws/s3.service.js');

// Require authentication for all customer routes
router.use(jwtAuth);

// Core Customer List & Dashboard Metrics
router.get('/', ctrl.listCustomers);
router.get('/dashboard/metrics', ctrl.getDashboardMetrics);
router.post('/', ctrl.createCustomer);

// Merge
router.post('/merge', ctrl.processMergeCustomers);

// 360 Customer Profile Detail & Actions
router.get('/:id', ctrl.getCustomerProfile);
router.put('/:id', ctrl.updateCustomer);
router.patch('/:id/status', ctrl.updatePipelineStatus);
router.delete('/:id', ctrl.archiveCustomer);

// Partner Document Upload & Share Link
router.post('/:id/documents', upload.single('file'), ctrl.uploadCustomerDocument);
router.delete('/:id/documents/:docId', ctrl.deleteCustomerDocument);
router.post('/:id/share-link', ctrl.generateShareLink);

// Sub-resource endpoints
router.post('/:id/notes', ctrl.addNote);
router.post('/:id/followups', ctrl.addFollowup);
router.post('/:id/log-call', (req, res, next) => { req.body.type = 'Call'; ctrl.logCommunication(req, res, next); });
router.post('/:id/send-whatsapp', (req, res, next) => { req.body.type = 'WhatsApp'; ctrl.logCommunication(req, res, next); });
router.post('/:id/send-sms', (req, res, next) => { req.body.type = 'SMS'; ctrl.logCommunication(req, res, next); });
router.post('/:id/send-email', (req, res, next) => { req.body.type = 'Email'; ctrl.logCommunication(req, res, next); });

module.exports = router;
