import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShieldCheck, Check, Sparkles } from 'lucide-react';

export default function AttendanceSuccess({ verResult, user, onClose }) {
  const isCheckIn = verResult?.action === 'CHECK_IN' || verResult?.action === 'START_WORK';

  const rawTimestamp = isCheckIn
    ? (verResult?.checkInTime || verResult?.timestamp)
    : (verResult?.checkOutTime || verResult?.timestamp);

  const formatTimeAndDate = (ts) => {
    if (!ts) return { time: '--:--', date: '--' };
    const d = new Date(ts);
    return {
      time: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      date: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };
  };

  const { time, date } = formatTimeAndDate(rawTimestamp);

  const calculateDurationStr = (startTs, endTs) => {
    if (verResult?.duration) return verResult.duration;
    if (!startTs || !endTs) return null;
    const diff = new Date(endTs) - new Date(startTs);
    if (diff <= 0) return '0h 0m';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const durationStr = !isCheckIn ? calculateDurationStr(verResult?.checkInTime, verResult?.checkOutTime || verResult?.timestamp) : null;
  const isEnvironmentVerified = verResult?.environmentStatus === 'PASSED' || verResult?.environment_status === 'PASSED';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '36px 28px 28px',
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        textAlign: 'center'
      }}
    >
      {/* Green Checkmark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#DCFCE7',
          color: '#16A34A',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)'
        }}
      >
        <CheckCircle2 size={46} strokeWidth={2.2} />
      </motion.div>

      {/* Heading */}
      <h3 style={{
        margin: '0 0 6px',
        fontSize: '22px',
        fontWeight: 700,
        color: '#111827'
      }}>
        {isCheckIn ? 'Check-In Successful!' : 'Check-Out Successful!'}
      </h3>

      <p style={{
        margin: '0 0 24px',
        fontSize: '14px',
        color: '#6B7280',
        lineHeight: 1.45
      }}>
        Your attendance has been recorded successfully.
      </p>

      {/* Information Card */}
      <div style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '18px 20px',
        marginBottom: '24px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Time row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color="#0B74F6" />
            {isCheckIn ? 'Check-In Time' : 'Check-Out Time'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            {time}, {date}
          </span>
        </div>

        {/* Duration if check-out */}
        {!isCheckIn && durationStr && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280' }}>
              Duration
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0B74F6' }}>
              {durationStr}
            </span>
          </div>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
          <span style={{ fontSize: '13.5px', color: '#6B7280' }}>
            Status
          </span>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#16A34A',
            background: '#DCFCE7',
            padding: '3px 10px',
            borderRadius: '12px'
          }}>
            {isCheckIn ? 'Present (Verified)' : 'Work Completed'}
          </span>
        </div>

        {/* Work Environment row (Only if actually verified by backend) */}
        {isEnvironmentVerified && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
            <span style={{ fontSize: '13.5px', color: '#6B7280' }}>
              Work Environment
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={14} /> Verified
            </span>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '12px',
          border: 'none',
          background: '#0B74F6',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)',
          transition: 'background 0.2s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#0963D2'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#0B74F6'; }}
      >
        Close
      </button>
    </motion.div>
  );
}
