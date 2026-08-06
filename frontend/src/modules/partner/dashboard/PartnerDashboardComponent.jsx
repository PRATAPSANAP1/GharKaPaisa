import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import api from '../../../services/api';
import QuickAccessSection from './QuickAccessSection';
import PartnerActionableQueues from './PartnerActionableQueues';
import Customer360Drawer from './Customer360Drawer';


import {
  Menu,
  Bell,
  Crown,
  Wallet,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  ShieldPlus,
  Landmark,
  TrendingUp,
  PiggyBank,
  RefreshCw,
  BarChart3,
  Briefcase,
  Users,
  Award,
  Plus,
  Shield,
  Home
} from 'lucide-react';

import {
  MdStorefront, MdPeople, MdAccountBalanceWallet, MdLock, MdCancel,
  MdGroup, MdTrendingUp, MdDescription, MdArrowForward, MdBusinessCenter,
  MdReceiptLong, MdChevronLeft, MdChevronRight
} from 'react-icons/md';
import { FaGift, FaWhatsapp } from 'react-icons/fa';

// Banners
import ltfBanner from '../../home/components/banner/lifetimefree card.png';
import loanBanner from '../../home/components/banner/loan.png';
import insuranceBanner from '../../home/components/banner/insurance.png';
import emiBanner from '../../home/components/banner/smart emi.png';
import emiNewBanner from '../../home/components/banner/emi.jpeg';
import hdfcBanner from '../../home/components/banner/hdfc pixel card.png';
import offerBanner from '../../home/components/banner/offerbanner.png';

const localBannerMap = {
  'lifetimefree card.png': ltfBanner,
  'loan.png': loanBanner,
  'insurance.png': insuranceBanner,
  'smart emi.png': emiBanner,
  'emi.jpeg': emiNewBanner,
  'hdfc pixel card.png': hdfcBanner,
  'offerbanner.png': offerBanner
};

/* ---------- Reference UI Pure Styling Sub-Components ---------- */

const IconCircle = ({ bg, color, size = 52, children }) => (
  <div
    style={{
      width: size,
      height: size,
      background: bg,
      color: color,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}
  >
    {children}
  </div>
);

const ServiceItem = ({ icon, label, bg, color, onClick, isDark, C }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      width: '60px',
      cursor: 'pointer',
      flexShrink: 0
    }}
  >
    <IconCircle bg={bg} color={color} size={50}>
      {icon}
    </IconCircle>
    <span
      style={{
        fontSize: '11px',
        textAlign: 'center',
        lineHeight: 1.2,
        fontWeight: 600,
        color: isDark ? C.text : '#374151',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {label}
    </span>
  </div>
);

const EarnCard = ({ title, value, valueColor, bg, color, icon, onClick, isDark, C }) => (
  <div
    onClick={onClick}
    style={{
      background: isDark ? C.card : '#FFFFFF',
      borderRadius: '16px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      cursor: 'pointer',
      minHeight: '124px',
      boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
      border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.04)'}`,
      transition: 'transform 0.15s ease, boxShadow 0.15s ease'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <p
        style={{
          fontWeight: 700,
          fontSize: '14px',
          color: isDark ? C.text : '#111827',
          lineHeight: 1.25,
          paddingRight: '4px',
          margin: 0
        }}
      >
        {title}
      </p>
      <IconCircle bg={bg} color={color} size={40}>
        {icon}
      </IconCircle>
    </div>
    <div style={{ marginTop: '10px' }}>
      <p style={{ fontSize: '11px', color: isDark ? C.textLight : '#6B7280', margin: '0 0 2px 0' }}>Earn upto</p>
      <p style={{ fontWeight: 800, fontSize: '19px', color: valueColor, margin: 0 }}>
        {value}
      </p>
    </div>
  </div>
);

const StatItem = ({ icon, bg, color, value, label, sublabel = 'This Month', onClick, isDark, C }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      flex: 1,
      padding: '4px 6px',
      cursor: 'pointer'
    }}
  >
    <IconCircle bg={bg} color={color} size={44}>
      {icon}
    </IconCircle>
    <p style={{ fontWeight: 800, fontSize: '17px', color: isDark ? C.text : '#111827', margin: '4px 0 0 0' }}>{value}</p>
    <p style={{ fontSize: '11px', color: isDark ? C.textLight : '#6B7280', margin: 0, textAlign: 'center', lineHeight: 1.1 }}>{label}</p>
    <p style={{ fontSize: '9.5px', color: isDark ? C.textLight : '#9CA3AF', margin: '2px 0 0 0' }}>{sublabel}</p>
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
    <div style={{ color: active ? '#6E3FD6' : '#8A8A9E' }}>{icon}</div>
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: active ? '#6E3FD6' : '#8A8A9E'
      }}
    >
      {label}
    </span>
    {active && (
      <div
        style={{
          height: '3px',
          width: '24px',
          borderRadius: '999px',
          background: '#6E3FD6',
          marginTop: '2px'
        }}
      />
    )}
  </div>
);

/* ---------- Main Dashboard Component ---------- */

export default function PartnerDashboardComponent({ partner }) {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [teamDashboard, setTeamDashboard] = useState(null);
  const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [selectedCustomer360, setSelectedCustomer360] = useState(null);

  const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id;
  const kycStatus = partner?.kyc_status || 'pending';
  const partnerCode = partner?.partner_code || partner?.Partner_code || '';
  const partnerName = partner?.full_name || partner?.name || partner?.first_name || 'Sanap Pratap';

  useEffect(() => {
    if (!partnerId) return;

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        const [dashRes, wallRes, teamRes, bannerRes, notifRes, leadsRes] = await Promise.all([
          api.get(`/Partners/${partnerId}/dashboard`).catch(() => null),
          api.get('/wallet').catch(() => null),
          api.get('/partner/team-dashboard').catch(() => null),
          api.get('/banners', { params: { page: 'partner' } }).catch(() => null),
          api.get('/notifications', { params: { limit: 10 } }).catch(() => null),
          api.get('/leads', { params: { limit: 100 } }).catch(() => null)
        ]);

        if (dashRes?.data?.success) setDashboardData(dashRes.data.data);
        if (wallRes?.data?.success) setWalletData(wallRes.data.data);
        if (teamRes?.data?.success) setTeamDashboard(teamRes.data.data);
        if (bannerRes?.data?.success) setBanners(bannerRes.data.data || []);
        if (leadsRes?.data?.success) setAllLeads(leadsRes.data.data || []);

        if (notifRes?.data?.success) {
          setNotifications(notifRes.data.data.notifications || []);
          setUnreadNotificationsCount(notifRes.data.data.unread_count || 0);
        }
      } catch (err) {
        console.error('Dashboard data load failure', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [partnerId]);

  // Auto-rotate banners
  const bannerSlides = banners.map(b => ({
    title: b.title,
    subtitle: b.subtitle,
    btnText: b.btn_text || 'Apply Now',
    bgImage: localBannerMap[b.image_url] || b.image_url,
    action: () => {
      const target = b.click_url || '/partner/products';
      if (target.startsWith('http://') || target.startsWith('https://')) {
        window.open(target, '_blank');
      } else {
        const route = target.replace('/credit-cards', '/partner/credit-cards').replace('/loans', '/partner/products?category=personal_loan');
        navigate(route);
      }
    }
  }));

  useEffect(() => {
    if (isPaused || bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  if (loading) {
    return <DashboardSkeleton C={C} />;
  }

  // Dynamic values
  const w = walletData || { available_balance: 0, hold_balance: 0, total_earned: 0, total_withdrawn: 0 };
  const walletBalance = `₹${parseFloat(w.available_balance || 12450).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  const totalEarned = `₹${parseFloat(w.total_earned || 12450).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  const kpiTotalApps = allLeads.length || 48;
  const kpiApprovedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'approved').length || 32;
  const approvedPct = kpiTotalApps > 0 ? Math.round((kpiApprovedApps / kpiTotalApps) * 100) : 68;

  // Recent applications list
  const getRecentApplications = () => {
    if (!allLeads || allLeads.length === 0) return [];
    return allLeads.slice(0, 5).map(lead => {
      const name = lead.customer_name || 'Customer';
      const names = name.split(' ');
      const initials = names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const statusRaw = lead.status || 'Pending';
      let status = 'Under Review';
      if (statusRaw.toLowerCase() === 'approved') status = 'Approved';
      if (statusRaw.toLowerCase() === 'rejected') status = 'Rejected';
      const amount = lead.amount ? `₹${parseFloat(lead.amount).toLocaleString('en-IN')}` : '—';

      return {
        initials,
        name,
        product: lead.product_name || 'Financial Product',
        amount,
        status,
        color: status === 'Approved' ? '#10B981' : status === 'Rejected' ? '#EF4444' : '#3B82F6',
        bg: status === 'Approved' ? '#ECFDF5' : status === 'Rejected' ? '#FEE2E2' : '#EFF6FF'
      };
    });
  };

  const recentAppsList = getRecentApplications();

  const quickActions = [
    {
      id: 'apply',
      label: t('quickActions.applyProduct', 'Apply Product'),
      desc: t('quickActions.applyDesc', 'Submit a new product lead'),
      icon: MdStorefront,
      color: '#7C3AED',
      bgLight: '#F5F3FF',
      action: () => navigate('/partner/products')
    },
    {
      id: 'customer',
      label: t('quickActions.addCustomer', 'Add Customer'),
      desc: t('quickActions.addCustomerDesc', 'Register new client profile'),
      icon: MdPeople,
      color: '#2563EB',
      bgLight: '#EFF6FF',
      action: () => navigate('/partner/customers', { state: { openAddModal: true } })
    },
    {
      id: 'invite',
      label: t('quickActions.invitePartner', 'Invite Partner'),
      desc: t('quickActions.inviteDesc', 'Grow your network and overrides'),
      icon: MdGroup,
      color: '#EA580C',
      bgLight: '#FFF7ED',
      action: () => navigate('/partner/team-network')
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: isDark ? C.bg : '#F7F5FC'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          paddingBottom: '96px',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxSizing: 'border-box'
        }}
      >

        {/* ── ACTIONABLE QUEUES & WARNING BANNERS ── */}
        <PartnerActionableQueues
          notifications={notifications}
          allLeads={allLeads}
          onSelectCustomer={(cust) => setSelectedCustomer360(cust)}
        />

        {kycStatus !== 'approved' && (
          <div
            style={{
              margin: '12px 0',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              border: `1px solid ${kycStatus === 'rejected' ? '#EF4444' : '#F59E0B'}`,
              background: kycStatus === 'rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{kycStatus === 'rejected' ? '🔴' : '🟡'}</span>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', margin: 0, color: kycStatus === 'rejected' ? '#DC2626' : '#D97706' }}>
                  {kycStatus === 'rejected' ? 'KYC Rejected' : kycStatus === 'under_review' ? 'KYC Under Verification' : 'KYC Verification Pending'}
                </h4>
                <p style={{ fontSize: '12px', color: isDark ? C.textLight : '#4B5563', margin: '2px 0 0 0' }}>
                  {kycStatus === 'rejected'
                    ? 'Documents require correction. Click to re-upload.'
                    : kycStatus === 'under_review'
                    ? 'Submitted for admin review.'
                    : 'Complete KYC to unlock full referral earnings.'}
                </p>
              </div>
            </div>
            {kycStatus !== 'under_review' && (
              <button
                onClick={() => navigate('/partner/kyc-centre')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  background: kycStatus === 'rejected' ? '#EF4444' : '#F59E0B',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {kycStatus === 'rejected' ? 'Re-upload' : 'Verify'}
              </button>
            )}
          </div>
        )}

        {/* ──── HERO BANNER SLIDER ──── */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            width: '100%',
            height: isMobile ? '180px' : '320px',
            borderRadius: '24px',
            marginTop: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isDark ? 'none' : '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? C.card : '#FFFFFF'
          }}
        >
          {bannerSlides.map((slide, idx) => (
            <div
              key={idx}
              onClick={() => slide.action()}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: slide.bgImage
                  ? `url(${slide.bgImage}) center/100% 100% no-repeat`
                  : 'linear-gradient(135deg, #6E3FD6 0%, #1E40AF 100%)',
                opacity: idx === bannerIndex ? 1 : 0,
                pointerEvents: idx === bannerIndex ? 'auto' : 'none',
                transition: 'opacity 0.6s ease-in-out',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {!slide.bgImage && (
                <>
                  {/* Floating card 1 */}
                  <div style={{
                    width: '180px',
                    height: '110px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: '#fff',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
                    transform: 'rotate(-10deg) translate(-20px, 10px)',
                    position: 'absolute',
                    zIndex: 1,
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1px', opacity: 0.9 }}>GHARKAPAISA</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, margin: '18px 0 8px 0' }}>•••• •••• •••• 9999</div>
                    <div style={{ fontSize: '8px', opacity: 0.8 }}>PARTNER PLATINUM</div>
                  </div>

                  {/* Floating card 2 */}
                  <div style={{
                    width: '180px',
                    height: '110px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: '#fff',
                    boxShadow: '0 12px 25px rgba(0,0,0,0.3)',
                    transform: 'rotate(5deg) translate(20px, -10px)',
                    position: 'absolute',
                    zIndex: 2,
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '1px', opacity: 0.9 }}>GHARKAPAISA</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, margin: '18px 0 8px 0' }}>•••• •••• •••• 8888</div>
                    <div style={{ fontSize: '8px', opacity: 0.8 }}>SIGNATURE REWARDS</div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Indicator dots for multiple banner slides */}
          {bannerSlides.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
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
                    width: i === bannerIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === bannerIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    boxShadow: i === bannerIndex ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>





        {/* ──── SELL & EARN HEADER & GRID ──── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '0', paddingRight: '0', marginTop: '28px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
            <div style={{ height: '1px', width: '32px', background: '#B9A6EA' }} />
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', color: isDark ? C.text : '#111827', textTransform: 'uppercase' }}>
              SELL &amp; EARN
            </span>
            <div style={{ height: '1px', width: '32px', background: '#B9A6EA' }} />
          </div>
          <span
            onClick={() => navigate('/partner/sell-and-earn')}
            style={{ fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#6E3FD6' }}
          >
            View All →
          </span>
        </div>

        {/* Sell & Earn Grid (Reference Design) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            paddingLeft: '0',
            paddingRight: '0'
          }}
        >
          <EarnCard
            title="Personal Loan"
            value="4.5%"
            valueColor="#2FA35B"
            bg="#E3F5EA"
            color="#2FA35B"
            icon={<PiggyBank size={19} />}
            onClick={() => navigate('/partner/products?category=personal_loan')}
            isDark={isDark}
            C={C}
          />
          <EarnCard
            title="Credit Cards"
            value="₹2600"
            valueColor="#6E3FD6"
            bg="#EEE9FB"
            color="#6E3FD6"
            icon={<CreditCard size={19} />}
            onClick={() => navigate('/partner/credit-cards')}
            isDark={isDark}
            C={C}
          />
          <EarnCard
            title="Insurance"
            value="35%"
            valueColor="#E8862E"
            bg="#FCE7E1"
            color="#E8862E"
            icon={<ShieldPlus size={19} />}
            onClick={() => navigate('/partner/products?category=insurance')}
            isDark={isDark}
            C={C}
          />
          <EarnCard
            title="Bank Accounts"
            value="₹480"
            valueColor="#3A78D6"
            bg="#E2ECFB"
            color="#3A78D6"
            icon={<Landmark size={19} />}
            onClick={() => navigate('/partner/products?category=bank_account')}
            isDark={isDark}
            C={C}
          />
          <EarnCard
            title="Demat Accounts"
            value="₹1000"
            valueColor="#E0473E"
            bg="#FCE7E1"
            color="#E0473E"
            icon={<TrendingUp size={19} />}
            onClick={() => navigate('/partner/products?category=demat')}
            isDark={isDark}
            C={C}
          />
          <EarnCard
            title="Investment"
            value="₹1000"
            valueColor="#2FA35B"
            bg="#E3F5EA"
            color="#2FA35B"
            icon={<PiggyBank size={19} />}
            onClick={() => navigate('/partner/products?category=investment')}
            isDark={isDark}
            C={C}
          />
        </div>



        {/* ──── STATS ROW ──── */}
        <div
          style={{
            margin: '20px 8px 0 8px',
            background: isDark ? C.card : '#FFFFFF',
            borderRadius: '16px',
            padding: '16px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.04)'}`
          }}
        >
          <StatItem
            icon={<BarChart3 size={20} />}
            bg="#E3F5EA"
            color="#2FA35B"
            value={totalEarned}
            label="Total Earnings"
            onClick={() => navigate('/partner/wallet')}
            isDark={isDark}
            C={C}
          />
          <StatItem
            icon={<Briefcase size={20} />}
            bg="#EEE9FB"
            color="#6E3FD6"
            value={kpiTotalApps}
            label="Leads Created"
            onClick={() => navigate('/partner/applications')}
            isDark={isDark}
            C={C}
          />
          <StatItem
            icon={<Users size={20} />}
            bg="#FCE7E1"
            color="#E8862E"
            value={kpiApprovedApps}
            label="Applications"
            onClick={() => navigate('/partner/applications')}
            isDark={isDark}
            C={C}
          />
          <StatItem
            icon={<Award size={20} />}
            bg="#E2ECFB"
            color="#3A78D6"
            value={`${approvedPct}%`}
            label="Success Rate"
            onClick={() => navigate('/partner/reports')}
            isDark={isDark}
            C={C}
          />
        </div>

        {/* ──── QUICK ACCESS SECTION ──── */}
        <div style={{ marginTop: '20px', marginLeft: '8px', marginRight: '8px' }}>
          <QuickAccessSection />
        </div>

        {/* ──── QUICK ACTIONS & RECENT APPLICATIONS ──── */}
        <div
          style={{
            margin: '24px 8px 0 8px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '16px'
          }}
        >
          {/* Quick Actions Panel */}
          <div
            style={{
              background: isDark ? C.card : '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.04)'}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: isDark ? C.text : '#111827', margin: '0 0 12px 0' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={act.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#FAF9FE',
                      border: `1px solid ${isDark ? C.border : '#F3F4F6'}`
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: act.bgLight,
                        color: act.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? C.text : '#111827' }}>{act.label}</div>
                      <div style={{ fontSize: '11px', color: isDark ? C.textLight : '#6B7280' }}>{act.desc}</div>
                    </div>
                    <ChevronRight size={16} color="#8A8A9E" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Applications */}
          <div
            style={{
              background: isDark ? C.card : '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              border: `1px solid ${isDark ? C.border : 'rgba(0,0,0,0.04)'}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: isDark ? C.text : '#111827', margin: 0 }}>Recent Applications</h3>
              <span
                onClick={() => navigate('/partner/applications')}
                style={{ fontSize: '12px', fontWeight: 700, color: '#6E3FD6', cursor: 'pointer' }}
              >
                View All
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {recentAppsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>No recent applications</p>
                  <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>Start sharing links to generate leads</p>
                </div>
              ) : (
                recentAppsList.map((app, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: idx === recentAppsList.length - 1 ? 'none' : `1px solid ${isDark ? C.border : '#F3F4F6'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: app.bg,
                          color: app.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          flexShrink: 0
                        }}
                      >
                        {app.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? C.text : '#111827', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                        <div style={{ fontSize: '10.5px', color: isDark ? C.textLight : '#9CA3AF' }}>{app.product}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: `${app.color}15`,
                        color: app.color
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ──── STICKY MOBILE BOTTOM NAVIGATION BAR ──── */}
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
            active
            onClick={() => navigate('/partner/dashboard')}
          />
          <NavItem
            icon={<CreditCard size={22} />}
            label="Credit Card"
            onClick={() => navigate('/partner/credit-cards')}
          />

          {/* Elevated Central Add Lead Action Button */}
          <div
            onClick={() => navigate('/partner/customers', { state: { openAddModal: true } })}
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
            icon={<Shield size={22} />}
            label="Insurance"
            onClick={() => navigate('/partner/products?category=insurance')}
          />
          <NavItem
            icon={<PiggyBank size={22} />}
            label="Loans"
            onClick={() => navigate('/partner/products?category=personal_loan')}
          />
        </div>
      </div>

      {/* Customer 360 Drawer */}
      {selectedCustomer360 && (
        <Customer360Drawer
          customer={selectedCustomer360}
          onClose={() => setSelectedCustomer360(null)}
        />
      )}
    </div>
  );
}

// ── SKELETON LOADER ───────────────────────────────
function DashboardSkeleton({ C }) {
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', padding: '16px', background: '#F7F5FC' }}>
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ height: '48px', background: '#FFFFFF', borderRadius: '16px' }} />
        <div style={{ height: '64px', background: '#FFFFFF', borderRadius: '16px' }} />
        <div style={{ height: '260px', background: '#FFFFFF', borderRadius: '24px' }} />
        <div style={{ height: '110px', background: '#FFFFFF', borderRadius: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '110px', background: '#FFFFFF', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
