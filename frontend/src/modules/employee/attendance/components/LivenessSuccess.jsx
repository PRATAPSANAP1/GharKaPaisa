import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function LivenessSuccess({ onContinue }) {
  useEffect(() => {
    // Auto-proceed to Face Match after brief celebratory delay
    const timer = setTimeout(() => {
      onContinue();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onContinue]);

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
      {/* Green Check Icon */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#DCFCE7',
          color: '#16A34A',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)'
        }}
      >
        <CheckCircle2 size={46} strokeWidth={2.2} />
      </motion.div>

      {/* Title & Subtitle */}
      <h3 style={{
        margin: '0 0 8px',
        fontSize: '22px',
        fontWeight: 700,
        color: '#111827'
      }}>
        Liveness Check Passed!
      </h3>

      <p style={{
        margin: '0 0 28px',
        fontSize: '14.5px',
        color: '#6B7280',
        lineHeight: 1.45
      }}>
        You are verified as a live person.
      </p>

      {/* Continue Button */}
      <button
        type="button"
        onClick={onContinue}
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
          boxShadow: '0 4px 14px rgba(11, 116, 246, 0.25)',
          transition: 'background 0.2s ease'
        }}
      >
        Continue to Face Match <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
