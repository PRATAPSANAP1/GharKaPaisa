import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useActiveBanks } from '../../../contexts/BanksContext';
import { 
  MdCreditCard, MdAccountBalanceWallet, MdShield, MdAdd, 
  MdSearch, MdStar
} from 'react-icons/md';
import api from '../../../services/api';

const toSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const defaultCreditCardBanks = [
  { name: "HDFC Bank", slug: "hdfc", activeCardsCount: 22, shortCode: "HDFC" },
  { name: "State Bank of India", slug: "sbi", activeCardsCount: 15, shortCode: "SBI" },
  { name: "ICICI Bank", slug: "icici", activeCardsCount: 18, shortCode: "ICICI" },
  { name: "Axis Bank", slug: "axis", activeCardsCount: 18, shortCode: "AXIS" },
  { name: "IndusInd Bank", slug: "indusind", activeCardsCount: 10, shortCode: "INDUSIND" },
  { name: "IDFC FIRST Bank", slug: "idfc", activeCardsCount: 8, shortCode: "IDFC" },
  { name: "AU Small Finance Bank", slug: "au", activeCardsCount: 6, shortCode: "AU" },
  { name: "HSBC Bank", slug: "hsbc", activeCardsCount: 5, shortCode: "HSBC" },
  { name: "Federal Bank", slug: "federal", activeCardsCount: 4, shortCode: "FEDERAL" },
  { name: "Bank of Baroda", slug: "bob", activeCardsCount: 9, shortCode: "BOB" },
  { name: "YES Bank", slug: "yes", activeCardsCount: 7, shortCode: "YES" },
  { name: "Kotak Mahindra Bank", slug: "kotak", activeCardsCount: 11, shortCode: "KOTAK" }
];

const loanRoleCards = [
  { title: "Personal Loan", sub: "Loan Type", count: "45210", availableCards: "12 Personal Loan Offers", slug: "personal-loan" },
  { title: "Home Loan", sub: "Loan Type", count: "12450", availableCards: "8 Home Loan Offers", slug: "home-loan" },
  { title: "Business Loan", sub: "Loan Type", count: "3890", availableCards: "10 Business Loans", slug: "business-loan" },
  { title: "Loan Against Property", sub: "Loan Type", count: "8720", availableCards: "6 LAP Offers", slug: "loan-against-property" },
  { title: "Gold Loan", sub: "Loan Type", count: "14200", availableCards: "5 Quick Gold Loans", slug: "gold-loan" },
  { title: "Vehicle Loan", sub: "Loan Type", count: "2150", availableCards: "7 Auto & Bike Loans", slug: "vehicle-loan" }
];

const insuranceRoleCards = [
  { title: "Health Insurance", sub: "Insurance Type", count: "18400", availableCards: "12 Health Policies", slug: "health-insurance" },
  { title: "Life Insurance", sub: "Insurance Type", count: "12350", availableCards: "8 Term & Life Plans", slug: "life-insurance" },
  { title: "General Insurance", sub: "Insurance Type", count: "8900", availableCards: "15 Motor & Asset Plans", slug: "general-insurance" }
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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

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

  const bankList = useMemo(() => {
    if (activeBanks && activeBanks.length > 0) {
      return activeBanks.map(b => ({
        name: b.name,
        slug: b.slug,
        activeCardsCount: b.products_count || 10,
        shortCode: (b.short_code || b.name).toUpperCase(),
        logo: b.logo
      }));
    }
    return defaultCreditCardBanks;
  }, [activeBanks]);

  const filteredBanks = useMemo(() => {
    return bankList.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      return !q || b.name.toLowerCase().includes(q) || b.shortCode.toLowerCase().includes(q);
    });
  }, [bankList, searchQuery]);

  const favouriteBanks = useMemo(() => {
    const favSlugs = ['hdfc', 'sbi', 'icici', 'axis'];
    return bankList.filter(b => favSlugs.includes(b.slug.toLowerCase()));
  }, [bankList]);

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
      
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '20px 24px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: isDark ? 'none' : '0 4px 20px rgba(15,23,42,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {activeCategory === 'loans' ? 'Loans Dashboard' : activeCategory === 'insurance' ? 'Insurance Dashboard' : 'Credit Cards Dashboard'}
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '2px 0 0' }}>
              {activeCategory === 'loans' ? 'Loan Products' : activeCategory === 'insurance' ? 'Insurance Partners' : 'Select Bank'}
            </h2>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: isDark ? C.bgSecondary : '#F8FAFC',
          padding: '12px 18px',
          borderRadius: '14px',
          border: `1px solid ${C.border}`
        }}>
          <MdSearch size={22} color={C.textMid} />
          <input
            type="text"
            placeholder={activeCategory === 'credit_card' ? "Search Bank..." : "Search product or category..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: C.text,
              width: '100%',
              fontSize: '15px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {activeCategory === 'credit_card' && (
        <>
          {!searchQuery && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdStar size={18} color="#F59E0B" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Favourite Banks
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {favouriteBanks.map((bank) => (
                  <div
                    key={`fav-${bank.slug}`}
                    onClick={() => navigate(`/partner/credit-cards/${bank.slug}`)}
                    style={{
                      background: isDark ? C.bgSecondary : '#FFFFFF',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      border: `1.5px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s, border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>⭐</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>
                        {bank.shortCode || bank.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.primary }}>
                      {bank.activeCardsCount} Cards
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              All Banks
            </h3>

            {filteredBanks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, color: C.textMid }}>
                No bank found matching "{searchQuery}"
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {filteredBanks.map((bank) => (
                  <div
                    key={`bank-${bank.slug}`}
                    style={{
                      background: C.card,
                      borderRadius: '20px',
                      padding: '20px',
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: isDark ? 'none' : '0 4px 18px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {bank.logo ? (
                        <img src={bank.logo} alt={bank.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />
                      ) : (
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: `${C.primary}15`, color: C.primary,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', fontWeight: 900
                        }}>
                          🏦
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: 0 }}>
                          {bank.name}
                        </h4>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid, marginTop: '2px', display: 'block' }}>
                          {bank.activeCardsCount} Active Credit Cards
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/partner/credit-cards/${bank.slug}`)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: `0 4px 14px ${C.primary}30`,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      More Info
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

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
                background: C.card,
                borderRadius: "18px",
                padding: "20px",
                border: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: '12px',
                cursor: 'pointer'
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
