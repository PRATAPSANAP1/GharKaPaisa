import api from './api';

export const walletService = {
  getWallet: (partnerId) => api.get(partnerId ? `/wallet/${partnerId}` : '/wallet'),
  getTransactions: (partnerId, params) => api.get(`/wallet/${partnerId}/transactions`, { params }),
  requestWithdrawal: (partnerId, amount) => api.post(`/wallet/${partnerId}/withdraw`, { amount }),
  getCaseSummary: (partnerId) => api.get(`/wallet/${partnerId}/case-summary`),
};

export default walletService;
