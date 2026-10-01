import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AttendanceSuccess({ verResult, user, onClose }) {
  const isCheckIn = verResult?.action === 'CHECK_IN' || verResult?.action === 'START_WORK';
  
  const timestampToDisplay = isCheckIn
    ? (verResult?.checkInTime || verResult?.timestamp)
    : (verResult?.checkOutTime || verResult?.timestamp);

  const timeDisplay = timestampToDisplay
    ? new Date(timestampToDisplay).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '--:--';

  const dateDisplay = verResult?.attendanceDate
    ? new Date(verResult.attendanceDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '36px 28px',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid #E2E8F0'
      }}
    >
      {/* Circle Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: isCheckIn ? '#DCFCE7' : '#FFEDD5',
          color: isCheckIn ? '#16A34A' : '#EA580C',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: isCheckIn ? '0 4px 20px rgba(22, 163, 74, 0.2)' : '0 4px 20px rgba(234, 88, 12, 0.2)'
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <CheckCircle2 size={48} />
        </motion.div>
      </motion.div>

      {/* Title & Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
          {isCheckIn ? 'Work Started Successfully!' : 'Work Ended Successfully!'}
        </h3>

        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748B', lineHeight: 1.4 }}>
          {isCheckIn
            ? 'Your identity has been verified and your work session has officially started.'
            : 'Your identity has been verified and your work session has ended for today.'}
        </p>
      </motion.div>

      {/* Time Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        style={{
          background: isCheckIn ? '#DCFCE7' : '#FFEDD5',
          border: `1px solid ${isCheckIn ? '#BBF7D0' : '#FDBA74'}`,
          borderRadius: '16px',
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto 20px',
          textAlign: 'left'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: isCheckIn ? '#166534' : '#9A3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isCheckIn ? 'Start Work Time' : 'End Work Time'}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: isCheckIn ? '#14532D' : '#7C2D12', margin: '4px 0 2px' }}>
          {timeDisplay}
        </div>
        <div style={{ fontSize: '13px', color: isCheckIn ? '#15803D' : '#C2410C', fontWeight: 500 }}>
          {dateDisplay}
        </div>
      </motion.div>

      {/* Employee Info & Security Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.55 }}
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '14px 16px',
          maxWidth: '400px',
          margin: '0 auto 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748B', fontWeight: 500 }}>Employee</span>
          <strong style={{ color: '#0F172A' }}>{user?.full_name || 'Employee'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748B', fontWeight: 500 }}>Employee ID</span>
          <strong style={{ color: '#0F172A' }}>{user?.employee_code || user?.employee_id || '--'}</strong>
        </div>
        <div style={{
          paddingTop: '8px',
          borderTop: '1px solid #E2E8F0',
          fontSize: '12px',
          color: '#16A34A',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={14} color="#16A34A" /> Verified using secure biometric verification
        </div>
      </motion.div>

      {/* Done button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            maxWidth: '240px',
            height: '48px',
            borderRadius: '12px',
            border: 'none',
            background: isCheckIn ? '#2563EB' : '#EA580C',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: isCheckIn ? '0 4px 14px rgba(37, 99, 235, 0.3)' : '0 4px 14px rgba(234, 88, 12, 0.3)'
          }}
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}
