import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Hourglass, ArrowLeft, TrendingUp, AlertCircle, Award } from 'lucide-react';

export default function AttendanceSummaryView({
  summary = { present: 0, completed: 0, late: 0, halfDay: 0, leave: 0, absent: 0, total: 0 },
  history = [],
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onBackToDashboard
}) {
  // Ensure history is a valid array regardless of response envelope
  const safeHistory = Array.isArray(history) 
    ? history 
    : (Array.isArray(history?.records) ? history.records : []);

  // Compute metrics from real backend summary & history records
  const totalDays = summary?.total || safeHistory.length || 0;
  const presentDays = summary?.present ?? safeHistory.filter(item => item?.check_in_time).length;
  const completedDays = summary?.completed ?? safeHistory.filter(item => item?.check_in_time && item?.check_out_time).length;
  const lateDays = summary?.late ?? safeHistory.filter(item => (item?.status || '').toUpperCase() === 'LATE').length;
  const halfDays = summary?.halfDay ?? safeHistory.filter(item => (item?.status || '').toUpperCase() === 'HALF_DAY').length;
  const leaveDays = summary?.leave ?? safeHistory.filter(item => (item?.status || '').toUpperCase() === 'LEAVE').length;
  const absentDays = summary?.absent ?? safeHistory.filter(item => (item?.status || '').toUpperCase() === 'ABSENT').length;

  // Calculate total hours
  const calculatedHoursFromHistory = safeHistory.reduce((acc, curr) => {
    if (curr?.total_hours) return acc + Number(curr.total_hours);
    if (curr?.check_in_time && curr?.check_out_time) {
      const diff = (new Date(curr.check_out_time) - new Date(curr.check_in_time)) / (1000 * 60 * 60);
      return acc + (diff > 0 ? diff : 0);
    }
    return acc;
  }, 0);

  const totalHours = summary?.totalHours || summary?.total_hours || calculatedHoursFromHistory;
  const displayHours = summary?.formattedHours && summary.formattedHours !== '0h 0m' 
    ? summary.formattedHours 
    : `${Number(totalHours).toFixed(1)} hrs`;

  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : (presentDays > 0 ? 100 : 0);
  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* Top Header */}
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
              Attendance Summary
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
              Monthly performance and statistics for {monthName}
            </p>
          </div>
        </div>

        {/* Month & Year Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {setSelectedMonth && (
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
          )}

          {setSelectedYear && (
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
          )}

          <div style={{
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            color: '#0B74F6',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Calendar size={15} /> {monthName}
          </div>
        </div>
      </div>

      {/* Modern Fintech Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
        gap: '12px'
      }}>
        {/* Total Attendance Days */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280', fontWeight: 600 }}>Total Days</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#0B74F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            {totalDays}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Recorded days in {monthName}
          </div>
        </div>

        {/* Present Days */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280', fontWeight: 600 }}>Present Days</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#16A34A', letterSpacing: '-0.5px' }}>
            {presentDays}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Logged present sessions
          </div>
        </div>

        {/* Completed Days */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280', fontWeight: 600 }}>Completed Days</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#9333EA', letterSpacing: '-0.5px' }}>
            {completedDays}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Started & ended sessions
          </div>
        </div>

        {/* Total Work Hours */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280', fontWeight: 600 }}>Work Hours</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hourglass size={20} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#D97706', letterSpacing: '-0.5px' }}>
            {displayHours}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Total working duration
          </div>
        </div>

        {/* Attendance Rate */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '16px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280', fontWeight: 600 }}>Attendance %</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#0284C7', letterSpacing: '-0.5px' }}>
            {attendancePct}%
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Monthly attendance score
          </div>
        </div>
      </div>

      {/* Status Breakdown Section */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '18px',
        padding: 'clamp(16px, 4vw, 24px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
          Status & Attendance Breakdown
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#15803D' }}>Present</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>{presentDays}</div>
          </div>

          <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#A16207' }}>Late</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#CA8A04', marginTop: '4px' }}>{lateDays}</div>
          </div>

          <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#854D0E' }}>Half Day</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#A16207', marginTop: '4px' }}>{halfDays}</div>
          </div>

          <div style={{ background: '#EEF2FF', border: '1px solid #E0E7FF', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4338CA' }}>Leave</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#4F46E5', marginTop: '4px' }}>{leaveDays}</div>
          </div>

          <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#B91C1C' }}>Absent</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{absentDays}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
