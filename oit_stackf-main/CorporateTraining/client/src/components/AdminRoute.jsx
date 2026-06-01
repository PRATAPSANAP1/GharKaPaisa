import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" text="Verifying access..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;

