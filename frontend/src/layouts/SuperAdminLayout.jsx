import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
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

  // Profile Dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

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

  // Privacy Mode settings state
  const [privacyMode, setPrivacyMode] = useState(false);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);

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
      }
    } catch (e) {
      console.error("Failed to update privacy setting:", e);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  useEffect(() => {
    fetchPrivacySetting();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "SA";
  };

  const dropdownItemStyle = {
    background: "none",
    border: "none",
    padding: "10px 16px",
    width: "100%",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 600,
    color: C.text,
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

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

  // Auto-expand "Modify" if active path is inside it
  useEffect(() => {
    if (location.pathname.startsWith('/superadmin/banners')) {
      setModifyOpen(true);
    }
    if (location.pathname.startsWith('/superadmin/product-links') || location.pathname.startsWith('/superadmin/sections')) {
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
    // Close menu when route changes
    setMenuOpen(false);
    document.body.classList.remove('no-scroll');
  }, [location.pathname]);

  // Navigation Items Structured by Categories
  const categories = [
    {
      title: "USERS & ACCOUNTS",
      items: [
        { path: '/superadmin/dashboard', label: 'Admins', icon: <Icons.profile size={16} /> },
        { path: '/superadmin/partners', label: 'Partners', icon: <Icons.profile size={16} /> },
      ]
    },
    {
      title: "LEAD TRACKING",
      items: [
        { path: '/superadmin/leads', label: 'Leads', icon: <Icons.trending size={16} /> },
        { path: '/superadmin/direct-leads', label: 'Direct Card Leads', icon: <Icons.creditCard size={16} /> },
        { path: '/superadmin/applications', label: 'Applications Tracking', icon: <Icons.trending size={16} /> }
      ]
    },
    {
      title: "PRODUCTS & PARTNERS",
      items: [
        { path: '/superadmin/banks', label: 'Lending Partners', icon: <Icons.wallet size={16} /> },
        { path: '/superadmin/products', label: 'Products', icon: <Icons.investment size={16} /> },
      ]
    },
    {
      title: "CMS",
      isCmsGroup: true,
      items: [
        { path: '/superadmin/product-links', label: 'Product Link Management', icon: <Icons.trending size={16} /> },
        { path: '/superadmin/sections', label: 'Homepage Sections', icon: <Icons.profile size={16} /> },
      ]
    },
    {
      title: "MODIFY WEBSITE",
      isModifyGroup: true,
      items: [
        { path: '/superadmin/banners', label: 'Banners', icon: <Icons.gift size={16} /> },
      ]
    },
    {
      title: "SYSTEM UTILITIES",
      items: [
        { path: '/superadmin/wallet', label: 'Wallet & Settlements', icon: <Icons.wallet size={16} /> },
        { path: '/superadmin/announcements', label: 'Announcements Manager', icon: <Icons.gift size={16} /> },
        { path: '/superadmin/services', label: 'Services API', icon: <Icons.clock size={16} /> },
        { path: '/superadmin/commission-rules', label: 'Commission Rules', icon: <Icons.gift size={16} /> },
        { path: '/superadmin/audit-logs', label: 'Audit Logs', icon: <Icons.clock size={16} /> },
        { path: '/superadmin/reports', label: 'Reports', icon: <Icons.trending size={16} /> }
      ]
    }
  ];

  const renderNavigationList = (onLinkClick) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {categories.map((cat, idx) => {
          if (cat.isCmsGroup) {
            const isChildActive = location.pathname.startsWith('/superadmin/product-links') || location.pathname.startsWith('/superadmin/sections');
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  id="super-admin-cms-group-btn"
                  onClick={() => setCmsOpen(!cmsOpen)}
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
                    <Icons.profile size={16} style={{ color: isChildActive ? C.teal : C.textSecondary }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('superAdminLayout.cms', 'CMS')}</span>
                  </div>
                  <Chevron open={cmsOpen} color={isChildActive ? C.teal : C.textSecondary} />
                </button>

                {cmsOpen && (
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
                      const cleanLabel = item.label.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return (
                        <NavLink
                          key={item.path}
                          id={`super-admin-nav-${cleanLabel}`}
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
                          <span>{t('superAdminLayout.' + cleanLabel, item.label)}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (cat.isModifyGroup) {
            const isChildActive = location.pathname.startsWith('/superadmin/banners');
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
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('superAdminLayout.modify', 'Modify')}</span>
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
                      const cleanLabel = item.label.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return (
                        <NavLink
                          key={item.path}
                          id={`super-admin-nav-${cleanLabel}`}
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
                          <span>{t('superAdminLayout.' + cleanLabel, item.label)}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const catKey = 'cat_' + cat.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
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
                {t('superAdminLayout.' + catKey, cat.title)}
              </div>
              {cat.items.map((item) => {
                const isActive = location.pathname === item.path;
                const cleanLabel = item.label.toLowerCase().replace(/[^a-z0-9]/g, '');
                return (
                  <NavLink
                    key={item.path}
                    id={`super-admin-nav-${cleanLabel}`}
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
                    <span>{t('superAdminLayout.' + cleanLabel, item.label)}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100vh',
      background: C.bg,
      overflow: 'hidden'
    }}>
      
      {/* Mobile Drawer Navigation */}
      {isMobile && (
        <>
          <div className={`overlay ${menuOpen ? 'active' : ''}`} onClick={toggleLink} />
          <div className={`side-drawer ${menuOpen ? 'show1' : ''}`} style={{
            background: C.bg,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '24px 20px',
            width: '280px',
          }}>
            <button className="close-btn" onClick={toggleLink} style={{ filter: C.text === '#fff' ? 'invert(1)' : 'none' }}>
              <span></span><span></span><span></span>
            </button>
            
            <div style={{
              padding: "10px 0 20px",
              borderBottom: `1px solid ${C.border}50`,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              justifyContent: "center"
            }}>
              <img src={logo} alt="logo" style={{ height: "30px", width: "auto" }} />
              <h2 id="super-admin-sidebar-title" style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>{t('superAdminLayout.title', 'Super Admin')}</h2>
            </div>

            <nav style={{ flex: 1 }}>
              {renderNavigationList(toggleLink)}
            </nav>

            <div style={{
              marginTop: "24px",
              borderTop: `1px solid ${C.border}50`,
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {/* Theme widget */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "10px",
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{isDark ? "🌙" : "☀️"}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                    {isDark ? "DARK" : "LIGHT"}
                  </span>
                </div>
                <ThemeToggle />
              </div>

              {/* Privacy Mode widget */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "10px",
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>🔒</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                    Privacy Mode
                  </span>
                </div>
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  disabled={loadingPrivacy}
                  style={{
                    background: privacyMode ? C.red : C.teal,
                    color: "#fff",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {loadingPrivacy ? "..." : privacyMode ? "ON" : "OFF"}
                </button>
              </div>

              {/* Language Changer widget */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "10px",
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: C.text, fontSize: "13px", fontWeight: 700 }}>
                  🌐 Language
                </div>
                <LanguageSwitcher />
              </div>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: `${C.red}10`,
                  color: C.red,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Icons.logout size={16} /> Log Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Left Sidebar */}
      {!isMobile && (
        <aside style={{
          width: '280px',
          background: C.card,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Logo Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <img src={logo} alt="logo" style={{ height: "32px", width: "auto" }} />
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.3px' }}>
              GKP Admin
            </h1>
          </div>

          {/* Navigation list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
          }}>
            {renderNavigationList()}
          </div>

          {/* Sidebar Footer (Theme status & logout) */}
          <div style={{
            padding: '16px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {/* Theme status bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderRadius: "10px",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{isDark ? "🌙" : "☀️"}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                  {isDark ? "DARK" : "LIGHT"}
                </span>
              </div>
              <ThemeToggle />
            </div>

            {/* Privacy Mode widget */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderRadius: "10px",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🔒</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                  Privacy Mode
                </span>
              </div>
              <button
                type="button"
                onClick={togglePrivacyMode}
                disabled={loadingPrivacy}
                style={{
                  background: privacyMode ? C.red : C.teal,
                  color: "#fff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {loadingPrivacy ? "..." : privacyMode ? "ON" : "OFF"}
              </button>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: `${C.red}10`,
                color: C.red,
                border: 'none',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.red}20`}
              onMouseLeave={e => e.currentTarget.style.background = `${C.red}10`}
            >
              <Icons.logout size={16} /> Log Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Column */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Header - shown on mobile, persistent on desktop */}
        {isMobile ? (
          <nav className="navbar" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0, padding: '12px 24px' }}>
            <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleLink} style={{ margin: 0, filter: C.text === '#fff' ? 'invert(1)' : 'none' }}>
                <span></span><span></span><span></span>
              </button>
              <div onClick={() => navigate('/superadmin')} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <img src={logo} alt="logo" className="logo" style={{ height: "30px", width: "auto" }} />
                <h1 style={{ color: C.text, margin: 0, fontSize: "18px", fontWeight: "bold" }}>GKP Admin</h1>
              </div>
            </div>
            
            <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: `${C.red}10`,
                  color: C.red,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Icons.logout size={12} /> Log Out
              </button>
            </div>
          </nav>
        ) : (
          <header style={{
            height: "70px",
            background: C.card,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
            boxSizing: "border-box"
          }}>
            {/* Search Input Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "300px", position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search panel..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: C.text,
                  background: C.inputBg,
                  outline: "none",
                  transition: "all 0.2s"
                }}
              />
            </div>

            {/* Actions: Language, Theme, User Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Notification Bell */}
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
                        <button onClick={async () => {
                          try {
                            await api.put("/notifications/read-all");
                            setUnreadCount(0);
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                          } catch (e) { console.error(e); }
                        }} style={{ background: 'none', border: 'none', fontSize: '11px', color: C.primary, fontWeight: 700, cursor: 'pointer' }}>Mark all read</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '10px' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '12px', color: C.textLight }}>No notifications yet.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: n.is_read ? 'transparent' : `${C.primary}08`, padding: '6px 8px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 800, color: C.text }}>{n.title}</div>
                            <div style={{ fontSize: '11px', color: C.textLight }}>{n.message}</div>
                            <span style={{ fontSize: '9px', color: C.textLight, marginTop: '2px' }}>{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <select 
                value={i18n.language} 
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: `1.5px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none"
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

              <div ref={dropdownRef} style={{ position: "relative", borderLeft: `1px solid ${C.border}`, paddingLeft: "20px" }}>
                {/* Profile Clickable Avatar */}
                <div 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: C.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 }}>
                    {getInitials()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: "4px" }}>
                      {user?.full_name || "Super Admin"} <span style={{ fontSize: "10px" }}>▼</span>
                    </span>
                    <span style={{ fontSize: "11px", color: C.textLight }}>System Owner</span>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: "220px",
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    padding: "8px 0",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    {/* Header info */}
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, marginBottom: "4px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: C.text }}>
                        {user?.full_name || "Super Admin"}
                      </div>
                      <div style={{ fontSize: "11px", color: C.textLight, marginTop: "2px" }}>
                        {user?.email || "admin@gharkapaisa.in"}
                      </div>
                    </div>

                    {/* Menu links */}
                    <button 
                      id="super-admin-dropdown-profile"
                      onClick={() => { setShowProfileDropdown(false); navigate("/superadmin/profile?tab=profile"); }}
                      className="profile-dropdown-item"
                      style={dropdownItemStyle}
                    >
                      👤 {t('superAdminLayout.profile', 'Profile')}
                    </button>
                    <button 
                      id="super-admin-dropdown-account"
                      onClick={() => { setShowProfileDropdown(false); navigate("/superadmin/profile?tab=profile"); }}
                      className="profile-dropdown-item"
                      style={dropdownItemStyle}
                    >
                      💼 {t('superAdminLayout.myAccount', 'My Account')}
                    </button>
                    <button 
                      id="super-admin-dropdown-password"
                      onClick={() => { setShowProfileDropdown(false); navigate("/superadmin/profile?tab=security"); }}
                      className="profile-dropdown-item"
                      style={dropdownItemStyle}
                    >
                      🔑 {t('superAdminLayout.changePassword', 'Change Password')}
                    </button>
                    <button 
                      id="super-admin-dropdown-notifications"
                      onClick={() => { setShowProfileDropdown(false); navigate("/superadmin/notifications"); }}
                      className="profile-dropdown-item"
                      style={dropdownItemStyle}
                    >
                      🔔 {t('superAdminLayout.notifications', 'Notifications')}
                    </button>
                    <button 
                      id="super-admin-dropdown-activity"
                      onClick={() => { setShowProfileDropdown(false); navigate("/superadmin/audit-logs"); }}
                      className="profile-dropdown-item"
                      style={dropdownItemStyle}
                    >
                      📋 {t('superAdminLayout.activityLog', 'Activity Log')}
                    </button>
                    <button 
                      id="super-admin-dropdown-settings"
                      onClick={() => { setShowProfileDropdown(false); navigate("/superadmin/settings"); }}
                      className="profile-dropdown-item"
                      style={dropdownItemStyle}
                    >
                      ⚙️ {t('superAdminLayout.settings', 'Settings')}
                    </button>
                    <div style={{ height: "1px", background: C.border, margin: "6px 0" }} />
                    <button 
                      id="super-admin-logout-button"
                      onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                      className="profile-dropdown-item"
                      style={{ ...dropdownItemStyle, color: C.red }}
                    >
                      🚪 {t('superAdminLayout.logout', 'Logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Inner Page Content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px' : '24px',
          background: C.bg,
          boxSizing: 'border-box',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
