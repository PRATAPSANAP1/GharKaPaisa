import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../contexts/ThemeContext';
import {
  MdDashboard, MdStorefront, MdCreditCard, MdLeaderboard,
  MdPeople, MdVerifiedUser, MdAccountCircle, MdFolder,
  MdAccountBalanceWallet, MdDeviceHub, MdSchool, MdCampaign,
  MdFlight, MdSupportAgent, MdSettings, MdMenu, MdClose, MdLogout
} from 'react-icons/md';
import logo from '../assets/logos/logo.png';
import ForcePasswordChangeModal from '../modules/partner/profile/ForcePasswordChangeModal';
import '../components/Navbar/Navbar.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Dashboard', icon: MdDashboard },
  { id: 'marketplace', path: '/partner/marketplace', label: 'Marketplace', icon: MdStorefront },
  { id: 'credit-center', path: '/partner/credit-center', label: 'Credit Center', icon: MdCreditCard },
  { id: 'leads', path: '/partner/leads', label: 'Lead Management', icon: MdLeaderboard },
  { id: 'crm', path: '/partner/crm', label: 'Customer CRM', icon: MdPeople },
  { id: 'kyc', path: '/partner/kyc', label: 'KYC Center', icon: MdVerifiedUser },
  { id: 'profile', path: '/partner/profile', label: 'Profile Hub', icon: MdAccountCircle },
  { id: 'vault', path: '/partner/vault', label: 'Document Vault', icon: MdFolder },
  { id: 'wallet', path: '/partner/wallet', label: 'Wallet', icon: MdAccountBalanceWallet },
  { id: 'referral', path: '/partner/referral', label: 'Team Network', icon: MdDeviceHub },
  { id: 'training', path: '/partner/training', label: 'Training Academy', icon: MdSchool },
  { id: 'marketing', path: '/partner/marketing', label: 'Marketing Center', icon: MdCampaign },
  { id: 'travel', path: '/partner/travel', label: 'Travel & Utility', icon: MdFlight },
  { id: 'support', path: '/partner/support', label: 'Support Center', icon: MdSupportAgent },
  { id: 'settings', path: '/partner/settings', label: 'Settings', icon: MdSettings },
];

// Mobile Bottom Nav items (Core)
const MOBILE_BOTTOM_NAV = [
  { id: 'dashboard', path: '/partner/dashboard', label: 'Home', icon: MdDashboard },
  { id: 'marketplace', path: '/partner/marketplace', label: 'Products', icon: MdStorefront },
  { id: 'leads', path: '/partner/leads', label: 'Leads', icon: MdLeaderboard },
  { id: 'wallet', path: '/partner/wallet', label: 'Wallet', icon: MdAccountBalanceWallet },
];

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

  const kycStatus = user?.kyc_status || 'pending';
  const isKycApproved = kycStatus === 'approved';

  // Force user to the KYC page if not approved, unless they are already there or on profile
  const isKycPage = location.pathname.includes('/partner/kyc');
  const isProfilePage = location.pathname.includes('/partner/profile');
  const isSettingsPage = location.pathname.includes('/partner/settings');
  const isBlocked = !isKycApproved && !isKycPage && !isProfilePage && !isSettingsPage;

  useEffect(() => {
    if (!isKycApproved && !isKycPage && !isProfilePage && !isSettingsPage) {
      navigate('/partner/kyc');
    }
  }, [isKycApproved, isKycPage, isProfilePage, isSettingsPage, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ── Color Constants ─────────────────────────────────
  const BRAND = '#0D5CAB';
  const BRAND_DARK = '#083E7A';
  const SIDEBAR_TEXT = '#64748B';
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
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              const isDisabled = !isKycApproved && item.id !== 'kyc' && item.id !== 'profile' && item.id !== 'settings';

              if (isDisabled) {
                return (
                  <div key={item.id} title="Complete KYC to unlock" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isDark ? '#555' : '#cbd5e1',
                    cursor: 'not-allowed',
                    marginBottom: '4px',
                  }}>
                    <Icon size={20} />
                    {t('partnerLayout.' + item.id.replace(/-/g, ''), item.label)}
                  </div>
                );
              }

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
            {NAV_ITEMS.map((item) => {
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
                <select
                  value={i18n.language}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value);
                    setMobileMenuOpen(false);
                  }}
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

      {/* ──── MAIN CONTENT AREA ──── */}
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
        {/* KYC Mandatory Banner */}
        {!isKycApproved && (
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
                <strong>KYC Action Required:</strong> Your KYC status is currently{' '}
                <span style={{
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: '#78350F',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>{kycStatus}</span>. You must complete verification to access all features.
              </div>
            </div>
            {!isKycPage && (
              <button
                onClick={() => navigate('/partner/kyc')}
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
          {isBlocked ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(30,30,40,0.92)' : 'rgba(248,250,252,0.92)',
              backdropFilter: 'blur(4px)',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#FEF3C7',
                color: '#F59E0B',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}>
                <MdVerifiedUser size={40} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, marginBottom: '12px' }}>Complete Your KYC First</h2>
              <p style={{ color: C.textLight || SIDEBAR_TEXT, maxWidth: '400px', marginBottom: '24px', lineHeight: 1.6 }}>
                As per regulatory guidelines, you must complete your KYC verification before accessing the partner marketplace, lead management, and wallet features.
              </p>
              <button
                onClick={() => navigate('/partner/kyc')}
                style={{
                  background: BRAND,
                  color: '#fff',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  border: 'none',
                  boxShadow: `0 4px 12px ${BRAND}40`,
                  cursor: 'pointer',
                  fontSize: '15px',
                }}
              >
                Proceed to KYC Center
              </button>
            </div>
          ) : (
            <Outlet />
          )}
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
            {MOBILE_BOTTOM_NAV.map((nav) => {
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
