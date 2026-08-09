import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../services/api';

const TABS = [
  { id: 'overview', label: '📌 Overview' },
  { id: 'bank_kyc', label: '🏦 Bank & KYC' },
  { id: 'applications', label: '📄 Applications' },
  { id: 'wallet', label: '💰 Wallet' },
  { id: 'direct_team', label: '👥 Sub-Team' },
];

function InfoGrid({ items, isDark, border, textPrimary, textMuted }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ gridColumn: item.full ? '1/-1' : undefined }}>
          <div style={{ fontSize: 11, color: textMuted, marginBottom: 3 }}>{item.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: item.color || textPrimary }}>{item.value || 'N/A'}</div>
        </div>
      ))}
    </div>
  );
}

export default function TeamMemberDrawer({ memberId, onClose, onSelectSubMember }) {
  const { C, isDark } = useTheme();
  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;

  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (memberId) { setActiveTab('overview'); fetchProfile(); }
  }, [memberId]);

  const fetchProfile = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/team/${memberId}`);
      if (res.data?.success) setMemberData(res.data.data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load member profile'); }
    finally { setLoading(false); }
  };

  if (!memberId) return null;

  const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  const sectionStyle = { padding: '16px', borderRadius: 14, background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}`, marginBottom: 14 };
  const sectionTitle = { fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .drawer-tab:hover { background: ${isDark ? '#1a1a1a' : '#f1f5f9'} !important; }
        .child-row:hover { background: ${isDark ? '#1a1a1a' : '#f1f5f9'} !important; }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 640,
        background: cardBg, borderLeft: `1px solid ${border}`,
        height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.35s cubic-bezier(0.4,0,0.2,1)'
      }}>

        {/* Header */}
        <div style={{ padding: '18px 20px', background: isDark ? 'linear-gradient(135deg,#0d0d1a,#0f0f0f)' : 'linear-gradient(135deg,#f0f4ff,#fff)', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: accent + '20', border: `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: accent, overflow: 'hidden', fontSize: 16, flexShrink: 0 }}>
              {memberData?.profile?.photo ? <img src={memberData.profile.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (memberData?.profile?.full_name || 'P').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: textPrimary }}>{memberData?.profile?.full_name || 'Loading...'}</span>
                {memberData?.profile?.rank && (
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: accent + '15', color: accent, border: `1px solid ${accent}25`, fontWeight: 700 }}>{memberData.profile.rank}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: textMuted }}>Code: {memberData?.profile?.partner_code || memberId}</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ padding: 8, borderRadius: 10, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9', cursor: 'pointer', color: textMuted, transition: 'all 0.2s' }}>
            <X size={16} />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: isDark ? '#0a0a0a' : '#f8faff', borderBottom: `1px solid ${border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.id} className="drawer-tab" onClick={() => setActiveTab(tab.id)}
              style={{ padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: activeTab === tab.id ? `linear-gradient(135deg,${accent},${C.primaryDark})` : 'transparent', color: activeTab === tab.id ? '#fff' : textMuted, boxShadow: activeTab === tab.id ? `0 2px 10px ${accent}40` : 'none', transition: 'all 0.2s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <RefreshCw size={32} color={accent} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: textMuted, fontSize: 14 }}>Fetching member profile...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '16px', borderRadius: 14, background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{error}</div>
          ) : memberData ? (
            <div key={activeTab} style={{ animation: 'fadeIn 0.3s ease' }}>

              {activeTab === 'overview' && (
                <>
                  <div style={sectionStyle}>
                    <div style={sectionTitle}>Contact & Account Info</div>
                    <InfoGrid isDark={isDark} border={border} textPrimary={textPrimary} textMuted={textMuted} items={[
                      { label: 'Mobile Number', value: memberData.profile.mobile },
                      { label: 'Email Address', value: memberData.profile.email },
                      { label: 'Account Status', value: memberData.profile.status?.toUpperCase(), color: '#10b981' },
                      { label: 'KYC Status', value: memberData.profile.kyc_status?.toUpperCase(), color: accent },
                      { label: 'Parent Partner', value: `${memberData.profile.parent_name} (${memberData.profile.parent_code})` },
                      { label: 'Joined Date', value: new Date(memberData.profile.joined_at).toLocaleDateString() },
                    ]} />
                  </div>
                  <div style={sectionStyle}>
                    <div style={sectionTitle}>Company & Address</div>
                    <InfoGrid isDark={isDark} border={border} textPrimary={textPrimary} textMuted={textMuted} items={[
                      { label: 'Company Name', value: memberData.profile.company_name },
                      { label: 'Company Type', value: memberData.profile.company_type },
                      { label: 'Address', value: `${memberData.profile.address || 'N/A'} - ${memberData.profile.pincode || 'N/A'}`, full: true },
                    ]} />
                  </div>
                </>
              )}

              {activeTab === 'bank_kyc' && (
                <>
                  <div style={sectionStyle}>
                    <div style={sectionTitle}>Bank Account</div>
                    {memberData.bank ? (
                      <InfoGrid isDark={isDark} border={border} textPrimary={textPrimary} textMuted={textMuted} items={[
                        { label: 'Bank Name', value: memberData.bank.bank_name },
                        { label: 'Account Number', value: memberData.bank.account_number },
                        { label: 'IFSC Code', value: memberData.bank.ifsc_code },
                        { label: 'Account Holder', value: memberData.bank.account_holder_name },
                      ]} />
                    ) : <p style={{ fontSize: 13, color: textMuted, fontStyle: 'italic' }}>No bank details added</p>}
                  </div>
                  <div style={sectionStyle}>
                    <div style={sectionTitle}>KYC Documents</div>
                    {memberData.kyc_docs?.length > 0 ? memberData.kyc_docs.map((doc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: isDark ? '#0a0a0a' : '#fff', marginBottom: 8, border: `1px solid ${border}` }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary, textTransform: 'uppercase' }}>{doc.doc_type}</span>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700, background: doc.verified ? '#10b98115' : '#f59e0b15', color: doc.verified ? '#10b981' : '#f59e0b' }}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    )) : <p style={{ fontSize: 13, color: textMuted, fontStyle: 'italic' }}>No KYC documents uploaded</p>}
                  </div>
                </>
              )}

              {activeTab === 'applications' && (
                <div>
                  {memberData.applications?.length > 0 ? memberData.applications.map((app, i) => (
                    <div key={app.id} style={{ padding: '12px 14px', borderRadius: 14, background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}`, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: `fadeIn 0.3s ease ${i * 50}ms both` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{app.product_name}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>App #{app.app_number} • {new Date(app.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', background: (app.status === 'approved' || app.status === 'disbursed') ? '#10b98115' : '#f59e0b15', color: (app.status === 'approved' || app.status === 'disbursed') ? '#10b981' : '#f59e0b' }}>{app.status}</span>
                        <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary, marginTop: 4 }}>{fmt(app.approved_amount || app.loan_amount || app.credit_limit)}</div>
                      </div>
                    </div>
                  )) : <div style={{ padding: '40px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>No applications submitted yet</div>}
                </div>
              )}

              {activeTab === 'wallet' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 14 }}>
                    {[
                      { label: 'Total Earned', value: fmt(memberData.wallet?.total_earned), color: '#10b981' },
                      { label: 'Available Balance', value: fmt(memberData.wallet?.available_balance), color: accent },
                    ].map((w, i) => (
                      <div key={i} style={{ padding: '16px', borderRadius: 14, background: isDark ? '#111' : '#f8faff', border: `1px solid ${border}` }}>
                        <div style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>{w.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: w.color }}>{w.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={sectionStyle}>
                    <div style={sectionTitle}>Commission Overrides</div>
                    {memberData.commissions?.length > 0 ? memberData.commissions.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: isDark ? '#0a0a0a' : '#fff', marginBottom: 8, border: `1px solid ${border}` }}>
                        <span style={{ fontSize: 12, color: textMuted }}>Level {c.level} Override</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>{fmt(c.amount)}</span>
                      </div>
                    )) : <p style={{ fontSize: 13, color: textMuted, fontStyle: 'italic' }}>No commission overrides recorded yet</p>}
                  </div>
                </>
              )}

              {activeTab === 'direct_team' && (
                <div>
                  {memberData.direct_children?.length > 0 ? memberData.direct_children.map((child, i) => (
                    <div key={child.id} className="child-row" onClick={() => onSelectSubMember?.(child.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, border: `1px solid ${border}`, marginBottom: 10, cursor: 'pointer', transition: 'background 0.2s', animation: `fadeIn 0.3s ease ${i * 50}ms both` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent + '15', border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: accent, fontSize: 12 }}>
                          {child.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{child.name}</div>
                          <div style={{ fontSize: 11, color: textMuted }}>Code: {child.code}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: accent + '15', color: accent, fontWeight: 700 }}>{child.rank}</span>
                    </div>
                  )) : <div style={{ padding: '40px 0', textAlign: 'center', color: textMuted, fontSize: 13 }}>This member has no direct recruits</div>}
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
