import React, { useState, useEffect } from "react";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS, ThemeToggle } from "./ThemeContext";
import { sendOtp, verifyOtpLogin, DEV_BYPASS, DEV_CODE } from "../../api/auth.api";
import logo from "../../logo.jpeg";

export default function PartnerLogin({ onLogin, onRegisterNav }) {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const [form, setForm] = useState({ mobile: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [err, setErr] = useState("");

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.mobile) return setErr("Please enter your mobile number.");
    setErr("");
    setLoading(l => ({ ...l, otp: true }));
    try {
      await sendOtp(form.mobile, "login");
      setOtpSent(true);
      setTimer(30);
      // Dev bypass: auto-fill the magic OTP code
      if (DEV_BYPASS) setForm(f => ({ ...f, otp: DEV_CODE }));
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to send OTP. Please try again.";
      setErr(msg);
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  // ── Submit: OTP login flow ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.mobile)   return setErr("Please enter your mobile number.");
    if (!otpSent)       return setErr("Please click 'Verify Mobile' to send the OTP first.");
    if (!form.otp || form.otp.length < 6) return setErr("Please enter the 6-digit OTP.");

    setLoading(l => ({ ...l, login: true }));
    try {
      const res = await verifyOtpLogin(form.mobile, form.otp);
      if (res.success) {
        onLogin(res.data.user);
      } else {
        setErr(res.message || "Login failed. Please try again.");
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Invalid OTP or session expired. Please try again.");
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
      {/* Theme Toggle — top right */}
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 99 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
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
          {DEV_BYPASS && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#F59E0B18", border: "1px solid #F59E0B50",
              borderRadius: "8px", padding: "4px 12px", marginTop: "8px",
              fontSize: "11px", fontWeight: 700, color: "#F59E0B", letterSpacing: "0.3px"
            }}>
              🛠 DEV MODE — OTP auto-fills as <span style={{ fontFamily: "monospace", letterSpacing: "2px" }}>{DEV_CODE}</span>
            </div>
          )}
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
            {/* Mobile Number */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Mobile Number</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="+91 Mobile Number"
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
                  border: `1.5px solid ${otpSent ? C.border : C.border}`,
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
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
