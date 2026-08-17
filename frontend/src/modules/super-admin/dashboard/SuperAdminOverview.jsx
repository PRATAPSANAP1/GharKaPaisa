import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';
import { Icons } from '../../../components/Icon/PartnerIcons';

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
  const [refreshing, setRefreshing] = useState(false);

  // Modal Detailed View States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [customerApps, setCustomerApps] = useState([]);
  const [partnerApps, setPartnerApps] = useState([]);
  const [partnerTeam, setPartnerTeam] = useState([]);
  const [memberApps, setMemberApps] = useState([]);

  const fetchMasterData = async () => {
    setRefreshing(true);
    try {
      const [overviewRes, customersRes, partnersRes, teamRes, appsRes, adminsRes, walletBalRes] = await Promise.allSettled([
        api.get('/reports/overview'),
        api.get('/reports/customers'),
        api.get('/reports/export-partners'),
        api.get('/team/members'),
        api.get('/applications', { params: { limit: 50 } }),
        api.get('/superadmin/admins'),
        api.get('/wallet/balance')
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.success) {
        setOverviewData(overviewRes.value.data.data);
      }

      if (customersRes.status === 'fulfilled' && customersRes.value.data?.success) {
        setCustomersList(customersRes.value.data.data || []);
      }

      if (partnersRes.status === 'fulfilled' && partnersRes.value.data?.success) {
        setPartnersList(partnersRes.value.data.data?.partners || []);
      }

      if (teamRes.status === 'fulfilled' && teamRes.value.data?.success) {
        setTeamList(teamRes.value.data.data?.members || teamRes.value.data.data || []);
      }

      if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
        setApplicationsList(appsRes.value.data.data?.applications || appsRes.value.data.data || []);
      }

      if (adminsRes.status === 'fulfilled' && adminsRes.value.data?.success) {
        setAdminsList(adminsRes.value.data.data || []);
      }

      if (walletBalRes.status === 'fulfilled' && walletBalRes.value.data?.success) {
        setRazorpayBalance(walletBalRes.value.data.data?.razorpay_balance);
      }
    } catch (err) {
      console.error('Error fetching master overview data:', err);
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

  // Metrics summary
  const stats = {
    customers: parseInt(overviewData?.customers?.total_customers ?? customersList.length ?? 0, 10),
    partners: parseInt(overviewData?.Partners?.total ?? partnersList.length ?? 0, 10),
    activePartners: parseInt(overviewData?.Partners?.active ?? partnersList.filter(p => (p.account_status || p.status) === 'active').length ?? 0, 10),
    pendingKycPartners: parseInt(overviewData?.Partners?.pending_kyc ?? overviewData?.partners?.pending_kyc ?? partnersList.filter(p => (p.kyc_status || 'pending') === 'pending').length ?? 0, 10),
    teamMembers: teamList.length || 0,

    totalApps: parseInt(overviewData?.leads?.total_leads ?? overviewData?.applications?.total ?? 0, 10),
    approvedApps: parseInt(overviewData?.leads?.approved_leads ?? overviewData?.applications?.approved ?? 0, 10),
    pendingApps: parseInt(overviewData?.leads?.pending_leads ?? overviewData?.applications?.pending ?? 0, 10),
    rejectedApps: parseInt(overviewData?.leads?.rejected_leads ?? overviewData?.applications?.rejected ?? 0, 10),

    admins: parseInt(overviewData?.admins?.total_admins ?? adminsList.length ?? 0, 10),
    activeAdmins: parseInt(overviewData?.admins?.active_admins ?? adminsList.filter(a => a.status === 'active' || a.isActive).length ?? 0, 10),

    totalCommissionPaid: parseFloat(overviewData?.withdrawal?.total_commission_paid ?? 0),
    pendingWithdrawals: parseInt(overviewData?.withdrawal?.pending_withdrawals ?? 0, 10),

    banks: parseInt(overviewData?.banks?.total_banks ?? 0, 10),
    products: parseInt(overviewData?.products?.total_products ?? 0, 10),
  };

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
              { label: 'Total Admins', value: stats.admins, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', icon: '🛡️', action: () => setActiveTab('admins') },
              { label: 'Active Admins', value: stats.activeAdmins, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', icon: '⚡', action: () => setActiveTab('admins') },
              { label: 'Pending KYC', value: stats.pendingKycPartners, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)', icon: '⏳', action: () => navigate('/super-admin/partners?kyc_status=pending') },
              { label: 'Total Leads', value: stats.totalApps, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', icon: '📄', action: () => navigate('/super-admin/leads') },
              { label: 'Pending Leads', value: stats.pendingApps, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', icon: '🕒', action: () => navigate('/super-admin/leads?status=pending') },
              { label: 'Approved Leads', value: stats.approvedApps, color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.3)', icon: '✅', action: () => navigate('/super-admin/leads?status=approved') },
              { label: 'Rejected Leads', value: stats.rejectedApps, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', icon: '❌', action: () => navigate('/super-admin/leads?status=rejected') },
              { label: 'Commission Paid', value: `₹${parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}`, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', icon: '💰', action: () => setActiveTab('financials') },
              { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', icon: '💳', action: () => navigate('/super-admin/wallet?tab=withdrawals') },
              { label: 'Total Banks', value: stats.banks, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', icon: '🏦', action: () => navigate('/super-admin/banks') },
              { label: 'Total Products', value: stats.products, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', icon: '📦', action: () => navigate('/super-admin/products') },
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
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Applications Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Approved Leads</span>
                  <strong style={{ color: '#10B981' }}>{stats.approvedApps}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Pending Leads</span>
                  <strong style={{ color: '#F59E0B' }}>{stats.pendingApps}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '8px' }}>
                  <span>Rejected Leads</span>
                  <strong style={{ color: '#EF4444' }}>{stats.rejectedApps}</strong>
                </div>
              </div>
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
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>All Applications Tracking</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>Real-time status monitoring, bank approvals, and document verifications.</p>
            </div>
            <button onClick={() => navigate('/super-admin/crm')} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
              Open Applications CRM →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>App Number</th>
                  <th style={{ padding: '12px 16px' }}>Customer / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {applicationsList.map((app, i) => (
                  <tr key={app.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.teal }}>{app.app_number || app.lead_number || 'APP-REF'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>
                      {app.customer_name || 'Customer'}<br/>
                      <span style={{ fontSize: '11px', color: C.textLight }}>{app.customer_mobile || app.mobile}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: C.textMid }}>{app.product_name || 'Credit Card / Loan'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: (app.status === 'approved' || app.status === 'disbursed') ? '#ECFDF5' : (app.status === 'rejected' ? '#FEF2F2' : '#EFF6FF'), color: (app.status === 'approved' || app.status === 'disbursed') ? '#059669' : (app.status === 'rejected' ? '#EF4444' : '#2563EB') }}>
                        {(app.status || 'UNDER_REVIEW').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>₹{parseFloat(app.commission_amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
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
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>🤝 Partner 360 Master Record</h3>
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

    </div>
  );
}
