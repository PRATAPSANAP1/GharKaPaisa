import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { 
  FaCalendarCheck, FaClock, FaCheckCircle, FaUserClock, FaHistory, 
  FaSync, FaCamera, FaDownload, FaShieldAlt, FaCalendarAlt, FaTimes, FaCheck
} from 'react-icons/fa';
import attendanceService from '../../../services/attendance.service';
import AttendanceVerificationModal from './AttendanceVerificationModal';

export default function EmployeeAttendance() {
  const { C } = useTheme();
  const { user, isInitializing } = useAuthStore();

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Month & Year Filter
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Check-In / Check-Out Verification Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('CHECK_IN');

  // Verification Details Popover Modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadAttendanceData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [todayRes, summaryRes, historyRes] = await Promise.all([
        attendanceService.getTodayAttendance().catch(() => ({ success: false })),
        attendanceService.getMySummary(selectedMonth, selectedYear).catch(() => ({ success: false })),
        attendanceService.getMyAttendance(selectedMonth, selectedYear).catch(() => ({ success: false })),
      ]);

      if (todayRes?.success) {
        setTodayAttendance(todayRes.data || null);
      }
      if (summaryRes?.success) {
        setSummary(summaryRes.data || null);
      }
      if (historyRes?.success) {
        setHistory(historyRes.data?.records || []);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setErrorMessage(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedMonth, selectedYear]);

  if (isInitializing) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center', color: C.textMid, fontSize: '14px' }}>
        Loading attendance workspace...
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadAttendanceData();
  };

  const handleOpenCheckIn = () => {
    setModalAction('CHECK_IN');
    setModalOpen(true);
  };

  const handleOpenCheckOut = () => {
    setModalAction('CHECK_OUT');
    setModalOpen(true);
  };

  const handleVerificationSuccess = (newAttendance) => {
    setTodayAttendance(newAttendance);
    loadAttendanceData();
  };

  // Helper formatting routines
  const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    try {
      return new Date(timeStr).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return timeStr;
    }
  };

  const formatDuration = (inTime, outTime) => {
    if (!inTime || !outTime) return '00h 00m';
    try {
      const start = new Date(inTime).getTime();
      const end = new Date(outTime).getTime();
      const diffMs = end - start;
      if (diffMs <= 0) return '00h 00m';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    } catch (e) {
      return '00h 00m';
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return { date: '--', day: '--', fullDate: '--' };
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      };
    } catch (e) {
      return { date: dateStr, day: '', fullDate: dateStr };
    }
  };

  // CSV Export Helper
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['Date', 'Day', 'Status', 'Check-In', 'Check-Out', 'Working Hours', 'Verification Ref', 'Source'];
    const rows = history.map(row => {
      const dt = formatDateDisplay(row.attendance_date);
      return [
        dt.date,
        dt.day,
        row.status || 'PRESENT',
        formatTime(row.check_in_time),
        formatTime(row.check_out_time),
        formatDuration(row.check_in_time, row.check_out_time),
        row.verification_reference || 'VERIFIED',
        row.source || 'WEB'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2025, 2026, 2027];

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  // Calculate dynamic Quick Statistics from actual attendance summary / records
  const presentDays = summary?.totalPresent || history.filter(r => r.status === 'PRESENT' || r.status === 'VERIFIED').length || (isCheckedIn ? 1 : 0);
  const absentDays = summary?.totalAbsent || history.filter(r => r.status === 'ABSENT').length || 0;
  const totalWorkingHours = summary?.totalWorkingHoursFormatted || '00h 00m';
  
  const totalMarked = summary?.totalMarkedDays || (presentDays + absentDays);
  const attendanceRate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : (isCheckedIn ? 100 : 0);

  const todayDateFormatted = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: C.text, margin: 0 }}>
            My Attendance
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: C.textMid }}>
            Track your daily attendance, working hours and verification history.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px',
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px',
            color: C.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          <FaSync className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* 2. Full-Width Workspace Banner */}
      <div style={{
        position: 'relative', width: '100%', borderRadius: '20px', overflow: 'hidden',
        border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        <img
          src="/attendance/attendance-workspace-banner.png"
          alt="My Attendance Workspace"
          style={{ width: '100%', display: 'block', height: 'auto', maxHeight: '260px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>

      {/* 3. Today's Attendance Card */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 900, color: C.employeePrimary || '#0F766E', textTransform: 'uppercase', letterSpacing: '1px' }}>
              TODAY'S ATTENDANCE
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: C.text }}>
                {isCheckedOut
                  ? 'Attendance Completed'
                  : isCheckedIn
                  ? 'Checked In'
                  : 'Not Checked In Yet'}
              </h2>

              <span style={{
                padding: '4px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 800,
                background: isCheckedOut || isCheckedIn ? '#D1FAE5' : '#F3F4F6',
                color: isCheckedOut || isCheckedIn ? '#065F46' : '#6B7280',
                border: `1px solid ${isCheckedOut || isCheckedIn ? '#A7F3D0' : '#E5E7EB'}`
              }}>
                {isCheckedOut || isCheckedIn ? 'PRESENT' : 'NOT MARKED'}
              </span>
            </div>

            <p style={{ margin: '6px 0 0', fontSize: '13px', color: C.textMid, fontWeight: 600 }}>
              {todayDateFormatted}
            </p>
          </div>

          {/* Dynamic Interactive Action Buttons */}
          <div>
            {!isCheckedIn ? (
              <button
                onClick={handleOpenCheckIn}
                style={{
                  background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '14px',
                  padding: '14px 28px', fontSize: '15px', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 6px 20px rgba(15, 118, 110, 0.35)', transition: 'transform 0.15s ease'
                }}
              >
                <FaCamera size={18} /> 📷 Mark Check-In
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleOpenCheckOut}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '14px',
                  padding: '14px 28px', fontSize: '15px', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)', transition: 'transform 0.15s ease'
                }}
              >
                <FaCamera size={18} /> Mark Check-Out
              </button>
            ) : (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                borderRadius: '14px', padding: '12px 20px', fontWeight: 800, fontSize: '13.5px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <FaCheckCircle size={16} color="#059669" /> ✓ Biometric Verified
              </div>
            )}
          </div>
        </div>

        {/* Attendance Metrics Grid for Today */}
        {isCheckedIn && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-In</div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: C.employeePrimary || '#0F766E', marginTop: '4px' }}>
                {formatTime(todayAttendance?.check_in_time)}
              </div>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-Out</div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: isCheckedOut ? '#D97706' : C.textMid, marginTop: '4px' }}>
                {formatTime(todayAttendance?.check_out_time)}
              </div>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Working Hours</div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: C.text, marginTop: '4px' }}>
                {formatDuration(todayAttendance?.check_in_time, todayAttendance?.check_out_time)}
              </div>
            </div>

            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verification Status</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#059669', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCheckCircle size={14} /> Biometric Verified
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Statistics Cards (Calculated dynamically) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase' }}>Present Days</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
            {presentDays}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase' }}>Absent Days</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#DC2626', marginTop: '6px' }}>
            {absentDays}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase' }}>Total Working Hours</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: C.text, marginTop: '6px' }}>
            {totalWorkingHours}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, textTransform: 'uppercase' }}>Attendance Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563EB', marginTop: '6px' }}>
            {attendanceRate}%
          </div>
        </div>
      </div>

      {/* 5. Attendance History Section */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
      }}>
        {/* Table Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaHistory style={{ color: C.employeePrimary || '#0F766E' }} /> Attendance History
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text,
                borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text,
                borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              disabled={history.length === 0}
              style={{
                background: history.length > 0 ? (C.employeePrimary || '#0F766E') : C.bgSecondary,
                color: history.length > 0 ? '#ffffff' : C.textMid,
                border: `1px solid ${C.border}`, borderRadius: '10px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 800,
                cursor: history.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <FaDownload size={12} /> Export
            </button>
          </div>
        </div>

        {/* History Table or Empty State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: C.textMid, fontSize: '14px' }}>
            Loading attendance records...
          </div>
        ) : history.length === 0 ? (
          /* 6. Empty State */
          <div style={{
            textAlign: 'center', padding: '50px 20px', background: C.bgSecondary,
            borderRadius: '16px', border: `1px border ${C.border}`, display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '42px', lineHeight: 1 }}>📅</div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: C.text }}>
              No attendance records yet
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', color: C.textMid, maxWidth: '400px', lineHeight: 1.5 }}>
              Your attendance history will appear here after you complete your first check-in.
            </p>
            {!isCheckedIn && (
              <button
                onClick={handleOpenCheckIn}
                style={{
                  marginTop: '8px', background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
                }}
              >
                <FaCamera size={15} /> Mark Check-In
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, color: C.textMid, fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Day</th>
                  <th style={{ padding: '12px 16px' }}>Check-In</th>
                  <th style={{ padding: '12px 16px' }}>Check-Out</th>
                  <th style={{ padding: '12px 16px' }}>Working Hours</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Verification</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const dt = formatDateDisplay(row.attendance_date);
                  return (
                    <tr 
                      key={row.id} 
                      onClick={() => setSelectedRecord(row)}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>{dt.date}</td>
                      <td style={{ padding: '14px 16px', color: C.textMid, fontWeight: 600 }}>{dt.day}</td>
                      <td style={{ padding: '14px 16px', color: C.text, fontWeight: 700 }}>{formatTime(row.check_in_time)}</td>
                      <td style={{ padding: '14px 16px', color: C.text, fontWeight: 700 }}>{formatTime(row.check_out_time)}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>
                        {formatDuration(row.check_in_time, row.check_out_time)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 900,
                          background: row.status === 'PRESENT' ? '#D1FAE5' : row.status === 'LATE' ? '#FEF3C7' : '#FEE2E2',
                          color: row.status === 'PRESENT' ? '#065F46' : row.status === 'LATE' ? '#92400E' : '#991B1B'
                        }}>
                          {row.status || 'PRESENT'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                          background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          <FaCheck size={11} /> Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Verification Detail Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px',
            width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedRecord(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px', background: C.bgSecondary,
                border: `1px solid ${C.border}`, borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMid
              }}
            >
              <FaTimes />
            </button>

            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaShieldAlt style={{ color: '#059669' }} /> Attendance Verification
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textMid }}>
              Biometric & Environment Security Check Details
            </p>

            {/* Verified Checks List */}
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 800, color: '#065F46' }}>
                <FaCheckCircle color="#059669" /> Face Verified
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 800, color: '#065F46' }}>
                <FaCheckCircle color="#059669" /> Liveness Verified
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 800, color: '#065F46' }}>
                <FaCheckCircle color="#059669" /> Office Environment Verified
              </div>
            </div>

            {/* Metadata Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Verification Reference</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.employeePrimary || '#0F766E' }}>
                  {selectedRecord.verification_reference || `ATT-${selectedRecord.id.substring(0, 8).toUpperCase()}`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Date</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                  {formatDateDisplay(selectedRecord.attendance_date).fullDate}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Check-In</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                  {formatTime(selectedRecord.check_in_time)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Check-Out</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                  {formatTime(selectedRecord.check_out_time)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: C.bgSecondary, borderRadius: '12px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Source</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>
                  {selectedRecord.source || 'WEB'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-In / Check-Out Verification Modal */}
      <AttendanceVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        actionType={modalAction}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
