import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Building2, MapPin, User, Clock } from 'lucide-react';

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
  const employeeName = user?.name || user?.full_name || user?.first_name || 'Rahul Sharma';

  // 12 Radiating particle positions around checkmark
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const distance = 48;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: i % 2 === 0 ? '#16C784' : '#42C8FF'
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 15 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '36px 28px 28px',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(22, 199, 132, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E7EAF0',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Central Green Circle & Checkmark + Radiating Particles */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
        {/* Radiating Particles */}
        {particles.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 + idx * 0.02, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '36px',
              left: '36px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: p.color
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16C784 0%, #10B981 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px -5px rgba(22, 199, 132, 0.4)'
          }}
        >
          <Check size={44} strokeWidth={3} />
        </motion.div>
      </div>

      {/* Heading */}
      <h2 style={{
        margin: '0 0 6px',
        fontSize: '22px',
        fontWeight: 800,
        color: '#111827',
        letterSpacing: '-0.3px'
      }}>
        Attendance Marked Successfully!
      </h2>

      <p style={{
        margin: '0 0 24px',
        fontSize: '13.5px',
        color: '#64748B',
        fontWeight: 500
      }}>
        Good morning, <strong style={{ color: '#111827' }}>{employeeName}</strong>
      </p>

      {/* Employee Details Summary Card */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E7EAF0',
        borderRadius: '18px',
        padding: '16px 20px',
        marginBottom: '24px',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={15} style={{ color: '#6D3DF5' }} /> Employee
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
            {employeeName}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E7EAF0', paddingTop: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} style={{ color: '#6D3DF5' }} /> Type
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
            {isCheckIn ? 'Check-In' : 'Check-Out'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E7EAF0', paddingTop: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} style={{ color: '#6D3DF5' }} /> Time
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
            {time}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E7EAF0', paddingTop: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={15} style={{ color: '#6D3DF5' }} /> Office
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
            GharKaPaisa
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E7EAF0', paddingTop: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} style={{ color: '#16C784' }} /> Location
          </span>
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#16C784',
            background: '#E9FBF3',
            padding: '2px 10px',
            borderRadius: '12px'
          }}>
            Verified
          </span>
        </div>
      </div>

      {/* Primary Go to Dashboard Button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          width: '100%',
          height: '50px',
          borderRadius: '14px',
          border: 'none',
          background: 'linear-gradient(135deg, #6D3DF5 0%, #8B6CFF 100%)',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 8px 20px -4px rgba(109, 61, 245, 0.35)',
          transition: 'transform 0.15s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        Go to Dashboard <ArrowRight size={18} />
      </button>
    </motion.div>
  );
}

