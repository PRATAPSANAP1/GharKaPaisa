import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../app/store/authStore';

const getRoleDashboard = (user) => {
  const role = (user?.role || (typeof user === 'string' ? user : '')).toUpperCase();
  const designation = (user?.designation || '').toUpperCase();
  if (['REMARK OPERATOR', 'REMARK_OPERATOR', 'QD OPERATOR', 'QD_OPERATOR', 'QD CHECKER', 'QD_CHECKER'].includes(designation) || ['REMARK OPERATOR', 'REMARK_OPERATOR', 'QD OPERATOR', 'QD_OPERATOR', 'QD CHECKER', 'QD_CHECKER'].includes(role)) {
    return '/admin/applications';
  }
  if (role === 'SUPER_ADMIN') return '/super-admin/overview';
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'HR') return '/hr/dashboard';
  if (role === 'EMPLOYEE') return '/employee/dashboard';
  return '/partner/dashboard';
};

const RoleRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role?.toUpperCase())) {
    const dest = user ? getRoleDashboard(user) : '/login';
    return <Navigate to={dest} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
