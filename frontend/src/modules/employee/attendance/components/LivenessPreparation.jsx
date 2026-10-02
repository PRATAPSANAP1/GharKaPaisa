import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export default function LivenessPreparation({ onCancel }) {
  const [completedSteps, setCompletedSteps] = useState([true, false, false]);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCompletedSteps([true, true, false]);
    }, 600);

    const timer2 = setTimeout(() => {
      setCompletedSteps([true, true, true]);
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const checklistItems = [
    { text: 'Initializing secure session', done: completedSteps[0] },
    { text: 'Getting temporary credentials', done: completedSteps[1] },
    { text: 'Preparing liveness detector', done: completedSteps[2] },
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

      {/* Center Circular Loading Animation */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '12px 0 24px'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '4px solid #E5E7EB',
            borderTopColor: '#0B74F6',
            marginBottom: '16px'
          }}
        />

        <div style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '4px'
        }}>
          Preparing camera...
        </div>
      </div>

      {/* Checklist */}
      <div style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '14px',
        padding: '16px 18px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {checklistItems.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: item.done ? '#DCFCE7' : '#E5E7EB',
              color: item.done ? '#16A34A' : '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.done ? (
                <Check size={13} strokeWidth={3} />
              ) : (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9CA3AF' }} />
              )}
            </div>
            <span style={{
              fontSize: '13.5px',
              fontWeight: item.done ? 600 : 500,
              color: item.done ? '#111827' : '#6B7280'
            }}>
              {item.text}
            </span>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#EFF6FF',
            color: '#0B74F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Loader2 size={12} className="animate-spin" />
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0B74F6' }}>
            Please wait...
          </span>
        </div>
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        style={{
          width: '100%',
          height: '46px',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#374151',
          fontSize: '14.5px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
      >
        Cancel
      </button>
    </motion.div>
  );
}
