import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanFace, CheckCircle2 } from 'lucide-react';

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
          background: '#EFF6FF',
          border: '1px solid #DBEAFE',
          color: '#2563EB',
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
            Mark Today's Attendance
          </h2>
          <p style={{
            fontSize: '13.5px',
            color: '#64748B',
            margin: 0,
            lineHeight: 1.4
          }}>
            Verify your identity using secure face verification to mark today's attendance.
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
              padding: '0 24px',
              height: '50px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'background 0.2s ease, transform 0.1s ease'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = '#2563EB'; }}
          >
            <Camera size={18} /> Start Face Verification
          </button>
        ) : !isCheckedOut ? (
          <button
            type="button"
            onClick={onStartVerification}
            disabled={loading}
            style={{
              background: '#F59E0B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0 24px',
              height: '50px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
              transition: 'background 0.2s ease'
            }}
          >
            <Camera size={18} /> Mark Check-Out Verification
          </button>
        ) : (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #BBF7D0',
            color: '#16A34A',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} /> Today's Attendance Completed
          </div>
        )}
      </div>
    </motion.div>
  );
}
