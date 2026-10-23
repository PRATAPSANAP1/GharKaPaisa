import apiClient from './api';

export interface SupportTicket {
  id: string;
  ticket_number?: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  created_at: string;
  updated_at: string;
  replies?: Array<{
    id: string;
    message: string;
    sender_name: string;
    sender_role: string;
    created_at: string;
  }>;
}

export const getTickets = async (): Promise<SupportTicket[]> => {
  try {
    const res = await apiClient.get('/support');
    return res.data?.data || res.data?.tickets || [];
  } catch (err) {
    return [];
  }
};

export const createTicket = async (data: {
  subject: string;
  description: string;
  priority?: string;
  category?: string;
}): Promise<SupportTicket | null> => {
  const res = await apiClient.post('/support', data);
  return res.data?.data || null;
};

export const getTicketDetail = async (ticketId: string): Promise<SupportTicket | null> => {
  const res = await apiClient.get(`/support/${ticketId}`);
  return res.data?.data || null;
};

export const addReply = async (ticketId: string, message: string): Promise<boolean> => {
  const res = await apiClient.post(`/support/${ticketId}/reply`, { message });
  return res.data?.success || false;
};
