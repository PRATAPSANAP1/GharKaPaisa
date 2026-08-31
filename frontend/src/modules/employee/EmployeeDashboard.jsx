import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaFileAlt, FaVideo, FaIdCard, FaCheckCircle, FaSignOutAlt 
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../config/api';
import PartnerDashboardComponent from '../partner/dashboard/PartnerDashboardComponent';

export default function EmployeeDashboard() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
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

  if (isApproved) {
    // When approved, render identical Partner Dashboard content
    const partnerAdapter = {
      ...employee,
      partner_id: employee?.id,
      partner_code: employee?.employee_id,
      kyc_status: 'approved'
    };
    return <PartnerDashboardComponent partner={partnerAdapter} />;
  }

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
              background: '#FEF3C7',
              color: '#92400E'
            }}>
              ● Onboarding Phase
            </span>
            <button onClick={handleLogout} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>

        {/* Onboarding Checklist Widget */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: isMobile ? '16px' : '28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, margin: '0 0 4px 0', color: C.text }}>Employee Onboarding Checklist</h2>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Complete all required onboarding steps to unlock full sales links & partner features</p>
            </div>
            <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: C.teal }}>
              {checklist?.overall_progress || 20}% Completed
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ background: C.bgSecondary, height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ width: `${checklist?.overall_progress || 20}%`, background: C.teal, height: '100%', transition: 'width 0.3s' }} />
          </div>

          {/* Steps Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div onClick={() => navigate('/employee/joining-form')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.joining_form_completed ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaFileAlt style={{ color: checklist?.joining_form_completed ? C.teal : C.textMid, fontSize: '20px' }} />
                {checklist?.joining_form_completed ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>Pending</span>}
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>1. Joining Registration</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Personal & bank details form</p>
            </div>

            <div onClick={() => navigate('/employee/terms')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.terms_completed ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaVideo style={{ color: checklist?.terms_completed ? C.teal : C.textMid, fontSize: '20px' }} />
                {checklist?.terms_completed ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>Pending</span>}
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>2. Terms & Video</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Terms acceptance & verification video</p>
            </div>

            <div onClick={() => navigate('/employee/kyc')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.kyc_verified ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaIdCard style={{ color: checklist?.kyc_verified ? C.teal : C.textMid, fontSize: '20px' }} />
                {checklist?.kyc_verified ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>Pending Review</span>}
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>3. Document & KYC</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>PAN, Aadhaar & Bank document submission</p>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${checklist?.activated ? C.teal : C.border}`, borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <FaCheckCircle style={{ color: checklist?.activated ? C.teal : C.textMid, fontSize: '20px' }} />
                {checklist?.activated ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid }}>Under Review</span>}
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>4. Admin Activation</h4>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Final approval by Super Admin</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
