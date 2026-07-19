import React, { useEffect } from 'react';
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
import CustomerUploadPortal from '../modules/customer/CustomerUploadPortal';

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
import AdminProfilePage from '../modules/super-admin/profile/AdminProfilePage';

// Partner Pages
import PartnerDashboard from '../modules/partner/dashboard/PartnerDashboard';
import PartnerCategoryOverview from '../modules/partner/dashboard/PartnerCategoryOverview';
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
  const isInitializing = useAuthStore((state) => state.isInitializing);

  React.useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

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

        {/* Dynamic CMS Service Pages */}
        <Route path="/cms/money-transfer" element={<MoneyTransfer />} />
        <Route path="/cms/recharge" element={<Recharge />} />
        <Route path="/cms/electricity" element={<Electricity />} />
        <Route path="/cms/loan-repay" element={<LoanRepay />} />
        <Route path="/cms/fastag" element={<Fastag />} />
        <Route path="/cms/coming-soon" element={<ComingSoon />} />

        {/* Lead Gen Flow */}
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/product/:slug/apply" element={<ApplyForm />} />
        <Route path="/card-benefits/:bankId/:cardId" element={<CardBenefitsPage />} />
      </Route>

      {/* Customer Secure Upload Portal (Standalone Public Route) */}
      <Route path="/customer/upload/:token" element={<CustomerUploadPortal />} />
      <Route path="/customer/application/:token" element={<CustomerUploadPortal />} />

      {/* Partner Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['PARTNER']} />}>
          <Route element={<PartnerLayout />}>
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route path="/partner/credit-cards" element={<PartnerCategoryOverview defaultCategory="credit_card" />} />
            <Route path="/partner/loans" element={<PartnerCategoryOverview defaultCategory="loans" />} />
            <Route path="/partner/insurance" element={<PartnerCategoryOverview defaultCategory="insurance" />} />
            <Route path="/partner/applications" element={<PartnerApplications />} />
            <Route path="/partner/wallet" element={<PartnerWallet />} />
            <Route path="/partner/profile" element={<PartnerProfile />} />
            <Route path="/partner/products" element={<PartnerProducts />} />
            <Route path="/partner/travel-utilities" element={<TravelUtilitiesPage />} />
            <Route path="/partner/kyc" element={<PartnerKyc />} />
            <Route path="/partner/kyc-centre" element={<PartnerKyc />} />
            <Route path="/partner/team" element={<PartnerTeam />} />
            <Route path="/partner/team-network" element={<PartnerTeam />} />
            <Route path="/partner/leads" element={<PartnerCrm />} />
            <Route path="/partner/crm" element={<PartnerCrm />} />
            <Route path="/partner/customers" element={<PartnerCrm />} />
            <Route path="/partner/support" element={<PartnerSupport />} />
            <Route path="/partner/vault" element={<PartnerVault />} />
            <Route path="/partner/marketing" element={<PartnerMarketing />} />
            <Route path="/partner/training" element={<PartnerTraining />} />
            <Route path="/partner/reports" element={<PartnerReports />} />
            <Route path="/partner/notifications" element={<PartnerNotifications />} />
            <Route path="/partner/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/applications" element={<ManageApplications />} />
            <Route path="/admin/partners" element={<ManagePartners />} />
            <Route path="/admin/withdrawals" element={<ManageWithdrawals />} />
            <Route path="/admin/leads" element={<ManageLeads />} />
          </Route>
        </Route>
      </Route>

      {/* Super Admin Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/reports" element={<SuperAdminReports />} />
            <Route path="/super-admin/audit" element={<AuditLogs />} />
            <Route path="/super-admin/banners" element={<ManageBanners />} />
            <Route path="/super-admin/products" element={<ManageProducts />} />
            <Route path="/super-admin/product-links" element={<ManageProductLinks />} />
            <Route path="/super-admin/banks" element={<ManageBanks />} />
            <Route path="/super-admin/sections" element={<ManageSections />} />
            <Route path="/super-admin/services" element={<ManageServices />} />
            <Route path="/super-admin/direct-leads" element={<ManageDirectLeads />} />
            <Route path="/super-admin/commissions" element={<ManageCommissions />} />
            <Route path="/super-admin/commission-rules" element={<ManageCommissionRules />} />
            <Route path="/super-admin/wallet" element={<ManageWallet />} />
            <Route path="/super-admin/crm" element={<SuperAdminManageApplications />} />
            <Route path="/super-admin/notifications" element={<NotificationCenter />} />
            <Route path="/super-admin/announcements" element={<ManageAnnouncements />} />
            <Route path="/super-admin/profile" element={<AdminProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
