const service = require('./messenger.service');
const { success, error, unauthorized } = require('../../utils/response/response');
const logger = require('../../config/logger');

async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const filter = req.query.filter || 'ALL';
    const search = req.query.search || '';
    const data = await service.listConversations(userId, filter, search, req.user.role);
    return success(res, data, 'Conversations retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function createDirectChat(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { target_user_id } = req.body;
    if (!target_user_id) {
      return error(res, 'target_user_id is required', 400);
    }
    const conv = await service.startOrGetDirectChat(currentUserId, target_user_id);
    return success(res, conv, 'Direct conversation initialized');
  } catch (err) {
    next(err);
  }
}

async function createApplicationChat(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { application_id } = req.body;
    if (!application_id) {
      return error(res, 'application_id is required', 400);
    }
    const conv = await service.startOrGetApplicationChat(currentUserId, application_id);
    return success(res, conv, 'Application conversation initialized');
  } catch (err) {
    next(err);
  }
}

async function createGroupChat(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { name, description, member_user_ids } = req.body;
    const conv = await service.createGroup(currentUserId, {
      name,
      description,
      memberUserIds: member_user_ids || []
    });
    return success(res, conv, 'Group created successfully');
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const conv = await service.getConversationDetails(id, userId, req.user.role);
    return success(res, conv, 'Conversation details retrieved');
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const limit = parseInt(req.query.limit || 50, 10);
    const offset = parseInt(req.query.offset || 0, 10);
    const messages = await service.getMessages(id, userId, limit, offset, req.user.role);
    return success(res, messages, 'Messages retrieved');
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const senderId = req.user.id;
    logger.info(`[Messenger] sendMessage: sender_id=${senderId}, name="${req.user.full_name || 'N/A'}", email="${req.user.email || 'N/A'}"`);
    const { conversation_id, message_type, message_text, reply_to_message_id, attachments } = req.body;
    if (!conversation_id) {
      return error(res, 'conversation_id is required', 400);
    }
    const msg = await service.postMessage(senderId, {
      conversation_id,
      message_type,
      message_text,
      reply_to_message_id,
      attachments
    }, req.user.role);
    return success(res, msg, 'Message sent successfully');
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await service.markConversationAsRead(id, userId);
    return success(res, result, 'Marked as read');
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const unread = await service.getUserUnreadCount(userId);
    return success(res, { unread_count: unread });
  } catch (err) {
    next(err);
  }
}

async function getContacts(req, res, next) {
  try {
    const user = req.user;
    const queryText = req.query.query || '';
    const contacts = await service.getContacts(user, queryText);
    return success(res, contacts, 'Contacts retrieved');
  } catch (err) {
    next(err);
  }
}

async function togglePin(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await service.togglePinConversation(id, userId);
    return success(res, result, 'Pin status updated');
  } catch (err) {
    next(err);
  }
}

// ── Super Admin Audit Controllers ──
async function adminSearchUsers(req, res, next) {
  try {
    const queryText = req.query.query || '';
    const users = await service.searchUsersForAdminAudit(queryText);
    return success(res, users, 'Users retrieved for audit');
  } catch (err) {
    next(err);
  }
}

async function adminGetUserConversations(req, res, next) {
  try {
    const targetUserId = req.query.target_user_id;
    if (!targetUserId) {
      return error(res, 'target_user_id is required', 400);
    }
    const convs = await service.getAdminAuditConversations(targetUserId);
    return success(res, convs, 'Audit conversations retrieved');
  } catch (err) {
    next(err);
  }
}

async function adminGetUserMessages(req, res, next) {
  try {
    const { id } = req.params;
    const messages = await service.getAdminAuditMessages(id);
    return success(res, messages, 'Audit messages retrieved');
  } catch (err) {
    next(err);
  }
}

async function clearChat(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await service.clearUserConversation(id, userId, req.user.role);
    return success(res, { cleared: result }, 'Chat history cleared successfully');
  } catch (err) {
    next(err);
  }
}

async function leaveGroup(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await service.leaveUserConversation(id, userId, req.user.role);
    return success(res, { left: result }, 'Left group successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteConversation(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await service.deleteUserConversation(id, userId, req.user.role);
    return success(res, { deleted: result }, 'Conversation deleted successfully');
  } catch (err) {
    next(err);
  }
}

async function editMessage(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { message_text } = req.body;
    if (!message_text || !message_text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }
    const updated = await service.editUserMessage(userId, id, message_text.trim());
    return success(res, updated, 'Message edited successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await service.deleteUserMessage(userId, id);
    return success(res, { deleted: Boolean(result) }, 'Message deleted successfully');
  } catch (err) {
    next(err);
  }
}

async function assignMessengers(req, res, next) {
  try {
    const { account_user_id, assigned_messenger_user_ids } = req.body;
    if (!account_user_id) {
      return error(res, 'account_user_id is required', 400);
    }
    if (!Array.isArray(assigned_messenger_user_ids) || assigned_messenger_user_ids.length === 0) {
      return error(res, 'assigned_messenger_user_ids array is required', 400);
    }
    const result = await service.assignMessengers(account_user_id, assigned_messenger_user_ids, req.user.id);
    return success(res, result, 'Messenger assignments saved successfully');
  } catch (err) {
    next(err);
  }
}

async function getAssignments(req, res, next) {
  try {
    const assignments = await service.getAllMessengerAssignments();
    return success(res, assignments, 'Assignments retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function removeAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await service.removeMessengerAssignment(id, req.user.id);
    return success(res, deleted, 'Assignment removed successfully');
  } catch (err) {
    next(err);
  }
}

async function getCandidateAccounts(req, res, next) {
  try {
    const accounts = await service.getAllAccountsForAssignment();
    return success(res, accounts, 'Accounts retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getGroupMembers(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const members = await service.getGroupMembers(id, userId, req.user.role);
    return success(res, members, 'Group members retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function addGroupMembers(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { member_user_ids } = req.body;
    const members = await service.addGroupMembers(id, userId, member_user_ids || [], req.user.role);
    return success(res, members, 'Members added successfully');
  } catch (err) {
    next(err);
  }
}

async function removeGroupMember(req, res, next) {
  try {
    const userId = req.user.id;
    const { id, targetUserId } = req.params;
    const members = await service.removeGroupMember(id, userId, targetUserId, req.user.role);
    return success(res, members, 'Member removed successfully');
  } catch (err) {
    next(err);
  }
}

async function updateGroupName(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await service.updateGroupName(id, name, req.user.id, req.user.role);
    return success(res, updated, 'Group name updated successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConversations,
  createDirectChat,
  createApplicationChat,
  createGroupChat,
  updateGroupName,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
  getUnreadCount,
  getContacts,
  togglePin,
  adminSearchUsers,
  adminGetUserConversations,
  adminGetUserMessages,
  clearChat,
  leaveGroup,
  deleteConversation,
  editMessage,
  deleteMessage,
  assignMessengers,
  getAssignments,
  removeAssignment,
  getCandidateAccounts,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember
};
