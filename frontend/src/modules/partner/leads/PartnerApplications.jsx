import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import AdminDocumentVerificationModal from '../../admin/reports/AdminDocumentVerificationModal';
import { 
  Search, Filter, Download, Upload, CheckCircle2, Clock, 
  XCircle, AlertCircle, Phone, MessageSquare, ArrowUpRight, 
  UserPlus, Layers, FileSpreadsheet, ChevronDown, ChevronUp,
  FileText, ShieldAlert, Sparkles, Check, RefreshCw, X, Send, Share2, Copy, Trash2, Eye, Activity,
  FileEdit, Building2, User
} from 'lucide-react';

const STAGES = [
  { id: 'submitted', label: 'Applied', step: 1 },
  { id: 'operational_verified', label: 'Bank Review', step: 2 },
  { id: 'super_admin_approved', label: 'Approved', step: 3 },
  { id: 'disbursed', label: 'Disbursed', step: 4 },
];

// Process-specific lifecycle stages for the TRACK modal
const PROCESS_STAGES = {
  lead_punching: [
    { id: 'pending', label: 'Application Created' },
    { id: 'details_submitted', label: 'Details Submitted' },
    { id: 'operational_verified', label: 'Operational Verified' },
    { id: 'approved', label: 'Approved' },
    { id: 'commission_released', label: 'Commission Released' },
    { id: 'commission_received', label: 'Commission Received' },
  ],
  linked_share: [
    { id: 'pending', label: 'Application Created' },
    { id: 'details_submitted', label: 'Details Submitted' },
    { id: 'operational_verified', label: 'Operational Verified' },
    { id: 'approved', label: 'Approved' },
    { id: 'commission_released', label: 'Commission Released' },
    { id: 'commission_received', label: 'Commission Received' },
  ],
  direct_bank: [
    { id: 'pending', label: 'Application Created' },
    { id: 'details_submitted', label: 'Details Submitted' },
    { id: 'operational_verified', label: 'Operational Verified' },
    { id: 'approved', label: 'Approved' },
    { id: 'commission_released', label: 'Commission Released' },
    { id: 'commission_received', label: 'Commission Received' },
  ],
  physical_process: [
    { id: 'pending', label: 'Application Created' },
    { id: 'details_submitted', label: 'Details Submitted' },
    { id: 'operational_verified', label: 'Operational Verified' },
    { id: 'approved', label: 'Approved' },
    { id: 'commission_released', label: 'Commission Released' },
    { id: 'commission_received', label: 'Commission Received' },
  ],
};

const getProcessStages = (processType) => {
  const pt = (processType || '').toLowerCase();
  return PROCESS_STAGES[pt] || PROCESS_STAGES.lead_punching;
};

export default function PartnerApplications() {
  const { t } = useTranslation();
  const { C, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || '').toUpperCase();
  const isTeamMember = userRole === 'TEAM_MEMBER';
  const isAdminOrSuperAdmin = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS', 'OPERATIONS_HEAD', 'ADMINISTRATIVE_OPERATOR'].includes(userRole);
  const isPartnerRole = ['PARTNER', 'TEAM_MEMBER'].includes(userRole) && !isAdminOrSuperAdmin;

  const getProcessFlags = (procType, procBy) => {
    const pt = String(procType || procBy || '').toLowerCase();
    const isLeadPunching = pt === 'lead_punching' || pt === 'punching' || (pt.includes('punch') && !pt.includes('direct'));
    const isLinkedShare = pt === 'linked_share' || pt === 'share_link' || (pt.includes('share') && !pt.includes('direct'));
    const isDirectBank = pt === 'direct_bank' || pt === 'direct_apply' || pt.includes('direct');
    const isPhysical = pt === 'physical_process' || pt.includes('physical');
    return { isLeadPunching, isLinkedShare, isDirectBank, isPhysical };
  };

  const isPunchLeadProcess = (procBy, procType) => {
    return getProcessFlags(procType, procBy).isLeadPunching;
  };

  const shouldHideQdButton = (procBy, procType) => {
    const { isLeadPunching, isLinkedShare, isDirectBank } = getProcessFlags(procType, procBy);
    return isLeadPunching || isLinkedShare || isDirectBank;
  };

  const shouldHideFinalButton = (procBy, procType) => {
    // Hide Final button from main applications list page. Final status updates are managed inside the modal/view by authorized roles.
    return true;
  };

  const border = isDark ? '#1f1f1f' : C.border;
  const cardBg = isDark ? '#0f0f0f' : '#ffffff';
  const pageBg = isDark ? '#000000' : C.bg;
  const textPrimary = C.text;
  const textMuted = C.textMid;
  const accent = C.primary;
  const inputBg = isDark ? '#161616' : '#f8faff';

  const [applications, setApplications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [commFilter, setCommFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'export') {
      setShowExportModal(true);
    }
  }, [searchParams]);

  // Detail components state
  const [timelines, setTimelines] = useState({});
  const [documents, setDocuments] = useState({});
  const [newNote, setNewNote] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Bulk Selection & Actions
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('under_review');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Lead Assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetApp, setAssignTargetApp] = useState(null);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Import Leads
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Edit Application Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState('qd');
  const [editApp, setEditApp] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    mobile: '',
    email: '',
    dob: '',
    pan_number: '',
    employment_type: 'salaried',
    monthly_salary: '',
    employer: '',
    city: '',
    state: '',
    pincode: '',
    bank_application_number: '',
    loan_amount: '',
    status: 'submitted',
    vkyc_status: 'Pending',
    vkyc_url: '',
    remarks: ''
  });

  // Customer Application Share Link Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [shareForm, setShareForm] = useState({
    bank_application_number: '',
    vkyc_status: 'Pending',
    vkyc_url: '',
    pan_number: '',
    monthly_salary: '',
    remarks: ''
  });
  // View Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewApp, setViewApp] = useState(null);
  const [viewAppDetails, setViewAppDetails] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  // Track Modal State
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackApp, setTrackApp] = useState(null);
  const [trackTimeline, setTrackTimeline] = useState([]);
  const [loadingTrack, setLoadingTrack] = useState(false);

  const handleOpenViewModal = async (app) => {
    setViewApp(app);
    setShowViewModal(true);
    setLoadingView(true);
    try {
      const res = await api.get(`/applications/${app.id}`);
      if (res.data?.success) {
        setViewAppDetails(res.data.data);
      } else {
        setViewAppDetails(app);
      }
    } catch (err) {
      setViewAppDetails(app);
    } finally {
      setLoadingView(false);
    }
  };

  const handleOpenTrackModal = async (app) => {
    setTrackApp(app);
    setShowTrackModal(true);
    setLoadingTrack(true);
    try {
      const res = await api.get(`/applications/${app.id}/timeline`);
      if (res.data?.success) {
        setTrackTimeline(res.data.data || []);
      } else {
        setTrackTimeline([]);
      }
    } catch (err) {
      setTrackTimeline([]);
    } finally {
      setLoadingTrack(false);
    }
  };

  const handleGenerateShareLink = async (app) => {
    setGeneratingShare(true);
    try {
      const procType = String(app.process_type || app.process_by || '').toLowerCase();
      const isPunching = procType.includes('punch') || procType === 'lead_punching';
      const isPhysical = procType.includes('physical');
      const isLinked = procType.includes('linked');

      let shareUrl = '';
      let shareTitle = `${app.product_name || 'Credit Card Application'} - GharKaPaisa`;
      let shareText = '';
      let tokenVal = app.tracking_token || app.id;

      if (isPunching) {
        // Punch process: share QD form (post-apply) link
        shareUrl = `${window.location.origin}/apply/${tokenVal}/post-apply`;
        const custName = app.customer_name || 'Customer';
        shareText = `Hello ${custName},\n\nPlease complete your Quick Details (QD) form for ${app.product_name || 'Application'} using this link:\n${shareUrl}\n\nThank you,\nGharKaPaisa Team`;
      } else {
        const endpoint = (isPhysical || isLinked) ? '/applications/generate-physical-link' : '/applications/generate-share-link';

        const res = await api.post(endpoint, {
          application_id: app.id,
          lead_id: app.lead_id,
          product_id: app.product_id || app.productId
        });
        if (res.data?.success && (res.data.data?.share_url || res.data.data?.url)) {
          shareUrl = res.data.data.share_url || res.data.data.url;
          tokenVal = res.data.data.token || app.tracking_token || tokenVal;
        } else {
          shareUrl = `${window.location.origin}/apply/${tokenVal}`;
        }
        const custName = app.customer_name || 'Customer';
        shareText = `Hello ${custName},\n\nPlease complete your application tracking and details form for ${app.product_name || 'Credit Card'} using this link:\n${shareUrl}`;
      }

      const cleanMobile = (app.customer_mobile || app.mobile || '').replace(/\D/g, '');
      const waMsg = encodeURIComponent(shareText);
      const waUrl = `https://wa.me/91${cleanMobile}?text=${waMsg}`;

      setShareData({
        app,
        shareUrl,
        whatsappUrl: waUrl,
        token: tokenVal
      });

      // Trigger native device share sheet (Share via any app)
      if (navigator.share) {
        navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        }).catch(() => {
          setShowShareModal(true);
        });
      } else {
        setShowShareModal(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate customer share link');
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleSaveShareFormDetails = async (e) => {
    e.preventDefault();
    if (!shareData?.app?.id) return;
    setSavingShareForm(true);
    try {
      const res = await api.put(`/applications/${shareData.app.id}`, shareForm);
      if (res.data?.success) {
        alert('Application details updated successfully');
        setShowShareModal(false);
        fetchApplicationsList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save application details');
    } finally {
      setSavingShareForm(false);
    }
  };

  const handleDeleteApplication = async (appId, appNumber) => {
    if (!window.confirm(`Are you sure you want to delete application lead #${appNumber}? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/applications/${appId}`);
      if (res.data?.success) {
        fetchApplicationsList();
        fetchDashboardStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete application lead');
    }
  };

  const handleOpenQdModal = (app) => {
    setEditApp(app);
    setEditModalInitialTab('qd');
    setShowEditModal(true);
  };

  const handleOpenRemarkModal = (app) => {
    setEditApp(app);
    setEditModalInitialTab('remark');
    setShowEditModal(true);
  };

  const handleOpenFinalModal = (app) => {
    setEditApp(app);
    setEditModalInitialTab('final');
    setShowEditModal(true);
  };

  const handleOpenEditModal = (app) => {
    handleOpenQdModal(app);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editApp?.id) return;
    setEditing(true);
    try {
      const res = await api.put(`/applications/${editApp.id}`, editForm);
      if (res.data?.success) {
        setShowEditModal(false);
        fetchApplicationsList();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application details');
    } finally {
      setEditing(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/applications/dashboard', {
        params: {
          scope: searchParams.get('scope') || undefined
        }
      });
      if (res.data?.success) setDashboardStats(res.data.data.stats);
    } catch (e) {
      /* silent */
    }
  };

  const fetchApplicationsList = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/applications', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          commission_status: commFilter || undefined,
          category: categoryFilter || undefined,
          scope: searchParams.get('scope') || undefined,
          member_id: memberFilter || undefined,
          limit: 100
        }
      });
      if (res.data?.success) {
        const rawData = res.data.data;
        const appList = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.rows || []);
        setApplications(appList);
      }
    } catch (e) {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/partner/team-members');
      if (res.data?.success) setTeamMembers(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== statusFilter) setStatusFilter(statusParam);
  }, [searchParams]);

  useEffect(() => {
    fetchDashboardStats();
    fetchApplicationsList();
    fetchTeamMembers();
  }, [search, statusFilter, commFilter, categoryFilter, memberFilter, searchParams]);

  const loadDetailData = async (appId) => {
    try {
      const timelineRes = await api.get(`/applications/${appId}/timeline`);
      if (timelineRes.data?.success) setTimelines(prev => ({ ...prev, [appId]: timelineRes.data.data }));
      const docsRes = await api.get(`/applications/${appId}/documents`);
      if (docsRes.data?.success) setDocuments(prev => ({ ...prev, [appId]: docsRes.data.data }));
    } catch (err) {
      /* silent */
    }
  };

  const handleToggleExpand = (app) => {
    if (expandedId === app.id) {
      setExpandedId(null);
    } else {
      setExpandedId(app.id);
      loadDetailData(app.id);
    }
  };

  const handleAddNote = async (e, appId) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await api.post(`/applications/${appId}/notes`, { note: newNote, visibility: 'public' });
      if (res.data?.success) {
        setNewNote('');
        loadDetailData(appId);
      }
    } catch (err) {
      setNewNote('');
    }
  };

  const handleFileUpload = async (e, appId, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(docType);
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('doc_type', docType);

    try {
      const res = await api.post(`/applications/${appId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) loadDetailData(appId);
    } catch (err) {
      /* silent */
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedAppIds(applications.map(a => a.id));
    else setSelectedAppIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedAppIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppIds.length) return;
    setBulkUpdating(true);
    try {
      await api.patch('/applications/bulk-status', {
        application_ids: selectedAppIds,
        status: bulkStatus
      });
      setShowBulkModal(false);
      setSelectedAppIds([]);
      fetchApplicationsList();
      fetchDashboardStats();
    } catch (err) {
      setShowBulkModal(false);
      setSelectedAppIds([]);
      fetchApplicationsList();
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignPartnerId) return;
    const targetIds = assignTargetApp ? [assignTargetApp.id] : selectedAppIds;
    if (targetIds.length === 0) return;
    setAssigning(true);
    try {
      await Promise.all(targetIds.map(id => api.post(`/applications/${id}/assign`, { partner_id: assignPartnerId })));
      setShowAssignModal(false);
      setAssignTargetApp(null);
      setSelectedAppIds([]);
      fetchApplicationsList();
      fetchDashboardStats();
    } catch (err) {
      setShowAssignModal(false);
      setAssignTargetApp(null);
      setSelectedAppIds([]);
      fetchApplicationsList();
    } finally {
      setAssigning(false);
    }
  };

  const handleImportCSVSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      await api.post('/applications/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowImportModal(false);
      fetchApplicationsList();
    } catch (err) {
      setShowImportModal(false);
      fetchApplicationsList();
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = () => {
    setShowExportModal(true);
  };

  const handleExecuteExportCSV = () => {
    if (applications.length === 0) {
      alert('No application records found matching current filters to export.');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Application / Lead ID,Customer Name,Customer Mobile,Submitted By / Member,Process Type,Product,Category,Bank,Application Status,Commission Status,Commission Amount,Date\n';

    applications.forEach(a => {
      const proc = getProcessByBadge(a.process_by, a.process_type);
      const row = [
        `"${a.app_number}"`,
        `"${a.customer_name}"`,
        `"${a.customer_mobile}"`,
        `"${a.submitted_by_name || (a.partner_first_name ? `${a.partner_first_name} ${a.partner_last_name || ''}`.trim() : 'Partner')}"`,
        `"${proc.label.replace(/[^\w\s]/gi, '').trim()}"`,
        `"${a.product_name}"`,
        `"${a.category}"`,
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
    link.setAttribute('download', `GKP_Applications_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'commission_received') {
      return { label: 'Commission Received', bg: '#05966915', color: '#059669', border: '#05966930', icon: CheckCircle2 };
    }
    if (s === 'commission_released') {
      return { label: 'Commission Released', bg: '#06b6d415', color: '#06b6d4', border: '#06b6d430', icon: CheckCircle2 };
    }
    if (s === 'approved' || s === 'disbursed') {
      return { label: 'Approved', bg: '#10b98115', color: '#10b981', border: '#10b98130', icon: CheckCircle2 };
    }
    if (s === 'operational_verified') {
      return { label: 'Operational Verified', bg: '#8b5cf615', color: '#8b5cf6', border: '#8b5cf630', icon: CheckCircle2 };
    }
    if (s === 'details_submitted' || s === 'submitted' || s === 'under_review') {
      return { label: 'Details Submitted', bg: '#3b82f615', color: '#3b82f6', border: '#3b82f630', icon: Clock };
    }
    if (s === 'rejected' || s === 'cancelled') {
      return { label: 'Rejected', bg: '#ef444415', color: '#ef4444', border: '#ef444430', icon: XCircle };
    }
    return { label: 'Pending', bg: '#6366f115', color: '#6366f1', border: '#6366f130', icon: Clock };
  };

  const getProcessByBadge = (processBy, processType) => {
    const p = String(processBy || processType || '').toLowerCase();
    if (p.includes('physical')) {
      return { label: 'Physical Process', color: '#d97706', bg: '#fef3c7', border: '#f59e0b40' };
    }
    if (p.includes('share') || p.includes('link') || p.includes('customer_self')) {
      return { label: 'Share Link', color: '#14b8a6', bg: '#14b8a618', border: '#14b8a640' };
    }
    if (p.includes('direct') || p.includes('bank') || p.includes('partner_self')) {
      return { label: 'Direct Apply', color: '#3b82f6', bg: '#3b82f618', border: '#3b82f640' };
    }
    return { label: 'Partner Punch', color: '#8b5cf6', bg: '#8b5cf618', border: '#8b5cf640' };
  };

  const getStepProgress = (status) => {
    if (status === 'rejected') return 0;
    if (status === 'disbursed') return 4;
    if (status === 'approved') return 3;
    if (status === 'under_review') return 2;
    return 1;
  };

  const selectStyle = {
    padding: '9px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${border}`, background: inputBg, color: textPrimary, outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, padding: '12px', transition: 'all 0.3s' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .app-row:hover td { background: ${isDark ? '#111111' : '#f8faff'} !important; }
        .cat-btn:hover { border-color: ${accent} !important; color: ${accent} !important; }
        .action-icon-btn:hover { background: ${accent}15 !important; color: ${accent} !important; }
      `}</style>

      {/* ── Top Header Banner ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '18px 22px', borderRadius: 20, marginBottom: 16,
        background: isDark ? 'linear-gradient(135deg,#0d0d1a,#0f0f0f)' : 'linear-gradient(135deg,#f0f4ff,#ffffff)',
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 4px 24px ${accent}10`,
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: `${accent}15`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color={accent} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 900, color: textPrimary, margin: 0 }}>My Applications</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedAppIds.length > 0 && !isTeamMember && (
            <button onClick={() => { setAssignTargetApp(null); setShowAssignModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 4px 14px ${accent}30` }}>
              <UserPlus size={14} /> Bulk Assign ({selectedAppIds.length})
            </button>
          )}
          <button onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6, marginBottom: 14 }}>
        {[
          { id: 'all', label: 'All Applications' },
          { id: 'credit_card', label: 'Credit Cards' },
          { id: 'personal_loan', label: 'Personal Loans' },
          { id: 'business_loan', label: 'Business Loans' },
          { id: 'insurance', label: 'Insurance' },
          { id: 'utility', label: 'Utilities & Recharge' },
        ].map((cat) => {
          const isActive = (categoryFilter || 'all') === cat.id;
          return (
            <button key={cat.id} className="cat-btn"
              onClick={() => {
                const currentTab = searchParams.get('tab') || 'applications';
                if (cat.id === 'all') setSearchParams({ tab: currentTab });
                else setSearchParams({ tab: currentTab, category: cat.id });
              }}
              style={{
                padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: isActive ? 800 : 600,
                border: `1.5px solid ${isActive ? accent : border}`, cursor: 'pointer', whiteSpace: 'nowrap',
                color: isActive ? '#FFFFFF' : textMuted,
                background: isActive ? `linear-gradient(135deg, ${accent}, ${C.primaryDark})` : cardBg,
                boxShadow: isActive ? `0 4px 14px ${accent}30` : 'none',
                transition: 'all 0.2s', flexShrink: 0
              }}>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Analytics Funnel Grid (Max 4 Cards per row) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 6 : 12, marginBottom: 14 }}>
        {[
          { key: '', commKey: '', label: 'Total Leads', val: dashboardStats?.total ?? dashboardStats?.total_applications ?? applications.length, color: accent, icon: FileText },
          { key: '', commKey: 'pending', label: 'Commission Pending', val: dashboardStats?.commission_pending ?? applications.filter(a => ['pending', 'unpaid', 'initiated', 'due'].includes(String(a.commission_status || '').toLowerCase()) || a.commission_status === 'pending').length, color: '#f59e0b', icon: Clock },
          { key: '', commKey: 'released', label: 'Commission Received', val: dashboardStats?.commission_received ?? dashboardStats?.commission_approved ?? dashboardStats?.commission_released ?? applications.filter(a => ['released', 'paid', 'received', 'credited', 'commission_released', 'commission_received'].includes(String(a.commission_status || '').toLowerCase()) || a.commission_status === 'released' || a.commission_status === 'credited').length, color: '#06b6d4', icon: CheckCircle2 },
          { key: 'rejected', commKey: '', label: 'Rejected', val: dashboardStats?.rejected ?? applications.filter(a => a.status === 'rejected').length, color: '#ef4444', icon: XCircle },
        ].map((stat) => {
          const Icon = stat.icon;
          const isSelected = stat.commKey
            ? commFilter === stat.commKey
            : (statusFilter === stat.key && !commFilter);
          return (
            <div key={stat.label}
              onClick={() => {
                if (stat.commKey) {
                  setCommFilter(stat.commKey);
                  setStatusFilter('');
                } else {
                  setStatusFilter(stat.key);
                  setCommFilter('');
                }
                setSearchParams(prev => {
                  if (stat.key) prev.set('status', stat.key);
                  else prev.delete('status');
                  if (stat.commKey) prev.set('commission_status', stat.commKey);
                  else prev.delete('commission_status');
                  return prev;
                });
              }}
              style={{
                padding: isMobile ? '8px 6px' : '14px 16px', borderRadius: isMobile ? 12 : 16, background: cardBg,
                border: `1.5px solid ${isSelected ? stat.color : border}`,
                borderLeft: `${isMobile ? 3 : 4}px solid ${stat.color}`,
                boxShadow: isSelected ? `0 4px 18px ${stat.color}30` : (isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(0,0,0,0.04)'),
                textAlign: isMobile ? 'center' : 'left', cursor: 'pointer', transition: 'all 0.2s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', marginBottom: isMobile ? 2 : 4 }}>
                <span style={{ fontSize: isMobile ? 8.5 : 11, fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: isMobile ? 0 : '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isMobile && stat.label === 'Approved & Disbursed' ? 'Approved' : stat.label}
                </span>
                {!isMobile && (
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color={stat.color} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 900, color: textPrimary }}>{stat.val}</div>
            </div>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div style={{
        padding: '14px 18px', borderRadius: 16, marginBottom: 14,
        background: cardBg, border: `1px solid ${border}`, display: 'flex',
        flexDirection: isMobile ? 'column' : 'row', gap: 10, alignItems: isMobile ? 'stretch' : 'center',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(0,0,0,0.04)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color={textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, mobile, app #, or bank..."
            style={{ ...selectStyle, paddingLeft: 36, width: '100%', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {teamMembers.length > 0 && (
            <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} style={{ ...selectStyle, flex: 1, minWidth: 150 }}>
              <option value="">All Team Members</option>
              {teamMembers.map(m => (
                <option key={m.id || m.user_id} value={m.user_id || m.id}>
                  {m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email} ({m.partner_code || 'Member'})
                </option>
              ))}
            </select>
          )}

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, flex: 1, minWidth: 130 }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="details_submitted">Details Submitted</option>
            <option value="operational_verified">Operational Verified</option>
            <option value="approved">Approved</option>
            <option value="commission_received">Commission Received</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={commFilter} onChange={e => setCommFilter(e.target.value)} style={{ ...selectStyle, flex: 1, minWidth: 130 }}>
            <option value="">All Commissions</option>
            <option value="pending">Pending</option>
            <option value="credited">Released</option>
          </select>
        </div>
      </div>

      {/* ── Status-Wise Stacked Tables ── */}
      {isLoading ? (
        <div style={{ borderRadius: 18, background: cardBg, border: `1px solid ${border}`, padding: '60px 20px', textAlign: 'center', color: textMuted }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: accent }} />
          <p style={{ fontSize: 13, fontWeight: 700 }}>Loading status-wise application tables...</p>
        </div>
      ) : applications.length === 0 ? (
        <div style={{ borderRadius: 18, background: cardBg, border: `1px solid ${border}`, padding: '60px 20px', textAlign: 'center', color: textMuted }}>
          <FileText size={36} color={textMuted} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>No applications found</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search query or status filters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(() => {
            const allMatchedStatuses = new Set([
              'pending', 'initiated', 'link_pending', 'bank_application_pending', 'created', 'lead_created', 'new', 'draft',
              'details_submitted', 'submitted', 'under_review', 'under review', 'verification', 'in_process', 'in_progress',
              'operational_verified', 'operational_approved', 'app_file_generated',
              'approved', 'super_admin_approved', 'disbursed',
              'commission_released', 'released', 'credited',
              'commission_received', 'received', 'paid',
              'rejected', 'cancelled', 'declined', 'decline', 'technical_error'
            ]);

            const groups = [
              {
                id: 'pending',
                title: 'Pending Applications',
                icon: Clock,
                color: '#f59e0b',
                badgeBg: '#f59e0b15',
                borderColor: '#f59e0b',
                statuses: ['pending', 'initiated', 'link_pending', 'bank_application_pending', 'created', 'lead_created', 'new', 'draft']
              },
              {
                id: 'details_submitted',
                title: 'Details Submitted Applications',
                icon: FileEdit,
                color: '#3b82f6',
                badgeBg: '#3b82f615',
                borderColor: '#3b82f6',
                statuses: ['details_submitted', 'submitted', 'under_review', 'under review', 'verification', 'in_process', 'in_progress']
              },
              {
                id: 'operational_verified',
                title: 'Operational Verified Applications',
                icon: Search,
                color: '#8b5cf6',
                badgeBg: '#8b5cf615',
                borderColor: '#8b5cf6',
                statuses: ['operational_verified', 'operational_approved', 'app_file_generated']
              },
              {
                id: 'approved',
                title: 'Approved Applications',
                icon: CheckCircle2,
                color: '#10b981',
                badgeBg: '#10b98115',
                borderColor: '#10b981',
                statuses: ['approved', 'super_admin_approved', 'disbursed']
              },
              {
                id: 'commission_released',
                title: 'Commission Released Applications',
                icon: Sparkles,
                color: '#06b6d4',
                badgeBg: '#06b6d415',
                borderColor: '#06b6d4',
                statuses: ['commission_released', 'released', 'credited']
              },
              {
                id: 'commission_received',
                title: 'Commission Received Applications',
                icon: CheckCircle2,
                color: '#16a34a',
                badgeBg: '#16a34a15',
                borderColor: '#16a34a',
                statuses: ['commission_received', 'received', 'paid']
              },
              {
                id: 'rejected',
                title: 'Rejected & Cancelled Applications',
                icon: XCircle,
                color: '#ef4444',
                badgeBg: '#ef444415',
                borderColor: '#ef4444',
                statuses: ['rejected', 'cancelled', 'declined', 'decline', 'technical_error']
              },
              {
                id: 'other',
                title: 'Other Applications',
                icon: Layers,
                color: '#6b7280',
                badgeBg: '#6b728015',
                borderColor: '#6b7280',
                isOtherFallback: true,
                statuses: []
              }
            ];

            return groups.map((group) => {
              const groupApps = group.isOtherFallback
                ? applications.filter(a => !allMatchedStatuses.has(String(a.status || '').toLowerCase()))
                : applications.filter(a => group.statuses.includes(String(a.status || '').toLowerCase()));

              // Skip empty groups if status filter is active
              if (statusFilter && statusFilter !== group.id && !group.statuses.includes(statusFilter) && groupApps.length === 0) {
                return null;
              }

              // Hide "Other Applications" table if there are 0 applications in it
              if (group.isOtherFallback && groupApps.length === 0) {
                return null;
              }

              const GroupIcon = group.icon;

            return (
              <div key={group.id} style={{
                borderRadius: 18, background: cardBg, border: `1px solid ${border}`,
                borderLeft: `5px solid ${group.borderColor}`, overflow: 'hidden',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)'
              }}>
                {/* Status Group Header */}
                <div style={{
                  padding: '14px 20px', background: isDark ? '#141414' : '#f8faff',
                  borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {GroupIcon && <GroupIcon size={18} style={{ color: group.color }} />}
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: textPrimary, margin: 0 }}>{group.title}</h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                      background: group.badgeBg, color: group.color, border: `1px solid ${group.color}40`
                    }}>
                      {groupApps.length} Applications
                    </span>
                  </div>
                </div>

                {/* Status Table Content */}
                {groupApps.length === 0 ? (
                  <div style={{ padding: '24px 20px', color: textMuted, fontSize: 13, textAlign: 'center' }}>
                    No applications currently in this status stage.
                  </div>
                ) : isMobile ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: 12 }}>
                    {groupApps.map((app, i) => {
                      const isExpanded = expandedId === app.id;
                      const isSelected = selectedAppIds.includes(app.id);
                      const badge = getStatusBadge(app.status);
                      const BadgeIcon = badge.icon;

                      return (
                        <div key={app.id} style={{
                          background: isDark ? '#121212' : '#fcfdff',
                          border: `1.5px solid ${isSelected ? accent : border}`,
                          borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                          animation: `fadeIn 0.3s ease ${i * 40}ms both`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(app.id)} />
                              <span style={{ fontWeight: 800, color: textPrimary, fontSize: 13 }}>#{app.app_number}</span>
                            </div>
                            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 800, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <BadgeIcon size={10} /> {badge.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: textMuted }}>Customer:</span>
                              <span style={{ fontWeight: 700, color: textPrimary }}>{app.customer_name}</span>
                            </div>
                            {(app.submitted_by_name || (app.partner_first_name && `${app.partner_first_name} ${app.partner_last_name || ''}`)) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: textMuted }}>Submitted By:</span>
                                <span style={{ fontWeight: 700, color: '#3b82f6' }}>{app.submitted_by_name || `${app.partner_first_name || ''} ${app.partner_last_name || ''}`}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: textMuted }}>Process By:</span>
                              {(() => {
                                const proc = getProcessByBadge(app.process_by, app.process_type);
                                return (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: proc.bg, color: proc.color, border: `1px solid ${proc.border}` }}>
                                    {proc.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: textMuted }}>Mobile:</span>
                              <span style={{ color: textMuted }}>{app.customer_mobile}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: textMuted }}>Product:</span>
                              <span style={{ fontWeight: 600, color: textPrimary }}>{app.product_name} ({app.bank_name || app.bank_code})</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: textMuted }}>Commission:</span>
                              <span style={{ fontWeight: 800, color: app.commission_amount > 0 ? '#10b981' : textMuted }}>
                                ₹{app.commission_amount || 0} ({app.commission_status || 'pending'})
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderTop: `1px solid ${border}`, paddingTop: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              {!isTeamMember && (
                                <button onClick={() => { setAssignTargetApp(app); setShowAssignModal(true); }}
                                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textPrimary, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <UserPlus size={12} /> Assign
                                </button>
                              )}
                              {String(app.process_type || '').toLowerCase() !== 'lead_punching' && (
                                <button onClick={() => handleGenerateShareLink(app)} disabled={generatingShare}
                                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #10b98140`, background: '#10b98115', color: '#10b981', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Share2 size={12} /> Share
                                </button>
                              )}
                              <button onClick={() => handleOpenViewModal(app)}
                                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #3b82f640`, background: '#3b82f615', color: '#3b82f6', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Eye size={12} /> View
                              </button>
                              <button onClick={() => handleOpenTrackModal(app)}
                                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #8b5cf640`, background: '#8b5cf615', color: '#8b5cf6', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Activity size={12} /> Track
                              </button>
                              {!shouldHideQdButton(app.process_by, app.process_type) && (
                                <button onClick={() => handleOpenQdModal(app)}
                                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #2563eb40`, background: '#2563eb12', color: '#2563eb', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <FileText size={12} /> QD
                                </button>
                              )}
                              <button onClick={() => handleOpenRemarkModal(app)}
                                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #ea580c40`, background: '#ea580c12', color: '#ea580c', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileEdit size={12} /> Remark
                              </button>
                              {!shouldHideFinalButton(app.process_by, app.process_type) && (
                                <button onClick={() => handleOpenFinalModal(app)}
                                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #16a34a40`, background: '#16a34a12', color: '#16a34a', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Building2 size={12} /> Final
                                </button>
                              )}
                              {userRole === 'SUPER_ADMIN' && (
                                <button onClick={() => handleDeleteApplication(app.id, app.app_number)}
                                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #ef444440`, background: '#ef444410', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: isDark ? '#111111' : '#f8faff', borderBottom: `1px solid ${border}` }}>
                          <th style={{ padding: '12px 14px', width: 36 }}>
                            <input type="checkbox" onChange={handleSelectAll} checked={selectedAppIds.length === groupApps.length && groupApps.length > 0} />
                          </th>
                          {['Application', 'Process Type', 'Customer Info', 'Product & Bank', 'Lead Stage', 'Commission', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '12px 14px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupApps.map((app, i) => {
                          const isSelected = selectedAppIds.includes(app.id);
                          const badge = getStatusBadge(app.status);
                          const BadgeIcon = badge.icon;

                          return (
                            <tr key={app.id} className="app-row" style={{ borderBottom: `1px solid ${border}`, background: isSelected ? `${accent}08` : 'transparent', animation: `fadeIn 0.3s ease ${i * 30}ms both` }}>
                              <td style={{ padding: '12px 14px' }}>
                                <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(app.id)} />
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 800, color: textPrimary }}>#{app.app_number}</div>
                                <div style={{ fontSize: 11, color: textMuted }}>{new Date(app.created_at).toLocaleDateString()}</div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                {(() => {
                                  const proc = getProcessByBadge(app.process_by, app.process_type);
                                  return (
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: proc.bg, color: proc.color, border: `1px solid ${proc.border}`, display: 'inline-block' }}>
                                      {proc.label}
                                    </span>
                                  );
                                })()}
                                {(app.submitted_by_name || (app.partner_first_name && `${app.partner_first_name} ${app.partner_last_name || ''}`)) && (
                                  <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 3, background: '#3b82f612', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>
                                    <User size={12} /> {app.submitted_by_name || `${app.partner_first_name || ''} ${app.partner_last_name || ''}`}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: textPrimary }}>{app.customer_name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                  <a href={`tel:${app.customer_mobile}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: accent, textDecoration: 'none', fontWeight: 700, background: `${accent}12`, padding: '2px 8px', borderRadius: 6 }}>
                                    <Phone size={10} /> {app.customer_mobile}
                                  </a>
                                  {app.customer_mobile && (
                                    <a href={`https://wa.me/91${app.customer_mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${app.customer_name}, regarding application #${app.app_number}...`)}`}
                                      target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 6, background: '#25D36620', color: '#25D366' }}>
                                      <MessageSquare size={11} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: textPrimary }}>{app.product_name}</div>
                                <div style={{ fontSize: 11, color: textMuted }}>{app.bank_name || app.bank_code}</div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 800, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <BadgeIcon size={10} /> {badge.label}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 800, color: app.commission_amount > 0 ? '#10b981' : textMuted }}>₹{app.commission_amount || 0}</div>
                                <span style={{ fontSize: 10, color: textMuted, textTransform: 'capitalize' }}>{app.commission_status || 'pending'}</span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  {!isTeamMember && (
                                    <button onClick={() => { setAssignTargetApp(app); setShowAssignModal(true); }} className="action-icon-btn"
                                      style={{ padding: 6, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer' }}>
                                      <UserPlus size={14} />
                                    </button>
                                  )}
                                  <button onClick={() => handleGenerateShareLink(app)} disabled={generatingShare}
                                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #10b98140`, background: '#10b98115', color: '#10b981', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Share2 size={13} /> Share
                                  </button>
                                  <button onClick={() => handleOpenViewModal(app)}
                                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #3b82f640`, background: '#3b82f615', color: '#3b82f6', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Eye size={13} /> View
                                  </button>
                                  <button onClick={() => handleOpenTrackModal(app)}
                                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #8b5cf640`, background: '#8b5cf615', color: '#8b5cf6', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Activity size={13} /> Track
                                  </button>
                                  {!shouldHideQdButton(app.process_by, app.process_type) && (
                                    <button onClick={() => handleOpenQdModal(app)}
                                      style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #2563eb40`, background: '#2563eb12', color: '#2563eb', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <FileText size={12} /> QD
                                    </button>
                                  )}
                                  <button onClick={() => handleOpenRemarkModal(app)}
                                    style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #ea580c40`, background: '#ea580c12', color: '#ea580c', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <FileEdit size={12} /> Remark
                                  </button>
                                  {!shouldHideFinalButton(app.process_by, app.process_type) && (
                                    <button onClick={() => handleOpenFinalModal(app)}
                                      style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #16a34a40`, background: '#16a34a12', color: '#16a34a', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <Building2 size={12} /> Final
                                    </button>
                                  )}
                                  {userRole === 'SUPER_ADMIN' && (
                                    <button onClick={() => handleDeleteApplication(app.id, app.app_number)}
                                      style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #ef444440`, background: '#ef444410', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          });
        })()}
        </div>
      )}

      {/* ═══ MODAL 1: BULK UPDATE ═══ */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 22, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary }}>Bulk Update ({selectedAppIds.length} Leads)</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>
            <form onSubmit={handleBulkStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Target Stage</label>
                <select style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="submitted">Applied</option>
                  <option value="under_review">Verification Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="disbursed">Disbursed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button type="submit" disabled={bulkUpdating}
                style={{ padding: 11, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: bulkUpdating ? 0.6 : 1 }}>
                {bulkUpdating ? 'Updating...' : 'Apply Bulk Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: ASSIGN LEAD ═══ */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 22, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary }}>
                {assignTargetApp ? `Assign Lead #${assignTargetApp.app_number}` : `Bulk Assign (${selectedAppIds.length} Leads)`}
              </h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Select Team Member to Assign</label>
                <select style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} value={assignPartnerId} onChange={e => setAssignPartnerId(e.target.value)} required>
                  <option value="">Choose Team Member...</option>
                  <option value="self">Assign to Myself (Self)</option>
                  {teamMembers.map(m => (
                    <option key={m.id || m.user_id} value={m.id || m.user_id}>
                      {m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email} ({m.partner_code || 'Member'})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={assigning}
                style={{ padding: 11, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: assigning ? 0.6 : 1 }}>
                {assigning ? 'Assigning...' : `Confirm Assignment (${assignTargetApp ? 1 : selectedAppIds.length})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: IMPORT CSV ═══ */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 22, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary }}>Import Leads via CSV</h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>
            <form onSubmit={handleImportCSVSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 6 }}>Leads CSV File</label>
                <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])} required
                  style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={importing}
                style={{ padding: 11, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: importing ? 0.6 : 1 }}>
                {importing ? 'Importing...' : 'Upload & Import Leads'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL 4: EDIT CUSTOMER & APPLICATION DETAILS ═══ */}
      {showEditModal && editApp && (
        <AdminDocumentVerificationModal
          application={editApp}
          initialTab={editModalInitialTab}
          onClose={() => setShowEditModal(false)}
          onRefresh={() => {
            fetchApplicationsList();
            fetchDashboardStats();
          }}
        />
      )}



      {/* ═══ MODAL 6: READ-ONLY VIEW APPLICATION DETAILS ═══ */}
      {showViewModal && viewApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${border}`, paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textPrimary }}>APPLICATION DETAILS</h3>
                <span style={{ fontSize: 11, color: textMuted }}>
                  App #{viewApp.app_number} • Bank: {viewApp.bank_name || viewApp.bank_code || 'Bank'} • Product: {viewApp.product_name}
                </span>
              </div>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>

            {loadingView ? (
              <div style={{ padding: 40, textAlign: 'center', color: textMuted }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: accent }} />
                <p style={{ fontSize: 12, fontWeight: 700 }}>Loading Application Details...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Section 1: Customer Details */}
                <div style={{ background: isDark ? '#161616' : '#f8fafc', borderRadius: 14, padding: 14, border: `1px solid ${border}` }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>FULL NAME</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.customer_name || viewAppDetails?.full_name || viewAppDetails?.physical_details?.full_name || viewApp?.customer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>MOBILE NUMBER</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.customer_mobile || viewAppDetails?.mobile || viewAppDetails?.physical_details?.mobile || viewApp?.customer_mobile || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>PERSONAL EMAIL ID</div>
                      <div style={{ fontWeight: 700, color: textPrimary }}>{viewAppDetails?.customer_email || viewAppDetails?.email || viewAppDetails?.physical_details?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>DOB</div>
                      <div style={{ fontWeight: 700, color: textPrimary }}>{viewAppDetails?.dob || viewAppDetails?.physical_details?.dob || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>PAN CARD NUMBER</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.pan_number || viewAppDetails?.pan || viewAppDetails?.physical_details?.pan_number || 'N/A'}</div>
                    </div>
                    {(viewAppDetails?.aadhaar_number || viewAppDetails?.physical_details?.aadhaar_number) && (
                      <div>
                        <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>AADHAAR NUMBER</div>
                        <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.aadhaar_number || viewAppDetails?.physical_details?.aadhaar_number}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Employment & Income */}
                <div style={{ background: isDark ? '#161616' : '#f8fafc', borderRadius: 14, padding: 14, border: `1px solid ${border}` }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employment & Income</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>OCCUPATION / EMPLOYMENT</div>
                      <div style={{ fontWeight: 700, color: textPrimary }}>{viewAppDetails?.employment_type || viewAppDetails?.occupation || viewAppDetails?.physical_details?.employment_type || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>MONTHLY INCOME</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>
                        {(viewAppDetails?.monthly_income || viewAppDetails?.physical_details?.monthly_income) ? `₹${Number(viewAppDetails?.monthly_income || viewAppDetails?.physical_details?.monthly_income).toLocaleString('en-IN')}` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>EMPLOYER / COMPANY NAME</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.company_name || viewAppDetails?.employer || viewAppDetails?.physical_details?.company_name || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Location / Address Details */}
                <div style={{ background: isDark ? '#161616' : '#f8fafc', borderRadius: 14, padding: 14, border: `1px solid ${border}` }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>CITY</div>
                      <div style={{ fontWeight: 700, color: textPrimary }}>{viewAppDetails?.city || viewAppDetails?.physical_details?.city || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>STATE</div>
                      <div style={{ fontWeight: 700, color: textPrimary }}>{viewAppDetails?.state || viewAppDetails?.physical_details?.state || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>PINCODE</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.pincode || viewAppDetails?.physical_details?.pincode || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Operational Information & Stage Tracking */}
                <div style={{ background: isDark ? '#1a2234' : '#eff6ff', borderRadius: 14, padding: 14, border: '1px solid #3b82f640' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational & Stage Tracking Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>APPCODE STATUS</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.appcode_status || viewAppDetails?.physical_details?.appcode_status || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>BANK APPLICATION NUMBER</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.bank_application_number || viewAppDetails?.bank_ref_number || viewAppDetails?.physical_details?.bank_application_number || viewApp?.bank_ref_number || 'Pending'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>CURRENT STAGE</div>
                      <div style={{ fontWeight: 800, color: textPrimary, textTransform: 'uppercase' }}>
                        {(viewAppDetails?.status || viewApp?.status || 'submitted').replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>APPCODE STATUS</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.appcode_status || viewAppDetails?.physical_details?.appcode_status || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>SOFT APPROVAL STAGE</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.soft_approval_status || viewAppDetails?.physical_details?.soft_approval_status || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>VKYC STAGE</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.vkyc_stage || viewAppDetails?.vkyc_status || viewAppDetails?.physical_details?.vkyc_stage || 'Pending'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>IQA STAGE</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.iqa_stage || viewAppDetails?.physical_details?.iqa_stage || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>DISPATCH STATUS</div>
                      <div style={{ fontWeight: 800, color: textPrimary }}>{viewAppDetails?.dispatch_status || viewAppDetails?.physical_details?.dispatch_status || 'N/A'}</div>
                    </div>
                    {(() => {
                      const finalSt = viewAppDetails?.final_status || viewAppDetails?.physical_details?.final_status || viewAppDetails?.status || viewApp?.status || 'In Process';
                      const lowerSt = String(finalSt).toLowerCase();
                      let statusColor = '#3b82f6';
                      if (lowerSt.includes('approve') || lowerSt.includes('disburs')) statusColor = '#10b981';
                      else if (lowerSt.includes('decline') || lowerSt.includes('reject')) statusColor = '#ef4444';
                      else if (lowerSt.includes('etq') || lowerSt.includes('error') || lowerSt.includes('pending')) statusColor = '#f59e0b';

                      return (
                        <div>
                          <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>FINAL STATUS FROM BANK</div>
                          <div style={{ fontWeight: 800, color: statusColor, textTransform: 'capitalize' }}>
                            {String(finalSt).replace(/_/g, ' ')}
                          </div>
                        </div>
                      );
                    })()}
                    {(viewAppDetails?.bank_remark || viewAppDetails?.physical_details?.bank_remark) && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: textMuted, fontSize: 10, fontWeight: 700 }}>BANK REMARK</div>
                        <div style={{ fontWeight: 700, color: textPrimary }}>{viewAppDetails?.bank_remark || viewAppDetails?.physical_details?.bank_remark}</div>
                      </div>
                    )}
                    {viewAppDetails?.vkyc_url && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: textMuted, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>VKYC LINK</div>
                        <a href={viewAppDetails.vkyc_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, wordBreak: 'break-all' }}>
                          {viewAppDetails.vkyc_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, borderTop: `1px solid ${border}`, paddingTop: 14 }}>
              <button type="button" onClick={() => setShowViewModal(false)} style={{ padding: '9px 24px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══ MODAL 7: TRACK APPLICATION LIFECYCLE ═══ */}
      {showTrackModal && trackApp && (() => {
        const processType = (trackApp.process_type || 'lead_punching').toLowerCase();
        const lifecycleStages = getProcessStages(processType);

        const currentStatus = (trackApp.status || 'submitted').toLowerCase();
        const pipelineStage = (trackApp.pipeline_stage || '').toLowerCase();
        
        const STATUS_RANK = {
          'pending': 1, 'initiated': 1, 'link_pending': 1, 'created': 1, 'lead_created': 1,
          'details_submitted': 2, 'submitted': 2, 'under_review': 2, 'link_generated': 2, 'app_number_added': 2, 'pan_check': 2,
          'operational_verified': 3, 'operational_approved': 3, 'link_sent': 3, 'kyc_pending': 3, 'qd': 3,
          'approved': 4, 'super_admin_approved': 4, 'disbursed': 4, 'bank_application': 4, 'bank_processing': 4,
          'commission_released': 5, 'commission_processing': 5, 'released': 5, 'hold': 5,
          'commission_received': 6, 'received': 6
        };

        const getStageStatus = (stageId, index) => {
          const stageIndex = index + 1;
          const statusRank = Math.max(
            STATUS_RANK[currentStatus] || 0,
            STATUS_RANK[pipelineStage] || 0
          );
          
          if (statusRank >= stageIndex) return 'completed';

          const stageIds = lifecycleStages.map(s => s.id);
          const currIdx = Math.max(stageIds.indexOf(currentStatus), stageIds.indexOf(pipelineStage));
          if (currIdx >= index && currIdx !== -1) return 'completed';

          return 'pending';
        };

        const processLabel = {
          lead_punching: 'Lead Punching Pipeline',
          linked_share: 'Linked Share Pipeline',
          direct_bank: 'Direct Bank Pipeline',
          physical_process: 'Physical Process Pipeline',
        }[processType] || 'Application Pipeline';

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 12 }}>
            <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: isDark ? 20 : 20, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${border}`, paddingBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textPrimary }}>{processLabel}</h3>
                  <span style={{ fontSize: 11, color: textMuted }}>
                    App #{trackApp.app_number} • Customer: {trackApp.customer_name}
                  </span>
                </div>
                <button onClick={() => setShowTrackModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
              </div>

              {/* Operational Summary Header Box */}
              {((trackApp.bank_application_number || trackApp.bank_ref_number) || (trackApp.vkyc_status && trackApp.vkyc_status !== 'Pending') || trackApp.vkyc_url) && (
                <div style={{ background: isDark ? '#1a2234' : '#eff6ff', border: '1px solid #3b82f640', borderRadius: 14, padding: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>Current Application Information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    {(trackApp.bank_application_number || trackApp.bank_ref_number) && (
                      <div>
                        <span style={{ color: textMuted, fontSize: 10 }}>Bank Application Number: </span>
                        <strong style={{ color: textPrimary }}>{trackApp.bank_application_number || trackApp.bank_ref_number}</strong>
                      </div>
                    )}
                    {trackApp.vkyc_status && trackApp.vkyc_status !== 'Pending' && (
                      <div>
                        <span style={{ color: textMuted, fontSize: 10 }}>VKYC Status: </span>
                        <strong style={{ color: trackApp.vkyc_status === 'Completed' ? '#10b981' : '#f59e0b' }}>{trackApp.vkyc_status}</strong>
                      </div>
                    )}
                    {trackApp.vkyc_url && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: textMuted, fontSize: 10 }}>VKYC Link: </span>
                        <a href={trackApp.vkyc_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>Open VKYC</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5-Step Progress Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, paddingLeft: 8 }}>
                {lifecycleStages.map((stage, idx) => {
                  const state = getStageStatus(stage.id, idx);
                  const isDone = state === 'completed';
                  return (
                    <div key={stage.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
                      {/* Line connector */}
                      {idx < lifecycleStages.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: 11,
                          top: 24,
                          width: 2,
                          height: 28,
                          background: isDone ? '#10b981' : border
                        }} />
                      )}
                      
                      {/* Node Dot */}
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isDone ? '#10b981' : (isDark ? '#262626' : '#e2e8f0'),
                        color: isDone ? '#fff' : textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        zIndex: 1,
                        flexShrink: 0
                      }}>
                        {isDone ? '✓' : (idx + 1)}
                      </div>

                      {/* Content */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isDone ? textPrimary : textMuted }}>
                          {stage.label}
                        </div>
                        <div style={{ fontSize: 11, color: textMuted }}>
                          {isDone ? 'Stage Completed' : 'Pending Step'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Activity Logs */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 14 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: textMuted, textTransform: 'uppercase' }}>Activity Timeline History</h4>
                {loadingTrack ? (
                  <div style={{ textAlign: 'center', color: textMuted, padding: 20, fontSize: 12 }}>Loading timeline history...</div>
                ) : trackTimeline.length === 0 ? (
                  <div style={{ fontSize: 12, color: textMuted }}>No history logs recorded yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                    {trackTimeline.map(item => (
                      <div key={item.id || item.created_at} style={{ background: isDark ? '#161616' : '#f8fafc', padding: '10px 12px', borderRadius: 10, fontSize: 12, border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 800, color: textPrimary }}>{item.activity || item.title || item.status}</span>
                          <span style={{ fontSize: 10, color: textMuted }}>{new Date(item.performed_at || item.created_at).toLocaleString()}</span>
                        </div>
                        {item.remarks || item.description ? (
                          <div style={{ fontSize: 11, color: textMuted }}>{item.remarks || item.description}</div>
                        ) : null}
                        {item.performed_by_name && (
                          <div style={{ fontSize: 10, color: accent, fontWeight: 700, marginTop: 4 }}>By: {item.performed_by_name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, borderTop: `1px solid ${border}`, paddingTop: 14 }}>
                <button type="button" onClick={() => setShowTrackModal(false)} style={{ padding: '9px 24px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ═══ MODAL 5: EXPORT CSV DIALOG ═══ */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={18} color="#10b981" /> Export Applications CSV
              </h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: 12.5, color: textMuted, margin: 0, lineHeight: 1.5 }}>
              Download CSV report of applications owned by your account and your downline team members.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {teamMembers.length > 0 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Filter Member</label>
                  <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                    <option value="">All Team Members & Self</option>
                    {teamMembers.map(m => (
                      <option key={m.id || m.user_id} value={m.user_id || m.id}>
                        {m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email} ({m.partner_code || 'Member'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Filter Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Applied / Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="disbursed">Disbursed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: accent, background: `${accent}12`, padding: '10px 12px', borderRadius: 10 }}>
                📊 Total Matching Records: <strong>{applications.length}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowExportModal(false)} style={{ padding: '9px 18px', borderRadius: 12, border: `1px solid ${border}`, background: 'transparent', color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleExecuteExportCSV} style={{ padding: '9px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Download CSV File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 6: SHARE APPLICATION DETAIL LINK MODAL ═══ */}
      {showShareModal && shareData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} color="#10b981" /> Application Detail Sheet Link
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>

            <div style={{ background: isDark ? '#161616' : '#f8fafc', padding: 14, borderRadius: 14, border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
              <div><strong style={{ color: textMuted }}>Application #:</strong> <span style={{ color: accent, fontWeight: 800 }}>#{shareData.app?.app_number || shareData.app?.lead_number || 'APP-LINK'}</span></div>
              <div><strong style={{ color: textMuted }}>Customer Name:</strong> <span style={{ color: textPrimary, fontWeight: 700 }}>{shareData.app?.customer_name || 'Customer'}</span></div>
              <div><strong style={{ color: textMuted }}>Mobile:</strong> <span style={{ color: textPrimary, fontWeight: 700 }}>{shareData.app?.customer_mobile || shareData.app?.mobile || 'N/A'}</span></div>
              <div><strong style={{ color: textMuted }}>Product:</strong> <span style={{ color: textPrimary, fontWeight: 700 }}>{shareData.app?.product_name || 'Financial Product'}</span></div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Customer Application & Status Tracking Link
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={shareData.shareUrl}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`,
                    background: inputBg, color: textPrimary, fontSize: 12, fontWeight: 600, outline: 'none'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareData.shareUrl);
                    alert('📋 Application Link copied to clipboard!');
                  }}
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: 'none',
                    background: `${accent}20`, color: accent, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <a
                href={shareData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '11px 16px', borderRadius: 12, border: 'none', background: '#25D366',
                  color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <MessageSquare size={16} /> Share via WhatsApp to Customer
              </a>

              <a
                href={shareData.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '11px 16px', borderRadius: 12, border: `1.5px solid ${accent}`, background: `${accent}12`,
                  color: accent, fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <ArrowUpRight size={16} /> Open & Fill Application Tracking Form
              </a>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.post(`/applications/${shareData.app?.id}/send-link`);
                    if (res.data?.success) {
                      alert(`✅ SMS Link dispatched successfully to customer ${shareData.app?.customer_mobile || shareData.app?.mobile}!`);
                    }
                  } catch (smsErr) {
                    alert(smsErr.response?.data?.message || 'Failed to resend SMS to customer');
                  }
                }}
                style={{
                  padding: '11px 16px', borderRadius: 12, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f1f5f9',
                  color: textPrimary, fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Send size={15} /> Send / Resend Automatic SMS to Customer
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${border}`, paddingTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
