import apiClient from './api';
import { ReportCategory, ReportFilterParams, SystemReportMetrics } from '../types';

export const reportService = {
  /**
   * Fetch Applications Report Data
   */
  getApplicationReport: async (filters: ReportFilterParams = {}): Promise<{ success: boolean; count: number; data: any[] }> => {
    try {
      const response = await apiClient.get('/reports/applications', { params: filters });
      return {
        success: response.data?.success === true,
        count: response.data?.count || 0,
        data: Array.isArray(response.data?.data) ? response.data.data : [],
      };
    } catch (error) {
      console.error('Error fetching application report:', error);
      throw error;
    }
  },

  /**
   * Fetch Customers Report Data
   */
  getCustomerReport: async (filters: ReportFilterParams = {}): Promise<{ success: boolean; count: number; data: any[] }> => {
    try {
      const response = await apiClient.get('/reports/customers', { params: filters });
      return {
        success: response.data?.success === true,
        count: response.data?.count || 0,
        data: Array.isArray(response.data?.data) ? response.data.data : [],
      };
    } catch (error) {
      console.error('Error fetching customer report:', error);
      throw error;
    }
  },

  /**
   * Fetch Employee Report Data
   */
  getEmployeeReport: async (filters: ReportFilterParams = {}): Promise<{ success: boolean; count: number; variant?: string; data: any[] }> => {
    try {
      const response = await apiClient.get('/reports/employees', { params: filters });
      return {
        success: response.data?.success === true,
        count: response.data?.count || 0,
        variant: response.data?.variant || 'summary',
        data: Array.isArray(response.data?.data) ? response.data.data : [],
      };
    } catch (error) {
      console.error('Error fetching employee report:', error);
      throw error;
    }
  },

  /**
   * Fetch Partner Report Data
   */
  getPartnerReport: async (filters: ReportFilterParams = {}): Promise<{ success: boolean; count: number; data: any[] }> => {
    try {
      const response = await apiClient.get('/reports/partners', { params: filters });
      return {
        success: response.data?.success === true,
        count: response.data?.count || 0,
        data: Array.isArray(response.data?.data) ? response.data.data : [],
      };
    } catch (error) {
      console.error('Error fetching partner report:', error);
      throw error;
    }
  },

  /**
   * Fetch Admin Report Data
   */
  getAdminReport: async (filters: ReportFilterParams = {}): Promise<{ success: boolean; count: number; data: any[] }> => {
    try {
      const response = await apiClient.get('/reports/admins', { params: filters });
      return {
        success: response.data?.success === true,
        count: response.data?.count || 0,
        data: Array.isArray(response.data?.data) ? response.data.data : [],
      };
    } catch (error) {
      console.error('Error fetching admin report:', error);
      throw error;
    }
  },

  /**
   * Fetch Complete System Summary Report Data
   */
  getCompleteSystemReport: async (
    filters: ReportFilterParams = {}
  ): Promise<{ success: boolean; metrics?: SystemReportMetrics; count: number; data: any[] }> => {
    try {
      const response = await apiClient.get('/reports/complete', { params: filters });
      return {
        success: response.data?.success === true,
        metrics: response.data?.metrics,
        count: response.data?.count || 0,
        data: Array.isArray(response.data?.data) ? response.data.data : [],
      };
    } catch (error) {
      console.error('Error fetching complete system report:', error);
      throw error;
    }
  },

  /**
   * Get Export Excel Download Endpoint URL
   */
  getExportEndpoint: (category: ReportCategory): string => {
    switch (category) {
      case 'APPLICATIONS':
        return '/reports/applications/export';
      case 'CUSTOMERS':
        return '/reports/customers/export';
      case 'EMPLOYEES':
        return '/reports/employees/export';
      case 'PARTNERS':
        return '/reports/partners/export';
      case 'ADMINS':
        return '/reports/admins/export';
      case 'SYSTEM':
        return '/reports/complete/export';
      default:
        return '/reports/applications/export';
    }
  }
};

export default reportService;
