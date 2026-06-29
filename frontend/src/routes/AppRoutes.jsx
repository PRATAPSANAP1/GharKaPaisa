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
import Home from '../modules/home/Home';
import Contact from '../modules/home/Contact';
import PartnerLogin from '../modules/authentication/login/PartnerLogin';
import PartnerRegister from '../modules/authentication/register/PartnerRegister';
import VerifyEmail from '../modules/authentication/register/VerifyEmail';
import ResetPassword from '../modules/authentication/reset-password/ResetPassword';
import TermsAndConditions from '../modules/home/TermsAndConditions';
import PrivacyPolicy from '../modules/home/PrivacyPolicy';

// Services Pages
import MoneyTransfer from '../modules/cms/MoneyTransfer';
import Recharge from '../modules/cms/Recharge';
import Electricity from '../modules/cms/Electricity';
import LoanRepay from '../modules/cms/LoanRepay';
import Fastag from '../modules/cms/Fastag';
import ComingSoon from '../modules/cms/ComingSoon';

// Product Lead Gen
import ProductDetails from '../modules/products/ProductDetails';
import ApplyForm from '../modules/products/ApplyForm';
import CardBenefitsPage from '../modules/products/CardBenefitsPage';

// Admin Pages
import AdminDashboard from '../modules/admin/dashboard/AdminDashboard';
import AdminLogin from '../modules/authentication/login/AdminLogin';
import ManageApplications from '../modules/admin/reports/ManageApplications';
import ManagePartners from '../modules/admin/users/ManagePartners';
import ManageWithdrawals from '../modules/admin/users/ManageWithdrawals';
import ManageLeads from '../modules/admin/users/ManageLeads';

// Super Admin Pages
import SuperAdminDashboard from '../modules/super-admin/dashboard/SuperAdminDashboard';
import SuperAdminReports from '../modules/super-admin/reports/SuperAdminReports';
import AuditLogs from '../modules/super-admin/audit/AuditLogs';
import ManageBanners from '../modules/super-admin/banners/ManageBanners';
import ManageProducts from '../modules/super-admin/cms/ManageProducts';
import ManageBanks from '../modules/super-admin/cms/ManageBanks';
import ManageSections from '../modules/super-admin/cms/ManageSections';
import ManageServices from '../pages/SuperAdmin/ManageServices';
import ManageDirectLeads from '../modules/super-admin/crm/ManageDirectLeads';
import ManageCommissions from '../modules/super-admin/settings/ManageCommissions';

// Partner Pages
import PartnerDashboard from '../modules/partner/dashboard/PartnerDashboard';
import PartnerApplications from '../modules/partner/leads/PartnerApplications';
import PartnerWallet from '../modules/partner/wallet/PartnerWallet';
import PartnerProfile from '../modules/partner/profile/PartnerProfile';
import PartnerProducts from '../modules/partner/products/PartnerProducts';
import SettingsPage from '../modules/partner/dashboard/SettingsPage';
import TravelUtilitiesPage from '../modules/partner/products/TravelUtilitiesPage';
import PartnerTeam from '../modules/partner/dashboard/PartnerTeam';
import PartnerKyc from '../modules/partner/kyc/PartnerKyc';
import PartnerCrm from '../modules/partner/leads/PartnerCrm';
import PartnerSupport from '../modules/partner/dashboard/PartnerSupport';
import PartnerVault from '../modules/partner/profile/PartnerVault';
import PartnerMarketing from '../modules/partner/dashboard/PartnerMarketing';
import PartnerTraining from '../modules/partner/dashboard/PartnerTraining';

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
        background: '#ffffff',
        color: '#0f172a',
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
          color: '#334155',
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
        <Route path="credit-center" element={<PartnerProducts />} />
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
        <Route path="travel" element={<TravelUtilitiesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
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
