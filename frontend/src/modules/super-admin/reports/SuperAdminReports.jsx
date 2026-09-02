import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme } from "../../../contexts/ThemeContext";
import { 
  FaUsers, FaFileAlt, FaCheckCircle, FaChartLine, FaCoins, FaFilter, 
  FaDownload, FaCalendarAlt, FaCreditCard, FaShieldAlt, FaUniversity,
  FaSearch, FaTimes, FaUserTie, FaChevronRight, FaTrophy, FaSyncAlt,
  FaFileCsv, FaFileExcel, FaFilePdf, FaExclamationTriangle, FaEye
} from "react-icons/fa";

export default function SuperAdminReports() {
  const { C } = useTheme();

  // Top Date Range & Frequency State
  const [dateRange, setDateRange] = useState("this_month");
  const [customDates, setCustomDates] = useState({ from: "2026-08-01", to: "2026-08-31" });
  const [chartTimeframe, setChartTimeframe] = useState("daily"); // daily, weekly, monthly
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("ALL"); // ALL, MANAGER, TEAM_LEADER, TELECALLER

  // Filter Drawer & Export Modal States
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Active Detailed Report Inspection State
  const [activeReportModal, setActiveReportModal] = useState(null); // null or { id, title, type, description }
  const [modalFilterDates, setModalFilterDates] = useState({ from: "2026-08-01", to: "2026-08-31" });
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalStatusFilter, setModalStatusFilter] = useState("ALL");

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);

  const fetchReportsOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/overview");
      if (res.data?.success) {
        setReportsData(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch reports overview, using integrated dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsOverview();
  }, [dateRange, customDates]);

  // Fallback Mock Data matching exact structure in user image
  const kpiData = {
    totalEmployees: reportsData?.employees?.total || 1248,
    employeeGrowth: "+8.5% vs last month",
    totalApplications: reportsData?.applications?.total || 5432,
    appGrowth: "+12.3% vs last month",
    approvedApplications: reportsData?.applications?.approved || 2843,
    approvedGrowth: "+15.7% vs last month",
    approvalRate: "52.36%",
    rateGrowth: "+2.6% vs last month",
    totalIncentives: "1,24,56,780",
    incentiveGrowth: "+18.6% vs last month"
  };

  // Products Distribution
  const productCategoryData = [
    { category: "Credit Cards", count: 2356, percentage: 43.4, color: "#3B82F6" },
    { category: "Loans", count: 1725, percentage: 31.8, color: "#10B981" },
    { category: "Insurance", count: 892, percentage: 16.4, color: "#F59E0B" },
    { category: "Banking Accounts", count: 459, percentage: 8.4, color: "#8B5CF6" }
  ];

  // Status Distribution
  const statusData = [
    { status: "Approved", count: 2843, percentage: 52.36, color: "#10B981" },
    { status: "In Review", count: 1245, percentage: 22.92, color: "#F59E0B" },
    { status: "Rejected", count: 897, percentage: 16.52, color: "#EF4444" },
    { status: "Pending", count: 447, percentage: 8.23, color: "#3B82F6" }
  ];

  // Channels Distribution
  const channelData = [
    { name: "Employee Panel", count: 2858, percentage: 52.6, color: "#0F766E" },
    { name: "Bank / Partner API", count: 1654, percentage: 30.4, color: "#2563EB" },
    { name: "Manual Entry (HR)", count: 652, percentage: 12.0, color: "#D97706" },
    { name: "Other Sources", count: 270, percentage: 5.0, color: "#6B7280" }
  ];

  // Top Performing Employees
  const topEmployees = [
    { id: "YOH-TL1001", rank: 1, name: "Rohit Kumar", role: "Team Leader", avatarBg: "#3B82F6", applications: 356, approved: 189, incentives: "18,750" },
    { id: "YOH-TC2001", rank: 2, name: "Priya Singh", role: "Telecaller", avatarBg: "#EC4899", applications: 289, approved: 156, incentives: "14,320" },
    { id: "YOH-TC2002", rank: 3, name: "Ankit Verma", role: "Telecaller", avatarBg: "#8B5CF6", applications: 265, approved: 142, incentives: "13,210" },
    { id: "YOH-TC2003", rank: 4, name: "Neha Patel", role: "Telecaller", avatarBg: "#10B981", applications: 241, approved: 128, incentives: "11,860" },
    { id: "YOH-TC2004", rank: 5, name: "Vikram Joshi", role: "Telecaller", avatarBg: "#F59E0B", applications: 219, approved: 112, incentives: "10,450" }
  ];

  // Trend Summary
  const trendSummary = [
    { label: "This Month", change: "↑ 12.3%", isPositive: true },
    { label: "Last Month", change: "↑ 9.1%", isPositive: true },
    { label: "This Quarter", change: "↑ 14.6%", isPositive: true },
    { label: "Last Quarter", change: "↓ 2.4%", isPositive: false },
    { label: "This Year (YTD)", change: "↑ 16.7%", isPositive: true },
    { label: "Last Year (YTD)", change: "↑ 11.3%", isPositive: true }
  ];

  // Detailed Reports Cards Catalog
  const detailedReportsList = [
    { id: "employee_perf", title: "Employee Performance Report", description: "Detailed performance metrics of all employees across Manager → TL → TC hierarchy.", icon: <FaUsers />, type: "EMPLOYEE" },
    { id: "app_report", title: "Application Report", description: "Complete application status, bank routing, customer details and timestamps.", icon: <FaFileAlt />, type: "APPLICATION" },
    { id: "incentive_report", title: "Incentive Report", description: "Employee & partner incentive earnings, commission percentages, and payout history.", icon: <FaCoins />, type: "INCENTIVE" },
    { id: "payout_report", title: "Payout Report", description: "RazorpayX bank payout transactions, processing states, UTR numbers and ledger.", icon: <FaUniversity />, type: "PAYOUT" },
    { id: "lead_report", title: "Lead Report", description: "Lead generation volumes, conversion rates, and pipeline drop-off metrics.", icon: <FaChartLine />, type: "LEAD" },
    { id: "kyc_report", title: "KYC Report", description: "Employee & partner KYC verification status for PAN, Aadhaar, Bank, and Video.", icon: <FaShieldAlt />, type: "KYC" },
    { id: "product_report", title: "Product Report", description: "Bank-wise and product-wise application conversion performance.", icon: <FaCreditCard />, type: "PRODUCT" },
    { id: "channel_report", title: "Channel Report", description: "Acquisition breakdown across Punch Only, Share Link, Direct Link, Employee & Partner.", icon: <FaUserTie />, type: "CHANNEL" }
  ];

  // Export Data to CSV function
  const handleDownloadReportCSV = (reportTitle) => {
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${modalFilterDates.from}_to_${modalFilterDates.to}.csv`;
    const sampleData = [
      ["Report Name", reportTitle],
      ["Date Range", `${modalFilterDates.from} to ${modalFilterDates.to}`],
      ["Generated On", new Date().toLocaleString()],
      [],
      ["Record ID", "Employee / Ref", "Category", "Status", "Amount / Score", "Date"],
      ["REC-1001", "Rohit Kumar (YOH-TL1001)", "Credit Cards", "APPROVED", "₹18,750", "2026-08-15"],
      ["REC-1002", "Priya Singh (YOH-TC2001)", "Loans", "APPROVED", "₹14,320", "2026-08-18"],
      ["REC-1003", "Ankit Verma (YOH-TC2002)", "Insurance", "IN_REVIEW", "₹13,210", "2026-08-20"],
      ["REC-1004", "Neha Patel (YOH-TC2003)", "Credit Cards", "APPROVED", "₹11,860", "2026-08-24"]
    ];

    const csvContent = sampleData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: C.text, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. TOP HEADER & GLOBAL CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>
            Reports
          </h1>
          <p style={{ fontSize: '13px', color: C.textMid, margin: '4px 0 0 0' }}>
            Detailed insights and analytics of platform performance
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Date Range Selector */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '6px 12px' }}>
            <FaCalendarAlt style={{ color: C.teal, marginRight: '8px', fontSize: '13px' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: C.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">01 Aug 2026 - 31 Aug 2026</option>
              <option value="this_quarter">This Quarter</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => setShowExportModal(true)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, color: C.text,
              padding: '9px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '13px',
              display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <FaDownload style={{ color: C.teal }} /> Export Report
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            style={{
              background: showFilterDrawer ? C.teal : C.card,
              border: `1px solid ${showFilterDrawer ? C.teal : C.border}`,
              color: showFilterDrawer ? '#FFF' : C.text,
              padding: '9px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '13px',
              display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <FaFilter /> Filters
          </button>

        </div>
      </div>

      {/* FILTER DRAWER / PANEL (If opened) */}
      {showFilterDrawer && (
        <div style={{ background: C.card, border: `1px solid ${C.teal}40`, borderRadius: '18px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>From Date</label>
            <input type="date" value={customDates.from} onChange={(e) => setCustomDates(p => ({ ...p, from: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>To Date</label>
            <input type="date" value={customDates.to} onChange={(e) => setCustomDates(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Employee Hierarchy Role</label>
            <select value={employeeRoleFilter} onChange={(e) => setEmployeeRoleFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700 }}>
              <option value="ALL">All Roles (Manager, TL, TC)</option>
              <option value="MANAGER">Manager Only</option>
              <option value="TEAM_LEADER">Team Leader (TL) Only</option>
              <option value="TELECALLER">Telecaller (TC) Only</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={fetchReportsOverview} style={{ width: '100%', background: C.teal, color: '#FFF', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FaSyncAlt /> Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* 2. 📈 5 KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        
        {/* Card 1: Total Employees */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaUsers />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Employees</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.totalEmployees.toLocaleString()}</div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.employeeGrowth}</span>
          </div>
        </div>

        {/* Card 2: Total Applications */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaFileAlt />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Applications</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.totalApplications.toLocaleString()}</div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.appGrowth}</span>
          </div>
        </div>

        {/* Card 3: Approved Applications */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaCheckCircle />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Approved Applications</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.approvedApplications.toLocaleString()}</div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.approvedGrowth}</span>
          </div>
        </div>

        {/* Card 4: Approval Rate */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaChartLine />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Approval Rate</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.approvalRate}</div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.rateGrowth}</span>
          </div>
        </div>

        {/* Card 5: Total Incentives */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <FaCoins />
          </div>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Incentives</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0' }}>₹{kpiData.totalIncentives}</div>
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.incentiveGrowth}</span>
          </div>
        </div>

      </div>

      {/* 3. 📈 APPLICATIONS OVERVIEW LINE CHART & DISTRIBUTION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Chart Panel: Applications Overview */}
        <div style={{ gridColumn: 'span 2', background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: C.text }}>Applications Overview</h3>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>● Total Applications</span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>● Approved</span>
                <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>● Rejected</span>
              </div>
            </div>

            {/* Daily / Weekly / Monthly Switch */}
            <div style={{ display: 'flex', background: C.bgSecondary, padding: '3px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
              {['daily', 'weekly', 'monthly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTimeframe(t)}
                  style={{
                    padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: chartTimeframe === t ? C.card : 'transparent',
                    color: chartTimeframe === t ? C.text : C.textMid,
                    fontWeight: chartTimeframe === t ? 800 : 600, fontSize: '11.5px', textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line / Area Graph Simulation */}
          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 800 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="800" y2="40" stroke={C.border} strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="800" y2="90" stroke={C.border} strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="800" y2="140" stroke={C.border} strokeDasharray="4 4" />
              <line x1="0" y1="190" x2="800" y2="190" stroke={C.border} strokeDasharray="4 4" />

              {/* Total Applications Area Gradient Path */}
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,130 Q100,120 200,80 T400,100 T600,60 T800,40 L800,200 L0,200 Z" fill="url(#totalGrad)" />

              {/* Total Applications Line (Blue) */}
              <path d="M0,130 Q100,120 200,80 T400,100 T600,60 T800,40" fill="none" stroke="#2563EB" strokeWidth="3.5" />
              
              {/* Approved Line (Green) */}
              <path d="M0,160 Q100,150 200,120 T400,140 T600,90 T800,80" fill="none" stroke="#10B981" strokeWidth="3" />

              {/* Rejected Line (Red) */}
              <path d="M0,195 Q100,190 200,180 T400,185 T600,175 T800,170" fill="none" stroke="#EF4444" strokeWidth="2.5" />

              {/* Data Points */}
              <circle cx="200" cy="80" r="5" fill="#2563EB" stroke="#FFF" strokeWidth="2" />
              <circle cx="400" cy="100" r="5" fill="#2563EB" stroke="#FFF" strokeWidth="2" />
              <circle cx="600" cy="60" r="5" fill="#2563EB" stroke="#FFF" strokeWidth="2" />
              <circle cx="800" cy="40" r="5" fill="#2563EB" stroke="#FFF" strokeWidth="2" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: C.textMid, fontWeight: 700 }}>
              <span>01 Aug</span>
              <span>06 Aug</span>
              <span>11 Aug</span>
              <span>16 Aug</span>
              <span>21 Aug</span>
              <span>26 Aug</span>
              <span>31 Aug</span>
            </div>
          </div>
        </div>

        {/* Donut 1: Applications by Product Category */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0', color: C.text }}>Applications by Product Category</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {productCategoryData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                    {item.category}
                  </span>
                  <span><strong>{item.count.toLocaleString()}</strong> ({item.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: C.bgSecondary, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. STATUS & CHANNEL DISTRIBUTION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
        
        {/* Box A: Applications by Status */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0', color: C.text }}>Applications by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statusData.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bgSecondary, padding: '10px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
                  {s.status}
                </span>
                <strong style={{ fontSize: '13px' }}>{s.count.toLocaleString()} ({s.percentage}%)</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Box B: Applications Trend Summary */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 16px 0', color: C.text }}>Applications Trend Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trendSummary.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 0', borderBottom: idx < trendSummary.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontWeight: 700, color: C.textMid }}>{t.label}</span>
                <span style={{ fontWeight: 900, color: t.isPositive ? '#10B981' : '#EF4444' }}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Box C: Applications by Source / Channel */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: C.text }}>Applications by Channel</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {channelData.map((c, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                  <span>{c.name}</span>
                  <span><strong>{c.count.toLocaleString()}</strong> ({c.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: C.bgSecondary, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.percentage}%`, height: '100%', background: c.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. 🏆 TOP PERFORMING EMPLOYEES TABLE */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTrophy style={{ color: '#F59E0B' }} /> Top Performing Employees
            </h3>
            <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>Leaderboard tracking conversions across Manager → TL → TC Hierarchy</p>
          </div>

          <button 
            onClick={() => setActiveReportModal(detailedReportsList[0])}
            style={{ background: 'transparent', border: 'none', color: C.teal, fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            View All Employees Report <FaChevronRight size={11} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMid, fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Rank</th>
                <th style={{ padding: '12px 14px' }}>Employee</th>
                <th style={{ padding: '12px 14px' }}>Role</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Applications</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Approved</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Incentives Earned</th>
              </tr>
            </thead>
            <tbody>
              {topEmployees.map((e) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 14px', fontWeight: 900 }}>
                    {e.rank === 1 ? '🥇 1' : (e.rank === 2 ? '🥈 2' : (e.rank === 3 ? '🥉 3' : `#${e.rank}`))}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: e.avatarBg, color: '#FFF', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: C.text }}>{e.name}</strong>
                        <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>{e.id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800 }}>
                      {e.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800 }}>{e.applications}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#10B981' }}>{e.approved}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#059669' }}>₹{e.incentives}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. 📑 DETAILED REPORTS CARDS CATALOG (AT BOTTOM) */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '0 0 16px 0' }}>
          Detailed Reports Catalog
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '16px' }}>
          {detailedReportsList.map((rep) => (
            <div 
              key={rep.id} 
              style={{ 
                background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', 
                padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)', transition: 'transform 0.2s'
              }}
            >
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' }}>
                  {rep.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 900, color: C.text, margin: '0 0 6px 0' }}>
                  {rep.title}
                </h3>
                <p style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {rep.description}
                </p>
              </div>

              <button
                onClick={() => setActiveReportModal(rep)}
                style={{
                  background: 'transparent', border: 'none', color: C.teal, 
                  fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                View Report <FaChevronRight size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. INTERACTIVE DETAILED REPORT INSPECTION MODAL */}
      {activeReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Super Admin Detailed Report</span>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0 4px 0' }}>{activeReportModal.title}</h2>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: 0 }}>{activeReportModal.description}</p>
              </div>
              <button onClick={() => setActiveReportModal(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
                <FaTimes />
              </button>
            </div>

            {/* Filter Bar Inside Modal */}
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '4px' }}>FROM DATE</label>
                <input type="date" value={modalFilterDates.from} onChange={(e) => setModalFilterDates(p => ({ ...p, from: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12px', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '4px' }}>TO DATE</label>
                <input type="date" value={modalFilterDates.to} onChange={(e) => setModalFilterDates(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12px', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '4px' }}>STATUS FILTER</label>
                <select value={modalStatusFilter} onChange={(e) => setModalStatusFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12px', fontWeight: 700 }}>
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="REJECTED">Rejected Only</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, marginBottom: '4px' }}>SEARCH RECORDS</label>
                <input type="text" placeholder="Search by ID / Name..." value={modalSearchQuery} onChange={(e) => setModalSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '12px', fontWeight: 700 }} />
              </div>
            </div>

            {/* Export Buttons Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>Filtered Results (Showing 5 Records)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDownloadReportCSV(activeReportModal.title)} style={{ background: '#059669', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaFileCsv /> Download CSV
                </button>
                <button onClick={() => handleDownloadReportCSV(activeReportModal.title)} style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaFileExcel /> Download Excel
                </button>
              </div>
            </div>

            {/* Table Grid */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMid, fontSize: '11.5px' }}>
                    <th style={{ padding: '10px 12px' }}>RECORD ID</th>
                    <th style={{ padding: '10px 12px' }}>EMPLOYEE / REF</th>
                    <th style={{ padding: '10px 12px' }}>CATEGORY / PRODUCT</th>
                    <th style={{ padding: '10px 12px' }}>STATUS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>AMOUNT</th>
                    <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>REC-1001</td>
                    <td style={{ padding: '10px 12px' }}>Rohit Kumar (YOH-TL1001)</td>
                    <td style={{ padding: '10px 12px' }}>Credit Cards</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#10B981', fontWeight: 800 }}>APPROVED</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800 }}>₹18,750</td>
                    <td style={{ padding: '10px 12px', color: C.textMid }}>2026-08-15</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>REC-1002</td>
                    <td style={{ padding: '10px 12px' }}>Priya Singh (YOH-TC2001)</td>
                    <td style={{ padding: '10px 12px' }}>Loans</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#10B981', fontWeight: 800 }}>APPROVED</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800 }}>₹14,320</td>
                    <td style={{ padding: '10px 12px', color: C.textMid }}>2026-08-18</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>REC-1003</td>
                    <td style={{ padding: '10px 12px' }}>Ankit Verma (YOH-TC2002)</td>
                    <td style={{ padding: '10px 12px' }}>Insurance</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#F59E0B', fontWeight: 800 }}>IN_REVIEW</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800 }}>₹13,210</td>
                    <td style={{ padding: '10px 12px', color: C.textMid }}>2026-08-20</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
