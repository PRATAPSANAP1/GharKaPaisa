import React, { useState, useEffect } from "react";
import { useTheme } from "../Partner/ThemeContext";
import { FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaChevronLeft, FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar, FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaArrowLeft, FaHome, FaChartLine, FaFileInvoiceDollar, FaCalculator, FaUsers, FaMoneyCheckAlt, FaHandshake, FaBook, FaCertificate, FaIdCard, FaHandsHelping, FaIndustry } from "react-icons/fa";
import offerBannerImg from "../../offerbanner.png";
import offerBannerImg1 from "../../offerbanner1.png";
import offerBannerImg2 from "../../offerbanner2.png";

// Import modular data lists
import { bankCardsDetails, ltfCards, cardRankings } from "./CreditCards";
import { loansData } from "./Loans";
import { insuranceData } from "./Insurance";
import { servicesData } from "./Services";

// Responsive grid component
function ResponsiveGrid({ items, C, onSeeMore, onItemClick }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

// Section wrapper
function Section({ title, C, children }) {
  return (
    <div style={{ background: C.card, padding: "16px 20px", borderRadius: "20px", border: `1px solid ${C.border}`, boxShadow: `0 4px 16px rgba(0,0,0,0.02)`, marginBottom: "16px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>{title}</h2>
      {children}
    </div>
  );
}

// Full Category Page
function CategoryPage({ category, onBack, C, onItemClick, breadcrumbs }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  if (category.id === "credit-cards") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
              <FaArrowLeft size={16} />
            </div>
            {renderBreadcrumbs()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}>Select Partner Bank</h2>
                <button 
                  onClick={() => onItemClick && onItemClick({ id: "ltf-detail-page-trigger" })}
                  style={{
                    background: C.teal,
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: `0 4px 12px ${C.teal}30`,
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = 0.9}
                  onMouseLeave={(e) => e.target.style.opacity = 1}
                >
                  Lifetime Free Credit Cards (LTF)
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                {category.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                    background: C.bgSecondary, padding: "16px 12px", borderRadius: "14px",
                    border: `1px solid ${C.border}`, textAlign: "center", gap: "10px",
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                  onClick={() => onItemClick && onItemClick(item)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                  >
                    {item.icon && <div style={{ color: C.teal, fontSize: "24px" }}>{item.icon}</div>}
                    <div style={{ fontSize: "13px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (category.type === "hierarchy") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
              <FaArrowLeft size={16} />
            </div>
            {renderBreadcrumbs()}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {category.items.map((sec, sIdx) => (
              <div key={sIdx} style={{ background: C.card, padding: "20px", borderRadius: "18px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "16px", fontWeight: 800, color: C.teal }}>{sec.section}</h3>
                
                {sec.subcategories && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sec.subcategories.map((sub, subIdx) => (
                      <div key={subIdx} style={{ display: "flex", alignItems: "center", gap: "12px", background: C.bgSecondary, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}` }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
              <FaArrowLeft size={16} />
            </div>
            {renderBreadcrumbs()}
          </div>
          
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.text }}>
            <FaArrowLeft size={16} />
          </div>
          {renderBreadcrumbs()}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {category.items && category.items.length > 0 ? category.items.map((item, idx) => (
            <div key={idx} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
              background: C.bgSecondary, padding: isMobile ? "12px 8px" : "16px 12px", borderRadius: "14px",
              border: `1px solid ${C.border}`, textAlign: "center", gap: "10px",
              cursor: "pointer", transition: "all 0.2s"
            }}
            onClick={() => onItemClick && onItemClick(item)}>
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

// Mobile Bottom Navigation
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

const attractiveCategories = [
  {
    id: "ltf-cards",
    title: "Lifetime Free Credit Cards (LTF)",
    label: "Lifetime Free Credit Cards (LTF)",
    description: "Enjoy zero annual fees and lifetime free benefits on premium credit cards.",
    icon: <FaRegCreditCard />,
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
    title: "CIBIL Based Loan",
    label: "CIBIL Based Loan",
    description: "Get personalized loan offers tailored specifically to your credit profile.",
    icon: <FaMoneyCheckAlt />,
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
    title: "Loan on credit card",
    label: "Loan on credit card",
    description: "Unlock instant cash or loans against your existing HDFC bank credit card limit.",
    icon: <FaRegCreditCard />,
    type: "hierarchy",
    items: [
      {
        section: "Loan Options",
        subcategories: [
          "Loan on Existing HDFC Credit Card",
          "Pre-approved Loan on Credit Card",
          "Cash on Credit Card"
        ]
      }
    ]
  },
  {
    id: "smart-emi",
    title: "Smart Emi on hdfc credit card",
    label: "Smart Emi on hdfc credit card",
    description: "Split your purchases into easy no-cost EMIs with instant approval.",
    icon: <FaIdCard />,
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
    title: "FD/Secured card(no Cibil required)",
    label: "FD/Secured card(no Cibil required)",
    description: "Build or rebuild your credit score with high-approval FD-backed credit cards.",
    icon: <FaShieldAlt />,
    type: "hierarchy",
    items: [
      {
        section: "Features & Categories",
        subcategories: [
          "FD-backed Credit Cards",
          "Low CIBIL Credit Cards"
        ]
      },
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
    id: "hdfc-express",
    title: "HDFC Express Loan",
    label: "HDFC Express Loan",
    description: "Fast-tracked personal loans with minimal documentation and instant payouts.",
    icon: <FaBolt />,
    type: "hierarchy",
    items: [
      {
        section: "Loan Types",
        subcategories: [
          "Express Personal Loan",
          "Pre-approved Loan",
          "Instant Loan"
        ]
      }
    ]
  },
  {
    id: "upi-cards",
    title: "All Rupey Upi credit card",
    label: "All Rupey Upi credit card",
    description: "Make merchant payments directly via UPI using your RuPay credit card.",
    icon: <FaMobileAlt />,
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

export default function Home({ onNavigate }) {
  const { C } = useTheme();
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isTickerPaused, setIsTickerPaused] = useState(false);

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
  
  const banners = [offerBannerImg, offerBannerImg1, offerBannerImg2];

  // Define data directly to easily pass it to category pages
  const moneyTransfer = [
    { label: "To Mobile", icon: <FaMobileAlt /> },
    { label: "Recharge", icon: <FaMobileAlt /> },
    { label: "Electricity", icon: <FaBolt /> },
    { label: "Loan Repay", icon: <FaMoneyBillWave /> },
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
    { id: "equitas", label: "Equitas", icon: <FaUniversity /> },
  ];

  const investment = []; // Placeholder

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const handleBannerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    } else if (x > (2 * width) / 3) {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }
    
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const handleBottomNavClick = (id) => {
    if (id === "home") setActiveCategory(null);
    else if (id === "credit-cards") setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList });
    else if (id === "loans") setActiveCategory({ id: "loans", title: "Loans", items: loansData });
    else if (id === "insurance") setActiveCategory({ id: "insurance", title: "Insurance", items: insuranceData });
    else if (id === "investment") setActiveCategory({ id: "investment", title: "Investment", items: investment });
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
    // If it's a bank, show its specific card categories
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

  // Main Home Page Render
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: isMobile ? "80px" : "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Offer Banner */}
        <div onClick={handleBannerClick} style={{ cursor: "pointer", width: "100%", height: isMobile ? "140px" : "250px", borderRadius: "28px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", boxShadow: `0 8px 24px ${C.primary}30` }}>
          {banners.map((src, idx) => (
            <img key={idx} src={src} alt={`Offer Banner ${idx + 1}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", opacity: idx === bannerIndex ? 1 : 0, transition: "opacity 0.6s ease-in-out" }} onError={(e) => e.target.style.display = 'none'} />
          ))}

          {/* Left Arrow */}
          <div style={{ position: "absolute", left: "16px", zIndex: 10, background: "rgba(255,255,255,0.7)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <FaChevronLeft size={14} />
          </div>

          {/* Right Arrow */}
          <div style={{ position: "absolute", right: "16px", zIndex: 10, background: "rgba(255,255,255,0.7)", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <FaChevronRight size={14} />
          </div>
          <div style={{ position: "absolute", bottom: "16px", display: "flex", gap: "8px", zIndex: 10 }}>
            {banners.map((_, idx) => (
              <div 
                key={idx} 
                onClick={(e) => { e.stopPropagation(); setBannerIndex(idx); setIsPaused(true); setTimeout(() => setIsPaused(false), 5000); }}
                style={{ 
                  width: idx === bannerIndex ? "24px" : "8px", 
                  height: "8px", 
                  borderRadius: "4px", 
                  background: idx === bannerIndex ? "#fff" : "rgba(255,255,255,0.5)", 
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }} 
              />
            ))}
          </div>
        </div>

        {/* Money Transfer */}
        <Section title="Money Transfer & Payments" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(auto-fit, minmax(130px, 1fr))", gap: isMobile ? "6px" : "12px", marginTop: "12px" }}>
            {moneyTransfer.map((item, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: isMobile ? "6px" : "10px", background: C.bgSecondary, padding: isMobile ? "8px 4px" : "16px 8px", borderRadius: isMobile ? "10px" : "14px", cursor: "pointer", border: `1px solid ${C.border}`, transition: "transform 0.2s" }} onMouseEnter={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(-4px)")} onMouseLeave={(e) => !isMobile && (e.currentTarget.style.transform = "translateY(0)")}>
                <div style={{ width: isMobile ? "32px" : "44px", height: isMobile ? "32px" : "44px", borderRadius: "50%", background: `${C.primary}15`, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "16px" : "20px", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: isMobile ? "10px" : "13px", fontWeight: 700, color: C.text, textAlign: "center", lineHeight: 1.2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Attractive Cards/Loans */}
        <Section title="Attractive Cards/Loans" C={C}>
          <style>{`
            @keyframes ticker-scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .ticker-wrap {
              display: flex;
              gap: 16px;
              width: max-content;
              animation: ticker-scroll 35s linear infinite;
            }
            .ticker-wrap.paused {
              animation-play-state: paused !important;
            }
          `}</style>
          <div 
            onMouseEnter={() => setIsTickerPaused(true)}
            onMouseLeave={() => setIsTickerPaused(false)}
            onTouchStart={() => setIsTickerPaused(true)}
            onTouchEnd={() => setIsTickerPaused(false)}
            style={{
              overflow: "hidden",
              width: "100%",
              padding: "12px 0",
              position: "relative",
              display: "flex",
              maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)"
            }}
          >
            <div 
              className={`ticker-wrap ${isTickerPaused ? "paused" : ""}`}
            >
              {[...attractiveCategories, ...attractiveCategories].map((cat, idx) => (
                <div key={`${cat.id}-${idx}`} style={{
                  background: C.bgSecondary,
                  padding: isMobile ? "12px" : "20px",
                  borderRadius: "16px",
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden",
                  width: isMobile ? "200px" : "280px",
                  flexShrink: 0
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ color: C.teal, fontSize: isMobile ? "18px" : "24px", display: "flex" }}>{cat.icon}</div>
                    <h3 style={{ margin: 0, fontSize: isMobile ? "12px" : "15px", fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{cat.label}</h3>
                  </div>
                  <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: "4px", fontSize: isMobile ? "10px" : "12px", fontWeight: 700, color: C.teal, marginTop: "auto" }}>
                    Explore <FaChevronRight size={isMobile ? 8 : 10} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Credit Cards / Banks */}
        <Section title="Credit Cards" C={C}>
          <ResponsiveGrid C={C} items={banksList} onSeeMore={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })} onItemClick={handleItemClick} />
        </Section>

        {/* Loans */}
        <Section title="Loans" C={C}>
          <ResponsiveGrid C={C} items={loansData} onSeeMore={() => setActiveCategory({ id: "loans", title: "Loans", items: loansData })} />
        </Section>

        {/* Insurance */}
        <Section title="Insurance" C={C}>
          <ResponsiveGrid C={C} items={insuranceData} onSeeMore={() => setActiveCategory({ id: "insurance", title: "Insurance", items: insuranceData })} />
        </Section>

        {/* Services */}
        <Section title="Services" C={C}>
          <ResponsiveGrid C={C} items={servicesData} onSeeMore={() => setActiveCategory({ id: "services", title: "Services", items: servicesData })} />
        </Section>

        {/* Footer */}
        <div style={{ marginTop: "48px", padding: "48px 32px", background: C.navy, color: "#fff", borderRadius: "32px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "40px" }}>
          <div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>GharKaPaisa</h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>Your trusted partner in financial growth.<br />Simplifying loans, insurance, and credit cards.</p>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaFacebook size={18} /></div>
              <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTwitter size={18} /></div>
              <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaInstagram size={18} /></div>
            </div>
          </div>
          <div style={{ minWidth: "250px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 800 }}>Contact Details</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", fontSize: "15px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              <FaEnvelope size={16} /> sharadyohesa@gmail.com
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", fontSize: "15px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              <FaPhoneAlt size={16} /> +91 8087179438
            </div>
            <button
              onClick={() => onNavigate && onNavigate('contact')}
              style={{ background: C.teal, color: "#fff", border: "none", padding: "14px 28px", borderRadius: "14px", fontWeight: 800, fontSize: "15px", cursor: "pointer", display: "inline-block", boxShadow: `0 4px 12px ${C.teal}40`, transition: "all 0.2s" }}
            >
              Contact Us
            </button>
          </div>
        </div>

      </div>
      
      {/* Show Bottom Nav only on Mobile */}
      {isMobile && <MobileBottomNav C={C} onNavigate={handleBottomNavClick} activeTab="home" />}
    </div>
  );
}
