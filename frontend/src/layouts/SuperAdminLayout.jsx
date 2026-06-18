import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../components/Partner/ThemeContext';
import { Icons } from '../components/Partner/PartnerIcons';

const SuperAdminLayout = () => {
  const { C } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const navItems = [
    { path: '/superadmin/dashboard', label: 'Admins Directory', icon: <Icons.profile size={18} /> },
    { path: '/superadmin/banks', label: 'Lending Partners', icon: <Icons.wallet size={18} /> },
    { path: '/superadmin/banners', label: 'Manage Banners', icon: <Icons.gift size={18} /> },
    { path: '/superadmin/products', label: 'Manage Products', icon: <Icons.investment size={18} /> },
    { path: '/superadmin/sections', label: 'Homepage CMS', icon: <Icons.profile size={18} /> },
    { path: '/superadmin/services', label: 'Services API Settings', icon: <Icons.clock size={18} /> },
    { path: '/superadmin/reports', label: 'System Reports', icon: <Icons.trending size={18} /> },
    { path: '/superadmin/audit-logs', label: 'Audit Logs', icon: <Icons.clock size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      {/* Sidebar - Desktop */}
      <aside style={{
        width: '260px',
        background: C.sidebar,
        color: C.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${C.border}30`,
        flexShrink: 0,
      }} className="hidden md:flex">
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}20` }}>
          <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', margin: 0 }}>GKP SuperAdmin</h2>
        </div>
        <nav style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.65)',
                background: isActive ? `${C.teal}35` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: isActive ? `1px solid ${C.teal}40` : '1px solid transparent',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}>
          {/* Logo / Header Title for Mobile */}
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: C.text }} className="md:hidden">
            GKP SuperAdmin
          </h2>
          <div className="hidden md:block"></div> {/* Spacer */}

          {/* User Status / Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: `${C.red}10`,
                color: C.red,
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <Icons.logout size={14} /> Log Out
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', boxSizing: 'border-box' }}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          padding: '8px 0',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }} className="md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 700,
                color: isActive ? C.teal : C.textLight,
                textDecoration: 'none',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
