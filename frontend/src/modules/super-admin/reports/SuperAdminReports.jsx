import React, { useState, useEffect } from "react";
import api from "../../../services/api";
import { useTheme } from "../../../contexts/ThemeContext";
import { 
  FaUsers, FaFileAlt, FaCheckCircle, FaChartLine, FaCoins, FaFilter, 
  FaDownload, FaCalendarAlt, FaCreditCard, FaShieldAlt, FaUniversity,
  FaSearch, FaTimes, FaUserTie, FaChevronRight, FaTrophy, FaSyncAlt,
  FaFileCsv, FaFileExcel, FaEye, FaBuilding, FaUserCheck, FaLayerGroup, FaSpinner
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

  // Global Date Range & Frequency State
  const [dateRange, setDateRange] = useState("this_month");
  const [customDates, setCustomDates] = useState({ from: "2026-08-01", to: new Date().toISOString().split('T')[0] });
  const [chartTimeframe, setChartTimeframe] = useState("daily");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState("ALL");

  // Filter Drawer & Export Modal States
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Active Report Generator State
  const [exportReportType, setExportReportType] = useState("employees"); // employees, customers, admins, partners, applications, complete
  const [employeeVariant, setEmployeeVariant] = useState("summary"); // summary, detailed
  const [reportFilters, setReportFilters] = useState({
    from_date: "",
    to_date: "",
    status: "ALL",
    designation: "ALL",
    department: "ALL",
    branch: "ALL",
    search: ""
  });

  // Export & Preview States
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Master Data Fetching from Live Backend APIs
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [productDistData, setProductDistData] = useState([]);
  const [dailyAnalyticsData, setDailyAnalyticsData] = useState([]);
  const [topPerformersData, setTopPerformersData] = useState([]);

  // Fetch Dashboard Overview
  const fetchAllReportsData = async () => {
    setLoading(true);
    try {
      let queryParams = `?date_range=${dateRange}`;
      if (dateRange === 'custom' && customDates.from && customDates.to) {
        queryParams += `&from_date=${customDates.from}&to_date=${customDates.to}`;
      }

      const [overviewRes, productRes, dailyRes, topRes] = await Promise.allSettled([
        api.get(`/reports/overview${queryParams}`),
        api.get('/reports/applications-by-product'),
        api.get('/reports/daily-analytics?days=14'),
        api.get('/reports/top-partners?limit=10')
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
      console.error("Failed to fetch reports overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReportsData();
  }, [dateRange, customDates]);

  // Fetch Report Preview Data from backend
  const handleFetchReportPreview = async () => {
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFilters.from_date) params.append('from_date', reportFilters.from_date);
      if (reportFilters.to_date) params.append('to_date', reportFilters.to_date);
      if (reportFilters.status && reportFilters.status !== 'ALL') params.append('status', reportFilters.status);
      if (reportFilters.designation && reportFilters.designation !== 'ALL') params.append('designation', reportFilters.designation);
      if (reportFilters.department && reportFilters.department !== 'ALL') params.append('department', reportFilters.department);
      if (reportFilters.branch && reportFilters.branch !== 'ALL') params.append('branch', reportFilters.branch);
      if (reportFilters.search) params.append('search', reportFilters.search);
      if (exportReportType === 'employees') params.append('variant', employeeVariant);

      const endpoint = `/super-admin/reports/${exportReportType}?${params.toString()}`;
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setPreviewData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch report preview:", err);
      alert("Failed to fetch report preview. Please ensure backend server is active.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download Excel Report (.xlsx) from ExcelJS Backend Generator
  const handleDownloadExcel = async () => {
    setExportingExcel(true);
    try {
      const params = new URLSearchParams();
      if (reportFilters.from_date) params.append('from_date', reportFilters.from_date);
      if (reportFilters.to_date) params.append('to_date', reportFilters.to_date);
      if (reportFilters.status && reportFilters.status !== 'ALL') params.append('status', reportFilters.status);
      if (reportFilters.designation && reportFilters.designation !== 'ALL') params.append('designation', reportFilters.designation);
      if (reportFilters.department && reportFilters.department !== 'ALL') params.append('department', reportFilters.department);
      if (reportFilters.branch && reportFilters.branch !== 'ALL') params.append('branch', reportFilters.branch);
      if (reportFilters.search) params.append('search', reportFilters.search);
      if (exportReportType === 'employees') params.append('variant', employeeVariant);

      const endpoint = `/super-admin/reports/${exportReportType}/export?${params.toString()}`;
      const response = await api.get(endpoint, { responseType: 'blob' });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const todayStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${exportReportType}-report-${todayStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export Excel report:", err);
      alert("Export failed. Please check network connection or permissions.");
    } finally {
      setExportingExcel(false);
    }
  };

  // Dynamic KPI Extraction from Backend Overview
  const apps = overviewData?.applications || {};
  const partners = overviewData?.Partners || {};
  const wallet = overviewData?.wallet || {};

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

  const allowedCategories = [
    { name: "Credit Cards", color: "#3B82F6" },
    { name: "Loans", color: "#10B981" },
    { name: "Insurance", color: "#F59E0B" }
  ];

  const categoryMap = allowedCategories.map((catObj) => {
    let cnt = 0;
    if (Array.isArray(productDistData) && productDistData.length > 0) {
      productDistData.forEach(p => {
        const cat = (p.category || '').toLowerCase();
        const pname = (p.product_name || p.name || '').toLowerCase();
        let matches = false;
        if (catObj.name === "Credit Cards") {
          matches = cat.includes("card") || cat.includes("credit") || pname.includes("card");
        } else if (catObj.name === "Loans") {
          matches = cat.includes("loan") || pname.includes("loan");
        } else if (catObj.name === "Insurance") {
          matches = cat.includes("insurance") || pname.includes("insurance");
        }
        if (matches) cnt += parseInt(p.total || p.count || 0, 10);
      });
    }

    const pct = totalAppsCount > 0 ? parseFloat(((cnt / totalAppsCount) * 100).toFixed(1)) : 0;
    return { category: catObj.name, count: cnt, percentage: pct, color: catObj.color };
  });

  const appApproved = parseInt(apps.approved || approvedAppsCount || 0, 10);
  const appReview = parseInt(apps.pending || 0, 10);
  const appRejected = parseInt(apps.rejected || 0, 10);
  const appPending = parseInt(overviewData?.leads?.pending_leads || 0, 10);
  const totalStatusCount = appApproved + appReview + appRejected + appPending;

  const statusData = [
    { status: "Approved", count: appApproved, percentage: totalStatusCount > 0 ? parseFloat(((appApproved / totalStatusCount) * 100).toFixed(1)) : 0, color: "#10B981" },
    { status: "In Review", count: appReview, percentage: totalStatusCount > 0 ? parseFloat(((appReview / totalStatusCount) * 100).toFixed(1)) : 0, color: "#F59E0B" },
    { status: "Rejected", count: appRejected, percentage: totalStatusCount > 0 ? parseFloat(((appRejected / totalStatusCount) * 100).toFixed(1)) : 0, color: "#EF4444" },
    { status: "Pending", count: appPending, percentage: totalStatusCount > 0 ? parseFloat(((appPending / totalStatusCount) * 100).toFixed(1)) : 0, color: "#3B82F6" }
  ];

  const topEmployeesList = Array.isArray(topPerformersData) && topPerformersData.length > 0
    ? topPerformersData.map((p, idx) => ({
        id: p.partner_code || p.code || p.employee_id || `AG${10019 + idx}`,
        rank: idx + 1,
        name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Performer',
        role: p.designation || p.role || (idx % 2 === 0 ? 'Team Leader' : 'Telecaller'),
        performerType: p.performer_type || (p.partner_code?.startsWith('AG') ? 'PARTNER' : 'EMPLOYEE'),
        avatarBg: ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'][idx % 5],
        applications: parseInt(p.total_apps || p.applications_count || 0, 10),
        approved: parseInt(p.approved || p.approved_count || 0, 10),
        incentives: Number(p.commission_earned || p.total_incentives || 0).toLocaleString('en-IN')
      }))
    : [];

  return (
    <div style={{ 
      maxWidth: '1440px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: C.text, 
      display: 'flex', flexDirection: 'column', gap: '16px', zoom: 0.85 
    }}>
      
      {/* 1. TOP HEADER & CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: 0 }}>
            Super Admin Reports & Export Center
          </h1>
          <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>
            Comprehensive reporting system across Employees, Customers, Admins, Partners, Applications & Complete System
          </p>
        </div>

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
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            style={{
              background: C.teal, border: `1px solid ${C.teal}`, color: '#FFF',
              padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '12.5px',
              display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)'
            }}
          >
            <FaFileExcel style={{ color: '#FFF' }} /> Export Center (Multi-Sheet Excel)
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

      {/* 2. 5 KPI SUMMARY CARDS */}
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

      {/* 3. REPORT EXPORT CENTER PANEL & SELECTION CARD */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaFileExcel style={{ color: '#10B981' }} /> Super Admin Multi-Category Report Generator
            </h2>
            <p style={{ fontSize: '12px', color: C.textMid, margin: '4px 0 0 0' }}>
              Generate, preview and download Excel reports with sensitive data masking (PAN, Aadhaar, Bank Details)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleFetchReportPreview}
              disabled={previewLoading}
              style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text,
                padding: '9px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '12px',
                cursor: previewLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {previewLoading ? <FaSpinner className="animate-spin" /> : <FaEye />} Preview Report Data
            </button>

            <button
              onClick={handleDownloadExcel}
              disabled={exportingExcel}
              style={{
                background: '#059669', color: '#FFF', border: 'none',
                padding: '9px 18px', borderRadius: '10px', fontWeight: 900, fontSize: '12.5px',
                cursor: exportingExcel ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)'
              }}
            >
              {exportingExcel ? <FaSpinner className="animate-spin" /> : <FaDownload />} Download Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Report Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>
              Report Category
            </label>
            <select
              value={exportReportType}
              onChange={(e) => {
                setExportReportType(e.target.value);
                setPreviewData(null);
              }}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 800, fontSize: '12.5px' }}
            >
              <option value="employees">1. Employee Report</option>
              <option value="customers">2. Customer Report</option>
              <option value="admins">3. Admin Report</option>
              <option value="partners">4. Partner Report</option>
              <option value="applications">5. Application Report</option>
              <option value="complete">6. Complete System Report (Multi-Sheet)</option>
            </select>
          </div>

          {exportReportType === 'employees' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>
                Employee Report Format
              </label>
              <select
                value={employeeVariant}
                onChange={(e) => {
                  setEmployeeVariant(e.target.value);
                  setPreviewData(null);
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 800, fontSize: '12.5px' }}
              >
                <option value="summary">Summary Report (Employee Master)</option>
                <option value="detailed">Detailed Report (Employee + Linked Customers)</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>From Date</label>
            <input
              type="date"
              value={reportFilters.from_date}
              onChange={(e) => setReportFilters(p => ({ ...p, from_date: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>To Date</label>
            <input
              type="date"
              value={reportFilters.to_date}
              onChange={(e) => setReportFilters(p => ({ ...p, to_date: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>Status Filter</label>
            <select
              value={reportFilters.status}
              onChange={(e) => setReportFilters(p => ({ ...p, status: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="disbursed">Disbursed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>Designation</label>
            <select
              value={reportFilters.designation}
              onChange={(e) => setReportFilters(p => ({ ...p, designation: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }}
            >
              <option value="ALL">All Designations</option>
              <option value="Manager">Manager</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Telecaller">Telecaller</option>
              <option value="Sales Executive">Sales Executive</option>
              <option value="KYC Operator">KYC Operator</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.textMid, textTransform: 'uppercase', marginBottom: '6px' }}>Search Keyword</label>
            <input
              type="text"
              placeholder="Search Name, Mobile, PAN, Code..."
              value={reportFilters.search}
              onChange={(e) => setReportFilters(p => ({ ...p, search: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgSecondary, color: C.text, fontWeight: 700, fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Live Preview Table Container */}
        {previewData && (
          <div style={{ marginTop: '16px', background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: C.text }}>
                Report Data Preview — Showing {previewData.count || (previewData.data ? previewData.data.length : 0)} Records
              </span>
              <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>
                🔒 Masked Fields: PAN (XXXXXX1234), Aadhaar (XXXX-XXXX-1234), Bank Account (XXXX1234)
              </span>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: C.card, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMid, fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 10px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>ID / Code</th>
                    <th style={{ padding: '8px 10px' }}>Full Name</th>
                    <th style={{ padding: '8px 10px' }}>Mobile</th>
                    <th style={{ padding: '8px 10px' }}>Email</th>
                    <th style={{ padding: '8px 10px' }}>Designation / Role</th>
                    <th style={{ padding: '8px 10px' }}>PAN (Masked)</th>
                    <th style={{ padding: '8px 10px' }}>Status</th>
                    <th style={{ padding: '8px 10px' }}>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(previewData.data) && previewData.data.length > 0 ? (
                    previewData.data.slice(0, 50).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 800 }}>{row.employee_id || row.customer_id || row.app_number || row.partner_code || row.admin_id || `REC-${idx + 1}`}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 800 }}>{row.full_name || row.customer_name || row.name || 'N/A'}</td>
                        <td style={{ padding: '8px 10px' }}>{row.mobile || row.customer_mobile || 'N/A'}</td>
                        <td style={{ padding: '8px 10px', color: C.textMid }}>{row.email || row.customer_email || 'N/A'}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: C.card, padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700 }}>
                            {row.designation || row.role || row.product_name || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: C.teal }}>{row.pan_number || row.pan || 'N/A'}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ 
                            background: (row.status || '').toLowerCase().includes('active') || (row.status || '').toLowerCase().includes('approved') ? '#D1FAE5' : '#FEF3C7', 
                            color: (row.status || '').toLowerCase().includes('active') || (row.status || '').toLowerCase().includes('approved') ? '#059669' : '#D97706',
                            padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800 
                          }}>
                            {(row.status || 'ACTIVE').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: C.textMid }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: C.textMid, fontWeight: 700 }}>
                        No records match the active filter criteria. Click "Download Excel" to generate a full report file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. TOP PERFORMING PARTNERS & EMPLOYEES TABLE */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTrophy style={{ color: '#F59E0B' }} /> Top Performing Partners & Employees
            </h3>
            <p style={{ fontSize: '12px', color: C.textMid, margin: '2px 0 0 0' }}>Leaderboard tracking performance across Partners and Employee Hierarchy (Manager → TL → TC)</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: C.bgSecondary, borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.textMid, fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Rank</th>
                <th style={{ padding: '10px 12px' }}>Partner / Employee</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Role / Designation</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Applications</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Approved</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Incentives / Commission</th>
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
                    <span style={{ 
                      background: e.performerType === 'PARTNER' ? '#EFF6FF' : '#F0FDF4', 
                      color: e.performerType === 'PARTNER' ? '#1D4ED8' : '#15803D',
                      border: `1px solid ${e.performerType === 'PARTNER' ? '#BFDBFE' : '#BBF7D0'}`, 
                      padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800 
                    }}>
                      {e.performerType === 'PARTNER' ? 'Partner' : 'Employee'}
                    </span>
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

    </div>
  );
}
