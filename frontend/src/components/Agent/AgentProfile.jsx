import React from "react";
import { Icons } from "./AgentIcons";
import { C, S } from "./AgentTheme";

export default function AgentProfile({ agent, onLogout }) {
  return (
    <div>
      {/* Visual top card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navyMid}, ${C.navy})`,
        borderRadius: "20px",
        padding: "30px 20px",
        textAlign: "center",
        color: "#fff",
        marginBottom: "24px"
      }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          fontSize: "24px",
          fontWeight: 900,
          color: "#fff",
          boxShadow: `0 8px 24px rgba(0,180,216,0.3)`
        }}>RK</div>
        <div style={{ fontSize: "18px", fontWeight: 800 }}>{agent.name}</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>Agent ID: {agent.id} · Mumbai Hub</div>
        <div style={{ marginTop: "12px" }}>
          <span style={S.tag(C.teal)}>✓ KYC Approved</span>
        </div>
      </div>

      {/* Info grids */}
      {[
        {
          title: "Personal Information",
          items: [
            ["Full Legal Name", "Rajesh Kumar"],
            ["Registered Mobile", "+91 98765 43210"],
            ["Email Address", "rajesh.kumar@financials.com"],
            ["HQ City / Region", "Mumbai, Maharashtra"]
          ]
        },
        {
          title: "Business Details",
          items: [
            ["Registered Shop Name", "Rajesh Financial Advisory Services"],
            ["GSTIN Registry", "27AAPFU0939F1ZV"],
            ["Organization Entity", "Sole Proprietor"],
            ["Shop/Office Address", "Office #12, 3rd Floor, Bandra East, Mumbai - 400051"]
          ]
        },
        {
          title: "Settlement Bank Account",
          items: [
            ["Recipient Bank Name", "HDFC Bank Ltd"],
            ["Account Number", "•••• •••• ••52 132"],
            ["RTGS / IFSC Code", "HDFC0001234"],
            ["Beneficiary Name", "Rajesh Kumar"]
          ]
        }
      ].map(sec => (
        <div key={sec.title} style={{ ...S.card, marginBottom: "16px" }}>
          <div style={{ 
            fontSize: "14px", 
            fontWeight: 800, 
            color: C.text, 
            marginBottom: "12px", 
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: "10px"
          }}>{sec.title}</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sec.items.map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: C.textLight, fontWeight: 600 }}>{lbl}</span>
                <span style={{ fontSize: "13px", color: C.text, fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Log out */}
      <button 
        onClick={onLogout}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: "12px",
          border: `1.5px solid ${C.red}`,
          color: C.red,
          fontWeight: 700,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "14px",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.red + "10"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <Icons.logout size={16} /> Sign Out of Terminal
      </button>

    </div>
  );
}
