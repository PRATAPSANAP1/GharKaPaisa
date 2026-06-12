import { useState, useEffect } from "react";

// ── Icons (inline SVG components) ─────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  dashboard: (props) => <Icon d={["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"]} {...props} />,
  creditCard: (props) => <Icon d={["M1 4h22v16H1z", "M1 10h22"]} {...props} />,
  loan: (props) => <Icon d={["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"]} {...props} />,
  insurance: (props) => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} />,
  investment: (props) => <Icon d={["M22 12h-4l-3 9L9 3l-3 9H2"]} {...props} />,
  wallet: (props) => <Icon d={["M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z", "M16 12a1 1 0 100 2 1 1 0 000-2z"]} {...props} />,
  profile: (props) => <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 3a4 4 0 100 8 4 4 0 000-8z"]} {...props} />,
  bell: (props) => <Icon d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"]} {...props} />,
  eye: (props) => <Icon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 100 6 3 3 0 000-6z"]} {...props} />,
  trending: (props) => <Icon d={["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"]} {...props} />,
  withdraw: (props) => <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"]} {...props} />,
  upload: (props) => <Icon d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"]} {...props} />,
  check: (props) => <Icon d="M20 6L9 17l-5-5" {...props} />,
  x: (props) => <Icon d={["M18 6L6 18", "M6 6l12 12"]} {...props} />,
  clock: (props) => <Icon d={["M12 2a10 10 0 100 20A10 10 0 0012 2z", "M12 6v6l4 2"]} {...props} />,
  star: (props) => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...props} />,
  menu: (props) => <Icon d={["M3 12h18", "M3 6h18", "M3 18h18"]} {...props} />,
  logout: (props) => <Icon d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"]} {...props} />,
  gift: (props) => <Icon d={["M20 12v10H4V12", "M22 7H2v5h20V7z", "M12 22V7", "M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z", "M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"]} {...props} />,
  arrowRight: (props) => <Icon d="M5 12h14M12 5l7 7-7 7" {...props} />,
  arrowLeft: (props) => <Icon d="M19 12H5M12 19l-7-7 7-7" {...props} />,
};

// ── Color tokens ───────────────────────────────────────────────────────────────
const C = {
  navy: "#0A1128", 
  navyMid: "#1C2541", 
  navyLight: "#3A506B",
  teal: "#00B4D8", 
  tealDim: "#0077B6", 
  tealGlow: "rgba(0,180,216,0.15)",
  gold: "#FFB703", 
  goldDim: "#FB8500",
  bg: "#F4F7FC", 
  card: "#FFFFFF",
  text: "#0A1128", 
  textMid: "#4A5568", 
  textLight: "#8D99AE",
  red: "#E63946", 
  green: "#2A9D8F", 
  amber: "#E76F51",
  border: "#E2E8F0",
};

// ── Reusable Styles ────────────────────────────────────────────────────────────
const S = {
  card: {
    background: C.card, 
    borderRadius: "16px", 
    padding: "20px",
    boxShadow: "0 4px 20px rgba(10,17,40,0.04), 0 1px 3px rgba(10,17,40,0.02)",
    border: `1px solid ${C.border}`, 
    transition: "all 0.25s ease",
  },
  tag: (color) => ({
    display: "inline-flex", 
    alignItems: "center", 
    gap: "4px",
    background: color + "15", 
    color: color, 
    borderRadius: "8px",
    padding: "4px 10px", 
    fontSize: "11px", 
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }),
  btn: (variant = "primary") => ({
    display: "inline-flex", 
    alignItems: "center", 
    justifyContent: "center",
    gap: "8px",
    padding: variant === "sm" ? "8px 16px" : "12px 24px",
    borderRadius: "10px", 
    fontWeight: 700, 
    fontSize: variant === "sm" ? "13px" : "14px",
    cursor: "pointer", 
    transition: "all 0.2s",
    background: variant === "outline" ? "transparent" : variant === "ghost" ? "transparent" : `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
    color: variant === "outline" || variant === "ghost" ? C.tealDim : "#fff",
    border: variant === "outline" ? `1.5px solid ${C.teal}` : "none",
    boxShadow: variant === "primary" ? `0 4px 12px ${C.teal}30` : "none",
  }),
  input: {
    width: "100%", 
    padding: "12px 16px", 
    borderRadius: "10px",
    border: `1.5px solid ${C.border}`, 
    fontSize: "14px", 
    color: C.text,
    background: "#fff", 
    outline: "none", 
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  label: { 
    fontSize: "13px", 
    fontWeight: 600, 
    color: C.textMid, 
    marginBottom: "6px", 
    display: "block" 
  },
};

// ── Data ───────────────────────────────────────────────────────────────────────
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

const WALLET_STMT = [
  { app: "APP20260601", name: "Rahul Sharma", product: "HDFC NTB Credit Card", bank: "HDFC", credit: "₹1,500", debit: "—", date: "12 Jun 2026", status: "Approved" },
  { app: "APP20260602", name: "Priya Singh", product: "SBI Personal Loan", bank: "SBI", credit: "₹3,500", debit: "—", date: "11 Jun 2026", status: "Approved" },
  { app: "APP20260603", name: "Amit Patel", product: "ICICI Credit Card", bank: "ICICI", credit: "—", debit: "—", date: "10 Jun 2026", status: "Pending" },
  { app: "APP20260604", name: "Sneha Roy", product: "Axis Home Loan", bank: "Axis", credit: "₹4,850", debit: "—", date: "08 Jun 2026", status: "Approved" },
  { app: "APP20260605", name: "Vikram Nair", product: "Tata Neu HDFC", bank: "HDFC", credit: "—", debit: "—", date: "07 Jun 2026", status: "Rejected" },
  { app: "APP20260606", name: "Pooja Mehta", product: "Kotak Business Loan", bank: "Kotak", credit: "—", debit: "—", date: "06 Jun 2026", status: "Pending" },
];

const CASE_PRODUCTS = [
  { product: "HDFC NTB Card", total: 14, approved: 10, rejected: 2, commission: "₹15,000" },
  { product: "SBI Personal Loan", total: 8, approved: 5, rejected: 1, commission: "₹17,500" },
  { product: "ICICI Credit Card", total: 11, approved: 8, rejected: 1, commission: "₹10,400" },
  { product: "Axis Home Loan", total: 4, approved: 3, rejected: 0, commission: "₹14,550" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
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
        boxShadow: hov ? `0 8px 30px ${accent}15, 0 4px 12px rgba(10,17,40,0.03)` : S.card.boxShadow,
        transform: hov ? "translateY(-3px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>{label}</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>{value}</div>
          {sub && <div style={{ fontSize: "12px", color: C.textLight, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>{sub}</div>}
        </div>
        <div style={{ background: accent + "15", borderRadius: "12px", padding: "10px", color: accent }}>{icon}</div>
      </div>
    </div>
  );
}

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
      
      {/* Product Details info snippet */}
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
        }} title="View Details">
          <Icons.eye size={16} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { 
    Approved: [C.green, <Icons.check size={14} />], 
    Rejected: [C.red, <Icons.x size={14} />], 
    Pending: [C.gold, <Icons.clock size={14} />] 
  };
  const [color, icon] = map[status] || [C.textLight, null];
  return <span style={S.tag(color)}>{icon}{status}</span>;
}

function SectionTitle({ title, sub, action, onActionClick }) {
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

// ── Pages ──────────────────────────────────────────────────────────────────────

// LOGIN PAGE
function LoginPage({ onLogin, onRegisterNav }) {
  const [tab, setTab] = useState("pwd");
  const [form, setForm] = useState({ email: "", password: "", mobile: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let t;
    if (timer > 0) {
      t = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [timer]);

  const handleSendOtp = () => {
    if (!form.mobile) return alert("Please enter mobile number.");
    setOtpSent(true);
    setTimer(30);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tab === "pwd" && (!form.email || !form.password)) {
      return alert("Please enter credentials.");
    }
    if (tab === "otp" && (!form.mobile || !form.otp)) {
      return alert("Please enter mobile and OTP.");
    }
    onLogin({ name: "Rajesh Kumar", id: "AG-00123" });
  };

  return (
    <div style={{
      minHeight: "100vh", 
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 50%, #152A4A 100%)`,
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Portal Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "56px", 
            height: "56px", 
            borderRadius: "16px",
            background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
            boxShadow: `0 8px 30px ${C.teal}40`, 
            marginBottom: "14px",
            color: "#fff"
          }}>
            <Icons.trending size={28} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>GharKaPaisa</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>Agent Partner Terminal</div>
        </div>

        {/* Card */}
        <div style={{ ...S.card, padding: "28px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginBottom: "4px" }}>Partner Login</div>
          <div style={{ fontSize: "13px", color: C.textLight, marginBottom: "24px" }}>Access your agent wallet & tools</div>

          {/* Login Tabs */}
          <div style={{
            display: "flex", 
            background: C.bg, 
            borderRadius: "10px", 
            padding: "4px", 
            marginBottom: "20px"
          }}>
            {["pwd", "otp"].map(t => (
              <button 
                key={t} 
                type="button"
                onClick={() => { setTab(t); setOtpSent(false); }} 
                style={{
                  flex: 1, 
                  padding: "8px 0", 
                  borderRadius: "8px", 
                  border: "none", 
                  cursor: "pointer",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? C.navy : C.textLight,
                  fontWeight: tab === t ? 700 : 500, 
                  fontSize: "13px", 
                  transition: "all 0.2s",
                  boxShadow: tab === t ? "0 2px 4px rgba(10,17,40,0.06)" : "none",
                }}
              >
                {t === "pwd" ? "Password" : "OTP Login"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === "pwd" ? (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Email or Mobile</label>
                  <input 
                    style={S.input} 
                    placeholder="Enter registered email/mobile"
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={S.label}>Password</label>
                  <input 
                    type="password" 
                    style={S.input} 
                    placeholder="••••••••"
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                  />
                </div>
                <div style={{ textAlign: "right", marginTop: "-12px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", color: C.tealDim, cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Mobile Number</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      style={{ ...S.input, flex: 1 }} 
                      placeholder="+91 Mobile Number"
                      value={form.mobile} 
                      onChange={e => setForm({ ...form, mobile: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      onClick={handleSendOtp} 
                      disabled={timer > 0}
                      style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "100px", padding: "0 10px" }}
                    >
                      {timer > 0 ? `${timer}s` : otpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </div>
                {otpSent && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={S.label}>Enter 6-Digit OTP</label>
                    <input 
                      style={{ ...S.input, textAlign: "center", letterSpacing: "6px", fontSize: "18px", fontWeight: 700 }} 
                      placeholder="••••••" 
                      maxLength={6}
                      value={form.otp} 
                      onChange={e => setForm({ ...form, otp: e.target.value })} 
                    />
                  </div>
                )}
              </>
            )}

            <button type="submit" style={{ ...S.btn("primary"), width: "100%", padding: "12px 0", fontSize: "14px", borderRadius: "10px", marginTop: "4px" }}>
              Secure Log In
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: C.textLight }}>
            New GharKaPaisa Agent? <span onClick={onRegisterNav} style={{ color: C.tealDim, cursor: "pointer", fontWeight: 700 }}>Apply Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// REGISTER PAGE
function RegisterPage({ onBack }) {
  const [step, setStep] = useState(0);
  const steps = ["Personal", "Business", "Bank", "KYC"];

  const handleStepSubmit = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      alert("Application Submitted Successfully! Our Admin team will review and approve your account within 24 hours.");
      onBack();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 16px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        
        {/* Back and title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={onBack} style={{ ...S.btn("ghost"), padding: "6px 8px" }}>
            <Icons.arrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Agent Partner Request</div>
            <div style={{ fontSize: "12px", color: C.textLight, marginTop: "2px" }}>Join the premium network</div>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: "4px", 
                borderRadius: "99px", 
                background: i <= step ? C.teal : C.border,
                transition: "background 0.3s"
              }} />
              <div style={{ 
                fontSize: "11px", 
                color: i <= step ? C.text : C.textLight, 
                fontWeight: i <= step ? 700 : 500, 
                marginTop: "6px", 
                textAlign: "center" 
              }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "18px", borderBottom: `1px solid ${C.border}`, paddingBottom: "10px" }}>
            {steps[step]} Information
          </div>

          {/* Form Content steps */}
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Agent Name (As on Aadhaar)</label>
                <input style={S.input} placeholder="Rajesh Kumar" />
              </div>
              <div>
                <label style={S.label}>Mobile Number</label>
                <input style={S.input} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={S.label}>Verify Mobile (OTP)</label>
                <input style={S.input} placeholder="6-digit OTP" maxLength={6} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Email Address</label>
                <input type="email" style={S.input} placeholder="rajesh@gmail.com" />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input type="password" style={S.input} placeholder="Create Secure Password" />
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input type="password" style={S.input} placeholder="Repeat Password" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Current Full Address</label>
                <input style={S.input} placeholder="Flat, Building, Street" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Business Location</label>
                <input style={S.input} placeholder="Office or Shop Address" />
              </div>
              <div>
                <label style={S.label}>Company / Shop Name</label>
                <input style={S.input} placeholder="Kumar Fin Advisory (Optional)" />
              </div>
              <div>
                <label style={S.label}>Company Type</label>
                <select style={S.input}>
                  <option>Individual / Freelancer</option>
                  <option>Proprietorship</option>
                  <option>Partnership</option>
                  <option>Pvt Ltd Company</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>GST Number (Optional)</label>
                <input style={S.input} placeholder="27AAPFU0939F1ZV" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Bank Name</label>
                <input style={S.input} placeholder="HDFC Bank, SBI, ICICI" />
              </div>
              <div>
                <label style={S.label}>Account Number</label>
                <input style={S.input} placeholder="5010023452132" />
              </div>
              <div>
                <label style={S.label}>IFSC Code</label>
                <input style={S.input} placeholder="HDFC0001234" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Account Holder Name</label>
                <input style={S.input} placeholder="Rajesh Kumar" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={S.label}>Aadhaar Number</label>
                <input style={S.input} placeholder="•••• •••• •••• 1234" />
              </div>
              <div>
                <label style={S.label}>PAN Card Number</label>
                <input style={S.input} placeholder="ABCDE1234F" />
              </div>

              {/* Uploads grid */}
              {[
                { title: "Upload Aadhaar (Front/Back PDF)", desc: "Aadhaar Card" },
                { title: "Upload PAN Card (PDF/Image)", desc: "PAN Card" },
                { title: "Upload GST Certificate (Optional)", desc: "GST Doc" },
                { title: "Upload Cancelled Cheque (Image)", desc: "Cheque Copy" }
              ].map(u => (
                <div key={u.title} style={{
                  gridColumn: "span 1",
                  border: `2px dashed ${C.border}`,
                  borderRadius: "12px",
                  padding: "16px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: C.bg
                }}>
                  <div style={{ color: C.tealDim, marginBottom: "6px" }}>
                    <Icons.upload size={20} />
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{u.desc}</div>
                  <div style={{ fontSize: "10px", color: C.textLight, marginTop: "3px" }}>Max size 5MB</div>
                </div>
              ))}
            </div>
          )}

          {/* Button Footer */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              onClick={() => step > 0 ? setStep(step - 1) : onBack()} 
              style={{ ...S.btn("outline"), padding: "10px 20px" }}
            >
              Reset / Back
            </button>
            <button 
              type="button" 
              onClick={handleStepSubmit} 
              style={{ ...S.btn("primary"), padding: "10px 24px" }}
            >
              {step === 3 ? "Submit Verification" : "Next Step →"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// DASHBOARD PAGE
function DashboardPage({ agent, onTabChange }) {
  const recentApps = WALLET_STMT.slice(0, 4);

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
        boxShadow: `0 10px 24px rgba(10,17,40,0.12)`,
        color: "#fff"
      }}>
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: `${C.teal}18` }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Welcome back,</div>
          <div style={{ fontSize: "24px", fontWeight: 900, marginBottom: "20px", letterSpacing: "-0.5px" }}>{agent.name} 👋</div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {[
              { label: "Wallet Balance", val: "₹38,600", border: C.teal },
              { label: "Approved Amount", val: "₹1,24,800", border: C.green },
              { label: "Withdrawable", val: "₹38,600", border: C.teal },
              { label: "Pending Amount", val: "₹18,200", border: C.gold },
            ].map(s => (
              <div key={s.label} style={{ 
                flex: "1 1 120px",
                background: "rgba(255,255,255,0.06)", 
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
        <StatCard label="Total Submissions" value="52" sub="All-time leads" accent={C.teal} icon={<Icons.upload size={18} />} />
        <StatCard label="Approved Cases" value="37" sub="71% Success Rate" accent={C.green} icon={<Icons.check size={18} />} />
        <StatCard label="Earnings Paid" value="₹68,000" sub="Withdrawn directly" accent={C.gold} icon={<Icons.wallet size={18} />} />
        <StatCard label="Pending Approval" value="11" sub="In verification pipeline" accent={C.goldDim} icon={<Icons.clock size={18} />} />
      </div>

      {/* Quick Actions Grid */}
      <SectionTitle title="Partner Quick Actions" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {[
          { label: "Submit Lead", icon: <Icons.upload />, color: C.teal, tab: "home" },
          { label: "View Wallet", icon: <Icons.wallet />, color: C.green, tab: "wallet" },
          { label: "Withdraw Cash", icon: <Icons.withdraw />, color: C.goldDim, tab: "wallet" },
          { label: "Active Offers", icon: <Icons.star />, color: C.gold, tab: "home" },
          { label: "Partner Profile", icon: <Icons.profile />, color: C.navyLight, tab: "profile" },
        ].map(a => (
          <div 
            key={a.label} 
            onClick={() => onTabChange(a.tab)}
            style={{
              ...S.card, 
              textAlign: "center", 
              cursor: "pointer", 
              padding: "16px 12px",
              boxShadow: "0 2px 8px rgba(10,17,40,0.03)"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{
              width: "44px", 
              height: "44px", 
              borderRadius: "12px", 
              background: `${a.color}15`,
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
          <SectionTitle title="Recent Application Activities" sub="Track processing cases in real time" action="View Wallet" onActionClick={() => onTabChange("wallet")} />
          
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                    background: C.bg,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontWeight: 800, 
                    fontSize: "12px", 
                    color: C.navyLight
                  }}>{row.bank}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: C.text }}>{row.name}</div>
                    <div style={{ fontSize: "11px", color: C.textLight }}>{row.product} · <b style={{ color: C.textMid }}>{row.app}</b></div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.green }}>{row.credit !== "—" ? row.credit : "—"}</div>
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// OFFERS / PRODUCTS PAGE
function HomePage() {
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

// WALLET PAGE
function WalletPage() {
  const [withdrawReq, setWithdrawReq] = useState(false);

  const handleWithdraw = () => {
    setWithdrawReq(true);
    setTimeout(() => {
      alert("Withdraw Request of ₹38,600 has been sent successfully to Admin approval.");
      setWithdrawReq(false);
    }, 1200);
  };

  return (
    <div>
      <SectionTitle title="Wallet Dashboard" sub="View, manage and request commissions" />

      {/* Payout summaries */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "24px" }}>
        <StatCard label="Total Approved Commission" value="₹1,24,800" accent={C.green} icon={<Icons.check size={18} />} />
        <StatCard label="Total Withdrawn" value="₹68,000" accent={C.navyLight} icon={<Icons.withdraw size={18} />} />
        <StatCard label="Pending Commission" value="₹18,200" accent={C.gold} icon={<Icons.clock size={18} />} />
        <StatCard label="Available Balance" value="₹38,600" accent={C.teal} icon={<Icons.wallet size={18} />} />
      </div>

      {/* Action withdraw banner */}
      <div style={{ 
        ...S.card, 
        marginBottom: "24px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        flexWrap: "wrap", 
        gap: "16px",
        background: `linear-gradient(to right, #fff, ${C.bg})`
      }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: C.textLight }}>Withdrawable Balance</div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: C.text, marginTop: "4px" }}>₹38,600</div>
          <div style={{ fontSize: "12px", color: C.textLight, marginTop: "4px" }}>Min payout limit: ₹500 · Directly transfers to verified bank accounts.</div>
        </div>
        <button 
          onClick={handleWithdraw}
          disabled={withdrawReq}
          style={{ ...S.btn("primary"), padding: "14px 28px", fontSize: "14px" }}
        >
          {withdrawReq ? "Processing..." : <> <Icons.withdraw size={16} /> Request Withdrawal </>}
        </button>
      </div>

      {/* Case-wise payouts */}
      <SectionTitle title="Case-wise Earnings Summary" sub="Analytics broken down by active product types" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {CASE_PRODUCTS.map(c => (
          <div key={c.product} style={S.card}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: C.text, marginBottom: "14px" }}>{c.product}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { l: "Total cases", v: c.total, col: C.text },
                { l: "Approved", v: c.approved, col: C.green },
                { l: "Rejected", v: c.rejected, col: C.red },
                { l: "Total Earned", v: c.commission, col: C.tealDim },
              ].map(x => (
                <div key={x.l} style={{ background: C.bg, padding: "8px 10px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "10px", color: C.textLight, fontWeight: 700 }}>{x.l}</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: x.col, marginTop: "2px" }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Wallet Ledger */}
      <SectionTitle title="Wallet Transaction History" sub="Complete historical ledger of credits/debits" action="Export CSV" />
      <div style={{ ...S.card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `1.5px solid ${C.border}` }}>
              {["App ID", "Customer Name", "Product Line", "Bank Provider", "Credit Amount", "Created Date", "Verification Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: C.textMid }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WALLET_STMT.map((row, idx) => (
              <tr 
                key={idx} 
                style={{ 
                  borderBottom: `1px solid ${C.border}`,
                  transition: "background 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", color: C.tealDim }}>{row.app}</td>
                <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", color: C.text }}>{row.name}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textMid }}>{row.product}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                  <span style={S.tag(C.navyLight)}>{row.bank}</span>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: "13px", color: row.credit !== "—" ? C.green : C.textMid }}>
                  {row.credit}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "13px", color: C.textLight }}>{row.date}</td>
                <td style={{ padding: "14px 16px" }}>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// PROFILE PAGE
function ProfilePage({ agent, onLogout }) {
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

// ── Main Responsive Wrapper ───────────────────────────────────────────────────
export default function AgentPanel({ onBackToMain }) {
  const [auth, setAuth] = useState("login"); // login | register | app
  const [page, setPage] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [agent] = useState({ name: "Rajesh Kumar", id: "AG-00123" });

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: <Icons.dashboard size={18} /> },
    { id: "home", label: "Offers", icon: <Icons.star size={18} /> },
    { id: "wallet", label: "Wallet", icon: <Icons.wallet size={18} /> },
    { id: "profile", label: "Profile", icon: <Icons.profile size={18} /> },
  ];

  if (auth === "login") {
    return (
      <LoginPage 
        onLogin={() => setAuth("app")} 
        onRegisterNav={() => setAuth("register")} 
      />
    );
  }

  if (auth === "register") {
    return (
      <RegisterPage onBack={() => setAuth("login")} />
    );
  }

  const views = { 
    dashboard: () => <DashboardPage agent={agent} onTabChange={setPage} />, 
    home: () => <HomePage />, 
    wallet: () => <WalletPage />, 
    profile: () => <ProfilePage agent={agent} onLogout={() => { setAuth("login"); onBackToMain(); }} /> 
  };

  const RenderComp = views[page] || views.dashboard;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: C.bg, 
      display: "flex", 
      flexDirection: isMobile ? "column" : "row",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <div style={{
          width: "240px",
          background: C.navy,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          padding: "24px 16px",
          zIndex: 1000,
          boxSizing: "border-box"
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px", padding: "0 6px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Icons.trending size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 900 }}>GharKaPaisa</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Agent Partner Panel</div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            {NAV_ITEMS.map(n => {
              const active = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "rgba(0,180,216,0.15)" : "transparent",
                    color: active ? C.teal : "rgba(255,255,255,0.6)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "13px",
                    textAlign: "left",
                    transition: "all 0.2s",
                    borderLeft: active ? `3px solid ${C.teal}` : "3px solid transparent"
                  }}
                >
                  {n.icon}
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>

          {/* Small Agent Summary Card at footer */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>RK</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>Rajesh Kumar</div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>AG-00123</div>
              </div>
            </div>
            <button 
              onClick={() => { setAuth("login"); onBackToMain(); }} 
              style={{
                width: "100%",
                padding: "6px 0",
                borderRadius: "6px",
                border: "none",
                background: "rgba(230,57,70,0.15)",
                color: C.red,
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MOBILE HEADER */}
      {isMobile && (
        <div style={{
          background: C.navy,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Icons.trending size={16} color="#fff" />
            </div>
            <span style={{ fontSize: "15px", fontWeight: 900 }}>GharKaPaisa Partner</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Icons.bell size={20} color="rgba(255,255,255,0.7)" />
            <div 
              onClick={() => setPage("profile")}
              style={{ width: "30px", height: "30px", borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
            >
              RK
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ 
        flex: 1, 
        padding: isMobile ? "16px" : "32px",
        marginLeft: isMobile ? "0px" : "240px",
        paddingBottom: isMobile ? "80px" : "32px", // Safe area for mobile footer navigation
        boxSizing: "border-box"
      }}>
        <RenderComp />
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      {isMobile && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "10px 0",
          zIndex: 1000,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.03)",
          boxSizing: "border-box"
        }}>
          {NAV_ITEMS.map(n => {
            const active = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: active ? C.teal : C.textLight,
                  padding: "4px 8px",
                  fontSize: "10px",
                  fontWeight: active ? 700 : 500,
                  transition: "all 0.15s"
                }}
              >
                {n.icon}
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
