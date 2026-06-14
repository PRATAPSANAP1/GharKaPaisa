import React, { useState } from "react";

// ── Inline Icon Components (no external dependency) ───────────────────────────
const Icon = ({ d, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  menu:       "M4 6h16M4 12h16M4 18h16",
  bell:       "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  search:     "M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z",
  card:       "M3 10h18M7 15h2m4 0h2M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z",
  cash:       "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2M17 12H7",
  wallet:     "M3 10h18M7 10V6a5 5 0 0110 0v4M3 10v8a2 2 0 002 2h14a2 2 0 002-2v-8",
  file:       "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v13a2 2 0 01-2 2z",
  home:       "M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9",
  apps:       "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  user:       "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  chevron:    "M9 18l6-6-6-6",
  bolt:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  building:   "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m-2 0h2M9 7h6M9 11h6M9 15h6",
  heart:      "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  receipt:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  loan:       "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

const RED = "#c0392b";
const LIGHT_RED = "#fdecea";

export default function Home({ partner = {}, onNavigate = () => {} }) {
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const partnerName = partner?.first_name
    ? `${partner.first_name} ${partner.last_name || ""}`.trim()
    : "Partner";
  const initials = partnerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const partnerCode = partner?.Partner_code || "AG-00123";
  const balance = partner?.available_balance ?? 0;
  const pending = partner?.pending_amount ?? 0;
  const earned  = partner?.total_earned ?? 0;
  const withdrawn = partner?.total_withdrawn ?? 0;

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const QUICK = [
    { label: "Apply Credit Card", icon: Icons.card,   page: "home"    },
    { label: "Apply Loan",        icon: Icons.cash,   page: "home"    },
    { label: "My Wallet",         icon: Icons.wallet, page: "wallet"  },
    { label: "Applications",      icon: Icons.file,   page: "dashboard" },
  ];

  const CREDIT_CARDS = [
    { name: "HDFC Bank Cards",   sub: "NTB · ETB · Pre-approved", badge: "Upto ₹1,800" },
    { name: "Tata Neu Cards",    sub: "HDFC · SBI co-branded",    badge: "Upto ₹1,400" },
    { name: "Axis · ICICI · Kotak", sub: "Premium rewards",       badge: "Upto ₹1,100" },
    { name: "RBL · AU · IDFC · YES", sub: "FD & co-branded cards",badge: "Upto ₹900"   },
  ];

  const LOANS = [
    { name: "Personal Loan",  sub: "All major banks",           badge: "Upto ₹3,500", icon: Icons.user    },
    { name: "Instant Loan",   sub: "KreditBee · Navi · MoneyView", badge: "Quick",    icon: Icons.bolt    },
    { name: "Home Loan",      sub: "Business · Car · Education", badge: "High Value", icon: Icons.home    },
    { name: "Card on Loan",   sub: "Convert limit to EMI",      badge: "Flexible",   icon: Icons.receipt },
  ];

  const INSURANCE = [
    { name: "Health Insurance", sub: "Star · HDFC Ergo · ICICI", badge: "Upto ₹2,500", icon: Icons.heart  },
    { name: "Life · General",   sub: "Car · Bike · Term life",   badge: "New",          icon: Icons.shield },
  ];

  const NAV = [
    { id: "dashboard",  label: "Dashboard",    icon: Icons.home    },
    { id: "home",       label: "Products",     icon: Icons.apps    },
    { id: "wallet",     label: "Wallet",       icon: Icons.wallet  },
    { id: "profile",    label: "Profile",      icon: Icons.user    },
  ];

  return (
    <div style={{
      background: "#f4f4f4",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: "72px",
      maxWidth: "480px",
      margin: "0 auto",
    }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: RED, padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon d={Icons.menu} color="#fff" size={22} />
          <div style={{
            background: "#fff", borderRadius: "8px",
            padding: "4px 10px", fontSize: "13px",
            fontWeight: 700, color: RED,
          }}>
            GharKaPaisa
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "12px", fontWeight: 700, color: RED,
            cursor: "pointer",
          }}>
            {initials}
          </div>
          <Icon d={Icons.bell}   color="#fff" size={20} />
          <Icon d={Icons.search} color="#fff" size={20} />
        </div>
      </div>

      {/* ── Balance Card ─────────────────────────────────────────────────── */}
      <div style={{ background: RED, padding: "0 16px 20px" }}>
        <div style={{
          background: "rgba(0,0,0,0.2)", borderRadius: "14px", padding: "16px",
        }}>
          {/* Account info row */}
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "2px" }}>
            Wallet Balance
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "10px" }}>
            {partnerCode}
          </div>

          {/* Balance + View button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "26px", fontWeight: 600, color: "#fff", letterSpacing: "-0.5px" }}>
              {balanceVisible ? fmt(balance) : "₹ XXXX.XX"}
            </div>
            <button
              onClick={() => setBalanceVisible(v => !v)}
              style={{
                background: "rgba(139,0,0,0.7)", border: "none",
                borderRadius: "8px", padding: "9px 14px",
                color: "#fff", fontSize: "12px", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {balanceVisible ? "Hide Balance" : "View Balance"}
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            marginTop: "14px", display: "flex", gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "12px",
          }}>
            {[
              { label: "Total Earned",  val: fmt(earned)    },
              { label: "Pending",       val: fmt(pending)   },
              { label: "Withdrawn",     val: fmt(withdrawn) },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, textAlign: "center",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
                <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600, marginTop: "2px" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Access ─────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", margin: "12px", borderRadius: "14px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "14px" }}>Quick Access</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
          {QUICK.map(q => (
            <div
              key={q.label}
              onClick={() => onNavigate(q.page)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
            >
              <div style={{
                width: "50px", height: "50px", borderRadius: "50%",
                background: LIGHT_RED, display: "flex",
                alignItems: "center", justifyContent: "center",
                border: `1.5px solid ${RED}25`,
              }}>
                <Icon d={q.icon} color={RED} size={20} />
              </div>
              <span style={{ fontSize: "10px", color: "#555", textAlign: "center", lineHeight: 1.3 }}>{q.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Promo Banner ─────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", margin: "0 12px 12px", borderRadius: "14px",
        padding: "14px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>Earn up to ₹3,500 per card</div>
          <div style={{ fontSize: "11px", color: RED, marginTop: "3px" }}>#EarnFromHome · 20+ bank products</div>
        </div>
        <div style={{
          width: "56px", height: "56px", borderRadius: "12px",
          background: LIGHT_RED, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon d={Icons.building} color={RED} size={28} />
        </div>
      </div>

      {/* ── Credit Cards Section ──────────────────────────────────────────── */}
      <Section title="Credit Cards" onViewAll={() => onNavigate("home")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {CREDIT_CARDS.map(c => (
            <ProductCard key={c.name} icon={Icons.card} badge={c.badge} name={c.name} sub={c.sub} />
          ))}
        </div>
      </Section>

      {/* ── Loans Section ────────────────────────────────────────────────── */}
      <Section title="Loans" onViewAll={() => onNavigate("home")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {LOANS.map(l => (
            <ProductCard key={l.name} icon={l.icon} badge={l.badge} name={l.name} sub={l.sub} />
          ))}
        </div>
      </Section>

      {/* ── Insurance Section ─────────────────────────────────────────────── */}
      <Section title="Insurance" onViewAll={() => onNavigate("home")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {INSURANCE.map(ins => (
            <ProductCard key={ins.name} icon={ins.icon} badge={ins.badge} name={ins.name} sub={ins.sub} />
          ))}
        </div>
      </Section>

      {/* ── Bottom Navigation ────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "480px",
        background: "#fff", borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around",
        padding: "8px 0 10px", zIndex: 100,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
      }}>
        {NAV.map(n => {
          const active = activePage === n.id;
          return (
            <div
              key={n.id}
              onClick={() => { setActivePage(n.id); onNavigate(n.id); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "3px", cursor: "pointer", padding: "0 12px",
              }}
            >
              <Icon d={n.icon} color={active ? RED : "#aaa"} size={22} />
              <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? RED : "#aaa" }}>
                {n.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reusable Section wrapper ──────────────────────────────────────────────────
function Section({ title, onViewAll, children }) {
  return (
    <div style={{
      background: "#fff", margin: "0 12px 12px", borderRadius: "14px",
      padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>{title}</span>
        <div onClick={onViewAll} style={{ cursor: "pointer" }}>
          <Icon d={Icons.chevron} color={RED} size={18} />
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Reusable Product Card ─────────────────────────────────────────────────────
function ProductCard({ icon, badge, name, sub }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#fff8f8" : "#fafafa",
        borderRadius: "12px", padding: "12px",
        border: `1.5px solid ${hovered ? RED + "60" : "#eee"}`,
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        background: "#fdecea", display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: "8px",
      }}>
        <Icon d={icon} color={RED} size={18} />
      </div>
      <div style={{
        display: "inline-block", background: "#fdecea",
        color: RED, fontSize: "10px", fontWeight: 600,
        padding: "2px 7px", borderRadius: "4px", marginBottom: "6px",
      }}>
        {badge}
      </div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#222", lineHeight: 1.3 }}>{name}</div>
      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{sub}</div>
    </div>
  );
}
