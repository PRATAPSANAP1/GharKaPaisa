import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdAdd, MdList, MdAssignment, MdBarChart, MdSearch, MdShield 
} from 'react-icons/md';

const INSURANCE_TYPES = [
  { slug: 'health-insurance', title: 'Health Insurance' },
  { slug: 'life-insurance', title: 'Life Insurance' },
  { slug: 'general-insurance', title: 'General Insurance' }
];

export default function ManageAdminInsurance() {
  const { insuranceType, tab } = useParams();
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const activeInsuranceType = insuranceType || 'health-insurance';
  const activeTab = tab || 'list';

  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile: '',
    email: '',
    policy_type: 'Comprehensive',
    sum_insured: '',
    premium_amount: '',
    nominee_name: '',
    pincode: '',
    city: '',
    state: '',
    remarks: ''
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/insurance-applications', {
        params: {
          insurance_type_slug: activeInsuranceType,
          status: statusFilter,
          search: search.trim()
        }
      });
      if (res.data?.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching insurance applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/crm/insurance-applications/reports', {
        params: { insurance_type_slug: activeInsuranceType }
      });
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching insurance reports:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchReports();
  }, [activeInsuranceType, activeTab, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/crm/insurance-applications', {
        ...formData,
        insurance_type_slug: activeInsuranceType
      });
      if (res.data?.success) {
        alert('Insurance application created successfully!');
        setFormData({
          customer_name: '', mobile: '', email: '', policy_type: 'Comprehensive',
          sum_insured: '', premium_amount: '', nominee_name: '',
          pincode: '', city: '', state: '', remarks: ''
        });
        navigate(`/admin/insurance/${activeInsuranceType}/list`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create insurance application');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/crm/insurance-applications/${id}/status`, { status });
      if (res.data?.success) {
        fetchApplications();
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const currentInsuranceMeta = INSURANCE_TYPES.find(i => i.slug === activeInsuranceType) || INSURANCE_TYPES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER & INSURANCE TYPE SELECTOR */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '20px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admin Insurance Management
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
            {currentInsuranceMeta.title} Module
          </h2>
        </div>

        {/* Insurance Type Selector */}
        <select
          value={activeInsuranceType}
          onChange={(e) => navigate(`/admin/insurance/${e.target.value}/${activeTab}`)}
          style={{ ...S.input, width: '220px', height: '42px', fontSize: '13px', fontWeight: 800, color: '#F59E0B' }}
        >
          {INSURANCE_TYPES.map(ins => (
            <option key={ins.slug} value={ins.slug}>{ins.title}</option>
          ))}
        </select>
      </div>

      {/* ACTION TABS */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        {[
          { key: 'add', label: 'Add Application', icon: MdAdd },
          { key: 'list', label: 'List', icon: MdList },
          { key: 'applications', label: 'Applications CRM', icon: MdAssignment },
          { key: 'reports', label: 'Reports', icon: MdBarChart }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => navigate(`/admin/insurance/${activeInsuranceType}/${t.key}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: isActive ? `1px solid #F59E0B` : `1px solid ${C.border}`,
                background: isActive ? '#F59E0B20' : C.card,
                color: isActive ? '#F59E0B' : C.text,
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. ADD APPLICATION TAB */}
      {activeTab === 'add' && (
        <div style={{ background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginBottom: '20px' }}>
            New {currentInsuranceMeta.title} Policy Application
          </h3>
          <form onSubmit={handleCreateApplication} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={S.label}>Customer Full Name *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Mobile Number *</label>
              <input
                type="tel"
                maxLength={10}
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Policy Sub-Type</label>
              <input
                type="text"
                value={formData.policy_type}
                onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Sum Insured (₹)</label>
              <input
                type="number"
                value={formData.sum_insured}
                onChange={(e) => setFormData({ ...formData, sum_insured: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Annual Premium Amount (₹)</label>
              <input
                type="number"
                value={formData.premium_amount}
                onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Nominee Name</label>
              <input
                type="text"
                value={formData.nominee_name}
                onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: '#F59E0B', color: '#FFF', fontWeight: 800, fontSize: '14px', cursor: 'pointer'
                }}
              >
                Submit {currentInsuranceMeta.title} Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2 & 3. LIST & APPLICATIONS TAB */}
      {(activeTab === 'list' || activeTab === 'applications') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search policy applicant, mobile, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, height: '40px', flex: 1 }}
              />
              <button type="submit" style={{ padding: '0 16px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                <MdSearch size={18} />
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...S.input, width: '160px', height: '40px', fontSize: '13px' }}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Applicant</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Mobile</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Sum Insured</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Premium</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>Loading applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>No {currentInsuranceMeta.title} applications found.</td></tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>{app.customer_name}</td>
                      <td style={{ padding: '14px 16px' }}>{app.mobile}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>
                        ₹{parseFloat(app.sum_insured || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#10B981' }}>
                        ₹{parseFloat(app.premium_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                          background: app.status === 'approved' ? '#10B98120' : app.status === 'rejected' ? '#EF444420' : '#F59E0B20',
                          color: app.status === 'approved' ? '#10B981' : app.status === 'rejected' ? '#EF4444' : '#F59E0B'
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'approved')}
                          style={{ background: '#10B98120', color: '#10B981', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 800, cursor: 'pointer', marginRight: '6px' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          style={{ background: '#EF444420', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 4. REPORTS TAB */}
      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Total Applications</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.text, marginTop: '6px' }}>
              {reports?.total_applications || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Approved</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
              {reports?.approved_count || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Rejected</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#EF4444', marginTop: '6px' }}>
              {reports?.rejected_count || 0}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: '18px', padding: '20px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Total Premium Collected</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
              ₹{parseFloat(reports?.total_premium_amount || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
