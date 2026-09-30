import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export default function AttendanceSecurityCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24, ease: 'easeOut' }}
      style={{
        background: '#EFF6FF',
        border: '1px solid #DBEAFE',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: '#2563EB',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <ShieldCheck size={20} />
      </div>

      <div>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#0F172A',
          margin: '0 0 2px 0'
        }}>
          Secure Face Verification
        </h4>
        <p style={{
          fontSize: '13px',
          color: '#64748B',
          margin: 0,
          lineHeight: 1.4
        }}>
          Your identity is verified using live biometric verification before attendance is recorded.
        </p>
      </div>
    </motion.div>
  );
}
