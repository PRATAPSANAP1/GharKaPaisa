import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceCamera({
  videoRef,
  isCameraActive,
  currentState,
  overlayMessage,
  isMobile
}) {
  const isVerifying = [
    'LIVENESS_IN_PROGRESS',
    'LIVENESS_PASSED',
    'FACE_MATCHING',
    'FACE_MATCHED',
    'ATTENDANCE_SUBMITTING'
  ].includes(currentState);

  const guideColor = isVerifying
    ? '#2563EB'
    : currentState === 'CAMERA_READY'
    ? '#16A34A'
    : '#F59E0B';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isMobile ? '280px' : '360px',
      borderRadius: '16px',
      overflow: 'hidden',
      background: '#0F172A',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)'
        }}
      />

      {/* Dark Vignette Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, transparent 45%, rgba(15, 23, 42, 0.7) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Oval Face Guide Overlay */}
      <motion.div
        animate={{
          scale: [1, 1.015, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          width: '195px',
          height: '255px',
          borderRadius: '50%',
          border: `3px solid ${guideColor}`,
          boxShadow: isVerifying
            ? '0 0 20px rgba(37, 99, 235, 0.5)'
            : '0 0 16px rgba(22, 163, 74, 0.4)',
          pointerEvents: 'none',
          transition: 'border-color 0.3s ease'
        }}
      >
        {/* Corner Accents */}
        <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '22px', height: '22px', borderTop: `4px solid ${guideColor}`, borderLeft: `4px solid ${guideColor}`, borderRadius: '6px 0 0 0' }} />
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '22px', height: '22px', borderTop: `4px solid ${guideColor}`, borderRight: `4px solid ${guideColor}`, borderRadius: '0 6px 0 0' }} />
        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '22px', height: '22px', borderBottom: `4px solid ${guideColor}`, borderLeft: `4px solid ${guideColor}`, borderRadius: '0 0 0 6px' }} />
        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '22px', height: '22px', borderBottom: `4px solid ${guideColor}`, borderRight: `4px solid ${guideColor}`, borderRadius: '0 0 6px 0' }} />
      </motion.div>

      {/* Animated Vertical Laser Line during Liveness / Match */}
      {isVerifying && (
        <motion.div
          animate={{
            top: ['15%', '85%', '15%']
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            height: '2.5px',
            background: 'linear-gradient(90deg, transparent, #2563EB, transparent)',
            boxShadow: '0 0 12px #2563EB',
            pointerEvents: 'none',
            zIndex: 4
          }}
        />
      )}

      {/* Top Left Camera Status Dot */}
      <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 5 }}>
        <span style={{
          background: 'rgba(15, 23, 42, 0.75)',
          color: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          backdropFilter: 'blur(4px)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px'
        }}>
          {isCameraActive ? (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#16A34A',
                boxShadow: '0 0 8px #16A34A'
              }}
            />
          ) : (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#DC2626'
            }} />
          )}
          {isCameraActive ? 'Camera Active' : 'Camera Unavailable'}
        </span>
      </div>

      {/* Bottom Overlay Message */}
      <div style={{ position: 'absolute', bottom: '16px', zIndex: 5, padding: '0 12px', textAlign: 'center' }}>
        <span style={{
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: 600,
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'inline-block'
        }}>
          {overlayMessage || 'Align your face inside the frame'}
        </span>
      </div>
    </div>
  );
}
