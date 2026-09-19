const repo = require('./messenger.repository');
const { query } = require('../../config/database');

async function listConversations(userId, filter, search) {
  return await repo.getConversationsForUser(userId, filter, search);
}

async function isSameEmployeeHierarchy(userAId, userBId) {
  const { rows } = await query(`
    SELECT 1 FROM employees emp_a
    LEFT JOIN employee_hierarchy eh_a ON eh_a.employee_id = emp_a.id
    LEFT JOIN employees emp_b ON emp_b.user_id = $2
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
  `, [userAId, userBId]);

  return rows.length > 0;
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

  // Employee-to-employee direct messaging restriction
  if (
    (currentUser?.role || '').toUpperCase() === 'EMPLOYEE' &&
    (targetUser?.role || '').toUpperCase() === 'EMPLOYEE'
  ) {
    const isHierarchyAllowed = await isSameEmployeeHierarchy(currentUserId, targetUserId);
    if (!isHierarchyAllowed) {
      throw new Error('Employees can only message other employees within the same team or hierarchy.');
    }
  }

  // Check if conversation already exists
  let conv = await repo.findDirectConversation(currentUserId, targetUserId);
  if (!conv) {
    conv = await repo.createConversation({
      conversation_type: 'DIRECT',
      name: targetUser.full_name,
      created_by: currentUserId
    });
    await repo.addParticipant({ conversation_id: conv.id, user_id: currentUserId, role: 'ADMIN' });
    await repo.addParticipant({ conversation_id: conv.id, user_id: targetUserId, role: 'MEMBER' });
  }

  return await repo.getConversationById(conv.id);
}

async function startOrGetApplicationChat(currentUserId, applicationId) {
  // Check if application exists
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

  // Ensure current user is participant
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

  const { rows: [currentUser] } = await query(`SELECT id, role FROM users WHERE id = $1`, [currentUserId]);
  const isEmployeeRole = (currentUser?.role || '').toUpperCase() === 'EMPLOYEE';

  const uniqueMemberIds = Array.from(new Set(memberUserIds.filter(id => id && id !== currentUserId)));

  if (isEmployeeRole) {
    for (const mId of uniqueMemberIds) {
      const { rows: [mUser] } = await query(`SELECT id, role FROM users WHERE id = $1`, [mId]);
      if (mUser && (mUser.role || '').toUpperCase() === 'EMPLOYEE') {
        const isAllowed = await isSameEmployeeHierarchy(currentUserId, mId);
        if (!isAllowed) {
          throw new Error('Employees can only add team members within the same hierarchy to group chats.');
        }
      }
    }
  }

  const conv = await repo.createConversation({
    conversation_type: 'GROUP',
    name: name.trim(),
    description: description ? description.trim() : null,
    created_by: currentUserId
  });

  // Add creator as ADMIN
  await repo.addParticipant({ conversation_id: conv.id, user_id: currentUserId, role: 'ADMIN' });

  // Add other members
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
  // Auto mark read when fetching messages
  await repo.markMessagesAsRead(conversationId, userId);
  return await repo.getMessages(conversationId, limit, offset);
}

async function postMessage(senderId, { conversation_id, message_type = 'TEXT', message_text, reply_to_message_id, attachments = [] }) {
  const isPart = await repo.isParticipant(conversation_id, senderId);
  if (!isPart) {
    throw new Error('You are not a participant of this conversation.');
  }

  if (!message_text && (!attachments || attachments.length === 0)) {
    throw new Error('Cannot send empty message.');
  }

  const message = await repo.createMessage({
    conversation_id,
    sender_id: senderId,
    message_type,
    message_text: message_text || '',
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

  const snippet = message_text || (attachments.length > 0 ? `📷 [${attachments.length} File Attachment]` : '');
  await repo.updateConversationLastMessage(conversation_id, message.id, snippet);
  await repo.markMessagesAsRead(conversation_id, senderId);

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

module.exports = {
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
  togglePinConversation
};
