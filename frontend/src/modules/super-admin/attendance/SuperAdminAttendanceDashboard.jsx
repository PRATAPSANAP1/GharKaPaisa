import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import LoadingLogo from '../../../components/Loader/LoadingLogo';
import { 
  FaCalendarAlt, FaSearch, FaFilter, FaUsers, FaUserCheck, 
  FaClock, FaUserTimes, FaExclamationTriangle, FaInfoCircle, 
  FaSync, FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight,
  FaShieldAlt, FaDesktop, FaMapMarkerAlt, FaEye, FaUserClock, FaBuilding,
  FaFileDownload, FaFileCsv, FaFileExcel, FaRedo
} from 'react-icons/fa';
import api from '../../../services/api';

export default function SuperAdminAttendanceDashboard() {
  const { C, isDark } = useTheme();

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Tabs: 'today' | 'history' | 'reports'
  const [activeTab, setActiveTab] = useState('today');

  // Filter States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Data States
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [todayData, setTodayData] = useState({
    date: '',
    summary: {
      totalEmployees: 0,
      totalPresent: 0,
      totalLate: 0,
      totalHalfDay: 0,
      totalLeave: 0,
      totalNotMarked: 0,
    },
    departments: [],
    pagination: { totalRecords: 0, currentPage: 1, totalPages: 1, limit: 20 },
    records: [],
  });

  const [historyData, setHistoryData] = useState({
    startDate: '',
    endDate: '',
    summary: {
      totalRecords: 0,
      totalPresent: 0,
      totalLate: 0,
      totalHalfDay: 0,
      totalLeave: 0,
      totalWorkingHoursFormatted: '0h 0m',
    },
    pagination: { totalRecords: 0, currentPage: 1, totalPages: 1, limit: 20 },
    records: [],
  });

  const [reportsData, setReportsData] = useState({
    startDate: '',
    endDate: '',
    summary: {
      total_records: 0,
      present_count: 0,
      late_count: 0,
      half_day_count: 0,
      leave_count: 0,
      absent_count: 0,
      total_working_duration: '0h 0m',
    },
    departments: [],
    pagination: { page: 1, limit: 25, total: 0, total_pages: 1 },
    data: [],
  });

  // Modal State for Detailed Employee Attendance
  const [selectedEmpDetail, setSelectedEmpDetail] = useState(null);
  const [empModalData, setEmpModalData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Today's Attendance
  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/admin/today', {
        params: {
          date: selectedDate,
          search: debouncedSearch,
          status: statusFilter,
          department: departmentFilter,
          page,
          limit,
        },
      });

      if (res.data?.success) {
        setTodayData(res.data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch today attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, debouncedSearch, statusFilter, departmentFilter, page, limit]);

  // Fetch History Attendance
  const fetchHistoryAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/admin/history', {
        params: {
          startDate,
          endDate,
          search: debouncedSearch,
          status: statusFilter,
          department: departmentFilter,
          page,
          limit,
        },
      });

      if (res.data?.success) {
        setHistoryData(res.data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, debouncedSearch, statusFilter, departmentFilter, page, limit]);

  // Fetch Reports Attendance
  const fetchReportsAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/admin/reports', {
        params: {
          start_date: startDate,
          end_date: endDate,
          search: debouncedSearch,
          status: statusFilter,
          department: departmentFilter,
          source: sourceFilter,
          page,
          limit,
        },
      });

      if (res.data?.success) {
        setReportsData(res.data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch attendance reports:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, debouncedSearch, statusFilter, departmentFilter, sourceFilter, page, limit]);

  // Trigger API calls on tab/filter change
  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayAttendance();
    } else if (activeTab === 'history') {
      fetchHistoryAttendance();
    } else if (activeTab === 'reports') {
      fetchReportsAttendance();
    }
  }, [activeTab, fetchTodayAttendance, fetchHistoryAttendance, fetchReportsAttendance]);

  // Handle Export CSV/Excel
  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = await api.get('/attendance/admin/reports/export', {
        params: {
          format,
          start_date: startDate,
          end_date: endDate,
          search: debouncedSearch,
          status: statusFilter,
          department: departmentFilter,
          source: sourceFilter,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${startDate}-to-${endDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export attendance report:', err);
    } finally {
      setExporting(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setDepartmentFilter('ALL');
    setSourceFilter('ALL');
    const d = new Date();
    setEndDate(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().split('T')[0]);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setPage(1);
  };

  // Handle Employee Detail View
  const handleOpenEmpDetail = async (record) => {
    setSelectedEmpDetail(record);
    setLoadingModal(true);
    try {
      const empId = record.employee_code || record.employee_id || record.employee_uuid;
      const res = await api.get(`/attendance/admin/employee/${empId}`);
      if (res.data?.success) {
        setEmpModalData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch employee attendance details:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  // Helper formatting time strings
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '-';
    }
  };

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Status Badge Rendering
  const renderStatusBadge = (status) => {
    const s = String(status || 'NOT_MARKED').toUpperCase();
    let bg = C.border;
    let color = C.text;
    let icon = null;
    let label = s.replace('_', ' ');

    switch (s) {
      case 'PRESENT':
        bg = 'rgba(16, 185, 129, 0.15)';
        color = '#10B981';
        icon = <FaCheckCircle size={11} />;
        break;
      case 'LATE':
        bg = 'rgba(245, 158, 11, 0.15)';
        color = '#F59E0B';
        icon = <FaClock size={11} />;
        break;
      case 'HALF_DAY':
        bg = 'rgba(239, 68, 68, 0.15)';
        color = '#F97316';
        icon = <FaUserClock size={11} />;
        break;
      case 'LEAVE':
        bg = 'rgba(139, 92, 246, 0.15)';
        color = '#8B5CF6';
        icon = <FaUserTimes size={11} />;
        break;
      case 'ABSENT':
        bg = 'rgba(239, 68, 68, 0.15)';
        color = '#EF4444';
        icon = <FaTimesCircle size={11} />;
        break;
      case 'NOT_MARKED':
      default:
        bg = isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6';
        color = C.textLight;
        icon = <FaInfoCircle size={11} />;
        label = 'NOT MARKED';
        break;
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 800,
        background: bg,
        color: color,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        whiteSpace: 'nowrap'
      }}>
        {icon}
        {label}
      </span>
    );
  };

  // Active dataset getters based on tab
  const getActiveRecords = () => {
    if (activeTab === 'today') return todayData.records || [];
    if (activeTab === 'history') return historyData.records || [];
    return reportsData.data || [];
  };

  const getActivePagination = () => {
    if (activeTab === 'today') {
      return {
        currentPage: todayData.pagination?.currentPage || 1,
        totalPages: todayData.pagination?.totalPages || 1,
        totalRecords: todayData.pagination?.totalRecords || 0,
      };
    }
    if (activeTab === 'history') {
      return {
        currentPage: historyData.pagination?.currentPage || 1,
        totalPages: historyData.pagination?.totalPages || 1,
        totalRecords: historyData.pagination?.totalRecords || 0,
      };
    }
    return {
      currentPage: reportsData.pagination?.page || 1,
      totalPages: reportsData.pagination?.total_pages || 1,
      totalRecords: reportsData.pagination?.total || 0,
    };
  };

  const getDepartmentsList = () => {
    const list = todayData.departments || reportsData.departments || [];
    return Array.from(new Set(list)).sort();
  };

  const records = getActiveRecords();
  const activePagination = getActivePagination();
  const departments = getDepartmentsList();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: C.card,
        padding: '20px 24px',
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${C.teal} 0%, #059669 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '20px', boxShadow: `0 4px 12px ${C.teal}35`
            }}>
              <FaCalendarAlt />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>
                Super Admin Attendance Dashboard
              </h1>
              <p style={{ fontSize: '13px', color: C.textLight, margin: '2px 0 0 0' }}>
                Authoritative employee attendance monitoring, verification history & report exports (Asia/Kolkata)
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => { setActiveTab('today'); setPage(1); }}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'today' ? C.teal : C.inputBg,
              color: activeTab === 'today' ? '#fff' : C.text,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'today' ? `0 4px 12px ${C.teal}30` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <FaClock /> Today's Overview
          </button>

          <button
            onClick={() => { setActiveTab('history'); setPage(1); }}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'history' ? C.teal : C.inputBg,
              color: activeTab === 'history' ? '#fff' : C.text,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'history' ? `0 4px 12px ${C.teal}30` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <FaCalendarAlt /> History
          </button>

          <button
            onClick={() => { setActiveTab('reports'); setPage(1); }}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'reports' ? C.teal : C.inputBg,
              color: activeTab === 'reports' ? '#fff' : C.text,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'reports' ? `0 4px 12px ${C.teal}30` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <FaFileDownload /> Reports & Export
          </button>

          <button
            onClick={() => {
              if (activeTab === 'today') fetchTodayAttendance();
              else if (activeTab === 'history') fetchHistoryAttendance();
              else fetchReportsAttendance();
            }}
            title="Refresh Data"
            style={{
              padding: '9px',
              borderRadius: '10px',
              border: `1px solid ${C.border}`,
              background: C.card,
              color: C.text,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaSync className={loading ? 'fa-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── METRIC CARDS OVERVIEW ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
        gap: '14px'
      }}>
        {/* Total Employees / Total Records */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>
              {activeTab === 'today' ? 'TOTAL EMPLOYEES' : 'TOTAL RECORDS'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${C.teal}15`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUsers size={14} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: C.text }}>
            {activeTab === 'today' 
              ? (todayData.summary?.totalEmployees ?? 0)
              : activeTab === 'history'
              ? (historyData.summary?.totalRecords ?? 0)
              : (reportsData.summary?.total_records ?? 0)}
          </div>
          <span style={{ fontSize: '11px', color: C.textLight }}>
            {activeTab === 'today' ? 'Active System Population' : 'Filtered Attendance Logs'}
          </span>
        </div>

        {/* Present */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#10B981', letterSpacing: '0.5px' }}>
              PRESENT
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserCheck size={14} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981' }}>
            {activeTab === 'today'
              ? (todayData.summary?.totalPresent ?? 0)
              : activeTab === 'history'
              ? (historyData.summary?.totalPresent ?? 0)
              : (reportsData.summary?.present_count ?? 0)}
          </div>
          <span style={{ fontSize: '11px', color: C.textLight }}>Verified Check-Ins</span>
        </div>

        {/* Late */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#F59E0B', letterSpacing: '0.5px' }}>
              LATE
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaClock size={14} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#F59E0B' }}>
            {activeTab === 'today'
              ? (todayData.summary?.totalLate ?? 0)
              : activeTab === 'history'
              ? (historyData.summary?.totalLate ?? 0)
              : (reportsData.summary?.late_count ?? 0)}
          </div>
          <span style={{ fontSize: '11px', color: C.textLight }}>Late Arrivals</span>
        </div>

        {/* Half Day */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#F97316', letterSpacing: '0.5px' }}>
              HALF DAY
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserClock size={14} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#F97316' }}>
            {activeTab === 'today'
              ? (todayData.summary?.totalHalfDay ?? 0)
              : activeTab === 'history'
              ? (historyData.summary?.totalHalfDay ?? 0)
              : (reportsData.summary?.half_day_count ?? 0)}
          </div>
          <span style={{ fontSize: '11px', color: C.textLight }}>Partial Shifts</span>
        </div>

        {/* Leave */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#8B5CF6', letterSpacing: '0.5px' }}>
              LEAVE
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserTimes size={14} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#8B5CF6' }}>
            {activeTab === 'today'
              ? (todayData.summary?.totalLeave ?? 0)
              : activeTab === 'history'
              ? (historyData.summary?.totalLeave ?? 0)
              : (reportsData.summary?.leave_count ?? 0)}
          </div>
          <span style={{ fontSize: '11px', color: C.textLight }}>Approved Absence</span>
        </div>

        {/* Not Marked / Working Hours */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>
              {activeTab === 'today' ? 'NOT MARKED' : 'WORKING DURATION'}
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${C.border}`, color: C.textMid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaInfoCircle size={14} />
            </div>
          </div>
          <div style={{ fontSize: activeTab === 'today' ? '24px' : '20px', fontWeight: 900, color: C.text }}>
            {activeTab === 'today'
              ? (todayData.summary?.totalNotMarked ?? 0)
              : activeTab === 'history'
              ? (historyData.summary?.totalWorkingHoursFormatted || '0h 0m')
              : (reportsData.summary?.total_working_duration || '0h 0m')}
          </div>
          <span style={{ fontSize: '11px', color: C.textLight }}>
            {activeTab === 'today' ? 'Pending Check-In' : 'Aggregated Duration'}
          </span>
        </div>
      </div>

      {/* ── CONTROLS & FILTER BAR ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
        padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : activeTab === 'reports' ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
          gap: '14px'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '13px' }} />
            <input
              type="text"
              placeholder="Search name, code, email, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                background: C.inputBg,
                color: C.text,
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Date Picker (Today Tab) or Start-End Date (History / Reports Tab) */}
          {activeTab === 'today' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  fontSize: '12px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: C.textLight }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  fontSize: '12px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                background: C.inputBg,
                color: C.text,
                fontSize: '13px',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">Leave</option>
              <option value="NOT_MARKED">Not Marked</option>
            </select>
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>Dept:</label>
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: `1px solid ${C.border}`,
                background: C.inputBg,
                color: C.text,
                fontSize: '13px',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Source Filter (Only on Reports Tab) */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, whiteSpace: 'nowrap' }}>Source:</label>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                <option value="ALL">All Sources</option>
                <option value="WEB">Web Platform</option>
                <option value="MOBILE">Mobile App</option>
              </select>
            </div>
          )}
        </div>

        {/* Export & Reset Action Toolbar (Reports Tab) */}
        {activeTab === 'reports' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${C.border}`,
            paddingTop: '12px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => fetchReportsAttendance()}
                disabled={loading}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${C.teal}`,
                  background: C.teal,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaFilter size={11} /> Apply Filters
              </button>

              <button
                onClick={handleResetFilters}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaRedo size={11} /> Reset
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                }}
              >
                <FaFileCsv size={13} /> {exporting ? 'Exporting...' : 'Export CSV'}
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)'
                }}
              >
                <FaFileExcel size={13} /> {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN ATTENDANCE TABLE ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px',
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <LoadingLogo message="Fetching attendance records..." />
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: C.textLight }}>
            <FaUserTimes size={44} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, margin: '0 0 4px 0' }}>
              No Attendance Records Found
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              No employee records match the selected date, status or search parameters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>EMPLOYEE</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>DEPT & DESIGNATION</th>
                  {activeTab !== 'today' && (
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>DATE</th>
                  )}
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>CHECK-IN</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>CHECK-OUT</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>DURATION</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>VERIFICATION</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>ENVIRONMENT</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: C.textLight, letterSpacing: '0.5px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row, idx) => (
                  <tr 
                    key={row.attendance_id || row.employee_id || row.employee_code || idx}
                    style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s ease' }}
                  >
                    {/* Employee Profile */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: `${C.teal}20`, color: C.teal,
                          fontWeight: 900, fontSize: '14px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {(row.employee_name || row.full_name) ? (row.employee_name || row.full_name)[0].toUpperCase() : 'E'}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.text }}>
                            {row.employee_name || row.full_name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: C.teal, fontWeight: 700 }}>
                            {row.employee_code || row.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                        {row.department || 'General'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: C.textLight }}>
                        {row.designation || 'Employee'}
                      </div>
                    </td>

                    {/* History / Report Date */}
                    {activeTab !== 'today' && (
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: C.text }}>
                        {formatDateReadable(row.date || row.attendance_date)}
                      </td>
                    )}

                    {/* Check In */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: row.check_in_time ? C.text : C.textLight }}>
                        {formatTime(row.check_in_time)}
                      </div>
                      {row.source && (
                        <span style={{ fontSize: '10.5px', color: C.textLight, textTransform: 'uppercase' }}>
                          via {row.source}
                        </span>
                      )}
                    </td>

                    {/* Check Out */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: row.check_out_time ? C.text : C.textLight }}>
                      {formatTime(row.check_out_time)}
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: C.text }}>
                      {row.duration_display || row.duration || '-'}
                    </td>

                    {/* Verification Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {row.verification_status === 'VERIFIED' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '11px', fontWeight: 800, color: '#10B981',
                            background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px',
                            width: 'fit-content'
                          }}>
                            <FaShieldAlt size={10} /> VERIFIED
                          </span>
                          {row.verification_reference && (
                            <span style={{ fontSize: '10px', color: C.textLight, fontFamily: 'monospace' }}>
                              {row.verification_reference}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: C.textLight }}>-</span>
                      )}
                    </td>

                    {/* Office Environment */}
                    <td style={{ padding: '14px 16px' }}>
                      {(row.environment_code || row.matched_environment_code) ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '11.5px', fontWeight: 700, color: C.textMid
                        }}>
                          <FaBuilding size={11} color={C.teal} />
                          {row.environment_code || row.matched_environment_code}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: C.textLight }}>-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      {renderStatusBadge(row.status || row.attendance_status)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEmpDetail(row)}
                        title="View Full Attendance Details"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${C.border}`,
                          background: C.inputBg,
                          color: C.text,
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <FaEye size={12} color={C.teal} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SERVER-SIDE PAGINATION FOOTER ── */}
        {activePagination.totalPages > 1 && (
          <div style={{
            padding: '14px 20px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: C.card
          }}>
            <span style={{ fontSize: '13px', color: C.textLight, fontWeight: 600 }}>
              Page {activePagination.currentPage} of {activePagination.totalPages} ({activePagination.totalRecords} total records)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={activePagination.currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: activePagination.currentPage <= 1 ? C.textLight : C.text,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: activePagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FaChevronLeft size={10} /> Previous
              </button>

              <button
                disabled={activePagination.currentPage >= activePagination.totalPages}
                onClick={() => setPage(p => Math.min(activePagination.totalPages, p + 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: activePagination.currentPage >= activePagination.totalPages ? C.textLight : C.text,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: activePagination.currentPage >= activePagination.totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── EMPLOYEE DETAILED ATTENDANCE MODAL ── */}
      {selectedEmpDetail && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: '20px', width: '100%', maxWidth: '720px',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0 }}>
                  Employee Attendance Details
                </h2>
                <span style={{ fontSize: '12.5px', color: C.teal, fontWeight: 700 }}>
                  {(selectedEmpDetail.employee_name || selectedEmpDetail.full_name)} ({(selectedEmpDetail.employee_code || selectedEmpDetail.employee_id)})
                </span>
              </div>
              <button
                onClick={() => { setSelectedEmpDetail(null); setEmpModalData(null); }}
                style={{
                  background: 'none', border: 'none', color: C.textLight,
                  fontSize: '20px', cursor: 'pointer', fontWeight: 900
                }}
              >
                ✕
              </button>
            </div>

            {loadingModal ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingLogo message="Loading employee monthly records..." />
              </div>
            ) : empModalData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Employee Profile Header Card */}
                <div style={{
                  background: C.inputBg, borderRadius: '12px', padding: '16px',
                  display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 800, display: 'block' }}>DESIGNATION</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{empModalData.employee.designation || '-'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 800, display: 'block' }}>DEPARTMENT</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{empModalData.employee.department || '-'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 800, display: 'block' }}>LOCATION</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{empModalData.employee.work_location || 'Head Office'}</span>
                  </div>
                </div>

                {/* Monthly Summary Box */}
                <div style={{
                  background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: '12px', padding: '16px',
                  display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: C.teal, fontWeight: 800, display: 'block' }}>DAYS PRESENT</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>{empModalData.summary.totalPresent}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 800, display: 'block' }}>LATE DAYS</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>{empModalData.summary.totalLate}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 800, display: 'block' }}>LEAVES</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>{empModalData.summary.totalLeave}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 800, display: 'block' }}>TOTAL WORKING TIME</span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: C.teal }}>{empModalData.summary.totalWorkingHoursFormatted}</span>
                  </div>
                </div>

                {/* Monthly Logs Table */}
                <div style={{ marginTop: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text, marginBottom: '10px' }}>
                    Recent Attendance Log
                  </h3>
                  {empModalData.records.length === 0 ? (
                    <p style={{ fontSize: '13px', color: C.textLight }}>No attendance records found for this month.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: C.inputBg, borderBottom: `1px solid ${C.border}` }}>
                            <th style={{ padding: '8px 10px', color: C.textLight }}>Date</th>
                            <th style={{ padding: '8px 10px', color: C.textLight }}>Check-In</th>
                            <th style={{ padding: '8px 10px', color: C.textLight }}>Check-Out</th>
                            <th style={{ padding: '8px 10px', color: C.textLight }}>Verification Reference</th>
                            <th style={{ padding: '8px 10px', color: C.textLight }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empModalData.records.map((r) => (
                            <tr key={r.attendance_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: C.text }}>{formatDateReadable(r.attendance_date)}</td>
                              <td style={{ padding: '8px 10px', color: C.text }}>{formatTime(r.check_in_time)}</td>
                              <td style={{ padding: '8px 10px', color: C.text }}>{formatTime(r.check_out_time)}</td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: C.textLight }}>{r.verification_reference || '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{renderStatusBadge(r.attendance_status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : null}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => { setSelectedEmpDetail(null); setEmpModalData(null); }}
                style={{
                  padding: '8px 18px', borderRadius: '8px', border: `1px solid ${C.border}`,
                  background: C.inputBg, color: C.text, fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
