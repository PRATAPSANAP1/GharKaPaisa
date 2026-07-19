import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, makeS } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useActiveBanks } from '../../../contexts/BanksContext';
import { 
  MdCreditCard, MdAccountBalanceWallet, MdShield, MdAdd, 
  MdSearch
} from 'react-icons/md';
import api from '../../../services/api';

// Helper function to convert title to slug
const toSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const employeeRoleCard = {
  title: "Employee", sub: "Role Context", count: "120",
  availableCards: "12 Staff Roles", commission: "Internal Allocation",
  applications: "120 active staff", approvalRatio: "100%", route: "/partner/team"
};

// Category Specific Cards Breakdown Data
const creditCardRoleCards = [
  { title: "HDFC Cards", sub: "Bank", count: "60139", availableCards: "18 Credit Card Variants", commission: "Up to ₹2,500 / approval", applications: "60,139 logged", approvalRatio: "88%", slug: "hdfc" },
  { title: "SBI Cards", sub: "Bank", count: "9398", availableCards: "14 Credit Card Variants", commission: "Up to ₹2,200 / approval", applications: "9,398 logged", approvalRatio: "85%", slug: "sbi" },
  { title: "ICICI Cards", sub: "Bank", count: "28", availableCards: "15 Credit Card Variants", commission: "Up to ₹2,400 / approval", applications: "28 logged", approvalRatio: "86%", slug: "icici" },
  { title: "AXIS Cards", sub: "Bank", count: "1676", availableCards: "16 Credit Card Variants", commission: "Up to ₹2,300 / approval", applications: "1,676 logged", approvalRatio: "84%", slug: "axis" },
  { title: "INDUSIND Cards", sub: "Bank", count: "2381", availableCards: "10 Credit Card Variants", commission: "Up to ₹2,100 / approval", applications: "2,381 logged", approvalRatio: "89%", slug: "indusind" },
  { title: "IDFC Cards", sub: "Bank", count: "13", availableCards: "8 Credit Card Variants", commission: "Up to ₹2,000 / approval", applications: "13 logged", approvalRatio: "91%", slug: "idfc" },
  { title: "AU Cards", sub: "Bank", count: "15", availableCards: "6 Credit Card Variants", commission: "Up to ₹1,800 / approval", applications: "15 logged", approvalRatio: "87%", slug: "au" },
  { title: "HSBC Cards", sub: "Bank", count: "3", availableCards: "5 Credit Card Variants", commission: "Up to ₹2,500 / approval", applications: "3 logged", approvalRatio: "90%", slug: "hsbc" },
  { title: "FEDERAL Cards", sub: "Bank", count: "10", availableCards: "4 Credit Card Variants", commission: "Up to ₹1,900 / approval", applications: "10 logged", approvalRatio: "83%", slug: "federal" },
  { title: "BOB Cards", sub: "Bank", count: "184", availableCards: "9 Credit Card Variants", commission: "Up to ₹1,850 / approval", applications: "184 logged", approvalRatio: "82%", slug: "bob" },
  { title: "YES Cards", sub: "Bank", count: "73", availableCards: "7 Credit Card Variants", commission: "Up to ₹2,000 / approval", applications: "73 logged", approvalRatio: "85%", slug: "yes" },
  { title: "KOTAK Cards", sub: "Bank", count: "5", availableCards: "11 Credit Card Variants", commission: "Up to ₹2,250 / approval", applications: "5 logged", approvalRatio: "88%", slug: "kotak" }
];

const loanRoleCards = [
  { title: "Personal Loan", sub: "Loan Type", count: "45210", availableCards: "12 Personal Loan Offers", commission: "Up to 2.8% Loan Amount", applications: "45,210 logged", approvalRatio: "86%", slug: "personal-loan" },
  { title: "Home Loan", sub: "Loan Type", count: "12450", availableCards: "8 Home Loan Offers", commission: "Up to 1.5% Loan Amount", applications: "12,450 logged", approvalRatio: "84%", slug: "home-loan" },
  { title: "Business Loan", sub: "Loan Type", count: "3890", availableCards: "10 Business Loans", commission: "Up to 3.0% Loan Amount", applications: "3,890 logged", approvalRatio: "82%", slug: "business-loan" },
  { title: "Loan Against Property", sub: "Loan Type", count: "8720", availableCards: "6 LAP Offers", commission: "Up to 2.0% Loan Amount", applications: "8,720 logged", approvalRatio: "89%", slug: "loan-against-property" },
  { title: "Gold Loan", sub: "Loan Type", count: "14200", availableCards: "5 Quick Gold Loans", commission: "Up to 1.8% Loan Amount", applications: "14,200 logged", approvalRatio: "94%", slug: "gold-loan" },
  { title: "Vehicle Loan", sub: "Loan Type", count: "2150", availableCards: "7 Auto & Bike Loans", commission: "Up to 2.2% Loan Amount", applications: "2,150 logged", approvalRatio: "87%", slug: "vehicle-loan" },
  { title: "Education Loan", sub: "Loan Type", count: "1840", availableCards: "4 Student Loans", commission: "Up to 2.0% Loan Amount", applications: "1,840 logged", approvalRatio: "88%", slug: "education-loan" },
  { title: "Overdraft", sub: "Loan Type", count: "950", availableCards: "3 OD Limits", commission: "Up to 2.5% Limit Amount", applications: "950 logged", approvalRatio: "85%", slug: "overdraft" },
  { title: "Working Capital", sub: "Loan Type", count: "1250", availableCards: "5 WC Limits", commission: "Up to 2.7% Limit Amount", applications: "1,250 logged", approvalRatio: "83%", slug: "working-capital" }
];

const insuranceRoleCards = [
  { title: "Health Insurance", sub: "Insurance Type", count: "18400", availableCards: "12 Health Policies", commission: "Up to 20% Premium", applications: "18,400 logged", approvalRatio: "94%", slug: "health-insurance" },
  { title: "Life Insurance", sub: "Insurance Type", count: "12350", availableCards: "8 Term & Life Plans", commission: "Up to 25% Premium", applications: "12,350 logged", approvalRatio: "92%", slug: "life-insurance" },
  { title: "General Insurance", sub: "Insurance Type", count: "8900", availableCards: "15 Motor & Asset Plans", commission: "Up to 12% Premium", applications: "8,900 logged", approvalRatio: "96%", slug: "general-insurance" }
];

export default function PartnerCategoryOverview({ defaultCategory = 'credit_card' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const { t } = useTranslation();
  const { activeBanks } = useActiveBanks();

  const [activeCategory, setActiveCategory] = useState(() => {
    if (location.pathname.includes('/partner/loans')) return 'loans';
    if (location.pathname.includes('/partner/insurance')) return 'insurance';
    return defaultCategory;
  });

  const [dynamicCcCards, setDynamicCcCards] = useState(creditCardRoleCards);

  useEffect(() => {
    if (activeBanks && activeBanks.length > 0) {
      const mapped = activeBanks.map(b => {
        return {
          title: `${(b.short_code || b.name).toUpperCase()} Cards`,
          sub: 'Bank',
          count: b.products_count || '10',
          availableCards: `${b.products_count || '8'} Credit Card Variants`,
          commission: 'Up to ₹2,500 / approval',
          applications: '120 logged',
          approvalRatio: '88%',
          slug: b.slug,
          logo: b.logo
        };
      });
      setDynamicCcCards(mapped);
    }
  }, [activeBanks]);

  const [selectedRoleCard, setSelectedRoleCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const roleCardsMap = {
    credit_card: dynamicCcCards,
    loans: loanRoleCards,
    insurance: insuranceRoleCards,
  };

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

  const rawCards = useMemo(() => {
    if (activeCategory === 'loans') return loanRoleCards;
    if (activeCategory === 'insurance') return insuranceRoleCards;
    return creditCardRoleCards;
  }, [activeCategory]);

  const filteredCards = useMemo(() => {
    return rawCards.filter(card => {
      return !searchQuery || 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        card.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.availableCards.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [rawCards, searchQuery]);

  const categoryBasePath = useMemo(() => {
    if (activeCategory === 'loans') return '/partner/loans';
    if (activeCategory === 'insurance') return '/partner/insurance';
    return '/partner/credit-cards';
  }, [activeCategory]);

  const categoryMeta = useMemo(() => {
    if (activeCategory === 'loans') {
      return { icon: MdAccountBalanceWallet, color: "#10B981", route: "/partner/leads/add" };
    }
    if (activeCategory === 'insurance') {
      return { icon: MdShield, color: "#F59E0B", route: "/partner/leads/add" };
    }
    return { icon: MdCreditCard, color: C.primary, route: "/partner/leads/add" };
  }, [activeCategory, C.primary]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* ── ROLE SUMMARY CARD (Top Context) ── */}
      <div style={{
        background: C.card,
        borderRadius: '20px',
        padding: '18px 24px',
        border: `1px solid ${C.border}`,
        boxShadow: isDark ? 'none' : '0 4px 20px rgba(15,23,42,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: `${C.primary}15`, color: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 800
          }}>
            👨‍💼
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: C.textMid, textTransform: 'uppercase' }}>
              Staff & Role Context
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: C.text, marginTop: '2px' }}>
              Employee — <span style={{ color: C.primary }}>120</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSelectedMoreInfoCard(employeeRoleCard)}
          style={{
            background: isDark ? C.bgSecondary : '#F1F5F9',
            color: C.primary,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          More Info
        </button>
      </div>

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
            placeholder="Search cards, banks, or types..."
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
            onClick={() => navigate('/partner/leads/add')}
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

      {/* ── CARDS BREAKDOWN GRID VIEW (2 per row on Mobile) ── */}
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
            {filteredCards.map((card, idx) => {
              const cardSlug = card.slug || toSlug(card.title);
              const cardDetailPath = `${categoryBasePath}/${cardSlug}`;

              return (
                <div
                  key={idx}
                  onClick={() => navigate(cardDetailPath)}
                  style={{
                    background: isDark ? C.bgSecondary : "#F8FAFC",
                    borderRadius: "14px",
                    padding: isMobile ? "12px" : "16px",
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: 'pointer',
                    transition: "all 0.2s ease"
                  }}
                  className="hover-card-clickable"
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: '0.5px' }}>
                        {card.sub}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMoreInfoCard({ ...card, route: cardDetailPath });
                        }}
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
              );
            })}
          </div>
        )}
      </div>

      {/* ── SUMMARY CARDS ROW (Bottom of Category Dashboard) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
        gap: isMobile ? "10px" : "16px"
      }}>
        <div style={{ background: C.card, borderRadius: "18px", padding: "16px 20px", border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: C.textMid }}>Total Teams</span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>15</div>
          <span style={{ fontSize: "11px", color: C.green, fontWeight: 700 }}>Active network</span>
        </div>
        <div style={{ background: C.card, borderRadius: "18px", padding: "16px 20px", border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: C.textMid }}>Total Earning</span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>₹0</div>
          <span style={{ fontSize: "11px", color: C.textMid, fontWeight: 600 }}>Calculated live</span>
        </div>
        <div style={{ background: C.card, borderRadius: "18px", padding: "16px 20px", border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: C.textMid }}>Today's Earning</span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>₹0</div>
          <span style={{ fontSize: "11px", color: C.textMid, fontWeight: 600 }}>Updated today</span>
        </div>
        <div style={{ background: C.card, borderRadius: "18px", padding: "16px 20px", border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: C.textMid }}>Inactive Team</span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.red, marginTop: "4px" }}>2</div>
          <span style={{ fontSize: "11px", color: C.red, fontWeight: 600 }}>Action required</span>
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
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Available Offers</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '4px' }}>
                    {selectedMoreInfoCard.availableCards}
                  </div>
                </div>
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Commission</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {selectedMoreInfoCard.commission}
                  </div>
                </div>
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Applications</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '4px' }}>
                    {selectedMoreInfoCard.applications}
                  </div>
                </div>
                <div style={{ background: isDark ? C.bgSecondary : '#F8FAFC', padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMid }}>Approval Ratio</span>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: C.primary, marginTop: '4px' }}>
                    {selectedMoreInfoCard.approvalRatio}
                  </div>
                </div>
              </div>
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
