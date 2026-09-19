import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HiOutlineHome, 
  HiOutlineTag, 
  HiOutlineArrowRightOnRectangle, 
  HiOutlineUserPlus, 
  HiOutlinePhone 
} from 'react-icons/hi2';

export default function HomeMobileBottomNav() {
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

  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: <HiOutlineHome size={22} /> },
    { id: 'offers', label: 'Offers', path: '/loans', icon: <HiOutlineTag size={22} /> },
    { id: 'login', label: 'Login', path: '/login', icon: <HiOutlineArrowRightOnRectangle size={22} /> },
    { id: 'register', label: 'Register', path: '/register', icon: <HiOutlineUserPlus size={22} /> },
    { id: 'support', label: 'Support', path: '/contact', icon: <HiOutlinePhone size={22} /> },
  ];

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
          padding: '10px 14px',
          pointerEvents: 'auto',
          border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const activeColor = '#2563EB';
          const inactiveColor = isDark ? '#94A3B8' : '#64748B';

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <div style={{ color: active ? activeColor : inactiveColor, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 800 : 600,
                  color: active ? activeColor : inactiveColor,
                  whiteSpace: 'nowrap'
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
