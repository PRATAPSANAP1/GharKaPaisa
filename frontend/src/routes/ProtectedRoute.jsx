import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../app/store/authStore';

const ProtectedRoute = ({ children }) => {
  const isAuth = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
