import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActiveBanks } from '../../../contexts/BanksContext';
import { 
  MdSearch, MdArrowForward, MdDashboard, MdStorefront, MdPeople, 
  MdLeaderboard, MdFolder, MdBarChart, MdAccountBalanceWallet, MdSupportAgent
} from 'react-icons/md';
import api from '../../../services/api';

// Embedded Sub-Components
import PartnerProducts from '../products/PartnerProducts';
import PartnerApplications from '../leads/PartnerApplications';
import PartnerCrm from '../leads/PartnerCrm';
import PartnerVault from '../profile/PartnerVault';
import PartnerReports from './PartnerReports';
import PartnerWallet from '../wallet/PartnerWallet';
import PartnerSupport from './PartnerSupport';

// Bank Logo Imports
import hdfcLogo from '../../home/components/banks/hdfc_bank.png';
import sbiLogo from '../../home/components/banks/sbi_card.png';
import iciciLogo from '../../home/components/banks/icici_bank.png';
import axisLogo from '../../home/components/banks/axis_bank.png';
import indusindLogo from '../../home/components/banks/inducind.png';
import idfcLogo from '../../home/components/banks/idfc_first_bank.png';
import federalLogo from '../../home/components/banks/federal_bank.png';
import bobLogo from '../../home/components/banks/bank_of_baroda.png';
import yesLogo from '../../home/components/banks/yes_bank.png';
import kotakLogo from '../../home/components/banks/kotak_bank.png';
import dcbLogo from '../../home/components/banks/dcb_bank.png';
import rblLogo from '../../home/components/banks/rbl_bank.png';
import equitasLogo from '../../home/components/banks/equitas.png';
import sbmLogo from '../../home/components/banks/sbm_bank.png';

const toSlug = (text) => text ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';

const getBankAccent = (slug, name) => {
  const s = (slug || name || '').toLowerCase();
  if (s.includes('hdfc')) return '#2563EB';
  if (s.includes('sbi')) return '#0284C7';
  if (s.includes('icici')) return '#F97316';
  if (s.includes('axis')) return '#E11D48';
  if (s.includes('indusind')) return '#991B1B';
  if (s.includes('idfc')) return '#DC2626';
  if (s.includes('au')) return '#D97706';
  if (s.includes('hsbc')) return '#E11D48';
  if (s.includes('federal')) return '#2563EB';
  if (s.includes('baroda') || s.includes('bob')) return '#EA580C';
  if (s.includes('yes')) return '#2563EB';
  if (s.includes('kotak')) return '#DC2626';
  if (s.includes('dcb')) return '#0284C7';
  if (s.includes('rbl')) return '#0284C7';
  if (s.includes('equitas')) return '#059669';
  if (s.includes('sbm')) return '#4F46E5';
  return '#2563EB';
};

const getStaticBankLogo = (name, shortCode) => {
  const s = (shortCode || name || '').toLowerCase();
  if (s.includes('hdfc')) return hdfcLogo;
  if (s.includes('sbi')) return sbiLogo;
  if (s.includes('icici')) return iciciLogo;
  if (s.includes('axis')) return axisLogo;
  if (s.includes('indusind')) return indusindLogo;
  if (s.includes('idfc')) return idfcLogo;
  if (s.includes('federal')) return federalLogo;
  if (s.includes('baroda') || s.includes('bob')) return bobLogo;
  if (s.includes('yes')) return yesLogo;
  if (s.includes('kotak')) return kotakLogo;
  if (s.includes('dcb')) return dcbLogo;
  if (s.includes('rbl')) return rblLogo;
  if (s.includes('equitas')) return equitasLogo;
  if (s.includes('sbm')) return sbmLogo;
  return null;
};

const defaultCreditCardBanks = [
  { name: "HDFC Bank", slug: "hdfc", activeCardsCount: "63,145", rawCount: 63145, logo: hdfcLogo, accent: "#2563EB", category: "private" },
  { name: "SBI Card", slug: "sbi", activeCardsCount: "9,614", rawCount: 9614, logo: sbiLogo, accent: "#0284C7", category: "psu" },
  { name: "ICICI Bank", slug: "icici", activeCardsCount: "28", rawCount: 28, logo: iciciLogo, accent: "#F97316", category: "private" },
  { name: "Axis Bank", slug: "axis", activeCardsCount: "1,811", rawCount: 1811, logo: axisLogo, accent: "#E11D48", category: "private" },
  { name: "IndusInd Bank", slug: "indusind", activeCardsCount: "2,381", rawCount: 2381, logo: indusindLogo, accent: "#991B1B", category: "private" },
  { name: "IDFC FIRST Bank", slug: "idfc", activeCardsCount: "13", rawCount: 13, logo: idfcLogo, accent: "#DC2626", category: "private" },
  { name: "AU Small Finance", slug: "au", activeCardsCount: "15", rawCount: 15, logo: equitasLogo, accent: "#D97706", category: "private" },
  { name: "HSBC Bank", slug: "hsbc", activeCardsCount: "3", rawCount: 3, logo: null, accent: "#E11D48", category: "private" },
  { name: "Federal Bank", slug: "federal", activeCardsCount: "10", rawCount: 10, logo: federalLogo, accent: "#2563EB", category: "private" },
  { name: "Bank of Baroda", slug: "bob", activeCardsCount: "184", rawCount: 184, logo: bobLogo, accent: "#EA580C", category: "psu" },
  { name: "YES Bank", slug: "yes", activeCardsCount: "73", rawCount: 73, logo: yesLogo, accent: "#2563EB", category: "private" },
  { name: "Kotak Mahindra", slug: "kotak", activeCardsCount: "5", rawCount: 5, logo: kotakLogo, accent: "#DC2626", category: "private" },
  { name: "HSBC UK", slug: "hsbc-uk", activeCardsCount: "2,142", rawCount: 2142, logo: null, accent: "#E11D48", category: "private" },
  { name: "DCB Bank", slug: "dcb", activeCardsCount: "12", rawCount: 12, logo: dcbLogo, accent: "#0284C7", category: "private" },
  { name: "RBL Bank", slug: "rbl", activeCardsCount: "16", rawCount: 16, logo: rblLogo, accent: "#0284C7", category: "private" },
];

const loanRoleCards = [
  { title: "Personal Loan", sub: "Loan Type", count: "45,210", availableCards: "12 Personal Loan Offers", slug: "personal-loan" },
  { title: "Home Loan", sub: "Loan Type", count: "12,450", availableCards: "8 Home Loan Offers", slug: "home-loan" },
  { title: "Business Loan", sub: "Loan Type", count: "3,890", availableCards: "10 Business Loans", slug: "business-loan" },
  { title: "Loan Against Property", sub: "Loan Type", count: "8,720", availableCards: "6 LAP Offers", slug: "loan-against-property" },
  { title: "Gold Loan", sub: "Loan Type", count: "14,200", availableCards: "5 Quick Gold Loans", slug: "gold-loan" },
  { title: "Vehicle Loan", sub: "Loan Type", count: "2,150", availableCards: "7 Auto & Bike Loans", slug: "vehicle-loan" }
];

const insuranceRoleCards = [
  { title: "Health Insurance", sub: "Insurance Type", count: "18,400", availableCards: "12 Health Policies", slug: "health-insurance" },
  { title: "Life Insurance", sub: "Insurance Type", count: "12,350", availableCards: "8 Term & Life Plans", slug: "life-insurance" },
  { title: "General Insurance", sub: "Insurance Type", count: "8,900", availableCards: "15 Motor & Asset Plans", slug: "general-insurance" }
];

const getSubModuleTabs = (t, activeCategory = 'credit_card') => [
  { id: 'dashboard', label: t('partnerLayout.dashboard', 'Dashboard'), icon: MdDashboard },
  { 
    id: 'cards', 
    label: activeCategory === 'loans' 
      ? t('sections.popularLoans', 'Loans Catalog') 
      : (activeCategory === 'insurance' 
          ? t('sections.popularInsurance', 'Insurance Catalog') 
          : t('sections.popularCards', 'Credit Cards')), 
    icon: MdStorefront 
  },
  { id: 'customers', label: t('partnerLayout.customers', 'Customers'), icon: MdPeople },
  { id: 'applications', label: t('partnerLayout.applications', 'Applications'), icon: MdLeaderboard },
  { id: 'documents', label: t('partnerLayout.vault', 'Documents'), icon: MdFolder },
  { id: 'reports', label: t('partnerLayout.reports', 'Reports'), icon: MdBarChart },
  { id: 'commission', label: t('partnerLayout.wallet', 'Commission'), icon: MdAccountBalanceWallet },
  { id: 'support', label: t('partnerLayout.support', 'Support'), icon: MdSupportAgent },
];

export default function PartnerCategoryOverview({ defaultCategory = 'credit_card' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { C, isDark } = useTheme();
  const { activeBanks } = useActiveBanks();

  const [activeCategory, setActiveCategory] = useState(() => {
    if (location.pathname.includes('/partner/loans')) return 'loans';
    if (location.pathname.includes('/partner/insurance')) return 'insurance';
    return defaultCategory;
  });

  const activeTab = searchParams.get('tab') || 'dashboard';

  const handleTabChange = (tabId) => {
    if (tabId === 'dashboard') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      setSearchParams(newParams);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', tabId);
      setSearchParams(newParams);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [bankCategoryFilter, setBankCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Database Banks & Products State
  const [dbBanks, setDbBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname.includes('/partner/loans')) setActiveCategory('loans');
    else if (location.pathname.includes('/partner/insurance')) setActiveCategory('insurance');
    else if (location.pathname.includes('/partner/credit-cards')) setActiveCategory('credit_card');
  }, [location.pathname]);

  // Fetch banks live from database
  useEffect(() => {
    let isMounted = true;
    const fetchDatabaseBanks = async () => {
      setLoadingBanks(true);
      try {
        const res = await api.get('/banks', { params: { limit: 100 } });
        const list = res.data?.data || res.data?.banks || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(list) && list.length > 0 && isMounted) {
          setDbBanks(list);
        }
      } catch (err) {
        console.warn('Could not load database banks, using fallback:', err);
      } finally {
        if (isMounted) setLoadingBanks(false);
      }
    };
    fetchDatabaseBanks();
    return () => { isMounted = false; };
  }, []);

  // Fetch all products live for global product search
  useEffect(() => {
    let isMounted = true;
    const fetchAllProducts = async () => {
      try {
        const res = await api.get('/products', { params: { is_active: 'true', limit: 1000 } });
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(list) && isMounted) {
          setAllProducts(list);
        }
      } catch (err) {
        console.warn('Could not load products for search overview:', err);
      }
    };
    fetchAllProducts();
    return () => { isMounted = false; };
  }, []);

  // Compute bank list using database records
  const bankList = useMemo(() => {
    if (dbBanks && dbBanks.length > 0) {
      return dbBanks.map(b => {
        const bName = b.name || b.bank_name || 'Bank';
        const bShort = b.short_code || '';
        const bSlug = (bShort || toSlug(bName)).toLowerCase();
        const pCount = parseInt(b.products_count || b.card_count || b.cards_count || 0, 10);
        const dbLogo = b.logo_url || b.logo;
        const staticLogo = getStaticBankLogo(bName, bShort);

        return {
          id: b.id,
          name: bName,
          slug: bSlug,
          rawCount: pCount,
          activeCardsCount: pCount > 0 ? pCount.toLocaleString('en-IN') : '0',
          logo: dbLogo || staticLogo,
          accent: getBankAccent(bSlug, bName),
          category: (b.bank_type || b.type || b.category || '').toLowerCase().includes('psu') ? 'psu' : 'private'
        };
      });
    }

    if (activeBanks && activeBanks.length > 0) {
      return activeBanks.map(b => {
        const bName = b.name || b.label || 'Bank';
        const bShort = b.short_code || '';
        const bSlug = (b.slug || bShort || toSlug(bName)).toLowerCase();
        const pCount = parseInt(b.products_count || 0, 10);
        const staticLogo = getStaticBankLogo(bName, bShort);

        return {
          id: b.id,
          name: bName,
          slug: bSlug,
          rawCount: pCount,
          activeCardsCount: pCount > 0 ? pCount.toLocaleString('en-IN') : '0',
          logo: b.logo || b.image || staticLogo,
          accent: getBankAccent(bSlug, bName),
          category: 'private'
        };
      });
    }

    return defaultCreditCardBanks;
  }, [dbBanks, activeBanks]);

  const filteredBanks = useMemo(() => {
    let list = bankList.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
      const matchesCategory = bankCategoryFilter === 'all' || 
        (bankCategoryFilter === 'psu' && b.category === 'psu') ||
        (bankCategoryFilter === 'private' && b.category === 'private');
      return matchesQuery && matchesCategory;
    });

    if (sortBy === 'most') {
      list = [...list].sort((a, b) => b.rawCount - a.rawCount);
    } else if (sortBy === 'name-asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    }

    return list;
  }, [bankList, searchQuery, bankCategoryFilter, sortBy]);

  // Compute products matching search query
  const matchingProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return allProducts.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const bName = (p.bank_name || p.bank?.name || p.bank_code || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const subCat = (p.sub_category || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const features = Array.isArray(p.features) ? p.features.join(' ').toLowerCase() : (p.features || '').toLowerCase();

      return pName.includes(q) || bName.includes(q) || cat.includes(q) || subCat.includes(q) || desc.includes(q) || features.includes(q);
    });
  }, [allProducts, searchQuery]);

  const handleBankClick = (bank) => {
    try {
      let current = [];
      const raw = localStorage.getItem('gkp_partner_recent_banks');
      if (raw) current = JSON.parse(raw);
      const filtered = current.filter(s => s.toLowerCase() !== bank.slug.toLowerCase());
      const updated = [bank.slug, ...filtered].slice(0, 8);
      localStorage.setItem('gkp_partner_recent_banks', JSON.stringify(updated));
    } catch (e) {}
    navigate(`/partner/credit-cards/${bank.slug}`);
  };

  const loanCategoriesList = useMemo(() => {
    const categories = [
      { title: "Personal Loan", sub: "Loan Category", slug: "personal-loan", accent: "#2563EB", emoji: "💰", defaultOffers: 12 },
      { title: "Home Loan", sub: "Loan Category", slug: "home-loan", accent: "#059669", emoji: "🏠", defaultOffers: 8 },
      { title: "Business Loan", sub: "Loan Category", slug: "business-loan", accent: "#7C3AED", emoji: "💼", defaultOffers: 10 },
      { title: "Loan Against Property", sub: "Loan Category", slug: "loan-against-property", accent: "#D97706", emoji: "🏢", defaultOffers: 6 },
      { title: "Gold Loan", sub: "Loan Category", slug: "gold-loan", accent: "#EA580C", emoji: "🪙", defaultOffers: 5 },
      { title: "Vehicle Loan", sub: "Loan Category", slug: "vehicle-loan", accent: "#0284C7", emoji: "🚗", defaultOffers: 7 }
    ];

    return categories.map(cat => {
      const dbMatchCount = (allProducts || []).filter(p => {
        const pCat = (p.category || '').toLowerCase();
        const pSub = (p.sub_category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const target = cat.slug.replace(/-/g, ' ');
        return pCat.includes('loan') && (pCat.includes(target) || pSub.includes(target) || pName.includes(target) || pCat.includes(cat.title.toLowerCase()));
      }).length;

      const offerCount = dbMatchCount > 0 ? dbMatchCount : cat.defaultOffers;
      return {
        ...cat,
        rawCount: offerCount,
        availableOffers: `${offerCount} Active ${cat.title} Offers`
      };
    });
  }, [allProducts]);

  const insuranceCategoriesList = useMemo(() => {
    const categories = [
      { title: "Health Insurance", sub: "Insurance Policy", slug: "health-insurance", accent: "#059669", emoji: "🏥", defaultOffers: 12 },
      { title: "Life Insurance", sub: "Insurance Policy", slug: "life-insurance", accent: "#2563EB", emoji: "🛡️", defaultOffers: 8 },
      { title: "General Insurance", sub: "Insurance Policy", slug: "general-insurance", accent: "#D97706", emoji: "📋", defaultOffers: 15 },
      { title: "Motor Insurance", sub: "Insurance Policy", slug: "motor-insurance", accent: "#E11D48", emoji: "🏎️", defaultOffers: 9 },
      { title: "Term Insurance", sub: "Insurance Policy", slug: "term-insurance", accent: "#7C3AED", emoji: "📜", defaultOffers: 7 }
    ];

    return categories.map(cat => {
      const dbMatchCount = (allProducts || []).filter(p => {
        const pCat = (p.category || '').toLowerCase();
        const pSub = (p.sub_category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const target = cat.slug.replace(/-/g, ' ');
        return pCat.includes('insurance') && (pCat.includes(target) || pSub.includes(target) || pName.includes(target) || pCat.includes(cat.title.toLowerCase()));
      }).length;

      const offerCount = dbMatchCount > 0 ? dbMatchCount : cat.defaultOffers;
      return {
        ...cat,
        rawCount: offerCount,
        availableOffers: `${offerCount} Active ${cat.title} Plans`
      };
    });
  }, [allProducts]);

  const rawCards = useMemo(() => {
    if (activeCategory === 'loans') return loanCategoriesList;
    if (activeCategory === 'insurance') return insuranceCategoriesList;
    return [];
  }, [activeCategory, loanCategoriesList, insuranceCategoriesList]);

  const filteredNonCcCards = useMemo(() => {
    let list = rawCards.filter(card => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || card.title.toLowerCase().includes(q) || card.slug.toLowerCase().includes(q);
      const matchesCategory = bankCategoryFilter === 'all' || card.slug === bankCategoryFilter;
      return matchesQuery && matchesCategory;
    });

    if (sortBy === 'most') {
      list = [...list].sort((a, b) => b.rawCount - a.rawCount);
    } else if (sortBy === 'name-asc') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name-desc') {
      list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    }

    return list;
  }, [rawCards, searchQuery, bankCategoryFilter, sortBy]);

  // Compute dynamic header title based on active sub-module tab
  const headerTitle = useMemo(() => {
    if (activeTab === 'cards' || activeTab === 'products') {
      if (activeCategory === 'loans') return t('categoryOverview.loansCatalog', 'Loans Catalog');
      if (activeCategory === 'insurance') return t('categoryOverview.insuranceCatalog', 'Insurance Catalog');
      return t('categoryOverview.creditCardsCatalog', 'Credit Cards Catalog');
    }
    if (activeTab === 'customers') return t('categoryOverview.customerManagement', 'Customer Management');
    if (activeTab === 'applications') return t('categoryOverview.applicationPipeline', 'Application Pipeline');
    if (activeTab === 'documents') return t('categoryOverview.documentVault', 'Document Vault');
    if (activeTab === 'reports') return t('categoryOverview.performanceReports', 'Performance Reports');
    if (activeTab === 'commission') return t('categoryOverview.commissionWallet', 'Commission & Wallet');
    if (activeTab === 'support') return t('categoryOverview.partnerSupport', 'Partner Support');

    // Default: Dashboard tab
    if (activeCategory === 'loans') return t('categoryOverview.loansDashboard', 'Loans Dashboard');
    if (activeCategory === 'insurance') return t('categoryOverview.insuranceDashboard', 'Insurance Dashboard');
    return t('categoryOverview.creditCardDashboard', 'Credit Card Dashboard');
  }, [activeTab, activeCategory, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── 1. TOP HORIZONTAL SUB-MODULE NAVIGATION BAR (BUTTONS AT VERY TOP) ── */}
      <div style={{
        background: isDark ? '#1E293B' : '#FFFFFF',
        borderRadius: '16px',
        padding: '8px 12px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        {getSubModuleTabs(t, activeCategory).map((tItem) => {
          const Icon = tItem.icon;
          const isActive = activeTab === tItem.id;

          return (
            <button
              key={tItem.id}
              onClick={() => handleTabChange(tItem.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#FFFFFF' : C.text,
                background: isActive ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : 'transparent',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? `0 4px 12px ${C.primary}30` : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={18} />
              <span>{tItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. HEADER SECTION WITH TITLE & SEARCH CONTROLS ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '22px' : '26px',
            fontWeight: 900,
            color: C.text,
            margin: 0,
            letterSpacing: '-0.4px'
          }}>
            {headerTitle}
          </h1>
        </div>

        {/* Search Bar & Filters */}
        {activeTab === 'dashboard' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            width: isMobile ? '100%' : 'auto'
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: isDark ? '#1E293B' : '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '14px',
              border: `1px solid ${C.border}`,
              width: isMobile ? '100%' : '240px',
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 2px 12px rgba(15,23,42,0.03)'
            }}>
              <MdSearch size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              <input
                type="text"
                placeholder={activeCategory === 'credit_card' ? t('categoryOverview.searchBanks', 'Search banks...') : t('categoryOverview.searchProducts', 'Search product...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.text,
                  width: '100%',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            {activeCategory === 'credit_card' && (
              <>
                {/* Category Filter */}
                <select
                  value={bankCategoryFilter}
                  onChange={(e) => setBankCategoryFilter(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: C.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="all">{t('categoryOverview.allBanks', 'All Banks')}</option>
                  <option value="private">{t('categoryOverview.privateBanks', 'Private Banks')}</option>
                  <option value="psu">{t('categoryOverview.psuBanks', 'PSU Banks')}</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: C.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="default">{t('categoryOverview.sortBy', 'Sort By')}</option>
                  <option value="most">{t('categoryOverview.mostCardVariants', 'Most Card Variants')}</option>
                  <option value="name-asc">{t('categoryOverview.nameAsc', 'Name A-Z')}</option>
                  <option value="name-desc">{t('categoryOverview.nameDesc', 'Name Z-A')}</option>
                </select>
              </>
            )}

            {activeCategory === 'loans' && (
              <>
                <select
                  value={bankCategoryFilter}
                  onChange={(e) => setBankCategoryFilter(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: C.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="all">All Loan Categories</option>
                  <option value="personal-loan">Personal Loan</option>
                  <option value="home-loan">Home Loan</option>
                  <option value="business-loan">Business Loan</option>
                  <option value="loan-against-property">Loan Against Property</option>
                  <option value="gold-loan">Gold Loan</option>
                  <option value="vehicle-loan">Vehicle Loan</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: C.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="default">Sort By</option>
                  <option value="most">Most Active Offers</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
              </>
            )}

            {activeCategory === 'insurance' && (
              <>
                <select
                  value={bankCategoryFilter}
                  onChange={(e) => setBankCategoryFilter(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: C.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="all">All Insurance Types</option>
                  <option value="health-insurance">Health Insurance</option>
                  <option value="life-insurance">Life Insurance</option>
                  <option value="general-insurance">General Insurance</option>
                  <option value="motor-insurance">Motor Insurance</option>
                  <option value="term-insurance">Term Insurance</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px',
                    border: `1px solid ${C.border}`,
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: C.text,
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <option value="default">Sort By</option>
                  <option value="most">Most Active Plans</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 3. DYNAMIC CONTENT AREA BELOW BUTTONS ── */}
      <div style={{ width: '100%' }}>

        {/* TAB 1: DASHBOARD (BANK CARDS COLLECTION GRID & MATCHING PRODUCTS) */}
        {activeTab === 'dashboard' && (
          <>
            {/* Matching Products Grid when user types in search bar */}
            {searchQuery.trim() !== '' && matchingProducts.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>
                    {t('categoryOverview.matchingProductsTitle', 'Matching Credit Cards & Products ({{count}})', { count: matchingProducts.length })}
                  </h3>
                  <button
                    onClick={() => handleTabChange('cards')}
                    style={{
                      background: 'none', border: 'none', color: C.primary, fontWeight: 800,
                      fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {t('categoryOverview.viewAllInCatalog', 'View All in Cards Catalog')} <MdArrowForward size={16} />
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {matchingProducts.slice(0, 12).map((product) => {
                    const payoutVal = parseFloat(product.commission_value || 0);
                    return (
                      <div
                        key={`prod-${product.id}`}
                        onClick={() => handleTabChange('cards')}
                        style={{
                          background: isDark ? '#1E293B' : '#FFFFFF',
                          borderRadius: '18px',
                          padding: '18px',
                          border: `1px solid ${C.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px',
                          cursor: 'pointer',
                          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '10px' }} 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, fontWeight: 800, fontSize: '20px' }}>
                              💳
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase' }}>
                              {product.bank_name || product.bank_code || 'Bank Product'}
                            </span>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {product.name}
                            </h4>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: C.green }}>
                            {payoutVal > 0 ? t('categoryOverview.earnAmount', 'Earn ₹{{amount}}', { amount: payoutVal.toLocaleString('en-IN') }) : t('categoryOverview.bestRate', 'Best Rate')}
                          </span>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: C.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t('categoryOverview.viewAndApply', 'View & Apply')} <MdArrowForward size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeCategory === 'credit_card' && (
              <>
                {loadingBanks && dbBanks.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    border: `1px solid ${C.border}`,
                    color: C.textMid || '#64748B',
                    fontWeight: 600
                  }}>
                    {t('categoryOverview.loadingBanks', 'Loading banks from database...')}
                  </div>
                ) : filteredBanks.length === 0 && matchingProducts.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    border: `1px solid ${C.border}`,
                    color: C.textMid || '#64748B'
                  }}>
                    {t('categoryOverview.noBanksFound', 'No banks or products found matching "{{query}}"', { query: searchQuery })}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '16px'
                  }}>
                    {filteredBanks.map((bank) => {
                      const accentColor = bank.accent || C.primary;
                      const bgGradient = isDark 
                        ? `linear-gradient(145deg, ${accentColor}25 0%, ${accentColor}0D 100%)`
                        : `linear-gradient(145deg, ${accentColor}14 0%, ${accentColor}05 100%)`;
                      const cardBorderColor = isDark ? `${accentColor}45` : `${accentColor}35`;

                      return (
                        <div
                          key={`bank-${bank.id || bank.slug}`}
                          onClick={() => handleBankClick(bank)}
                          style={{
                            background: bgGradient,
                            borderRadius: '20px',
                            padding: '20px',
                            border: `1.5px solid ${cardBorderColor}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '16px',
                            cursor: 'pointer',
                            boxShadow: isDark ? `0 4px 20px ${accentColor}15` : `0 4px 18px ${accentColor}10`,
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.borderColor = accentColor;
                            e.currentTarget.style.boxShadow = `0 12px 30px ${accentColor}35`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = cardBorderColor;
                            e.currentTarget.style.boxShadow = isDark ? `0 4px 20px ${accentColor}15` : `0 4px 18px ${accentColor}10`;
                          }}
                        >
                          {/* Top Part: Logo & Name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {bank.logo ? (
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '14px',
                                background: isDark ? '#0F172A' : '#FFFFFF',
                                border: `1.5px solid ${accentColor}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px',
                                flexShrink: 0,
                                boxShadow: `0 2px 8px ${accentColor}20`
                              }}>
                                <img 
                                  src={bank.logo} 
                                  alt={bank.name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                />
                              </div>
                            ) : (
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '14px',
                                background: `${accentColor}22`,
                                color: accentColor,
                                border: `1.5px solid ${accentColor}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                fontWeight: 900,
                                flexShrink: 0,
                                boxShadow: `0 2px 8px ${accentColor}20`
                              }}>
                                {bank.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}

                            <h3 style={{
                              fontSize: '15.5px',
                              fontWeight: 900,
                              color: isDark ? '#FFFFFF' : accentColor,
                              margin: 0,
                              lineHeight: 1.25
                            }}>
                              {bank.name}
                            </h3>
                          </div>

                          {/* Middle Part: Variants Count */}
                          <div>
                            <div style={{
                              fontSize: '28px',
                              fontWeight: 900,
                              color: accentColor,
                              letterSpacing: '-0.5px',
                              lineHeight: 1
                            }}>
                              {bank.activeCardsCount}
                            </div>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: isDark ? 'rgba(255,255,255,0.75)' : `${accentColor}DD`,
                              marginTop: '4px',
                              display: 'block'
                            }}>
                              {t('categoryOverview.cardVariants', 'Card Variants')}
                            </span>
                          </div>

                          {/* Bottom Part: Explore Link */}
                          <div style={{
                            paddingTop: '10px',
                            borderTop: `1px solid ${accentColor}30`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 900,
                              color: accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {t('categoryOverview.exploreCards', 'Explore Cards')} <MdArrowForward size={16} />
                            </span>
                          </div>

                          {/* Bottom Color Accent Line */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: accentColor,
                            boxShadow: `0 0 10px ${accentColor}`
                          }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Non-Credit Card Category View (Loans & Insurance) */}
            {activeCategory !== 'credit_card' && (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(230px, 1fr))",
                gap: "16px"
              }}>
                {filteredNonCcCards.map((card) => {
                  const accentColor = card.accent || C.primary;
                  const bgGradient = isDark 
                    ? `linear-gradient(145deg, ${accentColor}25 0%, ${accentColor}0D 100%)`
                    : `linear-gradient(145deg, ${accentColor}14 0%, ${accentColor}05 100%)`;
                  const cardBorderColor = isDark ? `${accentColor}45` : `${accentColor}35`;

                  return (
                    <div
                      key={`cat-${card.slug}`}
                      onClick={() => navigate(`${location.pathname}/${card.slug}`)}
                      style={{
                        background: bgGradient,
                        borderRadius: '20px',
                        padding: '20px',
                        border: `1.5px solid ${cardBorderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        cursor: 'pointer',
                        boxShadow: isDark ? `0 4px 20px ${accentColor}15` : `0 4px 18px ${accentColor}10`,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.borderColor = accentColor;
                        e.currentTarget.style.boxShadow = `0 12px 30px ${accentColor}35`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = cardBorderColor;
                        e.currentTarget.style.boxShadow = isDark ? `0 4px 20px ${accentColor}15` : `0 4px 18px ${accentColor}10`;
                      }}
                    >
                      {/* Top Part: Icon/Emoji & Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          background: `${accentColor}22`,
                          color: accentColor,
                          border: `1.5px solid ${accentColor}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          fontWeight: 900,
                          flexShrink: 0,
                          boxShadow: `0 2px 8px ${accentColor}20`
                        }}>
                          {card.emoji}
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                            {card.sub}
                          </span>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 900,
                            color: isDark ? '#FFFFFF' : accentColor,
                            margin: '2px 0 0',
                            lineHeight: 1.25
                          }}>
                            {card.title}
                          </h3>
                        </div>
                      </div>

                      {/* Middle Part: Active Offers Count */}
                      <div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 900,
                          color: accentColor,
                          letterSpacing: '-0.5px',
                          lineHeight: 1
                        }}>
                          {card.rawCount}
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isDark ? 'rgba(255,255,255,0.75)' : `${accentColor}DD`,
                          marginTop: '4px',
                          display: 'block'
                        }}>
                          {card.availableOffers}
                        </span>
                      </div>

                      {/* Bottom Part: Explore Offers Link */}
                      <div style={{
                        paddingTop: '10px',
                        borderTop: `1px solid ${accentColor}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 900,
                          color: accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {activeCategory === 'loans' ? 'Explore Offers' : 'Explore Plans'} <MdArrowForward size={16} />
                        </span>
                      </div>

                      {/* Bottom Color Accent Line */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: accentColor,
                        boxShadow: `0 0 10px ${accentColor}`
                      }} />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* TAB 2: CREDIT CARDS / PRODUCTS */}
        {(activeTab === 'cards' || activeTab === 'products') && (
          <PartnerProducts initialSearch={searchQuery} initialCategory={activeCategory} />
        )}

        {/* TAB 3: CUSTOMERS */}
        {activeTab === 'customers' && (
          <PartnerCrm />
        )}

        {/* TAB 4: APPLICATIONS */}
        {activeTab === 'applications' && (
          <PartnerApplications />
        )}

        {/* TAB 5: DOCUMENTS */}
        {activeTab === 'documents' && (
          <PartnerVault />
        )}

        {/* TAB 6: REPORTS */}
        {activeTab === 'reports' && (
          <PartnerReports />
        )}

        {/* TAB 7: COMMISSION / WALLET */}
        {activeTab === 'commission' && (
          <PartnerWallet />
        )}

        {/* TAB 8: SUPPORT */}
        {activeTab === 'support' && (
          <PartnerSupport />
        )}

      </div>
    </div>
  );
}
