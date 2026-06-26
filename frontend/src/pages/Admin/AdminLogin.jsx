import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Icons } from "../../components/Partner/PartnerIcons";
import { useTheme, makeS } from "../../components/Partner/ThemeContext";
import { sendOtp, loginWithOtp, loginWithPassword, forgotPassword, getMe, loginWithMsg91, lookupUser } from "../../api/auth.api";

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

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      return setErr("Please enter your registered email address.");
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim());
    if (!isEmail) {
      return setErr("Please enter a valid email address.");
    }

    setErr("");
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setToast({ message: "Password reset instructions sent. Please check your email.", type: "success" });
      setShowForgot(false);
    } catch (error) {
      setErr(error.message || "Could not send reset instructions.");
    } finally {
      setForgotLoading(false);
    }
  };

  const [captchaContainerId] = useState(`msg91-captcha-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

  // ── MSG91 Web SDK Dynamic Loader ─────────────────────────────────────────
  useEffect(() => {
    const scriptId = "msg91-otp-provider-script";
    
    const initWidget = () => {
      if (typeof window.initSendOTP === 'function') {
        const container = document.getElementById(captchaContainerId);
        if (!container) return;
        if (container.dataset.msg91Initialized === 'true' || container.children.length > 0) {
          return;
        }
        container.dataset.msg91Initialized = 'true';

        window.configuration = {
          widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
          tokenAuth: String(import.meta.env.VITE_MSG91_TOKEN_AUTH) === "true",
          exposeMethods: true,
          captchaRenderId: captchaContainerId,
          success: (data) => {
            console.log('MSG91 admin login widget loaded successfully.', data);
          },
          failure: (error) => {
            console.error('MSG91 admin login widget load failed.', error);
          }
        };

        try {
          window.initSendOTP(window.configuration);
         console.log("========== MSG91 ==========");
console.log("Widget ID:", import.meta.env.VITE_MSG91_WIDGET_ID);
console.log("Container:", captchaContainerId);
console.log("initSendOTP:", window.initSendOTP);
console.log("sendOtp:", window.sendOtp);
console.log("verifyOtp:", window.verifyOtp);
console.log("===========================");
        } catch (e) {
          console.warn("initSendOTP failed in AdminLogin:", e);
        }
      }
    };

    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.querySelector('script[src*="otp-provider.js"]');
      if (script) {
        script.id = scriptId;
      }
    }

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://verify.msg91.com/otp-provider.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
    } else {
      if (typeof window.initSendOTP === 'function') {
        initWidget();
      } else {
        script.addEventListener('load', initWidget);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initWidget);
      }
    };
  }, []);

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

  // ── Send OTP via Email / SMS ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.identity.trim()) return setErr("Please enter your email or mobile number.");
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());
    if (!isEmail && !isMobile) return setErr("Please enter a valid email or 10-digit mobile number.");

    if (otpAttempts >= 3) return setErr("Maximum OTP attempts reached for this session. Please try again later.");

    setErr("");
    setToast(null);
    setLoading(l => ({ ...l, otp: true }));

    // ── Mobile OTP flow via MSG91 SendOTP Web SDK ──────────────────────────────────
    if (isMobile) {
      try {
        // 1. Verify user exists in database first
        const lookupRes = await lookupUser(form.identity.trim());
        if (!lookupRes || !lookupRes.success || !lookupRes.data) {
          throw new Error("User not found. Please register first.");
        }

        // 2. Verify MSG91 sendOtp helper is ready
        if (!window.sendOtp) {
          throw new Error("MSG91 service is temporarily unavailable.");
        }

        window.sendOtp(
          '91' + form.identity.trim(),
          (data) => {
            setOtpSent(true);
            setOtpSentTime(Date.now());
            setOtpAttempts(a => a + 1);
            setTimer(30);
            setToast({ message: 'Verification code sent to your mobile phone via SMS.', type: "success" });
            setLoading(l => ({ ...l, otp: false }));
          },
          (errResponse) => {
            setToast({ message: errResponse?.message || "Failed to send OTP. Please try again.", type: "error" });
            setLoading(l => ({ ...l, otp: false }));
          }
        );
      } catch (e) {
        setToast({ message: e.message || "Failed to send OTP. Please try again.", type: "error" });
        setLoading(l => ({ ...l, otp: false }));
      }
      return;
    }

    // ── Email OTP fallback via AWS SES ───────────────────────────────────────────
    try {
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
      if (method === 'otp') {
        if (!otpSent) return setErr("Please click 'Send OTP' first.");
        if (!form.otp || form.otp.length < 6) return setErr("Please enter the 6-digit OTP.");
        if (!otpSentTime || Date.now() - otpSentTime > 300000) return setErr("OTP expired. Please send a new one.");

        const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());

        // ── Mobile OTP verification flow via MSG91 ─────────────────────────────────
        if (isMobile) {
          if (!window.verifyOtp) {
            throw new Error("MSG91 service is temporarily unavailable.");
          }

          window.verifyOtp(
            form.otp,
            async (verifyData) => {
              try {
                const tokenVal = verifyData?.accessToken || verifyData?.['access-token'] || (typeof verifyData === 'string' ? verifyData : verifyData?.data);
                if (!tokenVal) {
                  throw new Error("Could not retrieve verification token from MSG91.");
                }

                const loginRes = await loginWithMsg91(form.identity.trim(), tokenVal);
                const profile = await getMe(true);
                const role = profile.role?.toUpperCase();
                if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                  throw new Error("Access denied. Admin portal is only for administrators.");
                }

                login(profile, loginRes.idToken);
                if (role === 'ADMIN') navigate('/admin/dashboard');
                else navigate('/superadmin/dashboard');
              } catch (errVal) {
                setErr(errVal.message || "Invalid credentials. Please try again.");
                setLoading(l => ({ ...l, login: false }));
              }
            },
            (errResponse) => {
              setErr(errResponse?.message || "Invalid OTP code entered.");
              setLoading(l => ({ ...l, login: false }));
            }
          );
          return;
        }

        // ── Email OTP verification flow via AWS SES ───────────────────────────────
        const loginRes = await loginWithOtp(form.identity.trim(), form.otp);
        const profile = await getMe(true);
        const role = profile.role?.toUpperCase();
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
          throw new Error("Access denied. Admin portal is only for administrators.");
        }

        login(profile, loginRes.idToken);
        if (role === 'ADMIN') navigate('/admin/dashboard');
        else navigate('/superadmin/dashboard');
      } else {
        if (!form.password || form.password.length < 8) return setErr("Please enter your password.");
        const loginRes = await loginWithPassword(form.identity.trim(), form.password);
        const profile = await getMe(true);
        const role = profile.role?.toUpperCase();
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
          throw new Error("Access denied. Admin portal is only for administrators.");
        }

        login(profile, loginRes.idToken);
        if (role === 'ADMIN') navigate('/admin/dashboard');
        else navigate('/superadmin/dashboard');
      }
    } catch (e) {
      setErr(e.message || "Invalid credentials. Please try again.");
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

          {showForgot ? (
            <form onSubmit={handleForgotSubmit}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>
                  Reset Password
                </div>
                <div style={{ fontSize: "13px", color: C.textSecondary, marginTop: "6px" }}>
                  Enter your registered email to receive password reset instructions
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={S.label}>Registered Email</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                    <Icons.User size={18} />
                  </div>
                  <input
                    style={{ ...inputStyle, paddingLeft: "42px" }}
                    placeholder="Enter your email address"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    onFocus={e => e.target.style.border = focusBorder}
                    onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                style={{
                  ...S.btn("primary"),
                  width: "100%",
                  padding: "13px 0",
                  fontSize: "14px",
                  borderRadius: "10px",
                  opacity: forgotLoading ? 0.8 : 1,
                }}
              >
                {forgotLoading ? "Sending Instructions..." : "Send Reset Link"}
              </button>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setErr("");
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.teal,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
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

             <div
    id={captchaContainerId}
    style={{
        marginTop: "10px",
        display: "flex",
        justifyContent: "center"
    }}
></div>
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

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotEmail(form.identity);
                    setErr("");
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.teal,
                    cursor: 'pointer',
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}
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
