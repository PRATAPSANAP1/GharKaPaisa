const repo = require('./messenger.repository');
const { query } = require('../../config/database');

/**
 * Mask sensitive data in message text:
 * - Mobile Numbers: mask last 6 digits with ****** (e.g., 9876543210 -> 9876******)
 * - PAN Card: mask last 6 characters with ****** (e.g., ABCDE1234F -> ABCD******)
 */
function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') return text;

  // Preserve Application Numbers (e.g. APP2026092456317, APP-12345, #APP...) so they are NEVER masked
  const appNumbers = [];
  let preservedText = text.replace(/(?:APP|app|#APP|Application\s*#?)[A-Za-z0-9_-]+/gi, (match) => {
    appNumbers.push(match);
    return `__APP_NUM_TOKEN_${appNumbers.length - 1}__`;
  });

  // 1. Mask PAN Card (5 letters + 4 digits + 1 letter -> ABCD******)
  let masked = preservedText.replace(/\b([A-Za-z]{5}[0-9]{4}[A-Za-z]{1})\b/gi, (match) => {
    return match.slice(0, 4) + '******';
  });

  // 2. Mask +91 / 91 10-digit Indian mobile numbers (e.g. +919876543210 -> +919876******)
  masked = masked.replace(/(\+?91[\s-]?)?([6-9]\d{3})(\d{6})\b/g, (match, countryCode, prefix) => {
    const code = countryCode || '';
    return `${code}${prefix}******`;
  });

  // 3. Mask standalone 10 to 12 digit phone number blocks
  masked = masked.replace(/\b([6-9]\d{3})(\d{6})\b/g, (match, prefix) => {
    return `${prefix}******`;
  });

  // Restore preserved Application Numbers intact
  masked = masked.replace(/__APP_NUM_TOKEN_(\d+)__/g, (_, idx) => {
    return appNumbers[parseInt(idx, 10)] || '';
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
  const ADMIN_ROLES = [
    'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD',
    'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE',
    'PAN_CHECKER', 'PAN CHECKER', 'QD_OPERATOR', 'QD OPERATOR', 'REMARK_OPERATOR', 'REMARK OPERATOR'
  ];

  if (ADMIN_ROLES.includes(currentRole)) {
    // Admin & Operational roles can ONLY message Super Admin unless explicitly assigned
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
  const { rows: [currentUser] } = await query(`SELECT id, role, designation FROM users WHERE id = $1`, [currentUserId]);
  const { rows: [targetUser] } = await query(`SELECT id, full_name, role, designation FROM users WHERE id = $1`, [targetUserId]);

  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  const currentRole = (currentUser?.role || currentUser?.designation || '').toUpperCase();
  const targetRole = (targetUser?.role || targetUser?.designation || '').toUpperCase();

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
    `SELECT a.id, a.app_number, a.status, a.employee_id, a.partner_id, a.created_by, c.full_name AS customer_name
     FROM applications a
     LEFT JOIN customers c ON c.id = a.customer_id
     WHERE a.id = $1 OR a.app_number = $1`,
    [applicationId]
  );
  if (!app) {
    throw new Error('Application not found.');
  }

  // Authorization check for Application Chat: Verify current user has CRM permission to access this application
  const { rows: [currentUser] } = await query(`SELECT id, role, designation FROM users WHERE id = $1`, [currentUserId]);
  const currentRole = (currentUser?.role || currentUser?.designation || '').toUpperCase();

  let hasAccess = false;
  if (currentRole === 'SUPER_ADMIN') {
    hasAccess = true;
  } else if (app.employee_id === currentUserId || app.created_by === currentUserId) {
    hasAccess = true;
  } else if (currentRole === 'PARTNER') {
    const { rows: [pProfile] } = await query(`SELECT id, parent_partner_id FROM partner_profiles WHERE user_id = $1`, [currentUserId]);
    if (pProfile && (pProfile.id === app.partner_id || (pProfile.parent_partner_id && pProfile.parent_partner_id === app.partner_id))) {
      hasAccess = true;
    }
  } else {
    // Admin, Employee & Operational Staff handling applications
    const ADMIN_ROLES = [
      'ADMIN', 'EMPLOYEE', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD',
      'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE',
      'PAN_CHECKER', 'PAN CHECKER', 'QD_OPERATOR', 'QD OPERATOR', 'REMARK_OPERATOR', 'REMARK OPERATOR', 'TELECALLER', 'TEAM_LEADER'
    ];
    if (ADMIN_ROLES.includes(currentRole)) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    throw new Error('Access denied: You do not have permission to view or message on this application.');
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

  // Validate group member messaging permissions
  const { rows: [currentUser] } = await query(`SELECT id, role, designation FROM users WHERE id = $1`, [currentUserId]);
  const currentRole = (currentUser?.role || currentUser?.designation || '').toUpperCase();

  for (const mId of uniqueMemberIds) {
    const { rows: [memberUser] } = await query(`SELECT id, full_name, role, designation FROM users WHERE id = $1 AND is_active = TRUE`, [mId]);
    if (!memberUser) {
      throw new Error(`Selected group member user ID ${mId} not found or inactive.`);
    }
    const memberRole = (memberUser.role || memberUser.designation || '').toUpperCase();
    const isAllowed = await canUserMessageTarget(currentUserId, currentRole, memberUser.id, memberRole);
    if (!isAllowed) {
      throw new Error(`Access denied: You do not have Messenger permission for member "${memberUser.full_name || mId}".`);
    }
  }

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

async function resolveIsSuperAdmin(userId, userOrRole = null) {
  const normalize = (val) => String(val || '').trim().toUpperCase().replace(/[\s\_]+/g, '');

  if (userOrRole) {
    if (typeof userOrRole === 'object') {
      const r = normalize(userOrRole.role);
      const d = normalize(userOrRole.designation);
      if (r === 'SUPERADMIN' || d === 'SUPERADMIN') return true;
    } else {
      const r = normalize(userOrRole);
      if (r === 'SUPERADMIN') return true;
    }
  }

  if (userId) {
    try {
      const { rows: [u] } = await query(`SELECT role, designation FROM users WHERE id = $1`, [userId]);
      if (u) {
        const r = normalize(u.role);
        const d = normalize(u.designation);
        if (r === 'SUPERADMIN' || d === 'SUPERADMIN') return true;
      }
    } catch (e) {}
  }

  return false;
}

async function ensureParticipantAccess(conversationId, userId, userOrRole = null) {
  let isPart = await repo.isParticipant(conversationId, userId);
  if (isPart) return true;

  const isSuper = await resolveIsSuperAdmin(userId, userOrRole);
  if (isSuper) {
    await repo.addParticipant({ conversation_id: conversationId, user_id: userId, role: 'ADMIN' });
    return true;
  }

  // Check if conversation exists and auto-enroll if authorized
  const conv = await repo.getConversationById(conversationId);
  if (conv) {
    if (conv.conversation_type === 'APPLICATION' && conv.application_id) {
      const { rows: [app] } = await query(`SELECT id, created_by FROM applications WHERE id = $1 OR app_number = $1`, [conv.application_id]);
      const { rows: [u] } = await query(`SELECT role, designation FROM users WHERE id = $1`, [userId]);
      const uRole = String(u?.role || u?.designation || '').trim().toUpperCase().replace(/[\s\_]+/g, '');
      const ADMIN_ROLES = [
        'ADMIN', 'SUPERADMIN', 'EMPLOYEE', 'OPERATIONALHEAD', 'OPERATIONSHEAD',
        'ADMINISTRATIVEOPERATOR', 'ADMINISTRATIVESALESEXECUTIVE',
        'PANCHECKER', 'QDOPERATOR', 'REMARKOPERATOR', 'TELECALLER', 'TEAMLEADER', 'FINALSTATUSOPERATOR'
      ];
      if (ADMIN_ROLES.includes(uRole) || (app && app.created_by === userId)) {
        await repo.addParticipant({ conversation_id: conversationId, user_id: userId, role: 'MEMBER' });
        return true;
      }
    } else if (conv.conversation_type === 'DIRECT') {
      const { rows: [u] } = await query(`SELECT role, designation FROM users WHERE id = $1`, [userId]);
      if (u) {
        await repo.addParticipant({ conversation_id: conversationId, user_id: userId, role: 'MEMBER' });
        return true;
      }
    }
  }

  return false;
}

async function getConversationDetails(conversationId, userId, userRole = null) {
  const isAuthorized = await ensureParticipantAccess(conversationId, userId, userRole);
  if (!isAuthorized) {
    throw new Error('Access denied to this conversation.');
  }
  const conv = await repo.getConversationById(conversationId);
  const participants = await repo.getConversationParticipants(conversationId);
  return { ...conv, participants };
}

async function getMessages(conversationId, userId, limit = 5000, offset = 0, userRole = null) {
  const isAuthorized = await ensureParticipantAccess(conversationId, userId, userRole);
  if (!isAuthorized) {
    throw new Error('Access denied to this conversation.');
  }
  await repo.markMessagesAsRead(conversationId, userId);
  const messages = await repo.getMessages(conversationId, userId, limit, offset);

  const conv = await repo.getConversationById(conversationId);
  const isGroup = conv && (conv.conversation_type === 'GROUP' || conv.conversation_type === 'DEPARTMENT');
  const isSuperAdmin = await resolveIsSuperAdmin(userId, userRole);

  return messages.map(m => {
    let senderName = m.sender_name;
    if (isGroup && !isSuperAdmin) {
      senderName = 'User';
    }
    return {
      ...m,
      sender_name: senderName,
      message_text: maskSensitiveData(m.message_text)
    };
  });
}

async function postMessage(senderId, { conversation_id, message_type = 'TEXT', message_text, reply_to_message_id, attachments = [] }, userRole = null) {
  const isAuthorized = await ensureParticipantAccess(conversation_id, senderId, userRole);
  if (!isAuthorized) {
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

  const fullMessage = (await repo.getMessageDetails(message.id)) || message;

  // Real-time broadcast to conversation participants across cluster
  const messengerSocket = require('../../socket/messengerSocket');
  messengerSocket.emitNewMessage(conversation_id, fullMessage, senderId);

  return fullMessage;
}

async function markConversationAsRead(conversationId, userId) {
  await repo.markMessagesAsRead(conversationId, userId);
  const messengerSocket = require('../../socket/messengerSocket');
  messengerSocket.emitReadReceipt(conversationId, userId, new Date().toISOString());
  return { success: true };
}

async function getUserUnreadCount(userId) {
  return await repo.getUnreadCount(userId);
}

async function getContacts(user, queryText) {
  const effectiveRole = (user?.role || user?.designation || '').toUpperCase();
  return await repo.getContactsForUser(user.id, effectiveRole, queryText);
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
  const messages = await repo.getMessages(conversationId, null, 5000, 0);
  return messages.map(m => ({
    ...m,
    message_text: maskSensitiveData(m.message_text)
  }));
}

async function clearUserConversation(conversationId, userId, userRole = null) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    const isPart = await repo.isParticipant(conversationId, userId);
    if (!isPart) {
      throw new Error('Access denied. You are not a participant of this conversation.');
    }
  }
  return await repo.clearConversationForUser(conversationId, userId);
}

async function leaveUserConversation(conversationId, userId, userRole = null) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    const isPart = await repo.isParticipant(conversationId, userId);
    if (!isPart) {
      throw new Error('Access denied. You are not a participant of this conversation.');
    }
  }
  return await repo.leaveConversationForUser(conversationId, userId);
}

async function deleteUserConversation(conversationId, userId, userRole = null) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    const isPart = await repo.isParticipant(conversationId, userId);
    if (!isPart) {
      throw new Error('Access denied. You are not a participant of this conversation.');
    }
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
  const fullMessage = (await repo.getMessageDetails(messageId)) || updated;
  const messengerSocket = require('../../socket/messengerSocket');
  messengerSocket.emitMessageEdited(msg.conversation_id, fullMessage);
  return fullMessage;
}

async function deleteUserMessage(userId, messageId) {
  const msg = await repo.getMessageById(messageId);
  if (!msg) {
    throw new Error('Message not found.');
  }
  if (msg.sender_id !== userId) {
    throw new Error('Access denied. You can only delete your own messages.');
  }
  const res = await repo.deleteMessage(messageId, userId);
  const messengerSocket = require('../../socket/messengerSocket');
  messengerSocket.emitMessageDeleted(msg.conversation_id, messageId);
  return res;
}

async function assignMessengers(accountUserId, assignedMessengerUserIds, assignedBy) {
  return await repo.assignMessengers(accountUserId, assignedMessengerUserIds, assignedBy);
}

async function getAllMessengerAssignments() {
  return await repo.getAllMessengerAssignments();
}

async function removeMessengerAssignment(assignmentId, removedBy) {
  return await repo.removeMessengerAssignment(assignmentId, removedBy);
}

async function getAllAccountsForAssignment() {
  return await repo.getAllAccountsForAssignment();
}

async function getGroupMembers(conversationId, userId, userRole = null) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    const isPart = await repo.isParticipant(conversationId, userId);
    if (!isPart) {
      throw new Error('Access denied to this conversation.');
    }
  }
  return await repo.getConversationParticipants(conversationId);
}

async function updateGroupName(conversationId, name, userId, userRole) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    throw new Error('Access denied. Only Super Admin can edit the group name.');
  }
  if (!name || !name.trim()) {
    throw new Error('Group name is required.');
  }
  const updated = await repo.updateGroupName(conversationId, name.trim());
  if (!updated) {
    throw new Error('Group conversation not found.');
  }
  return updated;
}

async function updateGroupAvatar(conversationId, avatarUrl, userId, userRole) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    throw new Error('Access denied. Only Super Admin can edit the group photo.');
  }
  if (!avatarUrl) {
    throw new Error('Group photo URL is required.');
  }
  const updated = await repo.updateGroupAvatar(conversationId, avatarUrl);
  if (!updated) {
    throw new Error('Group conversation not found.');
  }
  return updated;
}

async function addGroupMembers(conversationId, currentUserId, memberUserIds = [], userRole = null) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    const isPart = await repo.isParticipant(conversationId, currentUserId);
    if (!isPart) {
      throw new Error('Access denied. You are not a participant of this group.');
    }
  }
  const conv = await repo.getConversationById(conversationId);
  if (!conv || conv.conversation_type !== 'GROUP') {
    throw new Error('Group conversation not found.');
  }

  const uniqueIds = Array.from(new Set(memberUserIds.filter(id => id && id !== currentUserId)));
  if (!uniqueIds.length) {
    throw new Error('Please select at least one member to add.');
  }

  for (const mId of uniqueIds) {
    const { rows: [mUser] } = await query(`SELECT id FROM users WHERE id = $1 AND is_active = TRUE`, [mId]);
    if (mUser) {
      await repo.addParticipant({ conversation_id: conversationId, user_id: mId, role: 'MEMBER' });
    }
  }

  return await repo.getConversationParticipants(conversationId);
}

async function removeGroupMember(conversationId, currentUserId, targetUserId, userRole = null) {
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    const isPart = await repo.isParticipant(conversationId, currentUserId);
    if (!isPart) {
      throw new Error('Access denied. You are not a participant of this group.');
    }
  }
  const conv = await repo.getConversationById(conversationId);
  if (!conv || conv.conversation_type !== 'GROUP') {
    throw new Error('Group conversation not found.');
  }

  await repo.removeParticipant(conversationId, targetUserId);
  return await repo.getConversationParticipants(conversationId);
}

const FORBIDDEN_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.pl', '.cgi',
  '.jar', '.vbs', '.js', '.ts', '.html', '.htm', '.xhtml',
  '.scr', '.pif', '.application', '.gadget', '.msi', '.msp',
  '.com', '.hta', '.cpl', '.msc'
];

function validateAttachmentBuffer(buffer, originalName, mimeType) {
  if (!buffer || buffer.length < 4) {
    throw new Error('Invalid or empty file data.');
  }

  const ext = require('path').extname(originalName || '').toLowerCase();
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    throw new Error('Forbidden file type: Executable and script files are not allowed.');
  }

  const header = buffer.slice(0, 12);
  const isJpg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
  const isGif = header[0] === 0x47 && header[1] === 0x46 && header[2] === 0x49 && header[3] === 0x38;
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46; // %PDF
  const isRiff = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46; // RIFF (WebP, etc.)

  if (['.jpg', '.jpeg'].includes(ext) && !isJpg) {
    throw new Error('File content does not match JPEG image format.');
  }
  if (ext === '.png' && !isPng) {
    throw new Error('File content does not match PNG image format.');
  }
  if (ext === '.gif' && !isGif) {
    throw new Error('File content does not match GIF image format.');
  }
  if (ext === '.pdf' && !isPdf) {
    throw new Error('File content does not match PDF document format.');
  }
  if (ext === '.webp' && !isRiff) {
    throw new Error('File content does not match WebP image format.');
  }

  return true;
}

async function uploadAttachment(file) {
  const fs = require('fs');
  const path = require('path');
  const { v4: uuidv4 } = require('uuid');
  const { uploadToS3 } = require('../../services/aws/s3.service');
  const logger = require('../../config/logger');

  if (!file || !file.buffer) throw new Error('File object is required');

  const originalName = path.basename(file.originalname || 'attachment').replace(/["\r\n\\]/g, '');
  const ext = path.extname(originalName).toLowerCase() || '.png';
  const mimeType = file.mimetype || 'image/png';

  // Perform validation on file buffer
  validateAttachmentBuffer(file.buffer, originalName, mimeType);

  const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(originalName);
  const isPdf = mimeType === 'application/pdf' || originalName.endsWith('.pdf');
  const isAudioVideo = mimeType.startsWith('video/') || mimeType.startsWith('audio/') || /\.(mp4|webm|mov|mp3|wav|ogg|m4a)$/i.test(originalName);
  const fileType = isImage ? 'IMAGE' : isPdf ? 'PDF' : isAudioVideo ? 'MEDIA' : 'DOCUMENT';
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

  let fileUrl = null;
  let storageKey = null;

  if (process.env.AWS_S3_BUCKET) {
    try {
      const s3Res = await uploadToS3(file.buffer, originalName, 'messenger');
      fileUrl = s3Res.url;
      storageKey = s3Res.key;
    } catch (s3Err) {
      logger.warn('[Messenger Upload] S3 upload failed, falling back to local disk:', s3Err.message);
    }
  }

  if (!fileUrl) {
    const uploadDir = path.join(__dirname, '../../../public/uploads/messenger');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    fileUrl = `/uploads/messenger/${filename}`;
    storageKey = `uploads/messenger/${filename}`;
  }

  return {
    file_url: fileUrl,
    storage_key: storageKey,
    file_name: originalName,
    file_type: fileType,
    file_size: fileSizeMB
  };
}

async function getMediaAttachmentStream(attachmentId, userId, userOrRole = null) {
  const attachment = await repo.getAttachmentById(attachmentId);
  if (!attachment) {
    throw new Error('Attachment not found.');
  }

  const isAuthorized = await ensureParticipantAccess(attachment.conversation_id, userId, userOrRole);
  if (!isAuthorized) {
    throw new Error('Access denied to this attachment.');
  }

  const path = require('path');
  const fs = require('fs');

  let storageKey = attachment.storage_key;
  if (!storageKey && attachment.file_url) {
    const rawUrl = String(attachment.file_url);
    if (rawUrl.includes('.amazonaws.com/')) {
      storageKey = rawUrl.split('.amazonaws.com/')[1].split('?')[0];
    } else if (rawUrl.includes('.cloudfront.net/')) {
      storageKey = rawUrl.split('.cloudfront.net/')[1].split('?')[0];
    } else if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      storageKey = rawUrl.replace(/^\/+/, '');
    }
  }

  if (!storageKey) {
    throw new Error('Media file storage key unavailable.');
  }

  if (storageKey.startsWith('uploads/messenger/') || storageKey.startsWith('/uploads/messenger/')) {
    const relativePath = storageKey.replace(/^\/+/, '');
    const localFilePath = path.join(__dirname, '../../../public', relativePath);
    if (!fs.existsSync(localFilePath)) {
      throw new Error('Local media file not found.');
    }
    return {
      isLocal: true,
      filePath: localFilePath,
      fileName: attachment.file_name,
      contentType: attachment.file_type === 'IMAGE' ? 'image/png' : attachment.file_type === 'PDF' ? 'application/pdf' : 'application/octet-stream'
    };
  }

  const { getObjectStream } = require('../../services/aws/s3.service');
  const s3Data = await getObjectStream(storageKey);

  let contentType = s3Data.contentType;
  if (!contentType || contentType === 'binary/octet-stream' || contentType === 'application/octet-stream') {
    const ext = path.extname(attachment.file_name || '').toLowerCase();
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else contentType = attachment.file_type === 'IMAGE' ? 'image/png' : 'application/octet-stream';
  }

  return {
    isLocal: false,
    stream: s3Data.stream,
    contentType,
    contentLength: s3Data.contentLength,
    fileName: attachment.file_name
  };
}

module.exports = {
  maskSensitiveData,
  listConversations,
  startOrGetDirectChat,
  startOrGetApplicationChat,
  createGroup,
  updateGroupName,
  updateGroupAvatar,
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
  getAllAccountsForAssignment,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  uploadAttachment,
  getMediaAttachmentStream
};
