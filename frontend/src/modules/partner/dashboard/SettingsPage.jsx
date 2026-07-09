import React, { useState } from 'react';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { 
  MdSecurity, MdSettings, MdHistory, MdNotifications, 
  MdCheckCircle, MdOutlineLanguage, MdOutlineVpnKey, MdOutlineFingerprint 
} from 'react-icons/md';
import { useAuthStore } from '../../../app/store/authStore';

export default function SettingsPage() {
  const { C } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [activeTab, setActiveTab] = useState('security');
  
  // Form states
  const [password, setPassword] = useState({ old: '', new: '', confirm: '' });
  const [mpin, setMpin] = useState({ code: '', confirm: '' });
  const [notifySettings, setNotifySettings] = useState({ email: true, push: true, whatsapp: false });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) return alert('New passwords do not match.');
    alert('Password updated successfully!');
    setPassword({ old: '', new: '', confirm: '' });
  };

  const handleMpinSubmit = (e) => {
    e.preventDefault();
    if (mpin.code !== mpin.confirm) return alert('MPIN digits do not match.');
    alert('4-digit MPIN updated successfully!');
    setMpin({ code: '', confirm: '' });
  };

  const toggleKycBypass = () => {
    const nextStatus = user.kyc_status === 'approved' ? 'pending' : 'approved';
    updateUser({ kyc_status: nextStatus });
    alert(`[Developer Bypass] KYC Status locally overridden to: ${nextStatus.toUpperCase()}. All sections are now ${nextStatus === 'approved' ? 'UNLOCKED' : 'LOCKED'}.`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Title */}
      <div style={{
        ...S.card, padding: '20px 24px', borderRadius: '16px',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Settings & Security</h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '4px 0 0' }}>Configure security credentials, theme preferences, and review active sessions.</p>
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
        
        {/* Left tabs menu */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'security', label: 'Credentials & Keys', icon: MdSecurity },
            { id: 'preferences', label: 'App Preferences', icon: MdSettings },
            { id: 'sessions', label: 'Active Sessions', icon: MdHistory }
          ].map(tab => (
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

        {/* Right Tab Content Panel */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          
          {activeTab === 'security' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Password resetting */}
              <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{
                  fontSize: '15px', fontWeight: 700, color: C.text, margin: 0,
                  paddingBottom: '12px', borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
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
                  <button type="submit" style={{
                    ...S.btn('primary'), border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '6px'
                  }}>
                    Reset Password
                  </button>
                </form>
              </div>

              {/* Secure MPIN Code */}
              <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{
                  fontSize: '15px', fontWeight: 700, color: C.text, margin: 0,
                  paddingBottom: '12px', borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
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
                  <button type="submit" style={{
                    ...S.btn('primary'), border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '6px'
                  }}>
                    Update MPIN Key
                  </button>
                </form>
              </div>

            </div>
          )}

          {activeTab === 'preferences' && (
            <div style={{ ...S.card, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
                App Configuration
              </h3>

              {/* Translation locale */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 36, height: 36, background: C.bgSecondary, color: C.textMid,
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MdOutlineLanguage size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>Default Language</p>
                    <p style={{ fontSize: '12px', color: C.textLight, margin: '2px 0 0' }}>Choose preferred language for regional translation.</p>
                  </div>
                </div>
                <select style={{
                  ...S.input, width: 'auto', padding: '6px 12px', fontSize: '12px', fontWeight: 700,
                  appearance: 'auto', backgroundImage: 'none', cursor: 'pointer'
                }}>
                  <option value="en">English (EN)</option>
                  <option value="hi">Hindi (HI)</option>
                  <option value="mr">Marathi (MR)</option>
                </select>
              </div>

              <div style={{ height: 1, background: C.border }} />

              {/* Notifications setting */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdNotifications /> Push Alert Settings
                </h4>
                
                <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Email Payout Notifications</span>
                  <input type="checkbox" checked={notifySettings.email} onChange={e => setNotifySettings({ ...notifySettings, email: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Push Lead Update Alerts</span>
                  <input type="checkbox" checked={notifySettings.push} onChange={e => setNotifySettings({ ...notifySettings, push: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div style={{ ...S.card, padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Login Sessions History</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', divideY: `1px solid ${C.border}` }}>
                <div style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', borderBottom: `1px solid ${C.border}`
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>Windows 11 PC • Chrome Browser</p>
                    <p style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace', margin: '4px 0 0' }}>IP: 103.82.90.12 • Active Session</p>
                  </div>
                  <span style={S.tag(C.green)}>Current</span>
                </div>
                <div style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0 }}>Android Mobile • WebView shell</p>
                    <p style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace', margin: '4px 0 0' }}>IP: 27.8.201.55 • 22/06/2026 18:24</p>
                  </div>
                  <span style={S.tag(C.textLight)}>Logged Out</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
