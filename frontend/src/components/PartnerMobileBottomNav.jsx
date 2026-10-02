import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HiOutlineSquares2X2, 
  HiOutlineDocumentText, 
  HiOutlinePlus, 
  HiOutlineUsers, 
  HiOutlineUser 
} from 'react-icons/hi2';

export default function PartnerMobileBottomNav() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobile) return null;

  const isActive = (path) => {
    if (path === '/partner/dashboard') {
      return location.pathname === '/partner/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const activeColor = '#2563EB';
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        left: '10px',
        right: '10px',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: isDark ? '#1E293B' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 12px',
          pointerEvents: 'auto',
          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)',
          height: '64px'
        }}
      >
        {/* 1. Dashboard */}
        <div
          onClick={() => navigate('/partner/dashboard')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/partner/dashboard') ? activeColor : inactiveColor }}>
            <HiOutlineSquares2X2 size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/partner/dashboard') ? 800 : 600, color: isActive('/partner/dashboard') ? activeColor : inactiveColor }}>
            Dashboard
          </span>
        </div>

        {/* 2. Application */}
        <div
          onClick={() => navigate('/partner/applications?scope=my')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/partner/applications') ? activeColor : inactiveColor }}>
            <HiOutlineDocumentText size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/partner/applications') ? 800 : 600, color: isActive('/partner/applications') ? activeColor : inactiveColor }}>
            Application
          </span>
        </div>

        {/* 3. CENTER ELEVATED CIRCLE BUTTON: Add Lead */}
        <div
          onClick={() => navigate('/partner/sell-and-earn')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '-24px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: `3px solid ${isDark ? '#1E293B' : '#FFFFFF'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(37,99,235,0.45)'
            }}
          >
            <HiOutlinePlus size={24} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px', color: isDark ? '#F8FAFC' : '#1E293B' }}>
            Add Lead
          </span>
        </div>

        {/* 4. Team */}
        <div
          onClick={() => navigate('/partner/team')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/partner/team') ? activeColor : inactiveColor }}>
            <HiOutlineUsers size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/partner/team') ? 800 : 600, color: isActive('/partner/team') ? activeColor : inactiveColor }}>
            Team
          </span>
        </div>

        {/* 5. Profile */}
        <div
          onClick={() => navigate('/partner/profile')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/partner/profile') ? activeColor : inactiveColor }}>
            <HiOutlineUser size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/partner/profile') ? 800 : 600, color: isActive('/partner/profile') ? activeColor : inactiveColor }}>
            Profile
          </span>
        </div>

      </div>
    </div>
  );
}
