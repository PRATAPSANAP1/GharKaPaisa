import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanFace, UserCheck, CalendarCheck, Check, X } from 'lucide-react';

export default function AttendanceVerificationSteps({ currentState }) {
  // Determine status of each step: 'pending' | 'active' | 'completed' | 'failed'
  const getStepStatus = (stepIndex) => {
    // Step 1: Camera Setup & Liveness Session
    if (stepIndex === 1) {
      if (['LIVENESS_ACTIVE', 'VERIFYING_RESULTS', 'ATTENDANCE_SUBMITTING', 'SUCCESS'].includes(currentState)) {
        return 'completed';
      }
      if (['LIVENESS_INITIATING'].includes(currentState)) return 'active';
      if (['CAMERA_PERMISSION_DENIED', 'CAMERA_ERROR'].includes(currentState)) return 'failed';
      return 'pending';
    }

    // Step 2: Live Verification (AWS Face Liveness)
    if (stepIndex === 2) {
      if (['VERIFYING_RESULTS', 'ATTENDANCE_SUBMITTING', 'SUCCESS'].includes(currentState)) {
        return 'completed';
      }
      if (['LIVENESS_ACTIVE'].includes(currentState)) return 'active';
      if (currentState === 'VERIFICATION_FAILED') return 'failed';
      return 'pending';
    }

    // Step 3: Face Matching (KYC Identity)
    if (stepIndex === 3) {
      if (['ATTENDANCE_SUBMITTING', 'SUCCESS'].includes(currentState)) {
        return 'completed';
      }
      if (['VERIFYING_RESULTS'].includes(currentState)) return 'active';
      if (currentState === 'VERIFICATION_FAILED') return 'failed';
      return 'pending';
    }

    // Step 4: Attendance Recording
    if (stepIndex === 4) {
      if (currentState === 'SUCCESS') return 'completed';
      if (currentState === 'ATTENDANCE_SUBMITTING') return 'active';
      if (currentState === 'VERIFICATION_FAILED') return 'failed';
      return 'pending';
    }

    return 'pending';
  };

  const steps = [
    {
      num: 1,
      title: 'Camera',
      desc: 'Camera connected and working properly.',
      icon: <Camera size={16} />
    },
    {
      num: 2,
      title: 'Live Verification',
      desc: 'Verify that you are a real person.',
      icon: <ScanFace size={16} />
    },
    {
      num: 3,
      title: 'Face Matching',
      desc: 'Match your face with your registered KYC identity.',
      icon: <UserCheck size={16} />
    },
    {
      num: 4,
      title: 'Attendance',
      desc: 'Record today\'s attendance.',
      icon: <CalendarCheck size={16} />
    }
  ];

  return (
    <div>
      <h4 style={{
        fontSize: '14px',
        fontWeight: 700,
        color: '#0F172A',
        margin: '0 0 14px 0'
      }}>
        Verification Progress
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((s) => {
          const status = getStepStatus(s.num);

          return (
            <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* Step Circle Indicator */}
              <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                {status === 'completed' ? (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    color: '#16A34A',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                ) : status === 'active' ? (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      border: '2px solid #2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {s.icon}
                  </motion.div>
                ) : status === 'failed' ? (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <X size={16} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#F8FAFC',
                    color: '#94A3B8',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {s.num}
                  </div>
                )}
              </div>

              {/* Step Text */}
              <div>
                <div style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: status === 'active' ? '#2563EB' : (status === 'completed' ? '#0F172A' : '#64748B')
                }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.35 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
