import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isAuthenticated as apiIsAuthenticated } from '../api/api';

const ProtectedRoute = ({ children }) => {
  const zustandAuth = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // Use Zustand state first, but fallback to API helper which checks
  // sessionStorage token + JWT expiry. This handles page reloads where
  // Zustand may have lost state but the token is still valid.
  const isAuth = zustandAuth || apiIsAuthenticated();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
