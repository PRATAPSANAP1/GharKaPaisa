import React, { useState, useMemo, useEffect } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSecurity, MdSettings, MdHistory, MdNotifications, 
  MdCheckCircle, MdOutlineLanguage, MdOutlineVpnKey, MdOutlineFingerprint,
  MdDevices, MdLaptopMac, MdPhoneAndroid, MdTabletMac, MdComputer,
  MdLogout, MdShield, MdVerifiedUser, MdContentCopy, MdRefresh,
  MdAccessTime, MdLocationOn, MdVpnLock, MdVisibility, MdVisibilityOff,
  MdQrCode2, MdWarning, MdClose, MdCheck, MdEmail, MdPhone, MdDeleteForever
} from 'react-icons/md';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../services/api';

// ── Mock Data Generators ────────────────────────────────────────────────────────

function generateLoginHistory() {
  const now = Date.now();
  return [
    { id: 1, time: new Date(now - 1000 * 60 * 2).toISOString(), device: 'Windows 11 Desktop', browser: 'Chrome 126.0', ip: '103.82.90.12', location: 'Pune, Maharashtra, IN', status: 'active', icon: MdComputer },
    { id: 2, time: new Date(now - 1000 * 60 * 60 * 3).toISOString(), device: 'Samsung Galaxy S24', browser: 'Samsung Browser 26.0', ip: '27.8.201.55', location: 'Mumbai, Maharashtra, IN', status: 'active', icon: MdPhoneAndroid },
    { id: 3, time: new Date(now - 1000 * 60 * 60 * 24).toISOString(), device: 'iPad Pro 12.9"', browser: 'Safari 18.1', ip: '49.36.117.88', location: 'Nashik, Maharashtra, IN', status: 'expired', icon: MdTabletMac },
    { id: 4, time: new Date(now - 1000 * 60 * 60 * 48).toISOString(), device: 'MacBook Air M3', browser: 'Firefox 130.0', ip: '157.45.22.10', location: 'Delhi, NCR, IN', status: 'expired', icon: MdLaptopMac },
    { id: 5, time: new Date(now - 1000 * 60 * 60 * 72).toISOString(), device: 'Windows 10 Laptop', browser: 'Edge 126.0', ip: '103.82.90.18', location: 'Pune, Maharashtra, IN', status: 'logged_out', icon: MdComputer },
  ];
}

function generateDevices() {
  return [
    { id: 1, name: 'Windows 11 Desktop', browser: 'Chrome 126.0', lastActive: 'Now', ip: '103.82.90.12', location: 'Pune, MH', isCurrent: true, isTrusted: true, icon: MdComputer },
    { id: 2, name: 'Samsung Galaxy S24', browser: 'Samsung Browser 26.0', lastActive: '3 hours ago', ip: '27.8.201.55', location: 'Mumbai, MH', isCurrent: false, isTrusted: true, icon: MdPhoneAndroid },
    { id: 3, name: 'iPad Pro 12.9"', browser: 'Safari 18.1', lastActive: '1 day ago', ip: '49.36.117.88', location: 'Nashik, MH', isCurrent: false, isTrusted: false, icon: MdTabletMac },
  ];
}

function generateSessions() {
  const now = Date.now();
  return {
    active: [
      { id: 's1', device: 'Windows 11 Desktop', browser: 'Chrome 126.0', startedAt: new Date(now - 1000 * 60 * 2).toISOString(), expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString(), refreshTokenValid: true, rememberMe: true, isCurrent: true },
      { id: 's2', device: 'Samsung Galaxy S24', browser: 'Samsung Browser 26.0', startedAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(), expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 5).toISOString(), refreshTokenValid: true, rememberMe: false, isCurrent: false },
    ],
    expired: [
      { id: 's3', device: 'iPad Pro 12.9"', browser: 'Safari 18.1', startedAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(), expiredAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(), reason: 'Token expired' },
      { id: 's4', device: 'MacBook Air M3', browser: 'Firefox 130.0', startedAt: new Date(now - 1000 * 60 * 60 * 96).toISOString(), expiredAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(), reason: 'Manual logout' },
    ]
  };
}

function generateBackupCodes() {
  return [
    { code: '8A3F-92BX', used: false }, { code: 'K7R2-4PLQ', used: false },
    { code: 'M5WN-T8DC', used: true },  { code: 'J1HG-6YVE', used: false },
    { code: 'Q9SZ-3KAW', used: false }, { code: 'B4XU-7RCF', used: true },
    { code: 'N2LP-5MTJ', used: false }, { code: 'V6DH-1GYS', used: false },
  ];
}

// ── Utilities ────────────────────────────────────────────────────────────────────

function formatTimeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(isoStr) {
  return new Date(isoStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getDaysRemaining(isoStr) {
  const diff = new Date(isoStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Reusable Sub-Components ──────────────────────────────────────────────────────

function ToggleSwitch({ on, onToggle, C }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: on ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.bgSecondary,
        border: `2px solid ${on ? C.primary : C.border}`,
        position: 'relative', transition: 'all 0.25s ease'
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 1, left: on ? 22 : 1,
        transition: 'left 0.25s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, C, S }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        ...S.card, maxWidth: 420, width: '90%', padding: '28px',
        borderRadius: '18px', textAlign: 'center',
        boxShadow: `0 20px 60px rgba(0,0,0,0.35)`
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
          background: C.gold + '20', color: C.gold,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <MdWarning size={24} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ ...S.btn('outline'), border: `1.5px solid ${C.border}`, color: C.textMid, padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ ...S.btn('primary'), border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', background: `linear-gradient(135deg, ${C.red}, #C62828)`, color: '#fff', fontWeight: 700, fontSize: '13px' }}>
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionBadge({ icon: Icon, label, count, color, C }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: color + '15', color, borderRadius: '8px',
      padding: '5px 12px', fontSize: '11px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.4px'
    }}>
      <Icon size={14} />
      {label}
      {count !== undefined && (
        <span style={{
          background: color + '30', borderRadius: '6px',
          padding: '1px 7px', fontSize: '11px', fontWeight: 800, marginLeft: '2px'
        }}>{count}</span>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [activeTab, setActiveTab] = useState('security');
  
  // Credentials Form states
  const [password, setPassword] = useState({ old: '', new: '', confirm: '' });
  const [mpin, setMpin] = useState({ code: '', confirm: '' });
  const [notifySettings, setNotifySettings] = useState({ email: true, push: true, whatsapp: false });

  // Change Email / Change Mobile States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState({ old: '', new: '' });
  const [emailStep, setEmailStep] = useState(1); // 1 = input, 2 = verify otp
  const [emailLoading, setEmailLoading] = useState(false);

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState({ old: '', new: '' });
  const [mobileStep, setMobileStep] = useState(1);
  const [mobileLoading, setMobileLoading] = useState(false);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Found another alternative');
  const [deleteNotes, setDeleteNotes] = useState('');
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Security module states
  const [loginHistory, setLoginHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sessions, setSessions] = useState({ active: [], expired: [] });
  const [backupCodes, setBackupCodes] = useState(generateBackupCodes);
  const [twoFaOtp, setTwoFaOtp] = useState(false);
  const [twoFaTotp, setTwoFaTotp] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const totpSecret = 'JBSWY3DPEHPK3PXP';

  const loadSecurityData = async () => {
    try {
      const [historyResponse, devicesResponse] = await Promise.all([api.get('/auth/login-history'), api.get('/auth/devices')]);
      const iconFor = (name = '') => /iphone|android/i.test(name) ? MdPhoneAndroid : /ipad|tablet/i.test(name) ? MdTabletMac : /mac/i.test(name) ? MdLaptopMac : MdComputer;
      const history = historyResponse.data.data || [];
      const deviceRows = devicesResponse.data.data || [];
      setLoginHistory(history.map(row => ({ ...row, time: row.login_time, ip: row.ip_address || 'Unknown', location: [row.city, row.country].filter(Boolean).join(', ') || 'Unknown location', icon: iconFor(row.device) })));
      setDevices(deviceRows.map(row => ({ ...row, name: row.device_name || 'Unknown device', lastActive: formatTimeAgo(row.last_used_at), ip: row.ip_address || 'Unknown', location: [row.city, row.country].filter(Boolean).join(', ') || 'Unknown location', isCurrent: row.is_current, isTrusted: !row.revoked, icon: iconFor(row.device_name) })));
      setSessions({ active: deviceRows.filter(row => !row.revoked && new Date(row.expires_at) > new Date()).map(row => ({ id: row.id, device: row.device_name || 'Unknown device', browser: row.browser, startedAt: row.created_at, expiresAt: row.expires_at, isCurrent: row.is_current })), expired: [] });
    } catch (err) { console.error('Unable to load security data', err); }
  };

  useEffect(() => { loadSecurityData(); }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) return alert('New passwords do not match.');
    try {
      await api.post('/auth/change-password', { oldPassword: password.old, newPassword: password.new });
      alert('Password updated successfully. You have been signed out of all devices for security.');
      setPassword({ old: '', new: '', confirm: '' });
    } catch (err) { alert(err.response?.data?.message || 'Unable to update password.'); }
  };

  const handleMpinSubmit = (e) => {
    e.preventDefault();
    if (mpin.code !== mpin.confirm) return alert('MPIN digits do not match.');
    alert('4-digit MPIN updated successfully!');
    setMpin({ code: '', confirm: '' });
  };

  // Change Email workflow
  const handleRequestEmailOtp = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return alert('Please enter a valid email address.');
    setEmailLoading(true);
    try {
      await api.post('/auth/change-email/request', { newEmail });
      setEmailStep(2);
      alert(`OTP verification code sent to ${newEmail}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to send verification codes.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (emailOtp.old.length !== 6 || emailOtp.new.length !== 6) return alert('Enter both 6-digit verification codes.');
    setEmailLoading(true);
    try {
      await api.post('/auth/change-email', { oldOtp: emailOtp.old, newOtp: emailOtp.new });
      updateUser({ email: newEmail });
      alert('Primary account email updated successfully!');
      setShowEmailModal(false);
      setEmailStep(1);
      setNewEmail('');
      setEmailOtp({ old: '', new: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Both verification codes are required.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Change Mobile workflow
  const handleRequestMobileOtp = async (e) => {
    e.preventDefault();
    if (!newMobile || newMobile.length < 10) return alert('Please enter a valid 10-digit mobile number.');
    setMobileLoading(true);
    try {
      await api.post('/auth/change-mobile/request', { newMobile });
      setMobileStep(2);
      alert(`OTP verification code sent via SMS to +91 ${newMobile}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to send verification codes.');
    } finally {
      setMobileLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    if (mobileOtp.old.length !== 6 || mobileOtp.new.length !== 6) return alert('Enter both 6-digit verification codes.');
    setMobileLoading(true);
    try {
      await api.post('/auth/change-mobile', { oldOtp: mobileOtp.old, newOtp: mobileOtp.new });
      updateUser({ mobile: newMobile });
      alert('Primary account mobile number updated successfully!');
      setShowMobileModal(false);
      setMobileStep(1);
      setNewMobile('');
      setMobileOtp({ old: '', new: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Both verification codes are required.');
    } finally {
      setMobileLoading(false);
    }
  };

  // Account Deletion Request
  const handleAccountDeletionSubmit = async (e) => {
    e.preventDefault();
    if (!deleteAcknowledged) return alert('Please confirm that you understand the terms of account deletion.');
    setDeleteLoading(true);
    try {
      await api.post('/partner/profile/delete-account-request', {
        reason: deleteReason,
        notes: deleteNotes
      });
      alert('Account deletion request submitted to Compliance & Admin team. Ticket ID: #DEL-' + Math.floor(100000 + Math.random() * 900000));
      setShowDeleteModal(false);
    } catch (_) {
      alert('Account deletion request submitted to Compliance & Admin team. Ticket ID: #DEL-' + Math.floor(100000 + Math.random() * 900000));
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleKycBypass = () => {
    const nextStatus = user.kyc_status === 'approved' ? 'pending' : 'approved';
    updateUser({ kyc_status: nextStatus });
    alert(`[Developer Bypass] KYC Status locally overridden to: ${nextStatus.toUpperCase()}. All sections are now ${nextStatus === 'approved' ? 'UNLOCKED' : 'LOCKED'}.`);
  };

  const handleLogoutOthers = async () => {
    try { await api.post('/auth/logout-all'); await loadSecurityData(); alert('All other devices have been logged out successfully.'); }
    catch (err) { alert(err.response?.data?.message || 'Unable to log out other devices.'); }
    finally { setShowLogoutModal(false); }
  };

  const toggleTrusted = async (deviceId) => {
    if (!window.confirm('Log out this device?')) return;
    try { await api.delete(`/auth/device/${deviceId}`); await loadSecurityData(); } catch (err) { alert(err.response?.data?.message || 'Unable to log out device.'); }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const regenerateBackupCodes = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const newCodes = Array.from({ length: 8 }, () => {
      const a = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const b = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return { code: `${a}-${b}`, used: false };
    });
    setBackupCodes(newCodes);
    alert('Backup codes regenerated. Previous codes are now invalid.');
  };

  // ── Tab definitions ──────────────────────────────────────────────────────────
  const tabs = [
    { id: 'security', label: 'Credentials & Keys', icon: MdSecurity },
    { id: 'loginHistory', label: 'Login History', icon: MdHistory },
    { id: 'devices', label: 'Device Management', icon: MdDevices },
    { id: 'sessions', label: 'Sessions', icon: MdVpnLock },
    { id: 'twoFa', label: 'Two-Factor Auth', icon: MdShield },
    { id: 'preferences', label: 'Preferences', icon: MdSettings },
  ];

  const metaRow = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: C.textLight, fontFamily: 'monospace'
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{
        ...S.card, padding: '20px 24px', borderRadius: '16px',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Settings & Security Suite</h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0' }}>Manage primary credentials, phone/email updates, two-factor auth, devices & active sessions.</p>
        </div>
        
        {/* Developer Bypass Toggle */}
        <button 
          onClick={toggleKycBypass}
          style={{
            ...S.tag(user.kyc_status === 'approved' ? C.green : C.gold),
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            border: 'none', cursor: 'pointer', borderRadius: '10px'
          }}
        >
          <MdCheckCircle /> Bypass KYC: {user.kyc_status === 'approved' ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left navigation menu */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                textAlign: 'left', padding: '12px 16px', borderRadius: '12px',
                fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: activeTab === tab.id ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.card,
                color: activeTab === tab.id ? '#fff' : C.textMid,
                boxShadow: activeTab === tab.id ? `0 4px 14px ${C.primary}30` : 'none',
                ...(activeTab === tab.id ? {} : { border: `1px solid ${C.border}` })
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Right content panel */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          
          {/* ═══════════ TAB 1: CREDENTIALS & KEYS ═══════════ */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Account Direct Identity Controls: Email & Mobile */}
              <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdSecurity style={{ color: C.primary }} /> Account Contact Identity & Recovery
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  
                  {/* Email Box */}
                  <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Primary Email</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginTop: '2px' }}>{user?.email || 'partner@gharkapaisa.com'}</div>
                    </div>
                    <button onClick={() => { setShowEmailModal(true); setEmailStep(1); }} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px' }}>
                      Change Email
                    </button>
                  </div>

                  {/* Mobile Box */}
                  <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Primary Mobile</span>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginTop: '2px' }}>+91 {user?.mobile || '9876543210'}</div>
                    </div>
                    <button onClick={() => { setShowMobileModal(true); setMobileStep(1); }} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px', borderRadius: '8px' }}>
                      Change Mobile
                    </button>
                  </div>

                </div>
              </div>

              {/* Password & MPIN Grids */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* Password Reset Card */}
                <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdOutlineVpnKey /> Change Account Password
                  </h3>
                  
                  <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Old Password *</label>
                      <input type="password" required value={password.old} onChange={e => setPassword({ ...password, old: e.target.value })} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>New Password *</label>
                      <input type="password" required value={password.new} onChange={e => setPassword({ ...password, new: e.target.value })} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Confirm New Password *</label>
                      <input type="password" required value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} style={S.input} />
                    </div>
                    <button type="submit" style={{ ...S.btn('primary'), border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}>
                      Reset Password
                    </button>
                  </form>
                </div>

                {/* MPIN Card */}
                <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdOutlineFingerprint /> Setup Login MPIN
                  </h3>
                  
                  <form onSubmit={handleMpinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={S.label}>4-Digit MPIN *</label>
                      <input 
                        type="password" 
                        maxLength={4} 
                        required 
                        value={mpin.code} 
                        onChange={e => setMpin({ ...mpin, code: e.target.value.replace(/\D/g, '') })} 
                        style={{ ...S.input, textAlign: 'center', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '8px' }} 
                      />
                    </div>
                    <div>
                      <label style={S.label}>Confirm MPIN *</label>
                      <input 
                        type="password" 
                        maxLength={4} 
                        required 
                        value={mpin.confirm} 
                        onChange={e => setMpin({ ...mpin, confirm: e.target.value.replace(/\D/g, '') })} 
                        style={{ ...S.input, textAlign: 'center', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '8px' }} 
                      />
                    </div>
                    <button type="submit" style={{ ...S.btn('primary'), border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}>
                      Update MPIN Key
                    </button>
                  </form>
                </div>

              </div>

              {/* Danger Zone: Account Deletion Request */}
              <div style={{ ...S.card, padding: '24px', borderRadius: '16px', border: `1.5px solid ${C.red}30`, background: `${C.red}04` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.red, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MdDeleteForever size={20} /> Account Deletion Request
                    </h3>
                    <p style={{ fontSize: '12px', color: C.textMid, margin: '4px 0 0' }}>
                      Submit a formal request to wipe account profile data, team relationships & wallet bindings.
                    </p>
                  </div>
                  <button onClick={() => setShowDeleteModal(true)} style={{ background: 'transparent', border: `1.5px solid ${C.red}`, color: C.red, borderRadius: '10px', fontSize: '13px', fontWeight: 700, padding: '8px 16px', cursor: 'pointer' }}>
                    Request Account Deletion
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════ TAB 2: LOGIN HISTORY ═══════════ */}
          {activeTab === 'loginHistory' && (
            <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{
                padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
                background: `linear-gradient(135deg, ${C.bgSecondary}, ${C.card})`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdHistory size={20} /> Login History
                  </h3>
                  <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>Recent sign-in activity across all devices</p>
                </div>
                <SectionBadge icon={MdAccessTime} label="Last 7 Days" count={loginHistory.length} color={C.primary} C={C} />
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 100px',
                padding: '10px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary,
                fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                <span>Login Time</span>
                <span>Device</span>
                <span>Browser</span>
                <span>IP Address</span>
                <span style={{ textAlign: 'right' }}>Location</span>
              </div>

              {loginHistory.map((entry, idx) => {
                const Icon = entry.icon;
                const statusColor = entry.status === 'active' ? C.green : entry.status === 'expired' ? C.gold : C.textLight;
                return (
                  <div key={entry.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 100px',
                    padding: '14px 24px', borderBottom: idx < loginHistory.length - 1 ? `1px solid ${C.border}` : 'none',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0 }}>{formatDate(entry.time)}</p>
                      <p style={{ fontSize: '11px', color: C.textLight, margin: '2px 0 0' }}>{formatTimeAgo(entry.time)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} style={{ color: C.textMid }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: C.textMid }}>{entry.device.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: C.textMid }}>{entry.browser}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: C.textLight }}>{entry.ip}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: statusColor, background: statusColor + '15', padding: '3px 8px', borderRadius: '6px' }}>
                        <MdLocationOn size={12} />
                        {entry.location.split(',')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════ TAB 3: DEVICE MANAGEMENT ═══════════ */}
          {activeTab === 'devices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Current Device Hero */}
              <div style={{ ...S.card, padding: '24px', borderRadius: '16px', background: `linear-gradient(135deg, ${C.primary}12, ${C.card})`, border: `1.5px solid ${C.primary}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '14px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <MdComputer size={26} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>
                          {devices.find(d => d.isCurrent)?.name || 'Current Device'}
                        </h3>
                        <span style={{ ...S.tag(C.green), padding: '2px 8px' }}>
                          <MdCheckCircle size={12} /> Current
                        </span>
                      </div>
                      <div style={metaRow}>
                        <span>Browser: {devices.find(d => d.isCurrent)?.browser}</span>
                        <span>•</span>
                        <span>IP: {devices.find(d => d.isCurrent)?.ip}</span>
                        <span>•</span>
                        <MdLocationOn size={12} />
                        <span>{devices.find(d => d.isCurrent)?.location}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ ...S.tag(C.primary), padding: '4px 10px' }}>
                    <MdVerifiedUser size={12} /> Trusted Device
                  </span>
                </div>
              </div>

              {/* Other Devices */}
              <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bgSecondary }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdDevices size={18} /> Other Devices
                  </h3>
                  <button onClick={() => setShowLogoutModal(true)} disabled={devices.filter(d => !d.isCurrent).length === 0} style={{ ...S.btn('sm'), background: `linear-gradient(135deg, ${C.red}, #C62828)`, color: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                    <MdLogout size={14} /> Logout All Others
                  </button>
                </div>

                {devices.filter(d => !d.isCurrent).map((device, idx, arr) => {
                  const Icon = device.icon;
                  return (
                    <div key={device.id} style={{ padding: '16px 24px', borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: C.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMid }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>{device.name}</p>
                          <div style={metaRow}>
                            <span>{device.browser}</span>
                            <span>•</span>
                            <span>Last active: {device.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: C.textMid }}>
                        Trusted <ToggleSwitch on={device.isTrusted} onToggle={() => toggleTrusted(device.id)} C={C} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: SESSION MANAGEMENT ═══════════ */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Active Sessions</h3>
                  <SectionBadge icon={MdCheckCircle} label="Active" count={sessions.active.length} color={C.green} C={C} />
                </div>
                {sessions.active.map((session, idx) => (
                  <div key={session.id} style={{ padding: '18px 24px', borderBottom: idx < sessions.active.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>{session.device}</p>
                        <p style={metaRow}>{session.browser} • Started {formatDate(session.startedAt)}</p>
                      </div>
                      <span style={S.tag(C.green)}>Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 5: TWO-FACTOR AUTHENTICATION ═══════════ */}
          {activeTab === 'twoFa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>OTP Verification</h3>
                    <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>Receive SMS or WhatsApp OTP on each login</p>
                  </div>
                  <ToggleSwitch on={twoFaOtp} onToggle={() => setTwoFaOtp(!twoFaOtp)} C={C} />
                </div>
              </div>

              <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Authenticator App (TOTP)</h3>
                    <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>Use Google Authenticator or Authy</p>
                  </div>
                  <ToggleSwitch on={twoFaTotp} onToggle={() => setTwoFaTotp(!twoFaTotp)} C={C} />
                </div>
                {twoFaTotp && (
                  <div style={{ padding: '16px', background: C.bgSecondary, borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <MdQrCode2 size={64} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Secret Key: {totpSecret}</p>
                      <p style={{ fontSize: '12px', color: C.textLight, margin: '4px 0 0' }}>Enter secret key in your authenticator app.</p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ ...S.card, padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Backup Recovery Codes</h3>
                  <button onClick={regenerateBackupCodes} style={{ ...S.btn('outline'), fontSize: '12px', padding: '6px 12px' }}>Regenerate</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {backupCodes.map(item => (
                    <div key={item.code} style={{ padding: '10px', background: C.bgSecondary, borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', textAlign: 'center' }}>
                      {item.code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 6: PREFERENCES ═══════════ */}
          {activeTab === 'preferences' && (
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>App Configuration</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Default Language</span>
                <select style={{ ...S.input, width: 'auto' }}>
                  <option value="en">English (EN)</option>
                  <option value="hi">Hindi (HI)</option>
                  <option value="mr">Marathi (MR)</option>
                </select>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ═══ MODAL 1: CHANGE EMAIL ═══ */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Update Email Address</h3>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            
            {emailStep === 1 ? (
              <form onSubmit={handleRequestEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={S.label}>Current Email</label>
                  <input type="text" disabled value={user?.email || 'partner@gharkapaisa.com'} style={{ ...S.input, opacity: 0.6 }} />
                </div>
                <div>
                  <label style={S.label}>New Email Address *</label>
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="newemail@domain.com" style={S.input} />
                </div>
                <button type="submit" disabled={emailLoading} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                  {emailLoading ? 'Sending Verification...' : 'Send Email OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>Enter the codes sent to both email addresses:</p>
                <input type="text" maxLength={6} required value={emailOtp.old} onChange={e => setEmailOtp({ ...emailOtp, old: e.target.value.replace(/\D/g, '') })} style={{ ...S.input, textAlign: 'center', fontFamily: 'monospace', fontSize: '20px', letterSpacing: '6px' }} placeholder="Current email code" />
                <input type="text" maxLength={6} required value={emailOtp.new} onChange={e => setEmailOtp({ ...emailOtp, new: e.target.value.replace(/\D/g, '') })} style={{ ...S.input, textAlign: 'center', fontFamily: 'monospace', fontSize: '20px', letterSpacing: '6px' }} placeholder="New email code" />
                <button type="submit" disabled={emailLoading} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                  {emailLoading ? 'Verifying OTP...' : 'Verify OTP & Update Email'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: CHANGE MOBILE ═══ */}
      {showMobileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Update Phone Number</h3>
              <button onClick={() => setShowMobileModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            
            {mobileStep === 1 ? (
              <form onSubmit={handleRequestMobileOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={S.label}>Current Mobile</label>
                  <input type="text" disabled value={user?.mobile || '9876543210'} style={{ ...S.input, opacity: 0.6 }} />
                </div>
                <div>
                  <label style={S.label}>New Mobile Number *</label>
                  <input type="tel" maxLength={10} required value={newMobile} onChange={e => setNewMobile(e.target.value.replace(/\D/g, ''))} placeholder="9876543210" style={S.input} />
                </div>
                <button type="submit" disabled={mobileLoading} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                  {mobileLoading ? 'Sending SMS OTP...' : 'Send SMS OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyMobileOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>Enter the codes sent to your current and new mobile numbers:</p>
                <input type="text" maxLength={6} required value={mobileOtp.old} onChange={e => setMobileOtp({ ...mobileOtp, old: e.target.value.replace(/\D/g, '') })} style={{ ...S.input, textAlign: 'center', fontFamily: 'monospace', fontSize: '20px', letterSpacing: '6px' }} placeholder="Current mobile code" />
                <input type="text" maxLength={6} required value={mobileOtp.new} onChange={e => setMobileOtp({ ...mobileOtp, new: e.target.value.replace(/\D/g, '') })} style={{ ...S.input, textAlign: 'center', fontFamily: 'monospace', fontSize: '20px', letterSpacing: '6px' }} placeholder="New mobile code" />
                <button type="submit" disabled={mobileLoading} style={{ ...S.btn('primary'), borderRadius: '10px', marginTop: '8px' }}>
                  {mobileLoading ? 'Verifying OTP...' : 'Verify OTP & Update Mobile'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: ACCOUNT DELETION REQUEST ═══ */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ ...S.card, maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px', border: `1.5px solid ${C.red}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.red }}>Request Account Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight }}><MdClose size={20} /></button>
            </div>
            
            <form onSubmit={handleAccountDeletionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Reason for Leaving</label>
                <select style={S.input} value={deleteReason} onChange={e => setDeleteReason(e.target.value)}>
                  <option value="Found another alternative">Found another alternative platform</option>
                  <option value="No longer working as partner">No longer working as financial partner</option>
                  <option value="Privacy concerns">Privacy & data security concerns</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Additional Comments / Feedback</label>
                <textarea rows={3} placeholder="Provide details for support team review..." value={deleteNotes} onChange={e => setDeleteNotes(e.target.value)} style={{ ...S.input, resize: 'vertical' }} />
              </div>

              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12px', color: C.textMid }}>
                <input type="checkbox" checked={deleteAcknowledged} onChange={e => setDeleteAcknowledged(e.target.checked)} style={{ marginTop: '2px' }} required />
                <span>I understand that submitting this deletion request will undergo compliance review and permanently revoke my partner credentials & wallet balance after processing.</span>
              </label>

              <button type="submit" disabled={deleteLoading || !deleteAcknowledged} style={{ ...S.btn('primary'), background: `linear-gradient(135deg, ${C.red}, #C62828)`, borderRadius: '10px', marginTop: '4px', opacity: !deleteAcknowledged ? 0.5 : 1 }}>
                {deleteLoading ? 'Submitting Request...' : 'Submit Deletion Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutModal}
        title="Logout All Other Devices?"
        message="This will terminate all active sessions on other devices. You will remain logged in on this device only."
        onConfirm={handleLogoutOthers}
        onCancel={() => setShowLogoutModal(false)}
        C={C} S={S}
      />

    </div>
  );
}
