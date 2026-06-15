import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(sessionStorage.getItem('user')) || null,
  token: sessionStorage.getItem('token') || null,
  isAuthenticated: !!sessionStorage.getItem('token'),
  
  login: (userData, tokenData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', tokenData);
    set({ user: userData, token: tokenData, isAuthenticated: true });
  },
  
  logout: () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    // Clear other session storage
    sessionStorage.clear();
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  updateUser: (updates) => set((state) => {
    const updatedUser = { ...state.user, ...updates };
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  })
}));
