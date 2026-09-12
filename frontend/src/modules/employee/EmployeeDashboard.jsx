import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaFileAlt, FaVideo, FaIdCard, FaCheckCircle, FaSignOutAlt,
  FaExclamationTriangle, FaShieldAlt, FaArrowRight
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../config/api';
import PartnerDashboardComponent from '../partner/dashboard/PartnerDashboardComponent';

export default function EmployeeDashboard() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [verState, setVerState] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/employee/login');
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const profileRes = await axios.get(`${getApiV1Url()}/employee/profile`);
      if (profileRes.data.success) {
        setEmployee(profileRes.data.data.employee);
      }

      const verRes = await axios.get(`${getApiV1Url()}/employee/verification-status`);
      if (verRes.data.success) {
        setVerState(verRes.data.data);
      }

      const statusRes = await axios.get(`${getApiV1Url()}/employee/onboarding-status`);
      if (statusRes.data.success) {
        setChecklist(statusRes.data.data);
      }
    } catch (err) {
      console.error('Employee Dashboard fetch error:', err);
      if (err.response?.status === 401) {
        navigate('/employee/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/employee/login');
  };

  if (loading) {
    return <div style={{ padding: '60px 16px', textAlign: 'center', background: C.bg, minHeight: '100vh', color: C.text }}>Loading Employee Dashboard...</div>;
  }

  const isApproved = employee?.activation_status === 'APPROVED' || employee?.employee_status === 'ACTIVE';

  if (isApproved && verState?.overall_status === 'VERIFIED') {
    // When approved & verified, render Partner Dashboard
    const partnerAdapter = {
      ...employee,
      partner_id: employee?.id,
      partner_code: employee?.employee_id,
      kyc_status: 'approved'
    };
    return <PartnerDashboardComponent partner={partnerAdapter} />;
  }

  const isOverallVerified = verState?.overall_status === 'VERIFIED';

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: isMobile ? '16px 8px 60px' : '24px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Profile Banner Header */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '16px' : '24px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
            <div style={{ width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: '50%', background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '18px' : '24px', fontWeight: 900, flexShrink: 0 }}>
              {employee?.full_name ? employee.full_name.charAt(0) : 'E'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, margin: 0, color: C.text }}>{employee?.full_name}</h1>
                <span style={{ background: `${C.teal}15`, color: C.teal, fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>
                  {employee?.employee_id}
                </span>
              </div>
              <p style={{ fontSize: isMobile ? '12px' : '13px', color: C.textMid, margin: '2px 0 0 0', wordBreak: 'break-word' }}>
                {employee?.designation} • {employee?.department || 'Sales'} • {employee?.mobile_number}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
            <span style={{ 
              padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
              background: isOverallVerified ? '#D1FAE5' : '#FEF3C7',
              color: isOverallVerified ? '#065F46' : '#92400E'
            }}>
              ● {isOverallVerified ? 'Verified Employee' : 'Verification Required'}
            </span>
            <button onClick={handleLogout} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>

        {/* Dynamic Verification Banners */}
        {!isOverallVerified && verState && (() => {
          const missingItems = verState.missing_items || [];
          const actionRequiredItems = missingItems.filter(item => 
            item.status === 'NOT_UPLOADED' || item.status === 'NOT_COMPLETED' || item.status === 'REJECTED' || item.status === 'REQUIRES_UPDATE'
          );
          const underReviewItems = missingItems.filter(item => item.status === 'UNDER_REVIEW');

          // Case A: Items require immediate upload/fix from employee
          if (actionRequiredItems.length > 0) {
            return (
              <div style={{
                background: '#FFFBEB',
                border: '2px solid #F59E0B',
                borderRadius: '24px',
                padding: isMobile ? '20px' : '28px',
                marginBottom: '24px',
                boxShadow: '0 6px 24px rgba(245, 158, 11, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <FaExclamationTriangle style={{ fontSize: '20px', color: '#D97706' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#92400E', margin: 0 }}>
                        ⚠ Employee Verification Pending
                      </h3>
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#B45309', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                      Please complete your employee verification. The following documents and items require your immediate action:
                    </p>

                    {verState.latest_reminder && (
                      <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#78350F', fontWeight: 700, marginBottom: '14px' }}>
                        🔔 <strong>Reminder Notification:</strong> "{verState.latest_reminder.message}"
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {actionRequiredItems.map((item, idx) => (
                        <div key={idx} style={{ 
                          fontSize: '13px', fontWeight: 800, 
                          color: item.status === 'REJECTED' ? '#DC2626' : '#92400E',
                          display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.status === 'REJECTED' ? '#DC2626' : '#D97706' }} />
                          {item.text || item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/employee/verification')}
                    style={{
                      background: '#D97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Verify Now <FaArrowRight />
                  </button>
                </div>
              </div>
            );
          }

          // Case B: Documents uploaded, pending admin review (no action required by employee)
          if (underReviewItems.length > 0) {
            return (
              <div style={{
                background: '#EFF6FF',
                border: '2px solid #3B82F6',
                borderRadius: '24px',
                padding: isMobile ? '20px' : '28px',
                marginBottom: '24px',
                boxShadow: '0 6px 24px rgba(59, 130, 246, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <FaShieldAlt style={{ fontSize: '22px', color: '#2563EB' }} />
                      <h3 style={{ fontSize: '18px', fontWeight 900, color: '#1E40AF', margin: 0 }}>
                        ⏳ Verification Documents Submitted & Under Review
                      </h3>
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#1D4ED8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                      Your uploaded documents and video verification have been received and are currently undergoing HR & Super Admin review. No further action is required from you at this time.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {underReviewItems.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '13px', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }} />
                          ✓ {item.label || item.text} – Submitted & Under Review
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/employee/verification')}
                    style={{
                      background: '#2563EB',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    View Status <FaArrowRight />
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Verification Completed Card Banner */}
        {isOverallVerified && (
          <div style={{
            background: '#F0FDF4',
            border: '2px solid #10B981',
            borderRadius: '24px',
            padding: '24px 32px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <FaCheckCircle style={{ fontSize: '32px', color: '#059669' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#065F46', margin: '0 0 4px 0' }}>
                ✅ Employee Verification Complete
              </h3>
              <p style={{ fontSize: '13.5px', color: '#047857', margin: 0 }}>
                Your information, documents, and video verification have been successfully verified and approved.
              </p>
            </div>
          </div>
        )}

        {/* Onboarding Checklist Widget */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '16px' : '28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, margin: '0 0 4px 0', color: C.text }}>Employee Onboarding Checklist</h2>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Complete all required onboarding steps to unlock full sales links & partner features</p>
            </div>
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: C.teal }}>
              {isOverallVerified ? '100% Completed' : `${checklist?.overall_progress || 60}% Completed`}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ background: C.bgSecondary, height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ width: isOverallVerified ? '100%' : `${checklist?.overall_progress || 60}%`, background: C.teal, height: '100%', transition: 'width 0.3s' }} />
          </div>

          {/* Steps Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div onClick={() => navigate('/employee/verification')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.joining_form_completed ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaFileAlt style={{ color: checklist?.joining_form_completed ? C.teal : C.textMid, fontSize: '20px' }} />
                <FaCheckCircle style={{ color: C.teal }} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>1. Information</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Personal & bank details</p>
            </div>

            <div onClick={() => navigate('/employee/verification')} style={{ background: C.bgSecondary, border: `1px solid ${verState?.documents_summary === '6/6' ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaIdCard style={{ color: verState?.documents_summary === '6/6' ? C.teal : C.textMid, fontSize: '20px' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: verState?.documents_summary === '6/6' ? C.teal : '#F59E0B' }}>
                  {verState?.documents_summary || '0/6'}
                </span>
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>2. Document Upload</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>PAN, Aadhaar, Bank & Photos</p>
            </div>

            <div onClick={() => navigate('/employee/verification')} style={{ background: C.bgSecondary, border: `1px solid ${verState?.video_status === 'VERIFIED' ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaVideo style={{ color: verState?.video_status === 'VERIFIED' ? C.teal : C.textMid, fontSize: '20px' }} />
                {verState?.video_status === 'VERIFIED' ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>{verState?.video_status || 'Pending'}</span>}
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>3. Video Verification</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Teleprompter agreement video</p>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${isOverallVerified ? C.teal : C.border}`, borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaShieldAlt style={{ color: isOverallVerified ? C.teal : C.textMid, fontSize: '20px' }} />
                {isOverallVerified ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid }}>Under Review</span>}
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>4. Overall Approval</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Super Admin activation</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
