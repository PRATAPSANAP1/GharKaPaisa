import apiClient from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthPlan {
  id: string;
  name: string;
  insurer: string;
  coverage: string;
  premium: string;
  features: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  icon: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export interface TravelService {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export interface BillPaymentService {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  reward: string;
  target: number;
  status: 'active' | 'upcoming' | 'completed';
  progress: number;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
}

// ============================================================================
// CMS ENDPOINTS
// ============================================================================

/**
 * Fetch Health Insurance Plans
 */
export const fetchHealthPlans = async (): Promise<{ success: boolean; data: HealthPlan[] }> => {
  try {
    const res = await apiClient.get('/insurance/health-plans');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch health plans' };
  }
};

/**
 * Fetch Life Insurance Plans
 */
export const fetchLifePlans = async (): Promise<{ success: boolean; data: HealthPlan[] }> => {
  try {
    const res = await apiClient.get('/insurance/life-plans');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch life plans' };
  }
};

/**
 * Fetch Car Insurance Plans
 */
export const fetchCarPlans = async (): Promise<{ success: boolean; data: HealthPlan[] }> => {
  try {
    const res = await apiClient.get('/insurance/car-plans');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch car plans' };
  }
};

/**
 * Fetch Insurance Types
 */
export const fetchInsuranceTypes = async (): Promise<{ success: boolean; data: any[] }> => {
  try {
    const res = await apiClient.get('/insurance/types');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch insurance types' };
  }
};

/**
 * Fetch FAQs
 */
export const fetchFAQs = async (): Promise<{ success: boolean; data: FAQ[] }> => {
  try {
    const res = await apiClient.get('/cms/faqs');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch FAQs' };
  }
};

/**
 * Fetch Guides
 */
export const fetchGuides = async (): Promise<{ success: boolean; data: Guide[] }> => {
  try {
    const res = await apiClient.get('/cms/guides');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch guides' };
  }
};

/**
 * Fetch Payment Methods
 */
export const fetchPaymentMethods = async (): Promise<{ success: boolean; data: PaymentMethod[] }> => {
  try {
    const res = await apiClient.get('/payment-methods');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch payment methods' };
  }
};

/**
 * Fetch Travel Services
 */
export const fetchTravelServices = async (): Promise<{ success: boolean; data: TravelService[] }> => {
  try {
    const res = await apiClient.get('/travel/services');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch travel services' };
  }
};

/**
 * Fetch Bill Payment Services
 */
export const fetchBillPaymentServices = async (): Promise<{ success: boolean; data: BillPaymentService[] }> => {
  try {
    const res = await apiClient.get('/bill-payment/services');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch bill payment services' };
  }
};

/**
 * Fetch Employee Contests
 */
export const fetchEmployeeContests = async (): Promise<{ success: boolean; data: Contest[] }> => {
  try {
    const res = await apiClient.get('/employee/contests');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch contests' };
  }
};

/**
 * Fetch Product Reviews
 */
export const fetchProductReviews = async (productId: string): Promise<{ success: boolean; data: ProductReview[] }> => {
  try {
    const res = await apiClient.get(`/products/${productId}/reviews`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch reviews' };
  }
};
