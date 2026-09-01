import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { Icons } from '../../../components/Icon/PartnerIcons';
import { 
  ShieldCheck, 
  Zap, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Coins, 
  CreditCard, 
  Landmark, 
  Package, 
  RotateCw, 
  AlertTriangle,
  Eye
} from 'lucide-react';

export default function SuperAdminOverview() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active Tab: 'overview' | 'customers' | 'partners' | 'team' | 'applications' | 'admins' | 'financials'
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [customersList, setCustomersList] = useState([]);
  const [partnersList, setPartnersList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [applicationsList, setApplicationsList] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [razorpayBalance, setRazorpayBalance] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [processFilter, setProcessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Modal Detailed View States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [selectedAppTrace, setSelectedAppTrace] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [customerApps, setCustomerApps] = useState([]);
  const [partnerApps, setPartnerApps] = useState([]);
  const [partnerTeam, setPartnerTeam] = useState([]);
  const [memberApps, setMemberApps] = useState([]);

  const fetchMasterData = async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      const [overviewRes, customersRes, partnersRes, teamRes, appsRes, adminsRes, walletBalRes] = await Promise.allSettled([
        api.get('/reports/overview'),
        api.get('/reports/customers'),
        api.get('/reports/export-partners'),
        api.get('/team/members'),
        api.get('/applications', { params: { limit: 100 } }),
        api.get('/superadmin/admins'),
        api.get('/wallet/balance')
      ]);

      let hasErrors = false;

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.success) {
        setOverviewData(overviewRes.value.data.data);
      } else { hasErrors = true; }

      if (customersRes.status === 'fulfilled' && customersRes.value.data?.success) {
        setCustomersList(customersRes.value.data.data || []);
      } else { hasErrors = true; }

      if (partnersRes.status === 'fulfilled' && partnersRes.value.data?.success) {
        setPartnersList(partnersRes.value.data.data?.partners || []);
      } else { hasErrors = true; }

      if (teamRes.status === 'fulfilled' && teamRes.value.data?.success) {
        setTeamList(teamRes.value.data.data?.members || teamRes.value.data.data || []);
      } else { hasErrors = true; }

      if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
        setApplicationsList(appsRes.value.data.data?.applications || appsRes.value.data.data || []);
      } else { hasErrors = true; }

      if (adminsRes.status === 'fulfilled' && adminsRes.value.data?.success) {
        setAdminsList(adminsRes.value.data.data || []);
      } else { hasErrors = true; }

      if (walletBalRes.status === 'fulfilled' && walletBalRes.value.data?.success) {
        setRazorpayBalance(walletBalRes.value.data.data?.razorpay_balance);
      } else { hasErrors = true; }

      if (hasErrors) {
        setFetchError('Some dashboard metrics could not be loaded from server. Check network connection.');
      }
    } catch (err) {
      console.error('Error fetching master overview data:', err);
      setFetchError('Failed to synchronize dashboard metrics with server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);


  // View Customer Modal Details Loader
  const handleViewCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setModalLoading(true);
    setCustomerApps([]);
    try {
      const res = await api.get('/applications', { params: { search: cust.mobile || cust.email || cust.customer_name, limit: 50 } });
      if (res.data?.success) {
        const apps = res.data.data?.applications || res.data.data || [];
        setCustomerApps(apps.filter(a => a.customer_id === cust.id || a.customer_mobile === cust.mobile || a.mobile === cust.mobile));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // View Partner 360 Modal Details Loader
  const handleViewPartner = async (partner) => {
    setSelectedPartner(partner);
    setModalLoading(true);
    setPartnerApps([]);
    setPartnerTeam([]);
    try {
      const [appsRes, teamRes] = await Promise.allSettled([
        api.get('/applications', { params: { partner_id: partner.id, limit: 50 } }),
        api.get('/team/members', { params: { partner_id: partner.id } })
      ]);

      if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
        setPartnerApps(appsRes.value.data.data?.applications || appsRes.value.data.data || []);
      }

      if (teamRes.status === 'fulfilled' && teamRes.value.data?.success) {
        setPartnerTeam(teamRes.value.data.data?.members || teamRes.value.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // View Team Member Modal Details Loader
  const handleViewTeamMember = async (member) => {
    setSelectedTeamMember(member);
    setModalLoading(true);
    setMemberApps([]);
    try {
      const res = await api.get('/applications', { params: { scope: 'member', member_id: member.id, limit: 50 } });
      if (res.data?.success) {
        setMemberApps(res.data.data?.applications || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // View Application 360 Modal Details Loader
  const handleViewApplicationTrace = async (app) => {
    setModalLoading(true);
    setSelectedAppTrace(null);
    try {
      const res = await api.get(`/applications/${app.id}/trace`);
      if (res.data?.success) {
        setSelectedAppTrace(res.data.data);
      } else {
        setSelectedAppTrace({ application: app, timeline: [], documents: [], physical_details: null, wallet_ledger: [] });
      }
    } catch (err) {
      console.error(err);
      setSelectedAppTrace({ application: app, timeline: [], documents: [], physical_details: null, wallet_ledger: [] });
    } finally {
      setModalLoading(false);
    }
  };

  // Process label & style resolver
  const getProcessMeta = (proc) => {
    switch (String(proc || '').toLowerCase()) {
      case 'lead_punching':
        return { label: 'Partner Punch', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'linked_share':
        return { label: 'Linked Share', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' };
      case 'direct_bank':
        return { label: 'Direct Bank', color: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC' };
      case 'physical_process':
        return { label: 'Physical Process', color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' };
      default:
        return { label: proc || 'Partner Punch', color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' };
    }
  };

  // Metrics summary
  const stats = {
    customers: parseInt(overviewData?.customers?.total_customers ?? customersList.length ?? 0, 10),
    partners: parseInt(overviewData?.Partners?.total ?? partnersList.length ?? 0, 10),
    activePartners: parseInt(overviewData?.Partners?.active ?? partnersList.filter(p => (p.account_status || p.status) === 'active').length ?? 0, 10),
    pendingKycPartners: parseInt(overviewData?.Partners?.pending_kyc ?? overviewData?.partners?.pending_kyc ?? partnersList.filter(p => (p.kyc_status || 'pending') === 'pending').length ?? 0, 10),
    teamMembers: parseInt(overviewData?.team?.total_team ?? teamList.length ?? 0, 10),

    totalApps: parseInt(overviewData?.applications?.total ?? applicationsList.length ?? 0, 10),
    leadPunchingApps: parseInt(overviewData?.applications?.lead_punching_count ?? applicationsList.filter(a => (a.process_type || 'lead_punching') === 'lead_punching').length ?? 0, 10),
    linkedShareApps: parseInt(overviewData?.applications?.linked_share_count ?? applicationsList.filter(a => a.process_type === 'linked_share').length ?? 0, 10),
    directBankApps: parseInt(overviewData?.applications?.direct_bank_count ?? applicationsList.filter(a => a.process_type === 'direct_bank').length ?? 0, 10),
    physicalProcessApps: parseInt(overviewData?.applications?.physical_process_count ?? applicationsList.filter(a => a.process_type === 'physical_process').length ?? 0, 10),
    invalidProcessApps: parseInt(overviewData?.applications?.invalid_process_count ?? 0, 10),

    approvedApps: parseInt(overviewData?.applications?.approved ?? 0, 10),
    pendingApps: parseInt(overviewData?.applications?.pending ?? 0, 10),
    rejectedApps: parseInt(overviewData?.applications?.rejected ?? 0, 10),

    admins: parseInt(overviewData?.admins?.total_admins ?? adminsList.length ?? 0, 10),
    activeAdmins: parseInt(overviewData?.admins?.active_admins ?? adminsList.filter(a => a.status === 'active' || a.isActive).length ?? 0, 10),

    totalCommissionPaid: parseFloat(overviewData?.withdrawal?.total_commission_paid ?? 0),
    pendingWithdrawals: parseInt(overviewData?.withdrawal?.pending_withdrawals ?? 0, 10),

    banks: parseInt(overviewData?.banks?.total_banks ?? 0, 10),
    products: parseInt(overviewData?.products?.total_products ?? 0, 10),
  };

  // Data Integrity Verification
  const processSum = stats.leadPunchingApps + stats.linkedShareApps + stats.directBankApps + stats.physicalProcessApps;
  const isDataIntegrityMismatch = stats.totalApps !== processSum || stats.invalidProcessApps > 0;


  // Top Metric Cards Row (Customers, Partners, Team Members, Applications, Admins, Transactions)
  const topMetricsRow = [
    {
      id: 'customers',
      tabId: 'customers',
      label: 'Total Customers',
      value: stats.customers.toLocaleString('en-IN'),
      subtext: 'Registered Customer Network',
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.25)',
    },
    {
      id: 'partners',
      tabId: 'partners',
      label: 'Partners Network',
      value: stats.partners.toLocaleString('en-IN'),
      subtext: `${stats.activePartners} Active Partners`,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    {
      id: 'team',
      tabId: 'team',
      label: 'Team Members',
      value: stats.teamMembers.toLocaleString('en-IN'),
      subtext: 'Sub-agents & Field Network',
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.25)',
    },
    {
      id: 'applications',
      tabId: 'applications',
      label: 'Total Applications',
      value: stats.totalApps.toLocaleString('en-IN'),
      subtext: `${stats.approvedApps} Approved Applications`,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.25)',
    },
    {
      id: 'admins',
      tabId: 'admins',
      label: 'System Admins',
      value: stats.admins.toLocaleString('en-IN'),
      subtext: 'Operations Administrators',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    {
      id: 'financials',
      tabId: 'financials',
      label: 'Payouts & Ledger',
      value: `₹${parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}`,
      subtext: `Pending: ${stats.pendingWithdrawals}`,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      border: 'rgba(236, 72, 153, 0.25)',
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HEADER TITLE & REFRESH ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.5px' }}>
            Overview
          </h1>
        </div>

        <button
          onClick={fetchMasterData}
          disabled={refreshing}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            color: C.text,
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🔄</span>
          <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
        </button>
      </div>

      {/* ── ERROR & DATA INTEGRITY WARNING BANNERS ── */}
      {fetchError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 16px', borderRadius: '10px', color: '#991B1B', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠️ {fetchError}</span>
          <button onClick={fetchMasterData} style={{ background: '#991B1B', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>Retry Sync</button>
        </div>
      )}

      {isDataIntegrityMismatch && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '12px 16px', borderRadius: '10px', color: '#92400E', fontSize: '13px', fontWeight: 700 }}>
          ⚠️ <strong>Application Data Integrity Warning:</strong> Total Applications ({stats.totalApps}) does not match sum of 4 process types ({processSum}) or contains invalid process types ({stats.invalidProcessApps}).
        </div>
      )}

      {/* ── TOP METRICS ROW (Single Row Display: Customers, Partners, Team Members, Applications, Admins, Transactions) ── */}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
        gap: '12px'
      }}>
        {topMetricsRow.map((card) => (
          <div
            key={card.id}
            onClick={() => setActiveTab(card.tabId)}
            style={{
              background: C.card,
              borderRadius: '14px',
              border: `1px solid ${activeTab === card.tabId ? card.color : card.border}`,
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === card.tabId ? `0 4px 14px ${card.color}30` : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: card.color, background: card.bg, padding: '2px 6px', borderRadius: '4px' }}>
                VIEW
              </span>
            </div>

            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, lineHeight: 1.1, marginBottom: '4px' }}>
                {loading ? '...' : card.value}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, lineHeight: 1.2 }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MASTER NAVIGATION TABS ── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${C.border}`,
        gap: '4px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', label: 'System Overview' },
          { id: 'customers', label: `Customers (${stats.customers})` },
          { id: 'partners', label: `Partners (${stats.partners})` },
          { id: 'team', label: `Team Members (${stats.teamMembers})` },
          { id: 'applications', label: `Applications (${stats.totalApps})` },
          { id: 'admins', label: `Admins (${stats.admins})` },
          { id: 'financials', label: 'Financials & Payouts' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? `${C.teal}15` : 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${C.teal}` : '3px solid transparent',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                color: isActive ? C.teal : C.textMid,
                fontWeight: isActive ? 800 : 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Master 11-KPI Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '14px'
          }}>
            {[
              { label: 'Total Admins', value: stats.admins, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', icon: <ShieldCheck size={22} color="#F59E0B" />, action: () => setActiveTab('admins') },
              { label: 'Active Admins', value: stats.activeAdmins, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', icon: <Zap size={22} color="#10B981" />, action: () => setActiveTab('admins') },
              { label: 'Pending KYC', value: stats.pendingKycPartners, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)', icon: <Clock size={22} color="#F97316" />, action: () => navigate('/super-admin/partners?kyc_status=pending') },
              { label: 'Total Leads', value: stats.totalApps, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', icon: <FileText size={22} color="#3B82F6" />, action: () => navigate('/super-admin/leads') },
              { label: 'Pending Leads', value: stats.pendingApps, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', icon: <Clock size={22} color="#EAB308" />, action: () => navigate('/super-admin/leads?status=pending') },
              { label: 'Approved Leads', value: stats.approvedApps, color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.3)', icon: <CheckCircle size={22} color="#059669" />, action: () => navigate('/super-admin/leads?status=approved') },
              { label: 'Rejected Leads', value: stats.rejectedApps, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', icon: <XCircle size={22} color="#EF4444" />, action: () => navigate('/super-admin/leads?status=rejected') },
              { label: 'Commission Paid', value: `₹${parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}`, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', icon: <Coins size={22} color="#8B5CF6" />, action: () => setActiveTab('financials') },
              { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', icon: <CreditCard size={22} color="#EC4899" />, action: () => navigate('/super-admin/wallet?tab=withdrawals') },
              { label: 'Total Banks', value: stats.banks, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', icon: <Landmark size={22} color="#06B6D4" />, action: () => navigate('/super-admin/banks') },
              { label: 'Total Products', value: stats.products, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', icon: <Package size={22} color="#6366F1" />, action: () => navigate('/super-admin/products') },
            ].map((kpi, idx) => (
              <div
                key={idx}
                onClick={kpi.action}
                style={{
                  background: C.card,
                  borderRadius: '14px',
                  border: `1px solid ${kpi.border}`,
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 16px ${kpi.color}25`;
                  e.currentTarget.style.borderColor = kpi.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = kpi.border;
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                  boxShadow: `inset 0 0 0 1px ${kpi.border}`
                }}>
                  {kpi.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
                    {loading ? '...' : kpi.value}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: C.textMid, marginTop: '3px' }}>
                    {kpi.label}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: kpi.color,
                  opacity: 0.8,
                  alignSelf: 'flex-start'
                }}>
                  ➔
                </div>
              </div>
            ))}
          </div>

          {/* Quick Platform Status Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Applications Process Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                  <span>Partner Punch</span>
                  <strong style={{ color: '#3B82F6' }}>{stats.leadPunchingApps}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                  <span>Linked Share</span>
                  <strong style={{ color: '#8B5CF6' }}>{stats.linkedShareApps}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                  <span>Direct Bank</span>
                  <strong style={{ color: '#06B6D4' }}>{stats.directBankApps}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                  <span>Physical Process</span>
                  <strong style={{ color: '#F59E0B' }}>{stats.physicalProcessApps}</strong>
                </div>
                {stats.invalidProcessApps > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#FEF2F2', borderRadius: '8px', fontSize: '12px', color: '#EF4444' }}>
                    <span>Invalid / Unknown</span>
                    <strong>{stats.invalidProcessApps}</strong>
                  </div>
                )}
              </div>
              <button 
                onClick={() => { setActiveTab('applications'); setProcessFilter('all'); }} 
                style={{ marginTop: '14px', width: '100%', padding: '10px 14px', borderRadius: '8px', background: C.teal, color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                View Applications ({stats.totalApps}) →
              </button>
            </div>


            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Partner Network</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Total Partners</span>
                  <strong>{stats.partners}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Active Partners</span>
                  <strong style={{ color: '#10B981' }}>{stats.activePartners}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Pending KYC</span>
                  <strong style={{ color: '#F97316' }}>{stats.pendingKycPartners}</strong>
                </div>
              </div>
            </div>

            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Financial Payouts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Commission Paid</span>
                  <strong style={{ color: '#10B981' }}>₹{parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Pending Withdrawals</span>
                  <strong style={{ color: '#F59E0B' }}>{stats.pendingWithdrawals} Requests</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Razorpay Live Balance</span>
                  <strong style={{ color: '#3B82F6' }}>{razorpayBalance !== null ? `₹${parseFloat(razorpayBalance).toLocaleString('en-IN')}` : '₹0.00'}</strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CUSTOMERS OVERVIEW */}
      {activeTab === 'customers' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Registered Customers Directory</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>View details of all customers and their applications across the system.</p>
            </div>

            <input
              type="text"
              placeholder="Search customer name, mobile, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', width: '280px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Customer Name</th>
                  <th style={{ padding: '12px 16px' }}>Mobile & Email</th>
                  <th style={{ padding: '12px 16px' }}>City / State</th>
                  <th style={{ padding: '12px 16px' }}>Total Applications</th>
                  <th style={{ padding: '12px 16px' }}>Approved Cards</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersList
                  .filter(c => !searchQuery || (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.mobile || '').includes(searchQuery))
                  .map((cust, i) => (
                    <tr key={cust.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>{cust.customer_name || 'Customer'}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{cust.mobile || 'N/A'}<br/><span style={{ fontSize: '11px', color: C.textLight }}>{cust.email}</span></td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{cust.city || 'N/A'} {cust.state ? `, ${cust.state}` : ''}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>{cust.total_applications || 0}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10B981' }}>{cust.approved_cards || 0}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleViewCustomer(cust)}
                          style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          👁️ View Details
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PARTNERS OVERVIEW */}
      {activeTab === 'partners' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Partner Directory & 360 Info</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>View details, team members, total applications, and commission for each partner.</p>
            </div>

            <input
              type="text"
              placeholder="Search partner code, name, mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', width: '280px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Partner Code</th>
                  <th style={{ padding: '12px 16px' }}>Full Name</th>
                  <th style={{ padding: '12px 16px' }}>Email / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>KYC Status</th>
                  <th style={{ padding: '12px 16px' }}>Account Status</th>
                  <th style={{ padding: '12px 16px' }}>Wallet Balance</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partnersList
                  .filter(p => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    const name = `${p.first_name || ''} ${p.last_name || ''} ${p.company_name || ''}`.toLowerCase();
                    const code = (p.partner_code || '').toLowerCase();
                    const email = (p.email || '').toLowerCase();
                    const mobile = (p.mobile || '').toLowerCase();
                    return name.includes(q) || code.includes(q) || email.includes(q) || mobile.includes(q);
                  })
                  .map((p, i) => (
                    <tr key={p.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.teal }}>{p.partner_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>
                        {p.first_name} {p.last_name}
                        {p.company_name && <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 500 }}>🏢 {p.company_name}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{p.email}<br/><span style={{ fontSize: '11px', color: C.textLight }}>{p.mobile}</span></td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: p.kyc_status === 'approved' ? '#ECFDF5' : '#FFF7ED', color: p.kyc_status === 'approved' ? '#059669' : '#EA580C' }}>
                          {(p.kyc_status || 'PENDING').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: p.account_status === 'active' ? '#ECFDF5' : '#FEF2F2', color: p.account_status === 'active' ? '#059669' : '#EF4444' }}>
                          {(p.account_status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>
                        ₹{parseFloat(p.available_balance || 0).toLocaleString('en-IN')}
                        <div style={{ fontSize: '11px', color: C.textLight, fontWeight: 600 }}>Earned: ₹{parseFloat(p.total_earned || 0).toLocaleString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleViewPartner(p)}
                          style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          👁️ View Partner 360
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM MEMBERS OVERVIEW */}
      {activeTab === 'team' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Team Members Directory</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>All sub-agents and team members across partner networks with full performance records.</p>
            </div>

            <input
              type="text"
              placeholder="Search member name, code, mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', width: '280px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Member Name</th>
                  <th style={{ padding: '12px 16px' }}>Code / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>Sponsor / Parent Partner</th>
                  <th style={{ padding: '12px 16px' }}>Commission Rate</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamList
                  .filter(m => !searchQuery || (m.first_name || m.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.partner_code || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((m, i) => (
                    <tr key={m.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>{m.first_name || m.full_name} {m.last_name || ''}</td>
                      <td style={{ padding: '12px 16px', color: C.teal, fontWeight: 700 }}>{m.partner_code || 'TM-REF'}<br/><span style={{ fontSize: '11px', color: C.textLight }}>{m.mobile}</span></td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{m.parent_partner_name || m.sponsor_name || 'Direct Partner'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.purple }}>{m.commission_rate || m.override_rate || '100'}%</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: m.status === 'active' ? '#ECFDF5' : '#FEF2F2', color: m.status === 'active' ? '#059669' : '#EF4444' }}>
                          {(m.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleViewTeamMember(m)}
                          style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          👁️ View Member Details
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: APPLICATIONS OVERVIEW */}
      {activeTab === 'applications' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>All Applications Tracking (Unified Single Source of Truth)</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>Real-time 360° traceability across all 4 application processes.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={processFilter}
                onChange={e => setProcessFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', fontWeight: 700 }}
              >
                <option value="all">All Processes ({stats.totalApps})</option>
                <option value="lead_punching">Partner Punch ({stats.leadPunchingApps})</option>
                <option value="linked_share">Linked Share ({stats.linkedShareApps})</option>
                <option value="direct_bank">Direct Bank ({stats.directBankApps})</option>
                <option value="physical_process">Physical Process ({stats.physicalProcessApps})</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', fontWeight: 700 }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="details_submitted">Details Submitted</option>
                <option value="operational_verified">Operational Verified</option>
                <option value="approved">Approved</option>
                <option value="commission_released">Commission Released</option>
                <option value="commission_received">Commission Received</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <input
                type="text"
                placeholder="Search app#, customer, partner, product..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: '13px', width: '220px' }}
              />

              <button onClick={() => navigate('/super-admin/crm')} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                Open Full CRM →
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>App Number</th>
                  <th style={{ padding: '12px 16px' }}>Customer / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>Partner Code</th>
                  <th style={{ padding: '12px 16px' }}>Product & Bank</th>
                  <th style={{ padding: '12px 16px' }}>Process Channel</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Commission</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicationsList
                  .filter(app => {
                    if (processFilter !== 'all' && (app.process_type || 'lead_punching') !== processFilter) return false;
                    if (statusFilter !== 'all' && (app.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      const num = (app.app_number || app.lead_number || '').toLowerCase();
                      const cust = (app.customer_name || app.full_name || '').toLowerCase();
                      const mob = (app.customer_mobile || app.mobile || '').toLowerCase();
                      const part = (app.partner_code || '').toLowerCase();
                      const prod = (app.product_name || '').toLowerCase();
                      return num.includes(q) || cust.includes(q) || mob.includes(q) || part.includes(q) || prod.includes(q);
                    }
                    return true;
                  })
                  .map((app, i) => {
                    const procMeta = getProcessMeta(app.process_type);
                    return (
                      <tr key={app.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: C.teal }}>{app.app_number || app.lead_number || 'GKP-APP'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>
                          {app.customer_name || 'Customer'}<br/>
                          <span style={{ fontSize: '11px', color: C.textLight }}>{app.customer_mobile || app.mobile || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: C.purple, fontWeight: 700 }}>{app.partner_code || 'DIRECT'}</td>
                        <td style={{ padding: '12px 16px', color: C.textMid }}>
                          <strong>{app.product_name || 'Financial Product'}</strong><br/>
                          <span style={{ fontSize: '11px', color: C.textLight }}>{app.bank_name || 'Partner Bank'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: procMeta.bg, color: procMeta.color, border: `1px solid ${procMeta.border}` }}>
                            {procMeta.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: (app.status === 'approved' || app.status === 'commission_released' || app.status === 'commission_received') ? '#ECFDF5' : (app.status === 'rejected' || app.status === 'cancelled' ? '#FEF2F2' : '#EFF6FF'), color: (app.status === 'approved' || app.status === 'commission_released' || app.status === 'commission_received') ? '#059669' : (app.status === 'rejected' || app.status === 'cancelled' ? '#EF4444' : '#2563EB') }}>
                            {(app.status || 'PENDING').toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>₹{parseFloat(app.commission_amount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleViewApplicationTrace(app)}
                            style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            👁️ 360° Trace
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* TAB 6: ADMINS */}
      {activeTab === 'admins' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>System Administrators & Operations</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Designation</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminsList.map((admin, i) => (
                  <tr key={admin.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>{admin.fullName || admin.full_name}</td>
                    <td style={{ padding: '12px 16px', color: C.teal, fontWeight: 700 }}>{admin.role}</td>
                    <td style={{ padding: '12px 16px', color: C.textMid }}>{admin.designation || 'Operation Head'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: admin.status === 'active' ? '#ECFDF5' : '#FEF2F2', color: admin.status === 'active' ? '#059669' : '#EF4444' }}>
                        {(admin.status || 'active').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: FINANCIALS */}
      {activeTab === 'financials' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: '0 0 16px 0' }}>RazorpayX & Wallet Settlements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ background: C.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>RazorpayX Live Balance</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#3B82F6', marginTop: '4px' }}>
                {razorpayBalance !== null ? `₹${parseFloat(razorpayBalance).toLocaleString('en-IN')}` : '₹0.00'}
              </div>
            </div>
            <div style={{ background: C.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Total Commission Paid</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                ₹{parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: C.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>Pending Partner Withdrawals</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
                {stats.pendingWithdrawals} Requests
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER DETAILS MODAL ── */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>👤 Customer Detailed Record</h3>
                <span style={{ fontSize: '12px', color: C.textLight }}>{selectedCustomer.customer_name}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '20px', color: C.textLight, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Full Name</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedCustomer.customer_name}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Mobile Number</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedCustomer.mobile || 'N/A'}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Email Address</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedCustomer.email || 'N/A'}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>PAN Number</span>
                <strong style={{ fontSize: '13px', color: C.teal }}>{selectedCustomer.pan_number || 'N/A'}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>City / State</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedCustomer.city || 'N/A'} {selectedCustomer.state ? `, ${selectedCustomer.state}` : ''}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Monthly Income</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedCustomer.monthly_income ? `₹${parseFloat(selectedCustomer.monthly_income).toLocaleString('en-IN')}` : 'N/A'}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>📄 Customer Applications ({customerApps.length})</h4>
            {modalLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>Loading applications...</div>
            ) : customerApps.length === 0 ? (
              <div style={{ padding: '14px', background: C.bg, borderRadius: '10px', color: C.textLight, fontSize: '12px' }}>No active applications recorded for this customer.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customerApps.map(app => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.bg, borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal }}>{app.app_number}</span>
                      <div style={{ fontSize: '11px', color: C.textMid }}>{app.product_name} • {app.bank_name}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: app.status === 'approved' ? '#ECFDF5' : '#EFF6FF', color: app.status === 'approved' ? '#059669' : '#2563EB' }}>
                      {(app.status || 'SUBMITTED').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PARTNER 360 DETAILS MODAL ── */}
      {selectedPartner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto', background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>Partner 360 Master Record</h3>
                <span style={{ fontSize: '12px', color: C.teal, fontWeight: 800 }}>Code: {selectedPartner.partner_code}</span>
              </div>
              <button onClick={() => setSelectedPartner(null)} style={{ background: 'none', border: 'none', fontSize: '20px', color: C.textLight, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Partner Name</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedPartner.first_name} {selectedPartner.last_name || ''}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Email / Mobile</span>
                <strong style={{ fontSize: '12px', color: C.text }}>{selectedPartner.email}<br/>{selectedPartner.mobile}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Wallet Balance</span>
                <strong style={{ fontSize: '13px', color: '#10B981' }}>₹{parseFloat(selectedPartner.available_balance || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>👔 Team Members under Partner ({partnerTeam.length})</h4>
            {partnerTeam.length === 0 ? (
              <div style={{ padding: '10px 14px', background: C.bg, borderRadius: '10px', color: C.textLight, fontSize: '12px', marginBottom: '20px' }}>No sub-team members assigned.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {partnerTeam.map(tm => (
                  <div key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                    <span><strong>{tm.first_name} {tm.last_name || ''}</strong> ({tm.partner_code})</span>
                    <span style={{ color: C.purple, fontWeight: 700 }}>Rate: {tm.commission_rate || '100'}%</span>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>📄 Partner Applications ({partnerApps.length})</h4>
            {partnerApps.length === 0 ? (
              <div style={{ padding: '10px 14px', background: C.bg, borderRadius: '10px', color: C.textLight, fontSize: '12px' }}>No applications submitted yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {partnerApps.map(app => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: C.teal }}>{app.app_number}</span> — {app.customer_name} ({app.product_name})
                    </div>
                    <strong style={{ color: '#10B981' }}>₹{parseFloat(app.commission_amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TEAM MEMBER DETAILS MODAL ── */}
      {selectedTeamMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: C.card, borderRadius: '20px', padding: '24px', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>👔 Team Member Detailed View</h3>
                <span style={{ fontSize: '12px', color: C.teal }}>Code: {selectedTeamMember.partner_code}</span>
              </div>
              <button onClick={() => setSelectedTeamMember(null)} style={{ background: 'none', border: 'none', fontSize: '20px', color: C.textLight, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Member Name</span>
                <strong style={{ fontSize: '13px', color: C.text }}>{selectedTeamMember.first_name || selectedTeamMember.full_name} {selectedTeamMember.last_name || ''}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Mobile & Email</span>
                <strong style={{ fontSize: '12px', color: C.text }}>{selectedTeamMember.mobile}<br/>{selectedTeamMember.email}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Parent Sponsor Partner</span>
                <strong style={{ fontSize: '13px', color: C.teal }}>{selectedTeamMember.parent_partner_name || 'Direct Partner'}</strong>
              </div>
              <div style={{ background: C.bg, padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Assigned Commission Split</span>
                <strong style={{ fontSize: '13px', color: C.purple }}>{selectedTeamMember.commission_rate || '100'}%</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>📄 Applications by Team Member ({memberApps.length})</h4>
            {modalLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>Loading applications...</div>
            ) : memberApps.length === 0 ? (
              <div style={{ padding: '14px', background: C.bg, borderRadius: '10px', color: C.textLight, fontSize: '12px' }}>No applications logged under this team member.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {memberApps.map(app => (
                  <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: C.teal }}>{app.app_number}</span> — {app.customer_name} ({app.product_name})
                    </div>
                    <span style={{ fontWeight: 800, color: app.status === 'approved' ? '#059669' : '#2563EB' }}>{(app.status || 'SUBMITTED').toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPLICATION 360° TRACEABILITY MODAL ── */}

      {selectedAppTrace && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '900px', maxHeight: '92vh', overflowY: 'auto', background: C.card, borderRadius: '20px', padding: '28px', border: `1px solid ${C.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: 0 }}>⚡ Application 360° Traceability Record</h3>
                  <span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: getProcessMeta(selectedAppTrace.application?.application_process_type).bg, color: getProcessMeta(selectedAppTrace.application?.application_process_type).color }}>
                    {getProcessMeta(selectedAppTrace.application?.application_process_type).label}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: C.teal, fontWeight: 800, marginTop: '4px', display: 'block' }}>
                  App Number: {selectedAppTrace.application?.app_number} • ID: {selectedAppTrace.application?.application_id}
                </span>
              </div>
              <button onClick={() => setSelectedAppTrace(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', color: C.text, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Relational Mapping Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: C.bg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase' }}>👤 Customer Profile</span>
                <div style={{ fontWeight: 800, color: C.text, fontSize: '14px', marginTop: '4px' }}>{selectedAppTrace.application?.customer_name || 'N/A'}</div>
                <div style={{ fontSize: '12px', color: C.textMid }}>Mobile: {selectedAppTrace.application?.customer_mobile || 'N/A'}</div>
                <div style={{ fontSize: '11px', color: C.textLight }}>Email: {selectedAppTrace.application?.customer_email || 'N/A'}</div>
              </div>

              <div style={{ background: C.bg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase' }}>Partner & Channel</span>
                <div style={{ fontWeight: 800, color: C.purple, fontSize: '14px', marginTop: '4px' }}>{selectedAppTrace.application?.partner_code || 'DIRECT'}</div>
                <div style={{ fontSize: '12px', color: C.textMid }}>{selectedAppTrace.application?.partner_name || 'Direct Bank Flow'}</div>
                <div style={{ fontSize: '11px', color: C.textLight }}>Lead ID: {selectedAppTrace.application?.lead_id || 'N/A'}</div>
              </div>

              <div style={{ background: C.bg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 700, textTransform: 'uppercase' }}>🏦 Product & Bank URL</span>
                <div style={{ fontWeight: 800, color: C.text, fontSize: '14px', marginTop: '4px' }}>{selectedAppTrace.application?.product_name || 'Credit Product'}</div>
                <div style={{ fontSize: '12px', color: C.textMid }}>{selectedAppTrace.application?.bank_name || 'Bank'}</div>
                {selectedAppTrace.application?.partner_url ? (
                  <a href={selectedAppTrace.application.partner_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: C.teal, fontWeight: 800, display: 'inline-block', marginTop: '4px' }}>
                    🔗 Open Bank Partner URL ↗
                  </a>
                ) : (
                  <span style={{ fontSize: '11px', color: C.textLight, display: 'block', marginTop: '4px' }}>No direct URL configured</span>
                )}
              </div>
            </div>

            {/* Bank Operational Tracking */}
            <div style={{ background: C.bg, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: '0 0 10px 0', textTransform: 'uppercase' }}>🏦 Bank Processing & Operations Tracking</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px' }}>
                <div><span style={{ color: C.textLight, display: 'block', fontSize: '11px' }}>Bank Ref #</span><strong>{selectedAppTrace.application?.bank_ref_number || 'Not Generated'}</strong></div>
                <div><span style={{ color: C.textLight, display: 'block', fontSize: '11px' }}>Soft Approval</span><strong>{selectedAppTrace.application?.soft_approval_status || 'N/A'}</strong></div>
                <div><span style={{ color: C.textLight, display: 'block', fontSize: '11px' }}>VKYC Stage</span><strong>{selectedAppTrace.application?.vkyc_stage || 'N/A'}</strong></div>
                <div><span style={{ color: C.textLight, display: 'block', fontSize: '11px' }}>Dispatch Status</span><strong>{selectedAppTrace.application?.dispatch_status || 'N/A'}</strong></div>
              </div>
              {selectedAppTrace.application?.bank_remark && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: C.textMid }}>
                  <strong>Bank Remark:</strong> {selectedAppTrace.application.bank_remark}
                </div>
              )}
            </div>

            {/* Process Specific Detailed Section */}
            {selectedAppTrace.application?.application_process_type === 'physical_process' && selectedAppTrace.physical_details && (
              <div style={{ background: '#FFFBEB', padding: '14px', borderRadius: '12px', border: '1px solid #FDE68A', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', margin: '0 0 10px 0' }}>Physical Process Application Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                  <div><span style={{ color: '#B45309', display: 'block', fontSize: '11px' }}>Employer Company</span><strong>{selectedAppTrace.physical_details.company_name || 'N/A'}</strong></div>
                  <div><span style={{ color: '#B45309', display: 'block', fontSize: '11px' }}>Net Monthly Income</span><strong>₹{selectedAppTrace.physical_details.monthly_income ? parseFloat(selectedAppTrace.physical_details.monthly_income).toLocaleString('en-IN') : 'N/A'}</strong></div>
                  <div><span style={{ color: '#B45309', display: 'block', fontSize: '11px' }}>Courier / Docket #</span><strong>{selectedAppTrace.physical_details.courier_docket_number || 'N/A'}</strong></div>
                </div>
              </div>
            )}

            {selectedAppTrace.application?.application_process_type === 'linked_share' && (
              <div style={{ background: '#F5F3FF', padding: '14px', borderRadius: '12px', border: '1px solid #DDD6FE', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#6D28D9', margin: '0 0 10px 0' }}>🔗 Linked Share Process Details</h4>
                <div style={{ fontSize: '12px', color: '#5B21B6' }}>
                  <strong>Share Token:</strong> {selectedAppTrace.application?.share_token || 'N/A'} | 
                  <strong> SMS Log Count:</strong> {selectedAppTrace.sms_logs?.length || 0} dispatches
                </div>
              </div>
            )}

            {/* Timeline Audit Trail */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>⏱️ Application Status Audit Timeline ({selectedAppTrace.timeline?.length || 0})</h4>
            {selectedAppTrace.timeline?.length === 0 ? (
              <div style={{ padding: '12px', background: C.bg, borderRadius: '8px', fontSize: '12px', color: C.textLight, marginBottom: '20px' }}>No timeline audit events logged yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedAppTrace.timeline?.map((evt, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                    <div>
                      <strong style={{ color: C.teal }}>{evt.new_status ? evt.new_status.toUpperCase().replace('_',' ') : 'STATUS_CHANGED'}</strong>
                      {evt.previous_status && <span style={{ color: C.textLight }}> (from {evt.previous_status})</span>}
                      {evt.remarks && <div style={{ fontSize: '11px', color: C.textMid }}>{evt.remarks}</div>}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: C.textLight }}>
                      {evt.performed_by_name || 'System'}<br/>
                      {new Date(evt.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Wallet & Financial Ledger */}
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>💰 Wallet Ledger & Commission Entries ({selectedAppTrace.wallet_ledger?.length || 0})</h4>
            {selectedAppTrace.wallet_ledger?.length === 0 ? (
              <div style={{ padding: '12px', background: C.bg, borderRadius: '8px', fontSize: '12px', color: C.textLight }}>No wallet transactions logged for this application yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedAppTrace.wallet_ledger?.map((w, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px', fontSize: '12px' }}>
                    <div>
                      <strong style={{ color: '#10B981' }}>₹{parseFloat(w.amount || 0).toLocaleString('en-IN')}</strong> — {w.transaction_type} ({w.status})
                    </div>
                    <span style={{ fontSize: '11px', color: C.textLight }}>{new Date(w.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

