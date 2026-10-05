import apiClient from './api';

export interface MessengerConversation {
  id: string;
  conversation_type: 'DIRECT' | 'GROUP' | 'APPLICATION' | 'DEPARTMENT';
  name?: string;
  title?: string;
  description?: string;
  is_pinned?: boolean;
  unread_count?: number;
  last_message?: {
    id: string;
    message_text?: string;
    message_type?: string;
    created_at: string;
    sender_name?: string;
  };
  other_user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    partner_code?: string;
    employee_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MessengerContact {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  role: string;
  partner_code?: string;
  employee_id?: string;
  designation?: string;
}

export interface MessengerMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  message_text?: string;
  message_type?: string;
  attachments?: Array<{
    id?: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size?: string;
  }>;
  is_edited?: boolean;
  created_at: string;
}

/**
 * Sensitive Data Masker (Masks PAN cards & 10-12 digit Indian mobile numbers)
 */
export function maskSensitiveData(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return text || '';

  // 1. Mask PAN Card (5 letters + 4 digits + 1 letter -> ABCD******)
  let masked = text.replace(/\b([A-Za-z]{5}[0-9]{4}[A-Za-z]{1})\b/gi, (match) => {
    return match.slice(0, 4) + '******';
  });

  // 2. Mask +91 / 91 12-digit Indian mobile numbers (e.g. +919876543210 -> +919876******)
  masked = masked.replace(/(\+?91[\s-]?)?([6-9]\d{3})(\d{6})\b/g, (match, countryCode, prefix, lastSix) => {
    const code = countryCode || '';
    return `${code}${prefix}******`;
  });

  // 3. Mask standalone 10 to 12 digit phone number sequences
  masked = masked.replace(/\b([0-9]{4,6})([0-9]{6})\b/g, (match, prefix, lastSix) => {
    return `${prefix}******`;
  });

  return masked;
}

export const getConversations = async (filter = 'ALL', search = ''): Promise<MessengerConversation[]> => {
  const res = await apiClient.get('/messenger/conversations', { params: { filter, search } });
  return res.data?.data || [];
};

export const getContacts = async (query = ''): Promise<MessengerContact[]> => {
  const res = await apiClient.get('/messenger/contacts', { params: { query } });
  return res.data?.data || [];
};

export const startDirectChat = async (targetUserId: string): Promise<MessengerConversation> => {
  const res = await apiClient.post('/messenger/conversations/direct', { target_user_id: targetUserId });
  return res.data?.data;
};

export const createGroupChat = async (data: { name: string; description?: string; member_user_ids: string[] }): Promise<MessengerConversation> => {
  const res = await apiClient.post('/messenger/conversations/group', data);
  return res.data?.data;
};

export const togglePinConversation = async (conversationId: string): Promise<{ conversation_id: string; is_pinned: boolean }> => {
  const res = await apiClient.post(`/messenger/conversations/${conversationId}/pin`);
  return res.data?.data;
};

export const getMessages = async (conversationId: string, limit = 100): Promise<MessengerMessage[]> => {
  const res = await apiClient.get(`/messenger/conversations/${conversationId}/messages`, { params: { limit } });
  return res.data?.data || [];
};

export const sendMessage = async (data: {
  conversation_id: string;
  message_text?: string;
  message_type?: string;
  attachments?: any[];
}): Promise<MessengerMessage> => {
  const res = await apiClient.post('/messenger/messages', data);
  return res.data?.data;
};

export const sendMessageWithAttachment = async (
  conversationId: string,
  imageUri: string,
  messageText?: string
): Promise<MessengerMessage> => {
  const formData = new FormData();
  formData.append('conversation_id', conversationId);
  if (messageText) {
    formData.append('message_text', messageText);
  }
  formData.append('message_type', 'IMAGE');
  
  const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type: type,
  } as any);
  
  const res = await apiClient.post('/messenger/messages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data?.data;
};

export const markRead = async (conversationId: string): Promise<boolean> => {
  const res = await apiClient.post(`/messenger/conversations/${conversationId}/read`);
  return res.data?.success || false;
};

export const clearChat = async (conversationId: string): Promise<boolean> => {
  const res = await apiClient.post(`/messenger/conversations/${conversationId}/clear`);
  return res.data?.success || false;
};

export const leaveGroup = async (conversationId: string): Promise<boolean> => {
  const res = await apiClient.post(`/messenger/conversations/${conversationId}/leave`);
  return res.data?.success || false;
};

export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  const res = await apiClient.delete(`/messenger/conversations/${conversationId}`);
  return res.data?.success || false;
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    const res = await apiClient.get('/messenger/unread-count');
    return res.data?.data?.unread_count || 0;
  } catch (err) {
    return 0;
  }
};
