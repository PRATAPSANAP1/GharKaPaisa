import api from './api';

/**
 * Super Admin Account Activation & Deactivation Management APIs
 */

export const fetchAccounts = async (params = {}) => {
  const res = await api.get('/superadmin/accounts', { params });
  return res.data;
};

export const activateAccount = async (userId, data = {}) => {
  const res = await api.post(`/superadmin/accounts/${userId}/activate`, data);
  return res.data;
};

export const deactivateAccount = async (userId, data = {}) => {
  const res = await api.post(`/superadmin/accounts/${userId}/deactivate`, data);
  return res.data;
};

export const bulkUpdateAccountStatus = async (data = {}) => {
  const res = await api.post('/superadmin/accounts/bulk-status', data);
  return res.data;
};

export const scheduleAccountStatus = async (userId, data) => {
  const res = await api.post(`/superadmin/accounts/${userId}/schedule`, data);
  return res.data;
};

export const cancelScheduledStatus = async (userId) => {
  const res = await api.post(`/superadmin/accounts/${userId}/cancel-schedule`);
  return res.data;
};

export const fetchAccountAuditHistory = async (userId) => {
  const res = await api.get(`/superadmin/accounts/${userId}/audit-history`);
  return res.data;
};
