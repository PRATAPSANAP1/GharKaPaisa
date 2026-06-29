import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import ChangePasswordWidget from './ChangePasswordWidget';
import { 
  MdPerson, MdBusinessCenter, MdAccountBalance, MdSecurity,
  MdEdit, MdCheckCircle, MdSchool, MdWork, MdCreditCard
} from 'react-icons/md';

const tabs = [
  { id: 'personal',     label: 'Personal Details',   icon: MdPerson },
  { id: 'professional', label: 'Professional Info',   icon: MdBusinessCenter },
  { id: 'bank',         label: 'Bank Details',        icon: MdAccountBalance },
  { id: 'security',     label: 'Security & Access',   icon: MdSecurity },
];

export default function PartnerProfile() {
  const { C } = useTheme();
  const S = makeS(C);

  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const isLoading = usePartnerStore((state) => state.isLoading);

  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '256px' }}>
        <span style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `3px solid ${C.border}`, borderTopColor: C.primary,
          animation: 'spin .8s linear infinite', display: 'inline-block'
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) {
    return <p style={{ color: C.red, padding: 24 }}>Failed to load profile.</p>;
  }

  // helpers
  const fieldLabel = { fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' };
  const fieldValue = { fontSize: '15px', fontWeight: 600, color: C.text, margin: 0 };
  const sectionCard = { ...S.card, padding: '28px', borderRadius: '16px' };

  const kycTagColor = profile.kyc_status === 'approved' ? C.green
    : profile.kyc_status === 'rejected' ? C.red : C.gold;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* ───── Profile Header Banner ───── */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
        <div style={{ height: '120px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }} />
        <div style={{
          padding: '0 28px 24px', position: 'relative',
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '20px', marginTop: '-48px'
        }}>
          {/* Avatar */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%', background: C.card,
            border: `4px solid ${C.card}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: C.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary
            }}>
              <MdPerson size={52} />
            </div>
          </div>

          {/* Name & badges */}
          <div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>
              {profile.first_name} {profile.last_name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: '13px',
                color: C.primary, background: `${C.primary}15`, padding: '4px 12px',
                borderRadius: '8px', border: `1px solid ${C.primary}30`
              }}>
                {profile.Partner_code}
              </span>
              <span style={{ ...S.tag(kycTagColor), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {profile.kyc_status === 'approved' && <MdCheckCircle size={13} />}
                KYC: {profile.kyc_status}
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button style={{
            ...S.btn('outline'), padding: '8px 18px', fontSize: '13px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4
          }}>
            <MdEdit size={16} /> Edit Profile
          </button>
        </div>
      </div>

      {/* ───── Tabs + Content ───── */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

        {/* Sidebar Tabs */}
        <aside style={{ width: '220px', flexShrink: 0 }}>
          <div style={{ ...S.card, padding: '8px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(t => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    textAlign: 'left', padding: '12px 16px', borderRadius: '12px',
                    fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : 'transparent',
                    color: isActive ? '#fff' : C.textMid,
                    boxShadow: isActive ? `0 4px 14px ${C.primary}30` : 'none',
                  }}
                >
                  <Icon size={18} /> {t.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content pane */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {activeTab === 'personal' && (
            <div style={sectionCard}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdPerson style={{ color: C.primary }} /> Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px 40px' }}>
                <div>
                  <p style={fieldLabel}>Email Address</p>
                  <p style={fieldValue}>{profile.email || '—'}</p>
                </div>
                <div>
                  <p style={fieldLabel}>Mobile Number</p>
                  <p style={fieldValue}>{profile.mobile}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={fieldLabel}>Residential Address</p>
                  <p style={fieldValue}>{profile.current_address || '—'}</p>
                </div>
                <div>
                  <p style={fieldLabel}>Pincode</p>
                  <p style={fieldValue}>{profile.pincode || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={sectionCard}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdWork style={{ color: C.primary }} /> Business Profile
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px 40px' }}>
                  <div>
                    <p style={fieldLabel}>Company / Agency Name</p>
                    <p style={fieldValue}>{profile.company_name || 'Individual Freelancer'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>Entity Type</p>
                    <p style={fieldValue}>{profile.company_type || 'Sole Proprietor'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>GST Number</p>
                    <p style={{ ...fieldValue, fontFamily: 'monospace', background: C.bgSecondary, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                      {profile.gst_number || 'Not Registered'}
                    </p>
                  </div>
                  <div>
                    <p style={fieldLabel}>Years of Experience</p>
                    <p style={fieldValue}>5+ Years (Mock)</p>
                  </div>
                </div>
              </div>
              <div style={sectionCard}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdSchool style={{ color: C.primary }} /> Educational Qualifications
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px 40px' }}>
                  <div>
                    <p style={fieldLabel}>Highest Degree</p>
                    <p style={fieldValue}>Bachelor of Commerce</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>Institution</p>
                    <p style={fieldValue}>Mumbai University</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div style={sectionCard}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdCreditCard style={{ color: C.primary }} /> Bank Account for Payouts
              </h3>

              <div style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`,
                borderRadius: '14px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: C.card,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.primary, boxShadow: `0 2px 8px rgba(0,0,0,0.06)`, flexShrink: 0
                }}>
                  <MdAccountBalance size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>HDFC Bank Ltd.</h4>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0' }}>Savings Account</p>
                    </div>
                    <span style={S.tag(C.green)}>Verified</span>
                  </div>

                  <div style={{
                    marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}`,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
                  }}>
                    <div>
                      <p style={fieldLabel}>Account Number</p>
                      <p style={{ ...fieldValue, fontFamily: 'monospace' }}>XXXX-XXXX-8921</p>
                    </div>
                    <div>
                      <p style={fieldLabel}>IFSC Code</p>
                      <p style={{ ...fieldValue, fontFamily: 'monospace' }}>HDFC0001234</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={fieldLabel}>Account Holder Name</p>
                      <p style={fieldValue}>{profile.first_name} {profile.last_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: C.textLight, display: 'flex', alignItems: 'center', gap: 4, marginTop: '16px' }}>
                <MdSecurity size={14} /> Bank details are securely stored and encrypted.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={sectionCard}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdSecurity style={{ color: C.text }} /> Security Settings
              </h3>
              <p style={{ fontSize: '14px', color: C.textLight, margin: '0 0 28px' }}>Update your password to keep your account secure.</p>
              <ChangePasswordWidget />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
