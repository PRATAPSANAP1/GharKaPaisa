const express = require('express');
const router = express.Router();
const ctrl = require('./support.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// Protect all support ticket routes with JWT auth
router.use(jwtAuth);

// List tickets & create ticket
router.get('/', ctrl.listTickets);
router.post('/', ctrl.createTicket);

// Single ticket detail & reply
router.get('/:id', ctrl.getTicketDetail);
router.post('/:id/reply', ctrl.addReply);

// Update ticket status (Admin / Super Admin only)
router.patch('/:id/status', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateTicketStatus);

module.exports = router;
