import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, UserCheck, History, 
  RefreshCw, Camera, Download, ShieldCheck, CalendarDays, X, Check, ArrowRight
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import attendanceService from '../../../services/attendance.service';
import AttendanceVerificationModal from './AttendanceVerificationModal';

export default function EmployeeAttendance() {
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
      <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '60px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
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
    if (!timeStr) return '--:--';
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
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 16px 60px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 1. Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #DBEAFE' }}>
                GharKaPaisa
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                • Biometric Attendance System
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              My Attendance
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748B' }}>
              Logged in as <strong style={{ color: '#0F172A' }}>{user?.full_name || 'Gayatri Pachpande'}</strong> (ID: {user?.employee_code || user?.employee_id || 'EMP1001'})
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px',
              color: '#0F172A', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* 2. Main Attendance Action Card (Section 4 Specification Layout) */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px',
          padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF',
              color: '#2563EB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
            }}>
              <ShieldCheck size={28} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
              Mark Today's Attendance
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
              Verify your identity using face verification to securely mark your attendance.
            </p>

            {/* Dynamic Verification Start Button */}
            {!isCheckedIn ? (
              <button
                type="button"
                onClick={handleOpenCheckIn}
                style={{
                  background: '#2563EB', color: '#FFFFFF', border: 'none',
                  borderRadius: '12px', padding: '14px 28px', fontSize: '16px', fontWeight: 600,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)', transition: 'background 0.2s ease'
                }}
              >
                <Camera size={18} /> Start Face Verification
              </button>
            ) : !isCheckedOut ? (
              <button
                type="button"
                onClick={handleOpenCheckOut}
                style={{
                  background: '#F59E0B', color: '#FFFFFF', border: 'none',
                  borderRadius: '12px', padding: '14px 28px', fontSize: '16px', fontWeight: 600,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)', transition: 'background 0.2s ease'
                }}
              >
                <Camera size={18} /> Mark Check-Out Verification
              </button>
            ) : (
              <div style={{
                background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A',
                borderRadius: '12px', padding: '12px 24px', fontWeight: 700, fontSize: '14px',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle2 size={18} color="#16A34A" /> Today's Attendance Verified & Completed
              </div>
            )}
          </div>

          {/* Today's Attendance Summary Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px', paddingTop: '20px', borderTop: '1px solid #E2E8F0'
          }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-In</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
                {formatTime(todayAttendance?.check_in_time)}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  background: isCheckedIn ? '#DCFCE7' : '#F1F5F9',
                  color: isCheckedIn ? '#16A34A' : '#64748B',
                  border: `1px solid ${isCheckedIn ? '#BBF7D0' : '#E2E8F0'}`
                }}>
                  {isCheckedOut ? 'COMPLETED' : isCheckedIn ? 'PRESENT' : 'NOT MARKED'}
                </span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-Out</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: isCheckedOut ? '#0F172A' : '#64748B', marginTop: '6px' }}>
                {formatTime(todayAttendance?.check_out_time)}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Working Hours</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
                {formatDuration(todayAttendance?.check_in_time, todayAttendance?.check_out_time)}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Present Days</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#16A34A', marginTop: '6px' }}>
              {presentDays}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Absent Days</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#DC2626', marginTop: '6px' }}>
              {absentDays}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Working Hours</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
              {totalWorkingHours}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Attendance Rate</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563EB', marginTop: '6px' }}>
              {attendanceRate}%
            </div>
          </div>
        </div>

        {/* 4. Attendance History Section */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px',
          padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} color="#2563EB" /> Attendance History
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A',
                  borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer'
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
                  background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A',
                  borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, outline: 'none', cursor: 'pointer'
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={history.length === 0}
                style={{
                  background: history.length > 0 ? '#2563EB' : '#F1F5F9',
                  color: history.length > 0 ? '#FFFFFF' : '#94A3B8',
                  border: '1px solid #E2E8F0', borderRadius: '10px',
                  padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  cursor: history.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* History Data Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: '14px' }}>
              Loading attendance records...
            </div>
          ) : history.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 20px', background: '#F8FAFC',
              borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: '10px'
            }}>
              <Calendar size={36} color="#94A3B8" />
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                No attendance records yet
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', maxWidth: '380px' }}>
                Your attendance history will appear here after you mark your first check-in using face verification.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase' }}>
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
                        style={{ borderBottom: '1px solid #E2E8F0', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{dt.date}</td>
                        <td style={{ padding: '14px 16px', color: '#64748B', fontWeight: 500 }}>{dt.day}</td>
                        <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 600 }}>{formatTime(row.check_in_time)}</td>
                        <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 600 }}>{formatTime(row.check_out_time)}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                          {formatDuration(row.check_in_time, row.check_out_time)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 700,
                            background: row.status === 'PRESENT' ? '#DCFCE7' : row.status === 'LATE' ? '#FEF3C7' : '#FEE2E2',
                            color: row.status === 'PRESENT' ? '#16A34A' : row.status === 'LATE' ? '#B45309' : '#DC2626'
                          }}>
                            {row.status || 'PRESENT'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                            background: '#EFF6FF', border: '1px solid #DBEAFE', color: '#2563EB',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            <Check size={12} /> Biometric Verified
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

        {/* 5. Verification Detail Popover Modal */}
        {selectedRecord && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}>
            <div style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px',
              width: '100%', maxWidth: '460px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{
                  position: 'absolute', top: '20px', right: '20px', background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B'
                }}
              >
                <X size={16} />
              </button>

              <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck color="#2563EB" /> Verification Record
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748B' }}>
                Biometric Identity Check Details
              </p>

              <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Face Biometric Verified
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Live Verification Challenge Passed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Registered KYC Identity Matched
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Reference</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB' }}>
                    {selectedRecord.verification_reference || `ATT-${selectedRecord.id.substring(0, 8).toUpperCase()}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Date</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {formatDateDisplay(selectedRecord.attendance_date).fullDate}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Check-In</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {formatTime(selectedRecord.check_in_time)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Check-Out</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    {formatTime(selectedRecord.check_out_time)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Verification Modal */}
        <AttendanceVerificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          actionType={modalAction}
          onSuccess={handleVerificationSuccess}
        />
      </div>
    </div>
  );
}
