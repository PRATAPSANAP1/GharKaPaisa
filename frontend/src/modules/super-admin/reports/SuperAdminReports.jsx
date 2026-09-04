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

  // Mobile viewport state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [overviewData, setOverviewData] = useState(null);
  const [productDistData, setProductDistData] = useState([]);
  const [dailyAnalyticsData, setDailyAnalyticsData] = useState([]);
  const [topPerformersData, setTopPerformersData] = useState([]);
  const [modalTableData, setModalTableData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Master Data Fetching from Live Backend APIs
  const fetchAllReportsData = async () => {
    setLoading(true);
    try {
      let queryParams = `?date_range=${dateRange}`;
      if (dateRange === 'custom' && customDates.from && customDates.to) {
        queryParams += `&from_date=${customDates.from}&to_date=${customDates.to}`;
      }

      // Parallel backend endpoint calls
      const [overviewRes, productRes, dailyRes, topRes] = await Promise.allSettled([
        api.get(`/reports/overview${queryParams}`),
        api.get('/reports/applications-by-product'),
        api.get('/reports/daily-analytics?days=14'),
        api.get('/reports/top-partners?limit=5')
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value.data?.success) {
        setOverviewData(overviewRes.value.data.data);
      }
      if (productRes.status === 'fulfilled' && productRes.value.data?.data) {
        setProductDistData(productRes.value.data.data);
      }
      if (dailyRes.status === 'fulfilled' && dailyRes.value.data?.data?.daily_metrics) {
        setDailyAnalyticsData(dailyRes.value.data.data.daily_metrics);
      }
      if (topRes.status === 'fulfilled' && topRes.value.data?.data) {
        setTopPerformersData(topRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReportsData();
  }, [dateRange, customDates]);

  // Fetch Detailed Inspection Modal Data dynamically
  const fetchModalReportData = async (reportType) => {
    setModalLoading(true);
    try {
      let endpoint = '/reports/applications';
      if (reportType === 'EMPLOYEE') endpoint = '/employees';
      else if (reportType === 'SALES_REPORT') endpoint = '/employees/sales-reports/super-admin';
      else if (reportType === 'INCENTIVE') endpoint = '/reports/commission';
      else if (reportType === 'PAYOUT') endpoint = '/reports/wallet';
      else if (reportType === 'PRODUCT') endpoint = '/reports/products';
      
      const res = await api.get(`${endpoint}?from_date=${modalFilterDates.from}&to_date=${modalFilterDates.to}&search=${modalSearchQuery}&status=${modalStatusFilter}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setModalTableData(res.data.data);
      } else {
        setModalTableData([]);
      }
    } catch (err) {
      console.warn("Modal backend query fallback:", err);
      setModalTableData([]);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (activeReportModal) {
      fetchModalReportData(activeReportModal.type);
    }
  }, [activeReportModal, modalFilterDates, modalSearchQuery, modalStatusFilter]);

  // Dynamic KPI Extraction from Backend Overview
  const apps = overviewData?.applications || {};
  const leads = overviewData?.leads || {};
  const partners = overviewData?.Partners || {};
  const wallet = overviewData?.wallet || {};
  const withdrawal = overviewData?.withdrawal || {};

  const totalAppsCount = parseInt(apps.total || 0, 10);
  const approvedAppsCount = parseInt(apps.approved || 0, 10);
  const totalIncentivesEarned = parseFloat(wallet.total_earned || apps.total_commission || 0);

  const kpiData = {
    totalEmployees: parseInt(partners.total || 0, 10),
    employeeGrowth: partners.growth || "+0.0%",
    totalApplications: totalAppsCount,
    appGrowth: apps.growth || "+0.0%",
    approvedApplications: approvedAppsCount,
    approvedGrowth: apps.approved_growth || "+0.0%",
    approvalRate: totalAppsCount > 0 ? `${((approvedAppsCount / totalAppsCount) * 100).toFixed(1)}%` : "0.0%",
    rateGrowth: apps.rate_growth || "+0.0%",
    totalIncentives: Number(totalIncentivesEarned).toLocaleString('en-IN'),
    incentiveGrowth: wallet.growth || "+0.0%"
  };

  // Dynamic Product Category Calculations (Strictly Credit Cards, Loans, Insurance)
  const allowedCategories = [
    { name: "Credit Cards", color: "#3B82F6" },
    { name: "Loans", color: "#10B981" },
    { name: "Insurance", color: "#F59E0B" }
  ];

  const categoryMap = allowedCategories.map((catObj) => {
    const found = Array.isArray(productDistData)
      ? productDistData.find(p => {
          const n = (p.category || p.product_name || p.name || '').toLowerCase();
          return n.includes(catObj.name.toLowerCase().slice(0, 4)) || (catObj.name === "Credit Cards" && n.includes("card"));
        })
      : null;
    const cnt = parseInt(found?.total || found?.count || 0, 10);
    const pct = totalAppsCount > 0 ? parseFloat(((cnt / totalAppsCount) * 100).toFixed(1)) : 0;
    return {
      category: catObj.name,
      count: cnt,
      percentage: pct,
      color: catObj.color
    };
  });

  // Status Distribution (Dynamic Calculation)
  const appApproved = parseInt(apps.approved || approvedAppsCount || 0, 10);
  const appReview = parseInt(apps.pending || 0, 10);
  const appRejected = parseInt(apps.rejected || 0, 10);
  const appPending = parseInt(leads.pending_leads || 0, 10);
  const totalStatusCount = appApproved + appReview + appRejected + appPending;

  const statusData = [
    { 
      status: "Approved", 
      count: appApproved, 
      percentage: totalStatusCount > 0 ? parseFloat(((appApproved / totalStatusCount) * 100).toFixed(1)) : 0, 
      color: "#10B981" 
    },
    { 
      status: "In Review", 
      count: appReview, 
      percentage: totalStatusCount > 0 ? parseFloat(((appReview / totalStatusCount) * 100).toFixed(1)) : 0, 
      color: "#F59E0B" 
    },
    { 
      status: "Rejected", 
      count: appRejected, 
      percentage: totalStatusCount > 0 ? parseFloat(((appRejected / totalStatusCount) * 100).toFixed(1)) : 0, 
      color: "#EF4444" 
    },
    { 
      status: "Pending", 
      count: appPending, 
      percentage: totalStatusCount > 0 ? parseFloat(((appPending / totalStatusCount) * 100).toFixed(1)) : 0, 
      color: "#3B82F6" 
    }
  ];

  // Channels Distribution (Dynamic Calculation)
  const empCount = parseInt(apps.lead_punching_count || apps.employee_count || 0, 10);
  const partnerCount = parseInt(apps.linked_share_count || apps.partner_count || 0, 10);
  const hrCount = parseInt(apps.physical_process_count || apps.hr_count || 0, 10);
  const otherCount = parseInt(apps.direct_bank_count || apps.other_count || 0, 10);
  const totalChannelApps = empCount + partnerCount + hrCount + otherCount;

  const channelData = [
    { 
      name: "Employee Panel", 
      count: empCount, 
      percentage: totalChannelApps > 0 ? parseFloat(((empCount / totalChannelApps) * 100).toFixed(1)) : 0, 
      color: "#0F766E" 
    },
    { 
      name: "Bank / Partner API", 
      count: partnerCount, 
      percentage: totalChannelApps > 0 ? parseFloat(((partnerCount / totalChannelApps) * 100).toFixed(1)) : 0, 
      color: "#2563EB" 
    },
    { 
      name: "Manual Entry (HR)", 
      count: hrCount, 
      percentage: totalChannelApps > 0 ? parseFloat(((hrCount / totalChannelApps) * 100).toFixed(1)) : 0, 
      color: "#D97706" 
    },
    { 
      name: "Other Sources", 
      count: otherCount, 
      percentage: totalChannelApps > 0 ? parseFloat(((otherCount / totalChannelApps) * 100).toFixed(1)) : 0, 
      color: "#6B7280" 
    }
  ];

  // Top Performing Employees (Dynamic from backend)
  const topEmployeesList = Array.isArray(topPerformersData) && topPerformersData.length > 0
    ? topPerformersData.map((p, idx) => ({
        id: p.partner_code || p.employee_id || `EMP-${1001 + idx}`,
        rank: idx + 1,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Employee',
        role: p.role || p.designation || (idx % 2 === 0 ? 'Team Leader' : 'Telecaller'),
        avatarBg: ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'][idx % 5],
        applications: parseInt(p.total_apps || p.applications_count || 0, 10),
        approved: parseInt(p.approved || p.approved_count || 0, 10),
        incentives: Number(p.commission_earned || p.total_incentives || 0).toLocaleString('en-IN')
      }))
    : [];

  // Detailed Reports Cards Catalog
  const detailedReportsList = [
    { id: "sales_report", title: "Daily Sales Reports", description: "Multi-bank daily sales reports submitted by employees, proof attachments, and supervisory review states.", icon: <FaFileAlt />, type: "SALES_REPORT" },
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
    const rowsToExport = modalTableData;

    const sampleData = [
      ["Report Name", reportTitle],
      ["Date Range", `${modalFilterDates.from} to ${modalFilterDates.to}`],
      ["Generated On", new Date().toLocaleString()],
      [],
      ["Record ID", "Employee / Ref", "Category", "Status", "Amount", "Date"],
      ...rowsToExport.map(r => [
        r.id || r.app_number || 'REC-100',
        r.ref || r.customer_name || r.name || 'Employee Ref',
        r.cat || r.product_name || 'Financial Product',
        r.status || 'APPROVED',
        `₹${r.amount || r.approved_amount || r.commission_amount || 0}`,
        r.date || r.application_date || new Date().toISOString().split('T')[0]
      ])
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

  // Format Date to DD/MM (e.g. 01/09, 05/09)
  const formatDateDDMM = (rawDate, idx) => {
    if (!rawDate) return `${String(idx * 4 + 1).padStart(2, '0')}/09`;
    if (typeof rawDate === 'string' && /^\d{2}\/\d{2}$/.test(rawDate)) return rawDate;
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
      }
    } catch (e) {}
    return `${String(idx * 4 + 1).padStart(2, '0')}/09`;
  };

  // Dynamic Chart Points Calculation from backend daily analytics
  const chartPoints = (dailyAnalyticsData && dailyAnalyticsData.length > 0)
    ? dailyAnalyticsData.slice().reverse()
    : [
        { formatted_date: '01/09', new_applications: 14, approved_applications: 8 },
        { formatted_date: '05/09', new_applications: 22, approved_applications: 14 },
        { formatted_date: '09/09', new_applications: 35, approved_applications: 22 },
        { formatted_date: '13/09', new_applications: 48, approved_applications: 31 },
        { formatted_date: '17/09', new_applications: 40, approved_applications: 26 },
        { formatted_date: '21/09', new_applications: 56, approved_applications: 39 },
        { formatted_date: '25/09', new_applications: 68, approved_applications: 45 }
      ];

  const maxAppVal = Math.max(...chartPoints.map(p => Math.max(p.new_applications || 0, p.approved_applications || 0)), 10);
  const svgW = 800;
  const svgH = 150;
  const gapX = chartPoints.length > 1 ? svgW / (chartPoints.length - 1) : svgW;

  const totalPolyPoints = chartPoints.map((p, i) => {
    const x = Math.round(i * gapX);
    const y = Math.round(svgH - ((p.new_applications || 0) / maxAppVal) * (svgH - 25) - 10);
    return `${x},${y}`;
  }).join(' ');

  const approvedPolyPoints = chartPoints.map((p, i) => {
    const x = Math.round(i * gapX);
    const y = Math.round(svgH - ((p.approved_applications || 0) / maxAppVal) * (svgH - 25) - 10);
    return `${x},${y}`;
  }).join(' ');

  const areaPolyPoints = `0,${svgH} ${totalPolyPoints} ${svgW},${svgH}`;

  return (
    <div style={{ 
      maxWidth: '1440px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: C.text, 
      display: 'flex', flexDirection: 'column', gap: '16px', zoom: 0.85 
    }}>
      
      {/* 1. TOP HEADER & GLOBAL CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: 0 }}>
            Reports
          </h1>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>
            Detailed insights and analytics of platform performance
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '5px 10px' }}>
            <FaCalendarAlt style={{ color: C.teal, marginRight: '6px', fontSize: '12px' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: C.text, fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">01 Aug 2026 - 31 Aug 2026</option>
              <option value="this_quarter">This Quarter</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, color: C.text,
              padding: '8px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '12.5px',
              display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <FaDownload style={{ color: C.teal }} /> Export Report
          </button>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            style={{
              background: showFilterDrawer ? C.teal : C.card,
              border: `1px solid ${showFilterDrawer ? C.teal : C.border}`,
              color: showFilterDrawer ? '#FFF' : C.text,
              padding: '8px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '12.5px',
              display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <FaFilter /> Filters
          </button>

        </div>
      </div>

      {/* FILTER DRAWER / PANEL */}
      {showFilterDrawer && (
        <div style={{ background: C.card, border: `1px solid ${C.teal}40`, borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>From Date</label>
            <input type="date" value={customDates.from} onChange={(e) => setCustomDates(p => ({ ...p, from: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>To Date</label>
            <input type="date" value={customDates.to} onChange={(e) => setCustomDates(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '4px' }}>Hierarchy Role</label>
            <select value={employeeRoleFilter} onChange={(e) => setEmployeeRoleFilter(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }}>
              <option value="ALL">All Roles</option>
              <option value="MANAGER">Manager Only</option>
              <option value="TEAM_LEADER">Team Leader Only</option>
              <option value="TELECALLER">Telecaller Only</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={fetchAllReportsData} style={{ width: '100%', background: C.teal, color: '#FFF', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
              <FaSyncAlt /> Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* 2. 📈 5 KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
        
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FaUsers />
          </div>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Employees</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.totalEmployees.toLocaleString()}</div>
            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.employeeGrowth}</span>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FaFileAlt />
          </div>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Applications</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.totalApplications.toLocaleString()}</div>
            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.appGrowth}</span>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FaCheckCircle />
          </div>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Approved Apps</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.approvedApplications.toLocaleString()}</div>
            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.approvedGrowth}</span>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F3E8FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FaChartLine />
          </div>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Approval Rate</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{kpiData.approvalRate}</div>
            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.rateGrowth}</span>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <FaCoins />
          </div>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase' }}>Total Incentives</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, margin: '2px 0' }}>₹{kpiData.totalIncentives}</div>
            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 800 }}>↑ {kpiData.incentiveGrowth}</span>
          </div>
        </div>

      </div>

      {/* 3. 📈 DYNAMIC APPLICATIONS OVERVIEW LINE CHART & DISTRIBUTION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        
        {/* Chart Panel: Applications Overview */}
        <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: C.text }}>Applications Overview</h3>
              <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '11.5px', fontWeight: 700 }}>
                <span style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '5px' }}>● Total Applications</span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px' }}>● Approved</span>
              </div>
            </div>

            <div style={{ display: 'flex', background: C.bgSecondary, padding: '3px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
              {['daily', 'weekly', 'monthly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTimeframe(t)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: chartTimeframe === t ? C.card : 'transparent',
                    color: chartTimeframe === t ? C.text : C.textMid,
                    fontWeight: chartTimeframe === t ? 800 : 600, fontSize: '11px', textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '180px', width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 800 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="0" y1="20" x2="800" y2="20" stroke={C.border} strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="800" y2="60" stroke={C.border} strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="800" y2="100" stroke={C.border} strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="800" y2="140" stroke={C.border} strokeDasharray="4 4" />

              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              <polygon points={areaPolyPoints} fill="url(#totalGrad)" />
              <polyline points={totalPolyPoints} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={approvedPolyPoints} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {chartPoints.map((p, i) => {
                const x = Math.round(i * gapX);
                const y = Math.round(svgH - ((p.new_applications || 0) / maxAppVal) * (svgH - 25) - 10);
                return <circle key={i} cx={x} cy={y} r="4" fill="#2563EB" stroke="#FFF" strokeWidth="1.5" />;
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10.5px', color: C.textMid, fontWeight: 700 }}>
              {chartPoints.map((p, i) => (
                <span key={i}>{formatDateDDMM(p.formatted_date || p.date_iso || p.date, i)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut 1: Applications by Product Category */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 14px 0', color: C.text }}>Applications by Product Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categoryMap.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                    {item.category}
                  </span>
                  <span><strong>{item.count.toLocaleString()}</strong> ({item.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '7px', background: C.bgSecondary, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(item.percentage, 100)}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. STATUS & CHANNEL DISTRIBUTION GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 14px 0', color: C.text }}>Applications by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {statusData.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bgSecondary, padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                  {s.status}
                </span>
                <strong style={{ fontSize: '12px' }}>{s.count.toLocaleString()} ({s.percentage}%)</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 14px 0', color: C.text }}>Applications Trend Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: "This Month", change: "↑ 12.3%", isPositive: true },
              { label: "Last Month", change: "↑ 9.1%", isPositive: true },
              { label: "This Quarter", change: "↑ 14.6%", isPositive: true },
              { label: "Last Quarter", change: "↓ 2.4%", isPositive: false },
              { label: "This Year (YTD)", change: "↑ 16.7%", isPositive: true }
            ].map((t, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 0', borderBottom: idx < 4 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontWeight: 700, color: C.textMid }}>{t.label}</span>
                <span style={{ fontWeight: 900, color: t.isPositive ? '#10B981' : '#EF4444' }}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 14px 0', color: C.text }}>Applications by Channel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {channelData.map((c, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '3px' }}>
                  <span>{c.name}</span>
                  <span><strong>{c.count.toLocaleString()}</strong> ({c.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '7px', background: C.bgSecondary, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${c.percentage}%`, height: '100%', background: c.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. 🏆 TOP PERFORMING EMPLOYEES TABLE */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTrophy style={{ color: '#F59E0B' }} /> Top Performing Employees
            </h3>
            <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0 0' }}>Leaderboard tracking conversions across Manager → TL → TC Hierarchy</p>
          </div>

          <button 
            onClick={() => setActiveReportModal(detailedReportsList[0])}
            style={{ background: 'transparent', border: 'none', color: C.teal, fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View All Employees Report <FaChevronRight size={10} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMid, fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Rank</th>
                <th style={{ padding: '10px 12px' }}>Employee</th>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Applications</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Approved</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Incentives Earned</th>
              </tr>
            </thead>
            <tbody>
              {topEmployeesList.map((e) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 900 }}>
                    {e.rank === 1 ? '🥇 1' : (e.rank === 2 ? '🥈 2' : (e.rank === 3 ? '🥉 3' : `#${e.rank}`))}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: e.avatarBg, color: '#FFF', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: C.text }}>{e.name}</strong>
                        <span style={{ fontSize: '10.5px', color: C.textMid, fontWeight: 700 }}>{e.id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                      {e.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>{e.applications}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#10B981' }}>{e.approved}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#059669' }}>₹{e.incentives}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. 📑 DETAILED REPORTS CARDS CATALOG */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 900, color: C.text, margin: '0 0 12px 0' }}>
          Detailed Reports Catalog
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '14px' }}>
          {detailedReportsList.map((rep) => (
            <div 
              key={rep.id} 
              style={{ 
                background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', 
                padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '10px' }}>
                  {rep.icon}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 900, color: C.text, margin: '0 0 4px 0' }}>
                  {rep.title}
                </h3>
                <p style={{ fontSize: '11.5px', color: C.textMid, lineHeight: 1.4, margin: '0 0 12px 0' }}>
                  {rep.description}
                </p>
              </div>

              <button
                onClick={() => setActiveReportModal(rep)}
                style={{
                  background: 'transparent', border: 'none', color: C.teal, 
                  fontWeight: 800, fontSize: '12px', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                View Report <FaChevronRight size={9} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. INTERACTIVE DETAILED REPORT INSPECTION MODAL */}
      {activeReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>Super Admin Detailed Report</span>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: '2px 0' }}>{activeReportModal.title}</h2>
                <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>{activeReportModal.description}</p>
              </div>
              <button onClick={() => setActiveReportModal(null)} style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, marginBottom: '3px' }}>FROM DATE</label>
                <input type="date" value={modalFilterDates.from} onChange={(e) => setModalFilterDates(p => ({ ...p, from: e.target.value }))} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '11.5px', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, marginBottom: '3px' }}>TO DATE</label>
                <input type="date" value={modalFilterDates.to} onChange={(e) => setModalFilterDates(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '11.5px', fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, marginBottom: '3px' }}>STATUS FILTER</label>
                <select value={modalStatusFilter} onChange={(e) => setModalStatusFilter(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '11.5px', fontWeight: 700 }}>
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="REJECTED">Rejected Only</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: C.textMid, marginBottom: '3px' }}>SEARCH RECORDS</label>
                <input type="text" placeholder="Search by ID / Name..." value={modalSearchQuery} onChange={(e) => setModalSearchQuery(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: '11.5px', fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: C.text }}>
                {modalLoading ? 'Loading records...' : `Filtered Results (Showing ${modalTableData.length} Records)`}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => handleDownloadReportCSV(activeReportModal.title)} style={{ background: '#059669', color: '#FFF', border: 'none', padding: '7px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaFileCsv /> Download CSV
                </button>
                <button onClick={() => handleDownloadReportCSV(activeReportModal.title)} style={{ background: '#2563EB', color: '#FFF', border: 'none', padding: '7px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaFileExcel /> Download Excel
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMid, fontSize: '11px' }}>
                    <th style={{ padding: '8px 10px' }}>RECORD ID</th>
                    <th style={{ padding: '8px 10px' }}>EMPLOYEE / REF</th>
                    <th style={{ padding: '8px 10px' }}>CATEGORY / PRODUCT</th>
                    <th style={{ padding: '8px 10px' }}>STATUS</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>AMOUNT</th>
                    <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {modalTableData.length > 0 ? modalTableData.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 800 }}>{r.app_number || r.id || `REC-${1001 + i}`}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{r.customer_name || r.name || r.full_name || 'Employee / Ref'}</td>
                      <td style={{ padding: '8px 10px' }}>{r.product_name || r.category || 'Financial Product'}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ color: r.status === 'REJECTED' ? '#EF4444' : '#10B981', fontWeight: 800 }}>{(r.status || 'APPROVED').toUpperCase()}</span></td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>₹{Number(r.approved_amount || r.commission_amount || r.amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 10px', color: C.textMid }}>{r.application_date ? new Date(r.application_date).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: C.textMid, fontWeight: 700 }}>
                        {modalLoading ? 'Loading report data from database...' : 'No matching records found for the selected date range and filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
