import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { UserProfile, UserRole } from '../types';
import { getSecureItem, setSecureItem } from '../services/storage.service';
import { fetchCurrentUser, logoutSession } from '../services/auth.service';
import {
  getAndClearPendingDestination,
  clearPendingDestination,
} from '../services/deeplink.service';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | '';
  userDesignation: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isPartner: boolean;
  loginSession: (userData: UserProfile, token: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedToken = await getSecureItem<string>('auth_token');
      const storedUser = await getSecureItem<UserProfile>('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);

        // Fetch latest profile in background
        fetchCurrentUser()
          .then((res) => {
            if (res?.user) {
              setUser(res.user);
            }
          })
          .catch(() => {});

        // Check for pending deep link destination
        const pendingTarget = await getAndClearPendingDestination();
        if (pendingTarget) {
          console.log(`[AuthContext] Restoring pending deep link: ${pendingTarget}`);
          setTimeout(() => {
            router.push(pendingTarget as any);
          }, 300);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Restore session error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginSession = async (userData: UserProfile, authToken: string, refreshToken?: string) => {
    await setSecureItem('auth_token', authToken);
    if (refreshToken) {
      await setSecureItem('refresh_token', refreshToken);
    }
    await setSecureItem('auth_user', userData);

    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);

    // Navigate to pending deep link target if present after login
    const pendingTarget = await getAndClearPendingDestination();
    if (pendingTarget) {
      console.log(`[AuthContext] Post-login pending deep link: ${pendingTarget}`);
      setTimeout(() => {
        router.push(pendingTarget as any);
      }, 300);
    }
  };

  const logout = async () => {
    await clearPendingDestination();
    await logoutSession();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const reloadUser = async () => {
    try {
      const res = await fetchCurrentUser();
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('[AuthContext] Reload user error:', err);
    }
  };

  const userRole = (user?.role || '') as UserRole | '';
  const userDesignation = user?.designation || '';

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isEmployee = userRole === 'EMPLOYEE';
  const isPartner = ['PARTNER', 'TEAM_MEMBER'].includes(userRole);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        userRole,
        userDesignation,
        isSuperAdmin,
        isAdmin,
        isEmployee,
        isPartner,
        loginSession,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
