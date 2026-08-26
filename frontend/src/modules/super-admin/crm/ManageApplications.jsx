import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import AdminDocumentVerificationModal from '../../admin/reports/AdminDocumentVerificationModal';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdBlock, 
  MdCompareArrows, MdHistory, MdFileDownload, MdClose,
  MdModeEdit, MdSwapHoriz, MdAssignment, MdVisibility,
  MdShare, MdTrackChanges, MdDelete,
  MdHourglassEmpty, MdVerified, MdMonetizationOn, MdAttachMoney, MdCancel
} from 'react-icons/md';

import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../app/store/authStore';

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public (Visible to Partner)' },
  { id: 'internal', label: 'Internal (Admins only)' },
  { id: 'private', label: 'Private (Super Admin only)' }
];

export default function ManageApplications() {
  const { C } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();
  const isOpsOperator = ['ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'OPERATOR'].includes(userRole) || ['ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
  const isOpsHead = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_HEAD', 'OPERATIONAL_HEAD'].includes(userRole) && !isOpsOperator;

  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');

  // Verification modal state
  const [verifyModalApp, setVerifyModalApp] = useState(null);
  const [verifyModalTab, setVerifyModalTab] = useState('qd');

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'partner_share'

  const [applications, setApplications] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus || '');
  const [commFilter, setCommFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [processByFilter, setProcessByFilter] = useState('');
  const [operationHeads, setOperationHeads] = useState([]);
  const [opHeadFilter, setOpHeadFilter] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const activeFilterCount = [
    statusFilter,
    commFilter,
    partnerFilter,
    processByFilter,
    opHeadFilter
  ].filter(Boolean).length;

  // Selected Application for detail/drawer modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [timelines, setTimelines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);

  // Notes Form State
  const [noteForm, setNoteForm] = useState({ note: '', visibility: 'public' });
  const [postingNote, setPostingNote] = useState(false);

  // Super Admin Approval State inside Review Drawer
  const [superAdminRemark, setSuperAdminRemark] = useState('');
  const [submittingSuperAdminApprove, setSubmittingSuperAdminApprove] = useState(false);

  const handleSuperAdminApprove = async (appId) => {
    setSubmittingSuperAdminApprove(true);
    try {
      const res = await api.put(`/applications/${appId}/status`, {
        status: 'approved',
        final_status: 'Approved',
        remarks: superAdminRemark || 'Approved by Operations Head / Super Admin'
      });
      if (res.data?.success || res.status === 200) {
        alert('Application approved successfully! Status updated to Approved.');
        setDetailModalOpen(false);
        setSuperAdminRemark('');
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve application');
    } finally {
      setSubmittingSuperAdminApprove(false);
    }
  };

  const handleOperationalVerify = async (appId) => {
    const targetId = appId || selectedApp?.app_number || selectedApp?.id || selectedApp?.application_id;
    if (!targetId) return alert('Application ID not found.');
    setSubmittingSuperAdminApprove(true);
    try {
      const res = await api.put(`/applications/${targetId}/verification`, {
        status: 'operational_verified',
        final_status: 'Operational Verified',
        ops_remark: superAdminRemark.trim() || 'Operational Verified by Administrative Operator',
        super_admin_remark: superAdminRemark.trim() || 'Operational Verified by Administrative Operator',
        bank_remark: superAdminRemark.trim() || 'Operational Verified by Administrative Operator'
      });
      if (res.data?.success || res.status === 200) {
        alert('Application status updated to OPERATIONAL VERIFIED successfully!');
        setDetailModalOpen(false);
        setSuperAdminRemark('');
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application to Operational Verified');
    } finally {
      setSubmittingSuperAdminApprove(false);
    }
  };

  // Action Dialog States
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'reassign', 'manual', 'reverse'
  const [actionForm, setActionForm] = useState({
    approved_amount: '',
    rejection_reason: '',
    partner_id: '',
    amount: '',
    remarks: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Create Application / Lead Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit Lead / Application Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    mobile: '',
    email: '',
    pincode: '',
    city: '',
    state: '',
    monthly_salary: '',
    pan_number: '',
    bank_name: '',
    bank_application_number: '',
    vkyc_status: 'Pending',
    vkyc_url: '',
    salary_slip_url: '',
    pan_card_url: '',
    status: 'submitted',
    remarks: ''
  });

  const handleDeleteApplication = async (appId, appNumber) => {
    if (!window.confirm(`Are you sure you want to delete application lead #${appNumber || appId}? This action will permanently remove the application and associated records.`)) return;
    try {
      const res = await api.delete(`/applications/${appId}`);
      if (res.data?.success) {
        alert('Application deleted successfully!');
        if (selectedApp?.id === appId) setDetailModalOpen(false);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete application record');
    }
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setEditForm({
      full_name: app.customer_name || app.full_name || '',
      mobile: app.customer_mobile || app.mobile || '',
      email: app.customer_email || app.email || '',
      pincode: app.pincode || '',
      city: app.city || '',
      state: app.state || '',
      monthly_salary: app.monthly_salary || app.monthly_income || app.income || '',
      pan_number: app.pan_number || app.pan || '',
      bank_name: app.bank_name || '',
      bank_application_number: app.bank_application_number || app.bank_ref_number || '',
      vkyc_status: app.vkyc_status || 'Pending',
      vkyc_url: app.vkyc_url || '',
      salary_slip_url: app.salary_slip_url || '',
      pan_card_url: app.pan_card_url || '',
      status: app.status || 'submitted',
      remarks: app.remarks || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingApp?.id) return;
    setSubmittingEdit(true);
    try {
      const res = await api.put(`/applications/${editingApp.id}`, editForm);
      if (res.data?.success) {
        alert('Application & Lead details updated successfully!');
        setEditModalOpen(false);
        fetchApplications();
        if (selectedApp?.id === editingApp.id) {
          handleOpenDetail({ ...selectedApp, ...res.data.data });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application details');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // ── Partner Share Tracking State ──
  const [shareLeads, setShareLeads] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [sharePartnerCode, setSharePartnerCode] = useState('');
  const [sharePage, setSharePage] = useState(1);
  const [shareTotalPages, setShareTotalPages] = useState(1);

  const fetchShareLeads = async () => {
    setShareLoading(true);
    try {
      const res = await api.get('/leads/partner-share-tracking', {
        params: {
          page: sharePage,
          limit: 15,
          search: shareSearch.trim() || undefined,
          partner_code: sharePartnerCode.trim() || undefined
        }
      });
      if (res.data?.success) {
        setShareLeads(res.data.data || []);
        setShareTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (e) {
      console.error('Failed to load partner share leads', e);
    } finally {
      setShareLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'partner_share') fetchShareLeads();
  }, [activeTab, sharePage]);

  const handleExportShareLeads = () => {
    if (!shareLeads.length) return;
    let csv = 'data:text/csv;charset=utf-8,Customer Name,Mobile,Product,Bank,Partner Code,Status,Date\n';
    shareLeads.forEach(l => {
      csv += [
        `"${l.customer_name}"`, `"${l.customer_mobile}"`, `"${l.product_name}"`,
        `"${l.bank_name}"`, `"${l.partner_code || 'Direct'}"`, `"${l.status}"`,
        `"${new Date(l.created_at).toLocaleDateString()}"`
      ].join(',') + '\n';
    });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'GKP_Partner_Share_Leads.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const [leadCategory, setLeadCategory] = useState('credit_card'); // 'credit_card' | 'loan' | 'insurance'
  const [submittingLead, setSubmittingLead] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    mobile: '',
    email: '',
    pincode: '',
    partner_id: '',
    product_name: '',
    bank_name: '',
    monthly_salary: '',
    company_name: '',
    loan_type: 'Personal Loan',
    loan_amount: '',
    insurance_type: 'Health Insurance',
    coverage_amount: ''
  });

  const [totalCount, setTotalCount] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchApplications = async () => {
    if (applications.length === 0) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    try {
      const res = await api.get('/applications', {
        params: {
          page,
          limit: 100,
          status: statusFilter || undefined,
          commission_status: commFilter || undefined,
          partner_id: partnerFilter || undefined,
          process_by: processByFilter || undefined,
          operation_head_id: opHeadFilter || undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data?.success) {
        setApplications(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalCount(res.data.pagination?.total || (res.data.data ? res.data.data.length : 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const fetchPartnersList = async () => {
    try {
      const res = await api.get('/superadmin/wallet/overview', { params: { limit: 100 } });
      if (res.data?.success) {
        setPartners(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load partners', e);
    }
  };

  const fetchOperationHeads = async () => {
    try {
      const res = await api.get('/superadmin/operation-heads');
      if (res.data?.success) {
        setOperationHeads(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load operation heads', e);
    }
  };

  useEffect(() => {
    fetchPartnersList();
    fetchOperationHeads();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter, commFilter, partnerFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleOpenDetail = async (app) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
    setNoteForm({ note: '', visibility: 'public' });
    
    // Load Timelines, Documents, and Notes detail
    try {
      const tRes = await api.get(`/applications/${app.id}/timeline`);
      if (tRes.data?.success) setTimelines(tRes.data.data || []);

      const dRes = await api.get(`/applications/${app.id}/documents`);
      if (dRes.data?.success) setDocuments(dRes.data.data || []);

      const detailedAppRes = await api.get(`/applications/${app.id}`);
      if (detailedAppRes.data?.success && detailedAppRes.data.data) {
        const fullApp = detailedAppRes.data.data;
        setSelectedApp(prev => ({
          ...prev,
          ...fullApp,
          ...(fullApp.physical_details || {}),
          customer_name: fullApp.customer_name || prev?.customer_name,
          customer_mobile: fullApp.customer_mobile || prev?.customer_mobile,
          customer_email: fullApp.customer_email || prev?.customer_email
        }));
        setNotes(fullApp.notes_list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.note.trim()) return;
    setPostingNote(true);
    try {
      const res = await api.post(`/applications/${selectedApp.id}/notes`, noteForm);
      if (res.data?.success) {
        alert('Note added successfully!');
        setNoteForm({ note: '', visibility: 'public' });
        // Reload details
        const detailedAppRes = await api.get(`/applications/${selectedApp.id}`);
        if (detailedAppRes.data?.success) {
          setNotes(detailedAppRes.data.data.notes_list || []);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setPostingNote(false);
    }
  };

  const triggerActionDialog = (type) => {
    setActionType(type);
    setActionForm({
      approved_amount: selectedApp.loan_amount || '',
      rejection_reason: '',
      partner_id: '',
      amount: '',
      remarks: ''
    });
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      let endpoint = '';
      let payload = { id: selectedApp.id };

      if (actionType === 'approve') {
        endpoint = '/superadmin/application/approve';
        payload.approved_amount = parseFloat(actionForm.approved_amount);
      } else if (actionType === 'reject') {
        endpoint = '/superadmin/application/reject';
        payload.reason = actionForm.rejection_reason;
      } else if (actionType === 'reassign') {
        endpoint = '/superadmin/application/reassign';
        payload.partner_id = actionForm.partner_id;
      } else if (actionType === 'manual') {
        endpoint = '/superadmin/application/manual-commission';
        payload.amount = parseFloat(actionForm.amount);
        payload.remarks = actionForm.remarks;
      }

      const res = await api.post(endpoint, payload);
      if (res.data?.success) {
        alert(res.data.message || 'Operation processed successfully!');
        setActionType(null);
        setDetailModalOpen(false);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action execution failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateLeadSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);
    try {
      let payload = {
        category: leadCategory,
        full_name: createForm.full_name,
        mobile: createForm.mobile,
        email: createForm.email,
        pincode: createForm.pincode,
        partner_id: createForm.partner_id || undefined,
      };

      if (leadCategory === 'credit_card') {
        payload.product_name = createForm.product_name || 'Credit Card Application';
        payload.bank_name = createForm.bank_name || 'Partner Bank';
        payload.monthly_salary = parseFloat(createForm.monthly_salary || 0);
        payload.company_name = createForm.company_name;
      } else if (leadCategory === 'loan') {
        payload.product_name = `${createForm.loan_type} Application`;
        payload.loan_amount = parseFloat(createForm.loan_amount || 0);
        payload.monthly_salary = parseFloat(createForm.monthly_salary || 0);
      } else if (leadCategory === 'insurance') {
        payload.product_name = `${createForm.insurance_type} Policy`;
        payload.coverage_amount = parseFloat(createForm.coverage_amount || 0);
      }

      const res = await api.post('/applications', payload);
      if (res.data?.success || res.status === 201 || res.status === 200) {
        alert('Application lead created successfully!');
        setCreateModalOpen(false);
        setCreateForm({
          full_name: '', mobile: '', email: '', pincode: '', partner_id: '',
          product_name: '', bank_name: '', monthly_salary: '', company_name: '',
          loan_type: 'Personal Loan', loan_amount: '', insurance_type: 'Health Insurance', coverage_amount: ''
        });
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create application lead');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleExportCSV = () => {
    if (applications.length === 0) return alert('No applications found to export.');
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Application ID,Customer Name,Partner Code,Product,Bank,Status,Commission Status,Commission Amount,Created At\n';

    applications.forEach(a => {
      const row = [
        `"${a.app_number}"`,
        `"${a.customer_name}"`,
        `"${a.Partner_code}"`,
        `"${a.product_name}"`,
        `"${a.bank_name}"`,
        `"${a.status}"`,
        `"${a.commission_status}"`,
        `"₹${a.commission_amount || 0}"`,
        `"${new Date(a.created_at).toLocaleDateString()}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GKP_Applications_Queue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.text, margin: 0 }}>Operational Verified & Approved Applications</h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0' }}>Showing applications verified and approved by Operational Head</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setCreateModalOpen(true)} 
            style={{ ...S.btn('primary'), display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
          >
            <span>➕ Apply Lead (Credit Card / Loan / Insurance)</span>
          </button>
          <button onClick={handleExportCSV} style={{ ...S.btn('outline'), display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFileDownload /> Export Queue
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div style={{ ...S.card, padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
          {/* Always Visible Search Bar & Mobile Filter Toggle Button */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input 
                style={{ ...S.input, paddingLeft: '36px', height: '42px', fontSize: '13.5px' }} 
                placeholder="Search name, phone, application ID..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '18px' }} />
            </div>

            <button type="submit" style={{ ...S.btn('primary'), height: '42px', padding: '0 20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdSearch style={{ fontSize: '18px' }} />
              <span>Search</span>
            </button>

            <button 
              type="button" 
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              style={{ 
                ...S.btn('outline'), 
                height: '42px',
                padding: '0 16px',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontWeight: 700,
                background: showMobileFilter ? `${C.teal}15` : 'transparent',
                borderColor: showMobileFilter ? C.teal : C.border,
                color: showMobileFilter ? C.teal : C.text
              }}
            >
              <MdFilterList style={{ fontSize: '20px' }} />
              <span>{showMobileFilter ? 'Hide Filters' : 'Filter Options'}</span>
              {activeFilterCount > 0 && (
                <span style={{ 
                  background: C.teal, 
                  color: '#fff', 
                  borderRadius: '12px', 
                  padding: '2px 8px', 
                  fontSize: '11px', 
                  fontWeight: 900 
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible Detailed Filters Options Grid */}
          {showMobileFilter && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Application Status</label>
                <select style={{ ...S.input, width: '100%' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="details_submitted">Details Submitted</option>
                  <option value="operational_verified">Operational Verified</option>
                  <option value="approved">Approved</option>
                  <option value="commission_received">Commission Received</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Commission Status</label>
                <select style={{ ...S.input, width: '100%' }} value={commFilter} onChange={e => setCommFilter(e.target.value)}>
                  <option value="">All Commissions</option>
                  <option value="pending">Pending</option>
                  <option value="released">Commission Released</option>
                  <option value="received">Commission Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Filter by Partner</label>
                <select style={{ ...S.input, width: '100%' }} value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}>
                  <option value="">All Partners</option>
                  {partners.map(p => (
                    <option key={p.id || p.partner_id} value={p.partner_id || p.id}>{p.first_name} {p.last_name || ''} ({p.partner_code || p.code || 'PARTNER'})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 170px', minWidth: '150px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Process By / Channel</label>
                <select style={{ ...S.input, width: '100%' }} value={processByFilter} onChange={e => setProcessByFilter(e.target.value)}>
                  <option value="">All Process Types</option>
                  <option value="partner_punch">Partner Punch</option>
                  <option value="partner_share">Partner Share Link</option>
                  <option value="customer_direct">Customer Direct Apply</option>
                </select>
              </div>

              <div style={{ flex: '1 1 190px', minWidth: '170px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Operation Head</label>
                <select style={{ ...S.input, width: '100%' }} value={opHeadFilter} onChange={e => setOpHeadFilter(e.target.value)}>
                  <option value="">All Operation Heads</option>
                  {operationHeads.map(oh => {
                    const bankNames = oh.assigned_banks?.map(b => b.name || b.short_code).join(', ') || 'No banks';
                    return (
                      <option key={oh.id} value={oh.id}>
                        {oh.full_name} ({bankNames})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => { 
                    setSearch(''); setStatusFilter(''); setCommFilter(''); setPartnerFilter(''); setProcessByFilter(''); setOpHeadFilter(''); setPage(1); setTimeout(fetchApplications, 0); 
                  }} 
                  style={{ ...S.btn('outline'), height: '38px', padding: '0 16px', fontSize: '12.5px' }}
                >
                  Reset
                </button>
                <button 
                  type="submit" 
                  style={{ ...S.btn('primary'), height: '38px', padding: '0 20px', fontSize: '12.5px', fontWeight: 800 }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Main Grid Queue Table - Unified Single Master Table sorted newest first */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading queue list...</div>
      ) : applications.length === 0 ? (
        <div style={{ ...S.card, padding: '48px', textAlign: 'center', color: C.textLight }}>No applications matching search criteria.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, fontSize: '11px', textTransform: 'uppercase', color: C.textLight }}>
                  <th style={{ padding: '14px 16px' }}>App ID</th>
                  <th style={{ padding: '14px 16px' }}>Customer Details</th>
                  <th style={{ padding: '14px 16px' }}>Partner & Process By</th>
                  <th style={{ padding: '14px 16px' }}>Product & Bank</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Commission Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13.5px' }}>
                {[...applications]
                  .sort((a, b) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA; // Latest/newest application on top, oldest at bottom
                  })
                  .map((app) => (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}60` }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700 }}>
                        {app.app_number}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: C.text }}>{app.customer_name}</div>
                        <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{app.customer_mobile}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{app.partner_first_name || app.Partner_first_name || 'Direct'} {app.partner_last_name || app.Partner_last_name || ''}</div>
                        <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{app.partner_code || app.Partner_code || 'N/A'}</div>
                        <div style={{
                          marginTop: '4px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', display: 'inline-block',
                          padding: '2px 8px', borderRadius: '6px',
                          background: (app.process_by === 'partner_share' || app.process_by === 'share_link' || (app.process_by && app.process_by.includes('share'))) ? `${C.teal}15` : (app.process_by === 'customer_direct' || app.process_by === 'direct' || (app.process_by && app.process_by.includes('direct'))) ? `${C.blue}15` : `${C.purple}15`,
                          color: (app.process_by === 'partner_share' || app.process_by === 'share_link' || (app.process_by && app.process_by.includes('share'))) ? C.teal : (app.process_by === 'customer_direct' || app.process_by === 'direct' || (app.process_by && app.process_by.includes('direct'))) ? C.blue : C.purple
                        }}>
                          {(app.process_by === 'partner_share' || app.process_by === 'share_link' || (app.process_by && app.process_by.includes('share'))) ? 'Share Link' : (app.process_by === 'customer_direct' || app.process_by === 'direct' || (app.process_by && app.process_by.includes('direct'))) ? 'Customer Apply' : 'Partner Punch'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: C.text }}>{app.product_name}</div>
                        <div style={{ fontSize: '11.5px', color: C.textLight, marginTop: '2px' }}>{app.bank_name} • {app.category}</div>
                        {app.operation_head_name && (
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: C.purple, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>Op Head:</span> {app.operation_head_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                          background: (app.status === 'approved' || app.status === 'disbursed') ? `${C.green}15` : app.status === 'rejected' ? `${C.red}15` : `${C.gold}15`,
                          color: (app.status === 'approved' || app.status === 'disbursed') ? C.green : app.status === 'rejected' ? C.red : C.gold
                        }}>
                          {app.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: C.green }}>₹{app.commission_amount || 0}</div>
                        <div style={{ fontSize: '10.5px', color: C.textLight, marginTop: '2px', textTransform: 'uppercase' }}>
                          {app.commission_status}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                          {(() => {
                            const proc = String(app.process_type || app.process_by || '').toLowerCase();
                            const isDigital = proc.includes('linked_share') || proc.includes('direct_bank') || proc.includes('link') || proc.includes('direct');
                            const isPhys = proc.includes('physical');

                            if (isDigital) {
                              return (
                                <>
                                  <button onClick={() => handleOpenDetail(app)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                    <MdVisibility /> Review
                                  </button>
                                  <button onClick={() => { setVerifyModalTab('remark'); setVerifyModalApp(app); }} style={{ border: `1px solid #ea580c40`, background: '#ea580c12', color: '#ea580c', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                    ⚙️ Remark
                                  </button>
                                </>
                              );
                            }

                            if (isPhys) {
                              return (
                                <>
                                  <button onClick={() => handleOpenDetail(app)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                    <MdVisibility /> Review
                                  </button>
                                  <button onClick={() => { setVerifyModalTab('qd'); setVerifyModalApp(app); }} style={{ border: `1px solid #2563eb40`, background: '#2563eb12', color: '#2563eb', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                    📋 QD
                                  </button>
                                  <button onClick={() => { setVerifyModalTab('remark'); setVerifyModalApp(app); }} style={{ border: `1px solid #ea580c40`, background: '#ea580c12', color: '#ea580c', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                    ⚙️ Remark
                                  </button>
                                </>
                              );
                            }

                            return (
                              <>
                                <button onClick={() => handleOpenDetail(app)} style={{ border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                  <MdVisibility /> Review
                                </button>
                                <button onClick={() => { setVerifyModalTab('qd'); setVerifyModalApp(app); }} style={{ border: `1px solid #2563eb40`, background: '#2563eb12', color: '#2563eb', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                  📋 QD
                                </button>
                                <button onClick={() => { setVerifyModalTab('remark'); setVerifyModalApp(app); }} style={{ border: `1px solid #ea580c40`, background: '#ea580c12', color: '#ea580c', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                  ⚙️ Remark
                                </button>
                                <button onClick={() => { setVerifyModalTab('final'); setVerifyModalApp(app); }} style={{ border: `1px solid #16a34a40`, background: '#16a34a12', color: '#16a34a', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                                  🏦 Final
                                </button>
                              </>
                            );
                          })()}
                          <button onClick={() => handleDeleteApplication(app.id, app.app_number)} style={{ border: `1px solid ${C.red}40`, background: `${C.red}12`, color: C.red, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
                            <MdDelete /> Delete
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary, flexWrap: 'wrap', gap: '10px', marginTop: '20px', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', color: C.textLight, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Showing 100 per batch • Page <strong>{page}</strong> of <strong>{totalPages}</strong> {totalCount ? `(${totalCount} Total Applications)` : ''}</span>
          {isFetchingMore && <span style={{ fontSize: '11px', color: C.primary, fontWeight: 700 }}>⚡ Updating 100 records...</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={S.btn('outline')}>← Prev 100</button>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ ...S.btn('primary'), background: C.primary }}>Next 100 →</button>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {detailModalOpen && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '850px', height: '100%', borderRadius: 0, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            
            <button 
              onClick={() => setDetailModalOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={22} />
            </button>

            {/* Title / Summary */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginRight: '40px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                {selectedApp.app_number}
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '8px 0 2px' }}>{selectedApp.customer_name}</h3>
              <p style={{ fontSize: '12.5px', color: C.textLight, margin: 0 }}>
                Category: **{selectedApp.category}** • Product: **{selectedApp.product_name}** • Bank: **{selectedApp.bank_name}**
              </p>
            </div>

            {/* Super Admin Approval & Remarks Card */}
            <div style={{ background: `${C.primary}08`, border: `1.5px solid ${C.primary}30`, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: C.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MdCheckCircle size={18} /> Super Admin Final Approval & Status Upgrade
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: selectedApp.status === 'super_admin_approved' ? `${C.green}20` : `${C.gold}20`, color: selectedApp.status === 'super_admin_approved' ? C.green : C.gold, textTransform: 'uppercase' }}>
                  Current Status: {selectedApp.status?.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div>
                <label style={{ ...S.label, marginBottom: '4px' }}>Super Admin Remark / Approval Note</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks or approval notes..."
                  style={S.input}
                  value={superAdminRemark}
                  onChange={e => setSuperAdminRemark(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  disabled={submittingSuperAdminApprove}
                  onClick={() => handleOperationalVerify(selectedApp.id)}
                  style={{ ...S.btn('primary'), background: '#7c3aed', borderColor: '#7c3aed', padding: '8px 18px', fontSize: '13px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <MdCheckCircle size={18} /> {submittingSuperAdminApprove ? 'Processing...' : 'Mark Operational Verified'}
                </button>
                {isOpsHead && (
                  <button
                    disabled={submittingSuperAdminApprove}
                    onClick={() => handleSuperAdminApprove(selectedApp.id)}
                    style={{ ...S.btn('primary'), background: C.green, borderColor: C.green, padding: '8px 18px', fontSize: '13px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MdCheckCircle size={18} /> {submittingSuperAdminApprove ? 'Approving...' : 'Approve (Super Admin Approved)'}
                  </button>
                )}
                {(() => {
                  const isLocked = ['approved', 'super_admin_approved', 'sanctioned', 'commission_processing', 'commission_released', 'commission_received', 'disbursed', 'rejected', 'cancelled'].includes(String(selectedApp?.status || '').toLowerCase());
                  return (
                    <button
                      disabled={isLocked}
                      onClick={() => {
                        if (isLocked) return;
                        setVerifyModalApp(selectedApp);
                      }}
                      style={{
                        ...S.btn('outline'),
                        color: isLocked ? C.textLight : C.primary,
                        borderColor: isLocked ? C.border : C.primary,
                        padding: '8px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        opacity: isLocked ? 0.6 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLocked ? 'Edit Details (Locked)' : 'Edit Details (Form 1 / 2 / 3)'}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Read-Only Form 1 (QD), Part 2 (Remark) & Part 3 (Final) Overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Form 1: Customer Quick Details */}
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.primary, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Form 1: Quick Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                  <div><span style={{ color: C.textLight }}>Customer Name:</span> <strong style={{ color: C.text }}>{selectedApp.customer_name || selectedApp.full_name || selectedApp.pan_name || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Mobile Number:</span> <strong style={{ color: C.text }}>{selectedApp.customer_mobile || selectedApp.mobile || selectedApp.aadhaar_linked_mobile || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Email Address:</span> <strong style={{ color: C.text }}>{selectedApp.customer_email || selectedApp.email || selectedApp.personal_email || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>PAN Card Number:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{selectedApp.pan_number || selectedApp.pan || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Date of Birth (DOB):</span> <strong style={{ color: C.text }}>{selectedApp.dob || selectedApp.date_of_birth || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Aadhaar Number:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{selectedApp.aadhaar_number || selectedApp.aadhaar_no || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Mother's Name:</span> <strong style={{ color: C.text }}>{selectedApp.mother_name || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Employer / Company Name:</span> <strong style={{ color: C.text }}>{selectedApp.company_name || selectedApp.employer_name || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Occupation / Designation:</span> <strong style={{ color: C.text }}>{selectedApp.designation || selectedApp.occupation || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Monthly Income / Salary:</span> <strong style={{ color: C.green, fontWeight: 800 }}>{(selectedApp.monthly_salary || selectedApp.monthly_income) ? `₹${parseFloat(selectedApp.monthly_salary || selectedApp.monthly_income).toLocaleString('en-IN')}` : '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Residential Address:</span> <strong style={{ color: C.text }}>{[selectedApp.address || selectedApp.residential_address || selectedApp.flat_no, selectedApp.city, selectedApp.state, selectedApp.pincode].filter(Boolean).join(', ') || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Partner Code & Name:</span> <strong style={{ color: C.text }}>{selectedApp.partner_code ? `${selectedApp.partner_code} (${selectedApp.partner_first_name || selectedApp.Partner_first_name || ''} ${selectedApp.partner_last_name || selectedApp.Partner_last_name || ''})` : 'Direct / Admin'}</strong></div>
                </div>
              </div>

              {/* Part 2: Operations & Dispatch Stage (Remark Form) */}
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.teal, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Part 2: Operational Processing & Remark Form
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                  <div><span style={{ color: C.textLight }}>Appcode Status:</span> <strong style={{ color: C.text }}>{selectedApp.appcode_status || 'Appcode Pending'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Soft Approval Status:</span> <strong style={{ color: C.text }}>{selectedApp.soft_approval_status || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>VKYC Stage:</span> <strong style={{ color: C.text }}>{selectedApp.vkyc_stage || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>IQA Stage:</span> <strong style={{ color: C.text }}>{selectedApp.iqa_stage || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Dispatch Status:</span> <strong style={{ color: C.text }}>{selectedApp.dispatch_status || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Operational Remarks:</span> <strong style={{ color: C.text }}>{selectedApp.ops_remark || selectedApp.processing_remark || selectedApp.remarks || '—'}</strong></div>
                </div>
              </div>

              {/* Part 3: Bank Remark & Final Status (Final Form) */}
              <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.purple, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Part 3: Bank Remark & Final Form
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: C.textLight }}>App / Bank Reference #:</span>{' '}
                    <strong style={{ color: C.text, fontFamily: 'monospace' }}>
                      {selectedApp.bank_ref_number || selectedApp.bank_application_number || selectedApp.app_number || '—'}
                    </strong>
                    {(selectedApp.bank_ref_number || selectedApp.bank_application_number) && (
                      <button
                        type="button"
                        onClick={() => {
                          const num = selectedApp.bank_ref_number || selectedApp.bank_application_number;
                          navigator.clipboard.writeText(num);
                          alert(`📋 Copied Bank Ref Number: ${num}`);
                        }}
                        style={{
                          marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${C.primary}40`,
                          background: `${C.primary}12`, color: C.primary, fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                  <div><span style={{ color: C.textLight }}>Applied Loan Amount:</span> <strong style={{ color: C.text }}>{(selectedApp.loan_amount && Number(selectedApp.loan_amount) > 0) ? `₹${parseFloat(selectedApp.loan_amount).toLocaleString('en-IN')}` : '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Commission Amount / Status:</span> <strong style={{ color: C.green, fontWeight: 800 }}>₹{selectedApp.commission_amount || 0} ({selectedApp.commission_status || 'pending'})</strong></div>
                  <div>
                    <span style={{ color: C.textLight }}>VKYC / Direct Web Link:</span>{' '}
                    {selectedApp.vkyc_url ? (
                      <a href={selectedApp.vkyc_url} target="_blank" rel="noopener noreferrer" style={{ color: C.primary, textDecoration: 'underline', fontWeight: 700 }}>
                        Open Link 🔗
                      </a>
                    ) : <strong style={{ color: C.text }}>—</strong>}
                  </div>
                  <div><span style={{ color: C.textLight }}>Final Status from Bank:</span> <strong style={{ color: C.text }}>{selectedApp.final_status || selectedApp.status || '—'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Eligible for Re-QD:</span> <strong style={{ color: C.text }}>{selectedApp.eligible_reqd || 'No'}</strong></div>
                  <div><span style={{ color: C.textLight }}>Bank Remark:</span> <strong style={{ color: C.text }}>{selectedApp.bank_remark || '—'}</strong></div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
                    <button
                      type="button"
                      onClick={() => {
                        const link = selectedApp.vkyc_url || `https://gharkapaisa.in/track/${selectedApp.app_number}`;
                        if (navigator.share) {
                          navigator.share({ title: 'VKYC / Tracking Link', text: `Link for App #${selectedApp.app_number}:`, url: link }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(link);
                          alert('📋 Link copied to clipboard!');
                        }
                      }}
                      style={{ ...S.btn('outline'), color: C.primary, borderColor: `${C.primary}40`, padding: '6px 14px', fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      🔗 VKYC Share Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const bName = String(selectedApp.bank_name || selectedApp.product_name || '').toLowerCase();
                        let targetUrl = 'https://www.sbicard.com/en/eapply/track-credit-card-application.page';
                        if (bName.includes('hdfc')) targetUrl = 'https://track.hdfcbank.com/';
                        else if (bName.includes('icici')) targetUrl = 'https://www.icicibank.com/Personal-Banking/cards/credit-card/track-application.page';
                        else if (bName.includes('axis')) targetUrl = 'https://www.axisbank.com/retail/cards/credit-card/track-your-application';
                        
                        window.open(targetUrl, '_blank');
                      }}
                      style={{ ...S.btn('outline'), color: '#ea580c', borderColor: '#ea580c40', background: '#ea580c12', padding: '6px 14px', fontSize: '11.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      🌐 Digital Incomplete Restart
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Attachments Preview */}
              {documents && documents.length > 0 && (
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    📎 Uploaded Application Documents ({documents.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {documents.map((doc, dIdx) => (
                      <a
                        key={dIdx}
                        href={doc.file_url || doc.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                          borderRadius: '8px', background: C.card, border: `1px solid ${C.border}`,
                          fontSize: '12px', fontWeight: 700, color: C.primary, textDecoration: 'none'
                        }}
                      >
                        <span>📄</span>
                        <span>{doc.doc_type?.replace(/_/g, ' ').toUpperCase() || `DOCUMENT ${dIdx+1}`}</span>
                        <span style={{ fontSize: '10px', color: C.textLight }}>🔗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Verification Lifecycle Log Stream */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                📜 Verification Lifecycle Log
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: `2px solid ${C.primary}`, paddingLeft: '14px' }}>
                {timelines.length === 0 ? (
                  <span style={{ fontSize: '12.5px', color: C.textLight }}>No activity logs recorded yet.</span>
                ) : (
                  timelines.map((t, idx) => (
                    <div key={idx} style={{ position: 'relative', fontSize: '12.5px' }}>
                      <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: C.primary }} />
                      <div style={{ fontWeight: 700, color: C.text }}>{t.activity}</div>
                      <div style={{ color: C.textLight, margin: '2px 0' }}>{t.remarks || '—'}</div>
                      <span style={{ fontSize: '10.5px', color: C.textLight }}>
                        {new Date(t.performed_at).toLocaleString()} • By {t.performed_by_name || 'System'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ACTION TRIGGER OVERLAYS */}
      {actionType && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: '460px', padding: '24px', position: 'relative' }}>
            
            <button 
              onClick={() => setActionType(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: C.bgSecondary, border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}
            >
              <MdClose size={20} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 16px', textTransform: 'capitalize' }}>
              {actionType} Application
            </h3>

            <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {actionType === 'approve' && (
                <div>
                  <label style={S.label}>Approved Loan/Credit Amount (INR) *</label>
                  <input 
                    type="number" 
                    required 
                    style={S.input} 
                    value={actionForm.approved_amount}
                    onChange={e => setActionForm({ ...actionForm, approved_amount: e.target.value })}
                  />
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <label style={S.label}>Reason for Rejection *</label>
                  <textarea 
                    required 
                    rows={3} 
                    placeholder="Enter reason for customer lead rejection..." 
                    style={S.input}
                    value={actionForm.rejection_reason}
                    onChange={e => setActionForm({ ...actionForm, rejection_reason: e.target.value })}
                  />
                </div>
              )}

              {actionType === 'reassign' && (
                <div>
                  <label style={S.label}>Select Target Partner *</label>
                  <select 
                    required 
                    style={S.input} 
                    value={actionForm.partner_id}
                    onChange={e => setActionForm({ ...actionForm, partner_id: e.target.value })}
                  >
                    <option value="">Choose partner...</option>
                    {partners.map(p => (
                      <option key={p.id || p.partner_id} value={p.partner_id || p.id}>{p.first_name} {p.last_name || ''} ({p.partner_code || p.code || 'PARTNER'})</option>
                    ))}
                  </select>
                </div>
              )}

              {actionType === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={S.label}>Commission Payout Amount (INR) *</label>
                    <input 
                      type="number" 
                      required 
                      style={S.input} 
                      value={actionForm.amount}
                      onChange={e => setActionForm({ ...actionForm, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={S.label}>Override Remarks *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. approved offline referral" 
                      style={S.input}
                      value={actionForm.remarks}
                      onChange={e => setActionForm({ ...actionForm, remarks: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setActionType(null)} style={S.btn('outline')}>Cancel</button>
                <button type="submit" disabled={submittingAction} style={S.btn('primary')}>
                  {submittingAction ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ═══ CREATE APPLICATION / LEAD MODAL ═══ */}
      {createModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '640px', maxHeight: '92vh',
            borderRadius: '24px', overflowY: 'auto', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)', padding: '20px 20px 80px 20px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: 0 }}>➕ Apply New Lead</h3>
                <p style={{ fontSize: '12px', color: C.textLight, margin: '2px 0 0' }}>Log customer applications directly for Credit Cards, Loans, or Insurance</p>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)} 
                style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setLeadCategory('credit_card')}
                style={{
                  padding: '10px', borderRadius: '12px',
                  border: leadCategory === 'credit_card' ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: leadCategory === 'credit_card' ? `${C.primary}15` : C.bgSecondary,
                  color: leadCategory === 'credit_card' ? C.primary : C.text,
                  fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                }}
              >
                💳 Credit Card
              </button>
              <button
                type="button"
                onClick={() => setLeadCategory('loan')}
                style={{
                  padding: '10px', borderRadius: '12px',
                  border: leadCategory === 'loan' ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: leadCategory === 'loan' ? `${C.primary}15` : C.bgSecondary,
                  color: leadCategory === 'loan' ? C.primary : C.text,
                  fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                }}
              >
                🏦 Loan
              </button>
              <button
                type="button"
                onClick={() => setLeadCategory('insurance')}
                style={{
                  padding: '10px', borderRadius: '12px',
                  border: leadCategory === 'insurance' ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                  background: leadCategory === 'insurance' ? `${C.primary}15` : C.bgSecondary,
                  color: leadCategory === 'insurance' ? C.primary : C.text,
                  fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                }}
              >
                🛡️ Insurance
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Customer General Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    style={S.input}
                    value={createForm.full_name}
                    onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    style={S.input}
                    value={createForm.mobile}
                    onChange={e => setCreateForm({ ...createForm, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    style={S.input}
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    style={S.input}
                    value={createForm.pincode}
                    onChange={e => setCreateForm({ ...createForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={S.label}>Assign Partner (Optional)</label>
                <select
                  style={S.input}
                  value={createForm.partner_id}
                  onChange={e => setCreateForm({ ...createForm, partner_id: e.target.value })}
                >
                  <option value="">Direct Lead (No Partner assigned)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.Partner_id}>{p.first_name} {p.last_name || ''} ({p.Partner_code})</option>
                  ))}
                </select>
              </div>

              {/* ── Category Specific Form Fields ── */}
              
              {/* CREDIT CARD FIELDS */}
              {leadCategory === 'credit_card' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Preferred Bank *</label>
                      <select
                        style={S.input}
                        value={createForm.bank_name}
                        onChange={e => setCreateForm({ ...createForm, bank_name: e.target.value })}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="SBI Card">SBI Card</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="IndusInd Bank">IndusInd Bank</option>
                        <option value="IDFC First Bank">IDFC First Bank</option>
                        <option value="Kotak Bank">Kotak Bank</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Card Variant / Product</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Regalia / Millennia"
                        style={S.input}
                        value={createForm.product_name}
                        onChange={e => setCreateForm({ ...createForm, product_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Monthly Salary (INR) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 45000"
                        style={S.input}
                        value={createForm.monthly_salary}
                        onChange={e => setCreateForm({ ...createForm, monthly_salary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Company / Employer Name</label>
                      <input
                        type="text"
                        placeholder="e.g. TCS / Infosys"
                        style={S.input}
                        value={createForm.company_name}
                        onChange={e => setCreateForm({ ...createForm, company_name: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* LOAN FIELDS */}
              {leadCategory === 'loan' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Loan Type *</label>
                      <select
                        style={S.input}
                        value={createForm.loan_type}
                        onChange={e => setCreateForm({ ...createForm, loan_type: e.target.value })}
                      >
                        <option value="Personal Loan">Personal Loan</option>
                        <option value="Business Loan">Business Loan</option>
                        <option value="Home Loan">Home Loan</option>
                        <option value="Auto Loan">Auto / Vehicle Loan</option>
                        <option value="Loan against Property">Loan against Property (LAP)</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Required Loan Amount (INR) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 300000"
                        style={S.input}
                        value={createForm.loan_amount}
                        onChange={e => setCreateForm({ ...createForm, loan_amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Monthly Income / Net Salary (INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      style={S.input}
                      value={createForm.monthly_salary}
                      onChange={e => setCreateForm({ ...createForm, monthly_salary: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* INSURANCE FIELDS */}
              {leadCategory === 'insurance' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Insurance Type *</label>
                      <select
                        style={S.input}
                        value={createForm.insurance_type}
                        onChange={e => setCreateForm({ ...createForm, insurance_type: e.target.value })}
                      >
                        <option value="Health Insurance">Health Insurance</option>
                        <option value="Term Life Insurance">Term Life Insurance</option>
                        <option value="Motor Insurance">Motor Insurance</option>
                        <option value="General Insurance">General Insurance</option>
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Sum Insured / Coverage Amount (INR) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 500000"
                        style={S.input}
                        value={createForm.coverage_amount}
                        onChange={e => setCreateForm({ ...createForm, coverage_amount: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Modal Buttons */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px',
                position: 'sticky', bottom: '-20px', background: C.card, paddingTop: '12px', paddingBottom: '12px',
                borderTop: `1px solid ${C.border}`, zIndex: 10
              }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} style={S.btn('outline')}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingLead} style={S.btn('primary')}>
                  {submittingLead ? 'Submitting...' : 'Submit Lead'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ═══ EDIT APPLICATION / LEAD MODAL ═══ */}
      {editModalOpen && editingApp && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1150,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '720px', maxHeight: '92vh',
            borderRadius: '24px', overflowY: 'auto', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)', padding: '20px 20px 80px 20px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  {editingApp.app_number}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '4px 0 0' }}>✏️ Edit Lead / Application Details</h3>
                <p style={{ fontSize: '12px', color: C.textLight, margin: '2px 0 0' }}>
                  Update customer details, bank-specific requirements, and tracking information
                </p>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)} 
                style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Customer Profile Section */}
              <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', marginBottom: '10px' }}>👤 Customer Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={S.label}>Customer Full Name *</label>
                    <input type="text" required style={S.input} value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Mobile Number *</label>
                    <input type="tel" required style={S.input} value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label style={S.label}>Email Address</label>
                    <input type="email" style={S.input} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Pincode</label>
                    <input type="text" maxLength={6} style={S.input} value={editForm.pincode} onChange={e => setEditForm({ ...editForm, pincode: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label style={S.label}>PAN Card Number</label>
                    <input type="text" maxLength={10} placeholder="ABCDE1234F" style={S.input} value={editForm.pan_number} onChange={e => setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <label style={S.label}>Monthly Salary / Income (INR)</label>
                    <input type="number" placeholder="e.g. 50000" style={S.input} value={editForm.monthly_salary} onChange={e => setEditForm({ ...editForm, monthly_salary: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Dynamic Bank Specific Configuration Section */}
              <div style={{ background: `${C.primary}08`, padding: '14px', borderRadius: '14px', border: `1px solid ${C.primary}25` }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', marginBottom: '10px' }}>
                  🏦 Bank-Specific Requirements ({editForm.bank_name || editingApp.bank_name || 'Standard Bank'})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={S.label}>Bank Application / Reference Number *</label>
                    <input type="text" required placeholder="e.g. SBI-2091820491 or Ref No." style={S.input} value={editForm.bank_application_number} onChange={e => setEditForm({ ...editForm, bank_application_number: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>VKYC Status</label>
                    <select style={S.input} value={editForm.vkyc_status} onChange={e => setEditForm({ ...editForm, vkyc_status: e.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                  <div>
                    <label style={S.label}>VKYC Link / URL</label>
                    <input type="url" placeholder="https://vkyc..." style={S.input} value={editForm.vkyc_url} onChange={e => setEditForm({ ...editForm, vkyc_url: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Application Stage / Status</label>
                    <select style={S.input} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="submitted">Applied / Submitted</option>
                      <option value="under_review">Verification / Under Review</option>
                      <option value="vkyc_pending">VKYC Pending</option>
                      <option value="vkyc_completed">VKYC Completed</option>
                      <option value="approved">Approved</option>
                      <option value="disbursed">Disbursed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Remarks / Tracking Notes */}
              <div>
                <label style={S.label}>Tracking Notes & Internal Remarks</label>
                <textarea rows={2} placeholder="Add tracking details or update notes..." style={S.input} value={editForm.remarks} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} />
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px',
                position: 'sticky', bottom: '-20px', background: C.card, paddingTop: '12px', paddingBottom: '12px',
                borderTop: `1px solid ${C.border}`, zIndex: 10
              }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={S.btn('outline')}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingEdit} style={S.btn('primary')}>
                  {submittingEdit ? 'Saving Updates...' : 'Save & Update Details'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VERIFY DETAILS & EDIT FORM MODAL */}
      {verifyModalApp && (
        <AdminDocumentVerificationModal
          application={verifyModalApp}
          initialTab={verifyModalTab}
          onClose={() => setVerifyModalApp(null)}
          onRefresh={() => {
            setVerifyModalApp(null);
            fetchApplications();
          }}
        />
      )}

    </div>
  );
}
