import { create } from 'zustand';
import axios from 'axios';
import { getApiV1Url } from '../../config/api';
import api, { setAccessToken, clearAccessToken, registerAuthFailureHandler } from '../../services/api';

export const useAuthStore = create((set, get) => {
  // Register failure handler to reset state on 401 token refresh failures
  registerAuthFailureHandler(() => {
    set({ user: null, token: null, isAuthenticated: false });
  });

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: true,
    
    login: (userData, tokenData) => {
      setAccessToken(tokenData);
      set({ user: userData, token: tokenData, isAuthenticated: true });
    },
    
    logout: async () => {
      clearAccessToken();
      set({ user: null, token: null, isAuthenticated: false });
      
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.warn('Logout request failed:', err);
      }
    },
    
    updateUser: (updates) => set((state) => {
      const updatedUser = { ...state.user, ...updates };
      return { user: updatedUser };
    }),

    initializeAuth: async () => {
      // Prevent multiple initializations per app lifecycle
      if (!get().isInitializing) {
        return;
      }

      try {
        const baseUrl = getApiV1Url();
        
        // 1. Silent token refresh using credentials cookie (HttpOnly)
        const response = await axios.post(`${baseUrl}/auth/refresh`, {}, { withCredentials: true });
        
        if (response.data && response.data.success) {
          const { token } = response.data;
          
          // 2. Hydrate user profile from backend using the fresh access token
          const userRes = await axios.get(`${baseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userRes.data && userRes.data.success) {
            setAccessToken(token);
            set({ user: userRes.data.user, token, isAuthenticated: true });
            return;
          }
        }

        throw new Error(response.data?.message || 'Refresh returned unsuccessful response');
      } catch (err) {
        const isSilent401 = err?.response?.status === 401;
        if (!isSilent401) {
          console.warn('Auth initialization / silent refresh failed:', err?.response?.data?.message || err.message);
        }
        
        // Clean session state on 401 authentication errors only
        if (isSilent401) {
          clearAccessToken();
          set({ user: null, token: null, isAuthenticated: false });
        }
      } finally {
        set({ isInitializing: false });
      }
    }
  };
});
