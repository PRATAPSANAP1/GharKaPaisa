import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, FaBolt, FaCalendarAlt, FaCheckCircle, 
  FaShieldAlt, FaPercent, FaHeadset, FaStar, 
  FaMoneyBillWave, FaWallet, FaArrowRight 
} from "react-icons/fa";
import CardApplyVerificationModal from "../CreditCards/CardApplyVerificationModal";

// Import logos from Loans folder
import axisLogo from "./axis.png";
import sbiLogo from "./sbi.png";
import iciciLogo from "./icici.png";
import kotakLogo from "./kotak.png";
import idfcLogo from "./idfc.png";
import hdfcLogo from "./hdfc.png";
import loanBanner from "./Loan_banner.png";

export default function PersonalLoanPage({ onBack, C, isMobile }) {
  const { t } = useTranslation();
  const [verifyCard, setVerifyCard] = useState(null);

  const loanCards = [
    {
      id: "axis",
      bank: "AXIS",
      name: "Axis Personal Loan",
      desc: "Get instant approval and flexible tenure.",
      rate: "10.49%",
      logo: axisLogo
    },
    {
      id: "sbi",
      bank: "SBI",
      name: "SBI Xpress Credit",
      desc: "Get instant approval and flexible tenure.",
      rate: "10.25%",
      logo: sbiLogo
    },
    {
      id: "idfc",
      bank: "IDFC",
      name: "IDFC Personal Loan",
      desc: "Get instant approval and flexible tenure.",
      rate: "10.99%",
      logo: idfcLogo
    },
    {
      id: "hdfc",
      bank: "HDFC",
      name: "HDFC Personal Loan",
      desc: "Get instant approval and flexible tenure.",
      rate: "10.50%",
      logo: hdfcLogo
    },
    {
      id: "icici",
      bank: "ICICI",
      name: "ICICI Personal Loan",
      desc: "Get instant approval and flexible tenure.",
      rate: "10.75%",
      logo: iciciLogo
    },
    {
      id: "kotak",
      bank: "KOTAK",
      name: "Kotak Personal Loan",
      desc: "Get instant approval and flexible tenure.",
      rate: "10.99%",
      logo: kotakLogo
    }
  ];



  const handleApplyClick = (card) => {
    setVerifyCard({
      cardName: card.name,
      bankName: card.bank,
      bankId: card.id
    });
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: "80px", color: C.text }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
        
        {/* Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div onClick={onBack} style={{ cursor: "pointer", color: C.text }}><FaArrowLeft size={16} /></div>
          <div style={{ display: "flex", gap: "8px", fontSize: "14px", color: C.textLight }}>
            <span onClick={onBack} style={{ cursor: "pointer" }}>Home</span>
            <span>/</span>
            <span onClick={onBack} style={{ cursor: "pointer" }}>Loans</span>
            <span>/</span>
            <span style={{ color: "#2563eb", fontWeight: 500 }}>Personal Loan</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div style={{ marginBottom: "32px", borderRadius: "24px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <img src={loanBanner} alt="Personal Loan Banner" style={{ width: "100%", display: "block" }} />
        </div>

        {/* Cards Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "24px", 
          marginBottom: "40px" 
        }}>
          {loanCards.map((card, idx) => (
            <div key={idx} style={{
              background: C.card,
              borderRadius: "20px",
              border: `1px solid ${C.border}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              position: "relative",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)";
              e.currentTarget.style.borderColor = "#3b82f6";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
              e.currentTarget.style.borderColor = C.border;
            }}
            >
              {/* Top Badge */}
              <div style={{ position: "absolute", top: "24px", right: "24px", fontSize: "12px", fontWeight: 700, color: "#64748b", background: C.bgSecondary, padding: "4px 8px", borderRadius: "6px" }}>
                {card.bank}
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                  {card.logo ? (
                    <img src={card.logo} alt={card.bank} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{card.bank}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: C.text }}>{card.name}</h3>
                  <p style={{ margin: 0, fontSize: "12px", color: C.textLight, lineHeight: 1.4 }}>{card.desc}</p>
                </div>
              </div>

              <div style={{ borderTop: `1px dashed ${C.border}`, margin: "8px 0" }}></div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "11px", color: C.textLight, marginBottom: "4px" }}>Starting from</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: C.text }}>{card.rate}<span style={{ fontSize: "12px", fontWeight: 600, color: C.textLight }}>* p.a.</span></div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyClick(card);
                  }}
                  style={{
                    background: "#0f172a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#3b82f6"}
                  onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}
                >
                  Apply Now <FaArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>



      </div>

      {verifyCard && (
        <CardApplyVerificationModal
          card={verifyCard}
          onClose={() => setVerifyCard(null)}
          C={C}
        />
      )}
    </div>
  );
}
