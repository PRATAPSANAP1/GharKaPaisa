import React, { useState, useEffect } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";
import partnerService from "../../api/partner.api";
import walletService from "../../api/wallet.api";

// Reusable Components matching the HTML design
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

function SectionCard({ title, subtitle, C, children, badge, seeMoreText }) {
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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}>{title}</h3>
            {badge && <span style={{ background: `${C.gold}20`, color: C.gold, fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700 }}>{badge}</span>}
          </div>
          {subtitle && <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0", fontWeight: 500 }}>{subtitle}</p>}
        </div>
        <button style={{ 
          background: "transparent", border: "none", color: C.teal, 
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "4px",
          padding: 0
        }}>
          {seeMoreText || "See more"} <Icons.arrowRight size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status, C, S }) {
  const map = {
    approved: [C.green, <Icons.check size={14} />],
    rejected: [C.red,   <Icons.x     size={14} />],
    pending:  [C.gold,  <Icons.clock size={14} />],
  };
  const [color, icon] = map[status?.toLowerCase()] || [C.textLight, null];
  return <span style={S.tag(color)}>{icon}{status}</span>;
}

export default function PartnerDashboard({ partner, onTabChange }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const partnerId = partner?.Partner_id || partner?.partner_id || partner?.id || partner?.PartnerID;
      if (!partnerId) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        if (isMounted) setLoading(true);
        const [dashRes, wallRes] = await Promise.all([
          partnerService.getDashboard(partnerId).catch(() => null),
          walletService.getWallet(partnerId).catch(() => null)
        ]);
        if (isMounted) {
          if (dashRes?.data?.success) {
            setDashboardData(dashRes.data.data);
            setRecentApps(dashRes.data.data.recent_applications || []);
          }
          if (wallRes?.data?.success) {
            setWalletData(wallRes.data.data);
          }
        }
      } catch (err) {
        if (isMounted) setErrorMsg("Something went wrong loading dashboard data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [partner]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
        <span style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: `3px solid ${C.border}`,
          borderTop: `3px solid ${C.teal}`,
          animation: "spin 0.8s linear infinite",
          display: "inline-block"
        }} />
        <div style={{ fontSize: "14px", color: C.textMid, fontWeight: 600 }}>Loading dashboard...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Fallbacks
  const w = walletData || {};
  const walletBalance = w.wallet_balance || "₹0";
  const approvedAmount = w.approved_amount || "₹0";
  const withdrawable = w.withdrawable || "₹0";
  const pendingAmount = w.pending_amount || "₹0";

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "20px" }}>
      
      {/* Header: Welcome back + Logo Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "28px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>Welcome back, {partner?.name?.split(' ')[0] || "Partner"}</h1>
          <p style={{ fontSize: "14px", color: C.textLight, marginTop: "4px", fontWeight: 500 }}>Your financial companion</p>
        </div>
        <div style={{ 
          background: C.card, padding: "8px 20px", borderRadius: "100px", 
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)", fontWeight: 800, fontSize: "20px", color: C.teal,
          border: `1px solid ${C.border}`
        }}>
          GharKaPaisa
        </div>
      </div>

      {/* Wallet Stats Strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Wallet Balance",   val: walletBalance   },
          { label: "Approved Amount",  val: approvedAmount },
          { label: "Withdrawable",     val: withdrawable   },
          { label: "Pending Amount",   val: pendingAmount   },
        ].map(s => (
          <div key={s.label} style={{
            flex: "1 1 200px",
            background: C.card,
            borderRadius: "16px",
            padding: "16px",
            border: `1px solid ${C.border}`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.02)`
          }}>
            <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginTop: "4px" }}>{s.val}</div>
          </div>
        ))}
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
        boxShadow: `0 4px 12px rgba(0,0,0,0.02)`
      }}>
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", fontSize: "18px", fontWeight: 700, color: C.text }}>
          <span style={{ cursor: "default", letterSpacing: "-0.2px" }}>PNB</span>
          <span style={{ cursor: "default", letterSpacing: "-0.2px" }}>Union</span>
          <span style={{ cursor: "default", letterSpacing: "-0.2px" }}>Canara</span>
          <span style={{ cursor: "default", letterSpacing: "-0.2px" }}>Tata</span>
        </div>
        <div style={{ 
          background: `${C.teal}15`, color: C.teal, padding: "8px 16px", 
          borderRadius: "30px", fontSize: "13px", fontWeight: 700
        }}>
          🏦 Partner Banks
        </div>
      </div>

      {/* Two Columns Layout */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "28px" }}>
        
        {/* LEFT COLUMN: Insurance */}
        <div style={{ flex: "1.3", minWidth: "300px" }}>
          <SectionCard title="Insurance" subtitle="Protect what matters most" C={C}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
              {["Health", "Life Insurance", "General"].map(t => (
                <span key={t} style={{ background: C.bgSecondary, color: C.text, padding: "8px 22px", borderRadius: "30px", fontSize: "14px", fontWeight: 600 }}>{t}</span>
              ))}
            </div>

            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "14px" }}>Health Insurance</div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              <BrandItem text="HDFC" C={C} />
              <BrandItem text="SBI" C={C} />
              <BrandItem text="ICICI" C={C} />
              <BrandItem text="AXIS" C={C} />
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              <BrandItem text="HDFC" C={C} />
              <BrandItem text="SBI" C={C} />
              <BrandItem text="ICICI" C={C} />
              <BrandItem text="Axis" C={C} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              <BrandItem text="KOTAK" C={C} />
              <BrandItem text="STAR" C={C} />
              <BrandItem text="CARE" C={C} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "28px" }}>
              <BrandItem text="Kotak" C={C} />
              <BrandItem text="Star Health" C={C} />
              <BrandItem text="Care" C={C} />
            </div>

            <div style={{ width: "100%", height: "1px", background: C.border, margin: "24px 0" }} />

            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "14px" }}>General Insurance <span style={{ fontSize: "13px", color: C.textLight, fontWeight: 500, marginLeft: "6px" }}>Car, Bike & more</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <span style={{ background: C.bgSecondary, padding: "8px 22px", borderRadius: "36px", fontSize: "14px", fontWeight: 600, color: C.text }}>Car Insurance</span>
              <span style={{ background: C.bgSecondary, padding: "8px 22px", borderRadius: "36px", fontSize: "14px", fontWeight: 600, color: C.text }}>Bike Insurance</span>
            </div>
          </SectionCard>
        </div>

        {/* RIGHT COLUMN: Credit Cards, Co-browsing, FD Cards, Loans */}
        <div style={{ flex: "1", minWidth: "300px" }}>
          
          <SectionCard title="Credit Cards" seeMoreText="Compare & apply for best cards" C={C}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              {["HDFC", "SBI", "AXIS", "ICICI"].map(b => <BrandItem key={b} text={b} C={C} />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              {["HDFC", "SBI", "Axis", "ICICI"].map(b => <BrandItem key={b} text={b} C={C} />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "12px" }}>
              {["KOTAK", "YES", "INDUS", "CANARA"].map(b => <BrandItem key={b} text={b} C={C} />)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              {["Kotak", "Yes", "IndusInd", "Canara"].map(b => <BrandItem key={b} text={b} C={C} />)}
            </div>
          </SectionCard>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "24px" }}>
            {/* Co-browsing */}
            <div style={{ flex: 1, minWidth: "200px", background: C.card, borderRadius: "24px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)", border: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px 0", color: C.text, display: "flex", alignItems: "center", gap: "8px" }}>Co-browsing Cards <span style={{ fontSize: "13px", fontWeight: "normal" }}>🔗</span></h4>
              <p style={{ fontSize: "13px", color: C.textLight, margin: "0 0 16px 0" }}>Tata Neu co-browsing solutions</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                 <span style={{ background: `${C.teal}15`, padding: "8px 18px", borderRadius: "40px", fontSize: "14px", fontWeight: 600, color: C.teal }}>NEU</span>
                 <span style={{ background: `${C.teal}15`, padding: "8px 18px", borderRadius: "40px", fontSize: "14px", fontWeight: 600, color: C.teal }}>NEU</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                 <BrandItem text="Tata Neu HDFC" C={C} />
                 <BrandItem text="Tata Neu SBI" C={C} />
              </div>
              <div style={{ textAlign: "right" }}><span style={{ fontSize: "12px", color: C.teal, fontWeight: 600, cursor: "pointer" }}>See more &gt;</span></div>
            </div>

            {/* FD Based */}
            <div style={{ flex: 1, minWidth: "200px", background: C.card, borderRadius: "24px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)", border: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px 0", color: C.text }}>FD Based Cards</h4>
              <p style={{ fontSize: "13px", color: C.textLight, margin: "0 0 16px 0" }}>Fixed deposit backed cards</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                 <BrandItem text="HDFC" C={C} />
                 <BrandItem text="IDFC" C={C} />
                 <BrandItem text="TATA" C={C} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                 <BrandItem text="HDFC" C={C} />
                 <BrandItem text="IDFC" C={C} />
                 <BrandItem text="Tata" C={C} />
              </div>
              <div style={{ textAlign: "right" }}><span style={{ fontSize: "12px", color: C.teal, fontWeight: 600, cursor: "pointer" }}>See more &gt;</span></div>
            </div>
          </div>

          <SectionCard title="Loans" seeMoreText="Get instant loans at best rates" C={C}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.bgSecondary, padding: "8px 18px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>📄 Personal Loan</span>
                <span style={{ background: `${C.green}20`, color: C.green, fontSize: "11px", padding: "3px 10px", borderRadius: "30px", fontWeight: 700 }}>NEW</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.bgSecondary, padding: "8px 18px", borderRadius: "30px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>🏠 Home Loan</span>
                <span style={{ background: `${C.green}20`, color: C.green, fontSize: "11px", padding: "3px 10px", borderRadius: "30px", fontWeight: 700 }}>NEW</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <BrandItem text="Car Loan" C={C} />
              <BrandItem text="Education Loan" C={C} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              {["SBI", "HDFC", "ICICI", "Axis Bank"].map(b => <BrandItem key={b} text={b} C={C} />)}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Recent Applications Listing - Maintained for Dashboard Utility */}
      <div style={{ background: C.card, borderRadius: "24px", padding: "24px", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}>Recent Applications</h3>
            <p style={{ fontSize: "13px", color: C.textLight, marginTop: "4px" }}>Track processing cases in real time</p>
          </div>
          <button onClick={() => onTabChange("wallet")} style={{ ...S.btn("outline"), padding: "6px 14px", fontSize: "12px" }}>
            View All
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {recentApps.length === 0 && (
            <div style={{ padding: "16px 0", color: C.textLight, fontSize: "13px", textAlign: "center" }}>
              No recent applications found.
            </div>
          )}
          {recentApps.map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: "12px", background: C.bgSecondary,
              flexWrap: "wrap", gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px", background: C.card,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "12px", color: C.teal, border: `1px solid ${C.border}`
                }}>{row.bank || row.bank_name || "🏦"}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: C.text }}>{row.name || row.customer_name || "Unknown"}</div>
                  <div style={{ fontSize: "11px", color: C.textLight }}>{row.product || row.product_name || "Product"} · <b style={{ color: C.textMid }}>{row.app || row.app_id || row.id || "Lead"}</b></div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.green }}>{(row.credit && row.credit !== "—") ? row.credit : (row.credit_amount || "—")}</div>
                <StatusBadge status={row.status} C={C} S={S} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
