import React from 'react';
import { motion } from 'framer-motion';
import { CameraOff, RefreshCw } from 'lucide-react';

export default function CameraPermissionError({ onRetry, onClose }) {
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
        background: '#FEE2E2',
        color: '#DC2626',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <CameraOff size={44} />
      </div>

      <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
        Camera Access Required
      </h3>

      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748B', lineHeight: 1.4 }}>
        Camera access is required for face verification and attendance.
      </p>

      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '16px',
        margin: '0 auto 24px',
        maxWidth: '400px',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          Instructions:
        </div>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#64748B', lineHeight: 1.6 }}>
          <li>Allow camera access in your browser permissions.</li>
          <li>Return to this page.</li>
          <li>Try verification again.</li>
        </ol>
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
