import apiClient from './api';
import { ChatResponse, ChatChipAction } from '../types';

export const chatbotService = {
  /**
   * Send text message to chatbot
   */
  sendMessage: async (message: string, sessionId: string): Promise<ChatResponse> => {
    try {
      const response = await apiClient.post('/chatbot/message', {
        message: message.trim(),
        session_id: sessionId,
      });

      if (response.data) {
        // Normalize response structure
        return {
          success: response.data.success !== false,
          type: response.data.type || 'TEXT',
          message: response.data.message || response.data.data?.message || 'I have received your message.',
          chips: Array.isArray(response.data.chips)
            ? response.data.chips
            : Array.isArray(response.data.data?.chips)
            ? response.data.data.chips
            : [],
          category: response.data.category || response.data.data?.category,
          data: response.data.data,
        };
      }
      return { success: false, message: 'Invalid response from chatbot service.' };
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },

  /**
   * Handle chip / quick action selection
   */
  handleAction: async (action: string, label: string, sessionId: string): Promise<ChatResponse> => {
    try {
      const response = await apiClient.post('/chatbot/action', {
        action,
        label,
        session_id: sessionId,
      });

      if (response.data) {
        const payload = response.data.data || response.data;
        return {
          success: response.data.success !== false,
          type: payload.type || 'TEXT',
          message: payload.message || 'Action executed.',
          chips: Array.isArray(payload.chips) ? payload.chips : [],
          category: payload.category,
          data: payload,
        };
      }
      return { success: false, message: 'Failed to process action.' };
    } catch (error) {
      console.error('Error executing chatbot action:', error);
      throw error;
    }
  },

  /**
   * Reset conversation session
   */
  resetConversation: async (sessionId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/chatbot/reset', {
        session_id: sessionId,
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error resetting conversation:', error);
      throw error;
    }
  },

  /**
   * Submit satisfaction feedback rating (1-5)
   */
  submitFeedback: async (sessionId: string, rating: number): Promise<boolean> => {
    try {
      const response = await apiClient.post('/chatbot/feedback', {
        session_id: sessionId,
        rating,
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Error submitting chatbot feedback:', error);
      return false;
    }
  },

  /**
   * Search knowledge base
   */
  searchKnowledgeBase: async (keyword: string): Promise<any[]> => {
    try {
      const response = await apiClient.get('/chatbot/search', {
        params: { keyword },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }
};

export default chatbotService;
