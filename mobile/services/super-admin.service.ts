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
    const res = await apiClient.get('/superadmin/reports/dashboard-stats');
    return res.data?.data || res.data;
  } catch (err: any) {
    try {
      const fallback = await apiClient.get('/superadmin/admins');
      return {
        totalPartners: 0,
        pendingKYC: 0,
        totalApplications: 0,
        pendingPayouts: 0,
        totalLeads: 0,
        approvedApplications: 0,
        rejectedApplications: 0,
        totalRevenue: 0,
      };
    } catch {
      throw err.response?.data || { success: false, message: 'Failed to fetch dashboard metrics' };
    }
  }
};

/**
 * Fetch Business Statistics
 */
export const fetchBusinessStats = async (): Promise<BusinessStats> => {
  try {
    const res = await apiClient.get('/superadmin/referral-analytics');
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
    const res = await apiClient.get('/superadmin/admins', { params });
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
    const res = await apiClient.post('/superadmin/create-admin', adminData);
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
    const res = await apiClient.put(`/superadmin/admins/${adminId}`, adminData);
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
    const res = await apiClient.delete(`/superadmin/admins/${adminId}`);
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
    const res = await apiClient.get('/kyc/applications/pending', { params });
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
    const res = await apiClient.post(`/superadmin/kyc/approve`, { partnerId });
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
    const res = await apiClient.post(`/superadmin/kyc/reject`, { partnerId, reason });
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
    const res = await apiClient.get('/superadmin/partners-commission-overview', { params });
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch commission reports' };
  }
};

/**
 * Fetch Employees and Candidates Directory
 */
export const fetchEmployeesList = async (params: { search?: string; designation?: string; status?: string; activation_status?: string; page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/employees', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch employees list' };
  }
};

export const fetchEmployeeStats = async () => {
  try {
    const res = await apiClient.get('/employees/stats');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch employee stats' };
  }
};

export const activateEmployee = async (employeeId: string) => {
  try {
    const res = await apiClient.post(`/employees/${employeeId}/activate`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to activate employee' };
  }
};

export const fetchCandidatesList = async (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/hr/candidates', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch candidates' };
  }
};

export const convertCandidateToEmployee = async (candidateId: string, payload: any) => {
  try {
    const res = await apiClient.post(`/hr/candidates/${candidateId}/select`, payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to convert candidate' };
  }
};

export const rejectCandidate = async (candidateId: string, reason: string) => {
  try {
    const res = await apiClient.post(`/hr/candidates/${candidateId}/reject`, { reason });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to reject candidate' };
  }
};

/**
 * Fetch Partners List
 */
export const fetchPartnersList = async (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/Partners', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch partners' };
  }
};

export const updatePartnerStatus = async (partnerId: string, status: string, reason?: string) => {
  try {
    const res = await apiClient.post('/superadmin/update-partner-status', { partnerId, status, reason });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update partner status' };
  }
};

/**
 * Super Admin Wallet & Settlement Endpoints
 */
export const fetchSuperAdminWalletOverview = async () => {
  try {
    const res = await apiClient.get('/superadmin/wallet/overview');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch wallet overview' };
  }
};

export const fetchWithdrawalRequests = async (params: { status?: string; page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/superadmin/wallet/withdrawals', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch withdrawal requests' };
  }
};

export const approveWithdrawalRequest = async (withdrawalId: string, notes?: string) => {
  try {
    const res = await apiClient.post('/superadmin/wallet/approve', { withdrawal_id: withdrawalId, notes });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to approve withdrawal' };
  }
};

export const rejectWithdrawalRequest = async (withdrawalId: string, reason: string) => {
  try {
    const res = await apiClient.post('/superadmin/wallet/reject', { withdrawal_id: withdrawalId, reason });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to reject withdrawal' };
  }
};

/**
 * Announcements & Broadcasts
 */
export const fetchAnnouncements = async (params: { status?: string; page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/superadmin/announcements', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch announcements' };
  }
};

export const createAnnouncement = async (data: { title: string; message: string; target_audience?: string; priority?: string }) => {
  try {
    const res = await apiClient.post('/superadmin/announcement', data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to create announcement' };
  }
};

export const deleteAnnouncement = async (id: string) => {
  try {
    const res = await apiClient.delete(`/superadmin/announcement/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to delete announcement' };
  }
};

/**
 * Audit Logs
 */
export const fetchAuditLogs = async (params: { search?: string; action?: string; page?: number; limit?: number } = {}) => {
  try {
    const res = await apiClient.get('/superadmin/audit-logs', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch audit logs' };
  }
};

/**
 * Contests
 */
export const fetchContestsList = async () => {
  try {
    const res = await apiClient.get('/contests');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch contests' };
  }
};

export const createContest = async (data: any) => {
  try {
    const res = await apiClient.post('/contests', data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to create contest' };
  }
};

