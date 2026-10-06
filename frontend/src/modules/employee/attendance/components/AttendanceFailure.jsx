import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Camera, MapPin, AlertCircle, X, Check, ArrowLeft } from 'lucide-react';

export default function AttendanceFailure({
  failureType = 'LIVENESS_FAILED', // 'CAMERA_DENIED' | 'LOCATION_DENIED' | 'LOCATION_MISMATCH' | 'LIVENESS_FAILED' | 'FACE_MISMATCH' | 'SERVICE_UNAVAILABLE' | 'GENERAL'
  errorMessage,
  onRetry,
  onClose
}) {
  const isCameraError = failureType === 'CAMERA_DENIED' || errorMessage?.toLowerCase().includes('camera');
  const isLocationMismatch = failureType === 'LOCATION_MISMATCH' || 
    errorMessage?.toLowerCase().includes('location does not match') || 
    errorMessage?.toLowerCase().includes('outside') || 
    errorMessage?.toLowerCase().includes('geofence');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 15 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '32px 28px 28px',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(255, 77, 94, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E7EAF0',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* SCREEN 10: CAMERA PERMISSION REQUIRED */}
      {isCameraError ? (
        <>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: '#F2EEFF',
              color: '#6D3DF5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '2px dashed #8B6CFF'
            }}
          >
            <Camera size={38} />
          </motion.div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            Camera Permission Required
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
            Please allow camera access to verify your identity.
          </p>

          <button
            type="button"
            onClick={onRetry}
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
              marginBottom: '12px'
            }}
          >
            <Camera size={18} /> Enable Camera
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '14px',
              border: '1px solid #E7EAF0',
              background: '#FFFFFF',
              color: '#64748B',
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </>
      ) : isLocationMismatch ? (
        /* SCREEN 9: LOCATION DOESN'T MATCH */
        <>
          <motion.div
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#FFF0F2',
              color: '#FF4D5E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 8px 24px -4px rgba(255, 77, 94, 0.25)'
            }}
          >
            <MapPin size={40} />
          </motion.div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            Location doesn't match
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
            You must be inside the GharKaPaisa office to mark attendance.
          </p>

          {/* Current vs Required Location Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E7EAF0',
            borderRadius: '18px',
            padding: '14px 16px',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Your current location</div>
                <div style={{ fontSize: '13px', color: '#FF4D5E', fontWeight: 700 }}>Outside office area</div>
              </div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFF0F2', color: '#FF4D5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E7EAF0', paddingTop: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Required location</div>
                <div style={{ fontSize: '13px', color: '#16C784', fontWeight: 700 }}>GharKaPaisa Office</div>
              </div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E9FBF3', color: '#16C784', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '14px',
              border: 'none',
              background: '#FF4D5E',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px -4px rgba(255, 77, 94, 0.35)'
            }}
          >
            <RefreshCw size={18} /> Try Again
          </button>
        </>
      ) : failureType === 'FACE_MISMATCH' || errorMessage?.toLowerCase().includes('match') && errorMessage?.toLowerCase().includes('kyc') ? (
        /* SCREEN: FACE MISMATCH WITH REGISTERED PHOTO */
        <>
          <motion.div
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#FFF0F2',
              color: '#FF4D5E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 8px 24px -4px rgba(255, 77, 94, 0.25)'
            }}
          >
            <AlertCircle size={40} />
          </motion.div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            Face Match Failed
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
            {errorMessage || 'Your face could not be matched with your registered KYC photo.'}
          </p>

          <div style={{
            background: '#FFF0F2',
            border: '1px solid #FFD1D6',
            borderRadius: '18px',
            padding: '14px 16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>
              Verification Guidelines:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#7F1D1D', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Ensure the registered employee is in front of the camera</li>
              <li>Remove glasses, hat, or face coverings</li>
              <li>Face the camera directly in clear lighting</li>
              <li>Contact HR/Admin if your profile photo needs updating</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onRetry}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '14px',
              border: 'none',
              background: '#FF4D5E',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px -4px rgba(255, 77, 94, 0.35)'
            }}
          >
            <RefreshCw size={18} /> Try Again
          </button>
        </>
      ) : (
        /* SCREEN 8: FACE NOT DETECTED / LIVENESS FAILED */
        <>
          <motion.div
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#FFF0F2',
              color: '#FF4D5E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 8px 24px -4px rgba(255, 77, 94, 0.25)'
            }}
          >
            <AlertCircle size={40} />
          </motion.div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#111827' }}>
            Face not detected
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
            {errorMessage || 'Liveness verification failed. Please align face inside the frame and retry.'}
          </p>

          {/* Tips Checklist */}
          <div style={{
            background: '#FFF0F2',
            border: '1px solid #FFD1D6',
            borderRadius: '18px',
            padding: '14px 16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', marginBottom: '8px' }}>
              Tips for better detection:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#7F1D1D', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Keep your face centered</li>
              <li>Ensure good lighting</li>
              <li>Remove sunglasses or mask</li>
              <li>Hold still and look at the camera</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onRetry}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '14px',
              border: 'none',
              background: '#FF4D5E',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px -4px rgba(255, 77, 94, 0.35)'
            }}
          >
            <RefreshCw size={18} /> Try Again
          </button>
        </>
      )}
    </motion.div>
  );
}

