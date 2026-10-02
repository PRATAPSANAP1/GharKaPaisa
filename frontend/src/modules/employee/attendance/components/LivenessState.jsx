import React from 'react';
import { motion } from 'framer-motion';
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react-liveness/styles.css';

export default function LivenessState({
  sessionId,
  region,
  livenessConfig,
  onAnalysisComplete,
  onError,
  onUserCancel,
  isMobile
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
        padding: isMobile ? '20px 16px 18px' : '26px 26px 22px',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '19px',
          fontWeight: 700,
          color: '#111827'
        }}>
          Face Liveness Check
        </h2>

        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#0B74F6',
          background: '#EFF6FF',
          border: '1px solid #DBEAFE',
          padding: '3px 10px',
          borderRadius: '12px'
        }}>
          1 of 4
        </span>
      </div>

      {/* Camera Frame Wrapping Real AWS FaceLivenessDetectorCore */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: isMobile ? '380px' : '440px',
        maxHeight: isMobile ? '460px' : '520px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#0F172A',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          minHeight: isMobile ? '380px' : '440px'
        }}>
          <FaceLivenessDetectorCore
            sessionId={sessionId}
            region={region}
            onAnalysisComplete={onAnalysisComplete}
            onError={onError}
            onUserCancel={onUserCancel}
            config={livenessConfig}
          />
        </div>
      </div>

      {/* Bottom Progress Dots (● ○ ○ ○) & Cancel Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
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
            fontSize: '14px',
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
