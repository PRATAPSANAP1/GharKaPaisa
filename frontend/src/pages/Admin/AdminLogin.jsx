import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Icons } from "../../components/Partner/PartnerIcons";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { sendOtp, loginWithOtp, loginWithPassword, forgotPassword, getMe } from "../../api/auth.api";

// ── Toast Notification Component ─────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  const isSuccess = type === "success";

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        minWidth: 280,
        maxWidth: 400,
        padding: "14px 20px",
        borderRadius: "12px",
        background: isSuccess ? "#059669" : "#DC2626",
        color: "#fff",
        fontSize: "13px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: isSuccess
          ? "0 8px 24px rgba(5,150,105,0.35)"
          : "0 8px 24px rgba(220,38,38,0.35)",
        animation: "toastSlideIn 0.35s ease-out",
      }}
    >
      <span style={{ fontSize: "18px", flexShrink: 0 }}>
        {isSuccess ? "✅" : "❌"}
      </span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      <span
        onClick={onClose}
        style={{ cursor: "pointer", opacity: 0.7, fontSize: "16px", flexShrink: 0 }}
      >
        ✕
      </span>
    </div>
  );
}

export default function AdminLogin() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  // Login Form States
  const [form, setForm] = useState({ identity: "", otp: "", password: "" });
  const [method, setMethod] = useState('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [resolvedCredentials, setResolvedCredentials] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [otpAttempts, setOtpAttempts] = useState(0);

  const [err, setErr] = useState("");
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // Reset OTP state on identifier change
  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setOtpSentTime(null);
  }, [form.identity]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // ── Send OTP via Email ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());
    if (!isEmail && !isMobile) return setErr("Please enter a valid email or 10-digit mobile number.");

    if (otpAttempts >= 3) return setErr("Maximum OTP attempts reached for this session. Please try again later.");

    setErr("");
    setToast(null);
    setLoading(l => ({ ...l, otp: true }));
    try {
      // Send OTP — backend resolves user email and sends via AWS SES
      const otpRes = await sendOtp(form.identity.trim());
      
      setResolvedCredentials({ maskedEmail: otpRes.email || '****@****.com' });
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setOtpAttempts(a => a + 1);
      setTimer(30);
      setToast({ message: `OTP sent to your registered email (${otpRes.email || '****@****.com'})`, type: "success" });
    } catch (e) {
      setToast({ message: e.message || "Failed to send OTP. Please try again.", type: "error" });
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  // ── Submit Login Form ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setToast(null);

    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");

    setLoading(l => ({ ...l, login: true }));
    try {
      let loginRes;

      if (method === 'otp') {
        if (!otpSent) return setErr("Please click 'Send OTP' first.");
        if (!form.otp || form.otp.length < 6) return setErr("Please enter the 6-digit OTP.");
        if (!otpSentTime || Date.now() - otpSentTime > 300000) return setErr("OTP expired. Please send a new one.");

        loginRes = await loginWithOtp(form.identity.trim(), form.otp);
      } else {
        if (!form.password || form.password.length < 8) return setErr("Please enter your password.");
        loginRes = await loginWithPassword(form.identity.trim(), form.password);
      }

      const profile = await getMe(true);
      const role = profile.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        throw new Error("Access denied. Admin portal is only for administrators.");
      }

      login(profile, loginRes.idToken);
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/superadmin/dashboard');
    } catch (e) {
      setErr(e.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(l => ({ ...l, login: false }));
    }
  };

  const inputStyle = { ...S.input };
  const focusBorder = `1.5px solid ${C.teal}`;

  return (
    <div style={{
      minHeight: "calc(100vh - 110px)",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
      transition: "background 0.3s",
    }}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{ width: "100%", maxWidth: "400px" }}>
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
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>
            Admin Login
          </div>
          <div style={{ fontSize: "14px", color: C.textSecondary, marginTop: "6px" }}>
            Access the administrative management panel
          </div>
        </div>

        {/* Form Card */}
        <div style={{ ...S.card, padding: "28px" }}>
          {err && (
            <div style={{
              background: `${C.red}15`, border: `1px solid ${C.red}40`,
              borderRadius: "10px", padding: "10px 14px", fontSize: "13px",
              color: C.red, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.x size={14} /> {err}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Login Method Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setMethod('otp')}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: method === 'otp' ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                  background: method === 'otp' ? C.inputBg : 'transparent',
                  color: C.text,
                  cursor: 'pointer',
                }}
              >
                Login with OTP
              </button>
              <button
                type="button"
                onClick={() => setMethod('password')}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: method === 'password' ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                  background: method === 'password' ? C.inputBg : 'transparent',
                  color: C.text,
                  cursor: 'pointer',
                }}
              >
                Login with Password
              </button>
            </div>

            {/* Email or Mobile */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Email or Mobile Number</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                  <Icons.User size={18} />
                </div>
                <input
                  style={{ ...inputStyle, paddingLeft: "42px" }}
                  placeholder="Enter email or mobile number"
                  value={form.identity}
                  onChange={e => setForm({ ...form, identity: e.target.value })}
                  onFocus={e => e.target.style.border = focusBorder}
                  onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                />
              </div>
            </div>

            {method === 'password' ? (
              <div style={{ marginBottom: "20px" }}>
                <label style={S.label}>Password</label>
                <input
                  style={{ ...inputStyle }}
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={e => e.target.style.border = focusBorder}
                  onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                />
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const email = form.identity.trim() || window.prompt('Enter your registered email to receive reset instructions:');
                      if (!email) return;
                      try {
                        await forgotPassword(email);
                        setToast({ message: 'Password reset instructions sent.', type: 'success' });
                      } catch (error) {
                        setToast({ message: error.message || 'Could not send reset instructions.', type: 'error' });
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.teal,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            ) : (
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
              </div>
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
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
