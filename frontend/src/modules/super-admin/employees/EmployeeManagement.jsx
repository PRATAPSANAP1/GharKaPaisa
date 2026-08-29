import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUsers, FaUserCheck, FaSitemap, FaLink, FaSearch, 
  FaPlus, FaCheckCircle, FaTimesCircle, FaEye, FaEdit, FaCheck, FaLock,
  FaFileAlt, FaVideo, FaUniversity, FaBuilding, FaBriefcase, FaIdCard, FaPhone, FaEnvelope, FaClock
} from 'react-icons/fa';
import axios from 'axios';

export default function EmployeeManagement() {
  const { C } = useTheme();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'hierarchy', 'links'
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [emp360Data, setEmp360Data] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [linkModalEmp, setLinkModalEmp] = useState(null);
  const [hierarchyModalEmp, setHierarchyModalEmp] = useState(null);

  // Hierarchy Form
  const [hierarchyForm, setHierarchyForm] = useState({
    hierarchy_level: 'TC',
    manager_id: '',
    team_leader_id: ''
  });

  // Link Form
  const [productsList, setProductsList] = useState([]);
  const [linkForm, setLinkForm] = useState({
    product_id: '',
    employee_referral_url: '',
    incentive_amount: '500',
    incentive_type: 'FIXED'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await axios.get('/api/v1/employees/stats');
      if (statsRes.data.success) setStats(statsRes.data.data);

      const empRes = await axios.get('/api/v1/employees', { 
        params: { 
          search: searchTerm,
          status: statusFilter,
          designation: designationFilter
        } 
      });
      if (empRes.data.success) setEmployees(empRes.data.data);

      const prodRes = await axios.get('/api/v1/products');
      if (prodRes.data.success) setProductsList(prodRes.data.data || []);
    } catch (err) {
      console.error('Super Admin Employees fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter, designationFilter]);

  const handleActivateEmployee = async (empId, currentActivation) => {
    const newActivation = currentActivation === 'APPROVED' ? 'PENDING' : 'APPROVED';
    try {
      const res = await axios.post(`/api/v1/employees/${empId}/activate`, {
        activation_status: newActivation,
        employee_status: newActivation === 'APPROVED' ? 'ACTIVE' : 'INACTIVE'
      });
      if (res.data.success) {
        alert(`Employee status updated to ${newActivation}`);
        fetchData();
        if (selectedEmp && selectedEmp.id === empId) {
          handleOpen360View(selectedEmp);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Activation failed');
    }
  };

  const handleOpen360View = async (emp) => {
    setSelectedEmp(emp);
    setLoading360(true);
    try {
      const res = await axios.get(`/api/v1/employees/${emp.id}`);
      if (res.data.success) {
        setEmp360Data(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching 360 view:', err);
    } finally {
      setLoading360(false);
    }
  };

  const handleAssignLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkModalEmp || !linkForm.product_id) return;
    try {
      const res = await axios.post(`/api/v1/employees/${linkModalEmp.id}/product-links`, linkForm);
      if (res.data.success) {
        alert('Product link and employee incentive assigned successfully!');
        setLinkModalEmp(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Link assignment failed');
    }
  };

  const handleAssignHierarchySubmit = async (e) => {
    e.preventDefault();
    if (!hierarchyModalEmp) return;
    try {
      const res = await axios.post(`/api/v1/employees/${hierarchyModalEmp.id}/hierarchy`, hierarchyForm);
      if (res.data.success) {
        alert('Employee hierarchy assigned successfully!');
        setHierarchyModalEmp(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Hierarchy assignment failed');
    }
  };

  const managersList = employees.filter(e => e.designation === 'Manager');
  const tlsList = employees.filter(e => e.designation === 'Team Leader');

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Super Admin Operations
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Management Center</h1>
          </div>
        </div>

        {/* Global Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Employees', count: stats.total_employees || 0, icon: <FaUsers />, color: C.teal },
            { label: 'Active Employees', count: stats.active_employees || 0, icon: <FaUserCheck />, color: '#10B981' },
            { label: 'Onboarding Pending', count: stats.onboarding_employees || 0, icon: <FaClock />, color: '#F59E0B' },
            { label: 'Managers', count: stats.total_managers || 0, icon: <FaSitemap />, color: '#8B5CF6' },
            { label: 'Team Leaders', count: stats.total_tls || 0, icon: <FaSitemap />, color: '#3B82F6' },
            { label: 'Telecallers (TC)', count: stats.total_tcs || 0, icon: <FaUsers />, color: '#EC4899' }
          ].map((st, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${st.color}15`, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {st.icon}
              </div>
              <div>
                <span style={{ fontSize: '11.5px', color: C.textMid, fontWeight: 700 }}>{st.label}</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: C.text }}>{st.count}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Onboarding Funnel Progress Bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: C.textMid, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔄 Employee Onboarding Pipeline Stage Tracker
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { title: 'Candidate', status: '✅ Registered' },
              { title: 'Interview', status: '✅ Selected' },
              { title: 'Employee ID', status: '✅ Generated' },
              { title: 'Joining Form', status: '📋 Submitted' },
              { title: 'Terms & Video', status: '🎥 Verified' },
              { title: 'KYC Docs', status: '🪪 Reviewed' },
              { title: 'Product Links', status: '🔗 Assigned' },
              { title: 'Active Employee', status: '🚀 Active' }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '8px 12px', textAlign: 'center', flex: 1, minWidth: '110px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>{step.title}</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: C.teal }}>{step.status}</div>
                </div>
                {idx < 7 && <span style={{ color: C.textMid, fontWeight: 900 }}>➔</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
          {[
            { id: 'all', label: 'All Employees Directory', icon: <FaUsers /> },
            { id: 'hierarchy', label: 'Team Hierarchy Tree', icon: <FaSitemap /> },
            { id: 'links', label: 'Product Links & Incentives', icon: <FaLink /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                background: activeTab === tab.id ? C.teal : C.card, 
                color: activeTab === tab.id ? '#fff' : C.textMid, 
                border: `1px solid ${activeTab === tab.id ? C.teal : C.border}`, 
                padding: '10px 20px', borderRadius: '12px', fontSize: '14px', 
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Directory Tab View */}
        {activeTab === 'all' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
            {/* Filters Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }} />
                  <input 
                    type="text" 
                    placeholder="Search by Employee ID, Name, Mobile..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '9px 14px 9px 38px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, outline: 'none', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <select value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)} style={{ padding: '9px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}>
                  <option value="">All Designations</option>
                  <option value="Manager">Manager</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="TC">Telecaller (TC)</option>
                  <option value="Sales Executive">Sales Executive</option>
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}>
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '14px 20px' }}>EMP ID</th>
                    <th style={{ padding: '14px 20px' }}>Employee Name</th>
                    <th style={{ padding: '14px 20px' }}>Designation</th>
                    <th style={{ padding: '14px 20px' }}>Manager / TL</th>
                    <th style={{ padding: '14px 20px' }}>Onboarding</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading records...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>No employees found matching criteria.</td></tr>
                  ) : employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 20px', fontWeight: 900, color: C.teal }}>{emp.employee_id}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: C.text }}>
                        {emp.full_name}
                        <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 400 }}>{emp.mobile_number}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>{emp.designation}</td>
                      <td style={{ padding: '14px 20px', color: C.textMid }}>
                        <div>{emp.manager_name ? `Mgr: ${emp.manager_name}` : 'Direct'}</div>
                        {emp.team_leader_name && <div style={{ fontSize: '12px' }}>TL: {emp.team_leader_name}</div>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, background: C.bgSecondary, height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${emp.overall_progress || 35}%`, background: C.teal, height: '100%' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{emp.overall_progress || 35}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button 
                          onClick={() => handleActivateEmployee(emp.id, emp.activation_status)}
                          style={{ 
                            padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer',
                            background: emp.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                            color: emp.activation_status === 'APPROVED' ? '#065F46' : '#92400E'
                          }}
                        >
                          {emp.activation_status === 'APPROVED' ? 'Active / Approved' : 'Pending Activation'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpen360View(emp)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaEye /> 360 View
                          </button>
                          <button onClick={() => { setHierarchyModalEmp(emp); setHierarchyForm({ hierarchy_level: emp.designation === 'Manager' ? 'MANAGER' : emp.designation === 'Team Leader' ? 'TEAM_LEADER' : 'TC', manager_id: emp.manager_id || '', team_leader_id: emp.team_leader_id || '' }); }} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaSitemap /> Assign Team
                          </button>
                          <button onClick={() => setLinkModalEmp(emp)} style={{ background: C.teal, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaLink /> Links
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hierarchy Tab View */}
        {activeTab === 'hierarchy' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px' }}>🌳 Employee Reporting Hierarchy Architecture</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {managersList.length === 0 ? (
                <div style={{ padding: '20px', color: C.textMid }}>No Manager roles configured yet. Assign designation 'Manager' to start structuring team hierarchy.</div>
              ) : managersList.map(mgr => {
                const managerTLs = tlsList.filter(tl => tl.manager_id === mgr.id || tl.manager_name === mgr.full_name);
                const managerTCs = employees.filter(tc => tc.designation === 'TC' && (tc.manager_id === mgr.id || tc.manager_name === mgr.full_name));

                return (
                  <div key={mgr.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                        M
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 900 }}>{mgr.full_name}</div>
                        <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>Manager ({mgr.employee_id})</div>
                      </div>
                    </div>

                    {/* Team Leaders under this Manager */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '12px' }}>
                      {managerTLs.length === 0 ? (
                        <div style={{ fontSize: '12px', color: C.textMid }}>No direct Team Leaders assigned.</div>
                      ) : managerTLs.map(tl => {
                        const tlTCs = managerTCs.filter(tc => tc.team_leader_id === tl.id || tc.team_leader_name === tl.full_name);
                        return (
                          <div key={tl.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#3B82F6' }}>TL: {tl.full_name} ({tl.employee_id})</div>
                            <div style={{ fontSize: '11px', color: C.textMid, marginTop: '4px' }}>Assigned TCs: {tlTCs.length}</div>

                            {tlTCs.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {tlTCs.map(tc => (
                                  <span key={tc.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                                    {tc.full_name} ({tc.employee_id})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Links Tab View */}
        {activeTab === 'links' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>🏦 Employee-Specific Product Referral Links & Fixed Incentives</h2>
            <p style={{ fontSize: '13px', color: C.textMid, marginBottom: '20px' }}>
              Unlike Partner Commission URLs, employee referral links are isolated per employee record using <code>employee_product_links</code>.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>Employee</th>
                    <th style={{ padding: '12px 16px' }}>Designation</th>
                    <th style={{ padding: '12px 16px' }}>Active Links Count</th>
                    <th style={{ padding: '12px 16px' }}>Incentives Earned</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800 }}>
                        {emp.full_name} <span style={{ color: C.teal, fontWeight: 900 }}>({emp.employee_id})</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{emp.designation}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800 }}>{emp.active_links_count || 0} Products Assigned</td>
                      <td style={{ padding: '12px 16px', fontWeight: 900, color: '#10B981' }}>₹{emp.total_incentives_earned || 0}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => setLinkModalEmp(emp)} style={{ background: C.teal, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                          + Assign Product Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MODAL: 360° Employee View Inspector ── */}
        {selectedEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}` }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Employee 360° Profile Inspector</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: C.text }}>{selectedEmp.full_name} ({selectedEmp.employee_id})</h2>
                </div>
                <button onClick={() => setSelectedEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>✕</button>
              </div>

              {loading360 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: C.textMid }}>Loading 360 details...</div>
              ) : emp360Data && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Profile Summary Card */}
                  <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Mobile Number</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.mobile_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Email Address</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.email_id}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Designation</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: C.teal }}>{emp360Data.employee.designation}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Department</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.department}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Offered Salary</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#10B981' }}>₹{emp360Data.employee.offered_salary || 0} / month</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>Joining Date</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp360Data.employee.joining_date ? new Date(emp360Data.employee.joining_date).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Onboarding Checklist Matrix */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text }}>📋 Onboarding & Verification Status Checklist</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {[
                        { label: 'Interview Completed', status: emp360Data.checklist?.interview_completed },
                        { label: 'Employee Created', status: emp360Data.checklist?.employee_created },
                        { label: 'Terms & Video', status: emp360Data.checklist?.terms_completed },
                        { label: 'Joining Form', status: emp360Data.checklist?.joining_form_completed },
                        { label: 'KYC Verified', status: emp360Data.checklist?.kyc_verified },
                        { label: 'Links Assigned', status: emp360Data.checklist?.links_assigned },
                        { label: 'Activated', status: emp360Data.checklist?.activated }
                      ].map((item, i) => (
                        <div key={i} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.status ? <FaCheckCircle style={{ color: '#10B981' }} /> : <FaClock style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text }}>📄 Uploaded Employee Verification Documents</h3>
                    {emp360Data.documents?.length === 0 ? (
                      <div style={{ fontSize: '12px', color: C.textMid }}>No verification documents uploaded yet.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {emp360Data.documents.map(doc => (
                          <a key={doc.id} href={doc.document_url} target="_blank" rel="noopener noreferrer" style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: '10px', textDecoration: 'none', color: C.teal, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaFileAlt /> {doc.document_type.toUpperCase()}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Product Referral Links */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text }}>🔗 Assigned Referral Links & Incentive Rules</h3>
                    {emp360Data.product_links?.length === 0 ? (
                      <div style={{ fontSize: '12px', color: C.textMid }}>No product referral links assigned to this employee.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {emp360Data.product_links.map(pl => (
                          <div key={pl.id} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 800 }}>{pl.product_name}</span>
                              <div style={{ fontSize: '11px', color: C.textMid }}>URL: {pl.employee_referral_url}</div>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 900, color: '#10B981' }}>
                              ₹{pl.incentive_amount} Incentive ({pl.incentive_type})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                    <button onClick={() => handleActivateEmployee(selectedEmp.id, selectedEmp.activation_status)} style={{ background: selectedEmp.activation_status === 'APPROVED' ? '#EF4444' : '#10B981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                      {selectedEmp.activation_status === 'APPROVED' ? 'Deactivate Employee' : 'Activate Employee'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL: Assign Product Link & Incentive ── */}
        {linkModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>Assign Product Link & Employee Incentive</h2>
              <p style={{ fontSize: '14px', color: C.textMid, marginBottom: '20px' }}>Employee: <strong>{linkModalEmp.full_name} ({linkModalEmp.employee_id})</strong></p>

              <form onSubmit={handleAssignLinkSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Select Product *</label>
                  <select required value={linkForm.product_id} onChange={(e) => setLinkForm({ ...linkForm, product_id: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                    <option value="">Select Product...</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Employee Incentive Amount (₹) *</label>
                  <input type="number" required value={linkForm.incentive_amount} onChange={(e) => setLinkForm({ ...linkForm, incentive_amount: e.target.value })} placeholder="e.g. 500" style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                  <span style={{ fontSize: '11px', color: C.textMid }}>Separate from Partner commission rules.</span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Custom Referral URL (Optional)</label>
                  <input type="url" value={linkForm.employee_referral_url} onChange={(e) => setLinkForm({ ...linkForm, employee_referral_url: e.target.value })} placeholder={`Auto-generated: https://gharkapaisa.in/apply/...?emp=${linkModalEmp.employee_id}`} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setLinkModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Save & Assign Link</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: Assign Hierarchy / Team ── */}
        {hierarchyModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 8px 0' }}>Assign Team & Reporting Manager</h2>
              <p style={{ fontSize: '14px', color: C.textMid, marginBottom: '20px' }}>Employee: <strong>{hierarchyModalEmp.full_name} ({hierarchyModalEmp.employee_id})</strong></p>

              <form onSubmit={handleAssignHierarchySubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Hierarchy Level *</label>
                  <select value={hierarchyForm.hierarchy_level} onChange={(e) => setHierarchyForm({ ...hierarchyForm, hierarchy_level: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                    <option value="TC">Telecaller (TC)</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Assign Reporting Manager</label>
                  <select value={hierarchyForm.manager_id} onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                    <option value="">Direct / No Manager</option>
                    {managersList.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.employee_id})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Assign Team Leader</label>
                  <select value={hierarchyForm.team_leader_id} onChange={(e) => setHierarchyForm({ ...hierarchyForm, team_leader_id: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}>
                    <option value="">No Team Leader</option>
                    {tlsList.map(tl => (
                      <option key={tl.id} value={tl.id}>{tl.full_name} ({tl.employee_id})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setHierarchyModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Save Hierarchy</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
