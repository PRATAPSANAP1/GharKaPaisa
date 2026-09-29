import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaCalendarCheck, FaClock, FaTools } from 'react-icons/fa';

export default function AttendanceComingSoon() {
  const { C } = useTheme();

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '40px auto', 
      padding: '0 16px',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justify: 'center' 
    }}>
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        padding: '48px 32px',
        textAlign: 'center',
        width: '100%',
        boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Icon Circle */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.employeePrimary || '#0F766E'}15 0%, ${C.employeePrimary || '#0F766E'}30 100%)`,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          color: C.employeePrimary || '#0F766E',
          fontSize: '36px',
          boxShadow: `0 8px 24px ${C.employeePrimary || '#0F766E'}20`
        }}>
          <FaCalendarCheck />
        </div>

        {/* Header */}
        <div>
          <h1 style={{ 
            fontSize: '26px', 
            fontWeight: 900, 
            color: C.text, 
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            My Attendance
          </h1>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FDE68A',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '13px',
            fontWeight: 800
          }}>
            <FaTools style={{ fontSize: '12px' }} /> Coming Soon
          </div>
        </div>

        {/* Message */}
        <div style={{ maxWidth: '480px' }}>
          <p style={{ 
            fontSize: '15px', 
            color: C.textMid, 
            lineHeight: '1.6', 
            margin: '0 0 8px 0',
            fontWeight: 600 
          }}>
            Attendance functionality is currently being rolled out and will be available soon.
          </p>
          <p style={{ 
            fontSize: '13px', 
            color: C.textSub || C.textMid, 
            margin: 0,
            fontWeight: 500 
          }}>
            Please check back later.
          </p>
        </div>
      </div>
    </div>
  );
}
