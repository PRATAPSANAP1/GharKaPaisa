const repo = require('./messenger.repository');
const { query } = require('../../config/database');
const { createNotification } = require('../notifications/service');

/**
 * Mask sensitive data in message text:
 * - Mobile Numbers: mask last 6 digits with ****** (e.g., 9876543210 -> 9876******)
 * - PAN Card: mask last 6 characters with ****** (e.g., ABCDE1234F -> ABCD******)
 */
function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') return text;

  // 1. Mask PAN Card (5 letters + 4 digits + 1 letter -> ABCD******)
  let masked = text.replace(/\b([A-Za-z]{5}[0-9]{4}[A-Za-z]{1})\b/gi, (match) => {
    return match.slice(0, 4) + '******';
  });

  // 2. Mask +91 / 91 12-digit Indian mobile numbers (e.g. +919876543210 -> +919876******)
  masked = masked.replace(/(\+?91[\s-]?)?([6-9]\d{3})(\d{6})\b/g, (match, countryCode, prefix, lastSix) => {
    const code = countryCode || '';
    return `${code}${prefix}******`;
  });

  // 3. Mask standalone 10 to 12 digit phone number blocks
  masked = masked.replace(/\b([0-9]{4,6})([0-9]{6})\b/g, (match, prefix, lastSix) => {
    return `${prefix}******`;
  });

  return masked;
}

async function listConversations(userId, filter, search, userRole) {
  const convs = await repo.getConversationsForUser(userId, filter, search);
  return convs.map(c => ({
    ...c,
    last_message_text: maskSensitiveData(c.last_message_text)
  }));
}

async function isSameEmployeeHierarchy(userAId, userBId) {
  const { rows } = await query(`
    SELECT 1 FROM employees emp_a
    JOIN employees emp_b ON emp_b.user_id = $2
    LEFT JOIN employee_hierarchy eh_a ON eh_a.employee_id = emp_a.id
    LEFT JOIN employee_hierarchy eh_b ON eh_b.employee_id = emp_b.id
    WHERE emp_a.user_id = $1
    AND (
      (emp_a.department IS NOT NULL AND emp_b.department IS NOT NULL AND LOWER(emp_a.department) = LOWER(emp_b.department))
      OR eh_b.manager_id = emp_a.id
      OR eh_b.team_leader_id = emp_a.id
      OR eh_a.manager_id = emp_b.id
      OR eh_a.team_leader_id = emp_b.id
      OR (eh_a.manager_id IS NOT NULL AND eh_a.manager_id = eh_b.manager_id)
      OR (eh_a.team_leader_id IS NOT NULL AND eh_a.team_leader_id = eh_b.team_leader_id)
    )
    LIMIT 1
  `, [userAId, userBId]);

  return rows.length > 0;
}

async function canUserMessageTarget(currentUserId, currentRole, targetUserId, targetRole) {
  if (currentRole === 'SUPER_ADMIN') return true;

  // Check if explicitly assigned in messenger_assignments
  const { rows: assignCheck } = await query(`
    SELECT 1 FROM messenger_assignments 
    WHERE status = 'ACTIVE' 
      AND ((account_user_id = $1 AND assigned_messenger_user_id = $2) OR (account_user_id = $2 AND assigned_messenger_user_id = $1))
    LIMIT 1
  `, [currentUserId, targetUserId]);

  if (assignCheck.length > 0) return true;

  // Target is Super Admin -> Always allowed
  if (targetRole === 'SUPER_ADMIN') return true;

  // Default Role Rules:
  if (currentRole === 'ADMIN') {
    // Admin can ONLY message Super Admin unless assigned
    return false;
  }

  if (currentRole === 'PARTNER') {
    // Partner default: Super Admin + Own Team Members
    const { rows: [pProfile] } = await query(`SELECT id, parent_partner_id FROM partner_profiles WHERE user_id = $1`, [currentUserId]);
    if (pProfile && pProfile.parent_partner_id) {
      const { rows: [parentP] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [pProfile.parent_partner_id]);
      return parentP?.user_id === targetUserId;
    } else if (pProfile) {
      const { rows: [targetP] } = await query(`SELECT parent_partner_id FROM partner_profiles WHERE user_id = $1`, [targetUserId]);
      return targetP?.parent_partner_id === pProfile.id;
    }
    return false;
  }

  if (['EMPLOYEE', 'TELECALLER', 'TEAM_LEADER'].includes(currentRole)) {
    // Upward hierarchy only
    if (targetRole !== 'EMPLOYEE') return false;
    const { rows: [empCurr] } = await query(`SELECT designation FROM employees WHERE user_id = $1`, [currentUserId]);
    const { rows: [empTarget] } = await query(`SELECT designation FROM employees WHERE user_id = $1`, [targetUserId]);
    if (!empCurr || !empTarget) return false;

    const getRank = (desig) => {
      const d = (desig || '').toUpperCase();
      if (d.includes('BRANCH')) return 5;
      if (d.includes('SENIOR MANAGER') || d.includes('SR MANAGER')) return 4;
      if (d.includes('MANAGER')) return 3;
      if (d.includes('TEAM LEADER') || d.includes('TL')) return 2;
      return 1;
    };

    return getRank(empTarget.designation) > getRank(empCurr.designation);
  }

  return false;
}

async function startOrGetDirectChat(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) {
    throw new Error('You cannot start a direct chat with yourself.');
  }

  // Verify users exist & check role hierarchy
  const { rows: [currentUser] } = await query(`SELECT id, role FROM users WHERE id = $1`, [currentUserId]);
  const { rows: [targetUser] } = await query(`SELECT id, full_name, role FROM users WHERE id = $1`, [targetUserId]);

  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  const currentRole = (currentUser?.role || '').toUpperCase();
  const targetRole = (targetUser?.role || '').toUpperCase();

  const isAllowed = await canUserMessageTarget(currentUserId, currentRole, targetUserId, targetRole);
  if (!isAllowed) {
    throw new Error('Access denied: You do not have permission to message this contact based on role hierarchy or assignments.');
  }

  // Check if conversation already exists
  let conv = await repo.findDirectConversation(currentUserId, targetUserId);
  if (!conv) {
    conv = await repo.createConversation({
      conversation_type: 'DIRECT',
      name: null,
      created_by: currentUserId
    });
    await repo.addParticipant({ conversation_id: conv.id, user_id: currentUserId, role: 'ADMIN' });
    await repo.addParticipant({ conversation_id: conv.id, user_id: targetUserId, role: 'MEMBER' });
  }

  return await repo.getConversationById(conv.id, currentUserId);
}

async function startOrGetApplicationChat(currentUserId, applicationId) {
  const { rows: [app] } = await query(
    `SELECT a.id, a.app_number, a.status, c.full_name AS customer_name
     FROM applications a
     LEFT JOIN customers c ON c.id = a.customer_id
     WHERE a.id = $1 OR a.app_number = $1`,
    [applicationId]
  );
  if (!app) {
    throw new Error('Application not found.');
  }

  let conv = await repo.findApplicationConversation(app.id);
  if (!conv) {
    conv = await repo.createConversation({
      conversation_type: 'APPLICATION',
      name: `Application #${app.app_number}`,
      description: `Discussion channel for Application #${app.app_number}`,
      application_id: app.id,
      created_by: currentUserId
    });
  }

  const isPart = await repo.isParticipant(conv.id, currentUserId);
  if (!isPart) {
    await repo.addParticipant({ conversation_id: conv.id, user_id: currentUserId, role: 'MEMBER' });
  }

  return await repo.getConversationById(conv.id);
}

async function createGroup(currentUserId, { name, description, memberUserIds = [] }) {
  if (!name || !name.trim()) {
    throw new Error('Group name is required.');
  }

  const uniqueMemberIds = Array.from(new Set(memberUserIds.filter(id => id && id !== currentUserId)));

  const conv = await repo.createConversation({
    conversation_type: 'GROUP',
    name: name.trim(),
    description: description ? description.trim() : null,
    created_by: currentUserId
  });

  await repo.addParticipant({ conversation_id: conv.id, user_id: currentUserId, role: 'ADMIN' });

  for (const mId of uniqueMemberIds) {
    await repo.addParticipant({ conversation_id: conv.id, user_id: mId, role: 'MEMBER' });
  }

  return await repo.getConversationById(conv.id);
}

async function getConversationDetails(conversationId, userId) {
  const isPart = await repo.isParticipant(conversationId, userId);
  if (!isPart) {
    throw new Error('Access denied to this conversation.');
  }
  const conv = await repo.getConversationById(conversationId);
  const participants = await repo.getConversationParticipants(conversationId);
  return { ...conv, participants };
}

async function getMessages(conversationId, userId, limit = 50, offset = 0) {
  const isPart = await repo.isParticipant(conversationId, userId);
  if (!isPart) {
    throw new Error('Access denied to this conversation.');
  }
  await repo.markMessagesAsRead(conversationId, userId);
  const messages = await repo.getMessages(conversationId, userId, limit, offset);

  return messages.map(m => ({
    ...m,
    message_text: maskSensitiveData(m.message_text)
  }));
}

async function postMessage(senderId, { conversation_id, message_type = 'TEXT', message_text, reply_to_message_id, attachments = [] }) {
  const isPart = await repo.isParticipant(conversation_id, senderId);
  if (!isPart) {
    throw new Error('You are not a participant of this conversation.');
  }

  if (!message_text && (!attachments || attachments.length === 0)) {
    throw new Error('Cannot send empty message.');
  }

  // Automatically mask sensitive phone numbers and PAN numbers
  const maskedText = maskSensitiveData(message_text || '');

  const message = await repo.createMessage({
    conversation_id,
    sender_id: senderId,
    message_type,
    message_text: maskedText,
    reply_to_message_id
  });

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      await repo.createAttachment({
        message_id: message.id,
        file_name: att.file_name || 'Attachment',
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        storage_key: att.storage_key
      });
    }
  }

  const snippet = maskedText || (attachments.length > 0 ? `📷 [${attachments.length} File Attachment]` : '');
  await repo.updateConversationLastMessage(conversation_id, message.id, snippet);
  await repo.markMessagesAsRead(conversation_id, senderId);

  // Dispatch real-time in-app notification & SSE push to all other conversation participants
  try {
    const { rows: [sender] } = await query(`SELECT full_name, role FROM users WHERE id = $1`, [senderId]);
    const senderName = sender?.full_name || 'Someone';
    const preview = snippet.length > 80 ? snippet.slice(0, 80) + '...' : snippet;

    const participants = await repo.getConversationParticipants(conversation_id);
    for (const p of participants) {
      if (p.user_id && p.user_id !== senderId) {
        const recipientRole = (p.role || '').toUpperCase();
        let link = '/admin/messenger';
        if (recipientRole === 'SUPER_ADMIN') link = '/super-admin/messenger';
        else if (['ADMIN', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'REMARK_OPERATOR', 'QD_OPERATOR', 'PAN_CHECKER'].includes(recipientRole)) link = '/admin/messenger';
        else if (['EMPLOYEE', 'TELECALLER', 'TEAM_LEADER'].includes(recipientRole)) link = '/employee/messenger';
        else if (['PARTNER', 'TEAM_MEMBER'].includes(recipientRole)) link = '/partner/messenger';

        await createNotification(
          p.user_id,
          `💬 New message from ${senderName}`,
          preview,
          'info',
          link,
          { category: 'chat', priority: 'normal' }
        );
      }
    }
  } catch (notifErr) {
    console.error('Failed to dispatch messenger notification:', notifErr.message);
  }

  return message;
}

async function markConversationAsRead(conversationId, userId) {
  await repo.markMessagesAsRead(conversationId, userId);
  return { success: true };
}

async function getUserUnreadCount(userId) {
  return await repo.getUnreadCount(userId);
}

async function getContacts(user, queryText) {
  return await repo.getContactsForUser(user.id, user.role, queryText);
}

async function togglePinConversation(conversationId, userId) {
  const isPinned = await repo.togglePin(conversationId, userId);
  return { conversation_id: conversationId, is_pinned: isPinned };
}

// ── Super Admin Read-Only Audit Functions ──
async function searchUsersForAdminAudit(searchTerm) {
  const pattern = `%${(searchTerm || '').trim()}%`;
  const sql = `
    SELECT 
      u.id, u.full_name, u.email, u.mobile, u.role,
      pp.partner_code, emp.employee_id AS employee_code
    FROM users u
    LEFT JOIN partner_profiles pp ON pp.user_id = u.id
    LEFT JOIN employees emp ON emp.user_id = u.id
    WHERE u.is_active = TRUE
      AND (
        u.full_name ILIKE $1 OR 
        u.email ILIKE $1 OR 
        u.mobile ILIKE $1 OR 
        pp.partner_code ILIKE $1 OR
        emp.employee_id ILIKE $1
      )
    ORDER BY u.full_name ASC
    LIMIT 20
  `;
  const { rows } = await query(sql, [pattern]);
  return rows;
}

async function getAdminAuditConversations(targetUserId) {
  const convs = await repo.getConversationsForUser(targetUserId, 'ALL', '');
  return convs.map(c => ({
    ...c,
    last_message_text: maskSensitiveData(c.last_message_text)
  }));
}

async function getAdminAuditMessages(conversationId) {
  const messages = await repo.getMessages(conversationId, 100, 0);
  return messages.map(m => ({
    ...m,
    message_text: maskSensitiveData(m.message_text)
  }));
}

async function clearUserConversation(conversationId, userId) {
  const isPart = await repo.isParticipant(conversationId, userId);
  if (!isPart) {
    throw new Error('Access denied. You are not a participant of this conversation.');
  }
  return await repo.clearConversationForUser(conversationId, userId);
}

async function leaveUserConversation(conversationId, userId) {
  const isPart = await repo.isParticipant(conversationId, userId);
  if (!isPart) {
    throw new Error('Access denied. You are not a participant of this conversation.');
  }
  return await repo.leaveConversationForUser(conversationId, userId);
}

async function deleteUserConversation(conversationId, userId) {
  const isPart = await repo.isParticipant(conversationId, userId);
  if (!isPart) {
    throw new Error('Access denied. You are not a participant of this conversation.');
  }
  return await repo.deleteConversationForUser(conversationId, userId);
}

async function editUserMessage(userId, messageId, messageText) {
  const msg = await repo.getMessageById(messageId);
  if (!msg) {
    throw new Error('Message not found.');
  }
  if (msg.sender_id !== userId) {
    throw new Error('Access denied. You can only edit your own messages.');
  }
  const updated = await repo.editMessage(messageId, userId, messageText);
  if (updated && updated.message_text) {
    updated.message_text = maskSensitiveData(updated.message_text);
  }
  return updated;
}

async function deleteUserMessage(userId, messageId) {
  const msg = await repo.getMessageById(messageId);
  if (!msg) {
    throw new Error('Message not found.');
  }
  if (msg.sender_id !== userId) {
    throw new Error('Access denied. You can only delete your own messages.');
  }
  return await repo.deleteMessage(messageId, userId);
}

async function assignMessengers(accountUserId, assignedMessengerUserIds, assignedBy) {
  return await repo.assignMessengers(accountUserId, assignedMessengerUserIds, assignedBy);
}

async function getAllMessengerAssignments() {
  return await repo.getAllMessengerAssignments();
}

async function removeMessengerAssignment(assignmentId) {
  return await repo.removeMessengerAssignment(assignmentId);
}

async function getAllAccountsForAssignment() {
  return await repo.getAllAccountsForAssignment();
}

module.exports = {
  maskSensitiveData,
  listConversations,
  startOrGetDirectChat,
  startOrGetApplicationChat,
  createGroup,
  getConversationDetails,
  getMessages,
  postMessage,
  markConversationAsRead,
  getUserUnreadCount,
  getContacts,
  togglePinConversation,
  searchUsersForAdminAudit,
  getAdminAuditConversations,
  getAdminAuditMessages,
  clearUserConversation,
  leaveUserConversation,
  deleteUserConversation,
  editUserMessage,
  deleteUserMessage,
  assignMessengers,
  getAllMessengerAssignments,
  removeMessengerAssignment,
  getAllAccountsForAssignment
};
