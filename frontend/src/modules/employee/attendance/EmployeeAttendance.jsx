import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Download, Clock, CheckCircle2, XCircle, 
  AlertCircle, ShieldCheck, ChevronRight, UserCheck
} from 'lucide-react';
import useAuthStore from '../../../app/store/authStore';
import attendanceService from '../../../services/attendance.service';

import AttendanceHeader from './components/AttendanceHeader';
import AttendanceMainCard from './components/AttendanceMainCard';
import AttendanceTodayCard from './components/AttendanceTodayCard';
import AttendanceSecurityCard from './components/AttendanceSecurityCard';
import AttendanceVerificationModal from './AttendanceVerificationModal';

export default function EmployeeAttendance() {
  const user = useAuthStore((state) => state.user);

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('CHECK_IN');

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes, summaryRes] = await Promise.allSettled([
        attendanceService.getTodayAttendance(),
        attendanceService.getMyAttendance(selectedMonth, selectedYear),
        attendanceService.getMySummary(selectedMonth, selectedYear)
      ]);

      if (todayRes.status === 'fulfilled' && todayRes.value) {
        setTodayAttendance(todayRes.value.data || todayRes.value);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value) {
        setHistory(historyRes.value.data || historyRes.value || []);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        const s = summaryRes.value.data || summaryRes.value;
        setSummary({
          present: s.present_days || s.present || 0,
          late: s.late_days || s.late || 0,
          absent: s.absent_days || s.absent || 0,
          total: s.total_days || s.total || 0
        });
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  const handleStartVerification = () => {
    if (!isCheckedIn) {
      setActionType('CHECK_IN');
    } else {
      setActionType('CHECK_OUT');
    }
    setIsModalOpen(true);
  };

  const handleVerificationSuccess = () => {
    fetchAttendanceData();
  };

  const exportCSV = () => {
    if (!history || history.length === 0) return;
    const headers = ['Date', 'Status', 'Start Work Time', 'End Work Time', 'Total Duration', 'Biometric Status'];
    const rows = history.map(item => [
      item.date ? new Date(item.date).toLocaleDateString('en-IN') : '--',
      item.check_in_time && item.check_out_time ? 'Work Completed' : item.check_in_time ? 'Working' : 'Not Started',
      item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString('en-IN') : '--',
      item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString('en-IN') : '--',
      item.total_hours ? `${item.total_hours} hrs` : '--',
      item.verification_status || 'VERIFIED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1280px',
      margin: '0 auto',
      background: '#F8FAFC',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* 1. Header */}
      <AttendanceHeader />

      {/* 2. Main Attendance Action Card */}
      <AttendanceMainCard
        onStartVerification={handleStartVerification}
        isCheckedIn={isCheckedIn}
        isCheckedOut={isCheckedOut}
        loading={loading}
      />

      {/* 3. Today's Attendance Summary Card */}
      <AttendanceTodayCard todayAttendance={todayAttendance} />

      {/* 4. Security Information Card */}
      <AttendanceSecurityCard />

      {/* 5. Summary Statistics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Total Days</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>{summary.total || 0}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Present Days</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A' }}>{summary.present || 0}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Late Arrivals</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>{summary.late || 0}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Absent Days</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626' }}>{summary.absent || 0}</div>
        </div>
      </motion.div>

      {/* 6. Attendance Logs Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.36, ease: 'easeOut' }}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Attendance History</h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>View past attendance records and verification status.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', background: '#FFFFFF', color: '#0F172A' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2026, i, 1).toLocaleString('en-IN', { month: 'long' })}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', background: '#FFFFFF', color: '#0F172A' }}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>

            <button
              type="button"
              onClick={exportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Start Work Time</th>
                <th style={{ padding: '12px 16px' }}>End Work Time</th>
                <th style={{ padding: '12px 16px' }}>Total Duration</th>
                <th style={{ padding: '12px 16px' }}>Verification Method</th>
              </tr>
            </thead>
            <tbody>
              {history && history.length > 0 ? (
                history.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                      {row.date ? new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: row.check_in_time && row.check_out_time ? '#DCFCE7' : row.check_in_time ? '#FEF3C7' : '#F1F5F9',
                        color: row.check_in_time && row.check_out_time ? '#16A34A' : row.check_in_time ? '#D97706' : '#64748B',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {row.check_in_time && row.check_out_time ? 'Work Completed' : row.check_in_time ? 'Working' : 'Not Started'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0F172A' }}>
                      {row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0F172A' }}>
                      {row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {row.total_hours ? `${row.total_hours} hrs` : '--'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: '#EFF6FF',
                        color: '#2563EB',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <ShieldCheck size={12} /> Live Face Verified
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748B', fontSize: '13.5px' }}>
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Verification Modal */}
      <AttendanceVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleVerificationSuccess}
        actionType={actionType}
        user={user}
      />
    </div>
  );
}
