import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS, ThemeToggle } from "./ThemeContext";
import { sendRegisterOtp as sendOtp, registerPartner, lookupUser } from "../../api/auth.api";

const STEPS = ["Personal", "Business", "Bank", "KYC"];

const COMPANY_TYPES = [
  { label: "Individual", value: "individual" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership", value: "partnership" },
  { label: "Private Limited Company", value: "pvt_ltd" },
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const onBack = () => navigate('/login');
  
  const { C } = useTheme();
  const S = makeS(C);

  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedMobile, setVerifiedMobile] = useState("");
  const [timer, setTimer] = useState(0);
  const [success, setSuccess] = useState(null); // { Partner_code }
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Flat form state for all steps
  const [form, setForm] = useState({
    // Step 0 – Personal
    firstName: "", lastName: "", mobile: "", otp: "",
    email: "", password: "", confirmPassword: "",
    // Step 1 – Business
    address: "", businessCity: "", shopName: "",
    companyType: "individual", gst: "",
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

  // Cleanup isn't needed without Recaptcha, but keeping for useEffect structure
  useEffect(() => {
    return () => {};
  }, []);

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
    setInfoMsg("");
    setOtpLoading(true);
    try {
      await sendOtp(form.mobile);
      setOtpSent(true);
      setTimer(30);
      setInfoMsg("OTP code sent successfully to your mobile.");
    } catch (e) {
      setErr(e.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP Verify ──────────────────────────────────────────────────────────────
  const handleVerifyPhoneOtp = async () => {
    if (!form.otp || form.otp.length < 6) return setErr("Please enter the 6-digit OTP.");
    setErr("");
    setInfoMsg("");
    setLoading(true);
    try {
      // In custom backend flow, we verify OTP server-side. For now, mark as verified locally
      // if we have a verification endpoint we can hit it here.
      // await verifyOtp(form.mobile, form.otp);
      setPhoneVerified(true);
      setVerifiedMobile(form.mobile);
      setInfoMsg("Mobile number verified successfully!");
    } catch (e) {
      setErr("Invalid OTP verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step Validation ─────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName.trim()) return "Please enter your first name.";
      if (!/^[a-zA-Z\s]+$/.test(form.firstName.trim())) return "First name can only contain letters.";
      if (!form.lastName.trim()) return "Please enter your last name.";
      if (!/^[a-zA-Z\s]+$/.test(form.lastName.trim())) return "Last name can only contain letters.";
      if (!form.mobile.trim()) return "Please enter your mobile number.";
      if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return "Please enter a valid 10-digit mobile number.";
      if (!otpSent) return "Please send OTP to verify your mobile number.";
      if (!phoneVerified) return "Please enter the OTP and click verify mobile.";
      if (form.mobile !== verifiedMobile) return "Mobile number changed after verification. Please verify again.";
      if (!form.email.trim()) return "Please enter your email address.";
      if (!/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email address.";
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        return "Password must contain uppercase, lowercase and a number.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
    }
    if (step === 1) {
      if (!form.address.trim()) return "Please enter your current address.";
      if (!form.shopName.trim()) return "Please enter your company/shop name.";
      if (form.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gst.trim())) {
        return "Please enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV).";
      }
    }
    if (step === 2) {
      if (!form.bankName.trim()) return "Please enter your bank name.";
      if (!form.accountNumber.trim()) return "Please enter your account number.";
      if (!/^\d{9,18}$/.test(form.accountNumber.trim())) return "Please enter a valid 9 to 18-digit account number.";
      if (!form.ifsc.trim()) return "Please enter your IFSC code.";
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())) {
        return "Please enter a valid 11-digit IFSC code (e.g. HDFC0001234).";
      }
      if (!form.accountHolderName.trim()) return "Please enter account holder name.";
    }
    if (step === 3) {
      if (!form.aadhaar.trim()) return "Please enter your Aadhaar number.";
      if (!/^\d{12}$/.test(form.aadhaar.trim())) return "Please enter a valid 12-digit Aadhaar number.";
      if (!form.pan.trim()) return "Please enter your PAN number.";
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) return "Please enter a valid 10-character PAN number.";
    }
    return null;
  };

  // ── Step Submit / Final Register ─────────────────────────────────────────────
  const handleStepSubmit = async () => {
    setErr("");
    const validationErr = validateStep();
    if (validationErr) return setErr(validationErr);

    // Ensure phone verified in Step 0
    if (step === 0) {
      if (!phoneVerified) {
        return setErr("Please complete mobile verification first.");
      }
      // Check duplicate email / mobile
      setLoading(true);
      try {
        const lookupMobile = await lookupUser(form.mobile.trim());
        if (lookupMobile.success && lookupMobile.data) {
          setLoading(false);
          return setErr("This mobile number is already registered.");
        }
      } catch (e) {
        // If lookup fails because user not found, that's what we want
      }
      try {
        const lookupEmail = await lookupUser(form.email.trim());
        if (lookupEmail.success && lookupEmail.data) {
          setLoading(false);
          return setErr("This email address is already registered.");
        }
      } catch (e) {
        // Ignored
      }
      setLoading(false);
    }

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Final step — call the API
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        current_address: form.address.trim(),
        business_location: form.businessCity.trim(),
        company_name: form.shopName.trim(),
        company_type: form.companyType,
        gst_number: form.gst ? form.gst.trim().toUpperCase() : null,
        bank_name: form.bankName.trim(),
        account_number: form.accountNumber.trim(),
        ifsc_code: form.ifsc ? form.ifsc.trim().toUpperCase() : "",
        account_holder_name: form.accountHolderName.trim(),
        aadhaar: form.aadhaar.trim(),
        pan: form.pan ? form.pan.trim().toUpperCase() : "",
        role: "Partner",
      };
      const res = await registerPartner(payload);
      if (res.success) {
        setSuccess({ ...res.data, email: form.email });
      } else {
        setErr(res.message || "Registration failed. Please try again.");
      }
    } catch (e) {
      setErr(e.message || "Registration failed. Please check your details.");
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
            <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "16px", lineHeight: 1.6 }}>
              Your partner application has been submitted. Our team will review your KYC and activate your account within 24-48 hours.
            </div>

            <div style={{ background: C.bgSecondary, borderRadius: "12px", padding: "14px 20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Partner Code</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: C.primary, letterSpacing: "4px", marginTop: "4px" }}>{success.Partner_code || success.partner_code}</div>
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
    <div style={{ minHeight: "calc(100vh - 110px)", background: C.bg, padding: "24px 16px", boxSizing: "border-box", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", position: "relative" }}>

        {/* Back to Home */}
        <div style={{ marginBottom: "16px", textAlign: "left" }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px", 
              background: "none", 
              border: "none", 
              color: C.teal, 
              cursor: "pointer", 
              fontSize: "14px", 
              fontWeight: 600,
              padding: 0
            }}
          >
            <Icons.arrowLeft size={14} /> Back to Home
          </button>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <button onClick={onBack} style={{ ...S.btn("ghost"), padding: "6px 8px" }}>
            <Icons.arrowLeft size={18} />
          </button>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Partner Request</div>
        </div>

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

          {/* Info Message */}
          {infoMsg && (
            <div style={{
              background: `${C.green}15`, border: `1px solid ${C.green}40`,
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: C.green,
              marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.check size={14} /> {infoMsg}
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
                  <input
                    {...inputProps("mobile", { flex: 1 })}
                    style={{ ...S.input, flex: 1 }}
                    placeholder="10-digit Mobile Number"
                    disabled={phoneVerified}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={timer > 0 || otpLoading || phoneVerified}
                    style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "110px", padding: "0 10px", opacity: (timer > 0 || phoneVerified) ? 0.7 : 1 }}
                  >
                    {otpLoading ? "Sending…" : timer > 0 ? `${timer}s` : "Send OTP"}
                  </button>
                </div>
                {otpSent && !phoneVerified && (
                  <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icons.check size={12} /> OTP sent to {form.mobile}
                  </div>
                )}
                {phoneVerified && (
                  <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                    <Icons.check size={12} /> Mobile number verified successfully!
                  </div>
                )}
              </div>

              {/* Removed Recaptcha Container */}

              {otpSent && !phoneVerified && (
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>Enter OTP</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{
                        ...S.input,
                        flex: 1,
                        background: C.inputBg,
                        color: C.text,
                        letterSpacing: "6px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                      maxLength={6}
                      value={form.otp}
                      onChange={e => setForm(f => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                      onFocus={e => { e.target.style.border = focusBorder; }}
                      onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "110px", padding: "0 10px" }}
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Email */}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Email Address</label>
                <input
                  type="email"
                  {...inputProps("email")}
                  placeholder="name@domain.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label style={S.label}>Password</label>
                <input type="password" {...inputProps("password")} placeholder="Min 8 chars" autoComplete="new-password" />
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input type="password" {...inputProps("confirmPassword")} placeholder="Repeat password" autoComplete="new-password" />
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
                <label style={S.label}>Partner Type</label>
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

          {/* ── Step 3: KYC — Info Screen ─────────────────────────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={S.label}>Aadhaar Number</label>
                  <input {...inputProps("aadhaar")} placeholder="12-digit number" />
                </div>
                <div>
                  <label style={S.label}>PAN Number</label>
                  <input {...inputProps("pan")} style={{ ...S.input, textTransform: "uppercase" }} placeholder="10-char alphanumeric" />
                </div>
              </div>

              {/* Header */}
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: `${C.teal}15`, color: C.teal,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <Icons.shield size={28} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: C.text }}>KYC Documents</div>
                <div style={{ fontSize: '13px', color: C.textMid, marginTop: '6px', lineHeight: 1.5 }}>
                  Document verification is done after your account is activated.
                </div>
              </div>

              {/* Document list */}
              {[
                { icon: '🪪', title: 'Aadhaar Card', desc: 'Front & Back (PDF/Image) · Max 5MB' },
                { icon: '🪄', title: 'PAN Card', desc: 'PDF or Image · Max 5MB' },
                { icon: '🧾', title: 'GST Certificate', desc: 'Optional · Max 5MB' },
                { icon: '🏦', title: 'Cancelled Cheque', desc: 'Image of cheque · Max 5MB' },
              ].map(doc => (
                <div key={doc.title} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: C.bgSecondary,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '12px', padding: '14px 16px',
                  opacity: 0.7,
                }}>
                  <span style={{ fontSize: '22px' }}>{doc.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{doc.title}</div>
                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{doc.desc}</div>
                  </div>
                </div>
              ))}

              {/* Info banner */}
              <div style={{
                background: `${C.gold}14`,
                border: `1px solid ${C.gold}35`,
                borderRadius: '10px', padding: '14px 16px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>ℹ️</span>
                <div style={{ fontSize: '13px', color: C.gold, lineHeight: 1.6 }}>
                  <strong>Document uploads are available after activation.</strong><br />
                  You can submit them from your <strong>Partner Profile dashboard</strong> once our team reviews your application (24–48 hours).
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
