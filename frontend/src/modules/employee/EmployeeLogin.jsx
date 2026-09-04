import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaUser, FaPhone, FaLock, FaIdCard, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../config/api';

export default function EmployeeLogin() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loginMethod, setLoginMethod] = useState('employee_id'); // 'employee_id' | 'mobile' | 'reference_code'
  const [employeeId, setEmployeeId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!mobileNumber) {
      setError('Mobile number is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${getApiV1Url()}/employee/login`, {
        employee_id: employeeId || undefined,
        mobile_number: mobileNumber,
        reference_code: referenceCode || undefined
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px 12px' : '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '440px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: isMobile ? '24px 18px' : '36px', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
        
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: C.textMid, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px' }}
        >
          <FaArrowLeft /> Back to Home
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '1px' }}>
            GharKaPaisa Workplace
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: '4px 0 6px 0' }}>Employee Login</h1>
          <p style={{ fontSize: '14px', color: C.textMid, margin: 0 }}>Access your employee dashboard, credit cards, leads & incentives</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: C.text }}>Mobile Number *</label>
            <div style={{ position: 'relative' }}>
              <FaPhone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }} />
              <input 
                type="tel" 
                required 
                placeholder="10-digit registered mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                style={{ width: '100%', padding: '12px 14px 12px 40px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '15px', color: C.text, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: C.text }}>Employee ID / Candidate Reference Code</label>
            <div style={{ position: 'relative' }}>
              <FaIdCard style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }} />
              <input 
                type="text" 
                placeholder="EMP10001 or CAND10001 (Optional)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                style={{ width: '100%', padding: '12px 14px 12px 40px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '15px', color: C.text, outline: 'none' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', background: C.teal, color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px ${C.teal}40` }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Employee Panel'}
          </button>
        </form>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: '24px', paddingTop: '20px', textAlign: 'center', fontSize: '13px', color: C.textMid }}>
          Don't have an Employee account yet? <a href="/careers/register" style={{ color: C.teal, fontWeight: 700, textDecoration: 'none' }}>Apply via Careers Portal</a>
        </div>

      </div>
    </div>
  );
}
