import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,
  
  login: (userData, tokenData) => {
    // Dynamically set access token in api instance to prevent circular imports
    import('../api/api').then(({ setAccessToken }) => {
      setAccessToken(tokenData);
    }).catch(e => console.warn('Failed to set access token on login:', e));

    set({ user: userData, token: tokenData, isAuthenticated: true });
  },
  
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    
    // Clear access token in api instance
    import('../api/api').then(({ clearAccessToken }) => {
      clearAccessToken();
    }).catch(e => console.warn('Failed to clear access token on logout:', e));

    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.gharkapaisa.in';
    const cleanBase = baseUrl.replace(/\/+$/, '').endsWith('/api/v1') ? baseUrl.replace(/\/+$/, '') : baseUrl.replace(/\/+$/, '') + '/api/v1';
    
    import('axios')
      .then(({ default: axios }) => {
        axios.post(`${cleanBase}/auth/logout`, {}, { withCredentials: true })
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
      const baseUrl = import.meta.env.VITE_API_URL || 'https://api.gharkapaisa.in';
      const cleanBase = baseUrl.replace(/\/+$/, '').endsWith('/api/v1') ? baseUrl.replace(/\/+$/, '') : baseUrl.replace(/\/+$/, '') + '/api/v1';
      
      const { default: axios } = await import('axios');
      const response = await axios.post(`${cleanBase}/auth/refresh`, {}, { withCredentials: true });
      
      if (response.data && response.data.success) {
        const { token } = response.data;
        
        // Fetch user profile using the new access token
        const userRes = await axios.get(`${cleanBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.data && userRes.data.success) {
          // Import api to set the token inside the axios default instance
          const { setAccessToken } = await import('../api/api');
          setAccessToken(token);
          set({ user: userRes.data.user, token, isAuthenticated: true });
        }
      }
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 400) {
        console.warn('Silent refresh failed on startup:', err);
      }
      // Clean session state
      const { clearAccessToken } = await import('../api/api');
      clearAccessToken();
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  }
}));
