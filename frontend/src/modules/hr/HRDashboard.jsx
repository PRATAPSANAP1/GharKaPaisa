import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaUsers, FaUserCheck, FaClock, FaTimesCircle, FaSearch, 
  FaFilter, FaStar, FaUserPlus, FaFileAlt, FaCheckCircle, FaPhone, FaEnvelope 
} from 'react-icons/fa';
import api from '../../services/api';

export default function HRDashboard() {
  const { C } = useTheme();
  
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    total_candidates: 0,
    registered: 0,
    interview_pending: 0,
    selected: 0,
    rejected: 0,
    converted: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected candidate modal state
  const [selectedCandModal, setSelectedCandModal] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  
  const [selectionForm, setSelectionForm] = useState({
    offered_salary: '',
    offered_designation: 'Sales Executive',
    offered_department: 'Sales & Distribution',
    expected_joining_date: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    interview_status: 'SELECTED',
    interview_rating: 4,
    interview_feedback: ''
  });

  // Create HR Account modal state
  const [createHRModalOpen, setCreateHRModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [hrForm, setHrForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    designation: 'HR Manager',
    department: 'Human Resources'
  });

  const handleCreateHRSubmit = async (e) => {
    e.preventDefault();
    if (hrForm.password !== hrForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await api.post('/superadmin/create-admin', {
        ...hrForm,
        role: 'HR'
      });
      if (res.data.success) {
        alert(`HR Account Created Successfully! User Email: ${hrForm.email}`);
        setCreateHRModalOpen(false);
        setHrForm({
          fullName: '',
          email: '',
          mobile: '',
          password: '',
          confirmPassword: '',
          designation: 'HR Manager',
          department: 'Human Resources'
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create HR account');
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/hr/candidates/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const candRes = await api.get('/hr/candidates', {
        params: { status: statusFilter, search: searchTerm }
      });
      if (candRes.data.success) {
        setCandidates(candRes.data.data);
      }
    } catch (err) {
      console.error('HR Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [statusFilter, searchTerm]);

  const handleSelectCandidateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandModal) return;
    try {
      const res = await api.post(`/hr/candidates/${selectedCandModal.id}/select`, selectionForm);
      if (res.data.success) {
        alert(`Candidate Selected! Employee ID Created: ${res.data.data.employee_id}`);
        setSelectedCandModal(null);
        fetchHRData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Selection failed');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!interviewModal) return;
    try {
      const res = await api.post(`/hr/candidates/${interviewModal.id}/interview`, feedbackForm);
      if (res.data.success) {
        alert('Interview Feedback Saved');
        setInterviewModal(null);
        fetchHRData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              HR Management Portal
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Candidate Acquisition & HR Overview</h1>
          </div>

          <button 
            onClick={() => setCreateHRModalOpen(true)}
            style={{ 
              background: C.employeePrimary || C.teal || '#0F766E', color: '#ffffff', border: 'none', 
              padding: '12px 24px', borderRadius: '12px', fontSize: '14px', 
              fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(15,118,110,0.25)' 
            }}
          >
            <FaUserPlus /> + Create HR Account
          </button>
        </div>

        {/* Stats Cards Grid (Single Row Layout) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total Applications', count: stats.total_candidates, icon: <FaUsers />, color: C.teal },
            { label: 'Registered (New)', count: stats.registered, icon: <FaClock />, color: '#3B82F6' },
            { label: 'Interview Pending', count: stats.interview_pending, icon: <FaClock />, color: '#F59E0B' },
            { label: 'Selected', count: stats.selected, icon: <FaUserCheck />, color: '#10B981' },
            { label: 'Rejected', count: stats.rejected, icon: <FaTimesCircle />, color: '#EF4444' },
            { label: 'Employees Created', count: stats.converted, icon: <FaUserPlus />, color: '#8B5CF6' }
          ].map((st, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${st.color}15`, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {st.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{st.count}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search Toolbar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }} />
              <input 
                type="text" 
                placeholder="Search candidate by name, mobile, reference code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 40px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', color: C.text, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FaFilter style={{ color: C.textMid }} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', color: C.text, outline: 'none' }}
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="INTERVIEW_PENDING">Interview Pending</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
              <option value="EMPLOYEE_CREATED">Employee Created</option>
            </select>
          </div>
        </div>

        {/* Candidate List Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading candidate records...</div>
          ) : candidates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>No candidates found matching criteria.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>Ref Code</th>
                    <th style={{ padding: '14px 20px' }}>Candidate Name</th>
                    <th style={{ padding: '14px 20px' }}>Contact</th>
                    <th style={{ padding: '14px 20px' }}>Qualification</th>
                    <th style={{ padding: '14px 20px' }}>Experience</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((cand) => (
                    <tr key={cand.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: C.teal }}>{cand.reference_code}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: C.text }}>{cand.full_name}</td>
                      <td style={{ padding: '14px 20px', color: C.textMid }}>
                        <div>{cand.mobile_number}</div>
                        <div style={{ fontSize: '12px' }}>{cand.email_id}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>{cand.highest_qualification}</td>
                      <td style={{ padding: '14px 20px' }}>{cand.experience_type} ({cand.total_experience_years || 0} yrs)</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800,
                          background: cand.interview_status === 'SELECTED' || cand.interview_status === 'EMPLOYEE_CREATED' ? '#D1FAE5' : cand.interview_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                          color: cand.interview_status === 'SELECTED' || cand.interview_status === 'EMPLOYEE_CREATED' ? '#065F46' : cand.interview_status === 'REJECTED' ? '#991B1B' : '#92400E'
                        }}>
                          {cand.interview_status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => setInterviewModal(cand)}
                            style={{ background: C.bgSecondary, color: C.text, border: `1px solid ${C.border}`, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Feedback
                          </button>
                          <button 
                            onClick={() => setSelectedCandModal(cand)}
                            style={{ background: C.teal, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Select & Create EMP ID
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Select Candidate & Generate Employee ID */}
        {selectedCandModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>Select Candidate & Create Employee</h2>
              <p style={{ fontSize: '14px', color: C.textMid, marginBottom: '20px' }}>Candidate: <strong>{selectedCandModal.full_name}</strong> ({selectedCandModal.reference_code})</p>

              <form onSubmit={handleSelectCandidateSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Offered Monthly Salary (₹) *</label>
                  <input type="number" required value={selectionForm.offered_salary} onChange={(e) => setSelectionForm({ ...selectionForm, offered_salary: e.target.value })} placeholder="e.g. 25000" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Designation *</label>
                  <select value={selectionForm.offered_designation} onChange={(e) => setSelectionForm({ ...selectionForm, offered_designation: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                    <option value="TC">Telecaller (TC)</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales Executive">Sales Executive</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Department *</label>
                  <input type="text" required value={selectionForm.offered_department} onChange={(e) => setSelectionForm({ ...selectionForm, offered_department: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Expected Joining Date</label>
                  <input type="date" value={selectionForm.expected_joining_date} onChange={(e) => setSelectionForm({ ...selectionForm, expected_joining_date: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setSelectedCandModal(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Confirm Selection & Generate ID</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: Create HR Account ── */}
        {createHRModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '540px', border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Super Admin Operations</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: C.text }}>Create HR Manager Account</h2>
                </div>
                <button onClick={() => setCreateHRModalOpen(false)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </div>

              <form onSubmit={handleCreateHRSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Full Name *</label>
                    <input type="text" required value={hrForm.fullName} onChange={(e) => setHrForm({ ...hrForm, fullName: e.target.value })} placeholder="Enter full name" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email Address *</label>
                    <input type="email" required value={hrForm.email} onChange={(e) => setHrForm({ ...hrForm, email: e.target.value })} placeholder="hr@example.com" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Mobile Number *</label>
                    <input type="tel" required value={hrForm.mobile} onChange={(e) => setHrForm({ ...hrForm, mobile: e.target.value })} placeholder="10 Digit Mobile" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Designation *</label>
                    <input type="text" required value={hrForm.designation} onChange={(e) => setHrForm({ ...hrForm, designation: e.target.value })} placeholder="e.g. HR Manager / Executive" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Password *</label>
                    <input type="password" required value={hrForm.password} onChange={(e) => setHrForm({ ...hrForm, password: e.target.value })} placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Confirm Password *</label>
                    <input type="password" required value={hrForm.confirmPassword} onChange={(e) => setHrForm({ ...hrForm, confirmPassword: e.target.value })} placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" onClick={() => setCreateHRModalOpen(false)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={createLoading} style={{ background: C.employeePrimary || C.teal || '#0F766E', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                    {createLoading ? 'Provisioning...' : 'Provision HR Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
