import apiClient from '../config/api';

/**
 * Single Source of Truth Wallet & Commission Service
 */
export const getWalletSummary = async () => {
  try {
    const response = await apiClient.get('/wallet/balance');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch wallet summary' };
  }
};

export const getWalletTransactions = async (params = {}) => {
  try {
    const response = await apiClient.get('/wallet/transactions', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch transaction history' };
  }
};

export const submitPayoutRequest = async (amount, bankDetails = {}) => {
  try {
    const response = await apiClient.post('/wallet/withdraw', {
      amount,
      account_number: bankDetails.account_number,
      ifsc: bankDetails.ifsc
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to request payout' };
  }
};
