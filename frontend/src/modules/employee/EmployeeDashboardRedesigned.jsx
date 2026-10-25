import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaCalendarCheck, FaFileAlt, FaTasks, FaArrowRight, FaCamera,
  FaLightbulb, FaCreditCard, FaShieldAlt, FaLandmark, FaCoins,
  FaChartLine, FaUserPlus, FaChartBar
} from 'react-icons/fa';
import axios from 'axios';
import { getApiV1Url } from '../../config/api';

export default function EmployeeDashboardRedesigned() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-IN', options));
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/employee/login');
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const profileRes = await axios.get(`${getApiV1Url()}/employee/profile`);
      if (profileRes.data.success) {
        setEmployee(profileRes.data.data.employee);
      }
    } catch (err) {
      console.error('Employee Dashboard fetch error:', err);
      if (err.response?.status === 401) {
        navigate('/employee/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        padding: '32px 24px', 
        textAlign: 'center', 
        background: C.bg, 
        minHeight: '100vh', 
        color: C.text,
        fontFamily: "'Inter', sans-serif"
      }}>
        Loading dashboard...
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ 
      background: C.bg, 
      minHeight: '100vh', 
      padding: isMobile ? '16px' : '24px 32px',
      fontFamily: "'Inter', sans-serif", 
      color: C.text 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Welcome Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
          marginBottom: '24px' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: isMobile ? '22px' : '28px', 
              fontWeight: 700, 
              margin: '0 0 6px 0',
              color: C.text 
            }}>
              {getGreeting()}, {employee?.full_name?.split(' ')[0] || 'Employee'}
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: C.textMid, 
              margin: 0 
            }}>
              Your financial services, work updates, and next steps in one place.
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: C.textMid,
            fontSize: '13px'
          }}>
            <span>{currentDate}</span>
            <FaCalendarCheck />
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px' 
        }}>
          {/* Attendance Card */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: C.greenLight,
              color: C.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              <FaCalendarCheck />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                Attendance
              </div>
              <div style={{ fontSize: '13px', color: C.textMid }}>
                Mark your daily attendance
              </div>
            </div>
            <FaArrowRight style={{ color: C.textLight, fontSize: '18px' }} />
          </div>

          {/* Applications Card */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: C.purpleLight,
              color: C.purple,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              <FaFileAlt />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                Applications
              </div>
              <div style={{ fontSize: '13px', color: C.textMid }}>
                Track your applications
              </div>
            </div>
            <FaArrowRight style={{ color: C.textLight, fontSize: '18px' }} />
          </div>

          {/* Tasks Card */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: C.goldLight,
              color: C.gold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              <FaTasks />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                Tasks
              </div>
              <div style={{ fontSize: '13px', color: C.textMid }}>
                Pending actions
              </div>
            </div>
            <FaArrowRight style={{ color: C.textLight, fontSize: '18px' }} />
          </div>
        </div>

        {/* Promotional Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #E8F7EF 0%, #D8F2E5 100%)',
          borderRadius: '20px',
          padding: isMobile ? '24px' : '32px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '24px',
          alignItems: 'center',
          minHeight: '180px'
        }}>
          <div style={{ flex: isMobile ? '1' : '0.38' }}>
            <h2 style={{ 
              fontSize: isMobile ? '20px' : '24px', 
              fontWeight: 700, 
              margin: '0 0 8px 0',
              color: C.sidebar 
            }}>
              Your next opportunity starts here
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: C.textMid, 
              margin: '0 0 16px 0',
              lineHeight: 1.5 
            }}>
              Help people achieve their financial goals through GharKaPaisa products and services.
            </p>
            <button style={{
              background: C.primaryButton,
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.background = C.primaryButton}
            >
              Explore products <FaArrowRight />
            </button>
          </div>
          
          <div style={{ 
            flex: isMobile ? '1' : '0.35',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '100%',
              height: '120px',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: C.primary
            }}>
              📊
            </div>
          </div>

          <div style={{ 
            flex: isMobile ? '1' : '0.27',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.text }}>
              <FaShieldAlt color={C.primary} />
              <span style={{ fontWeight: 600 }}>Trusted Financial Partner</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.text }}>
              <FaCoins color={C.primary} />
              <span style={{ fontWeight: 600 }}>Multiple Loan & Investment Options</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.text }}>
              <FaChartLine color={C.primary} />
              <span style={{ fontWeight: 600 }}>Support People Build a Better Tomorrow</span>
            </div>
          </div>
        </div>

        {/* Explore Services Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px' 
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: C.text }}>
              Explore services
            </h3>
            <button style={{ 
              background: 'transparent', 
              border: 'none', 
              color: C.primary, 
              fontSize: '14px', 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}>
              View all services →
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '16px' 
          }}>
            {[
              { icon: FaCoins, color: '#059669', bg: '#E8F7EF', title: 'Personal Loan', desc: 'Quick disbursement loans' },
              { icon: FaCreditCard, color: '#8B5CF6', bg: '#F1EBFF', title: 'Credit Cards', desc: 'Premium credit cards' },
              { icon: FaShieldAlt, color: '#F97316', bg: '#FFF1DF', title: 'Insurance', desc: 'Life & health insurance' },
              { icon: FaLandmark, color: '#3B82F6', bg: '#EAF2FF', title: 'Bank Accounts', desc: 'Savings & current accounts' },
              { icon: FaChartBar, color: '#EF4444', bg: '#FEE2E2', title: 'Demat Accounts', desc: 'Trading & investments' },
              { icon: FaChartLine, color: '#059669', bg: '#E8F7EF', title: 'Investments', desc: 'Mutual funds & SIPs' }
            ].map((service, idx) => (
              <div
                key={idx}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 24, 40, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 24, 40, 0.04)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: service.bg,
                  color: service.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  <service.icon />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                  {service.title}
                </div>
                <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '8px' }}>
                  {service.desc}
                </div>
                <div style={{ fontSize: '13px', color: C.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Explore <FaArrowRight style={{ fontSize: '12px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px 0', color: C.text }}>
            Quick actions
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '16px' 
          }}>
            {[
              { icon: FaFileAlt, color: '#8B5CF6', bg: '#F1EBFF', title: 'My Applications', desc: 'Track applications' },
              { icon: FaCalendarCheck, color: '#059669', bg: '#E8F7EF', title: 'Mark Attendance', desc: 'Daily check-in' },
              { icon: FaUserPlus, color: '#3B82F6', bg: '#EAF2FF', title: 'Invite a Partner', desc: 'Grow your network' },
              { icon: FaChartBar, color: '#F59E0B', bg: '#FFF1DF', title: 'View Sales Report', desc: 'Performance stats' }
            ].map((action, idx) => (
              <div
                key={idx}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  minHeight: '70px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#B8DCCB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: action.bg,
                  color: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  <action.icon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '2px' }}>
                    {action.title}
                  </div>
                  <div style={{ fontSize: '12px', color: C.textMid }}>
                    {action.desc}
                  </div>
                </div>
                <FaArrowRight style={{ color: C.textLight, fontSize: '14px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Content Area */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '0.62fr 0.38fr',
          gap: '24px' 
        }}>
          {/* Recent Activity */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px' 
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: C.text }}>
                Recent Activity
              </h3>
              <button style={{ 
                background: 'transparent', 
                border: 'none', 
                color: C.primary, 
                fontSize: '13px', 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}>
                View all
              </button>
            </div>
            <div style={{ 
              overflowX: 'auto',
              fontSize: '13px',
              color: C.textMid
            }}>
              <div style={{ padding: '16px', textAlign: 'center', background: C.bgSecondary, borderRadius: '8px' }}>
                No recent activity
              </div>
            </div>
          </div>

          {/* Tips to Get Started */}
          <div style={{
            background: C.bgSecondary,
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: C.primary,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                <FaLightbulb />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: C.text }}>
                  Tip to get started
                </h3>
                <p style={{ fontSize: '14px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                  Complete your KYC verification to unlock all features.
                </p>
              </div>
            </div>
            <button style={{
              background: C.primaryButton,
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.background = C.primaryButton}
            >
              Go to Profile <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
