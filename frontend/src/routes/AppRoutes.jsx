import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import PartnerLayout from '../layouts/PartnerLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import PublicLayout from '../layouts/PublicLayout';

// Public Pages
import Home from '../components/Home';
import Contact from '../components/Contact';
import PartnerLogin from '../components/Partner/PartnerLogin';
import PartnerRegister from '../components/Partner/PartnerRegister';
import AdminLogin from '../pages/Admin/AdminLogin';

// Protected Pages (Placeholders for now)
import PartnerDashboard from '../pages/Partner/PartnerDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/login" element={<PartnerLogin />} />
      <Route path="/register" element={<PartnerRegister />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Partner Routes */}
      <Route 
        path="/partner" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['partner']}>
              <PartnerLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PartnerDashboard />} />
        <Route path="applications" element={<div className="p-4">Applications List</div>} />
        <Route path="wallet" element={<div className="p-4">Wallet View</div>} />
        <Route path="profile" element={<div className="p-4">Profile Settings</div>} />
      </Route>

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<div className="p-4">Admin Dashboard</div>} />
        <Route path="partners" element={<div className="p-4">Manage Partners</div>} />
      </Route>

      {/* SuperAdmin Routes */}
      <Route 
        path="/superadmin" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['superadmin']}>
              <SuperAdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<div className="p-4">SuperAdmin Dashboard</div>} />
        <Route path="reports" element={<div className="p-4">System Reports</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
