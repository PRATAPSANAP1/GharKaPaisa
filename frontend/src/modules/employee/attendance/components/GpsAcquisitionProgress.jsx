import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Compass, AlertCircle, X } from 'lucide-react';

export default function GpsAcquisitionProgress({
  gpsProgress,
  onCancel
}) {
  const accuracy = gpsProgress?.accuracy ?? gpsProgress?.currentAccuracy ?? null;
  const bestAccuracy = gpsProgress?.bestAccuracy ?? accuracy;
  const readingCount = gpsProgress?.readingCount || 0;
  const isAccurate = bestAccuracy !== null && bestAccuracy <= 50;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: '32px 28px 28px',
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        boxShadow: '0 20px 40px -15px rgba(109, 61, 245, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E7EAF0',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Cancel / Close Button */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
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
      )}

      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 800,
          color: '#6D3DF5'
        }}>
          <span>📍</span> GPS Verification
        </div>

        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#6D3DF5',
          background: '#F2EEFF',
          border: '1px solid #E4DAFF',
          padding: '4px 10px',
          borderRadius: '12px'
        }}>
          Step 1 of 3
        </span>
      </div>

      {/* Radar / Pulsing GPS Graphic */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0 24px',
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          width: '90px',
          height: '90px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Animated radar rings */}
          <motion.div
            animate={{ scale: [1, 1.45, 1.8], opacity: [0.6, 0.25, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: isAccurate ? 'rgba(22, 199, 132, 0.25)' : 'rgba(109, 61, 245, 0.25)',
              border: `1.5px solid ${isAccurate ? '#16C784' : '#6D3DF5'}`
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.25, 1.5], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            style={{
              position: 'absolute',
              inset: '8px',
              borderRadius: '50%',
              background: isAccurate ? 'rgba(22, 199, 132, 0.2)' : 'rgba(109, 61, 245, 0.2)',
            }}
          />

          {/* Central Pin Icon */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isAccurate 
              ? 'linear-gradient(135deg, #16C784 0%, #0E9F6E 100%)' 
              : 'linear-gradient(135deg, #6D3DF5 0%, #8B6CFF 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isAccurate
              ? '0 10px 25px -5px rgba(22, 199, 132, 0.4)'
              : '0 10px 25px -5px rgba(109, 61, 245, 0.4)',
            zIndex: 2
          }}>
            <MapPin size={28} />
          </div>
        </div>

        {/* Primary Heading */}
        <h3 style={{
          margin: '20px 0 6px',
          fontSize: '20px',
          fontWeight: 800,
          color: '#111827',
          letterSpacing: '-0.3px'
        }}>
          {accuracy !== null
            ? `GPS accuracy: ${accuracy}m`
            : 'Getting your precise location...'
          }
        </h3>

        {/* Subtitle Message */}
        <p style={{
          margin: 0,
          fontSize: '13.5px',
          color: '#64748B',
          fontWeight: 500,
          lineHeight: 1.5,
          maxWidth: '320px'
        }}>
          {accuracy !== null
            ? (isAccurate
                ? 'High-precision GPS fix acquired! Preparing face verification...'
                : 'Waiting for a more accurate GPS signal...'
              )
            : 'Connecting to device GPS satellites for office geofence verification...'
          }
        </p>

        {/* Accuracy Status Badge */}
        {accuracy !== null && (
          <div style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: isAccurate ? '#E9FBF3' : '#FFFBEB',
            border: `1px solid ${isAccurate ? '#B7F4D8' : '#FDE68A'}`,
            borderRadius: '12px',
            fontSize: '12.5px',
            color: isAccurate ? '#065F46' : '#92400E',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Navigation size={14} style={{ color: isAccurate ? '#16C784' : '#D97706' }} />
            <span>
              {isAccurate
                ? `GPS accuracy: ${accuracy}m (≤ 50m required) ✓`
                : `Current accuracy: ${accuracy}m (reading #${readingCount}) • Target: ≤ 50m`
              }
            </span>
          </div>
        )}
      </div>

      {/* Animated subtle progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: '#F1F5F9',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '50%',
            height: '100%',
            background: isAccurate 
              ? 'linear-gradient(90deg, #16C784, #0E9F6E)' 
              : 'linear-gradient(90deg, #6D3DF5, #8B6CFF)',
            borderRadius: '3px'
          }}
        />
      </div>

      <div style={{
        marginTop: '14px',
        fontSize: '11.5px',
        color: '#94A3B8',
        fontWeight: 500
      }}>
        Bounded acquisition in progress • Maximum 25 seconds
      </div>
    </motion.div>
  );
}
