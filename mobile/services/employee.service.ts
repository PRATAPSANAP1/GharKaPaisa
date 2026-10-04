import apiClient from './api';

export interface EmployeeProfileData {
  employee: {
    id: string;
    employee_id: string;
    full_name: string;
    email_id?: string;
    mobile_number: string;
    designation: string;
    department?: string;
    employee_status?: string;
    activation_status?: string;
    total_applications: number;
    approved_applications: number;
    leads_count: number;
    team_size: number;
    active_members: number;
  };
  incentives_summary?: {
    total_incentives: number;
    paid_incentives: number;
    pending_incentives: number;
  };
  total_applications: number;
  approved_applications: number;
  leads_count: number;
  team_size: number;
  active_members: number;
}

export interface EmployeeIncentiveStats {
  total_paid: number;
  pending_incentive: number;
  total_leads_converted: number;
}

export interface EmployeeIncentiveTransaction {
  id: string;
  application_id?: string;
  app_number?: string;
  product_name?: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface EmployeeIncentivesResponse {
  success: boolean;
  stats?: EmployeeIncentiveStats;
  transactions?: EmployeeIncentiveTransaction[];
}

export interface EmployeeApplicationItem {
  id: string;
  app_number: string;
  customer_name: string;
  customer_mobile: string;
  product_name: string;
  bank_name?: string;
  status: string;
  created_at: string;
}

export interface EmployeeTeamMember {
  id: string;
  employee_id: string;
  full_name: string;
  designation: string;
  mobile_number?: string;
  hierarchy_level?: string;
  overall_progress?: number;
  manager_name?: string;
  team_leader_name?: string;
}

export interface EmployeeTeamResponse {
  success: boolean;
  designation?: string;
  team: EmployeeTeamMember[];
}

export interface EmployeeProductLink {
  product_id: string;
  bank_id?: string;
  product_name: string;
  category?: string;
  image_url?: string;
  logo?: string;
  description?: string;
  bank_name?: string;
  bank_logo?: string;
  base_incentive?: number;
  employee_incentive?: number;
  referral_url: string;
  link_status?: string;
  is_bank_assigned?: boolean;
}

export const fetchEmployeeProfile = async (): Promise<EmployeeProfileData | null> => {
  try {
    const res = await apiClient.get('/employee/profile');
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch employee profile data:', err);
    return null;
  }
};

export const fetchEmployeeIncentives = async (): Promise<EmployeeIncentivesResponse | null> => {
  try {
    const res = await apiClient.get('/employee/incentives');
    if (res.data?.success) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch employee incentives:', err);
    return null;
  }
};

export const fetchEmployeeApplications = async (): Promise<EmployeeApplicationItem[]> => {
  try {
    const res = await apiClient.get('/employee/applications');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch employee applications:', err);
    return [];
  }
};

export const fetchEmployeeTeam = async (): Promise<EmployeeTeamResponse | null> => {
  try {
    const res = await apiClient.get('/employee/team');
    if (res.data?.success) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch employee team data:', err);
    return null;
  }
};

export const fetchEmployeeCreditCards = async (): Promise<EmployeeProductLink[]> => {
  try {
    const res = await apiClient.get('/employee/credit-cards');
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch employee credit cards / referral links:', err);
    return [];
  }
};

/**
 * Fetch employee verification status and onboarding checklist
 */
export interface VerificationStatus {
  overall_status: string;
  missing_items: Array<{
    type: string;
    status: string;
    description?: string;
  }>;
  video_status?: string;
}

export const fetchEmployeeVerificationStatus = async (): Promise<VerificationStatus | null> => {
  try {
    const res = await apiClient.get('/employee/verification-status');
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch employee verification status:', err);
    return null;
  }
};

/**
 * Fetch employee onboarding status checklist
 */
export interface OnboardingChecklist {
  kyc_status: string;
  video_status: string;
  terms_status: string;
  bank_status: string;
  overall_status: string;
  [key: string]: any;
}

export const fetchEmployeeOnboardingStatus = async (): Promise<OnboardingChecklist | null> => {
  try {
    const res = await apiClient.get('/employee/onboarding-status');
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch employee onboarding status:', err);
    return null;
  }
};

export const fetchDailySalesReports = async () => {
  try {
    const res = await apiClient.get('/employees/sales-reports');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch sales reports' };
  }
};

export const submitDailySalesReport = async (reportData: {
  report_date: string;
  total_cards: number;
  remark?: string;
  photo_url?: string;
  banks?: Array<{ bank_id: string; cards_sold: number }>;
}) => {
  try {
    const res = await apiClient.post('/employees/sales-reports', reportData);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to submit sales report' };
  }
};

export const submitJoiningDetails = async (formData: any) => {
  try {
    const res = await apiClient.post('/employee/joining-details', formData);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to submit joining details' };
  }
};

export const submitEmployeeKYC = async (formData: any) => {
  try {
    const res = await apiClient.post('/employee/kyc', formData);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to submit employee KYC' };
  }
};
