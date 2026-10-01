import React from 'react';
import { motion } from 'framer-motion';
import { Play, LogOut, CheckCircle2, ScanFace } from 'lucide-react';

export default function AttendanceMainCard({ onStartVerification, isCheckedIn, isCheckedOut, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: isCheckedIn && !isCheckedOut ? '#FEF3C7' : isCheckedOut ? '#DCFCE7' : '#EFF6FF',
          border: `1px solid ${isCheckedIn && !isCheckedOut ? '#FDE68A' : isCheckedOut ? '#BBF7D0' : '#DBEAFE'}`,
          color: isCheckedIn && !isCheckedOut ? '#D97706' : isCheckedOut ? '#16A34A' : '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ScanFace size={26} />
        </div>

        <div>
          <h2 style={{
            fontSize: '19px',
            fontWeight: 700,
            color: '#0F172A',
            margin: '0 0 4px 0'
          }}>
            {!isCheckedIn ? 'Start Your Work Session' : !isCheckedOut ? 'Work Session In Progress' : 'Work Session Completed'}
          </h2>
          <p style={{
            fontSize: '13.5px',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.4
          }}>
            {!isCheckedIn
              ? 'Verify your identity using biometric face verification to start work for today.'
              : !isCheckedOut
              ? 'Your work session is active. Complete face verification when you are ready to end work.'
              : 'You have successfully completed both Start Work and End Work sessions for today.'}
          </p>
        </div>
      </div>

      <div>
        {!isCheckedIn ? (
          <button
            type="button"
            onClick={onStartVerification}
            disabled={loading}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0 28px',
              height: '50px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = '#2563EB'; }}
          >
            <Play size={18} fill="#FFFFFF" /> START WORK
          </button>
        ) : !isCheckedOut ? (
          <button
            type="button"
            onClick={onStartVerification}
            disabled={loading}
            style={{
              background: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0 28px',
              height: '50px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#C2410C'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = '#EA580C'; }}
          >
            <LogOut size={18} /> END WORK
          </button>
        ) : (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #BBF7D0',
            color: '#16A34A',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} /> Work Completed
          </div>
        )}
      </div>
    </motion.div>
  );
}
