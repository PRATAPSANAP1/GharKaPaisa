import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Hourglass, ArrowLeft, TrendingUp } from 'lucide-react';

export default function AttendanceSummaryView({
  summary = { present: 0, late: 0, absent: 0, total: 0 },
  history = [],
  selectedMonth,
  selectedYear,
  onBackToDashboard
}) {
  // Compute metrics from real backend summary & history records
  const safeHistory = Array.isArray(history) ? history : [];
  const totalDays = summary?.total || safeHistory.length || 0;
  const presentDays = summary?.present || safeHistory.filter(item => item?.check_in_time).length;
  const completedDays = safeHistory.filter(item => item?.check_in_time && item?.check_out_time).length;

  // Calculate total hours
  const totalHours = safeHistory.reduce((acc, curr) => {
    if (curr?.total_hours) return acc + Number(curr.total_hours);
    if (curr?.check_in_time && curr?.check_out_time) {
      const diff = (new Date(curr.check_out_time) - new Date(curr.check_in_time)) / (1000 * 60 * 60);
      return acc + (diff > 0 ? diff : 0);
    }
    return acc;
  }, 0);

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
              Performance and metrics for {monthName}
            </p>
          </div>
        </div>

        <div style={{
          background: '#EFF6FF',
          border: '1px solid #DBEAFE',
          color: '#0B74F6',
          padding: '6px 14px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Calendar size={15} /> This Month ({monthName})
        </div>
      </div>

      {/* Modern Fintech Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Attendance */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Total Attendance</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#0B74F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            {totalDays}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Total scheduled days
          </div>
        </div>

        {/* Present Days */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Present Days</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#16A34A', letterSpacing: '-0.5px' }}>
            {presentDays}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Started work sessions
          </div>
        </div>

        {/* Completed Days */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Completed Days</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#9333EA', letterSpacing: '-0.5px' }}>
            {completedDays}
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Checked in & checked out
          </div>
        </div>

        {/* Total Work Hours */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Total Work Hours</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hourglass size={20} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#D97706', letterSpacing: '-0.5px' }}>
            {totalHours.toFixed(1)} <span style={{ fontSize: '16px', fontWeight: 600, color: '#6B7280' }}>hrs</span>
          </div>
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '4px' }}>
            Logged working duration
          </div>
        </div>
      </div>
    </motion.div>
  );
}
