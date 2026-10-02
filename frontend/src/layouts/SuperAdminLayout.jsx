import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../app/store/authStore';
import { useTheme, ThemeToggle } from '../contexts/ThemeContext';
import { Icons } from '../components/Icon/PartnerIcons';
import api, { getAccessToken } from '../services/api';
import { getApiV1Url } from '../config/api';
import logo from '../assets/logos/logo.png';
import Chatbot from '../components/Chatbot/Chatbot';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { MdNotifications } from 'react-icons/md';
import { FaWhatsapp, FaComments } from 'react-icons/fa';

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

  // Notifications & Messenger states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messengerUnread, setMessengerUnread] = useState(0);
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
      const [notifRes, msgRes] = await Promise.all([
        api.get("/notifications", { params: { limit: 5 } }).catch(() => null),
        api.get("/messenger/unread-count").catch(() => null)
      ]);
      if (notifRes?.data?.success) {
        setNotifications(notifRes.data.data.notifications || []);
        setUnreadCount(notifRes.data.data.unread_count || 0);
      }
      if (msgRes?.data?.success && typeof msgRes.data?.data?.unread_count === 'number') {
        setMessengerUnread(msgRes.data.data.unread_count);
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

    const handleUnreadUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('messenger:unread_updated', handleUnreadUpdate);
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      eventSource.close();
      window.removeEventListener('messenger:unread_updated', handleUnreadUpdate);
      clearInterval(interval);
    };
  }, [user?.id]);

  // Responsive Layout Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

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
    if (location.pathname.includes('/products')) {
      setProductsOpen(true);
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
      title: "OVERVIEW",
      items: [
        { path: '/super-admin/overview', label: 'Master Overview', icon: <Icons.dashboard size={16} /> },
      ]
    },
    {
      title: "USERS & ACCOUNTS",
      items: [
        { path: '/super-admin/dashboard', label: 'Admins', icon: <Icons.profile size={16} /> },
        { path: '/super-admin/working-hours', label: 'Working Hours', icon: <Icons.clock size={16} /> },
        { path: '/super-admin/partners', label: 'Partners', icon: <Icons.profile size={16} /> },
        { path: '/super-admin/employees', label: 'Employees', icon: <Icons.profile size={16} /> },
        { path: '/super-admin/attendance', label: 'Employee Attendance', icon: <Icons.clock size={16} /> },
        { path: '/super-admin/hr', label: 'HR', icon: <Icons.profile size={16} /> },
      ]
    },
    {
      title: "LEAD & APPLICATIONS",
      items: [
        { path: '/super-admin/direct-leads', label: 'Direct Card Leads', icon: <Icons.creditCard size={16} /> },
        { path: '/super-admin/loan-applications', label: 'Loan Applications', icon: <Icons.wallet size={16} /> },
        { path: '/super-admin/crm', label: 'Applications Tracking', icon: <Icons.trending size={16} /> }
      ]
    },
    {
      title: "PRODUCTS & BANKS",
      items: [
        { path: '/super-admin/banks', label: 'Manage Banks', icon: <Icons.wallet size={16} /> },
        {
          label: 'Products',
          icon: <Icons.investment size={16} />,
          isGroup: true,
          subItems: [
            { path: '/super-admin/products/credit_card', label: 'Credit Cards', icon: <Icons.creditCard size={16} /> },
            { path: '/super-admin/products/loan_on_credit_card', label: 'Loan on Credit Card', icon: <Icons.trending size={16} /> },
            { path: '/super-admin/products/smart_emi', label: 'Credit Card EMI Products', icon: <Icons.trending size={16} /> },
            { path: '/super-admin/products/loans', label: 'Loans', icon: <Icons.trending size={16} /> },
            { path: '/super-admin/products/insurance', label: 'Insurance', icon: <Icons.wallet size={16} /> },
            { path: '/super-admin/product-links', label: 'Product & Employee Links', icon: <Icons.wallet size={16} /> }
          ]
        }
      ]
    },
    {
      title: "FINANCE",
      items: [
        { path: '/super-admin/wallet', label: 'Wallet & Settlements', icon: <Icons.wallet size={16} /> },
        { path: '/super-admin/commissions', label: 'Partner Commissions', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/incentives', label: 'Employee Incentives', icon: <Icons.trending size={16} /> }
      ]
    },
    {
      title: "MODIFY WEBSITE & PROMOTIONS",
      isModifyGroup: true,
      items: [
        { path: '/super-admin/banners', label: 'Banners', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/contests', label: 'Contest Manager', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/sections', label: 'Homepage Sections', icon: <Icons.profile size={16} /> }
      ]
    },
    {
      title: "SYSTEM & REPORTS",
      items: [
        { path: '/super-admin/whatsapp', label: 'WhatsApp Business', icon: <FaWhatsapp size={16} /> },
        { path: '/super-admin/messenger', label: 'Messenger', icon: <Icons.profile size={16} /> },
        { path: '/super-admin/view-messages', label: 'View Messages', icon: <Icons.clock size={16} /> },
        { path: '/super-admin/announcements', label: 'Announcements Manager', icon: <Icons.gift size={16} /> },
        { path: '/super-admin/support', label: 'Support Tickets', icon: <Icons.profile size={16} /> },
        { path: '/super-admin/audit', label: 'Audit Logs', icon: <Icons.clock size={16} /> },
        { path: '/super-admin/reports', label: 'Reports', icon: <Icons.trending size={16} /> }
      ]
    }
  ];

  const renderNavigationList = (onLinkClick) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: isChildActive ? `${C.teal}15` : 'transparent',
                    border: 'none',
                    color: isChildActive ? C.teal : C.text,
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icons.gift size={18} style={{ color: isChildActive ? C.teal : C.textSecondary }} />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>Modify</span>
                  </div>
                  <Chevron open={modifyOpen} color={isChildActive ? C.teal : C.textSecondary} size={14} />
                </button>

                {modifyOpen && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingLeft: '14px',
                    marginTop: '3px',
                    borderLeft: `2px solid ${C.border}`,
                    marginLeft: '14px',
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
                            gap: '8px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '14px',
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
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 800,
                color: C.textLight,
                letterSpacing: '0.8px',
                padding: '6px 10px 2px 10px',
                marginBottom: '0px',
                marginTop: '2px',
              }}>
                {cat.title}
              </div>
              {cat.items.map((item) => {
                if (item.isGroup) {
                  const isChildActive = location.pathname.includes('/super-admin/products');
                  return (
                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column' }}>
                      <button
                        type="button"
                        onClick={() => setProductsOpen(!productsOpen)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: isChildActive ? `${C.teal}15` : 'transparent',
                          border: 'none',
                          color: isChildActive ? C.teal : C.text,
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: isChildActive ? C.teal : C.textSecondary }}>{item.icon}</span>
                          <span style={{ fontSize: '15px', fontWeight: 600 }}>{item.label}</span>
                        </div>
                        <Chevron open={productsOpen} color={isChildActive ? C.teal : C.textSecondary} size={14} />
                      </button>

                      {productsOpen && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          paddingLeft: '14px',
                          marginTop: '3px',
                          borderLeft: `2px solid ${C.border}`,
                          marginLeft: '14px',
                        }}>
                          {item.subItems.map((sub) => {
                            const isSubActive = location.pathname === sub.path;
                            return (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                onClick={onLinkClick}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: isSubActive ? C.teal : C.textMid,
                                  background: isSubActive ? `${C.teal}10` : 'transparent',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {sub.icon}
                                <span>{sub.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

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
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isActive ? '#fff' : C.text,
                      background: isActive ? C.teal : 'transparent',
                      boxShadow: isActive ? `0 2px 8px ${C.teal}40` : 'none',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ color: isActive ? '#fff' : C.textSecondary, fontSize: '18px', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.path === '/super-admin/messenger' && messengerUnread > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        padding: '2px 7px'
                      }}>
                        {messengerUnread > 99 ? '99+' : messengerUnread}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}

        <div style={{ height: "1px", background: C.border, margin: "6px 0" }} />

        {/* Language Switcher */}
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, letterSpacing: '0.8px' }}>LANGUAGE</label>
          <select 
            value={i18n.language} 
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            style={{
              width: '100%',
              padding: "5px 8px", borderRadius: "8px",
              border: `1px solid ${C.border}`, background: C.inputBg,
              color: C.text, fontSize: "14px", fontWeight: 700, cursor: "pointer",
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: C.textMid }}>Interface Mode</span>
          <ThemeToggle />
        </div>

        {/* Private Mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: C.textMid }}>Private Mode</span>
          <button
            onClick={togglePrivacyMode}
            disabled={loadingPrivacy}
            style={{
              padding: '3px 10px',
              borderRadius: '6px',
              border: `1px solid ${privacyMode ? C.red : C.border}`,
              background: privacyMode ? `${C.red}15` : 'transparent',
              color: privacyMode ? C.red : C.text,
              fontSize: '12px',
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

        {/* Sidebar Log Out Button (Visible in Desktop & Mobile Sidebar) */}
        <div style={{ padding: '8px 10px', marginTop: '4px' }}>
          <button
            id="super-admin-sidebar-logout"
            onClick={() => {
              if (onLinkClick) onLinkClick();
              handleLogout();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            <Icons.logout size={18} />
            <span>Log Out</span>
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
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}` }}>
            <img src={logo} alt="GharKaPaisa" style={{ height: '28px' }} />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 900, color: C.text, display: 'block', lineHeight: 1.1 }}>
                SUPER ADMIN
              </span>
              <span style={{ fontSize: '10.5px', color: C.teal, fontWeight: 700 }}>
                Control Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '6px 8px', 
            scrollbarWidth: 'thin', 
            scrollbarColor: `${C.border} transparent`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Messenger Button (Mobile Header) */}
              <button 
                onClick={() => navigate("/super-admin/messenger")}
                title="Messenger"
                style={{
                  background: C.bgSecondary, border: `1px solid ${C.border}`,
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative'
                }}
              >
                <FaComments size={16} color={C.teal} />
                {messengerUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: C.red, color: '#fff', fontSize: '9px', fontWeight: 900,
                    minWidth: '15px', height: '15px', borderRadius: '8px', padding: '0 2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {messengerUnread > 99 ? '99+' : messengerUnread}
                  </span>
                )}
              </button>

              {/* Notification Button (Mobile Header) */}
              <button 
                onClick={() => navigate("/super-admin/notifications")}
                title="Notifications"
                style={{
                  background: C.bgSecondary, border: `1px solid ${C.border}`,
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative'
                }}
              >
                <MdNotifications size={18} color={C.text} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: C.red, color: '#fff', fontSize: '9px', fontWeight: 900,
                    minWidth: '15px', height: '15px', borderRadius: '8px', padding: '0 2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Hamburger Menu Toggle Button */}
              <button onClick={toggleLink} style={{ background: 'none', border: 'none', color: C.text, fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </header>

          {menuOpen && (
            <div style={{
              position: 'fixed', inset: 0, top: '60px', bottom: '60px', background: C.card,
              zIndex: 40, padding: '20px', overflowY: 'auto'
            }}>
              {renderNavigationList(() => setMenuOpen(false))}
            </div>
          )}

          {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
          <nav
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: C.card, borderTop: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              zIndex: 50, boxShadow: '0 -4px 15px rgba(0,0,0,0.08)',
              boxSizing: 'border-box'
            }}
          >
            {/* Home */}
            <NavLink
              to="/super-admin/overview"
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none', color: isActive ? C.teal : C.textSecondary,
                fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1
              })}
            >
              <Icons.dashboard size={18} />
              <span>Home</span>
            </NavLink>

            {/* Applications */}
            <NavLink
              to="/super-admin/crm"
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none', color: isActive ? C.teal : C.textSecondary,
                fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1
              })}
            >
              <Icons.trending size={18} />
              <span>Applications</span>
            </NavLink>

            {/* Message */}
            <NavLink
              to="/super-admin/messenger"
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none', color: isActive ? C.teal : C.textSecondary,
                fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1, position: 'relative'
              })}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FaComments size={18} />
                {messengerUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-8px',
                    background: C.red, color: '#fff', fontSize: '9px', fontWeight: 900,
                    minWidth: '14px', height: '14px', borderRadius: '7px', padding: '0 2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {messengerUnread > 99 ? '99+' : messengerUnread}
                  </span>
                )}
              </div>
              <span>Message</span>
            </NavLink>

            {/* Support */}
            <NavLink
              to="/super-admin/support"
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', textDecoration: 'none', color: isActive ? C.teal : C.textSecondary,
                fontSize: '11px', fontWeight: isActive ? 800 : 600, flex: 1
              })}
            >
              <Icons.profile size={18} />
              <span>Support</span>
            </NavLink>

            {/* More */}
            <button
              type="button"
              onClick={toggleLink}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '3px', background: 'none', border: 'none', cursor: 'pointer',
                color: menuOpen ? C.teal : C.textSecondary, fontSize: '11px', fontWeight: menuOpen ? 800 : 600,
                flex: 1
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 900, lineHeight: 1 }}>☰</div>
              <span>More</span>
            </button>
          </nav>
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
              
              {/* Messenger Button */}
              <button 
                onClick={() => navigate("/super-admin/messenger")}
                title="Messenger"
                style={{
                  background: C.bgSecondary, border: `1px solid ${C.border}`,
                  width: '38px', height: '38px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative'
                }}
              >
                <FaComments size={18} color={C.teal} />
                {messengerUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: C.red, color: '#fff', fontSize: '9px', fontWeight: 900,
                    minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {messengerUnread > 99 ? '99+' : messengerUnread}
                  </span>
                )}
              </button>

              {/* Notification Button */}
              <button 
                onClick={() => navigate("/super-admin/notifications")}
                title="Notifications"
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
                    minWidth: '16px', height: '16px', borderRadius: '8px', padding: '0 3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
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
                    width: '210px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    padding: '8px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <button
                      onClick={() => { setShowProfileDropdown(false); navigate('/super-admin/profile?tab=profile'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 700, color: C.text, background: 'transparent', border: 'none',
                        cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                    >
                      <Icons.profile size={16} style={{ color: C.teal }} />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => { setShowProfileDropdown(false); navigate('/super-admin/profile?tab=account'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 700, color: C.text, background: 'transparent', border: 'none',
                        cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                    >
                      <Icons.wallet size={16} style={{ color: '#3B82F6' }} />
                      <span>Account & Razorpay</span>
                    </button>

                    <button
                      onClick={() => { setShowProfileDropdown(false); navigate('/super-admin/profile?tab=settings'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 700, color: C.text, background: 'transparent', border: 'none',
                        cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                    >
                      <Icons.settings size={16} style={{ color: '#F59E0B' }} />
                      <span>System Settings</span>
                    </button>

                    <button
                      onClick={() => { setShowProfileDropdown(false); navigate('/super-admin/profile?tab=security'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 700, color: C.text, background: 'transparent', border: 'none',
                        cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                    >
                      <Icons.clock size={16} style={{ color: '#8B5CF6' }} />
                      <span>Security & Password</span>
                    </button>

                    <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />

                    <button
                      onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 700, color: C.red, background: `${C.red}10`, border: 'none',
                        cursor: 'pointer', width: '100%', textAlign: 'left'
                      }}
                    >
                      <Icons.logout size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>
        )}

        {/* Page Body */}
        {(() => {
          const isMessenger = location.pathname.includes('/messenger') || location.pathname.includes('/view-messages');
          return (
            <main style={{ 
              flex: 1, 
              overflowY: isMessenger ? 'hidden' : 'auto', 
              padding: isMessenger 
                ? (isMobile ? '0 0 calc(62px + env(safe-area-inset-bottom, 0px)) 0' : 0)
                : (isMobile ? '12px 14px calc(72px + env(safe-area-inset-bottom, 0px)) 12px' : '16px 20px'),
              display: isMessenger ? 'flex' : 'block',
              flexDirection: 'column'
            }}>
              {!isMessenger && <AnnouncementBanner />}
              <Outlet />
            </main>
          );
        })()}
      </div>

      <Chatbot />
    </div>
  );
};

export default SuperAdminLayout;
