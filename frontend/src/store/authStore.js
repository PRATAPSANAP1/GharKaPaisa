import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(sessionStorage.getItem('user')) || null,
  token: sessionStorage.getItem('gkp_access_token') || null,
  isAuthenticated: !!sessionStorage.getItem('gkp_access_token'),
  
  login: (userData, tokenData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('gkp_access_token', tokenData);
    set({ user: userData, token: tokenData, isAuthenticated: true });
  },
  
  logout: () => {
    const refreshToken = localStorage.getItem('gkp_refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('gkp_access_token');
    sessionStorage.removeItem('gkp_user');
    localStorage.removeItem('gkp_refresh_token');
    set({ user: null, token: null, isAuthenticated: false });

    if (refreshToken) {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://api.gharkapaisa.in';
      import('axios')
        .then(({ default: axios }) => {
          axios.post(`${baseUrl}/api/v1/auth/logout`, { refreshToken })
            .catch(err => console.warn('Logout request failed:', err));
        })
        .catch(err => console.warn('Failed to load axios for logout:', err));
    }
  },
  
  updateUser: (updates) => set((state) => {
    const updatedUser = { ...state.user, ...updates };
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  })
}));
