import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function AttendanceFailure({ errorMessage, onRetry, onClose }) {
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
      {/* Red circle with shake animation */}
      <motion.div
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0] }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#FEE2E2',
          color: '#DC2626',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.15)'
        }}
      >
        <XCircle size={48} />
      </motion.div>

      <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
        Verification Unsuccessful
      </h3>

      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748B', lineHeight: 1.4 }}>
        We couldn't verify your identity. <strong style={{ color: '#DC2626' }}>Your attendance has not been marked.</strong>
      </p>

      {/* Specific error or default guidance box */}
      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '14px',
        padding: '16px 18px',
        margin: '0 auto 24px',
        maxWidth: '400px',
        textAlign: 'left'
      }}>
        {errorMessage ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#991B1B', fontWeight: 600 }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMessage}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B', marginBottom: '6px' }}>
              Please make sure:
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: '#7F1D1D', lineHeight: 1.55 }}>
              <li>Your face is clearly visible</li>
              <li>Lighting is sufficient</li>
              <li>You are looking at the camera</li>
              <li>You are not wearing sunglasses or face covering</li>
              <li>Your face remains inside the frame</li>
            </ul>
          </div>
        )}
      </div>

      {/* Buttons */}
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
