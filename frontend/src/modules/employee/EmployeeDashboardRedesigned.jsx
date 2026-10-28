import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FaCalendarCheck, FaFileAlt, FaTasks, FaArrowRight, FaCamera,
  FaLightbulb, FaCreditCard, FaShieldAlt, FaLandmark, FaCoins,
  FaChartLine, FaUserPlus, FaChartBar, FaChevronLeft, FaChevronRight,
  FaUsers, FaGift, FaComments, FaCheckCircle, FaClock, FaUserCircle,
  FaExclamationCircle, FaExternalLinkAlt, FaExclamationTriangle, FaSignOutAlt
} from 'react-icons/fa';
import axios from 'axios';
import api from '../../services/api';
import { getApiV1Url } from '../../config/api';
import LoadingLogo from '../../components/Loader/LoadingLogo';

// Static Banner Image Assets
import offerBanner from '../home/components/banner/offerbanner.png';
import ltfBanner from '../home/components/banner/lifetimefree card.png';
import loanBanner from '../home/components/banner/loan.png';
import emiBanner from '../home/components/banner/smart emi.png';
import emiNewBanner from '../home/components/banner/emi.jpeg';
import hdfcBanner from '../home/components/banner/hdfc pixel card.png';
import insuranceBanner from '../home/components/banner/insurance.png';

const localBannerMap = {
  'lifetimefree card.png': ltfBanner,
  'loan.png': loanBanner,
  'insurance.png': insuranceBanner,
  'smart emi.png': emiBanner,
  'emi.jpeg': emiNewBanner,
  'hdfc pixel card.png': hdfcBanner,
  'offerbanner.png': offerBanner
};

const resolveBannerImage = (url) => {
  if (!url) return offerBanner;
  const rawUrl = typeof url === 'string' ? url : (url.image_url || url.image || '');
  if (!rawUrl) return offerBanner;
  if (localBannerMap[rawUrl]) return localBannerMap[rawUrl];
  const cleanUrl = rawUrl.trim();
  const filename = cleanUrl.split('/').pop().split('\\').pop();
  if (localBannerMap[filename]) return localBannerMap[filename];
  try {
    const decoded = decodeURIComponent(filename);
    if (localBannerMap[decoded]) return localBannerMap[decoded];
  } catch (_) {}
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
  if (cleanUrl.startsWith('/')) {
    const apiBase = getApiV1Url ? getApiV1Url() : '';
    const origin = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${origin}${cleanUrl}`;
  }
  return offerBanner;
};

export default function EmployeeDashboardRedesigned() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [currentDate, setCurrentDate] = useState('');

  // Real data state
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(null);
  const [verState, setVerState] = useState(null);
  const [apiBanners, setApiBanners] = useState([]);

  // Banner carousel state
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

      // Concurrent fetch for employee profile, attendance, applications, and verification status
      const [profileRes, attendanceRes, appsRes, verRes, bannersRes] = await Promise.allSettled([
        axios.get(`${getApiV1Url()}/employee/profile`),
        axios.get(`${getApiV1Url()}/attendance/today`),
        axios.get(`${getApiV1Url()}/applications`, { params: { limit: 5 } }),
        axios.get(`${getApiV1Url()}/employee/verification-status`),
        axios.get(`${getApiV1Url()}/banners`, { params: { page: 'offer' } })
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.data?.success) {
        setEmployee(profileRes.value.data.data.employee);
      }

      if (attendanceRes.status === 'fulfilled' && attendanceRes.value?.data?.data) {
        setAttendanceToday(attendanceRes.value.data.data);
      }

      if (appsRes.status === 'fulfilled' && appsRes.value?.data?.success) {
        const appsData = appsRes.value.data.data;
        if (Array.isArray(appsData)) {
          setRecentApplications(appsData.slice(0, 5));
        }
        if (appsRes.value.data.pagination?.total !== undefined) {
          setTotalApplicationsCount(appsRes.value.data.pagination.total);
        } else if (Array.isArray(appsData)) {
          setTotalApplicationsCount(appsData.length);
        }
      }

      if (verRes.status === 'fulfilled' && verRes.value?.data?.success) {
        setVerState(verRes.value.data.data);
      }

      if (bannersRes.status === 'fulfilled' && bannersRes.value?.data?.data) {
        const banners = bannersRes.value.data.data;
        if (Array.isArray(banners) && banners.length > 0) {
          setApiBanners(banners);
        }
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

  // Built-in Default Offer Banners
  const defaultOfferBanners = [
    { 
      title: 'GharKaPaisa Mega Offers & Rewards', 
      subtitle: 'Earn top incentives on pre-approved credit cards & instant loans', 
      image_url: 'offerbanner.png', 
      click_url: '/employee/credit-cards' 
    },
    { 
      title: 'Lifetime Free Credit Cards', 
      subtitle: 'Zero annual charges with instant pre-approvals across 15+ top banks', 
      image_url: 'lifetimefree card.png', 
      click_url: '/employee/credit-cards' 
    },
    { 
      title: 'Instant Personal & Business Loans', 
      subtitle: 'Fast disbursement with competitive interest rates & minimal paperwork', 
      image_url: 'loan.png', 
      click_url: '/employee/loans/personal-loan' 
    },
    { 
      title: 'Smart EMI on Credit Card', 
      subtitle: 'Convert high-ticket client purchases into easy, flexible monthly EMIs', 
      image_url: 'smart emi.png', 
      click_url: '/employee/smart-emi' 
    },
    { 
      title: 'HDFC Bank Pixel Credit Card', 
      subtitle: '100% digital issuance with customizable cashback rewards', 
      image_url: 'hdfc pixel card.png', 
      click_url: '/employee/credit-cards' 
    },
    { 
      title: 'Comprehensive Insurance Plans', 
      subtitle: 'Protect family health & life with India’s leading insurance providers', 
      image_url: 'insurance.png', 
      click_url: '/employee/insurance' 
    }
  ];

  const activeBanners = apiBanners.length > 0 ? apiBanners : defaultOfferBanners;

  const bannerSlides = activeBanners.map(b => ({
    title: b.title,
    subtitle: b.subtitle,
    bgImage: resolveBannerImage(b.image_url || b.image),
    click_url: b.click_url || '/employee/credit-cards'
  }));

  // Auto-rotate offer banners
  useEffect(() => {
    if (isPaused || bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  const handleNextBanner = (e) => {
    e.stopPropagation();
    setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
  };

  const handlePrevBanner = (e) => {
    e.stopPropagation();
    setBannerIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const handleBannerClick = (slide) => {
    const target = slide.click_url || '/employee/credit-cards';
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank');
    } else {
      navigate(target);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh', 
        background: C.bg 
      }}>
        <LoadingLogo size={110} />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Determine attendance status
  const isPunchedIn = Boolean(attendanceToday?.check_in_time);
  const isPunchedOut = Boolean(attendanceToday?.check_out_time);
  const checkInTime = attendanceToday?.check_in_time ? attendanceToday.check_in_time.slice(0, 5) : null;
  const shouldRemindCheckout = Boolean(attendanceToday?.reminder?.should_remind);

  // Determine tasks status
  const missingItems = verState?.missing_items || [];
  const pendingTasksCount = Array.isArray(missingItems) ? missingItems.filter(i => i.status !== 'APPROVED' && i.status !== 'VERIFIED').length : 0;
  const isFullyVerified = verState?.overall_status === 'VERIFIED';

  return (
    <div style={{ 
      background: C.bg, 
      minHeight: '100%', 
      padding: isMobile ? '4px 0 24px' : '8px 0 32px',
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
              Your financial services, work updates, and client actions in one place.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: C.textMid,
              fontSize: '13px',
              background: C.card,
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${C.border}`
            }}>
              <FaCalendarCheck color={C.primary} />
              <span>{currentDate}</span>
            </div>

            <button
              onClick={() => navigate('/employee/profile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: C.card,
                border: `1px solid ${C.border}`,
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: C.text,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.color = C.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.text;
              }}
            >
              <FaUserCircle /> My Profile
            </button>
          </div>
        </div>

        {/* Working Hours End Attendance Reminder Alert */}
        {shouldRemindCheckout && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#92400E', marginBottom: '2px' }}>
                  Working Hours Ended
                </div>
                <div style={{ fontSize: '13px', color: '#78350F' }}>
                  Your assigned working hours have ended. Please complete your attendance checkout.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/employee/attendance')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#B45309'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#D97706'}
            >
              <FaSignOutAlt /> End Attendance
            </button>
          </div>
        )}

        {/* Top 3 Summary Cards - Connected & Interactive */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px' 
        }}>
          {/* Attendance Card */}
          <div 
            onClick={() => navigate('/employee/attendance')}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.25s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = C.green;
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(0, 138, 96, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 24, 40, 0.04)';
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: C.greenLight,
              color: C.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              <FaCalendarCheck />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>
                  Attendance
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isPunchedOut ? '#D1FAE5' : isPunchedIn ? (shouldRemindCheckout ? '#FEE2E2' : '#DBEAFE') : '#FEF3C7',
                  color: isPunchedOut ? '#065F46' : isPunchedIn ? (shouldRemindCheckout ? '#DC2626' : '#1D4ED8') : '#92400E'
                }}>
                  {isPunchedOut ? 'Completed' : isPunchedIn ? (shouldRemindCheckout ? 'Checkout Needed' : 'Working') : 'Not Marked'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: C.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isPunchedOut 
                  ? 'Attendance completed for today' 
                  : isPunchedIn 
                    ? (shouldRemindCheckout ? 'Shift ended — Please complete checkout' : `Checked in at ${checkInTime || 'Today'}`)
                    : 'Mark your daily attendance with face scan'}
              </div>
            </div>
            <FaArrowRight style={{ color: C.green, fontSize: '16px', flexShrink: 0 }} />
          </div>

          {/* Applications Card */}
          <div 
            onClick={() => navigate('/employee/applications')}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.25s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = C.purple;
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(139, 92, 246, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 24, 40, 0.04)';
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: C.purpleLight,
              color: C.purple,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              <FaFileAlt />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>
                  Applications
                </span>
                {totalApplicationsCount !== null && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: C.purpleLight,
                    color: C.purple
                  }}>
                    {totalApplicationsCount} Leads
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: C.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Track and submit client applications
              </div>
            </div>
            <FaArrowRight style={{ color: C.purple, fontSize: '16px', flexShrink: 0 }} />
          </div>

          {/* Tasks & Verification Card */}
          <div 
            onClick={() => navigate('/employee/verification')}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'all 0.25s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = C.gold;
              e.currentTarget.style.boxShadow = '0 8px 22px rgba(245, 158, 11, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 24, 40, 0.04)';
            }}
          >
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: C.goldLight,
              color: C.gold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0
            }}>
              <FaTasks />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>
                  Tasks
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: pendingTasksCount > 0 ? '#FEF3C7' : '#D1FAE5',
                  color: pendingTasksCount > 0 ? '#92400E' : '#065F46'
                }}>
                  {pendingTasksCount > 0 ? `${pendingTasksCount} Action Reqd` : 'Completed'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: C.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pendingTasksCount > 0 ? 'KYC / Video verification pending' : 'All compliance tasks completed'}
              </div>
            </div>
            <FaArrowRight style={{ color: C.gold, fontSize: '16px', flexShrink: 0 }} />
          </div>
        </div>

        {/* Dynamic Offer Banner Carousel (Replacing Static Promotional Box) */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            width: '100%',
            height: isMobile ? '180px' : '300px',
            borderRadius: isMobile ? '16px' : '20px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '28px',
            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(16, 24, 40, 0.08)',
            border: `1px solid ${C.border}`,
            background: isDark ? C.card : '#FFFFFF'
          }}
        >
          {bannerSlides.map((slide, idx) => (
            <div
              key={idx}
              onClick={() => handleBannerClick(slide)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: idx === bannerIndex ? 1 : 0,
                pointerEvents: idx === bannerIndex ? 'auto' : 'none',
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src={slide.bgImage}
                alt={slide.title || 'GharKaPaisa Offer'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = offerBanner;
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block'
                }}
              />

              {/* Bottom Gradient Overlay with Information & CTA */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: isMobile ? '14px 16px' : '20px 24px',
                  background: 'linear-gradient(to top, rgba(6, 63, 56, 0.95) 0%, rgba(6, 63, 56, 0.5) 60%, transparent 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: '16px',
                  zIndex: 2
                }}
              >
                <div style={{ maxWidth: isMobile ? '70%' : '75%' }}>
                  <h3 style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: isMobile ? '15px' : '20px', 
                    fontWeight: 800, 
                    color: '#ffffff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {slide.title}
                  </h3>
                  {slide.subtitle && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: isMobile ? '11px' : '13px', 
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: 1.4,
                      display: isMobile ? '-webkit-box' : 'block',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#008A60',
                  color: '#ffffff',
                  padding: isMobile ? '5px 10px' : '8px 16px',
                  borderRadius: '10px',
                  fontSize: isMobile ? '10.5px' : '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}>
                  Explore <FaArrowRight style={{ fontSize: '10px' }} />
                </div>
              </div>
            </div>
          ))}

          {/* Previous / Next Slide Arrow Controls */}
          {bannerSlides.length > 1 && (
            <>
              <button
                onClick={handlePrevBanner}
                aria-label="Previous Slide"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '12px',
                  transform: 'translateY(-50%)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)'}
              >
                <FaChevronLeft style={{ fontSize: '14px' }} />
              </button>

              <button
                onClick={handleNextBanner}
                aria-label="Next Slide"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '12px',
                  transform: 'translateY(-50%)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)'}
              >
                <FaChevronRight style={{ fontSize: '14px' }} />
              </button>
            </>
          )}

          {/* Indicator Dots */}
          {bannerSlides.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 10
              }}
            >
              {bannerSlides.map((_, i) => (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerIndex(i);
                  }}
                  style={{
                    width: i === bannerIndex ? '26px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === bannerIndex ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                    boxShadow: i === bannerIndex ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Explore Services Section - Connected to Functional Routes */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px' 
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: C.text }}>
              Explore services
            </h3>
            <button 
              onClick={() => navigate('/employee/credit-cards')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: C.primary, 
                fontSize: '14px', 
                fontWeight: 600, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View all services →
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '10px' : '16px' 
          }}>
            {[
              { 
                icon: FaCreditCard, 
                color: '#8B5CF6', 
                bg: '#F1EBFF', 
                title: 'Credit Cards', 
                desc: 'Premium pre-approved credit cards', 
                route: '/employee/credit-cards' 
              },
              { 
                icon: FaCoins, 
                color: '#059669', 
                bg: '#E8F7EF', 
                title: 'Personal Loan', 
                desc: 'Instant disbursement with lowest rate', 
                route: '/employee/loans/personal-loan' 
              },
              { 
                icon: FaCreditCard, 
                color: '#3B82F6', 
                bg: '#EAF2FF', 
                title: 'Loan on Credit Card', 
                desc: 'Instant limit-backed cash loans', 
                route: '/employee/loan-on-credit-card' 
              },
              { 
                icon: FaChartLine, 
                color: '#F59E0B', 
                bg: '#FFF1DF', 
                title: 'Smart EMI', 
                desc: 'Convert transactions to monthly EMI', 
                route: '/employee/smart-emi' 
              },
              { 
                icon: FaShieldAlt, 
                color: '#F97316', 
                bg: '#FFF1DF', 
                title: 'Insurance', 
                desc: 'Life, health & vehicle insurance', 
                route: '/employee/insurance' 
              },
              { 
                icon: FaLandmark, 
                color: '#0D9488', 
                bg: '#CCFBF1', 
                title: 'All Loans', 
                desc: 'Business, home & collateral loans', 
                route: '/employee/loans' 
              }
            ].map((service, idx) => (
              <div
                key={idx}
                onClick={() => navigate(service.route)}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  padding: isMobile ? '14px 12px' : '18px',
                  boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = service.color;
                  e.currentTarget.style.boxShadow = `0 10px 24px rgba(16, 24, 40, 0.08)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = C.border;
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
                  marginBottom: '14px'
                }}>
                  <service.icon />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: C.text, marginBottom: '4px' }}>
                  {service.title}
                </div>
                <div style={{ fontSize: '13px', color: C.textMid, marginBottom: '12px', lineHeight: 1.4 }}>
                  {service.desc}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: C.primary, 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}>
                  Explore <FaArrowRight style={{ fontSize: '11px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Connected to Real Navigation Routes */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px 0', color: C.text }}>
            Quick actions
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '10px' : '16px' 
          }}>
            {[
              { 
                icon: FaFileAlt, 
                color: '#8B5CF6', 
                bg: '#F1EBFF', 
                title: 'My Applications', 
                desc: 'Track and submit client applications',
                route: '/employee/applications'
              },
              { 
                icon: FaCalendarCheck, 
                color: '#059669', 
                bg: '#E8F7EF', 
                title: 'Mark Attendance', 
                desc: 'Face recognition daily check-in',
                route: '/employee/attendance'
              },
              { 
                icon: FaChartBar, 
                color: '#F59E0B', 
                bg: '#FFF1DF', 
                title: 'View Sales Report', 
                desc: 'Commission & performance insights',
                route: '/employee/sales-reports'
              },
              { 
                icon: FaUsers, 
                color: '#3B82F6', 
                bg: '#EAF2FF', 
                title: 'My Team', 
                desc: 'Team members & partner network',
                route: '/employee/team'
              },
              { 
                icon: FaGift, 
                color: '#EC4899', 
                bg: '#FCE7F3', 
                title: 'My Incentives', 
                desc: 'Earnings, contests & bonus ledger',
                route: '/employee/incentives'
              },
              { 
                icon: FaComments, 
                color: '#6366F1', 
                bg: '#EEF2FF', 
                title: 'Team Messenger', 
                desc: 'Direct staff messaging & queries',
                route: '/employee/messenger'
              }
            ].map((action, idx) => (
              <div
                key={idx}
                onClick={() => navigate(action.route)}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 24, 40, 0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 24, 40, 0.04)';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: C.text, marginBottom: '2px' }}>
                    {action.title}
                  </div>
                  <div style={{ fontSize: '12px', color: C.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {action.desc}
                  </div>
                </div>
                <FaArrowRight style={{ color: C.textLight, fontSize: '13px', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Content Area: Recent Activity & Tips */}
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
              <button 
                onClick={() => navigate('/employee/applications')}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: C.primary, 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                View all →
              </button>
            </div>

            {recentApplications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentApplications.map((app, idx) => {
                  const statusRaw = String(app.status || 'Pending').toLowerCase();
                  let statusLabel = 'Under Review';
                  let statusBg = '#EFF6FF';
                  let statusColor = '#2563EB';

                  if (statusRaw === 'approved' || statusRaw === 'disbursed' || statusRaw === 'commission_released') {
                    statusLabel = 'Approved';
                    statusBg = '#ECFDF5';
                    statusColor = '#059669';
                  } else if (statusRaw === 'rejected' || statusRaw === 'cancelled') {
                    statusLabel = 'Rejected';
                    statusBg = '#FEE2E2';
                    statusColor = '#DC2626';
                  }

                  const customerName = app.customer_name || 'Customer Lead';
                  const initials = customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={app.id || idx}
                      onClick={() => navigate('/employee/applications')}
                      style={{
                        padding: '12px 14px',
                        background: C.bgSecondary || '#F8FAFC',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E8F7EF'}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.bgSecondary || '#F8FAFC'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: C.primary,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {customerName}
                          </div>
                          <div style={{ fontSize: '12px', color: C.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {app.product_name || 'Financial Service'} • {app.app_number || 'Lead'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: statusBg,
                          color: statusColor
                        }}>
                          {statusLabel}
                        </span>
                        <FaArrowRight style={{ fontSize: '11px', color: C.textLight }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                padding: '24px 16px', 
                textAlign: 'center', 
                background: C.bgSecondary || '#F8FAFC', 
                borderRadius: '12px',
                color: C.textMid
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📂</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                  No recent activity
                </div>
                <p style={{ fontSize: '12.5px', color: C.textMid, margin: '0 0 14px 0' }}>
                  Submit leads for credit cards and loans to start earning incentives.
                </p>
                <button
                  onClick={() => navigate('/employee/credit-cards')}
                  style={{
                    background: C.primaryButton,
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Submit First Application
                </button>
              </div>
            )}
          </div>

          {/* Tips to Get Started / Verification Status */}
          <div style={{
            background: isDark ? C.card : '#F0FDF4',
            border: `1px solid ${isDark ? C.border : '#BBF7D0'}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 14px rgba(16, 24, 40, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
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
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: C.text }}>
                    {pendingTasksCount > 0 ? 'Action Required' : !isPunchedIn ? 'Daily Reminder' : 'Performance Tip'}
                  </h3>
                  <span style={{ fontSize: '11px', color: C.textMid, fontWeight: 600 }}>
                    GharKaPaisa Employee Portal
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13.5px', color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                {pendingTasksCount > 0 
                  ? 'Complete your KYC documents and teleprompter video verification to unlock full privileges and instant commission payouts.'
                  : !isPunchedIn
                  ? 'You haven\'t punched today\'s attendance. Check in with facial biometric verification to record your working presence.'
                  : 'Pre-approved lifetime free credit cards and instant personal loans are currently offering high payout rates. Recommend them to your clients today.'
                }
              </p>
            </div>

            <button 
              onClick={() => {
                if (pendingTasksCount > 0) {
                  navigate('/employee/verification');
                } else if (!isPunchedIn) {
                  navigate('/employee/attendance');
                } else {
                  navigate('/employee/credit-cards');
                }
              }}
              style={{
                background: C.primaryButton,
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.background = C.primaryButton}
            >
              {pendingTasksCount > 0 
                ? 'Complete Verification' 
                : !isPunchedIn 
                ? 'Punch Attendance' 
                : 'Explore Products'
              } <FaArrowRight />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
