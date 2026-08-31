import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaIdCard, FaCheckCircle, FaFileAlt, FaUpload, FaClock, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

export default function KYCSubmission() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [existingPanUrl, setExistingPanUrl] = useState('');
  const [existingAadhaarUrl, setExistingAadhaarUrl] = useState('');
  const [existingBankUrl, setExistingBankUrl] = useState('');
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');

  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [bankFile, setBankFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Existing KYC Profile on Component Mount
  useEffect(() => {
    const loadKycProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const res = await axios.get(`${getApiV1Url()}/employee/profile`);
        if (res.data?.success && res.data?.data) {
          const kyc = res.data.data.kyc || {};
          const jDetails = res.data.data.joining_details || {};

          setPanNumber(kyc.pan_number || jDetails.pan_number || '');
          setAadhaarNumber(kyc.aadhaar_number || jDetails.aadhaar_number || '');
          setBankAccNumber(kyc.bank_account_number || jDetails.bank_account_number || '');
          setIfscCode(kyc.ifsc_code || jDetails.ifsc_code || '');

          setExistingPanUrl(kyc.pan_document_url || '');
          setExistingAadhaarUrl(kyc.aadhaar_document_url || '');
          setExistingBankUrl(kyc.bank_document_url || '');

          if (kyc.kyc_status) {
            setKycStatus(kyc.kyc_status);
            if (kyc.kyc_status === 'SUBMITTED' || kyc.kyc_status === 'UNDER_REVIEW' || kyc.kyc_status === 'VERIFIED') {
              setSubmitted(true);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load KYC profile:', err.message);
      } finally {
        setFetching(false);
      }
    };
    loadKycProfile();
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
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const payload = new FormData();
      payload.append('pan_number', panNumber.toUpperCase());
      payload.append('aadhaar_number', aadhaarNumber);
      payload.append('bank_account_number', bankAccNumber);
      payload.append('ifsc_code', ifscCode.toUpperCase());

      if (panFile) payload.append('pan_document', panFile);
      if (aadhaarFile) payload.append('aadhaar_document', aadhaarFile);
      if (bankFile) payload.append('bank_document', bankFile);

      const res = await axios.post(`${getApiV1Url()}/employee/kyc`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setKycStatus('SUBMITTED');
        setSubmitted(true);
        if (res.data.data) {
          setExistingPanUrl(res.data.data.pan_document_url || existingPanUrl);
          setExistingAadhaarUrl(res.data.data.aadhaar_document_url || existingAadhaarUrl);
          setExistingBankUrl(res.data.data.bank_document_url || existingBankUrl);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit KYC documents');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '60px 24px', textAlign: 'center', color: C.textMid, fontFamily: "'Inter', sans-serif" }}>
        Loading KYC Details & Documents...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid, flexShrink: 0 }}>
            <FaArrowLeft />
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Onboarding Phase 3</span>
            <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 900, color: C.text, margin: 0 }}>Document Upload & KYC Verification</h1>
          </div>
        </div>

        {/* KYC Status Banner */}
        {kycStatus !== 'NOT_SUBMITTED' && (
          <div style={{
            background: kycStatus === 'VERIFIED' ? '#F0FDF4' : (kycStatus === 'REJECTED' ? '#FEF2F2' : '#FFFBEB'),
            border: `1px solid ${kycStatus === 'VERIFIED' ? '#BBF7D0' : (kycStatus === 'REJECTED' ? '#FCA5A5' : '#FDE68A')}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            {kycStatus === 'VERIFIED' ? (
              <FaCheckCircle size={24} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
            ) : kycStatus === 'REJECTED' ? (
              <FaExclamationTriangle size={24} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <FaClock size={24} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 4px 0', color: kycStatus === 'VERIFIED' ? '#15803D' : (kycStatus === 'REJECTED' ? '#991B1B' : '#B45309') }}>
                {kycStatus === 'VERIFIED' ? '✓ KYC Verification Approved' : (kycStatus === 'REJECTED' ? '❌ KYC Verification Needs Correction' : '⏳ KYC Submitted — Under Verification')}
              </h3>
              <p style={{ fontSize: '13px', margin: 0, color: kycStatus === 'VERIFIED' ? '#166534' : (kycStatus === 'REJECTED' ? '#7F1D1D' : '#92400E'), lineHeight: 1.5 }}>
                {kycStatus === 'VERIFIED'
                  ? 'Your PAN, Aadhaar, and Bank proof documents have been verified and approved by HR & Super Admin.'
                  : (kycStatus === 'REJECTED'
                    ? 'Your KYC documents require correction. Please review the details below and upload updated files.'
                    : 'Your KYC documents and bank details are safely stored in the database and currently under review by HR & Super Admin.')
                }
              </p>

              {/* View Existing Documents Bar */}
              {(existingPanUrl || existingAadhaarUrl || existingBankUrl) && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {existingPanUrl && (
                    <a href={existingPanUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.15)', color: '#1E293B', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaFileAlt style={{ color: C.teal }} /> View PAN Document <FaExternalLinkAlt size={10} />
                    </a>
                  )}
                  {existingAadhaarUrl && (
                    <a href={existingAadhaarUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.15)', color: '#1E293B', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaFileAlt style={{ color: C.teal }} /> View Aadhaar Document <FaExternalLinkAlt size={10} />
                    </a>
                  )}
                  {existingBankUrl && (
                    <a href={existingBankUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.15)', color: '#1E293B', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaFileAlt style={{ color: C.teal }} /> View Bank Proof <FaExternalLinkAlt size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '20px 16px' : '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
          
          {/* Section 1: PAN Card */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal || '#0F766E', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaIdCard /> PAN Card Verification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>PAN Number *</label>
                <input 
                  type="text" 
                  required 
                  maxLength={10}
                  value={panNumber} 
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())} 
                  placeholder="ABCDE1234F" 
                  style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Upload PAN Document {existingPanUrl && <span style={{ color: C.teal, fontSize: '11px', fontWeight: 700 }}>(✓ Uploaded)</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setPanFile(e.target.files[0])} 
                  style={{ width: '100%', padding: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Aadhaar Card */}
          <div style={{ marginBottom: '28px', borderTop: `1px dashed ${C.border}`, paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal || '#0F766E', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaIdCard /> Aadhaar Card Verification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Aadhaar Number *</label>
                <input 
                  type="text" 
                  required 
                  maxLength={12}
                  value={aadhaarNumber} 
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))} 
                  placeholder="12 Digit Aadhaar Number" 
                  style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Upload Aadhaar Document {existingAadhaarUrl && <span style={{ color: C.teal, fontSize: '11px', fontWeight: 700 }}>(✓ Uploaded)</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setAadhaarFile(e.target.files[0])} 
                  style={{ width: '100%', padding: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Account Proof */}
          <div style={{ marginBottom: '32px', borderTop: `1px dashed ${C.border}`, paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal || '#0F766E', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaIdCard /> Bank Account Proof
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Bank Account Number *</label>
                <input 
                  type="text" 
                  required 
                  value={bankAccNumber} 
                  onChange={(e) => setBankAccNumber(e.target.value)} 
                  placeholder="Enter Bank Account Number" 
                  style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>IFSC Code *</label>
                <input 
                  type="text" 
                  required 
                  value={ifscCode} 
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())} 
                  placeholder="e.g. SBIN0001234" 
                  style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontWeight: 700 }} 
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Upload Bank Passbook / Cancelled Cheque {existingBankUrl && <span style={{ color: C.teal, fontSize: '11px', fontWeight: 700 }}>(✓ Uploaded)</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setBankFile(e.target.files[0])} 
                  style={{ width: '100%', padding: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: C.teal || '#0F766E', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,118,110,0.3)' }}>
            {loading ? 'Uploading & Updating KYC Documents...' : (submitted ? 'Update KYC Details & Uploaded Files' : 'Submit KYC Documents for Approval')}
          </button>

        </form>

      </div>
    </div>
  );
}
