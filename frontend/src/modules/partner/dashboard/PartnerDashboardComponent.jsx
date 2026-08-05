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
  Home,
  Sparkles
} from 'lucide-react';

import {
  MdStorefront, MdPeople, MdAccountBalanceWallet, MdLock, MdCancel,
  MdGroup, MdTrendingUp, MdDescription, MdArrowForward, MdBusinessCenter,
  MdReceiptLong, MdChevronLeft, MdChevronRight
} from 'react-icons/md';
import { FaGift, FaWhatsapp } from 'react-icons/fa';

// Bank logos
import hdfcLogo from '../../home/components/banks/hdfc_bank.png';
import axisLogo from '../../home/components/banks/axis_bank.png';
import kotakLogo from '../../home/components/banks/kotak_bank.png';
import sbiLogo from '../../home/components/banks/sbi_card.png';
import iciciLogo from '../../home/components/banks/icici_bank.png';
import yesLogo from '../../home/components/banks/yes_bank.png';
import idfcLogo from '../../home/components/banks/idfc_first_bank.png';
import bobLogo from '../../home/components/banks/bank_of_baroda.png';

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

/* ---------- Reference UI Building Blocks ---------- */

const IconCircle = ({ bg, color, size = 52, children }) => (
  <div
    style={{ width: size, height: size, background: bg, color }}
    className="rounded-full flex items-center justify-center shrink-0 shadow-sm"
  >
    {children}
  </div>
);

const ServiceItem = ({ icon, label, bg, color, onClick }) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 w-16 cursor-pointer hover:scale-105 transition-transform"
  >
    <IconCircle bg={bg} color={color} size={50}>
      {icon}
    </IconCircle>
    <span className="text-[11px] text-center leading-tight font-medium text-gray-700 dark:text-gray-200">
      {label}
    </span>
  </div>
);

const EarnCard = ({ title, value, valueColor, bg, color, icon, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100 dark:border-slate-700"
    style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', minHeight: 124 }}
  >
    <div className="flex items-start justify-between">
      <p className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug pr-1">
        {title}
      </p>
      <IconCircle bg={bg} color={color} size={40}>
        {icon}
      </IconCircle>
    </div>
    <div>
      <p className="text-[11px] text-gray-400 dark:text-gray-400">Earn upto</p>
      <p className="font-bold text-[19px]" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  </div>
);

const StatItem = ({ icon, bg, color, value, label, sublabel = 'This Month', onClick }) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-1 flex-1 px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity"
  >
    <IconCircle bg={bg} color={color} size={44}>
      {icon}
    </IconCircle>
    <p className="font-bold text-[17px] text-gray-900 dark:text-white mt-1">{value}</p>
    <p className="text-[11.5px] text-gray-500 dark:text-gray-400 leading-none text-center">{label}</p>
    <p className="text-[9.5px] text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</p>
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer">
    <div style={{ color: active ? '#6E3FD6' : '#8A8A9E' }}>{icon}</div>
    <span
      className="text-[11px] font-medium"
      style={{ color: active ? '#6E3FD6' : '#8A8A9E' }}
    >
      {label}
    </span>
    {active && (
      <div
        className="h-[3px] w-6 rounded-full mt-0.5"
        style={{ background: '#6E3FD6' }}
      />
    )}
  </div>
);

/* ---------- Main Component ---------- */

export default function PartnerDashboardComponent({ partner }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);
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
  const [trainingModules, setTrainingModules] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [selectedCustomer360, setSelectedCustomer360] = useState(null);
  const [referralCopied, setReferralCopied] = useState(false);

  const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id;
  const kycStatus = partner?.kyc_status || 'pending';
  const accountStatus = partner?.status || 'pending';
  const partnerCode = partner?.partner_code || partner?.Partner_code || '';
  const partnerName = partner?.full_name || partner?.name || partner?.first_name || 'Sanap Pratap';

  useEffect(() => {
    if (!partnerId) return;

    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        const [dashRes, wallRes, teamRes, trainRes, bannerRes, notifRes, leadsRes, prodRes, svcRes] = await Promise.all([
          api.get(`/Partners/${partnerId}/dashboard`).catch(() => null),
          api.get('/wallet').catch(() => null),
          api.get('/partner/team-dashboard').catch(() => null),
          api.get('/partner/training').catch(() => null),
          api.get('/banners').catch(() => null),
          api.get('/notifications', { params: { limit: 10 } }).catch(() => null),
          api.get('/leads', { params: { limit: 100 } }).catch(() => null),
          api.get('/products', { params: { is_active: 'true', limit: 100 } }).catch(() => null),
          api.get('/service-catalog').catch(() => null)
        ]);

        if (dashRes?.data?.success) setDashboardData(dashRes.data.data);
        if (wallRes?.data?.success) setWalletData(wallRes.data.data);
        if (teamRes?.data?.success) setTeamDashboard(teamRes.data.data);
        if (trainRes?.data?.success) setTrainingModules(trainRes.data.data || []);
        if (bannerRes?.data?.success) setBanners(bannerRes.data.data || []);
        if (leadsRes?.data?.success) setAllLeads(leadsRes.data.data || []);
        if (prodRes?.data?.success) setProducts(prodRes.data.data || []);
        if (svcRes?.data?.success) setServices(svcRes.data.data || []);

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
  const bannerSlides = banners.length > 0 ? banners.map(b => ({
    title: b.title,
    subtitle: b.subtitle,
    btnText: b.btn_text || 'Apply Now',
    bgImage: localBannerMap[b.image_url] || b.image_url,
    action: () => {
      const target = b.click_url || '/partner/products';
      if (target.startsWith('http://') || target.startsWith('https://')) {
        window.open(target, '_blank');
      } else {
        const route = target.replace('/credit-cards', '/partner/products?category=credit_card').replace('/loans', '/partner/products?category=personal_loan');
        navigate(route);
      }
    }
  })) : [
    {
      title: t('home.banners.slideOffer.title', 'Special Offer'),
      subtitle: t('home.banners.slideOffer.subtitle', 'Exclusive credit card and loan deals'),
      btnText: t('home.banners.slideOffer.btn', 'View Offers'),
      bgImage: offerBanner,
      action: () => navigate('/partner/products')
    },
    {
      title: t('home.banners.slide0.title', 'Lifetime Free Credit Cards'),
      subtitle: t('home.banners.slide0.subtitle', 'Zero Joining Fee • Zero Annual Fee'),
      btnText: t('home.banners.slide0.btn', 'Explore Now'),
      bgImage: ltfBanner,
      action: () => navigate('/partner/products?category=credit_card')
    },
    {
      title: t('home.banners.slide1.title', 'Personal Loans'),
      subtitle: t('home.banners.slide1.subtitle', 'Low Interest Rates • Quick Disbursal'),
      btnText: t('home.banners.slide1.btn', 'Apply Now'),
      bgImage: loanBanner,
      action: () => navigate('/partner/products?category=personal_loan')
    }
  ];

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

  // Format dynamic recent applications list
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
      className="min-h-screen w-full flex flex-col items-center transition-colors"
      style={{ background: isDark ? C.bg : '#F7F5FC' }}
    >
      <div className="w-full max-w-4xl pb-24 px-2 sm:px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        
        {/* ──── REFERENCE HEADER BAR ──── */}
        <div className="flex items-center justify-between px-2 pt-4 pb-2">
          <Menu size={24} color={isDark ? C.text : '#1A1A1A'} className="cursor-pointer" onClick={() => navigate('/partner/settings')} />
          
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/partner/dashboard')}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-xs"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4A9CE8, #1B1547)'
              }}
            >
              G
            </div>
            <span className="font-extrabold text-[17px] tracking-tight">
              <span style={{ color: isDark ? '#FFFFFF' : '#1E2A4A' }}>GHAR</span>
              <span style={{ color: '#3AA655' }}>KAPAISA</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/partner/team-network')}
              className="flex items-center gap-1 rounded-full px-3 py-1 border transition-all hover:scale-105"
              style={{ borderColor: '#E8A93C', background: isDark ? 'rgba(232, 169, 60, 0.1)' : '#fff' }}
            >
              <Crown size={14} color="#C98A1F" />
              <span className="text-[12px] font-bold" style={{ color: '#C98A1F' }}>
                To Gold
              </span>
            </button>

            <div className="relative cursor-pointer" onClick={() => navigate('/partner/notifications')}>
              <Bell size={22} color={isDark ? C.text : '#1A1A1A'} />
              <span
                className="absolute -top-1.5 -right-1.5 text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold"
                style={{ background: '#E03B3B' }}
              >
                {unreadNotificationsCount || 3}
              </span>
            </div>
          </div>
        </div>

        {/* ── ACTIONABLE QUEUES & WARNING BANNERS ── */}
        <PartnerActionableQueues
          notifications={notifications}
          allLeads={allLeads}
          onSelectCustomer={(cust) => setSelectedCustomer360(cust)}
        />

        {kycStatus !== 'approved' && (
          <div
            className="mx-2 my-3 rounded-2xl p-4 flex items-center justify-between gap-3 border shadow-sm"
            style={{
              background: kycStatus === 'rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: kycStatus === 'rejected' ? '#EF4444' : '#F59E0B'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{kycStatus === 'rejected' ? '🔴' : '🟡'}</span>
              <div>
                <h4 className="font-bold text-sm" style={{ color: kycStatus === 'rejected' ? '#DC2626' : '#D97706' }}>
                  {kycStatus === 'rejected' ? 'KYC Rejected' : kycStatus === 'under_review' ? 'KYC Under Verification' : 'KYC Verification Pending'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
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
                className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shrink-0 shadow"
                style={{ background: kycStatus === 'rejected' ? '#EF4444' : '#F59E0B' }}
              >
                {kycStatus === 'rejected' ? 'Re-upload' : 'Verify'}
              </button>
            )}
          </div>
        )}

        {/* ──── GREETING + WALLET CARD ──── */}
        <div className="flex items-center justify-between px-2 mt-4">
          <div className="flex items-center gap-3">
            <div
              className="w-13 h-13 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#E9E4F7', width: 50, height: 50 }}
            >
              <Users size={24} color="#9B8CC7" />
            </div>
            <div>
              <p className="font-bold text-[18px] leading-tight" style={{ color: isDark ? C.text : '#1A1A2E' }}>
                Hi, {partnerName} 👋
              </p>
              <p className="text-[12.5px]" style={{ color: isDark ? C.textLight : '#8A8A9E' }}>
                Welcome back to your dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Balance Widget */}
        <div
          onClick={() => navigate('/partner/wallet')}
          className="mx-2 mt-3 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-all border border-gray-100 dark:border-slate-700"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#EDE7FB' }}
            >
              <Wallet size={20} color="#7C4FE0" />
            </div>
            <div>
              <p className="font-bold text-[16px]" style={{ color: '#5B3FC4' }}>
                {walletBalance}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-400">Wallet Balance</p>
            </div>
          </div>
          <ChevronRight size={18} color="#8A8A9E" />
        </div>

        {/* ──── HERO BANNER (SALARYSE / GHARKAPAISA STYLE CARD) ──── */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="mx-2 mt-5 rounded-[20px] relative overflow-hidden cursor-pointer"
          style={{
            height: isMobile ? 290 : 320,
            background: 'linear-gradient(135deg, #1B1547 0%, #2E2470 60%, #3B2A8C 100%)',
            boxShadow: '0 8px 20px rgba(30,20,80,0.15)'
          }}
          onClick={() => bannerSlides[bannerIndex]?.action()}
        >
          {/* Watermark Rupee */}
          <span
            className="absolute top-3 right-4 text-[76px] font-bold select-none"
            style={{ color: 'rgba(255,255,255,0.07)' }}
          >
            ₹
          </span>

          {/* Lime Wave SVG */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            height="60"
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
          >
            <path d="M0,30 C100,60 300,0 400,30 L400,60 L0,60 Z" fill="#D9E547" />
          </svg>

          <div className="relative z-10 p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <div
                  className="w-4 h-4"
                  style={{ background: '#3A6FE0', clipPath: 'polygon(0 0,100% 0,100% 100%)' }}
                />
                <span className="text-white font-bold text-[15px]">
                  salary<span style={{ color: '#E8E135' }}>se</span>
                </span>
              </div>

              <p className="text-white font-bold text-[22px] sm:text-[25px] leading-tight">
                India ka sabse
              </p>
              <p
                className="font-bold text-[24px] sm:text-[27px] leading-tight"
                style={{ color: '#E8E135' }}
              >
                Rewarding Credit Card
              </p>

              <p className="text-white/90 text-[13.5px] mt-2.5">
                har UPI payment pe milega <b className="text-white font-extrabold">7.5% back</b>
              </p>
              <p className="text-white font-bold text-[17px] mt-1">
                Earn Upto ₹2000
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`https://gharkapaisa.in/register?ref=${partnerCode}`);
                  const shareLink = `https://gharkapaisa.in/register?ref=${partnerCode}`;
                  const text = encodeURIComponent(`Join my network on GharKaPaisa, refer financial products & earn payouts! Register here: ${shareLink}`);
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}
                className="mt-3.5 bg-white rounded-full px-5 py-2 font-bold text-[13.5px] flex items-center gap-2 hover:bg-gray-100 transition-colors"
                style={{ color: '#1B1547' }}
              >
                Refer Now <span>→</span>
              </button>
            </div>

            <p className="text-[10px] text-white/70 mb-2">*T&amp;C apply</p>
          </div>

          {/* Coin Stack Illustration */}
          <div className="absolute bottom-6 right-4 flex gap-1 z-0 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col-reverse gap-0.5">
                {Array.from({ length: 4 - i }).map((_, j) => (
                  <div
                    key={j}
                    className="w-7 h-2.5 rounded-full"
                    style={{
                      background: 'linear-gradient(180deg,#F5D061,#D9A62A)'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {bannerSlides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setBannerIndex(idx)}
              className="cursor-pointer transition-all duration-300"
              style={{
                width: idx === bannerIndex ? 20 : 6,
                height: 6,
                borderRadius: 4,
                background: idx === bannerIndex ? '#6E3FD6' : '#D9D5E8'
              }}
            />
          ))}
        </div>

        {/* ──── TOP SERVICES CARD ──── */}
        <div
          className="mx-2 mt-5 bg-white dark:bg-slate-800 rounded-[18px] p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 dark:border-slate-700"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <div
            className="rounded-full flex flex-col items-center justify-center shrink-0 text-center"
            style={{ width: 84, height: 84, background: '#EFE9FB' }}
          >
            <span className="text-[10.5px] text-gray-500 font-medium">Earn upto</span>
            <span className="font-bold text-[24px]" style={{ color: '#6E3FD6' }}>
              4%
            </span>
          </div>

          <div className="w-px self-stretch bg-gray-100 dark:bg-slate-700" />

          <div className="flex-1 overflow-x-auto no-scrollbar">
            <p className="font-bold text-[14.5px] text-gray-900 dark:text-white mb-2.5">
              Top Services
            </p>
            <div className="flex items-center justify-between min-w-[310px]">
              <ServiceItem
                icon={<CreditCard size={20} />}
                label="Credit Card"
                bg="#EEE9FB"
                color="#6E3FD6"
                onClick={() => navigate('/partner/products?category=credit_card')}
              />
              <ServiceItem
                icon={<PiggyBank size={20} />}
                label="Personal Loan"
                bg="#E3F5EA"
                color="#2FA35B"
                onClick={() => navigate('/partner/products?category=personal_loan')}
              />
              <ServiceItem
                icon={<ShieldPlus size={20} />}
                label="Insurance"
                bg="#EEE9FB"
                color="#6E3FD6"
                onClick={() => navigate('/partner/products?category=insurance')}
              />
              <ServiceItem
                icon={<Landmark size={20} />}
                label="Bank Account"
                bg="#E3F5EA"
                color="#2FA35B"
                onClick={() => navigate('/partner/products?category=bank_account')}
              />
              <ServiceItem
                icon={<TrendingUp size={20} />}
                label="Demat Account"
                bg="#FCE7E1"
                color="#E85B3A"
                onClick={() => navigate('/partner/products?category=demat')}
              />
            </div>
          </div>
        </div>

        {/* ──── SELL & EARN HEADER & GRID ──── */}
        <div className="flex items-center justify-between px-2 mt-7 mb-3">
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="h-px w-8" style={{ background: '#B9A6EA' }} />
            <span className="font-bold text-[13px] tracking-wider text-gray-900 dark:text-white uppercase">
              SELL &amp; EARN
            </span>
            <div className="h-px w-8" style={{ background: '#B9A6EA' }} />
          </div>
          <span
            onClick={() => navigate('/partner/products')}
            className="text-[12.5px] font-bold cursor-pointer flex items-center gap-1 hover:underline"
            style={{ color: '#6E3FD6' }}
          >
            View All →
          </span>
        </div>

        {/* Sell & Earn Grid (Reference Design) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-2">
          <EarnCard
            title="Personal Loan"
            value="4.5%"
            valueColor="#2FA35B"
            bg="#E3F5EA"
            color="#2FA35B"
            icon={<PiggyBank size={19} />}
            onClick={() => navigate('/partner/products?category=personal_loan')}
          />
          <EarnCard
            title="Credit Cards"
            value="₹2600"
            valueColor="#6E3FD6"
            bg="#EEE9FB"
            color="#6E3FD6"
            icon={<CreditCard size={19} />}
            onClick={() => navigate('/partner/products?category=credit_card')}
          />
          <EarnCard
            title="Insurance"
            value="35%"
            valueColor="#E8862E"
            bg="#FCE7E1"
            color="#E8862E"
            icon={<ShieldPlus size={19} />}
            onClick={() => navigate('/partner/products?category=insurance')}
          />
          <EarnCard
            title="Bank Accounts"
            value="₹480"
            valueColor="#3A78D6"
            bg="#E2ECFB"
            color="#3A78D6"
            icon={<Landmark size={19} />}
            onClick={() => navigate('/partner/products?category=bank_account')}
          />
          <EarnCard
            title="Demat Accounts"
            value="₹1000"
            valueColor="#E0473E"
            bg="#FCE7E1"
            color="#E0473E"
            icon={<TrendingUp size={19} />}
            onClick={() => navigate('/partner/products?category=demat')}
          />
          <EarnCard
            title="Investment"
            value="₹1000"
            valueColor="#2FA35B"
            bg="#E3F5EA"
            color="#2FA35B"
            icon={<PiggyBank size={19} />}
            onClick={() => navigate('/partner/products?category=investment')}
          />
        </div>

        {/* ──── ADDITIONAL EARNING OPTIONS BANNER ──── */}
        <div
          className="mx-2 mt-5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: '#EFF8F1', border: '1px solid #CFEBD8' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm"
            >
              <RefreshCw size={18} color="#2FA35B" />
            </div>
            <div>
              <p
                className="text-[11px] font-bold tracking-wide mb-0.5"
                style={{ color: '#2FA35B' }}
              >
                ADDITIONAL EARNING OPTIONS
              </p>
              <p className="font-bold text-[14.5px] text-gray-900">
                Mutual Fund Distribution
              </p>
              <p className="text-[11.5px] text-gray-500">
                Earn Recurring Commissions
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/partner/products?category=investment')}
            className="w-full sm:w-auto rounded-xl px-4 py-2 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 transition-all hover:bg-emerald-800 shrink-0 shadow"
            style={{ background: '#1E7A46' }}
          >
            Start Now →
          </button>
        </div>

        {/* ──── STATS ROW ──── */}
        <div
          className="mx-2 mt-5 bg-white dark:bg-slate-800 rounded-2xl py-4 px-2 flex justify-between items-center border border-gray-100 dark:border-slate-700"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          <StatItem
            icon={<BarChart3 size={20} />}
            bg="#E3F5EA"
            color="#2FA35B"
            value={totalEarned}
            label="Total Earnings"
            onClick={() => navigate('/partner/wallet')}
          />
          <StatItem
            icon={<Briefcase size={20} />}
            bg="#EEE9FB"
            color="#6E3FD6"
            value={kpiTotalApps}
            label="Leads Created"
            onClick={() => navigate('/partner/applications')}
          />
          <StatItem
            icon={<Users size={20} />}
            bg="#FCE7E1"
            color="#E8862E"
            value={kpiApprovedApps}
            label="Applications"
            onClick={() => navigate('/partner/applications')}
          />
          <StatItem
            icon={<Award size={20} />}
            bg="#E2ECFB"
            color="#3A78D6"
            value={`${approvedPct}%`}
            label="Success Rate"
            onClick={() => navigate('/partner/reports')}
          />
        </div>

        {/* ──── QUICK ACCESS SECTION ──── */}
        <div className="mt-5 mx-2">
          <QuickAccessSection />
        </div>

        {/* ──── QUICK ACTIONS & RECENT APPLICATIONS ──── */}
        <div className="mx-2 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2.5">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={act.action}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-gray-50 dark:border-slate-700"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: act.bgLight, color: act.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{act.label}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">{act.desc}</div>
                    </div>
                    <ChevronRight size={16} color="#8A8A9E" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Applications</h3>
              <span
                onClick={() => navigate('/partner/applications')}
                className="text-xs font-bold text-purple-600 cursor-pointer hover:underline"
              >
                View All
              </span>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {recentAppsList.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-xs font-semibold">No recent applications</p>
                  <p className="text-[11px]">Start sharing links to generate leads</p>
                </div>
              ) : (
                recentAppsList.map((app, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ background: app.bg, color: app.color }}
                      >
                        {app.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white max-w-[120px] truncate">{app.name}</div>
                        <div className="text-[10px] text-gray-400">{app.product}</div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${app.color}15`, color: app.color }}
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
      <div className="fixed bottom-0 left-0 w-full flex justify-center z-50 pointer-events-none">
        <div
          className="w-full max-w-md bg-white dark:bg-slate-800 flex items-center justify-between px-6 pointer-events-auto border-t border-gray-100 dark:border-slate-700"
          style={{
            height: 72,
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
            onClick={() => navigate('/partner/products?category=credit_card')}
          />

          {/* Elevated Central Add Lead Action Button */}
          <div
            className="flex flex-col items-center -mt-7 cursor-pointer"
            onClick={() => navigate('/partner/customers', { state: { openAddModal: true } })}
          >
            <div
              className="w-13 h-13 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                width: 52,
                height: 52,
                background: '#7C4FE0',
                boxShadow: '0 4px 14px rgba(124,79,224,0.45)'
              }}
            >
              <Plus size={26} color="#fff" />
            </div>
            <span className="text-[11px] font-medium mt-0.5" style={{ color: '#8A8A9E' }}>
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
    <div className="min-h-screen w-full flex justify-center p-4" style={{ background: '#F7F5FC' }}>
      <div className="w-full max-w-md space-y-4 animate-pulse">
        <div className="h-12 bg-white rounded-2xl" />
        <div className="h-16 bg-white rounded-2xl" />
        <div className="h-64 bg-white rounded-3xl" />
        <div className="h-28 bg-white rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
