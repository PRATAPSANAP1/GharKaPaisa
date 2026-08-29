import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaUsers, FaUserCheck, FaSitemap, FaLink, FaSearch, 
  FaPlus, FaCheckCircle, FaTimesCircle, FaEye, FaEdit, FaCheck, FaLock 
} from 'react-icons/fa';
import axios from 'axios';

export default function EmployeeManagement() {
  const { C } = useTheme();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'hierarchy', 'links'
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empDetailData, setEmpDetailData] = useState(null);
  const [linkModalEmp, setLinkModalEmp] = useState(null);

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

      const empRes = await axios.get('/api/v1/employees', { params: { search: searchTerm } });
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
  }, [searchTerm]);

  const handleActivateEmployee = async (empId, currentActivation) => {
    const newActivation = currentActivation === 'APPROVED' ? 'PENDING' : 'APPROVED';
    try {
      const res = await axios.post(`/api/v1/employees/${empId}/activate`, {
        activation_status: newActivation,
        employee_status: newActivation === 'APPROVED' ? 'ACTIVE' : 'INACTIVE'
      });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Activation failed');
    }
  };

  const handleOpen360View = async (emp) => {
    setSelectedEmp(emp);
    try {
      const res = await axios.get(`/api/v1/employees/${emp.id}`);
      if (res.data.success) {
        setEmpDetailData(res.data.data);
      }
    } catch (err) {
      console.error(err);
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

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 24px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Super Admin Operations
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Management Center</h1>
          </div>
        </div>

        {/* Global Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Employees', count: stats.total_employees || 0, icon: <FaUsers />, color: C.teal },
            { label: 'Active Employees', count: stats.active_employees || 0, icon: <FaUserCheck />, color: '#10B981' },
            { label: 'Onboarding Pending', count: stats.onboarding_employees || 0, icon: <FaUserCheck />, color: '#F59E0B' },
            { label: 'Managers', count: stats.total_managers || 0, icon: <FaSitemap />, color: '#8B5CF6' },
            { label: 'Team Leaders', count: stats.total_tls || 0, icon: <FaSitemap />, color: '#3B82F6' },
            { label: 'Telecallers (TC)', count: stats.total_tcs || 0, icon: <FaUsers />, color: '#EC4899' }
          ].map((st, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${st.color}15`, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                {st.icon}
              </div>
              <div>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>{st.label}</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: C.text }}>{st.count}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
          {[
            { id: 'all', label: 'All Employees', icon: <FaUsers /> },
            { id: 'hierarchy', label: 'Team Hierarchy', icon: <FaSitemap /> },
            { id: 'links', label: 'Product Links Assignment', icon: <FaLink /> }
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

        {/* Employee Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <input 
              type="text" 
              placeholder="Search by Employee ID, Name, Mobile..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '300px', padding: '8px 14px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textMid, fontWeight: 700 }}>
                  <th style={{ padding: '14px 20px' }}>EMP ID</th>
                  <th style={{ padding: '14px 20px' }}>Employee Name</th>
                  <th style={{ padding: '14px 20px' }}>Designation</th>
                  <th style={{ padding: '14px 20px' }}>Reporting Manager</th>
                  <th style={{ padding: '14px 20px' }}>Onboarding</th>
                  <th style={{ padding: '14px 20px' }}>Activation</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '14px 20px', fontWeight: 900, color: C.teal }}>{emp.employee_id}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 800, color: C.text }}>
                      {emp.full_name}
                      <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 400 }}>{emp.mobile_number}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>{emp.designation}</td>
                    <td style={{ padding: '14px 20px', color: C.textMid }}>{emp.manager_name || 'Direct / None'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: C.bgSecondary, height: '8px', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ width: `${emp.overall_progress || 20}%`, background: C.teal, height: '100%' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{emp.overall_progress || 20}%</span>
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
                        <button onClick={() => handleOpen360View(emp)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          <FaEye /> 360 View
                        </button>
                        <button onClick={() => setLinkModalEmp(emp)} style={{ background: C.teal, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                          <FaLink /> Assign Links
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Assign Employee Referral Link & Incentive */}
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
                  <span style={{ fontSize: '11px', color: C.textMid }}>Distinct from Partner commission structure.</span>
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

      </div>
    </div>
  );
}
