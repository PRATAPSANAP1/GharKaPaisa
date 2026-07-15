import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../app/store/authStore";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useMsg91OTP } from "../../../hooks/useMsg91OTP";
import { sendOtp, loginWithOtp, loginWithPassword, forgotPassword, getMe, loginWithMsg91, lookupUser } from "../../../services/auth.api.js";
import { FaHandshake, FaUserCog, FaCrown, FaBriefcase, FaArrowLeft } from 'react-icons/fa';
import LanguageSwitcher from "../../../components/LanguageSwitcher/LanguageSwitcher";

import logoImg from "../../../assets/logos/logo.png";
import welcomeBgImg from "../register/welcome pg-bg.png";

// Toast Notification
function Toast({ message, type = "success", onClose }) {
  const isSuccess = type === "success";
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      right: "24px",
      zIndex: 9999,
      background: isSuccess ? "#F0FDF4" : "#FEF2F2",
      color: isSuccess ? "#14532D" : "#7F1D1D",
      padding: "14px 20px",
      borderRadius: "14px",
      border: `2px solid ${isSuccess ? "#22C55E" : "#EF4444"}`,
      boxShadow: isSuccess
        ? "0 8px 32px rgba(34, 197, 94, 0.18), 0 2px 8px rgba(0,0,0,0.08)"
        : "0 8px 32px rgba(239, 68, 68, 0.18), 0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "14px",
      fontWeight: 600,
      minWidth: "280px",
      maxWidth: "380px",
      animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      {/* Icon circle */}
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: isSuccess ? "#DCFCE7" : "#FEE2E2",
        border: `1.5px solid ${isSuccess ? "#22C55E" : "#EF4444"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        {isSuccess
          ? <span style={{ fontSize: "16px" }}>✓</span>
          : <span style={{ fontSize: "16px" }}>✕</span>
        }
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px", opacity: 0.7, marginBottom: "2px" }}>
          {isSuccess ? "SUCCESS" : "ERROR"}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }}>{message}</div>
      </div>
      <span
        onClick={onClose}
        style={{
          cursor: "pointer",
          opacity: 0.5,
          fontSize: "16px",
          fontWeight: 700,
          flexShrink: 0,
          transition: "opacity 0.15s"
        }}
        onMouseEnter={e => e.target.style.opacity = 1}
        onMouseLeave={e => e.target.style.opacity = 0.5}
      >✕</span>
    </div>
  );
}


export default function PartnerLogin() {
  const { C, isDark } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const loginStore = useAuthStore((state) => state.login);

  const [form, setForm] = useState({ identity: "", otp: "", password: "" });
  const [method, setMethod] = useState("password"); // "password" or "otp"

  // MSG91 OTP SDK readiness
  const { sdkReady } = useMsg91OTP();

  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [err, setErr] = useState("");
  const [toast, setToast] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs for 6 OTP input boxes
  const otpInputs = useRef([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const verifyingRef = useRef(false);

  // Forgot Mobile / Forgot Password modal states
  const [showForgotMobileModal, setShowForgotMobileModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Handle forgot password submit
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return setForgotError(t('partner.errors.enterEmail', 'Please enter your registered email address.'));
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim());
    if (!isEmail) return setForgotError(t('partner.errors.validEmail', 'Please enter a valid email address.'));
    
    setForgotError("");
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (error) {
      setForgotError(error.message || t('partner.errors.forgotPasswordFailed', 'Failed to send reset link. Please try again.'));
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotEmail("");
    setForgotLoading(false);
    setForgotSuccess(false);
    setForgotError("");
  };

  // Reset OTP state when username/identity changes
  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setOtpSentTime(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setForm(f => ({ ...f, otp: "" }));
    verifyingRef.current = false;
  }, [form.identity]);

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // Synchronize otp digits array with flat form OTP string
  useEffect(() => {
    setForm(f => ({ ...f, otp: otpDigits.join("") }));
  }, [otpDigits]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    const code = otpDigits.join("");
    if (code.length === 6 && otpSent && method === "otp" && !loading.login) {
      handleSubmit(null, code);
    }
  }, [otpDigits]); // eslint-disable-line react-hooks/exhaustive-deps

  // Web OTP API — auto-fill from SMS on Android Chrome
  useEffect(() => {
    if (!otpSent || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then(credential => {
        if (credential?.code) {
          const digits = credential.code.replace(/\D/g, '').slice(0, 6).split('');
          const filled = [...digits, ...Array(6 - digits.length).fill('')];
          setOtpDigits(filled);
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, [otpSent]);

  const handleRoleSelect = (roleName) => {
    setSelectedRole(roleName);
    localStorage.setItem("gkp_last_role", roleName);
  };

  const handleOtpDigitChange = (value, index) => {
    const cleanVal = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    if (cleanVal && index < 5) otpInputs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpInputs.current[index - 1]?.focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, i) => { newDigits[i] = d; });
    setOtpDigits(newDigits);
    otpInputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    console.log('[MSG91] Send OTP button clicked (PartnerLogin)');
    setErr("");

    if (!form.identity.trim()) return setErr(t('partner.errors.enterEmailOrMobile', 'Please enter your email or mobile number.'));
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());
    if (!isEmail && !isMobile) return setErr(t('partner.errors.validEmailMobile', 'Please enter a valid email or 10-digit mobile number.'));

    setErr("");
    setToast(null);
    setLoading(l => ({ ...l, otp: true }));

    // ── Mobile OTP flow via MSG91 Web SDK ──
    if (isMobile) {
      try {
        // 1. Verify user exists in database first
        const lookupRes = await lookupUser(form.identity.trim());
        if (!lookupRes || !lookupRes.success || !lookupRes.data?.exists) {
          throw new Error(t('partner.errors.userNotFound', 'No account found with this mobile number.'));
        }

        // 2. Verify MSG91 sendOtp helper is ready
        if (!sdkReady) {
          throw new Error(t("partner.errors.msg91NotLoaded", "OTP provider is loading. Please wait a moment and try again."));
        }

        let callbackFired = false;
        const timeoutId = setTimeout(() => {
          if (!callbackFired) {
            callbackFired = true;
            console.error('[MSG91] Send OTP callback timeout');
            setToast({ message: t("partner.errors.msg91Timeout", "OTP provider did not respond. Please refresh and try again."), type: "error" });
            setLoading(l => ({ ...l, otp: false }));
          }
        }, 15000);

        const formattedMobile = '91' + form.identity.trim();
        console.log(`[MSG91] Calling window.sendOtp for: ${formattedMobile}`);

        window.sendOtp(
          formattedMobile,
          (data) => {
            if (callbackFired) return;
            callbackFired = true;
            clearTimeout(timeoutId);
            setOtpSent(true);
            setOtpSentTime(Date.now());
            setTimer(60);
            setToast({ message: t('partner.errors.otpSentSuccessMobile', 'Verification code sent to your mobile phone via SMS.'), type: "success" });
            setLoading(l => ({ ...l, otp: false }));
          },
          (errResponse) => {
            if (callbackFired) return;
            callbackFired = true;
            clearTimeout(timeoutId);
            setToast({ message: errResponse?.message || t('partner.errors.otpSendFailed', 'Failed to send OTP. Please try again.'), type: "error" });
            setLoading(l => ({ ...l, otp: false }));
          }
        );
      } catch (e) {
        console.error('[MSG91] Exception caught sending mobile OTP:', e);
        setToast({ message: e.message || t('partner.errors.otpSendFailed', 'Failed to send OTP. Please try again.'), type: "error" });
        setLoading(l => ({ ...l, otp: false }));
      }
      return;
    }

    // ── Email OTP fallback via AWS SES ──
    try {
      console.log(`[Email OTP] Sending email OTP to: ${form.identity.trim()}`);
      const otpRes = await sendOtp(form.identity.trim());
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setTimer(30);
      setToast({ message: t('partner.errors.otpSentSuccess', 'OTP sent to your registered email') + ` (${otpRes.email || '****@****.com'})`, type: "success" });
    } catch (e) {
      console.error('[Email OTP] Failure:', e);
      setToast({ message: e.message || t('partner.errors.otpSendFailed', 'Failed to send OTP. Please try again.'), type: "error" });
    } finally {
      setLoading(l => ({ ...l, otp: false }));
    }
  };

  // ── Submit Login ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e, codeOverride) => {
    if (e) e.preventDefault();
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setErr("");
    setToast(null);
    if (!form.identity.trim()) {
      verifyingRef.current = false;
      return setErr(t('partner.errors.enterEmailOrMobile', 'Please enter your email or mobile number.'));
    }

    setLoading(l => ({ ...l, login: true }));
    try {
      let loginRes;
      if (method === 'otp') {
        if (!otpSent) {
          setLoading(l => ({ ...l, login: false }));
          verifyingRef.current = false;
          return setErr(t('partner.errors.clickSendOtp', "Please click 'Send OTP' first."));
        }
        const finalOtp = codeOverride || form.otp || otpDigits.join("");
        if (!finalOtp || finalOtp.length < 6) {
          setLoading(l => ({ ...l, login: false }));
          verifyingRef.current = false;
          return setErr(t('partner.errors.enterOtpCode', 'Please enter the 6-digit OTP.'));
        }
        if (!otpSentTime || Date.now() - otpSentTime > 300000) {
          setLoading(l => ({ ...l, login: false }));
          verifyingRef.current = false;
          return setErr(t('partner.errors.otpExpired', 'OTP expired. Please send a new one.'));
        }

        const isMobile = /^[6-9]\d{9}$/.test(form.identity.trim());

        // ── Mobile MSG91 verify flow ──
        if (isMobile) {
          if (typeof window.verifyOtp !== 'function') {
            throw new Error("MSG91 service is temporarily unavailable. Please refresh the page.");
          }

          let verifyDone = false;
          const verifyTimeout = setTimeout(() => {
            if (!verifyDone) {
              verifyDone = true;
              setErr(t("partner.errors.verificationTimeout", "Verification timed out. Please try again."));
              setLoading(l => ({ ...l, login: false }));
            }
          }, 15000);

          window.verifyOtp(
            finalOtp,
            async (verifyData) => {
              if (verifyDone) return;
              verifyDone = true;
              clearTimeout(verifyTimeout);
              try {
                const tokenVal = verifyData?.message || verifyData?.accessToken || verifyData?.['access-token'] || (typeof verifyData === 'string' ? verifyData : verifyData?.data);
                if (!tokenVal) {
                  throw new Error("Could not retrieve verification token from MSG91.");
                }

                loginRes = await loginWithMsg91(form.identity.trim(), tokenVal);
                const profile = await getMe();
                loginStore(profile, loginRes.idToken);

                const from = location.state?.from?.pathname;
                const role = profile.role?.toUpperCase();
                const dest = from || loginRes.redirect ||
                  (role === 'SUPER_ADMIN' ? '/super-admin/dashboard' :
                   role === 'ADMIN' ? '/admin/dashboard' : '/partner/dashboard');
                window.location.href = dest;
              } catch (errVal) {
                setErr(errVal.message || t('partner.errors.invalidCredentials', 'Invalid credentials. Please try again.'));
                setLoading(l => ({ ...l, login: false }));
              }
            },
            (errResponse) => {
              if (verifyDone) return;
              verifyDone = true;
              clearTimeout(verifyTimeout);
              setErr(errResponse?.message || t("partner.errors.invalidOtpEntered", "Invalid OTP code entered."));
              setLoading(l => ({ ...l, login: false }));
            }
          );
          return;
        }

        // ── Email AWS SES verification flow ──
        loginRes = await loginWithOtp(form.identity.trim(), finalOtp);
      } else {
        // Password login
        if (!form.password) {
          setLoading(l => ({ ...l, login: false }));
          return setErr(t("partner.errors.enterPassword", "Please enter your password."));
        }
        loginRes = await loginWithPassword(form.identity.trim(), form.password);
      }

      const profile = await getMe();
      loginStore(profile, loginRes.idToken);

      if (loginRes.redirect) {
        if (loginRes.redirect.startsWith('http')) {
          window.location.href = loginRes.redirect;
        } else {
          // Normalize superadmin redirect if it comes from the backend without a hyphen
          const targetRedirect = loginRes.redirect === '/superadmin/dashboard' ? '/super-admin/dashboard' : loginRes.redirect;
          navigate(location.state?.from?.pathname || targetRedirect);
        }
      } else {
        const role = profile.role?.toUpperCase();
        if (role === 'SUPER_ADMIN') navigate(location.state?.from?.pathname || '/super-admin/dashboard');
        else if (role === 'ADMIN') navigate(location.state?.from?.pathname || '/admin/dashboard');
        else navigate(location.state?.from?.pathname || '/partner/dashboard');
      }
    } catch (e) {
      // On failure: clear OTP boxes and refocus first input
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
      setErr(e.message || t('partner.errors.invalidCredentials', 'Invalid credentials. Please try again.'));
      setLoading(l => ({ ...l, login: false }));
    } finally {
      verifyingRef.current = false;
    }
  };

  const getRoleDisplayName = (r) => {
    if (r === "PARTNER") return t("login.rolePartner", "Partner");
    if (r === "EMPLOYEE") return t("login.roleEmployee", "Employee");
    if (r === "ADMIN") return t("login.roleAdmin", "Admin");
    if (r === "SUPER_ADMIN") return t("login.roleSuperAdmin", "Super Admin");
    return r;
  };

  const focusBorder = `1.5px solid #2563EB`;

  return (
    <div style={{
      height: "100vh",
      height: "100dvh",
      background: C.bg,
      color: C.text,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "16px",
      boxSizing: "border-box",
      fontFamily: "'Inter', sans-serif"
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Ambient background shapes */}
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.04)", filter: "blur(80px)", top: "-120px", left: "-120px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(46, 144, 250, 0.05)", filter: "blur(80px)", bottom: "-80px", right: "-120px", pointerEvents: "none" }} />

      <div className="login-container">

        {/* ── Direct Login Layout ──────────────────────────────────── */}
        <div className="login-step2-layout">
          
          {/* Left side panel (hidden on mobile, secure info on desktop) */}
          <div className="login-step2-left">
            <div style={{
              background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(46, 144, 250, 0.08))",
              border: `1.5px solid ${C.border}`,
              borderRadius: "24px",
              padding: "32px 24px",
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              textAlign: "left"
            }}>
              <img src={logoImg} alt="GharKaPaisa Logo" style={{ height: "36px", objectFit: "contain", alignSelf: "flex-start" }} />
              
              <div>
                <div style={{ marginBottom: "16px", display: "inline-flex", padding: "16px", borderRadius: "16px", background: "rgba(37, 99, 235, 0.08)" }}>
                  <Icons.Lock size={40} color="#2563EB" />
                </div>
                <h2 id="label-secure-gateway-title" style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 8px 0", color: C.text }}>{t("login.secureGatewayTitle", "Secure Gateway")}</h2>
                <p id="label-secure-gateway-desc" style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.5, margin: 0 }}>
                  {t("login.secureGatewayDesc", "Please enter your registered credentials or verify via OTP to access your secure dashboard.")}
                </p>
              </div>

              <div id="label-ssl-banner" style={{ fontSize: "11px", color: C.textLight, fontWeight: 700 }}>
                {t("login.sslBannerText", "256-BIT SSL ENCRYPTION • VERIFIED ENVIRONMENT")}
              </div>
            </div>
          </div>

          {/* Right side login form */}
          <div className="login-step2-right">
            {/* Top header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexShrink: 0, width: "100%" }} className="login-step2-header">
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
                <img src={logoImg} alt="GharKaPaisa Logo" style={{ height: "32px", objectFit: "contain" }} />
              </div>
              <LanguageSwitcher />
            </div>

            {/* Main credentials card container */}
            <div 
              style={{
                background: C.card,
                border: `1.5px solid ${C.border}`,
                borderRadius: "24px",
                padding: "24px 20px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                margin: "4px 0"
              }}
            >
              <h2 id="login-credentials-title" style={{ fontSize: "19px", fontWeight: 900, margin: "0 0 4px 0", color: C.text, textAlign: "center" }}>
                {t("login.loginToAccount", "Login to Your Account")}
              </h2>
              <p id="login-credentials-subtitle" style={{ fontSize: "11.5px", color: C.textLight || "#64748B", margin: "0 0 14px 0", textAlign: "center" }}>
                {t("login.chooseLoginMethod", "Choose your preferred login method")}
              </p>

              {/* Segmented Login method toggle (Password FIRST, OTP SECOND) */}
              <div style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#F1F5F9",
                borderRadius: "12px",
                padding: "4px",
                display: "flex",
                gap: "4px",
                marginBottom: "14px",
                flexShrink: 0
              }}>
                <button
                  id="btn-toggle-password"
                  type="button"
                  onClick={() => { setMethod("password"); setErr(""); }}
                  style={{
                    flex: 1,
                    background: method === "password" ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "transparent",
                    color: method === "password" ? "#FFFFFF" : C.textMid,
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {t("login.loginWithPassword", "Login with Password")}
                </button>
                <button
                  id="btn-toggle-otp"
                  type="button"
                  onClick={() => { setMethod("otp"); setErr(""); }}
                  style={{
                    flex: 1,
                    background: method === "otp" ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "transparent",
                    color: method === "otp" ? "#FFFFFF" : C.textMid,
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {t("login.loginWithOtp", "Login with OTP")}
                </button>
              </div>

              {/* Error messages box */}
              {err && (
                <div style={{
                  background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                  borderRadius: "10px", padding: "9px 12px",
                  fontSize: "12px", color: C.red,
                  marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px",
                  textAlign: "left"
                }}>
                  <Icons.x size={13} /> {err}
                </div>
              )}

              {/* Inputs Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                
                {/* Email or Mobile Number Input */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label id="label-login-identity" style={S.label}>{t("login.emailOrMobile", "Email or Mobile Number")}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}>
                      {/^[6-9]\d{9}$/.test(form.identity.trim()) ? <Icons.phone size={14} /> : <Icons.mail size={14} />}
                    </span>
                    <input
                      type="text"
                      value={form.identity}
                      onChange={e => setForm(f => ({ ...f, identity: e.target.value }))}
                      placeholder={t("login.identityPlaceholder", "Enter email or mobile number")}
                      style={{ ...S.input, paddingLeft: "36px", paddingVertical: "10px" }}
                      onFocus={e => (e.target.style.border = focusBorder)}
                      onBlur={e => (e.target.style.border = `1.5px solid ${C.border}`)}
                      disabled={method === "otp" && otpSent}
                    />
                  </div>
                </div>

                {/* ── Password Field Render (DEFAULT) ── */}
                {method === "password" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-login-password" style={S.label}>{t("login.passwordLabel", "Password")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.Lock size={14} /></span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        placeholder={t("login.passwordPlaceholder", "Enter password")}
                        style={{ ...S.input, paddingLeft: "36px", paddingRight: "36px", paddingVertical: "10px" }}
                        onFocus={e => (e.target.style.border = focusBorder)}
                        onBlur={e => (e.target.style.border = `1.5px solid ${C.border}`)}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, cursor: "pointer", display: "flex" }}
                      >
                        {showPassword ? <Icons.eyeOff size={14} /> : <Icons.eye size={14} />}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── OTP Fields Render (ALTERNATIVE) ── */}
                {method === "otp" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label id="label-login-otp" style={S.label}>{t("login.enterOtpLabel", "Enter 6-Digit OTP")}</label>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      
                      {/* 6 OTP Inputs */}
                      <div style={{ display: "flex", gap: "4px", flex: 1 }}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => otpInputs.current[i] = el}
                            type="text"
                            inputMode="numeric"
                            autoComplete={i === 0 ? "one-time-code" : "off"}
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpDigitChange(e.target.value, i)}
                            onKeyDown={e => handleOtpKeyDown(e, i)}
                            onPaste={i === 0 ? handleOtpPaste : undefined}
                            style={{
                              width: "100%",
                              height: "36px",
                              borderRadius: "8px",
                              border: `1.5px solid ${digit ? "#2563EB" : C.border}`,
                              background: C.inputBg,
                              color: C.text,
                              fontSize: "15px",
                              fontWeight: 800,
                              textAlign: "center",
                              outline: "none"
                            }}
                          />
                        ))}
                      </div>

                      {/* Send OTP button */}
                      <button
                        id="btn-login-send-otp"
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading.otp || (otpSent && timer > 0)}
                        style={{
                          background: otpSent ? "rgba(37, 99, 235, 0.08)" : "#2563EB",
                          color: otpSent ? "#2563EB" : "#FFFFFF",
                          border: otpSent ? "1px solid #2563EB" : "none",
                          borderRadius: "10px",
                          padding: "0 12px",
                          height: "36px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: (loading.otp || (otpSent && timer > 0)) ? "not-allowed" : "pointer",
                          opacity: (loading.otp || (otpSent && timer > 0)) ? 0.7 : 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {loading.otp ? t("login.otpSending", "Sending...") : otpSent ? (timer > 0 ? `${t("login.otpResend", "Resend")} (${timer}s)` : t("login.otpResend", "Resend")) : t("login.otpSend", "Send OTP")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember & Links Row */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", fontSize: "11px", marginTop: "2px" }}>
                  {method === "otp" ? (
                    <span 
                      id="link-forgot-mobile" 
                      onClick={() => setShowForgotMobileModal(true)}
                      style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer" }}
                    >
                      {t("login.forgotMobile", "Forgot Mobile Number?")}
                    </span>
                  ) : (
                    <span 
                      id="link-forgot-password"
                      onClick={() => setShowForgotPasswordModal(true)}
                      style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer" }}
                    >
                      {t("login.forgotPassword", "Forgot Password?")}
                    </span>
                  )}
                </div>

                {/* Primary Secure Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={loading.login}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    width: "100%",
                    cursor: loading.login ? "not-allowed" : "pointer",
                    opacity: loading.login ? 0.8 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "6px",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  {loading.login ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        width: "12px", height: "12px", borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTop: "2px solid #fff",
                        animation: "spin 0.7s linear infinite"
                      }} />
                      {t("login.verifying", "Verifying...")}
                    </span>
                  ) : (
                    <>
                      <Icons.Lock size={14} color="#FFFFFF" />
                      <span id="label-login-secure">
                        {method === "password" ? t("login.loginWithPasswordSubmit", "Login to Account") : t("login.loginWithOtpSubmit", "Verify & Login")}
                      </span>
                    </>
                  )}
                </button>
              </form>

            </div>

            {/* Bottom Action / Footer */}
            <div style={{ flexShrink: 0, marginTop: "8px" }}>
              <div style={{ textAlign: "center", fontSize: "12.5px", color: C.textLight }}>
                <span id="label-dont-have-account">{t("login.dontHaveAccount", "Don't have an account?")}</span>{" "}
                <span 
                  id="link-become-partner"
                  onClick={() => navigate("/register")} 
                  style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                >
                  {t("login.becomePartner", "Become a Partner →")}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ══ FORGOT MOBILE NUMBER MODAL ══ */}
      {showForgotMobileModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", animation: "slideIn 0.3s ease"
        }}>
          <div style={{
            background: C.card, border: `1.5px solid ${C.border}`,
            borderRadius: "24px", padding: "28px", maxWidth: "420px", width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center"
          }}>
            {/* Close button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <span onClick={() => setShowForgotMobileModal(false)}
                style={{ cursor: "pointer", color: C.textLight, fontSize: "18px", fontWeight: 700, padding: "4px 8px", borderRadius: "8px", transition: "all 0.15s" }}
                onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >✕</span>
            </div>

            {/* Icon */}
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", border: "2px solid rgba(37, 99, 235, 0.2)"
            }}>
              <Icons.phone size={28} color="#2563EB" />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: "0 0 8px" }}>
              {t("login.forgotMobileTitle", "Forgot Your Mobile Number?")}
            </h3>
            <p style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.6, margin: "0 0 20px" }}>
              {t("login.forgotMobileDesc", "Don't worry! Here are some ways to recover your account:")}
            </p>

            {/* Recovery options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", marginBottom: "20px" }}>
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "12px 14px", borderRadius: "14px",
                background: isDark ? "rgba(37, 99, 235, 0.08)" : "#EFF6FF",
                border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE'}`
              }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icons.mail size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{t("login.forgotMobileOption1Title", "Login with Email")}</div>
                  <div style={{ fontSize: "11px", color: C.textMid, marginTop: "2px" }}>{t("login.forgotMobileOption1Desc", "Switch to 'Login with Password' and use your registered email address to sign in.")}</div>
                </div>
              </div>

              <div style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "12px 14px", borderRadius: "14px",
                background: isDark ? "rgba(16, 185, 129, 0.08)" : "#ECFDF5",
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5'}`
              }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "16px", color: "#fff" }}>📞</span>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{t("login.forgotMobileOption2Title", "Contact Support")}</div>
                  <div style={{ fontSize: "11px", color: C.textMid, marginTop: "2px" }}>{t("login.forgotMobileOption2Desc", "Reach out to our support team for assistance with account recovery.")}</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => { setShowForgotMobileModal(false); setMethod("password"); }}
                style={{
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  color: "#FFFFFF", border: "none", borderRadius: "14px",
                  padding: "11px 16px", fontSize: "13px", fontWeight: 700,
                  width: "100%", cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                }}
              >
                {t("login.switchToPassword", "Switch to Email & Password Login")}
              </button>
              <button
                onClick={() => setShowForgotMobileModal(false)}
                style={{
                  background: "transparent", color: C.textMid,
                  border: `1.5px solid ${C.border}`, borderRadius: "14px",
                  padding: "10px 16px", fontSize: "12px", fontWeight: 700,
                  width: "100%", cursor: "pointer"
                }}
              >
                {t("login.goBack", "Go Back")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ FORGOT PASSWORD MODAL ══ */}
      {showForgotPasswordModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", animation: "slideIn 0.3s ease"
        }}>
          <div style={{
            background: C.card, border: `1.5px solid ${C.border}`,
            borderRadius: "24px", padding: "28px", maxWidth: "420px", width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center"
          }}>
            {/* Close button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <span onClick={closeForgotPasswordModal}
                style={{ cursor: "pointer", color: C.textLight, fontSize: "18px", fontWeight: 700, padding: "4px 8px", borderRadius: "8px", transition: "all 0.15s" }}
                onMouseEnter={e => e.target.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >✕</span>
            </div>

            {forgotSuccess ? (
              /* ── Success State ── */
              <div>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.15))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", border: "2px solid rgba(34, 197, 94, 0.3)"
                }}>
                  <span style={{ fontSize: "28px" }}>✉️</span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: "0 0 8px" }}>
                  {t("login.resetLinkSentTitle", "Reset Link Sent!")}
                </h3>
                <p style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.6, margin: "0 0 8px" }}>
                  {t("login.resetLinkSentDesc", "We've sent a password reset link to:")}
                </p>
                <div style={{
                  padding: "10px 16px", borderRadius: "12px",
                  background: isDark ? "rgba(34, 197, 94, 0.08)" : "#F0FDF4",
                  border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.2)' : '#BBF7D0'}`,
                  fontSize: "14px", fontWeight: 700, color: "#16A34A",
                  marginBottom: "20px"
                }}>
                  {forgotEmail}
                </div>
                <p style={{ fontSize: "11px", color: C.textLight, lineHeight: 1.5, margin: "0 0 20px" }}>
                  {t("login.resetLinkCheckSpam", "Please check your inbox and spam folder. The link will expire in 30 minutes.")}
                </p>
                <button
                  onClick={closeForgotPasswordModal}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#FFFFFF", border: "none", borderRadius: "14px",
                    padding: "11px 16px", fontSize: "13px", fontWeight: 700,
                    width: "100%", cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  {t("login.backToLogin", "Back to Login")}
                </button>
              </div>
            ) : (
              /* ── Form State ── */
              <div>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.15))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", border: "2px solid rgba(37, 99, 235, 0.2)"
                }}>
                  <Icons.Lock size={28} color="#2563EB" />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, margin: "0 0 8px" }}>
                  {t("login.forgotPasswordTitle", "Forgot Your Password?")}
                </h3>
                <p style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.6, margin: "0 0 20px" }}>
                  {t("login.forgotPasswordDesc", "Enter your registered email address and we'll send you a link to reset your password.")}
                </p>

                {forgotError && (
                  <div style={{
                    background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                    borderRadius: "10px", padding: "8px 12px",
                    fontSize: "12px", color: C.red,
                    marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px",
                    textAlign: "left"
                  }}>
                    <Icons.x size={12} /> {forgotError}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("login.emailAddress", "Email Address")}
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}>
                        <Icons.mail size={14} />
                      </span>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder={t("login.forgotEmailPlaceholder", "Enter your registered email")}
                        style={{ ...S.input, paddingLeft: "36px" }}
                        onFocus={e => (e.target.style.border = focusBorder)}
                        onBlur={e => (e.target.style.border = `1.5px solid ${C.border}`)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                      color: "#FFFFFF", border: "none", borderRadius: "14px",
                      padding: "12px 16px", fontSize: "13px", fontWeight: 700,
                      width: "100%", cursor: forgotLoading ? "not-allowed" : "pointer",
                      opacity: forgotLoading ? 0.8 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    {forgotLoading ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          width: "12px", height: "12px", borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTop: "2px solid #fff",
                          animation: "spin 0.7s linear infinite"
                        }} />
                        {t("login.sending", "Sending...")}
                      </span>
                    ) : (
                      <>
                        <Icons.mail size={14} color="#FFFFFF" />
                        {t("login.sendResetLink", "Send Reset Link")}
                      </>
                    )}
                  </button>
                </form>

                <button
                  onClick={closeForgotPasswordModal}
                  style={{
                    background: "transparent", color: C.textMid,
                    border: `1.5px solid ${C.border}`, borderRadius: "14px",
                    padding: "10px 16px", fontSize: "12px", fontWeight: 700,
                    width: "100%", cursor: "pointer", marginTop: "8px"
                  }}
                >
                  {t("login.goBack", "Go Back")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .login-container {
          max-width: 420px;
          width: 100%;
          height: 100%;
          max-height: 660px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }
        
        .login-step1-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        .login-step1-left {
          display: none;
        }

        .login-step1-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        
        .role-cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          justify-content: center;
        }
        
        .role-card {
          background: ${C.card};
          border: 1.5px solid ${C.border};
          border-radius: 20px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          box-sizing: border-box;
        }
        
        .login-step2-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        
        .login-step2-left {
          display: none;
        }
        
        .login-step2-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        
        @media (min-width: 992px) {
          .login-container {
            max-width: 860px;
            max-height: 560px;
          }
          
          /* Step 1 side-by-side layout */
          .login-step1-layout {
            flex-direction: row;
            gap: 32px;
            align-items: center;
            height: 100%;
          }
          
          .login-step1-left {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
            height: 100%;
          }
          
          .login-step1-right {
            flex: 1.1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
          }

          /* Step 1 vertical list override inside split layout */
          .role-cards-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          /* Step 2 side-by-side layout */
          .login-step2-layout {
            flex-direction: row;
            gap: 32px;
            align-items: center;
            height: 100%;
          }
          
          .login-step2-left {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
            height: 100%;
          }
          
          .login-step2-right {
            flex: 1.1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}
