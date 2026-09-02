import React, { useState, useEffect } from 'react';
import api from "../../../services/api";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { FileText, FileEdit, Building2, Clock, Search, CheckCircle2, Sparkles, XCircle, Layers, Eye, Download } from 'lucide-react';
import {
  MdSearch, MdFilterList, MdDownload, MdAdd, MdHourglassEmpty, MdTrackChanges,
  MdCheckCircle, MdCancel, MdChevronLeft, MdChevronRight, MdClose, MdMoreVert,
  MdVisibility, MdHistory, MdDelete, MdExpandMore, MdChevronRight as MdChevronRightIcon
} from 'react-icons/md';
import { FaFileAlt, FaSlidersH } from 'react-icons/fa';
import AdminDocumentVerificationModal from './AdminDocumentVerificationModal';
import ExportApplicationsModal from '../../../components/Admin/ExportApplicationsModal';
import { useAuthStore } from '../../../app/store/authStore';

export default function ManageApplications() {
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const user = useAuthStore((state) => state.user);
  const userRole = (user?.role || '').toUpperCase();
  const userDesignation = (user?.designation || '').toUpperCase();
  const isOpsOperator = ['ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR'].includes(userRole) || ['ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
  const isOpsHead = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_HEAD', 'OPERATIONAL_HEAD'].includes(userRole) && !isOpsOperator;
  const isOpsHeadOrSuperAdmin = isOpsHead || isOpsOperator;

  // Verification Modal State
  const [verifyModalApp, setVerifyModalApp] = useState(null);
  const [verifyModalTab, setVerifyModalTab] = useState('qd');

  // Listing State
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [backendStatusCounts, setBackendStatusCounts] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchField, setSearchField] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [processTypeFilter, setProcessTypeFilter] = useState("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [commFilter, setCommFilter] = useState("all");

  // Detail / Review Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [timelines, setTimelines] = useState([]);
  const [superAdminRemark, setSuperAdminRemark] = useState("");
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Table row 3-dots action menu
  const [actionMenuAppId, setActionMenuAppId] = useState(null);

  // Agent Lookup lists
  const [partnersList, setPartnersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const [pRes, eRes] = await Promise.all([
          api.get('/admin/partners', { params: { limit: 1000 } }).catch(() => null),
          api.get('/employees', { params: { limit: 1000 } }).catch(() => null)
        ]);

        let pArr = pRes?.data?.data?.partners || pRes?.data?.data || pRes?.data?.partners || pRes?.data || [];
        if (!Array.isArray(pArr) && typeof pArr === 'object') {
          pArr = pArr.rows || Object.values(pArr).find(v => Array.isArray(v)) || [];
        }
        setPartnersList(Array.isArray(pArr) ? pArr : []);

        let eArr = eRes?.data?.data?.employees || eRes?.data?.data || eRes?.data?.employees || eRes?.data || [];
        if (!Array.isArray(eArr) && typeof eArr === 'object') {
          eArr = eArr.rows || Object.values(eArr).find(v => Array.isArray(v)) || [];
        }
        setEmployeesList(Array.isArray(eArr) ? eArr : []);
      } catch (err) {
        console.error('Error fetching agents for filter:', err);
      }
    };
    fetchAgents();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/applications", {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
          status: status || undefined,
        },
      });
      if (res.data?.success) {
        const fetchedTotal = res.data.pagination?.total || res.data.data.length;
        setApps(res.data.data);
        setTotal(fetchedTotal);
        if (res.data.status_counts) {
          setBackendStatusCounts(res.data.status_counts);
        }
        if (!status && !search) {
          setAllCount(fetchedTotal);
        }
      }
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, limit, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const clearAllFilters = () => {
    setSearch("");
    setSearchField("all");
    setStatus("");
    setStatusFilter("all");
    setCommFilter("all");
    setDateRange("all");
    setProcessTypeFilter("all");
    setSourceTypeFilter("all");
    setPartnerFilter("");
    setPage(1);
  };

  const handleViewDetails = async (app) => {
    setSelectedApp(app);
    setAppDetail(app);
    setLoadingDetail(true);
    setSuperAdminRemark("");
    setTimelines([]);
    const targetId = app?.id || app?.application_id || app?.app_number || app?.lead_id;
    try {
      const [res, tRes] = await Promise.all([
        targetId ? api.get(`/applications/${targetId}`).catch(() => null) : Promise.resolve(null),
        targetId ? api.get(`/applications/${targetId}/timeline`).catch(() => null) : Promise.resolve(null)
      ]);
      if (res?.data?.success) {
        const det = res.data.data;
        const pd = det.physical_details || {};
        const realAppId = det.app_number || det.id || app?.app_number || app?.id || det.application_id || app?.application_id;
        const merged = { ...app, ...det, ...pd, real_id: realAppId, app_number: det.app_number || app?.app_number };
        setAppDetail(merged);
      }
      if (tRes?.data?.success) {
        setTimelines(tRes.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApproveApplication = async (appId) => {
    const targetId = appId || appDetail?.app_number || appDetail?.real_id || appDetail?.id || appDetail?.application_id || selectedApp?.app_number || selectedApp?.id || selectedApp?.application_id;
    if (!targetId) {
      alert("Application ID not found. Please refresh and try again.");
      return;
    }
    setSubmittingApprove(true);
    try {
      const res = await api.put(`/applications/${targetId}/verification`, {
        status: 'approved',
        final_status: 'Approved',
        super_admin_remark: superAdminRemark.trim() || 'Approved by Operations Head / Super Admin',
        bank_remark: superAdminRemark.trim() || 'Approved by Operations Head / Super Admin'
      });
      if (res.data?.success) {
        alert("Application status updated to APPROVED successfully!");
        setSelectedApp(null);
        setAppDetail(null);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve application.");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleOperationalVerify = async (appId) => {
    const targetId = appId || appDetail?.app_number || appDetail?.real_id || appDetail?.id || appDetail?.application_id || selectedApp?.app_number || selectedApp?.id || selectedApp?.application_id;
    if (!targetId) {
      alert("Application ID not found. Please refresh and try again.");
      return;
    }
    setSubmittingApprove(true);
    try {
      const res = await api.put(`/applications/${targetId}/verification`, {
        status: 'operational_verified',
        final_status: 'Operational Verified',
        ops_remark: superAdminRemark.trim() || 'Operational Verified by Administrative Operator',
        super_admin_remark: superAdminRemark.trim() || 'Operational Verified by Administrative Operator',
        bank_remark: superAdminRemark.trim() || 'Operational Verified by Administrative Operator'
      });
      if (res.data?.success) {
        alert("Application status updated to OPERATIONAL VERIFIED successfully!");
        setSelectedApp(null);
        setAppDetail(null);
        fetchApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify application.");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const STATUS_TABS = [
    { id: '', label: 'All Applications', color: C.primary, bg: `${C.primary}15` },
    { id: 'pending', label: 'Pending', color: '#f59e0b', bg: '#f59e0b15' },
    { id: 'details_submitted', label: 'Details Submitted', color: '#3b82f6', bg: '#3b82f615' },
    { id: 'operational_verified', label: 'Operational Verified', color: '#8b5cf6', bg: '#8b5cf615' },
    { id: 'approved', label: 'Approved', color: '#10b981', bg: '#10b98115' },
    { id: 'commission_received', label: 'Commission Received', color: '#16a34a', bg: '#16a34a15' },
    { id: 'rejected', label: 'Rejected', color: '#ef4444', bg: '#ef444415' },
    { id: 'cancelled', label: 'Cancelled', color: '#64748b', bg: '#64748b15' },
  ];

  // Calculate status counts
  const statusCounts = apps.reduce((acc, app) => {
    let s = String(app.status || '').toLowerCase();
    if (s === 'commission_released') s = 'commission_received';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const getStatusBadgeStyle = (st) => {
    const s = String(st || '').toLowerCase();
    switch (s) {
      case 'pending': return { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b40', label: 'Pending' };
      case 'details_submitted': return { bg: '#3b82f615', color: '#3b82f6', border: '#3b82f640', label: 'Details Submitted' };
      case 'operational_verified': return { bg: '#8b5cf615', color: '#8b5cf6', border: '#8b5cf640', label: 'Operational Verified' };
      case 'approved': return { bg: '#10b98115', color: '#10b981', border: '#10b98140', label: 'Approved' };
      case 'commission_released':
      case 'commission_received': return { bg: '#16a34a15', color: '#16a34a', border: '#16a34a40', label: 'Commission Received' };
      case 'rejected': return { bg: '#ef444415', color: '#ef4444', border: '#ef444440', label: 'Rejected' };
      case 'cancelled': return { bg: '#64748b15', color: '#64748b', border: '#64748b40', label: 'Cancelled' };
      default: return { bg: `${C.gold}15`, color: C.gold, border: `${C.gold}40`, label: st };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAgentLabel = (app) => {
    if (!app) return 'Direct';

    const appPName = app.partner_name || app.partner_full_name || (app.partner_first_name ? `${app.partner_first_name} ${app.partner_last_name || ''}`.trim() : null);
    const appEName = app.employee_name || app.employee_full_name || (app.employee_first_name ? `${app.employee_first_name} ${app.employee_last_name || ''}`.trim() : null);

    const pCode = app.partner_code || app.Partner_code || app.partner_id;
    const eCode = app.employee_code || app.emp_code || app.employee_id;

    let pName = appPName;
    if (!pName && pCode && partnersList.length > 0) {
      const matchP = partnersList.find(p =>
        (p.partner_code && p.partner_code === pCode) ||
        (p.code && p.code === pCode) ||
        (p.id && String(p.id) === String(pCode))
      );
      if (matchP) {
        pName = matchP.full_name || matchP.name || matchP.partner_name || (`${matchP.first_name || ''} ${matchP.last_name || ''}`.trim());
      }
    }

    let eName = appEName;
    if (!eName && eCode && employeesList.length > 0) {
      const matchE = employeesList.find(e =>
        (e.employee_code && e.employee_code === eCode) ||
        (e.emp_code && e.emp_code === eCode) ||
        (e.code && e.code === eCode) ||
        (e.id && String(e.id) === String(eCode))
      );
      if (matchE) {
        eName = matchE.full_name || matchE.name || matchE.employee_name || (`${matchE.first_name || ''} ${matchE.last_name || ''}`.trim());
      }
    }

    if (pName && pName.toLowerCase() !== 'partner') {
      return `${pName} (${pCode || 'PAR'})`;
    }

    if (eName && eName.toLowerCase() !== 'employee') {
      return `${eName} (${eCode || 'EMP'})`;
    }

    if (pCode) return `Partner ${pCode} (${pCode})`;
    if (eCode) return `Employee ${eCode} (${eCode})`;
    return 'Direct';
  };

  const renderProcessBadge = (app) => {
    const processBy = app?.process_by || app?.source || '';
    const proc = (processBy || '').toLowerCase();
    let badgeText = 'Direct Link';
    let badgeBg = '#F3E8FF';
    let badgeColor = '#7E22CE';
    let codeLabel = getAgentLabel(app);

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
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>{codeLabel}</span>
      </div>
    );
  };

  const kpis = {
    total: total || apps.length,
    pending: backendStatusCounts?.pending ?? apps.filter(a => ['submitted', 'pending', 'lead_created', 'created'].includes((a.status || '').toLowerCase())).length,
    underReview: backendStatusCounts?.under_review ?? apps.filter(a => ['under_review', 'verification', 'in_progress', 'details_submitted'].includes((a.status || '').toLowerCase())).length,
    approved: backendStatusCounts?.approved ?? apps.filter(a => ['approved', 'operational_verified', 'super_admin_approved'].includes((a.status || '').toLowerCase())).length,
    rejected: backendStatusCounts?.rejected ?? apps.filter(a => ['rejected', 'declined', 'cancelled'].includes((a.status || '').toLowerCase())).length
  };

  const totalPages = Math.ceil((total || 1) / limit);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: '100px' }}>

      {/* ── 1. PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
            Applications Management
          </h2>
          <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
            Track, verify, update and manage operations for all submitted customer applications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Total Applications</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFileAlt size={16} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Pending Review */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Pending Review</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdHourglassEmpty size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.pending}</span>
          </div>
        </div>

        {/* Under Review */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Details Submitted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdTrackChanges size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.underReview}</span>
          </div>
        </div>

        {/* Approved */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Approved</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCheckCircle size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.approved}</span>
          </div>
        </div>

        {/* Rejected */}
        <div style={{ background: C.card, borderRadius: '14px', padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Rejected</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCancel size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>{kpis.rejected}</span>
          </div>
        </div>

      </div>

      {/* ── 3. STATUS FILTER TABS ── */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.id;
          const count = tab.id === ''
            ? (backendStatusCounts?.all !== undefined ? backendStatusCounts.all : (allCount || total))
            : (backendStatusCounts ? (backendStatusCounts[tab.id] || 0) : (statusCounts[tab.id] || 0));
          return (
            <button
              key={tab.id}
              onClick={() => { setStatus(tab.id); setPage(1); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px',
                background: isActive ? tab.color : C.card,
                color: isActive ? '#ffffff' : C.text,
                border: `1px solid ${isActive ? tab.color : C.border}`,
                fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 4px 12px ${tab.color}35` : 'none'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.25)' : tab.bg,
                color: isActive ? '#ffffff' : tab.color,
                padding: '2px 7px', borderRadius: '20px', fontSize: '11px', fontWeight: 800
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 4. SEARCH & FILTERS BAR ── */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Target Field Selector */}
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              style={{
                height: '40px', padding: '0 12px', borderRadius: '10px',
                background: C.bgSecondary, border: `1px solid ${C.border}`,
                color: C.text, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <option value="all">Search All Fields</option>
              <option value="name">Customer Name</option>
              <option value="mobile">Mobile Number</option>
              <option value="app_number">Application ID</option>
              <option value="pan">PAN Card</option>
            </select>

            {/* Main Input */}
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input
                style={{ ...S.input, paddingLeft: '38px', paddingRight: search ? '36px' : '12px', height: '40px', fontSize: '13px', borderRadius: '10px' }}
                placeholder={`Search by ${searchField === 'name' ? 'customer name' : searchField === 'mobile' ? 'mobile number' : searchField === 'app_number' ? 'application ID' : searchField === 'pan' ? 'PAN card' : 'customer name, mobile, application ID, PAN'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <MdSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '20px' }} />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); fetchApplications(); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textLight, cursor: 'pointer' }}
                >
                  <MdClose size={18} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                padding: '0 16px', height: '40px', borderRadius: '10px',
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

            {/* Search Submit */}
            <button type="submit" style={{ ...S.btn("primary", false), padding: "0 22px", height: "40px", borderRadius: "10px", fontWeight: 800 }}>
              Search
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
                  <option value="punch_only">Lead Punching (Punch Only)</option>
                  <option value="share_link">Link Sharing (Share Link)</option>
                  <option value="direct_link">Direct Online</option>
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
                        const firstName = p.first_name || '';
                        const lastName = p.last_name || '';
                        const combined = `${firstName} ${lastName}`.trim();
                        const name = p.full_name || p.name || p.partner_name || (combined.length > 0 ? combined : 'Partner');
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
                        const code = e.employee_code || e.emp_code || e.code || e.id;
                        const firstName = e.first_name || '';
                        const lastName = e.last_name || '';
                        const combined = `${firstName} ${lastName}`.trim();
                        const name = e.full_name || e.name || e.employee_name || (combined.length > 0 ? combined : 'Employee');
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
              </div>

            </div>
          )}
        </form>
      </div>

      {/* ── 5. APPLICATIONS TABLE ── */}
      {err && (
        <div style={{ padding: "14px", background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: "12px", color: C.red, marginBottom: "16px" }}>
          {err}
        </div>
      )}

      <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
            <div className="animate-spin" style={{ width: '28px', height: '28px', border: `3px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }}></div>
            Fetching applications...
          </div>
        ) : apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textLight }}>
            <FaFileAlt size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: C.text }}>No applications found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search query or filters.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 16px' }}>App ID &amp; Date</th>
                  <th style={{ padding: '14px 16px' }}>Customer</th>
                  <th style={{ padding: '14px 16px' }}>Source &amp; Process</th>
                  <th style={{ padding: '14px 16px' }}>Product &amp; Bank</th>
                  <th style={{ padding: '14px 16px' }}>Status &amp; Commission</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px', color: C.text }}>
                {apps.map((app) => {
                  const badge = getStatusBadgeStyle(app.status);
                  const formattedDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                  const custName = app.customer_name || app.full_name || 'Customer';

                  return (
                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      
                      {/* App ID & Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: C.teal, fontFamily: 'monospace', fontSize: '12.5px' }}>
                          {app.app_number || `APP${app.id}`}
                        </div>
                        <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>
                          {formattedDate}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: C.bgSecondary, color: C.primary, fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, flexShrink: 0 }}>
                            {getInitials(custName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: C.text }}>{custName}</div>
                            <div style={{ fontSize: '11px', color: C.textLight }}>{app.customer_mobile || app.mobile || 'No Mobile'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Source & Process */}
                      <td style={{ padding: '14px 16px' }}>
                        {renderProcessBadge(app)}
                      </td>

                      {/* Product & Bank */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: C.text }}>{app.bank_name || app.bank_code || 'Bank Partner'}</div>
                        <div style={{ fontSize: '11px', color: C.textLight }}>{app.product_name || app.category || 'Financial Product'}</div>
                      </td>

                      {/* Status & Commission */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: "inline-block", padding: "3px 8px", borderRadius: "6px", fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", width: "fit-content",
                            background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                          }}>
                            {badge.label}
                          </span>
                          <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 700 }}>
                            Comm: <span style={{ color: app.commission_released || app.commission_status === 'processed' ? '#059669' : C.textMid }}>₹{parseFloat(app.commission_amount || 0).toLocaleString('en-IN')} ({app.commission_released || app.commission_status === 'processed' ? 'Released' : 'Pending'})</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", alignItems: "center" }}>
                          {isOpsHeadOrSuperAdmin && (
                            <button
                              onClick={() => handleViewDetails(app)}
                              style={{ background: "#7c3aed15", border: "1px solid #7c3aed40", color: "#7c3aed", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Eye size={12} /> Review
                            </button>
                          )}
                          <button
                            onClick={() => { setVerifyModalTab('qd'); setVerifyModalApp(app); }}
                            style={{ background: "#2563eb15", border: "1px solid #2563eb40", color: "#2563eb", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <FileText size={12} /> QD
                          </button>
                          <button
                            onClick={() => { setVerifyModalTab('remark'); setVerifyModalApp(app); }}
                            style={{ background: "#ea580c15", border: "1px solid #ea580c40", color: "#ea580c", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: 'center', gap: "4px" }}
                          >
                            <FileEdit size={12} /> Remark
                          </button>
                          <button
                            onClick={() => { setVerifyModalTab('final'); setVerifyModalApp(app); }}
                            style={{ background: "#16a34a15", border: "1px solid #16a34a40", color: "#16a34a", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Building2 size={12} /> Final
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION BAR ── */}
        <div style={{ padding: '14px 20px', background: C.bgSecondary, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>

          <div style={{ fontSize: '12.5px', color: C.textLight }}>
            Showing <strong>{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> applications
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Items Per Page Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: C.textLight }}>Per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ ...S.input, height: '32px', padding: '2px 8px', fontSize: '12px', borderRadius: '6px' }}
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
                Page {page} of {totalPages || 1}
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

      {/* ── 360° REVIEW DETAIL MODAL ── */}
      {selectedApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10000,
          background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "16px"
        }}>
          <div style={{
            background: C.card, borderRadius: "20px", border: `1px solid ${C.border}`,
            width: "100%", maxWidth: "850px", maxHeight: "92vh", overflowY: "auto", padding: "24px", position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)"
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedApp(null)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: C.textLight, cursor: "pointer" }}
            >
              <Icons.x size={20} />
            </button>

            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "40px", color: C.textLight, fontWeight: 600 }}>Loading details...</div>
            ) : appDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Header Summary */}
                <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '14px', marginRight: '40px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, background: `${C.primary}15`, color: C.primary, padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {appDetail.app_number || appDetail.application_no || 'APP-REF'}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '6px 0 2px' }}>
                    {appDetail.customer_name || appDetail.full_name || 'Customer'}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: C.textLight, margin: 0 }}>
                    Category: <strong>{appDetail.category || 'credit_card'}</strong> • Product: <strong>{appDetail.product_name || 'Credit Card'}</strong> • Bank: <strong>{appDetail.bank_name || 'Partner Bank'}</strong>
                  </p>
                </div>

                {/* Operational Verification & Status Upgrade Card */}
                <div style={{ background: `${C.primary}08`, border: `1.5px solid ${C.primary}30`, padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: C.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={18} /> Operational Verification &amp; Status Upgrade
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
                      background: (appDetail.status === 'approved' || appDetail.status === 'operational_verified') ? '#dcfce7' : '#ffedd5',
                      color: (appDetail.status === 'approved' || appDetail.status === 'operational_verified') ? '#15803d' : '#c2410c',
                      textTransform: 'uppercase'
                    }}>
                      Current Status: {(appDetail.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Operational Remark / Approval Note</label>
                    <textarea
                      rows={2}
                      placeholder="Enter remarks or approval notes..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', background: C.bgSecondary, color: C.text, boxSizing: 'border-box' }}
                      value={superAdminRemark}
                      onChange={e => setSuperAdminRemark(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      disabled={submittingApprove}
                      onClick={() => handleOperationalVerify(appDetail?.app_number || appDetail?.real_id || appDetail?.id)}
                      style={{ background: '#7c3aed', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 size={16} /> {submittingApprove ? 'Processing...' : 'Mark Operational Verified'}
                    </button>
                    {isOpsHead && (
                      <button
                        disabled={submittingApprove}
                        onClick={() => handleApproveApplication(appDetail?.app_number || appDetail?.real_id || appDetail?.id)}
                        style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle2 size={16} /> {submittingApprove ? 'Approving...' : 'Approve (Super Admin Approved)'}
                      </button>
                    )}
                    {(() => {
                      const isLocked = ['approved', 'super_admin_approved', 'sanctioned', 'commission_processing', 'commission_released', 'commission_received', 'disbursed', 'rejected', 'cancelled'].includes(String(appDetail?.status || '').toLowerCase());
                      return (
                        <button
                          disabled={isLocked}
                          onClick={() => {
                            if (isLocked) return;
                            const targetApp = appDetail;
                            setSelectedApp(null);
                            setVerifyModalTab('qd');
                            setVerifyModalApp(targetApp);
                          }}
                          style={{
                            background: isLocked ? '#f1f5f9' : '#2563eb15',
                            border: `1px solid ${isLocked ? '#cbd5e1' : '#2563eb40'}`,
                            color: isLocked ? '#94a3b8' : '#2563eb',
                            padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700,
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            opacity: isLocked ? 0.7 : 1
                          }}
                        >
                          {isLocked ? 'Edit Details (Locked)' : 'Edit Details (Form 1 / 2 / 3)'}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Form 1: Quick Details */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.primary, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Form 1: Quick Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div><span style={{ color: C.textLight }}>Customer Name:</span> <strong style={{ color: C.text }}>{appDetail.customer_name || appDetail.full_name || appDetail.pan_name || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Mobile Number:</span> <strong style={{ color: C.text }}>{appDetail.customer_mobile || appDetail.mobile || appDetail.aadhaar_linked_mobile || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Email Address:</span> <strong style={{ color: C.text }}>{appDetail.customer_email || appDetail.email || appDetail.personal_email || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>PAN Card Number:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{appDetail.pan_number || appDetail.pan || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Date of Birth (DOB):</span> <strong style={{ color: C.text }}>{appDetail.dob || appDetail.date_of_birth || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Aadhaar Number:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{appDetail.aadhaar_number || appDetail.aadhaar_no || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Mother's Name:</span> <strong style={{ color: C.text }}>{appDetail.mother_name || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Employer / Company Name:</span> <strong style={{ color: C.text }}>{appDetail.company_name || appDetail.employer_name || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Occupation / Designation:</span> <strong style={{ color: C.text }}>{appDetail.designation || appDetail.occupation || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Monthly Income / Salary:</span> <strong style={{ color: '#16a34a', fontWeight: 800 }}>{(appDetail.monthly_salary || appDetail.monthly_income) ? `₹${parseFloat(appDetail.monthly_salary || appDetail.monthly_income).toLocaleString('en-IN')}` : '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Residential Address:</span> <strong style={{ color: C.text }}>{[appDetail.address || appDetail.residential_address || appDetail.flat_no, appDetail.city, appDetail.state, appDetail.pincode].filter(Boolean).join(', ') || '—'}</strong></div>
                    <div>
                      <span style={{ color: C.textLight }}>Referred By (Partner / Employee):</span>{' '}
                      <strong style={{ color: C.text }}>
                        {appDetail.employee_name || appDetail.emp_code
                          ? `Employee: ${appDetail.employee_name} (${String(appDetail.emp_code || 'EMP').replace(/^CAND/, 'YOH-SE')})`
                          : appDetail.partner_code || appDetail.Partner_first_name || appDetail.partner_first_name
                            ? `Partner: ${appDetail.partner_first_name || appDetail.Partner_first_name || ''} ${appDetail.partner_last_name || appDetail.Partner_last_name || ''} (${appDetail.partner_code || appDetail.Partner_code || 'N/A'})`.trim()
                            : 'Direct / Customer Online'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Part 2: Operational Processing & Remark Form */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0d9488', margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Part 2: Operational Processing &amp; Remark Form
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div><span style={{ color: C.textLight }}>Appcode Status:</span> <strong style={{ color: C.text }}>{appDetail.appcode_status || 'Appcode Pending'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Soft Approval Status:</span> <strong style={{ color: C.text }}>{appDetail.soft_approval_status || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>VKYC Stage:</span> <strong style={{ color: C.text }}>{appDetail.vkyc_stage || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>IQA Stage:</span> <strong style={{ color: C.text }}>{appDetail.iqa_stage || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Dispatch Status:</span> <strong style={{ color: C.text }}>{appDetail.dispatch_status || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Operational Remarks:</span> <strong style={{ color: C.text }}>{appDetail.ops_remark || appDetail.processing_remark || appDetail.remarks || '—'}</strong></div>
                  </div>
                </div>

                {/* Part 3: Bank Remark & Final Form */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#9333ea', margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Part 3: Bank Remark &amp; Final Form
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div><span style={{ color: C.textLight }}>App / Bank Reference #:</span> <strong style={{ color: C.text, fontFamily: 'monospace' }}>{appDetail.bank_ref_number || appDetail.bank_application_number || appDetail.app_number || '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Applied Loan Amount:</span> <strong style={{ color: C.text }}>{(appDetail.loan_amount && Number(appDetail.loan_amount) > 0) ? `₹${parseFloat(appDetail.loan_amount).toLocaleString('en-IN')}` : '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Commission Amount / Status:</span> <strong style={{ color: C.text }}>{appDetail.commission_amount ? `₹${parseFloat(appDetail.commission_amount).toLocaleString('en-IN')}` : '₹500.00'} ({appDetail.commission_status || 'pending'})</strong></div>
                    <div><span style={{ color: C.textLight }}>VKYC / Direct Web Link:</span> <strong style={{ color: C.text }}>{appDetail.vkyc_url ? <a href={appDetail.vkyc_url} target="_blank" rel="noreferrer" style={{ color: C.primary }}>Open Link ↗</a> : '—'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Final Status from Bank:</span> <strong style={{ color: C.text }}>{appDetail.final_status || 'pending'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Eligible for Re-QD:</span> <strong style={{ color: C.text }}>{appDetail.eligible_reqd || 'No'}</strong></div>
                    <div><span style={{ color: C.textLight }}>Bank Remark:</span> <strong style={{ color: C.text }}>{appDetail.bank_remark || '—'}</strong></div>
                  </div>
                </div>

                {/* Verification Lifecycle Log Stream */}
                <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: C.text, margin: '0 0 12px', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px' }}>
                    Verification Lifecycle Log
                  </h4>
                  {timelines && timelines.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {timelines.map((t, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: C.card, border: `1px solid ${C.border}`, fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.textLight, fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: C.primary }}>{t.activity || t.title || 'Event'}</span>
                            <span>{new Date(t.created_at || t.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ fontWeight: 600, color: C.text }}>{t.description || t.status}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: C.textLight, fontStyle: 'italic' }}>No verification log events recorded yet.</div>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalApp && (
        <AdminDocumentVerificationModal
          application={verifyModalApp}
          initialTab={verifyModalTab}
          onClose={() => setVerifyModalApp(null)}
          onRefresh={fetchApplications}
        />
      )}

      {/* Export Applications Modal */}
      <ExportApplicationsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultApplications={apps}
      />
    </div>
  );
}
