import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../app/store/authStore';
import { 
  HiOutlineHome, 
  HiOutlineCreditCard, 
  HiOutlineBanknotes, 
  HiOutlinePhone, 
  HiOutlineArrowRightOnRectangle,
  HiOutlineSquares2X2 
} from 'react-icons/hi2';

export default function HomeMobileBottomNav() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
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

  const getDashboardPath = () => {
    if (!user) return '/partner/dashboard';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'SUPER_ADMIN':
        return '/super-admin/dashboard';
      case 'EMPLOYEE':
        return '/employee/dashboard';
      case 'PARTNER':
      default:
        return '/partner/dashboard';
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: <HiOutlineHome size={22} /> },
    { id: 'cards', label: 'Cards', path: '/credit-cards', icon: <HiOutlineCreditCard size={22} /> },
    { id: 'loans', label: 'Loans', path: '/loans', icon: <HiOutlineBanknotes size={22} /> },
    { id: 'support', label: 'Support', path: '/contact', icon: <HiOutlinePhone size={22} /> },
    isAuthenticated
      ? { id: 'dashboard', label: 'Dashboard', path: getDashboardPath(), icon: <HiOutlineSquares2X2 size={22} /> }
      : { id: 'login', label: 'Login', path: '/login', icon: <HiOutlineArrowRightOnRectangle size={22} /> },
  ];

  const activeColor = C?.teal || (isDark ? '#00D4AA' : '#008A60');
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        left: '10px',
        right: '10px',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '10px 8px',
          pointerEvents: 'auto',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: '20px',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.45)' : '0 8px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);

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
