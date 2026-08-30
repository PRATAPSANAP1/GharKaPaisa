import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../app/store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { FaUserCircle, FaIdCard, FaBuilding, FaEnvelope, FaPhone, FaCheckCircle, FaLock, FaShieldAlt } from 'react-icons/fa';
import api from '../../../services/api';

export default function EmployeeProfile() {
  const { user } = useAuthStore();
  const { C } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee/profile');
      if (res.data?.success) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch employee profile", err);
    } finally {
      setLoading(false);
    }
  };

  const empData = profile || user || {};

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Profile Header */}
      <div style={{ 
        background: `linear-gradient(135deg, ${C.teal} 0%, #1E293B 100%)`, 
        borderRadius: '20px', padding: isMobile ? '20px 16px' : '32px', color: '#FFF', display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div style={{ 
            width: isMobile ? '56px' : '80px', height: isMobile ? '56px' : '80px', borderRadius: '50%', background: '#FFF', 
            color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: isMobile ? '24px' : '36px', fontWeight: 900, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', flexShrink: 0 
          }}>
            {(empData.full_name || empData.name || 'E')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 900, margin: 0, wordBreak: 'break-word' }}>{empData.full_name || empData.name || 'Employee Profile'}</h1>
            <p style={{ margin: '4px 0 0 0', opacity: 0.85, fontSize: isMobile ? '12px' : '14px', fontWeight: 600 }}>
              {empData.designation || 'Sales Associate'} • {empData.department || 'Sales & Distribution'}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
              <FaShieldAlt /> Code: {empData.emp_code || empData.employee_id || 'EMP-1000'}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', width: isMobile ? '100%' : 'auto', display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Account Status</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaCheckCircle /> {empData.employee_status || empData.status || 'ACTIVE'}
          </div>
        </div>
      </div>

      {/* Grid Information */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Contact Info */}
        <div style={{ background: C.card, borderRadius: '16px', padding: '24px', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserCircle style={{ color: C.teal }} /> Personal & Contact Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{empData.email_id || empData.email || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>MOBILE NUMBER</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{empData.mobile_number || empData.mobile || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>DATE OF JOINING</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{empData.date_of_joining ? new Date(empData.date_of_joining).toLocaleDateString() : 'Active Employment'}</div>
            </div>
          </div>
        </div>

        {/* Work & Hierarchy */}
        <div style={{ background: C.card, borderRadius: '16px', padding: '24px', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBuilding style={{ color: C.teal }} /> Work & Organizational Role
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>DEPARTMENT</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{empData.department || 'Sales & Operations'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>DESIGNATION</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{empData.designation || 'Sales Executive'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: C.textMid, fontWeight: 700 }}>KYC VERIFICATION</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: empData.kyc_status === 'APPROVED' ? '#10B981' : '#F59E0B' }}>
                {empData.kyc_status || 'VERIFIED'}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
