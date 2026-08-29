import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaArrowLeft, FaSearch, FaCheckCircle, FaClock, FaTimesCircle, FaUserCheck, FaIdCard } from 'react-icons/fa';
import axios from 'axios';

export default function ApplicationStatus() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { code } = useParams();

  const [referenceCode, setReferenceCode] = useState(code || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusData, setStatusData] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!referenceCode) return;

    setLoading(true);
    setError('');
    setStatusData(null);

    try {
      const res = await axios.get(`/api/v1/public/careers/status/${referenceCode}`);
      if (res.data.success) {
        setStatusData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Candidate record not found for this Reference Code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      handleSearch();
    }
  }, [code]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
      case 'EMPLOYEE_CREATED':
        return { label: 'Selected / Employee Created', icon: <FaUserCheck />, bg: '#D1FAE5', color: '#065F46' };
      case 'INTERVIEW_PENDING':
      case 'INTERVIEWED':
        return { label: 'Interview Scheduled / In Progress', icon: <FaClock />, bg: '#FEF3C7', color: '#92400E' };
      case 'REJECTED':
        return { label: 'Not Selected', icon: <FaTimesCircle />, bg: '#FEE2E2', color: '#991B1B' };
      default:
        return { label: 'Application Registered', icon: <FaCheckCircle />, bg: '#DBEAFE', color: '#1E40AF' };
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '40px 16px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
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
              Candidate Tracking
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>Check Application Status</h1>
          </div>
        </div>

        {/* Search Input Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input 
                type="text" 
                placeholder="Enter Reference Code (e.g. CAND10001)"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '15px', color: C.text, outline: 'none' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ background: C.teal, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FaSearch /> {loading ? 'Searching...' : 'Track Status'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px', borderRadius: '16px', textAlign: 'center', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Status Details Card */}
        {statusData && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Candidate Name</span>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>{statusData.full_name}</h2>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Reference Code</span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: C.teal }}>{statusData.reference_code}</div>
              </div>
            </div>

            {/* Status Badge */}
            {(() => {
              const badge = getStatusBadge(statusData.interview_status);
              return (
                <div style={{ background: badge.bg, color: badge.color, borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '24px' }}>{badge.icon}</div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Current Application Status</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>{badge.label}</h3>
                  </div>
                </div>
              );
            })()}

            {statusData.interview_status === 'SELECTED' || statusData.interview_status === 'EMPLOYEE_CREATED' ? (
              <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}40`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaIdCard style={{ color: C.teal }} /> Offer & Employee Credentials
                </h4>
                <p style={{ fontSize: '14px', color: C.textMid, margin: '0 0 12px 0' }}>
                  Offered Designation: <strong>{statusData.offered_designation || 'Sales Executive'}</strong>
                </p>
                <button 
                  onClick={() => navigate('/employee/login')}
                  style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Proceed to Employee Onboarding Portal
                </button>
              </div>
            ) : null}

            {statusData.rejection_reason && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '16px', padding: '16px', fontSize: '14px' }}>
                <strong>Note:</strong> {statusData.rejection_reason}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
