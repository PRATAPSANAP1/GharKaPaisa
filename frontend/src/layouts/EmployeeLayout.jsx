import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FaChartPie, FaCreditCard, FaUserPlus, FaFileAlt, FaUsers, 
  FaGift, FaUserCircle, FaCheckCircle, FaFileContract, FaVideo, 
  FaSignOutAlt, FaMoon, FaSun, FaBars, FaTimes, FaShieldAlt
} from 'react-icons/fa';
import logo from '../assets/logos/logo.png';

export default function EmployeeLayout() {
  const { user, logout } = useAuthStore();
  const { C, theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isManagerOrTL = user?.designation === 'Manager' || user?.designation === 'Team Leader' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/employee/login');
  };

  const navItems = [
    { path: '/employee/dashboard', label: 'Employee Dashboard', icon: <FaChartPie /> },
    { path: '/employee/credit-cards', label: 'Credit Cards & Links', icon: <FaCreditCard /> },
    { path: '/employee/applications', label: 'My Applications', icon: <FaFileAlt /> },
    { path: '/employee/incentives', label: 'My Incentives', icon: <FaGift /> },
    ...(isManagerOrTL ? [{ path: '/employee/team', label: 'My Team Architecture', icon: <FaUsers /> }] : []),
    { path: '/employee/profile', label: 'Employee Profile', icon: <FaUserCircle /> },
    { path: '/employee/kyc', label: 'KYC & Verification', icon: <FaCheckCircle /> },
    { path: '/employee/terms', label: 'Terms & Conditions Video', icon: <FaFileContract /> }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '260px', 
        background: C.card, 
        borderRight: `1px solid ${C.border}`, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 100,
        transition: 'transform 0.3s ease',
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(0)' // Responsive override in CSS if needed
      }}>
        
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="GharKaPaisa" style={{ height: '36px' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: C.teal, letterSpacing: '-0.3px' }}>EMPLOYEE PORTAL</div>
            <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>GharKaPaisa Platform</div>
          </div>
        </div>

        {/* User Card in Sidebar */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>{user?.full_name || user?.name || 'Employee User'}</div>
          <div style={{ fontSize: '11.5px', color: C.teal, fontWeight: 800 }}>ID: {user?.emp_code || user?.employee_id || 'EMP-ACTIVE'}</div>
          <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>{user?.designation || 'Sales Associate'} • {user?.role || 'EMPLOYEE'}</div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: active ? 800 : 600,
                  color: active ? '#fff' : C.textMid,
                  background: active ? C.teal : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, 
              padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}
          >
            {theme === 'dark' ? <FaSun style={{ color: '#F59E0B' }} /> : <FaMoon />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button 
            onClick={handleLogout}
            style={{ 
              background: '#FEE2E2', color: '#991B1B', border: 'none', 
              padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}
          >
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Navbar */}
        <header style={{ 
          height: '64px', background: C.card, borderBottom: `1px solid ${C.border}`, 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Employee Portal Workspace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '4px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800 }}>
              <FaShieldAlt style={{ color: '#10B981' }} /> Role: {user?.role || 'EMPLOYEE'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
              {user?.full_name || user?.name}
            </div>
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}
