import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaArrowLeft, FaVideo, FaCheckCircle, FaFileContract, FaUpload } from 'react-icons/fa';
import axios from 'axios';

export default function TermsAcceptance() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [accepted, setAccepted] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
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
    if (!accepted) {
      alert('You must check and accept the Employee Terms & Conditions.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const payload = new FormData();
      payload.append('accepted', 'true');
      payload.append('terms_version', '1.0');
      if (videoFile) {
        payload.append('video', videoFile);
      }

      const res = await axios.post('/api/v1/employee/terms-acceptance', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit terms acceptance');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '32px 16px' : '60px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '24px 16px' : '40px', textAlign: 'center' }}>
          <FaCheckCircle size={48} style={{ color: C.teal, marginBottom: '16px' }} />
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, margin: '0 0 8px 0' }}>Terms & Video Verification Accepted!</h2>
          <p style={{ fontSize: '13px', color: C.textMid, margin: '0 0 24px 0' }}>
            Your agreement and video verification recording have been recorded. Proceed to Document Upload & KYC Verification.
          </p>
          <button onClick={() => navigate('/employee/dashboard')} style={{ background: C.teal, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
            Return to Onboarding Dashboard
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
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Onboarding Step 2</span>
            <h1 style={{ fontSize: isMobile ? '18px' : '26px', fontWeight: 900, color: C.text, margin: 0 }}>Terms & Conditions + Video Verification</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          {/* Terms Container Box */}
          <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', maxHeight: '240px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.6, color: C.textMid, marginBottom: '24px' }}>
            <h4 style={{ color: C.text, margin: '0 0 8px 0', fontSize: '15px' }}>GharKaPaisa Employee Workplace Agreement</h4>
            <p>1. <strong>Incentives & Distribution:</strong> Employees are entitled to employee-specific referral link incentives as configured by Super Admin upon successful customer application conversion.</p>
            <p>2. <strong>Data Confidentiality:</strong> Employees must maintain confidentiality regarding customer data, loan application numbers, and bank credentials.</p>
            <p>3. <strong>Code of Conduct:</strong> Misrepresentation of financial product features, interest rates, or fees to customer leads is strictly prohibited.</p>
            <p>4. <strong>Attribution:</strong> All credit card & loan applications punched must carry the assigned employee ID for accurate incentive calculation.</p>
          </div>

          <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="accept" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <label htmlFor="accept" style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>
              I have read, understood, and accept the GharKaPaisa Employee Terms & Workplace Guidelines.
            </label>
          </div>

          {/* Video Verification Upload */}
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaVideo /> Video Verification Upload
          </h3>
          <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '16px' }}>
            Record a short 10-15 second video stating your Full Name and acceptance of GharKaPaisa employment terms (MP4 / WEBM format, Max 25MB).
          </p>

          <div style={{ background: C.bgSecondary, border: `2px dashed ${C.border}`, borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '32px' }}>
            <FaUpload size={32} style={{ color: C.teal, marginBottom: '8px' }} />
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} style={{ display: 'block', margin: '0 auto', fontSize: '13px', color: C.text }} />
            {videoFile && <span style={{ display: 'block', fontSize: '12px', color: C.teal, marginTop: '8px', fontWeight: 700 }}>Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>}
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: C.teal, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Submitting Agreement & Video...' : 'Submit Terms & Video Verification'}
          </button>

        </form>

      </div>
    </div>
  );
}
