import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { useAuthStore } from '../app/store/authStore';
import logo from '../assets/logos/logo.webp';
import GkpLoader from '../components/Loader/GkpLoader';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import PartnerLayout from '../layouts/PartnerLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import PublicLayout from '../layouts/PublicLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';

// Public Pages
const Home = lazy(() => import('../modules/home/Home'));
const Contact = lazy(() => import('../modules/home/Contact'));
const GuidesPage = lazy(() => import('../modules/guides/GuidesPage'));
const GuideDetail = lazy(() => import('../modules/guides/GuideDetail'));
const Careers = lazy(() => import('../modules/home/Careers'));
const InterviewRegistration = lazy(() => import('../modules/home/InterviewRegistration'));
const ApplicationStatus = lazy(() => import('../modules/home/ApplicationStatus'));
const HRDashboard = lazy(() => import('../modules/hr/HRDashboard'));
const EmployeeManagement = lazy(() => import('../modules/super-admin/employees/EmployeeManagement'));
const EmployeeLogin = lazy(() => import('../modules/employee/EmployeeLogin'));
const EmployeeDashboard = lazy(() => import('../modules/employee/EmployeeDashboard'));
const EmployeeAttendance = lazy(() => import('../modules/employee/attendance/EmployeeAttendance'));
const JoiningForm = lazy(() => import('../modules/employee/profile/JoiningForm'));
const TermsAcceptance = lazy(() => import('../modules/employee/profile/TermsAcceptance'));
const KYCSubmission = lazy(() => import('../modules/employee/profile/KYCSubmission'));
const EmployeeCreditCards = lazy(() => import('../modules/employee/credit-cards/EmployeeCreditCards'));
const EmployeePersonalLoanOptions = lazy(() => import('../modules/employee/loans/EmployeePersonalLoanOptions'));
const EmployeeLoanOnCreditCard = lazy(() => import('../modules/employee/credit-cards/EmployeeLoanOnCreditCard'));
const EmployeeSmartEmi = lazy(() => import('../modules/employee/credit-cards/EmployeeSmartEmi'));
const EmployeeApplications = lazy(() => import('../modules/employee/applications/EmployeeApplications'));
const MyTeam = lazy(() => import('../modules/employee/team/MyTeam'));
const MyIncentives = lazy(() => import('../modules/employee/incentives/MyIncentives'));
const EmployeeProfile = lazy(() => import('../modules/employee/profile/EmployeeProfile'));
const EmployeeSettingsPortal = lazy(() => import('../modules/employee/settings/EmployeeSettingsPortal'));
const EmployeeSalesReports = lazy(() => import('../modules/employee/reports/EmployeeSalesReports'));
const EmployeeVerification = lazy(() => import('../modules/employee/profile/EmployeeVerification'));
const EmployeeContests = lazy(() => import('../modules/employee/contests/EmployeeContests'));
const ManageContests = lazy(() => import('../modules/super-admin/contests/ManageContests'));
const PartnerLogin = lazy(() => import('../modules/authentication/login/PartnerLogin'));
const PartnerRegister = lazy(() => import('../modules/authentication/register/PartnerRegister'));
const VerifyEmail = lazy(() => import('../modules/authentication/register/VerifyEmail'));
const ResetPassword = lazy(() => import('../modules/authentication/reset-password/ResetPassword'));
const TermsAndConditions = lazy(() => import('../modules/home/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('../modules/home/PrivacyPolicy'));
const ShippingPolicy = lazy(() => import('../modules/home/ShippingPolicy'));
const RefundPolicy = lazy(() => import('../modules/home/RefundPolicy'));
const CustomerUploadPortal = lazy(() => import('../modules/customer/CustomerUploadPortal'));
const PublicCustomerUploadPage = lazy(() => import('../modules/public/PublicCustomerUploadPage'));
const PhysicalApplicationForm = lazy(() => import('../modules/customer/PhysicalApplicationForm'));
const CustomerShareApplyForm = lazy(() => import('../modules/customer/CustomerShareApplyForm'));
const CustomerTrackApplication = lazy(() => import('../modules/customer/CustomerTrackApplication'));
const MessengerView = lazy(() => import('../modules/messenger/MessengerView'));

// Services Pages
const MoneyTransfer = lazy(() => import('../modules/cms/MoneyTransfer'));
const Recharge = lazy(() => import('../modules/cms/Recharge'));
const Electricity = lazy(() => import('../modules/cms/Electricity'));
const LoanRepay = lazy(() => import('../modules/cms/LoanRepay'));
const Fastag = lazy(() => import('../modules/cms/Fastag'));
const ComingSoon = lazy(() => import('../modules/cms/ComingSoon'));

// Product Lead Gen
const ProductDetails = lazy(() => import('../modules/products/ProductDetails'));
const ApplyForm = lazy(() => import('../modules/products/ApplyForm'));
const CardBenefitsPage = lazy(() => import('../modules/products/CardBenefitsPage'));
const ProductApplyLanding = lazy(() => import('../modules/products/ProductApplyLanding'));
const PartnerShareLanding = lazy(() => import('../modules/products/PartnerShareLanding'));
const CustomerApplyStep1 = lazy(() => import('../modules/products/CustomerApplyStep1'));
const CustomerPostApplyStep2 = lazy(() => import('../modules/products/CustomerPostApplyStep2'));
const DynamicCreditCardsPage = lazy(() => import('../modules/home/components/CreditCards/DynamicCreditCardsPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('../modules/admin/dashboard/AdminDashboard'));
const AdminLogin = lazy(() => import('../modules/authentication/login/AdminLogin'));
const ManageApplications = lazy(() => import('../modules/admin/reports/ManageApplications'));
const ManagePartners = lazy(() => import('../modules/admin/users/ManagePartners'));
const ManageWithdrawals = lazy(() => import('../modules/admin/users/ManageWithdrawals'));
const ManageLeads = lazy(() => import('../modules/admin/users/ManageLeads'));
const KycOperatorDashboard = lazy(() => import('../modules/admin/kyc-operator/KycOperatorDashboard'));
const DesignationRulesAudit = lazy(() => import('../modules/admin/rules/DesignationRulesAudit'));

// Super Admin Pages
const SuperAdminOverview = lazy(() => import('../modules/super-admin/dashboard/SuperAdminOverview'));
const SuperAdminDashboard = lazy(() => import('../modules/super-admin/dashboard/SuperAdminDashboard'));
const SuperAdminReports = lazy(() => import('../modules/super-admin/reports/SuperAdminReports'));
const ReferralAnalyticsView = lazy(() => import('../modules/super-admin/reports/ReferralAnalyticsView'));
const AuditLogs = lazy(() => import('../modules/super-admin/audit/AuditLogs'));
const ManageBanners = lazy(() => import('../modules/super-admin/banners/ManageBanners'));
const ManageProducts = lazy(() => import('../modules/super-admin/cms/ManageProducts'));
const ManageProductLinks = lazy(() => import('../modules/super-admin/cms/ManageProductLinks'));
const ManageBanks = lazy(() => import('../modules/super-admin/cms/ManageBanks'));
const ManageSections = lazy(() => import('../modules/super-admin/cms/ManageSections'));
const ManageLinks = lazy(() => import('../modules/super-admin/cms/ManageLinks'));
const ManageServices = lazy(() => import('../modules/super-admin/system/ManageServices'));
const ManageDirectLeads = lazy(() => import('../modules/super-admin/crm/ManageDirectLeads'));
const ManageLoanApplications = lazy(() => import('../modules/super-admin/crm/ManageLoanApplications'));
const ManageCommissions = lazy(() => import('../modules/super-admin/settings/ManageCommissions'));
const SuperAdminCommission = lazy(() => import('../modules/admin/dashboard/SuperAdminCommission'));
const ManageEmployeeIncentives = lazy(() => import('../modules/super-admin/incentives/ManageEmployeeIncentives'));
const ManageCommissionRules = lazy(() => import('../modules/super-admin/settings/ManageCommissionRules'));
const ManageWallet = lazy(() => import('../modules/super-admin/wallet/ManageWallet'));
const SuperAdminManageApplications = lazy(() => import('../modules/super-admin/crm/ManageApplications'));
const NotificationCenter = lazy(() => import('../modules/notifications/NotificationCenter'));
const ManageAnnouncements = lazy(() => import('../modules/super-admin/notifications/ManageAnnouncements'));
const AdminProfilePage = lazy(() => import('../modules/super-admin/profile/AdminProfilePage'));
const AdminWorkingHours = lazy(() => import('../modules/super-admin/working-hours/AdminWorkingHours'));
const SuperAdminViewMessages = lazy(() => import('../modules/super-admin/messenger/SuperAdminViewMessages'));
const SuperAdminWhatsApp = lazy(() => import('../modules/super-admin/whatsapp/SuperAdminWhatsApp'));
const SuperAdminAttendanceDashboard = lazy(() => import('../modules/super-admin/attendance/SuperAdminAttendanceDashboard'));


// Partner Pages
const PartnerDashboard = lazy(() => import('../modules/partner/dashboard/PartnerDashboard'));
const PartnerCategoryOverview = lazy(() => import('../modules/partner/dashboard/PartnerCategoryOverview'));
const PartnerEntityDetail = lazy(() => import('../modules/partner/dashboard/PartnerEntityDetail'));
const PartnerAddLead = lazy(() => import('../modules/partner/leads/PartnerAddLead'));
const PartnerApplications = lazy(() => import('../modules/partner/leads/PartnerApplications'));
const PartnerWallet = lazy(() => import('../modules/partner/wallet/PartnerWallet'));
const PartnerProfile = lazy(() => import('../modules/partner/profile/PartnerProfile'));
const PartnerProducts = lazy(() => import('../modules/partner/products/PartnerProducts'));
const SettingsPage = lazy(() => import('../modules/partner/dashboard/SettingsPage'));
const TravelUtilitiesPage = lazy(() => import('../modules/partner/products/TravelUtilitiesPage'));
const PartnerTeam = lazy(() => import('../modules/partner/dashboard/PartnerTeam'));
const PartnerKyc = lazy(() => import('../modules/partner/kyc/PartnerKyc'));
const PartnerCrm = lazy(() => import('../modules/partner/leads/PartnerCrm'));
const PartnerSupport = lazy(() => import('../modules/partner/dashboard/PartnerSupport'));
const PartnerVault = lazy(() => import('../modules/partner/profile/PartnerVault'));
const PartnerMarketing = lazy(() => import('../modules/partner/dashboard/PartnerMarketing'));
const PartnerTraining = lazy(() => import('../modules/partner/dashboard/PartnerTraining'));
const PartnerReports = lazy(() => import('../modules/partner/dashboard/PartnerReports'));
const PartnerRefers = lazy(() => import('../modules/partner/dashboard/PartnerRefers'));
const PartnerNotifications = lazy(() => import('../modules/partner/dashboard/PartnerNotifications'));
const PartnerShareTracking = lazy(() => import('../modules/partner/leads/PartnerShareTracking'));
const ManageAdminLoans = lazy(() => import('../modules/admin/loans/ManageAdminLoans'));
const ManageAdminInsurance = lazy(() => import('../modules/admin/insurance/ManageAdminInsurance'));
const ManageBankCardApplications = lazy(() => import('../modules/admin/credit-cards/ManageBankCardApplications'));
const ManageAdminProducts = lazy(() => import('../modules/super-admin/cms/ManageAdminProducts'));
const ManageSupportTickets = lazy(() => import('../modules/super-admin/support/ManageSupportTickets'));
const BulkSmsDashboard = lazy(() => import('../modules/super-admin/bulk-sms/BulkSmsDashboard'));

const SmartMessengerRedirect = () => {
  const user = useAuthStore((state) => state.user);
  const role = (user?.role || '').toUpperCase();
  if (role === 'SUPER_ADMIN') return <Navigate to="/super-admin/messenger" replace />;
  if (['PARTNER', 'TEAM_MEMBER'].includes(role)) return <Navigate to="/partner/messenger" replace />;
  if (['EMPLOYEE', 'TELECALLER', 'TEAM_LEADER'].includes(role)) return <Navigate to="/employee/messenger" replace />;
  return <Navigate to="/admin/messenger" replace />;
};

const AppRoutes = () => {
  const isInitializing = useAuthStore((state) => state.isInitializing);

  React.useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

  if (isInitializing) {
    return <GkpLoader />;
  }

  return (
    <Suspense fallback={<GkpLoader />}>
      <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/loans" element={<Home />} />
        <Route path="/insurance" element={<Home />} />
        <Route path="/credit-cards" element={<Home />} />
        <Route path="/cards/:bankSlug" element={<DynamicCreditCardsPage />} />
        <Route path="/credit-cards/lifetime-free-credit-cards-ltf" element={<Home />} />
        <Route path="/credit-cards/:bankSlug" element={<DynamicCreditCardsPage />} />
        <Route path="/credit-cards/:bankIdParam/:typeParam" element={<Home />} />
        <Route path="/money-transfer/fastag" element={<Home />} />
        <Route path="/travel-transit/flight-booking" element={<Home />} />
        <Route path="/attractive-cards-loans" element={<Home />} />
        <Route path="/attractive-cards-loans/:catParam" element={<Home />} />
        <Route path="/travel-transit" element={<Home />} />
        <Route path="/services" element={<Home />} />
        <Route path="/category/:categoryKey" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuideDetail />} />
        <Route path="/login" element={<PartnerLogin />} />
        <Route path="/register" element={<PartnerRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/shipping-and-delivery-policy" element={<ShippingPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/cancellation-and-refund-policy" element={<RefundPolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/career" element={<Careers />} />
        <Route path="/careers/register" element={<InterviewRegistration />} />
        <Route path="/careers/status" element={<ApplicationStatus />} />
        <Route path="/careers/status/:code" element={<ApplicationStatus />} />

        {/* Employee Login Redirect */}
        <Route path="/employee/login" element={<Navigate to="/login" replace />} />

        {/* Dynamic CMS Service Pages */}
        <Route path="/recharge" element={<ComingSoon />} />
        <Route path="/electricity" element={<ComingSoon />} />
        <Route path="/loan-repay" element={<ComingSoon />} />
        <Route path="/fastag" element={<ComingSoon />} />
        <Route path="/money-transfer" element={<ComingSoon />} />
        <Route path="/cms/money-transfer" element={<ComingSoon />} />
        <Route path="/cms/recharge" element={<ComingSoon />} />
        <Route path="/cms/electricity" element={<ComingSoon />} />
        <Route path="/cms/loan-repay" element={<ComingSoon />} />
        <Route path="/cms/fastag" element={<ComingSoon />} />
        <Route path="/cms/coming-soon" element={<ComingSoon />} />

        {/* Lead Gen & Dynamic Product Details Flow */}
        <Route path="/products/:category/:slug/apply" element={<ApplyForm />} />
        <Route path="/products/:slug/apply" element={<ApplyForm />} />
        <Route path="/product/:category/:slug/apply" element={<ApplyForm />} />
        <Route path="/product/:slug/apply" element={<ApplyForm />} />
        <Route path="/products/:category/:slug" element={<ProductDetails />} />
        <Route path="/products/:slug" element={<ProductDetails />} />
        <Route path="/product/:category/:slug" element={<ProductDetails />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/card-benefits/:bankId/:cardId" element={<CardBenefitsPage />} />
        <Route path="/cards/:bankSlug" element={<DynamicCreditCardsPage />} />

        {/* Partner-Shared Product Landing Page (public, captures customer before redirect) */}
        <Route path="/apply/:partnerCode/:productId" element={<ProductApplyLanding />} />
        <Route path="/share/:trackingToken" element={<CustomerApplyStep1 />} />
      </Route>

      {/* Customer Secure Self-Fulfillment & Post-Apply Portals (Standalone Public Routes) */}
      <Route path="/track-application" element={<CustomerTrackApplication />} />
      <Route path="/track" element={<CustomerTrackApplication />} />
      <Route path="/customer/track" element={<CustomerTrackApplication />} />
      <Route path="/physical-application/:token" element={<PhysicalApplicationForm />} />
      <Route path="/apply/:token" element={<CustomerApplyStep1 />} />
      <Route path="/a/:token" element={<CustomerApplyStep1 />} />
      <Route path="/apply/:token/post-apply" element={<CustomerPostApplyStep2 />} />
      <Route path="/customer/upload/:token" element={<CustomerUploadPortal />} />
      <Route path="/customer-upload/:token" element={<PublicCustomerUploadPage />} />
      <Route path="/customer/upload-details/:token" element={<PublicCustomerUploadPage />} />
      <Route path="/customer/application/:token" element={<CustomerUploadPortal />} />

      {/* Smart Messenger Fallback Route */}
      <Route element={<ProtectedRoute />}>
        <Route path="/messenger" element={<SmartMessengerRedirect />} />
      </Route>

      {/* Partner Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['PARTNER', 'TEAM_MEMBER']} />}>
          <Route element={<PartnerLayout />}>
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            
            {/* Category Dashboards */}
            <Route path="/partner/credit-cards" element={<PartnerCategoryOverview defaultCategory="credit_card" />} />
            <Route path="/partner/credit-cards/:bankSlug" element={<PartnerEntityDetail />} />
            <Route path="/partner/credit-cards/:bankSlug/:tab" element={<PartnerEntityDetail />} />

            <Route path="/partner/loan-on-credit-card" element={<EmployeeLoanOnCreditCard />} />
            <Route path="/partner/smart-emi" element={<EmployeeSmartEmi />} />
            <Route path="/partner/smart-emi-on-credit-card" element={<EmployeeSmartEmi />} />

            <Route path="/partner/loans" element={<PartnerCategoryOverview defaultCategory="loans" />} />
            <Route path="/partner/loans/:loanTypeSlug" element={<PartnerEntityDetail />} />
            <Route path="/partner/loans/:loanTypeSlug/product" element={<PartnerEntityDetail />} />

            <Route path="/partner/insurance" element={<PartnerCategoryOverview defaultCategory="insurance" />} />
            <Route path="/partner/insurance/:insuranceTypeSlug" element={<PartnerEntityDetail />} />
            <Route path="/partner/insurance/:insuranceTypeSlug/product" element={<PartnerEntityDetail />} />

            <Route path="/partner/leads/add" element={<PartnerAddLead />} />
            <Route path="/partner/add-lead" element={<PartnerAddLead />} />

            <Route path="/partner/applications" element={<PartnerApplications />} />
            <Route path="/partner/wallet" element={<PartnerWallet />} />
            <Route path="/partner/profile" element={<PartnerProfile />} />
            <Route path="/partner/products" element={<PartnerProducts />} />
            <Route path="/partner/sell-and-earn" element={<PartnerProducts />} />
            <Route path="/partner/travel-utilities" element={<TravelUtilitiesPage />} />
            <Route path="/partner/kyc" element={<PartnerKyc />} />
            <Route path="/partner/kyc-centre" element={<PartnerKyc />} />
            <Route path="/partner/team" element={<PartnerTeam />} />
            <Route path="/partner/team-network" element={<PartnerTeam />} />
            <Route path="/partner/referral" element={<PartnerRefers />} />
            <Route path="/partner/refers" element={<Navigate to="/partner/referral" replace />} />
            <Route path="/partner/leads" element={<PartnerCrm />} />
            <Route path="/partner/crm" element={<PartnerCrm />} />
            <Route path="/partner/customers" element={<PartnerCrm />} />
            <Route path="/partner/share-tracking" element={<PartnerShareTracking />} />
            <Route path="/partner/support" element={<PartnerSupport />} />
            <Route path="/partner/vault" element={<PartnerVault />} />
            <Route path="/partner/documents" element={<PartnerVault />} />
            <Route path="/partner/marketing" element={<PartnerMarketing />} />
            <Route path="/partner/training" element={<PartnerTraining />} />
            <Route path="/partner/reports" element={<PartnerReports />} />
            <Route path="/partner/notifications" element={<PartnerNotifications />} />
            <Route path="/partner/messenger" element={<MessengerView />} />
            <Route path="/partner/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Employee Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['EMPLOYEE', 'HR', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/attendance" element={<EmployeeAttendance />} />
            <Route path="/employee/joining-form" element={<JoiningForm />} />
            <Route path="/employee/terms" element={<TermsAcceptance />} />
            <Route path="/employee/kyc" element={<KYCSubmission />} />
            <Route path="/employee/face-verification" element={<KYCSubmission initialStep={4} />} />
            <Route path="/employee/verification" element={<EmployeeVerification />} />
            <Route path="/employee/verification-status" element={<EmployeeVerification />} />
            <Route path="/employee/credit-cards" element={<EmployeeCreditCards defaultCategory="credit_card" />} />
            <Route path="/employee/credit-cards/:bankSlug" element={<PartnerEntityDetail />} />
            <Route path="/employee/credit-cards/:bankSlug/:tab" element={<PartnerEntityDetail />} />

            <Route path="/employee/loan-on-credit-card" element={<EmployeeLoanOnCreditCard />} />
            <Route path="/employee/smart-emi" element={<EmployeeSmartEmi />} />
            <Route path="/employee/smart-emi-on-credit-card" element={<EmployeeSmartEmi />} />

            <Route path="/employee/loans" element={<EmployeeCreditCards defaultCategory="loans" />} />
            <Route path="/employee/loans/personal-loan" element={<EmployeePersonalLoanOptions />} />
            <Route path="/employee/loans/:loanTypeSlug" element={<PartnerEntityDetail />} />
            <Route path="/employee/loans/:loanTypeSlug/product" element={<PartnerEntityDetail />} />

            <Route path="/employee/insurance" element={<EmployeeCreditCards defaultCategory="insurance" />} />
            <Route path="/employee/insurance/:insuranceTypeSlug" element={<PartnerEntityDetail />} />
            <Route path="/employee/insurance/:insuranceTypeSlug/product" element={<PartnerEntityDetail />} />
            <Route path="/employee/applications" element={<EmployeeApplications />} />
            <Route path="/employee/team" element={<MyTeam />} />
            <Route path="/employee/incentives" element={<MyIncentives />} />
            <Route path="/employee/contests" element={<EmployeeContests />} />
            <Route path="/employee/contests/:id" element={<EmployeeContests />} />
            <Route path="/employee/profile" element={<EmployeeProfile />} />
            <Route path="/employee/messenger" element={<MessengerView />} />
            <Route path="/employee/settings" element={<EmployeeSettingsPortal />} />
            <Route path="/employee/sales-reports" element={<EmployeeSalesReports />} />
          </Route>
        </Route>
      </Route>

      {/* HR Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['HR', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/candidates" element={<HRDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Admin & KYC Operator Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'KYC_OPERATOR']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/kyc-operator" element={<KycOperatorDashboard />} />
            <Route path="/admin/kyc" element={<KycOperatorDashboard />} />
            <Route path="/admin/applications" element={<ManageApplications />} />
            <Route path="/admin/partners" element={<ManagePartners />} />
            <Route path="/admin/withdrawals" element={<ManageWithdrawals />} />
            <Route path="/admin/leads" element={<ManageLeads />} />
            <Route path="/admin/direct-leads" element={<ManageDirectLeads />} />

            {/* Dynamic Bank & Product Management for Admin */}
            <Route path="/admin/banks" element={<ManageBanks />} />
            <Route path="/admin/products/:categorySlug" element={<ManageAdminProducts />} />
            <Route path="/admin/products" element={<ManageAdminProducts />} />
            <Route path="/admin/product-links" element={<ManageProductLinks />} />
            <Route path="/admin/products/links" element={<ManageProductLinks />} />

            {/* Admin Bank-Wise Credit Card Applications */}
            <Route path="/admin/credit-cards/:bankSlug/:tab" element={<ManageBankCardApplications />} />
            <Route path="/admin/credit-cards/:bankSlug" element={<ManageBankCardApplications />} />
            <Route path="/admin/credit-cards" element={<ManageBankCardApplications />} />

            {/* Admin Loans & Insurance Category Extensions */}
            <Route path="/admin/loans/:loanType/:tab" element={<ManageAdminLoans />} />
            <Route path="/admin/loans/:loanType" element={<ManageAdminLoans />} />
            <Route path="/admin/loans" element={<ManageAdminLoans />} />

            <Route path="/admin/insurance/:insuranceType/:tab" element={<ManageAdminInsurance />} />
            <Route path="/admin/insurance/:insuranceType" element={<ManageAdminInsurance />} />
            <Route path="/admin/insurance" element={<ManageAdminInsurance />} />

            {/* Admin Extended Features */}
            <Route path="/admin/commissions" element={<SuperAdminCommission />} />
            <Route path="/admin/reports" element={<SuperAdminReports />} />
            <Route path="/admin/sections" element={<ManageSections />} />
            <Route path="/admin/banners" element={<ManageBanners />} />
            <Route path="/admin/contests" element={<ManageContests />} />
            <Route path="/admin/crm" element={<ManageApplications />} />
            <Route path="/admin/wallet" element={<ManageWallet />} />
            <Route path="/admin/messenger" element={<MessengerView />} />
            <Route path="/admin/whatsapp" element={<SuperAdminWhatsApp />} />
            <Route path="/admin/designation-rules" element={<DesignationRulesAudit />} />
          </Route>
        </Route>
      </Route>

      {/* Super Admin Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<Navigate to="/super-admin/overview" replace />} />
            <Route path="/super-admin/overview" element={<SuperAdminOverview />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/employees" element={<EmployeeManagement />} />
            <Route path="/super-admin/attendance" element={<SuperAdminAttendanceDashboard />} />
            <Route path="/super-admin/hr" element={<HRDashboard />} />
            <Route path="/super-admin/partners" element={<ManagePartners />} />
            <Route path="/super-admin/leads" element={<Navigate to="/super-admin/overview" replace />} />
            <Route path="/super-admin/applications" element={<SuperAdminManageApplications />} />
            <Route path="/super-admin/crm" element={<SuperAdminManageApplications />} />
            <Route path="/super-admin/reports" element={<SuperAdminReports />} />
            <Route path="/super-admin/reports/referral-analytics" element={<ReferralAnalyticsView />} />
            <Route path="/super-admin/audit" element={<AuditLogs />} />
            <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
            <Route path="/super-admin/working-hours" element={<AdminWorkingHours />} />
            <Route path="/super-admin/banners" element={<ManageBanners />} />
            <Route path="/super-admin/contests" element={<ManageContests />} />
            <Route path="/super-admin/products/:categorySlug" element={<ManageAdminProducts />} />
            <Route path="/super-admin/products" element={<ManageAdminProducts />} />
            <Route path="/super-admin/product-links" element={<ManageProductLinks />} />
            <Route path="/super-admin/banks" element={<ManageBanks />} />
            <Route path="/super-admin/sections" element={<ManageSections />} />
            <Route path="/super-admin/links" element={<ManageLinks />} />
            <Route path="/super-admin/services" element={<ManageServices />} />
            <Route path="/super-admin/direct-leads" element={<ManageDirectLeads />} />
            <Route path="/super-admin/loan-applications" element={<ManageLoanApplications />} />
            <Route path="/super-admin/commissions" element={<SuperAdminCommission />} />
            <Route path="/super-admin/incentives" element={<ManageEmployeeIncentives />} />
            <Route path="/super-admin/commission-rules" element={<Navigate to="/super-admin/commissions" replace />} />

            <Route path="/super-admin/wallet" element={<ManageWallet />} />
            <Route path="/super-admin/wallet-settlement" element={<ManageWallet />} />
            <Route path="/super-admin/notifications" element={<NotificationCenter />} />
            <Route path="/super-admin/announcements" element={<ManageAnnouncements />} />
            <Route path="/super-admin/messenger" element={<MessengerView />} />
            <Route path="/super-admin/view-messages" element={<SuperAdminViewMessages />} />
            <Route path="/super-admin/whatsapp" element={<SuperAdminWhatsApp />} />
            <Route path="/super-admin/bulk-sms" element={<BulkSmsDashboard />} />
            <Route path="/super-admin/bulk-sms/campaigns" element={<BulkSmsDashboard defaultTab="campaigns" />} />
            <Route path="/super-admin/bulk-sms/templates" element={<BulkSmsDashboard defaultTab="templates" />} />
            <Route path="/admin/bulk-sms" element={<BulkSmsDashboard />} />
            <Route path="/admin/bulk-sms/campaigns" element={<BulkSmsDashboard defaultTab="campaigns" />} />
            <Route path="/admin/bulk-sms/templates" element={<BulkSmsDashboard defaultTab="templates" />} />
            <Route path="/super-admin/profile" element={<AdminProfilePage />} />
            <Route path="/super-admin/support" element={<ManageSupportTickets />} />

            {/* Legacy /superadmin/ URL Redirect Compatibility */}
            <Route path="/superadmin" element={<Navigate to="/super-admin/overview" replace />} />
            <Route path="/superadmin/overview" element={<Navigate to="/super-admin/overview" replace />} />
            <Route path="/superadmin/dashboard" element={<Navigate to="/super-admin/overview" replace />} />
            <Route path="/superadmin/partners" element={<Navigate to="/super-admin/partners" replace />} />
            <Route path="/superadmin/leads" element={<Navigate to="/super-admin/leads" replace />} />
            <Route path="/superadmin/applications" element={<Navigate to="/super-admin/crm" replace />} />
            <Route path="/superadmin/banks" element={<Navigate to="/super-admin/banks" replace />} />
            <Route path="/superadmin/products" element={<Navigate to="/super-admin/products" replace />} />
            <Route path="/superadmin/product-links" element={<Navigate to="/super-admin/product-links" replace />} />
            <Route path="/superadmin/sections" element={<Navigate to="/super-admin/sections" replace />} />
            <Route path="/superadmin/links" element={<Navigate to="/super-admin/links" replace />} />
            <Route path="/superadmin/banners" element={<Navigate to="/super-admin/banners" replace />} />
            <Route path="/superadmin/incentives" element={<Navigate to="/super-admin/incentives" replace />} />
            <Route path="/superadmin/wallet" element={<Navigate to="/super-admin/wallet" replace />} />
            <Route path="/superadmin/announcements" element={<Navigate to="/super-admin/announcements" replace />} />
            <Route path="/superadmin/services" element={<Navigate to="/super-admin/services" replace />} />
            <Route path="/superadmin/commission-rules" element={<Navigate to="/super-admin/commissions" replace />} />
            <Route path="/superadmin/audit-logs" element={<Navigate to="/super-admin/audit" replace />} />
            <Route path="/superadmin/reports" element={<Navigate to="/super-admin/reports" replace />} />
            <Route path="/superadmin/*" element={<Navigate to="/super-admin/overview" replace />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
