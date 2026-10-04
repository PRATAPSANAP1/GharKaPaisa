import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AttendanceVerificationStepper({
  onContinue,
  onClose,
  actionType = 'CHECK_IN'
}) {
  const isCheckIn = actionType === 'CHECK_IN';

  const steps = [
    {
      num: 1,
      title: 'Face Liveness Check',
      desc: 'Prove you are a real person',
      status: 'active'
    },
    {
      num: 2,
      title: 'Face Match',
      desc: 'Match with your registered KYC photo',
      status: 'pending'
    },
    {
      num: 3,
      title: 'Building Location',
      desc: 'Verify you are within the designated office building',
      status: 'pending'
    },
    {
      num: 4,
      title: 'Complete Attendance',
      desc: isCheckIn ? 'Record your check-in attendance' : 'Record your check-out attendance',
      status: 'pending'
    }
  ];

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
        border: '1px solid #E5E7EB'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.3px'
          }}>
            Verify Your Identity
          </h2>
          <p style={{
            margin: '4px 0 0',
            fontSize: '13.5px',
            color: '#6B7280',
            lineHeight: 1.4
          }}>
            Complete the verification steps to mark your attendance.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close verification modal"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#111827'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Stepper List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        marginBottom: '28px',
        position: 'relative'
      }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {/* Vertical connecting line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '32px',
                  bottom: '-8px',
                  width: '2px',
                  background: '#E5E7EB',
                  zIndex: 1
                }} />
              )}

              {/* Step indicator circle */}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                zIndex: 2,
                marginTop: '2px',
                marginRight: '16px',
                background: step.status === 'completed'
                  ? '#16A34A'
                  : step.status === 'active'
                  ? '#0B74F6'
                  : '#FFFFFF',
                color: step.status === 'completed' || step.status === 'active'
                  ? '#FFFFFF'
                  : '#9CA3AF',
                border: step.status === 'completed' || step.status === 'active'
                  ? 'none'
                  : '2px solid #E5E7EB'
              }}>
                {step.status === 'completed' ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : (
                  step.num
                )}
              </div>

              {/* Step description */}
              <div style={{ paddingBottom: isLast ? '0' : '22px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: step.status === 'active' ? '#111827' : '#374151',
                  marginBottom: '2px'
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: 1.35
                }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onContinue}
        style={{
          width: '100%',
          height: '50px',
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
          boxShadow: '0 4px 16px rgba(11, 116, 246, 0.25)',
          transition: 'background 0.2s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#0963D2'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#0B74F6'; }}
      >
        Continue <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
