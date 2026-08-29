import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaUser, FaCreditCard, FaUserPlus, FaFileAlt, FaVideo, 
  FaIdCard, FaCheckCircle, FaClock, FaUsers, FaCoins, FaSignOutAlt, FaChartLine 
} from 'react-icons/fa';
import axios from 'axios';

export default function EmployeeDashboard() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [stats, setStats] = useState({ total_earned: 0, pending_incentive: 0, total_leads_converted: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/employee/login');
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const profileRes = await axios.get('/api/v1/employee/profile');
      if (profileRes.data.success) {
        setEmployee(profileRes.data.data.employee);
      }

      const statusRes = await axios.get('/api/v1/employee/onboarding-status');
      if (statusRes.data.success) {
        setChecklist(statusRes.data.data);
      }

      const incRes = await axios.get('/api/v1/employee/incentives');
      if (incRes.data.success) {
        setStats(incRes.data.stats || {});
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
    return <div style={{ padding: '60px', textAlign: 'center', background: C.bg, minHeight: '100vh', color: C.text }}>Loading Employee Dashboard...</div>;
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px 80px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Header / Profile Bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px 32px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900 }}>
              {employee?.full_name ? employee.full_name.charAt(0) : 'E'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: C.text }}>{employee?.full_name}</h1>
                <span style={{ background: `${C.teal}15`, color: C.teal, fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px' }}>
                  {employee?.employee_id}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: C.textMid, margin: '2px 0 0 0' }}>
                {employee?.designation} • {employee?.department || 'Sales'} • {employee?.mobile_number}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ 
              padding: '6px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: 800,
              background: employee?.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
              color: employee?.activation_status === 'APPROVED' ? '#065F46' : '#92400E'
            }}>
              {employee?.activation_status === 'APPROVED' ? 'Active / Approved' : 'Onboarding Phase'}
            </span>
            <button onClick={handleLogout} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>

        {/* Onboarding Checklist Widget if not fully activated */}
        {employee?.activation_status !== 'APPROVED' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 4px 0', color: C.text }}>Employee Onboarding Checklist</h2>
                <p style={{ fontSize: '13px', color: C.textMid, margin: 0 }}>Complete all required onboarding steps to unlock full sales links & incentives activation</p>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: C.teal }}>
                {checklist?.overall_progress || 20}% Completed
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ background: C.bgSecondary, height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ width: `${checklist?.overall_progress || 20}%`, background: C.teal, height: '100%', transition: 'width 0.3s' }} />
            </div>

            {/* Steps Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Step 1: Joining Form */}
              <div onClick={() => navigate('/employee/joining-form')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.joining_form_completed ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <FaFileAlt style={{ color: checklist?.joining_form_completed ? C.teal : C.textMid, fontSize: '20px' }} />
                  {checklist?.joining_form_completed ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>Pending</span>}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>1. Joining Registration</h4>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>8-section personal & bank details form</p>
              </div>

              {/* Step 2: Terms & Video */}
              <div onClick={() => navigate('/employee/terms')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.terms_completed ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <FaVideo style={{ color: checklist?.terms_completed ? C.teal : C.textMid, fontSize: '20px' }} />
                  {checklist?.terms_completed ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>Pending</span>}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>2. Terms & Video</h4>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>Terms acceptance & verification video</p>
              </div>

              {/* Step 3: KYC Documents */}
              <div onClick={() => navigate('/employee/kyc')} style={{ background: C.bgSecondary, border: `1px solid ${checklist?.kyc_verified ? C.teal : C.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <FaIdCard style={{ color: checklist?.kyc_verified ? C.teal : C.textMid, fontSize: '20px' }} />
                  {checklist?.kyc_verified ? <FaCheckCircle style={{ color: C.teal }} /> : <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B' }}>Pending Review</span>}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0', color: C.text }}>3. Document & KYC</h4>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>PAN, Aadhaar & Bank document submission</p>
              </div>

              {/* Step 4: Super Admin Approval */}
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
        )}

        {/* Quick Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <FaCoins />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 700 }}>Total Incentives Earned</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>₹{stats.total_earned || 0}</div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <FaClock />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 700 }}>Pending Incentives</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>₹{stats.pending_incentive || 0}</div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <FaChartLine />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: C.textMid, fontWeight: 700 }}>Converted Leads</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{stats.total_leads_converted || 0}</div>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div onClick={() => navigate('/employee/credit-cards')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <FaCreditCard style={{ fontSize: '32px', color: C.teal, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 6px 0', color: C.text }}>Credit Cards & Product Links</h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
              Access employee-specific referral links with guaranteed employee incentive payout.
            </p>
          </div>

          <div onClick={() => navigate('/employee/applications')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <FaUserPlus style={{ fontSize: '32px', color: '#3B82F6', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 6px 0', color: C.text }}>My Customer Applications</h3>
            <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
              Track customer lead statuses, document uploads, and bank approvals in real-time.
            </p>
          </div>

          {(employee?.designation === 'Manager' || employee?.designation === 'Team Leader') && (
            <div onClick={() => navigate('/employee/team')} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '28px', cursor: 'pointer', transition: 'transform 0.2s' }}>
              <FaUsers style={{ fontSize: '32px', color: '#8B5CF6', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 6px 0', color: C.text }}>My Team Management</h3>
              <p style={{ fontSize: '13px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                View assigned Team Leaders and Telecallers (TC), hierarchy status, and sales metrics.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
