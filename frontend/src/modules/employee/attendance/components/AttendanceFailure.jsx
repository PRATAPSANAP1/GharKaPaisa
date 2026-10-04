import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, AlertCircle, CameraOff, ShieldAlert, MapPinOff } from 'lucide-react';

export default function AttendanceFailure({
  failureType = 'LIVENESS_FAILED', // 'CAMERA_DENIED' | 'LOCATION_DENIED' | 'LOCATION_MISMATCH' | 'LIVENESS_FAILED' | 'FACE_MISMATCH' | 'SERVICE_UNAVAILABLE' | 'GENERAL'
  errorMessage,
  onRetry,
  onClose
}) {
  // Determine title and description based on failure type or error message
  const getFailureDetails = () => {
    if (failureType === 'CAMERA_DENIED' || errorMessage?.toLowerCase().includes('camera')) {
      return {
        title: 'Camera Access Required',
        description: 'Please allow camera access in your browser settings and try again.',
        icon: <CameraOff size={42} />
      };
    }

    if (
      failureType === 'LOCATION_MISMATCH' ||
      errorMessage?.toLowerCase().includes('location does not match') ||
      errorMessage?.toLowerCase().includes('outside') ||
      errorMessage?.toLowerCase().includes('geofence') ||
      errorMessage?.toLowerCase().includes('building')
    ) {
      return {
        title: 'Building Location Mismatch',
        description: errorMessage || 'Location does not match: You are outside the designated office/building premises.',
        icon: <MapPinOff size={42} />
      };
    }

    if (failureType === 'LOCATION_DENIED' || errorMessage?.toLowerCase().includes('geolocation') || errorMessage?.toLowerCase().includes('location permission')) {
      return {
        title: 'Location Permission Required',
        description: 'Please enable GPS / Location access in your browser or device settings to verify building presence.',
        icon: <MapPinOff size={42} />
      };
    }

    if (failureType === 'FACE_MISMATCH' || errorMessage?.toLowerCase().includes('match') || errorMessage?.toLowerCase().includes('kyc')) {
      return {
        title: 'Face Verification Failed',
        description: 'Your face could not be matched with your registered KYC photo.',
        icon: <ShieldAlert size={42} />
      };
    }

    if (failureType === 'SERVICE_UNAVAILABLE' || errorMessage?.toLowerCase().includes('unavailable') || errorMessage?.toLowerCase().includes('service')) {
      return {
        title: 'Verification Service Temporarily Unavailable',
        description: 'Biometric verification is temporarily unavailable. Please try again.',
        icon: <AlertCircle size={42} />
      };
    }

    // Default Liveness Failed
    return {
      title: 'Liveness Verification Failed',
      description: errorMessage || 'Please try again with your face clearly visible and follow the instructions.',
      icon: <XCircle size={42} />
    };
  };

  const details = getFailureDetails();

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
      {/* Red Circle Icon */}
      <motion.div
        animate={{ x: [0, -6, 6, -4, 4, 0] }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{
          width: '76px',
          height: '76px',
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
        {details.icon}
      </motion.div>

      {/* Title */}
      <h3 style={{
        margin: '0 0 8px',
        fontSize: '22px',
        fontWeight: 700,
        color: '#111827'
      }}>
        {details.title}
      </h3>

      {/* Description */}
      <p style={{
        margin: '0 0 24px',
        fontSize: '14px',
        color: '#6B7280',
        lineHeight: 1.45
      }}>
        {details.description}
      </p>

      {/* Info notice */}
      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '24px',
        fontSize: '13px',
        color: '#991B1B',
        fontWeight: 600,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
        <span>Your attendance has not been marked.</span>
      </div>

      {/* Buttons: Try Again & Cancel */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            height: '48px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            background: '#FFFFFF',
            color: '#374151',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onRetry}
          style={{
            flex: 1.5,
            height: '48px',
            borderRadius: '12px',
            border: 'none',
            background: '#0B74F6',
            color: '#FFFFFF',
            fontSize: '14.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#0963D2'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#0B74F6'; }}
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    </motion.div>
  );
}
