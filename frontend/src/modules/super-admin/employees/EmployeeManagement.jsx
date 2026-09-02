import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUsers, FaUserCheck, FaSitemap, FaLink, FaSearch, 
  FaPlus, FaCheckCircle, FaTimesCircle, FaEye, FaEdit, FaCheck, FaLock,
  FaFileAlt, FaVideo, FaUniversity, FaBuilding, FaBriefcase, FaIdCard, FaPhone, FaEnvelope, FaClock, FaUserCircle,
  FaUserTimes, FaUnlink, FaChartLine, FaTrophy, FaEllipsisV, FaDownload, FaRedo, FaInfoCircle, FaChevronRight
} from 'react-icons/fa';
import api from '../../../services/api';

export default function EmployeeManagement() {
  const { C } = useTheme();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'hierarchy', 'links'
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');

  // Hierarchy Tree selected Manager & Popovers
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [popoverEmpId, setPopoverEmpId] = useState(null);

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [emp360Data, setEmp360Data] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [linkModalEmp, setLinkModalEmp] = useState(null);
  const [hierarchyModalEmp, setHierarchyModalEmp] = useState(null);
  const [actionModalEmp, setActionModalEmp] = useState(null);
  const [perfModalEmp, setPerfModalEmp] = useState(null);

  // Hierarchy Form
  const [hierarchyForm, setHierarchyForm] = useState({
    hierarchy_level: 'TC',
    manager_id: '',
    team_leader_id: '',
    selected_tl_ids: [],
    selected_tc_ids: []
  });

  const openHierarchyModal = (emp) => {
    setHierarchyModalEmp(emp);
    const currentRole = (emp.hierarchy_level || (emp.designation === 'Manager' ? 'MANAGER' : emp.designation === 'Team Leader' ? 'TEAM_LEADER' : 'TC')).toUpperCase();
    
    // Find current TLs reporting to this manager (if manager)
    const currentTLs = employees
      .filter(e => e.id !== emp.id && (e.manager_id === emp.id || e.manager_name === emp.full_name) && (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER'))
      .map(e => e.id);

    // Find current TCs reporting to this employee (if manager or TL)
    const currentTCs = employees
      .filter(e => e.id !== emp.id && (e.designation === 'TC' || e.hierarchy_level === 'TC') && (
        (currentRole === 'MANAGER' && (e.manager_id === emp.id || e.manager_name === emp.full_name)) ||
        (currentRole === 'TEAM_LEADER' && (e.team_leader_id === emp.id || e.team_leader_name === emp.full_name))
      ))
      .map(e => e.id);

    setHierarchyForm({
      hierarchy_level: currentRole,
      manager_id: emp.manager_id || '',
      team_leader_id: emp.team_leader_id || '',
      selected_tl_ids: currentTLs,
      selected_tc_ids: currentTCs
    });
  };

  const handleAssignHierarchySubmit = async (e) => {
    e.preventDefault();
    if (!hierarchyModalEmp) return;
    try {
      const role = hierarchyForm.hierarchy_level || 'TC';
      
      // 1. Update target employee's own hierarchy
      const payload = {
        hierarchy_level: role,
        manager_id: (role === 'MANAGER') ? null : (hierarchyForm.manager_id || null),
        team_leader_id: (role === 'TC') ? (hierarchyForm.team_leader_id || null) : null
      };
      await api.post(`/employees/${hierarchyModalEmp.id}/hierarchy`, payload);

      // 2. If MANAGER role, assign selected TLs to report to this Manager
      if (role === 'MANAGER' && Array.isArray(hierarchyForm.selected_tl_ids)) {
        const prevTLs = employees.filter(e => (e.manager_id === hierarchyModalEmp.id || e.manager_name === hierarchyModalEmp.full_name) && (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER'));
        for (const prevTl of prevTLs) {
          if (!hierarchyForm.selected_tl_ids.includes(prevTl.id)) {
            await api.post(`/employees/${prevTl.id}/hierarchy`, {
              hierarchy_level: 'TEAM_LEADER',
              manager_id: null,
              team_leader_id: null
            });
          }
        }
        for (const tlId of hierarchyForm.selected_tl_ids) {
          await api.post(`/employees/${tlId}/hierarchy`, {
            hierarchy_level: 'TEAM_LEADER',
            manager_id: hierarchyModalEmp.id,
            team_leader_id: null
          });
        }
      }

      // 3. If MANAGER or TEAM_LEADER role, assign selected TCs to report to this Manager / TL
      if ((role === 'MANAGER' || role === 'TEAM_LEADER') && Array.isArray(hierarchyForm.selected_tc_ids)) {
        const targetMgrId = (role === 'MANAGER') ? hierarchyModalEmp.id : (hierarchyForm.manager_id || null);
        const targetTlId = (role === 'TEAM_LEADER') ? hierarchyModalEmp.id : (hierarchyForm.selected_tl_ids?.[0] || null);

        for (const tcId of hierarchyForm.selected_tc_ids) {
          await api.post(`/employees/${tcId}/hierarchy`, {
            hierarchy_level: 'TC',
            manager_id: targetMgrId,
            team_leader_id: targetTlId
          });
        }
      }

      alert('Employee hierarchy and team assignments updated successfully!');
      setHierarchyModalEmp(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Hierarchy assignment failed');
    }
  };

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
      const statsRes = await api.get('/employees/stats');
      if (statsRes.data.success) setStats(statsRes.data.data);

      const empRes = await api.get('/employees', { 
        params: { 
          search: searchTerm,
          status: statusFilter,
          designation: designationFilter
        } 
      });
      if (empRes.data.success) setEmployees(empRes.data.data);

      const prodRes = await api.get('/products');
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
      const res = await api.post(`/employees/${empId}/activate`, {
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

  const handleKycVerify = async (empId, status) => {
    const actionLabel = status === 'VERIFIED' ? 'Approve KYC & Activate' : 'Reject KYC';
    if (!window.confirm(`Are you sure you want to ${actionLabel} for this employee?`)) return;

    let notes = '';
    if (status === 'REJECTED') {
      notes = prompt('Enter rejection / re-upload reason for Employee KYC:');
      if (!notes || !notes.trim()) return;
    }

    try {
      const res = await api.post(`/employees/${empId}/kyc-verify`, {
        kyc_status: status,
        review_notes: notes ? notes.trim() : null
      });
      if (res.data.success) {
        alert(`Employee KYC successfully updated to ${status}`);
        fetchData();
        if (selectedEmp && selectedEmp.id === empId) {
          handleOpen360View(selectedEmp);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'KYC status update failed');
    }
  };

  const handleOpen360View = async (emp) => {
    setSelectedEmp(emp);
    setLoading360(true);
    try {
      const res = await api.get(`/employees/${emp.id}`);
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
      const res = await api.post(`/employees/${linkModalEmp.id}/product-links`, linkForm);
      if (res.data.success) {
        alert('Product link and employee incentive assigned successfully!');
        setLinkModalEmp(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Link assignment failed');
    }
  };



  const handleUnassignHierarchy = async (empId, empName, empCode) => {
    if (!window.confirm(`Are you sure you want to unassign ${empName} (${empCode || 'N/A'}) from this team hierarchy?`)) return;
    try {
      const res = await api.post(`/employees/${empId}/unassign-hierarchy`);
      if (res.data.success) {
        alert(`${empName} unassigned from team hierarchy successfully.`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unassignment failed');
    }
  };

  const handleExportTree = () => {
    const currentMgr = managersList.find(m => m.id === selectedManagerId) || managersList[0];
    if (!currentMgr) return alert('No manager tree available to export.');
    
    const managerTLs = tlsList.filter(tl => tl.manager_id === currentMgr.id || tl.manager_name === currentMgr.full_name);
    const allManagerTCs = employees.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.manager_id === currentMgr.id || tc.manager_name === currentMgr.full_name));
    
    let csv = 'Level,Role,Employee Name,Employee ID,Mobile Number,Reporting To\n';
    csv += `Level 1,Manager,"${currentMgr.full_name}","${currentMgr.employee_id}","${currentMgr.mobile_number || ''}","Direct"\n`;
    
    managerTLs.forEach(tl => {
      csv += `Level 2,Team Leader,"${tl.full_name}","${tl.employee_id}","${tl.mobile_number || ''}","${currentMgr.full_name}"\n`;
      const tlTCs = employees.filter(tc => tc.team_leader_id === tl.id || tc.team_leader_name === tl.full_name);
      tlTCs.forEach(tc => {
        csv += `Level 3,Telecaller,"${tc.full_name}","${tc.employee_id}","${tc.mobile_number || ''}","${tl.full_name}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Hierarchy_Tree_${currentMgr.full_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const managersList = employees.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('manager') || e.hierarchy_level === 'MANAGER'));
  const tlsList = employees.filter(e => e.id !== hierarchyModalEmp?.id && (String(e.designation || '').toLowerCase().includes('team leader') || String(e.designation || '').toUpperCase() === 'TL' || e.hierarchy_level === 'TEAM_LEADER'));
  const selectManagersOptions = managersList.length > 0 ? managersList : employees.filter(e => e.id !== hierarchyModalEmp?.id);
  const selectTlsOptions = tlsList.length > 0 ? tlsList : employees.filter(e => e.id !== hierarchyModalEmp?.id);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '12px 16px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Super Admin Operations
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Management Center</h1>
          </div>
        </div>

        {/* Global Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
          {[
            { label: 'Total Employees', count: stats.total_employees || 0, icon: <FaUsers />, color: C.teal },
            { label: 'Active Employees', count: stats.active_employees || 0, icon: <FaUserCheck />, color: '#10B981' },
            { label: 'Onboarding Pending', count: stats.onboarding_employees || 0, icon: <FaClock />, color: '#F59E0B' },
            { label: 'Managers', count: stats.total_managers || 0, icon: <FaSitemap />, color: '#8B5CF6' },
            { label: 'Team Leaders', count: stats.total_tls || 0, icon: <FaSitemap />, color: '#3B82F6' },
            { label: 'Telecallers (TC)', count: stats.total_tcs || 0, icon: <FaUsers />, color: '#EC4899' }
          ].map((st, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${st.color}15`, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {st.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '10.5px', color: C.textMid, fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>{st.count}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'all', label: 'All Employees Directory', icon: <FaUsers /> },
            { id: 'hierarchy', label: 'Team Hierarchy Tree', icon: <FaSitemap /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                background: activeTab === tab.id ? C.teal : C.card, 
                color: activeTab === tab.id ? '#fff' : C.textMid, 
                border: `1px solid ${activeTab === tab.id ? C.teal : C.border}`, 
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', 
                fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Directory Tab View */}
        {activeTab === 'all' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '450px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <span 
                            style={{ 
                              padding: '3px 10px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 800,
                              background: emp.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                              color: emp.activation_status === 'APPROVED' ? '#065F46' : '#92400E'
                            }}
                          >
                            {emp.activation_status === 'APPROVED' ? '● Active Account' : '● Pending Activation'}
                          </span>

                          {emp.activation_status !== 'APPROVED' && (
                            <button
                              onClick={() => handleKycVerify(emp.id, 'VERIFIED')}
                              style={{
                                padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800,
                                background: '#10B981', color: '#ffffff', border: 'none', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}
                              title="Approve KYC and activate employee account"
                            >
                              <FaCheckCircle /> Approve KYC & Activate
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpen360View(emp)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaEye /> 360 View
                          </button>
                          <button onClick={() => openHierarchyModal(emp)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaSitemap /> Assign Team
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
        {activeTab === 'hierarchy' && (() => {
          const currentMgr = managersList.find(m => m.id === selectedManagerId) || managersList[0];
          const activeMgrId = currentMgr?.id;

          const managerTLs = activeMgrId ? tlsList.filter(tl => tl.manager_id === activeMgrId || tl.manager_name === currentMgr?.full_name) : [];
          const allManagerTCs = activeMgrId ? employees.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.manager_id === activeMgrId || tc.manager_name === currentMgr?.full_name)) : [];
          const directTCs = allManagerTCs.filter(tc => !tc.team_leader_id && !tc.team_leader_name);

          return (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '500px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: C.text }}>
                    Team Hierarchy Tree <FaInfoCircle style={{ fontSize: '15px', color: C.textMid, cursor: 'pointer' }} title="Visualize and manage reporting structure" />
                  </h2>
                  <p style={{ fontSize: '13px', color: C.textMid, margin: '4px 0 0' }}>
                    Visualize and manage your organization structure
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={fetchData} 
                    style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FaRedo style={{ fontSize: '12px', color: C.teal }} /> Refresh
                  </button>
                  <button 
                    onClick={handleExportTree} 
                    style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FaDownload style={{ fontSize: '12px', color: C.teal }} /> Export Tree
                  </button>
                </div>
              </div>

              {managersList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: C.bgSecondary, borderRadius: '16px', border: `1px dashed ${C.border}` }}>
                  <FaUserTimes style={{ fontSize: '32px', color: C.textMid, marginBottom: '12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>No Manager Roles Configured</div>
                  <div style={{ fontSize: '13px', color: C.textMid, marginTop: '4px' }}>
                    Click "Assign Team" on any employee in the Directory tab and set their hierarchy level to "Manager".
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Row: Manager Selection Cards / Tabs */}
                  <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: C.textMid, marginBottom: '12px' }}>
                      Select Manager
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div id="mgrCarousel" style={{ display: 'flex', gap: '12px', overflowX: 'auto', flexGrow: 1, paddingBottom: '4px', scrollBehavior: 'smooth' }}>
                        {managersList.map(mgr => {
                          const isSelected = (mgr.id === activeMgrId);
                          const tlsUnderMgr = tlsList.filter(tl => tl.manager_id === mgr.id || tl.manager_name === mgr.full_name);
                          const tcsUnderMgr = employees.filter(tc => (tc.designation === 'TC' || tc.hierarchy_level === 'TC') && (tc.manager_id === mgr.id || tc.manager_name === mgr.full_name));
                          const totalMembers = tlsUnderMgr.length + tcsUnderMgr.length;

                          return (
                            <div
                              key={mgr.id}
                              onClick={() => setSelectedManagerId(mgr.id)}
                              style={{
                                flexShrink: 0,
                                minWidth: '210px',
                                padding: '12px 16px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                background: isSelected ? 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)' : C.card,
                                color: isSelected ? '#FFFFFF' : C.text,
                                border: isSelected ? 'none' : `1px solid ${C.border}`,
                                boxShadow: isSelected ? '0 8px 20px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                              }}
                            >
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.2)' : '#E0E7FF', color: isSelected ? '#FFF' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', flexShrink: 0 }}>
                                {mgr.full_name?.charAt(0) || 'M'}
                              </div>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '14px', fontWeight: 900, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{mgr.full_name}</div>
                                <div style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.7, fontWeight: 700 }}>{mgr.employee_id}</div>
                                <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px', opacity: isSelected ? 0.95 : 0.8 }}>
                                  {totalMembers} Members
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          const el = document.getElementById('mgrCarousel');
                          if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: C.card, border: `1px solid ${C.border}`, color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <FaChevronRight style={{ fontSize: '12px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Tree Diagram for Selected Manager */}
                  {currentMgr && (
                    <div onClick={() => setPopoverEmpId(null)} style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                      
                      {/* LEVEL 1: MANAGER NODE */}
                      <div style={{ background: '#FFFFFF', border: `2px solid #818CF8`, borderRadius: '16px', padding: '16px 20px', minWidth: '320px', maxWidth: '380px', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.08)', position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
                              {currentMgr.full_name?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {currentMgr.full_name}
                                <span style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                                  MANAGER
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>{currentMgr.employee_id}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === currentMgr.id ? null : currentMgr.id); }}
                            title="Employee Actions"
                            style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '6px 10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                          >
                            <FaEllipsisV />
                          </button>
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                          <span>📞 {currentMgr.mobile_number || 'N/A'}</span>
                          <span style={{ fontWeight: 800, color: '#4F46E5' }}>👤 Total Members: {managerTLs.length + allManagerTCs.length}</span>
                        </div>

                        {/* Floating Context Popover Dropdown */}
                        {popoverEmpId === currentMgr.id && (
                          <div 
                            style={{ position: 'absolute', top: '48px', right: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '170px', padding: '6px 0' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div onClick={() => { setPopoverEmpId(null); handleOpen360View(currentMgr); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaEye style={{ fontSize: '13px', color: '#64748B' }} /> View Profile
                            </div>
                            <div onClick={() => { setPopoverEmpId(null); openHierarchyModal(currentMgr); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaEdit style={{ fontSize: '13px', color: '#64748B' }} /> Edit Details
                            </div>
                            <div onClick={() => { setPopoverEmpId(null); handleUnassignHierarchy(currentMgr.id, currentMgr.full_name, currentMgr.employee_id); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaUnlink style={{ fontSize: '13px', color: '#EF4444' }} /> Disassign Employee
                            </div>
                            <div onClick={() => { setPopoverEmpId(null); setPerfModalEmp(currentMgr); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaChartLine style={{ fontSize: '13px', color: '#64748B' }} /> View Performance
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stem Line Connecting Manager to TL Level */}
                      {(managerTLs.length > 0 || directTCs.length > 0) ? (
                        <>
                          <div style={{ width: '2px', height: '28px', background: '#818CF8', margin: '0 auto' }}></div>

                          {/* Level 2 horizontal connector branch bar if multiple nodes */}
                          <div style={{ width: '100%', overflowX: 'auto', padding: '0 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', alignItems: 'flex-start', minWidth: 'max-content', margin: '0 auto' }}>
                              
                              {/* TEAM LEADERS BRANCHES */}
                              {managerTLs.map(tl => {
                                const tlTCs = employees.filter(tc => tc.team_leader_id === tl.id || tc.team_leader_name === tl.full_name);
                                return (
                                  <div key={tl.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    
                                    {/* Stem line to TL node */}
                                    <div style={{ width: '2px', height: '20px', background: '#3B82F6' }}></div>

                                    {/* LEVEL 2: TEAM LEADER NODE */}
                                    <div style={{ background: '#FFFFFF', border: `2px solid #60A5FA`, borderRadius: '16px', padding: '14px 18px', minWidth: '280px', maxWidth: '320px', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.08)', position: 'relative', zIndex: 9 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px' }}>
                                            {tl.full_name?.charAt(0) || 'TL'}
                                          </div>
                                          <div>
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              {tl.full_name}
                                              <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '9.5px', fontWeight: 900, padding: '2px 6px', borderRadius: '10px' }}>
                                                TEAM LEADER
                                              </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>{tl.employee_id}</div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === tl.id ? null : tl.id); }}
                                          style={{ background: 'transparent', border: 'none', color: '#64748B', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                          <FaEllipsisV />
                                        </button>
                                      </div>

                                      <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #F1F5F9' }}>
                                        <span>📞 {tl.mobile_number || 'N/A'}</span>
                                        <span style={{ fontWeight: 800, color: '#2563EB' }}>👤 Team Members: {tlTCs.length}</span>
                                      </div>

                                      {/* Popover Dropdown for TL */}
                                      {popoverEmpId === tl.id && (
                                        <div 
                                          style={{ position: 'absolute', top: '44px', right: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '170px', padding: '6px 0' }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div onClick={() => { setPopoverEmpId(null); handleOpen360View(tl); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaEye style={{ fontSize: '13px', color: '#64748B' }} /> View Profile
                                          </div>
                                          <div onClick={() => { setPopoverEmpId(null); openHierarchyModal(tl); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaEdit style={{ fontSize: '13px', color: '#64748B' }} /> Edit Details
                                          </div>
                                          <div onClick={() => { setPopoverEmpId(null); handleUnassignHierarchy(tl.id, tl.full_name, tl.employee_id); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaUnlink style={{ fontSize: '13px', color: '#EF4444' }} /> Disassign Employee
                                          </div>
                                          <div onClick={() => { setPopoverEmpId(null); setPerfModalEmp(tl); }} style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaChartLine style={{ fontSize: '13px', color: '#64748B' }} /> View Performance
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Stem line to Level 3 TCs */}
                                    {tlTCs.length > 0 && <div style={{ width: '2px', height: '24px', background: '#93C5FD' }}></div>}

                                    {/* LEVEL 3: TELECALLERS VERTICAL CARDS IN HORIZONTAL ROW */}
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                      {tlTCs.map(tc => (
                                        <div 
                                          key={tc.id} 
                                          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px 12px', width: '135px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}
                                        >
                                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', marginBottom: '8px' }}>
                                            {tc.full_name?.charAt(0) || 'T'}
                                          </div>
                                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>
                                            {tc.full_name}
                                          </div>
                                          <span style={{ background: '#D1FAE5', color: '#047857', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                            TELECALLER
                                          </span>
                                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>{tc.employee_id}</div>
                                          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{tc.mobile_number || 'N/A'}</div>

                                          <button
                                            onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === tc.id ? null : tc.id); }}
                                            style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}
                                          >
                                            <FaEllipsisV />
                                          </button>

                                          {/* Popover Dropdown for TC */}
                                          {popoverEmpId === tc.id && (
                                            <div 
                                              style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '160px', padding: '6px 0', textAlign: 'left' }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div onClick={() => { setPopoverEmpId(null); handleOpen360View(tc); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FaEye style={{ fontSize: '12px', color: '#64748B' }} /> View Profile
                                              </div>
                                              <div onClick={() => { setPopoverEmpId(null); openHierarchyModal(tc); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FaEdit style={{ fontSize: '12px', color: '#64748B' }} /> Edit Details
                                              </div>
                                              <div onClick={() => { setPopoverEmpId(null); handleUnassignHierarchy(tc.id, tc.full_name, tc.employee_id); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FaUnlink style={{ fontSize: '12px', color: '#EF4444' }} /> Disassign Employee
                                              </div>
                                              <div onClick={() => { setPopoverEmpId(null); setPerfModalEmp(tc); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FaChartLine style={{ fontSize: '12px', color: '#64748B' }} /> View Performance
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* DIRECT TELECALLERS BRANCH (NO TL) */}
                              {directTCs.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: '2px', height: '20px', background: '#F59E0B' }}></div>

                                  <div style={{ background: '#FFFBEB', border: `1px solid #FCD34D`, borderRadius: '16px', padding: '12px 16px', marginBottom: '12px', textAlign: 'center' }}>
                                    <span style={{ background: '#F59E0B', color: '#FFF', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px' }}>
                                      DIRECT MEMBERS ({directTCs.length})
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {directTCs.map(tc => (
                                      <div 
                                        key={tc.id} 
                                        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px 12px', width: '135px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}
                                      >
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', marginBottom: '8px' }}>
                                          {tc.full_name?.charAt(0) || 'T'}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>
                                          {tc.full_name}
                                        </div>
                                        <span style={{ background: '#D1FAE5', color: '#047857', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                          TELECALLER
                                        </span>
                                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>{tc.employee_id}</div>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{tc.mobile_number || 'N/A'}</div>

                                        <button
                                          onClick={(e) => { e.stopPropagation(); setPopoverEmpId(popoverEmpId === tc.id ? null : tc.id); }}
                                          style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}
                                        >
                                          <FaEllipsisV />
                                        </button>

                                        {popoverEmpId === tc.id && (
                                          <div 
                                            style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '160px', padding: '6px 0', textAlign: 'left' }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div onClick={() => { setPopoverEmpId(null); handleOpen360View(tc); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <FaEye style={{ fontSize: '12px', color: '#64748B' }} /> View Profile
                                            </div>
                                            <div onClick={() => { setPopoverEmpId(null); setHierarchyModalEmp(tc); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <FaEdit style={{ fontSize: '12px', color: '#64748B' }} /> Edit Details
                                            </div>
                                            <div onClick={() => { setPopoverEmpId(null); handleUnassignHierarchy(tc.id, tc.full_name, tc.employee_id); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <FaUnlink style={{ fontSize: '12px', color: '#EF4444' }} /> Disassign Employee
                                            </div>
                                            <div onClick={() => { setPopoverEmpId(null); setPerfModalEmp(tc); }} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <FaChartLine style={{ fontSize: '12px', color: '#64748B' }} /> View Performance
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ marginTop: '20px', padding: '20px', textAlign: 'center', color: C.textMid, fontSize: '13px' }}>
                          No Team Leaders or Telecallers assigned under <strong>{currentMgr.full_name}</strong> yet.<br/>
                          <span style={{ fontSize: '12px', color: C.teal, fontWeight: 700 }}>Go to the Directory tab and click "Assign Team" on an employee to link them to this Manager.</span>
                        </div>
                      )}

                      {/* Bottom Stats Summary Bar & Legend */}
                      <div style={{ width: '100%', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#4F46E5', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>1</div>
                            Managers
                          </div>
                          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{managerTLs.length}</div>
                            Team Leaders
                          </div>
                          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#059669', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{allManagerTCs.length}</div>
                            Telecallers
                          </div>
                          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', fontWeight: 900, color: '#D97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#D97706', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{1 + managerTLs.length + allManagerTCs.length}</div>
                            Total Employees
                          </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', fontWeight: 700, color: '#64748B' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5' }}></span> Manager</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></span> Team Leader</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span> Telecaller</span>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* Product Links Tab View */}
        {activeTab === 'links' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', minHeight: '450px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUniversity style={{ color: C.teal }} /> Employee-Specific Product Referral Links & Fixed Incentives</h2>
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

                  {/* Joining Form & KYC Inspection Card */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '14px', color: C.teal, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaUserCircle /> Submitted Joining Form & Verification Details
                    </h3>
                    
                    {emp360Data.joining_details ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>1. Full Name & Email</span>
                          <strong>{emp360Data.joining_details.full_name}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>{emp360Data.joining_details.email_id}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>2. Role & Department</span>
                          <strong>{emp360Data.joining_details.designation}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>{emp360Data.joining_details.department}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>3. Salary & Joining Date</span>
                          <strong style={{ color: '#10B981' }}>₹{emp360Data.joining_details.offered_salary} / mo</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>Joining: {emp360Data.joining_details.joining_date ? new Date(emp360Data.joining_details.joining_date).toLocaleDateString() : 'N/A'}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>4. PAN & Aadhaar</span>
                          <strong>PAN: {emp360Data.joining_details.pan_number || 'N/A'}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>Aadhaar: {emp360Data.joining_details.aadhaar_number || 'N/A'}</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>5. Bank Account Details</span>
                          <strong>A/C: {emp360Data.joining_details.bank_account_number || 'N/A'}</strong>
                          <div style={{ fontSize: '12px', color: C.textMid }}>IFSC: {emp360Data.joining_details.ifsc_code || 'N/A'} ({emp360Data.joining_details.bank_account_holder_name})</div>
                        </div>

                        <div style={{ background: C.bgSecondary, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block' }}>6. Qualification & Status</span>
                          <strong>{emp360Data.joining_details.highest_qualification} ({emp360Data.joining_details.experience_type})</strong>
                          <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>Form Status: {emp360Data.joining_details.form_status}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: C.textMid, fontStyle: 'italic' }}>
                        Joining Details Form has not been submitted by employee yet.
                      </div>
                    )}
                  </div>

                  {/* Submitted KYC & Verification Documents Panel */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: C.teal, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaIdCard /> Submitted KYC Documents & Verification Details
                      </h3>
                      <span style={{
                        padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                        background: emp360Data.kyc?.kyc_status === 'VERIFIED' ? '#D1FAE5' : (emp360Data.kyc?.kyc_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'),
                        color: emp360Data.kyc?.kyc_status === 'VERIFIED' ? '#065F46' : (emp360Data.kyc?.kyc_status === 'REJECTED' ? '#991B1B' : '#92400E')
                      }}>
                        KYC STATUS: {emp360Data.kyc?.kyc_status || 'PENDING'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                      
                      {/* PAN Card Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block', marginBottom: '4px' }}>1. PAN Card Number</span>
                        <strong style={{ fontSize: '14px', letterSpacing: '0.5px' }}>{emp360Data.kyc?.pan_number || emp360Data.joining_details?.pan_number || 'Not Submitted'}</strong>
                        {emp360Data.kyc?.pan_document_url ? (
                          <a href={emp360Data.kyc.pan_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: C.card, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: '8px', color: C.teal, fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                            <FaFileAlt /> View PAN Card Doc ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No PAN file attached</div>
                        )}
                      </div>

                      {/* Aadhaar Card Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block', marginBottom: '4px' }}>2. Aadhaar Card Number</span>
                        <strong style={{ fontSize: '14px', letterSpacing: '0.5px' }}>{emp360Data.kyc?.aadhaar_number || emp360Data.joining_details?.aadhaar_number || 'Not Submitted'}</strong>
                        {emp360Data.kyc?.aadhaar_document_url ? (
                          <a href={emp360Data.kyc.aadhaar_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: C.card, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: '8px', color: C.teal, fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                            <FaFileAlt /> View Aadhaar Card Doc ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No Aadhaar file attached</div>
                        )}
                      </div>

                      {/* Bank Proof Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block', marginBottom: '4px' }}>3. Bank Account Proof</span>
                        <strong style={{ fontSize: '13px' }}>A/C: {emp360Data.kyc?.bank_account_number || emp360Data.joining_details?.bank_account_number || 'N/A'}</strong>
                        <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>IFSC: {emp360Data.kyc?.ifsc_code || emp360Data.joining_details?.ifsc_code || 'N/A'}</div>
                        {emp360Data.kyc?.bank_document_url ? (
                          <a href={emp360Data.kyc.bank_document_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: C.card, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: '8px', color: C.teal, fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                            <FaFileAlt /> View Bank Proof Doc ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No Bank file attached</div>
                        )}
                      </div>

                      {/* Verification Video Box */}
                      <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, display: 'block', marginBottom: '4px' }}>4. Verification Video</span>
                        <strong style={{ fontSize: '13px' }}>{emp360Data.terms?.video_url ? '🎥 Recording Submitted' : 'Not Uploaded'}</strong>
                        {emp360Data.terms?.video_url ? (
                          <a href={emp360Data.terms.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: C.teal, color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>
                            <FaVideo /> Play Verification Video ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: '11px', color: C.textMid, marginTop: '8px' }}>No video recording</div>
                        )}
                      </div>

                    </div>

                    {/* KYC Quick Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: `1px dashed ${C.border}`, paddingTop: '14px' }}>
                      <button onClick={() => handleKycVerify(selectedEmp.id, 'VERIFIED')} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaCheck /> Approve Employee KYC
                      </button>
                      <button onClick={() => handleKycVerify(selectedEmp.id, 'REJECTED')} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaTimesCircle /> Reject / Request Re-upload
                      </button>
                    </div>
                  </div>

                  {/* Onboarding Checklist Matrix */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}><FaCheckCircle style={{ color: C.teal }} /> Onboarding & Verification Status Checklist</h3>
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
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}><FaFileAlt style={{ color: C.teal }} /> Uploaded Employee Verification Documents</h3>
                    {(() => {
                      const uniqueDocs = [];
                      const seenTypes = new Set();
                      (emp360Data.documents || []).forEach(doc => {
                        const typeKey = (doc.document_type || '').toLowerCase().trim();
                        if (typeKey && !seenTypes.has(typeKey)) {
                          seenTypes.add(typeKey);
                          uniqueDocs.push(doc);
                        }
                      });

                      if (uniqueDocs.length === 0) {
                        return <div style={{ fontSize: '12px', color: C.textMid }}>No verification documents uploaded yet.</div>;
                      }

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          {uniqueDocs.map(doc => (
                            <a key={doc.id} href={doc.document_url} target="_blank" rel="noopener noreferrer" style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '10px 14px', borderRadius: '10px', textDecoration: 'none', color: C.teal, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaFileAlt /> {(doc.document_type || 'DOCUMENT').toUpperCase().replace('_', ' ')} ↗
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Assigned Product Referral Links */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '12px', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}><FaLink style={{ color: C.teal }} /> Assigned Referral Links & Incentive Rules</h3>
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
                      {selectedEmp.activation_status === 'APPROVED' ? 'Deactivate Employee' : 'Verify & Activate Account'}
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
            <div style={{ background: C.card, borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '0 0 4px 0' }}>Assign Team & Employee Role</h2>
              <p style={{ fontSize: '13.5px', color: C.textMid, marginBottom: '20px' }}>
                Employee: <strong>{hierarchyModalEmp.full_name} ({hierarchyModalEmp.employee_id})</strong>
              </p>

              <form onSubmit={handleAssignHierarchySubmit}>
                {/* 1. Employee Role Selection */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: C.text }}>
                    Employee Role *
                  </label>
                  <select 
                    value={hierarchyForm.hierarchy_level} 
                    onChange={(e) => setHierarchyForm({ ...hierarchyForm, hierarchy_level: e.target.value })} 
                    style={{ width: '100%', padding: '11px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px', fontWeight: 700 }}
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="TEAM_LEADER">Team Leader (TL)</option>
                    <option value="TC">Telecaller (TC)</option>
                  </select>
                </div>

                {/* 2. DYNAMIC FIELDS BASED ON SELECTED EMPLOYEE ROLE */}

                {/* CASE A: MANAGER */}
                {hierarchyForm.hierarchy_level === 'MANAGER' && (
                  <>
                    {/* Select Team Leader(s) for Manager */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '2px', color: C.text }}>
                        Select Team Leader(s)
                      </label>
                      <span style={{ fontSize: '11.5px', color: C.teal, display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                        Initially None (Select one or more Team Leaders)
                      </span>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {employees.filter(e => e.id !== hierarchyModalEmp.id && (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER')).length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '8px', textAlign: 'center' }}>No Team Leaders available</div>
                        ) : (
                          employees
                            .filter(e => e.id !== hierarchyModalEmp.id && (e.designation === 'Team Leader' || e.hierarchy_level === 'TEAM_LEADER'))
                            .map(tl => {
                              const checked = (hierarchyForm.selected_tl_ids || []).includes(tl.id);
                              return (
                                <label key={tl.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', fontSize: '13px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#EFF6FF' : 'transparent', marginBottom: '4px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_tl_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, tl.id]
                                        : currentList.filter(id => id !== tl.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_tl_ids: newIds });
                                    }}
                                  />
                                  <span style={{ fontWeight: checked ? 800 : 600 }}>{tl.full_name} ({tl.employee_id})</span>
                                </label>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Select Telecaller(s) for Manager */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '2px', color: C.text }}>
                        Select Telecaller(s)
                      </label>
                      <span style={{ fontSize: '11.5px', color: C.teal, display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                        Initially None (Select one or more Telecallers)
                      </span>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {employees.filter(e => e.id !== hierarchyModalEmp.id && (e.designation === 'TC' || e.hierarchy_level === 'TC')).length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '8px', textAlign: 'center' }}>No Telecallers available</div>
                        ) : (
                          employees
                            .filter(e => e.id !== hierarchyModalEmp.id && (e.designation === 'TC' || e.hierarchy_level === 'TC'))
                            .map(tc => {
                              const checked = (hierarchyForm.selected_tc_ids || []).includes(tc.id);
                              return (
                                <label key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', fontSize: '13px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#ECFDF5' : 'transparent', marginBottom: '4px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_tc_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, tc.id]
                                        : currentList.filter(id => id !== tc.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_tc_ids: newIds });
                                    }}
                                  />
                                  <span style={{ fontWeight: checked ? 800 : 600 }}>{tc.full_name} ({tc.employee_id})</span>
                                </label>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* CASE B: TEAM LEADER */}
                {hierarchyForm.hierarchy_level === 'TEAM_LEADER' && (
                  <>
                    {/* Assign Reporting Manager */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: C.text }}>
                        Assign Reporting Manager
                      </label>
                      <select 
                        value={hierarchyForm.manager_id} 
                        onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })} 
                        style={{ width: '100%', padding: '11px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}
                      >
                        <option value="">Direct / No Manager</option>
                        {selectManagersOptions.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.employee_id})</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Telecaller(s) for TL */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '2px', color: C.text }}>
                        Select Telecaller(s)
                      </label>
                      <span style={{ fontSize: '11.5px', color: C.teal, display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                        Initially None (Select one or more Telecallers)
                      </span>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px' }}>
                        {employees.filter(e => e.id !== hierarchyModalEmp.id && (e.designation === 'TC' || e.hierarchy_level === 'TC')).length === 0 ? (
                          <div style={{ fontSize: '12px', color: C.textMid, padding: '8px', textAlign: 'center' }}>No Telecallers available</div>
                        ) : (
                          employees
                            .filter(e => e.id !== hierarchyModalEmp.id && (e.designation === 'TC' || e.hierarchy_level === 'TC'))
                            .map(tc => {
                              const checked = (hierarchyForm.selected_tc_ids || []).includes(tc.id);
                              return (
                                <label key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', fontSize: '13px', color: C.text, cursor: 'pointer', borderRadius: '8px', background: checked ? '#ECFDF5' : 'transparent', marginBottom: '4px' }}>
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const currentList = hierarchyForm.selected_tc_ids || [];
                                      const newIds = e.target.checked
                                        ? [...currentList, tc.id]
                                        : currentList.filter(id => id !== tc.id);
                                      setHierarchyForm({ ...hierarchyForm, selected_tc_ids: newIds });
                                    }}
                                  />
                                  <span style={{ fontWeight: checked ? 800 : 600 }}>{tc.full_name} ({tc.employee_id})</span>
                                </label>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* CASE C: TELECALLER */}
                {hierarchyForm.hierarchy_level === 'TC' && (
                  <>
                    {/* Assign Reporting Manager */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: C.text }}>
                        Assign Reporting Manager
                      </label>
                      <select 
                        value={hierarchyForm.manager_id} 
                        onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })} 
                        style={{ width: '100%', padding: '11px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}
                      >
                        <option value="">Direct / No Manager</option>
                        {selectManagersOptions.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.employee_id})</option>
                        ))}
                      </select>
                    </div>

                    {/* Assign Team Leader */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: C.text }}>
                        Assign Team Leader
                      </label>
                      <select 
                        value={hierarchyForm.team_leader_id} 
                        onChange={(e) => setHierarchyForm({ ...hierarchyForm, team_leader_id: e.target.value })} 
                        style={{ width: '100%', padding: '11px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '13.5px' }}
                      >
                        <option value="">No Team Leader</option>
                        {selectTlsOptions.map(tl => (
                          <option key={tl.id} value={tl.id}>{tl.full_name} ({tl.employee_id})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setHierarchyModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Save Hierarchy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: Employee Node Action Options (View Profile, Disassign, View Performance) ── */}
        {actionModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px' }}>
                    {actionModalEmp.full_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text }}>{actionModalEmp.full_name}</h3>
                    <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>ID: {actionModalEmp.employee_id} • {actionModalEmp.designation || 'Employee'}</div>
                  </div>
                </div>
                <button onClick={() => setActionModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: C.textMid, fontWeight: 900 }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. View Profile */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    handleOpen360View(emp);
                  }}
                  style={{ width: '100%', padding: '14px 18px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', color: C.text, textAlign: 'left' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaUserCircle />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900 }}>View 360° Profile</div>
                    <div style={{ fontSize: '11px', color: C.textMid }}>Inspect KYC details, bank info, and active product links</div>
                  </div>
                </button>

                {/* 2. Disassign Employee */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    handleUnassignHierarchy(emp.id, emp.full_name, emp.employee_id);
                  }}
                  style={{ width: '100%', padding: '14px 18px', background: '#FEF2F2', border: `1px solid #FCA5A5`, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', color: '#991B1B', textAlign: 'left' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaUnlink />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#991B1B' }}>Disassign Employee</div>
                    <div style={{ fontSize: '11px', color: '#B91C1C' }}>Remove employee from current team & manager hierarchy</div>
                  </div>
                </button>

                {/* 3. View Performance */}
                <button
                  onClick={() => {
                    const emp = actionModalEmp;
                    setActionModalEmp(null);
                    setPerfModalEmp(emp);
                  }}
                  style={{ width: '100%', padding: '14px 18px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', color: C.text, textAlign: 'left' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    <FaChartLine />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900 }}>View Performance</div>
                    <div style={{ fontSize: '11px', color: C.textMid }}>Track lead submissions, incentives earned, and onboarding stats</div>
                  </div>
                </button>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={() => setActionModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '8px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>

            </div>
          </div>
        )}

        {/* ── MODAL: Employee Performance Dashboard ── */}
        {perfModalEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <FaTrophy />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text }}>Performance Analytics</h3>
                    <div style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>{perfModalEmp.full_name} ({perfModalEmp.employee_id})</div>
                  </div>
                </div>
                <button onClick={() => setPerfModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: C.textMid, fontWeight: 900 }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Total Applications</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: C.teal, marginTop: '4px' }}>{perfModalEmp.total_applications || 0}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>CRM Applications Processed</div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Incentives Earned</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>₹{Number(perfModalEmp.total_incentives_earned || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Completed payout incentives</div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Active Product Links</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#3B82F6', marginTop: '4px' }}>{perfModalEmp.active_links_count || 0}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Assigned referral URLs</div>
                </div>

                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, textTransform: 'uppercase' }}>Onboarding Progress</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#8B5CF6', marginTop: '4px' }}>{perfModalEmp.overall_progress || 20}%</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '2px' }}>Profile setup score</div>
                </div>
              </div>

              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.text }}>Account & KYC Verification Status</span>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 900, background: perfModalEmp.activation_status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7', color: perfModalEmp.activation_status === 'APPROVED' ? '#065F46' : '#92400E' }}>
                    {perfModalEmp.activation_status || 'PENDING'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: C.textMid }}>
                  KYC Verified: <strong>{perfModalEmp.kyc_verified ? 'Yes ✅' : 'No ⏳'}</strong> | Terms Accepted: <strong>{perfModalEmp.terms_completed ? 'Yes ✅' : 'No ⏳'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setPerfModalEmp(null); handleOpen360View(perfModalEmp); }} style={{ background: C.teal, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>View Full Profile</button>
                <button onClick={() => setPerfModalEmp(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
