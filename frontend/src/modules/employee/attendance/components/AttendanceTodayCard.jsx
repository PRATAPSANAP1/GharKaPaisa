import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, LogOut, CheckCircle2 } from 'lucide-react';

export default function AttendanceTodayCard({ todayAttendance }) {
  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      return new Date(timeStr).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeStr;
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '--';
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      if (diffMs <= 0) return '0h 0m';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    } catch (e) {
      return '--';
    }
  };

  const workStatus = !isCheckedIn
    ? 'Not Started'
    : !isCheckedOut
    ? 'Working'
    : 'Work Completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
      }}
    >
      <h3 style={{
        fontSize: '17px',
        fontWeight: 700,
        color: '#0F172A',
        margin: '0 0 18px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Clock size={18} color="#2563EB" /> Today's Work Summary
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {/* START WORK TIME */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Play size={12} color="#2563EB" /> Start Work Time
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: isCheckedIn ? '#0F172A' : '#94A3B8',
            marginTop: '6px'
          }}>
            {formatTime(todayAttendance?.check_in_time)}
          </div>
        </div>

        {/* WORK SESSION STATUS */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Work Session Status
          </div>
          <div style={{ marginTop: '8px' }}>
            {!isCheckedIn ? (
              <span style={{
                background: '#F1F5F9',
                color: '#64748B',
                border: '1px solid #E2E8F0',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-block'
              }}>
                Not Started
              </span>
            ) : !isCheckedOut ? (
              <span style={{
                background: '#FEF3C7',
                color: '#D97706',
                border: '1px solid #FDE68A',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-block'
              }}>
                ⚡ Working
              </span>
            ) : (
              <span style={{
                background: '#DCFCE7',
                color: '#16A34A',
                border: '1px solid #BBF7D0',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-block'
              }}>
                ✓ Work Completed
              </span>
            )}
          </div>
        </div>

        {/* END WORK TIME */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <LogOut size={12} color="#EA580C" /> End Work Time
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: isCheckedOut ? '#0F172A' : '#94A3B8',
            marginTop: '6px'
          }}>
            {formatTime(todayAttendance?.check_out_time)}
          </div>
        </div>

        {/* TOTAL WORK DURATION */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Total Work Duration
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: isCheckedIn && isCheckedOut ? '#2563EB' : '#94A3B8',
            marginTop: '6px'
          }}>
            {calculateDuration(todayAttendance?.check_in_time, todayAttendance?.check_out_time)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
