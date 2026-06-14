import React, { useState, useEffect } from "react";
import { useTheme } from "./Partner/ThemeContext";
import { FaMobileAlt, FaBolt, FaMoneyBillWave, FaChevronRight, FaRegCreditCard, FaLaptopHouse, FaUniversity, FaBuilding, FaCar, FaGraduationCap, FaHeartbeat, FaShieldAlt, FaUmbrella, FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

// Responsive grid component
function ResponsiveGrid({ items, C }) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showSeeMore = isMobile && !expanded && items.length > 4;
  const visibleItems = showSeeMore ? items.slice(0, 3) : items;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginTop: "16px" }}>
      {visibleItems.map((item, idx) => (
        <div key={idx} style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: C.bgSecondary, padding: "16px 12px", borderRadius: "16px",
          border: `1px solid ${C.border}`, textAlign: "center", gap: "12px",
          cursor: "pointer", transition: "all 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
        >
          {item.icon && <div style={{ color: C.teal, fontSize: "26px" }}>{item.icon}</div>}
          <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{item.label}</div>
        </div>
      ))}
      {showSeeMore && (
        <div 
          onClick={() => setExpanded(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: `${C.teal}10`, padding: "16px 12px", borderRadius: "16px",
            border: `1px dashed ${C.teal}`, textAlign: "center", gap: "12px",
            cursor: "pointer", color: C.teal
          }}
        >
          <div style={{ fontSize: "26px" }}><FaChevronRight /></div>
          <div style={{ fontSize: "14px", fontWeight: 800 }}>See More</div>
        </div>
      )}
    </div>
  );
}

// Section wrapper
function Section({ title, C, children }) {
  return (
    <div style={{ background: C.card, padding: "28px 24px", borderRadius: "24px", border: `1px solid ${C.border}`, boxShadow: `0 4px 16px rgba(0,0,0,0.02)`, marginBottom: "24px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>{title}</h2>
      {children}
    </div>
  );
}

export default function Home({ onNavigate }) {
  const { C } = useTheme();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
        
        {/* Offer Banner */}
        <div style={{ width: "100%", height: "220px", borderRadius: "28px", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", boxShadow: `0 8px 24px ${C.primary}30` }}>
          <img src="/offerbanner.png" alt="Offer Banner" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} onError={(e) => e.target.style.display = 'none'} />
          <div style={{ position: "absolute", textAlign: "center", color: "#fff", padding: "20px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: 900, margin: "0 0 8px 0", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>Exclusive Offers</h1>
            <p style={{ fontSize: "18px", fontWeight: 600, margin: 0, opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>Get the best deals on your financial needs</p>
          </div>
        </div>

        {/* Money Transfer */}
        <Section title="Money Transfer & Payments" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginTop: "20px" }}>
            {[
              { label: "To Mobile Number", icon: <FaMobileAlt /> },
              { label: "Mobile Recharge", icon: <FaMobileAlt /> },
              { label: "Electricity Bill", icon: <FaBolt /> },
              { label: "Loan Repayment", icon: <FaMoneyBillWave /> },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", background: C.bgSecondary, padding: "24px 12px", borderRadius: "20px", cursor: "pointer", border: `1px solid ${C.border}`, transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: `${C.primary}15`, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, textAlign: "center" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Credit Cards */}
        <Section title="Credit Cards" C={C}>
          <ResponsiveGrid C={C} items={[
            { label: "HDFC Bank", icon: <FaRegCreditCard /> },
            { label: "SBI Card", icon: <FaRegCreditCard /> },
            { label: "Axis Bank", icon: <FaRegCreditCard /> },
            { label: "ICICI Bank", icon: <FaRegCreditCard /> },
            { label: "Kotak Bank", icon: <FaRegCreditCard /> },
            { label: "Yes Bank", icon: <FaRegCreditCard /> },
            { label: "IndusInd", icon: <FaRegCreditCard /> },
          ]} />
        </Section>

        {/* Co-browsing Cards */}
        <Section title="Co-Browsing Cards" C={C}>
          <ResponsiveGrid C={C} items={[
            { label: "Tata Neu HDFC", icon: <FaLaptopHouse /> },
            { label: "Tata Neu SBI", icon: <FaLaptopHouse /> },
          ]} />
        </Section>

        {/* FD Based Cards */}
        <Section title="FD Based Cards" C={C}>
          <ResponsiveGrid C={C} items={[
            { label: "HDFC FD Card", icon: <FaUniversity /> },
            { label: "IDFC First", icon: <FaUniversity /> },
            { label: "Tata FD Card", icon: <FaUniversity /> },
          ]} />
        </Section>

        {/* Loans */}
        <Section title="Loans" C={C}>
          <ResponsiveGrid C={C} items={[
            { label: "Personal Loan (All Banks)", icon: <FaMoneyBillWave /> },
            { label: "Instant Loan (App Loan)", icon: <FaMobileAlt /> },
            { label: "Home Loan", icon: <FaBuilding /> },
            { label: "Business Loan", icon: <FaBuilding /> },
            { label: "Used Car Loan", icon: <FaCar /> },
            { label: "Education Loan", icon: <FaGraduationCap /> },
            { label: "Card on Loan", icon: <FaRegCreditCard /> },
          ]} />
        </Section>

        {/* Insurance */}
        <Section title="Insurance" C={C}>
          <ResponsiveGrid C={C} items={[
            { label: "Health (All Banks)", icon: <FaHeartbeat /> },
            { label: "Life Insurance", icon: <FaShieldAlt /> },
            { label: "General Insurance (Car, Bike)", icon: <FaUmbrella /> },
          ]} />
        </Section>

        {/* Footer */}
        <div style={{ marginTop: "48px", padding: "48px 32px", background: C.navy, color: "#fff", borderRadius: "32px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "40px" }}>
          <div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>GharKaPaisa</h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>Owned by: Pratap Sanap<br/>Your complete financial portfolio.</p>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaFacebook size={18} /></div>
              <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaTwitter size={18} /></div>
              <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><FaInstagram size={18} /></div>
            </div>
          </div>
          <div style={{ minWidth: "250px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 800 }}>Contact Details</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", fontSize: "15px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              <FaEnvelope size={16} /> support@gharkapaisa.in
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", fontSize: "15px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              <FaPhoneAlt size={16} /> +91 98765 43210
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
    </div>
  );
}
