import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  FaCoins, FaMoneyBillWave, FaClock, FaUsers, FaFileDownload, 
  FaFilter, FaSearch, FaChevronDown, FaChevronRight, FaEye, FaCheckCircle, 
  FaTimesCircle, FaHourglassHalf, FaPauseCircle, FaTrophy, FaBuilding, 
  FaSitemap, FaRedo, FaInfoCircle, FaEdit, FaCalendarAlt, 
  FaChartLine, FaUserTie, FaUserShield, FaPhoneAlt, FaClipboardList, FaCheck
} from 'react-icons/fa';
import api from '../../../services/api';
import SuperAdminIncentiveHistory from '../../employee-management/SuperAdminIncentiveHistory';

export default function ManageEmployeeIncentives() {
  const { C } = useTheme();

  // Responsive state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, EMPLOYEES, PAYOUTS, RULES, PRODUCTS, REPORTS, AUDIT, HISTORICAL

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

  // Collapsible Filters Modal & States
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [datePreset, setDatePreset] = useState('THIS_MONTH');
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

  // Breakdown toggle state (By Role vs By Status)
  const [breakdownView, setBreakdownView] = useState('ROLE');

  // Modal State
  const [selectedIncentive, setSelectedIncentive] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Payout Batch Selection State
  const [selectedIncentiveIds, setSelectedIncentiveIds] = useState([]);

  // Fetch Overview Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
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
      } catch (e) {
        console.error(e);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [datePreset, startDate, endDate, roleFilter, productFilter, bankFilter, statusFilter, managerFilter, tlFilter, page, search]);

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
        alert(`Incentive status updated to ${updateStatus}`);
        setSelectedIncentive(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickRelease = async (row) => {
    const isAlreadyPaid = ['RELEASE', 'RELEASED', 'PAID', 'COMPLETED'].includes((row.status || '').toUpperCase());
    if (isAlreadyPaid) {
      alert('This incentive has already been released and paid to the employee.');
      return;
    }
    if (!window.confirm(`Are you sure you want to RELEASE and CREDIT incentive ${formatINR(row.incentive_earned)} to ${row.employee_name} (${row.emp_code})?`)) return;
    try {
      const refNo = `REL-${Date.now().toString(36).toUpperCase()}`;
      const res = await api.post(`/employees/incentives/${row.incentive_id}/update-status`, {
        status: 'RELEASE',
        payment_reference: refNo,
        payment_method: 'BANK_TRANSFER'
      });
      if (res.data?.success) {
        alert(`SUCCESS: Incentive ${formatINR(row.incentive_earned)} released and credited to ${row.employee_name}! Transaction Ref: ${refNo}`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to release incentive');
    }
  };

  const handleQuickHold = async (row) => {
    const reason = window.prompt(`Enter Hold Reason for ${row.employee_name} (${row.emp_code}):`, row.hold_reason || 'App file generated pending / Target audit');
    if (reason === null) return;
    try {
      const res = await api.post(`/employees/incentives/${row.incentive_id}/update-status`, {
        status: 'HOLD',
        hold_reason: reason
      });
      if (res.data?.success) {
        alert(`Incentive placed on HOLD for ${row.employee_name}.`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hold incentive');
    }
  };



  const handleBulkRelease = async () => {
    if (selectedIncentiveIds.length === 0) {
      alert('Please select at least one incentive transaction to release.');
      return;
    }
    if (!window.confirm(`Are you sure you want to BULK RELEASE ${selectedIncentiveIds.length} payout(s)?`)) return;
    try {
      const refNo = `BATCH-${Date.now().toString(36).toUpperCase()}`;
      const res = await api.post('/employees/incentives/bulk-update-status', {
        incentive_ids: selectedIncentiveIds,
        status: 'RELEASE',
        payment_reference: refNo,
        payment_method: 'BANK_TRANSFER'
      });
      if (res.data?.success) {
        alert(`SUCCESS: ${res.data.message}`);
        setSelectedIncentiveIds([]);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to bulk release payouts');
    }
  };

  // Helper formatting
  const formatINR = (amt) => {
    const val = parseFloat(amt || 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const APPROVED_APP_STATUSES = new Set([
    'approved',
    'super_admin_approved',
    'sanctioned',
    'disbursed',
    'commission_released',
    'commission_received',
    'released'
  ]);

  const isApprovedApplicationStatus = (appStatus) => {
    const s = String(appStatus || '').toLowerCase().trim();
    return APPROVED_APP_STATUSES.has(s);
  };

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase().trim();
    if (s === 'RELEASE' || s === 'RELEASED' || s === 'PAID' || s === 'COMPLETED') return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', fontWeight: 800, fontSize: '11px' }}>RELEASE</span>;
    if (s === 'PENDING') return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30', fontWeight: 800, fontSize: '11px' }}>PENDING</span>;
    if (s === 'HOLD' || s === 'ON_HOLD' || s === 'HELD' || s.includes('HELD')) return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630', fontWeight: 800, fontSize: '11px' }}>HOLD</span>;
    if (s === 'REJECTED' || s === 'CANCELLED') return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', fontWeight: 800, fontSize: '11px' }}>REJECTED</span>;
    return <span style={{ padding: '4px 10px', borderRadius: '12px', background: C.bgSecondary, color: C.textMid, fontWeight: 800, fontSize: '11px' }}>{s}</span>;
  };

  const kpi = data.kpi || {};
  const totalEarned = parseFloat(kpi.total_earned || 0);
  const totalPaid = parseFloat(kpi.total_paid || 0);
  const pendingPayouts = parseFloat(kpi.pending_payouts || 0);
  const activeEarners = parseInt(kpi.employees_earned || 0);
  const avgPerEmp = parseFloat(kpi.avg_incentive_per_employee || 0);

  const handleExportAuditCSV = () => {
    const auditList = (data.table?.data || []).filter(row =>
      !row.application_status || ['approved', 'super_admin_approved', 'disbursed', 'sanctioned', 'commission_released', 'commission_received'].includes(String(row.application_status).toLowerCase())
    );
    if (!auditList.length) {
      alert('No records available to export.');
      return;
    }
    const headers = ['Incentive ID', 'Employee Name', 'Employee Code', 'Role', 'Product', 'App ID', 'Customer Name', 'Customer Mobile', 'Earned', 'Paid', 'Status', 'Payment Ref'];
    const rows = auditList.map(r => [
      r.incentive_id,
      `"${r.employee_name || ''}"`,
      `"${r.emp_code || ''}"`,
      `"${r.role || ''}"`,
      `"${r.product_name || ''}"`,
      `"${r.app_number || ''}"`,
      `"${r.customer_name || ''}"`,
      `"${r.customer_mobile || ''}"`,
      r.incentive_earned || 0,
      r.incentive_paid || 0,
      r.status || '',
      `"${r.payment_reference || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Employee_Incentive_Audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navTabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: FaChartLine },
    { id: 'EMPLOYEES', label: 'Employees', icon: FaUsers },
    { id: 'PAYOUTS', label: 'Payout Management & Releases', icon: FaMoneyBillWave },
    { id: 'RELEASED', label: 'Released Incentives', icon: FaCheckCircle },
    { id: 'AUDIT', label: 'Historical Audit', icon: FaUserShield },
    { id: 'HISTORICAL', label: 'Monthly Audit Archive', icon: FaCalendarAlt }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCoins color={C.teal} size={24} /> Employee Incentive Management
          </h1>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '4px 0 0 0' }}>
            Track employee performance incentives, card bonus targets, and payout releases
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchData}
            style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FaRedo size={12} color={C.teal} /> Refresh
          </button>
        </div>
      </div>

      {/* ── 2. NEW MAIN NAVIGATION BAR ── */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto', padding: '6px',
        background: C.card, borderRadius: '14px', border: `1px solid ${C.border}`,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        {navTabs.map(t => {
          const IconComp = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '9px 16px', borderRadius: '10px', border: 'none',
                background: isActive ? C.teal : 'transparent',
                color: isActive ? '#ffffff' : C.textMid,
                fontWeight: isActive ? 900 : 700,
                fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <IconComp size={14} color={isActive ? '#ffffff' : C.teal} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── 4. COLLAPSED SEARCH & FILTER HEADER ── */}
      {activeTab !== 'HISTORICAL' && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
          background: C.card, padding: '14px 18px', borderRadius: '14px', border: `1px solid ${C.border}`
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textMid }} size={13} />
            <input
              type="text"
              placeholder="Search employee, application ID or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px',
                border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text,
                fontSize: '12.5px', fontWeight: 600, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Date Presets */}
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7">Last 7 Days</option>
              <option value="LAST_30">Last 30 Days</option>
              <option value="ALL">All Time</option>
            </select>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              style={{
                padding: '9px 16px', borderRadius: '10px', border: `1px solid ${showFiltersModal ? C.teal : C.border}`,
                background: showFiltersModal ? `${C.teal}15` : C.bgSecondary,
                color: showFiltersModal ? C.teal : C.text, fontSize: '12.5px', fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <FaFilter size={12} color={C.teal} /> Filters <FaChevronDown size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Filter Dropdown Popover */}
      {showFiltersModal && (
        <div style={{
          background: C.card, padding: '20px', borderRadius: '16px', border: `1px solid ${C.teal}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '14px'
        }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '4px' }}>ROLE</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700 }}
            >
              <option value="">All Roles</option>
              <option value="TC">Telecaller (TC)</option>
              <option value="TL">Team Leader (TL)</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '4px' }}>PRODUCT</label>
            <select
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700 }}
            >
              <option value="">All Products</option>
              {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '4px' }}>BANK</label>
            <select
              value={bankFilter}
              onChange={(e) => { setBankFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700 }}
            >
              <option value="">All Banks</option>
              {banksList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, display: 'block', marginBottom: '4px' }}>STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700 }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="HOLD">Hold</option>
              <option value="RELEASE">Released</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={() => { setRoleFilter(''); setProductFilter(''); setBankFilter(''); setStatusFilter(''); setSearch(''); setShowFiltersModal(false); }}
              style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
            <button
              onClick={() => setShowFiltersModal(false)}
              style={{ padding: '6px 18px', borderRadius: '8px', border: 'none', background: C.teal, color: '#fff', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: C.textMid, background: C.card, borderRadius: '20px', border: `1px solid ${C.border}` }}>
          Loading employee incentive overview...
        </div>
      ) : (
        <>
          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* 3. 5 Compact KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '14px' }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Earned</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, marginTop: '4px' }}>{formatINR(totalEarned)}</div>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800, marginTop: '4px', display: 'block' }}>↑ 12% vs last month</span>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Paid</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>{formatINR(totalPaid)}</div>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, marginTop: '4px', display: 'block' }}>Released payouts</span>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Pending</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>{formatINR(pendingPayouts)}</div>
                  <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, marginTop: '4px', display: 'block' }}>Awaiting release</span>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Active Earners</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: C.teal, marginTop: '4px' }}>{activeEarners}</div>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, marginTop: '4px', display: 'block' }}>Qualified employees</span>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Avg / Employee</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#8B5CF6', marginTop: '4px' }}>{formatINR(avgPerEmp)}</div>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, marginTop: '4px', display: 'block' }}>Per active earner</span>
                </div>
              </div>

              {/* Grid Section: Trend Chart & Performance Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '16px' }}>
                {/* 5. Compact Incentive Trend */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>Incentive Trend</h3>
                    <div style={{ display: 'flex', gap: '4px', background: C.bgSecondary, padding: '3px', borderRadius: '8px' }}>
                      {['Daily', 'Weekly', 'Monthly'].map(f => (
                        <button key={f} onClick={() => setTrendFreq(f)} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: trendFreq === f ? C.teal : 'transparent', color: trendFreq === f ? '#fff' : C.textMid, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 800 }}>
                    <span style={{ color: C.teal }}>━━ Earned</span>
                    <span style={{ color: '#10B981' }}>━━ Paid</span>
                  </div>
                  {/* Timeline representation */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px', paddingTop: '10px' }}>
                    {(data.trend || []).slice(0, 10).map((t, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '100%', height: `${Math.min(100, (parseFloat(t.earned || 0) / 1000))}px`, background: `${C.teal}50`, borderRadius: '4px 4px 0 0' }} />
                        <span style={{ fontSize: '9.5px', color: C.textMid }}>{t.date?.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Combined Performance Breakdown (By Role / By Status) */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>Performance Breakdown</h3>
                    <div style={{ display: 'flex', gap: '4px', background: C.bgSecondary, padding: '3px', borderRadius: '8px' }}>
                      <button onClick={() => setBreakdownView('ROLE')} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: breakdownView === 'ROLE' ? C.teal : 'transparent', color: breakdownView === 'ROLE' ? '#fff' : C.textMid, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>By Role</button>
                      <button onClick={() => setBreakdownView('STATUS')} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: breakdownView === 'STATUS' ? C.teal : 'transparent', color: breakdownView === 'STATUS' ? '#fff' : C.textMid, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>By Status</button>
                    </div>
                  </div>

                  {breakdownView === 'ROLE' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(data.by_role || []).map((r, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800 }}>
                            <span style={{ color: C.text }}>{r.role}</span>
                            <span style={{ color: C.teal }}>{formatINR(r.earned)}</span>
                          </div>
                          <div style={{ height: '6px', background: C.bgSecondary, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (parseFloat(r.earned || 0) / (totalEarned || 1)) * 100)}%`, background: C.teal, borderRadius: '4px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(data.by_status || []).map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 10px', background: C.bgSecondary, borderRadius: '8px' }}>
                          <span style={{ fontWeight: 800, color: C.text }}>{s.status}</span>
                          <span style={{ fontWeight: 900, color: C.teal }}>{formatINR(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Top 5 Employees & Recent Activity */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '16px' }}>
                {/* 7. Top 5 Employees */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>Top Performing Employees</h3>
                    <button onClick={() => setActiveTab('EMPLOYEES')} style={{ background: 'none', border: 'none', color: C.teal, fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}>View All →</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: C.textMid, fontWeight: 800, borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: '6px' }}>#</th>
                        <th style={{ padding: '6px' }}>Employee</th>
                        <th style={{ padding: '6px' }}>Role</th>
                        <th style={{ padding: '6px', textAlign: 'center' }}>Apps</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.top_employees || []).slice(0, 5).map((emp, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '8px 6px', fontWeight: 900, color: C.teal }}>#{idx + 1}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 800, color: C.text }}>{emp.full_name}</td>
                          <td style={{ padding: '8px 6px', color: C.textMid }}>{emp.role}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>{emp.approved || emp.applications || 0}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 900, color: '#10B981' }}>{formatINR(emp.earned)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recent Incentive Activity */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: 0 }}>Recent Incentive Activity</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(data.recent_payouts || []).slice(0, 4).map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.bgSecondary, borderRadius: '10px' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: C.text, display: 'block' }}>{p.employee_name} ({p.emp_code})</span>
                          <span style={{ fontSize: '11px', color: C.textMid }}>{p.product_name} • {formatINR(p.amount)}</span>
                        </div>
                        {renderStatusBadge(p.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── TAB 2: EMPLOYEES ── */}
          {activeTab === 'EMPLOYEES' && (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0 }}>Employee-Wise Incentive Performance</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, color: C.textMid, fontWeight: 800, borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ padding: '10px 14px' }}>Employee</th>
                    <th style={{ padding: '10px 14px' }}>Role</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Applications</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Earned</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Paid</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.top_employees || []).map((emp, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 800, color: C.text, display: 'block' }}>{emp.full_name}</span>
                        <span style={{ fontSize: '11px', color: C.teal }}>{emp.emp_code}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: C.textMid }}>{emp.role}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800 }}>{emp.applications}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: C.text }}>{formatINR(emp.earned)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#10B981' }}>{formatINR(emp.paid)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#F59E0B' }}>{formatINR(emp.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB 3: PAYOUTS (Pending & Held Incentives) ── */}
          {activeTab === 'PAYOUTS' && (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0 }}>Payout Management & Releases</h3>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: C.teal }}>
                    {formatINR((data.table?.data || []).filter(r => 
                      ['PENDING', 'HOLD', 'ON_HOLD', 'HELD', 'HELD_APPFILE_PENDING', 'HELD_TARGET_PENDING'].includes((r.status || '').toUpperCase()) &&
                      (!r.application_id || isApprovedApplicationStatus(r.application_status))
                    ).reduce((s, r) => s + parseFloat(r.incentive_earned || 0), 0))} Pending / Held Release
                  </span>
                </div>
                {selectedIncentiveIds.length > 0 && (
                  <button
                    onClick={handleBulkRelease}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#10B981', color: '#fff', fontSize: '12.5px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FaCheckCircle size={13} /> Release Selected ({selectedIncentiveIds.length})
                  </button>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, color: C.textMid, fontWeight: 800, borderBottom: `2px solid ${C.border}`, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px', width: '40px' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const pendingList = (data.table?.data || []).filter(r => 
                              ['PENDING', 'HOLD', 'ON_HOLD', 'HELD', 'HELD_APPFILE_PENDING', 'HELD_TARGET_PENDING'].includes((r.status || '').toUpperCase()) &&
                              (!r.application_id || isApprovedApplicationStatus(r.application_status))
                            );
                            if (e.target.checked) {
                              setSelectedIncentiveIds(pendingList.map(r => r.incentive_id));
                            } else {
                              setSelectedIncentiveIds([]);
                            }
                          }}
                          checked={selectedIncentiveIds.length > 0 && selectedIncentiveIds.length === (data.table?.data || []).filter(r => 
                            ['PENDING', 'HOLD', 'ON_HOLD', 'HELD', 'HELD_APPFILE_PENDING', 'HELD_TARGET_PENDING'].includes((r.status || '').toUpperCase()) &&
                            (!r.application_id || isApprovedApplicationStatus(r.application_status))
                          ).length}
                        />
                      </th>
                      <th style={{ padding: '10px 12px' }}>Application</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Employee</th>
                      <th style={{ padding: '10px 12px' }}>Process Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Commission</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const list = (data.table?.data || []).filter(r => 
                        ['PENDING', 'HOLD', 'ON_HOLD', 'HELD', 'HELD_APPFILE_PENDING', 'HELD_TARGET_PENDING', 'IN_REVIEW'].includes((r.status || '').toUpperCase()) &&
                        (!r.application_id || isApprovedApplicationStatus(r.application_status))
                      );
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: C.textMid, fontWeight: 700 }}>
                              No pending or held incentive payouts awaiting release.
                            </td>
                          </tr>
                        );
                      }
                      return list.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="checkbox"
                              checked={selectedIncentiveIds.includes(row.incentive_id)}
                              onChange={() => {
                                setSelectedIncentiveIds(prev => 
                                  prev.includes(row.incentive_id) ? prev.filter(id => id !== row.incentive_id) : [...prev, row.incentive_id]
                                );
                              }}
                            />
                          </td>
                          {/* 1. Application & Product */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 900, color: C.teal, fontFamily: 'monospace', fontSize: '12.5px' }}>
                              {row.app_number ? `#${row.app_number.replace(/^#/, '')}` : `#INC-${row.incentive_id?.slice(0, 8)}`}
                            </div>
                            <div style={{ color: C.text, fontSize: '11.5px', fontWeight: 600 }}>
                              {row.product_name || 'Credit Card Application'}
                            </div>
                          </td>

                          {/* 2. Customer */}
                          <td style={{ padding: '10px 12px', color: C.text }}>
                            <div style={{ fontWeight: 700 }}>{row.customer_name || 'N/A'}</div>
                            <div style={{ fontSize: '10.5px', color: C.textMid }}>{row.customer_mobile || 'N/A'}</div>
                          </td>

                          {/* 3. Employee */}
                          <td style={{ padding: '10px 12px', color: C.text }}>
                            <div style={{ fontWeight: 700 }}>{row.employee_name || 'Employee Member'}</div>
                            <span style={{ fontSize: '10.5px', color: C.teal, fontWeight: 800 }}>{row.emp_code || 'N/A'}</span>
                          </td>

                          {/* 4. Process Type */}
                          <td style={{ padding: '10px 12px', color: C.textMid, fontWeight: 700 }}>
                            <span style={{ background: C.bgSecondary, color: C.text, padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                              {row.process_type || 'lead punching'}
                            </span>
                          </td>

                          {/* 5. Commission */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#10B981', fontSize: '13.5px' }}>
                            {formatINR(row.incentive_earned)}
                          </td>

                          {/* 6. Status */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {renderStatusBadge(row.status)}
                          </td>

                          {/* 7. Action */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => { setSelectedTransaction(row); setShowDetailsModal(true); }}
                                style={{ background: C.bgSecondary, color: C.teal, border: `1px solid ${C.teal}`, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleQuickHold(row)}
                                style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                [ HOLD ]
                              </button>
                              <button
                                onClick={() => handleQuickRelease(row)}
                                style={{ background: '#10B981', border: 'none', color: '#FFF', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                [ RELEASE ]
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: RELEASED INCENTIVES ── */}
          {activeTab === 'RELEASED' && (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCheckCircle color="#10B981" size={18} /> Released Employee Incentives
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>
                    {formatINR((data.table?.data || []).filter(r => 
                      ['RELEASE', 'RELEASED', 'PAID', 'COMPLETED'].includes((r.status || '').toUpperCase())
                    ).reduce((s, r) => s + parseFloat(r.incentive_earned || 0), 0))} Released & Credited
                  </span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, color: C.textMid, fontWeight: 800, borderBottom: `2px solid ${C.border}`, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Application</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Employee</th>
                      <th style={{ padding: '10px 12px' }}>Process Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Commission</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const releasedList = (data.table?.data || []).filter(r => 
                        ['RELEASE', 'RELEASED', 'PAID', 'COMPLETED'].includes((r.status || '').toUpperCase())
                      );
                      if (releasedList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: C.textMid, fontWeight: 700 }}>
                              No released employee incentive records found.
                            </td>
                          </tr>
                        );
                      }
                      return releasedList.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                          {/* 1. Application & Product */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 900, color: C.teal, fontFamily: 'monospace', fontSize: '12.5px' }}>
                              {row.app_number ? `#${row.app_number.replace(/^#/, '')}` : `#INC-${row.incentive_id?.slice(0, 8)}`}
                            </div>
                            <div style={{ color: C.text, fontSize: '11.5px', fontWeight: 600 }}>
                              {row.product_name || 'Credit Card Application'}
                            </div>
                          </td>

                          {/* 2. Customer */}
                          <td style={{ padding: '10px 12px', color: C.text }}>
                            <div style={{ fontWeight: 700 }}>{row.customer_name || 'N/A'}</div>
                            <div style={{ fontSize: '10.5px', color: C.textMid }}>{row.customer_mobile || 'N/A'}</div>
                          </td>

                          {/* 3. Employee */}
                          <td style={{ padding: '10px 12px', color: C.text }}>
                            <div style={{ fontWeight: 700 }}>{row.employee_name || 'Employee Member'}</div>
                            <span style={{ fontSize: '10.5px', color: C.teal, fontWeight: 800 }}>{row.emp_code || 'N/A'}</span>
                          </td>

                          {/* 4. Process Type */}
                          <td style={{ padding: '10px 12px', color: C.textMid, fontWeight: 700 }}>
                            <span style={{ background: C.bgSecondary, color: C.text, padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                              {row.process_type || 'lead punching'}
                            </span>
                          </td>

                          {/* 5. Commission */}
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#10B981', fontSize: '13.5px' }}>
                            {formatINR(row.incentive_earned)}
                          </td>

                          {/* 6. Status */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '10px', fontWeight: 800, fontSize: '10.5px' }}>
                              released
                            </span>
                          </td>

                          {/* 7. Action */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => { setSelectedTransaction(row); setShowDetailsModal(true); }}
                                style={{ background: '#ECFDF5', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '11px', cursor: 'pointer', border: 'none' }}
                              >
                                View Details
                              </button>
                              {(row.payment_reference || row.incentive_id) && (
                                <span style={{ fontSize: '10px', color: C.textMid, fontFamily: 'monospace', fontWeight: 700 }}>
                                  TXN: {row.payment_reference || `REL-${row.incentive_id?.slice(0, 8)}`}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AUDIT (Historical Transaction Audit Table) ── */}
          {activeTab === 'AUDIT' && (
            <div style={{ background: C.card, borderRadius: '18px', border: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: 0 }}>Employee Incentive Audit — Transaction Records</h3>
                  <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0' }}>Approved applications transaction audit</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={handleExportAuditCSV}
                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: C.teal, color: '#fff', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FaFileDownload size={13} /> Export CSV
                  </button>
                  <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>
                    {data.table?.pagination?.total || 0} Total Records
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: C.bgSecondary, borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.textMid }}>
                      <th style={{ padding: '10px 12px' }}>Incentive ID</th>
                      <th style={{ padding: '10px 12px' }}>Employee</th>
                      <th style={{ padding: '10px 12px' }}>Role</th>
                      <th style={{ padding: '10px 12px' }}>Product</th>
                      <th style={{ padding: '10px 12px' }}>App ID</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Earned</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Paid</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const auditList = (data.table?.data || []).filter(row =>
                        !row.application_status || ['approved', 'super_admin_approved', 'disbursed', 'sanctioned', 'commission_released', 'commission_received'].includes(String(row.application_status).toLowerCase())
                      );
                      if (auditList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: C.textMid, fontWeight: 700 }}>
                              No incentive audit records found for approved applications.
                            </td>
                          </tr>
                        );
                      }
                      return auditList.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: C.teal }}>INC-{row.incentive_id?.slice(0, 6)}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontWeight: 800, color: C.text, display: 'block' }}>{row.employee_name}</span>
                            <span style={{ fontSize: '10.5px', color: C.textMid }}>{row.emp_code}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: C.textMid }}>{row.role}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: C.text }}>{row.product_name}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: C.text }}>{row.app_number || 'N/A'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: C.text }}>{formatINR(row.incentive_earned)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10B981' }}>{formatINR(row.incentive_paid)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{renderStatusBadge(row.status)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button onClick={() => handleQuickRelease(row)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #10B981', background: '#10B98115', color: '#10B981', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Release</button>
                              <button onClick={() => handleQuickHold(row)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #8B5CF6', background: '#8B5CF615', color: '#8B5CF6', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Hold</button>
                              <button onClick={() => { setSelectedIncentive(row); setUpdateStatus(row.status || 'PAID'); setPaymentRef(row.payment_reference || ''); setHoldReason(row.hold_reason || ''); }} style={{ padding: '4px 8px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}><FaEye size={10} /></button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.table?.pagination?.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700, cursor: page > 1 ? 'pointer' : 'not-allowed' }}>Previous</button>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMid }}>Page {page} of {data.table.pagination.totalPages}</span>
                  <button disabled={page >= data.table.pagination.totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700, cursor: page < data.table.pagination.totalPages ? 'pointer' : 'not-allowed' }}>Next</button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 8: HISTORICAL MONTHLY AUDIT ARCHIVE ── */}
          {activeTab === 'HISTORICAL' && (
            <SuperAdminIncentiveHistory />
          )}
        </>
      )}

      {/* ── UPDATE PAYOUT MODAL ── */}
      {selectedIncentive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: C.card, borderRadius: '20px', border: `1px solid ${C.border}`, maxWidth: '560px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0 }}>Incentive Payout Update</h3>
              <button onClick={() => setSelectedIncentive(null)} style={{ background: 'none', border: 'none', fontSize: '18px', color: C.textMid, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: C.bgSecondary, padding: '12px', borderRadius: '10px', fontSize: '12px' }}>
              <div><span style={{ color: C.textMid }}>Employee:</span> <strong style={{ color: C.text, display: 'block' }}>{selectedIncentive.employee_name} ({selectedIncentive.emp_code})</strong></div>
              <div><span style={{ color: C.textMid }}>Incentive Amount:</span> <strong style={{ color: C.teal, display: 'block' }}>{formatINR(selectedIncentive.incentive_earned)}</strong></div>
            </div>
            <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Payout Status</label>
                <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '12.5px', fontWeight: 700 }}>
                  <option value="PENDING">PENDING</option>
                  <option value="HOLD">HOLD</option>
                  <option value="RELEASE">RELEASE</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Payment UTR / Reference</label>
                <input type="text" placeholder="e.g. UTR98218391823" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '12.5px', fontWeight: 600 }} />
              </div>
              {updateStatus === 'HOLD' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, display: 'block', marginBottom: '4px' }}>Hold Reason</label>
                  <input type="text" placeholder="Reason for holding payout..." value={holdReason} onChange={(e) => setHoldReason(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: '12.5px', fontWeight: 600 }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setSelectedIncentive(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={updating} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: C.teal, color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>{updating ? 'Updating...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Transaction Details Modal ── */}
      {showDetailsModal && selectedTransaction && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: C.card, borderRadius: '20px', padding: '24px', maxWidth: '520px', width: '90%', border: `1px solid ${C.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaEye color={C.teal} /> Transaction Details
              </h3>
              <button onClick={() => setShowDetailsModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: C.textMid, cursor: 'pointer', fontWeight: 900 }}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', background: C.bgSecondary, padding: '16px', borderRadius: '12px' }}>
              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Application ID</span>
                <div style={{ color: C.teal, fontWeight: 900, fontFamily: 'monospace', marginTop: '2px' }}>
                  {selectedTransaction.app_number ? `#${selectedTransaction.app_number.replace(/^#/, '')}` : `#INC-${selectedTransaction.incentive_id?.slice(0, 8)}`}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Employee Code</span>
                <div style={{ color: C.text, fontWeight: 800, marginTop: '2px' }}>
                  {selectedTransaction.employee_name || 'N/A'} ({selectedTransaction.emp_code || 'N/A'})
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Process Type</span>
                <div style={{ color: C.text, fontWeight: 800, marginTop: '2px' }}>
                  {selectedTransaction.process_type || 'lead punching'}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Commission Amount</span>
                <div style={{ color: '#10B981', fontWeight: 900, fontSize: '15px', marginTop: '2px' }}>
                  {formatINR(selectedTransaction.incentive_earned)}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Incentive Status</span>
                <div style={{ marginTop: '2px' }}>
                  {renderStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Payment Reference</span>
                <div style={{ color: C.text, fontWeight: 800, fontFamily: 'monospace', marginTop: '2px' }}>
                  {selectedTransaction.payment_reference || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Customer Name</span>
                <div style={{ color: C.text, fontWeight: 800, marginTop: '2px' }}>
                  {selectedTransaction.customer_name || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Customer Phone</span>
                <div style={{ color: C.text, fontWeight: 800, marginTop: '2px' }}>
                  {selectedTransaction.customer_mobile || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Product Name</span>
                <div style={{ color: C.text, fontWeight: 800, marginTop: '2px' }}>
                  {selectedTransaction.product_name || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ color: C.textMid, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Application Status</span>
                <div style={{ color: C.teal, fontWeight: 800, marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedTransaction.application_status || 'Approved'}
                </div>
              </div>

              {selectedTransaction.hold_reason && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Hold Reason</span>
                  <div style={{ color: C.text, fontWeight: 700, marginTop: '2px', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                    {selectedTransaction.hold_reason}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowDetailsModal(false)} style={{ padding: '8px 20px', background: C.teal, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
