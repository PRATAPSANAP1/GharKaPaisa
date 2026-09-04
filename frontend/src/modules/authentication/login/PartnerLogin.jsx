import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../app/store/authStore";
import { useMsg91OTP } from "../../../hooks/useMsg91OTP";
import {
  sendOtp,
  loginWithOtp,
  loginWithPassword,
  forgotPassword,
  getMe,
  loginWithMsg91,
  lookupUser,
} from "../../../services/auth.api.js";
import LanguageSwitcher from "../../../components/LanguageSwitcher/LanguageSwitcher";
import Chatbot from "../../../components/Chatbot/Chatbot";
import logoImg from "../../../assets/logos/logo.png";
import "./Login.css";

import {
  Home,
  Globe,
  ChevronDown,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Gift,
  Zap,
  Headphones,
  BadgeCheck,
  Bot,
  UserRound,
  CreditCard,
  Check,
  Phone,
  AlertCircle,
  X
} from "lucide-react";

// Toast Notification
function Toast({ message, type = "success", onClose }) {
  const isSuccess = type === "success";
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        background: isSuccess ? "#F0FDF4" : "#FEF2F2",
        color: isSuccess ? "#14532D" : "#7F1D1D",
        padding: "14px 20px",
        borderRadius: "16px",
        border: `2px solid ${isSuccess ? "#22C55E" : "#EF4444"}`,
        boxShadow: isSuccess
          ? "0 12px 32px rgba(34, 197, 94, 0.2)"
          : "0 12px 32px rgba(239, 68, 68, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: 600,
        minWidth: "280px",
        maxWidth: "400px",
        animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: isSuccess ? "#DCFCE7" : "#FEE2E2",
          border: `1.5px solid ${isSuccess ? "#22C55E" : "#EF4444"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isSuccess ? <span>✓</span> : <span>✕</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            opacity: 0.7,
            marginBottom: "2px",
          }}
        >
          {isSuccess ? "SUCCESS" : "ERROR"}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }}>
          {message}
        </div>
      </div>
      <span
        onClick={onClose}
        style={{
          cursor: "pointer",
          opacity: 0.5,
          fontSize: "16px",
          fontWeight: 700,
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
      >
        ✕
      </span>
    </div>
  );
}

const getRoleDashboard = (userRole) => {
  const role = (userRole || "").toUpperCase();
  if (role === "SUPER_ADMIN") return "/super-admin/overview";
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "HR") return "/hr/dashboard";
  if (role === "EMPLOYEE") return "/employee/dashboard";
  return "/partner/dashboard";
};

const resolveDestination = (profile, rawFromPath) => {
  const role = (profile?.role || "").toUpperCase();
  const defaultDashboard = getRoleDashboard(role);

  if (
    !rawFromPath ||
    rawFromPath === "/" ||
    rawFromPath === "/login" ||
    rawFromPath === "/admin-login"
  ) {
    return defaultDashboard;
  }

  if (role === "EMPLOYEE" && rawFromPath.startsWith("/employee"))
    return rawFromPath;
  if (role === "HR" && rawFromPath.startsWith("/hr")) return rawFromPath;
  if (
    role === "ADMIN" &&
    (rawFromPath.startsWith("/admin") || rawFromPath.startsWith("/hr"))
  )
    return rawFromPath;
  if (role === "SUPER_ADMIN") return rawFromPath;
  if (
    (role === "PARTNER" || role === "TEAM_MEMBER") &&
    rawFromPath.startsWith("/partner")
  )
    return rawFromPath;

  return defaultDashboard;
};

export default function PartnerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const loginStore = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = getRoleDashboard(user.role);
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [loginType, setLoginType] = useState("password"); // "password" or "otp"
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [formData, setFormData] = useState({
    identity: "",
    password: "",
    otp: "",
  });

  const { sdkReady } = useMsg91OTP();
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState({ otp: false, login: false });
  const [err, setErr] = useState("");
  const [toast, setToast] = useState(null);
  const [otpSentTime, setOtpSentTime] = useState(null);

  // OTP 6 digit inputs
  const otpInputs = useRef([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const verifyingRef = useRef(false);
  const [status, setStatus] = useState("idle");
  const [borderProgress, setBorderProgress] = useState(0);
  const [showPlacementStyles, setShowPlacementStyles] = useState(false);

  // Modal states
  const [showForgotMobileModal, setShowForgotMobileModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const [inviteToken, setInviteToken] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token && token.startsWith("inv_")) {
      setInviteToken(token);
    }
  }, [location.search]);

  // Forgot password
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim())
      return setForgotError(
        t("partner.errors.enterEmail", "Please enter your registered email address.")
      );
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim());
    if (!isEmail)
      return setForgotError(
        t("partner.errors.validEmail", "Please enter a valid email address.")
      );

    setForgotError("");
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
    } catch (error) {
      setForgotError(
        error.message ||
          t("partner.errors.forgotPasswordFailed", "Failed to send reset link. Please try again.")
      );
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

  useEffect(() => {
    setOtpSent(false);
    setTimer(0);
    setOtpSentTime(null);
    setOtpDigits(["", "", "", "", "", ""]);
    setFormData((f) => ({ ...f, otp: "" }));
    verifyingRef.current = false;
  }, [formData.identity]);

  useEffect(() => {
    let tTimer;
    if (timer > 0) tTimer = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(tTimer);
  }, [timer]);

  useEffect(() => {
    setFormData((f) => ({ ...f, otp: otpDigits.join("") }));
  }, [otpDigits]);

  useEffect(() => {
    if (status !== "idle") {
      setShowPlacementStyles(false);
      const timerId = window.setTimeout(() => setShowPlacementStyles(true), 900);
      return () => window.clearTimeout(timerId);
    }
    setShowPlacementStyles(false);
  }, [status]);

  useEffect(() => {
    const isComplete = otpDigits.every((digit) => digit !== "");
    if (!isComplete || status !== "idle" || !otpSent) {
      if (!isComplete) setBorderProgress(0);
      return;
    }
    let progress = 0;
    const interval = window.setInterval(() => {
      progress += 1;
      if (progress >= 100) {
        progress = 100;
        window.clearInterval(interval);
        submitOtpLogin();
      }
      setBorderProgress(progress);
    }, 10);
    return () => window.clearInterval(interval);
  }, [otpDigits, status, otpSent]);

  const resetOtp = () => {
    setStatus("idle");
    setOtpDigits(["", "", "", "", "", ""]);
    setBorderProgress(0);
    setErr("");
    window.setTimeout(() => {
      otpInputs.current[0]?.focus();
    }, 40);
  };

  const handleResolvedEdit = () => {
    if (status !== "idle") {
      resetOtp();
      return true;
    }
    return false;
  };

  const submitOtpLogin = async () => {
    const finalOtp = otpDigits.join("");
    if (!finalOtp || finalOtp.length < 6) {
      setStatus("fail");
      setErr(t("partner.errors.enterOtpCode", "Please enter the 6-digit OTP."));
      return;
    }

    setErr("");
    setLoading((l) => ({ ...l, login: true }));

    try {
      let loginRes;
      const isMobile = /^[6-9]\d{9}$/.test(formData.identity.trim());

      if (isMobile) {
        if (typeof window.verifyOtp !== "function") {
          setStatus("fail");
          throw new Error("MSG91 service is temporarily unavailable. Please refresh the page.");
        }

        let verifyDone = false;
        const verifyTimeout = setTimeout(() => {
          if (!verifyDone) {
            verifyDone = true;
            setStatus("fail");
            setErr(t("partner.errors.verificationTimeout", "Verification timed out. Please try again."));
            setLoading((l) => ({ ...l, login: false }));
          }
        }, 15000);

        window.verifyOtp(
          finalOtp,
          async (verifyData) => {
            if (verifyDone) return;
            verifyDone = true;
            clearTimeout(verifyTimeout);
            try {
              const tokenVal =
                verifyData?.message ||
                verifyData?.accessToken ||
                verifyData?.["access-token"] ||
                (typeof verifyData === "string" ? verifyData : verifyData?.data);
              if (!tokenVal) {
                throw new Error("Could not retrieve verification token from MSG91.");
              }

              loginRes = await loginWithMsg91(formData.identity.trim(), tokenVal);
              const profile = await getMe();
              loginStore(profile, loginRes.idToken);

              setStatus("success");
              setTimeout(() => {
                const rawFrom = location.state?.from?.pathname;
                const dest = resolveDestination(profile, rawFrom);
                navigate(dest, { replace: true });
              }, 1200);
            } catch (errVal) {
              setStatus("fail");
              setErr(
                errVal.message ||
                  t("partner.errors.invalidCredentials", "Invalid credentials. Please try again.")
              );
              setLoading((l) => ({ ...l, login: false }));
            }
          },
          (errResponse) => {
            if (verifyDone) return;
            verifyDone = true;
            clearTimeout(verifyTimeout);
            setStatus("fail");
            setErr(
              errResponse?.message ||
                t("partner.errors.invalidOtpEntered", "Invalid OTP code entered.")
            );
            setLoading((l) => ({ ...l, login: false }));
          }
        );
        return;
      }

      loginRes = await loginWithOtp(formData.identity.trim(), finalOtp);
      const profile = await getMe();
      loginStore(profile, loginRes.idToken);

      setStatus("success");
      setTimeout(() => {
        const rawFrom = location.state?.from?.pathname;
        const from =
          rawFrom && rawFrom !== "/" && rawFrom !== "/login" && rawFrom !== "/admin-login"
            ? rawFrom
            : null;
        if (loginRes.redirect) {
          if (loginRes.redirect.startsWith("http")) {
            window.location.href = loginRes.redirect;
          } else {
            const targetRedirect =
              loginRes.redirect === "/superadmin/dashboard" ||
              loginRes.redirect === "/super-admin/dashboard"
                ? "/super-admin/overview"
                : loginRes.redirect;
            navigate(from || targetRedirect);
          }
        } else {
          const role = profile.role?.toUpperCase();
          if (role === "SUPER_ADMIN") navigate(from || "/super-admin/overview");
          else if (role === "ADMIN") navigate(from || "/admin/dashboard");
          else if (role === "HR") navigate(from || "/hr/dashboard");
          else navigate(from || "/partner/dashboard");
        }
      }, 1200);
    } catch (e) {
      setStatus("fail");
      setErr(e.message || t("partner.errors.invalidCredentials", "Invalid credentials. Please try again."));
      setLoading((l) => ({ ...l, login: false }));
    }
  };

  const handleOtpDigitChange = (value, index) => {
    if (handleResolvedEdit()) return;
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    if (handleResolvedEdit()) return;
    if (otpDigits[index]) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }
    if (index > 0) {
      otpInputs.current[index - 1]?.focus();
      const newDigits = [...otpDigits];
      newDigits[index - 1] = "";
      setOtpDigits(newDigits);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    if (handleResolvedEdit()) return;
    const pastedData = e.clipboardData.getData("text").trim().substring(0, 6);
    const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("");
    const newDigits = ["", "", "", "", "", ""];
    digits.forEach((digit, idx) => {
      newDigits[idx] = digit;
    });
    setOtpDigits(newDigits);
    const focusIdx = digits.length >= 6 ? 5 : Math.max(digits.length, 0);
    otpInputs.current[focusIdx]?.focus();
  };

  const handleSendOtp = async () => {
    setErr("");
    if (!formData.identity.trim())
      return setErr(
        t("partner.errors.enterEmailOrMobile", "Please enter your email or mobile number.")
      );

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identity.trim());
    const isMobile = /^[6-9]\d{9}$/.test(formData.identity.trim());
    if (!isEmail && !isMobile)
      return setErr(
        t("partner.errors.validEmailMobile", "Please enter a valid email or 10-digit mobile number.")
      );

    setErr("");
    setToast(null);
    setLoading((l) => ({ ...l, otp: true }));

    if (isMobile) {
      try {
        const lookupRes = await lookupUser(formData.identity.trim());
        if (!lookupRes || !lookupRes.success || !lookupRes.data?.exists) {
          throw new Error(
            t("partner.errors.userNotFound", "No account found with this mobile number.")
          );
        }

        if (!sdkReady) {
          throw new Error(
            t("partner.errors.msg91NotLoaded", "OTP provider is loading. Please wait a moment and try again.")
          );
        }

        let callbackFired = false;
        const timeoutId = setTimeout(() => {
          if (!callbackFired) {
            callbackFired = true;
            setToast({
              message: t("partner.errors.msg91Timeout", "OTP provider did not respond. Please refresh and try again."),
              type: "error",
            });
            setLoading((l) => ({ ...l, otp: false }));
          }
        }, 15000);

        const formattedMobile = "91" + formData.identity.trim();

        window.sendOtp(
          formattedMobile,
          (data) => {
            if (callbackFired) return;
            callbackFired = true;
            clearTimeout(timeoutId);
            setOtpSent(true);
            setOtpSentTime(Date.now());
            setTimer(60);
            setToast({
              message: t("partner.errors.otpSentSuccessMobile", "Verification code sent to your mobile phone via SMS."),
              type: "success",
            });
            setLoading((l) => ({ ...l, otp: false }));
          },
          (errResponse) => {
            if (callbackFired) return;
            callbackFired = true;
            clearTimeout(timeoutId);
            setToast({
              message: errResponse?.message || t("partner.errors.otpSendFailed", "Failed to send OTP. Please try again."),
              type: "error",
            });
            setLoading((l) => ({ ...l, otp: false }));
          }
        );
      } catch (e) {
        setToast({
          message: e.message || t("partner.errors.otpSendFailed", "Failed to send OTP. Please try again."),
          type: "error",
        });
        setLoading((l) => ({ ...l, otp: false }));
      }
      return;
    }

    try {
      const otpRes = await sendOtp(formData.identity.trim());
      setOtpSent(true);
      setOtpSentTime(Date.now());
      setTimer(30);
      setToast({
        message:
          t("partner.errors.otpSentSuccess", "OTP sent to your registered email") +
          ` (${otpRes.email || "****@****.com"})`,
        type: "success",
      });
    } catch (e) {
      setToast({
        message: e.message || t("partner.errors.otpSendFailed", "Failed to send OTP. Please try again."),
        type: "error",
      });
    } finally {
      setLoading((l) => ({ ...l, otp: false }));
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setErr("");
    setToast(null);

    if (!formData.identity.trim()) {
      verifyingRef.current = false;
      return setErr(t("partner.errors.enterEmailOrMobile", "Please enter your email or mobile number."));
    }

    setLoading((l) => ({ ...l, login: true }));
    try {
      let loginRes;
      if (loginType === "otp") {
        if (!otpSent) {
          setLoading((l) => ({ ...l, login: false }));
          verifyingRef.current = false;
          return setErr(t("partner.errors.clickSendOtp", "Please click 'Send OTP' first."));
        }
        const finalOtp = formData.otp || otpDigits.join("");
        if (!finalOtp || finalOtp.length < 6) {
          setLoading((l) => ({ ...l, login: false }));
          verifyingRef.current = false;
          return setErr(t("partner.errors.enterOtpCode", "Please enter the 6-digit OTP."));
        }
        if (!otpSentTime || Date.now() - otpSentTime > 300000) {
          setLoading((l) => ({ ...l, login: false }));
          verifyingRef.current = false;
          return setErr(t("partner.errors.otpExpired", "OTP expired. Please send a new one."));
        }

        const isMobile = /^[6-9]\d{9}$/.test(formData.identity.trim());
        if (isMobile) {
          if (typeof window.verifyOtp !== "function") {
            throw new Error("MSG91 service is temporarily unavailable. Please refresh the page.");
          }

          let verifyDone = false;
          const verifyTimeout = setTimeout(() => {
            if (!verifyDone) {
              verifyDone = true;
              setErr(t("partner.errors.verificationTimeout", "Verification timed out. Please try again."));
              setLoading((l) => ({ ...l, login: false }));
            }
          }, 15000);

          window.verifyOtp(
            finalOtp,
            async (verifyData) => {
              if (verifyDone) return;
              verifyDone = true;
              clearTimeout(verifyTimeout);
              try {
                const tokenVal =
                  verifyData?.message ||
                  verifyData?.accessToken ||
                  verifyData?.["access-token"] ||
                  (typeof verifyData === "string" ? verifyData : verifyData?.data);
                if (!tokenVal) {
                  throw new Error("Could not retrieve verification token from MSG91.");
                }

                loginRes = await loginWithMsg91(formData.identity.trim(), tokenVal);
                const profile = await getMe();
                loginStore(profile, loginRes.idToken);

                const rawFrom = location.state?.from?.pathname;
                const dest = resolveDestination(profile, rawFrom);
                navigate(dest, { replace: true });
              } catch (errVal) {
                setErr(
                  errVal.message ||
                    t("partner.errors.invalidCredentials", "Invalid credentials. Please try again.")
                );
                setLoading((l) => ({ ...l, login: false }));
              }
            },
            (errResponse) => {
              if (verifyDone) return;
              verifyDone = true;
              clearTimeout(verifyTimeout);
              setErr(
                errResponse?.message ||
                  t("partner.errors.invalidOtpEntered", "Invalid OTP code entered.")
              );
              setLoading((l) => ({ ...l, login: false }));
            }
          );
          return;
        }

        loginRes = await loginWithOtp(formData.identity.trim(), finalOtp);
      } else {
        if (!formData.password) {
          setLoading((l) => ({ ...l, login: false }));
          return setErr(t("partner.errors.enterPassword", "Please enter your password."));
        }
        loginRes = await loginWithPassword(formData.identity.trim(), formData.password);
      }

      const profile = await getMe();
      loginStore(profile, loginRes.idToken);

      const needsProfileCompletion =
        inviteToken &&
        profile.role?.toUpperCase() === "TEAM_MEMBER" &&
        (!profile.first_name || !profile.last_name || !profile.mobile || !profile.email);

      const rawFrom = location.state?.from?.pathname;
      const targetDest = resolveDestination(profile, rawFrom);

      if (needsProfileCompletion) {
        navigate("/partner/profile", { replace: true });
      } else {
        navigate(targetDest, { replace: true });
      }
    } catch (e) {
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
      setErr(
        e.message || t("partner.errors.invalidCredentials", "Invalid credentials. Please try again.")
      );
      setLoading((l) => ({ ...l, login: false }));
    } finally {
      verifyingRef.current = false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ================= HEADER ================= */}
      <header className="login-header">
        <div className="header-container">
          <div className="logo-wrapper" onClick={() => navigate("/")}>
            <img src={logoImg} alt="GharKaPaisa" />
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="header-btn"
              onClick={() => navigate("/")}
            >
              <Home size={20} />
              <span>Home</span>
            </button>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="login-main">
        {/* ================= LOGIN CARD ================= */}
        <section className="login-card">
          <div className="login-card-content">
            {/* HERO */}
            <div className="login-hero">
              <div>
                <div className="welcome-badge">
                  <span>Welcome Back! 👋</span>
                </div>

                <h1 className="login-title">
                  Login to Your
                  <br />
                  <span>Account</span>
                </h1>

                <p className="login-description">
                  Access your dashboard and manage your financial journey seamlessly
                </p>
              </div>

              {/* SECURITY ILLUSTRATION */}
              <SecurityIllustration />
            </div>

            {/* ================= LOGIN TABS ================= */}
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${loginType === "password" ? "active" : ""}`}
                onClick={() => {
                  setLoginType("password");
                  setErr("");
                }}
              >
                <Lock size={19} />
                <span>Login with Password</span>
              </button>

              <button
                type="button"
                className={`login-tab ${loginType === "otp" ? "active" : ""}`}
                onClick={() => {
                  setLoginType("otp");
                  setErr("");
                }}
              >
                <Smartphone size={19} />
                <span>Login with OTP</span>
              </button>
            </div>

            {/* ERROR MESSAGE BOX */}
            {err && (
              <div
                style={{
                  marginTop: "18px",
                  background: "#FEF2F2",
                  border: "1.5px solid #FCA5A5",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  fontSize: "13.5px",
                  color: "#991B1B",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <AlertCircle size={18} color="#DC2626" />
                <span style={{ fontWeight: 600 }}>{err}</span>
              </div>
            )}

            {/* ================= FORM ================= */}
            <form className="login-form" onSubmit={handleLoginSubmit}>
              {/* EMAIL / MOBILE */}
              {!(loginType === "otp" && otpSent) && (
                <div className="form-group">
                  <label className="form-label" htmlFor="emailOrMobile">
                    Email or Mobile Number
                  </label>

                  <div className="input-wrapper">
                    {/^[6-9]\d{9}$/.test(formData.identity.trim()) ? (
                      <Phone className="input-icon" size={21} />
                    ) : (
                      <Mail className="input-icon" size={21} />
                    )}

                    <input
                      id="emailOrMobile"
                      name="identity"
                      type="text"
                      value={formData.identity}
                      onChange={handleChange}
                      placeholder="Enter email or mobile number"
                      className="form-input"
                      autoComplete="username"
                    />
                  </div>
                </div>
              )}

              {/* PASSWORD */}
              {loginType === "password" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>

                  <div className="input-wrapper">
                    <Lock className="input-icon" size={21} />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="form-input password-input"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                    </button>
                  </div>
                </div>
              )}

              {/* OTP 6-DIGIT FIELD */}
              {loginType === "otp" && otpSent && (
                <div style={{ marginTop: "12px", textAlign: "center" }}>
                  <label className="form-label" style={{ justifyContent: "center", marginBottom: "6px" }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 16px" }}>
                    We've sent a code to <strong style={{ color: "#0F172A" }}>{formData.identity}</strong>
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      justifyContent: "center",
                      marginBottom: "16px",
                      flexWrap: "nowrap",
                    }}
                    onPaste={handleOtpPaste}
                  >
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        style={{
                          width: "100%",
                          maxWidth: "44px",
                          height: "50px",
                          borderRadius: "12px",
                          border: "2px solid #CBD5E1",
                          textAlign: "center",
                          fontSize: "18px",
                          fontWeight: "800",
                          color: "#0F172A",
                          outline: "none",
                          transition: "all 0.2s ease",
                          background: "#FFFFFF",
                          padding: 0,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                        onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                      />
                    ))}
                  </div>

                  <div style={{ fontSize: "13.5px", color: "#64748B" }}>
                    Didn't receive the code?{" "}
                    {timer > 0 ? (
                      <strong style={{ color: "#2563EB" }}>Resend in {timer}s</strong>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading.otp}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563EB",
                          fontWeight: "700",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {loading.otp ? "Sending..." : "Resend OTP"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* REMEMBER / FORGOT */}
              {loginType === "password" && (
                <div className="form-options">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      className="remember-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => setShowForgotPasswordModal(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {loginType === "otp" && !otpSent && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => setShowForgotMobileModal(true)}
                  >
                    Forgot Mobile Number?
                  </button>
                </div>
              )}

              {/* LOGIN BUTTON */}
              {!(loginType === "otp" && otpSent) && (
                <button
                  type={loginType === "password" ? "submit" : "button"}
                  onClick={loginType === "otp" ? handleSendOtp : undefined}
                  disabled={loginType === "password" ? loading.login : loading.otp}
                  className="login-submit"
                >
                  <Lock size={22} />

                  <span>
                    {loginType === "password"
                      ? loading.login
                        ? "Verifying Credentials..."
                        : "Login to Account"
                      : loading.otp
                      ? "Sending Code..."
                      : "Send OTP Code"}
                  </span>

                  <span className="login-submit-arrow">
                    <ArrowRight size={24} />
                  </span>
                </button>
              )}
            </form>

            {/* SECURITY MESSAGE */}
            <div className="security-message">
              <ShieldCheck size={20} />
              <span>
                Your data is <strong>100% secure</strong> with 256-bit SSL encryption
              </span>
            </div>
          </div>
        </section>

        {/* ================= PARTNER SECTION ================= */}
        <section className="partner-section">
          <div className="partner-heading">
            <h2>New to GharKaPaisa?</h2>
            <p>Join thousands of financial partners earning zero-investment commissions</p>
          </div>

          <button
            type="button"
            className="partner-card"
            onClick={() => navigate("/register")}
          >
            <div className="partner-icon">
              <Gift size={34} />
            </div>

            <div className="partner-content">
              <h3>Become a Partner</h3>
              <p>
                Grow your referral business and earn attractive direct payouts with instant wallet withdrawals
              </p>
            </div>

            <ArrowRight className="partner-arrow" size={28} />
          </button>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="features">
          <FeatureCard
            icon={<ShieldCheck size={27} />}
            iconType="green"
            title="Secure & Safe"
            description={
              <>
                Bank-grade
                <br />
                encryption
              </>
            }
          />

          <FeatureCard
            icon={<Zap size={27} />}
            iconType="blue"
            title="Fast & Easy"
            description={
              <>
                Instant access to
                <br />
                your dashboard
              </>
            }
          />

          <FeatureCard
            icon={<Headphones size={27} />}
            iconType="orange"
            title="24/7 Support"
            description={
              <>
                Dedicated help
                <br />
                desk assistant
              </>
            }
          />

          <FeatureCard
            icon={<BadgeCheck size={27} />}
            iconType="green"
            title="Trusted Platform"
            description={
              <>
                Trusted by
                <br />
                100K+ partners
              </>
            }
          />
        </section>

        {/* ================= BACK HOME ================= */}
        <button
          type="button"
          className="back-home"
          onClick={() => navigate("/")}
        >
          <Home size={20} />
          <span>Back to Home</span>
        </button>
      </main>

      {/* ================= CHATBOT OPTION ================= */}
      <Chatbot />

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "30px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                Reset Your Password
              </h3>
              <X
                size={22}
                onClick={closeForgotPasswordModal}
                style={{ cursor: "pointer", color: "#64748B" }}
              />
            </div>

            {forgotSuccess ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <Check size={48} color="#10B981" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14.5px", color: "#334155", lineHeight: 1.5 }}>
                  Password reset link has been sent to your email! Please check your inbox.
                </p>
                <button
                  type="button"
                  onClick={closeForgotPasswordModal}
                  className="login-submit"
                  style={{ marginTop: "16px" }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit}>
                <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "16px" }}>
                  Enter your registered email address below to receive password reset instructions.
                </p>

                {forgotError && (
                  <div style={{ color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>
                    {forgotError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your.email@domain.com"
                      className="form-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="login-submit"
                >
                  {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FORGOT MOBILE MODAL */}
      {showForgotMobileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "30px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                Recover Mobile Number
              </h3>
              <X
                size={22}
                onClick={() => setShowForgotMobileModal(false)}
                style={{ cursor: "pointer", color: "#64748B" }}
              />
            </div>

            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "20px" }}>
              If you forgot your registered mobile number, you can sign in using your email address and password or contact our support team.
            </p>

            <button
              type="button"
              className="login-submit"
              onClick={() => {
                setShowForgotMobileModal(false);
                setLoginType("password");
              }}
            >
              Switch to Password Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SECURITY ILLUSTRATION COMPONENT
========================================================= */

const SecurityIllustration = () => {
  return (
    <div className="security-illustration">
      <div className="security-orbit"></div>

      <div className="security-shield">
        <div className="security-lock">
          <Lock size={30} color="#2563eb" />
        </div>
      </div>

      <div className="security-badge-item security-user">
        <UserRound size={26} />
      </div>

      <div className="security-badge-item security-card-icon">
        <CreditCard size={24} color="#2563eb" />
      </div>

      <div className="security-badge-item security-check">
        <Check size={26} />
      </div>
    </div>
  );
};

/* =========================================================
   FEATURE CARD COMPONENT
========================================================= */

const FeatureCard = ({ icon, iconType, title, description }) => {
  return (
    <div className="feature-card">
      <div className={`feature-icon ${iconType}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};
