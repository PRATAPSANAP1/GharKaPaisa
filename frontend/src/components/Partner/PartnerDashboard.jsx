import React, { useState } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";

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
    Approved: [C.green, <Icons.check size={14} />],
    Rejected: [C.red,   <Icons.x     size={14} />],
    Pending:  [C.gold,  <Icons.clock size={14} />],
  };
  const [color, icon] = map[status] || [C.textLight, null];
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

const WALLET_STMT = [
  { app: "APP20260601", name: "Rahul Sharma", product: "HDFC NTB Credit Card", bank: "HDFC",  credit: "₹1,500", date: "12 Jun 2026", status: "Approved" },
  { app: "APP20260602", name: "Priya Singh",  product: "SBI Personal Loan",    bank: "SBI",   credit: "₹3,500", date: "11 Jun 2026", status: "Approved" },
  { app: "APP20260603", name: "Amit Patel",   product: "ICICI Credit Card",    bank: "ICICI", credit: "—",      date: "10 Jun 2026", status: "Pending"  },
  { app: "APP20260604", name: "Sneha Roy",    product: "Axis Home Loan",       bank: "Axis",  credit: "₹4,850", date: "08 Jun 2026", status: "Approved" },
];

export default function PartnerDashboard({ partner, onTabChange }) {
  const { C } = useTheme();
  const S = makeS(C);

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
          <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", letterSpacing: "-0.5px" }}>{partner.name} 👋</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {[
              { label: "Wallet Balance",   val: "₹38,600"   },
              { label: "Approved Amount",  val: "₹1,24,800" },
              { label: "Withdrawable",     val: "₹38,600"   },
              { label: "Pending Amount",   val: "₹18,200"   },
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
        <StatCard label="Total Submissions" value="52"       sub="All-time leads"           accent={C.teal}        icon={<Icons.upload size={18} />} C={C} S={S} />
        <StatCard label="Approved Cases"    value="37"       sub="71% Success Rate"          accent={C.green}       icon={<Icons.check  size={18} />} C={C} S={S} />
        <StatCard label="Earnings Paid"     value="₹68,000"  sub="Withdrawn directly"        accent={C.gold}        icon={<Icons.wallet size={18} />} C={C} S={S} />
        <StatCard label="Pending Approval"  value="11"       sub="In verification pipeline"  accent={C.amber}       icon={<Icons.clock  size={18} />} C={C} S={S} />
      </div>

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
          <div
            key={a.label}
            onClick={() => onTabChange(a.tab)}
            style={{
              ...S.card,
              textAlign: "center",
              cursor: "pointer",
              padding: "16px 12px",
              boxSizing: "border-box"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
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
            {WALLET_STMT.map((row, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i < WALLET_STMT.length - 1 ? `1px solid ${C.border}` : "none",
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
                  }}>{row.bank}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: C.text }}>{row.name}</div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>{row.product} · <b style={{ color: C.textMid }}>{row.app}</b></div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.green }}>{row.credit !== "—" ? row.credit : "—"}</div>
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
