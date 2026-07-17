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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [walletBalance, setWalletBalance] = useState("₹0");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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
    navigate('/login');
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
          {/* Logo */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <img src={logo} alt="Logo" style={{ height: '32px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.primary, margin: 0 }}>{t('partnerLayout.panelTitle', 'Partner Panel')}</h2>
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
                    background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : 'transparent',
                    boxShadow: isActive ? `0 4px 14px ${C.primary}35` : 'none',
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
                      background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                      boxShadow: isActive ? `0 4px 12px ${C.primary}35` : 'none',
                      textDecoration: 'none',
                      marginBottom: '8px',
                    }}
                  >
                    <Icon size={22} style={{ color: isActive ? '#fff' : C.primary }} />
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
                  <Icon size={24} style={{ color: isActive ? C.primary : '#94A3B8' }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isActive ? C.primary : '#94A3B8',
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

// ── RESPONSIVE NAV BAR HEADER COMPONENT ──────────────────────
function PartnerHeader({ C, user, navigate, t, isMobile, sidebarOpen, setSidebarOpen, setMobileMenuOpen, handleLogout, walletBalance, profileDropdownOpen, setProfileDropdownOpen }) {
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
      {/* Left side: Hamburger + Logo */}
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
        <img src={logo} alt="GharKaPaisa Logo" style={{ height: isMobile ? '26px' : '32px', objectFit: 'contain' }} />
      </div>

      {/* Right side: Wallet + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
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
        <div style={{ position: 'relative' }}>
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
            <span style={{ fontSize: '9px', color: C.textLight }}>▼</span>
          </button>

          {profileDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: isMobile ? '40px' : '46px',
              right: 0,
              width: '160px',
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                padding: '6px 10px 8px 10px',
                borderBottom: `1.5px solid ${C.border}`,
                marginBottom: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('partnerLayout.partnerCode', 'Partner Code')}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.primary, wordBreak: 'break-all' }}>
                  {user?.partner_code || user?.Partner_code || "—"}
                </span>
              </div>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/partner/profile');
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: C.text,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                className="dropdown-item-hover"
              >
                👤 Profile Settings
              </button>
              <button
                id="partner-dropdown-logout-btn"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: C.red || '#EF4444',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                className="dropdown-item-hover-danger"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
