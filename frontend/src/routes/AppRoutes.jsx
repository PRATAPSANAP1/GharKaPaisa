import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { useAuthStore } from '../app/store/authStore';
import logo from '../assets/logos/logo.png';

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
// AppRoutes Configuration
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
import ManageProductLinks from '../modules/super-admin/cms/ManageProductLinks';
import ManageBanks from '../modules/super-admin/cms/ManageBanks';
import ManageSections from '../modules/super-admin/cms/ManageSections';
import ManageServices from '../modules/super-admin/system/ManageServices';
import ManageDirectLeads from '../modules/super-admin/crm/ManageDirectLeads';
import ManageCommissions from '../modules/super-admin/settings/ManageCommissions';
import ManageCommissionRules from '../modules/super-admin/settings/ManageCommissionRules';
import ManageWallet from '../modules/super-admin/wallet/ManageWallet';
import SuperAdminManageApplications from '../modules/super-admin/crm/ManageApplications';
import NotificationCenter from '../modules/notifications/NotificationCenter';
import ManageAnnouncements from '../modules/super-admin/notifications/ManageAnnouncements';

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
import PartnerReports from '../modules/partner/dashboard/PartnerReports';
import PartnerNotifications from '../modules/partner/dashboard/PartnerNotifications';

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
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f1f5f9',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading GharKaPaisa...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
        <Route path="products" element={<PartnerProducts />} />
        <Route path="applications" element={<PartnerApplications />} />
        <Route path="customers" element={<PartnerCrm />} />
        <Route path="wallet" element={<PartnerWallet />} />
        <Route path="team-network" element={<PartnerTeam />} />
        <Route path="reports" element={<PartnerReports />} />
        <Route path="marketing" element={<PartnerMarketing />} />
        <Route path="training" element={<PartnerTraining />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="support" element={<PartnerSupport />} />
        <Route path="kyc-centre" element={<PartnerKyc />} />
        <Route path="profile" element={<PartnerProfile />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="travel" element={<TravelUtilitiesPage />} />
        <Route path="vault" element={<PartnerVault />} />

        {/* Legacy Support & Aliases */}
        <Route path="marketplace" element={<Navigate to="../products" replace />} />
        <Route path="credit-center" element={<Navigate to="../products" replace />} />
        <Route path="leads" element={<Navigate to="../applications" replace />} />
        <Route path="crm" element={<Navigate to="../customers" replace />} />
        <Route path="referral" element={<Navigate to="../team-network" replace />} />
        <Route path="kyc" element={<Navigate to="../kyc-centre" replace />} />
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
        <Route path="product-links" element={<ManageProductLinks />} />
        <Route path="banks" element={<ManageBanks />} />
        <Route path="sections" element={<ManageSections />} />
        <Route path="services" element={<ManageServices />} />
        <Route path="commissions" element={<ManageCommissions />} />
        <Route path="commission-rules" element={<ManageCommissionRules />} />
        <Route path="wallet" element={<ManageWallet />} />
        <Route path="applications" element={<SuperAdminManageApplications />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="announcements" element={<ManageAnnouncements />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
