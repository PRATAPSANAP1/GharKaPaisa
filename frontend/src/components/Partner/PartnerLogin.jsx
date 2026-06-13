import React, { useState, useEffect } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS, ThemeToggle } from "./ThemeContext";
import { sendOtp, verifyOtpLogin, loginWithPassword, getMe } from "../../api/auth.api";
import { saveSession } from "../../api/api";
import { auth } from "../../config/firebase";
import { RecaptchaVerifier } from "firebase/auth";
import logo from "../../logo.jpeg";

export default function PartnerLogin({ onLogin, onRegisterNav }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  
  const [form, setForm] = useState({ mobile: "", password: "", otp: "", email: "" });
  const [loginMethod, setLoginMethod] = useState("otp"); // "otp" | "password"
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [err, setErr] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

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
    if (!form.mobile) return setErr("Please enter your mobile number.");
    setErr("");
    setLoading(l => ({ ...l, otp: true }));
    try {
      // Firebase v12: RecaptchaVerifier takes a single config object
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', {
          size: 'invisible',
        });
      }

      const appVerifier = window.recaptchaVerifier;
      const confResult = await sendOtp(form.mobile, appVerifier);
      setConfirmationResult(confResult);
      setOtpSent(true);
      setTimer(30);
    } catch (e) {
      setErr(e.message || "Failed to send OTP. Please try again.");
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

    if (loginMethod === "otp") {
      if (!form.mobile) return setErr("Please enter your mobile number.");
      if (!otpSent) return setErr("Please click 'Verify Mobile' to send the OTP first.");
      if (!form.otp || form.otp.length < 6) return setErr("Please enter the 6-digit OTP.");

      setLoading(l => ({ ...l, login: true }));
      try {
        // verifyOtpLogin returns { success, user, idToken }
        const result = await verifyOtpLogin(confirmationResult, form.otp);
        if (result.success) {
          const profile = await getMe(true);
          onLogin(profile);
        } else {
          setErr("OTP verification failed. Please try again.");
        }
      } catch (e) {
        setErr(e.message || "Invalid OTP or login failed. Please try again.");
      } finally {
        setLoading(l => ({ ...l, login: false }));
      }
    } else {
      if (!form.email) return setErr("Please enter your registered email address.");
      if (!form.password) return setErr("Please enter your password.");

      setLoading(l => ({ ...l, login: true }));
      try {
        // loginWithPassword returns { success, user, idToken }
        // Throws auth/email-not-verified if email is unconfirmed
        const result = await loginWithPassword(form.email, form.password);
        if (result.success) {
          const profile = await getMe(true);
          onLogin(profile);
        } else {
          setErr("Login failed. Please check your credentials.");
        }
      } catch (e) {
        if (e.code === 'auth/email-not-verified') {
          setErr("📧 " + (e.message || "Please verify your email. Check your inbox for the verification link."));
        } else {
          setErr(e.message || "Login failed. Please check credentials and try again.");
        }
      } finally {
        setLoading(l => ({ ...l, login: false }));
      }
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
      {/* Invisible reCAPTCHA Container */}
      <div id="recaptcha-container-login"></div>

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
          <div style={{ fontSize: "24px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>Partner Login</div>
        </div>

        {/* Card */}
        <div style={{ ...S.card, padding: "28px" }}>
          {/* Tabs for Login Type */}
          <div style={{
            display: "flex",
            background: C.bgSecondary,
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "20px",
            border: `1.5px solid ${C.border}`
          }}>
            <button
              type="button"
              onClick={() => { setLoginMethod("otp"); setErr(""); }}
              style={{
                flex: 1,
                border: "none",
                background: loginMethod === "otp" ? C.card : "transparent",
                color: loginMethod === "otp" ? C.text : C.textLight,
                padding: "8px 0",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              OTP Log In
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod("password"); setErr(""); }}
              style={{
                flex: 1,
                border: "none",
                background: loginMethod === "password" ? C.card : "transparent",
                color: loginMethod === "password" ? C.text : C.textLight,
                padding: "8px 0",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Password Log In
            </button>
          </div>

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
            {loginMethod === "otp" ? (
              <>
                {/* Mobile Number */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Mobile Number</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="10-digit Mobile Number"
                      value={form.mobile}
                      onChange={e => setForm({ ...form, mobile: e.target.value })}
                      onFocus={e => e.target.style.border = focusBorder}
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
                      {loading.otp ? "Sending…" : timer > 0 ? `${timer}s` : "Verify Mobile"}
                    </button>
                  </div>
                  {otpSent && (
                    <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icons.check size={12} /> OTP sent to {form.mobile}
                    </div>
                  )}
                </div>

                {/* OTP Verification */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={S.label}>Enter 6-Digit OTP</label>
                  <input
                    style={{
                      ...inputStyle,
                      textAlign: "center",
                      letterSpacing: "8px",
                      fontSize: "20px",
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
                </div>
              </>
            ) : (
              <>
                {/* Email Address */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Email Address</label>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={e => e.target.style.border = focusBorder}
                    onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: "20px" }}>
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
              </>
            )}

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
            New GharKaPaisa Partner?{" "}
            <span
              onClick={onRegisterNav}
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
