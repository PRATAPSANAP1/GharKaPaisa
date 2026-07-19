import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme, ThemeToggle } from '../contexts/ThemeContext';
import { Icons } from '../components/Icon/PartnerIcons';
import api, { getAccessToken } from '../services/api';
import { getApiV1Url } from '../config/api';
import logo from '../assets/logos/logo.png';
import '../components/Navbar/Navbar.css';
import { MdNotifications } from 'react-icons/md';

// ── Chevron Component for Collapsible Items ──────────────────────────────────
const Chevron = ({ open, color = "currentColor", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
      display: 'inline-block',
      verticalAlign: 'middle',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SuperAdminLayout = () => {
  const { C, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const fetchPrivacySetting = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data?.success) {
        setPrivacyMode(res.data.data.admin_privacy_mode === "on");
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  const togglePrivacyMode = async () => {
    setLoadingPrivacy(true);
    const newValue = !privacyMode ? "on" : "off";
    try {
      const res = await api.post("/settings", { key: "admin_privacy_mode", value: newValue });
      if (res.data?.success) {
        setPrivacyMode(!privacyMode);
        alert(`Admin Privacy Mode has been turned ${newValue === 'on' ? 'ON' : 'OFF'}.`);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update privacy setting.");
    } finally {
      setLoadingPrivacy(false);
    }
  };

  useEffect(() => {
    fetchPrivacySetting();
  }, []);

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

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const eventSource = new EventSource(`${getApiV1Url()}/notifications/stream?token=${getAccessToken()}`);
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'notification') {
          setNotifications(prev => [message.data, ...prev.slice(0, 4)]);
          setUnreadCount(message.unread_count);
        } else if (message.type === 'announcement') {
          alert(`📢 Announcement: ${message.data.title}\n\n${message.data.description}`);
        }
      } catch (err) {
        console.error('SSE Message parsing failed', err);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user?.id]);

  // Responsive Layout Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-expand groups based on active location
  useEffect(() => {
    if (location.pathname.includes('/banners')) {
      setModifyOpen(true);
    }
    if (location.pathname.includes('/product-links') || location.pathname.includes('/sections')) {
      setCmsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const toggleLink = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.classList.toggle('no-scroll', next);
  };

  useEffect(() => {
    setMenuOpen(false);
    document.body.classList.remove('no-scroll');
  }, [location.pathname]);

  // Navigation Items Structured by Categories (Corrected /super-admin/ paths)
  const categories = [
    {
      title: "USERS & ACCOUNTS",
      items: [
        { path: '/super-admin/dashboard', label: 'Admins', icon: <Icons.profile size={16} /> },
        { path: '/super-admin/partners', label: 'Partners', icon: <Icons.profile size={16} /> },
      ]
    },
    {
      title: "LEAD TRACKING",
      items: [
        { path: '/super-admin/leads', label: 'Leads', icon: <Icons.trending size={16} /> },
        { path: '/super-admin/direct-leads', label: 'Direct Card Leads', icon: <Icons.creditCard size={16} /> },
        { path: '/super-admin/crm', label: 'Applications Tracking', icon: <Icons.trending size={16} /> }
      ]
    },
    {
      title: "PRODUCTS & PARTNERS",
      items: [
        { path: '/super-admin/banks', label: 'Manage Banks', icon: <Icons.wallet size={16} /> },
        { path: '/super-admin/products', label: 'Products', icon: <Icons.investment size={16} /> },
        { path: '/super-admin/product-links', label: 'Product Link Management', icon: <Icons.trending size={16} /> },
      ]
    },
    {
      title: "MODIFY WEBSITE",
      isModifyGroup: true,
      items: [
        { path: '/super-admin/banners', label: 'Banners', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/sections', label: 'Homepage Sections', icon: <Icons.profile size={16} /> },
      ]
    },
    {
      title: "SYSTEM UTILITIES",
      items: [
        { path: '/super-admin/wallet', label: 'Wallet & Settlements', icon: <Icons.wallet size={16} /> },
        { path: '/super-admin/announcements', label: 'Announcements Manager', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/services', label: 'Services API', icon: <Icons.clock size={16} /> },
        { path: '/super-admin/commission-rules', label: 'Commission Rules', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/audit', label: 'Audit Logs', icon: <Icons.clock size={16} /> },
        { path: '/super-admin/reports', label: 'Reports', icon: <Icons.trending size={16} /> }
      ]
    }
  ];

  const renderNavigationList = (onLinkClick) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {categories.map((cat, idx) => {
          if (cat.isModifyGroup) {
            const isChildActive = location.pathname.includes('/banners') || location.pathname.includes('/sections');
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  id="super-admin-modify-group-btn"
                  onClick={() => setModifyOpen(!modifyOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: isChildActive ? `${C.teal}15` : 'transparent',
                    border: 'none',
                    color: isChildActive ? C.teal : C.text,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icons.gift size={16} style={{ color: isChildActive ? C.teal : C.textSecondary }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Modify</span>
                  </div>
                  <Chevron open={modifyOpen} color={isChildActive ? C.teal : C.textSecondary} />
                </button>

                {modifyOpen && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingLeft: '24px',
                    marginTop: '6px',
                    borderLeft: `1.5px solid ${C.border}`,
                    marginLeft: '24px',
                  }}>
                    {cat.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onLinkClick}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: isActive ? C.teal : C.textMid,
                            background: isActive ? `${C.teal}10` : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: C.textLight,
                letterSpacing: '1px',
                padding: '0 16px',
                marginBottom: '4px',
              }}>
                {cat.title}
              </div>
              {cat.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onLinkClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isActive ? '#fff' : C.text,
                      background: isActive ? C.teal : 'transparent',
                      boxShadow: isActive ? `0 4px 12px ${C.teal}40` : 'none',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: isActive ? '#fff' : C.textSecondary }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}

        <div style={{ height: "1px", background: C.border, margin: "12px 0 8px" }} />

        {/* Language Switcher */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '9px', fontWeight: 800, color: C.textLight, letterSpacing: '0.8px' }}>LANGUAGE</label>
          <select 
            value={i18n.language} 
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            style={{
              width: '100%',
              padding: "8px 12px", borderRadius: "10px",
              border: `1.5px solid ${C.border}`, background: C.inputBg,
              color: C.text, fontSize: "12.5px", fontWeight: 700, cursor: "pointer",
              outline: 'none'
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="or">ଓଡ଼ିଆ (Odia)</option>
          </select>
        </div>

        {/* Interface Mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', marginTop: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Interface Mode</span>
          <ThemeToggle />
        </div>

        {/* Private Mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Private Mode</span>
          <button
            onClick={togglePrivacyMode}
            disabled={loadingPrivacy}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: `1.5px solid ${privacyMode ? C.red : C.border}`,
              background: privacyMode ? `${C.red}15` : 'transparent',
              color: privacyMode ? C.red : C.text,
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            {loadingPrivacy ? '...' : privacyMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: C.bg }}>
      
      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile && (
        <aside style={{
          width: '260px',
          height: '100vh',
          background: C.card,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 20
        }}>
          {/* Logo & Header */}
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${C.border}` }}>
            <img src={logo} alt="GharKaPaisa" style={{ height: '32px' }} />
            <div>
              <span style={{ fontSize: '15px', fontWeight: 900, color: C.text, display: 'block', lineHeight: 1.1 }}>
                SUPER ADMIN
              </span>
              <span style={{ fontSize: '11px', color: C.teal, fontWeight: 700 }}>
                Control Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 14px' }}>
            {renderNavigationList()}
          </div>
        </aside>
      )}

      {/* ── MOBILE HEADER & SIDEBAR OVERLAY ── */}
      {isMobile && (
        <>
          <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
            background: C.card, borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', zIndex: 50
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logo} alt="Logo" style={{ height: '28px' }} />
              <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Super Admin</span>
            </div>
            <button onClick={toggleLink} style={{ background: 'none', border: 'none', color: C.text, fontSize: '24px', cursor: 'pointer' }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </header>

          {menuOpen && (
            <div style={{
              position: 'fixed', inset: 0, top: '60px', background: C.card,
              zIndex: 40, padding: '20px', overflowY: 'auto'
            }}>
              {renderNavigationList(() => setMenuOpen(false))}
            </div>
          )}
        </>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', paddingTop: isMobile ? '60px' : 0 }}>
        
        {/* Top Navbar Header */}
        {!isMobile && (
          <header style={{
            height: '64px', background: C.card, borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', flexShrink: 0
          }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: C.text }}>
              Super Admin Panel
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Notification Button */}
              <button 
                onClick={() => navigate("/super-admin/notifications")}
                style={{
                  background: C.bgSecondary, border: `1px solid ${C.border}`,
                  width: '38px', height: '38px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative'
                }}
              >
                <MdNotifications size={20} color={C.text} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: C.red, color: '#fff', fontSize: '9px', fontWeight: 900,
                    width: '16px', height: '16px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Logged User Info dropdown */}
              <div 
                style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  paddingLeft: '12px', 
                  borderLeft: `1px solid ${C.border}`,
                  cursor: 'pointer'
                }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.teal, color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.first_name ? user.first_name[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'block' }}>
                    {user?.first_name || 'Super Admin'}
                  </span>
                  <span style={{ fontSize: '11px', color: C.textLight }}>
                    {user?.email || 'admin@gharkapaisa.com'}
                  </span>
                </div>

                {showProfileDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '160px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '8px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: C.red,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <Icons.logout size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>
        )}

        {/* Page Body */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default SuperAdminLayout;
