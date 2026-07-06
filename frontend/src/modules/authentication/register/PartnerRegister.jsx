import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useMsg91OTP } from "../../../hooks/useMsg91OTP";
import { registerPartner, lookupUser, sendRegistrationOtp, verifyRegistrationOtp } from "../../../services/auth.api.js";
import api from "../../../services/api";
import LanguageSwitcher from "../../../components/LanguageSwitcher/LanguageSwitcher";

import logoImg from "../../../assets/logos/logo.png";
import welcomeBgImg from "./welcome pg-bg.png";

const STEPS = ["Personal", "Business", "Bank", "KYC"];

const COMPANY_TYPES = [
  { label: "Individual", value: "individual" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership", value: "partnership" },
  { label: "Private Limited Company", value: "pvt_ltd" },
];

const INDIA_BANKS = [
  'State Bank of India', 'Punjab National Bank', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
  'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'IDBI Bank', 'Indian Bank', 'Indian Overseas Bank',
  'Yes Bank', 'IDFC First Bank', 'IndusInd Bank', 'Federal Bank', 'Central Bank of India', 'UCO Bank',
  'Bank of India', 'Punjab & Sind Bank', 'AU Small Finance Bank', 'Bandhan Bank', 'RBL Bank', 'Karur Vysya Bank',
  'Karnataka Bank', 'South Indian Bank', 'Tamilnad Mercantile Bank', 'City Union Bank', 'Jammu & Kashmir Bank',
  'DCB Bank', 'Yes Bank', 'PNB Housing Finance', 'Axis Small Finance Bank', 'Suryoday Small Finance Bank',
  'Equitas Small Finance Bank', 'Fincare Small Finance Bank', 'Ujjivan Small Finance Bank', 'IDFC First Bank',
  'IIFL Finance', 'Nainital Bank', 'J&K Bank', 'Lakshmi Vilas Bank', 'Punjab National Bank (PNB)',
  'Bank of Maharashtra', 'Syndicate Bank', 'Andhra Bank', 'Oriental Bank of Commerce', 'Vijaya Bank',
  'Yes Bank', 'West Bengal State Co-operative Bank', 'North East Small Finance Bank', 'Small Industries Development Bank of India'
].sort();

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'hi', flag: '🇮🇳', label: 'हिंदी' },
  { code: 'mr', flag: '🇮🇳', label: 'मराठी' },
  { code: 'te', flag: '🇮🇳', label: 'తెలుగు' },
  { code: 'kn', flag: '🇮🇳', label: 'ಕನ್ನಡ' },
  { code: 'ta', flag: '🇮🇳', label: 'தமிழ்' },
  { code: 'gu', flag: '🇮🇳', label: 'ગુજરાતી' },
  { code: 'bn', flag: '🇮🇳', label: 'বাংলা' },
  { code: 'or', flag: '🇮🇳', label: 'ଓଡ଼ିଆ' }
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const onBack = () => navigate('/login');
  const { t, i18n } = useTranslation();
  
  const { C, isDark, toggle } = useTheme();
  const S = makeS(C);

  // Onboarding Screen Steps: 1 = Welcome, 2 = Preferences, 3 = Register Forms
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState(i18n.language || "en");

  const [step, setStep] = useState(0); // 0 = Personal, 1 = Business, 2 = Bank, 3 = KYC
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // { Partner_code }

  const [aadhaarBackendError, setAadhaarBackendError] = useState("");
  const [fullName, setFullName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Flat form state for all steps
  const [form, setForm] = useState({
    // Step 0 – Personal
    firstName: "", lastName: "", mobile: "",
    email: "", password: "", confirmPassword: "",
    aadhaar: "",
    emailOtp: "",
    emailPreVerified: false,
    mobileOtp: "",
    mobilePreVerified: false,
    // Step 1 – Business
    companyName: "",
    currentAddress: "",
    pincode: "",
    businessLocation: "",
    companyType: "individual", gst: "",
    // Step 2 – Bank
    bankName: "", accountNumber: "", ifsc: "", accountHolderName: "",
    // Step 3 – KYC text
    pan: "",
    termsAgreed: false,
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    setFullName(value);
    const parts = value.trim().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ") || "";
    setForm(f => ({ ...f, firstName: first, lastName: last }));
  };

  const handleLangSelect = (code) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem("i18nextLng", code);
  };

  const handleThemeSelect = (mode) => {
    if (mode === "dark" && !isDark) toggle();
    if (mode === "light" && isDark) toggle();
  };

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpTimer, setMobileOtpTimer] = useState(0);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileVerifyLoading, setMobileVerifyLoading] = useState(false);
  const [mobileOtpRequestId, setMobileOtpRequestId] = useState("");
  const mobileVerifyPendingRef = useRef(false);
  const mobileVerifyTimeoutRef = useRef(null);
  
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      // Track referral click (non-blocking)
      api.post(`/partner/referral-click?ref=${encodeURIComponent(ref)}`).catch(err => {
        console.error("Failed to track referral click:", err);
      });
    }
  }, []);

  const getMsg91RequestId = (data) => {
    const candidates = [
      data?.requestId,
      data?.request_id,
      data?.reqId,
      data?.otpRequestId,
      data?.message,
      data?.data?.requestId,
      data?.data?.request_id,
      data?.data?.reqId,
      data?.data?.otpRequestId,
      data?.data?.message,
    ];

    return candidates
      .map(value => String(value || '').trim())
      .find(value => /^[A-Za-z0-9_-]{8,}$/.test(value)) || "";
  };

  const completeMobileVerification = () => {
    if (mobileVerifyTimeoutRef.current) clearTimeout(mobileVerifyTimeoutRef.current);
    mobileVerifyPendingRef.current = false;
    mobileVerifyTimeoutRef.current = null;
    setForm(f => ({ ...f, mobilePreVerified: true }));
    setMobileOtpSent(false);
    setMobileOtpTimer(0);
    setMobileOtpRequestId("");
    setInfoMsg(t('partner.mobileVerified', 'Mobile number successfully verified.'));
    setMobileVerifyLoading(false);
  };

  const failMobileVerification = (failure) => {
    if (mobileVerifyTimeoutRef.current) clearTimeout(mobileVerifyTimeoutRef.current);
    mobileVerifyPendingRef.current = false;
    mobileVerifyTimeoutRef.current = null;
    const errorMsg = typeof failure === 'string'
      ? failure
      : (failure?.message || t('partner.errors.verifyMobileOtpFailed', 'Incorrect OTP. Please try again.'));
    setErr(errorMsg);
    setMobileVerifyLoading(false);
  };

  useEffect(() => {
    if (!form.email) return;
    setEmailOtpSent(false);
    setEmailOtpTimer(0);
    setForm(f => ({ ...f, emailPreVerified: false, emailOtp: '' }));
  }, [form.email]);

  useEffect(() => {
    if (!form.mobile) return;
    setMobileOtpSent(false);
    setMobileOtpTimer(0);
    setMobileOtpRequestId("");
    setForm(f => ({ ...f, mobilePreVerified: false, mobileOtp: '' }));
  }, [form.mobile]);

  useEffect(() => {
    setAadhaarBackendError("");
  }, [form.aadhaar]);

  useEffect(() => {
    let t;
    if (emailOtpTimer > 0) t = setTimeout(() => setEmailOtpTimer(emailOtpTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [emailOtpTimer]);

  useEffect(() => {
    let t;
    if (mobileOtpTimer > 0) t = setTimeout(() => setMobileOtpTimer(mobileOtpTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [mobileOtpTimer]);

  // ── MSG91 OTP SDK readiness ─────────
  const { sdkReady } = useMsg91OTP();

  const focusBorder = `1.5px solid #0D6EFD`;
  const inputProps = (key, extra = {}) => ({
    style: { ...S.input, ...extra },
    value: form[key],
    onChange: set(key),
    onFocus: e => (e.target.style.border = focusBorder),
    onBlur: e => (e.target.style.border = `1.5px solid ${C.border}`),
  });

  // ── Step Validation ─────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) { // Step 1: Personal
      if (!fullName.trim()) return t("partner.errors.enterFullName", "Please enter your full name.");
      if (!form.firstName.trim()) return t("partner.errors.firstNameRequired", "Please enter your first name.");
      if (!/^[a-zA-Z\s]+$/.test(form.firstName.trim())) return t("partner.errors.firstNameLettersOnly", "First name can only contain letters.");
      if (!form.mobile.trim()) return t("partner.errors.mobileRequired", "Please enter your mobile number.");
      if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return t("partner.errors.mobileInvalid", "Please enter a valid 10-digit mobile number.");
      if (!form.mobilePreVerified) return t("partner.errors.verifyMobile", "Please verify your mobile number with OTP before continuing.");

      if (!form.email.trim()) return t("partner.errors.emailRequired", "Please enter your email address.");
      if (!/\S+@\S+\.\S+/.test(form.email)) return t("partner.errors.emailInvalid", "Please enter a valid email address.");
      if (!form.emailPreVerified) return t("partner.errors.verifyEmail", "Please verify your email address with OTP before continuing.");

      const cleanAadhaar = form.aadhaar.replace(/[\s-]/g, "");
      if (!cleanAadhaar) return t("partner.errors.aadhaarRequired", "Please enter your Aadhaar number.");
      if (!/^\d{12}$/.test(cleanAadhaar)) return t("partner.errors.aadhaarInvalid", "Please enter a valid 12-digit Aadhaar number.");


      if (!form.password) return t("partner.errors.passwordRequired", "Please enter a password.");
      if (form.password.length < 8) return t("partner.errors.passwordMinLength", "Password must be at least 8 characters.");
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        return t("partner.errors.passwordStrength", "Password must contain uppercase, lowercase and a number.");
      if (form.password !== form.confirmPassword) return t("partner.errors.passwordsMismatch", "Passwords do not match.");
    }
    if (step === 1) { // Step 2: Business details
      if (!form.companyName.trim()) return t("partner.errors.companyNameRequired", "Company name is required.");
      if (!form.currentAddress.trim()) return t("partner.errors.companyAddressRequired", "Company address is required.");
      if (!form.pincode.trim()) return t("partner.errors.pincodeRequired", "Pincode is required.");
      if (!/^\d{6}$/.test(form.pincode.trim())) return t("partner.errors.pincodeInvalid", "Please enter a valid 6-digit Pincode.");
      if (!form.businessLocation.trim()) return t("partner.errors.businessLocationRequired", "City / Region is required.");
      if (form.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gst.trim())) {
        return t("partner.errors.gstInvalid", "Please enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV).");
      }
    }
    if (step === 2) { // Step 3: Bank Account details
      if (!form.bankName.trim()) return t("partner.errors.bankNameRequired", "Please enter your bank name.");
      if (!form.accountNumber.trim()) return t("partner.errors.accountNumberRequired", "Please enter your account number.");
      if (!/^\d{9,18}$/.test(form.accountNumber.trim())) return t("partner.errors.accountNumberInvalid", "Please enter a valid 9 to 18-digit account number.");
      if (!form.ifsc.trim()) return t("partner.errors.ifscRequired", "Please enter your IFSC code.");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())) {
        return t("partner.errors.ifscInvalid", "Please enter a valid 11-digit IFSC code (e.g. HDFC0001234).");
      }
      if (!form.accountHolderName.trim()) return t("partner.errors.accountHolderRequired", "Please enter account holder name.");
    }
    if (step === 3) { // Step 4: KYC Details
      if (!form.pan.trim()) return t("partner.errors.panRequired", "Please enter your PAN number.");
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) return t("partner.errors.panInvalid", "Please enter a valid 10-character PAN number.");
      if (!form.termsAgreed) return t("partner.errors.acceptTerms", "You must agree to the Terms & Conditions and Privacy Policy to proceed.");
    }
    return null;
  };

  const handleSendMobileOtp = () => {
    console.log('[MSG91] Send Mobile OTP button clicked (PartnerRegister)');
    setErr('');
    if (!form.mobile.trim()) return setErr(t('partner.errors.mobileRequired', 'Please enter your mobile number.'));
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return setErr(t('partner.errors.mobileInvalid', 'Please enter a valid 10-digit mobile number.'));

    setErr('');
    setInfoMsg('');
    setMobileOtpLoading(true);

    const formattedMobile = '91' + form.mobile.trim();
    const timeoutId = setTimeout(() => {
      setMobileOtpLoading(false);
      console.error('[MSG91] Send Mobile OTP callback timeout');
      setErr(t('partner.errors.msg91Timeout', 'OTP provider did not respond. Please refresh and try again.'));
    }, 30000);

    if (!sdkReady) {
      clearTimeout(timeoutId);
      setMobileOtpLoading(false);
      return setErr(t('partner.errors.msg91NotLoaded', 'OTP provider is loading. Please try again in a moment.'));
    }

    console.log(`[MSG91] Calling window.sendOtp for mobile: ${formattedMobile}`);
    try {
      window.sendOtp(
        formattedMobile,
        (data) => {
          clearTimeout(timeoutId);
          const requestId = getMsg91RequestId(data);
          if (requestId) setMobileOtpRequestId(requestId);
          setMobileOtpSent(true);
          setMobileOtpTimer(60);
          setMobileOtpLoading(false);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('[MSG91] Mobile Failure response:', error);
          const errorMsg = typeof error === 'string' ? error : (error?.message || t('partner.errors.sendMobileOtpFailed', 'Failed to send SMS OTP. Please try again.'));
          setErr(errorMsg);
          setMobileOtpLoading(false);
        }
      );
    } catch (err) {
      clearTimeout(timeoutId);
      setErr("An unexpected error occurred. Please try again.");
      setMobileOtpLoading(false);
    }
  };

  const handleResendMobileOtp = () => {
    if (typeof window.retryOtp !== 'function') {
      return setErr(t('partner.errors.msg91NotLoaded', 'OTP provider not loaded.'));
    }

    setErr('');
    setInfoMsg('');
    setMobileOtpLoading(true);
    const timeoutId = setTimeout(() => {
      setMobileOtpLoading(false);
      setErr(t('partner.errors.msg91Timeout', 'OTP provider did not respond. Please refresh and try again.'));
    }, 30000);

    const retryArgs = [
      '11',
      (data) => {
        clearTimeout(timeoutId);
        const requestId = getMsg91RequestId(data);
        if (requestId) setMobileOtpRequestId(requestId);
        setMobileOtpTimer(60);
        setMobileOtpLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        const errorMsg = typeof error === 'string' ? error : (error?.message || t('partner.errors.resendMobileOtpFailed', 'Failed to resend SMS OTP.'));
        setErr(errorMsg);
        setMobileOtpLoading(false);
      }
    ];
    if (mobileOtpRequestId) retryArgs.push(mobileOtpRequestId);
    window.retryOtp(...retryArgs);
  };

  const handleVerifyMobileOtp = () => {
    if (!/^\d{6}$/.test(form.mobileOtp.trim())) {
      return setErr(t('partner.errors.enterMobileOtp', 'Please enter the 6-digit OTP.'));
    }

    setErr('');
    setInfoMsg('');
    setMobileVerifyLoading(true);
    const timeoutId = setTimeout(() => {
      mobileVerifyPendingRef.current = false;
      mobileVerifyTimeoutRef.current = null;
      setMobileVerifyLoading(false);
      setErr(
        mobileOtpRequestId
          ? t('partner.errors.msg91Timeout', 'OTP provider did not respond. Please refresh and try again.')
          : t('partner.errors.msg91MissingRequestId', 'OTP session was not created correctly. Please resend OTP and try again.')
      );
    }, 30000);
    mobileVerifyPendingRef.current = true;
    mobileVerifyTimeoutRef.current = timeoutId;

    if (typeof window.verifyOtp !== 'function') {
      clearTimeout(timeoutId);
      mobileVerifyPendingRef.current = false;
      mobileVerifyTimeoutRef.current = null;
      setMobileVerifyLoading(false);
      return setErr(t('partner.errors.msg91NotLoaded', 'OTP provider not loaded.'));
    }

    const verifyArgs = [
      Number(form.mobileOtp.trim()),
      (data) => {
        completeMobileVerification();
      },
      (error) => {
        failMobileVerification(error);
      }
    ];
    if (mobileOtpRequestId) verifyArgs.push(mobileOtpRequestId);
    window.verifyOtp(...verifyArgs);
  };

  const handleSendRegistrationOtp = async () => {
    setErr('');
    if (!form.email.trim()) return setErr(t('partner.errors.emailRequired', 'Please enter your email address.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setErr(t('partner.errors.emailInvalid', 'Please enter a valid email address.'));

    setErr('');
    setInfoMsg('');
    setEmailOtpLoading(true);
    try {
      await sendRegistrationOtp(form.email.trim());
      setEmailOtpSent(true);
      setEmailOtpTimer(60);
      setInfoMsg(t('partner.emailOtpSent', 'OTP sent to your email address.'));
    } catch (err) {
      setErr(err.message || t('partner.errors.sendOtpFailed', 'Failed to send OTP. Please try again.'));
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    if (!form.email.trim()) return setErr(t('partner.errors.emailRequired', 'Please enter your email address.'));
    if (!form.emailOtp.trim() || form.emailOtp.trim().length < 6) return setErr(t('partner.errors.enterEmailOtp', 'Please enter the 6-digit OTP.'));

    setErr('');
    setInfoMsg('');
    setEmailOtpLoading(true);
    try {
      await verifyRegistrationOtp(form.email.trim(), form.emailOtp.trim());
      setForm(f => ({ ...f, emailPreVerified: true }));
      setEmailOtpSent(false);
      setEmailOtpTimer(0);
      setInfoMsg(t('partner.emailVerified', 'Email successfully verified.'));
    } catch (err) {
      setErr(err.message || t('partner.errors.verifyOtpFailed', 'Failed to verify OTP. Please try again.'));
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // ── Step Submit / Final Register ─────────────────────────────────────────────
  const handleStepSubmit = async () => {
    setErr("");
    const validationErr = validateStep();
    if (validationErr) return setErr(validationErr);

    // Step 0 check duplicate mobile / email on next
    if (step === 0) {
      setLoading(true);
      try {
        const mobileExists = await lookupUser(form.mobile.trim());
        if (mobileExists?.exists) {
          return setErr(t("partner.errors.mobileExists", "This mobile number is already registered."));
        }

        const emailExists = await lookupUser(form.email.trim());
        if (emailExists?.exists) {
          return setErr(t("partner.errors.emailExists", "This email address is already registered."));
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Final step — call the API
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        current_address: form.currentAddress.trim(),
        business_location: form.businessLocation.trim(),
        company_name: form.companyName.trim(),
        company_type: form.companyType,
        gst_number: form.gst ? form.gst.trim().toUpperCase() : null,
        pincode: form.pincode.trim(),
        bank_name: form.bankName.trim(),
        account_number: form.accountNumber.trim(),
        ifsc_code: form.ifsc ? form.ifsc.trim().toUpperCase() : "",
        account_holder_name: form.accountHolderName.trim(),
        aadhaar: form.aadhaar.replace(/[\s-]/g, ""),
        pan: form.pan ? form.pan.trim().toUpperCase() : "",
        referral_code: referralCode,
        role: "PARTNER",
      };
      const res = await registerPartner(payload);
      if (res.success) {
        setSuccess({ ...res.data, email: form.email });
      } else {
        if (res.errors && Array.isArray(res.errors)) {
          const aadhaarErr = res.errors.find(e => e.field === 'aadhaar');
          if (aadhaarErr) {
            setStep(0); // Redirect back to Personal step
            setAadhaarBackendError(aadhaarErr.message);
            return;
          }
        }
        setErr(res.message || t("partner.errors.registrationFailed", "Registration failed. Please try again."));
      }
    } catch (e) {
      const resData = e.response?.data;
      if (resData && resData.errors && Array.isArray(resData.errors)) {
        const aadhaarErr = resData.errors.find(errObj => errObj.field === 'aadhaar');
        if (aadhaarErr) {
          setStep(0); // Redirect back to Personal step
          setAadhaarBackendError(aadhaarErr.message);
          return;
        }
      }
      setErr(e.message || t("partner.errors.registrationFailedDetails", "Registration failed. Please check your details."));
    } finally {
      setLoading(false);
    }
  };

  const mobileActionDisabled = form.mobilePreVerified || mobileOtpLoading || (mobileOtpSent && mobileOtpTimer > 0);

  // ── Render Onboarding Top Progress Bar ─────────────────────────────────────
  const renderOnboardingProgress = () => {
    return (
      <div id="onboarding-progress-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "320px", width: "100%", margin: "0 auto 16px", position: "relative", flexShrink: 0 }}>
        {/* Connecting Line */}
        <div style={{
          position: "absolute",
          top: "16px",
          left: "12%",
          right: "12%",
          height: "2px",
          background: isDark ? "#1E3D5A" : "#E2E8F0",
          zIndex: 1
        }} />
        <div style={{
          position: "absolute",
          top: "16px",
          left: "12%",
          width: onboardingStep === 1 ? "0%" : onboardingStep === 2 ? "38%" : "76%",
          height: "2px",
          background: "#0D6EFD",
          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1
        }} />
        
        {/* Step 1: Welcome */}
        <div id="progress-step-1" style={{ zIndex: 2, textAlign: "center", width: "80px", cursor: "pointer" }} onClick={() => setOnboardingStep(1)}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: onboardingStep >= 1 ? "#0D6EFD" : isDark ? "#0F2030" : "#E2E8F0",
            color: onboardingStep >= 1 ? "#FFFFFF" : isDark ? "#3D6480" : "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            margin: "0 auto 4px",
            boxShadow: onboardingStep === 1 ? "0 0 12px rgba(13, 110, 253, 0.4)" : "none",
            transition: "all 0.3s"
          }}>
            {onboardingStep > 1 ? "✓" : "1"}
          </div>
          <span id="label-step-1-welcome" style={{ fontSize: "11px", fontWeight: 700, color: onboardingStep >= 1 ? "#0D6EFD" : isDark ? "#3D6480" : "#64748B" }}>
            {t("onboarding.welcomeStep", "Welcome")}
          </span>
        </div>

        {/* Step 2: Preferences */}
        <div id="progress-step-2" style={{ zIndex: 2, textAlign: "center", width: "80px", cursor: onboardingStep >= 2 ? "pointer" : "default" }} onClick={() => onboardingStep >= 2 && setOnboardingStep(2)}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: onboardingStep >= 2 ? "#0D6EFD" : isDark ? "#0F2030" : "#E2E8F0",
            color: onboardingStep >= 2 ? "#FFFFFF" : isDark ? "#3D6480" : "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            margin: "0 auto 4px",
            boxShadow: onboardingStep === 2 ? "0 0 12px rgba(13, 110, 253, 0.4)" : "none",
            transition: "all 0.3s"
          }}>
            {onboardingStep > 2 ? "✓" : "2"}
          </div>
          <span id="label-step-2-pref" style={{ fontSize: "11px", fontWeight: 700, color: onboardingStep >= 2 ? "#0D6EFD" : isDark ? "#3D6480" : "#64748B" }}>
            {t("onboarding.prefStep", "Preferences")}
          </span>
        </div>

        {/* Step 3: Register */}
        <div id="progress-step-3" style={{ zIndex: 2, textAlign: "center", width: "80px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: onboardingStep >= 3 ? "#0D6EFD" : isDark ? "#0F2030" : "#E2E8F0",
            color: onboardingStep >= 3 ? "#FFFFFF" : isDark ? "#3D6480" : "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            margin: "0 auto 4px",
            boxShadow: onboardingStep === 3 ? "0 0 12px rgba(13, 110, 253, 0.4)" : "none",
            transition: "all 0.3s"
          }}>
            3
          </div>
          <span id="label-step-3-register" style={{ fontSize: "11px", fontWeight: 700, color: onboardingStep >= 3 ? "#0D6EFD" : isDark ? "#3D6480" : "#64748B" }}>
            {t("onboarding.regStep", "Register")}
          </span>
        </div>
      </div>
    );
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ ...S.card, padding: "40px 32px", borderRadius: "24px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `${C.green}18`, color: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icons.check size={28} />
            </div>
            <div id="success-title" style={{ fontSize: "22px", fontWeight: 900, color: C.text, marginBottom: "10px" }}>
              {t('partner.registrationSuccessful', 'Registration Successful!')}
            </div>

            {/* Email verification notice */}
            <div style={{
              background: success.email_verified ? `${C.green}12` : `${C.teal}12`,
              border: success.email_verified ? `1.5px solid ${C.green}40` : `1.5px solid ${C.teal}40`,
              borderRadius: "12px",
              padding: "16px 18px",
              marginBottom: "18px",
              textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {success.email_verified ? <Icons.check size={18} color={C.green} /> : <Icons.mail size={18} color={C.teal} />}
                </span>
                <span id="success-email-title" style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
                  {success.email_verified ? t('partner.emailVerifiedTitle', 'Email Verified') : t('partner.verifyEmailTitle', 'Verify Your Email')}
                </span>
              </div>
              <div id="success-email-desc" style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.6 }}>
                {success.email_verified ? (
                  <>
                    {t('partner.emailVerifiedDesc', 'Your email address')} <strong style={{ color: C.text }}>{success.email}</strong> {t('partner.emailVerifiedDescEnd', 'has been verified successfully.')}
                  </>
                ) : (
                  <>
                    {t('partner.verifyEmailDesc', 'A verification email has been sent to')} <strong style={{ color: C.text }}>{success.email}</strong>.
                    {' '}{t('partner.verifyEmailAction', 'Please check your inbox (and spam folder) and click the verification link to activate your login.')}
                  </>
                )}
              </div>
            </div>

            <div style={{ background: C.bgSecondary, borderRadius: "12px", padding: "14px 20px", marginBottom: "16px" }}>
              <div id="success-code-label" style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('partner.partnerCode', 'Your Partner Code')}</div>
              <div id="success-code-value" style={{ fontSize: "24px", fontWeight: 900, color: C.primary, letterSpacing: "4px", marginTop: "4px" }}>{success.partner_code ?? success.Partner_code ?? ''}</div>
            </div>

            <div id="success-team-desc" style={{ fontSize: "13px", color: C.textMid, marginBottom: "20px", lineHeight: 1.6 }}>
              {t('partner.partnerSubmittedDesc', 'Your partner application has been submitted. Our team will review your KYC and activate your account within 24-48 hours.')}
            </div>

            <button id="btn-success-login" onClick={onBack} style={{ ...S.btn("primary"), width: "100%", borderRadius: "14px" }}>
              {t('partner.goToLogin', 'Go to Login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      height: "100dvh",
      background: C.bg,
      color: C.text,
      padding: "12px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Decorative blurred background shapes */}
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: isDark ? "rgba(13, 110, 253, 0.04)" : "rgba(13, 110, 253, 0.05)", filter: "blur(80px)", top: "-120px", left: "-120px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: isDark ? "rgba(46, 144, 250, 0.05)" : "rgba(46, 144, 250, 0.06)", filter: "blur(80px)", bottom: "-80px", right: "-120px", pointerEvents: "none", zIndex: 0 }} />

      <div 
        className="onboarding-container"
        style={{ maxWidth: onboardingStep === 1 ? "420px" : undefined }}
      >

        {/* ── SCREEN 1: Welcome to GharKaPaisa ────────────────────────────────── */}
        {onboardingStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", width: "100%" }}>
            
            {/* Logo and Language switcher Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexShrink: 0, marginBottom: "8px" }}>
              <div style={{ width: "40px" }} />
              <img id="img-onboarding-welcome-logo" src={logoImg} alt={t("login.logoAlt", "GharKaPaisa Logo")} style={{ height: "32px", objectFit: "contain" }} />
              <LanguageSwitcher />
            </div>

            {/* Step indicator */}
            {renderOnboardingProgress()}

            {/* Header Text */}
            <div style={{ textAlign: "center", flexShrink: 0, marginBottom: "8px" }}>
              <h1 id="onboarding-welcome-title" style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 4px", color: C.text, lineHeight: 1.2 }}>
                {t("onboarding.welcomeTo", "Welcome to")}{" "}
                <span style={{ background: "linear-gradient(135deg, #0D6EFD, #2E90FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  GharKaPaisa
                </span>
              </h1>
              <p id="onboarding-welcome-subtitle" style={{ fontSize: "11px", fontWeight: 700, color: C.textLight || "#64748B", margin: "0 0 6px" }}>
                {t("onboarding.trustedPlatform", "India's Trusted Financial Partner Platform")}
              </p>
              <p id="onboarding-welcome-desc" style={{ fontSize: "11px", lineHeight: 1.4, color: C.textMid || "#475569", margin: 0, padding: "0 8px" }}>
                {t("onboarding.description", "Start earning by offering Credit Cards, Loans, Insurance and Financial Services to your customers.")}
              </p>
            </div>

            {/* Illustration Image Container */}
            <div style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              width: "calc(100% + 24px)",
              maxHeight: "340px",
              minHeight: "140px",
              margin: "6px -12px",
              overflow: "hidden"
            }}>
              <img 
                id="img-onboarding-welcome-illustration"
                src={welcomeBgImg} 
                alt={t("onboarding.welcomeBgAlt", "Welcome Background Graphic")} 
                style={{ width: "100%", height: "100%", objectFit: "contain" }} 
              />
            </div>


            {/* Bottom Button */}
            <button
              id="btn-get-started"
              onClick={() => setOnboardingStep(2)}
              style={{
                background: "linear-gradient(135deg, #0D6EFD, #2E90FA)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "14px",
                padding: "12px 18px",
                fontSize: "13px",
                fontWeight: 700,
                width: "100%",
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(13, 110, 253, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                flexShrink: 0
              }}
            >
              <span id="label-get-started">{t("onboarding.getStarted", "Get Started")}</span> <Icons.arrowRight size={14} />
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
                transition: "all 0.2s ease",
                flexShrink: 0,
                marginTop: "8px"
              }}
            >
              <Icons.arrowLeft size={12} /> <span id="label-back-to-home">{t("login.backToHome", "Back to Home")}</span>
            </button>
          </div>
        )}

        {/* ── SCREEN 2: Personalize Your Experience ───────────────────────────── */}
        {onboardingStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            
            {/* Top Back bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "6px", flexShrink: 0 }}>
              <button 
                id="btn-pref-back-arrow"
                onClick={() => setOnboardingStep(1)}
                style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Icons.arrowLeft size={16} />
              </button>
              <LanguageSwitcher />
            </div>

            {/* Step indicator */}
            {renderOnboardingProgress()}

            {/* Title & Subtitle */}
            <div style={{ textAlign: "center", marginBottom: "14px", flexShrink: 0 }}>
              <h2 id="onboarding-pref-title" style={{ fontSize: "20px", fontWeight: 900, margin: 0, color: C.text }}>
                {t("onboarding.personalizeTitle", "Personalize Your Experience")}
              </h2>
              <p id="onboarding-pref-subtitle" style={{ fontSize: "12px", color: C.textLight || "#64748B", marginTop: "4px", margin: 0 }}>
                {t("onboarding.personalizeSubtitle", "Choose your preferred language and theme to continue")}
              </p>
            </div>

            <div className="preferences-layout">
              {/* Section 1: Choose Language */}
              <div className="preferences-section">
                <h3 id="label-choose-language" style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 8px 0", color: C.text, textAlign: "left" }}>
                  {t("onboarding.chooseLanguage", "Choose Your Language")}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {LANGUAGES.map(lang => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <div
                        key={lang.code}
                        id={`lang-card-${lang.code}`}
                        onClick={() => handleLangSelect(lang.code)}
                        style={{
                          background: isSelected ? "rgba(13, 110, 253, 0.08)" : C.card,
                          border: isSelected ? "2px solid #0D6EFD" : `1px solid ${C.border}`,
                          borderRadius: "12px",
                          padding: "8px 4px",
                          textAlign: "center",
                          cursor: "pointer",
                          position: "relative",
                          boxShadow: isSelected ? "0 2px 8px rgba(13, 110, 253, 0.08)" : "none",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ fontSize: "18px", marginBottom: "4px" }}>{lang.flag}</div>
                        <div id={`lang-label-${lang.code}`} style={{ fontSize: "11px", fontWeight: 800, color: C.text }}>{lang.label}</div>
                        {isSelected && (
                          <div style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "#0D6EFD",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "8px"
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Choose Theme */}
              <div className="preferences-section">
                <h3 id="label-choose-theme" style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 8px 0", color: C.text, textAlign: "left" }}>
                  {t("onboarding.chooseTheme", "Choose Theme")}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1, alignItems: "center" }}>
                  {/* Light Mode */}
                  <div
                    id="theme-card-light"
                    onClick={() => handleThemeSelect("light")}
                    style={{
                      background: C.card,
                      border: !isDark ? "2px solid #0D6EFD" : `1px solid ${C.border}`,
                      borderRadius: "14px",
                      padding: "10px",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: !isDark ? "0 2px 8px rgba(13, 110, 253, 0.08)" : "none",
                      transition: "all 0.2s ease",
                      position: "relative",
                      height: "86px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                  >
                    <div id="theme-label-light" style={{ fontSize: "12px", fontWeight: 800, color: C.text }}>
                      {t("onboarding.lightMode", "Light Mode")}
                    </div>
                    
                    {/* Theme mini mockup */}
                    <div style={{
                      marginTop: "6px",
                      height: "28px",
                      background: "#F8FAFC",
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      padding: "3px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px"
                    }}>
                      <div style={{ height: "3px", width: "40%", background: "#CBD5E1", borderRadius: "1.5px" }} />
                      <div style={{ height: "10px", background: "#0D6EFD", borderRadius: "2px", marginTop: "auto" }} />
                    </div>
                    {!isDark && (
                      <div style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#0D6EFD",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8px"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Dark Mode */}
                  <div
                    id="theme-card-dark"
                    onClick={() => handleThemeSelect("dark")}
                    style={{
                      background: C.card,
                      border: isDark ? "2px solid #0D6EFD" : `1px solid ${C.border}`,
                      borderRadius: "14px",
                      padding: "10px",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: isDark ? "0 2px 8px rgba(13, 110, 253, 0.08)" : "none",
                      transition: "all 0.2s ease",
                      position: "relative",
                      height: "86px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                  >
                    <div id="theme-label-dark" style={{ fontSize: "13px", fontWeight: 800, color: C.text }}>
                      {t("onboarding.darkMode", "Dark Mode")}
                    </div>
                    
                    {/* Theme mini mockup */}
                    <div style={{
                      marginTop: "6px",
                      height: "28px",
                      background: "#0B1622",
                      borderRadius: "6px",
                      border: "1px solid #1E3D5A",
                      padding: "3px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px"
                    }}>
                      <div style={{ height: "3px", width: "40%", background: "#3D6480", borderRadius: "2px" }} />
                      <div style={{ height: "10px", background: "#4BAF7D", borderRadius: "2px", marginTop: "auto" }} />
                    </div>
                    {isDark && (
                      <div style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#0D6EFD",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8px"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexShrink: 0 }}>
              <button
                id="btn-pref-back"
                onClick={() => setOnboardingStep(1)}
                style={{
                  background: C.card,
                  color: C.textMid,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "14px",
                  padding: "12px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icons.arrowLeft size={14} /> <span id="label-pref-back">{t("onboarding.back", "Back")}</span>
              </button>
              <button
                id="btn-pref-continue"
                onClick={() => { setOnboardingStep(3); setStep(0); }}
                style={{
                  background: "linear-gradient(135deg, #0D6EFD, #2E90FA)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(13, 110, 253, 0.2)"
                }}
              >
                <span id="label-pref-continue">{t("onboarding.continue", "Continue")}</span> <Icons.arrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: Create Your Partner Account ───────────────────────────── */}
        {onboardingStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            
            {/* Top Back bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "6px", flexShrink: 0 }}>
              <button 
                id="btn-register-back-arrow"
                onClick={() => {
                  setErr("");
                  if (step === 0) {
                    setOnboardingStep(2);
                  } else {
                    setStep(s => s - 1);
                  }
                }}
                style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Icons.arrowLeft size={16} />
              </button>
              <LanguageSwitcher />
            </div>

            {/* Step indicator */}
            {renderOnboardingProgress()}

            {/* Form Title & Subtitle */}
            <div style={{ textAlign: "center", marginBottom: "10px", flexShrink: 0 }}>
              <h2 id="onboarding-register-title" style={{ fontSize: "18px", fontWeight: 900, margin: 0, color: C.text }}>
                {step === 0 && t("onboarding.createAccountTitle", "Create Your Partner Account")}
                {step === 1 && t("onboarding.businessInfoTitle", "Business Information")}
                {step === 2 && t("onboarding.bankInfoTitle", "Bank Account Details")}
                {step === 3 && t("onboarding.kycInfoTitle", "Identity & KYC Details")}
              </h2>
              <p id="onboarding-register-subtitle" style={{ fontSize: "11px", color: C.textLight || "#64748B", marginTop: "3px", margin: 0 }}>
                {step === 0 && t("onboarding.createAccountSubtitle", "Complete your details to become a verified GharKaPaisa Partner")}
                {step === 1 && t("onboarding.businessInfoSubtitle", "Specify your business details and location parameters")}
                {step === 2 && t("onboarding.bankInfoSubtitle", "Enter your settlement bank account details")}
                {step === 3 && t("onboarding.kycInfoSubtitle", "Provide document numbers to start registration")}
              </p>
              <div id="register-substep-indicator" style={{ fontSize: "10px", fontWeight: 800, color: "#0D6EFD", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {t('partner.steps.' + STEPS[step].toLowerCase(), STEPS[step])} {t("onboarding.infoStepSuffix", "Info")} ({step + 1} of {STEPS.length})
              </div>
            </div>

            {/* Scrollable White Card Container */}
            <div 
              className="card-scrollable"
              style={{
                background: C.card,
                border: `1.5px solid ${C.border}`,
                borderRadius: "20px",
                padding: "16px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                margin: "6px 0"
              }}
            >
              
              {/* Error Box */}
              {err && (
                <div className="form-full-width" style={{
                  background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                  borderRadius: "10px", padding: "8px 12px",
                  fontSize: "12px", color: C.red,
                  marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px",
                  textAlign: "left"
                }}>
                  <Icons.x size={12} /> {err}
                </div>
              )}

              {/* Info Message Box */}
              {infoMsg && (
                <div className="form-full-width" style={{
                  background: `${C.green}12`, border: `1.5px solid ${C.green}30`,
                  borderRadius: "10px", padding: "8px 12px",
                  fontSize: "12px", color: C.green,
                  marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px",
                  textAlign: "left"
                }}>
                  <Icons.check size={12} /> {infoMsg}
                </div>
              )}

              {/* ── STEP 1: Personal Details ── */}
              {step === 0 && (
                <div className="form-grid-layout">
                  
                  {/* Full Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-full-name" style={S.label}>{t("onboarding.fullName", "Full Name")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.User size={14} /></span>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={handleFullNameChange}
                        placeholder={t("onboarding.fullNamePlaceholder", "Enter your full name")} 
                        style={{ ...S.input, paddingLeft: "36px", paddingVertical: "10px" }}
                        onFocus={e => (e.target.style.border = focusBorder)}
                        onBlur={e => (e.target.style.border = `1.5px solid ${C.border}`)}
                      />
                    </div>
                  </div>



                  {/* Mobile & OTP */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-mobile" style={S.label}>{t("onboarding.mobileNumber", "Mobile Number")}</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.phone size={14} /></span>
                        <input
                          type="tel"
                          {...inputProps("mobile")}
                          placeholder={t("onboarding.mobilePlaceholder", "10-digit Mobile Number")}
                          style={{ ...S.input, paddingLeft: "36px", paddingVertical: "10px" }}
                          disabled={form.mobilePreVerified}
                        />
                      </div>
                      
                      <button
                        id="btn-send-mobile-otp"
                        type="button"
                        onClick={mobileOtpSent ? handleResendMobileOtp : handleSendMobileOtp}
                        style={{
                          background: form.mobilePreVerified ? `${C.green}15` : "rgba(13, 110, 253, 0.08)",
                          color: form.mobilePreVerified ? C.green : "#0D6EFD",
                          border: form.mobilePreVerified ? `1px solid ${C.green}40` : `1px solid #0D6EFD`,
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: mobileActionDisabled ? "not-allowed" : "pointer",
                          opacity: mobileActionDisabled ? 0.6 : 1
                        }}
                        disabled={mobileActionDisabled}
                      >
                        {form.mobilePreVerified ? t("onboarding.otpVerified", "✓ Verified") : mobileOtpSent ? t("onboarding.otpResend", "Resend") : t("onboarding.otpSend", "Send OTP")}
                      </button>
                    </div>

                    {/* Mobile OTP verify inputs */}
                    {mobileOtpSent && !form.mobilePreVerified && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <input
                          style={{ ...S.input, flex: 1, paddingVertical: "10px" }}
                          value={form.mobileOtp}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setForm(f => ({ ...f, mobileOtp: val }));
                            if (val.length === 6) setTimeout(() => handleVerifyMobileOtp(), 0);
                          }}
                          onPaste={e => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            if (!pasted) return;
                            setForm(f => ({ ...f, mobileOtp: pasted }));
                            if (pasted.length === 6) setTimeout(() => handleVerifyMobileOtp(), 0);
                          }}
                          placeholder={t("onboarding.enterSmsOtp", "Enter 6-digit SMS OTP")}
                          maxLength={6}
                        />
                        <button
                          id="btn-verify-mobile-otp"
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          disabled={mobileVerifyLoading || form.mobileOtp.trim().length < 6}
                          style={{
                            background: "#0D6EFD",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "0 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: (mobileVerifyLoading || form.mobileOtp.trim().length < 6) ? "not-allowed" : "pointer"
                          }}
                        >
                          {mobileVerifyLoading ? t("onboarding.otpVerifying", "Verifying...") : t("onboarding.otpVerify", "Verify OTP")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email & OTP */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-email" style={S.label}>{t("onboarding.emailAddress", "Email Address")}</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.mail size={14} /></span>
                        <input
                          type="email"
                          {...inputProps("email")}
                          placeholder={t("onboarding.emailPlaceholder", "name@domain.com")}
                          style={{ ...S.input, paddingLeft: "36px", paddingVertical: "10px" }}
                          disabled={form.emailPreVerified}
                          autoComplete="email"
                        />
                      </div>
                      
                      <button
                        id="btn-send-email-otp"
                        type="button"
                        onClick={handleSendRegistrationOtp}
                        style={{
                          background: form.emailPreVerified ? `${C.green}15` : "rgba(13, 110, 253, 0.08)",
                          color: form.emailPreVerified ? C.green : "#0D6EFD",
                          border: form.emailPreVerified ? `1px solid ${C.green}40` : `1px solid #0D6EFD`,
                          borderRadius: "10px",
                          padding: "0 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: (form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0)) ? "not-allowed" : "pointer",
                          opacity: (form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0)) ? 0.6 : 1
                        }}
                        disabled={form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0)}
                      >
                        {form.emailPreVerified ? t("onboarding.otpVerified", "✓ Verified") : emailOtpSent ? t("onboarding.otpResend", "Resend") : t("onboarding.otpSend", "Send OTP")}
                      </button>
                    </div>

                    {/* Email OTP verify inputs */}
                    {emailOtpSent && !form.emailPreVerified && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <input
                          style={{ ...S.input, flex: 1, paddingVertical: "10px" }}
                          value={form.emailOtp}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]*"
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setForm(f => ({ ...f, emailOtp: val }));
                            if (val.length === 6) setTimeout(() => handleVerifyRegistrationOtp(), 0);
                          }}
                          onPaste={e => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            if (!pasted) return;
                            setForm(f => ({ ...f, emailOtp: pasted }));
                            if (pasted.length === 6) setTimeout(() => handleVerifyRegistrationOtp(), 0);
                          }}
                          placeholder={t("onboarding.enterEmailOtp", "Enter 6-digit Email OTP")}
                          maxLength={6}
                        />
                        <button
                          id="btn-verify-email-otp"
                          type="button"
                          onClick={handleVerifyRegistrationOtp}
                          disabled={emailOtpLoading || form.emailOtp.trim().length < 6}
                          style={{
                            background: "#0D6EFD",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "0 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: (emailOtpLoading || form.emailOtp.trim().length < 6) ? "not-allowed" : "pointer"
                          }}
                        >
                          {emailOtpLoading ? t("onboarding.otpVerifying", "Verifying...") : t("onboarding.otpVerify", "Verify OTP")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Number */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-aadhaar" style={S.label}>{t("onboarding.aadhaarNumber", "Aadhaar Number")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}>📄</span>
                      <input 
                        type="text" 
                        placeholder={t("onboarding.aadhaarPlaceholder", "Enter 12-digit Aadhaar")} 
                        maxLength={12}
                        {...inputProps("aadhaar")}
                        style={{ ...S.input, paddingLeft: "36px", paddingVertical: "10px" }}
                      />
                    </div>
                    {aadhaarBackendError && (
                      <div id="error-aadhaar-backend" style={{ color: C.red || '#ef4444', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                        {aadhaarBackendError}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-password" style={S.label}>{t("onboarding.password", "Password")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.Lock size={14} /></span>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder={t("onboarding.passwordPlaceholder", "Choose password (min 8 chars)")} 
                        {...inputProps("password")}
                        style={{ ...S.input, paddingLeft: "36px", paddingRight: "36px", paddingVertical: "10px" }}
                        autoComplete="new-password"
                      />
                      <span 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, cursor: "pointer", display: "flex" }}
                      >
                        {showPassword ? <Icons.eyeOff size={14} /> : <Icons.eye size={14} />}
                      </span>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-confirm-password" style={S.label}>{t("onboarding.confirmPassword", "Confirm Password")}</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.Lock size={14} /></span>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder={t("onboarding.confirmPasswordPlaceholder", "Repeat your password")} 
                        {...inputProps("confirmPassword")}
                        style={{ ...S.input, paddingLeft: "36px", paddingRight: "36px", paddingVertical: "10px" }}
                        autoComplete="new-password"
                      />
                      <span 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: C.textLight, cursor: "pointer", display: "flex" }}
                      >
                        {showConfirmPassword ? <Icons.eyeOff size={14} /> : <Icons.eye size={14} />}
                      </span>
                    </div>
                  </div>


                </div>
              )}

              {/* ── STEP 2: Business details ── */}
              {step === 1 && (
                <div className="form-grid-layout">
                  {/* Partner Type */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-partner-type" style={S.label}>{t("onboarding.partnerType", "Partner Type")}</label>
                    <select style={{ ...S.input, paddingVertical: "10px" }} value={form.companyType} onChange={set("companyType")}>
                      {COMPANY_TYPES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Company Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-company-name" style={S.label}>{t("onboarding.companyName", "Company Name")}</label>
                    <input {...inputProps("companyName")} placeholder={t("onboarding.companyNamePlaceholder", "Enter company / firm name")} style={{ ...S.input, paddingVertical: "10px" }} />
                  </div>

                  {/* Company Address */}
                  <div className="form-full-width" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-company-address" style={S.label}>{t("onboarding.companyAddress", "Company Address")}</label>
                    <input {...inputProps("currentAddress")} placeholder={t("onboarding.companyAddressPlaceholder", "Full business address")} style={{ ...S.input, paddingVertical: "10px" }} />
                  </div>

                  {/* Pincode */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-pincode" style={S.label}>{t("onboarding.pincode", "Pincode")}</label>
                    <input {...inputProps("pincode")} maxLength={6} placeholder={t("onboarding.pincodePlaceholder", "6-digit pincode")} style={{ ...S.input, paddingVertical: "10px" }} />
                  </div>

                  {/* City / Region */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-city-region" style={S.label}>{t("onboarding.cityRegion", "City / Region")}</label>
                    <input {...inputProps("businessLocation")} placeholder={t("onboarding.cityRegionPlaceholder", "e.g. Mumbai, Maharashtra")} style={{ ...S.input, paddingVertical: "10px" }} />
                  </div>

                  {/* GST Number */}
                  <div className="form-full-width" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-gst" style={S.label}>{t("onboarding.gstNumber", "GST Number (Optional)")}</label>
                    <input {...inputProps("gst")} placeholder={t("onboarding.gstPlaceholder", "e.g. 27AAPFU0939F1ZV")} style={{ ...S.input, textTransform: "uppercase", paddingVertical: "10px" }} />
                  </div>
                </div>
              )}

              {/* ── STEP 3: Bank Details ── */}
              {step === 2 && (
                <div className="form-grid-layout">
                  {/* Bank Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-bank-name" style={S.label}>{t("onboarding.bankName", "Bank Name")}</label>
                    <input list="onboarding-bank-list" {...inputProps("bankName")} placeholder={t("onboarding.bankNamePlaceholder", "Search and select your bank")} style={{ ...S.input, paddingVertical: "10px" }} />
                    <datalist id="onboarding-bank-list">
                      {INDIA_BANKS.map(bank => <option key={bank} value={bank} />)}
                    </datalist>
                  </div>

                  {/* Account Number */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-account-number" style={S.label}>{t("onboarding.accountNumber", "Account Number")}</label>
                    <input {...inputProps("accountNumber")} placeholder={t("onboarding.accountNumberPlaceholder", "Enter settlement account number")} style={{ ...S.input, paddingVertical: "10px" }} />
                  </div>

                  {/* IFSC Code */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-ifsc" style={S.label}>{t("onboarding.ifscCode", "IFSC Code")}</label>
                    <input {...inputProps("ifsc")} placeholder={t("onboarding.ifscPlaceholder", "Enter 11-digit IFSC code")} style={{ ...S.input, textTransform: "uppercase", paddingVertical: "10px" }} />
                  </div>

                  {/* Account Holder Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-holder-name" style={S.label}>{t("onboarding.accountHolderName", "Account Holder Name")}</label>
                    <input {...inputProps("accountHolderName")} placeholder={t("onboarding.accountHolderPlaceholder", "Name as per bank records")} style={{ ...S.input, paddingVertical: "10px" }} />
                  </div>
                </div>
              )}

              {/* ── STEP 4: KYC Details ── */}
              {step === 3 && (
                <div className="form-grid-layout">
                  {/* PAN Number */}
                  <div className="form-full-width" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label id="label-pan" style={S.label}>{t("onboarding.panNumber", "PAN Number")}</label>
                    <input {...inputProps("pan")} placeholder={t("onboarding.panPlaceholder", "Enter 10-char PAN")} style={{ ...S.input, textTransform: "uppercase", paddingVertical: "10px" }} maxLength={10} />
                  </div>

                  {/* Info callout card */}
                  <div className="form-full-width" style={{
                    background: isDark ? "#112035" : "#F8FAFC",
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    padding: "10px",
                    fontSize: "11px",
                    color: C.textMid,
                    lineHeight: 1.4
                  }}>
                    <strong id="label-note-prefix">{t("onboarding.notePrefix", "Note:")}</strong> {t("onboarding.noteMessage", "Document uploads (PAN card copy & cancelled cheque copy) can be completed from your dashboard after our team reviews your partner profile (takes 24-48 hours).")}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="form-full-width" style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginTop: "4px" }}>
                    <input 
                      type="checkbox" 
                      id="termsAgreed"
                      checked={form.termsAgreed}
                      onChange={e => setForm(f => ({ ...f, termsAgreed: e.target.checked }))}
                      style={{ marginTop: "2px", width: "14px", height: "14px", cursor: "pointer" }}
                    />
                    <label id="label-terms" htmlFor="termsAgreed" style={{ fontSize: "11px", color: C.textMid, cursor: "pointer", userSelect: "none" }}>
                      {t("onboarding.termsAgreement", "I agree to the Terms & Conditions and Privacy Policy.")}
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: "flex", gap: "10px", marginTop: "auto", flexShrink: 0 }}>
              <button
                id="btn-register-back"
                type="button"
                onClick={() => {
                  setErr("");
                  if (step === 0) {
                    setOnboardingStep(2);
                  } else {
                    setStep(s => s - 1);
                  }
                }}
                style={{
                  background: C.card,
                  color: C.textMid,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "14px",
                  padding: "12px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icons.arrowLeft size={14} /> <span id="label-register-back">{step === 0 ? t("onboarding.back", "Back") : t("onboarding.previous", "Previous")}</span>
              </button>
              <button
                id="btn-register-next"
                type="button"
                onClick={handleStepSubmit}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #0D6EFD, #2E90FA)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(13, 110, 253, 0.2)"
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{
                      width: "12px", height: "12px", borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTop: "2px solid #fff",
                      animation: "spin 0.7s linear infinite"
                    }} />
                    {t("onboarding.submitting", "Submitting...")}
                  </span>
                ) : step === STEPS.length - 1 ? (
                  <><span id="label-register-create-account">{t("onboarding.createAccount", "Create Account")}</span> <Icons.check size={14} /></>
                ) : (
                  <><span id="label-register-continue">{t("onboarding.continue", "Continue")}</span> <Icons.arrowRight size={14} /></>
                )}
              </button>
            </div>

            {/* Bottom Log-in Link */}
            <div style={{ textAlign: "center", marginTop: "8px", fontSize: "12px", color: C.textLight, flexShrink: 0 }}>
              <span id="label-already-have-account">{t("onboarding.alreadyHaveAccount", "Already have an account?")}</span>{" "}
              <span 
                id="link-go-to-login"
                onClick={onBack} 
                style={{ color: "#0D6EFD", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
              >
                {t("onboarding.login", "Login")}
              </span>
            </div>

          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .onboarding-container {
          max-width: 430px;
          width: 100%;
          height: 100%;
          max-height: 680px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }
        
        .welcome-split-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        
        .welcome-left {
          display: none;
        }
        
        .welcome-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
          height: 100%;
        }
        
        .illustration-box {
          position: relative;
          background: ${isDark ? "rgba(22, 40, 64, 0.5)" : "rgba(255, 255, 255, 0.6)"};
          backdrop-filter: blur(10px);
          border: 1.5px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)"};
          border-radius: 24px;
          padding: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .preferences-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
          justify-content: center;
        }
        
        .preferences-section {
          display: flex;
          flex-direction: column;
        }
        
        .form-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        
        .form-full-width {
          width: 100%;
        }
        
        .card-scrollable {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(13, 110, 253, 0.2) transparent;
        }
        .card-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .card-scrollable::-webkit-scrollbar-thumb {
          background-color: rgba(13, 110, 253, 0.2);
          border-radius: 3px;
        }
        
        @media (min-width: 992px) {
          .onboarding-container {
            max-width: 860px;
            max-height: 560px;
          }
          
          /* Screen 1: Welcome Side-by-side */
          .welcome-split-layout {
            flex-direction: row;
            align-items: center;
            gap: 32px;
            height: 100%;
          }
          
          .welcome-left {
            flex: 1.1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            max-height: 100%;
            margin: 0;
          }
          
          .welcome-right {
            flex: 0.9;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
          }
          
          .illustration-box {
            height: 400px;
            max-height: 100%;
          }
          
          /* Screen 2: Preferences side-by-side */
          .preferences-layout {
            flex-direction: row;
            gap: 28px;
            align-items: stretch;
          }
          
          .preferences-section {
            flex: 1;
            justify-content: space-between;
          }
          
          /* Screen 3: Form columns */
          .form-grid-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .form-full-width {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  );
}
