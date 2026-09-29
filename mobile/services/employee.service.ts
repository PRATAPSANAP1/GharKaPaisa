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
