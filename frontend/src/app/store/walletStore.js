import { create } from 'zustand';
import api from '../../services/api';

export const useWalletStore = create((set) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  error: null,
  
  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/wallet');
      set({ wallet: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch wallet', isLoading: false });
      throw error;
    }
  },
  
  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/wallet/transactions', { params });
      set({ transactions: response.data.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch transactions', isLoading: false });
      throw error;
    }
  },

  requestWithdrawal: async (amount) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/wallet/withdraw', { amount });
      set({ isLoading: false });
      // Fetch fresh wallet details after withdrawal
      const walletRes = await api.get('/wallet');
      set({ wallet: walletRes.data.data });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Withdrawal failed', isLoading: false });
      throw error;
    }
  },

  clearData: () => set({ wallet: null, transactions: [], error: null })
}));
