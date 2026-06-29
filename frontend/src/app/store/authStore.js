import { create } from 'zustand';
import { getApiV1Url } from '../../config/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,
  
  login: (userData, tokenData) => {
    try {
      localStorage.setItem('gkp_logged_in', 'true');
    } catch (e) {
      console.warn('Failed to set login flag:', e);
    }

    // Dynamically set access token in api instance to prevent circular imports
    import('../../services/api').then(({ setAccessToken }) => {
      setAccessToken(tokenData);
    }).catch(e => console.warn('Failed to set access token on login:', e));

    set({ user: userData, token: tokenData, isAuthenticated: true });
  },
  
  logout: () => {
    try {
      localStorage.removeItem('gkp_logged_in');
    } catch (e) {
      console.warn('Failed to remove login flag:', e);
    }

    set({ user: null, token: null, isAuthenticated: false });
    
    // Clear access token in api instance
    import('../../services/api').then(({ clearAccessToken }) => {
      clearAccessToken();
    }).catch(e => console.warn('Failed to clear access token on logout:', e));

    const baseUrl = getApiV1Url();

    import('axios')
      .then(({ default: axios }) => {
        axios.post(`${baseUrl}/auth/logout`, {}, { withCredentials: true })
          .catch(err => console.warn('Logout request failed:', err));
      })
      .catch(err => console.warn('Failed to load axios for logout:', err));
  },
  
  updateUser: (updates) => set((state) => {
    const updatedUser = { ...state.user, ...updates };
    return { user: updatedUser };
  }),

  initializeAuth: async () => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('gkp_logged_in') !== 'true') {
        set({ isInitializing: false });
        return;
      }

      const baseUrl = getApiV1Url();
      
      const { default: axios } = await import('axios');
      const response = await axios.post(`${baseUrl}/auth/refresh`, {}, { withCredentials: true });
      
      if (response.data && response.data.success) {
        const { token } = response.data;
        
        // Fetch user profile using the new access token
        const userRes = await axios.get(`${baseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.data && userRes.data.success) {
          // Import api to set the token inside the axios default instance
          const { setAccessToken } = await import('../../services/api');
          setAccessToken(token);
          set({ user: userRes.data.user, token, isAuthenticated: true });
        }
      }
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 400) {
        console.warn('Silent refresh failed on startup:', err);
      }
      // Clean session state
      const { clearAccessToken } = await import('../../services/api');
      clearAccessToken();
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  }
}));
