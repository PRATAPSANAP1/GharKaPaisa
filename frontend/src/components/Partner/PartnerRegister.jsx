import React, { useState, useEffect } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS, ThemeToggle } from "./ThemeContext";
import { sendOtp, registerPartner, DEV_BYPASS, DEV_CODE } from "../../api/auth.api";

const STEPS = ["Personal", "Business", "Bank", "KYC"];

const COMPANY_TYPES = [
  { label: "Individual / Freelancer", value: "individual" },
  { label: "Sole Proprietorship", value: "sole_proprietor" },
  { label: "Partnership Firm", value: "partnership" },
  { label: "Private Limited Company", value: "private_limited" },
];

export default function PartnerRegister({ onBack }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [success, setSuccess] = useState(null); // { Partner_code }

  // Flat form state for all steps
  const [form, setForm] = useState({
    // Step 0 – Personal
    firstName: "", lastName: "", mobile: "", otp: "",
    email: "", password: "", confirmPassword: "",
    // Step 1 – Business
    address: "", businessCity: "", shopName: "",
    companyType: "sole_proprietor", gst: "",
    // Step 2 – Bank
    bankName: "", accountNumber: "", ifsc: "", accountHolderName: "",
    // Step 3 – KYC text
    aadhaar: "", pan: "",
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(t2 => t2 - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const focusBorder = `1.5px solid ${C.teal}`;
  const inputProps = (key, extra = {}) => ({
    style: { ...S.input, ...extra },
    value: form[key],
    onChange: set(key),
    onFocus: e => (e.target.style.border = focusBorder),
    onBlur: e => (e.target.style.border = `1.5px solid ${C.border}`),
  });

  // ── OTP Send ────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.mobile) return setErr("Please enter your mobile number.");
    setErr("");
    setOtpLoading(true);
    try {
      await sendOtp(form.mobile, "register");
      setOtpSent(true);
      setTimer(30);
      // Dev bypass: auto-fill magic code
      if (DEV_BYPASS) setForm(f => ({ ...f, otp: DEV_CODE }));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step Validation ─────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName.trim()) return "Please enter your first name.";
      if (!form.lastName.trim()) return "Please enter your last name.";
      if (!form.mobile.trim()) return "Please enter your mobile number.";
      if (!otpSent) return "Please click 'Verify Mobile' to send the OTP.";
      if (form.otp.length < 6) return "Please enter the 6-digit OTP.";
      if (!form.email.trim()) return "Please enter your email address.";
      if (form.password.length < 6) return "Password must be at least 6 characters.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
    }
    if (step === 1) {
      if (!form.address.trim()) return "Please enter your current address.";
      if (!form.shopName.trim()) return "Please enter your company/shop name.";
    }
    if (step === 2) {
      if (!form.bankName.trim()) return "Please enter your bank name.";
      if (!form.accountNumber.trim()) return "Please enter your account number.";
      if (!form.ifsc.trim()) return "Please enter your IFSC code.";
      if (!form.accountHolderName.trim()) return "Please enter account holder name.";
    }
    return null;
  };

  // ── Step Submit / Final Register ─────────────────────────────────────────────
  const handleStepSubmit = async () => {
    setErr("");
    const validationErr = validateStep();
    if (validationErr) return setErr(validationErr);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Final step — call the API
    setLoading(true);
    try {
      const res = await registerPartner(form);
      if (res.success) {
        setSuccess(res.data);
      } else {
        setErr(res.message || "Registration failed. Please try again.");
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ ...S.card, padding: "40px 32px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `${C.green}18`, color: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icons.check size={28} />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: C.text, marginBottom: "10px" }}>
              Registration Successful!
            </div>
            <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "20px", lineHeight: 1.6 }}>
              Your partner application has been submitted. Our team will review your KYC and activate your account within 24-48 hours.
            </div>
            <div style={{ background: C.bgSecondary, borderRadius: "12px", padding: "14px 20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Partner Code</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: C.primary, letterSpacing: "4px", marginTop: "4px" }}>{success.Partner_code}</div>
            </div>
            <button onClick={onBack} style={{ ...S.btn("primary"), width: "100%" }}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 16px", boxSizing: "border-box", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", position: "relative" }}>

        {/* Theme toggle */}
        <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 99 }}>
          <ThemeToggle />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <button onClick={onBack} style={{ ...S.btn("ghost"), padding: "6px 8px" }}>
            <Icons.arrowLeft size={18} />
          </button>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Partner Request</div>
        </div>

        {/* Dev mode badge */}
        {DEV_BYPASS && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#F59E0B18", border: "1px solid #F59E0B50",
            borderRadius: "8px", padding: "4px 12px", marginBottom: "16px",
            fontSize: "11px", fontWeight: 700, color: "#F59E0B"
          }}>
            🛠 DEV MODE — OTP auto-fills as <span style={{ fontFamily: "monospace", letterSpacing: "2px" }}>{DEV_CODE}</span>
          </div>
        )}

        {/* Step Progress Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: "4px",
                borderRadius: "99px",
                background: i < step ? C.green : i === step ? C.teal : C.border,
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
            {STEPS[step]} Information
          </div>

          {/* Error */}
          {err && (
            <div style={{
              background: `${C.red}15`, border: `1px solid ${C.red}40`,
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: C.red,
              marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.x size={14} /> {err}
            </div>
          )}

          {/* ── Step 0: Personal ──────────────────────────────────────────────── */}
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={S.label}>First Name</label>
                <input {...inputProps("firstName")} />
              </div>
              <div>
                <label style={S.label}>Last Name</label>
                <input {...inputProps("lastName")} />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Mobile Number</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input {...inputProps("mobile", { flex: 1 })} style={{ ...S.input, flex: 1 }} />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={timer > 0 || otpLoading}
                    style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "110px", padding: "0 10px", opacity: timer > 0 ? 0.7 : 1 }}
                  >
                    {otpLoading ? "Sending…" : timer > 0 ? `${timer}s` : "Verify Mobile"}
                  </button>
                </div>
                {otpSent && (
                  <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icons.check size={12} /> OTP sent to {form.mobile}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Enter OTP</label>
                <input
                  style={{
                    ...S.input,
                    background: otpSent ? C.inputBg : C.bg,
                    color: otpSent ? C.text : C.textLight,
                    cursor: otpSent ? "text" : "not-allowed",
                    opacity: otpSent ? 1 : 0.55,
                    letterSpacing: "6px",
                    textAlign: "center",
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                  maxLength={6}
                  disabled={!otpSent}
                  value={form.otp}
                  onChange={e => setForm(f => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                  onFocus={e => { if (otpSent) e.target.style.border = focusBorder; }}
                  onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Email Address</label>
                <input type="email" {...inputProps("email")} />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input type="password" {...inputProps("password")} />
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input type="password" {...inputProps("confirmPassword")} />
              </div>
            </div>
          )}

          {/* ── Step 1: Business ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Current Full Address</label>
                <input {...inputProps("address")} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Business Location (City)</label>
                <input {...inputProps("businessCity")} />
              </div>
              <div>
                <label style={S.label}>Company / Shop Name</label>
                <input {...inputProps("shopName")} />
              </div>
              <div>
                <label style={S.label}>Company Type</label>
                <select style={S.input} value={form.companyType} onChange={set("companyType")}>
                  {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>GST Number <span style={{ color: C.textLight, fontWeight: 500 }}>(Optional)</span></label>
                <input {...inputProps("gst")} />
              </div>
            </div>
          )}

          {/* ── Step 2: Bank ─────────────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Bank Name</label>
                <input {...inputProps("bankName")} />
              </div>
              <div>
                <label style={S.label}>Account Number</label>
                <input {...inputProps("accountNumber")} />
              </div>
              <div>
                <label style={S.label}>IFSC Code</label>
                <input {...inputProps("ifsc")} style={{ ...S.input, textTransform: "uppercase" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Account Holder Name</label>
                <input {...inputProps("accountHolderName")} />
              </div>
            </div>
          )}

          {/* ── Step 3: KYC ──────────────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={S.label}>Aadhaar Number</label>
                <input {...inputProps("aadhaar")} maxLength={12} />
              </div>
              <div>
                <label style={S.label}>PAN Card Number</label>
                <input {...inputProps("pan")} style={{ ...S.input, textTransform: "uppercase" }} maxLength={10} />
              </div>

              {[
                { title: "Aadhaar Card", desc: "Front & Back (PDF/Image)" },
                { title: "PAN Card", desc: "PDF or Image" },
                { title: "GST Cert.", desc: "Optional" },
                { title: "Cancelled Cheque", desc: "Image of cheque" },
              ].map(u => (
                <div key={u.title} style={{
                  border: `2px dashed ${C.border}`,
                  borderRadius: "12px",
                  padding: "18px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: C.bgSecondary,
                  transition: "border-color 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ color: C.tealDim, marginBottom: "6px" }}><Icons.upload size={20} /></div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{u.title}</div>
                  <div style={{ fontSize: "10px", color: C.textLight, marginTop: "3px" }}>{u.desc} · Max 5MB</div>
                </div>
              ))}

              <div style={{ gridColumn: "1/-1", background: `${C.gold}12`, border: `1px solid ${C.gold}30`, borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontSize: "12px", color: C.gold, fontWeight: 600 }}>
                  ℹ️ Document uploads will be available after initial registration. You can submit them from your Partner Profile dashboard.
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => { setErr(""); step > 0 ? setStep(s => s - 1) : onBack(); }}
              style={{ ...S.btn("outline"), padding: "10px 20px" }}
            >
              {step === 0 ? "← Cancel" : "← Back"}
            </button>
            <button
              type="button"
              onClick={handleStepSubmit}
              disabled={loading}
              style={{ ...S.btn("primary"), padding: "10px 24px", opacity: loading ? 0.8 : 1 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "13px", height: "13px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Submitting…
                </span>
              ) : step === STEPS.length - 1 ? "Submit Registration" : "Next Step →"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
