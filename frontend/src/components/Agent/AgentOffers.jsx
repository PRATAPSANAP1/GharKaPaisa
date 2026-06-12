import React, { useState } from "react";
import { Icons } from "./AgentIcons";
import { C, S } from "./AgentTheme";

const BANKS_CREDIT = [
  { name: "HDFC NTB", commission: "₹1,500", color: "#1C3A6E", badge: "NTB" },
  { name: "HDFC ETB", commission: "₹1,200", color: "#003580", badge: "ETB" },
  { name: "HDFC Pre Approved", commission: "₹1,000", color: "#0B2545", badge: "Instant" },
  { name: "Axis", commission: "₹1,400", color: "#800020", badge: "Hot" },
  { name: "SBI", commission: "₹1,100", color: "#2D6A4F" },
  { name: "ICICI", commission: "₹1,300", color: "#FF6B00" },
  { name: "Kotak", commission: "₹1,200", color: "#ED1C24" },
  { name: "BOB", commission: "₹950", color: "#F05A28" },
  { name: "AU", commission: "₹1,000", color: "#F7941D" },
  { name: "IDFC", commission: "₹1,150", color: "#5B2D8E" },
  { name: "RBL", commission: "₹900", color: "#1B4F8A" },
];

const CO_BRANDED = [
  { name: "Tata Neu HDFC", commission: "₹1,650", color: "#003580", badge: "Premium" },
  { name: "Tata Neu SBI", commission: "₹1,400", color: "#2D6A4F" },
  { name: "Scapia Federal", commission: "₹1,250", color: "#0E6DB8", badge: "Zero Fee" },
  { name: "Scapia BOB", commission: "₹1,150", color: "#F05A28" },
  { name: "YES Novio", commission: "₹1,100", color: "#00539C" },
  { name: "YES Pop", commission: "₹1,000", color: "#002F6C" },
  { name: "YES Zag", commission: "₹950", color: "#0E6DB8" },
];

const LOANS = [
  { type: "Personal Loan", banks: ["HDFC", "ICICI", "SBI", "Axis", "Kotak", "IDFC"], icon: "loan", color: C.teal },
  { type: "Instant Loan", banks: ["KreditBee", "MoneyView", "Navi", "PaySense"], icon: "trending", color: C.gold },
  { type: "Home Loan", banks: ["HDFC", "SBI", "ICICI", "Axis"], icon: "dashboard", color: "#667EEA" },
  { type: "Business Loan", banks: ["HDFC", "ICICI", "Kotak", "Axis"], icon: "investment", color: "#FC5C7D" },
  { type: "Used Car Loan", banks: ["HDFC", "SBI", "Axis", "BOB"], icon: "gift", color: "#48BB78" },
  { type: "Education Loan", banks: ["SBI", "BOB", "HDFC", "Axis"], icon: "profile", color: "#9B5DE5" },
];

const INSURANCE = [
  { type: "Health Insurance", providers: ["Star Health", "HDFC Ergo", "ICICI Lombard"], color: "#48BB78" },
  { type: "Life Insurance", providers: ["LIC", "HDFC Life", "ICICI Prudential"], color: "#667EEA" },
  { type: "General Insurance", providers: ["Car Insurance", "Bike Insurance", "Travel Insurance"], color: "#F5A623" },
];

function ProductCard({ name, commission, color, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: `1.5px solid ${hov ? C.teal : C.border}`,
        borderRadius: "14px", 
        padding: "18px", 
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: hov ? `0 10px 25px ${C.teal}15` : "0 2px 6px rgba(10,17,40,0.03)",
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{
          width: "40px", 
          height: "40px", 
          borderRadius: "10px",
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "#fff", 
          fontWeight: 800, 
          fontSize: "13px"
        }}>{name.slice(0, 2).toUpperCase()}</div>
        {badge && <span style={S.tag(C.gold)}>{badge}</span>}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>{name}</div>
      <div style={{ fontSize: "12px", color: C.textLight, marginBottom: "14px" }}>
        Commission: <span style={{ color: C.green, fontWeight: 700 }}>{commission}</span>
      </div>
      
      <div style={{ fontSize: "11px", color: C.textLight, background: C.bg, padding: "6px 10px", borderRadius: "8px", marginBottom: "14px" }}>
        📄 Min Salary: ₹25k · Age: 21-60
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button style={{ ...S.btn("sm"), flex: 1, justifyContent: "center", padding: "8px 0" }}>Apply Now</button>
        <button style={{ 
          ...S.btn("sm"), 
          background: "transparent", 
          color: C.textLight, 
          border: `1.5px solid ${C.border}`, 
          padding: "8px 10px" 
        }}>
          <Icons.eye size={16} />
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: "13px", color: C.textLight, marginTop: "4px" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AgentOffers() {
  const [activeTab, setActiveTab] = useState("credit");
  
  const tabs = [
    { id: "credit", label: "Credit Cards", icon: <Icons.creditCard size={16} /> },
    { id: "loans", label: "Loans", icon: <Icons.loan size={16} /> },
    { id: "insurance", label: "Insurance", icon: <Icons.insurance size={16} /> },
    { id: "investment", label: "Investment", icon: <Icons.investment size={16} /> },
  ];

  return (
    <div>
      {/* Campaign offer slider banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #004B6E 100%)`,
        borderRadius: "20px", 
        padding: "24px", 
        marginBottom: "24px", 
        position: "relative", 
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        color: "#fff"
      }}>
        <div style={{ position: "absolute", bottom: "-40px", right: "-30px", width: "160px", height: "160px", borderRadius: "50%", background: `radial-gradient(circle, ${C.teal}25, transparent 75%)` }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={S.tag(C.gold)}>🔥 Mega Agent Incentive</span>
          <div style={{ fontSize: "22px", fontWeight: 900, margin: "10px 0 6px", lineHeight: 1.2 }}>
            Refer Tata Neu HDFC Cards & get <span style={{ color: C.gold }}>₹1,650</span> flat payout!
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>
            Applies to all cards issued until July 1st.
          </div>
          <button style={{ ...S.btn("sm"), background: C.gold, color: C.navy, border: "none" }}>Apply Now</button>
        </div>
      </div>

      {/* Tabs list */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        overflowX: "auto", 
        paddingBottom: "8px", 
        marginBottom: "20px",
        msOverflowStyle: "none",
        scrollbarWidth: "none"
      }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            style={{
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "10px 18px",
              borderRadius: "20px", 
              border: "none", 
              cursor: "pointer", 
              fontWeight: 700, 
              fontSize: "13px",
              whiteSpace: "nowrap", 
              transition: "all 0.2s",
              background: activeTab === t.id ? C.navy : "#fff",
              color: activeTab === t.id ? "#fff" : C.textMid,
              boxShadow: activeTab === t.id ? `0 4px 12px rgba(10,17,40,0.15)` : "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Render Products */}
      {activeTab === "credit" && (
        <>
          <SectionTitle title="Premium Credit Cards" sub="Instant digital approval pathways" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "28px" }}>
            {BANKS_CREDIT.map(card => (
              <ProductCard key={card.name} {...card} />
            ))}
          </div>

          <SectionTitle title="Co-Branded Cards & Partners" sub="Highly requested shopper cards" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
            {CO_BRANDED.map(card => (
              <ProductCard key={card.name} {...card} />
            ))}
          </div>
        </>
      )}

      {activeTab === "loans" && (
        <>
          <SectionTitle title="Instant Loans & Borrowing" sub="Quick verification with minimal documentation" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {LOANS.map(loan => (
              <div key={loan.type} style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <div style={{
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "10px",
                    background: `${loan.color}15`, 
                    color: loan.color,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center"
                  }}>
                    {Icons[loan.icon] ? Icons[loan.icon]({ size: 20 }) : <Icons.loan size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{loan.type}</div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>Earn up to <b style={{ color: C.green }}>2.5% Commission</b></div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {loan.banks.map(b => (
                    <span key={b} style={{ background: C.bg, color: C.textMid, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: 600 }}>{b}</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ ...S.btn("sm"), flex: 1 }}>Submit Lead</button>
                  <button style={{ ...S.btn("sm"), background: "transparent", color: C.textLight, border: `1.5px solid ${C.border}`, padding: "8px 10px" }}>
                    <Icons.star size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "insurance" && (
        <>
          <SectionTitle title="Insurance Partnerships" sub="Protect customers & receive payouts" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {INSURANCE.map(ins => (
              <div key={ins.type} style={S.card}>
                <div style={{
                  width: "42px", 
                  height: "42px", 
                  borderRadius: "10px", 
                  background: `${ins.color}15`,
                  color: ins.color, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  marginBottom: "14px"
                }}>
                  <Icons.insurance size={20} />
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: C.text, marginBottom: "4px" }}>{ins.type}</div>
                <div style={{ fontSize: "12px", color: C.textLight, marginBottom: "12px" }}>Partners:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {ins.providers.map(p => (
                    <span key={p} style={S.tag(ins.color)}>{p}</span>
                  ))}
                </div>
                <button style={{ ...S.btn("sm"), width: "100%", justifyContent: "center" }}>Create Application</button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "investment" && (
        <div style={{ ...S.card, textAlign: "center", padding: "48px 20px" }}>
          <div style={{ color: C.tealDim, marginBottom: "12px" }}>
            <Icons.investment size={32} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "6px" }}>Investment Partnerships</div>
          <div style={{ fontSize: "13px", color: C.textLight, maxWidth: "320px", margin: "0 auto" }}>
            Mutual Funds, Fixed Deposits, and SIP commission channels are currently undergoing bank configuration and will launch shortly.
          </div>
        </div>
      )}
    </div>
  );
}
