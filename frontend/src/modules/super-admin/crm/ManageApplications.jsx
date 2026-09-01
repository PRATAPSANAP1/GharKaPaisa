import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import AdminDocumentVerificationModal from '../../admin/reports/AdminDocumentVerificationModal';
import ExportApplicationsModal from '../../../components/Admin/ExportApplicationsModal';
import { 
  MdSearch, MdFilterList, MdCheckCircle, MdBlock, 
  MdCompareArrows, MdHistory, MdFileDownload, MdClose,
  MdModeEdit, MdSwapHoriz, MdAssignment, MdVisibility,
  MdShare, MdTrackChanges, MdDelete, MdMoreVert,
  MdHourglassEmpty, MdVerified, MdMonetizationOn, MdAttachMoney, MdCancel,
  MdPerson, MdPhone, MdLocationOn, MdRefresh, MdAdd, MdDownload, MdChevronLeft, MdChevronRight
} from 'react-icons/md';
import { 
  FaUniversity, FaCreditCard, 
  FaShieldAlt, FaUser, FaFileAlt, 
  FaLink, FaShareAlt, FaCalendarAlt, FaSlidersH
} from 'react-icons/fa';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../app/store/authStore';

// Get initials for Avatar badge
const getInitials = (name) => {
  if (!name) return 'CU';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function ManageApplications() {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verification modal state
  const [verifyModalApp, setVerifyModalApp] = useState(null);
  const [verifyModalTab, setVerifyModalTab] = useState('qd');

  // Active Main Tab: 'applications' | 'partner_share'
  const [activeTab, setActiveTab] = useState('applications');

  // Main Applications & Pagination States
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── FILTER STATES ──
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [processTypeFilter, setProcessTypeFilter] = useState('all'); // all | direct_link | share_link | punch_only
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all');   // all | partner | employee | customer
  const [partnerFilter, setPartnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'all');
  const [commFilter, setCommFilter] = useState('all');

  // ── BULK SELECTION ──
  const [selectedAppIds, setSelectedAppIds] = useState([]);

  // ── 360° DRAWER STATE ──
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview'); // overview | timeline | documents | notes
  const [timelines, setTimelines] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState({ note: '', visibility: 'public' });
  const [postingNote, setPostingNote] = useState(false);

  // Partner / Employee Filter lists
  const [partnersList, setPartnersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const [pRes, eRes] = await Promise.all([
          api.get('/admin/partners', { params: { limit: 1000 } }).catch(() => null),
          api.get('/employees', { params: { limit: 1000 } }).catch(() => null)
        ]);
        if (pRes?.data?.success && Array.isArray(pRes.data.data)) {
          setPartnersList(pRes.data.data);
        } else if (Array.isArray(pRes?.data)) {
          setPartnersList(pRes.data);
        }
        if (eRes?.data?.success && Array.isArray(eRes.data.data)) {
          setEmployeesList(eRes.data.data);
        } else if (Array.isArray(eRes?.data)) {
          setEmployeesList(eRes.data);
        }
      } catch (err) {
        console.error('Error fetching agents for filter:', err);
      }
    };
    fetchAgents();
  }, []);

  // Table row 3-dots action menu open state
  const [actionMenuAppId, setActionMenuAppId] = useState(null);

  // Approval / Verification Remark State
  const [opsRemark, setOpsRemark] = useState('');
  const [submittingOpsAction, setSubmittingOpsAction] = useState(false);

  // Modals for Edit/Create Lead
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '', mobile: '', email: '', pincode: '', city: '', state: '',
    monthly_salary: '', pan_number: '', bank_name: '', bank_application_number: '',
    vkyc_status: 'Pending', status: 'submitted', remarks: ''
  });

  // Partner Share Tracking State
  const [shareLeads, setShareLeads] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);

  // KPI Metrics Calculation
  const kpis = {
    total: totalCount || applications.length,
    pending: applications.filter(a => ['submitted', 'pending', 'lead_created', 'created', 'initiated', 'new', 'draft'].includes((a.status || '').toLowerCase())).length,
    underReview: applications.filter(a => ['under_review', 'under review', 'verification', 'in_progress', 'bank_verification'].includes((a.status || '').toLowerCase())).length,
    approved: applications.filter(a => ['approved', 'operational_verified', 'super_admin_approved', 'sanctioned', 'disbursed'].includes((a.status || '').toLowerCase())).length,
    rejected: applications.filter(a => ['rejected', 'declined', 'cancelled'].includes((a.status || '').toLowerCase())).length
  };

  // Today's Activity Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApps = applications.filter(a => (a.created_at || '').startsWith(todayStr));
  const todayStats = {
    newLeads: todayApps.length,
    underReview: todayApps.filter(a => (a.status || '').toLowerCase().includes('review') || (a.status || '').toLowerCase().includes('verification')).length,
    approved: todayApps.filter(a => (a.status || '').toLowerCase().includes('approved') || (a.status || '').toLowerCase().includes('verified')).length,
    rejected: todayApps.filter(a => (a.status || '').toLowerCase().includes('reject')).length
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const activePartnerId = (partnerFilter && partnerFilter !== 'ALL_PARTNERS' && partnerFilter !== 'ALL_EMPLOYEES') ? partnerFilter.trim() : undefined;
      const activeSourceType = sourceTypeFilter !== 'all' ? sourceTypeFilter : (partnerFilter === 'ALL_PARTNERS' ? 'partner' : partnerFilter === 'ALL_EMPLOYEES' ? 'employee' : undefined);

      const res = await api.get('/applications', {
        params: {
          page,
          limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          commission_status: commFilter !== 'all' ? commFilter : undefined,
          partner_id: activePartnerId,
          source_type: activeSourceType,
          process_by: processTypeFilter !== 'all' ? processTypeFilter : undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data?.success) {
        let list = res.data.data || [];
        if (partnerFilter === 'ALL_PARTNERS' || sourceTypeFilter === 'partner') {
          list = list.filter(a => a.partner_code || a.partner_id || (a.process_by && String(a.process_by).toLowerCase().includes('partner')));
        } else if (partnerFilter === 'ALL_EMPLOYEES' || sourceTypeFilter === 'employee') {
          list = list.filter(a => a.employee_code || a.employee_id || (a.process_by && String(a.process_by).toLowerCase().includes('employee')));
        } else if (partnerFilter && partnerFilter !== 'ALL_PARTNERS' && partnerFilter !== 'ALL_EMPLOYEES') {
          const pf = partnerFilter.toLowerCase();
          list = list.filter(a => 
            (a.partner_code && a.partner_code.toLowerCase().includes(pf)) ||
            (a.employee_code && a.employee_code.toLowerCase().includes(pf)) ||
            (a.partner_id && String(a.partner_id).toLowerCase().includes(pf)) ||
            (a.employee_id && String(a.employee_id).toLowerCase().includes(pf))
          );
        }
        const total = res.data.pagination?.total || list.length;
        const computedPages = Math.max(1, Math.ceil(total / limit));
        setApplications(list);
        setTotalCount(total);
        setTotalPages(computedPages);
      }
    } catch (e) {
      console.error('Applications load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, limit, statusFilter, commFilter, partnerFilter, processTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const clearAllFilters = () => {
    setSearch('');
    setDateRange('all');
    setProductFilter('all');
    setBankFilter('all');
    setProcessTypeFilter('all');
    setSourceTypeFilter('all');
    setPartnerFilter('');
    setStatusFilter('all');
    setCommFilter('all');
    setPage(1);
  };

  // Open 360° Drawer
  const handleOpen360Drawer = async (app, tab = 'overview') => {
    setSelectedApp(app);
    setActiveDrawerTab(tab);
    setDetailDrawerOpen(true);
    setActionMenuAppId(null);
    setNoteForm({ note: '', visibility: 'public' });
    
    try {
      const [tRes, dRes, fullAppRes] = await Promise.all([
        api.get(`/applications/${app.id}/timeline`).catch(() => null),
        api.get(`/applications/${app.id}/documents`).catch(() => null),
        api.get(`/applications/${app.id}`).catch(() => null)
      ]);
      if (tRes?.data?.success) setTimelines(tRes.data.data || []);
      if (dRes?.data?.success) setDocuments(dRes.data.data || []);
      if (fullAppRes?.data?.success && fullAppRes.data.data) {
        const fullApp = fullAppRes.data.data;
        setSelectedApp(prev => ({ ...prev, ...fullApp, notes_list: fullApp.notes_list || [] }));
        setNotes(fullApp.notes_list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Remark / Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.note.trim() || !selectedApp?.id) return;
    setPostingNote(true);
    try {
      const res = await api.post(`/applications/${selectedApp.id}/notes`, noteForm);
      if (res.data?.success) {
        setNoteForm({ note: '', visibility: 'public' });
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

  // Status Action Handlers
  const handleUpdateStatus = async (appId, newStatus) => {
    if (!appId) return;
    setSubmittingOpsAction(true);
    try {
      const res = await api.put(`/applications/${appId}/status`, {
        status: newStatus,
        remarks: opsRemark || `Status updated to ${newStatus}`
      });
      if (res.data?.success || res.status === 200) {
        alert(`Application status updated to ${newStatus.toUpperCase()}!`);
        setDetailDrawerOpen(false);
        setOpsRemark('');
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setSubmittingOpsAction(false);
    }
  };

  const handleDeleteApplication = async (appId, appNumber) => {
    setActionMenuAppId(null);
    if (!window.confirm(`Are you sure you want to delete application #${appNumber || appId}? This action is irreversible.`)) return;
    try {
      const res = await api.delete(`/applications/${appId}`);
      if (res.data?.success) {
        alert('Application deleted successfully!');
        if (selectedApp?.id === appId) setDetailDrawerOpen(false);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete application record');
    }
  };

  // Select all checkboxes
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppIds(applications.map(a => a.id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const toggleSelectApp = (id) => {
    setSelectedAppIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Badge Color & Label Helpers
  const renderAppStatusBadge = (status) => {
    const st = (status || 'submitted').toLowerCase();
    if (st.includes('approved') || st.includes('verified')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
          <span>🟢</span>
          <span>{st === 'operational_verified' ? 'Operational Verified' : 'Approved'}</span>
        </span>
      );
    }
    if (st.includes('review') || st.includes('verification')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
          <span>🟡</span>
          <span>Under Review</span>
        </span>
      );
    }
    if (st.includes('reject') || st.includes('decline') || st.includes('cancel')) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <span>🔴</span>
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
        <span>🟠</span>
        <span>Details Submitted</span>
      </span>
    );
  };

  const renderProcessBadge = (processBy, partnerCode, empCode) => {
    const proc = (processBy || '').toLowerCase();
    let badgeText = 'Direct Link';
    let badgeBg = '#F3E8FF';
    let badgeColor = '#7E22CE';
    let codeLabel = partnerCode || empCode || 'Direct';

    if (proc.includes('share') || proc.includes('partner_share')) {
      badgeText = 'Share Link';
      badgeBg = '#E0F2FE';
      badgeColor = '#0369A1';
    } else if (proc.includes('punch') || proc.includes('manual')) {
      badgeText = 'Punch Only';
      badgeBg = '#CCFBF1';
      badgeColor = '#0F766E';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: badgeBg, color: badgeColor, width: 'fit-content' }}>
          {badgeText}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>{codeLabel}</span>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: '140px' }}>
      
      {/* ── 1. PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
            Applications Tracking
          </h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
            Monitor, verify and manage application processing across all channels.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => navigate('/super-admin/leads')}
            style={{
              padding: '9px 16px', borderRadius: '10px', background: C.teal, color: '#ffffff',
              fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <MdAdd size={18} />
            <span>+ Apply Lead</span>
          </button>

          <button 
            onClick={() => setIsExportModalOpen(true)}
            style={{
              padding: '9px 16px', borderRadius: '10px', background: C.card, color: C.text,
              border: `1px solid ${C.border}`, fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <MdDownload size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── 2. TOP KPI SUMMARY CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        
        {/* Total Applications */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Total Applications</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileAlt size={16} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.total.toLocaleString()}</span>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>+12% vs last wk</span>
          </div>
        </div>

        {/* Pending Review */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Pending Review</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdHourglassEmpty size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.pending}</span>
            <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>Requires action</span>
          </div>
        </div>

        {/* Under Review */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Under Review</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdTrackChanges size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.underReview}</span>
            <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>Bank verifying</span>
          </div>
        </div>

        {/* Approved */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Approved</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCheckCircle size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.approved}</span>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>Payout ready</span>
          </div>
        </div>

        {/* Rejected */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Rejected</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCancel size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.rejected}</span>
            <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>Declined</span>
          </div>
        </div>

      </div>

      {/* ── TODAY'S ACTIVITY STATS BAR ── */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '10px 16px', marginBottom: '20px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 800, color: C.text }}>Today's Activity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: C.textMid }}>New Leads: <strong style={{ color: C.text }}>{todayStats.newLeads}</strong></span>
          <span style={{ fontSize: '12px', color: C.textMid }}>Under Review: <strong style={{ color: '#F59E0B' }}>{todayStats.underReview}</strong></span>
          <span style={{ fontSize: '12px', color: C.textMid }}>Approved: <strong style={{ color: '#10B981' }}>{todayStats.approved}</strong></span>
          <span style={{ fontSize: '12px', color: C.textMid }}>Rejected: <strong style={{ color: '#EF4444' }}>{todayStats.rejected}</strong></span>
        </div>
      </div>

      {/* ── 3. SEARCH & EXPANDABLE 2-LEVEL FILTER AREA ── */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit}>
          
          {/* Row 1: Search Bar + Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                style={{ ...S.input, paddingLeft: '38px', height: '42px', fontSize: '13.5px', borderRadius: '10px' }}
                placeholder="Search by customer name, mobile, application ID, PAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '20px' }} />
            </div>

            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                padding: '0 16px', height: '42px', borderRadius: '10px',
                background: isFilterOpen ? `${C.teal}15` : C.bgSecondary,
                border: `1px solid ${isFilterOpen ? C.teal : C.border}`,
                color: isFilterOpen ? C.teal : C.text, fontSize: '13px', fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
              }}
            >
              <FaSlidersH />
              <span>Filters</span>
              {isFilterOpen ? '▲' : '▼'}
            </button>
          </div>

          {/* Row 2: Expandable Filter Drawer */}
          {isFilterOpen && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Date Range</label>
                <select style={{ ...S.input, height: '36px', fontSize: '12.5px' }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Process Type</label>
                <select style={{ ...S.input, height: '36px', fontSize: '12.5px' }} value={processTypeFilter} onChange={e => setProcessTypeFilter(e.target.value)}>
                  <option value="all">All Process Types</option>
                  <option value="direct_link">Direct Link</option>
                  <option value="share_link">Share Link</option>
                  <option value="punch_only">Punch Only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Source Type</label>
                <select 
                  style={{ ...S.input, height: '36px', fontSize: '12.5px' }} 
                  value={sourceTypeFilter} 
                  onChange={e => {
                    const val = e.target.value;
                    setSourceTypeFilter(val);
                    if (val === 'partner') setPartnerFilter('ALL_PARTNERS');
                    else if (val === 'employee') setPartnerFilter('ALL_EMPLOYEES');
                    else if (val === 'all') setPartnerFilter('');
                  }}
                >
                  <option value="all">All Sources (Partners &amp; Employees &amp; Direct)</option>
                  <option value="partner">All Partners Only</option>
                  <option value="employee">All Employees Only</option>
                  <option value="customer">Customer Only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Partner / Employee Agent</label>
                <select
                  style={{ ...S.input, height: '36px', fontSize: '12.5px' }}
                  value={partnerFilter}
                  onChange={e => {
                    const val = e.target.value;
                    setPartnerFilter(val);
                    if (val === 'ALL_PARTNERS') setSourceTypeFilter('partner');
                    else if (val === 'ALL_EMPLOYEES') setSourceTypeFilter('employee');
                  }}
                >
                  <option value="">All Partners &amp; Employees</option>
                  <option value="ALL_PARTNERS">All Partners Only</option>
                  <option value="ALL_EMPLOYEES">All Employees Only</option>
                  
                  {partnersList.length > 0 && (
                    <optgroup label="── PARTNERS ──">
                      {partnersList.map((p, idx) => {
                        const code = p.partner_code || p.code || p.referral_code || p.id;
                        const name = p.full_name || p.name || p.partner_name || 'Partner';
                        return (
                          <option key={`p_${p.id || code || idx}`} value={code}>
                            {name} ({code})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {employeesList.length > 0 && (
                    <optgroup label="── EMPLOYEES ──">
                      {employeesList.map((e, idx) => {
                        const code = e.employee_code || e.code || e.emp_code || e.id;
                        const name = e.full_name || e.name || e.employee_name || 'Employee';
                        return (
                          <option key={`e_${e.id || code || idx}`} value={code}>
                            {name} ({code})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Application Status</label>
                <select style={{ ...S.input, height: '36px', fontSize: '12.5px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="submitted">Details Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="operational_verified">Operational Verified</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>Commission Status</label>
                <select style={{ ...S.input, height: '36px', fontSize: '12.5px' }} value={commFilter} onChange={e => setCommFilter(e.target.value)}>
                  <option value="all">All Commission States</option>
                  <option value="pending">Pending</option>
                  <option value="released">Released</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={clearAllFilters} style={{ padding: '6px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${C.border}`, color: C.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Clear Filters
                </button>
                <button type="submit" style={{ padding: '6px 18px', borderRadius: '8px', background: C.teal, color: '#fff', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  Apply Filters
                </button>
              </div>

            </div>
          )}

        </form>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedAppIds.length > 0 && (
        <div style={{ background: '#312E81', color: '#fff', padding: '10px 16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800 }}>{selectedAppIds.length} Application(s) Selected</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsExportModalOpen(true)} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Export Selected
            </button>
            <button onClick={() => setSelectedAppIds([])} style={{ padding: '6px 12px', borderRadius: '8px', background: 'transparent', color: '#fff', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── 4. APPLICATIONS MAIN TABLE ── */}
      <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>
            Loading applications data...
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>
            No applications found matching search criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px', width: '40px' }}>
                    <input type="checkbox" onChange={toggleSelectAll} checked={selectedAppIds.length === applications.length && applications.length > 0} />
                  </th>
                  <th style={{ padding: '14px 16px' }}>App ID &amp; Date</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Source &amp; Process</th>
                  <th style={{ padding: '14px 16px' }}>Product &amp; Bank</th>
                  <th style={{ padding: '14px 16px' }}>Status &amp; Commission</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ color: C.text }}>
                {applications.map((app) => {
                  const custName = app.customer_name || app.full_name || 'Customer';
                  const initials = getInitials(custName);
                  const isMenuOpen = actionMenuAppId === app.id;

                  return (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      
                      {/* Checkbox */}
                      <td style={{ padding: '14px 16px' }}>
                        <input type="checkbox" checked={selectedAppIds.includes(app.id)} onChange={() => toggleSelectApp(app.id)} />
                      </td>

                      {/* App ID & Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: C.text, fontFamily: 'monospace', fontSize: '12px' }}>
                          {app.app_number || `APP${app.id}`}
                        </div>
                        <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                      </td>

                      {/* Customer Avatar & Metadata */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: C.text }}>{custName}</div>
                            <div style={{ fontSize: '11px', color: C.textLight }}>{app.customer_mobile || app.mobile || 'N/A'} • {app.city || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Source & Process */}
                      <td style={{ padding: '14px 16px' }}>
                        {renderProcessBadge(app.process_by || app.source, app.partner_code, app.employee_code)}
                      </td>

                      {/* Product & Bank */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: C.text }}>{app.bank_name || 'Bank Partner'}</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>{app.product_name || 'Financial Product'}</div>
                      </td>

                      {/* Separated Application Status & Commission Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>{renderAppStatusBadge(app.status)}</div>
                          <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>
                            Commission: <span style={{ color: app.commission_released ? '#059669' : C.textMid }}>₹{app.commission_amount || '0.00'} ({app.commission_released ? 'Released' : 'Pending'})</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions: Review Button + 3-Dots Menu */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleOpen360Drawer(app, 'overview')}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: C.teal, color: '#fff', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                          >
                            Review
                          </button>

                          <button
                            onClick={() => setActionMenuAppId(isMenuOpen ? null : app.id)}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <MdMoreVert size={18} />
                          </button>
                        </div>

                        {/* Action Menu Dropdown */}
                        {isMenuOpen && (
                          <div style={{ position: 'absolute', top: '48px', right: '16px', width: '180px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', padding: '6px', zIndex: 100, textAlign: 'left' }}>
                            <button onClick={() => handleOpen360Drawer(app, 'overview')} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: C.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MdVisibility /> View 360° Details
                            </button>
                            <button onClick={() => handleOpen360Drawer(app, 'timeline')} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: C.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MdHistory /> View Timeline
                            </button>
                            <button onClick={() => setVerifyModalApp(app)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: C.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaFileAlt /> Verify Documents
                            </button>
                            <button onClick={() => handleDeleteApplication(app.id, app.app_number)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <MdDelete /> Delete Record
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. PAGINATION INFORMATION & PAGE SIZE SELECTOR ── */}
        <div style={{ padding: '14px 20px', background: C.bgSecondary, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 20, marginBottom: '16px' }}>
          
          <div style={{ fontSize: '12.5px', color: C.textLight }}>
            Showing <strong>{(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> applications
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Items Per Page Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: C.textLight }}>Per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ ...S.input, height: '32px', padding: '2px 8px', fontSize: '12px' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
              >
                <MdChevronLeft size={20} />
              </button>

              <span style={{ fontSize: '12px', fontWeight: 800, color: C.text, padding: '0 8px' }}>
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
              >
                <MdChevronRight size={20} />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ── 360° APPLICATION DETAILS CENTERED MODAL ── */}
      {detailDrawerOpen && selectedApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '8px' : '16px' }}>
          
          <div style={{ width: '100%', maxWidth: '820px', maxHeight: isMobile ? '94vh' : '90vh', background: C.card, borderRadius: isMobile ? '16px' : '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            
            {/* Drawer Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bgSecondary }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#fff', fontWeight: 900, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getInitials(selectedApp.customer_name || selectedApp.full_name)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: C.text }}>
                    {selectedApp.customer_name || selectedApp.full_name || 'Customer Details'}
                  </h3>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: C.teal, fontWeight: 700 }}>
                    {selectedApp.app_number || `APP${selectedApp.id}`}
                  </span>
                </div>
              </div>

              <button onClick={() => setDetailDrawerOpen(false)} style={{ background: 'none', border: 'none', color: C.text, fontSize: '22px', cursor: 'pointer' }}>
                <MdClose />
              </button>
            </div>

            {/* Drawer Tab Header */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.card }}>
              {['overview', 'timeline', 'documents', 'notes'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveDrawerTab(t)}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: '12px', fontWeight: 800, textTransform: 'capitalize',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: activeDrawerTab === t ? C.teal : C.textLight,
                    borderBottom: activeDrawerTab === t ? `2px solid ${C.teal}` : 'none'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Drawer Body Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              
              {/* Tab 1: Overview */}
              {activeDrawerTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Customer Info Card */}
                  <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Customer Profile</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px' }}>
                      <div><span style={{ color: C.textLight }}>Phone:</span> <strong style={{ color: C.text }}>{selectedApp.customer_mobile || selectedApp.mobile || 'N/A'}</strong></div>
                      <div><span style={{ color: C.textLight }}>City:</span> <strong style={{ color: C.text }}>{selectedApp.city || 'N/A'}</strong></div>
                      <div><span style={{ color: C.textLight }}>PAN:</span> <strong style={{ color: C.text }}>{selectedApp.pan_number || selectedApp.pan || 'N/A'}</strong></div>
                      <div><span style={{ color: C.textLight }}>Salary:</span> <strong style={{ color: C.text }}>₹{selectedApp.monthly_salary || 'N/A'}</strong></div>
                    </div>
                  </div>

                  {/* Product & Attribution Card */}
                  <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Product &amp; Source Attribution</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px' }}>
                      <div><span style={{ color: C.textLight }}>Bank:</span> <strong style={{ color: C.text }}>{selectedApp.bank_name || 'Bank Partner'}</strong></div>
                      <div><span style={{ color: C.textLight }}>Product:</span> <strong style={{ color: C.text }}>{selectedApp.product_name || 'Financial Product'}</strong></div>
                      <div><span style={{ color: C.textLight }}>Process:</span> <strong style={{ color: C.text }}>{selectedApp.process_by || 'Direct Link'}</strong></div>
                      <div><span style={{ color: C.textLight }}>Partner Code:</span> <strong style={{ color: C.teal }}>{selectedApp.partner_code || 'Direct'}</strong></div>
                    </div>
                  </div>

                  {/* Status & Commission Card */}
                  <div style={{ background: C.bgSecondary, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase' }}>Status &amp; Ledger</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: C.textLight }}>Application Status:</span>
                        {renderAppStatusBadge(selectedApp.status)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: C.textLight }}>Commission Amount:</span>
                        <strong style={{ color: '#059669' }}>₹{selectedApp.commission_amount || '0.00'}</strong>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: Visual Application Timeline */}
              {activeDrawerTab === 'timeline' && (
                <div style={{ padding: '10px 0' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 800, color: C.text }}>Lifecycle Timeline</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: `2px solid ${C.teal}`, paddingLeft: '16px', marginLeft: '8px' }}>
                    
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-23px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: C.teal }} />
                      <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>✓ Lead Initiated</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>Customer profile registered</div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-23px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: C.teal }} />
                      <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>✓ Details Submitted</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>QD form &amp; documents uploaded</div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-23px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
                      <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>● Operational Verification</div>
                      <div style={{ fontSize: '11px', color: C.textLight }}>Under Ops Operator review</div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-23px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: C.border }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: C.textLight }}>○ Bank Processing</div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-23px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: C.border }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: C.textLight }}>○ Approved / Disbursed</div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 3: Documents Audit */}
              {activeDrawerTab === 'documents' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, color: C.text }}>Document Checklists</h4>
                  <button
                    onClick={() => setVerifyModalApp(selectedApp)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: C.teal, color: '#fff', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                  >
                    Open Document Verification Audit Modal
                  </button>
                </div>
              )}

              {/* Tab 4: Notes & Remarks */}
              {activeDrawerTab === 'notes' && (
                <div>
                  <form onSubmit={handleAddNote} style={{ marginBottom: '16px' }}>
                    <textarea
                      style={{ ...S.input, height: '70px', padding: '10px', fontSize: '12.5px', marginBottom: '8px' }}
                      placeholder="Add an administrative remark or internal note..."
                      value={noteForm.note}
                      onChange={e => setNoteForm({ ...noteForm, note: e.target.value })}
                    />
                    <button type="submit" disabled={postingNote} style={{ padding: '6px 14px', borderRadius: '8px', background: C.purple, color: '#fff', fontSize: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                      {postingNote ? 'Posting...' : 'Post Remark'}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* ── MODAL BOTTOM ACTIONS (MAX 3 BUTTONS PER ROW) ── */}
            <div style={{ padding: '16px', borderTop: `1px solid ${C.border}`, background: C.bgSecondary }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => setVerifyModalApp(selectedApp)}
                  style={{ padding: '8px 4px', borderRadius: '8px', background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: '11px', fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}
                >
                  Verify Docs
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'operational_verified')}
                  style={{ padding: '8px 4px', borderRadius: '8px', background: '#0D9488', color: '#fff', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  Ops Verify
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                  style={{ padding: '8px 4px', borderRadius: '8px', background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  Approve App
                </button>

                {/* 2nd Row if more than 3 buttons */}
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                  style={{ padding: '8px 4px', borderRadius: '8px', background: '#DC2626', color: '#fff', fontSize: '11px', fontWeight: 800, border: 'none', cursor: 'pointer', textAlign: 'center' }}
                >
                  Reject App
                </button>

                <button
                  onClick={() => setActiveDrawerTab('notes')}
                  style={{ padding: '8px 4px', borderRadius: '8px', background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: '11px', fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}
                >
                  Add Remark
                </button>

                <button
                  onClick={() => handleDeleteApplication(selectedApp.id, selectedApp.app_number)}
                  style={{ padding: '8px 4px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.3)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', textAlign: 'center' }}
                >
                  Delete Record
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* DOCUMENT VERIFICATION MODAL */}
      {verifyModalApp && (
        <AdminDocumentVerificationModal
          application={verifyModalApp}
          app={verifyModalApp}
          initialTab={verifyModalTab}
          onClose={() => setVerifyModalApp(null)}
          onRefresh={fetchApplications}
        />
      )}

      {/* EXPORT APPLICATIONS MODAL */}
      {isExportModalOpen && (
        <ExportApplicationsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

    </div>
  );
}
