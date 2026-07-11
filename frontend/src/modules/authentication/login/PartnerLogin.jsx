import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../app/store/authStore";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useMsg91OTP } from "../../../hooks/useMsg91OTP";
import { sendOtp, loginWithOtp, loginWithPassword, forgotPassword, forgotMobile, getMe, loginWithMsg91, lookupUser } from "../../../services/auth.api.js";
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

  // 1 = Role Selection, 2 = Login Credentials Form
  const [loginStep, setLoginStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem("gkp_last_role") || "PARTNER");

  const [form, setForm] = useState({ identity: "", otp: "", password: "" });
  const [method, setMethod] = useState("otp"); // "otp" or "password"

  // MSG91 OTP SDK readiness
  const { sdkReady } = useMsg91OTP();

  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [err, setErr] = useState("");
  const [toast, setToast] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password/mobile modal states
  const [forgotModal, setForgotModal] = useState(null); // "password" or "mobile" or null
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");
  
  // Refs for 6 OTP input boxes
  const otpInputs = useRef([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const verifyingRef = useRef(false);

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Email address is required.");
      return;
    }
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      if (forgotModal === "password") {
        await forgotPassword(forgotEmail.trim());
        setForgotSuccess("Password reset instructions have been sent to your email.");
      } else if (forgotModal === "mobile") {
        await forgotMobile(forgotEmail.trim(), selectedRole);
        setForgotSuccess("Your registered mobile number has been sent to your email.");
      }
    } catch (err) {
      setForgotError(err.message || "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
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
        const lookupRes = await lookupUser(form.identity.trim(), selectedRole);
        if (!lookupRes || !lookupRes.success || !lookupRes.data?.exists) {
          throw new Error(t('partner.errors.userNotFound', 'User not found for the selected role.'));
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
      const otpRes = await sendOtp(form.identity.trim(), selectedRole);
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

                loginRes = await loginWithMsg91(form.identity.trim(), tokenVal, selectedRole);
                const profile = await getMe(true);
                loginStore(profile, loginRes.idToken);

                const from = location.state?.from?.pathname;
                const role = profile.role?.toUpperCase();
                // Redirect rejected KYC partners to KYC page
                const kycRedirect = loginRes.kyc_status === 'rejected' ? '/partner/kyc' : null;
                const dest = kycRedirect || from || loginRes.redirect ||
                  (role === 'SUPER_ADMIN' ? '/superadmin/dashboard' :
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
        loginRes = await loginWithOtp(form.identity.trim(), finalOtp, selectedRole);
      } else {
        // Password login
        if (!form.password) {
          setLoading(l => ({ ...l, login: false }));
          return setErr(t("partner.errors.enterPassword", "Please enter your password."));
        }
        loginRes = await loginWithPassword(form.identity.trim(), form.password, selectedRole);
      }

      const profile = await getMe(true);
      loginStore(profile, loginRes.idToken);
      
      // Redirect rejected KYC partners to KYC page
      if (loginRes.kyc_status === 'rejected' && profile.role?.toUpperCase() === 'PARTNER') {
        navigate('/partner/kyc');
      } else if (loginRes.redirect) {
        if (loginRes.redirect.startsWith('http')) {
          window.location.href = loginRes.redirect;
        } else {
          navigate(location.state?.from?.pathname || loginRes.redirect);
        }
      } else {
        const role = profile.role?.toUpperCase();
        if (role === 'SUPER_ADMIN') navigate(location.state?.from?.pathname || '/superadmin/dashboard');
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

  const renderLoginProgress = () => {
    const isStep1 = loginStep === 1;
    return (
      <div id="login-progress-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "240px", width: "100%", margin: "0 auto 20px", position: "relative" }}>
        {/* Connection Line */}
        <div style={{
          position: "absolute",
          top: "16px",
          left: "15%",
          right: "15%",
          height: "2px",
          background: isStep1 ? "#E2E8F0" : "#2563EB",
          zIndex: 1,
          transition: "background 0.3s"
        }} />
        
        {/* Step 1 Circle */}
        <div id="login-progress-step-1" style={{ zIndex: 2, textAlign: "center", width: "60px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#2563EB",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            margin: "0 auto 4px",
            boxShadow: isStep1 ? "0 0 10px rgba(37, 99, 235, 0.4)" : "none"
          }}>
            {isStep1 ? "1" : "✓"}
          </div>
          <span id="label-login-step-1" style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB" }}>{t("login.step1Text", "Step 1")}</span>
        </div>

        {/* Step 2 Circle */}
        <div id="login-progress-step-2" style={{ zIndex: 2, textAlign: "center", width: "60px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: isStep1 ? "#FFFFFF" : "#2563EB",
            border: isStep1 ? "2.5px solid #CBD5E1" : "none",
            color: isStep1 ? "#64748B" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            margin: "0 auto 4px",
            boxShadow: !isStep1 ? "0 0 10px rgba(37, 99, 235, 0.4)" : "none"
          }}>
            2
          </div>
          <span id="label-login-step-2" style={{ fontSize: "11px", fontWeight: 700, color: isStep1 ? "#64748B" : "#2563EB" }}>{t("login.step2Text", "Step 2")}</span>
        </div>
      </div>
    );
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

      <div className="onboarding-container">

        {/* ── STEP 1: Select Your Role ────────────────────────────────────────── */}
        {loginStep === 1 && (
          <div className="login-step1-layout">
            
            {/* Left side panel (hidden on mobile, beautiful secure info on desktop) */}
            <div className="login-step1-left">
              <div style={{
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(46, 144, 250, 0.08))",
                border: `1.5px solid ${C.border}`,
                borderRadius: "24px",
                padding: "24px",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "left",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ flexShrink: 0 }}>
                  <img id="img-login-role-logo" src={logoImg} alt={t("login.logoAlt", "GharKaPaisa Logo")} style={{ height: "32px", objectFit: "contain", marginBottom: "12px" }} />
                  <h2 id="label-role-panel-title" style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 6px 0", color: C.text }}>{t("login.rolePanelTitle", "Welcome to GharKaPaisa")}</h2>
                  <p id="label-role-panel-desc" style={{ fontSize: "11.5px", color: C.textMid, lineHeight: 1.4, margin: 0 }}>
                    {t("login.rolePanelDesc", "Select the role that fits your workflow to continue securely. Partner accounts can submit financial leads and track earnings, while administrative accounts oversee operations.")}
                  </p>
                </div>

                {/* Illustration Image Graphic */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  marginTop: "16px",
                  overflow: "hidden",
                  borderRadius: "16px"
                }}>
                  <img 
                    id="img-login-role-illustration"
                    src={welcomeBgImg} 
                    alt={t("login.illustrationAlt", "Welcome Illustration")} 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                  />
                </div>
              </div>
            </div>

            {/* Right side role selection form */}
            <div className="login-step1-right">
              {/* Top Back & Logo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexShrink: 0, width: "100%" }}>
                <div style={{ width: "40px", textAlign: "left" }}>
                  <button 
                    id="btn-login-step1-back"
                    onClick={() => navigate("/")}
                    style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center" }}
                  >
                    <Icons.arrowLeft size={16} />
                  </button>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <img id="img-login-header-logo" src={logoImg} alt={t("login.logoAlt", "GharKaPaisa Logo")} style={{ height: "30px", objectFit: "contain" }} />
                </div>
                <LanguageSwitcher />
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                
                {renderLoginProgress()}

                <h1 id="login-welcome-title" style={{ fontSize: "22px", fontWeight: 900, margin: "6px 0 0 0", color: C.text }}>{t("login.welcomeTitle", "Welcome Back!")}</h1>
                <p id="login-welcome-subtitle" style={{ fontSize: "11px", color: C.textLight || "#64748B", margin: "2px 0 0 0" }}>
                  {t("login.welcomeSubtitle", "Login securely to continue your journey")}
                </p>
              </div>

              {/* Role cards container */}
              <div className="role-cards-container" style={{ margin: "14px 0 10px" }}>
                {[
                  {
                    id: "PARTNER",
                    title: t("login.rolePartner", "Partner"),
                    desc: t("login.rolePartnerDesc", "Earn by helping customers with financial products."),
                    icon: <FaHandshake size={18} color="#2563EB" />,
                    color: "#EFF6FF",
                    cardId: "role-card-partner",
                    titleId: "role-title-partner",
                    descId: "role-desc-partner"
                  },
                  {
                    id: "EMPLOYEE",
                    title: t("login.roleEmployee", "Employee"),
                    desc: t("login.roleEmployeeDesc", "Update lead status and perform operations."),
                    icon: <FaBriefcase size={18} color="#F97316" />,
                    color: "#FFF7ED",
                    cardId: "role-card-employee",
                    titleId: "role-title-employee",
                    descId: "role-desc-employee"
                  },
                  {
                    id: "ADMIN",
                    title: t("login.roleAdmin", "Admin"),
                    desc: t("login.roleAdminDesc", "Manage operations and oversee team activities."),
                    icon: <FaUserCog size={18} color="#10B981" />,
                    color: "#ECFDF5",
                    cardId: "role-card-admin",
                    titleId: "role-title-admin",
                    descId: "role-desc-admin"
                  },
                  {
                    id: "SUPER_ADMIN",
                    title: t("login.roleSuperAdmin", "Super Admin"),
                    desc: t("login.roleSuperAdminDesc", "Full access to platform administration."),
                    icon: <FaCrown size={18} color="#8B5CF6" />,
                    color: "#F5F3FF",
                    cardId: "role-card-super-admin",
                    titleId: "role-title-super-admin",
                    descId: "role-desc-super-admin"
                  }
                ].map((roleItem) => {
                  const isSelected = selectedRole === roleItem.id;
                  return (
                    <div
                      key={roleItem.id}
                      id={roleItem.cardId}
                      onClick={() => handleRoleSelect(roleItem.id)}
                      className="role-card"
                      style={{
                        border: isSelected ? "2px solid #2563EB" : `1.5px solid ${C.border}`,
                        boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.1)" : "none",
                        padding: "10px 14px",
                        gap: "12px",
                        borderRadius: "16px"
                      }}
                    >
                      {/* Role Icon Circle */}
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: roleItem.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {roleItem.icon}
                      </div>

                      {/* Text Details */}
                      <div style={{ flex: 1 }}>
                        <div id={roleItem.titleId} style={{ fontSize: "12.5px", fontWeight: 800, color: C.text }}>{roleItem.title}</div>
                        <div id={roleItem.descId} style={{ fontSize: "10px", color: C.textMid || "#64748B", marginTop: "1px", lineHeight: 1.25 }}>{roleItem.desc}</div>
                      </div>

                      {/* Custom Checked Radio input */}
                      <div style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: isSelected ? "4px solid #2563EB" : `1.5px solid ${C.border}`,
                        background: isSelected ? "#FFFFFF" : "transparent",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }} />
                    </div>
                  );
                })}
              </div>

              {/* Bottom Section */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: C.textLight }}>
                  <Icons.shield size={14} color={C.textLight} />
                  <span id="label-data-secure">{t("login.dataSecure", "Your data is 100% secure with us")}</span>
                </div>
                <button
                  id="btn-role-continue"
                  onClick={() => setLoginStep(2)}
                  disabled={!selectedRole}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "14px",
                    padding: "11px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    width: "100%",
                    cursor: !selectedRole ? "not-allowed" : "pointer",
                    opacity: !selectedRole ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.2)"
                  }}
                >
                  <span id="label-role-continue">{t("login.continue", "Continue")}</span> <Icons.arrowRight size={14} />
                </button>

                {/* Back to Home Button */}
                <button
                  id="btn-back-to-home"
                  onClick={() => navigate("/")}
                  style={{
                    background: "transparent",
                    color: C.textMid,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: "14px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    width: "100%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaArrowLeft size={12} /> <span id="label-back-to-home">{t("login.backToHome", "Back to Home")}</span>
                </button>

                {/* Register Link */}
                <div style={{ textAlign: "center", fontSize: "12.5px", color: C.textLight, marginTop: "8px" }}>
                  <span>{t("login.dontHaveAccount", "Don't have an account?")}</span>{" "}
                  <span 
                    id="link-become-partner-step1"
                    onClick={() => navigate("/register")} 
                    style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                  >
                    {t("login.becomePartner", "Become a Partner →")}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── STEP 2: Login Credentials Form ──────────────────────────────────── */}
        {loginStep === 2 && (
          <div className="login-step2-layout">
            
            {/* Left side panel (hidden on mobile, beautiful secure info on desktop) */}
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
              {/* Top back & logo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexShrink: 0, width: "100%" }} className="login-step2-header">
                <div style={{ width: "40px", textAlign: "left" }}>
                  <button 
                    id="btn-login-back"
                    onClick={() => { setLoginStep(1); setErr(""); }} 
                    style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center" }}
                  >
                    <Icons.arrowLeft size={16} />
                  </button>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <img src={logoImg} alt="GharKaPaisa Logo" style={{ height: "30px", objectFit: "contain" }} />
                </div>
                <LanguageSwitcher />
              </div>

              {/* Progress bar in Step 2 */}
              <div className="login-step2-progress-wrapper" style={{ flexShrink: 0 }}>
                {renderLoginProgress()}
              </div>

              {/* Role badge */}
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 8px", flexShrink: 0 }}>
                <div style={{
                  background: isDark ? "rgba(37, 99, 235, 0.12)" : "#EFF6FF",
                  border: `1.5px solid ${isDark ? "#2563EB" : "#DBEAFE"}`,
                  borderRadius: "12px",
                  padding: "6px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#2563EB"
                }}>
                  <span id="label-logging-in-as" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icons.User size={14} color="#2563EB" />
                    <span>{t("login.loggingInAs", "Logging in as")} <strong>{getRoleDisplayName(selectedRole)}</strong></span>
                  </span>
                  <span 
                    id="link-change-role"
                    onClick={() => { setLoginStep(1); setErr(""); }}
                    style={{ color: "#E02424", cursor: "pointer", textDecoration: "underline", fontSize: "11px", fontWeight: 800 }}
                  >
                    {t("login.changeRole", "Change")}
                  </span>
                </div>
              </div>

              {/* Main credentials card container */}
              <div 
                style={{
                  background: C.card,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "24px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  margin: "4px 0"
                }}
              >
                
                <h2 id="login-credentials-title" style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 3px 0", color: C.text, textAlign: "center" }}>{t("login.loginToAccount", "Login to Your Account")}</h2>
                <p id="login-credentials-subtitle" style={{ fontSize: "11px", color: C.textLight || "#64748B", margin: "0 0 12px 0", textAlign: "center" }}>
                  {t("login.chooseLoginMethod", "Choose your preferred login method")}
                </p>

                {/* Segmented Login method toggle */}
                <div style={{
                  background: isDark ? "rgba(255,255,255,0.03)" : "#F1F5F9",
                  borderRadius: "12px",
                  padding: "4px",
                  display: "flex",
                  gap: "4px",
                  marginBottom: "12px",
                  flexShrink: 0
                }}>
                  <button
                    id="btn-toggle-otp"
                    onClick={() => { setMethod("otp"); setErr(""); }}
                    style={{
                      flex: 1,
                      background: method === "otp" ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "transparent",
                      color: method === "otp" ? "#FFFFFF" : C.textMid,
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {t("login.loginWithOtp", "Login with OTP")}
                  </button>
                  <button
                    id="btn-toggle-password"
                    onClick={() => { setMethod("password"); setErr(""); }}
                    style={{
                      flex: 1,
                      background: method === "password" ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "transparent",
                      color: method === "password" ? "#FFFFFF" : C.textMid,
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {t("login.loginWithPassword", "Login with Password")}
                  </button>
                </div>

                {/* Error messages box */}
                {err && (
                  <div style={{
                    background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                    borderRadius: "10px", padding: "8px 12px",
                    fontSize: "12px", color: C.red,
                    marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px",
                    textAlign: "left"
                  }}>
                    <Icons.x size={12} /> {err}
                  </div>
                )}

                {/* Inputs Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                  
                  {/* Username Input */}
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
                        disabled={otpSent}
                      />
                    </div>
                  </div>

                  {/* ── OTP Fields Render ── */}
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

                  {/* ── Password Field Render ── */}
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

                  {/* Remember & Links Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginTop: "4px", width: "100%" }}>
                    {method === "otp" ? (
                      <>
                        <span 
                          id="link-forgot-mobile" 
                          onClick={() => {
                            setForgotModal("mobile");
                            setForgotEmail("");
                            setForgotError("");
                            setForgotSuccess("");
                          }}
                          style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer" }}
                        >
                          {t("login.forgotMobile", "Forgot Mobile?")}
                        </span>
                        <span 
                          id="link-forgot-password-otp" 
                          onClick={() => {
                            setForgotModal("password");
                            setForgotEmail("");
                            setForgotError("");
                            setForgotSuccess("");
                          }}
                          style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer" }}
                        >
                          {t("login.forgotPassword", "Forgot Password?")}
                        </span>
                      </>
                    ) : (
                      <span 
                        id="link-forgot-password"
                        onClick={() => {
                          setForgotModal("password");
                          setForgotEmail("");
                          setForgotError("");
                          setForgotSuccess("");
                        }}
                        style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}
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
                      marginTop: "8px",
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
                        <span id="label-login-secure">{t("login.secureLoginButton", "Secure Login")}</span>
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
        )}

      {/* ── FORGOT CREDENTIALS MODAL ── */}
      {forgotModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: C.card,
            border: `1.5px solid ${C.border}`,
            borderRadius: "24px",
            padding: "28px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            animation: "slideIn 0.3s ease",
            textAlign: "left"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: 0 }}>
                {forgotModal === "password" ? "Forgot Password" : "Forgot Mobile Number"}
              </h3>
              <button 
                onClick={() => setForgotModal(null)} 
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: C.textLight }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: "13px", color: C.textLight || "#64748B", margin: "0 0 20px", lineHeight: 1.5 }}>
              {forgotModal === "password" 
                ? "Enter your registered email address and we'll send you a secure link to reset your password."
                : "Enter your registered email address and we'll send you your registered mobile number."
              }
            </p>

            {forgotError && (
              <div style={{
                background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                borderRadius: "10px", padding: "10px 14px",
                fontSize: "12.5px", color: C.red,
                marginBottom: "16px"
              }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{
                  background: "#DCFCE7",
                  border: "1.5px solid #22C55E",
                  color: "#14532D",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "20px"
                }}>
                  {forgotSuccess}
                </div>
                <button
                  onClick={() => setForgotModal(null)}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "14px",
                    padding: "12px 24px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter registered email"
                    style={{ ...S.input, paddingVertical: "10px" }}
                    onFocus={e => (e.target.style.border = focusBorder)}
                    onBlur={e => (e.target.style.border = `1.5px solid ${C.border}`)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: forgotLoading ? "not-allowed" : "pointer",
                    opacity: forgotLoading ? 0.8 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "8px",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)"
                  }}
                >
                  {forgotLoading ? "Sending..." : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .onboarding-container {
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
          .onboarding-container {
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
