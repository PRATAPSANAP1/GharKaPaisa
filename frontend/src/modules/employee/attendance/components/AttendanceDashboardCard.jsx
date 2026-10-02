import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, LogOut, CheckCircle2, History, BarChart3, Clock, Sparkles } from 'lucide-react';

export default function AttendanceDashboardCard({
  onStartVerification,
  isCheckedIn,
  isCheckedOut,
  loading,
  onNavigateHistory,
  onNavigateSummary
}) {
  // Real-time clock ticking
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Status mapping
  const getStatusText = () => {
    if (!isCheckedIn) return 'Ready to start';
    if (!isCheckedOut) return 'Work in progress';
    return 'Work completed';
  };

  const getStatusBadgeStyle = () => {
    if (!isCheckedIn) {
      return {
        bg: '#EFF6FF',
        border: '#DBEAFE',
        text: '#0B74F6'
      };
    }
    if (!isCheckedOut) {
      return {
        bg: '#FEF3C7',
        border: '#FDE68A',
        text: '#D97706'
      };
    }
    return {
      bg: '#DCFCE7',
      border: '#BBF7D0',
      text: '#16A34A'
    };
  };

  const statusStyle = getStatusBadgeStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E5E7EB',
        padding: '36px 32px',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Date */}
      <div style={{
        fontSize: '15px',
        fontWeight: 600,
        color: '#6B7280',
        marginBottom: '6px'
      }}>
        {dateStr || 'Loading date...'}
      </div>

      {/* Live Time */}
      <div style={{
        fontSize: '38px',
        fontWeight: 800,
        color: '#111827',
        letterSpacing: '-0.5px',
        marginBottom: '16px',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {timeStr || '--:-- --'}
      </div>

      {/* Status */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: statusStyle.bg,
        border: `1px solid ${statusStyle.border}`,
        color: statusStyle.text,
        padding: '6px 16px',
        borderRadius: '24px',
        fontSize: '13.5px',
        fontWeight: 600,
        marginBottom: '28px'
      }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: statusStyle.text,
          display: 'inline-block'
        }} />
        Status: {getStatusText()}
      </div>

      {/* Action Button */}
      <div style={{ width: '100%', marginBottom: '24px' }}>
        {!isCheckedIn ? (
          <button
            type="button"
            onClick={onStartVerification}
            disabled={loading}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '12px',
              border: 'none',
              background: '#0B74F6',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(11, 116, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#0963D2'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = '#0B74F6'; }}
          >
            <Play size={18} fill="#FFFFFF" /> Start Work
          </button>
        ) : !isCheckedOut ? (
          <button
            type="button"
            onClick={onStartVerification}
            disabled={loading}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '12px',
              border: 'none',
              background: '#0B74F6',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(11, 116, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#0963D2'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = '#0B74F6'; }}
          >
            <LogOut size={18} /> End Work
          </button>
        ) : (
          <div style={{
            width: '100%',
            height: '52px',
            borderRadius: '12px',
            background: '#DCFCE7',
            border: '1px solid #BBF7D0',
            color: '#16A34A',
            fontSize: '16px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={20} /> Work Completed
          </div>
        )}
      </div>

      {/* Secondary Action Links */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderTop: '1px solid #F3F4F6',
        paddingTop: '18px'
      }}>
        <button
          type="button"
          onClick={onNavigateHistory}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            borderRadius: '10px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.color = '#0B74F6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#374151';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} color="#6B7280" /> View Attendance History
          </span>
          <span style={{ fontSize: '15px' }}>→</span>
        </button>

        <button
          type="button"
          onClick={onNavigateSummary}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            borderRadius: '10px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.color = '#0B74F6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#374151';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="#6B7280" /> Attendance Summary
          </span>
          <span style={{ fontSize: '15px' }}>→</span>
        </button>
      </div>
    </motion.div>
  );
}
