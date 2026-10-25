import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../app/store/authStore';

const OPERATOR_TITLES = [
  'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR', 'OPERATOR',
  'BACKEND', 'BACKEND OPERATION', 'BACKEND_OPERATION', 'BACKEND OPERATOR',
  'REMARK OPERATOR', 'REMARK_OPERATOR',
  'QD OPERATOR', 'QD_OPERATOR', 'QD CHECKER', 'QD_CHECKER',
  'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR',
  'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR',
  'PHYSICAL CURABLE OPERATOR', 'PHYSICAL_CURABLE_OPERATOR',
  'DIGITAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR',
  'EMAIL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR',
  'PHYSICAL CURABLE', 'PHYSICAL_CURABLE',
  'DIGITAL CURABLE', 'DIGITAL_CURABLE',
  'EMAIL CURABLE', 'EMAIL_CURABLE',
  'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE',
  'PAN CHECKER', 'PAN_CHECKER'
];

const isOperatorUser = (user) => {
  const role = (user?.role || (typeof user === 'string' ? user : '')).toUpperCase();
  const designation = (user?.designation || '').toUpperCase();
  return OPERATOR_TITLES.some(title => designation.includes(title) || role === title || role.includes(title));
};

const getRoleDashboard = (user) => {
  const role = (user?.role || (typeof user === 'string' ? user : '')).toUpperCase();
  const designation = (user?.designation || '').toUpperCase();
  if (['KYC OPERATOR', 'KYC_OPERATOR'].includes(designation) || ['KYC OPERATOR', 'KYC_OPERATOR'].includes(role)) {
    return '/admin/kyc-operator';
  }
  if (isOperatorUser(user)) {
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
  const userRole = (user?.role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();
  const upperAllowed = (allowedRoles || []).map(r => r.toUpperCase());

  const isRoleAllowed = upperAllowed.includes(userRole);
  const isDesignationAllowed = upperAllowed.some(r => userDesignation.includes(r));
  const isOperatorAllowedForAdminRoute = upperAllowed.some(r => ['ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'KYC_OPERATOR'].includes(r)) && isOperatorUser(user);

  if (!user || (!isRoleAllowed && !isDesignationAllowed && !isOperatorAllowedForAdminRoute)) {
    const dest = user ? getRoleDashboard(user) : '/login';
    return <Navigate to={dest} replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
