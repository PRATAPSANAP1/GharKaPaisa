import apiClient from './api';

// ============================================================================
// PARTNER ENDPOINTS
// ============================================================================

export const fetchPartnerProfile = async () => {
  try {
    const res = await apiClient.get('/partner/profile');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch partner profile' };
  }
};

export const fetchPartnerDashboard = async () => {
  try {
    const res = await apiClient.get('/applications/dashboard');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch partner dashboard' };
  }
};

export const fetchPartnerWallet = async () => {
  try {
    const res = await apiClient.get('/partner/wallet');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch wallet' };
  }
};

export const fetchPartnerWalletTransactions = async (params: { page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/partner/wallet/transactions', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch transactions' };
  }
};

export const requestPartnerWithdrawal = async (amount: number, accountDetails: { account_number?: string; ifsc?: string } = {}) => {
  try {
    const res = await apiClient.post('/partner/wallet/withdraw', { amount, ...accountDetails });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to submit withdrawal request' };
  }
};

export const fetchPartnerTeamDashboard = async () => {
  try {
    const res = await apiClient.get('/partner/team-dashboard');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch team dashboard' };
  }
};

export const fetchPartnerTeamMembers = async () => {
  try {
    const res = await apiClient.get('/partner/team-members');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch team members' };
  }
};

export const fetchPartnerReferralInfo = async () => {
  try {
    const res = await apiClient.get('/partner/referral');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch referral info' };
  }
};

export const generatePartnerShareLink = async (productId: string) => {
  try {
    const res = await apiClient.post('/partner/share-link', { productId });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to generate share link' };
  }
};

// ============================================================================
// EMPLOYEE / TEAM MEMBER ENDPOINTS
// ============================================================================

export const fetchEmployeeProfile = async () => {
  try {
    const res = await apiClient.get('/employee/profile');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch employee profile' };
  }
};

export const fetchEmployeeProducts = async () => {
  try {
    const res = await apiClient.get('/employee/credit-cards');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch employee products' };
  }
};

// ============================================================================
// PRODUCTS CATALOG ENDPOINTS
// ============================================================================

export const fetchProductsList = async (params: { category?: string; bank_id?: string } = {}) => {
  try {
    const res = await apiClient.get('/products', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch products' };
  }
};

export const fetchProductById = async (id: string) => {
  try {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch product details' };
  }
};
