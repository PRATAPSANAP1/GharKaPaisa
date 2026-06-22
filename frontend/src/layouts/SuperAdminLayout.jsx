import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../components/Partner/ThemeContext';
import { ThemeToggle } from '../components/Partner/ThemeContext';
import { Icons } from '../components/Partner/PartnerIcons';
import logo from '../logo.png';
import '../components/Navbar.css';

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
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Responsive Layout Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-expand "Modify" if active path is inside it
  useEffect(() => {
    if (location.pathname.startsWith('/superadmin/banners') || location.pathname.startsWith('/superadmin/sections')) {
      setModifyOpen(true);
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
      title: "MODIFY WEBSITE",
      isModifyGroup: true,
      items: [
        { path: '/superadmin/banners', label: 'Banners', icon: <Icons.gift size={16} /> },
        { path: '/superadmin/sections', label: 'CMS', icon: <Icons.profile size={16} /> },
      ]
    },
    {
      title: "SYSTEM UTILITIES",
      items: [
        { path: '/superadmin/services', label: 'Services API', icon: <Icons.clock size={16} /> },
        { path: '/superadmin/commissions', label: 'Commission Manager', icon: <Icons.gift size={16} /> },
        { path: '/superadmin/audit-logs', label: 'Audit Logs', icon: <Icons.clock size={16} /> },
        { path: '/superadmin/reports', label: 'Reports', icon: <Icons.trending size={16} /> }
      ]
    }
  ];

  const renderNavigationList = (onLinkClick) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {categories.map((cat, idx) => {
          if (cat.isModifyGroup) {
            const isChildActive = location.pathname.startsWith('/superadmin/banners') || location.pathname.startsWith('/superadmin/sections');
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
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
                          {item.label}
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
                    {item.label}
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
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Super Admin</h2>
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
        {/* Header - shown on mobile only since we have sidebar for desktop */}
        {isMobile && (
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
              <ThemeToggle />
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
