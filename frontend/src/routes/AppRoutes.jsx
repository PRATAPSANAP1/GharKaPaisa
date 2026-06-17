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
import SuperAdminDashboard from '../pages/SuperAdmin/SuperAdminDashboard';
import TermsAndConditions from '../pages/TermsAndConditions';
import PrivacyPolicy from '../pages/PrivacyPolicy';

// Admin Pages
import AdminDashboard from '../pages/Admin/AdminDashboard';
import ManagePartners from '../pages/Admin/ManagePartners';
import ManageApplications from '../pages/Admin/ManageApplications';
import ManageWithdrawals from '../pages/Admin/ManageWithdrawals';

// Protected Pages (Placeholders for now)
import PartnerDashboard from '../pages/Partner/PartnerDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/loans" element={<Home />} />
        <Route path="/insurance" element={<Home />} />
        <Route path="/credit-cards" element={<Home />} />
        <Route path="/credit-cards/lifetime-free-credit-cards-ltf" element={<Home />} />
        <Route path="/credit-cards/:bankIdParam" element={<Home />} />
        <Route path="/credit-cards/:bankIdParam/:typeParam" element={<Home />} />
        <Route path="/money-transfer/fastag" element={<Home />} />
        <Route path="/travel-transit/flight-booking" element={<Home />} />
        <Route path="/attractive-cards-loans" element={<Home />} />
        <Route path="/attractive-cards-loans/:catParam" element={<Home />} />
        <Route path="/travel-transit" element={<Home />} />
        <Route path="/services" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<PartnerLogin />} />
        <Route path="/register" element={<PartnerRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>

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
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="partners" element={<ManagePartners />} />
        <Route path="applications" element={<ManageApplications />} />
        <Route path="withdrawals" element={<ManageWithdrawals />} />
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
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="reports" element={<div className="p-4">System Reports</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
