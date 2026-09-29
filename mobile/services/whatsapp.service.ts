import apiClient from './api';
import {
  WhatsAppRecipient,
  WhatsAppTemplate,
  WhatsAppMessage,
  WhatsAppSendRequest,
  WhatsAppSendResponse,
  WhatsAppRecipientType,
} from '../types';

export const whatsappService = {
  /**
   * Search Customer Applications for WhatsApp Dispatch
   */
  searchApplications: async (search: string = ''): Promise<WhatsAppRecipient[]> => {
    try {
      const response = await apiClient.get('/whatsapp/search/applications', {
        params: { q: search.trim(), limit: 15 },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data.map((item: any) => ({
          id: item.id,
          type: 'CUSTOMER',
          name: item.customer_name || 'Customer',
          mobile: item.customer_mobile || '',
          mobile_masked: item.customer_mobile_masked || 'N/A',
          pan_masked: item.pan_masked || 'ABCD******',
          app_number: item.app_number || item.id,
          bank_name: item.bank_name,
          product_name: item.product_name,
          status: item.status,
          kyc_stage: item.kyc_stage,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching customer applications for WhatsApp:', error);
      throw error;
    }
  },

  /**
   * Search Staff / Employees for WhatsApp Dispatch
   */
  searchStaff: async (search: string = ''): Promise<WhatsAppRecipient[]> => {
    try {
      const response = await apiClient.get('/whatsapp/search/staff', {
        params: { q: search.trim(), limit: 20 },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data.map((item: any) => ({
          id: item.id,
          type: 'EMPLOYEE',
          name: item.full_name || 'Staff Member',
          mobile: item.mobile || '',
          mobile_masked: item.mobile_masked || 'N/A',
          designation: item.designation || 'Staff',
          role: item.role || 'EMPLOYEE',
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching staff for WhatsApp:', error);
      throw error;
    }
  },

  /**
   * Fetch approved WhatsApp Templates permitted for user role
   */
  fetchTemplates: async (): Promise<WhatsAppTemplate[]> => {
    try {
      const response = await apiClient.get('/whatsapp/templates');
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      throw error;
    }
  },

  /**
   * Fetch detailed Recipient Context
   */
  fetchRecipientContext: async (type: WhatsAppRecipientType, id: string): Promise<any> => {
    try {
      const endpoint =
        type === 'CUSTOMER'
          ? `/whatsapp/recipient-context/application/${id}`
          : `/whatsapp/recipient-context/staff/${id}`;
      const response = await apiClient.get(endpoint);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching WhatsApp recipient context for ${type} ${id}:`, error);
      throw error;
    }
  },

  /**
   * Send WhatsApp Template Message
   */
  sendTemplateMessage: async (reqPayload: WhatsAppSendRequest): Promise<WhatsAppSendResponse> => {
    try {
      const response = await apiClient.post('/whatsapp/send-template', reqPayload);
      return {
        success: response.data?.success === true,
        message: response.data?.message || 'WhatsApp message sent successfully',
        data: response.data?.data,
      };
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      throw error;
    }
  },

  /**
   * Send WhatsApp Document / PDF Message
   */
  sendDocumentMessage: async (reqPayload: {
    recipient_mobile: string;
    recipient_name: string;
    recipient_type?: WhatsAppRecipientType;
    document_url: string;
    document_name: string;
    caption?: string;
    application_id?: string;
  }): Promise<WhatsAppSendResponse> => {
    try {
      const response = await apiClient.post('/whatsapp/send-document', reqPayload);
      return {
        success: response.data?.success === true,
        message: response.data?.message || 'WhatsApp document sent successfully',
        data: response.data?.data,
      };
    } catch (error) {
      console.error('Error sending WhatsApp document message:', error);
      throw error;
    }
  },

  /**
   * Fetch WhatsApp Message History / Audit Log
   */
  fetchMessageHistory: async (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ messages: WhatsAppMessage[]; total: number; page: number; pages: number }> => {
    try {
      const response = await apiClient.get('/whatsapp/messages', { params });
      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        return {
          messages: Array.isArray(d.messages) ? d.messages : [],
          total: d.pagination?.total || 0,
          page: d.pagination?.page || 1,
          pages: d.pagination?.pages || 1,
        };
      }
      return { messages: [], total: 0, page: 1, pages: 1 };
    } catch (error) {
      console.error('Error fetching WhatsApp message history:', error);
      throw error;
    }
  },

  /**
   * Fetch Single WhatsApp Message details with delivery timeline
   */
  fetchMessageDetails: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/whatsapp/messages/${id}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching WhatsApp message details for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Generate Staff Report for WhatsApp Sharing
   */
  generateStaffReport: async (reqPayload: {
    staff_id: string;
    report_type: string;
    period?: string;
    format?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/whatsapp/staff-reports/generate', reqPayload);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error generating staff report for WhatsApp:', error);
      throw error;
    }
  }
};

export default whatsappService;
