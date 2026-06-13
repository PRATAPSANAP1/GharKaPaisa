import React, { useState, useEffect } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";
import partnerService from "../../api/partner.api";
import walletService from "../../api/wallet.api";

function QuickActionCard({ a, onTabChange, C, S }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => { if (onTabChange) onTabChange(a.tab); }}
      style={{
        ...S.card,
        textAlign: "center",
        cursor: "pointer",
        padding: "16px 12px",
        boxSizing: "border-box",
        borderColor: hov ? a.color : C.border,
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.2s"
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        background: `${a.color}18`,
        color: a.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 10px"
      }}>{a.icon}</div>
      <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{a.label}</div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon, C, S }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...S.card,
        flex: "1 1 200px",
        minWidth: "160px",
        borderColor: hov ? accent : C.border,
        boxShadow: hov ? `0 8px 30px ${accent}20, 0 4px 12px rgba(0,0,0,0.05)` : S.card.boxShadow,
        transform: hov ? "translateY(-3px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>{label}</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>{value}</div>
          {sub && <div style={{ fontSize: "12px", color: C.textLight, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>{sub}</div>}
        </div>
        <div style={{ background: accent + "18", borderRadius: "12px", padding: "10px", color: accent }}>{icon}</div>
      </div>
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

function SectionTitle({ title, sub, action, onActionClick, C, S }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: "13px", color: C.textLight, marginTop: "4px" }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onActionClick} style={{ ...S.btn("outline"), padding: "6px 14px", fontSize: "12px" }}>
          {action}
        </button>
      )}
    </div>
  );
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
  const d = dashboardData || {};
  const w = walletData || {};
  const walletBalance = w.wallet_balance || "₹0";
  const approvedAmount = w.approved_amount || "₹0";
  const withdrawable = w.withdrawable || "₹0";
  const pendingAmount = w.pending_amount || "₹0";

  const totalSubmissions = d.total_submissions || "0";
  const approvedCases = d.approved_cases || "0";
  const earningsPaid = d.earnings_paid || "₹0";
  const pendingApproval = d.pending_approval || "0";

  return (
    <div>
      {/* Welcome & Wallet Overview banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 10px 24px rgba(0,0,0,0.18)`,
        color: "#fff"
      }}>
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: `${C.teal}20` }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Welcome back,</div>
          <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", letterSpacing: "-0.5px" }}>{partner?.name || "Partner"} 👋</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {[
              { label: "Wallet Balance",   val: walletBalance   },
              { label: "Approved Amount",  val: approvedAmount },
              { label: "Withdrawable",     val: withdrawable   },
              { label: "Pending Amount",   val: pendingAmount   },
            ].map(s => (
              <div key={s.label} style={{
                flex: "1 1 120px",
                background: "rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "12px 14px",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "24px" }}>
        <StatCard label="Total Submissions" value={totalSubmissions}  sub="All-time leads"           accent={C.teal}        icon={<Icons.upload size={18} />} C={C} S={S} />
        <StatCard label="Approved Cases"    value={approvedCases}     sub="Success Cases"            accent={C.green}       icon={<Icons.check  size={18} />} C={C} S={S} />
        <StatCard label="Earnings Paid"     value={earningsPaid}      sub="Withdrawn directly"       accent={C.gold}        icon={<Icons.wallet size={18} />} C={C} S={S} />
        <StatCard label="Pending Approval"  value={pendingApproval}   sub="In verification pipeline" accent={C.amber}       icon={<Icons.clock  size={18} />} C={C} S={S} />
      </div>

      {errorMsg && (
        <div style={{
          background: `${C.red}15`, border: `1px solid ${C.red}40`,
          borderRadius: "10px", padding: "10px 14px",
          fontSize: "13px", color: C.red,
          marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
        }}>
          <Icons.x size={14} /> {errorMsg}
        </div>
      )}

      {/* Quick Actions Grid */}
      <SectionTitle title="Partner Quick Actions" C={C} S={S} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {[
          { label: "Submit Lead",     icon: <Icons.upload  />, color: C.teal,        tab: "home"    },
          { label: "View Wallet",     icon: <Icons.wallet  />, color: C.green,       tab: "wallet"  },
          { label: "Withdraw Cash",   icon: <Icons.withdraw/>, color: C.amber,       tab: "wallet"  },
          { label: "Active Offers",   icon: <Icons.star    />, color: C.gold,        tab: "home"    },
          { label: "Partner Profile", icon: <Icons.profile />, color: C.primaryDark, tab: "profile" },
        ].map(a => (
          <QuickActionCard key={a.label} a={a} onTabChange={onTabChange} C={C} S={S} />
        ))}
      </div>

      {/* Recent Applications Listing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        <div style={S.card}>
          <SectionTitle
            title="Recent Application Activities"
            sub="Track processing cases in real time"
            action="View Wallet"
            onActionClick={() => onTabChange("wallet")}
            C={C} S={S}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {recentApps.length === 0 && (
              <div style={{ padding: "16px 0", color: C.textLight, fontSize: "13px", textAlign: "center" }}>
                No recent applications found.
              </div>
            )}
            {recentApps.map((row, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i < recentApps.length - 1 ? `1px solid ${C.border}` : "none",
                flexWrap: "wrap",
                gap: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: C.bgSecondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "12px",
                    color: C.primary
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
    </div>
  );
}
