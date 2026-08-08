import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import {
  MdDashboard, MdStorefront, MdCreditCard, MdLeaderboard,
  MdPeople, MdVerifiedUser, MdAccountCircle, MdFolder,
  MdAccountBalanceWallet, MdDeviceHub, MdSchool, MdCampaign,
  MdFlight, MdSupportAgent, MdSettings, MdMenu, MdClose, MdLogout,
  MdNotifications, MdBarChart, MdSearch, MdShield, MdExpandMore, MdExpandLess, MdAdd, MdArrowForward,
  MdPerson, MdAssignmentInd, MdGroup, MdAnalytics, MdFileDownload, MdPendingActions, MdCheckCircle, MdCancel, MdReceipt
} from 'react-icons/md';
import logo from '../assets/logos/logo.png';
import ForcePasswordChangeModal from '../modules/partner/profile/ForcePasswordChangeModal';
import api, { getAccessToken } from '../services/api';
import { getApiV1Url } from '../config/api';
import { getMe } from '../services/auth.api';
import '../components/Navbar/Navbar.css';
import PartnerSearchBar from '../modules/partner/dashboard/PartnerSearchBar';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'credit_card', path: '/partner/credit-cards', label: 'Credit Cards', icon: MdCreditCard },
  { id: 'loans', path: '/partner/loans', label: 'Loans', icon: MdAccountBalanceWallet },
  { id: 'insurance', path: '/partner/insurance', label: 'Insurance', icon: MdShield },
  {
    id: 'applications',
    label: 'Applications',
    icon: MdLeaderboard,
    isModule: true,
    subItems: [
      { id: 'app_my', label: 'My Applications', path: '/partner/applications?scope=my', icon: MdLeaderboard },
      { id: 'app_team', label: 'Team Applications', path: '/partner/applications?scope=team', icon: MdGroup, partnerOnly: true },
      { id: 'app_pending', label: 'Pending', path: '/partner/applications?status=under_review', icon: MdPendingActions },
      { id: 'app_approved', label: 'Approved', path: '/partner/applications?status=approved', icon: MdCheckCircle },
      { id: 'app_rejected', label: 'Rejected', path: '/partner/applications?status=rejected', icon: MdCancel },
      { id: 'app_export', label: 'Export Applications', path: '/partner/applications?action=export', icon: MdFileDownload, partnerOnly: true }
    ]
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: MdPeople,
    isModule: true,
    subItems: [
      { id: 'cust_all', label: 'All Customers', path: '/partner/customers?view=all', icon: MdPeople, partnerOnly: true },
      { id: 'cust_my', label: 'My Customers', path: '/partner/customers?view=my', icon: MdPerson },
      { id: 'cust_add', label: 'Add Customer', path: '/partner/customers?action=add', icon: MdAdd },
      { id: 'cust_assign', label: 'Assign Lead', path: '/partner/customers?view=assign', icon: MdAssignmentInd, partnerOnly: true },
      { id: 'cust_team', label: 'View Team Customers', path: '/partner/customers?view=team', icon: MdGroup, partnerOnly: true },
      { id: 'cust_analytics', label: 'Customer Analytics', path: '/partner/customers?view=analytics', icon: MdAnalytics, partnerOnly: true },
      { id: 'cust_export', label: 'Export Customers', path: '/partner/customers?action=export', icon: MdFileDownload, partnerOnly: true }
    ]
  },
  { id: 'team-network', path: '/partner/team', label: 'Manage Team', icon: MdGroup },
  { id: 'reports', path: '/partner/reports', label: 'Reports', icon: MdBarChart, partnerOnly: true },
  { id: 'marketing', path: '/partner/marketing', label: 'Marketing', icon: MdCampaign },
  { id: 'training', path: '/partner/training', label: 'Training', icon: MdSchool }
];

const MOBILE_BOTTOM_NAV = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'credit_card', path: '/partner/credit-cards', label: 'Credit Card', icon: MdCreditCard },
  { id: 'lead', path: '/partner/sell-and-earn', label: 'Add Lead', icon: MdAdd, isCenter: true },
  { id: 'insurance', path: '/partner/insurance', label: 'Insurance', icon: MdShield },
  { id: 'loans', path: '/partner/loans', label: 'Loans', icon: MdAccountBalanceWallet },
];

const BRAND = '#0D5CAB';
const BRAND_DARK = '#083E7A';
const SIDEBAR_TEXT = '#64748B';

export default function PartnerLayout() {
  const { C, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [walletBalance, setWalletBalance] = useState("₹0");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [openModules, setOpenModules] = useState({
    credit_card: false,
    loans: false,
    insurance: false,
    applications: false,
    customers: false,
  });

  useEffect(() => {
    if (location.pathname.startsWith('/partner/credit-cards') || location.search.includes('category=credit_card')) {
      setOpenModules(prev => ({ ...prev, credit_card: true }));
    } else if (location.pathname.startsWith('/partner/loans') || location.search.includes('category=loans') || location.search.includes('category=personal_loan')) {
      setOpenModules(prev => ({ ...prev, loans: true }));
    } else if (location.pathname.startsWith('/partner/insurance') || location.search.includes('category=insurance')) {
      setOpenModules(prev => ({ ...prev, insurance: true }));
    } else if (location.pathname.startsWith('/partner/applications')) {
      setOpenModules(prev => ({ ...prev, applications: true }));
    } else if (location.pathname.startsWith('/partner/customers')) {
      setOpenModules(prev => ({ ...prev, customers: true }));
    }
  }, [location.pathname, location.search]);

  const toggleModule = (id) => {
    setOpenModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      if (res.data?.success) {
        const bal = res.data.data.available_balance || 0;
        setWalletBalance(`₹${parseFloat(bal).toLocaleString("en-IN")}`);
      }
    } catch (e) {
      console.error("Failed to load header wallet", e);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWallet();
    }
  }, [user?.id]);

  // Fetch latest profile on layout mount to sync with backend status changes
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const freshUser = await getMe(true);
        useAuthStore.getState().updateUser(freshUser);
      } catch (err) {
        console.error('Failed to auto-refresh user profile on layout mount:', err);
      }
    };
    refreshProfile();
  }, []);
  const accountStatus = user?.status || 'pending';
  const kycStatus = user?.kyc_status || 'pending';
  const isKycPage = location.pathname === '/partner/kyc-centre';

  // Redirect and route protection logic
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Redirect blocked or suspended partners immediately
    if (accountStatus === 'blocked' || accountStatus === 'suspended') {
      logout();
      navigate('/login');
      return;
    }
    
    // If pending or inactive, allow only specific subpaths:
    if (accountStatus === 'pending' || accountStatus === 'inactive') {
      const allowedPaths = [
        '/partner',
        '/partner/',
        '/partner/dashboard',
        '/partner/kyc-centre',
        '/partner/profile',
        '/partner/training',
        '/partner/notifications',
        '/partner/settings'
      ];
      const isAllowed = allowedPaths.some(p => currentPath === p);
      if (!isAllowed) {
        navigate('/partner/dashboard');
      }
    }
    
    // If rejected, allow the dashboard and core self-service pages without forcing a redirect
    if (accountStatus === 'rejected') {
      const allowedPathsRejected = [
        '/partner',
        '/partner/',
        '/partner/dashboard',
        '/partner/kyc-centre',
        '/partner/profile',
        '/partner/settings',
        '/partner/notifications',
        '/partner/training'
      ];
      const isAllowed = allowedPathsRejected.some(p => currentPath === p);
      if (!isAllowed) {
        navigate('/partner/dashboard');
      }
    }

    // Team members cannot access Admin-level Reports pages
    if (user?.role === 'TEAM_MEMBER') {
      const blockedPaths = ['/partner/reports'];
      if (blockedPaths.some(p => currentPath.startsWith(p))) {
        navigate('/partner/dashboard');
      }
    }
  }, [accountStatus, user?.role, location.pathname, navigate, logout]);

  const isTeamMember = user?.role === 'TEAM_MEMBER';

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (accountStatus === 'pending' || accountStatus === 'inactive' || accountStatus === 'rejected') {
      return ['dashboard', 'training'].includes(item.id);
    }
    if (isTeamMember) {
      return !['reports'].includes(item.id);
    }
    return true;
  });

  const filteredMobileBottomNav = MOBILE_BOTTOM_NAV.filter((nav) => {
    if (accountStatus === 'pending' || accountStatus === 'inactive' || accountStatus === 'rejected') {
      return ['dashboard'].includes(nav.id);
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavItem = (item, isMobileNav = false) => {
    const Icon = item.icon;
    const currentPathAndQuery = location.pathname + location.search;

    if (item.isModule) {
      const isExpanded = !!openModules[item.id];
      const isChildActive = item.subItems.some((sub) =>
        sub.path.includes('?')
          ? currentPathAndQuery === sub.path
          : location.pathname === sub.path
      );

      return (
        <div key={item.id} style={{ marginBottom: '6px' }}>
          <button
            type="button"
            onClick={() => toggleModule(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: isMobileNav ? '15px' : '14px',
              fontWeight: 700,
              color: isChildActive ? C.primary : C.text,
              background: isChildActive
                ? (isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF')
                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
              border: `1px solid ${isChildActive ? C.primary + '40' : 'transparent'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={isMobileNav ? 22 : 20} style={{ color: isChildActive ? C.primary : SIDEBAR_TEXT }} />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <MdExpandLess size={20} style={{ color: SIDEBAR_TEXT }} />
            ) : (
              <MdExpandMore size={20} style={{ color: SIDEBAR_TEXT }} />
            )}
          </button>

          {isExpanded && (
            <div style={{
              paddingLeft: '12px',
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              borderLeft: `2px solid ${isChildActive ? C.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
              marginLeft: '20px',
            }}>
              {item.subItems.filter(sub => !(isTeamMember && sub.partnerOnly)).map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = sub.path.includes('?')
                  ? currentPathAndQuery === sub.path
                  : location.pathname === sub.path;

                return (
                  <NavLink
                    key={sub.id}
                    id={`partner-nav-${sub.id}`}
                    to={sub.path}
                    onClick={() => {
                      if (isMobileNav) setMobileMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isSubActive ? 700 : 600,
                      color: isSubActive ? '#fff' : C.text,
                      background: isSubActive
                        ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`
                        : 'transparent',
                      boxShadow: isSubActive ? `0 3px 10px ${C.primary}35` : 'none',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <SubIcon size={16} style={{ color: isSubActive ? '#fff' : SIDEBAR_TEXT }} />
                    {sub.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = item.path.includes('?')
      ? currentPathAndQuery === item.path
      : location.pathname === item.path || (item.path === '/partner/team' && location.pathname === '/partner/team-network');

    return (
      <NavLink
        key={item.id}
        id={isMobileNav ? `partner-mobile-nav-${item.id}` : `partner-nav-${item.id}`}
        to={item.path}
        onClick={() => {
          if (isMobileNav) setMobileMenuOpen(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '12px',
          fontSize: isMobileNav ? '15px' : '14px',
          fontWeight: 600,
          color: isActive ? '#fff' : C.text,
          background: isActive
            ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`
            : 'transparent',
          boxShadow: isActive ? `0 4px 14px ${C.primary}35` : 'none',
          textDecoration: 'none',
          transition: 'all 0.2s',
          marginBottom: '4px',
        }}
      >
        <Icon size={isMobileNav ? 22 : 20} style={{ color: isActive ? '#fff' : SIDEBAR_TEXT }} />
        {t('partnerLayout.' + item.id.replace(/-/g, ''), item.label)}
      </NavLink>
    );
  };

  // ── Color Constants ─────────────────────────────────
  const SIDEBAR_BG = C.card;
  const MAIN_BG = isDark ? C.bg : '#F7F5FC';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100vh',
      background: MAIN_BG,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: C.text,
      overflow: 'hidden',
    }}>
      <ForcePasswordChangeModal isOpen={user?.must_change_password} />

      {/* ──── DESKTOP SIDEBAR ──── */}
      {!isMobile && sidebarOpen && (
        <aside style={{
          width: '280px',
          background: SIDEBAR_BG,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Logo Banner */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <img src={logo} alt="Logo" style={{ height: '32px' }} />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.primary, margin: 0, lineHeight: 1.2 }}>
                {t('partnerLayout.panelTitle', 'Partner Panel')}
              </h2>
            </div>
          </div>

          {/* Nav Items */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
          }}>
            {filteredNavItems.map((item) => renderNavItem(item, false))}
          </div>

          {/* Sidebar Footer */}
          <div style={{
            padding: '16px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {/* Theme toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{isDark ? '🌙' : '☀️'}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                  {isDark ? t('partnerLayout.dark', 'DARK') : t('partnerLayout.light', 'LIGHT')}
                </span>
              </div>
              <ThemeToggle />
            </div>

            {/* Language Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.text, fontSize: '13px', fontWeight: 700 }}>
                🌐 {t('partnerLayout.language', 'Language')}
              </div>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg || C.card,
                  color: C.text,
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
                <option value="te">తెలుగు</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="ta">தமிழ்</option>
                <option value="bn">বাংলা</option>
                <option value="gu">ગુજરાતી</option>
                <option value="or">ଓଡ଼ିଆ</option>
              </select>
            </div>

            {/* Logout */}
            <button
              id="partner-logout-button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                color: '#EF4444',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <MdLogout size={18} />
              {t('partnerLayout.logout', 'Logout')}
            </button>
          </div>
        </aside>
      )}


      {/* ──── MOBILE FULLSCREEN MENU ──── */}
      {/* ──── MOBILE SIDE DRAWER MENU ──── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(2px)',
              opacity: mobileMenuOpen ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            }}
          />

          {/* Drawer Menu Panel */}
          <div style={{
            position: 'relative',
            width: '70%',
            height: '100%',
            background: C.card,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          }}>
            {/* Menu Header */}
            <div style={{
              height: '56px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              flexShrink: 0,
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.primary, margin: 0 }}>All Modules</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '8px',
                  background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <MdClose size={24} style={{ color: SIDEBAR_TEXT }} />
              </button>
            </div>

            {/* Menu Nav Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {filteredNavItems.map((item) => renderNavItem(item, true))}

              {/* Mobile Footer Controls */}
              <div style={{
                paddingTop: '16px',
                marginTop: '16px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingBottom: '40px',
              }}>
                {/* Theme Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{isDark ? '🌙' : '☀️'}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                      {isDark ? 'DARK' : 'LIGHT'}
                    </span>
                  </div>
                  <ThemeToggle />
                </div>

                {/* Language Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.text, fontSize: '13px', fontWeight: 700 }}>
                    🌐 Language
                  </div>
                  <LanguageSwitcher />
                </div>

                {/* Logout */}
                <button
                  id="partner-mobile-logout-button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                    color: '#EF4444',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <MdLogout size={22} />
                  {t('partnerLayout.logout', 'Sign Out')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: isMobile ? '56px' : 0,
        paddingBottom: isMobile ? '64px' : 0,
        overflowY: 'auto',
        background: MAIN_BG,
        position: 'relative',
      }}>
        <PartnerHeader
          C={C}
          user={user}
          navigate={navigate}
          t={t}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          handleLogout={handleLogout}
          walletBalance={walletBalance}
          profileDropdownOpen={profileDropdownOpen}
          setProfileDropdownOpen={setProfileDropdownOpen}
        />
        {/* Status Banners */}
        {accountStatus === 'inactive' && (
          <div style={{
            background: '#64748B',
            color: '#fff',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdVerifiedUser size={24} />
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                <strong>Account Inactive:</strong> Your account is currently inactive. Some features may be limited.
              </div>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div style={{
            background: '#F59E0B',
            color: '#fff',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdVerifiedUser size={24} />
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                <strong>KYC Verification Pending:</strong> Your KYC verification is pending. Some features will remain disabled until verification is completed.
              </div>
            </div>
            {!isKycPage && (
              <button
                onClick={() => navigate('/partner/kyc-centre')}
                style={{
                  background: '#fff',
                  color: '#D97706',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                Verify Now
              </button>
            )}
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div style={{
            background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
            color: '#fff',
            padding: '14px 20px',
            boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
              <MdVerifiedUser size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                <strong>{t('partnerLayout.kycRejected', 'KYC Rejected:')}</strong>{' '}
                {t('partnerLayout.kycRejectedMsg', 'Your KYC verification was rejected. Please re-upload your documents.')}
                {user?.rejection_reason && (
                  <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '13px' }}>
                    <strong>{t('partnerLayout.reason', 'Reason:')}</strong> {user.rejection_reason}
                  </div>
                )}
              </div>
            </div>
            {!isKycPage && (
              <button
                onClick={() => navigate('/partner/kyc')}
                style={{
                  background: '#fff',
                  color: '#DC2626',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {t('partnerLayout.reuploadKyc', 'Re-upload Documents')}
              </button>
            )}
          </div>
        )}

        <div style={{
          flex: 1,
          padding: isMobile ? '12px 12px 80px 12px' : '24px 32px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          boxSizing: 'border-box',
        }}>


          <Outlet />
        </div>
      </main>

      {/* ──── MOBILE BOTTOM NAVIGATION ──── */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          zIndex: 40,
          padding: '0 4px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '62px',
            position: 'relative',
          }}>
            {filteredMobileBottomNav.map((nav) => {
              const Icon = nav.icon;
              const isActive = location.pathname.startsWith(nav.path) || 
                (nav.isCenter && (location.pathname.startsWith('/partner/applications') || location.pathname.startsWith('/partner/leads')));
              
              if (nav.isCenter) {
                return (
                  <NavLink
                    key={nav.path}
                    id={`partner-bottom-nav-${nav.id}`}
                    to={nav.path}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20%',
                      height: '100%',
                      textDecoration: 'none',
                      position: 'relative',
                      top: '-10px',
                    }}
                  >
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: isActive 
                        ? `linear-gradient(135deg, ${BRAND} 0%, #1D4ED8 100%)` 
                        : `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive 
                        ? '0 6px 16px rgba(13, 92, 171, 0.45)' 
                        : '0 4px 12px rgba(13, 92, 171, 0.3)',
                      border: `3px solid ${C.card}`,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    }}>
                      <Icon size={24} style={{ color: '#FFFFFF' }} />
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: isActive ? C.primary : SIDEBAR_TEXT,
                      marginTop: '2px',
                      letterSpacing: '0.2px',
                    }}>
                      {t('partnerLayout.' + nav.id, nav.label)}
                    </span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={nav.path}
                  id={`partner-bottom-nav-${nav.id}`}
                  to={nav.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20%',
                    height: '100%',
                    gap: '4px',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={22} style={{ 
                    color: isActive ? C.primary : '#94A3B8',
                    transition: 'all 0.2s ease',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? C.primary : '#94A3B8',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}>
                    {t('partnerLayout.' + nav.id, nav.label)}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

// ── RESPONSIVE NAV BAR HEADER COMPONENT ──────────────────────
function PartnerHeader({ C, user, navigate, t, isMobile, sidebarOpen, setSidebarOpen, setMobileMenuOpen, handleLogout, walletBalance, profileDropdownOpen, setProfileDropdownOpen }) {
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen, setProfileDropdownOpen]);

  const profileMenuItems = [
    { id: 'profile', label: 'Profile Hub', path: '/partner/profile', icon: MdAccountCircle },
    { id: 'kyc-centre', label: 'KYC Centre', path: '/partner/kyc-centre', icon: MdVerifiedUser },
    { id: 'wallet', label: 'Wallet', path: '/partner/wallet', icon: MdAccountBalanceWallet },
    { id: 'team-network', label: 'Manage Team', path: '/partner/team', icon: MdGroup },
    { id: 'support', label: 'Support Center', path: '/partner/support', icon: MdSupportAgent },
    { id: 'settings', label: 'Settings', path: '/partner/settings', icon: MdSettings },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: isMobile ? '56px' : '70px',
      background: C.card,
      borderBottom: `1px solid ${C.border}`,
      padding: isMobile ? '0 16px' : '0 24px',
      position: isMobile ? 'fixed' : 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 30,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      flexShrink: 0,
      boxSizing: 'border-box',
      width: '100%'
    }}>
      {/* Left side: Hamburger + Logo (rendered only when mobile or sidebar is collapsed so logo appears only once) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
        <button
          onClick={() => isMobile ? setMobileMenuOpen(true) : setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.text,
            outline: 'none',
            transition: 'background-color 0.2s'
          }}
          className="hover-bg-button"
        >
          <MdMenu size={24} />
        </button>
        {(isMobile || !sidebarOpen) && (
          <img src={logo} alt="GharKaPaisa Logo" style={{ height: isMobile ? '26px' : '32px', objectFit: 'contain' }} />
        )}
      </div>

      {/* Center: Search Bar (desktop only) */}
      {!isMobile && <PartnerSearchBar />}

      {/* Right side: Notifications + Wallet + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
        {/* Notifications Icon */}
        <div
          onClick={() => navigate('/partner/notifications')}
          style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }}
          aria-label="Notifications"
          role="button"
          tabIndex={0}
        >
          <MdNotifications size={isMobile ? 22 : 24} style={{ color: C.text }} />
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              fontSize: '10px',
              color: '#FFFFFF',
              background: '#E03B3B',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}
          >
            3
          </span>
        </div>

        {/* Wallet Balance */}
        <div 
          onClick={() => navigate("/partner/wallet")}
          aria-label={`Wallet balance: ${walletBalance}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate("/partner/wallet");
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: `${C.green}12`,
            border: `1.5px solid ${C.green}30`,
            padding: isMobile ? '4px 10px' : '6px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          className="hover-scale"
        >
          <span style={{ fontSize: isMobile ? '16px' : '18px', color: C.green }}>💳</span>
          <div style={{ display: isMobile ? 'none' : 'block' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('partnerLayout.balance', 'Balance')}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.green }}>{walletBalance}</div>
          </div>
          {isMobile && (
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.green }}>{walletBalance}</span>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-expanded={profileDropdownOpen}
            aria-haspopup="menu"
            aria-label="Profile actions menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '10px',
              padding: '6px',
              borderRadius: '20px',
              outline: 'none',
              transition: 'background-color 0.2s'
            }}
            className="hover-bg-button"
          >
            <div style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: isMobile ? '12px' : '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}>
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{user?.name || t('partnerLayout.partner', 'Partner')}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: SIDEBAR_TEXT }}>{user?.partner_code || user?.Partner_code || "GKP000"}</div>
              </div>
            )}
            <span style={{ fontSize: '9px', color: C.textLight, transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
          </button>

          {profileDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: isMobile ? '44px' : '52px',
              right: 0,
              width: '210px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
              zIndex: 100,
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              boxSizing: 'border-box'
            }}>
              {/* Profile Card Header */}
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                marginBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || t('partnerLayout.partner', 'Partner')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('partnerLayout.partnerCode', 'Code')}:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.primary }}>
                    {user?.partner_code || user?.Partner_code || "—"}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              {profileMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    id={`partner-profile-menu-${item.id}`}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(item.path);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive ? (isDark ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF') : 'transparent',
                      color: isActive ? C.primary : C.text,
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? C.primary : SIDEBAR_TEXT }} />
                    <span>{t('partnerLayout.' + item.id.replace(/-/g, ''), item.label)}</span>
                  </button>
                );
              })}

              <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />

              {/* Logout */}
              <button
                id="partner-dropdown-logout-btn"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <MdLogout size={18} style={{ color: '#EF4444' }} />
                <span>{t('partnerLayout.logout', 'Logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
