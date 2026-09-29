import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../app/store/authStore';
import { isAttendanceEnabled } from '../../../config/attendanceRollout';
import AttendanceComingSoon from './AttendanceComingSoon';
import { 
  FaCalendarCheck, FaClock, FaCheckCircle, FaUserClock, FaHistory, 
  FaSync, FaExclamationCircle, FaShieldAlt, FaCamera
} from 'react-icons/fa';
import attendanceService from '../../../services/attendance.service';
import AttendanceVerificationModal from './AttendanceVerificationModal';
import axios from 'axios';
import { getApiV1Url } from '../../../config/api';

export default function EmployeeAttendance() {
  const { C } = useTheme();
  const { user, isInitializing } = useAuthStore();

  const [profileEmployee, setProfileEmployee] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('CHECK_IN');

  // Fetch employee profile if user state doesn't have employee_id directly
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get(`${getApiV1Url()}/employee/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.success && res.data?.data?.employee && isMounted) {
            setProfileEmployee(res.data.data.employee);
          }
        }
      } catch (err) {
        // Fallback silently if fetch error
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  // Determine effective employee code
  const employeeCode = user?.employee_id || 
                       user?.emp_code || 
                       user?.employee_code || 
                       profileEmployee?.employee_id || 
                       profileEmployee?.emp_code || 
                       '';

  const hasAttendanceAccess = isAttendanceEnabled(employeeCode);

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
    // Only load attendance APIs if employee code is verified and allowed
    if (hasAttendanceAccess) {
      loadAttendanceData();
    }
  }, [hasAttendanceAccess, selectedMonth, selectedYear]);

  // If auth or profile is still initializing, show clean loading state
  if (isInitializing || profileLoading) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center', color: C.textMid, fontSize: '14px' }}>
        Loading attendance workspace...
      </div>
    );
  }

  // ROLLOUT ACCESS GATE: If employee code is NOT CAND10001 (or missing/unapproved), render Coming Soon Page
  if (!hasAttendanceAccess) {
    return <AttendanceComingSoon />;
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

  // Format Helper
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
    if (!inTime || !outTime) return '--';
    try {
      const start = new Date(inTime).getTime();
      const end = new Date(outTime).getTime();
      const diffMs = end - start;
      if (diffMs <= 0) return '--';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m`;
    } catch (e) {
      return '--';
    }
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCalendarCheck style={{ color: C.employeePrimary || '#0F766E' }} /> My Attendance Workspace
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.textMid }}>
            Face & Office Environment Biometric Verification Attendance (Asia/Kolkata Business Hours)
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px',
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
            color: C.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          <FaSync className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Action Banner & Today's Overview */}
      <div style={{
        background: `linear-gradient(135deg, ${C.card} 0%, ${C.bgSecondary} 100%)`,
        border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: C.employeePrimary || '#0F766E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TODAY'S ATTENDANCE STATUS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: C.text }}>
                {isCheckedOut
                  ? 'Attendance Completed Today'
                  : isCheckedIn
                  ? 'Checked In — Active Session'
                  : 'Not Checked In Yet'}
              </h2>
              <span style={{
                padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 800,
                background: isCheckedOut ? '#D1FAE5' : isCheckedIn ? '#FEF3C7' : '#F3F4F6',
                color: isCheckedOut ? '#065F46' : isCheckedIn ? '#92400E' : '#4B5563'
              }}>
                {isCheckedOut ? 'COMPLETED' : isCheckedIn ? 'PRESENT' : 'NOT MARKED'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {!isCheckedIn ? (
              <button
                onClick={handleOpenCheckIn}
                style={{
                  background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '14px',
                  padding: '14px 28px', fontSize: '15px', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 16px rgba(15, 118, 110, 0.35)'
                }}
              >
                <FaCamera size={18} /> Mark Check-In
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleOpenCheckOut}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '14px',
                  padding: '14px 28px', fontSize: '15px', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 16px rgba(217, 119, 6, 0.35)'
                }}
              >
                <FaCamera size={18} /> Mark Check-Out
              </button>
            ) : (
              <div style={{
                background: '#D1FAE5', border: '1px solid #A7F3D0', color: '#065F46',
                borderRadius: '14px', padding: '12px 20px', fontWeight: 800, fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <FaCheckCircle size={18} /> Attendance Marked for Today
              </div>
            )}
          </div>
        </div>

        {/* 4 Cards Row for Today */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, marginBottom: '6px' }}>Check-In Time</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: isCheckedIn ? (C.employeePrimary || '#0F766E') : C.textMid }}>
              {formatTime(todayAttendance?.check_in_time)}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, marginBottom: '6px' }}>Check-Out Time</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: isCheckedOut ? '#D97706' : C.textMid }}>
              {formatTime(todayAttendance?.check_out_time)}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, marginBottom: '6px' }}>Working Duration</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: C.text }}>
              {formatDuration(todayAttendance?.check_in_time, todayAttendance?.check_out_time)}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700, marginBottom: '6px' }}>Verification Ref</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {todayAttendance?.verification_reference || 'VERIFIED'}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Statistics */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Total Days Present</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
              {summary.totalPresent} <span style={{ fontSize: '13px', fontWeight: 600 }}>Days</span>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Late Arrivals</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#F59E0B', marginTop: '6px' }}>
              {summary.totalLate} <span style={{ fontSize: '13px', fontWeight: 600 }}>Days</span>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Half Days</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#6366F1', marginTop: '6px' }}>
              {summary.totalHalfDay} <span style={{ fontSize: '13px', fontWeight: 600 }}>Days</span>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: C.textMid, fontWeight: 700 }}>Total Working Time</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.text, marginTop: '6px' }}>
              {summary.totalWorkingHoursFormatted || '0h 0m'}
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Section */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        {/* Table Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaHistory style={{ color: C.employeePrimary || '#0F766E' }} /> Attendance History
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMid }}>
              View monthly check-in/out records and biometric verification logs
            </p>
          </div>

          {/* Month & Year Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text,
                borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, outline: 'none'
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
                borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, outline: 'none'
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMid }}>
            Loading attendance records...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.textMid, fontSize: '14px' }}>
            No attendance records found for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, color: C.textMid, fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Check-In</th>
                  <th style={{ padding: '12px 16px' }}>Check-Out</th>
                  <th style={{ padding: '12px 16px' }}>Duration</th>
                  <th style={{ padding: '12px 16px' }}>Source</th>
                  <th style={{ padding: '12px 16px' }}>Verification Ref</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: C.text }}>
                      {new Date(row.attendance_date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', weekday: 'short'
                      })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                        background: row.status === 'PRESENT' ? '#D1FAE5' : row.status === 'LATE' ? '#FEF3C7' : '#FEE2E2',
                        color: row.status === 'PRESENT' ? '#065F46' : row.status === 'LATE' ? '#92400E' : '#991B1B'
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.text }}>{formatTime(row.check_in_time)}</td>
                    <td style={{ padding: '14px 16px', color: C.text }}>{formatTime(row.check_out_time)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: C.text }}>
                      {formatDuration(row.check_in_time, row.check_out_time)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                        background: C.bgSecondary, border: `1px solid ${C.border}`, color: C.text
                      }}>
                        {row.source || 'WEB'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.employeePrimary || '#0F766E', fontWeight: 700 }}>
                      {row.verification_reference || 'VERIFIED'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Camera Modal */}
      <AttendanceVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        actionType={modalAction}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}
