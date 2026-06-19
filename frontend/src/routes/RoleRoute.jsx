import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const RoleRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role?.toUpperCase())) {
    // Redirect to home or an unauthorized page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;
