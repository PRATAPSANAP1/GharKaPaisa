import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LivenessAnalysis() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '36px 28px',
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        textAlign: 'center'
      }}
    >
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
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
          padding: '4px 10px',
          borderRadius: '12px'
        }}>
          1 of 4
        </span>
      </div>

      {/* Progress Animation */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px 0 28px'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            border: '4px solid #E5E7EB',
            borderTopColor: '#0B74F6',
            borderRightColor: '#16A34A',
            marginBottom: '20px'
          }}
        />

        <h3 style={{
          margin: '0 0 8px',
          fontSize: '20px',
          fontWeight: 700,
          color: '#111827'
        }}>
          Analyzing...
        </h3>

        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6B7280',
          lineHeight: 1.45
        }}>
          Verifying that you are a real person...
        </p>
      </div>

      {/* Animated subtle progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: '#F3F4F6',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, #0B74F6, #16A34A)',
            borderRadius: '3px'
          }}
        />
      </div>
    </motion.div>
  );
}
