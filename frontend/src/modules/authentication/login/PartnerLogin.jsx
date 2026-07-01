import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../app/store/authStore";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useMsg91Captcha } from "../../../hooks/useMsg91Captcha";
import { sendOtp, loginWithOtp, loginWithPassword, forgotPassword, getMe, loginWithMsg91, lookupUser } from "../../../services/auth.api.js";

import logoImg from "../../../assets/logos/logo.png";

// Toast Notification
function Toast({ message, type = "success", onClose }) {
  const isSuccess = type === "success";
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      right: "24px",
      zIndex: 1000,
      background: isSuccess ? "#10B981" : "#EF4444",
      color: "#FFFFFF",
      padding: "12px 18px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "14px",
      fontWeight: 600,
      animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
    }}>
      <span>{isSuccess ? "✅" : "❌"}</span>
      <span>{message}</span>
      <span onClick={onClose} style={{ marginLeft: "8px", cursor: "pointer", opacity: 0.8 }}>✕</span>
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

  // MSG91 Captcha (active on Step 2 only)
  const { isCaptchaVerified, sdkReady, containerId: captchaId } = useMsg91Captcha({ enabled: loginStep === 2 });

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

  // Reset OTP state when username/identity changes
  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setOtpSentTime(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setForm(f => ({ ...f, otp: "" }));
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

  const handleRoleSelect = (roleName) => {
    setSelectedRole(roleName);
    localStorage.setItem("gkp_last_role", roleName);
  };

  const handleOtpDigitChange = (value, index) => {
    const cleanVal = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
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

  // ── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    console.log('[MSG91] Send OTP button clicked (PartnerLogin)');
    setErr("");
    if (!isCaptchaVerified) {
      console.warn('[MSG91] Send OTP blocked: Captcha not verified');
      return setErr(t("partner.errors.completeCaptcha", "Please complete the captcha verification first."));
    }
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
            setTimer(120);
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
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErr("");
    setToast(null);
    if (!form.identity.trim()) return setErr(t('partner.errors.enterEmailOrMobile', 'Please enter your email or mobile number.'));

    setLoading(l => ({ ...l, login: true }));
    try {
      let loginRes;
      if (method === 'otp') {
        if (!otpSent) {
          setLoading(l => ({ ...l, login: false }));
          return setErr(t('partner.errors.clickSendOtp', "Please click 'Send OTP' first."));
        }
        if (!form.otp || form.otp.length < 6) {
          setLoading(l => ({ ...l, login: false }));
          return setErr(t('partner.errors.enterOtpCode', 'Please enter the 6-digit OTP.'));
        }
        if (!otpSentTime || Date.now() - otpSentTime > 300000) {
          setLoading(l => ({ ...l, login: false }));
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
            form.otp,
            async (verifyData) => {
              if (verifyDone) return;
              verifyDone = true;
              clearTimeout(verifyTimeout);
              try {
                const tokenVal = verifyData?.accessToken || verifyData?.['access-token'] || (typeof verifyData === 'string' ? verifyData : verifyData?.data);
                if (!tokenVal) {
                  throw new Error("Could not retrieve verification token from MSG91.");
                }

                loginRes = await loginWithMsg91(form.identity.trim(), tokenVal, selectedRole);
                const profile = await getMe(true);
                loginStore(profile, loginRes.idToken);
                
                if (loginRes.redirect) {
                  navigate(location.state?.from?.pathname || loginRes.redirect);
                } else {
                  const role = profile.role?.toUpperCase();
                  if (role === 'SUPER_ADMIN') navigate(location.state?.from?.pathname || '/superadmin/dashboard');
                  else if (role === 'ADMIN') navigate(location.state?.from?.pathname || '/admin/dashboard');
                  else navigate(location.state?.from?.pathname || '/partner/dashboard');
                }
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
        loginRes = await loginWithOtp(form.identity.trim(), form.otp, selectedRole);
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
      
      if (loginRes.redirect) {
        navigate(location.state?.from?.pathname || loginRes.redirect);
      } else {
        const role = profile.role?.toUpperCase();
        if (role === 'SUPER_ADMIN') navigate(location.state?.from?.pathname || '/superadmin/dashboard');
        else if (role === 'ADMIN') navigate(location.state?.from?.pathname || '/admin/dashboard');
        else navigate(location.state?.from?.pathname || '/partner/dashboard');
      }
    } catch (e) {
      setErr(e.message || t('partner.errors.invalidCredentials', 'Invalid credentials. Please try again.'));
      setLoading(l => ({ ...l, login: false }));
    }
  };

  const getRoleDisplayName = (r) => {
    if (r === "PARTNER") return t("login.rolePartner", "Partner");
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
            
            {/* Top Logo & Title */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <img src={logoImg} alt="GharKaPaisa Logo" style={{ height: "40px", objectFit: "contain", marginBottom: "16px" }} />
              
              {renderLoginProgress()}

              <h1 id="login-welcome-title" style={{ fontSize: "26px", fontWeight: 900, margin: 0, color: C.text }}>{t("login.welcomeTitle", "Welcome Back!")}</h1>
              <p id="login-welcome-subtitle" style={{ fontSize: "13px", color: C.textLight || "#64748B", marginTop: "4px", margin: 0 }}>
                {t("login.welcomeSubtitle", "Login securely to continue your journey")}
              </p>
            </div>

            {/* Role cards container */}
            <div className="role-cards-container">
              {[
                {
                  id: "PARTNER",
                  title: t("login.rolePartner", "Partner"),
                  desc: t("login.rolePartnerDesc", "Earn by helping customers with financial products."),
                  icon: "👨💼",
                  color: "#EFF6FF",
                  iconColor: "#2563EB",
                  cardId: "role-card-partner",
                  titleId: "role-title-partner",
                  descId: "role-desc-partner"
                },
                {
                  id: "ADMIN",
                  title: t("login.roleAdmin", "Admin"),
                  desc: t("login.roleAdminDesc", "Manage operations and oversee team activities."),
                  icon: "👨💻",
                  color: "#ECFDF5",
                  iconColor: "#10B981",
                  cardId: "role-card-admin",
                  titleId: "role-title-admin",
                  descId: "role-desc-admin"
                },
                {
                  id: "SUPER_ADMIN",
                  title: t("login.roleSuperAdmin", "Super Admin"),
                  desc: t("login.roleSuperAdminDesc", "Full access to platform administration."),
                  icon: "👑",
                  color: "#F5F3FF",
                  iconColor: "#8B5CF6",
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
                      border: isSelected ? "2.5px solid #2563EB" : `1.5px solid ${C.border}`,
                      boxShadow: isSelected ? "0 8px 24px rgba(37, 99, 235, 0.15)" : "none",
                      transform: isSelected ? "translateY(-2px)" : "translateY(0)"
                    }}
                  >
                    {/* Role Icon Circle */}
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: roleItem.color,
                      fontSize: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {roleItem.icon}
                    </div>

                    {/* Text Details */}
                    <div style={{ flex: 1 }}>
                      <div id={roleItem.titleId} style={{ fontSize: "15px", fontWeight: 800, color: C.text }}>{roleItem.title}</div>
                      <div id={roleItem.descId} style={{ fontSize: "11.5px", color: C.textMid || "#64748B", marginTop: "3px", lineHeight: 1.4 }}>{roleItem.desc}</div>
                    </div>

                    {/* Custom Checked Radio input */}
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: isSelected ? "5px solid #2563EB" : `2px solid ${C.border}`,
                      background: isSelected ? "#FFFFFF" : "transparent",
                      boxSizing: "border-box",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                      marginTop: "auto"
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Bottom Section */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", color: C.textLight }}>
                <span>🛡️</span>
                <span id="label-data-secure">{t("login.dataSecure", "Your data is 100% secure with us")}</span>
              </div>
              <button
                id="btn-role-continue"
                onClick={() => setLoginStep(2)}
                style={{
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  width: "100%",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <span id="label-role-continue">{t("login.continue", "Continue")}</span> <Icons.arrowRight size={16} />
              </button>
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
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexShrink: 0 }} className="login-step2-header">
                <button 
                  id="btn-login-back"
                  onClick={() => { setLoginStep(1); setErr(""); }} 
                  style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Icons.arrowLeft size={16} />
                </button>
                <img src={logoImg} alt="GharKaPaisa Logo" style={{ height: "30px", objectFit: "contain" }} />
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
                  <span id="label-logging-in-as">👤 {t("login.loggingInAs", "Logging in as")} <strong>{getRoleDisplayName(selectedRole)}</strong></span>
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
                className="card-scrollable"
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
                              maxLength={1}
                              value={digit}
                              onChange={e => handleOtpDigitChange(e.target.value, i)}
                              onKeyDown={e => handleOtpKeyDown(e, i)}
                              style={{
                                width: "100%",
                                height: "36px",
                                borderRadius: "8px",
                                border: `1.5px solid ${otpDigits[i] ? "#2563EB" : C.border}`,
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

                      <div id="label-otp-helper" style={{ fontSize: "11px", color: C.textLight, marginTop: "2px" }}>
                        {t("login.otpHelperNote", "We'll send a secure verification code to your registered mobile/email.")}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input type="checkbox" id="rememberMe" style={{ cursor: "pointer" }} />
                      <label id="label-remember-me" htmlFor="rememberMe" style={{ color: C.textMid, cursor: "pointer" }}>{t("login.rememberMe", "Remember me")}</label>
                    </div>
                    {method === "otp" ? (
                      <span id="link-forgot-mobile" style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer" }}>{t("login.forgotMobile", "Forgot Mobile Number?")}</span>
                    ) : (
                      <span 
                        id="link-forgot-password"
                        onClick={() => navigate("/reset-password")}
                        style={{ color: "#2563EB", fontWeight: 700, cursor: "pointer" }}
                      >
                        {t("login.forgotPassword", "Forgot Password?")}
                      </span>
                    )}
                  </div>

                  {/* MSG91 reCAPTCHA mount container */}
                  {method === "otp" && <div id={captchaId} style={{ display: "flex", justifyContent: "center", minHeight: "40px", marginTop: "4px" }} />}

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
                        <span>🔒</span>
                        <span id="label-login-secure">{t("login.secureLoginButton", "Secure Login")}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider OR */}
                <div style={{ display: "flex", alignItems: "center", margin: "10px 0", flexShrink: 0 }}>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                  <span id="label-login-or" style={{ fontSize: "10px", fontWeight: 800, color: C.textLight, padding: "0 10px" }}>{t("login.dividerOr", "OR")}</span>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                </div>

                {/* Google Login Mock button */}
                <button
                  id="btn-google-login"
                  type="button"
                  onClick={() => setToast({ message: t("login.googleOAuthComingSoon", "Google OAuth is coming soon!"), type: "info" })}
                  style={{
                    background: C.card,
                    color: C.textMid,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: "14px",
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: 700,
                    width: "100%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3s2.822-6.3 6.3-6.3c1.63 0 3.11.62 4.23 1.63l3.29-3.29C19.24 2.24 15.93 1 12.24 1 6.032 1 12.24s5.032 11.24 11.24 11.24c5.898 0 10.745-4.26 11.24-10.285v-2.91H12.24z"/>
                  </svg>
                  <span id="label-google-login">{t("login.googleLoginButton", "Continue with Google")}</span>
                </button>

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

                {/* SSL Trusted Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: C.textLight, marginTop: "14px", borderTop: `1px solid ${C.border}`, paddingTop: "8px" }}>
                  <span id="label-ssl-secure">{t("login.sslSecure", "🔒 256-bit SSL Secure")}</span>
                  <span id="label-trusted-partners">{t("login.trustedPartners", "Trusted by 10,000+ Partners")}</span>
                </div>
              </div>
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
          padding: 16px;
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
        
        .card-scrollable {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(37, 99, 235, 0.2) transparent;
        }
        .card-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .card-scrollable::-webkit-scrollbar-thumb {
          background-color: rgba(37, 99, 235, 0.2);
          border-radius: 3px;
        }
        
        @media (min-width: 992px) {
          .onboarding-container {
            max-width: 860px;
            max-height: 560px;
          }
          
          /* Step 1 horizontal cards layout */
          .role-cards-container {
            flex-direction: row;
            align-items: center;
            gap: 16px;
          }
          
          .role-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 24px 16px;
            height: 220px;
            justify-content: space-between;
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
