import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import QuickAccessSection from './QuickAccessSection';
import {
  MdDashboard, MdStorefront, MdLeaderboard, MdPeople,
  MdAccountBalanceWallet, MdDeviceHub, MdSchool, MdCampaign,
  MdNotifications, MdSupportAgent, MdVerifiedUser, MdSettings,
  MdCheckCircle, MdCancel, MdPending, MdChevronLeft, MdChevronRight,
  MdSearch, MdFilterList, MdShare, MdDownload, MdLock, MdPlayCircleOutline,
  MdAdd, MdDescription, MdEvent, MdTimeline, MdArrowUpward, MdTrendingUp,
  MdFlight, MdAccessTime, MdShield, MdCreditCard, MdGroup, MdEmojiEvents, MdContentCopy
} from "react-icons/md";
import { FaLock, FaWhatsapp, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";

// Bank logos
import hdfcLogo from "../../home/components/banks/hdfc_bank.png";
import axisLogo from "../../home/components/banks/axis_bank.png";
import kotakLogo from "../../home/components/banks/kotak_bank.png";
import sbiLogo from "../../home/components/banks/sbi_card.png";
import iciciLogo from "../../home/components/banks/icici_bank.png";
import yesLogo from "../../home/components/banks/yes_bank.png";
import idfcLogo from "../../home/components/banks/idfc_first_bank.png";
import bobLogo from "../../home/components/banks/bank_of_baroda.png";


export default function PartnerDashboard({ partner }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [teamDashboard, setTeamDashboard] = useState(null);
  const [trainingModules, setTrainingModules] = useState([]);
  const [banners, setBanners] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('All');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [activeDashboardCategory, setActiveDashboardCategory] = useState('credit_card');
  const [selectedMoreInfoCard, setSelectedMoreInfoCard] = useState(null);

  // Category Specific Role & Bank Cards Data
  const creditCardRoleCards = [
    { title: "Employee", sub: "Role", count: "120", availableCards: "12 Roles & Cards", commission: "Up to ₹2,000 / lead", applications: "120 logged", approvalRatio: "92%", route: "/partner/products?category=credit_card", bankKey: "" },
    { title: "HDFC Cards", sub: "Bank", count: "60139", availableCards: "18 Credit Card Variants", commission: "Up to ₹2,500 / approval", applications: "60,139 logged", approvalRatio: "88%", route: "/partner/products?bank=HDFC", bankKey: "HDFC" },
    { title: "SBI Cards", sub: "Bank", count: "9398", availableCards: "14 Credit Card Variants", commission: "Up to ₹2,200 / approval", applications: "9,398 logged", approvalRatio: "85%", route: "/partner/products?bank=SBI", bankKey: "SBI" },
    { title: "ICICI Cards", sub: "Bank", count: "28", availableCards: "15 Credit Card Variants", commission: "Up to ₹2,400 / approval", applications: "28 logged", approvalRatio: "86%", route: "/partner/products?bank=ICICI", bankKey: "ICICI" },
    { title: "AXIS Cards", sub: "Bank", count: "1676", availableCards: "16 Credit Card Variants", commission: "Up to ₹2,300 / approval", applications: "1,676 logged", approvalRatio: "84%", route: "/partner/products?bank=AXIS", bankKey: "AXIS" },
    { title: "INDUSIND Cards", sub: "Bank", count: "2381", availableCards: "10 Credit Card Variants", commission: "Up to ₹2,100 / approval", applications: "2,381 logged", approvalRatio: "89%", route: "/partner/products?bank=INDUSIND", bankKey: "INDUSIND" },
    { title: "IDFC Cards", sub: "Bank", count: "13", availableCards: "8 Credit Card Variants", commission: "Up to ₹2,000 / approval", applications: "13 logged", approvalRatio: "91%", route: "/partner/products?bank=IDFC", bankKey: "IDFC" },
    { title: "AU Cards", sub: "Bank", count: "15", availableCards: "6 Credit Card Variants", commission: "Up to ₹1,800 / approval", applications: "15 logged", approvalRatio: "87%", route: "/partner/products?bank=AU", bankKey: "AU" },
    { title: "HSBC Cards", sub: "Bank", count: "3", availableCards: "5 Credit Card Variants", commission: "Up to ₹2,500 / approval", applications: "3 logged", approvalRatio: "90%", route: "/partner/products?bank=HSBC", bankKey: "HSBC" },
    { title: "FEDERAL Cards", sub: "Bank", count: "10", availableCards: "4 Credit Card Variants", commission: "Up to ₹1,900 / approval", applications: "10 logged", approvalRatio: "83%", route: "/partner/products?bank=FEDERAL", bankKey: "FEDERAL" },
    { title: "BOB Cards", sub: "Bank", count: "184", availableCards: "9 Credit Card Variants", commission: "Up to ₹1,850 / approval", applications: "184 logged", approvalRatio: "82%", route: "/partner/products?bank=BOB", bankKey: "BOB" },
    { title: "YES Cards", sub: "Bank", count: "73", availableCards: "7 Credit Card Variants", commission: "Up to ₹2,000 / approval", applications: "73 logged", approvalRatio: "85%", route: "/partner/products?bank=YES", bankKey: "YES" },
    { title: "KOTAK Cards", sub: "Bank", count: "5", availableCards: "11 Credit Card Variants", commission: "Up to ₹2,250 / approval", applications: "5 logged", approvalRatio: "88%", route: "/partner/products?bank=KOTAK", bankKey: "KOTAK" }
  ];

  const loanRoleCards = [
    { title: "Loan Officer", sub: "Role", count: "85", availableCards: "8 Loan Programs", commission: "Up to 2.5% Loan Amount", applications: "85 logged", approvalRatio: "90%", route: "/partner/products?category=personal_loan", bankKey: "" },
    { title: "HDFC Personal Loan", sub: "Provider", count: "45210", availableCards: "4 Loan Offers", commission: "Up to 2.8% Loan Amount", applications: "45,210 logged", approvalRatio: "86%", route: "/partner/products?category=personal_loan", bankKey: "HDFC" },
    { title: "SBI Home Loan", sub: "Provider", count: "12450", availableCards: "3 Home Loan Offers", commission: "Up to 1.5% Loan Amount", applications: "12,450 logged", approvalRatio: "84%", route: "/partner/products?category=home_loan", bankKey: "SBI" },
    { title: "ICICI Business Loan", sub: "Provider", count: "3890", availableCards: "5 Business Loans", commission: "Up to 3.0% Loan Amount", applications: "3,890 logged", approvalRatio: "82%", route: "/partner/products?category=business_loan", bankKey: "ICICI" },
    { title: "AXIS Instant Loan", sub: "Provider", count: "8720", availableCards: "6 Instant Loan Offers", commission: "Up to 2.2% Loan Amount", applications: "8,720 logged", approvalRatio: "89%", route: "/partner/products?category=personal_loan", bankKey: "AXIS" },
    { title: "Bajaj Finserv Loan", sub: "Provider", count: "14200", availableCards: "7 Flexi Loans", commission: "Up to 2.5% Loan Amount", applications: "14,200 logged", approvalRatio: "91%", route: "/partner/products?category=personal_loan", bankKey: "" },
    { title: "Tata Capital Loan", sub: "Provider", count: "2150", availableCards: "4 Quick Loans", commission: "Up to 2.0% Loan Amount", applications: "2,150 logged", approvalRatio: "87%", route: "/partner/products?category=personal_loan", bankKey: "" },
    { title: "IDFC First Loan", sub: "Provider", count: "1840", availableCards: "5 Personal Loans", commission: "Up to 2.4% Loan Amount", applications: "1,840 logged", approvalRatio: "88%", route: "/partner/products?category=personal_loan", bankKey: "IDFC" },
    { title: "L&T Finance", sub: "Provider", count: "950", availableCards: "3 MSME Loans", commission: "Up to 2.8% Loan Amount", applications: "950 logged", approvalRatio: "85%", route: "/partner/products?category=business_loan", bankKey: "" }
  ];

  const insuranceRoleCards = [
    { title: "Insurance Advisor", sub: "Role", count: "42", availableCards: "10 Insurance Plans", commission: "Up to 15% Premium", applications: "42 logged", approvalRatio: "95%", route: "/partner/products?category=insurance", bankKey: "" },
    { title: "Health Insurance", sub: "Category", count: "18400", availableCards: "12 Health Policies", commission: "Up to 20% Premium", applications: "18,400 logged", approvalRatio: "94%", route: "/partner/products?category=insurance", bankKey: "" },
    { title: "Life Insurance", sub: "Category", count: "12350", availableCards: "8 Term & Life Plans", commission: "Up to 25% Premium", applications: "12,350 logged", approvalRatio: "92%", route: "/partner/products?category=insurance", bankKey: "" },
    { title: "General Insurance", sub: "Category", count: "8900", availableCards: "15 Motor & Asset Plans", commission: "Up to 12% Premium", applications: "8,900 logged", approvalRatio: "96%", route: "/partner/products?category=insurance", bankKey: "" },
    { title: "HDFC ERGO", sub: "Provider", count: "15200", availableCards: "6 Health & Motor Plans", commission: "Up to 18% Premium", applications: "15,200 logged", approvalRatio: "93%", route: "/partner/products?category=insurance", bankKey: "HDFC" },
    { title: "Star Health", sub: "Provider", count: "9840", availableCards: "7 Health Covers", commission: "Up to 22% Premium", applications: "9,840 logged", approvalRatio: "91%", route: "/partner/products?category=insurance", bankKey: "" },
    { title: "ICICI Lombard", sub: "Provider", count: "11300", availableCards: "9 General Policies", commission: "Up to 15% Premium", applications: "11,300 logged", approvalRatio: "94%", route: "/partner/products?category=insurance", bankKey: "ICICI" },
    { title: "Bajaj Allianz", sub: "Provider", count: "6700", availableCards: "5 Comprehensive Plans", commission: "Up to 16% Premium", applications: "6,700 logged", approvalRatio: "90%", route: "/partner/products?category=insurance", bankKey: "" },
    { title: "Niva Bupa", sub: "Provider", count: "4500", availableCards: "4 Family Health Plans", commission: "Up to 20% Premium", applications: "4,500 logged", approvalRatio: "92%", route: "/partner/products?category=insurance", bankKey: "" }
  ];

  const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id;
  const kycStatus = partner?.kyc_status || "pending";
  const accountStatus = partner?.status || "pending";
  const partnerCode = partner?.partner_code || partner?.Partner_code || "";

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
        console.error("Dashboard data load failure", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardData();
  }, [partnerId]);

  if (loading) {
    return <DashboardSkeleton C={C} />;
  }

  // Dynamic values & fallbacks directly from DB
  const w = walletData || { available_balance: 0, hold_balance: 0, total_earned: 0, total_withdrawn: 0 };
  const l = dashboardData?.leads || { total_leads: 0, approved_leads: 0, rejected_leads: 0, pending_leads: 0 };

  const walletBalance = `₹${parseFloat(w.available_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  const pendingAmount = `₹${parseFloat(w.hold_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  const totalEarned = `₹${parseFloat(w.total_earned || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
  
  // Real App counts for KPI Cards
  const kpiTotalApps = allLeads.length;
  const kpiApprovedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'approved').length;
  const kpiPendingApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'pending' || lead.status?.toLowerCase() === 'under_review').length;
  const kpiRejectedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'rejected').length;
  const kpiDisbursedApps = allLeads.filter(lead => lead.status?.toLowerCase() === 'disbursed').length;

  // Donut chart calculations
  const approvedPct = kpiTotalApps > 0 ? Math.round((kpiApprovedApps / kpiTotalApps) * 100) : 0;
  const pendingPct = kpiTotalApps > 0 ? Math.round((kpiPendingApps / kpiTotalApps) * 100) : 0;
  const rejectedPct = kpiTotalApps > 0 ? Math.round((kpiRejectedApps / kpiTotalApps) * 100) : 0;
  const disbursedPct = kpiTotalApps > 0 ? Math.round((kpiDisbursedApps / kpiTotalApps) * 100) : 0;

  const deg1 = (approvedPct / 100) * 360;
  const deg2 = deg1 + (pendingPct / 100) * 360;
  const deg3 = deg2 + (rejectedPct / 100) * 360;

  // Month-over-month calculation for application trends
  const getLeadsTrend = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    
    const thisMonthLeads = allLeads.filter(l => new Date(l.created_at || l.uploaded_at) >= thirtyDaysAgo).length;
    const lastMonthLeads = allLeads.filter(l => {
      const d = new Date(l.created_at || l.uploaded_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;

    if (lastMonthLeads === 0) {
      return thisMonthLeads > 0 ? `+${thisMonthLeads} leads this month` : "0% change";
    }
    const pct = Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100);
    return pct >= 0 ? `↑ ${pct}% vs last month` : `↓ ${Math.abs(pct)}% vs last month`;
  };

  const getApprovedTrend = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    
    const approvedLeads = allLeads.filter(l => l.status?.toLowerCase() === 'approved');
    const thisMonthApproved = approvedLeads.filter(l => new Date(l.created_at || l.uploaded_at) >= thirtyDaysAgo).length;
    const lastMonthApproved = approvedLeads.filter(l => {
      const d = new Date(l.created_at || l.uploaded_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;

    if (lastMonthApproved === 0) {
      return thisMonthApproved > 0 ? `+${thisMonthApproved} approved this month` : "0% change";
    }
    const pct = Math.round(((thisMonthApproved - lastMonthApproved) / lastMonthApproved) * 100);
    return pct >= 0 ? `↑ ${pct}% vs last month` : `↓ ${Math.abs(pct)}% vs last month`;
  };

  // dynamic greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // dynamic partner rank based on total leads count
  const getPartnerRank = () => {
    const count = allLeads.length;
    if (count >= 20) return "Gold Partner";
    if (count >= 5) return "Silver Partner";
    return "Bronze Partner";
  };
  const partnerRank = getPartnerRank();

  // Target goals scaled to rank
  const getTargetGoal = () => {
    const rank = getPartnerRank();
    if (rank === "Gold Partner") return 200000;
    if (rank === "Silver Partner") return 100000;
    return 50000;
  };
  const targetGoal = getTargetGoal();
  const currentEarnings = parseFloat(w.total_earned || 0);
  const targetPercent = targetGoal > 0 ? Math.min(100, Math.round((currentEarnings / targetGoal) * 100)) : 0;

  const handleCopyPartnerCode = () => {
    if (!partnerCode) {
      alert("Partner profile code not found.");
      return;
    }
    navigator.clipboard.writeText(partnerCode);
    alert("Partner Code copied to clipboard!");
  };

  const handleCopyCampaignLink = (prod) => {
    if (!partnerCode) {
      alert("Partner profile code not found.");
      return;
    }
    const trackingLink = `${window.location.origin}/redirect/${prod.category}?id=${prod.id}&partner=${partnerCode}`;
    navigator.clipboard.writeText(trackingLink);
    alert(`Tracking link for ${prod.name} copied to clipboard!`);
  };

  const getServiceCategory = (service) => {
    const route = (service.route || '').toLowerCase();
    const name = (service.name || '').toLowerCase();

    if (route.includes('travel') || name.includes('flight') || name.includes('train') || name.includes('bus') || name.includes('hotel')) {
      return 'Travel';
    }
    if (route.includes('loan') || name.includes('loan')) {
      return 'Loans';
    }
    if (route.includes('recharge') || route.includes('electricity') || route.includes('fastag') || name.includes('recharge') || name.includes('electricity')) {
      return 'Utilities';
    }
    return 'Others';
  };

  const getServiceIcon = (icon) => {
    if (!icon) return '🛠️';
    return typeof icon === 'string' ? icon : '🛠️';
  };

  const handleServiceSearch = (value) => {
    setServiceSearch(value);
    setSelectedServiceCategory('All');
  };

  const serviceCategories = ['All', ...Array.from(new Set(services.map(getServiceCategory)))];

  const filteredServices = services
    .filter((service) => {
      if (selectedServiceCategory !== 'All' && getServiceCategory(service) !== selectedServiceCategory) {
        return false;
      }
      const query = serviceSearch.trim().toLowerCase();
      if (!query) return true;
      return (service.name || '').toLowerCase().includes(query) || (service.route || '').toLowerCase().includes(query);
    })
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handleServiceTileClick = async (service) => {
    if (service.status !== 'active') return;
    try {
      await api.post(`/service-catalog/${service.id}/click`);
    } catch (err) {
      console.warn('Service click tracking failed:', err);
    }
    navigate(service.route);
  };

  // Get active products for Campaigns list
  const getActiveCampaigns = () => {
    if (!products || products.length === 0) {
      return [];
    }
    return [...products]
      .filter(p => p.is_active !== false)
      .sort((a, b) => parseFloat(b.commission_value || 0) - parseFloat(a.commission_value || 0))
      .slice(0, 4);
  };
  const activeCampaignsList = getActiveCampaigns();

  // Match brand logo from file assets
  const getBankLogoForProduct = (productName) => {
    const nameLower = (productName || "").toLowerCase();
    if (nameLower.includes("hdfc")) return hdfcLogo;
    if (nameLower.includes("axis")) return axisLogo;
    if (nameLower.includes("kotak")) return kotakLogo;
    if (nameLower.includes("sbi")) return sbiLogo;
    if (nameLower.includes("icici")) return iciciLogo;
    if (nameLower.includes("yes")) return yesLogo;
    if (nameLower.includes("idfc")) return idfcLogo;
    if (nameLower.includes("baroda") || nameLower.includes("bob")) return bobLogo;
    return null;
  };

  // Format dynamic recent applications list
  const getRecentApplications = () => {
    if (!allLeads || allLeads.length === 0) {
      return [];
    }

    return allLeads.slice(0, 5).map(lead => {
      const name = lead.customer_name || "Customer";
      const names = name.split(" ");
      const initials = names.map(n => n[0]).join("").toUpperCase().slice(0, 2);
      
      const colors = [
        { bg: "#E0F2FE", color: "#0369A1" },
        { bg: "#F3E8FF", color: "#7E22CE" },
        { bg: "#FCE7F3", color: "#BE185D" },
        { bg: "#DCFCE7", color: "#15803D" },
        { bg: "#FEE2E2", color: "#B91C1C" }
      ];
      const colorIndex = name.length % colors.length;
      const themeColors = colors[colorIndex];

      const statusRaw = lead.status || "Pending";
      let status = "Under Review";
      if (statusRaw.toLowerCase() === 'approved') status = "Approved";
      if (statusRaw.toLowerCase() === 'rejected') status = "Rejected";

      const amount = lead.amount ? `₹${parseFloat(lead.amount).toLocaleString("en-IN")}` : "—";

      return {
        initials,
        name,
        product: lead.product_name || "Financial Product",
        amount,
        status,
        color: status === "Approved" ? (isDark ? C.green : "#10B981") : status === "Rejected" ? "#EF4444" : "#3B82F6",
        bg: status === "Approved" ? (isDark ? `${C.green}15` : "#ECFDF5") : status === "Rejected" ? "#FEE2E2" : "#EFF6FF",
        ...themeColors
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
      bgDark: 'rgba(124, 92, 246, 0.15)',
      borderColor: 'rgba(124, 92, 246, 0.3)',
      action: () => navigate('/partner/products'),
      ariaLabel: 'Apply for a financial product or credit card'
    },
    {
      id: 'customer',
      label: t('quickActions.addCustomer', 'Add Customer'),
      desc: t('quickActions.addCustomerDesc', 'Register new client profile'),
      icon: MdPeople,
      color: '#2563EB',
      bgLight: '#EFF6FF',
      bgDark: 'rgba(37, 99, 235, 0.15)',
      borderColor: 'rgba(37, 99, 235, 0.3)',
      action: () => navigate('/partner/customers', { state: { openAddModal: true } }),
      ariaLabel: 'Open CRM modal to add a new customer'
    },
    {
      id: 'invite',
      label: t('quickActions.invitePartner', 'Invite Partner'),
      desc: t('quickActions.inviteDesc', 'Grow your network and overrides'),
      icon: MdGroup,
      color: '#EA580C',
      bgLight: '#FFF7ED',
      bgDark: 'rgba(234, 88, 12, 0.15)',
      borderColor: 'rgba(234, 88, 12, 0.3)',
      action: () => navigate('/partner/team-network'),
      ariaLabel: 'Invite new partners and copy referral links'
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* ──── STATUS / KYC WARNING BANNERS ──── */}
      {kycStatus !== 'approved' && (
        <div style={{
          background: kycStatus === 'rejected' ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
          border: `1.5px solid ${kycStatus === 'rejected' ? "#EF4444" : "#F59E0B"}`,
          borderRadius: "16px",
          padding: "20px 24px",
          color: C.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "280px" }}>
            <span style={{ fontSize: "28px" }}>{kycStatus === 'rejected' ? "🔴" : "🟡"}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: kycStatus === 'rejected' ? "#DC2626" : "#D97706" }}>
                {kycStatus === 'rejected' ? "KYC Rejected" : kycStatus === 'under_review' ? "KYC Under Verification" : "KYC Pending"}
              </h4>
              <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.textMid, margin: 0, lineHeight: 1.4 }}>
                {kycStatus === 'rejected' ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: C.text }}>{t("Reason:")}</div>
                    {(partner?.rejection_reason || partner?.kyc_rejection_reason) ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px", borderLeft: `3px solid #EF4444`, marginBottom: "4px" }}>
                        {(partner.rejection_reason || partner.kyc_rejection_reason).split('; ').map((reason, idx) => (
                          <div key={idx} style={{ color: "#EF4444", fontWeight: 700 }}>• {reason}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: C.textMid, marginBottom: "4px" }}>{t("Your documents require correction.")}</div>
                    )}
                    <div style={{ fontSize: "13px", color: C.textLight }}>{t("Please upload corrected documents.")}</div>
                  </div>
                ) : kycStatus === 'under_review' ? (
                  <p style={{ margin: 0 }}>{t("Your KYC documents have been submitted and are under verification by the Super Admin.")}</p>
                ) : (
                  <p style={{ margin: 0 }}>{t("Complete your KYC verification to unlock Products, Wallet, Customers, Reports, and Applications.")}</p>
                )}
              </div>
            </div>
          </div>
          {kycStatus !== 'under_review' && (
            <button
              onClick={() => navigate("/partner/kyc-centre")}
              style={{
                padding: "10px 20px",
                background: kycStatus === 'rejected' ? "#EF4444" : "#F59E0B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: kycStatus === 'rejected' ? "0 4px 12px rgba(239,68,68,0.3)" : "0 4px 12px rgba(245,158,11,0.3)",
                transition: "all 0.2s"
              }}
            >
              {kycStatus === 'rejected' ? "Re-upload Documents" : "Complete KYC"}
            </button>
          )}
        </div>
      )}

      {/* Account Inactive Banner (only shown if KYC is approved but account status is inactive) */}
      {kycStatus === 'approved' && accountStatus === 'inactive' && (
        <div style={{
          background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
          border: `1.5px solid ${C.red}`,
          borderRadius: "16px",
          padding: "20px 24px",
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}>
          <span style={{ fontSize: "28px" }}>🟠</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: C.red }}>
              {t('dashboard.accountInactive', 'Account Inactive')}
            </h4>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: C.textMid, margin: 0, lineHeight: 1.4 }}>
              {t('dashboard.accountInactiveDesc', 'Your account is inactive. Please contact support.')}
            </p>
          </div>
        </div>
      )}

      {/* ──── HEADER BAR ──── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", margin: "4px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>
          {t('dashboard.title', 'Partner Dashboard')}
        </h1>
      </div>


      {/* ──── 4 CATEGORY ACTION BUTTONS & SPECIFIC DASHBOARD VIEW ──── */}
      <div>
        {/* Category Buttons Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          {/* Credit Cards Button */}
          <button
            onClick={() => setActiveDashboardCategory('credit_card')}
            style={{
              padding: "16px 20px",
              borderRadius: "16px",
              border: activeDashboardCategory === 'credit_card' ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              background: activeDashboardCategory === 'credit_card' ? (isDark ? `${C.primary}25` : "#F5F3FF") : C.card,
              color: activeDashboardCategory === 'credit_card' ? C.primary : C.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "15px",
              boxShadow: activeDashboardCategory === 'credit_card' ? `0 4px 16px ${C.primary}30` : "0 2px 8px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease"
            }}
          >
            <MdCreditCard size={22} />
            <span>Credit Cards</span>
          </button>

          {/* Loans Button */}
          <button
            onClick={() => setActiveDashboardCategory('loans')}
            style={{
              padding: "16px 20px",
              borderRadius: "16px",
              border: activeDashboardCategory === 'loans' ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              background: activeDashboardCategory === 'loans' ? (isDark ? `${C.primary}25` : "#F5F3FF") : C.card,
              color: activeDashboardCategory === 'loans' ? C.primary : C.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "15px",
              boxShadow: activeDashboardCategory === 'loans' ? `0 4px 16px ${C.primary}30` : "0 2px 8px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease"
            }}
          >
            <MdAccountBalanceWallet size={22} />
            <span>Loans</span>
          </button>

          {/* Insurance Button */}
          <button
            onClick={() => setActiveDashboardCategory('insurance')}
            style={{
              padding: "16px 20px",
              borderRadius: "16px",
              border: activeDashboardCategory === 'insurance' ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              background: activeDashboardCategory === 'insurance' ? (isDark ? `${C.primary}25` : "#F5F3FF") : C.card,
              color: activeDashboardCategory === 'insurance' ? C.primary : C.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "15px",
              boxShadow: activeDashboardCategory === 'insurance' ? `0 4px 16px ${C.primary}30` : "0 2px 8px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease"
            }}
          >
            <MdShield size={22} />
            <span>Insurance</span>
          </button>

          {/* Add Leads Button */}
          <button
            onClick={() => navigate('/partner/products')}
            style={{
              padding: "16px 20px",
              borderRadius: "16px",
              border: "none",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "15px",
              boxShadow: `0 4px 16px ${C.primary}40`,
              transition: "all 0.2s ease"
            }}
          >
            <MdAdd size={22} />
            <span>Add Leads</span>
          </button>
        </div>

        {/* Dynamic Category Cards Grid View */}
        <div style={{
          background: C.card,
          borderRadius: "20px",
          padding: "24px",
          border: `1px solid ${C.border}`,
          boxShadow: isDark ? "none" : "0 4px 20px rgba(15,23,42,0.04)",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0, textTransform: 'capitalize' }}>
                {activeDashboardCategory === 'credit_card' ? 'Credit Cards Overview' : activeDashboardCategory === 'loans' ? 'Loans Overview' : 'Insurance Overview'}
              </h3>
              <p style={{ fontSize: "12px", color: C.textLight, margin: "2px 0 0" }}>
                Role and bank performance count breakdown
              </p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: `${C.primary}15`, color: C.primary }}>
              Active Category
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
            {(activeDashboardCategory === 'credit_card' ? creditCardRoleCards : activeDashboardCategory === 'loans' ? loanRoleCards : insuranceRoleCards).map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: isDark ? C.bgSecondary : "#F8FAFC",
                  borderRadius: "14px",
                  padding: "16px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: C.textLight, textTransform: "uppercase" }}>
                      {card.sub}
                    </span>
                    <button
                      onClick={() => setSelectedMoreInfoCard(card)}
                      style={{ background: "none", border: "none", color: C.primary, fontSize: "11px", fontWeight: 800, cursor: "pointer", padding: 0 }}
                    >
                      More info
                    </button>
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: C.text, margin: "8px 0 4px" }}>
                    {card.count}
                  </div>
                </div>

                <div style={{ fontSize: "13px", fontWeight: 800, color: C.text, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {card.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MORE INFO DETAIL MODAL ═══ */}
      {selectedMoreInfoCard && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '16px'
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: '500px',
            borderRadius: '24px', overflow: 'hidden', border: `1px solid ${C.border}`,
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgSecondary, position: 'relative' }}>
              <button
                onClick={() => setSelectedMoreInfoCard(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer',
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.textMid, fontSize: '16px', fontWeight: 700
                }}
              >
                ✕
              </button>

              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: `${C.primary}15`, color: C.primary, textTransform: 'uppercase' }}>
                {selectedMoreInfoCard.sub} Overview
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: C.text, margin: '6px 0 2px' }}>
                {selectedMoreInfoCard.title}
              </h3>
              <p style={{ fontSize: '12px', color: C.textMid, margin: 0 }}>
                Detailed performance metrics and application controls
              </p>
            </div>

            {/* Content: 4 Metric Cards & Apply Now */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                
                {/* 1. Available Cards */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>Available Cards</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '4px' }}>
                    {selectedMoreInfoCard.availableCards}
                  </div>
                </div>

                {/* 2. Commission */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>Commission</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.green || '#10B981', marginTop: '4px' }}>
                    {selectedMoreInfoCard.commission}
                  </div>
                </div>

                {/* 3. Applications */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>Applications</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '4px' }}>
                    {selectedMoreInfoCard.applications}
                  </div>
                </div>

                {/* 4. Approval Ratio */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textLight }}>Approval Ratio</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.primary, marginTop: '4px' }}>
                    {selectedMoreInfoCard.approvalRatio} High
                  </div>
                </div>

              </div>

              {/* 5. Apply Now Button */}
              <button
                onClick={() => {
                  const targetRoute = selectedMoreInfoCard.route;
                  setSelectedMoreInfoCard(null);
                  navigate(targetRoute);
                }}
                style={{
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark || C.primary} 100%)`,
                  color: '#FFFFFF', border: 'none', width: '100%', padding: '14px', fontSize: '14px',
                  borderRadius: '14px', cursor: 'pointer', fontWeight: 800, marginTop: '8px',
                  boxShadow: `0 4px 16px ${C.primary}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <span>🚀 Apply Now</span>
              </button>

            </div>
          </div>
        </div>
      )}


      {/* ──── TEAM & EARNING METRIC CARDS ──── */}
      <div 
        className="kpi-cards-container"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", width: "100%", marginBottom: "24px" }}
      >
        {/* Total Teams */}
        <div 
          onClick={() => navigate('/partner/team-network')}
          style={{
            background: C.card, borderRadius: "18px", padding: "20px", border: `1px solid ${C.border}`,
            boxShadow: isDark ? "none" : "0 4px 20px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease"
          }}
          className="kpi-card hover-card-clickable"
          role="button"
          tabIndex={0}
        >
          <div>
            <span className="kpi-card-title" style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>Total Teams</span>
            <div className="kpi-card-value" style={{ fontSize: "24px", fontWeight: 800, color: C.text, marginTop: "6px" }}>
              {teamDashboard?.team_members?.length || 15}
            </div>
            <span style={{ fontSize: "11px", color: C.green, fontWeight: 700, marginTop: "4px", display: "block" }}>
              +2 members this month
            </span>
          </div>
          <div className="kpi-card-icon" style={{
            width: "44px", height: "44px", borderRadius: "12px", background: isDark ? `${C.primary}15` : "#F5F3FF", color: C.primary,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdGroup size={22} />
          </div>
        </div>

        {/* Total Earnings */}
        <div 
          onClick={() => navigate('/partner/wallet')}
          style={{
            background: C.card, borderRadius: "18px", padding: "20px", border: `1px solid ${C.border}`,
            boxShadow: isDark ? "none" : "0 4px 20px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease"
          }}
          className="kpi-card hover-card-clickable"
          role="button"
          tabIndex={0}
        >
          <div>
            <span className="kpi-card-title" style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>Total Earnings</span>
            <div className="kpi-card-value" style={{ fontSize: "24px", fontWeight: 800, color: C.text, marginTop: "6px" }}>
              {totalEarned}
            </div>
            <span style={{ fontSize: "11px", color: C.textMid, fontWeight: 600, marginTop: "4px", display: "block" }}>
              Calculated live
            </span>
          </div>
          <div className="kpi-card-icon" style={{
            width: "44px", height: "44px", borderRadius: "12px", background: isDark ? `${C.green}15` : "#ECFDF5", color: isDark ? C.green : "#22C55E",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdAccountBalanceWallet size={22} />
          </div>
        </div>

        {/* Today's Earning */}
        <div 
          onClick={() => navigate('/partner/wallet')}
          style={{
            background: C.card, borderRadius: "18px", padding: "20px", border: `1px solid ${C.border}`,
            boxShadow: isDark ? "none" : "0 4px 20px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease"
          }}
          className="kpi-card hover-card-clickable"
          role="button"
          tabIndex={0}
        >
          <div>
            <span className="kpi-card-title" style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>Today's Earning</span>
            <div className="kpi-card-value" style={{ fontSize: "24px", fontWeight: 800, color: C.text, marginTop: "6px" }}>
              ₹0
            </div>
            <span style={{ fontSize: "11px", color: C.textMid, fontWeight: 600, marginTop: "4px", display: "block" }}>
              Updated today
            </span>
          </div>
          <div className="kpi-card-icon" style={{
            width: "44px", height: "44px", borderRadius: "12px", background: isDark ? `${C.primary}15` : "#EEF2FF", color: C.primary,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdTrendingUp size={22} />
          </div>
        </div>

        {/* Inactive Team */}
        <div 
          onClick={() => navigate('/partner/team-network')}
          style={{
            background: C.card, borderRadius: "18px", padding: "20px", border: `1px solid ${C.border}`,
            boxShadow: isDark ? "none" : "0 4px 20px rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease"
          }}
          className="kpi-card hover-card-clickable"
          role="button"
          tabIndex={0}
        >
          <div>
            <span className="kpi-card-title" style={{ fontSize: "12px", fontWeight: 700, color: C.textLight }}>Inactive Team</span>
            <div className="kpi-card-value" style={{ fontSize: "24px", fontWeight: 800, color: C.red, marginTop: "6px" }}>
              {teamDashboard?.inactive_count || 2}
            </div>
            <span style={{ fontSize: "11px", color: C.red, fontWeight: 600, marginTop: "4px", display: "block" }}>
              Action required
            </span>
          </div>
          <div className="kpi-card-icon" style={{
            width: "44px", height: "44px", borderRadius: "12px", background: isDark ? `${C.red}15` : "#FEE2E2", color: C.red,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <MdCancel size={22} />
          </div>
        </div>
      </div>

      {/* ──── QUICK ACCESS SECTION ──── */}
      <QuickAccessSection />

      {/* ──── QUICK ACTIONS PANEL ──── */}
      <div style={{ marginTop: '4px' }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "16px", marginTop: 0 }}>
          {t('dashboard.quickActions', 'Quick Actions')}
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px"
        }}>
          {quickActions.map((act) => {
            const Icon = act.icon;
            const cardBg = isDark ? act.bgDark : act.bgLight;
            const borderCol = isDark ? act.borderColor : '#EEF2FF';
            const textCol = isDark ? '#FFFFFF' : '#111827';
            const descCol = isDark ? '#94A3B8' : '#64748B';

            return (
              <div
                key={act.id}
                onClick={act.action}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    act.action();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={act.ariaLabel}
                style={{
                  background: isDark ? C.card : '#FFFFFF',
                  borderRadius: "18px",
                  padding: "20px",
                  border: `1.5px solid ${borderCol}`,
                  boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: 'none'
                }}
                className="hover-card-clickable"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = act.color;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${act.color}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = borderCol;
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,23,42,0.04)";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = act.color;
                  e.currentTarget.style.boxShadow = `0 10px 25px ${act.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = borderCol;
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(15,23,42,0.04)";
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: cardBg,
                  color: act.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 800, color: textCol }}>{act.label}</div>
                  <div style={{ fontSize: "11.5px", fontWeight: 500, color: descCol, marginTop: "3px", lineHeight: 1.3 }}>{act.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── BOTTOM SECTION (3 COLUMNS) ──── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>

        {/* Recent Applications (100% Dynamic) */}
        <div style={{
          flex: "1.2",
          minWidth: "280px",
          background: C.card,
          borderRadius: "20px",
          padding: "24px",
          border: `1.5px solid ${C.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: 0 }}>{t('dashboard.recentApps', 'Recent Applications')}</h3>
            <button 
              onClick={() => navigate("/partner/applications")}
              style={{ background: "none", border: "none", color: C.primary, fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
            >
              {t('dashboard.viewAll', 'View All')}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, justifyContent: "center" }}>
            {recentAppsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.textLight }}>
                <MdDescription size={40} style={{ color: C.textLight, marginBottom: "8px" }} />
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{t('dashboard.noAppsYet', 'No applications yet')}</div>
                <p style={{ fontSize: "11px", margin: "4px 0 0" }}>{t('dashboard.startApplyingDesc', 'Start applying for products to submit leads.')}</p>
              </div>
            ) : (
              recentAppsList.map((app, idx) => (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: idx === recentAppsList.length - 1 ? "none" : `1px solid ${C.border}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", background: app.bg, color: app.color,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700
                    }}>
                      {app.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                      <span style={{ fontSize: "11px", color: C.textLight }}>{app.product} · {app.amount}</span>
                    </div>
                  </div>
                  <span style={{
                    color: app.color, background: `${app.color}15`, padding: "2px 8px", borderRadius: "20px",
                    fontSize: "10px", fontWeight: 700
                  }}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* KPI Cards Responsive Styling */
        .kpi-cards-container {
          display: flex !important;
          flex-flow: row nowrap !important;
          width: 100% !important;
        }
        .kpi-card {
          flex: 1 1 0px !important;
          min-width: 0 !important;
        }

        @media (max-width: 900px) {
          .kpi-cards-container {
            gap: 10px !important;
          }
          .kpi-card {
            padding: 12px 10px !important;
            border-radius: 14px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 6px !important;
          }
          .kpi-card-icon {
            align-self: flex-start !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            margin-top: 4px !important;
          }
          .kpi-card-icon svg {
            width: 16px !important;
            height: 16px !important;
          }
          .kpi-card-title {
            font-size: 10.5px !important;
          }
          .kpi-card-value {
            font-size: 18px !important;
            margin-top: 4px !important;
          }
          .kpi-card-trend {
            font-size: 9.5px !important;
            margin-top: 4px !important;
          }
        }

        @media (max-width: 600px) {
          .kpi-cards-container {
            gap: 6px !important;
          }
          .kpi-card {
            padding: 10px 6px !important;
            border-radius: 10px !important;
            gap: 4px !important;
            min-height: 90px !important;
          }
          .kpi-card-icon {
            display: none !important;
          }
          .kpi-card-title {
            font-size: 9px !important;
            line-height: 1.2 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            height: 22px !important; /* Ensure alignment */
          }
          .kpi-card-value {
            font-size: 14px !important;
            margin-top: 2px !important;
          }
          .kpi-card-trend {
            font-size: 8px !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
        }
        
        @media (max-width: 360px) {
          .kpi-cards-container {
            gap: 4px !important;
          }
          .kpi-card {
            padding: 8px 4px !important;
            border-radius: 8px !important;
            min-height: 80px !important;
          }
          .kpi-card-title {
            font-size: 8px !important;
            height: 18px !important;
          }
          .kpi-card-value {
            font-size: 12px !important;
          }
          .kpi-card-trend {
            font-size: 7.5px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── PERMISSION LOCK OVERLAY ─────────────────────────────────
function PermissionOverlay({ C, isRejected }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.4)",
      backdropFilter: "blur(4px)",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: isRejected ? `${C.red}12` : `${C.gold}12`,
        color: isRejected ? C.red : C.gold,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <MdLock size={24} />
      </div>
      <h4 style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>
        {t('dashboard.actionBlocked', 'Action Blocked')}
      </h4>
      <p style={{ fontSize: "11px", color: C.textLight, margin: 0, maxWidth: "220px", fontWeight: 600 }}>
        {isRejected 
          ? t('dashboard.kycRejectedDesc', 'Your KYC documents were rejected. Please fix and re-upload documents in the KYC Centre.')
          : t('dashboard.kycPendingDesc', 'Your KYC verification is currently pending. Some features will remain disabled until approval.')}
      </p>
    </div>
  );
}

// ── SKELETON LOADER COMPONENT ───────────────────────────────
function DashboardSkeleton({ C }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      <div style={{ height: "120px", background: C.card, borderRadius: "16px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: "90px", background: C.card, borderRadius: "16px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ flex: "1.5", height: "350px", background: C.card, borderRadius: "20px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
        <div style={{ flex: "1", height: "350px", background: C.card, borderRadius: "20px", border: `1.5px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
