import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AttendanceServiceUnavailable({ onRetry, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#FEF3C7',
        color: '#F59E0B',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)'
      }}>
        <AlertTriangle size={44} />
      </div>

      <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
        Verification Service Unavailable
      </h3>

      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748B', lineHeight: 1.4 }}>
        Live biometric verification is temporarily unavailable.
      </p>

      <div style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '14px',
        padding: '14px 16px',
        margin: '0 auto 24px',
        maxWidth: '400px',
        fontSize: '13px',
        color: '#92400E',
        fontWeight: 600
      }}>
        ⚠️ Your attendance has NOT been marked. Please try again shortly.
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            maxWidth: '160px',
            height: '48px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onRetry}
          style={{
            flex: 1.5,
            maxWidth: '220px',
            height: '48px',
            borderRadius: '12px',
            border: 'none',
            background: '#2563EB',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
          }}
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    </motion.div>
  );
}
