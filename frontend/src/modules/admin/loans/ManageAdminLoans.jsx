import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import { 
  MdAdd, MdList, MdAssignment, MdBarChart, MdSearch, MdRefresh, MdCheckCircle, MdCancel 
} from 'react-icons/md';

const LOAN_TYPES = [
  { slug: 'personal-loan', title: 'Personal Loan' },
  { slug: 'home-loan', title: 'Home Loan' },
  { slug: 'business-loan', title: 'Business Loan' },
  { slug: 'loan-against-property', title: 'Loan Against Property' },
  { slug: 'gold-loan', title: 'Gold Loan' },
  { slug: 'vehicle-loan', title: 'Vehicle Loan' },
  { slug: 'education-loan', title: 'Education Loan' },
  { slug: 'overdraft', title: 'Overdraft' },
  { slug: 'working-capital', title: 'Working Capital' }
];

export default function ManageAdminLoans() {
  const { loanType, tab } = useParams();
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const activeLoanType = loanType || 'personal-loan';
  const activeTab = tab || 'list';

  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state for Add Application
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile: '',
    email: '',
    loan_amount: '',
    tenure_months: '12',
    interest_rate: '10.5',
    monthly_income: '',
    employer_name: '',
    pincode: '',
    city: '',
    state: '',
    remarks: ''
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/loan-applications', {
        params: {
          loan_type_slug: activeLoanType,
          status: statusFilter,
          search: search.trim()
        }
      });
      if (res.data?.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching loan applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/crm/loan-applications/reports', {
        params: { loan_type_slug: activeLoanType }
      });
      if (res.data?.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching loan reports:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchReports();
  }, [activeLoanType, activeTab, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/crm/loan-applications', {
        ...formData,
        loan_type_slug: activeLoanType
      });
      if (res.data?.success) {
        alert('Loan application created successfully!');
        setFormData({
          customer_name: '', mobile: '', email: '', loan_amount: '',
          tenure_months: '12', interest_rate: '10.5', monthly_income: '',
          employer_name: '', pincode: '', city: '', state: '', remarks: ''
        });
        navigate(`/admin/loans/${activeLoanType}/list`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create loan application');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/crm/loan-applications/${id}/status`, { status });
      if (res.data?.success) {
        fetchApplications();
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const currentLoanMeta = LOAN_TYPES.find(l => l.slug === activeLoanType) || LOAN_TYPES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER & LOAN TYPE SELECTOR */}
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
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admin Loan Management
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
            {currentLoanMeta.title} Module
          </h2>
        </div>

        {/* Loan Type Selector */}
        <select
          value={activeLoanType}
          onChange={(e) => navigate(`/admin/loans/${e.target.value}/${activeTab}`)}
          style={{ ...S.input, width: '220px', height: '42px', fontSize: '13px', fontWeight: 800, color: C.teal }}
        >
          {LOAN_TYPES.map(loan => (
            <option key={loan.slug} value={loan.slug}>{loan.title}</option>
          ))}
        </select>
      </div>

      {/* ACTION TABS (Add, List, Applications, Reports) */}
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
              onClick={() => navigate(`/admin/loans/${activeLoanType}/${t.key}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: isActive ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                background: isActive ? `${C.teal}20` : C.card,
                color: isActive ? C.teal : C.text,
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
            New {currentLoanMeta.title} Application
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
              <label style={S.label}>Loan Amount (₹)</label>
              <input
                type="number"
                value={formData.loan_amount}
                onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Tenure (Months)</label>
              <input
                type="number"
                value={formData.tenure_months}
                onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Monthly Income (₹)</label>
              <input
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div>
              <label style={S.label}>Employer / Business Name</label>
              <input
                type="text"
                value={formData.employer_name}
                onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                style={{ ...S.input, height: '42px' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px', borderRadius: '12px', border: 'none',
                  background: C.teal, color: '#FFF', fontWeight: 800, fontSize: '14px', cursor: 'pointer'
                }}
              >
                Submit {currentLoanMeta.title} Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2 & 3. LIST & APPLICATIONS CRM TAB */}
      {(activeTab === 'list' || activeTab === 'applications') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search applicant name, mobile, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, height: '40px', flex: 1 }}
              />
              <button type="submit" style={{ padding: '0 16px', background: C.teal, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
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

          {/* Table */}
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: isDark ? C.bgSecondary : '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Customer</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Mobile</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Loan Amount</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Rate / Tenure</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>Loading applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: C.textMid }}>No {currentLoanMeta.title} applications found.</td></tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>{app.customer_name}</td>
                      <td style={{ padding: '14px 16px' }}>{app.mobile}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: C.teal }}>
                        ₹{parseFloat(app.loan_amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{app.interest_rate}% / {app.tenure_months}m</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                          background: app.status === 'approved' ? '#10B98120' : app.status === 'rejected' ? '#EF444420' : `${C.teal}20`,
                          color: app.status === 'approved' ? '#10B981' : app.status === 'rejected' ? '#EF4444' : C.teal
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
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Total Disbursed</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: C.teal, marginTop: '6px' }}>
              ₹{parseFloat(reports?.total_disbursed_amount || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
