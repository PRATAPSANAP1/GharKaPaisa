import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { useAuthStore } from '../store/authStore';

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
import VerifyEmail from '../pages/VerifyEmail';
import TermsAndConditions from '../pages/TermsAndConditions';
import PrivacyPolicy from '../pages/PrivacyPolicy';

// Services Pages
import MoneyTransfer from '../pages/Services/MoneyTransfer';
import Recharge from '../pages/Services/Recharge';
import Electricity from '../pages/Services/Electricity';
import LoanRepay from '../pages/Services/LoanRepay';
import Fastag from '../pages/Services/Fastag';
import ComingSoon from '../pages/Services/ComingSoon';

// Product Lead Gen
import ProductDetails from '../pages/Product/ProductDetails';
import ApplyForm from '../pages/Product/ApplyForm';

// Structured Folder Imports
import { 
  AdminDashboard, 
  AdminLogin, 
  ManageApplications, 
  ManagePartners, 
  ManageWithdrawals,
  ManageLeads
} from '../pages/Admin';

import { 
  SuperAdminDashboard, 
  SuperAdminReports, 
  AuditLogs, 
  ManageBanners, 
  ManageProducts,
  ManageBanks,
  ManageSections,
  ManageServices
} from '../pages/SuperAdmin';
import ManageCommissions from '../pages/SuperAdmin/ManageCommissions';

import { 
  PartnerDashboard, 
  PartnerApplications, 
  PartnerWallet, 
  PartnerProfile,
  PartnerProducts
} from '../pages/Partner';

const AppRoutes = () => {
  const { isInitializing, initializeAuth } = useAuthStore();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid rgba(16, 185, 129, 0.1)',
          borderTopColor: '#10b981',
          animation: 'spin 1.5s linear infinite',
          marginBottom: '20px'
        }} />
        <div style={{
          fontSize: '15px',
          fontWeight: 500,
          color: '#94a3b8',
          letterSpacing: '0.5px'
        }}>
          Initializing secure session...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
        <Route path="/category/:categoryKey" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<PartnerLogin />} />
        <Route path="/register" element={<PartnerRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* Services Routes - Protected */}
        <Route path="/money-transfer" element={<ProtectedRoute><MoneyTransfer /></ProtectedRoute>} />
        <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
        <Route path="/electricity" element={<ProtectedRoute><Electricity /></ProtectedRoute>} />
        <Route path="/loan-repay" element={<ProtectedRoute><LoanRepay /></ProtectedRoute>} />
        <Route path="/fastag" element={<ProtectedRoute><Fastag /></ProtectedRoute>} />
        
        {/* Travel Bookings - mapped to Coming Soon for now */}
        <Route path="/travel-transit/bus-booking" element={<ComingSoon />} />
        <Route path="/travel-transit/train-booking" element={<ComingSoon />} />
        <Route path="/travel-transit/hotel-booking" element={<ComingSoon />} />

        {/* Product Lead Generation */}
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/product/:id/apply" element={<ApplyForm />} />
      </Route>

      {/* Partner Routes */}
      <Route 
        path="/partner" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['PARTNER']}>
              <PartnerLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PartnerDashboard />} />
        <Route path="applications" element={<PartnerApplications />} />
        <Route path="wallet" element={<PartnerWallet />} />
        <Route path="profile" element={<PartnerProfile />} />
        <Route path="products" element={<PartnerProducts />} />
      </Route>

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="partners" element={<ManagePartners />} />
        <Route path="applications" element={<ManageApplications />} />
        <Route path="leads" element={<ManageLeads />} />
        <Route path="withdrawals" element={<ManageWithdrawals />} />
      </Route>

      {/* SuperAdmin Routes */}
      <Route 
        path="/superadmin" 
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="reports" element={<SuperAdminReports />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="partners" element={<ManagePartners />} />
        <Route path="leads" element={<ManageLeads />} />
        <Route path="banners" element={<ManageBanners />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="banks" element={<ManageBanks />} />
        <Route path="sections" element={<ManageSections />} />
        <Route path="services" element={<ManageServices />} />
        <Route path="commissions" element={<ManageCommissions />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
