import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react-liveness/styles.css';
import { ShieldCheck, Camera, Sparkles, AlertCircle } from 'lucide-react';

export default function LivenessState({
  sessionId,
  region,
  livenessConfig,
  onAnalysisComplete,
  onError,
  onUserCancel,
  isMobile
}) {
  // Custom display text dictionary for AWS Amplify Face Liveness
  const customDisplayText = {
    photosensitivityWarningHeadingText: 'Photosensitivity Warning',
    photosensitivityWarningBodyText: 'This check flashes colored lights to verify live presence. Use caution if you are photosensitive.',
    photosensitivityWarningLabelText: 'Photosensitivity Warning',
    instructionsHeaderLabelText: 'Face Positioning Instructions',
    instructionsLabelText: 'Center your face inside the circle/oval frame and hold still when prompted.',
    cameraMinimallySupportedLabelText: 'Camera is active and ready.',
    startContourLabelText: 'Move forward into the circle & center your face',
    recordingIndicatorLabelText: 'Live verification in progress...',
    cancelLivenessCheckText: 'Cancel Verification',
    tryAgainText: 'Try Again',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: isMobile ? '16px 14px' : '24px 24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Inject custom CSS overrides for AWS Amplify UI Liveness */}
      <style>{`
        /* Amplify Liveness Container Overrides */
        .amplify-liveness-detector {
          width: 100% !important;
          min-height: 380px !important;
          background: #FFFFFF !important;
          border-radius: 20px !important;
          overflow-y: auto !important;
          box-shadow: inset 0 0 0 1px #E7EAF0 !important;
        }

        .amplify-liveness-start-screen {
          padding: 20px 16px !important;
          color: #111827 !important;
          background: #FFFFFF !important;
          border-radius: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          overflow-y: auto !important;
          max-height: 100% !important;
        }

        .amplify-liveness-start-screen-warning {
          background: #FFF7E8 !important;
          border: 1px solid #F5A623 !important;
          border-radius: 14px !important;
          padding: 12px 16px !important;
          color: #B45309 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }

        .amplify-liveness-start-screen-instructions {
          color: #475569 !important;
          font-size: 13.5px !important;
          line-height: 1.5 !important;
        }

        /* Prominent Start Video Button */
        .amplify-liveness-start-screen .amplify-button--primary,
        .amplify-liveness-detector .amplify-button--primary,
        .amplify-liveness-start-screen button,
        .amplify-liveness-detector button.amplify-button {
          background: linear-gradient(135deg, #6D3DF5 0%, #8B6CFF 100%) !important;
          color: #FFFFFF !important;
          border: none !important;
          border-radius: 14px !important;
          padding: 14px 20px !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          width: 100% !important;
          cursor: pointer !important;
          box-shadow: 0 8px 20px -4px rgba(109, 61, 245, 0.35) !important;
          margin-top: 12px !important;
          margin-bottom: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 10 !important;
          transition: transform 0.15s ease, box-shadow 0.15s ease !important;
        }

        .amplify-liveness-start-screen .amplify-button--primary:hover,
        .amplify-liveness-detector .amplify-button--primary:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 10px 24px -4px rgba(109, 61, 245, 0.45) !important;
        }

        /* Camera Select Dropdown */
        .amplify-liveness-start-screen select,
        .amplify-select {
          background: #F8FAFC !important;
          color: #111827 !important;
          border: 1px solid #E7EAF0 !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          font-size: 13.5px !important;
          width: 100% !important;
        }

        /* Video Stream & Oval Styling */
        .amplify-liveness-video-canvas-container {
          border-radius: 20px !important;
          overflow: hidden !important;
          position: relative !important;
        }

        .amplify-liveness-oval {
          stroke: #6D3DF5 !important;
          stroke-width: 4 !important;
          filter: drop-shadow(0px 0px 16px rgba(109, 61, 245, 0.6)) !important;
        }

        .amplify-liveness-oval--matched {
          stroke: #16C784 !important;
          filter: drop-shadow(0px 0px 18px rgba(22, 199, 132, 0.8)) !important;
        }

        .amplify-liveness-instruction-overlay {
          background: rgba(17, 24, 39, 0.85) !important;
          color: #FFFFFF !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          border-radius: 20px !important;
          padding: 8px 18px !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25) !important;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: '#EFF6FF',
            color: '#0B74F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera size={18} />
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: '#111827'
            }}>
              Face Liveness Check
            </h2>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
              Live Biometric Verification
            </span>
          </div>
        </div>

        <span style={{
          fontSize: '12px',
          fontWeight: 800,
          color: '#0B74F6',
          background: '#EFF6FF',
          border: '1px solid #DBEAFE',
          padding: '3px 10px',
          borderRadius: '12px'
        }}>
          1 of 4
        </span>
      </div>

      {/* Center Guidance Hint Banner */}
      <div style={{
        background: '#F0F9FF',
        border: '1px solid #BAE6FD',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12.5px',
        color: '#0369A1',
        fontWeight: 600
      }}>
        <Sparkles size={18} style={{ color: '#0284C7', flexShrink: 0 }} />
        <span>
          Click <strong>"Start video"</strong> below, then align your face within the center circle/oval when the camera activates.
        </span>
      </div>

      {/* AWS FaceLivenessDetector Component */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: isMobile ? '380px' : '440px',
        maxHeight: isMobile ? '65vh' : 'auto',
        borderRadius: '16px',
        overflowY: 'auto',
        background: '#0F172A',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        marginBottom: '14px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <FaceLivenessDetector
          sessionId={sessionId}
          region={region}
          onAnalysisComplete={onAnalysisComplete}
          onError={onError}
          onUserCancel={onUserCancel}
          config={livenessConfig}
          displayText={customDisplayText}
          disableStartScreen={false}
        />
      </div>

      {/* Bottom Footer Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid #F3F4F6'
      }}>
        {/* Progress Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0B74F6' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E5E7EB' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E5E7EB' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E5E7EB' }} />
        </div>

        <button
          type="button"
          onClick={onUserCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6B7280',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#111827'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#6B7280'; }}
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
