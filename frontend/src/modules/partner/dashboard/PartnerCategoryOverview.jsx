import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActiveBanks } from '../../../contexts/BanksContext';
import { 
  MdSearch, MdArrowForward, MdAccountBalance
} from 'react-icons/md';
import api from '../../../services/api';

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

export default function PartnerCategoryOverview({ defaultCategory = 'credit_card' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const { activeBanks } = useActiveBanks();

  const [activeCategory, setActiveCategory] = useState(() => {
    if (location.pathname.includes('/partner/loans')) return 'loans';
    if (location.pathname.includes('/partner/insurance')) return 'insurance';
    return defaultCategory;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [bankCategoryFilter, setBankCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Database Banks State
  const [dbBanks, setDbBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

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
        console.warn('Could not load database banks, using active bank context fallback:', err);
      } finally {
        if (isMounted) setLoadingBanks(false);
      }
    };
    fetchDatabaseBanks();
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

  const rawCards = useMemo(() => {
    if (activeCategory === 'loans') return loanRoleCards;
    if (activeCategory === 'insurance') return insuranceRoleCards;
    return [];
  }, [activeCategory]);

  const filteredNonCcCards = useMemo(() => {
    return rawCards.filter(card => {
      return !searchQuery || 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        card.availableCards.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [rawCards, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ── 1. HEADER SECTION WITH TITLE, SEARCH & FILTERS ON SAME LINE ── */}
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
            {activeCategory === 'loans' ? 'Loans Dashboard' : activeCategory === 'insurance' ? 'Insurance Dashboard' : 'Credit Card Dashboard'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: C.textMid || '#64748B',
            margin: '4px 0 0',
            fontWeight: 500
          }}>
            {activeCategory === 'loans' 
              ? 'Manage & explore loan offerings across top financial partners' 
              : activeCategory === 'insurance' 
              ? 'Explore comprehensive insurance products and providers' 
              : 'Manage & explore bank wise credit card offerings'}
          </p>
        </div>

        {/* Top Controls: Search Bar & Filters on Same Line */}
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
              placeholder={activeCategory === 'credit_card' ? "Search banks..." : "Search product..."}
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
                <option value="all">All Banks</option>
                <option value="private">Private Banks</option>
                <option value="psu">PSU Banks</option>
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
                <option value="default">Sort By</option>
                <option value="most">Most Card Variants</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </>
          )}
        </div>
      </div>

      {activeCategory === 'credit_card' && (
        <>
          {/* ── 2. BANK CARDS GRID (FETCHED FROM DATABASE) ── */}
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
              Loading banks from database...
            </div>
          ) : filteredBanks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              background: isDark ? '#1E293B' : '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${C.border}`,
              color: C.textMid || '#64748B'
            }}>
              No bank found matching "{searchQuery}"
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '16px'
            }}>
              {filteredBanks.map((bank) => (
                <div
                  key={`bank-${bank.id || bank.slug}`}
                  onClick={() => handleBankClick(bank)}
                  style={{
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    borderRadius: '20px',
                    padding: '20px',
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = bank.accent || C.primary;
                    e.currentTarget.style.boxShadow = isDark 
                      ? `0 8px 25px ${bank.accent}30` 
                      : `0 8px 25px rgba(0,0,0,0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 18px rgba(15,23,42,0.03)';
                  }}
                >
                  {/* Top Part: Logo & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {bank.logo ? (
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: isDark ? '#0F172A' : '#F8FAFC',
                        border: `1px solid ${C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        flexShrink: 0
                      }}>
                        <img 
                          src={bank.logo} 
                          alt={bank.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: `${bank.accent || C.primary}18`,
                        color: bank.accent || C.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 900,
                        flexShrink: 0
                      }}>
                        {bank.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: C.text,
                      margin: 0,
                      lineHeight: 1.25
                    }}>
                      {bank.name}
                    </h3>
                  </div>

                  {/* Middle Part: Variants Count */}
                  <div>
                    <div style={{
                      fontSize: '26px',
                      fontWeight: 900,
                      color: C.text,
                      letterSpacing: '-0.5px',
                      lineHeight: 1
                    }}>
                      {bank.activeCardsCount}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: C.textMid || '#64748B',
                      marginTop: '4px',
                      display: 'block'
                    }}>
                      Card Variants
                    </span>
                  </div>

                  {/* Bottom Part: Explore Link with Accent Underline */}
                  <div style={{
                    paddingTop: '10px',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: bank.accent || C.primary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      Explore <MdArrowForward size={16} />
                    </span>
                  </div>

                  {/* Bottom Color Accent Line */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: bank.accent || C.primary,
                    opacity: 0.85
                  }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Non-Credit Card Category View (Loans & Insurance) */}
      {activeCategory !== 'credit_card' && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px"
        }}>
          {filteredNonCcCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`${location.pathname}/${card.slug}`)}
              style={{
                background: isDark ? '#1E293B' : '#FFFFFF',
                borderRadius: "18px",
                padding: "20px",
                border: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: '14px',
                cursor: 'pointer',
                boxShadow: isDark ? 'none' : '0 4px 18px rgba(0,0,0,0.03)'
              }}
            >
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: C.primary, textTransform: "uppercase" }}>
                  {card.sub}
                </span>
                <h4 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: "6px 0 4px" }}>
                  {card.title}
                </h4>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.textMid }}>
                  {card.availableCards}
                </span>
              </div>
              <button
                style={{
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: C.primary, color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer'
                }}
              >
                More Info
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
