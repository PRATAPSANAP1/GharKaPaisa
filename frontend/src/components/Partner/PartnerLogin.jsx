import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS, ThemeToggle } from "./ThemeContext";
import { sendOtp, verifyOtpLogin, loginWithPassword, getMe, lookupUser } from "../../api/auth.api";
import logo from "../../logo.png";

export default function PartnerLogin() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  
  const [form, setForm] = useState({ identity: "", password: "", otp: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false, reset: false });
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [resolvedCredentials, setResolvedCredentials] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Clear OTP state on input change
  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setOtpSentTime(null);
  }, [form.identity, form.password]);

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // ── Forgot Password ──────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!form.identity.trim()) {
      return setErr(t('partner.errors.emailOrMobileResetErr', 'Please enter your email or mobile to reset password.'));
    }
    setErr("");
    setInfoMsg("");
    setLoading(l => ({ ...l, reset: true }));
    try {
      // Mocked for now - we will build this endpoint later if requested
      // await sendPasswordReset(form.identity);
      setTimeout(() => {
        setInfoMsg(t('partner.errors.resetSentSuccess', { identity: form.identity, defaultValue: `Password reset instructions sent to ${form.identity}` }));
        setLoading(l => ({ ...l, reset: false }));
      }, 1000);
    } catch (e) {
      setErr(t('partner.errors.failedSendReset', 'Failed to send reset link.'));
      setLoading(l => ({ ...l, reset: false }));
    }
  };

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.identity.trim()) return setErr(t('partner.errors.enterEmailOrMobile', 'Please enter your email or mobile number.'));
    if (!form.password) return setErr(t('partner.errors.enterPassword', 'Please enter your password.'));
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());
    if (!isEmail && !isMobile) return setErr(t('partner.errors.validEmailMobile', 'Please enter a valid email or 10-digit mobile number.'));

    if (otpAttempts >= 3) return setErr(t('partner.errors.maxOtpAttempts', 'Maximum OTP attempts reached for this session. Please try again later.'));

    setErr("");
    setInfoMsg("");
    setLoading(l => ({ ...l, otp: true }));
    try {
      // Look up user to get mobile
      const lookupRes = await lookupUser(form.identity.trim());
      if (!lookupRes.success || !lookupRes.data) {
        throw new Error(t('partner.errors.invalidCredentials', 'Invalid credentials. Please check your details and try again.'));
      }
      const { email, mobile } = lookupRes.data;
      if (!email || !mobile) {
        throw new Error(t('partner.errors.invalidCredentials', 'Invalid credentials. Please check your details and try again.'));
      }

      await sendOtp(mobile);
      
      setResolvedCredentials({ email, mobile });
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setOtpAttempts(a => a + 1);
      setTimer(30);
    } catch (e) {
      setErr(e.message || t('partner.errors.invalidCredentials', 'Invalid credentials. Please check your details and try again.'));
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  // ── Submit Login Form ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfoMsg("");

    if (!form.identity.trim()) return setErr(t('partner.errors.enterEmailOrMobile', 'Please enter your email or mobile number.'));
    if (!form.password) return setErr(t('partner.errors.enterPassword', 'Please enter your password.'));
    if (!otpSent) return setErr(t('partner.errors.clickSendOtp', "Please click 'Send OTP' first."));
    if (!form.otp || form.otp.length < 6) return setErr(t('partner.errors.enterOtpCode', 'Please enter the 6-digit OTP.'));
    if (!otpSentTime || Date.now() - otpSentTime > 120000) return setErr(t('partner.errors.otpExpired', 'OTP expired. Please send a new one.'));

    setLoading(l => ({ ...l, login: true }));
    try {
      // 1. Verify OTP
      const otpRes = await verifyOtpLogin(resolvedCredentials.mobile, form.otp);
      
      // 2. Verify Password + Get JWT Token
      const loginRes = await loginWithPassword(resolvedCredentials.email, form.password);
      
      // 3. Fetch profile and dispatch to Store
      const profile = await getMe(true);
      login(profile, loginRes.idToken);
      
      const role = profile.role.toLowerCase();
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'superadmin') navigate('/superadmin/dashboard');
      else navigate('/partner/dashboard');
      
    } catch (e) {
      setErr(e.message || t('partner.errors.invalidCredentials', 'Invalid credentials. Please try again.'));
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
            <Icons.arrowLeft size={14} /> {t('partner.backToHome', 'Back to Home')}
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>{t('partner.partnerLogin', 'Partner Login')}</div>
        </div>

        {/* Card */}
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

          <form onSubmit={handleSubmit}>
            {/* Email or Mobile */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>{t('partner.emailOrMobile', 'Email or Mobile Number')}</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                  <Icons.User size={18} />
                </div>
                <input
                  style={{ ...inputStyle, paddingLeft: "42px" }}
                  placeholder={t('partner.enterEmailOrMobile', 'Enter email or mobile number')}
                  value={form.identity}
                  onChange={e => setForm({ ...form, identity: e.target.value })}
                  onFocus={e => e.target.style.border = focusBorder}
                  onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "10px" }}>
              <label style={S.label}>{t('partner.password', 'Password')}</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                  <Icons.Lock size={18} />
                </div>
                <input
                  style={{ ...inputStyle, paddingLeft: "42px", paddingRight: "42px" }}
                  type={showPassword ? "text" : "password"}
                  placeholder={t('partner.enterPassword', 'Enter password')}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={e => e.target.style.border = focusBorder}
                  onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: "right", marginBottom: "16px" }}>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={loading.reset}
                style={{ background: "none", border: "none", color: C.teal, fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, opacity: loading.reset ? 0.7 : 1 }}
              >
                {loading.reset ? t('partner.sendingResetLink', 'Sending reset link...') : t('partner.forgotPassword', 'Forgot Password?')}
              </button>
            </div>

            {/* OTP Verification */}
            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>{t('partner.enterOtp', 'Enter 6-Digit OTP')}</label>
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
                  {loading.otp ? t('partner.sending', 'Sending…') : timer > 0 ? `${timer}s` : t('partner.sendOtp', 'Send OTP')}
                </button>
              </div>
              {otpSent && resolvedCredentials && (
                <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icons.check size={12} /> {t('partner.errors.otpSentSuccess', 'OTP code sent successfully to your mobile.')} ({resolvedCredentials.mobile.replace(/.(?=.{4})/g, "*")})
                </div>
              )}
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
                  {t('partner.verifying', 'Verifying…')}
                </span>
              ) : t('partner.secureLogIn', 'Secure Log In')}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: C.textLight }}>
            {t('partner.newPartner', 'New GharKaPaisa Partner?')}{" "}
            <span
              onClick={() => navigate('/register')}
              style={{ color: C.tealDim, cursor: "pointer", fontWeight: 700 }}
            >
              {t('partner.register', 'Register')}
            </span>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
