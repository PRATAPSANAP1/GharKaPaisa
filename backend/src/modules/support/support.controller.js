const { query } = require('../../config/database');
const { success, created, error, notFound } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');

// Create a new support ticket (Partner)
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description || !category) {
      return error(res, 'Subject, description, and category are required', 400);
    }

    // Resolve partner ID
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    if (!partnerId) {
      return error(res, 'Partner profile required to create ticket', 403);
    }

    const { rows: [ticket] } = await query(`
      INSERT INTO support_tickets (partner_id, subject, description, category, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open') RETURNING *
    `, [partnerId, subject.trim(), description.trim(), category, priority || 'medium']);

    await logAction(req, 'CREATE_SUPPORT_TICKET', ticket.id, { subject });

    return created(res, ticket, 'Support ticket created successfully');
  } catch (err) {
    next(err);
  }
};

// List support tickets (Partner gets own, Admin gets all)
const listTickets = async (req, res, next) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    let ticketsQuery;
    const values = [];

    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') {
      ticketsQuery = `
        SELECT t.*, pp.partner_code, pp.first_name, pp.last_name, u.email as partner_email
        FROM support_tickets t
        JOIN partner_profiles pp ON pp.id = t.partner_id
        JOIN users u ON u.id = pp.user_id
        ORDER BY t.created_at DESC
      `;
    } else {
      let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
      if (!partnerId && req.user) {
        const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
        if (p) partnerId = p.id;
      }

      if (!partnerId) return success(res, []);

      ticketsQuery = `
        SELECT t.*, pp.partner_code, pp.first_name, pp.last_name
        FROM support_tickets t
        JOIN partner_profiles pp ON pp.id = t.partner_id
        WHERE t.partner_id = $1
        ORDER BY t.created_at DESC
      `;
      values.push(partnerId);
    }

    const { rows } = await query(ticketsQuery, values);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// Get single support ticket detail
const getTicketDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = (req.user?.role || '').toUpperCase();

    const { rows: [ticket] } = await query(`
      SELECT t.*, pp.partner_code, pp.first_name, pp.last_name
      FROM support_tickets t
      JOIN partner_profiles pp ON pp.id = t.partner_id
      WHERE t.id = $1
    `, [id]);

    if (!ticket) return notFound(res, 'Support ticket not found');

    // Partner access validation
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'EMPLOYEE') {
      let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
      if (!partnerId && req.user) {
        const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
        if (p) partnerId = p.id;
      }
      if (ticket.partner_id !== partnerId) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, ticket);
  } catch (err) {
    next(err);
  }
};

// Add reply to support ticket
const addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return error(res, 'Reply message cannot be empty', 400);
    }

    const role = (req.user?.role || '').toUpperCase();
    const senderType = (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') ? 'admin' : 'partner';

    const { rows: [ticket] } = await query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
    if (!ticket) return notFound(res, 'Support ticket not found');

    // Partner access validation
    if (senderType === 'partner') {
      let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
      if (!partnerId && req.user) {
        const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
        if (p) partnerId = p.id;
      }
      if (ticket.partner_id !== partnerId) {
        return error(res, 'Access denied', 403);
      }
    }

    const newReply = {
      sender: senderType,
      message: message.trim(),
      sent_at: new Date().toISOString()
    };

    const updatedReplies = [...(ticket.replies || []), newReply];

    // Auto-update status to in_progress if admin replies, or open if partner replies
    let newStatus = ticket.status;
    if (senderType === 'admin') {
      newStatus = 'in_progress';
    } else if (senderType === 'partner' && ticket.status === 'resolved') {
      newStatus = 'open';
    }

    const { rows: [updatedTicket] } = await query(`
      UPDATE support_tickets
      SET replies = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [JSON.stringify(updatedReplies), newStatus, id]);

    return success(res, updatedTicket, 'Reply added successfully');
  } catch (err) {
    next(err);
  }
};

// Update ticket status (Admin only)
const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return error(res, 'Valid status is required (open, in_progress, resolved, closed)', 400);
    }

    const { rows: [updated] } = await query(`
      UPDATE support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [status, id]);

    if (!updated) return notFound(res, 'Support ticket not found');

    await logAction(req, 'UPDATE_TICKET_STATUS', id, { status });

    return success(res, updated, `Ticket status set to ${status}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  listTickets,
  getTicketDetail,
  addReply,
  updateTicketStatus
};
