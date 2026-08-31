import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaIdCard, FaCheckCircle, FaFileAlt, FaUpload } from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

export default function KYCSubmission() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [bankFile, setBankFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!panNumber || !aadhaarNumber || !bankAccNumber) {
      alert('Please fill in PAN, Aadhaar, and Bank details.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const payload = new FormData();
      payload.append('pan_number', panNumber);
      payload.append('aadhaar_number', aadhaarNumber);
      payload.append('bank_account_number', bankAccNumber);
      payload.append('ifsc_code', ifscCode);

      if (panFile) payload.append('pan_document', panFile);
      if (aadhaarFile) payload.append('aadhaar_document', aadhaarFile);
      if (bankFile) payload.append('bank_document', bankFile);

      const res = await axios.post(`${getApiV1Url()}/employee/kyc`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit KYC documents');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '32px 16px' : '60px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '24px 16px' : '40px', textAlign: 'center' }}>
          <FaCheckCircle size={48} style={{ color: C.teal, marginBottom: '16px' }} />
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, margin: '0 0 8px 0' }}>KYC Documents Submitted!</h2>
          <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 24px 0' }}>
            Your PAN, Aadhaar, and Bank proof documents have been submitted to HR & Super Admin for verification.
          </p>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.teal, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Onboarding Step 3</span>
            <h1 style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 900, color: C.text, margin: 0 }}>Document Upload & KYC Verification</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaIdCard /> PAN Card Verification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>PAN Number *</label>
              <input type="text" required value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Upload PAN Document</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setPanFile(e.target.files[0])} style={{ width: '100%', padding: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '24px 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaIdCard /> Aadhaar Card Verification
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Aadhaar Number *</label>
              <input type="text" required value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="12 Digit Aadhaar" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Upload Aadhaar Document</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setAadhaarFile(e.target.files[0])} style={{ width: '100%', padding: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '24px 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaIdCard /> Bank Account Proof
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Bank Account Number *</label>
              <input type="text" required value={bankAccNumber} onChange={(e) => setBankAccNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>IFSC Code *</label>
              <input type="text" required value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Upload Bank Passbook / Cancelled Cheque</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setBankFile(e.target.files[0])} style={{ width: '100%', padding: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: C.teal, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Uploading KYC Documents...' : 'Submit KYC Documents for Approval'}
          </button>

        </form>

      </div>
    </div>
  );
}
