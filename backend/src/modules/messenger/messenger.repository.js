const { query } = require('../../config/database');
const logger = require('../../config/logger');



/**
 * Get all conversations for a specific user with unread counts and last message details
 */
async function getConversationsForUser(userId, filter = 'ALL', search = '') {
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
      WHERE m.conversation_id = c.id AND m.sender_id != $1 AND mr.id IS NULL AND m.created_at >= NOW() - INTERVAL '48 hours'
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
      CASE WHEN c.last_message_at >= NOW() - INTERVAL '48 hours' AND (cp.cleared_at IS NULL OR c.last_message_at > cp.cleared_at) THEN c.last_message_id ELSE NULL END AS last_message_id,
      CASE WHEN c.last_message_at >= NOW() - INTERVAL '48 hours' AND (cp.cleared_at IS NULL OR c.last_message_at > cp.cleared_at) THEN c.last_message_text ELSE NULL END AS last_message_text,
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
        WHERE m.conversation_id = c.id AND m.sender_id != $1 AND mr.id IS NULL AND m.created_at >= NOW() - INTERVAL '48 hours'
          AND (cp.cleared_at IS NULL OR m.created_at > cp.cleared_at)
      )::INT AS unread_count,
      (
        SELECT json_agg(json_build_object(
          'user_id', u.id,
          'full_name', COALESCE(NULLIF(TRIM(emp.full_name), ''), NULLIF(TRIM(CONCAT(pp.first_name, ' ', pp.last_name)), ''), NULLIF(TRIM(u.full_name), ''), u.email, 'User Profile'),
          'role', u.role,
          'email', u.email,
          'mobile', u.mobile,
          'partner_code', pp.partner_code,
          'employee_code', emp.employee_id,
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
async function getConversationById(conversationId, userId = null) {
  const sql = `
    SELECT 
      c.*, 
      a.app_number AS application_number, 
      a.status AS application_status,
      (
        SELECT json_agg(json_build_object(
          'user_id', u.id,
          'full_name', COALESCE(NULLIF(TRIM(emp.full_name), ''), NULLIF(TRIM(CONCAT(pp.first_name, ' ', pp.last_name)), ''), NULLIF(TRIM(u.full_name), ''), u.email, 'User Profile'),
          'role', u.role,
          'email', u.email,
          'mobile', u.mobile,
          'partner_code', pp.partner_code,
          'employee_code', emp.employee_id,
          'last_active_at', u.last_active_at,
          'last_logout_at', u.last_logout_at,
          'last_login', u.last_login
        ))
        FROM conversation_participants cp2
        JOIN users u ON u.id = cp2.user_id
        LEFT JOIN partner_profiles pp ON pp.user_id = u.id
        LEFT JOIN employees emp ON emp.user_id = u.id
        WHERE cp2.conversation_id = c.id AND ($2::uuid IS NULL OR cp2.user_id != $2::uuid)
      ) AS other_participants
    FROM conversations c
    LEFT JOIN applications a ON a.id = c.application_id
    WHERE c.id = $1
  `;
  const { rows } = await query(sql, [conversationId, userId]);
  return rows[0] || null;
}

/**
 * Get members of a conversation
 */
async function getConversationParticipants(conversationId) {
  const sql = `
    SELECT cp.*, u.full_name, u.email, u.mobile, u.role, u.department, u.designation, u.last_active_at, u.last_logout_at, u.last_login,
           pp.partner_code, emp.employee_id AS employee_code
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
async function getMessages(conversationId, userId = null, limit = 5000, offset = 0) {
  const params = [conversationId, limit, offset];
  let clearedFilter = '';
  if (userId) {
    params.push(userId);
    clearedFilter = ` AND NOT EXISTS (
      SELECT 1 FROM conversation_participants cp_check
      WHERE cp_check.conversation_id = m.conversation_id 
        AND cp_check.user_id = $4::uuid 
        AND cp_check.cleared_at IS NOT NULL 
        AND m.created_at <= cp_check.cleared_at
    )`;
  }

  const sql = `
    SELECT * FROM (
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
        COALESCE(NULLIF(TRIM(emp.full_name), ''), NULLIF(TRIM(CONCAT(pp.first_name, ' ', pp.last_name)), ''), NULLIF(TRIM(u.full_name), ''), u.email, 'User Profile') AS sender_name,
        u.role AS sender_role,
        u.mobile AS sender_mobile,
        u.email AS sender_email,
        pp.partner_code AS sender_partner_code,
        emp.employee_id AS sender_employee_code,
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
      WHERE m.conversation_id = $1 AND m.deleted_at IS NULL AND m.created_at >= NOW() - INTERVAL '48 hours'
        ${clearedFilter}
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    ) sub
    ORDER BY sub.created_at ASC
  `;
  const { rows } = await query(sql, params);
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

/**
 * Get single message by ID
 */
async function getMessageById(messageId) {
  const sql = `SELECT * FROM messages WHERE id = $1 AND deleted_at IS NULL`;
  const { rows } = await query(sql, [messageId]);
  return rows[0] || null;
}

/**
 * Edit message text
 */
async function editMessage(messageId, userId, messageText) {
  const sql = `
    UPDATE messages
    SET message_text = $3,
        is_edited = true,
        edited_at = NOW()
    WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
    RETURNING *
  `;
  const { rows } = await query(sql, [messageId, userId, messageText]);
  return rows[0] || null;
}

/**
 * Soft delete a message
 */
async function deleteMessage(messageId, userId) {
  const sql = `
    UPDATE messages
    SET deleted_at = NOW()
    WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
    RETURNING *
  `;
  const { rows } = await query(sql, [messageId, userId]);
  return rows[0] || null;
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
    WHERE m.conversation_id = $1 AND m.sender_id != $2 AND m.created_at >= NOW() - INTERVAL '48 hours'
    ON CONFLICT (message_id, user_id) DO NOTHING
  `;
  await query(sql, [conversationId, userId]);

  // Update participant last_read_at
  await query(
    `UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  );

  // Update system chat notifications for this user to is_read = true
  await query(
    `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND category = 'chat' AND is_read = false`,
    [userId]
  );
}

/**
 * Get total unread count for a user across all active conversations
 */
async function getUnreadCount(userId) {
  const sql = `
    SELECT COUNT(*)::INT AS total_unread
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1 AND cp.left_at IS NULL
    LEFT JOIN message_reads mr ON mr.message_id = m.id AND mr.user_id = $1
    WHERE m.sender_id != $1 AND mr.id IS NULL AND m.created_at >= NOW() - INTERVAL '48 hours'
      AND (cp.cleared_at IS NULL OR m.created_at > cp.cleared_at)
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
 * Search contacts based on 2-layer platform hierarchy and user role:
 * Layer 1: Default Role / Hierarchy Access
 * Layer 2: Super Admin Assigned Access (messenger_assignments)
 * Identity Masking: Partner / Admin contacts show ONLY Code (e.g., ADM001, PTR001) for non-SuperAdmin views
 */
async function getContactsForUser(userId, userRole, search = '', limit = 50, offset = 0) {
  const searchPattern = `%${(search || '').trim()}%`;
  const roleUpper = (userRole || '').toUpperCase();

  let allowedUsersSQL = '';
  const params = [userId, searchPattern];

  const ADMIN_ROLES = [
    'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD',
    'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE',
    'PAN_CHECKER', 'PAN CHECKER', 'QD_OPERATOR', 'QD OPERATOR', 'REMARK_OPERATOR', 'REMARK OPERATOR'
  ];

  if (roleUpper === 'SUPER_ADMIN') {
    // Super Admin has full access to all active users
    allowedUsersSQL = '';
  } else if (ADMIN_ROLES.includes(roleUpper)) {
    // Admin & Operational Roles default: Super Admin ONLY + Super Admin Assignments
    allowedUsersSQL = `
      AND (
        UPPER(u.role::text) = 'SUPER_ADMIN'
        OR EXISTS (
          SELECT 1 FROM messenger_assignments ma
          WHERE ma.status = 'ACTIVE' AND (
            (ma.account_user_id = $1 AND ma.assigned_messenger_user_id = u.id)
            OR (ma.assigned_messenger_user_id = $1 AND ma.account_user_id = u.id)
          )
        )
      )
    `;
  } else if (roleUpper === 'PARTNER') {
    // Partner default: Super Admin + Own Team Members + Super Admin Assignments
    const { rows: [pProfile] } = await query(
      `SELECT id, parent_partner_id FROM partner_profiles WHERE user_id = $1`,
      [userId]
    );

    if (pProfile && pProfile.parent_partner_id) {
      // Sub-partner / Team Member: Super Admin & Parent Partner + Assignments
      const { rows: [parentProfile] } = await query(
        `SELECT user_id FROM partner_profiles WHERE id = $1`,
        [pProfile.parent_partner_id]
      );
      const parentUserId = parentProfile?.user_id || null;
      params.push(parentUserId);
      allowedUsersSQL = `
        AND (
          UPPER(u.role::text) = 'SUPER_ADMIN'
          OR ($3::uuid IS NOT NULL AND u.id = $3::uuid)
          OR EXISTS (
            SELECT 1 FROM messenger_assignments ma
            WHERE ma.status = 'ACTIVE' AND (
              (ma.account_user_id = $1 AND ma.assigned_messenger_user_id = u.id)
              OR (ma.assigned_messenger_user_id = $1 AND ma.account_user_id = u.id)
            )
          )
        )
      `;
    } else if (pProfile) {
      // Main Partner: Super Admin & Team Members under parent_partner_id + Assignments
      params.push(pProfile.id);
      allowedUsersSQL = `
        AND (
          UPPER(u.role::text) = 'SUPER_ADMIN'
          OR EXISTS (
            SELECT 1 FROM partner_profiles sub_pp WHERE sub_pp.user_id = u.id AND sub_pp.parent_partner_id = $3::uuid
          )
          OR EXISTS (
            SELECT 1 FROM messenger_assignments ma
            WHERE ma.status = 'ACTIVE' AND (
              (ma.account_user_id = $1 AND ma.assigned_messenger_user_id = u.id)
              OR (ma.assigned_messenger_user_id = $1 AND ma.account_user_id = u.id)
            )
          )
        )
      `;
    } else {
      allowedUsersSQL = `
        AND (
          UPPER(u.role::text) = 'SUPER_ADMIN'
          OR EXISTS (
            SELECT 1 FROM messenger_assignments ma
            WHERE ma.status = 'ACTIVE' AND (
              (ma.account_user_id = $1 AND ma.assigned_messenger_user_id = u.id)
              OR (ma.assigned_messenger_user_id = $1 AND ma.account_user_id = u.id)
            )
          )
        )
      `;
    }
  } else if (['EMPLOYEE', 'TELECALLER', 'TEAM_LEADER'].includes(roleUpper)) {
    // Employee default: Upward hierarchy ONLY (Level > current_level) + Super Admin + Super Admin Assignments
    const { rows: [empCurrent] } = await query(
      `SELECT designation FROM employees WHERE user_id = $1`,
      [userId]
    );
    const currDesignation = (empCurrent?.designation || '').toUpperCase();
    let currentLevel = 1; // Telecaller / TC
    if (currDesignation.includes('BRANCH')) currentLevel = 5;
    else if (currDesignation.includes('SENIOR MANAGER') || currDesignation.includes('SR MANAGER')) currentLevel = 4;
    else if (currDesignation.includes('MANAGER')) currentLevel = 3;
    else if (currDesignation.includes('TEAM LEADER') || currDesignation.includes('TL')) currentLevel = 2;

    params.push(currentLevel);
    const levelParamIdx = params.length;

    allowedUsersSQL = `
      AND (
        UPPER(u.role::text) = 'SUPER_ADMIN'
        OR (
          UPPER(u.role::text) = 'EMPLOYEE'
          AND EXISTS (
            SELECT 1 FROM employees target_emp
            WHERE target_emp.user_id = u.id
            AND (
              CASE
                WHEN UPPER(target_emp.designation) LIKE '%BRANCH%' THEN 5
                WHEN UPPER(target_emp.designation) LIKE '%SENIOR%MANAGER%' OR UPPER(target_emp.designation) LIKE '%SR%MANAGER%' THEN 4
                WHEN UPPER(target_emp.designation) LIKE '%MANAGER%' THEN 3
                WHEN UPPER(target_emp.designation) LIKE '%TEAM%LEADER%' OR UPPER(target_emp.designation) LIKE '%TL%' THEN 2
                ELSE 1
              END
            ) > $${levelParamIdx}
          )
        )
        OR EXISTS (
          SELECT 1 FROM messenger_assignments ma
          WHERE ma.status = 'ACTIVE' AND (
            (ma.account_user_id = $1 AND ma.assigned_messenger_user_id = u.id)
            OR (ma.assigned_messenger_user_id = $1 AND ma.account_user_id = u.id)
          )
        )
      )
    `;
  }

  const sql = `
    SELECT 
      u.id, 
      COALESCE(NULLIF(TRIM(u.full_name), ''), NULLIF(TRIM(CONCAT(pp.first_name, ' ', pp.last_name)), ''), NULLIF(TRIM(emp.full_name), ''), u.email, 'User Profile') AS full_name, 
      u.email, 
      u.mobile, 
      u.role, 
      u.department, 
      u.designation,
      u.last_active_at,
      u.last_logout_at,
      u.last_login,
      pp.partner_code,
      emp.employee_id AS employee_code
    FROM users u
    LEFT JOIN partner_profiles pp ON pp.user_id = u.id
    LEFT JOIN employees emp ON emp.user_id = u.id
    WHERE u.id != $1 
      AND u.is_active = TRUE
      ${allowedUsersSQL}
      AND (
        u.full_name ILIKE $2 OR 
        u.email ILIKE $2 OR 
        u.mobile ILIKE $2 OR 
        pp.partner_code ILIKE $2 OR
        emp.employee_id ILIKE $2
      )
    ORDER BY u.full_name ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(Math.max(1, parseInt(limit, 10) || 50), Math.max(0, parseInt(offset, 10) || 0));
  const { rows } = await query(sql, params);

  // Identity Masking: For Admin and Partner viewing assigned or restricted contacts, show ONLY Code (e.g., ADM001, PTR001)
  if (ADMIN_ROLES.includes(roleUpper) || roleUpper === 'PARTNER') {
    return rows.map(r => {
      if ((r.role || '').toUpperCase() === 'SUPER_ADMIN') {
        return r;
      }
      const code = r.partner_code || r.employee_code || `USR-${(r.id || '').slice(0, 6).toUpperCase()}`;
      return {
        ...r,
        full_name: code,
        display_code_only: true,
        email: '[Protected]',
        mobile: '[Protected]'
      };
    });
  }

  return rows;
}

async function clearConversationForUser(conversationId, userId) {
  const sql = `
    UPDATE conversation_participants
    SET cleared_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2
  `;
  const result = await query(sql, [conversationId, userId]);
  return result.rowCount > 0;
}

async function leaveConversationForUser(conversationId, userId) {
  const sql = `
    UPDATE conversation_participants
    SET left_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2
  `;
  const result = await query(sql, [conversationId, userId]);
  return result.rowCount > 0;
}

async function deleteConversationForUser(conversationId, userId) {
  const sql = `
    UPDATE conversation_participants
    SET left_at = NOW(), cleared_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2
  `;
  const result = await query(sql, [conversationId, userId]);
  return result.rowCount > 0;
}

/**
 * Assign Messengers to an account (Super Admin action with defense-in-depth)
 */
async function assignMessengers(accountUserId, assignedMessengerUserIds = [], assignedBy) {
  if (!accountUserId || !assignedMessengerUserIds.length) return [];

  // Defense in depth: Verify assignedBy is an active Super Admin
  const { rows: admins } = await query(
    `SELECT id FROM users WHERE id = $1 AND UPPER(role::text) = 'SUPER_ADMIN' AND is_active = TRUE`,
    [assignedBy]
  );
  if (!admins.length) {
    throw new Error('Only an active Super Admin can create Messenger assignments.');
  }

  // Validate account user exists and is active
  const { rows: accountUsers } = await query(
    `SELECT id FROM users WHERE id = $1 AND is_active = TRUE`,
    [accountUserId]
  );
  if (!accountUsers.length) {
    throw new Error('Account user does not exist or is inactive.');
  }

  // Validate assigned messenger users exist and are active
  const { rows: validMessengerUsers } = await query(
    `SELECT id FROM users WHERE id = ANY($1::uuid[]) AND is_active = TRUE`,
    [assignedMessengerUserIds]
  );
  const validMessengerIds = new Set(validMessengerUsers.map(u => u.id));

  const results = [];
  for (const targetId of assignedMessengerUserIds) {
    if (accountUserId === targetId) continue; // Prevent self-assignment
    if (!validMessengerIds.has(targetId)) continue; // Skip inactive/invalid target users

    const sql = `
      INSERT INTO messenger_assignments (account_user_id, assigned_messenger_user_id, assigned_by, status, removed_by, removed_at)
      VALUES ($1, $2, $3, 'ACTIVE', NULL, NULL)
      ON CONFLICT (account_user_id, assigned_messenger_user_id)
      DO UPDATE SET status = 'ACTIVE', updated_at = NOW(), assigned_by = $3, removed_by = NULL, removed_at = NULL
      RETURNING *
    `;
    const { rows } = await query(sql, [accountUserId, targetId, assignedBy]);
    if (rows[0]) results.push(rows[0]);
  }
  return results;
}

/**
 * Get all active messenger assignments for Super Admin view
 */
async function getAllMessengerAssignments() {
  const sql = `
    SELECT 
      ma.id,
      ma.account_user_id,
      ma.assigned_messenger_user_id,
      ma.status,
      ma.created_at,
      u_acc.full_name AS account_name,
      u_acc.role AS account_role,
      u_acc.email AS account_email,
      pp_acc.partner_code AS account_partner_code,
      emp_acc.employee_id AS account_employee_code,

      u_target.full_name AS messenger_name,
      u_target.role AS messenger_role,
      u_target.email AS messenger_email,
      pp_target.partner_code AS messenger_partner_code,
      emp_target.employee_id AS messenger_employee_code
    FROM messenger_assignments ma
    JOIN users u_acc ON u_acc.id = ma.account_user_id
    LEFT JOIN partner_profiles pp_acc ON pp_acc.user_id = u_acc.id
    LEFT JOIN employees emp_acc ON emp_acc.user_id = u_acc.id
    JOIN users u_target ON u_target.id = ma.assigned_messenger_user_id
    LEFT JOIN partner_profiles pp_target ON pp_target.user_id = u_target.id
    LEFT JOIN employees emp_target ON emp_target.user_id = u_target.id
    WHERE ma.status = 'ACTIVE'
    ORDER BY ma.created_at DESC
  `;
  const { rows } = await query(sql);
  return rows;
}

/**
 * Soft delete a messenger assignment with audit trail (removed_by, removed_at)
 */
async function removeMessengerAssignment(assignmentId, removedBy) {
  // Defense in depth: Verify removedBy is an active Super Admin
  const { rows: admins } = await query(
    `SELECT id FROM users WHERE id = $1 AND UPPER(role::text) = 'SUPER_ADMIN' AND is_active = TRUE`,
    [removedBy]
  );
  if (!admins.length) {
    throw new Error('Only an active Super Admin can remove Messenger assignments.');
  }

  const sql = `
    UPDATE messenger_assignments
    SET status = 'INACTIVE',
        removed_by = $2,
        removed_at = NOW(),
        updated_at = NOW()
    WHERE id = $1 AND status = 'ACTIVE'
    RETURNING *
  `;
  const { rows } = await query(sql, [assignmentId, removedBy]);
  return rows[0] || null;
}

/**
 * Get candidate accounts for Super Admin assignment
 */
async function getAllAccountsForAssignment() {
  const sql = `
    SELECT 
      u.id, 
      COALESCE(NULLIF(TRIM(u.full_name), ''), NULLIF(TRIM(CONCAT(pp.first_name, ' ', pp.last_name)), ''), NULLIF(TRIM(emp.full_name), ''), u.email, 'User Profile') AS full_name, 
      u.email, 
      u.mobile, 
      u.role, 
      pp.partner_code,
      emp.employee_id AS employee_code
    FROM users u
    LEFT JOIN partner_profiles pp ON pp.user_id = u.id
    LEFT JOIN employees emp ON emp.user_id = u.id
    WHERE u.is_active = TRUE
    ORDER BY u.role ASC, u.full_name ASC
  `;
  const { rows } = await query(sql);
  return rows;
}

/**
 * Remove participant from group conversation
 */
async function removeParticipant(conversationId, userId) {
  const sql = `
    UPDATE conversation_participants
    SET left_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
    RETURNING *
  `;
  const { rows } = await query(sql, [conversationId, userId]);
  return rows[0] || null;
}

async function updateGroupName(conversationId, name) {
  const sql = `
    UPDATE conversations
    SET name = $2, updated_at = NOW()
    WHERE id = $1 AND conversation_type IN ('GROUP', 'DEPARTMENT')
    RETURNING *
  `;
  const { rows } = await query(sql, [conversationId, name]);
  return rows[0] || null;
}

module.exports = {
  getConversationsForUser,
  findDirectConversation,
  findApplicationConversation,
  createConversation,
  updateGroupName,
  addParticipant,
  removeParticipant,
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
  getContactsForUser,
  clearConversationForUser,
  leaveConversationForUser,
  deleteConversationForUser,
  getMessageById,
  editMessage,
  deleteMessage,
  assignMessengers,
  getAllMessengerAssignments,
  removeMessengerAssignment,
  getAllAccountsForAssignment
};
