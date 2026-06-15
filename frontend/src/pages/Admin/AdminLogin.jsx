import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Icons } from "../../components/Partner/PartnerIcons";
import { useTheme, makeS, ThemeToggle } from "../../components/Partner/ThemeContext";
import { sendOtp, verifyOtpLogin, loginWithPassword, getMe, lookupUser } from "../../api/auth.api";
import { auth } from "../../config/firebase";
import { RecaptchaVerifier } from "firebase/auth";
import logo from "../../logo.jpeg";

export default function AdminLogin() {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [form, setForm] = useState({ identity: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [err, setErr] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resolvedCredentials, setResolvedCredentials] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Clear OTP state on input change
  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setConfirmationResult(null);
    setOtpSentTime(null);
  }, [form.identity, form.password]);

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // Cleanup recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");
    if (!form.password) return setErr("Please enter your password.");
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());
    if (!isEmail && !isMobile) return setErr("Please enter a valid email or 10-digit mobile number.");

    if (otpAttempts >= 3) return setErr("Maximum OTP attempts reached for this session. Please try again later.");

    setErr("");
    setLoading(l => ({ ...l, otp: true }));
    try {
      // 1. Look up user by email or mobile to get their email and mobile
      const lookupRes = await lookupUser(form.identity.trim());
      if (!lookupRes.success || !lookupRes.data) {
        throw new Error("Invalid credentials. Please check your details and try again.");
      }
      const { email, mobile } = lookupRes.data;
      if (!email || !mobile) {
        throw new Error("Invalid credentials. Please check your details and try again.");
      }

      // 2. Send OTP to their registered mobile number
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const appVerifier = window.recaptchaVerifier;
      const confResult = await sendOtp(mobile, appVerifier);
      setConfirmationResult(confResult);
      setResolvedCredentials({ email, mobile });
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setOtpAttempts(a => a + 1);
      setTimer(30);
    } catch (e) {
      setErr("Invalid credentials. Please check your details and try again.");
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (recaptchaErr) {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  // ── Submit Login Form ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");
    if (!form.password) return setErr("Please enter your password.");
    if (!otpSent) return setErr("Please click 'Send OTP' first.");
    if (!form.otp || form.otp.length < 6) return setErr("Please enter the 6-digit OTP.");
    if (!confirmationResult) return setErr("OTP session expired. Please send OTP again.");
    if (!otpSentTime || Date.now() - otpSentTime > 120000) return setErr("OTP expired. Please send a new one.");

    setLoading(l => ({ ...l, login: true }));
    try {
      const result = await verifyOtpLogin(confirmationResult, form.otp);
      if (result.success) {
        try {
          await loginWithPassword(resolvedCredentials.email, form.password);
        } catch (passErr) {
          auth.signOut();
          throw new Error("Invalid credentials. Please check your details and try again.");
        }
        const profile = await getMe(true);
        
        // Use Zustand auth store to set login state, and pass idToken
        login(profile, result.idToken);
        
        // Navigate based on role
        const role = profile.role.toLowerCase();
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'superadmin') navigate('/superadmin/dashboard');
        else navigate('/partner/dashboard');
      } else {
        setErr("OTP verification failed. Please try again.");
      }
    } catch (e) {
      setErr(e.message || "Invalid credentials. Please check your details and try again.");
    } finally {
      setLoading(l => ({ ...l, login: false }));
    }
  };

  const inputStyle = { ...S.input };
  const focusBorder = `1.5px solid ${C.teal}`;

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
      transition: "background 0.3s",
    }}>
      <button 
        onClick={() => navigate('/')}
        style={{ position: "fixed", top: "16px", left: "16px", zIndex: 99, display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: C.text, cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
      >
        <Icons.arrowLeft size={16} /> Home
      </button>

      {/* Theme Toggle — top right */}
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 99 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src={logo}
            alt="GharKaPaisa Logo"
            style={{
              width: "100%",
              maxWidth: "100px",
              height: "auto",
              borderRadius: "10px",
              objectFit: "contain",
              marginBottom: "14px",
              boxShadow: "0 4px 12px rgba(10,17,40,0.12)"
            }}
          />
          <div style={{ fontSize: "24px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>Admin Login</div>
        </div>

        {/* Card */}
        <div style={{ ...S.card, padding: "28px" }}>
          {/* Error Banner */}
          {err && (
            <div style={{
              background: `${C.red}15`,
              border: `1px solid ${C.red}40`,
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              color: C.red,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <Icons.x size={14} /> {err}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email or Mobile */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Email or Mobile Number</label>
              <input
                style={inputStyle}
                placeholder="Enter email or mobile number"
                value={form.identity}
                onChange={e => setForm({ ...form, identity: e.target.value })}
                onFocus={e => e.target.style.border = focusBorder}
                onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Password</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={e => e.target.style.border = focusBorder}
                onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
              />
            </div>

            {/* OTP Verification */}
            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Enter 6-Digit OTP</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  style={{
                    ...inputStyle,
                    flex: 1,
                    textAlign: "center",
                    letterSpacing: "4px",
                    fontWeight: 700,
                    background: otpSent ? C.inputBg : C.bg,
                    color: otpSent ? C.text : C.textLight,
                    cursor: otpSent ? "text" : "not-allowed",
                    opacity: otpSent ? 1 : 0.55,
                    border: `1.5px solid ${C.border}`,
                  }}
                  placeholder="••••••"
                  maxLength={6}
                  disabled={!otpSent}
                  value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value.replace(/\D/g, "") })}
                  onFocus={e => { if (otpSent) e.target.style.border = focusBorder; }}
                  onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={timer > 0 || loading.otp}
                  style={{
                    ...S.btn("sm"),
                    whiteSpace: "nowrap",
                    width: "110px",
                    padding: "0 10px",
                    opacity: (timer > 0 || loading.otp) ? 0.7 : 1,
                  }}
                >
                  {loading.otp ? "Sending…" : timer > 0 ? `${timer}s` : "Send OTP"}
                </button>
              </div>
              {otpSent && resolvedCredentials && (
                <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.check size={12} /> OTP sent to registered mobile {resolvedCredentials.mobile.replace(/.(?=.{4})/g, "*")}
                </div>
              )}
              {/* Invisible reCAPTCHA Container */}
              <div id="recaptcha-container" style={{ display: "none" }}></div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading.login}
              style={{
                ...S.btn("primary"),
                width: "100%",
                padding: "13px 0",
                fontSize: "14px",
                borderRadius: "10px",
                marginTop: "4px",
                opacity: loading.login ? 0.8 : 1,
              }}
            >
              {loading.login ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <span style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Verifying…
                </span>
              ) : "Secure Log In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: C.textLight }}>
            New Admin?{" "}
            <span
              onClick={() => navigate('/admin-register')}
              style={{ color: C.tealDim, cursor: "pointer", fontWeight: 700 }}
            >
              Register
            </span>
          </div>

        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
