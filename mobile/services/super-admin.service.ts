import apiClient from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface SuperAdminMetrics {
  totalPartners: number;
  pendingKYC: number;
  totalApplications: number;
  pendingPayouts: number;
  totalLeads: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  designation: string;
  status: string;
  bank_ids: string[];
  created_at: string;
}

export interface BusinessStats {
  dailyApplications: number;
  weeklyApplications: number;
  monthlyApplications: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  activePartners: number;
  pendingKYC: number;
}

// ============================================================================
// SUPER ADMIN ENDPOINTS
// ============================================================================

/**
 * Fetch Super Admin Dashboard Metrics
 */
export const fetchSuperAdminDashboard = async (): Promise<SuperAdminMetrics> => {
  try {
    const res = await apiClient.get('/super-admin/dashboard');
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch dashboard metrics' };
  }
};

/**
 * Fetch Business Statistics
 */
export const fetchBusinessStats = async (): Promise<BusinessStats> => {
  try {
    const res = await apiClient.get('/super-admin/business-stats');
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch business stats' };
  }
};

/**
 * Fetch All Admin Users
 */
export const fetchAdminUsers = async (params: { page?: number; limit?: number; search?: string } = {}): Promise<{ admins: AdminUser[]; total: number }> => {
  try {
    const res = await apiClient.get('/super-admin/admins', { params });
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch admin users' };
  }
};

/**
 * Create New Admin User
 */
export const createAdminUser = async (adminData: {
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  designation: string;
  password: string;
  bank_ids?: string[];
}): Promise<AdminUser> => {
  try {
    const res = await apiClient.post('/super-admin/admins', adminData);
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to create admin user' };
  }
};

/**
 * Update Admin User
 */
export const updateAdminUser = async (adminId: string, adminData: {
  fullName?: string;
  email?: string;
  mobile?: string;
  designation?: string;
  status?: string;
  bank_ids?: string[];
  password?: string;
}): Promise<AdminUser> => {
  try {
    const res = await apiClient.put(`/super-admin/admins/${adminId}`, adminData);
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update admin user' };
  }
};

/**
 * Delete Admin User
 */
export const deleteAdminUser = async (adminId: string): Promise<{ success: boolean }> => {
  try {
    const res = await apiClient.delete(`/super-admin/admins/${adminId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to delete admin user' };
  }
};

/**
 * Fetch Partner KYC Applications (Pending Approval)
 */
export const fetchPendingKYCApplications = async (params: { page?: number; limit?: number } = {}): Promise<{ applications: any[]; total: number }> => {
  try {
    const res = await apiClient.get('/super-admin/pending-kyc', { params });
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch pending KYC applications' };
  }
};

/**
 * Approve Partner KYC
 */
export const approvePartnerKYC = async (partnerId: string): Promise<{ success: boolean }> => {
  try {
    const res = await apiClient.post(`/super-admin/partners/${partnerId}/approve-kyc`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to approve partner KYC' };
  }
};

/**
 * Reject Partner KYC
 */
export const rejectPartnerKYC = async (partnerId: string, reason: string): Promise<{ success: boolean }> => {
  try {
    const res = await apiClient.post(`/super-admin/partners/${partnerId}/reject-kyc`, { reason });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to reject partner KYC' };
  }
};

/**
 * Fetch Commission Reports
 */
export const fetchCommissionReports = async (params: { startDate?: string; endDate?: string; partnerId?: string } = {}): Promise<any> => {
  try {
    const res = await apiClient.get('/super-admin/commission-reports', { params });
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch commission reports' };
  }
};

/**
 * Fetch System Settings
 */
export const fetchSystemSettings = async (): Promise<any> => {
  try {
    const res = await apiClient.get('/super-admin/settings');
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch system settings' };
  }
};

/**
 * Update System Settings
 */
export const updateSystemSettings = async (settings: any): Promise<any> => {
  try {
    const res = await apiClient.put('/super-admin/settings', settings);
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update system settings' };
  }
};
