import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
  MdCreditCard, MdAccountBalanceWallet, MdShield, MdAdd, 
  MdSearch
} from 'react-icons/md';

// Category Specific Cards Breakdown Data
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

export default function PartnerCategoryOverview({ defaultCategory = 'credit_card' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { t } = useTranslation();

  // Determine active category based on URL pathname
  const [activeCategory, setActiveCategory] = useState(() => {
    if (location.pathname.includes('/partner/loans')) return 'loans';
    if (location.pathname.includes('/partner/insurance')) return 'insurance';
    return defaultCategory;
  });

  useEffect(() => {
    if (location.pathname.includes('/partner/loans')) setActiveCategory('loans');
    else if (location.pathname.includes('/partner/insurance')) setActiveCategory('insurance');
    else if (location.pathname.includes('/partner/credit-cards')) setActiveCategory('credit_card');
  }, [location.pathname]);

  const [selectedMoreInfoCard, setSelectedMoreInfoCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get raw cards data based on current activeCategory
  const rawCards = useMemo(() => {
    if (activeCategory === 'loans') return loanRoleCards;
    if (activeCategory === 'insurance') return insuranceRoleCards;
    return creditCardRoleCards;
  }, [activeCategory]);

  // Filtered Cards based on search query
  const filteredCards = useMemo(() => {
    return rawCards.filter(card => {
      return !searchQuery || 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        card.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.availableCards.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [rawCards, searchQuery]);

  const categoryMeta = useMemo(() => {
    if (activeCategory === 'loans') {
      return {
        icon: MdAccountBalanceWallet,
        color: "#10B981",
        route: "/partner/products?category=personal_loan"
      };
    }
    if (activeCategory === 'insurance') {
      return {
        icon: MdShield,
        color: "#F59E0B",
        route: "/partner/products?category=insurance"
      };
    }
    return {
      icon: MdCreditCard,
      color: C.primary,
      route: "/partner/products?category=credit_card"
    };
  }, [activeCategory, C.primary]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── SEARCH & ACTION HEADER BAR ── */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '16px 20px',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px', background: isDark ? C.bgSecondary : '#F8FAFC', padding: '8px 14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
          <MdSearch size={20} color={C.textMid} />
          <input
            type="text"
            placeholder="Search cards, banks, or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'none', border: 'none', color: C.text, width: '100%', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: C.textMid }}>
            Showing <strong>{filteredCards.length}</strong> items
          </span>
          <button
            onClick={() => navigate(categoryMeta.route)}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
              color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: `0 4px 16px ${C.primary}35`
            }}
          >
            <MdAdd size={18} />
            Add Lead / Apply Product
          </button>
        </div>
      </div>

      {/* ── CARDS BREAKDOWN GRID VIEW ── */}
      <style>{`
        @media (max-width: 767px) {
          .category-cards-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
        }
      `}</style>
      <div style={{
        background: C.card,
        borderRadius: "20px",
        padding: isMobile ? "16px" : "24px",
        border: `1px solid ${C.border}`,
        boxShadow: isDark ? "none" : "0 4px 20px rgba(15,23,42,0.04)"
      }}>
        {filteredCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMid }}>
            <p style={{ fontSize: '15px', fontWeight: 700 }}>No cards found matching your search.</p>
            <button
              onClick={() => setSearchQuery('')}
              style={{ marginTop: '8px', padding: '8px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="category-cards-grid" style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: isMobile ? "10px" : "16px"
          }}>
            {filteredCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: isDark ? C.bgSecondary : "#F8FAFC",
                  borderRadius: "14px",
                  padding: isMobile ? "12px" : "16px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: '0.5px' }}>
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
        )}
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
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: isDark ? C.bgSecondary : '#F8FAFC', position: 'relative' }}>
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
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Available Offers</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '4px' }}>
                    {selectedMoreInfoCard.availableCards}
                  </div>
                </div>

                {/* 2. Commission */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Commission</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {selectedMoreInfoCard.commission}
                  </div>
                </div>

                {/* 3. Applications */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Applications</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '4px' }}>
                    {selectedMoreInfoCard.applications}
                  </div>
                </div>

                {/* 4. Approval Ratio */}
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Approval Ratio</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.primary, marginTop: '4px' }}>
                    {selectedMoreInfoCard.approvalRatio}
                  </div>
                </div>

              </div>

              {/* Apply Now Action Button */}
              <button
                onClick={() => {
                  const targetRoute = selectedMoreInfoCard.route || categoryMeta.route;
                  setSelectedMoreInfoCard(null);
                  navigate(targetRoute);
                }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                  color: '#FFFFFF', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: `0 4px 16px ${C.primary}35`, marginTop: '8px'
                }}
              >
                <MdAdd size={20} />
                <span>Apply / Add Lead Now</span>
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
