import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  Search, Filter, Download, Upload, CheckCircle2, Clock, 
  XCircle, AlertCircle, Phone, MessageSquare, ArrowUpRight, 
  UserPlus, Layers, FileSpreadsheet, ChevronDown, ChevronUp,
  FileText, ShieldAlert, Sparkles, Check, RefreshCw, X, Send, Share2, Copy, Trash2
} from 'lucide-react';

const STAGES = [
  { id: 'submitted', label: 'Applied', step: 1 },
  { id: 'under_review', label: 'Verification', step: 2 },
  { id: 'approved', label: 'Approved', step: 3 },
  { id: 'disbursed', label: 'Disbursed', step: 4 },
];

export default function PartnerApplications() {
  const { t } = useTranslation();
  const { C, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || '').toUpperCase();
  const isTeamMember = userRole === 'TEAM_MEMBER';
  const isAdminOrSuperAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

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
  const [savingShareForm, setSavingShareForm] = useState(false);

  const handleGenerateShareLink = async (app) => {
    setGeneratingShare(true);
    try {
      const res = await api.post('/applications/generate-share-link', {
        application_id: app.id,
        lead_id: app.lead_id,
        product_id: app.product_id || app.productId
      });
      if (res.data?.success) {
        setShareData({
          ...res.data.data,
          app: app,
          app_number: app.app_number,
          customer_name: app.customer_name || 'Customer'
        });
        setShareForm({
          bank_application_number: app.bank_application_number || app.bank_ref_number || '',
          vkyc_status: app.vkyc_status || 'Pending',
          vkyc_url: app.vkyc_url || '',
          pan_number: app.pan_number || app.pan || '',
          monthly_salary: app.monthly_salary || app.monthly_income || app.income || '',
          remarks: app.remarks || ''
        });
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

  const handleOpenEditModal = (app) => {
    setEditApp(app);
    setEditForm({
      full_name: app.customer_name || app.full_name || '',
      mobile: app.customer_mobile || app.mobile || '',
      email: app.customer_email || app.email || '',
      dob: app.dob ? new Date(app.dob).toISOString().split('T')[0] : '',
      pan_number: app.pan_number || app.pan || '',
      employment_type: app.employment_type || 'salaried',
      monthly_salary: app.monthly_salary || app.monthly_income || app.income || '',
      employer: app.employer || app.company_name || '',
      designation: app.designation || '',
      flat_no: app.flat_no || app.house_no || app.address_line1 || '',
      sub_area: app.sub_area || '',
      landmark: app.landmark || '',
      city: app.city || '',
      state: app.state || '',
      pincode: app.pincode || '',
      mother_name: app.mother_name || '',
      company_address: app.company_address || '',
      bank_application_number: app.bank_application_number || app.bank_ref_number || '',
      loan_amount: app.loan_amount || app.approved_amount || '',
      status: app.status || 'submitted',
      vkyc_status: app.vkyc_status || 'Pending',
      vkyc_url: app.vkyc_url || '',
      remarks: app.remarks || ''
    });
    setShowEditModal(true);
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
    if (s === 'approved' || s === 'disbursed') {
      return { label: s === 'disbursed' ? 'Disbursed' : 'Approved', bg: '#10b98115', color: '#10b981', border: '#10b98130', icon: CheckCircle2 };
    }
    if (s === 'rejected' || s === 'cancelled') {
      return { label: 'Rejected', bg: '#ef444415', color: '#ef4444', border: '#ef444430', icon: XCircle };
    }
    if (s === 'pending' || s === 'lead_created' || s === 'new' || s === 'draft' || s === 'initiated' || s === 'link_sent') {
      return { label: 'Pending', bg: '#6366f115', color: '#6366f1', border: '#6366f130', icon: Clock };
    }
    if (s === 'under_review' || s === 'under review' || s === 'verification' || s === 'in_progress') {
      return { label: 'Under Review', bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b30', icon: Clock };
    }
    return { label: 'Applied', bg: '#3b82f615', color: '#3b82f6', border: '#3b82f630', icon: Clock };
  };

  const getProcessByBadge = (processBy, processType) => {
    const p = String(processBy || processType || '').toLowerCase();
    if (p.includes('physical')) {
      return { label: '📋 Physical Process', color: '#d97706', bg: '#fef3c7', border: '#f59e0b40' };
    }
    if (p.includes('share') || p.includes('link') || p.includes('customer_self')) {
      return { label: '🔗 Share Link', color: '#14b8a6', bg: '#14b8a618', border: '#14b8a640' };
    }
    if (p.includes('direct') || p.includes('bank') || p.includes('partner_self')) {
      return { label: '📱 Direct Apply', color: '#3b82f6', bg: '#3b82f618', border: '#3b82f640' };
    }
    return { label: '✍️ Partner Punch', color: '#8b5cf6', bg: '#8b5cf618', border: '#8b5cf640' };
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
          <div style={{ width: 46, height: 46, borderRadius: 16, background: `${accent}15`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} color={accent} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 900, color: textPrimary, margin: 0 }}>Applications & Leads</h1>
            <p style={{ fontSize: 12, color: textMuted, margin: '2px 0 0' }}>Track customer submissions, verification status, and commission payouts</p>
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
          {!isTeamMember && (
            <button onClick={() => setShowImportModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#f8faff', color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              <Upload size={14} /> Import CSV
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

      {/* ── Analytics Funnel Grid (Max 5 Cards per row) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? 6 : 12, marginBottom: 14 }}>
        {[
          { key: '', label: 'Total Leads', val: dashboardStats?.total ?? dashboardStats?.total_applications ?? applications.length, color: accent, icon: FileText },
          { key: 'pending', label: 'Pending', val: dashboardStats?.pending ?? applications.filter(a => ['pending', 'lead_created', 'new', 'draft', 'initiated', 'link_sent'].includes(a.status)).length, color: '#6366f1', icon: Clock },
          { key: 'under_review', label: 'Under Review', val: dashboardStats?.under_review ?? applications.filter(a => ['under_review', 'under review', 'verification', 'in_progress'].includes(a.status)).length, color: '#f59e0b', icon: Clock },
          { key: 'approved', label: 'Approved & Disbursed', val: dashboardStats?.approved ?? applications.filter(a => ['approved', 'disbursed'].includes(a.status)).length, color: '#10b981', icon: CheckCircle2 },
          { key: 'rejected', label: 'Rejected', val: dashboardStats?.rejected ?? applications.filter(a => a.status === 'rejected').length, color: '#ef4444', icon: XCircle },
        ].map((stat) => {
          const Icon = stat.icon;
          const isSelected = statusFilter === stat.key;
          return (
            <div key={stat.label}
              onClick={() => {
                setStatusFilter(stat.key);
                setSearchParams(prev => {
                  if (stat.key) prev.set('status', stat.key);
                  else prev.delete('status');
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
            <option value="submitted">Applied / Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={commFilter} onChange={e => setCommFilter(e.target.value)} style={{ ...selectStyle, flex: 1, minWidth: 130 }}>
            <option value="">All Commissions</option>
            <option value="pending">Pending</option>
            <option value="credited">Released</option>
          </select>
        </div>
      </div>

      {/* ── Applications Table & Cards ── */}
      <div style={{ borderRadius: 18, background: cardBg, border: `1px solid ${border}`, overflow: 'hidden', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: textMuted }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: accent }} />
            <p style={{ fontSize: 13, fontWeight: 700 }}>Loading application records...</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: textMuted }}>
            <FileText size={36} color={textMuted} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>No applications found</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search query or status filters</p>
          </div>
        ) : isMobile ? (
          /* Mobile Cards View (Max 4 per line on responsive screens) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: 12 }}>
            {applications.map((app, i) => {
              const isExpanded = expandedId === app.id;
              const isSelected = selectedAppIds.includes(app.id);
              const badge = getStatusBadge(app.status);
              const BadgeIcon = badge.icon;
              const stepNum = getStepProgress(app.status);

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
                      <button onClick={() => handleGenerateShareLink(app)} disabled={generatingShare}
                        style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #10b98140`, background: '#10b98115', color: '#10b981', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Share2 size={12} /> Link
                      </button>
                      <button onClick={() => handleOpenEditModal(app)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${accent}40`, background: accent + '10', color: accent, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteApplication(app.id, app.app_number)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #ef444440`, background: '#ef444410', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: isDark ? '#111111' : '#f8faff', borderBottom: `1px solid ${border}` }}>
                  <th style={{ padding: '12px 14px', width: 36 }}>
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedAppIds.length === applications.length && applications.length > 0} />
                  </th>
                  {['Application', 'Process Type', 'Customer Info', 'Product & Bank', 'Lead Stage', 'Commission', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app, i) => {
                  const isExpanded = expandedId === app.id;
                  const isSelected = selectedAppIds.includes(app.id);
                  const badge = getStatusBadge(app.status);
                  const BadgeIcon = badge.icon;
                  const stepNum = getStepProgress(app.status);

                  return (
                    <React.Fragment key={app.id}>
                      <tr className="app-row" style={{ borderBottom: `1px solid ${border}`, background: isSelected ? `${accent}08` : 'transparent', animation: `fadeIn 0.3s ease ${i * 30}ms both` }}>
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
                              👤 {app.submitted_by_name || `${app.partner_first_name || ''} ${app.partner_last_name || ''}`}
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
                              <Share2 size={13} /> Link
                            </button>
                            <button onClick={() => handleOpenEditModal(app)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${accent}40`, background: accent + '10', color: accent, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ✏️ Edit
                            </button>
                            <button onClick={() => handleDeleteApplication(app.id, app.app_number)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #ef444440`, background: '#ef444410', color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
      {showEditModal && editApp && (() => {
        const isPhysical = String(editApp.process_type || editApp.process_by || '').toLowerCase().includes('physical');
        const bankId = editApp.bank_id || editApp.bankId;
        const bankStr = String(editApp.bank_name || editApp.bank_code || editApp.product_name || '').toLowerCase();
        const isSbi = bankId === 'e7c2c604-139d-4fcf-a87c-695633535a02' || bankStr.includes('sbi');

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: `1px solid ${border}`, paddingBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textPrimary }}>✏️ Edit Application Details</h3>
                  <span style={{ fontSize: 11, color: textMuted }}>
                    App #{editApp.app_number} • {isPhysical ? '📋 Physical Process' : 'Standard Application'} • Bank: {editApp.bank_name || editApp.bank_code || 'Bank'}
                  </span>
                </div>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
              </div>

              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {!isPhysical ? (
                  /* ═══ STANDARD PROCESS (Lead Punching, Link Sharing, Direct Link) ═══ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: '12px 14px', background: `${accent}10`, border: `1px solid ${accent}30`, borderRadius: 12, fontSize: 12, color: accent, fontWeight: 700 }}>
                      ℹ️ Edit Application Reference Number, VKYC Link{isSbi ? ', & PAN Card Number' : ''}.
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Application Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter Bank Application Number"
                        value={editForm.bank_application_number}
                        onChange={e => setEditForm({ ...editForm, bank_application_number: e.target.value })}
                        style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>VKYC Link / Video URL</label>
                      <input
                        type="url"
                        placeholder="https://vkyc..."
                        value={editForm.vkyc_url}
                        onChange={e => setEditForm({ ...editForm, vkyc_url: e.target.value })}
                        style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* PAN Card Number Field — SHOW ONLY FOR SBI BANK */}
                    {isSbi && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>PAN Card Number (SBI Required) *</label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="ABCDE1234F"
                          value={editForm.pan_number}
                          onChange={e => setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                  </div>
                ) : isSbi ? (
                  /* ═══ PHYSICAL PROCESS — SBI DETAIL SHEET FORM (ADHAR LINK FIELDS) ═══ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: '10px 14px', background: '#F59E0B15', border: '1px solid #F59E0B40', borderRadius: 12, fontSize: 12, fontWeight: 800, color: isDark ? '#FBBF24' : '#B45309' }}>
                      📋 *SBI DETAIL SHEET* Form
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>ADHAR LINK CONTACT NUMBER *</label>
                        <input type="text" required value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Aadhaar linked mobile" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>AS PER PAN CARD DOB</label>
                        <input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>NAME AS PER PAN CARD *</label>
                        <input type="text" required value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Full Name as per PAN" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>PERSONAL EMAIL ID</label>
                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="email@example.com" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>PAN CARD NUMBER</label>
                        <input type="text" maxLength={10} value={editForm.pan_number} onChange={e => setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="ABCDE1234F" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>AS PER SALARY SLIP COMPANY NAME</label>
                        <input type="text" value={editForm.employer} onChange={e => setEditForm({ ...editForm, employer: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Company Name" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>DESIGNATION</label>
                        <input type="text" value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Designation / Role" />
                      </div>

                      <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>CURRENT HOME ADDRESS WITH LAND MARK PIN CODE</label>
                        <input type="text" value={editForm.flat_no} onChange={e => setEditForm({ ...editForm, flat_no: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Address with landmark & pincode" />
                      </div>

                      <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>FULL COMPANY ADDRESS</label>
                        <input type="text" value={editForm.company_address} onChange={e => setEditForm({ ...editForm, company_address: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Full official company address" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>MOTHER NAME</label>
                        <input type="text" value={editForm.mother_name} onChange={e => setEditForm({ ...editForm, mother_name: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Mother Name" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Application Number</label>
                        <input type="text" value={editForm.bank_application_number} onChange={e => setEditForm({ ...editForm, bank_application_number: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Bank Application Number" />
                      </div>
                      <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>VKYC Link</label>
                        <input type="url" value={editForm.vkyc_url} onChange={e => setEditForm({ ...editForm, vkyc_url: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="https://vkyc..." />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ═══ PHYSICAL PROCESS — OTHER BANK PROCESS DETAILS SHEET FORM ═══ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: '10px 14px', background: '#3B82F615', border: '1px solid #3B82F640', borderRadius: 12, fontSize: 12, fontWeight: 800, color: '#2563EB' }}>
                      📋 *OTHER BANK DETAIL SHEET* Form
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                      <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ CUSTOMER FULL NAME (As per PAN card) *</label>
                        <input type="text" required value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Full Name as per PAN" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Flat no / House no / sr no</label>
                        <input type="text" value={editForm.flat_no} onChange={e => setEditForm({ ...editForm, flat_no: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Flat / House / Sr No" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Sub Area</label>
                        <input type="text" value={editForm.sub_area} onChange={e => setEditForm({ ...editForm, sub_area: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Sub Area / Locality" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Landmark</label>
                        <input type="text" value={editForm.landmark} onChange={e => setEditForm({ ...editForm, landmark: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Landmark" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Pincode *</label>
                        <input type="text" maxLength={6} value={editForm.pincode} onChange={e => setEditForm({ ...editForm, pincode: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="6-digit pincode" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ PAN CARD NUMBER *</label>
                        <input type="text" maxLength={10} required value={editForm.pan_number} onChange={e => setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="ABCDE1234F" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ DOB (as per PAN)</label>
                        <input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ MOTHER FULL NAME</label>
                        <input type="text" value={editForm.mother_name} onChange={e => setEditForm({ ...editForm, mother_name: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Mother Full Name" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ PERSONAL MAIL ID</label>
                        <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="email@example.com" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ COMPANY Name (as per payment slip)</label>
                        <input type="text" value={editForm.employer} onChange={e => setEditForm({ ...editForm, employer: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Company Name" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ DESIGNATION</label>
                        <input type="text" value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Designation / Role" />
                      </div>

                      <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>✅ MOBILE No *</label>
                        <input type="text" required value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="10-digit mobile" />
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>Application Number</label>
                        <input type="text" value={editForm.bank_application_number} onChange={e => setEditForm({ ...editForm, bank_application_number: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Bank Application Number" />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, display: 'block', marginBottom: 4 }}>VKYC Link</label>
                        <input type="url" value={editForm.vkyc_url} onChange={e => setEditForm({ ...editForm, vkyc_url: e.target.value })}
                          style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }} placeholder="https://vkyc..." />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, borderTop: `1px solid ${border}`, paddingTop: 14 }}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '9px 16px', borderRadius: 12, border: `1px solid ${border}`, background: 'transparent', color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={editing} style={{ padding: '9px 22px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${accent},${C.primaryDark})`, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    {editing ? 'Saving...' : 'Save Details'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        );
      })()}

      {/* ═══ MODAL 5: CUSTOMER SHARE LINK & APPLICATION DETAILS MODAL ═══ */}
      {showShareModal && shareData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', background: cardBg, border: `1px solid ${border}`, borderRadius: 24, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textPrimary }}>🔗 Customer Application Link</h3>
                <span style={{ fontSize: 11, color: textMuted }}>Application #{shareData.app_number} for {shareData.customer_name}</span>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>

            {/* Share Link Banner & Actions Only */}
            <div style={{ background: isDark ? '#1a2234' : '#f0f7ff', border: '1px solid #3b82f640', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 4, fontWeight: 700 }}>Direct Customer Application Share URL</div>
              <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 700, wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 14, padding: 10, borderRadius: 10, background: isDark ? '#0f172a' : '#ffffff', border: `1px solid ${border}` }}>
                {shareData.share_url}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareData.share_url);
                    alert('Link copied to clipboard!');
                  }}
                  style={{ flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 12, border: `1px solid ${border}`, background: cardBg, color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Copy size={14} /> Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(`Hi ${shareData.customer_name}, please complete your application details using this secure link: ${shareData.share_url}`);
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  style={{ flex: 1, minWidth: 140, padding: '10px 14px', borderRadius: 12, border: 'none', background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  💬 Share via WhatsApp
                </button>
                {navigator.share && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.share({
                        title: `Application for ${shareData.customer_name}`,
                        text: `Complete your application details using this link:`,
                        url: shareData.share_url
                      }).catch(() => {});
                    }}
                    style={{ flex: 1, minWidth: 130, padding: '10px 14px', borderRadius: 12, border: `1px solid ${accent}40`, background: accent + '15', color: accent, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Share2 size={14} /> Share to App
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={() => setShowShareModal(false)} style={{ padding: '9px 20px', borderRadius: 12, border: `1px solid ${border}`, background: 'transparent', color: textPrimary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
