import React, { useState, useEffect } from "react";
import { useTheme } from "./Partner/ThemeContext";
import { FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaChevronLeft, FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar, FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaArrowLeft, FaHome, FaChartLine, FaFileInvoiceDollar, FaCalculator, FaUsers, FaMoneyCheckAlt, FaHandshake, FaBook, FaCertificate, FaIdCard, FaHandsHelping, FaIndustry } from "react-icons/fa";
import offerBannerImg from "../offerbanner.png";
import offerBannerImg1 from "../offerbanner1.png";
import offerBannerImg2 from "../offerbanner2.png";

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
function CategoryPage({ category, onBack, C, onItemClick }) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (category.type === "hierarchy") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", cursor: "pointer" }} onClick={onBack}>
            <FaArrowLeft style={{ fontSize: "20px", color: C.text }} />
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: C.text }}>{category.title}</h2>
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", cursor: "pointer" }} onClick={onBack}>
            <FaArrowLeft style={{ fontSize: "20px", color: C.text }} />
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: C.text }}>{category.title}</h2>
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", cursor: "pointer" }} onClick={onBack}>
          <FaArrowLeft style={{ fontSize: "20px", color: C.text }} />
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: C.text }}>{category.title}</h2>
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
    title: "CIBIL Score Based Loan",
    label: "CIBIL Score Based Loan",
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
    title: "HDFC Loan on Credit Card",
    label: "HDFC Loan on Credit Card",
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
    title: "Smart EMI Card",
    label: "Smart EMI Card",
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
    title: "Secured Credit Cards",
    label: "Secured Credit Cards",
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
    title: "UPI Credit Cards",
    label: "UPI Credit Cards",
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

const bankCardsDetails = {
  hdfc: {
    title: "HDFC Bank Credit Cards",
    type: "bank-detail",
    sections: [
      {
        title: "Core Cards",
        cards: [
          { name: "Freedom Credit Card", desc: "Perfect entry-level card for daily spends" },
          { name: "MoneyBack+ Credit Card", desc: "10X CashPoints on popular online merchants" },
          { name: "Millennia Credit Card", desc: "5% cashback on top online shopping brands" },
          { name: "Regalia Gold Credit Card", desc: "Premium travel and luxury lifestyle card" },
          { name: "BizGrow Credit Card", desc: "Tailored for growing business expenses" },
          { name: "BizPower Credit Card", desc: "Powering business spends with premium rewards" },
          { name: "BizFirst Credit Card", desc: "Smart cashbacks on business utilities and supplies" }
        ]
      },
      {
        title: "Co-Branded Cards",
        cards: [
          { name: "Pixel Play Credit Card", desc: "Customizable benefits in a digital-first avatar" },
          { name: "Pixel Go Credit Card", desc: "Smart lifestyle benefits on the go" },
          { name: "Tata Neu Plus Credit Card", desc: "2% NeuCoins back on Neu spend and partners" },
          { name: "Tata Neu Infinity Credit Card", desc: "5% NeuCoins back on Neu spend and partners" },
          { name: "Swiggy HDFC Bank Credit Card", desc: "10% cashback on Swiggy spends" },
          { name: "IndianOil HDFC Bank Credit Card", desc: "Earn up to 50 Liters of free fuel annually" },
          { name: "IRCTC HDFC Bank Credit Card", desc: "Save on railway tickets booking via IRCTC" },
          { name: "Diners Club Privilege Credit Card", desc: "Exclusive global lounge access and dining benefits" },
          { name: "Diners Club Black Credit Card", desc: "Super premium card for global travelers" },
          { name: "Marriott Bonvoy HDFC Bank Credit Card", desc: "Complimentary hotel nights and loyalty points" },
          { name: "Shoppers Stop Black HDFC Bank Credit Card", desc: "Elite membership and premium rewards at Shoppers Stop" },
          { name: "Shoppers Stop Credit Card", desc: "Accelerated reward points on fashion shopping" }
        ]
      },
      {
        title: "Secured Cards",
        cards: [
          { name: "Against Existing FD", desc: "Get credit limit mapped directly against your existing FD" },
          { name: "New FD Based Credit Card", desc: "Open a new FD instantly to unlock HDFC credit power" }
        ]
      }
    ]
  },
  sbi: {
    title: "SBI Credit Cards",
    type: "bank-detail",
    sections: [
      {
        title: "Core Cards",
        cards: [
          { name: "SimplySAVE Credit Card", desc: "10X points on dining, movies, grocery and department stores" },
          { name: "SimplyCLICK Credit Card", desc: "10X points on Amazon, BookMyShow, Cleartrip, Lenskart" },
          { name: "BPCL SBI Card OCTANE", desc: "7.25% value back on BPCL fuel purchases" },
          { name: "BPCL SBI Card", desc: "4.25% value back on fuel spends" },
          { name: "SBI Card PULSE", desc: "Stay fit with complimentary Noise smartwatch & health benefits" },
          { name: "Tata Neu SBI Card", desc: "Co-branded shopping rewards on the Neu app" }
        ]
      },
      {
        title: "Co-Branded Cards",
        cards: [
          { name: "IRCTC SBI Card Premier", desc: "Up to 10% value back on AC ticket bookings" },
          { name: "Apollo SBI Card", desc: "Accelerated points on Apollo pharmacy & healthcare" },
          { name: "Air India SBI Signature Card", desc: "Earn Air India flying returns miles on every spend" },
          { name: "Air India SBI Platinum Card", desc: "Save on domestic and international air travel" },
          { name: "Club Vistara SBI Prime Card", desc: "Complimentary premium economy tickets on Vistara" },
          { name: "Club Vistara SBI Card", desc: "Complimentary tickets and Club Vistara membership" }
        ]
      }
    ]
  },
  axis: {
    title: "Axis Bank Credit Cards",
    type: "bank-detail",
    sections: [
      {
        title: "Available Credit Cards",
        cards: [
          { name: "Axis Bank Neo Credit Card", desc: "Zomato, BookMyShow and utility bill discounts" },
          { name: "Axis Bank ACE Credit Card", desc: "2% unlimited cashback on Google Pay spends" },
          { name: "Axis Bank MY Zone Credit Card", desc: "Buy 1 Get 1 Free on movie tickets" },
          { name: "Axis Bank Rewards Credit Card", desc: "10X reward points on department stores and apparel" },
          { name: "Axis Bank Flipkart Credit Card", desc: "5% unlimited cashback on Flipkart purchases" },
          { name: "Axis Bank IndianOil Credit Card", desc: "Accelerated reward points on fuel purchases" },
          { name: "Axis Bank Atlas Credit Card", desc: "Miles-focused premium card for frequent flyers" },
          { name: "Axis Bank Select Credit Card", desc: "Elite lifestyle rewards with priority pass lounge access" },
          { name: "Axis Bank Privilege Credit Card", desc: "Double activation benefits and milestone rewards" },
          { name: "Axis Bank Vistara Credit Card", desc: "Complimentary economy flight tickets" },
          { name: "Axis Bank Vistara Infinite Credit Card", desc: "Complimentary business class ticket and gold membership" },
          { name: "Axis Bank Aura Credit Card", desc: "Health and wellness focused credit card" }
        ]
      }
    ]
  },
  bob: {
    title: "Bank of Baroda Credit Cards",
    type: "bank-detail",
    sections: [
      {
        title: "Available Credit Cards",
        cards: [
          { name: "BOB Eterna Credit Card", desc: "Premium travel and dining rewards with lounge access" },
          { name: "BOB Premier Credit Card", desc: "5X rewards on travel and dining" },
          { name: "BOB Easy Credit Card", desc: "5X rewards on grocery and department stores" },
          { name: "BOB Select Credit Card", desc: "Accelerated points on dining and online shopping" },
          { name: "BOB HPCL Energy Card", desc: "Save on fuel and LPG cylinder bookings" },
          { name: "BOB Prime Credit Card", desc: "FD-backed credit card with zero joining fee" },
          { name: "BOB Snapdeal Credit Card", desc: "Up to 5% cashback on Snapdeal shopping" }
        ]
      }
    ]
  }
};

export default function Home({ onNavigate }) {
  const { C } = useTheme();
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  
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

  const loans = [
    { label: "Personal Loan", icon: <FaMoneyBillWave /> },
    { label: "Instant Loan", icon: <FaMobileAlt /> },
    { label: "Home Loan", icon: <FaBuilding /> },
    { label: "Business Loan", icon: <FaBuilding /> },
    { label: "Used Car Loan", icon: <FaCar /> },
    { label: "Education Loan", icon: <FaGraduationCap /> },
    { label: "Card on Loan", icon: <FaRegCreditCard /> },
  ];

  const insurance = [
    { label: "Health", icon: <FaHeartbeat /> },
    { label: "Life", icon: <FaShieldAlt /> },
    { label: "General", icon: <FaUmbrella /> },
    { label: "LAP", icon: <FaBuilding /> },
  ];

  const investment = []; // Placeholder

  const services = [
    { label: "GST Returns & Reg", icon: <FaFileInvoiceDollar /> },
    { label: "Company Incorporation", icon: <FaBuilding /> },
    { label: "Income Tax (ITR)", icon: <FaCalculator /> },
    { label: "PF/ESIC Services", icon: <FaUsers /> },
    { label: "TDS & Assessment", icon: <FaMoneyCheckAlt /> },
    { label: "Partnership Reg", icon: <FaHandshake /> },
    { label: "Accounting", icon: <FaBook /> },
    { label: "Company Reg", icon: <FaBuilding /> },
    { label: "DSC / CMA Report", icon: <FaCertificate /> },
    { label: "Trade Licence", icon: <FaIdCard /> },
    { label: "NGO/Trust Reg", icon: <FaHandsHelping /> },
    { label: "MSME Returns", icon: <FaIndustry /> },
  ];

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

  const handleBottomNavClick = (id) => {
    if (id === "home") setActiveCategory(null);
    else if (id === "credit-cards") setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList });
    else if (id === "loans") setActiveCategory({ id: "loans", title: "Loans", items: loans });
    else if (id === "insurance") setActiveCategory({ id: "insurance", title: "Insurance", items: insurance });
    else if (id === "investment") setActiveCategory({ id: "investment", title: "Investment", items: investment });
    else if (id === "services") setActiveCategory({ id: "services", title: "Services", items: services });
  };

  const handleItemClick = (item) => {
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
        <CategoryPage category={activeCategory} onBack={handleBack} onItemClick={handleItemClick} C={C} />
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(240px, 1fr))", gap: isMobile ? "8px" : "16px", marginTop: "12px" }}>
            {attractiveCategories.map((cat, idx) => (
              <div key={idx} style={{
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
                overflow: "hidden"
              }}
              onClick={() => handleAttractiveCategoryClick(cat)}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = C.teal;
                  e.currentTarget.style.boxShadow = `0 8px 20px ${C.teal}15`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: C.teal, fontSize: isMobile ? "18px" : "24px", display: "flex" }}>{cat.icon}</div>
                  <h3 style={{ margin: 0, fontSize: isMobile ? "12px" : "15px", fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{cat.label}</h3>
                </div>
                <p style={{ margin: 0, fontSize: isMobile ? "10px" : "12px", color: C.textLight, lineHeight: 1.4 }}>{cat.description}</p>
                <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: "4px", fontSize: isMobile ? "10px" : "12px", fontWeight: 700, color: C.teal, marginTop: "auto" }}>
                  Explore <FaChevronRight size={isMobile ? 8 : 10} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Credit Cards / Banks */}
        <Section title="Credit Cards" C={C}>
          <ResponsiveGrid C={C} items={banksList} onSeeMore={() => setActiveCategory({ id: "credit-cards", title: "Credit Cards", items: banksList })} onItemClick={handleItemClick} />
        </Section>

        {/* Loans */}
        <Section title="Loans" C={C}>
          <ResponsiveGrid C={C} items={loans} onSeeMore={() => setActiveCategory({ id: "loans", title: "Loans", items: loans })} />
        </Section>

        {/* Insurance */}
        <Section title="Insurance" C={C}>
          <ResponsiveGrid C={C} items={insurance} onSeeMore={() => setActiveCategory({ id: "insurance", title: "Insurance", items: insurance })} />
        </Section>

        {/* Services */}
        <Section title="Services" C={C}>
          <ResponsiveGrid C={C} items={services} onSeeMore={() => setActiveCategory({ id: "services", title: "Services", items: services })} />
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
