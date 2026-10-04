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
  // Calculate Completed & Attendance % safely from real data
  const completedCount = (Array.isArray(history) ? history : []).filter(item => item.check_in_time && item.check_out_time).length;
  const presentCount = summary.present || (Array.isArray(history) ? history : []).filter(item => item.check_in_time).length;
  const totalDays = summary.total || history.length || 0;
  const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : (presentCount > 0 ? 100 : 0);

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
    if (row.total_hours) return `${row.total_hours} hrs`;
    if (!row.check_in_time || !row.check_out_time) return '--';
    const diff = new Date(row.check_out_time) - new Date(row.check_in_time);
    if (diff <= 0) return '0h 0m';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
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

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        {/* Total Days */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Total Days</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#0B74F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={17} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{totalDays}</div>
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

        {/* Completed Days */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Completed</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={17} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#9333EA' }}>{completedCount}</div>
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
              {history && history.length > 0 ? (
                history.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
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
                        background: row.check_in_time && row.check_out_time ? '#DCFCE7' : row.check_in_time ? '#FEF3C7' : '#F3F4F6',
                        color: row.check_in_time && row.check_out_time ? '#16A34A' : row.check_in_time ? '#D97706' : '#6B7280',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {row.check_in_time && row.check_out_time ? 'Present' : row.check_in_time ? 'Working' : 'Not Started'}
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
                        <ShieldCheck size={13} /> Verified
                      </span>
                    </td>
                  </tr>
                ))
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
