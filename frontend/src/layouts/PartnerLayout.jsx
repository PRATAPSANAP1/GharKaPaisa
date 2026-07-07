import React, { useState, useEffect } from 'react';
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
  MdNotifications, MdBarChart, MdSearch
} from 'react-icons/md';
import logo from '../assets/logos/logo.png';
import ForcePasswordChangeModal from '../modules/partner/profile/ForcePasswordChangeModal';
import api, { getAccessToken } from '../services/api';
import { getApiV1Url } from '../config/api';
import { getMe } from '../services/auth.api';
import '../components/Navbar/Navbar.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'products', path: '/partner/products', label: 'Products', icon: MdStorefront },
  { id: 'applications', path: '/partner/applications', label: 'Applications', icon: MdLeaderboard },
  { id: 'customers', path: '/partner/customers', label: 'Customers', icon: MdPeople },
  { id: 'wallet', path: '/partner/wallet', label: 'Wallet', icon: MdAccountBalanceWallet },
  { id: 'team-network', path: '/partner/team-network', label: 'Team Network', icon: MdDeviceHub },
  { id: 'reports', path: '/partner/reports', label: 'Reports', icon: MdBarChart },
  { id: 'marketing', path: '/partner/marketing', label: 'Marketing', icon: MdCampaign },
  { id: 'training', path: '/partner/training', label: 'Training', icon: MdSchool },
  { id: 'notifications', path: '/partner/notifications', label: 'Notifications', icon: MdNotifications },
  { id: 'support', path: '/partner/support', label: 'Support', icon: MdSupportAgent },
  { id: 'kyc-centre', path: '/partner/kyc-centre', label: 'KYC Centre', icon: MdVerifiedUser },
  { id: 'profile', path: '/partner/profile', label: 'Profile', icon: MdAccountCircle },
  { id: 'settings', path: '/partner/settings', label: 'Settings', icon: MdSettings },
];

const MOBILE_BOTTOM_NAV = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Home', icon: MdDashboard },
  { id: 'products', path: '/partner/products', label: 'Products', icon: MdStorefront },
  { id: 'applications', path: '/partner/applications', label: 'Leads', icon: MdLeaderboard },
  { id: 'wallet', path: '/partner/wallet', label: 'Wallet', icon: MdAccountBalanceWallet },
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    
    // If rejected, allow only specific subpaths and redirect to kyc-centre:
    if (accountStatus === 'rejected') {
      const allowedPathsRejected = [
        '/partner/kyc-centre',
        '/partner/profile',
        '/partner/settings',
        '/partner/notifications',
        '/partner/training'
      ];
      const isAllowed = allowedPathsRejected.some(p => currentPath === p);
      if (!isAllowed) {
        navigate('/partner/kyc-centre');
      }
    }
  }, [accountStatus, location.pathname, navigate, logout]);

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (accountStatus === 'pending' || accountStatus === 'inactive' || accountStatus === 'rejected') {
      return ['dashboard', 'kyc-centre', 'training', 'notifications', 'profile', 'settings'].includes(item.id);
    }
    return true; // Approved / Active gets all items
  });

  const filteredMobileBottomNav = MOBILE_BOTTOM_NAV.filter((nav) => {
    if (accountStatus === 'pending' || accountStatus === 'inactive' || accountStatus === 'rejected') {
      return ['dashboard'].includes(nav.id);
    }
    return true;
  });
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Color Constants ─────────────────────────────────
  const SIDEBAR_BG = C.card;
  const MAIN_BG = C.bg;

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
      {!isMobile && (
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
          {/* Logo */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <img src={logo} alt="Logo" style={{ height: '32px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: BRAND, margin: 0 }}>Partner Panel</h2>
          </div>

          {/* Nav Items */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
          }}>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.id}
                  id={`partner-nav-${item.id}`}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isActive ? '#fff' : C.text,
                    background: isActive ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    marginBottom: '4px',
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? '#fff' : SIDEBAR_TEXT }} />
                  {t('partnerLayout.' + item.id.replace(/-/g, ''), item.label)}
                </NavLink>
              );
            })}
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

      {/* ──── MOBILE TOP HEADER ──── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <img src={logo} alt="Logo" style={{ height: '28px' }} />
          <button
            onClick={() => setMobileMenuOpen(true)}
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
            <MdMenu size={24} style={{ color: SIDEBAR_TEXT }} />
          </button>
        </div>
      )}

      {/* ──── MOBILE FULLSCREEN MENU ──── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: C.card,
          zIndex: 50,
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: BRAND, margin: 0 }}>All Modules</h2>
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
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.id}
                  id={`partner-mobile-nav-${item.id}`}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: isActive ? '#fff' : C.text,
                    background: isActive ? BRAND : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                    boxShadow: isActive ? `0 4px 12px ${BRAND}40` : 'none',
                    textDecoration: 'none',
                    marginBottom: '8px',
                  }}
                >
                  <Icon size={22} style={{ color: isActive ? '#fff' : BRAND }} />
                  {t('partnerLayout.' + item.id.replace(/-/g, ''), item.label)}
                </NavLink>
              );
            })}

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
        {!isMobile && (
          <DesktopHeader
            C={C}
            user={user}
            navigate={navigate}
            t={t}
            i18n={i18n}
          />
        )}
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

        <div style={{
          flex: 1,
          padding: isMobile ? '16px' : '24px 32px',
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
          boxShadow: '0 -4px 10px rgba(0,0,0,0.03)',
          zIndex: 40,
          padding: '0 8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '60px',
          }}>
            {filteredMobileBottomNav.map((nav) => {
              const Icon = nav.icon;
              const isActive = location.pathname.startsWith(nav.path);
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
                    width: '100%',
                    height: '100%',
                    gap: '4px',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={24} style={{ color: isActive ? BRAND : '#94A3B8' }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isActive ? BRAND : '#94A3B8',
                  }}>
                    {t('partnerLayout.' + nav.id, nav.label)}
                  </span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              }}>
                <MdMenu size={18} style={{ color: SIDEBAR_TEXT }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: SIDEBAR_TEXT }}>More</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

// ── DESKTOP HEADER COMPONENT ─────────────────────────────────
function DesktopHeader({ C, user, navigate, t, i18n }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], applications: [], customers: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [walletBalance, setWalletBalance] = useState("₹0");

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user?.PartnerId) return;
      try {
        const res = await api.get(`/wallet/${user.PartnerId}`);
        if (res.data?.success) {
          const bal = res.data.data.available_balance || 0;
          setWalletBalance(`₹${parseFloat(bal).toLocaleString("en-IN")}`);
        }
      } catch (e) {
        console.error("Failed to load header wallet", e);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications", { params: { limit: 5 } });
        if (res.data?.success) {
          setNotifications(res.data.data.notifications || []);
          setUnreadCount(res.data.data.unread_count || 0);
        }
      } catch (e) {
        console.error("Failed to load header notifications", e);
      }
    };

    fetchWallet();
    fetchNotifications();

    const eventSource = new EventSource(`${getApiV1Url()}/notifications/stream?token=${getAccessToken()}`);
    
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'notification') {
          setNotifications(prev => [message.data, ...prev.slice(0, 4)]);
          setUnreadCount(message.unread_count);
          if (message.data.category === 'wallet' || message.data.category === 'applications') {
            fetchWallet();
          }
        } else if (message.type === 'announcement') {
          alert(`📢 Announcement: ${message.data.title}\n\n${message.data.description}`);
        }
      } catch (err) {
        console.error('SSE Message parsing failed', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream error, closing', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ products: [], applications: [], customers: [] });
      return;
    }

    const performSearch = async () => {
      try {
        const [prodRes, appRes] = await Promise.all([
          api.get('/products', { params: { is_active: 'true', limit: 50, search: searchQuery } }).catch(() => null),
          api.get('/leads', { params: { limit: 50, search: searchQuery } }).catch(() => null)
        ]);

        const products = prodRes?.data?.success ? prodRes.data.data.slice(0, 3) : [];
        const leads = appRes?.data?.success ? appRes.data.data.slice(0, 5) : [];

        setSearchResults({
          products,
          applications: leads,
          customers: leads.filter((item, index, self) => 
            self.findIndex(t => t.customer_name === item.customer_name) === index
          ).slice(0, 3)
        });
      } catch (e) {
        console.error("Global search failed", e);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '70px',
      background: C.card,
      borderBottom: `1px solid ${C.border}`,
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      flexShrink: 0
    }}>
      {/* Search Input */}
      <div style={{ position: 'relative', width: '380px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: C.bgSecondary, borderRadius: '10px', padding: '0 12px', border: `1.5px solid ${C.border}` }}>
          <MdSearch size={20} style={{ color: SIDEBAR_TEXT }} />
          <input
            type="text"
            placeholder="Search Customer, Application, Product..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '10px 8px',
              fontSize: '13px',
              color: C.text,
              width: '100%',
              fontWeight: 600
            }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, padding: '4px' }}>✕</button>
          )}
        </div>

        {/* Results Overlay */}
        {showSearchDropdown && searchQuery && (
          <div style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 100,
            padding: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: `1px solid ${C.border}50`, paddingBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Search Results</span>
              <button onClick={() => setShowSearchDropdown(false)} style={{ background: 'none', border: 'none', fontSize: '11px', color: C.primary, fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>

            {searchResults.products.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: '4px 0' }}>Products</p>
                {searchResults.products.map(p => (
                  <div key={p.id} onClick={() => { navigate("/partner/products"); setShowSearchDropdown(false); }} style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.15s' }} className="hover-item">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{p.name}</span>
                    <span style={{ fontSize: '10px', background: `${C.primary}12`, color: C.primary, padding: '2px 6px', borderRadius: '4px' }}>{p.bank_code}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.applications.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, color: C.gold, textTransform: 'uppercase', margin: '4px 0' }}>Applications / Leads</p>
                {searchResults.applications.map(a => (
                  <div key={a.id} onClick={() => { navigate("/partner/applications"); setShowSearchDropdown(false); }} style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: '0.15s' }} className="hover-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{a.customer_name}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: a.status === 'approved' ? C.green : C.gold }}>{a.status.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: C.textLight }}>{a.product_name || "Finance Lead"}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.customers.length > 0 && (
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, color: C.green, textTransform: 'uppercase', margin: '4px 0' }}>Customers</p>
                {searchResults.customers.map(c => (
                  <div key={c.id} onClick={() => { navigate("/partner/customers"); setShowSearchDropdown(false); }} style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.15s' }} className="hover-item">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{c.customer_name}</span>
                    <span style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>{c.mobile}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.products.length === 0 && searchResults.applications.length === 0 && (
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '12px', color: C.textLight }}>No matching results found.</div>
            )}
          </div>
        )}
      </div>

      {/* Right Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* Wallet Balance */}
        <div 
          onClick={() => navigate("/partner/wallet")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: `${C.green}12`,
            border: `1.5px solid ${C.green}30`,
            padding: '6px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: '0.15s'
          }}
        >
          <span style={{ fontSize: '14px' }}>💳</span>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.green }}>{walletBalance}</div>
          </div>
        </div>

        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            style={{
              background: C.bgSecondary,
              border: `1.5px solid ${C.border}`,
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              outline: 'none'
            }}
          >
            <MdNotifications size={20} style={{ color: C.text }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: C.red,
                color: '#fff',
                fontSize: '9px',
                fontWeight: 900,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239,68,68,0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationDropdown && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '320px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              zIndex: 100,
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: `1px solid ${C.border}50`, paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.text }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', fontSize: '11px', color: C.primary, fontWeight: 700, cursor: 'pointer' }}>Mark all read</button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '10px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '12px', color: C.textLight }}>No notifications yet.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '8px', borderRadius: '8px', background: n.is_read ? 'transparent' : `${C.primary}08`, borderLeft: n.is_read ? 'none' : `3px solid ${C.primary}` }}>
                      <p style={{ margin: 0, fontSize: '12px', color: C.text, fontWeight: n.is_read ? 500 : 700 }}>{n.title || n.message}</p>
                      <span style={{ fontSize: '9px', color: C.textLight }}>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ borderTop: `1px solid ${C.border}50`, paddingTop: '8px', display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => { navigate("/partner/notifications"); setShowNotificationDropdown(false); }} style={{ background: 'none', border: 'none', fontSize: '12px', color: C.primary, fontWeight: 700, cursor: 'pointer' }}>View All</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: `1px solid ${C.border}`, paddingLeft: '20px' }}>
          <div 
            onClick={() => navigate("/partner/profile")}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{user?.name || "Partner"}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: SIDEBAR_TEXT }}>{user?.PartnerCode || "GKP000"}</div>
          </div>
        </div>

      </div>
    </header>
  );
}
