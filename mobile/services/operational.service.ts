import apiClient from './api';
import { 
  ApplicationItem, 
  KYCApplication, 
  OperatorHistory, 
  BankStatusUpdateParams, 
  RemarkUpdateParams, 
  KYCActionParams,
  QueueFilters 
} from '../types';

// ============================================================================
// KYC OPERATOR ENDPOINTS
// ============================================================================

export interface KYCQueueParams {
  page?: number;
  limit?: number;
  bank_id?: string;
  status?: string;
  search?: string;
}

export const fetchKYCQueue = async (params: KYCQueueParams = {}) => {
  try {
    const res = await apiClient.get('/kyc-operator/applications', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to load KYC queue' };
  }
};

export const fetchKYCApplicationDetails = async (id: string) => {
  try {
    const res = await apiClient.get(`/kyc-operator/applications/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch KYC application details' };
  }
};

export const fetchKYCApplicationDocuments = async (id: string) => {
  try {
    const res = await apiClient.get(`/kyc-operator/applications/${id}/documents`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch KYC documents' };
  }
};

export const verifyKYCApplication = async (id: string, params: KYCActionParams) => {
  try {
    const res = await apiClient.post(`/kyc-operator/applications/${id}/verify`, params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to verify KYC' };
  }
};

export const rejectKYCApplication = async (id: string, params: KYCActionParams) => {
  try {
    const res = await apiClient.post(`/kyc-operator/applications/${id}/reject`, params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to reject KYC' };
  }
};

export const requestKYCInformation = async (id: string, params: KYCActionParams) => {
  try {
    const res = await apiClient.post(`/kyc-operator/applications/${id}/request-information`, params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to request information' };
  }
};

export const updateKYCStage = async (id: string, params: KYCActionParams) => {
  try {
    const res = await apiClient.post(`/kyc-operator/applications/${id}/update-stage`, params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update KYC stage' };
  }
};

// ============================================================================
// ADMIN APPLICATIONS QUEUE (PAN, QD, REMARK, FINAL STATUS OPERATORS)
// ============================================================================

export interface AdminQueueParams extends QueueFilters {
  page?: number;
  limit?: number;
  process_by?: string;
  operation_head_id?: string;
  category?: string;
  commission_status?: string;
}

export const fetchAdminQueue = async (params: AdminQueueParams = {}) => {
  try {
    const res = await apiClient.get('/applications/admin/applications', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to load admin queue' };
  }
};

export const fetchSuperAdminQueue = async (params: AdminQueueParams = {}) => {
  try {
    const res = await apiClient.get('/applications/super-admin/applications', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to load super admin queue' };
  }
};

export const fetchRemarkOperatorDashboard = async (params: AdminQueueParams = {}) => {
  try {
    const res = await apiClient.get('/applications/remark-operator/dashboard', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to load remark operator dashboard' };
  }
};

// ============================================================================
// APPLICATION ACTIONS (PAN, QD, REMARK, FINAL STATUS)
// ============================================================================

export const updateBankStatus = async (id: string, params: BankStatusUpdateParams) => {
  try {
    const res = await apiClient.put(`/applications/${id}/bank-status`, params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update bank status' };
  }
};

export const updateRemark = async (id: string, params: RemarkUpdateParams) => {
  try {
    const res = await apiClient.put(`/applications/${id}/remark`, params);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update remark' };
  }
};

// ============================================================================
// OPERATOR HISTORY & TIMELINE
// ============================================================================

export const fetchOperatorHistory = async (id: string) => {
  try {
    const res = await apiClient.get(`/applications/${id}/operator-history`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch operator history' };
  }
};

export const fetchApplicationTimeline = async (id: string) => {
  try {
    const res = await apiClient.get(`/applications/${id}/timeline`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch application timeline' };
  }
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Mask PAN number - show only last 4 characters
 */
export const maskPAN = (pan?: string): string => {
  if (!pan || pan.toUpperCase() === 'N/A' || pan.toUpperCase() === 'NA') {
    return 'N/A';
  }
  const cleanPan = pan.trim().toUpperCase();
  if (cleanPan.length >= 6) {
    return 'XXXXXX' + cleanPan.slice(6);
  }
  return 'XXXXXX';
};

/**
 * Mask mobile number - show only last 4 characters
 */
export const maskMobile = (mobile?: string): string => {
  if (!mobile || mobile === 'N/A' || mobile === 'NA') {
    return 'N/A';
  }
  const cleanMobile = mobile.trim();
  if (cleanMobile.length >= 4) {
    return 'XXXXXX' + cleanMobile.slice(-4);
  }
  return 'XXXXXX';
};

/**
 * Normalize designation for comparison
 */
export const normalizeDesignation = (designation?: string): string => {
  if (!designation) return '';
  return designation.toUpperCase().replace(/\s+/g, '_');
};

/**
 * Check if user has specific designation
 */
export const hasDesignation = (
  userDesignation: string | undefined, 
  targetDesignations: string[]
): boolean => {
  if (!userDesignation) return false;
  const normalized = normalizeDesignation(userDesignation);
  return targetDesignations.some(d => {
    const target = d.toUpperCase().replace(/\s+/g, '_');
    return normalized === target || userDesignation.toUpperCase() === d.toUpperCase();
  });
};

/**
 * Get workspace type based on user role and designation
 */
export const getWorkspaceType = (
  role: string | undefined,
  designation: string | undefined
): 'kyc_operator' | 'pan_checker' | 'qd_operator' | 'remark_operator' | 'final_status' | 'default' => {
  const normalizedDesignation = normalizeDesignation(designation);
  
  if (hasDesignation(designation, ['KYC_OPERATOR', 'KYC OPERATOR'])) {
    return 'kyc_operator';
  }
  
  if (hasDesignation(designation, ['PAN_CHECKER', 'PAN CHECKER'])) {
    return 'pan_checker';
  }
  
  if (hasDesignation(designation, ['QD_OPERATOR', 'QD OPERATOR'])) {
    return 'qd_operator';
  }
  
  if (hasDesignation(designation, ['REMARK_OPERATOR', 'REMARK OPERATOR'])) {
    return 'remark_operator';
  }
  
  if (hasDesignation(designation, ['FINAL_STATUS_OPERATOR', 'FINAL STATUS OPERATOR'])) {
    return 'final_status';
  }
  
  return 'default';
};
