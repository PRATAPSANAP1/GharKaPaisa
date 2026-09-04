import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaCoins, FaMoneyBillWave, FaClock, FaUsers, FaCalculator, FaFileDownload, 
  FaFilter, FaSearch, FaChevronDown, FaChevronRight, FaEye, FaCheckCircle, 
  FaTimesCircle, FaHourglassHalf, FaPauseCircle, FaTrophy, FaBuilding, 
  FaCreditCard, FaSitemap, FaRedo, FaInfoCircle, FaRegCheckCircle, FaEdit,
  FaCalendarAlt, FaChartLine, FaUserTie, FaUserShield, FaPhoneAlt, FaClipboardList
} from 'react-icons/fa';
import api from '../../../services/api';
import SuperAdminIncentiveHistory from '../../employee-management/SuperAdminIncentiveHistory';

export default function ManageEmployeeIncentives() {
  const { C } = useTheme();

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tab View Switcher State
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'analytics'

  // State Management
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpi: {},
    trend: [],
    by_role: [],
    by_status: [],
    top_employees: [],
    by_product: [],
    recent_payouts: [],
    hierarchy: [],
    table: { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } }
  });

  // Filters State
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [tlFilter, setTlFilter] = useState('');
  const [page, setPage] = useState(1);
  const [trendFreq, setTrendFreq] = useState('Daily');

  // Hierarchy expand state
  const [expandedManagers, setExpandedManagers] = useState({});
  const [expandedTLs, setExpandedTLs] = useState({});

  // Modal State
  const [selectedIncentive, setSelectedIncentive] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Quick Action / View Tab State
  const [activeSection, setActiveSection] = useState('ALL'); // 'ALL', 'ANALYTICS', 'LEADERBOARD', 'HIERARCHY', 'TABLE'

  // Fetch Incentives Overview Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        role: roleFilter || undefined,
        product_id: productFilter || undefined,
        bank_id: bankFilter || undefined,
        status: statusFilter || undefined,
        manager_id: managerFilter || undefined,
        team_leader_id: tlFilter || undefined,
        search: search || undefined
      };
      const res = await api.get('/employees/incentives/overview', { params });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load employee incentives data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Options for Filters
  const [productsList, setProductsList] = useState([]);
  const [banksList, setBanksList] = useState([]);

  useEffect(() => {
    // Fetch Products & Banks for Filter Dropdowns
    const fetchOptions = async () => {
      try {
        const [prodRes, bankRes] = await Promise.allSettled([
          api.get('/products'),
          api.get('/banks/active')
        ]);
        if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) {
          setProductsList(prodRes.value.data.data);
        }
        if (bankRes.status === 'fulfilled' && bankRes.value.data?.data) {
          setBanksList(bankRes.value.data.data);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [datePreset, startDate, endDate, roleFilter, productFilter, bankFilter, statusFilter, managerFilter, tlFilter, page, search]);

  // Handle Date Presets
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === 'TODAY') {
      const dateStr = today.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === 'LAST_7') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'LAST_30') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Status Change Handler
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedIncentive || !updateStatus) return;
    setUpdating(true);
    try {
      const res = await api.post(`/employees/incentives/${selectedIncentive.incentive_id}/update-status`, {
        status: updateStatus,
        payment_reference: paymentRef,
        hold_reason: holdReason
      });
      if (res.data?.success) {
        alert(`Incentive ${selectedIncentive.incentive_id.slice(0, 8)} status updated to ${updateStatus}`);
        setSelectedIncentive(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const tableData = data.table?.data || [];
    if (!tableData.length) {
      alert('No data available to export');
      return;
    }
    const headers = ['Incentive ID', 'Employee', 'Emp ID', 'Role', 'Product', 'Bank', 'App ID', 'Earned', 'Paid', 'Pending', 'Status', 'Date'];
    const rows = tableData.map(row => [
      row.incentive_id,
      `"${row.employee_name || ''}"`,
      row.emp_code || '',
      row.role || '',
      `"${row.product_name || ''}"`,
      `"${row.bank_name || ''}"`,
      row.app_number || '',
      row.incentive_earned || 0,
      row.incentive_paid || 0,
      row.pending_amount || 0,
      row.status || '',
      row.created_at ? new Date(row.created_at).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Employee_Incentives_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format Currency
  const formatINR = (amt) => {
    const val = parseFloat(amt || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Status Badge Helper
  const renderStatusBadge = (st) => {
    const s = (st || 'PENDING').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') {
      return <span style={{ background: '#10B98120', color: '#10B981', border: '1px solid #10B98140', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>PAID</span>;
    } else if (s === 'PENDING') {
      return <span style={{ background: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>PENDING</span>;
    } else if (s === 'IN_REVIEW') {
      return <span style={{ background: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>IN REVIEW</span>;
    } else if (s === 'ON_HOLD' || s === 'HELD') {
      return <span style={{ background: '#8B5CF620', color: '#8B5CF6', border: '1px solid #8B5CF640', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>ON HOLD</span>;
    } else {
      return <span style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444440', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>REJECTED</span>;
    }
  };

  const kpi = data.kpi || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── 1. HEADER & CONTROLS ── */}
      <div style={{
        background: C.card,
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCoins color={C.teal} size={24} /> Employee Incentives & Historical Audit
            </h1>
            <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
              Manage and audit employee historical incentives, department targets, performance bonuses, and payouts
            </p>
          </div>

          {/* View Switcher Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: C.bgSecondary, padding: '4px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 16px', borderRadius: '9px', border: 'none',
                background: activeTab === 'history' ? C.teal : 'transparent',
                color: activeTab === 'history' ? '#FFF' : C.textMid,
                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              <FaCalendarAlt /> Historical Incentive Audit
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '8px 16px', borderRadius: '9px', border: 'none',
                background: activeTab === 'analytics' ? C.teal : 'transparent',
                color: activeTab === 'analytics' ? '#FFF' : C.textMid,
                fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              <FaChartLine /> Live Analytics & Ledger
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'history' ? (
        <SuperAdminIncentiveHistory />
      ) : (
        <>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={fetchData}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary,
                color: C.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <FaRedo size={12} /> Refresh
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                borderRadius: '8px', border: `1px solid ${C.teal}`, background: `${C.teal}15`,
                color: C.teal, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
              }}
            >
              <FaFileDownload size={14} /> Export CSV
            </button>
          </div>

          {/* Filters Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          paddingTop: '12px',
          borderTop: `1px solid ${C.border}`
        }}>
          {/* Date Preset */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>DATE RANGE</label>
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7">Last 7 Days</option>
              <option value="LAST_30">Last 30 Days</option>
              <option value="THIS_MONTH">This Month</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>EMPLOYEE ROLE</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="">All Roles</option>
              <option value="TC">Telecaller (TC)</option>
              <option value="TL">Team Leader (TL)</option>
              <option value="MANAGER">Manager</option>
              <option value="SENIOR MANAGER">Senior Manager</option>
              <option value="BRANCH HEAD">Branch Head</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>PRODUCT</label>
            <select
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="">All Products</option>
              {productsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Bank Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>BANK</label>
            <select
              value={bankFilter}
              onChange={(e) => { setBankFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="">All Banks</option>
              {banksList.map(b => (
                <option key={b.id} value={b.id}>{b.name || b.bank_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>INCENTIVE STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 700 }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Payout</option>
              <option value="PAID">Paid / Completed</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Search Bar */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block', marginBottom: '4px' }}>SEARCH EMPLOYEE / APP</label>
            <div style={{ position: 'relative' }}>
              <FaSearch size={12} color={C.textLight} style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search Employee, ID, Application No..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 600 }}
            </div>
          </div>
        </div>

      {/* ── 2. FINANCIAL KPI CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* Total Earned */}
        <div style={{ background: C.card, padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>TOTAL INCENTIVES EARNED</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaCoins size={16} />
            </div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, color: C.text }}>{formatINR(kpi.total_earned)}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>Total generated by employees</span>
        </div>

        {/* Total Paid */}
        <div style={{ background: C.card, padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>TOTAL INCENTIVES PAID</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10B98115', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaMoneyBillWave size={16} />
            </div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#10B981' }}>{formatINR(kpi.total_paid)}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>Amount settled to accounts</span>
        </div>

        {/* Pending Payouts */}
        <div style={{ background: C.card, padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>PENDING PAYOUTS</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F59E0B15', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaClock size={16} />
            </div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#F59E0B' }}>{formatINR(kpi.pending_payouts)}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>Generated but not yet paid</span>
        </div>

        {/* Employees Earned */}
        <div style={{ background: C.card, padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>EMPLOYEES EARNED</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3B82F615', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUsers size={16} />
            </div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, color: C.text }}>{kpi.employees_earned || 0}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>Employees with active incentives</span>
        </div>

        {/* Avg Incentive / Employee */}
        <div style={{ background: C.card, padding: '16px', borderRadius: '14px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>AVG INCENTIVE / EMP</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaCalculator size={16} />
            </div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#8B5CF6' }}>{formatINR(kpi.avg_incentive_per_employee)}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>Average payout per earner</span>
        </div>
      </div>

      {/* ── 3. ANALYTICS ROW: TREND, ROLES, STATUS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* Incentive Trend Overview */}
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaChartLine color={C.teal} /> Incentive Trend Overview
            </h3>
            <div style={{ display: 'flex', gap: '4px', background: C.bgSecondary, padding: '3px', borderRadius: '8px' }}>
              {['Daily', 'Weekly', 'Monthly'].map(f => (
                <button
                  key={f}
                  onClick={() => setTrendFreq(f)}
                  style={{
                    padding: '3px 8px', borderRadius: '6px', border: 'none',
                    background: trendFreq === f ? C.card : 'transparent',
                    color: trendFreq === f ? C.teal : C.textLight,
                    fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Visual Trend Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            {(data.trend || []).slice(0, 6).map((t, idx) => {
              const maxVal = Math.max(...data.trend.map(x => parseFloat(x.earned || 0)), 1);
              const earnedWidth = `${Math.min(100, Math.round((parseFloat(t.earned || 0) / maxVal) * 100))}%`;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700, color: C.text }}>
                    <span>{t.date}</span>
                    <span>Earned: {formatINR(t.earned)} | Paid: {formatINR(t.paid)}</span>
                  </div>
                  <div style={{ height: '8px', background: C.bgSecondary, borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: earnedWidth, background: C.teal, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
            {(!data.trend || data.trend.length === 0) && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: C.textLight }}>
                No trend data available for selected range
              </div>
            )}
          </div>
        </div>

        {/* Incentives by Role */}
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaUsers color={C.teal} /> Incentives by Role
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data.by_role || []).map((r, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: C.bgSecondary, borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'block' }}>{r.role}</span>
                  <span style={{ fontSize: '11px', color: C.textLight }}>{r.count || 0} Earners</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: C.teal, display: 'block' }}>{formatINR(r.earned)}</span>
                  <span style={{ fontSize: '11px', color: '#10B981' }}>Paid: {formatINR(r.paid)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incentives by Status */}
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter color={C.teal} /> Incentives by Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data.by_status || []).map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderStatusBadge(s.status)}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>({s.count} txns)</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: C.text }}>{formatINR(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 4. PERFORMANCE ROW: TOP EMPLOYEES & INCENTIVES BY PRODUCT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        
        {/* 🏆 Top Earning Employees Leaderboard */}
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTrophy color="#F59E0B" /> Top Earning Employees
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textLight }}>
                  <th style={{ padding: '8px' }}>Rank</th>
                  <th style={{ padding: '8px' }}>Employee</th>
                  <th style={{ padding: '8px' }}>Role</th>
                  <th style={{ padding: '8px' }}>Apps</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Earned</th>
                </tr>
              </thead>
              <tbody>
                {(data.top_employees || []).map((emp, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '8px', fontWeight: 800, color: idx === 0 ? '#F59E0B' : idx === 1 ? '#9CA3AF' : idx === 2 ? '#B45309' : C.text }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ fontWeight: 800, color: C.text, display: 'block' }}>{emp.full_name}</span>
                      <span style={{ fontSize: '10.5px', color: C.textLight }}>{emp.emp_code}</span>
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: C.textLight }}>{emp.role}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: C.text }}>{emp.applications}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 900, color: C.teal }}>{formatINR(emp.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🏦 Incentives by Product */}
        <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBuilding color="#3B82F6" /> Incentives by Product
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(data.by_product || []).map((p, idx) => (
              <div key={idx} style={{ padding: '12px', background: C.bgSecondary, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'block' }}>{p.product_name}</span>
                  <span style={{ fontSize: '11px', color: C.textLight }}>{p.bank_name || 'GharKaPaisa Direct'} • {p.applications} Apps</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: C.teal, display: 'block' }}>{formatINR(p.earned)}</span>
                  <span style={{ fontSize: '11px', color: '#F59E0B' }}>Pending: {formatINR(p.pending)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 5. HIERARCHY-BASED DRILLDOWN VIEW ── */}
      <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaSitemap color={C.teal} /> Hierarchy-Based Incentive View (Manager ➔ TL ➔ Telecaller)
        </h3>
        <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>
          Drill down hierarchy teams to monitor cumulative earnings generated across levels
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {(data.hierarchy || []).map(mgr => (
            <div key={mgr.id || 'mgr'} style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div
                onClick={() => setExpandedManagers(prev => ({ ...prev, [mgr.id]: !prev[mgr.id] }))}
                style={{
                  padding: '12px 16px', background: C.bgSecondary, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {expandedManagers[mgr.id] ? <FaChevronDown size={12} color={C.teal} /> : <FaChevronRight size={12} color={C.textLight} />}
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.text, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaUserTie color={C.teal} /> MANAGER: {mgr.name} ({mgr.code})
                    </span>
                    <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>{mgr.team_leaders?.length || 0} Team Leaders • {mgr.total_apps} Apps</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: C.teal, display: 'block' }}>{formatINR(mgr.total_incentives)}</span>
                  <span style={{ fontSize: '11px', color: '#10B981' }}>Paid: {formatINR(mgr.paid_incentives)}</span>
                </div>
              </div>

              {expandedManagers[mgr.id] && (
                <div style={{ padding: '12px 16px 12px 32px', display: 'flex', flexDirection: 'column', gap: '8px', background: C.card }}>
                  {(mgr.team_leaders || []).map(tl => (
                    <div key={tl.id || 'tl'} style={{ border: `1px dashed ${C.border}`, borderRadius: '10px', padding: '10px 14px' }}>
                      <div
                        onClick={() => setExpandedTLs(prev => ({ ...prev, [tl.id]: !prev[tl.id] }))}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {expandedTLs[tl.id] ? <FaChevronDown size={11} color={C.teal} /> : <FaChevronRight size={11} color={C.textLight} />}
                          <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FaUserShield color={C.teal} /> TL: {tl.name} ({tl.code})
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: C.teal }}>{formatINR(tl.total_incentives)}</span>
                      </div>

                      {expandedTLs[tl.id] && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '18px' }}>
                          {(tl.telecallers || []).map(tc => (
                            <div key={tc.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', background: C.bgSecondary, borderRadius: '6px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <FaPhoneAlt style={{ fontSize: '10px', color: C.teal }} /> {tc.name} ({tc.code}) - {tc.designation}
                              </span>
                              <span style={{ fontWeight: 800, color: C.teal }}>{formatINR(tc.total_incentives)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. MAIN INCENTIVES DETAILS TABLE ── */}
      <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaClipboardList color={C.teal} /> Incentive Details — Master Audit Table
          </h3>
          <span style={{ fontSize: '12px', color: C.textLight, fontWeight: 700 }}>
            Showing {data.table?.data?.length || 0} of {data.table?.pagination?.total || 0} records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: C.bgSecondary, borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.textLight }}>
                <th style={{ padding: '10px 12px' }}>Incentive ID</th>
                <th style={{ padding: '10px 12px' }}>Employee</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px' }}>Product</th>
                <th style={{ padding: '10px 12px' }}>Bank</th>
                <th style={{ padding: '10px 12px' }}>App ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Earned</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Paid</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(data.table?.data || []).map((row, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: C.teal }}>
                    INC-{row.incentive_id?.slice(0, 6).toUpperCase()}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontWeight: 800, color: C.text, display: 'block' }}>{row.employee_name}</span>
                    <span style={{ fontSize: '10.5px', color: C.textLight }}>{row.emp_code}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: C.textMid }}>{row.role}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: C.text }}>{row.product_name || 'N/A'}</td>
                  <td style={{ padding: '10px 12px', color: C.textLight }}>{row.bank_name || 'GharKaPaisa'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: C.text }}>{row.app_number || 'N/A'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: C.text }}>{formatINR(row.incentive_earned)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10B981' }}>{formatINR(row.incentive_paid)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{renderStatusBadge(row.status)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      onClick={() => { setSelectedIncentive(row); setUpdateStatus(row.status || 'PAID'); setPaymentRef(row.payment_reference || ''); setHoldReason(row.hold_reason || ''); }}
                      style={{
                        padding: '5px 10px', borderRadius: '6px', border: `1px solid ${C.teal}`,
                        background: `${C.teal}10`, color: C.teal, fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      <FaEye size={10} style={{ marginRight: '4px' }} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {(!data.table?.data || data.table.data.length === 0) && (
                <tr>
                  <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
                    No incentive records found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.table?.pagination?.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700, cursor: page > 1 ? 'pointer' : 'not-allowed' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.textLight }}>
              Page {page} of {data.table.pagination.totalPages}
            </span>
            <button
              disabled={page >= data.table.pagination.totalPages}
              onClick={() => setPage(page + 1)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700, cursor: page < data.table.pagination.totalPages ? 'pointer' : 'not-allowed' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── 7. INCENTIVE DETAILS & PAYOUT STATUS MODAL ── */}
      {selectedIncentive && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`,
            maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>
                  🔍 Incentive Details Modal
                </h3>
                <span style={{ fontSize: '12px', color: C.teal, fontWeight: 700 }}>
                  ID: INC-{selectedIncentive.incentive_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncentive(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: C.textLight, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Employee & Application Context */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: C.bgSecondary, padding: '14px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block' }}>EMPLOYEE INFORMATION</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'block', marginTop: '2px' }}>{selectedIncentive.employee_name}</span>
                <span style={{ fontSize: '11.5px', color: C.textLight }}>Code: {selectedIncentive.emp_code}</span>
                <span style={{ fontSize: '11.5px', color: C.teal, display: 'block', fontWeight: 700 }}>Role: {selectedIncentive.role}</span>
                {selectedIncentive.manager_name && <span style={{ fontSize: '11px', color: C.textLight, display: 'block' }}>Manager: {selectedIncentive.manager_name}</span>}
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.textLight, display: 'block' }}>APPLICATION DETAILS</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text, display: 'block', marginTop: '2px' }}>App No: {selectedIncentive.app_number || 'N/A'}</span>
                <span style={{ fontSize: '11.5px', color: C.textLight }}>Customer: {selectedIncentive.customer_name || 'Direct Apply'}</span>
                <span style={{ fontSize: '11.5px', color: C.text, display: 'block', fontWeight: 700 }}>{selectedIncentive.product_name} ({selectedIncentive.bank_name || 'GharKaPaisa'})</span>
              </div>
            </div>

            {/* Incentive Calculation Breakdown */}
            <div style={{ border: `1px solid ${C.border}`, padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>🧮 INCENTIVE CALCULATION BREAKDOWN</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: C.text }}>
                <span>Base Incentive Rate</span>
                <span>{formatINR(selectedIncentive.incentive_earned)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: C.text }}>
                <span>Role Multiplier / Bonus</span>
                <span>₹0</span>
              </div>
              <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, color: C.teal }}>
                <span>Total Incentive Earned</span>
                <span>{formatINR(selectedIncentive.incentive_earned)}</span>
              </div>
            </div>

            {/* Payout & Status Form */}
            <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.textLight }}>💳 UPDATE PAYOUT & STATUS</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Payout Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 700 }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID / COMPLETED</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Payment Reference / UTR</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR98218391823"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              </div>

              {updateStatus === 'ON_HOLD' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '4px' }}>Hold Reason</label>
                  <input
                    type="text"
                    placeholder="Reason for holding incentive..."
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedIncentive(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: C.teal, color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {updating ? 'Saving...' : 'Save & Update Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
