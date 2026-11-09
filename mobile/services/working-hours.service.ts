import apiClient from './api';

export interface WorkingDaySchedule {
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export interface WorkingHoursConfig {
  schedule?: Record<string, WorkingDaySchedule>;
  default_start_time?: string;
  default_end_time?: string;
  allow_grace_period_mins?: number;
  enforce_strict_hours?: boolean;
  holidays?: HolidayItem[];
  extensions?: ExtensionItem[];
  policies?: DepartmentPolicyItem[];
}

export interface ExtensionItem {
  id: string;
  target_type: 'ALL' | 'USER' | 'DEPARTMENT';
  target_id?: string | null;
  target_name?: string | null;
  extension_date: string;
  extended_until: string;
  reason: string;
  granted_by_name?: string;
  created_at: string;
}

export interface DepartmentPolicyItem {
  id: string;
  department: string;
  start_time: string;
  end_time: string;
  grace_period_mins: number;
  is_active: boolean;
  notes?: string;
}

export interface HolidayItem {
  id: string;
  title: string;
  holiday_date: string;
  is_optional: boolean;
  notes?: string;
}

export const fetchWorkingHoursConfig = async (): Promise<WorkingHoursConfig> => {
  try {
    const res = await apiClient.get('/superadmin/working-hours');
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch working hours' };
  }
};

export const updateWorkingHours = async (payload: any): Promise<any> => {
  try {
    const res = await apiClient.put('/superadmin/working-hours', payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update working hours' };
  }
};

export const extendWorkingHours = async (payload: {
  target_type: 'ALL' | 'USER' | 'DEPARTMENT';
  target_id?: string;
  extension_date: string;
  extended_until: string;
  reason: string;
}): Promise<any> => {
  try {
    const res = await apiClient.post('/superadmin/working-hours/extend', payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to extend working hours' };
  }
};

export const fetchExtensionHistory = async (): Promise<ExtensionItem[]> => {
  try {
    const res = await apiClient.get('/superadmin/working-hours/extensions');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    return data?.extensions || [];
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch extensions' };
  }
};

export const revokeExtension = async (id: string): Promise<any> => {
  try {
    const res = await apiClient.delete(`/superadmin/working-hours/extension/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to revoke extension' };
  }
};

export const fetchPolicies = async (): Promise<DepartmentPolicyItem[]> => {
  try {
    const res = await apiClient.get('/superadmin/working-hours/policies');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    return data?.policies || [];
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch policies' };
  }
};

export const savePolicy = async (payload: any): Promise<any> => {
  try {
    const res = await apiClient.post('/superadmin/working-hours/policy', payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to save policy' };
  }
};

export const deletePolicy = async (id: string): Promise<any> => {
  try {
    const res = await apiClient.delete(`/superadmin/working-hours/policy/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to delete policy' };
  }
};

export const fetchHolidays = async (): Promise<HolidayItem[]> => {
  try {
    const res = await apiClient.get('/superadmin/working-hours/holidays');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    return data?.holidays || [];
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch holidays' };
  }
};

export const saveHoliday = async (payload: any): Promise<any> => {
  try {
    const res = await apiClient.post('/superadmin/working-hours/holiday', payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to save holiday' };
  }
};

export const deleteHoliday = async (id: string): Promise<any> => {
  try {
    const res = await apiClient.delete(`/superadmin/working-hours/holiday/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to delete holiday' };
  }
};
