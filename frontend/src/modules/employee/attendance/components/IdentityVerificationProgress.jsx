import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, MapPin, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function IdentityVerificationProgress({
  stage = 'FACE_MATCH', // 'FACE_MATCH' | 'LOCATION_CHECK' | 'COMPLETE_ATTENDANCE'
  actionType = 'CHECK_IN',
  locationStatus = null,
  buildingName = null
}) {
  const isCheckIn = actionType === 'CHECK_IN';
  const isLocationDone = stage === 'COMPLETE_ATTENDANCE';

  const steps = [
    {
      num: 1,
      title: 'Face verified',
      desc: 'Face liveness check passed',
      status: 'completed'
    },
    {
      num: 2,
      title: 'Checking office location...',
      desc: 'Verifying your GPS coordinates',
      status: stage === 'FACE_MATCH' ? 'completed' : stage === 'LOCATION_CHECK' ? 'active' : 'completed'
    },
    {
      num: 3,
      title: 'Validating with office boundary',
      desc: buildingName ? `Verified inside ${buildingName}` : 'Checking GharKaPaisa office polygon',
      status: isLocationDone ? 'completed' : (stage === 'LOCATION_CHECK' ? 'active' : 'pending')
    },
    {
      num: 4,
      title: 'Marking attendance',
      desc: isLocationDone ? (isCheckIn ? 'Recording check-in...' : 'Recording check-out...') : 'Pending',
      status: isLocationDone ? 'active' : 'pending'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '32px 28px 28px',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(109, 61, 245, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E7EAF0',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Dynamic Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.3px'
        }}>
          {isLocationDone ? 'Office location verified' : 'Checking Office Location'}
        </h2>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, marginTop: '2px', display: 'block' }}>
          {isLocationDone ? "You're inside the GharKaPaisa office" : 'Verifying your current location'}
        </span>
      </div>

      {/* Map Radar Pulse Visualization (Screen 5 & 6) */}
      <div style={{
        height: '160px',
        borderRadius: '20px',
        background: '#F8FAFC',
        border: '1px solid #E7EAF0',
        marginBottom: '24px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Subtle Map Grid Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.35,
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} />

        {/* Expanding Pulse Waves */}
        {!isLocationDone ? (
          <>
            <motion.div
              animate={{ scale: [0.6, 1.4], opacity: [0.8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(109, 61, 245, 0.25)',
                border: '1px solid rgba(109, 61, 245, 0.4)'
              }}
            />
            <motion.div
              animate={{ scale: [0.6, 1.4], opacity: [0.8, 0] }}
              transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(66, 200, 255, 0.25)',
                border: '1px solid rgba(66, 200, 255, 0.4)'
              }}
            />
          </>
        ) : (
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: '#E9FBF3',
              border: '2px solid #16C784'
            }}
          />
        )}

        {/* Central Map Pin Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isLocationDone ? 'linear-gradient(135deg, #16C784 0%, #10B981 100%)' : 'linear-gradient(135deg, #6D3DF5 0%, #5424D6 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          boxShadow: isLocationDone ? '0 8px 24px -4px rgba(22, 199, 132, 0.4)' : '0 8px 24px -4px rgba(109, 61, 245, 0.4)'
        }}>
          <MapPin size={28} />
        </div>
      </div>

      {/* Verified Location Card (Screen 6) */}
      {isLocationDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#E9FBF3',
            border: '1px solid #BBF7D0',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: '#16C784' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#047857', textTransform: 'uppercase' }}>
                Office Location
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#065F46' }}>
                {buildingName || 'GharKaPaisa Office'}
              </div>
            </div>
          </div>
          <CheckCircle2 size={20} style={{ color: '#16C784' }} />
        </motion.div>
      )}

      {/* Checklist Status Stepper */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#F8FAFC',
        border: '1px solid #E7EAF0',
        borderRadius: '18px',
        padding: '16px'
      }}>
        {steps.map((step) => (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: step.status === 'completed'
                ? '#E9FBF3'
                : step.status === 'active'
                ? '#F2EEFF'
                : '#FFFFFF',
              color: step.status === 'completed'
                ? '#16C784'
                : step.status === 'active'
                ? '#6D3DF5'
                : '#94A3B8',
              border: step.status === 'completed'
                ? '1px solid #BBF7D0'
                : step.status === 'active'
                ? '1.5px solid #6D3DF5'
                : '1.5px solid #CBD5E1'
            }}>
              {step.status === 'completed' ? (
                <Check size={14} strokeWidth={3} />
              ) : step.status === 'active' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{step.num}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: step.status === 'active' || step.status === 'completed' ? 700 : 500,
                color: step.status === 'completed' ? '#111827' : (step.status === 'active' ? '#6D3DF5' : '#64748B')
              }}>
                {step.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

