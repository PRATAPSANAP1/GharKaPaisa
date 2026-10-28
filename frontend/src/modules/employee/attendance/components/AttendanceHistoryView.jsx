import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, CheckCircle2, Clock, Download, 
  ShieldCheck, ArrowLeft, BarChart2 
} from 'lucide-react';

export default function AttendanceHistoryView({
  history = [],
  summary = { present: 0, late: 0, absent: 0, total: 0 },
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onExportCSV,
  onBackToDashboard
}) {
  // Ensure history is a valid array regardless of response envelope
  const safeHistory = Array.isArray(history) 
    ? history 
    : (Array.isArray(history?.records) ? history.records : []);

  // Calculate non-duplicated attendance metrics
  const presentCount = summary?.present ?? summary?.totalPresent ?? summary?.present_days ?? safeHistory.filter(item => item.check_in_time).length;
  const totalWorkingDays = summary?.totalWorkingDays ?? summary?.total_working_days ?? summary?.working_days ?? summary?.totalDays ?? summary?.total_days ?? summary?.total ?? 0;
  const attendancePct = typeof summary?.attendancePercentage === 'number'
    ? summary.attendancePercentage
    : typeof summary?.attendance_percentage === 'number'
      ? summary.attendance_percentage
      : (totalWorkingDays > 0 ? Math.round((presentCount / totalWorkingDays) * 100) : (presentCount > 0 ? 100 : 0));

  const workHours = summary?.totalWorkingHoursFormatted || summary?.total_working_hours_formatted || summary?.formattedHours || '0h 0m';

  const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    try {
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDuration = (row) => {
    if (row.duration_formatted && row.duration_formatted !== '--') {
      return row.duration_formatted;
    }
    if (!row.check_in_time || !row.check_out_time) return '--';
    const diff = new Date(row.check_out_time) - new Date(row.check_in_time);
    const totalSecs = Math.max(0, Math.floor(diff / 1000));
    if (totalSecs < 60) return '1 min';
    const mins = Math.floor(totalSecs / 60);
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins === 0 ? `${hours}h` : `${hours}h ${remMins}m`;
  };

  const getStatusBadge = (row) => {
    const rawStatus = (row.status || '').toUpperCase();
    if (rawStatus === 'LATE') {
      return { label: 'Late', bg: '#FEF3C7', color: '#D97706' };
    }
    if (rawStatus === 'HALF_DAY') {
      return { label: 'Half Day', bg: '#FEF9C3', color: '#854D0E' };
    }
    if (rawStatus === 'LEAVE') {
      return { label: 'Leave', bg: '#E0E7FF', color: '#4338CA' };
    }
    if (rawStatus === 'ABSENT') {
      return { label: 'Absent', bg: '#FEE2E2', color: '#DC2626' };
    }

    // Determine whether session is completed, active, or missing checkout
    if (row.check_in_time && row.check_out_time) {
      return { label: 'Present', bg: '#DCFCE7', color: '#16A34A' };
    }

    if (row.check_in_time && !row.check_out_time) {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const rowDateStr = (row.date || row.attendance_date || '').substring(0, 10);
      const isHistorical = rowDateStr && rowDateStr < todayStr;

      if (row.is_missing_checkout || isHistorical) {
        return { label: 'Checkout Missing', bg: '#FEE2E2', color: '#DC2626' };
      }
      return { label: 'Working', bg: '#DBEAFE', color: '#2563EB' };
    }

    return { label: 'Not Started', bg: '#F3F4F6', color: '#6B7280' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* Top Navigation & Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onBackToDashboard}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              color: '#374151',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13.5px',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Attendance History
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
              Past attendance and verification records
            </p>
          </div>
        </div>

        {/* Month, Year and Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              fontSize: '13.5px',
              background: '#FFFFFF',
              color: '#111827',
              fontWeight: 500
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              fontSize: '13.5px',
              background: '#FFFFFF',
              color: '#111827',
              fontWeight: 500
            }}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <button
            type="button"
            onClick={onExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#111827',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards: Clean, non-redundant metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
        gap: '12px'
      }}>
        {/* Total Working Days */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Total Days</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#0B74F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={17} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{totalWorkingDays}</div>
        </div>

        {/* Present Days */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Present</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A' }}>{presentCount}</div>
        </div>

        {/* Work Hours */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Work Hours</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={17} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#9333EA' }}>{workHours}</div>
        </div>

        {/* Attendance % */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Attendance %</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={17} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>{attendancePct}%</div>
        </div>
      </div>

      {/* Records Table / List */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '18px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Desktop Table View */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Start</th>
                <th style={{ padding: '12px 16px' }}>End</th>
                <th style={{ padding: '12px 16px' }}>Duration</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {safeHistory && safeHistory.length > 0 ? (
                safeHistory.map((row, idx) => {
                  const badge = getStatusBadge(row);
                  return (
                    <tr key={row.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827' }}>
                        {formatDate(row.date || row.attendance_date)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#111827' }}>
                        {formatTime(row.check_in_time)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#111827' }}>
                        {formatTime(row.check_out_time)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontWeight: 500 }}>
                        {formatDuration(row)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: '#EFF6FF',
                          color: '#0B74F6',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldCheck size={13} /> {row.verification_status || 'Verified'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#6B7280', fontSize: '14px' }}>
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
