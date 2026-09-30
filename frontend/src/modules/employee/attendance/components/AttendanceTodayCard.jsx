import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceTodayCard({ todayAttendance }) {
  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  const formatTime = (timeStr) => {
    if (!timeStr) return '--';
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
        margin: '0 0 18px 0'
      }}>
        Today's Attendance
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {/* CHECK-IN */}
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
            Check-In
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: isCheckedIn ? '#0F172A' : '#64748B',
            marginTop: '6px'
          }}>
            {formatTime(todayAttendance?.check_in_time)}
          </div>
        </div>

        {/* STATUS */}
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
            Status
          </div>
          <div style={{ marginTop: '8px' }}>
            {isCheckedIn ? (
              <span style={{
                background: '#DCFCE7',
                color: '#16A34A',
                border: '1px solid #BBF7D0',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-block'
              }}>
                {isCheckedOut ? 'Completed' : 'Present'}
              </span>
            ) : (
              <span style={{
                background: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FDE68A',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-block'
              }}>
                Not Marked
              </span>
            )}
          </div>
        </div>

        {/* CHECK-OUT */}
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
            Check-Out
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: isCheckedOut ? '#0F172A' : '#64748B',
            marginTop: '6px'
          }}>
            {formatTime(todayAttendance?.check_out_time)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
