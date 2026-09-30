import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

export default function AttendanceHeader() {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '4px'
      }}
    >
      <div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#0F172A',
          margin: 0,
          letterSpacing: '-0.3px'
        }}>
          My Attendance
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          margin: '4px 0 0 0',
          lineHeight: 1.4
        }}>
          Track your daily attendance and securely verify your identity.
        </p>
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '10px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <CalendarDays size={16} color="#2563EB" />
        <span style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: '#0F172A'
        }}>
          {currentDate}
        </span>
      </div>
    </motion.div>
  );
}
