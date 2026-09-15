import api from './api';

/**
 * Fetch Working Hours Configuration & restricted user list
 */
export const fetchWorkingHoursConfig = async () => {
  const response = await api.get('/superadmin/working-hours');
  return response.data;
};

/**
 * Update Working Hours for user, designation, or global
 */
export const updateWorkingHours = async (payload) => {
  const response = await api.put('/superadmin/working-hours', payload);
  return response.data;
};

/**
 * Extend Working Hours (Specific user or All users)
 */
export const extendWorkingHours = async (payload) => {
  const response = await api.post('/superadmin/working-hours/extend', payload);
  return response.data;
};

/**
 * Fetch Extension Audit History
 */
export const fetchExtensionHistory = async () => {
  const response = await api.get('/superadmin/working-hours/extensions');
  return response.data;
};
