import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaArrowLeft, FaUser, FaBriefcase, FaUserTag, FaIdCard, 
  FaGraduationCap, FaCheckCircle, FaFileUpload, FaUniversity, FaBuilding 
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

export default function JoiningForm() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [form, setForm] = useState({
    // Section 1: Candidate Information
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    email_id: '',
    current_address: '',
    permanent_address: '',

    // Section 2: Employment Details
    designation: '',
    department: '',
    joining_date: new Date().toISOString().split('T')[0],
    work_location: 'Office',
    reporting_manager: '',
    employment_type: 'Full-time',
    offered_salary: '',
    incentive_structure: 'Standard Performance Incentive',
    notice_period_days: '30',

    // Section 3: Recruitment Details
    referred_by: '',
    recruitment_source: 'Direct / Portal',
    interviewer_name: 'HR Executive',

    // Section 4: Document & Compliance Details
    pan_number: '',
    aadhaar_number: '',
    bank_account_holder_name: '',
    bank_account_number: '',
    ifsc_code: '',

    // Section 5: Educational & Experience Details
    highest_qualification: 'Graduate',
    passing_year: '2022',
    experience_type: 'Fresher',
    previous_company: '',
    previous_designation: '',
    total_experience_years: '0',

    // Section 6: Declaration & Acceptance
    declaration_accepted: true,
    digital_signature: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const res = await axios.get(`${getApiV1Url()}/employee/profile`);
        if (res.data.success && res.data.data) {
          const emp = res.data.data.employee || {};
          const jDetails = res.data.data.joining_details || {};
          
          setForm(prev => ({
            ...prev,
            full_name: jDetails.full_name || emp.full_name || '',
            mobile_number: jDetails.mobile_number || emp.mobile_number || '',
            whatsapp_number: jDetails.whatsapp_number || emp.whatsapp_number || '',
            email_id: jDetails.email_id || emp.email_id || emp.email || '',
            current_address: jDetails.current_address || emp.current_address || '',
            permanent_address: jDetails.permanent_address || '',
            
            designation: jDetails.designation || emp.designation || 'Sales Executive',
            department: jDetails.department || emp.department || 'Sales & Distribution',
            joining_date: jDetails.joining_date ? new Date(jDetails.joining_date).toISOString().split('T')[0] : (emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : prev.joining_date),
            work_location: jDetails.work_location || emp.work_location || 'Office',
            reporting_manager: jDetails.reporting_manager || '',
            employment_type: jDetails.employment_type || emp.employment_type || 'Full-time',
            offered_salary: jDetails.offered_salary || emp.offered_salary || '',
            incentive_structure: jDetails.incentive_structure || 'Standard Performance Incentive',
            notice_period_days: jDetails.notice_period_days || emp.notice_period_days || '30',

            referred_by: jDetails.referred_by || emp.referred_by || '',
            recruitment_source: jDetails.recruitment_source || emp.recruitment_source || 'Direct / Portal',

            pan_number: jDetails.pan_number || '',
            aadhaar_number: jDetails.aadhaar_number || '',
            bank_account_holder_name: jDetails.bank_account_holder_name || emp.full_name || '',
            bank_account_number: jDetails.bank_account_number || '',
            ifsc_code: jDetails.ifsc_code || '',

            highest_qualification: jDetails.highest_qualification || 'Graduate',
            passing_year: jDetails.passing_year || '2022',
            experience_type: jDetails.experience_type || 'Fresher',
            previous_company: jDetails.previous_company || '',
            previous_designation: jDetails.previous_designation || '',
            total_experience_years: jDetails.total_experience_years || '0',
            digital_signature: jDetails.full_name || emp.full_name || ''
          }));

          if (jDetails.form_status === 'SUBMITTED' || jDetails.form_status === 'APPROVED') {
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error('Error loading employee profile for joining form:', err);
      } finally {
        setFetchingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await axios.post(`${getApiV1Url()}/employee/joining-form`, form);
      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit Joining Form');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '32px 16px' : '60px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '24px 16px' : '40px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <FaCheckCircle size={56} style={{ color: C.teal || '#0F766E', marginBottom: '16px' }} />
          <h2 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, margin: '0 0 8px 0', color: C.text }}>
            Employee Joining Form Submitted!
          </h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Your 6-section <strong>Employee Onboarding & Joining Details</strong> form has been successfully saved. It is now submitted for Super Admin verification and activation.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/employee/kyc')} style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}`, padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Upload KYC Documents →
            </button>
            <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Go to Employee Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fetchingProfile) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px 24px', textAlign: 'center', color: C.textMid }}>
        Loading Joining Details Form...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Onboarding Phase 1</span>
            <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 900, color: C.text, margin: 0 }}>EMPLOYEE ONBOARDING & JOINING DETAILS</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px 16px' : '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>

          {/* Section 1: Candidate Information */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '10px' }}>
              <FaUser style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>1. Candidate Information</h3>
            </div>

            {Boolean(form.full_name || form.mobile_number || form.email_id) && (
              <div style={{ 
                background: C.teal ? `${C.teal}15` : '#f0fdf4', 
                border: `1px solid ${C.teal || '#0F766E'}40`, 
                borderRadius: '12px', 
                padding: '12px 16px', 
                marginBottom: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px' 
              }}>
                <FaCheckCircle style={{ color: C.teal || '#0F766E', fontSize: '18px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: C.teal || '#0F766E', fontWeight: 700, lineHeight: 1.4 }}>
                  ✓ Personal information (Full Name, Contact, Email) has been pre-filled from your registered candidate profile.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, margin: 0 }}>1. Full Name *</label>
                  {form.full_name && <span style={{ fontSize: '11px', color: C.teal || '#0F766E', fontWeight: 700 }}>✓ Pre-filled</span>}
                </div>
                <input type="text" name="full_name" required value={form.full_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, margin: 0 }}>2. Contact Number *</label>
                  {form.mobile_number && <span style={{ fontSize: '11px', color: C.teal || '#0F766E', fontWeight: 700 }}>✓ Registered</span>}
                </div>
                <input type="tel" name="mobile_number" required value={form.mobile_number} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>WhatsApp Contact Number</label>
                <input type="tel" name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} placeholder="Same as contact number" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, margin: 0 }}>3. Email Address *</label>
                  {form.email_id && <span style={{ fontSize: '11px', color: C.teal || '#0F766E', fontWeight: 700 }}>✓ Registered</span>}
                </div>
                <input type="email" name="email_id" required value={form.email_id} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>4. Current Location & Address *</label>
                <textarea rows={2} name="current_address" required value={form.current_address} onChange={handleChange} placeholder="Enter your full current residential address..." style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>
            </div>
          </div>

          {/* Section 2: Employment Details */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '10px' }}>
              <FaBriefcase style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>2. Employment Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>1. Designation / Job Role *</label>
                <input type="text" name="designation" required value={form.designation} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>2. Department / Team *</label>
                <input type="text" name="department" required value={form.department} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>3. Date of Joining *</label>
                <input type="date" name="joining_date" required value={form.joining_date} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>4. Work Location *</label>
                <select name="work_location" value={form.work_location} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Office">Office / On-Site</option>
                  <option value="Remote">Remote / Work from Home</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>5. Reporting Manager</label>
                <input type="text" name="reporting_manager" value={form.reporting_manager} onChange={handleChange} placeholder="e.g. Sales Manager" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>6. Employment Type *</label>
                <select name="employment_type" value={form.employment_type} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Full-time">Full-time Permanent</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>7. Offered Monthly Salary (₹) *</label>
                <input type="number" name="offered_salary" required value={form.offered_salary} onChange={handleChange} placeholder="e.g. 25000" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>8. Incentive / Performance Structure</label>
                <input type="text" name="incentive_structure" value={form.incentive_structure} onChange={handleChange} placeholder="e.g. ₹500 per converted lead" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>9. Notice Period (Days)</label>
                <input type="number" name="notice_period_days" value={form.notice_period_days} onChange={handleChange} placeholder="e.g. 30" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>
            </div>
          </div>

          {/* Section 3: Recruitment Details */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '10px' }}>
              <FaUserTag style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>3. Recruitment Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>1. Referred By</label>
                <input type="text" name="referred_by" value={form.referred_by} onChange={handleChange} placeholder="Employee / Partner Name or ID" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>2. Recruitment Source</label>
                <select name="recruitment_source" value={form.recruitment_source} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Direct / Portal">GharKaPaisa Career Portal</option>
                  <option value="Referral">Employee Referral</option>
                  <option value="LinkedIn">LinkedIn / Social Media</option>
                  <option value="Job Board">Job Portal / Agency</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>3. Interviewer / HR Executive</label>
                <input type="text" name="interviewer_name" value={form.interviewer_name} onChange={handleChange} placeholder="HR Executive Name" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>
            </div>
          </div>

          {/* Section 4: Document & Compliance Details */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '10px' }}>
              <FaIdCard style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>4. Document & Compliance Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>1. PAN Number *</label>
                <input type="text" name="pan_number" required value={form.pan_number} onChange={handleChange} placeholder="e.g. ABCDE1234F" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, textTransform: 'uppercase', fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>2. Aadhaar Number *</label>
                <input type="text" name="aadhaar_number" required value={form.aadhaar_number} onChange={handleChange} placeholder="12-digit Aadhaar Number" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>3. Bank Account Holder Name *</label>
                <input type="text" name="bank_account_holder_name" required value={form.bank_account_holder_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Bank Account Number *</label>
                <input type="text" name="bank_account_number" required value={form.bank_account_number} onChange={handleChange} placeholder="Salary Bank Account Number" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Bank IFSC Code *</label>
                <input type="text" name="ifsc_code" required value={form.ifsc_code} onChange={handleChange} placeholder="e.g. HDFC0001234" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, textTransform: 'uppercase' }} />
              </div>
            </div>
          </div>

          {/* Section 5: Highest Educational Qualification & Experience */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '10px' }}>
              <FaGraduationCap style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>5. Highest Educational Qualification & Experience</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>1. Highest Qualification *</label>
                <select name="highest_qualification" value={form.highest_qualification} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Graduate">Graduate (Bachelor's Degree)</option>
                  <option value="Post Graduate">Post Graduate (Master's Degree)</option>
                  <option value="12th Pass">12th Pass / Higher Secondary</option>
                  <option value="Diploma">Diploma Holder</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Passing Year</label>
                <input type="number" name="passing_year" value={form.passing_year} onChange={handleChange} placeholder="e.g. 2022" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>2. Experience Type *</label>
                <select name="experience_type" value={form.experience_type} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                  <option value="Fresher">Fresher</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </div>

              {form.experience_type === 'Experienced' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Previous Company Name</label>
                    <input type="text" name="previous_company" value={form.previous_company} onChange={handleChange} placeholder="Previous employer name" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Previous Designation</label>
                    <input type="text" name="previous_designation" value={form.previous_designation} onChange={handleChange} placeholder="Last designation held" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Total Experience (Years)</label>
                    <input type="number" step="0.5" name="total_experience_years" value={form.total_experience_years} onChange={handleChange} placeholder="e.g. 2.5" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 6: Candidate Declaration & Acceptance */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: `2px solid ${C.teal || '#0F766E'}20`, paddingBottom: '10px' }}>
              <FaCheckCircle style={{ color: C.teal || '#0F766E', fontSize: '18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.teal || '#0F766E', margin: 0 }}>6. Candidate Declaration & Acceptance</h3>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13.5px', color: C.text, lineHeight: 1.6, margin: '0 0 16px 0' }}>
                I hereby declare that all information submitted in this <strong>EMPLOYEE ONBOARDING & JOINING DETAILS</strong> form is accurate and authentic. I confirm my acceptance of the offered designation (<strong>{form.designation || 'Sales Executive'}</strong>) and joining date (<strong>{form.joining_date}</strong>) at GharKaPaisa.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <input type="checkbox" id="declaration_check" name="declaration_accepted" checked={form.declaration_accepted} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="declaration_check" style={{ fontSize: '13px', fontWeight: 700, color: C.text, cursor: 'pointer' }}>
                  1. Confirmation of Joining Date & Declaration Acceptance *
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  2. Digital Signature / Full Name Confirmation *
                </label>
                <input type="text" name="digital_signature" required value={form.digital_signature} onChange={handleChange} placeholder="Type your full legal name as digital signature" style={{ width: '100%', padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', background: C.teal || '#0F766E', color: '#fff', border: 'none', 
              padding: '16px', borderRadius: '14px', fontSize: '16px', fontWeight: 900, 
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
            }}
          >
            {loading ? 'Submitting Employee Onboarding Form...' : 'Confirm & Submit Employee Onboarding Form'}
          </button>

        </form>

      </div>
    </div>
  );
}
