import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { useAuthStore } from '../store/authStore';
import logo from '../logo.png';

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
import ResetPassword from '../pages/ResetPassword';
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
import CardBenefitsPage from '../pages/Product/CardBenefitsPage';

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
  ManageServices,
  ManageDirectLeads
} from '../pages/SuperAdmin';
import ManageCommissions from '../pages/SuperAdmin/ManageCommissions';

import { 
  PartnerDashboard, 
  PartnerApplications, 
  PartnerWallet, 
  PartnerProfile,
  PartnerProducts
} from '../pages/Partner';
import PartnerTeam from '../pages/Partner/PartnerTeam';
import PartnerKyc from '../pages/Partner/PartnerKyc';
import PartnerCrm from '../pages/Partner/PartnerCrm';
import PartnerSupport from '../pages/Partner/PartnerSupport';
import PartnerVault from '../pages/Partner/PartnerVault';
import PartnerMarketing from '../pages/Partner/PartnerMarketing';
import PartnerTraining from '../pages/Partner/PartnerTraining';
import ComingSoonModule from '../pages/Partner/ComingSoonModule';

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
        <img 
          src={logo} 
          alt="GharKaPaisa Logo" 
          style={{
            width: '80px',
            height: '80px',
            objectFit: 'contain',
            animation: 'horizontalSpin 2s linear infinite',
            marginBottom: '24px'
          }} 
        />
        <div style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#94a3b8',
          letterSpacing: '0.5px'
        }}>
          Welcome to GharKaPaisa...!
        </div>
        <style>{`
          @keyframes horizontalSpin {
            0% {
              transform: rotateY(0deg);
            }
            100% {
              transform: rotateY(-360deg);
            }
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
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/card-benefits/:id" element={<CardBenefitsPage />} />
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
        <Route path="marketplace" element={<PartnerProducts />} />
        <Route path="credit-center" element={<ComingSoonModule title="Credit Card Center" />} />
        <Route path="leads" element={<PartnerApplications />} />
        <Route path="crm" element={<PartnerCrm />} />
        <Route path="kyc" element={<PartnerKyc />} />
        <Route path="profile" element={<PartnerProfile />} />
        <Route path="vault" element={<PartnerVault />} />
        <Route path="wallet" element={<PartnerWallet />} />
        <Route path="referral" element={<PartnerTeam />} />
        <Route path="training" element={<PartnerTraining />} />
        <Route path="marketing" element={<PartnerMarketing />} />
        <Route path="support" element={<PartnerSupport />} />
        <Route path="settings" element={<ComingSoonModule title="Settings & Security" />} />
        
        {/* Legacy Support */}
        <Route path="products" element={<Navigate to="../marketplace" replace />} />
        <Route path="applications" element={<Navigate to="../leads" replace />} />
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
        <Route path="direct-leads" element={<ManageDirectLeads />} />
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
