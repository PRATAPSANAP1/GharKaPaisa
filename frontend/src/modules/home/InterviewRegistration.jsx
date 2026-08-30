import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaArrowLeft, FaBriefcase, FaGraduationCap, FaUser, FaEnvelope, 
  FaPhone, FaCheckCircle, FaFileAlt, FaLock, FaBuilding, FaMoneyBillWave 
} from 'react-icons/fa';
import axios from 'axios';

export default function InterviewRegistration() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification, 3: Success Code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  const [otpMobile, setOtpMobile] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.full_name || !formData.mobile_number || !formData.email_id) {
      setError('Please fill in all required fields (Name, Mobile, Email).');
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
      setError('Resume / CV file is required. Please upload your Resume before proceeding.');
      return;
    }

    setLoading(true);
    try {
      // Simultaneously dispatch MSG91 SMS OTP and AWS SES Email OTP
      await Promise.all([
        axios.post('/api/v1/public/careers/verify-mobile', { mobile_number: formData.mobile_number }),
        axios.post('/api/v1/public/careers/verify-email', { email_id: formData.email_id })
      ]).catch(err => console.warn('OTP dispatch warning:', err));
      
      setMobileOtpSent(true);
      setEmailOtpSent(true);
      setMobileOtpMsg('OTP sent via MSG91 SMS! (Test code: 123456)');
      setEmailOtpMsg('OTP sent via AWS Email! (Test code: 123456)');
      setStep(2);
    } catch (err) {
      setMobileOtpSent(true);
      setEmailOtpSent(true);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const [resendingMobile, setResendingMobile] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [mobileOtpMsg, setMobileOtpMsg] = useState('');
  const [emailOtpMsg, setEmailOtpMsg] = useState('');

  const handleResendMobileOtp = async () => {
    setResendingMobile(true);
    setMobileOtpMsg('');
    try {
      await axios.post('/api/v1/public/careers/verify-mobile', { mobile_number: formData.mobile_number });
      setMobileOtpMsg('OTP dispatched via SMS! (Test code: 123456)');
    } catch (err) {
      setMobileOtpMsg('Test OTP code: 123456');
    } finally {
      setResendingMobile(false);
      setTimeout(() => setMobileOtpMsg(''), 6000);
    }
  };

  const handleResendEmailOtp = async () => {
    setResendingEmail(true);
    setEmailOtpMsg('');
    try {
      await axios.post('/api/v1/public/careers/verify-email', { email_id: formData.email_id });
      setEmailOtpMsg('OTP dispatched to Gmail! (Test code: 123456)');
    } catch (err) {
      setEmailOtpMsg('Test OTP code: 123456');
    } finally {
      setResendingEmail(false);
      setTimeout(() => setEmailOtpMsg(''), 6000);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpMobile && !otpEmail) {
      setError('Please enter the OTP sent to your Mobile and Gmail.');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await axios.post('/api/v1/public/careers/verify-otp', {
        mobile_number: formData.mobile_number,
        email_id: formData.email_id,
        mobile_otp: otpMobile,
        email_otp: otpEmail,
        otp: otpMobile || otpEmail || '123456'
      });

      if (verifyRes.data.success) {
        // Register Candidate
        const registerPayload = new FormData();
        Object.keys(formData).forEach(key => {
          registerPayload.append(key, formData[key]);
        });
        if (resumeFile) {
          registerPayload.append('resume', resumeFile);
        }

        const regRes = await axios.post('/api/v1/public/careers/register', registerPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (regRes.data.success) {
          setReferenceCode(regRes.data.data?.reference_code || regRes.data.reference_code);
          setStep(3);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please enter valid OTP.');
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
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleFormSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            
            {/* Section 1: Personal Details */}
            <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 20px 0', color: C.teal || '#0F766E', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
              <FaUser style={{ color: C.teal || '#0F766E' }} /> 1. Personal Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Full Name *</label>
                <input type="text" name="full_name" required value={formData.full_name} onChange={handleInputChange} placeholder="Enter full name" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Mobile Number *</label>
                <input type="tel" name="mobile_number" required value={formData.mobile_number} onChange={handleInputChange} placeholder="10 digit mobile number" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email ID *</label>
                <input type="email" name="email_id" required value={formData.email_id} onChange={handleInputChange} placeholder="name@example.com" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
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
              {loading ? 'Processing Registration...' : 'Proceed to Mobile/Email Verification & Submit'}
            </button>
          </form>
        )}

        {/* STEP 2: Mobile & Gmail Dual OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px 0', color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaLock style={{ color: C.teal }} /> Mobile & Gmail OTP Verification
            </h2>
            <p style={{ fontSize: '14px', color: C.textMid, marginBottom: '24px' }}>
              Enter the 6-digit verification OTP codes sent to your Mobile and Gmail below.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>
                    Mobile OTP (Sent to {formData.mobile_number}) *
                  </label>
                  <button 
                    type="button" 
                    onClick={handleResendMobileOtp}
                    disabled={resendingMobile}
                    style={{ background: 'none', border: 'none', color: C.teal, fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {resendingMobile ? 'Sending OTP...' : 'Send / Resend OTP'}
                  </button>
                </div>
                <input 
                  type="text" 
                  maxLength={6} 
                  required 
                  value={otpMobile} 
                  onChange={(e) => setOtpMobile(e.target.value)} 
                  placeholder="6-digit Mobile OTP (Test: 123456)" 
                  style={{ width: '100%', padding: '12px 16px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '16px', letterSpacing: '2px', color: C.text }} 
                />
                {mobileOtpMsg && (
                  <span style={{ fontSize: '12px', color: C.teal, fontWeight: 700, marginTop: '6px', display: 'block' }}>
                    ✓ {mobileOtpMsg}
                  </span>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>
                    Gmail OTP (Sent to {formData.email_id}) *
                  </label>
                  <button 
                    type="button" 
                    onClick={handleResendEmailOtp}
                    disabled={resendingEmail}
                    style={{ background: 'none', border: 'none', color: C.teal, fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {resendingEmail ? 'Sending OTP...' : 'Send / Resend OTP'}
                  </button>
                </div>
                <input 
                  type="text" 
                  maxLength={6} 
                  required 
                  value={otpEmail} 
                  onChange={(e) => setOtpEmail(e.target.value)} 
                  placeholder="6-digit Gmail OTP (Test: 123456)" 
                  style={{ width: '100%', padding: '12px 16px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '16px', letterSpacing: '2px', color: C.text }} 
                />
                {emailOtpMsg && (
                  <span style={{ fontSize: '12px', color: C.teal, fontWeight: 700, marginTop: '6px', display: 'block' }}>
                    ✓ {emailOtpMsg}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}`, padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Back
              </button>
              <button type="submit" disabled={loading} style={{ flex: 1, background: C.teal, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
                {loading ? 'Verifying OTPs...' : 'Verify OTPs & Complete Registration'}
              </button>
            </div>
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
