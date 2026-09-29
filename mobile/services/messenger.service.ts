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
  };
  created_at: string;
  updated_at: string;
}

export interface MessengerMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  message_text?: string;
  message_type?: string;
  attachments?: Array<{
    file_name: string;
    file_url: string;
    file_type: string;
    file_size?: string;
  }>;
  is_edited?: boolean;
  created_at: string;
}

export const getConversations = async (filter = 'ALL', search = ''): Promise<MessengerConversation[]> => {
  const res = await apiClient.get('/messenger/conversations', { params: { filter, search } });
  return res.data?.data || [];
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
  
  formData.append('attachment', {
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

export const getUnreadCount = async (): Promise<number> => {
  try {
    const res = await apiClient.get('/messenger/unread-count');
    return res.data?.data?.unread_count || 0;
  } catch (err) {
    return 0;
  }
};
