import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { usePartnerStore } from '../../../app/store/partnerStore';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import api from '../../../services/api';
import {
  MdSearch, MdPerson, MdPhone, MdEmail, MdWork,
  MdLocationOn, MdHistory, MdOutlineWhatsapp,
  MdAddBox, MdCreditCard, MdEdit, MdDelete,
  MdFileUpload, MdNoteAdd, MdAlarm, MdTag,
  MdFileDownload, MdWarning, MdClose, MdCheckCircle,
  MdViewModule, MdViewList, MdMergeType, MdTrendingUp,
  MdPeople, MdVerifiedUser, MdAccountBalanceWallet, MdFilterList
} from 'react-icons/md';

import CustomerCard from './components/CustomerCard';
import Customer360ProfileModal from './components/Customer360ProfileModal';
import CustomerMergeModal from './components/CustomerMergeModal';

const CUSTOMER_TAGS = ['All', 'VIP', 'High Salary', 'Self-Employed', 'Hot Lead', 'Follow Up', 'Re-Engaged'];

export default function PartnerCrm() {
  const { t } = useTranslation();
  const { C } = useTheme();
  const S = makeS(C);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isTeamMember = useAuthStore((state) => state.user?.role === 'TEAM_MEMBER');

  useEffect(() => {
    if (location.state?.openAddModal || searchParams.get('action') === 'add') {
      setShowAddModal(true);
    }
  }, [location.state, searchParams]);

  const fetchCustomers = usePartnerStore((state) => state.fetchCustomers);
  const customers = usePartnerStore((state) => state.customers);
  const isLoading = usePartnerStore((state) => state.isLoading);
  const createCustomer = usePartnerStore((state) => state.createCustomer);

  // Dashboard Metrics state
  const [metrics, setMetrics] = useState({
    total_customers: 0,
    new_customers: 0,
    interested_customers: 0,
    total_applications: 0,
    approved_applications: 0,
    rejected_applications: 0,
    conversion_rate: 0,
    revenue_generated: 0
  });

  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [active360CustomerId, setActive360CustomerId] = useState(null);

  // Add Customer Form
  const [custForm, setCustForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    panNumber: '',
    city: '',
    state: '',
    pincode: '',
    employmentType: 'Salaried',
    monthlyIncome: '',
    tag: 'Hot Lead'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      const res = await api.get('/customers/dashboard/metrics');
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load CRM metrics:', err);
    }
  };

  useEffect(() => {
    const viewParam = searchParams.get('view');
    fetchCustomers(viewParam ? { view: viewParam } : {});
    loadDashboardMetrics();
  }, [fetchCustomers, searchParams]);

  // Duplicate Check on Mobile / PAN Input
  const handleFormInputChange = (field, val) => {
    setCustForm(prev => {
      const updated = { ...prev, [field]: val };
      
      if (field === 'mobile' || field === 'panNumber') {
        const found = (customers || []).find(c => 
          (val && c.mobile === val.trim()) || 
          (val && c.pan_number && c.pan_number.toUpperCase() === val.trim().toUpperCase())
        );
        if (found) {
          setDuplicateWarning(`⚠️ Duplicate Warning: A customer with this ${field.toUpperCase()} already exists (${found.full_name}).`);
        } else {
          setDuplicateWarning('');
        }
      }
      return updated;
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!custForm.fullName.trim()) return setFormError('Customer Full Name is required');
    if (!custForm.mobile.trim() || custForm.mobile.trim().length < 10) return setFormError('Valid 10-digit Mobile Number is required');

    setFormLoading(true);
    try {
      const payload = {
        full_name: custForm.fullName,
        mobile: custForm.mobile,
        email: custForm.email || undefined,
        pan_number: custForm.panNumber || undefined,
        city: custForm.city || undefined,
        state: custForm.state || undefined,
        pincode: custForm.pincode || undefined,
        employment_type: custForm.employmentType.toLowerCase(),
        monthly_income: custForm.monthlyIncome ? parseFloat(custForm.monthlyIncome) : undefined,
        tags: custForm.tag ? [custForm.tag] : []
      };

      const res = await api.post('/customers', payload);
      if (res.data?.success) {
        alert('Customer Profile Created Successfully!');
        setShowAddModal(false);
        setCustForm({
          fullName: '', mobile: '', email: '', panNumber: '',
          city: '', state: '', pincode: '', employmentType: 'Salaried',
          monthlyIncome: '', tag: 'Hot Lead'
        });
        fetchCustomers();
        loadDashboardMetrics();
      }
    } catch (err) {
      if (err.response?.data?.is_duplicate) {
        setDuplicateWarning(`⚠️ ${err.response.data.message}`);
      } else {
        setFormError(err.response?.data?.message || 'Failed to create customer');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Filter Logic
  const filteredCustomers = (customers || []).filter(c => {
    const matchesSearch = !searchTerm || (
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pan_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = !statusFilter || c.pipeline_status === statusFilter;
    
    let matchesTag = true;
    if (selectedTag !== 'All') {
      if (Array.isArray(c.tags)) {
        matchesTag = c.tags.some(t => (t.name || t) === selectedTag);
      } else {
        matchesTag = c.tag === selectedTag;
      }
    }

    return matchesSearch && matchesStatus && matchesTag;
  });

  const exportCustomersCSV = () => {
    if (!customers || !customers.length) return alert('No customers found to export');
    const headers = ['Full Name', 'Mobile', 'Email', 'PAN', 'City', 'State', 'Monthly Income', 'Employment Type', 'Tag', 'Created At'];
    const rows = (filteredCustomers || []).map(c => [
      `"${(c.full_name || '').replace(/"/g, '""')}"`,
      `"${c.mobile || ''}"`,
      `"${c.email || ''}"`,
      `"${c.pan_number || ''}"`,
      `"${c.city || ''}"`,
      `"${c.state || ''}"`,
      c.monthly_income || 0,
      `"${c.employment_type || ''}"`,
      `"${c.tag || 'General'}"`,
      c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'export') {
      exportCustomersCSV();
    }
  }, [searchParams]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: '40px' }}>
      
      {/* Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isTeamMember && (
            <>
              <button
                onClick={exportCustomersCSV}
                style={{ ...S.btn('outline'), display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}
              >
                <MdFileDownload style={{ fontSize: '18px', color: C.primary }} />
                <span>{t("crm.exportCustomers", "Export Customers")}</span>
              </button>
              <button
                onClick={() => setShowMergeModal(true)}
                style={{ ...S.btn('outline'), display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}
              >
                <MdMergeType style={{ fontSize: '18px', color: C.teal }} />
                <span>{t("crm.mergeDuplicates", "Merge Duplicates")}</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setSearchParams(prev => {
                const p = new URLSearchParams(prev);
                p.set('action', 'add');
                return p;
              });
              setShowAddModal(true);
            }}
            style={{ ...S.btn('primary'), display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}
          >
            <MdAddBox style={{ fontSize: '20px' }} />
            <span>{t("crm.addNewCustomer", "Add New Customer")}</span>
          </button>
        </div>
      </div>

      {/* ── CUSTOMER DASHBOARD KPI SUMMARY MATRIX ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '8px' : '14px', marginBottom: '28px' }}>
        <div style={{ ...S.card, padding: isMobile ? '10px 6px' : '16px', borderRadius: '14px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.totalCustomers", "Total Customers")}</div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', fontWeight: 800, color: C.text, marginTop: '4px' }}>{(metrics.total_customers || customers.length || 0).toLocaleString()}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: C.primary, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.registeredInCrm", "Registered in CRM")}</div>
        </div>

        <div style={{ ...S.card, padding: isMobile ? '10px 6px' : '16px', borderRadius: '14px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.newLeads", "New Leads")}</div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', fontWeight: 800, color: C.blue, marginTop: '4px' }}>{metrics.new_customers || 0}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: C.textLight, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.addedRecently", "Added recently")}</div>
        </div>

        <div style={{ ...S.card, padding: isMobile ? '10px 6px' : '16px', borderRadius: '14px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.interested", "Interested")}</div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', fontWeight: 800, color: C.purple, marginTop: '4px' }}>{metrics.interested_customers || 0}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: C.textLight, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.productShortlisted", "Shortlisted")}</div>
        </div>

        <div style={{ ...S.card, padding: isMobile ? '10px 6px' : '16px', borderRadius: '14px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.applications", "Applications")}</div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', fontWeight: 800, color: C.teal, marginTop: '4px' }}>{metrics.total_applications || 0}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: C.textLight, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.inBankVerification", "In verification")}</div>
        </div>

        <div style={{ ...S.card, padding: isMobile ? '10px 6px' : '16px', borderRadius: '14px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.approved", "Approved")}</div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', fontWeight: 800, color: C.green, marginTop: '4px' }}>{metrics.approved_applications || 0}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: C.green, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metrics.conversion_rate || 0}% rate</div>
        </div>

        <div style={{ ...S.card, padding: isMobile ? '10px 6px' : '16px', borderRadius: '14px', textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ fontSize: isMobile ? '9.5px' : '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.revenueGenerated", "Revenue")}</div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', fontWeight: 800, color: C.green, marginTop: '4px' }}>₹{(metrics.revenue_generated || 0).toLocaleString()}</div>
          <div style={{ fontSize: isMobile ? '9px' : '11px', color: C.textLight, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t("crm.totalPayouts", "Total payouts")}</div>
        </div>
      </div>

      {/* Search, Tag Filter, & View Mode Switcher */}
      <div style={{ ...S.card, padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '18px' }} />
            <input
              style={{ ...S.input, paddingLeft: '38px' }}
              placeholder={t("crm.searchPlaceholder", "Search by name, phone, email, PAN, city...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select style={{ ...S.input, width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t("crm.allPipelineStatuses", "All Pipeline Statuses")}</option>
            <option value="new">{t("crm.status.newLead", "New Lead")}</option>
            <option value="interested">{t("crm.status.interested", "Interested")}</option>
            <option value="documents_pending">{t("crm.status.docsPending", "Docs Pending")}</option>
            <option value="lead_created">{t("crm.status.leadCreated", "Lead Created")}</option>
            <option value="application_submitted">{t("crm.status.appSubmitted", "Application Submitted")}</option>
            <option value="bank_verification">{t("crm.status.bankVerification", "Bank Verification")}</option>
            <option value="approved">{t("crm.status.approved", "Approved")}</option>
            <option value="rejected">{t("crm.status.rejected", "Rejected")}</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: C.bgSecondary, padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
              background: viewMode === 'cards' ? C.card : 'transparent',
              color: viewMode === 'cards' ? C.text : C.textLight
            }}
          >
            <MdViewModule style={{ fontSize: '16px' }} /> {t("crm.crmCards", "CRM Cards")}
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
              background: viewMode === 'table' ? C.card : 'transparent',
              color: viewMode === 'table' ? C.text : C.textLight
            }}
          >
            <MdViewList style={{ fontSize: '16px' }} /> {t("crm.dataList", "Data List")}
          </button>
        </div>
      </div>

      {/* Tag Chips List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {CUSTOMER_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              background: selectedTag === tag ? C.primary : (C.bgSecondary === '#000000' ? '#18181B' : C.bgSecondary),
              color: selectedTag === tag ? '#FFF' : C.textLight,
              transition: 'all 0.2s ease',
              border: `1px solid ${selectedTag === tag ? C.primary : C.border}`
            }}
            onMouseEnter={(e) => {
              if (selectedTag !== tag) {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.color = C.text;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTag !== tag) {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.textLight;
              }
            }}
          >
            {tag === 'All' ? t("crm.allCustomers", "All Customers") : `#${t(`crm.tags.${tag}`, tag)}`}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT: CRM CARDS GRID VS TABLE VIEW ── */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>{t("crm.loadingRecords", "Loading customer records...")}</div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ ...S.card, padding: '60px', textAlign: 'center', color: C.textLight }}>
          {t("crm.noRecords", "No customer records match your filter criteria. Click Add New Customer to create a lead profile.")}
        </div>
      ) : viewMode === 'cards' ? (
        /* CRM Cards Grid (Max 4 per line on responsive view) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {filteredCustomers.map(cust => (
            <CustomerCard
              key={cust.id}
              customer={cust}
              onOpenProfile={(c) => setActive360CustomerId(c.id)}
              C={C}
              S={S}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div style={{ ...S.card, padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px' }}>
                <th style={{ padding: '12px 16px' }}>{t("crm.table.name", "Customer Name")}</th>
                <th style={{ padding: '12px 16px' }}>{t("crm.table.mobileEmail", "Mobile & Email")}</th>
                <th style={{ padding: '12px 16px' }}>{t("crm.table.location", "Location")}</th>
                <th style={{ padding: '12px 16px' }}>{t("crm.table.status", "Pipeline Status")}</th>
                {!isTeamMember && <th style={{ padding: '12px 16px' }}>{t("crm.table.assignedPartner", "Assigned Partner")}</th>}
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t("crm.table.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody style={{ color: C.text }}>
              {filteredCustomers.map(cust => (
                <tr key={cust.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>{cust.full_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{cust.mobile}</div>
                    <div style={{ fontSize: '11px', color: C.textLight }}>{cust.email || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{cust.city || 'N/A'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: C.teal }}>
                      {(cust.pipeline_status || 'new').replace('_', ' ')}
                    </span>
                  </td>
                  {!isTeamMember && <td style={{ padding: '12px 16px' }}>{cust.partner_first_name ? `${cust.partner_first_name} ${cust.partner_last_name || ''}` : t("crm.directAssigned", "Direct/Assigned")}</td>}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setActive360CustomerId(cust.id)}
                      style={{ ...S.btn('primary'), padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                    >
                      {t("crm.open360Profile", "Open 360° Profile")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 360° CUSTOMER PROFILE MODAL */}
      {active360CustomerId && (
        <Customer360ProfileModal
          customerId={active360CustomerId}
          onClose={() => setActive360CustomerId(null)}
          onRefresh={() => { fetchCustomers(); loadDashboardMetrics(); }}
        />
      )}

      {/* MERGE DUPLICATES MODAL */}
      {showMergeModal && (
        <CustomerMergeModal
          customers={customers}
          onClose={() => setShowMergeModal(false)}
          onMerged={() => { fetchCustomers(); loadDashboardMetrics(); }}
        />
      )}

      {/* ADD NEW CUSTOMER MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '540px', background: C.card, borderRadius: '20px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>{t("crm.addProfileTitle", "Add New Customer Profile")}</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '20px' }}>✕</button>
            </div>

            {duplicateWarning && (
              <div style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid #F59E0B', borderRadius: '10px', color: '#D97706', fontSize: '12.5px', marginBottom: '14px' }}>
                {duplicateWarning}
              </div>
            )}

            {formError && (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: '10px', color: '#DC2626', fontSize: '12.5px', marginBottom: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>{t("crm.form.fullName", "Full Name *")}</label>
                <input style={S.input} placeholder="e.g. Rahul Sharma" value={custForm.fullName} onChange={(e) => handleFormInputChange('fullName', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("crm.form.mobile", "Mobile Number *")}</label>
                  <input style={S.input} placeholder="98XXXXXXXX" value={custForm.mobile} onChange={(e) => handleFormInputChange('mobile', e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>{t("crm.form.email", "Email Address")}</label>
                  <input style={S.input} placeholder="rahul@gmail.com" value={custForm.email} onChange={(e) => handleFormInputChange('email', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("crm.form.pan", "PAN Number")}</label>
                  <input style={S.input} placeholder="ABCDE1234F" value={custForm.panNumber} onChange={(e) => handleFormInputChange('panNumber', e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>{t("crm.form.city", "City")}</label>
                  <input style={S.input} placeholder="Pune" value={custForm.city} onChange={(e) => handleFormInputChange('city', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>{t("crm.form.employmentType", "Employment Type")}</label>
                  <select style={S.input} value={custForm.employmentType} onChange={(e) => handleFormInputChange('employmentType', e.target.value)}>
                    <option value="Salaried">{t("crm.form.salaried", "Salaried")}</option>
                    <option value="Self-Employed">{t("crm.form.selfEmployed", "Self-Employed")}</option>
                    <option value="Business">{t("crm.form.business", "Business")}</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>{t("crm.form.monthlyIncome", "Monthly Income (₹)")}</label>
                  <input style={S.input} placeholder="70000" value={custForm.monthlyIncome} onChange={(e) => handleFormInputChange('monthlyIncome', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ ...S.btn('outline'), padding: '10px 18px' }}>{t("common.cancel", "Cancel")}</button>
                <button type="submit" disabled={formLoading} style={{ ...S.btn('primary'), padding: '10px 20px' }}>
                  {formLoading ? t("crm.form.creatingProfile", "Creating Profile...") : t("crm.form.saveProfile", "Save Customer Profile")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
