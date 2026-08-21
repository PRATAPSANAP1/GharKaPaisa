import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Home, CreditCard, FileText, Users, Plus } from 'lucide-react';

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
    <div style={{ color: active ? '#6E3FD6' : '#8A8A9E' }}>{icon}</div>
    <span
      style={{
        fontSize: '10px',
        fontWeight: active ? 600 : 500,
        color: active ? '#6E3FD6' : '#8A8A9E',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  </div>
);

export default function PartnerMobileBottomNav() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/partner/dashboard') {
      return location.pathname === '/partner/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: isDark ? C.card : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '24px',
          paddingRight: '24px',
          pointerEvents: 'auto',
          borderTop: `1px solid ${isDark ? C.border : '#F3F4F6'}`,
          height: '72px',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          borderRadius: '20px 20px 0 0'
        }}
      >
        <NavItem
          icon={<Home size={22} />}
          label="Dashboard"
          active={isActive('/partner/dashboard')}
          onClick={() => navigate('/partner/dashboard')}
        />
        <NavItem
          icon={<CreditCard size={22} />}
          label="Credit Card"
          active={isActive('/partner/credit-cards')}
          onClick={() => navigate('/partner/credit-cards')}
        />

        {/* Elevated Central Add Lead Action Button */}
        <div
          onClick={() => navigate('/partner/sell-and-earn')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '-28px',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#7C4FE0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124,79,224,0.45)'
            }}
          >
            <Plus size={26} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '2px', color: '#8A8A9E' }}>
            Add Lead
          </span>
        </div>

        <NavItem
          icon={<FileText size={22} />}
          label="Applications"
          active={isActive('/partner/applications')}
          onClick={() => navigate('/partner/applications?scope=my')}
        />
        <NavItem
          icon={<Users size={22} />}
          label="Team"
          active={isActive('/partner/team') || isActive('/partner/network')}
          onClick={() => navigate('/partner/team')}
        />
      </div>
    </div>
  );
}
