import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, ScanFace, Sun, Eye, Frame, 
  Glasses, Camera, ArrowRight, X, Info
} from 'lucide-react';

export default function AttendanceInstructions({ onContinue, onClose, loading }) {
  const instructions = [
    {
      icon: <Sun size={18} color="#2563EB" />,
      title: 'Good lighting',
      desc: 'Make sure your face is clearly visible.'
    },
    {
      icon: <Eye size={18} color="#2563EB" />,
      title: 'Look at the camera',
      desc: 'Keep your face centered and visible.'
    },
    {
      icon: <Frame size={18} color="#2563EB" />,
      title: 'Keep your face inside the frame',
      desc: 'Follow the face guide shown by the camera.'
    },
    {
      icon: <Glasses size={18} color="#2563EB" />,
      title: 'Remove sunglasses or face covering',
      desc: 'Your face must be clearly visible.'
    },
    {
      icon: <Camera size={18} color="#2563EB" />,
      title: 'Keep the camera steady',
      desc: 'Avoid unnecessary movement.'
    },
    {
      icon: <Sun size={18} color="#2563EB" />,
      title: 'Avoid strong backlighting',
      desc: 'Make sure light is on your face.'
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
        padding: '24px 28px',
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid #E2E8F0'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Face Verification
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748B' }}>
              Verify your identity before marking today's attendance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close face verification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Visual Illustration Icon */}
      <div style={{ textAlign: 'center', margin: '14px 0 16px' }}>
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: '#EFF6FF',
          border: '1px solid #DBEAFE',
          color: '#2563EB',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)'
        }}>
          <ScanFace size={34} />
        </div>
      </div>

      <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
        Before You Start
      </h4>

      {/* Instruction Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {instructions.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Information Box */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #DBEAFE',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Info size={16} color="#2563EB" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '12.5px', color: '#1E3A5F', fontWeight: 500, lineHeight: 1.4 }}>
          Live biometric verification is required before attendance can be marked.
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={{
            flex: 1,
            height: '48px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          style={{
            flex: 1.8,
            height: '48px',
            borderRadius: '12px',
            border: 'none',
            background: '#2563EB',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
          }}
        >
          {loading ? 'Starting Camera...' : 'Continue'} <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
