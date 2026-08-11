import React, { useState, useEffect } from 'react';
import { 
  MdLockReset, MdCheckCircle, MdVpnKey, MdVerifiedUser, 
  MdBusinessCenter, MdAccountBalance, MdCreditCard, MdFileUpload, 
  MdArrowForward, MdArrowBack, MdPerson, MdPhoneAndroid, MdEmail
} from 'react-icons/md';
import api from '../../../services/api';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { getMe } from '../../../services/auth.api';

const DRAFT_KEY = 'team_member_onboarding_draft_v1';

export default function TeamMemberOnboardingModal({ isOpen, onClose }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [step, setStep] = useState(1); // 1: Password, 2: Verification, 3: Registration/KYC, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1 State: Password
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Step 2 State: OTP Verification
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileTimer, setMobileTimer] = useState(0);
  const [emailTimer, setEmailTimer] = useState(0);

  // Step 3 State: Full Registration & KYC Fields
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    company_name: '',
    company_type: 'Individual',
    current_address: '',
    pincode: '',
    business_location: '',
    gst_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    pan_number: ''
  });

  // Document files
  const [panFile, setPanFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);

  // Pre-fill user data and restore local draft
  useEffect(() => {
    if (user) {
      const names = (user.full_name || '').split(' ');
      const fname = user.first_name || names[0] || '';
      const lname = user.last_name || names.slice(1).join(' ') || '';

      const savedDraft = localStorage.getItem(DRAFT_KEY);
      let draftData = {};
      if (savedDraft) {
        try { draftData = JSON.parse(savedDraft); } catch (e) { /* ignore */ }
      }

      setForm({
        first_name: draftData.first_name || fname,
        last_name: draftData.last_name || lname,
        mobile: draftData.mobile || user.mobile || '',
        email: draftData.email || user.email || '',
        company_name: draftData.company_name || '',
        company_type: draftData.company_type || 'Individual',
        current_address: draftData.current_address || '',
        pincode: draftData.pincode || '',
        business_location: draftData.business_location || '',
        gst_number: draftData.gst_number || '',
        bank_name: draftData.bank_name || '',
        account_number: draftData.account_number || '',
        ifsc_code: draftData.ifsc_code || '',
        account_holder_name: draftData.account_holder_name || `${fname} ${lname}`.trim(),
        pan_number: draftData.pan_number || ''
      });
    }
  }, [user]);

  // Save form draft across reloads
  useEffect(() => {
    if (form.first_name || form.company_name || form.pan_number) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }
  }, [form]);

  // Timers for OTP resend
  useEffect(() => {
    let t1, t2;
    if (mobileTimer > 0) t1 = setInterval(() => setMobileTimer(m => m - 1), 1000);
    if (emailTimer > 0) t2 = setInterval(() => setEmailTimer(e => e - 1), 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [mobileTimer, emailTimer]);

  if (!isOpen) return null;

  const handleInputChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  };

  // ── Step 1: Change Password Handler ──────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!passwords.newPassword || passwords.newPassword.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }

    setStep(2);
  };

  // ── Step 2: OTP Handlers ────────────────────────────────────────────────
  const sendMobileOtp = async () => {
    if (!form.mobile) return setError('Mobile number required.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { identity: form.mobile.trim() });
      setMobileOtpSent(true);
      setMobileTimer(60);
      setSuccessMsg('OTP sent to mobile number.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send mobile OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length < 4) return setError('Enter valid mobile OTP.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { identity: form.mobile.trim(), otp: mobileOtp });
      setMobileVerified(true);
      setSuccessMsg('Mobile number verified successfully!');
    } catch (err) {
      setMobileVerified(false);
      setError(err.response?.data?.message || 'Invalid mobile OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    if (!form.email) return setError('Email address required.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { identity: form.email.trim() });
      setEmailOtpSent(true);
      setEmailTimer(60);
      setSuccessMsg('OTP sent to email address.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 4) return setError('Enter valid email OTP.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { identity: form.email.trim(), otp: emailOtp });
      setEmailVerified(true);
      setSuccessMsg('Email address verified successfully!');
    } catch (err) {
      setEmailVerified(false);
      setError(err.response?.data?.message || 'Invalid email OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOrProceedVerification = () => {
    setStep(3);
    setError('');
    setSuccessMsg('');
  };

  // ── Step 3: Complete Registration & KYC Handler ──────────────────────────
  const handleFinalOnboardingSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.first_name || !form.last_name) {
      return setError('First Name and Last Name are required.');
    }
    if (!form.pan_number || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan_number.toUpperCase())) {
      return setError('Please enter a valid 10-digit PAN number (e.g. ABCDE1234F).');
    }
    if (form.pincode && !/^[1-9][0-9]{5}$/.test(form.pincode)) {
      return setError('Pincode must be 6 digits.');
    }
    if (form.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code.toUpperCase())) {
      return setError('Please enter a valid IFSC code (e.g. HDFC0001234).');
    }

    setLoading(true);

    try {
      // 1. Submit text payload to complete team onboarding
      const payload = {
        newPassword: passwords.newPassword,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        company_name: form.company_name.trim(),
        company_type: form.company_type,
        current_address: form.current_address.trim(),
        pincode: form.pincode.trim(),
        business_location: form.business_location.trim(),
        gst_number: form.gst_number.trim().toUpperCase(),
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        ifsc_code: form.ifsc_code.trim().toUpperCase(),
        account_holder_name: form.account_holder_name.trim(),
        pan_number: form.pan_number.trim().toUpperCase()
      };

      const res = await api.post('/partner/team/complete-onboarding', payload);

      // 2. Clear local draft
      localStorage.removeItem(DRAFT_KEY);

      // 4. Refresh user in AuthStore
      const freshUser = await getMe(true);
      updateUser({
        ...freshUser,
        must_change_password: false,
        onboarding_required: false,
        status: 'active'
      });

      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
    padding: '16px', overflowY: 'auto'
  };

  const modalStyle = {
    background: C.card, borderRadius: '24px', width: '100%', maxWidth: '680px',
    maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
    border: `1.5px solid ${C.border}`, display: 'flex', flexDirection: 'column'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          padding: '24px 28px', color: '#ffffff', borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MdVerifiedUser size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>Team Member Account Setup</h2>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: '4px 0 0' }}>
                Complete your password change, verification, and KYC profile
              </p>
            </div>
          </div>

          {/* Stepper Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)'
          }}>
            {[
              { num: 1, label: 'Password' },
              { num: 2, label: 'Verify' },
              { num: 3, label: 'Registration & KYC' },
              { num: 4, label: 'Complete' }
            ].map(s => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step >= s.num ? 1 : 0.5 }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: step >= s.num ? '#ffffff' : 'transparent',
                  color: step >= s.num ? C.primary : '#ffffff',
                  border: '2px solid #ffffff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '12px', fontWeight: 900
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, display: window.innerWidth < 480 && s.num !== step ? 'none' : 'inline' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5',
              padding: '12px 16px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 600
            }}>
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC',
              padding: '12px 16px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 600
            }}>
              ✓ {successMsg}
            </div>
          )}

          {/* STEP 1: Set New Password */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: C.text }}>
                  🔒 Step 1: Set Your New Password
                </h4>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                  You are logging in with a temporary password. Please set a new secure password to activate your team member account.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '6px' }}>
                  New Password <span style={{ color: C.red }}>*</span>
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  style={{ ...S.input, padding: '12px 16px', borderRadius: '12px' }}
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '6px' }}>
                  Confirm New Password <span style={{ color: C.red }}>*</span>
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  style={{ ...S.input, padding: '12px 16px', borderRadius: '12px' }}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  ...S.btn('primary'), padding: '14px', borderRadius: '12px',
                  fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                Continue to Verification <MdArrowForward size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: Mobile & Email Verification */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: C.text }}>
                  📱 Step 2: Contact Verification
                </h4>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                  Verify your mobile number and email address to receive important updates and commissions.
                </p>
              </div>

              {/* Mobile Verification Block */}
              <div style={{ border: `1px solid ${C.border}`, padding: '16px', borderRadius: '14px', background: C.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdPhoneAndroid size={22} style={{ color: C.primary }} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Mobile: {form.mobile}</span>
                  </div>
                  {mobileVerified ? (
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={sendMobileOtp}
                      disabled={loading || mobileTimer > 0}
                      style={{ background: C.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {mobileTimer > 0 ? `Resend (${mobileTimer}s)` : mobileOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {mobileOtpSent && !mobileVerified && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input
                      type="text"
                      value={mobileOtp}
                      onChange={e => setMobileOtp(e.target.value)}
                      placeholder="Enter Mobile OTP"
                      style={{ ...S.input, flex: 1, padding: '8px 12px', borderRadius: '8px' }}
                    />
                    <button onClick={verifyMobileOtp} style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                      Verify
                    </button>
                  </div>
                )}
              </div>

              {/* Email Verification Block */}
              <div style={{ border: `1px solid ${C.border}`, padding: '16px', borderRadius: '14px', background: C.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdEmail size={22} style={{ color: C.primary }} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Email: {form.email}</span>
                  </div>
                  {emailVerified ? (
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={sendEmailOtp}
                      disabled={loading || emailTimer > 0}
                      style={{ background: C.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {emailTimer > 0 ? `Resend (${emailTimer}s)` : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {emailOtpSent && !emailVerified && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <input
                      type="text"
                      value={emailOtp}
                      onChange={e => setEmailOtp(e.target.value)}
                      placeholder="Enter Email OTP"
                      style={{ ...S.input, flex: 1, padding: '8px 12px', borderRadius: '8px' }}
                    />
                    <button onClick={verifyEmailOtp} style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                      Verify
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ ...S.btn('outline'), padding: '12px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px' }}
                >
                  <MdArrowBack size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleSkipOrProceedVerification}
                  style={{ ...S.btn('primary'), padding: '12px 24px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer' }}
                >
                  Proceed to KYC Form <MdArrowForward size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Complete All Registration & KYC Fields */}
          {step === 3 && (
            <form onSubmit={handleFinalOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>
                  📝 Step 3: Registration Profile & KYC Details
                </h4>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: 0 }}>
                  Fill in all standard registration fields to fully populate your team member profile and KYC.
                </p>
              </div>

              {/* 1. Personal Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: 0 }}>
                  👤 Personal Details
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>First Name *</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={e => handleInputChange('first_name', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Last Name *</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={e => handleInputChange('last_name', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Business Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: 0 }}>
                  🏢 Business Details
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Company / Agency Name</label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={e => handleInputChange('company_name', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      placeholder="e.g. GharKaPaisa Agency"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Entity Type</label>
                    <select
                      value={form.company_type}
                      onChange={e => handleInputChange('company_type', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                    >
                      <option value="Individual">Individual Freelancer</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Partnership">Partnership</option>
                      <option value="LLP">LLP</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: window.innerWidth < 600 ? 'span 1' : 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Address</label>
                    <input
                      type="text"
                      value={form.current_address}
                      onChange={e => handleInputChange('current_address', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      placeholder="Flat/House No, Street, Landmark"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Pincode</label>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={e => handleInputChange('pincode', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      placeholder="6-digit pincode"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>City / Location</label>
                    <input
                      type="text"
                      value={form.business_location}
                      onChange={e => handleInputChange('business_location', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      placeholder="City or State"
                    />
                  </div>
                  <div style={{ gridColumn: window.innerWidth < 600 ? 'span 1' : 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>GST Number (Optional)</label>
                    <input
                      type="text"
                      value={form.gst_number}
                      onChange={e => handleInputChange('gst_number', e.target.value.toUpperCase())}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px', fontFamily: 'monospace' }}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Bank Account Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: 0 }}>
                  🏦 Bank Details (For Payouts)
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: window.innerWidth < 600 ? 'span 1' : 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Account Holder Name</label>
                    <input
                      type="text"
                      value={form.account_holder_name}
                      onChange={e => handleInputChange('account_holder_name', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      placeholder="As on Bank Passbook/Cheque"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Bank Name</label>
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={e => handleInputChange('bank_name', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px' }}
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>IFSC Code</label>
                    <input
                      type="text"
                      value={form.ifsc_code}
                      onChange={e => handleInputChange('ifsc_code', e.target.value.toUpperCase())}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px', fontFamily: 'monospace' }}
                      placeholder="HDFC0001234"
                    />
                  </div>
                  <div style={{ gridColumn: window.innerWidth < 600 ? 'span 1' : 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Account Number</label>
                    <input
                      type="password"
                      value={form.account_number}
                      onChange={e => handleInputChange('account_number', e.target.value)}
                      style={{ ...S.input, padding: '10px 12px', borderRadius: '10px', fontFamily: 'monospace' }}
                      placeholder="Account Number"
                    />
                  </div>
                </div>
              </div>

              {/* 4. KYC Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', margin: 0 }}>
                  📄 KYC Details
                </h5>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>PAN Card Number *</label>
                  <input
                    type="text"
                    value={form.pan_number}
                    onChange={e => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    style={{ ...S.input, padding: '10px 12px', borderRadius: '10px', fontFamily: 'monospace' }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ ...S.btn('outline'), padding: '12px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px' }}
                >
                  <MdArrowBack size={18} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...S.btn('primary'), padding: '14px 28px', borderRadius: '12px',
                    fontWeight: 900, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                    color: '#ffffff', boxShadow: `0 4px 14px ${C.primary}40`
                  }}
                >
                  {loading ? 'Submitting Setup...' : 'Complete Account & KYC Setup'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Celebration Success Screen */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
              }}>
                <MdCheckCircle size={48} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>
                Account Setup Completed! 🎉
              </h3>
              <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.6, maxWidth: '440px', margin: '0 0 24px 0' }}>
                Your password, contact details, profile, and KYC information have been successfully updated. You can now access your partner team member dashboard.
              </p>
              <button
                onClick={async () => {
                  try {
                    const freshUser = await getMe(true);
                    updateUser({ ...freshUser, must_change_password: false, onboarding_required: false, status: 'active' });
                  } catch (e) {}
                  onClose();
                }}
                style={{
                  ...S.btn('primary'), padding: '14px 32px', borderRadius: '12px',
                  fontWeight: 900, fontSize: '15px', border: 'none', cursor: 'pointer'
                }}
              >
                Go to Team Member Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
