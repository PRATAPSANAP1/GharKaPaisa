import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export default function IdentityVerificationProgress({
  stage = 'FACE_MATCH', // 'FACE_MATCH' | 'LOCATION_CHECK' | 'COMPLETE_ATTENDANCE'
  actionType = 'CHECK_IN',
  locationStatus = null,
  buildingName = null
}) {
  const isCheckIn = actionType === 'CHECK_IN';

  const steps = [
    {
      num: 1,
      title: 'Face Liveness Check',
      desc: 'Completed',
      status: 'completed'
    },
    {
      num: 2,
      title: 'Face Match',
      desc: stage === 'FACE_MATCH'
        ? 'Verifying with your registered KYC photo...'
        : 'KYC identity matched',
      status: stage === 'FACE_MATCH' ? 'active' : 'completed'
    },
    {
      num: 3,
      title: 'Building Location',
      desc: stage === 'FACE_MATCH'
        ? 'Pending'
        : stage === 'LOCATION_CHECK'
        ? 'Verifying you are within the designated office building...'
        : buildingName
        ? `Verified within ${buildingName}`
        : 'Office building premises verified',
      status: stage === 'FACE_MATCH'
        ? 'pending'
        : stage === 'LOCATION_CHECK'
        ? 'active'
        : 'completed'
    },
    {
      num: 4,
      title: 'Complete Attendance',
      desc: stage === 'COMPLETE_ATTENDANCE'
        ? isCheckIn ? 'Recording your check-in...' : 'Recording your check-out...'
        : 'Pending',
      status: stage === 'COMPLETE_ATTENDANCE' ? 'active' : 'pending'
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
      {/* Title */}
      <h2 style={{
        margin: '0 0 24px',
        fontSize: '22px',
        fontWeight: 700,
        color: '#111827',
        letterSpacing: '-0.3px'
      }}>
        Verifying Identity
      </h2>

      {/* Stepper Progress */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        position: 'relative',
        marginBottom: '12px'
      }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {/* Connecting line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '32px',
                  bottom: '-8px',
                  width: '2px',
                  background: step.status === 'completed' ? '#DCFCE7' : '#E5E7EB',
                  zIndex: 1
                }} />
              )}

              {/* Icon / Circle Indicator */}
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
                  ? '#DCFCE7'
                  : step.status === 'active'
                  ? '#EFF6FF'
                  : '#FFFFFF',
                color: step.status === 'completed'
                  ? '#16A34A'
                  : step.status === 'active'
                  ? '#0B74F6'
                  : '#9CA3AF',
                border: step.status === 'completed'
                  ? '1px solid #BBF7D0'
                  : step.status === 'active'
                  ? '2px solid #0B74F6'
                  : '2px solid #E5E7EB'
              }}>
                {step.status === 'completed' ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : step.status === 'active' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  step.num
                )}
              </div>

              {/* Details */}
              <div style={{ paddingBottom: isLast ? '0' : '22px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: step.status === 'active' ? '#0B74F6' : (step.status === 'completed' ? '#111827' : '#6B7280'),
                  marginBottom: '2px'
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: step.status === 'active' ? '#374151' : '#6B7280',
                  lineHeight: 1.35
                }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
