import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../services/api';
import { 
  MdPerson, MdSecurity, MdEmail, MdPhone, MdShield, MdCheckCircle 
} from 'react-icons/md';

export default function AdminProfilePage() {
  const { C } = useTheme();
  const S = makeS(C);
  const location = useLocation();
  
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'profile');

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && (tab === 'profile' || tab === 'security')) {
      setActiveTab(tab);
    }
  }, [location.search]);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || '',
    mobile: user?.mobile || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (res.data?.success) {
        updateUser(res.data.data);
        setMsg({ text: 'Profile details updated successfully!', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setMsg({ text: 'New passwords do not match.', type: 'error' });
    }
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data?.success) {
        setMsg({ text: 'Password changed successfully!', type: 'success' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update password.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header Banner */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
        <div style={{ height: '100px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }} />
        <div style={{
          padding: '0 24px 20px', position: 'relative',
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px', marginTop: '-40px'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: C.bgSecondary, border: `4px solid ${C.card}`,
            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
            fontSize: '36px', color: C.primary, boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
          }}>
            👤
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>
              {user?.full_name || 'Administrator'}
            </h2>
            <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0' }}>
              {user?.email || 'admin@gharkapaisa.in'} • <span style={{ textTransform: 'capitalize', fontWeight: 700, color: C.teal }}>{user?.role?.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '12px 20px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 600,
          background: msg.type === 'success' ? `${C.green}12` : `${C.red}12`,
          color: msg.type === 'success' ? C.green : C.red,
          border: `1px solid ${msg.type === 'success' ? C.green : C.red}`
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side Tab Navigation */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'profile', label: 'My Profile', icon: MdPerson },
            { id: 'security', label: 'Security & Password', icon: MdSecurity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMsg({ text: '', type: '' }); }}
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

        {/* Right Side Content Panel */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          
          {activeTab === 'profile' && (
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                Personal Details
              </h3>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={S.label}>Email Address (Read-only)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', color: C.textLight, fontSize: '13.5px' }}>
                      <MdEmail size={16} /> {user?.email}
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>User Role</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 14px', color: C.textLight, fontSize: '13.5px', textTransform: 'capitalize' }}>
                      <MdShield size={16} /> {user?.role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={S.label}>Full Name *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required 
                        value={profileForm.fullName} 
                        onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} 
                        style={{ ...S.input, paddingLeft: '36px' }} 
                      />
                      <MdPerson style={{ position: 'absolute', left: '12px', top: '13px', color: C.textLight }} size={16} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Mobile Phone</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="tel" 
                        value={profileForm.mobile} 
                        onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })} 
                        style={{ ...S.input, paddingLeft: '36px' }} 
                      />
                      <MdPhone style={{ position: 'absolute', left: '12px', top: '13px', color: C.textLight }} size={16} />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ ...S.btn('primary'), alignSelf: 'flex-start', padding: '10px 24px', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                Change Account Password
              </h3>

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '460px' }}>
                <div>
                  <label style={S.label}>Current Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordForm.oldPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} 
                    style={S.input} 
                  />
                </div>
                <div>
                  <label style={S.label}>New Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                    style={S.input} 
                  />
                </div>
                <div>
                  <label style={S.label}>Confirm New Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                    style={S.input} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ ...S.btn('primary'), alignSelf: 'flex-start', padding: '10px 24px', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Resetting...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
