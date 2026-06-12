import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import AgentPanel from './components/AgentPanel';

// Theme colors matching the premium financial design
const Colors = {
  navy: "#0A1128",
  navyMid: "#1C2541",
  teal: "#00B4D8",
  tealDim: "#0077B6",
  gold: "#FFB703",
  bg: "#F4F7FC",
  text: "#0A1128",
  textMid: "#4A5568",
  textLight: "#8D99AE",
  border: "#E2E8F0"
};

function App() {
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  return (
    <div className="App" style={{ minHeight: "100vh", background: Colors.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {showAgentPanel ? (
        <AgentPanel onBackToMain={() => setShowAgentPanel(false)} />
      ) : (
        <>
          <Navbar onAgentLoginClick={() => setShowAgentPanel(true)} />
          
          {/* Main Landing / Home Page Content */}
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 20px", boxSizing: "border-box" }}>
            
            {/* Hero Section */}
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <span style={{
                display: "inline-flex",
                background: Colors.teal + "15",
                color: Colors.tealDim,
                borderRadius: "20px",
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "20px"
              }}>
                🚀 India's #1 Financial Partner Network
              </span>
              
              <h2 style={{
                fontSize: "42px",
                fontWeight: 900,
                color: Colors.navy,
                margin: "0 0 20px",
                lineHeight: 1.15,
                letterSpacing: "-1px"
              }}>
                Distribute Financial Products.<br />
                <span style={{ color: Colors.tealDim }}>Earn Unlimited Commission.</span>
              </h2>
              
              <p style={{
                fontSize: "16px",
                color: Colors.textMid,
                maxWidth: "640px",
                margin: "0 auto 32px",
                lineHeight: 1.6
              }}>
                Join GharKaPaisa as an agent. Recommend Credit Cards, Loans, and Insurances from top Indian banks and earn payouts on every successful approval.
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                <button 
                  onClick={() => setShowAgentPanel(true)}
                  style={{
                    background: `linear-gradient(135deg, ${Colors.teal}, ${Colors.tealDim})`,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 32px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: `0 6px 20px ${Colors.teal}40`,
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                >
                  Agent Portal Login
                </button>
                <button 
                  onClick={() => setShowAgentPanel(true)}
                  style={{
                    background: "#fff",
                    color: Colors.navy,
                    border: `2px solid ${Colors.border}`,
                    borderRadius: "12px",
                    padding: "14px 32px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = Colors.teal; e.currentTarget.style.color = Colors.tealDim; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = Colors.border; e.currentTarget.style.color = Colors.navy; }}
                >
                  Join as Partner (Free)
                </button>
              </div>
            </div>

            {/* Features Section */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: "24px",
              marginBottom: "60px"
            }}>
              {[
                {
                  title: "Direct Bank Settlements",
                  desc: "Commissions are tracked transparently and settled directly to your verified bank account within 48 hours of bank approval.",
                  icon: "💳"
                },
                {
                  title: "50+ Financial Products",
                  desc: "Offer Credit Cards, Instant Loans, Business Loans, and Insurance policies from major institutions like HDFC, SBI, ICICI, and Axis.",
                  icon: "📊"
                },
                {
                  title: "Zero Security Deposits",
                  desc: "Start your independent financial advisory business immediately without any setup fee, franchise charge, or security deposit.",
                  icon: "🤝"
                }
              ].map(f => (
                <div key={f.title} style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "30px 24px",
                  border: `1px solid ${Colors.border}`,
                  boxShadow: "0 4px 16px rgba(10,17,40,0.03)"
                }}>
                  <div style={{ fontSize: "36px", marginBottom: "16px" }}>{f.icon}</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: Colors.navy, margin: "0 0 10px" }}>{f.title}</h3>
                  <p style={{ fontSize: "14px", color: Colors.textMid, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Trusted Banks Footer */}
            <div style={{ textAlign: "center", borderTop: `1px solid ${Colors.border}`, paddingTop: "40px" }}>
              <div style={{ fontSize: "12px", color: Colors.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
                Our Banking & Lending Partners
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px 40px", fontSize: "14px", fontWeight: 700, color: Colors.textMid }}>
                {["HDFC BANK", "SBI", "ICICI BANK", "AXIS BANK", "KOTAK", "IDFC FIRST", "LIC INSURANCE"].map(b => (
                  <span key={b} style={{ opacity: 0.65 }}>{b}</span>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default App;
