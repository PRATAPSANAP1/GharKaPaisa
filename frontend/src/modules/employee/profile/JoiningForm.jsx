import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaUser, FaGraduationCap, FaBriefcase, FaBuilding, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

export default function JoiningForm() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    email_id: '',
    date_of_birth: '',
    gender: 'Male',
    current_address: '',
    permanent_address: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    designation: 'Sales Executive',
    department: 'Sales & Distribution',
    joining_date: new Date().toISOString().split('T')[0],
    work_location: 'Office',
    employment_type: 'Full-time',
    highest_qualification: 'Graduate',
    passing_year: '2022',
    experience_type: 'Fresher',
    previous_company: '',
    previous_designation: '',
    total_experience_years: '0',
    offered_salary: '',
    bank_account_holder_name: '',
    bank_account_number: '',
    ifsc_code: '',
    pan_number: '',
    aadhaar_number: '',
    declaration_accepted: true
  });

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

      const res = await axios.post('/api/v1/employee/joining-form', form);
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
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
          <FaCheckCircle size={56} style={{ color: C.teal, marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px 0' }}>Joining Form Submitted!</h2>
          <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 24px 0' }}>
            Your 8-section employee joining form has been successfully saved. Proceed to Terms & Conditions acceptance and Video verification.
          </p>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.teal, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
            Return to Onboarding Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Onboarding Step 1</span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Joining Registration Form</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          {/* Section 1: Personal Details */}
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '0 0 16px 0', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>1. Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Full Name *</label>
              <input type="text" name="full_name" required value={form.full_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Mobile Number *</label>
              <input type="tel" name="mobile_number" required value={form.mobile_number} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email Address *</label>
              <input type="email" name="email_id" required value={form.email_id} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
          </div>

          {/* Section 2: Address & Emergency Details */}
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '24px 0 16px 0', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>2. Address & Emergency Contacts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Current Residential Address *</label>
              <textarea rows={2} name="current_address" required value={form.current_address} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Emergency Contact Name *</label>
              <input type="text" name="emergency_contact_name" required value={form.emergency_contact_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Emergency Contact Phone *</label>
              <input type="tel" name="emergency_contact_number" required value={form.emergency_contact_number} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
          </div>

          {/* Section 3: Bank Account Details */}
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '24px 0 16px 0', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>3. Salary Bank Account Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Account Holder Name *</label>
              <input type="text" name="bank_account_holder_name" required value={form.bank_account_holder_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Account Number *</label>
              <input type="text" name="bank_account_number" required value={form.bank_account_number} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>IFSC Code *</label>
              <input type="text" name="ifsc_code" required value={form.ifsc_code} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
          </div>

          {/* Declaration Checkbox */}
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="declaration" name="declaration_accepted" checked={form.declaration_accepted} onChange={handleChange} />
            <label htmlFor="declaration" style={{ fontSize: '13px', color: C.text }}>
              I hereby declare that all details provided above are true and accurate to the best of my knowledge.
            </label>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: C.teal, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Saving Joining Details...' : 'Submit Joining Registration Form'}
          </button>
        </form>

      </div>
    </div>
  );
}
