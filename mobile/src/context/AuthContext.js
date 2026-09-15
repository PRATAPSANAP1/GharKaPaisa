import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSecureItem, setSecureItem, removeSecureItem, clearAllAuthData } from '../../services/storage.service';
import { registerWorkingHoursListener, setAuthToken } from '../../config/api';
import { getCurrentUserProfile } from '../../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workingHoursNotice, setWorkingHoursNotice] = useState({
    isRestricted: false,
    message: ''
  });

  useEffect(() => {
    // 1. Register global working hours API interceptor listener
    registerWorkingHoursListener((notice) => {
      setWorkingHoursNotice(notice);
    });

    // 2. Load authenticated session from secure storage
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await getSecureItem('auth_token');
      const storedUser = await getSecureItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
        setAuthToken(storedToken);

        // Fetch fresh profile in background
        getCurrentUserProfile()
          .then((res) => {
            if (res?.user) setUser(res.user);
          })
          .catch(() => {});
      }
    } catch (error) {
      console.error('[AuthContext] Load auth data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken, refreshToken = null) => {
    try {
      await setSecureItem('auth_token', authToken);
      if (refreshToken) {
        await setSecureItem('refresh_token', refreshToken);
      }
      await setSecureItem('auth_user', userData);

      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthToken(authToken);

      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login save error:', error);
      return { success: false, error: 'Failed to persist session' };
    }
  };

  const logout = async () => {
    try {
      await clearAllAuthData();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
      setWorkingHoursNotice({ isRestricted: false, message: '' });
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  };

  const updateUser = async (userData) => {
    try {
      await setSecureItem('auth_user', userData);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update user profile' };
    }
  };

  const closeWorkingHoursNotice = () => {
    setWorkingHoursNotice({ isRestricted: false, message: '' });
  };

  // Helper permission getters
  const userRole = (user?.role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isEmployee = userRole === 'EMPLOYEE';
  const isPartner = ['PARTNER', 'TEAM_MEMBER'].includes(userRole);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    userRole,
    userDesignation,
    isSuperAdmin,
    isAdmin,
    isEmployee,
    isPartner,
    workingHoursNotice,
    login,
    logout,
    updateUser,
    closeWorkingHoursNotice,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
