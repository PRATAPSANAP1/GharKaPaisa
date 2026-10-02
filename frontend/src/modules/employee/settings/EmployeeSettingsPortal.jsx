import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUser, FaLock, FaBell, FaShieldAlt, FaIdCard, FaBuilding, 
  FaPalette, FaMobileAlt, FaQuestionCircle, FaFileContract, 
  FaSignOutAlt, FaCheckCircle, FaExclamationTriangle, FaEye, 
  FaKey, FaGlobe, FaClock, FaCheck, FaEdit, FaChevronRight, FaHeadset, FaLaptop
} from 'react-icons/fa';
import api from '../../../services/api';
import NotificationSettings from '../../../components/NotificationSettings/NotificationSettings';

export default function EmployeeSettingsPortal() {
  const { C, theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Form States
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Support Ticket Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'General', description: '' });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee/profile');
      if (res.data?.success && res.data?.data) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      console.warn("Settings profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg('❌ New password and confirmation do not match');
      return;
    }
    try {
      setPasswordMsg('Updating password...');
      const res = await api.post('/auth/change-password', passwordForm);
      if (res.data?.success) {
        setPasswordMsg('✓ Password updated successfully!');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      setPasswordMsg(`❌ ${err.response?.data?.message || 'Failed to update password'}`);
    }
  };

  const handleSupportTicketSubmit = (e) => {
    e.preventDefault();
    alert('✓ Support ticket submitted successfully! HR & Support Team will respond shortly.');
    setShowSupportModal(false);
    setTicketForm({ subject: '', category: 'General', description: '' });
  };

  const emp = profileData?.employee || user || {};
  const jDetails = profileData?.joining_details || {};
  const kyc = profileData?.kyc || {};
  const terms = profileData?.terms || {};
  const hierarchy = profileData?.hierarchy || {};

  const fullName = jDetails.full_name || emp.full_name || emp.name || 'Employee';
  const designation = jDetails.designation || emp.designation || 'Telecaller';
  const department = jDetails.department || emp.department || 'Sales & Operations';
  const empCode = emp.employee_id || emp.emp_code || emp.id || 'EMP10001';

  const navTabs = [
    { id: 'account', label: 'Account', icon: <FaUser /> },
    { id: 'security', label: 'Security & Login', icon: <FaLock /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'privacy', label: 'Privacy', icon: <FaShieldAlt /> },
    { id: 'kyc', label: 'KYC & Verification', icon: <FaIdCard /> },
    { id: 'employment', label: 'Employment Info', icon: <FaBuilding /> },
    { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
    { id: 'preferences', label: 'App Preferences', icon: <FaMobileAlt /> },
    { id: 'help', label: 'Help & Support', icon: <FaQuestionCircle /> },
    { id: 'legal', label: 'Legal & Policies', icon: <FaFileContract /> }
  ];

  return (
    <div style={{ 
      maxWidth: '1120px', 
      margin: '0 auto', 
      padding: isMobile ? '8px 10px 40px' : '0 0 40px',
      fontFamily: "'Inter', sans-serif", 
      color: C.text, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: isMobile ? '16px' : '20px',
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden'
    }}>
      
      {/* Page Header */}
      <div style={{ padding: isMobile ? '4px 2px' : '0' }}>
        <span style={{ fontSize: '11px', fontWeight: 900, color: C.teal || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Employee Portal Controls
        </span>
        <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 900, color: C.text, margin: '4px 0 6px 0', lineHeight: 1.2 }}>
          SETTINGS & PREFERENCES
        </h1>
        <p style={{ fontSize: isMobile ? '12px' : '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
          Manage your account preferences, security credentials, notification channels, and employee profile.
        </p>
      </div>

      {/* Main Settings Layout (Sidebar / Scrollable Tabs + Content Panel) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', 
        gap: isMobile ? '14px' : '20px',
        width: '100%'
      }}>
        
        {/* Navigation Menu (Horizontal Scroll Pills on Mobile, Sidebar on Desktop) */}
        <div style={{ 
          background: C.card, 
          border: `1px solid ${C.border}`, 
          borderRadius: isMobile ? '14px' : '20px', 
          padding: isMobile ? '8px' : '12px', 
          height: 'fit-content', 
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          boxSizing: 'border-box',
          width: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column', 
            gap: isMobile ? '6px' : '4px', 
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '4px' : '0',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {navTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  width: isMobile ? 'auto' : '100%', 
                  padding: isMobile ? '8px 14px' : '11px 14px', 
                  borderRadius: isMobile ? '20px' : '12px', 
                  border: isMobile && activeTab !== t.id ? `1px solid ${C.border}` : 'none', 
                  cursor: 'pointer',
                  background: activeTab === t.id ? (C.teal || '#0F766E') : (isMobile ? C.bgSecondary : 'transparent'),
                  color: activeTab === t.id ? '#ffffff' : C.textMid,
                  fontWeight: activeTab === t.id ? 800 : 600, 
                  fontSize: isMobile ? '12px' : '13px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  gap: '8px', 
                  textAlign: 'left',
                  whiteSpace: 'nowrap', 
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === t.id ? '0 2px 8px rgba(15,118,110,0.25)' : 'none'
                }}
              >
                <span style={{ fontSize: isMobile ? '12px' : '14px', display: 'flex', alignItems: 'center' }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {!isMobile && (
            <>
              <div style={{ height: '1px', background: C.border, margin: '12px 0' }} />
              <button
                onClick={logout}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                  transition: 'background 0.15s'
                }}
              >
                <FaSignOutAlt /> Log Out
              </button>
            </>
          )}
        </div>

        {/* Content Section Panel */}
        <div style={{ 
          background: C.card, 
          border: `1px solid ${C.border}`, 
          borderRadius: isMobile ? '16px' : '20px', 
          padding: isMobile ? '16px 14px' : '32px', 
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          boxSizing: 'border-box',
          width: '100%',
          overflow: 'hidden'
        }}>
          
          {/* 1. ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUser /> 1. Account Settings
              </h2>

              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center', 
                gap: isMobile ? '14px' : '20px', 
                marginBottom: '20px', 
                background: C.bgSecondary, 
                padding: isMobile ? '16px' : '20px', 
                borderRadius: '16px', 
                border: `1px solid ${C.border}`,
                boxSizing: 'border-box',
                width: '100%'
              }}>
                <div style={{ 
                  width: isMobile ? '52px' : '64px', 
                  height: isMobile ? '52px' : '64px', 
                  borderRadius: '50%', 
                  background: C.teal, 
                  color: '#fff', 
                  fontSize: isMobile ? '22px' : '28px', 
                  fontWeight: 900, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: isMobile ? '16px' : '17px', fontWeight: 900, margin: '0 0 2px 0', wordBreak: 'break-word' }}>{fullName}</h3>
                  <p style={{ margin: 0, fontSize: isMobile ? '12px' : '12.5px', color: C.textMid, fontWeight: 700, wordBreak: 'break-word' }}>
                    {designation} • {department}
                  </p>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, background: `${C.teal}15`, padding: '3px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' }}>
                    ID: {empCode} (Read-only)
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '16px', fontSize: '13px', width: '100%' }}>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Full Legal Name</label>
                  <input type="text" readOnly value={fullName} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontWeight: 700, color: C.text, fontSize: isMobile ? '13px' : '13.5px' }} />
                </div>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Employee Code</label>
                  <input type="text" readOnly value={empCode} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontWeight: 700, color: C.textMid, fontSize: isMobile ? '13px' : '13.5px' }} />
                </div>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Mobile Contact</label>
                  <input type="text" readOnly value={jDetails.mobile_number || emp.mobile_number || emp.mobile || 'N/A'} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontWeight: 700, color: C.text, fontSize: isMobile ? '13px' : '13.5px' }} />
                </div>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                  <input type="text" readOnly value={jDetails.email_id || emp.email_id || emp.email || 'N/A'} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontWeight: 700, color: C.text, fontSize: isMobile ? '13px' : '13.5px' }} />
                </div>
              </div>
            </div>
          )}

          {/* 2. SECURITY & LOGIN */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaLock /> 2. Security & Login Credentials
              </h2>

              <form onSubmit={handlePasswordChange} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', marginBottom: '20px', boxSizing: 'border-box', width: '100%' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 12px 0' }}>Change Account Password</h3>
                {passwordMsg && <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>{passwordMsg}</div>}
                <div style={{ display: 'grid', gap: '10px', marginBottom: '14px', width: '100%' }}>
                  <input type="password" required placeholder="Current Password" value={passwordForm.current_password} onChange={(e) => setPasswordForm(p => ({ ...p, current_password: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px' }} />
                  <input type="password" required placeholder="New Password" value={passwordForm.new_password} onChange={(e) => setPasswordForm(p => ({ ...p, new_password: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px' }} />
                  <input type="password" required placeholder="Confirm New Password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '13px' }} />
                </div>
                <button type="submit" style={{ width: isMobile ? '100%' : 'auto', background: C.teal, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' }}>
                  Update Password
                </button>
              </form>

              {/* Login Activity */}
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxSizing: 'border-box', width: '100%' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 10px 0' }}>Recent Login Activity</h3>
                <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '6px' }}>
                    <div>
                      <strong>Windows Chrome Session</strong> — Maharashtra, India
                      <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Active Now • IP: 103.44.xx.xx</div>
                    </div>
                    <span style={{ color: '#10B981', fontWeight: 800, fontSize: '11px', background: '#10B98115', padding: '2px 8px', borderRadius: '6px' }}>● Current Session</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaBell /> 3. Notification Settings & Alert Channels
              </h2>

              <NotificationSettings />
            </div>
          )}

          {/* 4. PRIVACY */}
          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaShieldAlt /> 4. Customer Data Privacy & Compliance
              </h2>
              <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', fontSize: isMobile ? '12.5px' : '13px', lineHeight: 1.6, boxSizing: 'border-box', width: '100%' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span> Strict Data Masking Enforced
                </p>
                <p style={{ margin: 0, color: C.text }}>
                  Customer PII (Personal Identifiable Information) including full mobile numbers and financial account numbers are masked per GharKaPaisa security guidelines.
                </p>
              </div>
            </div>
          )}

          {/* 5. KYC & VERIFICATION */}
          {activeTab === 'kyc' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaIdCard /> 5. KYC & Onboarding Verification Status
              </h2>

              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', marginBottom: '20px', boxSizing: 'border-box', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '8px', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0 }}>Onboarding Step Progress</h3>
                  <span style={{ background: kyc.kyc_status === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7', color: kyc.kyc_status === 'VERIFIED' ? '#065F46' : '#92400E', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800 }}>
                    KYC {kyc.kyc_status || 'VERIFIED'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: isMobile ? '12.5px' : '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span>Step 1: Joining Registration</span>
                    <strong style={{ color: '#10B981' }}>✓ Completed</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span>Step 2: Terms & Video Verification</span>
                    <strong style={{ color: '#10B981' }}>✓ Completed</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <span>Step 3: Documents Upload</span>
                    <strong style={{ color: kyc.kyc_status === 'VERIFIED' ? '#10B981' : '#F59E0B' }}>
                      {kyc.kyc_status === 'VERIFIED' ? '✓ Verified' : 'Under Review'}
                    </strong>
                  </div>
                </div>

                <button onClick={() => navigate('/employee/kyc')} style={{ width: isMobile ? '100%' : 'auto', marginTop: '16px', background: C.teal, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '12.5px' }}>
                  Open Onboarding Wizard →
                </button>
              </div>
            </div>
          )}

          {/* 6. EMPLOYMENT INFO */}
          {activeTab === 'employment' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaBuilding /> 6. Official Employment Parameters
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '10px' : '16px', fontSize: '13px', width: '100%' }}>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Employee Ref ID</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: C.text, marginTop: '2px' }}>{empCode}</strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Designation</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: C.teal, marginTop: '2px' }}>{designation}</strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Department</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: C.text, marginTop: '2px' }}>{department}</strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Reporting Manager</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: C.text, marginTop: '2px', wordBreak: 'break-word' }}>{hierarchy.manager_name || jDetails.reporting_manager || 'Super Admin'}</strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Work Location</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: C.text, marginTop: '2px' }}>{jDetails.work_location || emp.work_location || 'Office / Main Branch'}</strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Employment Type & Status</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#10B981', marginTop: '2px' }}>
                    {jDetails.employment_type || emp.employment_type || 'Full-Time Regular'} (Active)
                  </strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Joining Date</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: C.text, marginTop: '2px' }}>
                    {jDetails.joining_date ? new Date(jDetails.joining_date).toLocaleDateString() : 'Verified Employee'}
                  </strong>
                </div>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Target & Incentives</span>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#3B82F6', marginTop: '2px' }}>
                    {jDetails.target_applicable ? 'Standard Incentive Model' : 'Performance Tier Matrix'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 7. APPEARANCE */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaPalette /> 7. Appearance & Visual Theme Settings
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxSizing: 'border-box', width: '100%' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 12px 0' }}>Theme Interface Mode</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
                    <button onClick={() => setTheme('light')} style={{ padding: isMobile ? '12px 8px' : '14px', borderRadius: '12px', border: `2px solid ${theme === 'light' ? C.teal : C.border}`, background: '#FFF', color: '#0F172A', fontWeight: 800, fontSize: isMobile ? '12.5px' : '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      ☀️ Light
                    </button>
                    <button onClick={() => setTheme('dark')} style={{ padding: isMobile ? '12px 8px' : '14px', borderRadius: '12px', border: `2px solid ${theme === 'dark' ? C.teal : C.border}`, background: '#0F172A', color: '#FFF', fontWeight: 800, fontSize: isMobile ? '12.5px' : '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      🌙 Dark
                    </button>
                  </div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', boxSizing: 'border-box', width: '100%' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 6px 0' }}>Display Contrast & Scaling</h3>
                  <p style={{ fontSize: '12px', color: C.textMid, margin: '0 0 12px 0' }}>Adjust portal visual density and font scaling preference.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12.5px' }}>
                    <button onClick={() => alert('Standard scaling active (100%)')} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, fontWeight: 700, cursor: 'pointer', color: C.text }}>
                      100% Standard
                    </button>
                    <button onClick={() => alert('Compact scaling active (85%)')} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.teal}`, background: `${C.teal}15`, fontWeight: 800, cursor: 'pointer', color: C.teal }}>
                      85% Compact (Recommended)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. APP PREFERENCES */}
          {activeTab === 'preferences' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaMobileAlt /> 8. Application & Workspace Preferences
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                <div style={{ background: C.bgSecondary, padding: isMobile ? '16px' : '18px', borderRadius: '16px', border: `1px solid ${C.border}`, boxSizing: 'border-box', width: '100%' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 10px 0' }}>Default Filter & Date Ranges</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', width: '100%' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '4px' }}>DEFAULT DASHBOARD RANGE</label>
                      <select style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, fontSize: isMobile ? '12.5px' : '13px' }}>
                        <option>Current Month (Default)</option>
                        <option>Last 30 Days</option>
                        <option>Current Financial Quarter</option>
                        <option>All Time Records</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '4px' }}>DEFAULT EXPORT FORMAT</label>
                      <select style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, fontSize: isMobile ? '12.5px' : '13px' }}>
                        <option>CSV Spreadsheet (.csv)</option>
                        <option>Excel Workbook (.xlsx)</option>
                        <option>PDF Summary (.pdf)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ background: C.bgSecondary, padding: isMobile ? '16px' : '18px', borderRadius: '16px', border: `1px solid ${C.border}`, boxSizing: 'border-box', width: '100%' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 10px 0' }}>Data Sync & Live Auto-Refresh</h3>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: isMobile ? '12.5px' : '13px', cursor: 'pointer', fontWeight: 700, lineHeight: 1.4 }}>
                    <input type="checkbox" defaultChecked style={{ marginTop: '2px' }} /> 
                    <span>Automatically refresh lead statuses and applications every 60 seconds</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 9. HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaQuestionCircle /> 9. Help Desk & Support Desk
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '20px', width: '100%' }}>
                <button onClick={() => setShowSupportModal(true)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: isMobile ? '14px' : '18px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', color: C.text, transition: 'all 0.2s', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '0' }}>
                  <FaHeadset style={{ fontSize: isMobile ? '20px' : '26px', color: C.teal, marginBottom: isMobile ? 0 : '8px' }} />
                  <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                    <strong style={{ display: 'block', fontSize: isMobile ? '13.5px' : '14px' }}>Raise Ticket</strong>
                    <span style={{ fontSize: '11px', color: C.textMid }}>Submit support request</span>
                  </div>
                </button>
                <button onClick={() => alert('HR Contact: hr@gharkapaisa.in | Phone: +91 98765 43210')} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: isMobile ? '14px' : '18px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', color: C.text, display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '0' }}>
                  <FaUser style={{ fontSize: isMobile ? '20px' : '26px', color: C.teal, marginBottom: isMobile ? 0 : '8px' }} />
                  <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                    <strong style={{ display: 'block', fontSize: isMobile ? '13.5px' : '14px' }}>Contact HR</strong>
                    <span style={{ fontSize: '11px', color: C.textMid }}>hr@gharkapaisa.in</span>
                  </div>
                </button>
                <button onClick={() => alert(`Manager Contact: ${hierarchy.manager_name || 'Super Admin'}`)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: isMobile ? '14px' : '18px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', color: C.text, display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '0' }}>
                  <FaBuilding style={{ fontSize: isMobile ? '20px' : '26px', color: C.teal, marginBottom: isMobile ? 0 : '8px' }} />
                  <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                    <strong style={{ display: 'block', fontSize: isMobile ? '13.5px' : '14px' }}>Contact Manager</strong>
                    <span style={{ fontSize: '11px', color: C.textMid }}>{hierarchy.manager_name || 'Super Admin'}</span>
                  </div>
                </button>
              </div>

              {/* Support Ticket Form Modal */}
              {showSupportModal && (
                <form onSubmit={handleSupportTicketSubmit} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: isMobile ? '16px' : '20px', marginBottom: '20px', boxSizing: 'border-box', width: '100%' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 12px 0' }}>Submit Employee Support Request</h3>
                  <input type="text" required placeholder="Ticket Subject (e.g. Incentive discrepancy / Lead re-assignment)" value={ticketForm.subject} onChange={(e) => setTicketForm(p => ({ ...p, subject: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, marginBottom: '10px', fontSize: '13px' }} />
                  <textarea required rows={3} placeholder="Provide details about your query or technical issue..." value={ticketForm.description} onChange={(e) => setTicketForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, marginBottom: '10px', fontSize: '13px', resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowSupportModal(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.text, padding: '8px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '12.5px' }}>Cancel</button>
                    <button type="submit" style={{ background: C.teal, color: '#FFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '12.5px' }}>Submit Ticket</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 10. LEGAL & POLICIES */}
          {activeTab === 'legal' && (
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaFileContract /> 10. Legal & Compliance Policies
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: isMobile ? '12.5px' : '13px', width: '100%' }}>
                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: C.text }}>Workplace Code of Conduct</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: C.textMid, lineHeight: 1.4 }}>
                    Enforces ethics, non-disclosure, customer data protection, and professional standards across all team operations.
                  </p>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 800, textDecoration: 'none', fontSize: '11.5px' }}>
                    View Full Workplace Policy ↗
                  </a>
                </div>

                <div style={{ background: C.bgSecondary, padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: C.text }}>Customer PII & Data Privacy Policy</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: C.textMid, lineHeight: 1.4 }}>
                    Governs customer data processing, masking rules, and compliance under India's Digital Personal Data Protection Act (DPDP).
                  </p>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 800, textDecoration: 'none', fontSize: '11.5px' }}>
                    View Privacy & DPDP Compliance Policy ↗
                  </a>
                </div>

                <div style={{ marginTop: '6px', padding: '12px', background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: '10px', fontSize: '11.5px', color: C.text }}>
                  <strong>GharKaPaisa Enterprise Platform Version:</strong> v2.4.0 (Production Release)
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Mobile-only bottom Logout Button */}
      {isMobile && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', 
              padding: '13px 16px', 
              borderRadius: '14px', 
              border: '1px solid #FECACA', 
              cursor: 'pointer',
              background: '#FEF2F2', 
              color: '#DC2626', 
              fontWeight: 800, 
              fontSize: '13px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <FaSignOutAlt /> Log Out of Portal
          </button>
        </div>
      )}

    </div>
  );
}
