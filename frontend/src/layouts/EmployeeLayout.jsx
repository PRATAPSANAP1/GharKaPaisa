import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FaChartPie, FaCreditCard, FaCoins, FaShieldAlt, FaFileAlt, FaUsers, 
  FaGift, FaUserCircle, FaCheckCircle, FaFileContract, 
  FaSignOutAlt, FaMoon, FaSun, FaBars, FaTimes, FaChevronDown
} from 'react-icons/fa';
import logo from '../assets/logos/logo.png';
import Chatbot from '../components/Chatbot/Chatbot';

import EmployeeForcePasswordModal from '../modules/employee/components/EmployeeForcePasswordModal';

export default function EmployeeLayout() {
  const { user, logout } = useAuthStore();
  const { C, theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isManagerOrTL = user?.designation === 'Manager' || user?.designation === 'Team Leader' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const status = (user?.employee_status || user?.status || user?.activation_status || '').toUpperCase();
  const isApproved = status === 'APPROVED' || status === 'ACTIVE';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = isApproved ? [
    { path: '/employee/dashboard', label: 'Employee Dashboard', icon: <FaChartPie /> },
    { path: '/employee/credit-cards', label: 'Credit Cards', icon: <FaCreditCard /> },
    { path: '/employee/loans', label: 'Loans', icon: <FaCoins /> },
    { path: '/employee/insurance', label: 'Insurance', icon: <FaShieldAlt /> },
    { path: '/employee/applications', label: 'My Applications', icon: <FaFileAlt /> },
    { path: '/employee/incentives', label: 'My Incentives', icon: <FaGift /> },
    ...(isManagerOrTL ? [{ path: '/employee/team', label: 'My Team Architecture', icon: <FaUsers /> }] : [])
  ] : [
    { path: '/employee/dashboard', label: 'Employee Dashboard', icon: <FaChartPie /> },
    { path: '/employee/joining-form', label: 'Joining Registration', icon: <FaFileAlt /> },
    { path: '/employee/terms', label: 'Terms & Conditions Video', icon: <FaFileContract /> },
    { path: '/employee/kyc', label: 'KYC & Verification', icon: <FaCheckCircle /> },
    { path: '/employee/profile', label: 'Employee Profile', icon: <FaUserCircle /> }
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
          {(user?.emp_code || user?.employee_id) && (
            <div style={{ fontSize: '11px', color: C.employeePrimary || '#0F766E', fontWeight: 800 }}>ID: {user?.emp_code || user?.employee_id}</div>
          )}
          <div style={{ fontSize: '10.5px', color: C.textMid, marginTop: '2px' }}>{user?.designation || 'Sales Associate'}</div>
          {!isApproved && (
            <div style={{ marginTop: '6px' }}>
              <span style={{ 
                padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
                background: '#FEF3C7',
                color: '#92400E'
              }}>
                ● ONBOARDING PHASE
              </span>
            </div>
          )}
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }} ref={dropdownRef}>

            {/* Top Right Profile Button & Dropdown */}
            <button 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{
                background: C.bgSecondary,
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: C.text,
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: C.employeePrimary || '#0F766E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>
                {(user?.full_name || user?.name || 'E').charAt(0).toUpperCase()}
              </div>
              {!isMobile && <span>{user?.full_name || user?.name}</span>}
              <FaChevronDown style={{ fontSize: '10px', color: C.textMid, transform: profileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '240px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                padding: '8px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{user?.full_name || user?.name}</div>
                  <div style={{ fontSize: '11px', color: C.textMid }}>{user?.email_id || user?.email}</div>
                </div>

                <Link
                  to="/employee/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: C.text,
                    textDecoration: 'none',
                    background: location.pathname === '/employee/profile' ? C.bgSecondary : 'transparent'
                  }}
                >
                  <FaUserCircle style={{ color: C.teal, fontSize: '15px' }} /> Employee Profile
                </Link>

                <Link
                  to="/employee/kyc"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: C.text,
                    textDecoration: 'none',
                    background: location.pathname === '/employee/kyc' ? C.bgSecondary : 'transparent'
                  }}
                >
                  <FaCheckCircle style={{ color: '#10B981', fontSize: '15px' }} /> KYC & Verification
                </Link>

                <Link
                  to="/employee/terms"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: C.text,
                    textDecoration: 'none',
                    background: location.pathname === '/employee/terms' ? C.bgSecondary : 'transparent'
                  }}
                >
                  <FaFileContract style={{ color: '#3B82F6', fontSize: '15px' }} /> Terms & Conditions Video
                </Link>

                <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />

                <button
                  onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#EF4444',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <FaSignOutAlt style={{ fontSize: '14px' }} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main style={{ flex: 1, padding: isMobile ? '16px 12px 60px' : '24px' }}>
          <Outlet />
        </main>
      </div>

      <EmployeeForcePasswordModal isOpen={!!user?.must_change_password} onClose={() => {}} />
      <Chatbot />
    </div>
  );
}
