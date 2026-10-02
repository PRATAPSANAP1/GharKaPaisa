import React from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

export default function CameraPermissionState({
  isDenied = false,
  onAllowCamera,
  onRetry,
  onCancel
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '28px 28px 24px',
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        textAlign: 'center'
      }}
    >
      {/* Title */}
      <h2 style={{
        margin: '0 0 24px',
        fontSize: '20px',
        fontWeight: 700,
        color: '#111827'
      }}>
        Face Liveness Check
      </h2>

      {/* Icon */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: isDenied ? '#FEE2E2' : '#EFF6FF',
        color: isDenied ? '#DC2626' : '#0B74F6',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        {isDenied ? <CameraOff size={36} /> : <Camera size={36} />}
      </div>

      {/* Heading & Description */}
      <h3 style={{
        margin: '0 0 8px',
        fontSize: '18px',
        fontWeight: 700,
        color: '#111827'
      }}>
        {isDenied ? 'Camera access is required' : 'We need access to your camera'}
      </h3>

      <p style={{
        margin: '0 0 28px',
        fontSize: '14px',
        color: '#6B7280',
        lineHeight: 1.45,
        maxWidth: '360px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        {isDenied
          ? 'Please allow camera access in your browser settings and try again.'
          : 'Please allow camera access to continue with face verification.'}
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isDenied ? (
          <button
            type="button"
            onClick={onRetry}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)'
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
        ) : (
          <button
            type="button"
            onClick={onAllowCamera}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)'
            }}
          >
            Allow Camera
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            background: '#FFFFFF',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
