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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      {/* Mobile Overlay Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '260px', 
        background: C.card, 
        borderRight: `1px solid ${C.border}`, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 1000,
        transition: 'transform 0.3s ease',
        transform: isMobile 
          ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') 
          : 'translateX(0)',
        boxShadow: isMobile && mobileMenuOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none'
      }}>
        
        {/* Brand Header */}
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="GharKaPaisa" style={{ height: '32px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: C.employeePrimary || '#0F766E', letterSpacing: '-0.3px' }}>EMPLOYEE PORTAL</div>
              <div style={{ fontSize: '10.5px', color: C.textMid, fontWeight: 700 }}>GharKaPaisa Platform</div>
            </div>
          </div>
          {isMobile && (
            <button 
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: C.text, fontSize: '18px', cursor: 'pointer', padding: '4px' }}
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* User Card in Sidebar */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{user?.full_name || user?.name || 'Employee User'}</div>
          <div style={{ fontSize: '11px', color: C.employeePrimary || '#0F766E', fontWeight: 800 }}>ID: {user?.emp_code || user?.employee_id || 'EMP-ACTIVE'}</div>
          <div style={{ fontSize: '10.5px', color: C.textMid, marginTop: '2px' }}>{user?.designation || 'Sales Associate'} • {user?.role || 'EMPLOYEE'}</div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: active ? 800 : 600,
                  color: active ? '#fff' : C.textMid,
                  background: active ? (C.employeePrimary || '#0F766E') : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '14px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, 
              padding: '9px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}
          >
            {theme === 'dark' ? <FaSun style={{ color: '#F59E0B' }} /> : <FaMoon />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button 
            onClick={handleLogout}
            style={{ 
              background: '#FEE2E2', color: '#991B1B', border: 'none', 
              padding: '9px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}
          >
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: isMobile ? '0' : '260px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Navbar */}
        <header style={{ 
          height: '60px', background: C.card, borderBottom: `1px solid ${C.border}`, 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 28px',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: C.bgSecondary,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.text,
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <FaBars />
              </button>
            )}
            <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 800, color: C.employeePrimary || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Employee Workspace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800 }}>
              <FaShieldAlt style={{ color: '#10B981' }} /> {user?.role || 'EMPLOYEE'}
            </div>
            {!isMobile && (
              <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                {user?.full_name || user?.name}
              </div>
            )}
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main style={{ flex: 1, padding: isMobile ? '16px 12px 60px' : '24px' }}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}
