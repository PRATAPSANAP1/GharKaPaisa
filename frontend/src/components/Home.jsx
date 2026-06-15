import React, { useState, useEffect } from "react";
import { useTheme } from "./Partner/ThemeContext";
import { FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaChevronLeft, FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar, FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt, FaArrowLeft, FaHome, FaChartLine, FaFileInvoiceDollar, FaCalculator } from "react-icons/fa";
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
    { id: "tax", label: "GST & Tax", icon: <FaFileInvoiceDollar /> }
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

  const tax = [
    { label: "GST Filing", icon: <FaFileInvoiceDollar /> },
    { label: "Income Tax", icon: <FaCalculator /> },
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
    else if (id === "tax") setActiveCategory({ id: "tax", title: "GST & Income Tax", items: tax });
  };

  const handleItemClick = (item) => {
    // If it's a bank, show its specific card categories
    if (activeCategory?.id === "credit-cards" || banksList.find(b => b.id === item.id)) {
      setActiveCategory({
        id: `bank-${item.id}`,
        title: item.label,
        parentId: "credit-cards",
        items: [
          { id: `cc-${item.id}`, label: "Credit Card", icon: <FaRegCreditCard /> },
          { id: `cobrand-${item.id}`, label: "Co-Brand", icon: <FaLaptopHouse /> },
          { id: `fd-${item.id}`, label: "FD Based Cards", icon: <FaUniversity /> }
        ]
      });
    }
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

        {/* GST & Income Tax */}
        <Section title="GST & Income Tax" C={C}>
          <ResponsiveGrid C={C} items={tax} onSeeMore={() => setActiveCategory({ id: "tax", title: "GST & Income Tax", items: tax })} />
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
