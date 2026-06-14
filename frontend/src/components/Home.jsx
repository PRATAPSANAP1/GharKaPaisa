import React, { useState } from "react";
import { Icons } from "./Partner/PartnerIcons";
import { useTheme, makeS } from "./Partner/ThemeContext";

function BrandItem({ text, C }) {
  return (
    <span style={{
      background: C.bgSecondary,
      padding: "8px 18px",
      borderRadius: "40px",
      fontSize: "13px",
      fontWeight: 600,
      color: C.text,
      border: `1px solid ${C.border}`,
      display: "inline-block",
      transition: "all 0.15s",
      cursor: "default"
    }}>
      {text}
    </span>
  );
}

function SectionCard({ icon, title, subtitle, C, children, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: hov ? `0 12px 24px rgba(0,0,0,0.05)` : `0 4px 12px rgba(0,0,0,0.02)`,
        border: `1px solid ${hov ? C.teal : C.border}`,
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px", 
            background: `${C.teal}15`, color: C.teal,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}>{title}</h3>
              {badge && <span style={{ background: `${C.gold}20`, color: C.gold, fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700 }}>{badge}</span>}
            </div>
            <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0", fontWeight: 500 }}>{subtitle}</p>
          </div>
        </div>
        <button style={{ 
          background: "transparent", border: "none", color: C.teal, 
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "4px",
          padding: 0
        }}>
          See more <Icons.arrowRight size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  const { C } = useTheme();
  
  // Use a simple state hook to track window width if needed, but flex wrap handles responsiveness naturally.
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "20px", paddingTop: "24px" }}>
      
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "28px", gap: "16px", padding: "0 16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>Explore Offers</h1>
          <p style={{ fontSize: "14px", color: C.textLight, marginTop: "4px", fontWeight: 500 }}>Your complete financial portfolio</p>
        </div>
      </div>

      {/* Bank Strip */}
      <div style={{
        background: C.card,
        borderRadius: "28px",
        padding: "16px 24px",
        marginBottom: "32px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        border: `1px solid ${C.border}`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.02)`,
        margin: "0 16px 32px 16px"
      }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {["PNB", "Union", "Canara", "Tata"].map(b => (
            <span key={b} style={{ 
              fontSize: "16px", fontWeight: 700, color: C.textMid, 
              background: C.bgSecondary, padding: "6px 18px", borderRadius: "30px",
              letterSpacing: "-0.2px"
            }}>{b}</span>
          ))}
        </div>
        <div style={{ 
          background: `${C.teal}15`, color: C.teal, padding: "8px 16px", 
          borderRadius: "30px", fontSize: "13px", fontWeight: 700, 
          display: "flex", alignItems: "center", gap: "8px" 
        }}>
          <Icons.investment size={16} /> Partner Banks
        </div>
      </div>

      {/* Two Columns Layout */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", padding: "0 16px" }}>
        
        {/* Left Column */}
        <div style={{ flex: "1.3", minWidth: "300px" }}>
          
          <SectionCard icon={<Icons.insurance size={20} />} title="Insurance" subtitle="Protect what matters most" C={C}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
              {["Health", "Life Insurance", "General"].map(t => (
                <span key={t} style={{ background: `${C.teal}10`, color: C.teal, padding: "8px 22px", borderRadius: "30px", fontSize: "14px", fontWeight: 600 }}>{t}</span>
              ))}
            </div>

            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "14px" }}>Health Insurance <span style={{ fontSize: "13px", color: C.textLight, fontWeight: 500, marginLeft: "6px" }}>All major providers</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "28px" }}>
              <BrandItem text="HDFC" C={C} />
              <BrandItem text="SBI" C={C} />
              <BrandItem text="ICICI" C={C} />
              <BrandItem text="Axis" C={C} />
              <BrandItem text="Kotak" C={C} />
              <BrandItem text="Star Health" C={C} />
              <BrandItem text="Care" C={C} />
            </div>

            <div style={{ width: "100%", height: "1px", background: C.border, margin: "24px 0" }} />

            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "14px" }}>General Insurance <span style={{ fontSize: "13px", color: C.textLight, fontWeight: 500, marginLeft: "6px" }}>Car, Bike & more</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: C.bgSecondary, padding: "10px 22px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <Icons.dashboard size={18} color={C.textMid} /> <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Car Insurance</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: C.bgSecondary, padding: "10px 22px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <Icons.dashboard size={18} color={C.textMid} /> <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Bike Insurance</span>
              </div>
            </div>
          </SectionCard>

        </div>

        {/* Right Column */}
        <div style={{ flex: "1", minWidth: "300px" }}>
          
          <SectionCard icon={<Icons.creditCard size={20} />} title="Credit Cards" subtitle="Compare & apply for best cards" C={C}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              {["HDFC", "SBI", "Axis", "ICICI", "Kotak", "Yes", "IndusInd", "Canara"].map(b => (
                <BrandItem key={b} text={b} C={C} />
              ))}
            </div>
          </SectionCard>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "24px" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <SectionCard icon={<Icons.star size={20} />} title="Co-browsing Cards" subtitle="Tata Neu solutions" C={C}>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    <BrandItem text="Tata Neu HDFC" C={C} />
                    <BrandItem text="Tata Neu SBI" C={C} />
                 </div>
              </SectionCard>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <SectionCard icon={<Icons.wallet size={20} />} title="FD Based Cards" subtitle="Fixed deposit backed" C={C}>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    <BrandItem text="HDFC" C={C} />
                    <BrandItem text="IDFC" C={C} />
                    <BrandItem text="Tata" C={C} />
                 </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard icon={<Icons.loan size={20} />} title="Loans" subtitle="Get instant loans at best rates" C={C}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.bgSecondary, padding: "10px 18px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>📄 Personal Loan</span>
                <span style={{ background: `${C.green}20`, color: C.green, fontSize: "11px", padding: "3px 8px", borderRadius: "12px", fontWeight: 700 }}>NEW</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.bgSecondary, padding: "10px 18px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>🏠 Home Loan</span>
                <span style={{ background: `${C.green}20`, color: C.green, fontSize: "11px", padding: "3px 8px", borderRadius: "12px", fontWeight: 700 }}>NEW</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.bgSecondary, padding: "10px 18px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Car Loan</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.bgSecondary, padding: "10px 18px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>Education Loan</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {["SBI", "HDFC", "ICICI", "Axis Bank"].map(b => (
                <BrandItem key={b} text={b} C={C} />
              ))}
            </div>
          </SectionCard>

        </div>

      </div>

    </div>
  );
}
