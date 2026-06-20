import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../components/Partner/ThemeContext';
import { ThemeToggle } from '../components/Partner/ThemeContext';
import { Icons } from '../components/Partner/PartnerIcons';
import logo from '../logo.png';
import '../components/Navbar.css';

const SuperAdminLayout = () => {
  const { C } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const navItems = [
    { path: '/superadmin/dashboard', label: 'Admins', icon: <Icons.profile size={16} /> },
    { path: '/superadmin/partners', label: 'Partners', icon: <Icons.profile size={16} /> },
    { path: '/superadmin/leads', label: 'Leads', icon: <Icons.trending size={16} /> },
    { path: '/superadmin/direct-leads', label: 'Direct Card Leads', icon: <Icons.creditCard size={16} /> },
    { path: '/superadmin/banners', label: 'Banners', icon: <Icons.gift size={16} /> },
    { path: '/superadmin/banks', label: 'Lending Partners', icon: <Icons.wallet size={16} /> },
    { path: '/superadmin/products', label: 'Products', icon: <Icons.investment size={16} /> },
    { path: '/superadmin/sections', label: 'CMS', icon: <Icons.profile size={16} /> },
    { path: '/superadmin/services', label: 'Services API', icon: <Icons.clock size={16} /> },
    { path: '/superadmin/commissions', label: 'Commission Manager', icon: <Icons.gift size={16} /> },
    { path: '/superadmin/audit-logs', label: 'Audit Logs', icon: <Icons.clock size={16} /> },
    { path: '/superadmin/reports', label: 'Reports', icon: <Icons.trending size={16} /> }
  ];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      
      {/* Overlay for mobile drawer */}
      <div className={`overlay ${menuOpen ? 'active' : ''}`} onClick={toggleLink} />

      {/* Mobile Side Drawer (Matches Home Navbar Drawer) */}
      <div className={`side-drawer ${menuOpen ? 'show1' : ''}`} style={{ background: C.bg }}>
        <button className="close-btn" onClick={toggleLink} style={{ filter: C.text === '#fff' ? 'invert(1)' : 'none' }}>
          <span></span><span></span><span></span>
        </button>
        
        <div style={{ padding: "20px 0", borderBottom: `1px solid ${C.border}`, marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
          <img src={logo} alt="logo" style={{ height: "30px", width: "auto" }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Super Admin</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={toggleLink}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                color: isActive ? C.text : C.textLight,
                background: isActive ? `${C.teal}15` : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mobile-widgets" style={{ marginTop: "24px", borderTop: `1px solid ${C.border}`, paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.text, fontSize: "14px", fontWeight: 600 }}>Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: `${C.red}10`, color: C.red, border: 'none', borderRadius: '8px',
              padding: '12px 16px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              marginTop: "20px"
            }}
          >
            <Icons.logout size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* Top Navbar (Matches Home Navbar) */}
      <nav className="navbar" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: "12px", flex: "0 0 auto" }}>
          <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={toggleLink} style={{ margin: 0, filter: C.text === '#fff' ? 'invert(1)' : 'none' }}>
            <span></span><span></span><span></span>
          </button>
          <div onClick={() => navigate('/superadmin')} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <img src={logo} alt="logo" className="logo" />
            <h1 style={{ color: C.text, margin: 0, fontSize: "20px", fontWeight: "bold" }}>GKP Admin</h1>
          </div>
        </div>

        {/* Desktop Links Container */}
        <div className="hidden lg:flex" style={{ flex: "1 1 auto", margin: "0 20px", justifyContent: "center", gap: "12px" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                color: isActive ? C.teal : C.text,
                background: isActive ? `${C.teal}15` : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "16px", flex: "0 0 auto", justifyContent: "flex-end" }}>
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', background: `${C.red}10`, color: C.red,
              border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <Icons.logout size={14} /> <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="responsive-main" style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box', background: C.bg }}>
        <Outlet />
      </main>

    </div>
  );
};

export default SuperAdminLayout;
