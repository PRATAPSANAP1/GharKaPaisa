import React, { useState, useEffect } from "react";
import { useTheme } from "../Partner/ThemeContext";
import { useSearchStore } from "../../store/searchStore";
import {
  FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaChevronLeft,
  FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar,
  FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook,
  FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaArrowLeft, FaHome,
  FaChartLine, FaFileInvoiceDollar, FaCalculator, FaUsers, FaMoneyCheckAlt,
  FaStar, FaGooglePlay, FaApple, FaLinkedin, FaYoutube, FaFileAlt,
  FaBuilding as FaBuildingAlt, FaReceipt, FaBriefcase, FaHandsHelping, FaIdCard
} from "react-icons/fa";

// Import modular data lists
import { bankCardsDetails, ltfCards } from "./CreditCards";
import { loansData } from "./Loans";
import { insuranceData } from "./Insurance";
import { servicesData } from "./Services";

// ── Responsive Hook ──────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// ── Responsive Grid Component ──────────────────────────────────────
function ResponsiveGrid({ items, C, onSeeMore, onItemClick }) {
  const isMobile = useIsMobile();
  const showSeeMore = isMobile && items.length > 4;
  const visibleItems = showSeeMore ? items.slice(0, 3) : items;

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: isMobile ? "6px" : "12px", marginTop: "12px" }}>
      {visibleItems.map((item, idx) => (
        <div key={idx} style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
          background: C.bgSecondary, padding: isMobile ? "8px 4px" : "12px 8px", borderRadius: isMobile ? "10px" : "14px",
          border: `1px solid ${C.border}`, textAlign: "center", gap: isMobile ? "6px" : "10px",
          cursor: "pointer", transition: "all 0.2s"
        }}
          onClick={() => onItemClick && onItemClick(item)}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
        >
          {item.icon && <div style={{ color: C.teal, fontSize: isMobile ? "18px" : "22px" }}>{item.icon}</div>}
          <div style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
        </div>
      ))}
      {showSeeMore && (
        <div
          onClick={onSeeMore}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: `${C.teal}10`, padding: isMobile ? "8px 4px" : "12px 8px", borderRadius: isMobile ? "10px" : "14px",
            border: `1px dashed ${C.teal}`, textAlign: "center", gap: isMobile ? "6px" : "10px",
            cursor: "pointer", color: C.teal
          }}
        >
          <div style={{ fontSize: isMobile ? "18px" : "22px" }}><FaChevronRight /></div>
          <div style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: 800 }}>See More</div>
        </div>
      )}
    </div>
  );
}


// ── Section Component ──────────────────────────────────────────────
function Section({ title, viewAllLabel, onViewAll, C, children }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "16px"
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>{title}</h2>
        {onViewAll && (
          <span
            onClick={onViewAll}
            style={{ fontSize: "13px", fontWeight: 800, color: C.teal, cursor: "pointer" }}
          >
            {viewAllLabel || "View All"} →
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── CategoryPage Component ──────────────────────────────────────────
function CategoryPage({ category, onBack, C, onItemClick, breadcrumbs }) {
  const isMobile = useIsMobile();

  const renderBreadcrumbs = () => {
    if (!breadcrumbs) return null;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ color: C.textLight }}>/</span>}
            {crumb.action ? (
              <span 
                onClick={crumb.action} 
                style={{ color: C.teal, cursor: "pointer" }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                {crumb.label}
              </span>
            ) : (
              <span style={{ color: C.textLight }}>{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const BackRow = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
      <div onClick={onBack} style={{ cursor: "pointer", color: C.text }}><FaArrowLeft size={16} /></div>
      {renderBreadcrumbs()}
    </div>
  );

  if (category.id === "credit-cards") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
          <BackRow />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}>Select Partner Bank</h2>
            <button
              onClick={() => onItemClick && onItemClick({ id: "ltf-detail-page-trigger" })}
              style={{
                background: C.teal, color: "#fff", border: "none", padding: "8px 16px",
                borderRadius: "10px", fontSize: "13px", fontWeight: 800, cursor: "pointer",
                boxShadow: `0 4px 12px ${C.teal}30`, transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.opacity = 0.9}
              onMouseLeave={(e) => e.target.style.opacity = 1}
            >
              Lifetime Free Credit Cards (LTF)
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
            {category.items.map((item, idx) => (
              <div key={idx}
                onClick={() => onItemClick && onItemClick(item)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  background: C.bgSecondary, padding: "16px 10px", borderRadius: "14px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "10px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                {item.icon && <div style={{ color: C.teal, fontSize: "24px" }}>{item.icon}</div>}
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category.type === "hierarchy") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
          <BackRow />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {category.items.map((sec, sIdx) => (
              <div key={sIdx} style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 800, color: C.teal }}>{sec.section}</h3>
                {sec.subcategories && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sec.subcategories.map((sub, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", background: C.bgSecondary, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}` }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.teal }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sec.cards && (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px", marginTop: sec.subcategories ? "14px" : "0" }}>
                    {sec.cards.map((card, cIdx) => (
                      <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "4px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{card.name}</span>
                        <span style={{ fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{card.desc}</span>
                        <button style={{ alignSelf: "flex-start", marginTop: "8px", background: C.teal, color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                          Apply Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category.type === "bank-detail") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
          <BackRow />
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {category.sections.map((sec, sIdx) => (
              <div key={sIdx} style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 800, color: C.teal }}>{sec.title}</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                  {sec.cards.map((card, cIdx) => (
                    <div key={cIdx} style={{ display: "flex", flexDirection: "column", gap: "4px", background: C.bgSecondary, padding: "14px", borderRadius: "12px", border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{card.name}</span>
                      <span style={{ fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{card.desc}</span>
                      <button style={{ alignSelf: "flex-start", marginTop: "8px", background: C.teal, color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
        <BackRow />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {category.items && category.items.length > 0 ? category.items.map((item, idx) => (
            <div key={idx}
              onClick={() => onItemClick && onItemClick(item)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                background: C.bgSecondary, padding: isMobile ? "12px 8px" : "16px 12px", borderRadius: "14px",
                border: `1px solid ${C.border}`, textAlign: "center", gap: "10px", cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {item.icon && <div style={{ color: C.teal, fontSize: isMobile ? "20px" : "24px" }}>{item.icon}</div>}
              <div style={{ fontSize: isMobile ? "12px" : "14px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
            </div>
          )) : (
            <div style={{ color: C.textLight, gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>No items available in this category.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile Bottom Navigation ────────────────────────────────────────
function MobileBottomNav({ C, onNavigate, activeTab }) {
  const navItems = [
    { id: "home", label: "Dashboard", icon: <FaHome /> },
    { id: "credit-cards", label: "Credit Card", icon: <FaRegCreditCard /> },
    { id: "loans", label: "Loan", icon: <FaMoneyBillWave /> },
    { id: "insurance", label: "Insurance", icon: <FaShieldAlt /> },
    { id: "investment", label: "Investment", icon: <FaChartLine /> },
    { id: "services", label: "Services", icon: <FaFileInvoiceDollar /> }
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: C.card, borderTop: `1px solid ${C.border}`,
      display: "flex", justifyContent: "flex-start", padding: "10px 16px", gap: "24px",
      overflowX: "auto", whiteSpace: "nowrap", WebkitOverflowScrolling: "touch",
      zIndex: 100, boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
    }}>
      {navItems.map(item => (
        <div key={item.id} onClick={() => onNavigate(item.id)} style={{ flexShrink: 0, minWidth: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: activeTab === item.id ? C.teal : C.textLight, cursor: "pointer" }}>
          <div style={{ fontSize: "20px" }}>{item.icon}</div>
          <div style={{ fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Attractive Categories Ticker Array ─────────────────────────────
const attractiveCategories = [
  {
    id: "ltf-cards",
    title: "Lifetime Free Cards",
    label: "Lifetime Free Cards",
    description: "Enjoy zero annual fees and lifetime free benefits on premium credit cards.",
    icon: <FaRegCreditCard />,
    gradient: "linear-gradient(135deg, #166397 0%, #0F4F7A 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Popular Lifetime Free Cards",
        cards: [
          { name: "IDFC FIRST Millennia Credit Card", desc: "Lifetime free with high rewards on online spends" },
          { name: "Kotak League Platinum Card", desc: "Premium benefits with zero annual fee" },
          { name: "ICICI Platinum Chip Credit Card", desc: "Classic lifetime free shopping card" },
          { name: "AU LIT Credit Card", desc: "Customizable features with no annual fee" }
        ]
      }
    ]
  },
  {
    id: "cibil-loans",
    title: "CIBIL Loan",
    label: "CIBIL Loan",
    description: "Get personalized loan offers tailored specifically to your credit profile.",
    icon: <FaMoneyCheckAlt />,
    gradient: "linear-gradient(135deg, #27ae60 0%, #0c6b30 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Loan Categories",
        subcategories: [
          "Personal Loan based on CIBIL Score",
          "Pre-approved Personal Loan",
          "Instant Personal Loan"
        ]
      }
    ]
  },
  {
    id: "hdfc-cc-loan",
    title: "Loan on Credit Card",
    label: "Loan on Credit Card",
    description: "Unlock instant cash or loans against your existing credit card limit.",
    icon: <FaRegCreditCard />,
    gradient: "linear-gradient(135deg, #8e44ad 0%, #5b2c6f 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Loan Options",
        subcategories: [
          "Loan on Existing Credit Card",
          "Pre-approved Loan on Credit Card",
          "Cash on Credit Card"
        ]
      }
    ]
  },
  {
    id: "smart-emi",
    title: "Smart EMI Card",
    label: "Smart EMI Card",
    description: "Split your purchases into easy no-cost EMIs with instant approval.",
    icon: <FaIdCard />,
    gradient: "linear-gradient(135deg, #f39c12 0%, #d35400 100%)",
    type: "hierarchy",
    items: [
      {
        section: "EMI Card Options",
        subcategories: [
          "Bajaj Finserv EMI Card",
          "HDFC Consumer Durable Loan",
          "ICICI EMI Card"
        ]
      }
    ]
  },
  {
    id: "secured-cards",
    title: "FD Backed Card",
    label: "FD Backed Card",
    description: "Build or rebuild your credit score with high-approval FD-backed credit cards.",
    icon: <FaShieldAlt />,
    gradient: "linear-gradient(135deg, #16a085 0%, #117864 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Available Cards",
        cards: [
          { name: "IDFC FIRST WOW Credit Card", desc: "100% limit against FD with zero documentation" },
          { name: "Kotak 811 Dream Different Credit Card", desc: "Interest on FD and zero annual fee" },
          { name: "OneCard Secured Credit Card", desc: "Metal card backed by FD with premium rewards" },
          { name: "HDFC Secured Credit Card", desc: "Build credit relationship with India's largest bank" }
        ]
      }
    ]
  },
  {
    id: "upi-cards",
    title: "UPI Credit Card",
    label: "UPI Credit Card",
    description: "Make merchant payments directly via UPI using your RuPay credit card.",
    icon: <FaMobileAlt />,
    gradient: "linear-gradient(135deg, #c0392b 0%, #962d22 100%)",
    type: "hierarchy",
    items: [
      {
        section: "Card Types",
        subcategories: [
          "RuPay Credit Cards",
          "UPI Linked Credit Cards"
        ]
      },
      {
        section: "Available Cards",
        cards: [
          { name: "HDFC Tata Neu Plus RuPay", desc: "2% back on Tata Neu spend via UPI" },
          { name: "HDFC Tata Neu Infinity RuPay", desc: "5% back on Tata Neu spend via UPI" },
          { name: "Kiwi RuPay Credit Card", desc: "UPI-first credit card with instant rewards" },
          { name: "IndusInd Platinum RuPay Card", desc: "Premium lounge access and RuPay benefits" },
          { name: "BOB Snapdeal RuPay Card", desc: "Co-branded shopping rewards on RuPay network" },
          { name: "ICICI Coral RuPay Card", desc: "BookMyShow discounts and dining rewards" }
        ]
      }
    ]
  }
];

const banksList = [
  { id: "hdfc", label: "HDFC Bank", icon: <FaUniversity /> },
  { id: "sbi", label: "SBI Card", icon: <FaUniversity /> },
  { id: "axis", label: "Axis Bank", icon: <FaUniversity /> },
  { id: "icici", label: "ICICI Bank", icon: <FaUniversity /> },
  { id: "kotak", label: "Kotak Bank", icon: <FaUniversity /> },
  { id: "yes", label: "Yes Bank", icon: <FaUniversity /> },
  { id: "indusind", label: "IndusInd", icon: <FaUniversity /> },
  { id: "bob", label: "BOB", icon: <FaUniversity /> },
  { id: "dcb", label: "DCB", icon: <FaUniversity /> },
  { id: "federal", label: "FEDERAL", icon: <FaUniversity /> },
  { id: "sbm", label: "SBM", icon: <FaUniversity /> },
  { id: "idfc", label: "IDFC", icon: <FaUniversity /> },
  { id: "rbl", label: "RBL", icon: <FaUniversity /> },
  { id: "equitas", label: "Equitas", icon: <FaUniversity /> }
];

const popularCards = [
  { 
    name: "HDFC Millennia", 
    bank: "HDFC Bank", 
    benefit: "5% Cashback on online shopping", 
    gradientStart: "#166397", 
    gradientEnd: "#0B1622" 
  },
  { 
    name: "HDFC Swiggy", 
    bank: "HDFC Bank", 
    benefit: "10% Swiggy Cashback", 
    gradientStart: "#f27a1a", 
    gradientEnd: "#e65c00" 
  },
  { 
    name: "SBI SimplyCLICK", 
    bank: "SBI Card", 
    benefit: "10X Rewards on online partners", 
    gradientStart: "#00a8cc", 
    gradientEnd: "#112035" 
  },
  { 
    name: "Axis ACE", 
    bank: "Axis Bank", 
    benefit: "2% Cashback on all spends", 
    gradientStart: "#a22c54", 
    gradientEnd: "#4b1220" 
  },
  { 
    name: "IDFC FIRST Select", 
    bank: "IDFC Bank", 
    benefit: "Buy 1 Get 1 Movie Ticket Free", 
    gradientStart: "#8b1014", 
    gradientEnd: "#240304" 
  },
  { 
    name: "IndusInd Legend", 
    bank: "IndusInd", 
    benefit: "Zero joining fee, double rewards", 
    gradientStart: "#d4af37", 
    gradientEnd: "#8a6d1c" 
  }
];

const trustBanks = [
  { name: "HDFC", color: "#166397" },
  { name: "SBI", color: "#2980b9" },
  { name: "Axis", color: "#a22c54" },
  { name: "ICICI", color: "#e67e22" },
  { name: "BOB", color: "#d35400" },
  { name: "IDFC FIRST", color: "#8b1014" },
  { name: "IndusInd", color: "#d4af37" },
  { name: "Kotak", color: "#c0392b" }
];

export default function Home({ onNavigate }) {
  const { C } = useTheme();
  const isMobile = useIsMobile();
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isTickerPaused, setIsTickerPaused] = useState(false);

  const searchItem = useSearchStore(state => state.searchItem);
  const setSearchItem = useSearchStore(state => state.setSearchItem);

  // Auto rotate banner slides (height 320px)
  const bannerSlides = [
    { 
      title: "Lifetime Free Credit Cards", 
      subtitle: "Zero Joining Fee • Zero Annual Fee", 
      btnText: "Explore Now",
      gradient: "linear-gradient(135deg, #166397 0%, #0B1622 100%)",
      action: () => setActiveCategory({ id: "ltf-detail-page", title: "Lifetime Free Credit Cards (LTF)", parentId: "credit-cards", items: ltfCards.map(c => ({ id: c.name.toLowerCase().replace(/\s+/g, "-"), label: c.name, icon: <FaRegCreditCard /> })) })
    },
    { 
      title: "Personal Loans", 
      subtitle: "Low Interest Rates • Quick Disbursal", 
      btnText: "Apply Now",
      gradient: "linear-gradient(135deg, #27ae60 0%, #0F4F7A 100%)",
      action: () => setActiveCategory({ id: "loans", title: "Loans", items: loansData })
    },
    { 
      title: "Business Loans", 
      subtitle: "Flexible repayment options for growing businesses", 
      btnText: "Check Eligibility",
      gradient: "linear-gradient(135deg, #8e44ad 0%, #112035 100%)",
      action: () => setActiveCategory({ id: "loans", title: "Loans", items: loansData })
    },
    { 
      title: "Insurance Plans", 
      subtitle: "Comprehensive health, life and general insurance cover", 
      btnText: "Get Quotes",
      gradient: "linear-gradient(135deg, #f39c12 0%, #4b1220 100%)",
      action: () => setActiveCategory({ id: "insurance", title: "Insurance", items: insuranceData })
    },
    { 
      title: "EMI Cards", 
      subtitle: "Convert purchases to no-cost EMIs instantly", 
      btnText: "Get EMI Card",
      gradient: "linear-gradient(135deg, #16a085 0%, #091320 100%)",
      action: () => handleAttractiveCategoryClick(attractiveCategories.find(c => c.id === "smart-emi"))
    }
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCategory]);

  // Handle Search events from Navbar
  useEffect(() => {
    if (searchItem) {
      if (searchItem.type === "category") {
        if (searchItem.target.id === "credit-cards") {
          setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList });
        } else if (searchItem.target.id === "loans") {
          setActiveCategory({ id: "loans", title: "Loans", items: loansData });
        } else if (searchItem.target.id === "insurance") {
          setActiveCategory({ id: "insurance", title: "Insurance", items: insuranceData });
        } else if (searchItem.target.id === "services") {
          setActiveCategory({ id: "services", title: "Services", items: servicesData });
        } else if (searchItem.target.id === "ltf-detail-page") {
          setActiveCategory({ id: "ltf-detail-page", title: "Lifetime Free Credit Cards (LTF)", parentId: "credit-cards", items: ltfCards.map(c => ({ id: c.name.toLowerCase().replace(/\s+/g, "-"), label: c.name, icon: <FaRegCreditCard /> })) });
        } else if (searchItem.target.id.startsWith("bank-")) {
          const bankId = searchItem.target.id.split("-")[1];
          const bankItem = banksList.find(b => b.id === bankId);
          if (bankItem) handleItemClick(bankItem);
        } else {
          const attractiveCat = attractiveCategories.find(c => c.id === searchItem.target.id);
          if (attractiveCat) handleAttractiveCategoryClick(attractiveCat);
        }
      } else if (searchItem.type === "loan") {
        setActiveCategory({ id: "loans", title: "Loans", items: loansData });
      } else if (searchItem.type === "insurance") {
        setActiveCategory({ id: "insurance", title: "Insurance", items: insuranceData });
      } else if (searchItem.type === "service") {
        setActiveCategory({ id: "services", title: "Services", items: servicesData });
      }
      setSearchItem(null); // Reset store
    }
  }, [searchItem]);

  const handleBannerClick = () => {
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const getBreadcrumbs = (cat) => {
    const crumbs = [{ label: "Home", action: () => setActiveCategory(null) }];
    
    if (!cat) return crumbs;

    if (cat.id.startsWith("cobrand-") || cat.id.startsWith("fd-")) {
      const bankId = cat.id.split("-")[1];
      const bankName = banksList.find(b => b.id === bankId)?.label || "Bank";
      crumbs.push({ label: "Credit Cards", action: () => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList }) });
      crumbs.push({ 
        label: bankName, 
        action: () => handleItemClick({ id: bankId, label: bankName }) 
      });
      crumbs.push({ label: cat.id.startsWith("cobrand-") ? "Co-Brand" : "FD Based Cards", action: null });
    } else if (cat.parentId === "credit-cards" || cat.id.startsWith("bank-")) {
      crumbs.push({ label: "Credit Cards", action: () => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList }) });
      crumbs.push({ label: cat.title, action: null });
    } else if (cat.id === "credit-cards") {
      crumbs.push({ label: "Credit Cards", action: null });
    } else if (cat.id === "loans") {
      crumbs.push({ label: "Loans", action: null });
    } else if (cat.id === "insurance") {
      crumbs.push({ label: "Insurance", action: null });
    } else if (cat.id === "services") {
      crumbs.push({ label: "Services", action: null });
    } else {
      crumbs.push({ label: "Attractive Sections", action: () => setActiveCategory(null) });
      crumbs.push({ label: cat.title, action: null });
    }
    
    return crumbs;
  };

  const handleBottomNavClick = (id) => {
    if (id === "home") setActiveCategory(null);
    else if (id === "credit-cards") setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList });
    else if (id === "loans") setActiveCategory({ id: "loans", title: "Loans", items: loansData });
    else if (id === "insurance") setActiveCategory({ id: "insurance", title: "Insurance", items: insuranceData });
    else if (id === "investment") setActiveCategory({ id: "investment", title: "Investment", items: [] });
    else if (id === "services") setActiveCategory({ id: "services", title: "Services", items: servicesData });
  };

  const handleItemClick = (item) => {
    if (item.id === "ltf-detail-page-trigger") {
      setActiveCategory({
        id: "ltf-detail-page",
        title: "Lifetime Free Credit Cards (LTF)",
        parentId: "credit-cards",
        items: ltfCards.map(card => ({
          id: card.name.toLowerCase().replace(/\s+/g, "-"),
          label: card.name,
          icon: <FaRegCreditCard />
        }))
      });
      return;
    }
    if (activeCategory?.id === "credit-cards" || banksList.find(b => b.id === item.id)) {
      if (bankCardsDetails[item.id]) {
        setActiveCategory({
          id: `bank-${item.id}`,
          title: bankCardsDetails[item.id].title,
          parentId: "credit-cards",
          type: "bank-detail",
          sections: bankCardsDetails[item.id].sections
        });
      } else {
        setActiveCategory({
          id: `bank-${item.id}`,
          title: item.label,
          parentId: "credit-cards",
          items: [
            { id: `cobrand-${item.id}`, label: "Co-Brand", icon: <FaLaptopHouse /> },
            { id: `fd-${item.id}`, label: "FD Based Cards", icon: <FaUniversity /> }
          ]
        });
      }
    }
  };

  const handleAttractiveCategoryClick = (cat) => {
    setActiveCategory({
      id: cat.id,
      title: cat.title,
      type: "hierarchy",
      items: cat.items
    });
  };

  const handleBack = () => {
    if (activeCategory?.parentId === "credit-cards") {
      setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList });
    } else {
      setActiveCategory(null);
    }
  };

  // If a category page is active, render it
  if (activeCategory) {
    return (
      <>
        <CategoryPage category={activeCategory} onBack={handleBack} onItemClick={handleItemClick} C={C} breadcrumbs={getBreadcrumbs(activeCategory)} />
        {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab={activeCategory.id || "home"} />}
      </>
    );
  }

  const moneyTransfer = [
    { label: "To Mobile", icon: <FaMobileAlt />, desc: "Send money instantly", color: "#27ae60" },
    { label: "Recharge", icon: <FaMobileAlt />, desc: "Mobile, DTH, FASTag", color: "#2980b9" },
    { label: "Electricity", icon: <FaBolt />, desc: "Pay electricity bills", color: "#f39c12" },
    { label: "Loan Repay", icon: <FaMoneyBillWave />, desc: "EMI & Loan Payments", color: "#8e44ad" }
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: isMobile ? "80px" : "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>

        {/* ── HERO BANNER OVERHAUL ── */}
        <div 
          onClick={handleBannerClick}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ 
            cursor: "pointer", width: "100%", height: isMobile ? "180px" : "320px", 
            borderRadius: "20px", marginBottom: "32px", display: "flex", 
            alignItems: "center", justifyContent: "center", overflow: "hidden", 
            position: "relative", boxShadow: `0 8px 32px rgba(0,0,0,0.12)` 
          }}
        >
          {bannerSlides.map((slide, idx) => (
            <div key={idx} style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              background: slide.gradient, opacity: idx === bannerIndex ? 1 : 0,
              transition: "opacity 0.6s ease-in-out", display: "flex",
              flexDirection: "column", justifyContent: "center",
              padding: isMobile ? "0 24px" : "0 60px", color: "#fff"
            }}>
              <h2 style={{ fontSize: isMobile ? "20px" : "36px", fontWeight: 900, margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>{slide.title}</h2>
              <p style={{ fontSize: isMobile ? "12px" : "16px", margin: "0 0 20px 0", color: "rgba(255,255,255,0.85)" }}>{slide.subtitle}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); slide.action(); }}
                style={{
                  alignSelf: "flex-start", background: C.teal, color: "#fff",
                  border: "none", padding: isMobile ? "8px 16px" : "12px 24px",
                  borderRadius: "10px", fontSize: isMobile ? "11px" : "14px",
                  fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.opacity = 0.9}
                onMouseLeave={(e) => e.target.style.opacity = 1}
              >
                {slide.btnText}
              </button>
            </div>
          ))}

          {/* Left Arrow */}
          <div style={{ position: "absolute", left: "16px", zIndex: 10, background: "rgba(255,255,255,0.7)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <FaChevronLeft size={14} />
          </div>

          {/* Right Arrow */}
          <div style={{ position: "absolute", right: "16px", zIndex: 10, background: "rgba(255,255,255,0.7)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <FaChevronRight size={14} />
          </div>

          {/* Slider Indicators */}
          <div style={{ position: "absolute", bottom: "16px", display: "flex", gap: "8px", zIndex: 10 }}>
            {bannerSlides.map((_, idx) => (
              <div 
                key={idx} 
                onClick={(e) => { e.stopPropagation(); setBannerIndex(idx); setIsPaused(true); setTimeout(() => setIsPaused(false), 5000); }}
                style={{ 
                  width: idx === bannerIndex ? "24px" : "8px", 
                  height: "8px", borderRadius: "4px", 
                  background: idx === bannerIndex ? "#fff" : "rgba(255,255,255,0.5)", 
                  transition: "all 0.3s ease", cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }} 
              />
            ))}
          </div>
        </div>

        {/* ── SECTION 1: Money Transfer & Payments ── */}
        <Section title="Money Transfer & Payments" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? "10px" : "16px", marginTop: "12px" }}>
            {moneyTransfer.map((item, idx) => (
              <div key={idx} style={{ 
                display: "flex", flexDirection: "column", 
                justifyContent: "center", height: "120px", 
                background: C.bgSecondary, borderLeft: `5px solid ${item.color}`, 
                padding: "16px 20px", borderRadius: "14px", cursor: "pointer", 
                borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, 
                borderBottom: `1px solid ${C.border}`, transition: "transform 0.2s" 
              }} 
                onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(-4px)")} 
                onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${item.color}15`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{item.label}</div>
                </div>
                <div style={{ fontSize: "11px", color: C.textLight, lineHeight: 1.3 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 2: Attractive Cards/Loans (ticker) ── */}
        <Section title="Attractive Cards/Loans" C={C}>
          <style>{`
            @keyframes ticker-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .ticker-wrap {
              display: flex; gap: 16px; width: max-content;
              animation: ticker-scroll 35s linear infinite;
            }
            .ticker-wrap.paused { animation-play-state: paused !important; }
          `}</style>
          <div 
            onMouseEnter={() => setIsTickerPaused(true)}
            onMouseLeave={() => setIsTickerPaused(false)}
            onTouchStart={() => setIsTickerPaused(true)}
            onTouchEnd={() => setIsTickerPaused(false)}
            style={{
              overflow: "hidden", width: "100%", padding: "12px 0", position: "relative", display: "flex",
              maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)"
            }}
          >
            <div className={`ticker-wrap ${isTickerPaused ? "paused" : ""}`}>
              {[...attractiveCategories, ...attractiveCategories].map((cat, idx) => (
                <div key={`${cat.id}-${idx}`} style={{
                  background: C.bgSecondary, borderRadius: "16px", border: `1px solid ${C.border}`,
                  cursor: "pointer", transition: "all 0.3s ease", display: "flex", flexDirection: "column",
                  width: isMobile ? "200px" : "260px", height: "260px", overflow: "hidden", flexShrink: 0
                }}
                onClick={() => handleAttractiveCategoryClick(cat)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.teal;
                  e.currentTarget.style.boxShadow = `0 8px 20px ${C.teal}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  {/* Image Panel */}
                  <div style={{
                    height: "110px", background: cat.gradient, display: "flex",
                    alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "32px"
                  }}>
                    {cat.icon}
                  </div>
                  {/* Content Area */}
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{cat.label}</h3>
                      <p style={{ margin: 0, fontSize: "11px", color: C.textLight, lineHeight: 1.3 }}>{cat.description}</p>
                    </div>
                    <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: C.teal }}>
                      Explore <FaChevronRight size={8} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── SECTION 3: Popular Credit Cards ── */}
        <Section 
          title="Popular Credit Cards" 
          viewAllLabel="View All Cards" 
          onViewAll={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })}
          C={C}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", gap: "16px" }}>
            {popularCards.map((card, idx) => (
              <div key={idx} style={{
                background: C.bgSecondary, borderRadius: "18px", border: `1px solid ${C.border}`,
                padding: "12px", display: "flex", flexDirection: "column", gap: "12px",
                transition: "all 0.2s ease", cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
              >
                {/* Visual Card Card */}
                <div style={{
                  background: `linear-gradient(135deg, ${card.gradientStart}, ${card.gradientEnd})`,
                  borderRadius: "12px", padding: "12px", color: "#fff", height: "100px",
                  position: "relative", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  overflow: "hidden"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ width: "24px", height: "18px", borderRadius: "3px", background: "linear-gradient(135deg, #e0a96d, #cf8a4f)" }} />
                    <span style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.5px" }}>{card.bank}</span>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.5px" }}>{card.name}</div>
                  <div style={{ position: "absolute", right: "-10px", bottom: "-10px", width: "50px", height: "50px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                </div>
                {/* Details */}
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{card.name}</h3>
                  <p style={{ margin: "0 0 10px 0", fontSize: "10px", color: C.textLight, lineHeight: 1.3 }}>{card.benefit}</p>
                  <button 
                    onClick={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })}
                    style={{
                      width: "100%", background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}`,
                      padding: "6px 0", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { e.target.style.background = C.teal; e.target.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.target.style.background = `${C.teal}15`; e.target.style.color = C.teal; }}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 4: Popular Credit Card Banks ── */}
        <Section title="Popular Credit Card Banks" C={C}>
          <ResponsiveGrid C={C} items={banksList} onSeeMore={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })} onItemClick={handleItemClick} />
        </Section>

        {/* ── SECTION 5: Loans ── */}
        <Section title="Loans" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "10px" }}>
            {loansData.slice(0, 6).map((item, idx) => (
              <div key={idx}
                onClick={() => handleBottomNavClick("loans")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "16px 8px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "8px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ color: C.teal, fontSize: "22px" }}>{item.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 6: Insurance ── */}
        <Section title="Insurance" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "10px" }}>
            {insuranceData.map((item, idx) => (
              <div key={idx}
                onClick={() => handleBottomNavClick("insurance")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "16px 8px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "8px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ color: C.teal, fontSize: "22px" }}>{item.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 7: Business Services ── */}
        <Section title="Business Services" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(8, 1fr)", gap: "10px" }}>
            {servicesData.map((item, idx) => (
              <div key={idx}
                onClick={() => handleBottomNavClick("services")}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: C.bgSecondary, padding: "14px 6px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, textAlign: "center", gap: "6px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ color: C.teal, fontSize: "20px" }}>{item.icon}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 8: Partner Banks (Logo strip) ── */}
        <Section title="Partner Banks" C={C}>
          <div style={{ 
            display: "flex", flexWrap: "wrap", justifyContent: "space-between", 
            alignItems: "center", gap: "16px", padding: "16px 0" 
          }}>
            {trustBanks.map((bank, idx) => (
              <div key={idx} style={{
                background: C.bgSecondary, border: `1px solid ${C.border}`,
                borderRadius: "10px", padding: "10px 20px", fontSize: "14px",
                fontWeight: 900, color: bank.color, whiteSpace: "nowrap", cursor: "default",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}>
                {bank.name}
              </div>
            ))}
          </div>
        </Section>

        {/* ── MODERN FOOTER ── */}
        <div style={{ 
          marginTop: "48px", padding: isMobile ? "32px 20px" : "48px 48px", 
          background: C.navy, color: "#fff", borderRadius: "24px" 
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
            gap: "40px", marginBottom: "32px"
          }}>
            <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>GharKaPaisa</h2>
              <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                India's trusted platform for Credit Cards, Loans, Insurance & Financial Services.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube].map((Icon, i) => (
                  <div key={i} style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: C.teal }}>Products</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => handleBottomNavClick("credit-cards")} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>Credit Cards</span>
                <span onClick={() => handleBottomNavClick("loans")} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>Loans</span>
                <span onClick={() => handleBottomNavClick("insurance")} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>Insurance</span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: C.teal }}>Company</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span onClick={() => onNavigate && onNavigate("contact")} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>About Us</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "default" }}>Careers</span>
                <span onClick={() => onNavigate && onNavigate("contact")} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>Contact Us</span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: C.teal }}>Support</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "default" }}>Privacy Policy</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "default" }}>Terms & Conditions</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", cursor: "default" }}>Refund Policy</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            <span>© 2026 GharKaPaisa. All rights reserved.</span>
            <span>Made with ♥ in India</span>
          </div>
        </div>

      </div>
      
      {/* Show Bottom Nav only on Mobile */}
      {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab="home" />}
    </div>
  );
}
