import apiClient from './api';
import { ApplicationItem } from '../types';

export interface KycStats {
  total_kyc: number;
  pending_kyc: number;
  verified_kyc: number;
  rejected_kyc: number;
}

export interface FetchQueueParams {
  page?: number;
  limit?: number;
  search?: string;
  bank_id?: string;
  product_id?: string;
  kyc_status?: string;
  vkyc_stage?: string;
  bio_stage?: string;
  digilocker_stage?: string;
  status?: string;
  process_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface KycStageUpdatePayload {
  kyc_stage?: string;
  vkyc_stage?: string;
  bio_stage?: string;
  digilocker_stage?: string;
  bank_application_number?: string;
  vkyc_link?: string;
  user_remark?: string;
  kyc_remarks?: string;
  pan_number?: string;
  kyc_status?: string;
}

export interface VerificationUpdatePayload {
  status?: string;
  final_status?: string;
  bank_remark?: string;
  user_remark?: string;
  backend_remark?: string;
  ops_remark?: string;
  super_admin_remark?: string;
  decline_reason?: string;
  app_file_generated?: string;
  customer_mobile?: string;
  customer_name?: string;
  dob?: string;
  customer_email?: string;
  pan_number?: string;
  company_name?: string;
  designation?: string;
  address1?: string;
  address2?: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  state?: string;
  company_address?: string;
  mother_name?: string;
  app_number?: string;
  bank_application_number?: string;
  bank_ref_number?: string;
  vkyc_url?: string;
  ipa_stage?: string;
  kyc_stage?: string;
  vkyc_stage?: string;
  dispatch_status?: string;
  in_process_stage?: string;
  bank_current_lead_status?: string;
}

export interface OperatorAuditLog {
  id: string;
  application_id: string;
  operator_id?: string;
  operator_name?: string;
  operator_role?: string;
  operator_designation?: string;
  operator_code?: string;
  action_type: string;
  field_changes?: any;
  notes?: string;
  created_at: string;
}

/**
 * KYC Operator API Services
 */
export const fetchKycApplications = async (params: FetchQueueParams = {}) => {
  const res = await apiClient.get('/kyc-operator/applications', { params });
  return {
    success: res.data?.success ?? true,
    stats: res.data?.stats as KycStats | undefined,
    data: (res.data?.data || []) as ApplicationItem[],
    pagination: res.data?.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 },
  };
};

export const verifyKycApplication = async (id: string, remarks?: string) => {
  const res = await apiClient.post(`/kyc-operator/applications/${id}/verify`, { remarks });
  return res.data;
};

export const rejectKycApplication = async (id: string, remarks: string) => {
  const res = await apiClient.post(`/kyc-operator/applications/${id}/reject`, { remarks });
  return res.data;
};

export const requestInfoKycApplication = async (id: string, remarks: string) => {
  const res = await apiClient.post(`/kyc-operator/applications/${id}/request-information`, { remarks });
  return res.data;
};

export const updateKycStage = async (id: string, payload: KycStageUpdatePayload) => {
  const res = await apiClient.post(`/kyc-operator/applications/${id}/update-stage`, payload);
  return res.data;
};

/**
 * General & Operator Queue Verification Services
 */
export const fetchGeneralApplicationsQueue = async (params: FetchQueueParams = {}) => {
  const res = await apiClient.get('/applications', { params });
  return {
    success: res.data?.success ?? true,
    data: (res.data?.data || []) as ApplicationItem[],
    pagination: res.data?.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 },
  };
};

export const updateApplicationVerification = async (id: string, payload: VerificationUpdatePayload) => {
  const res = await apiClient.put(`/applications/${id}/verification`, payload);
  return res.data;
};

export const updateRemarkOperatorRemark = async (id: string, payload: VerificationUpdatePayload) => {
  const res = await apiClient.put(`/applications/${id}/remark`, payload);
  return res.data;
};

export const fetchOperatorHistory = async (id: string): Promise<OperatorAuditLog[]> => {
  const res = await apiClient.get(`/applications/${id}/operator-history`);
  return res.data?.data || [];
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
