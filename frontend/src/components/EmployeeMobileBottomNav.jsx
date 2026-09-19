import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HiOutlineSquares2X2, 
  HiOutlineDocumentText, 
  HiOutlinePlus, 
  HiOutlineTrophy, 
  HiOutlineUser 
} from 'react-icons/hi2';

export default function EmployeeMobileBottomNav() {
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
    if (path === '/employee/dashboard') {
      return location.pathname === '/employee/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const activeColor = '#0F766E';
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        right: '10px',
        zIndex: 9999,
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
          onClick={() => navigate('/employee/dashboard')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/employee/dashboard') ? activeColor : inactiveColor }}>
            <HiOutlineSquares2X2 size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/employee/dashboard') ? 800 : 600, color: isActive('/employee/dashboard') ? activeColor : inactiveColor }}>
            Dashboard
          </span>
        </div>

        {/* 2. Application */}
        <div
          onClick={() => navigate('/employee/applications')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/employee/applications') ? activeColor : inactiveColor }}>
            <HiOutlineDocumentText size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/employee/applications') ? 800 : 600, color: isActive('/employee/applications') ? activeColor : inactiveColor }}>
            Application
          </span>
        </div>

        {/* 3. CENTER ELEVATED CIRCLE BUTTON: Add Lead */}
        <div
          onClick={() => navigate('/employee/credit-cards')}
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
              background: 'linear-gradient(135deg, #0F766E, #0D9488)',
              border: `3px solid ${isDark ? '#1E293B' : '#FFFFFF'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(15,118,110,0.45)'
            }}
          >
            <HiOutlinePlus size={24} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px', color: isDark ? '#F8FAFC' : '#1E293B' }}>
            Add Lead
          </span>
        </div>

        {/* 4. Contest */}
        <div
          onClick={() => navigate('/employee/contests')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/employee/contests') ? activeColor : inactiveColor }}>
            <HiOutlineTrophy size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/employee/contests') ? 800 : 600, color: isActive('/employee/contests') ? activeColor : inactiveColor }}>
            Contest
          </span>
        </div>

        {/* 5. Profile */}
        <div
          onClick={() => navigate('/employee/profile')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <div style={{ color: isActive('/employee/profile') ? activeColor : inactiveColor }}>
            <HiOutlineUser size={22} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: isActive('/employee/profile') ? 800 : 600, color: isActive('/employee/profile') ? activeColor : inactiveColor }}>
            Profile
          </span>
        </div>

      </div>
    </div>
  );
}
