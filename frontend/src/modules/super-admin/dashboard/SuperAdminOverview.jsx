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

  // Active Tab: 'overview' | 'customers' | 'partners' | 'applications' | 'admins' | 'financials'
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [customersList, setCustomersList] = useState([]);
  const [partnersList, setPartnersList] = useState([]);
  const [applicationsList, setApplicationsList] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [razorpayBalance, setRazorpayBalance] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMasterData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch High Level Reports & Stats
      const [overviewRes, customersRes, partnersRes, appsRes, adminsRes, walletBalRes] = await Promise.allSettled([
        api.get('/reports/overview'),
        api.get('/reports/customers'),
        api.get('/reports/export-partners'),
        api.get('/applications', { params: { limit: 10 } }),
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

  // Compute Totals & Fallback metrics
  const stats = {
    customers: overviewData?.customers?.total_customers ?? customersList.length ?? 0,
    partners: overviewData?.Partners?.total ?? partnersList.length ?? 0,
    activePartners: overviewData?.Partners?.active ?? partnersList.filter(p => (p.account_status || p.status) === 'active').length ?? 0,
    pendingKycPartners: overviewData?.Partners?.pending_kyc ?? partnersList.filter(p => (p.kyc_status || 'pending') === 'pending').length ?? 0,
    
    totalApps: overviewData?.applications?.total ?? overviewData?.leads?.total_leads ?? 0,
    approvedApps: overviewData?.applications?.approved ?? overviewData?.leads?.approved_leads ?? 0,
    pendingApps: overviewData?.applications?.pending ?? overviewData?.leads?.pending_leads ?? 0,
    rejectedApps: overviewData?.applications?.rejected ?? overviewData?.leads?.rejected_leads ?? 0,
    conversionRate: overviewData?.applications?.conversion_rate ?? 0,

    admins: overviewData?.admins?.total_admins ?? adminsList.length ?? 0,
    activeAdmins: overviewData?.admins?.active_admins ?? adminsList.filter(a => a.status === 'active').length ?? 0,

    totalCommissionPaid: overviewData?.withdrawal?.total_commission_paid ?? 0,
    pendingWithdrawals: overviewData?.withdrawal?.pending_withdrawals ?? 0,
    totalEarnedWallet: overviewData?.wallet?.total_earned ?? 0,
    availableWalletBalance: overviewData?.wallet?.total_available ?? 0,

    banks: overviewData?.banks?.total_banks ?? 0,
    products: overviewData?.products?.total_products ?? 0,
  };

  // Top Metric Cards Row (Customers, Partners, Applications, Admins, Transactions)
  const topMetricsRow = [
    {
      id: 'customers',
      label: 'Total Customers',
      value: stats.customers.toLocaleString('en-IN'),
      subtext: 'Registered & Active Users',
      icon: <Icons.profile size={22} />,
      color: '#3B82F6', // Blue
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.25)',
      link: '/super-admin/reports'
    },
    {
      id: 'partners',
      label: 'Partners & Network',
      value: stats.partners.toLocaleString('en-IN'),
      subtext: `${stats.activePartners} Active • ${stats.pendingKycPartners} Pending KYC`,
      icon: <Icons.profile size={22} />,
      color: '#10B981', // Emerald Green
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      link: '/super-admin/partners'
    },
    {
      id: 'applications',
      label: 'Total Applications',
      value: stats.totalApps.toLocaleString('en-IN'),
      subtext: `${stats.approvedApps} Approved (${stats.conversionRate}% Rate)`,
      icon: <Icons.trending size={22} />,
      color: '#8B5CF6', // Purple
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.25)',
      link: '/super-admin/crm'
    },
    {
      id: 'admins',
      label: 'System Admins & Staff',
      value: stats.admins.toLocaleString('en-IN'),
      subtext: `${stats.activeAdmins} Active Administrators`,
      icon: <Icons.profile size={22} />,
      color: '#F59E0B', // Amber
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      link: '/super-admin/dashboard'
    },
    {
      id: 'transactions',
      label: 'Transactions & Payouts',
      value: `₹${parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}`,
      subtext: `Pending Payouts: ${stats.pendingWithdrawals}`,
      icon: <Icons.wallet size={22} />,
      color: '#EC4899', // Pink
      bg: 'rgba(236, 72, 153, 0.1)',
      border: 'rgba(236, 72, 153, 0.25)',
      link: '/super-admin/wallet'
    },
    {
      id: 'catalog',
      label: 'Banks & Products',
      value: `${stats.banks} / ${stats.products}`,
      subtext: `${stats.banks} Banks • ${stats.products} Products`,
      icon: <Icons.creditCard size={22} />,
      color: '#06B6D4', // Cyan
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.25)',
      link: '/super-admin/banks'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── HEADER TITLE & REFRESH ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0, letterSpacing: '-0.5px' }}>
              Master System Overview
            </h1>
            <span style={{ background: `${C.teal}20`, color: C.teal, fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
              Super Admin Control Center
            </span>
          </div>
          <p style={{ fontSize: '14px', color: C.textLight, margin: '4px 0 0 0' }}>
            Unified real-time dashboard displaying customers, partners, applications, admins, transactions & platform performance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}>🔄</span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
          </button>
        </div>
      </div>

      {/* ── TOP METRICS ROW (Single Row Display: Customers, Partners, Applications, Admins, Transactions, Catalog) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
        gap: '12px'
      }}>
        {topMetricsRow.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.link)}
            style={{
              background: C.card,
              borderRadius: '14px',
              border: `1px solid ${card.border}`,
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${card.color}25`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {card.icon}
              </div>
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
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: C.textLight, marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.subtext}
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
          { id: 'overview', label: '📊 System Overview & Analytics', icon: <Icons.trending size={16} /> },
          { id: 'customers', label: `👥 Customers (${stats.customers})`, icon: <Icons.profile size={16} /> },
          { id: 'partners', label: `🤝 Partners (${stats.partners})`, icon: <Icons.profile size={16} /> },
          { id: 'applications', label: `📄 Applications (${stats.totalApps})`, icon: <Icons.trending size={16} /> },
          { id: 'admins', label: `🛡️ Admins (${stats.admins})`, icon: <Icons.profile size={16} /> },
          { id: 'financials', label: '💳 Financials & Payouts', icon: <Icons.wallet size={16} /> }
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
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: SYSTEM OVERVIEW & ANALYTICS                                       */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Platform Status & Shortcuts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            
            {/* Card 1: Application Breakdown */}
            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Application Status</h3>
                <button onClick={() => navigate('/super-admin/crm')} style={{ background: 'none', border: 'none', color: C.teal, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                  Manage →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Approved Applications</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#10B981' }}>{stats.approvedApps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Under Review / Pending</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#F59E0B' }}>{stats.pendingApps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Rejected / Declined</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#EF4444' }}>{stats.rejectedApps}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Partner Network Status */}
            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Partner Network</h3>
                <button onClick={() => navigate('/super-admin/partners')} style={{ background: 'none', border: 'none', color: C.teal, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                  View All →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Total Registered Partners</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: C.text }}>{stats.partners}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Active Active Partners</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#10B981' }}>{stats.activePartners}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Pending KYC Approval</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#F97316' }}>{stats.pendingKycPartners}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Financial & Wallet Summary */}
            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Financial Overview</h3>
                <button onClick={() => navigate('/super-admin/wallet')} style={{ background: 'none', border: 'none', color: C.teal, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                  Wallet Hub →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Total Commission Paid</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#10B981' }}>₹{parseFloat(stats.totalCommissionPaid).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>RazorpayX Payout Balance</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#3B82F6' }}>
                    {razorpayBalance !== null ? `₹${parseFloat(razorpayBalance).toLocaleString('en-IN')}` : '₹0.00'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: `${C.bg}`, borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>Pending Withdrawal Requests</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#F59E0B' }}>{stats.pendingWithdrawals}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Partners Feed & Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '16px' }}>
            
            {/* Recent Partners List */}
            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0 }}>Recent Registered Partners</h3>
                <button onClick={() => navigate('/super-admin/partners')} style={{ background: 'none', border: 'none', color: C.teal, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                  View All Partners
                </button>
              </div>

              {overviewData?.recent_partners?.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: C.textLight }}>No partners found</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(overviewData?.recent_partners || partnersList.slice(0, 5)).map((p, i) => (
                    <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: C.bg }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: C.text, display: 'block' }}>
                          {p.first_name || p.partner_name || 'Partner'} {p.last_name || ''}
                        </span>
                        <span style={{ fontSize: '11px', color: C.textLight }}>
                          Code: {p.partner_code} • {p.email || p.mobile}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: (p.status === 'active' || p.account_status === 'active') ? '#ECFDF5' : '#FFF7ED', color: (p.status === 'active' || p.account_status === 'active') ? '#059669' : '#EA580C' }}>
                        {(p.status || p.account_status || 'Active').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Master System Shortcuts */}
            <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Master Control Shortcuts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: '👥 Manage Customers & Leads', path: '/super-admin/leads' },
                  { label: '🤝 Partner Directory & KYC', path: '/super-admin/partners' },
                  { label: '📄 All Applications Tracking', path: '/super-admin/crm' },
                  { label: '🛡️ Manage System Admins', path: '/super-admin/dashboard' },
                  { label: '💳 Wallet & Razorpay Payouts', path: '/super-admin/wallet' },
                  { label: '🏦 Banks & Products Setup', path: '/super-admin/banks' },
                  { label: '📜 Platform Audit Logs', path: '/super-admin/audit' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      color: C.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CUSTOMERS OVERVIEW                                                */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'customers' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Registered Customers Overview</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>All customers who have applied for loans or credit cards across the platform.</p>
            </div>

            <input
              type="text"
              placeholder="Search customer name, mobile, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                background: C.bg,
                color: C.text,
                fontSize: '13px',
                width: '280px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px' }}>Customer Name</th>
                  <th style={{ padding: '12px 16px' }}>Mobile Number</th>
                  <th style={{ padding: '12px 16px' }}>Email</th>
                  <th style={{ padding: '12px 16px' }}>Total Applications</th>
                  <th style={{ padding: '12px 16px' }}>Approved Cards</th>
                  <th style={{ padding: '12px 16px' }}>Total Commission</th>
                </tr>
              </thead>
              <tbody>
                {customersList
                  .filter(c => !searchQuery || (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.mobile || '').includes(searchQuery))
                  .slice(0, 15)
                  .map((cust, i) => (
                    <tr key={cust.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>{cust.customer_name || 'Customer'}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{cust.mobile || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{cust.email || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>{cust.total_applications || 0}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10B981' }}>{cust.approved_cards || 0}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: C.teal }}>₹{parseFloat(cust.total_commission || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PARTNERS OVERVIEW                                                 */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'partners' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Partner Directory & Network</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>Manage referral partner accounts, KYC approvals, and team structures.</p>
            </div>

            <button
              onClick={() => navigate('/super-admin/partners')}
              style={{
                background: C.teal,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Open Partner Management Panel →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px' }}>Partner Code</th>
                  <th style={{ padding: '12px 16px' }}>Full Name</th>
                  <th style={{ padding: '12px 16px' }}>Email / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>KYC Status</th>
                  <th style={{ padding: '12px 16px' }}>Account Status</th>
                  <th style={{ padding: '12px 16px' }}>Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {partnersList.slice(0, 15).map((p, i) => (
                  <tr key={p.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.teal }}>{p.partner_code}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>{p.first_name} {p.last_name}</td>
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
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>₹{parseFloat(p.available_balance || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: APPLICATIONS & LEADS                                             */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>All Applications Tracking</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>Real-time status monitoring, bank approvals, and document verifications.</p>
            </div>

            <button
              onClick={() => navigate('/super-admin/crm')}
              style={{
                background: C.teal,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Open Full Applications CRM →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px' }}>App Number</th>
                  <th style={{ padding: '12px 16px' }}>Customer / Mobile</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {applicationsList.slice(0, 10).map((app, i) => (
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

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: SYSTEM ADMINS & STAFF                                            */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admins' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>System Administrators & Operations Team</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>Provision administrator credentials and manage assigned bank permissions.</p>
            </div>

            <button
              onClick={() => navigate('/super-admin/dashboard')}
              style={{
                background: C.teal,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Open Admin Management Directory →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textLight, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Emp ID / Role</th>
                  <th style={{ padding: '12px 16px' }}>Designation</th>
                  <th style={{ padding: '12px 16px' }}>Assigned Banks</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminsList.map((admin, i) => (
                  <tr key={admin.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: C.text }}>{admin.fullName || admin.full_name}</td>
                    <td style={{ padding: '12px 16px', color: C.teal, fontWeight: 700 }}>{admin.employeeId || 'EMP-101'}<br/><span style={{ fontSize: '10px', color: C.textLight }}>{admin.role}</span></td>
                    <td style={{ padding: '12px 16px', color: C.textMid }}>{admin.designation || 'Operation Head'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: C.text }}>🏦 {admin.assigned_banks?.length || 0} Banks</td>
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

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: FINANCIALS & PAYOUTS                                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financials' && (
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>RazorpayX & Wallet Settlements</h3>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>Real-time Razorpay balance monitoring and partner payout executions.</p>
            </div>

            <button
              onClick={() => navigate('/super-admin/wallet')}
              style={{
                background: C.teal,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Open RazorpayX Wallet Hub →
            </button>
          </div>

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

    </div>
  );
}
