import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Icons } from "../../components/Partner/PartnerIcons";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { sendOtp, loginWithOtp, loginWithPassword, getMe, lookupUser } from "../../api/auth.api";

export default function AdminLogin() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  // Login Form States
  const [form, setForm] = useState({ identity: "", password: "", otp: "" });
  const [loginMode, setLoginMode] = useState("password"); // "password" | "otp"
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [resolvedCredentials, setResolvedCredentials] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [otpAttempts, setOtpAttempts] = useState(0);

  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Reset OTP timer on login countdown
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Reset states on mode/view changes
  useEffect(() => {
    setErr("");
    setInfoMsg("");
    setOtpSent(false);
    setTimer(0);
  }, [loginMode]);

  // ── Send Login OTP ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());
    if (!isEmail && !isMobile) return setErr("Please enter a valid email or 10-digit mobile number.");

    if (otpAttempts >= 3) return setErr("Maximum OTP attempts reached for this session. Please try again later.");

    setErr("");
    setInfoMsg("");
    setLoading(l => ({ ...l, otp: true }));
    try {
      const lookupRes = await lookupUser(form.identity.trim());
      if (!lookupRes.success || !lookupRes.data) {
        throw new Error("Invalid credentials. Please check your details and try again.");
      }
      const { email, mobile } = lookupRes.data;
      if (!email || !mobile) {
        throw new Error("Invalid credentials. Please check your details and try again.");
      }

      await sendOtp(mobile);
      
      setResolvedCredentials({ email, mobile });
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setOtpAttempts(a => a + 1);
      setTimer(30);
    } catch (e) {
      setErr(e.message || "Invalid credentials. Please check your details and try again.");
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  // ── Submit Login Form ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfoMsg("");

    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");

    setLoading(l => ({ ...l, login: true }));
    try {
      let loginRes;
      if (loginMode === "password") {
        if (!form.password) {
          setLoading(l => ({ ...l, login: false }));
          return setErr("Please enter your password.");
        }
        loginRes = await loginWithPassword(form.identity.trim(), form.password);
      } else {
        // OTP Login
        if (!otpSent) {
          setLoading(l => ({ ...l, login: false }));
          return setErr("Please click 'Send OTP' first.");
        }
        if (!form.otp || form.otp.length < 6) {
          setLoading(l => ({ ...l, login: false }));
          return setErr("Please enter the 6-digit OTP.");
        }
        if (!otpSentTime || Date.now() - otpSentTime > 120000) {
          setLoading(l => ({ ...l, login: false }));
          return setErr("OTP expired. Please send a new one.");
        }
        loginRes = await loginWithOtp(form.identity.trim(), form.otp);
      }
      
      // Fetch user profile info
      const profile = await getMe(true);
      
      const role = profile.role.toLowerCase();
      if (role !== 'admin' && role !== 'superadmin' && role !== 'super_admin') {
        throw new Error("Access denied. Admin portal is only for administrators.");
      }

      login(profile, loginRes.idToken);
      
      if (role === 'admin') navigate('/admin/dashboard');
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

          {infoMsg && (
            <div style={{
              background: `${C.green}15`, border: `1px solid ${C.green}40`,
              borderRadius: "10px", padding: "10px 14px", fontSize: "13px",
              color: C.green, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.check size={14} /> {infoMsg}
            </div>
          )}

          {/* Modern Custom Tabs */}
          <div style={{
            display: "flex",
            background: C.bgSecondary,
            padding: "4px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: `1px solid ${C.border}`,
          }}>
            <button
              type="button"
              onClick={() => setLoginMode("password")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: "8px",
                border: "none",
                background: loginMode === "password" ? C.teal : "transparent",
                color: loginMode === "password" ? "#fff" : C.textSecondary,
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("otp")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: "8px",
                border: "none",
                background: loginMode === "otp" ? C.teal : "transparent",
                color: loginMode === "otp" ? "#fff" : C.textSecondary,
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              OTP Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit}>
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

            {loginMode === "password" ? (
              <>
                {/* Password */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Password</label>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                      <Icons.Lock size={18} />
                    </div>
                    <input
                      style={{ ...inputStyle, paddingLeft: "42px", paddingRight: "42px" }}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={e => e.target.style.border = focusBorder}
                      onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: C.textSecondary,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* OTP Verification Input */}
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
                      <Icons.check size={12} /> OTP sent to {resolvedCredentials.mobile.replace(/.(?=.{4})/g, "*")}
                    </div>
                  )}
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
                marginTop: "20px",
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
