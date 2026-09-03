import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/store/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FaChartPie, FaCreditCard, FaCoins, FaShieldAlt, FaFileAlt, FaUsers, 
  FaGift, FaUserCircle, FaCheckCircle, FaFileContract, FaCog,
  FaSignOutAlt, FaMoon, FaSun, FaBars, FaTimes, FaChevronDown,
  FaUserPlus, FaHandshake, FaCopy, FaShareAlt
} from 'react-icons/fa';
import logo from '../assets/logos/logo.png';
import Chatbot from '../components/Chatbot/Chatbot';
import api from '../services/api';

import EmployeeForcePasswordModal from '../modules/employee/components/EmployeeForcePasswordModal';

export default function EmployeeLayout() {
  const { user, logout } = useAuthStore();
  const { C, theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef(null);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState('EMPLOYEE'); // 'EMPLOYEE' or 'PARTNER'
  const [copiedMsg, setCopiedMsg] = useState('');

  const [fetchedPhoto, setFetchedPhoto] = useState(null);

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

  useEffect(() => {
    let isMounted = true;
    const loadProfilePhoto = async () => {
      try {
        const res = await api.get('/employee/profile');
        if (res.data?.success && res.data?.data) {
          const empData = res.data.data;
          const photoUrl = empData.employee?.profile_photo_url || 
                           empData.joining_details?.profile_photo_url || 
                           empData.kyc?.profile_photo_url || 
                           empData.employee?.photo_url || 
                           empData.employee?.avatar_url;
          if (photoUrl && isMounted) {
            setFetchedPhoto(photoUrl);
            localStorage.setItem('employee_profile_photo', photoUrl);
            localStorage.setItem('emp_photo_url', photoUrl);
          }
        }
      } catch (err) {
        // Fallback silently if unauthenticated or error
      }
    };
    loadProfilePhoto();
    return () => { isMounted = false; };
  }, []);

  const isManagerOrTL = user?.designation === 'Manager' || user?.designation === 'Team Leader' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const status = (user?.employee_status || user?.status || user?.activation_status || '').toUpperCase();
  const isApproved = status === 'APPROVED' || status === 'ACTIVE';

  const empCode = user?.employee_id || user?.emp_code || user?.id || '';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gharkapaisa.in';
  const careerInviteLink = `${baseUrl}/careers/register?ref=${encodeURIComponent(empCode)}`;
  const partnerInviteLink = `${baseUrl}/partner/register?ref=${encodeURIComponent(empCode)}`;

  const currentInviteLink = inviteType === 'EMPLOYEE' ? careerInviteLink : partnerInviteLink;

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedMsg('Copied to Clipboard!');
    setTimeout(() => setCopiedMsg(''), 3000);
  };

  const handleShareWhatsApp = (link, roleTitle) => {
    const text = encodeURIComponent(`Join GharKaPaisa as a ${roleTitle}! Register using my official referral code (${empCode}): ${link}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

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
    ...(isManagerOrTL ? [{ path: '/employee/team', label: 'My Team Architecture', icon: <FaUsers /> }] : []),
    { path: '/employee/settings', label: 'Settings & Preferences', icon: <FaCog /> }
  ] : [
    { path: '/employee/dashboard', label: 'Employee Dashboard', icon: <FaChartPie /> },
    { path: '/employee/kyc', label: 'Employee Onboarding & KYC', icon: <FaCheckCircle /> },
    { path: '/employee/profile', label: 'Employee Profile', icon: <FaUserCircle /> },
    { path: '/employee/settings', label: 'Settings & Preferences', icon: <FaCog /> }
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
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside style={{
        width: isMobile ? '260px' : '260px',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        background: C.card,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 999,
        transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* Brand Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/employee/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src={logo} alt="GharKaPaisa" style={{ height: '34px' }} />
            <div>
              <span style={{ fontSize: '15px', fontWeight: 900, color: C.text, display: 'block', lineHeight: 1.1 }}>GharKaPaisa</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.employeePrimary || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Portal</span>
            </div>
          </Link>
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: '18px' }}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: active ? 800 : 600,
                  color: active ? '#ffffff' : C.textMid,
                  background: active ? (C.employeePrimary || '#0F766E') : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 600 }}>Theme Mode</span>
          <button 
            onClick={toggleTheme}
            style={{
              background: C.bgSecondary, border: `1px solid ${C.border}`,
              borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
              color: C.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <FaSun style={{ color: '#F59E0B' }} /> : <FaMoon style={{ color: '#6B7280' }} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Navbar */}
        <header style={{ 
          height: '64px', background: C.card, borderBottom: `1px solid ${C.border}`, 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'none', border: 'none', color: C.text, fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <FaBars />
              </button>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>
              {navItems.find(n => n.path === location.pathname)?.label || 'Employee Workspace'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }} ref={dropdownRef}>

            {/* Top Right Profile Photo Button (Click opens features dropdown) */}
            {(() => {
              const savedPhoto = fetchedPhoto || 
                                 localStorage.getItem('employee_profile_photo') || 
                                 localStorage.getItem('emp_photo_url') || 
                                 user?.profile_photo_url || 
                                 user?.avatar_url || 
                                 user?.profile_photo || 
                                 user?.photo_url;
              const renderAvatar = (size = 36) => {
                if (savedPhoto && !imgError) {
                  return (
                    <img 
                      src={savedPhoto} 
                      alt="Profile" 
                      style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover' }}
                      onError={() => setImgError(true)}
                    />
                  );
                }
                return (
                  <div style={{ 
                    width: `${size}px`, height: `${size}px`, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)', 
                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: `${Math.round(size * 0.42)}px`, fontWeight: 900, textTransform: 'uppercase',
                    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)', flexShrink: 0
                  }}>
                    {(user?.full_name || user?.name || 'E').charAt(0).toUpperCase()}
                  </div>
                );
              };

              return (
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  title="Profile Menu & Account Options"
                  style={{
                    background: C.bgSecondary,
                    border: `2px solid ${profileMenuOpen ? (C.employeePrimary || '#0F766E') : C.border}`,
                    borderRadius: '50%',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: profileMenuOpen ? '0 0 0 3px rgba(15, 118, 110, 0.25)' : 'none'
                  }}
                >
                  {renderAvatar(36)}
                </button>
              );
            })()}

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '270px',
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
                {/* Dropdown Header Card with Employee Profile Photo */}
                <div style={{ padding: '12px', borderBottom: `1px solid ${C.border}`, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {(() => {
                    const savedPhoto = fetchedPhoto || 
                                       localStorage.getItem('employee_profile_photo') || 
                                       localStorage.getItem('emp_photo_url') || 
                                       user?.profile_photo_url || 
                                       user?.avatar_url || 
                                       user?.profile_photo || 
                                       user?.photo_url;
                    if (savedPhoto && !imgError) {
                      return (
                        <img 
                          src={savedPhoto} 
                          alt="Profile" 
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${C.employeePrimary || '#0F766E'}` }}
                          onError={() => setImgError(true)}
                        />
                      );
                    }
                    return (
                      <div style={{ 
                        width: '42px', height: '42px', borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)', 
                        color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '18px', fontWeight: 900, textTransform: 'uppercase',
                        boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)', flexShrink: 0
                      }}>
                        {(user?.full_name || user?.name || 'E').charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || user?.name}</div>
                    <div style={{ fontSize: '11px', color: C.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email_id || user?.email}</div>
                    {empCode && (
                      <div style={{ fontSize: '11px', fontWeight: 800, color: C.employeePrimary || '#0F766E', marginTop: '2px' }}>
                        Ref Code: {empCode}
                      </div>
                    )}
                  </div>
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
                  to="/employee/settings"
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
                    background: location.pathname === '/employee/settings' ? C.bgSecondary : 'transparent'
                  }}
                >
                  <FaCog style={{ color: C.teal, fontSize: '15px' }} /> Settings & Preferences
                </Link>

                {/* Invite Employee Option */}
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setInviteType('EMPLOYEE');
                    setInviteModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: C.text,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <FaUserPlus style={{ color: C.employeePrimary || '#0F766E', fontSize: '15px' }} /> Invite Employee / Candidate
                </button>

                {/* Invite Partner Option */}
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setInviteType('PARTNER');
                    setInviteModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: C.text,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <FaHandshake style={{ color: '#F59E0B', fontSize: '15px' }} /> Invite Partner / DSA
                </button>

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

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
            width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setInviteModalOpen(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px', background: C.bgSecondary,
                border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid
              }}
            >
              <FaTimes />
            </button>

            {/* Type Switcher Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: C.bgSecondary, padding: '4px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <button
                onClick={() => setInviteType('EMPLOYEE')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  background: inviteType === 'EMPLOYEE' ? (C.employeePrimary || '#0F766E') : 'transparent',
                  color: inviteType === 'EMPLOYEE' ? '#ffffff' : C.textMid
                }}
              >
                <FaUserPlus style={{ marginRight: '6px' }} /> Invite Employee
              </button>

              <button
                onClick={() => setInviteType('PARTNER')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  background: inviteType === 'PARTNER' ? '#F59E0B' : 'transparent',
                  color: inviteType === 'PARTNER' ? '#ffffff' : C.textMid
                }}
              >
                <FaHandshake style={{ marginRight: '6px' }} /> Invite Partner
              </button>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>
              {inviteType === 'EMPLOYEE' ? 'Invite Candidate / Employee' : 'Invite Partner / DSA'}
            </h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 20px 0', lineHeight: 1.5 }}>
              {inviteType === 'EMPLOYEE' 
                ? 'Share this link to register new candidate employees. Your referral ID will be tracked automatically upon registration.' 
                : 'Share this link to onboard new financial partners/DSAs under your referral network.'}
            </p>

            {/* Referral Code Badge */}
            <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}30`, padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: C.textMid }}>Your Official Referral ID:</span>
              <strong style={{ fontSize: '15px', fontWeight: 900, color: C.teal }}>{empCode || 'GKP-EMP'}</strong>
            </div>

            {/* Referral Link Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: C.text }}>
                {inviteType === 'EMPLOYEE' ? 'Careers Register Form Link:' : 'Partner Register Form Link:'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={currentInviteLink}
                  style={{
                    flex: 1, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}`,
                    background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 600
                  }}
                />
                <button
                  onClick={() => handleCopyLink(currentInviteLink)}
                  style={{
                    background: C.employeePrimary || '#0F766E', color: '#ffffff', border: 'none',
                    padding: '0 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <FaCopy /> Copy
                </button>
              </div>
              {copiedMsg && (
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
                  ✓ {copiedMsg}
                </div>
              )}
            </div>

            {/* Share Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleShareWhatsApp(currentInviteLink, inviteType === 'EMPLOYEE' ? 'Candidate Employee' : 'Partner')}
                style={{
                  flex: 1, background: '#25D366', color: '#ffffff', border: 'none',
                  padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <FaShareAlt /> Share on WhatsApp
              </button>
              <button
                onClick={() => setInviteModalOpen(false)}
                style={{
                  background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text,
                  padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <EmployeeForcePasswordModal isOpen={!!user?.must_change_password} onClose={() => {}} />
      <Chatbot />
    </div>
  );
}
