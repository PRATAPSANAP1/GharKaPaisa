import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import ChangePasswordWidget from './ChangePasswordWidget';
import { 
  MdPerson, MdBusinessCenter, MdAccountBalance, MdSecurity,
  MdEdit, MdCheckCircle, MdCreditCard, MdClose
} from 'react-icons/md';

const tabs = [
  { id: 'personal',     label: 'Personal Details',   icon: MdPerson },
  { id: 'professional', label: 'Business Details',   icon: MdBusinessCenter },
  { id: 'bank',         label: 'Bank Details',        icon: MdAccountBalance },
  { id: 'security',     label: 'Security & Access',   icon: MdSecurity },
];

export default function PartnerProfile() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);

  const fetchProfile = usePartnerStore((state) => state.fetchProfile);
  const profile = usePartnerStore((state) => state.profile);
  const isLoading = usePartnerStore((state) => state.isLoading);

  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    company_type: '',
    gst_number: '',
    current_address: '',
    pincode: '',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    nominee_name: '',
    nominee_relation: '',
    nominee_dob: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        company_name: profile.company_name || '',
        company_type: profile.company_type || '',
        gst_number: profile.gst_number || '',
        current_address: profile.current_address || '',
        pincode: profile.pincode || '',
        account_holder_name: profile.account_holder_name || '',
        bank_name: profile.bank_name || '',
        account_number: profile.account_number || '',
        ifsc_code: profile.ifsc_code || '',
        upi_id: profile.upi_id || '',
        nominee_name: profile.nominee_name || '',
        nominee_relation: profile.nominee_relation || '',
        nominee_dob: profile.nominee_dob ? profile.nominee_dob.split('T')[0] : '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || ''
      });
    }
  }, [profile]);

  const [errors, setErrors] = useState({});

  const validateField = (name, val) => {
    let err = '';
    if (name === 'pincode') {
      if (val && !/^[1-9][0-9]{5}$/.test(val)) {
        err = 'Invalid pincode (should be 6 digits)';
      }
    } else if (name === 'gst_number') {
      if (val && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val)) {
        err = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)';
      }
    } else if (name === 'ifsc_code') {
      if (val && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(val)) {
        err = 'Invalid IFSC code (e.g. HDFC0001234)';
      }
    } else if (name === 'upi_id') {
      if (val && !/^[\w.-]+@[\w.-]+$/.test(val)) {
        err = 'Invalid UPI ID (e.g. username@upi)';
      }
    } else if (name === 'nominee_dob') {
      if (val && new Date(val) > new Date()) {
        err = 'Date of birth cannot be in the future';
      }
    } else if (name === 'emergency_contact_phone') {
      if (val && !/^[6-9][0-9]{9}$/.test(val)) {
        err = 'Invalid mobile number (should be 10 digits)';
      }
    }
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleInputChange = (name, val) => {
    setEditForm(prev => ({ ...prev, [name]: val }));
    validateField(name, val);
  };

  const hasErrors = Object.values(errors).some(err => err !== '');

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (hasErrors) {
      alert('Please correct all validation errors before saving.');
      return;
    }
    setEditLoading(true);
    try {
      await api.put(`/Partners/${profile.id}/profile`, editForm);
      await fetchProfile();
      setIsEditing(false);
      alert('Profile and bank details updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile photo must be under 2MB');
      return;
    }
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await api.post('/partner/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfile();
      alert('Profile photo updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload photo');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      alert('Only PNG, JPEG and WebP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2MB');
      return;
    }
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await api.post('/partner/profile/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchProfile();
      alert('Company logo updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload logo');
    }
  };

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
    return <p style={{ color: C.red, padding: 24 }}>{t("Failed to load profile.")}</p>;
  }

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
          <div 
            style={{
              width: 96, height: 96, borderRadius: '50%', background: C.card,
              border: `4px solid ${C.card}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              position: 'relative', cursor: 'pointer', overflow: 'hidden'
            }} 
            onClick={() => document.getElementById('avatar-upload-input').click()}
          >
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: C.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary
              }}>
                <MdPerson size={52} />
              </div>
            )}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              color: '#fff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%', textAlign: 'center', padding: '4px'
            }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0}>
              Change Photo
            </div>
            <input type="file" id="avatar-upload-input" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          </div>

          {/* Name & badges */}
          <div style={{ flex: 1, minWidth: 200, paddingBottom: 4 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 8px' }}>
              {profile.first_name} {profile.last_name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: '13px',
                color: C.primary, background: `${C.primary}15`, padding: '4px 12px',
                borderRadius: '8px', border: `1px solid ${C.primary}30`
              }}>
                {profile.partner_code || profile.Partner_code}
              </span>
              <span style={{ ...S.tag(kycTagColor), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {profile.kyc_status === 'approved' && <MdCheckCircle size={13} />}
                KYC: {profile.kyc_status}
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button onClick={() => setIsEditing(true)} style={{
            ...S.btn('outline'), padding: '8px 18px', fontSize: '13px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer'
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={sectionCard}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdPerson style={{ color: C.primary }} /> Personal Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px 40px' }}>
                  <div>
                    <p style={fieldLabel}>{t("Email Address")}</p>
                    <p style={fieldValue}>{profile.email || '—'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>{t("Mobile Number")}</p>
                    <p style={fieldValue}>{profile.mobile}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={fieldLabel}>{t("Residential Address")}</p>
                    <p style={fieldValue}>{profile.current_address || '—'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>{t("Pincode")}</p>
                    <p style={fieldValue}>{profile.pincode || '—'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>{t("KYC Status")}</p>
                    <p style={{ ...fieldValue, textTransform: 'capitalize', color: kycTagColor }}>{profile.kyc_status}</p>
                  </div>
                </div>
              </div>

              {/* Nominee details card */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  👤 Nominee Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px 40px' }}>
                  <div>
                    <p style={fieldLabel}>{t("Nominee Name")}</p>
                    <p style={fieldValue}>{profile.nominee_name || '—'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>{t("Relation")}</p>
                    <p style={fieldValue}>{profile.nominee_relation || '—'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>{t("Date of Birth")}</p>
                    <p style={fieldValue}>{profile.nominee_dob ? new Date(profile.nominee_dob).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency contact card */}
              <div style={sectionCard}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🚨 Emergency Contact
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px 40px' }}>
                  <div>
                    <p style={fieldLabel}>{t("Contact Name")}</p>
                    <p style={fieldValue}>{profile.emergency_contact_name || '—'}</p>
                  </div>
                  <div>
                    <p style={fieldLabel}>{t("Mobile Number")}</p>
                    <p style={fieldValue}>{profile.emergency_contact_phone || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={sectionCard}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdBusinessCenter style={{ color: C.primary }} /> Business Details
                </h3>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Business Logo Section */}
                  <div style={{
                    width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                  }}>
                    <div style={{
                      width: '90px', height: '90px', borderRadius: '16px', border: `1.5px dashed ${C.border}`,
                      background: C.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', cursor: 'pointer', position: 'relative'
                    }} onClick={() => document.getElementById('logo-upload-input').click()}>
                      {profile.company_logo_url ? (
                        <img src={profile.company_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '4px', color: C.textLight }}>
                          <MdBusinessCenter size={28} style={{ color: C.textLight }} />
                          <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>Upload Logo</div>
                        </div>
                      )}
                    </div>
                    <input type="file" id="logo-upload-input" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  </div>

                  {/* Business Info Grid */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px 40px' }}>
                    <div>
                      <p style={fieldLabel}>{t("Company / Agency Name")}</p>
                      <p style={fieldValue}>{profile.company_name || 'Individual Freelancer'}</p>
                    </div>
                    <div>
                      <p style={fieldLabel}>{t("Entity Type")}</p>
                      <p style={fieldValue}>{profile.company_type || 'Sole Proprietor'}</p>
                    </div>
                    <div>
                      <p style={fieldLabel}>{t("GST Number")}</p>
                      <p style={{ ...fieldValue, fontFamily: 'monospace', background: C.bgSecondary, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                        {profile.gst_number || 'Not Registered'}
                      </p>
                    </div>
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
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>
                        {profile.bank_name || 'No Bank Linked'}
                      </h4>
                      <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0' }}>{t("Payout Account")}</p>
                    </div>
                    {profile.bank_verified !== undefined && (
                      <span style={S.tag(profile.bank_verified ? C.green : C.gold)}>
                        {profile.bank_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    )}
                  </div>

                  <div style={{
                    marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}`,
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
                  }}>
                    <div>
                      <p style={fieldLabel}>{t("Account Number")}</p>
                      <p style={{ ...fieldValue, fontFamily: 'monospace' }}>
                        {profile.account_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p style={fieldLabel}>{t("IFSC Code")}</p>
                      <p style={{ ...fieldValue, fontFamily: 'monospace' }}>
                        {profile.ifsc_code || '—'}
                      </p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={fieldLabel}>{t("Account Holder Name")}</p>
                      <p style={fieldValue}>
                        {profile.account_holder_name || `${profile.first_name} ${profile.last_name}`}
                      </p>
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
              <p style={{ fontSize: '14px', color: C.textLight, margin: '0 0 28px' }}>{t("Update your password to keep your account secure.")}</p>
              <ChangePasswordWidget />
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px 28px',
            width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>{t("Edit Account & Bank Details")}</h3>
                <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0' }}>Update your personal profile, business info, and bank account for payouts.</p>
              </div>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid }}>
                <MdClose size={22} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(() => {
                const isKycApproved = profile.kyc_status === 'approved';
                const isBankVerified = profile.bank_verified === true;

                return (
                  <>
                    {/* 1. Personal & Contact Details */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                        👤 Personal & Contact Info {isKycApproved && <span style={{ color: C.green, textTransform: 'none', fontSize: '11px' }}>(Locked via approved KYC)</span>}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("First Name")}</label>
                          <input type="text" value={editForm.first_name} onChange={e => handleInputChange('first_name', e.target.value)} style={{ ...S.input, padding: '10px' }} required disabled={isKycApproved} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Last Name")}</label>
                          <input type="text" value={editForm.last_name} onChange={e => handleInputChange('last_name', e.target.value)} style={{ ...S.input, padding: '10px' }} required disabled={isKycApproved} />
                        </div>
                      </div>
                    </div>

                    {/* 2. Business & Tax Info */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                        🏢 Business & GST Details {isKycApproved && <span style={{ color: C.green, textTransform: 'none', fontSize: '11px' }}>(Locked via approved KYC)</span>}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Company / Agency Name")}</label>
                          <input type="text" value={editForm.company_name} onChange={e => handleInputChange('company_name', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="e.g. Acme Financials" disabled={isKycApproved} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("GST Number")}</label>
                          <input type="text" value={editForm.gst_number} onChange={e => handleInputChange('gst_number', e.target.value.toUpperCase())} style={{ ...S.input, padding: '10px', fontFamily: 'monospace', borderColor: errors.gst_number ? C.red : C.border }} placeholder="22AAAAA0000A1Z5" disabled={isKycApproved} />
                          {errors.gst_number && <span style={{ fontSize: '10.5px', color: C.red, fontWeight: 750, marginTop: '2px' }}>{errors.gst_number}</span>}
                        </div>
                      </div>
                    </div>

                    {/* 3. Address & Location */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                        📍 Residential Address
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Address")}</label>
                          <input type="text" value={editForm.current_address} onChange={e => handleInputChange('current_address', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="House/Flat No, Street, Landmark" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Pincode")}</label>
                          <input type="text" value={editForm.pincode} onChange={e => handleInputChange('pincode', e.target.value)} style={{ ...S.input, padding: '10px', borderColor: errors.pincode ? C.red : C.border }} placeholder="400001" />
                          {errors.pincode && <span style={{ fontSize: '10.5px', color: C.red, fontWeight: 750, marginTop: '2px' }}>{errors.pincode}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Nominee details form section */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                        👤 Nominee Details
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Nominee Name")}</label>
                          <input type="text" value={editForm.nominee_name} onChange={e => handleInputChange('nominee_name', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="Nominee Full Name" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Relation")}</label>
                          <input type="text" value={editForm.nominee_relation} onChange={e => handleInputChange('nominee_relation', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="e.g. Spouse, Father" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Date of Birth")}</label>
                          <input type="date" value={editForm.nominee_dob} onChange={e => handleInputChange('nominee_dob', e.target.value)} style={{ ...S.input, padding: '10px', borderColor: errors.nominee_dob ? C.red : C.border }} />
                          {errors.nominee_dob && <span style={{ fontSize: '10.5px', color: C.red, fontWeight: 750, marginTop: '2px' }}>{errors.nominee_dob}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact form section */}
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                        🚨 Emergency Contact Info
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Contact Name")}</label>
                          <input type="text" value={editForm.emergency_contact_name} onChange={e => handleInputChange('emergency_contact_name', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="Contact Full Name" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Contact Phone")}</label>
                          <input type="text" value={editForm.emergency_contact_phone} onChange={e => handleInputChange('emergency_contact_phone', e.target.value)} style={{ ...S.input, padding: '10px', borderColor: errors.emergency_contact_phone ? C.red : C.border }} placeholder="Mobile Number" />
                          {errors.emergency_contact_phone && <span style={{ fontSize: '10.5px', color: C.red, fontWeight: 750, marginTop: '2px' }}>{errors.emergency_contact_phone}</span>}
                        </div>
                      </div>
                    </div>

                    {/* 4. Registered Bank Details for Payouts */}
                    <div style={{ background: C.bgSecondary, padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
                        🏦 Bank Account Details (For Payouts) {isBankVerified && <span style={{ color: C.green, textTransform: 'none', fontSize: '11px' }}>(Locked via verification)</span>}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Account Holder Name")}</label>
                          <input type="text" value={editForm.account_holder_name} onChange={e => handleInputChange('account_holder_name', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="As printed on Passbook/Cheque" disabled={isBankVerified} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Bank Name")}</label>
                          <input type="text" value={editForm.bank_name} onChange={e => handleInputChange('bank_name', e.target.value)} style={{ ...S.input, padding: '10px' }} placeholder="e.g. HDFC Bank, ICICI Bank" disabled={isBankVerified} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("IFSC Code")}</label>
                          <input type="text" value={editForm.ifsc_code} onChange={e => handleInputChange('ifsc_code', e.target.value.toUpperCase())} style={{ ...S.input, padding: '10px', fontFamily: 'monospace', borderColor: errors.ifsc_code ? C.red : C.border }} placeholder="HDFC0001234" disabled={isBankVerified} />
                          {errors.ifsc_code && <span style={{ fontSize: '10.5px', color: C.red, fontWeight: 750, marginTop: '2px' }}>{errors.ifsc_code}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("Account Number")}</label>
                          <input type="password" value={editForm.account_number} onChange={e => handleInputChange('account_number', e.target.value)} style={{ ...S.input, padding: '10px', fontFamily: 'monospace' }} placeholder="Account Number" disabled={isBankVerified} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>{t("UPI ID (Optional)")}</label>
                          <input type="text" value={editForm.upi_id} onChange={e => handleInputChange('upi_id', e.target.value)} style={{ ...S.input, padding: '10px', borderColor: errors.upi_id ? C.red : C.border }} placeholder="username@upi" />
                          {errors.upi_id && <span style={{ fontSize: '10.5px', color: C.red, fontWeight: 750, marginTop: '2px' }}>{errors.upi_id}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" onClick={() => setIsEditing(false)} style={{ ...S.btn('outline'), padding: '10px 18px', fontSize: '13px' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={editLoading || hasErrors} style={{
                        ...S.btn('primary'), padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                        background: hasErrors ? C.bgSecondary : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                        color: hasErrors ? C.textLight : '#fff',
                        opacity: hasErrors ? 0.6 : 1,
                        cursor: hasErrors ? 'not-allowed' : 'pointer'
                      }}>
                        {editLoading ? 'Saving Details...' : 'Save Profile & Bank Details'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
