import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, CheckCircle2, ArrowRight, Lock, X } from 'lucide-react';

export default function AttendanceVerificationStepper({
  onContinue,
  onClose,
  actionType = 'CHECK_IN'
}) {
  const isCheckIn = actionType === 'CHECK_IN';

  const checkList = [
    {
      icon: <ShieldCheck size={20} style={{ color: '#6D3DF5' }} />,
      title: 'Verify your identity',
      desc: 'Secure face verification'
    },
    {
      icon: <MapPin size={20} style={{ color: '#6D3DF5' }} />,
      title: 'Check office location',
      desc: 'Ensure you are at office'
    },
    {
      icon: <CheckCircle2 size={20} style={{ color: '#6D3DF5' }} />,
      title: isCheckIn ? 'Mark your attendance' : 'Record check-out',
      desc: 'Quick and secure'
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
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: '#F8FAFC',
          border: '1px solid #E7EAF0',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#111827'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
      >
        <X size={16} />
      </button>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 800,
          color: '#6D3DF5',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '15px' }}>⚡</span> GharKaPaisa
        </div>
        <h2 style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.3px'
        }}>
          Face Liveness Check
        </h2>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, marginTop: '2px', display: 'block' }}>
          Live Biometric Verification
        </span>
      </div>

      {/* Central Illustration Badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '28px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '28px',
          background: '#F2EEFF',
          border: '2px dashed #8B6CFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 8px 24px -6px rgba(109, 61, 245, 0.2)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6D3DF5 0%, #5424D6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <ShieldCheck size={34} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E7EAF0',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {checkList.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: '#F2EEFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Start Video Button */}
      <button
        type="button"
        onClick={onContinue}
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
          transition: 'transform 0.15s ease, boxShadow 0.15s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        Start Video <ArrowRight size={18} />
      </button>

      {/* Encrypted Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '16px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#94A3B8'
      }}>
        <Lock size={12} />
        <span>Secure • Private • Encrypted</span>
      </div>
    </motion.div>
  );
}

