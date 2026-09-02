import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaArrowLeft, FaBriefcase, FaGraduationCap, FaUser, FaEnvelope, 
  FaPhone, FaCheckCircle, FaFileAlt, FaLock, FaBuilding, FaMoneyBillWave 
} from 'react-icons/fa';
import axios from 'axios';
import { useMsg91OTP } from '../../hooks/useMsg91OTP';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../../services/auth.api';
import { getApiV1Url } from '../../config/api';

export default function InterviewRegistration() {
  const { C } = useTheme();
  const navigate = useNavigate();

  // MSG91 SDK hook (matching PartnerRegister)
  const { sdkReady } = useMsg91OTP();
  const [mobileOtpRequestId, setMobileOtpRequestId] = useState("");

  const getMsg91RequestId = (data) => {
    const candidates = [
      data?.requestId,
      data?.request_id,
      data?.reqId,
      data?.otpRequestId,
      data?.message,
      data?.data?.requestId,
      data?.data?.request_id,
      data?.data?.reqId,
      data?.data?.otpRequestId,
      data?.data?.message,
    ];
    return candidates
      .map(value => String(value || '').trim())
      .find(value => /^[A-Za-z0-9_-]{8,}$/.test(value)) || "";
  };

  const [step, setStep] = useState(1); // 1: Registration Form & Real-time Verification, 3: Success Code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  // Mobile OTP States
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpTimer, setMobileOtpTimer] = useState(0);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileVerifyLoading, setMobileVerifyLoading] = useState(false);
  const [mobilePreVerified, setMobilePreVerified] = useState(false);

  // Email OTP States
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailPreVerified, setEmailPreVerified] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    email_id: '',
    date_of_birth: '',
    current_address: '',
    highest_qualification: 'Graduate',
    passing_year: '2022',
    experience_type: 'Fresher',
    total_experience_years: '0',
    current_company: '',
    current_designation: '',
    last_salary_ctc: '',
    expected_salary: '',
    immediate_joining: true,
    notice_period_days: '0',
    comfortable_with_location: true,
    relevant_experience: true,
    how_did_you_hear: 'WorkIndia / Job Portal',
    hr_name: '',
    target_role: 'Financial Sales Executive'
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [referredByCode, setReferredByCode] = useState('');

  // Check for referral code in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') || params.get('referral_code') || params.get('token');
    if (refParam) {
      setReferredByCode(refParam);
      setFormData(prev => ({
        ...prev,
        how_did_you_hear: 'Employee Reference',
        hr_name: refParam
      }));
    }
  }, []);

  // Timers countdown
  useEffect(() => {
    let t;
    if (mobileOtpTimer > 0) t = setTimeout(() => setMobileOtpTimer(mobileOtpTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [mobileOtpTimer]);

  useEffect(() => {
    let t;
    if (emailOtpTimer > 0) t = setTimeout(() => setEmailOtpTimer(emailOtpTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [emailOtpTimer]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset verification if mobile or email is altered
    if (name === 'mobile_number') {
      setMobilePreVerified(false);
      setMobileOtpSent(false);
      setMobileOtp('');
      setMobileOtpRequestId('');
    }
    if (name === 'email_id') {
      setEmailPreVerified(false);
      setEmailOtpSent(false);
      setEmailOtp('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  // ── Send Mobile OTP (MSG91 Widget + Backend Fallback, matching PartnerRegister) ──
  const handleSendMobileOtp = async () => {
    setError('');
    setInfoMsg('');
    const mob = formData.mobile_number.trim();
    if (!mob || !/^[6-9]\d{9}$/.test(mob)) {
      setError('Please enter a valid 10-digit mobile number before sending OTP.');
      return;
    }

    setMobileOtpLoading(true);
    const formattedMobile = '91' + mob;

    if (sdkReady && typeof window.sendOtp === 'function') {
      try {
        window.sendOtp(
          formattedMobile,
          (data) => {
            const reqId = getMsg91RequestId(data);
            if (reqId) setMobileOtpRequestId(reqId);
            setMobileOtpSent(true);
            setMobileOtpTimer(60);
            setMobileOtpLoading(false);
            setInfoMsg('Verification OTP dispatched to your Mobile number!');
          },
          async (sdkErr) => {
            console.warn('[MSG91 SDK Notice] sendOtp failed, calling backend fallback:', sdkErr);
            try {
              await axios.post(`${getApiV1Url()}/public/careers/verify-mobile`, { mobile_number: mob });
            } catch (e) {}
            setMobileOtpSent(true);
            setMobileOtpTimer(60);
            setMobileOtpLoading(false);
            setInfoMsg('Verification OTP dispatched to your Mobile number!');
          }
        );
        return;
      } catch (err) {
        console.warn('MSG91 SDK sendOtp exception, falling back to backend API:', err);
      }
    }

    // Direct backend API fallback
    try {
      await axios.post(`${getApiV1Url()}/public/careers/verify-mobile`, { mobile_number: mob });
      setMobileOtpSent(true);
      setMobileOtpTimer(60);
      setInfoMsg('Verification OTP dispatched to your Mobile number!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setMobileOtpLoading(false);
    }
  };

  // ── Verify Mobile OTP (MSG91 Widget + Backend Fallback, matching PartnerRegister) ──
  const handleVerifyMobileOtp = async (valToVerify) => {
    const code = valToVerify || mobileOtp;
    if (!code || String(code).trim().length < 6) {
      setError('Please enter the 6-digit Mobile OTP code.');
      return;
    }

    setError('');
    setInfoMsg('');
    setMobileVerifyLoading(true);

    const finishMobileVerification = () => {
      setMobilePreVerified(true);
      setMobileOtpSent(false);
      setMobileVerifyLoading(false);
      setInfoMsg('✓ Mobile number successfully verified!');
    };

    if (typeof window.verifyOtp === 'function') {
      const verifyArgs = [
        Number(String(code).trim()),
        (data) => {
          finishMobileVerification();
        },
        async (sdkErr) => {
          console.warn('[MSG91 SDK Notice] verifyOtp failed, trying backend verification:', sdkErr);
          try {
            const res = await axios.post(`${getApiV1Url()}/public/careers/verify-otp`, {
              mobile_number: formData.mobile_number.trim(),
              mobile_otp: String(code).trim(),
              type: 'mobile'
            });
            if (res.data.success) {
              finishMobileVerification();
              return;
            }
          } catch (backendErr) {
            setError(backendErr.response?.data?.message || 'Invalid Mobile OTP. Please try again.');
            setMobileVerifyLoading(false);
          }
        }
      ];
      if (mobileOtpRequestId) verifyArgs.push(mobileOtpRequestId);
      try {
        window.verifyOtp(...verifyArgs);
        return;
      } catch (err) {
        console.warn('MSG91 SDK verifyOtp exception, trying backend verification:', err);
      }
    }

    try {
      const res = await axios.post(`${getApiV1Url()}/public/careers/verify-otp`, {
        mobile_number: formData.mobile_number.trim(),
        mobile_otp: String(code).trim(),
        type: 'mobile'
      });
      if (res.data.success) {
        finishMobileVerification();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Mobile OTP. Please try again.');
      setMobileVerifyLoading(false);
    }
  };

  // ── Send Email OTP (Identical to PartnerRegister) ──
  const handleSendEmailOtp = async () => {
    setError('');
    setInfoMsg('');
    const em = formData.email_id.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError('Please enter a valid Email address before sending OTP.');
      return;
    }

    setEmailOtpLoading(true);
    try {
      await axios.post(`${getApiV1Url()}/public/careers/verify-email`, { email_id: em });
      setEmailOtpSent(true);
      setEmailOtpTimer(60);
      setInfoMsg('OTP sent to your email address.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // ── Verify Email OTP (Identical to PartnerRegister) ──
  const handleVerifyEmailOtp = async (valToVerify) => {
    const code = valToVerify || emailOtp;
    if (!code || String(code).trim().length < 6) {
      setError('Please enter the 6-digit Email OTP code.');
      return;
    }

    setError('');
    setInfoMsg('');
    setEmailVerifyLoading(true);

    try {
      await verifyRegistrationOtp(formData.email_id.trim(), String(code).trim());
      setEmailPreVerified(true);
      setEmailOtpSent(false);
      setEmailOtpTimer(0);
      setInfoMsg('✓ Email address successfully verified!');
    } catch (err) {
      try {
        const res = await axios.post(`${getApiV1Url()}/public/careers/verify-otp`, {
          email_id: formData.email_id.trim(),
          email_otp: String(code).trim(),
          type: 'email'
        });
        if (res.data?.success) {
          setEmailPreVerified(true);
          setEmailOtpSent(false);
          setEmailOtpTimer(0);
          setInfoMsg('✓ Email address successfully verified!');
          return;
        }
      } catch (publicErr) {
        setError(err.message || publicErr.response?.data?.message || 'Incorrect OTP. Please try again.');
      }
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  // ── Final Registration Submission ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!formData.full_name || !formData.mobile_number || !formData.email_id) {
      setError('Please fill in all required personal details (Full Name, Mobile, Email).');
      return;
    }

    if (!mobilePreVerified) {
      setError('Please verify your Mobile Number with OTP before submitting.');
      return;
    }

    if (!emailPreVerified) {
      setError('Please verify your Email Address with OTP before submitting.');
      return;
    }

    if (formData.how_did_you_hear === 'Employee Reference' && !formData.hr_name) {
      setError('Please enter the Referring Employee Name / ID.');
      return;
    }

    if (formData.how_did_you_hear === 'Other' && !formData.hr_name) {
      setError('Please enter the HR Name / Reference Details.');
      return;
    }

    if (!resumeFile) {
      setError('Resume / CV file is required. Please upload your Resume before completing registration.');
      return;
    }

    setLoading(true);
    try {
      const registerPayload = new FormData();
      Object.keys(formData).forEach(key => {
        registerPayload.append(key, formData[key]);
      });
      if (referredByCode) {
        registerPayload.append('referred_by_employee_id', referredByCode);
        registerPayload.append('ref', referredByCode);
      }
      if (resumeFile) {
        registerPayload.append('resume', resumeFile);
      }

      const regRes = await axios.post(`${getApiV1Url()}/public/careers/register`, registerPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (regRes.data.success) {
        setReferenceCode(regRes.data.data?.reference_code || regRes.data.reference_code);
        setStep(3);
      } else {
        setError(regRes.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '40px 16px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button 
            onClick={() => navigate('/careers')}
            style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', 
              width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.textMid, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Career Portal
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>Candidate Interview Registration</h1>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '14px 18px', borderRadius: '14px', marginBottom: '20px', fontSize: '14px', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('already registered') && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => navigate('/careers/status')} 
                  style={{ background: '#DC2626', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Track Candidate Status →
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/employee/login')} 
                  style={{ background: '#ffffff', border: '1px solid #DC2626', color: '#DC2626', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Login to Employee Portal
                </button>
              </div>
            )}
          </div>
        )}

        {infoMsg && (
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
            {infoMsg}
          </div>
        )}

        {/* STEP 1: Registration Form with Inline Real-time OTP Verification */}
        {step === 1 && (
          <form 
            onSubmit={handleFormSubmit} 
            className="interview-reg-form"
            style={{ 
              background: C.card, 
              border: `1px solid ${C.border}`, 
              borderRadius: '24px', 
              padding: '32px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              boxSizing: 'border-box',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <style>{`
              @media (max-width: 640px) {
                .interview-reg-form {
                  padding: 20px 14px !important;
                  border-radius: 16px !important;
                }
              }
            `}</style>
            
            {/* Referred By Banner */}
            {referredByCode && (
              <div style={{
                background: `${C.teal || '#0F766E'}15`,
                border: `1px solid ${C.teal || '#0F766E'}40`,
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>Employee Referral Applied</div>
                    <div style={{ fontSize: '12px', color: C.textMid }}>You were referred by Employee Code: <strong>{referredByCode}</strong></div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', border: '1px solid #6EE7B7', padding: '4px 10px', borderRadius: '20px' }}>
                  Verified Link
                </span>
              </div>
            )}

            {/* Section 1: Personal Details */}
            <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 20px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
              <FaUser style={{ color: C.teal || '#0F766E' }} /> 1. Personal Details & Contact Verification
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* Full Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Full Name *</label>
                <input 
                  type="text" 
                  name="full_name" 
                  required 
                  value={formData.full_name} 
                  onChange={handleInputChange} 
                  placeholder="Enter full name" 
                  style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, boxSizing: 'border-box' }} 
                />
              </div>

              {/* Mobile Number & Inline OTP */}
              <div style={{ width: '100%', minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Mobile Number *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', width: '100%' }}>
                  <input 
                    type="tel" 
                    name="mobile_number" 
                    required 
                    disabled={mobilePreVerified}
                    value={formData.mobile_number} 
                    onChange={handleInputChange} 
                    placeholder="10 digit mobile number" 
                    style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 12px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, boxSizing: 'border-box' }} 
                  />
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={mobilePreVerified || mobileOtpLoading || (mobileOtpSent && mobileOtpTimer > 0)}
                    style={{
                      background: mobilePreVerified ? '#ECFDF5' : 'rgba(15, 118, 110, 0.1)',
                      color: mobilePreVerified ? '#059669' : C.teal || '#0F766E',
                      border: mobilePreVerified ? '1px solid #6EE7B7' : `1px solid ${C.teal || '#0F766E'}`,
                      borderRadius: '10px',
                      padding: '0 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      cursor: (mobilePreVerified || mobileOtpLoading || (mobileOtpSent && mobileOtpTimer > 0)) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {mobilePreVerified ? '✓ Verified' : mobileOtpSent ? (mobileOtpTimer > 0 ? `Resend in ${mobileOtpTimer}s` : 'Resend OTP') : (mobileOtpLoading ? 'Sending...' : 'Send OTP')}
                  </button>
                </div>

                {/* Inline Mobile OTP Box */}
                {mobileOtpSent && !mobilePreVerified && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'stretch', width: '100%' }}>
                    <input 
                      type="text" 
                      maxLength={6} 
                      value={mobileOtp} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setMobileOtp(val);
                        if (val.length === 6) handleVerifyMobileOtp(val);
                      }} 
                      placeholder="Enter 6-digit Mobile OTP" 
                      style={{ flex: 1, minWidth: 0, width: '100%', padding: '8px 12px', background: C.bgSecondary, border: `1px solid ${C.teal}`, borderRadius: '8px', fontSize: '13px', color: C.text, boxSizing: 'border-box' }} 
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyMobileOtp()}
                      disabled={mobileVerifyLoading || mobileOtp.length < 6}
                      style={{ 
                        background: C.teal || '#0F766E', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '8px', 
                        padding: '0 12px', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        cursor: (mobileVerifyLoading || mobileOtp.length < 6) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {mobileVerifyLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                )}
              </div>

              {/* Email ID & Inline OTP */}
              <div style={{ width: '100%', minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email ID *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', width: '100%' }}>
                  <input 
                    type="email" 
                    name="email_id" 
                    required 
                    disabled={emailPreVerified}
                    value={formData.email_id} 
                    onChange={handleInputChange} 
                    placeholder="name@example.com" 
                    style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 12px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, boxSizing: 'border-box' }} 
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0)}
                    style={{
                      background: emailPreVerified ? '#ECFDF5' : 'rgba(15, 118, 110, 0.1)',
                      color: emailPreVerified ? '#059669' : C.teal || '#0F766E',
                      border: emailPreVerified ? '1px solid #6EE7B7' : `1px solid ${C.teal || '#0F766E'}`,
                      borderRadius: '10px',
                      padding: '0 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      cursor: (emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0)) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {emailPreVerified ? '✓ Verified' : emailOtpSent ? (emailOtpTimer > 0 ? `Resend in ${emailOtpTimer}s` : 'Resend OTP') : (emailOtpLoading ? 'Sending...' : 'Send OTP')}
                  </button>
                </div>

                {/* Inline Email OTP Box */}
                {emailOtpSent && !emailPreVerified && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'stretch', width: '100%' }}>
                    <input 
                      type="text" 
                      maxLength={6} 
                      value={emailOtp} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setEmailOtp(val);
                        if (val.length === 6) handleVerifyEmailOtp(val);
                      }} 
                      placeholder="Enter 6-digit Email OTP" 
                      style={{ flex: 1, minWidth: 0, width: '100%', padding: '8px 12px', background: C.bgSecondary, border: `1px solid ${C.teal}`, borderRadius: '8px', fontSize: '13px', color: C.text, boxSizing: 'border-box' }} 
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyEmailOtp()}
                      disabled={emailVerifyLoading || emailOtp.length < 6}
                      style={{ 
                        background: C.teal || '#0F766E', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '8px', 
                        padding: '0 12px', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        cursor: (emailVerifyLoading || emailOtp.length < 6) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {emailVerifyLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Date of Birth / Age</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Current Address</label>
                <input type="text" name="current_address" value={formData.current_address} onChange={handleInputChange} placeholder="Current City / Area Address" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>
            </div>

            {/* Section 2: Education */}
            <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '24px 0 20px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
              <FaGraduationCap style={{ color: C.teal || '#0F766E' }} /> 2. Education
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Highest Qualification *</label>
                <select name="highest_qualification" value={formData.highest_qualification} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="10th / 12th">10th / 12th Pass</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Graduate">Graduate (BA, BCom, BSc, BTech, BCA)</option>
                  <option value="Post Graduate">Post Graduate (MBA, MTech, MCA, MCom)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Passing Year *</label>
                <input type="number" name="passing_year" required value={formData.passing_year} onChange={handleInputChange} placeholder="e.g. 2022" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>
            </div>

            {/* Section 3: Experience & Job Role Details */}
            <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '24px 0 20px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
              <FaBriefcase style={{ color: C.teal || '#0F766E' }} /> 3. Experience & Job Role Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Target Job Role *</label>
                <select name="target_role" value={formData.target_role} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Financial Sales Executive">Financial Sales Executive</option>
                  <option value="Credit Card Specialist">Credit Card Specialist</option>
                  <option value="Team Leader">Team Leader (TL)</option>
                  <option value="Telecaller">Telecaller (TC)</option>
                  <option value="Customer Support & Verification">Customer Support & Verification</option>
                  <option value="Full Stack React / Node Developer">Full Stack React / Node Developer</option>
                  <option value="Partner Relationship Manager">Partner Relationship Manager</option>
                  <option value="Operations Associate">Operations Associate</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Fresher / Experienced *</label>
                <select name="experience_type" value={formData.experience_type} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Fresher">Fresher</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </div>

              {formData.experience_type === 'Experienced' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Total Experience (Years)</label>
                    <input type="number" step="0.5" name="total_experience_years" value={formData.total_experience_years} onChange={handleInputChange} placeholder="e.g. 2.5" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Current / Last Company</label>
                    <input type="text" name="current_company" value={formData.current_company} onChange={handleInputChange} placeholder="e.g. HDFC / Axis DSA" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Current / Last Designation</label>
                    <input type="text" name="current_designation" value={formData.current_designation} onChange={handleInputChange} placeholder="e.g. Senior Executive" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Last Salary / CTC (Annual ₹)</label>
                    <input type="text" name="last_salary_ctc" value={formData.last_salary_ctc} onChange={handleInputChange} placeholder="e.g. 3,50,000" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Expected Salary (Monthly ₹)</label>
                <input type="text" name="expected_salary" value={formData.expected_salary} onChange={handleInputChange} placeholder="e.g. 25,000" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Available for Immediate Joining? *</label>
                <select name="immediate_joining" value={formData.immediate_joining ? 'Yes' : 'No'} onChange={(e) => setFormData(p => ({ ...p, immediate_joining: e.target.value === 'Yes' }))} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Yes">Yes - Immediate Joining</option>
                  <option value="No">No - Needs Notice Period</option>
                </select>
              </div>

              {!formData.immediate_joining && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Notice Period (Days)</label>
                  <input type="number" name="notice_period_days" value={formData.notice_period_days} onChange={handleInputChange} placeholder="e.g. 15" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Comfortable with job location? *</label>
                <select name="comfortable_with_location" value={formData.comfortable_with_location ? 'Yes' : 'No'} onChange={(e) => setFormData(p => ({ ...p, comfortable_with_location: e.target.value === 'Yes' }))} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Yes">Yes - Comfortable with location</option>
                  <option value="No">No - Prefers Remote / Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Do you have relevant experience? *</label>
                <select name="relevant_experience" value={formData.relevant_experience ? 'Yes' : 'No'} onChange={(e) => setFormData(p => ({ ...p, relevant_experience: e.target.value === 'Yes' }))} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Yes">Yes - Direct Financial Sales Experience</option>
                  <option value="No">No - Related / Fresh Experience</option>
                </select>
              </div>
            </div>

            {/* Section 4: Source & Resume Upload */}
            <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '24px 0 20px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
              <FaFileAlt style={{ color: C.teal || '#0F766E' }} /> 4. Source & Resume Upload
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>How did you hear about this job? *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  'Employee Reference',
                  'WhatsApp',
                  'Instagram',
                  'WorkIndia / Job Portal',
                  'College Reference',
                  'Other'
                ].map((src) => (
                  <label key={src} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: C.bgSecondary, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: '13px', color: C.text }}>
                    <input 
                      type="radio" 
                      name="how_did_you_hear" 
                      value={src} 
                      checked={formData.how_did_you_hear === src} 
                      onChange={handleInputChange} 
                    />
                    {src}
                  </label>
                ))}
              </div>

              {/* Conditional Referring Employee / HR Name field */}
              {(formData.how_did_you_hear === 'Other' || formData.how_did_you_hear === 'Employee Reference') && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    {formData.how_did_you_hear === 'Employee Reference' ? 'Referring Employee Name / Employee ID *' : 'HR Name / Reference Details *'}
                  </label>
                  <input 
                    type="text" 
                    name="hr_name" 
                    required
                    value={formData.hr_name} 
                    onChange={handleInputChange} 
                    placeholder={formData.how_did_you_hear === 'Employee Reference' ? 'Enter Referring Employee Name or Employee ID (e.g. Rahul Sharma / GKP1002)' : 'Enter HR Name or how you heard about this job'} 
                    style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} 
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Resume / CV Upload (PDF / DOCX) *
              </label>
              <input 
                type="file" 
                required 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange} 
                style={{ width: '100%', padding: '10px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} 
              />
            </div>

            <button type="submit" disabled={loading} style={{ background: C.employeePrimary || C.teal || '#0F766E', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', width: '100%', boxShadow: '0 4px 14px rgba(15,118,110,0.3)' }}>
              {loading ? 'Submitting Registration...' : 'Complete Candidate Registration'}
            </button>
          </form>
        )}

        {/* STEP 3: Registration Success & Reference Code Display */}
        {step === 3 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <FaCheckCircle size={56} style={{ color: C.teal, marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>Interview Registration Successful!</h2>
            <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px 0' }}>
              Your application has been registered with our HR Acquisition team.
            </p>

            <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}40`, borderRadius: '16px', padding: '20px', maxWidth: '400px', margin: '0 auto 28px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Your Candidate Reference Code</span>
              <strong style={{ fontSize: '28px', fontWeight: 900, color: C.teal, letterSpacing: '1px' }}>{referenceCode}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate(`/careers/status/${referenceCode}`)} style={{ background: C.teal, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                Check Application Status
              </button>
              <button onClick={() => navigate('/careers')} style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}`, padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                Return to Careers
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
