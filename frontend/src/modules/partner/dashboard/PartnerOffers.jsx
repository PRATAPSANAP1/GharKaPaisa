import React, { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";

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

export default function PartnerOffers({ partner = {}, onNavigate = () => {} }) {
  const { C, isDark } = useTheme();
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [activePage, setActivePage] = useState("home"); // updated to matching page id

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
      background: C.bg,
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: "72px",
      maxWidth: "1200px", // Made responsive for laptop
      margin: "0 auto",
      paddingTop: "12px"
    }}>
      
      {/* ── Desktop & Mobile Responsive Grid Container ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        
        {/* ── Balance Card ─────────────────────────────────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, 
          borderRadius: "18px", 
          padding: "20px",
          boxShadow: `0 8px 24px ${C.primary}40`,
          color: "#fff"
        }}>
          {/* Account info row */}
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "4px", fontWeight: 600 }}>
            Wallet Balance
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "16px" }}>
            {partnerCode}
          </div>

          {/* Balance + View button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              {balanceVisible ? fmt(balance) : "₹ XXXX.XX"}
            </div>
            <button
              onClick={() => setBalanceVisible(v => !v)}
              style={{
                background: "rgba(255,255,255,0.2)", border: "none",
                borderRadius: "10px", padding: "10px 18px",
                color: "#fff", fontSize: "13px", fontWeight: 700,
                cursor: "pointer", backdropFilter: "blur(4px)"
              }}
            >
              {balanceVisible ? "Hide Balance" : "View Balance"}
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "16px",
            borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "16px",
          }}>
            {[
              { label: "Total Earned",  val: fmt(earned)    },
              { label: "Pending",       val: fmt(pending)   },
              { label: "Withdrawn",     val: fmt(withdrawn) },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: "1 1 auto", textAlign: "center",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.2)" : "none",
                minWidth: "90px"
              }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: "15px", color: "#fff", fontWeight: 800, marginTop: "4px" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Access ─────────────────────────────────────────────────── */}
        <div style={{ background: C.card, borderRadius: "18px", padding: "20px", boxShadow: `0 2px 8px ${C.border}`, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: C.text, marginBottom: "16px" }}>Quick Access</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "16px" }}>
            {QUICK.map(q => (
              <div
                key={q.label}
                onClick={() => onNavigate(q.page)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer" }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: C.bgSecondary, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  border: `1px solid ${C.border}`,
                  transition: "transform 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Icon d={q.icon} color={C.primary} size={22} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: C.textMid, textAlign: "center", lineHeight: 1.3 }}>{q.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Promo Banner ─────────────────────────────────────────────────── */}
        <div style={{
          background: C.card, borderRadius: "18px",
          padding: "16px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
          boxShadow: `0 2px 8px ${C.border}`, border: `1px solid ${C.border}`
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>Earn up to ₹3,500 per card</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary, marginTop: "4px" }}>#EarnFromHome · 20+ bank products</div>
          </div>
          <div style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: C.bgSecondary, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon d={Icons.building} color={C.primary} size={32} />
          </div>
        </div>

        {/* ── Responsive Two-Column Layout for Desktop ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px"
        }}>
          {/* ── Credit Cards Section ──────────────────────────────────────────── */}
          <Section title="Credit Cards" onViewAll={() => onNavigate("home")} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {CREDIT_CARDS.map(c => (
                <ProductCard key={c.name} icon={Icons.card} badge={c.badge} name={c.name} sub={c.sub} C={C} />
              ))}
            </div>
          </Section>

          {/* ── Loans Section ────────────────────────────────────────────────── */}
          <Section title="Loans" onViewAll={() => onNavigate("home")} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {LOANS.map(l => (
                <ProductCard key={l.name} icon={l.icon} badge={l.badge} name={l.name} sub={l.sub} C={C} />
              ))}
            </div>
          </Section>

          {/* ── Insurance Section ─────────────────────────────────────────────── */}
          <Section title="Insurance" onViewAll={() => onNavigate("home")} C={C}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {INSURANCE.map(ins => (
                <ProductCard key={ins.name} icon={ins.icon} badge={ins.badge} name={ins.name} sub={ins.sub} C={C} />
              ))}
            </div>
          </Section>
        </div>

      </div>

    </div>
  );
}

// ── Reusable Section wrapper ──────────────────────────────────────────────────
function Section({ title, onViewAll, children, C }) {
  return (
    <div style={{
      background: C.card, borderRadius: "18px",
      padding: "20px", boxShadow: `0 2px 8px ${C.border}`, border: `1px solid ${C.border}`,
      height: "100%"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>{title}</span>
        <div onClick={onViewAll} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: C.primary, fontWeight: 600 }}>
          View All <Icon d={Icons.chevron} color={C.primary} size={16} />
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Reusable Product Card ─────────────────────────────────────────────────────
function ProductCard({ icon, badge, name, sub, C }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.bgSecondary : C.bg,
        borderRadius: "14px", padding: "16px",
        border: `1px solid ${hovered ? C.primary : C.border}`,
        cursor: "pointer", transition: "all 0.2s ease",
        display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "10px",
          background: C.bgSecondary, display: "flex",
          alignItems: "center", justifyContent: "center",
          border: `1px solid ${C.border}`
        }}>
          <Icon d={icon} color={C.primary} size={20} />
        </div>
        <div style={{
          background: `${C.green}20`,
          color: C.green, fontSize: "10px", fontWeight: 700,
          padding: "4px 8px", borderRadius: "6px", textTransform: "uppercase"
        }}>
          {badge}
        </div>
      </div>
      <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: "4px" }}>{name}</div>
      <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 500 }}>{sub}</div>
    </div>
  );
}
