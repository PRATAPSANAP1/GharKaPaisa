const { query } = require('../../config/database');
const logger = require('../../config/logger');

let isTablesChecked = false;
async function ensureMessengerTables() {
  if (isTablesChecked) return;
  try {
    const migrateMessenger = require('../../database/migrations/migrate_messenger');
    await migrateMessenger();
    isTablesChecked = true;
  } catch (err) {
    logger.error('Auto ensure messenger tables note:', err.message);
  }
}

/**
 * Get all conversations for a specific user with unread counts and last message details
 */
async function getConversationsForUser(userId, filter = 'ALL', search = '') {
  await ensureMessengerTables();
  let whereClause = `cp.user_id = $1 AND cp.left_at IS NULL`;
  const params = [userId];

  if (filter === 'DIRECT') {
    whereClause += ` AND c.conversation_type = 'DIRECT'`;
  } else if (filter === 'GROUPS') {
    whereClause += ` AND c.conversation_type IN ('GROUP', 'DEPARTMENT')`;
  } else if (filter === 'APPLICATIONS') {
    whereClause += ` AND c.conversation_type = 'APPLICATION'`;
  } else if (filter === 'PINNED') {
    whereClause += ` AND cp.is_pinned = TRUE`;
  } else if (filter === 'UNREAD') {
    whereClause += ` AND (
      SELECT COUNT(*) FROM messages m
      LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = $1
      WHERE m.conversation_id = c.id AND m.sender_id != $1 AND mr.id IS NULL
    ) > 0`;
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClause += ` AND (c.name ILIKE $${params.length} OR c.last_message_text ILIKE $${params.length})`;
  }

  const sql = `
    SELECT 
      c.id,
      c.conversation_type,
      c.name,
      c.description,
      c.avatar_url,
      c.application_id,
      c.last_message_id,
      c.last_message_text,
      c.last_message_at,
      c.created_at,
      c.updated_at,
      cp.role AS participant_role,
      cp.is_muted,
      cp.is_pinned,
      cp.is_starred,
      cp.is_archived,
      a.app_number AS application_number,
      a.status AS application_status,
      (
        SELECT COUNT(*) 
        FROM messages m
        LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = $1
        WHERE m.conversation_id = c.id AND m.sender_id != $1 AND mr.id IS NULL
      )::INT AS unread_count,
      (
        SELECT json_agg(json_build_object(
          'user_id', u.id,
          'full_name', u.full_name,
          'role', u.role,
          'email', u.email,
          'mobile', u.mobile,
          'partner_code', pp.partner_code,
          'employee_code', emp.employee_code,
          'last_active_at', u.last_active_at,
          'last_logout_at', u.last_logout_at,
          'last_login', u.last_login
        ))
        FROM conversation_participants cp2
        JOIN users u ON u.id = cp2.user_id
        LEFT JOIN partner_profiles pp ON pp.user_id = u.id
        LEFT JOIN employees emp ON emp.user_id = u.id
        WHERE cp2.conversation_id = c.id AND cp2.user_id != $1
      ) AS other_participants
    FROM conversation_participants cp
    JOIN conversations c ON c.id = cp.conversation_id
    LEFT JOIN applications a ON a.id = c.application_id
    WHERE ${whereClause}
    ORDER BY cp.is_pinned DESC, c.last_message_at DESC NULLS LAST, c.updated_at DESC
  `;

  const { rows } = await query(sql, params);
  return rows;
}

/**
 * Find existing direct conversation between two users
 */
async function findDirectConversation(user1Id, user2Id) {
  await ensureMessengerTables();
  const sql = `
    SELECT c.* FROM conversations c
    JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $1
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $2
    WHERE c.conversation_type = 'DIRECT'
    LIMIT 1
  `;
  const { rows } = await query(sql, [user1Id, user2Id]);
  return rows[0] || null;
}

/**
 * Find existing conversation linked to a specific application
 */
async function findApplicationConversation(applicationId) {
  await ensureMessengerTables();
  const sql = `
    SELECT c.* FROM conversations c
    WHERE c.application_id = $1 AND c.conversation_type = 'APPLICATION'
    LIMIT 1
  `;
  const { rows } = await query(sql, [applicationId]);
  return rows[0] || null;
}

/**
 * Create a new conversation record
 */
async function createConversation({ conversation_type, name, description, avatar_url, application_id, created_by }) {
  await ensureMessengerTables();
  const sql = `
    INSERT INTO conversations (conversation_type, name, description, avatar_url, application_id, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    conversation_type || 'DIRECT',
    name || null,
    description || null,
    avatar_url || null,
    application_id || null,
    created_by
  ]);
  return rows[0];
}

/**
 * Add a participant to a conversation
 */
async function addParticipant({ conversation_id, user_id, role = 'MEMBER' }) {
  const sql = `
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (conversation_id, user_id) 
    DO UPDATE SET left_at = NULL, role = $3
    RETURNING *
  `;
  const { rows } = await query(sql, [conversation_id, user_id, role]);
  return rows[0];
}

/**
 * Get conversation details by ID
 */
async function getConversationById(conversationId) {
  const sql = `
    SELECT c.*, a.app_number AS application_number, a.status AS application_status
    FROM conversations c
    LEFT JOIN applications a ON a.id = c.application_id
    WHERE c.id = $1
  `;
  const { rows } = await query(sql, [conversationId]);
  return rows[0] || null;
}

/**
 * Get members of a conversation
 */
async function getConversationParticipants(conversationId) {
  const sql = `
    SELECT cp.*, u.full_name, u.email, u.mobile, u.role, u.department, u.designation, u.last_active_at, u.last_logout_at, u.last_login,
           pp.partner_code, emp.employee_code
    FROM conversation_participants cp
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN partner_profiles pp ON pp.user_id = u.id
    LEFT JOIN employees emp ON emp.user_id = u.id
    WHERE cp.conversation_id = $1 AND cp.left_at IS NULL
  `;
  const { rows } = await query(sql, [conversationId]);
  return rows;
}

/**
 * Check if a user is a participant in a conversation
 */
async function isParticipant(conversationId, userId) {
  const sql = `
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
  `;
  const { rows } = await query(sql, [conversationId, userId]);
  return rows.length > 0;
}

/**
 * Get message history for a conversation
 */
async function getMessages(conversationId, limit = 50, offset = 0) {
  const sql = `
    SELECT 
      m.id,
      m.conversation_id,
      m.sender_id,
      m.message_type,
      m.message_text,
      m.reply_to_message_id,
      m.is_edited,
      m.edited_at,
      m.deleted_at,
      m.created_at,
      u.full_name AS sender_name,
      u.role AS sender_role,
      u.mobile AS sender_mobile,
      u.email AS sender_email,
      pp.partner_code AS sender_partner_code,
      emp.employee_code AS sender_employee_code,
      (
        SELECT json_agg(json_build_object(
          'id', ma.id,
          'file_name', ma.file_name,
          'file_url', ma.file_url,
          'file_type', ma.file_type,
          'file_size', ma.file_size
        ))
        FROM message_attachments ma
        WHERE ma.message_id = m.id
      ) AS attachments,
      (
        SELECT json_build_object(
          'id', rm.id,
          'sender_id', rm.sender_id,
          'sender_name', ru.full_name,
          'message_text', rm.message_text
        )
        FROM messages rm
        JOIN users ru ON ru.id = rm.sender_id
        WHERE rm.id = m.reply_to_message_id
      ) AS reply_to,
      (
        SELECT json_agg(json_build_object(
          'user_id', mr.user_id,
          'read_at', mr.read_at
        ))
        FROM message_reads mr
        WHERE mr.message_id = m.id
      ) AS reads,
      (
        EXISTS (
          SELECT 1 FROM message_reads mr 
          WHERE mr.message_id = m.id AND mr.user_id != m.sender_id
        )
      ) AS is_read
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    LEFT JOIN partner_profiles pp ON pp.user_id = u.id
    LEFT JOIN employees emp ON emp.user_id = u.id
    WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
    ORDER BY m.created_at ASC
    LIMIT $2 OFFSET $3
  `;
  const { rows } = await query(sql, [conversationId, limit, offset]);
  return rows;
}

/**
 * Insert a message
 */
async function createMessage({ conversation_id, sender_id, message_type = 'TEXT', message_text, reply_to_message_id }) {
  const sql = `
    INSERT INTO messages (conversation_id, sender_id, message_type, message_text, reply_to_message_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await query(sql, [
    conversation_id,
    sender_id,
    message_type,
    message_text || '',
    reply_to_message_id || null
  ]);
  return rows[0];
}

function parseFileSizeToBytes(size) {
  if (typeof size === 'number') {
    return isNaN(size) ? 0 : Math.round(size);
  }
  if (!size) return 0;
  const str = String(size).trim();
  const cleanStr = str.replace(/,/g, '');
  const match = cleanStr.match(/^([\d.]+)\s*([a-zA-Z]*)$/);
  if (!match) {
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? 0 : num;
  }
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;
  const unit = match[2].toLowerCase();
  if (unit.startsWith('g')) return Math.round(num * 1024 * 1024 * 1024);
  if (unit.startsWith('m')) return Math.round(num * 1024 * 1024);
  if (unit.startsWith('k')) return Math.round(num * 1024);
  return Math.round(num);
}

/**
 * Add attachment to message
 */
async function createAttachment({ message_id, file_name, file_url, file_type, file_size, storage_key }) {
  await ensureMessengerTables();
  const parsedSize = parseFileSizeToBytes(file_size);
  const sql = `
    INSERT INTO message_attachments (message_id, file_name, file_url, file_type, file_size, storage_key)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  try {
    const { rows } = await query(sql, [message_id, file_name, file_url, file_type || null, parsedSize, storage_key || null]);
    return rows[0];
  } catch (err) {
    if (err.message && err.message.includes('too long')) {
      await query(`ALTER TABLE message_attachments ALTER COLUMN file_url TYPE TEXT`).catch(() => {});
      await query(`ALTER TABLE message_attachments ALTER COLUMN storage_key TYPE TEXT`).catch(() => {});
      const { rows } = await query(sql, [message_id, file_name, file_url, file_type || null, parsedSize, storage_key || null]);
      return rows[0];
    }
    throw err;
  }
}

/**
 * Update conversation last message timestamp & snippet
 */
async function updateConversationLastMessage(conversationId, messageId, messageText) {
  const sql = `
    UPDATE conversations
    SET last_message_id = $2,
        last_message_text = $3,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
  `;
  await query(sql, [conversationId, messageId, messageText]);
}

/**
 * Mark messages in conversation as read for a user
 */
async function markMessagesAsRead(conversationId, userId) {
  const sql = `
    INSERT INTO message_reads (message_id, user_id)
    SELECT m.id, $2
    FROM messages m
    WHERE m.conversation_id = $1 AND m.sender_id != $2
    ON CONFLICT (message_id, user_id) DO NOTHING
  `;
  await query(sql, [conversationId, userId]);

  // Update participant last_read_at
  await query(
    `UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
}

/**
 * Get total unread count for a user across all active conversations
 */
async function getUnreadCount(userId) {
  await ensureMessengerTables();
  const sql = `
    SELECT COUNT(*)::INT AS total_unread
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1 AND cp.left_at IS NULL
    LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = $1
    WHERE m.sender_id != $1 AND mr.id IS NULL
  `;
  const { rows } = await query(sql, [userId]);
  return rows[0]?.total_unread || 0;
}

/**
 * Toggle pin status for conversation participant
 */
async function togglePin(conversationId, userId) {
  const sql = `
    UPDATE conversation_participants
    SET is_pinned = NOT is_pinned
    WHERE conversation_id = $1 AND user_id = $2
    RETURNING is_pinned
  `;
  const { rows } = await query(sql, [conversationId, userId]);
  return rows[0]?.is_pinned || false;
}

/**
 * Search contacts based on platform hierarchy and user role
 */
async function getContactsForUser(userId, userRole, search = '') {
  let searchPattern = `%${(search || '').trim()}%`;
  
  const isEmployeeRole = (userRole || '').toUpperCase() === 'EMPLOYEE';

  let employeeHierarchySQL = '';
  if (isEmployeeRole) {
    employeeHierarchySQL = `
      AND (
        UPPER(COALESCE(u.role, '')) != 'EMPLOYEE'
        OR EXISTS (
          SELECT 1 FROM employees emp_curr
          LEFT JOIN employee_hierarchy eh_curr ON eh_curr.employee_id = emp_curr.id
          LEFT JOIN employees emp_target ON emp_target.user_id = u.id
          LEFT JOIN employee_hierarchy eh_target ON eh_target.employee_id = emp_target.id
          WHERE emp_curr.user_id = $1
          AND (
            (emp_curr.department IS NOT NULL AND emp_target.department IS NOT NULL AND LOWER(emp_curr.department) = LOWER(emp_target.department))
            OR eh_target.manager_id = emp_curr.id
            OR eh_target.team_leader_id = emp_curr.id
            OR eh_curr.manager_id = emp_target.id
            OR eh_curr.team_leader_id = emp_target.id
            OR (eh_curr.manager_id IS NOT NULL AND eh_curr.manager_id = eh_target.manager_id)
            OR (eh_curr.team_leader_id IS NOT NULL AND eh_curr.team_leader_id = eh_target.team_leader_id)
          )
        )
      )
    `;
  }

  const sql = `
    SELECT 
      u.id, 
      u.full_name, 
      u.email, 
      u.mobile, 
      u.role, 
      u.department, 
      u.designation,
      u.last_active_at,
      u.last_logout_at,
      u.last_login,
      pp.partner_code,
      emp.employee_code
    FROM users u
    LEFT JOIN partner_profiles pp ON pp.user_id = u.id
    LEFT JOIN employees emp ON emp.user_id = u.id
    WHERE u.id != $1 
      AND u.is_active = TRUE
      ${employeeHierarchySQL}
      AND (
        u.full_name ILIKE $2 OR 
        u.email ILIKE $2 OR 
        u.mobile ILIKE $2 OR 
        pp.partner_code ILIKE $2 OR
        emp.employee_code ILIKE $2
      )
    ORDER BY u.full_name ASC
    LIMIT 30
  `;
  const { rows } = await query(sql, [userId, searchPattern]);
  return rows;
}

module.exports = {
  getConversationsForUser,
  findDirectConversation,
  findApplicationConversation,
  createConversation,
  addParticipant,
  getConversationById,
  getConversationParticipants,
  isParticipant,
  getMessages,
  createMessage,
  createAttachment,
  updateConversationLastMessage,
  markMessagesAsRead,
  getUnreadCount,
  togglePin,
  getContactsForUser
};
