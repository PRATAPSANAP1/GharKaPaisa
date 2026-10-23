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

export const fetchEmployeeProducts = async () => {
  try {
    const res = await apiClient.get('/employee/credit-cards');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch employee products' };
  }
};

export const fetchPartnerKycStatus = async () => {
  try {
    const res = await apiClient.get('/partner/kyc/status');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch KYC status' };
  }
};

export const fetchPartnerKycDetails = async () => {
  try {
    const res = await apiClient.get('/partner/kyc/details');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch KYC details' };
  }
};

export const submitPartnerKycPan = async (panNumber: string, panImageUri?: string) => {
  try {
    const formData = new FormData();
    formData.append('pan_number', panNumber);
    if (panImageUri) {
      const filename = panImageUri.split('/').pop() || 'pan.jpg';
      formData.append('pan', {
        uri: panImageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
    }
    const res = await apiClient.post('/partner/kyc/upload-pan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to upload PAN details' };
  }
};

export const submitPartnerKycCheque = async (accountData: {
  account_number: string;
  ifsc_code: string;
  bank_name?: string;
  account_holder_name?: string;
  chequeImageUri?: string;
}) => {
  try {
    const formData = new FormData();
    formData.append('account_number', accountData.account_number);
    formData.append('ifsc_code', accountData.ifsc_code);
    if (accountData.bank_name) formData.append('bank_name', accountData.bank_name);
    if (accountData.account_holder_name) formData.append('account_holder_name', accountData.account_holder_name);
    if (accountData.chequeImageUri) {
      const filename = accountData.chequeImageUri.split('/').pop() || 'cheque.jpg';
      formData.append('cancelled_cheque', {
        uri: accountData.chequeImageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
    }
    const res = await apiClient.post('/partner/kyc/upload-cheque', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to upload bank cheque' };
  }
};

export const submitPartnerKycFinal = async () => {
  try {
    const res = await apiClient.post('/partner/kyc/submit');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to submit KYC for review' };
  }
};

export const fetchPartnerTraining = async () => {
  try {
    const res = await apiClient.get('/partner/training');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch training modules' };
  }
};

export const completeTrainingModule = async (moduleId: string) => {
  try {
    const res = await apiClient.post(`/partner/training/${moduleId}/complete`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to complete training module' };
  }
};

export const fetchPartnerShareTracking = async () => {
  try {
    const res = await apiClient.get('/partner/share-tracking');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch share tracking stats' };
  }
};

export const fetchPartnerSupportTickets = async () => {
  try {
    const res = await apiClient.get('/partner/support-tickets');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch support tickets' };
  }
};

export const createPartnerSupportTicket = async (data: { subject: string; category: string; description: string }) => {
  try {
    const res = await apiClient.post('/partner/support-tickets', data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to create support ticket' };
  }
};

export const fetchPartnerNotifications = async () => {
  try {
    const res = await apiClient.get('/partner/notifications');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch notifications' };
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    const res = await apiClient.patch(`/partner/notifications/${id}/read`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to mark notification read' };
  }
};

export const fetchTravelUtilitiesTransactions = async () => {
  try {
    const res = await apiClient.get('/partner/wallet/transactions', { params: { type: 'UTILITY_MARGIN' } });
    return res.data;
  } catch (err: any) {
    return { success: true, data: [] };
  }
};

