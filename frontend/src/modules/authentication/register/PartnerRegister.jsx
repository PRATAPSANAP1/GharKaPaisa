import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icons } from "../../../components/Icon/PartnerIcons";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { useMsg91Captcha } from "../../../hooks/useMsg91Captcha";
import { registerPartner, lookupUser, sendRegistrationOtp, verifyRegistrationOtp } from "../../../services/auth.api.js";

import logoImg from "../../../assets/logos/logo.png";
import onboardingIllust from "../../../assets/advisor_onboarding.png";

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
  { code: 'gu', flag: '🇮🇳', label: 'ગુજરાતી' },
  { code: 'kn', flag: '🇮🇳', label: 'ಕನ್ನಡ' },
  { code: 'ta', flag: '🇮🇳', label: 'தமிழ்' }
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

  const [step, setStep] = useState(0); // Forms nested in step 3
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

  // ── MSG91 Captcha (singleton hook — only active on step 3.1 where captchaId is mounted) ───────────────
  const { isCaptchaVerified, sdkReady, containerId: captchaId } = useMsg91Captcha({ enabled: onboardingStep === 3 && step === 0 });

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
    if (step === 0) {
      if (!fullName.trim()) return "Please enter your full name.";
      if (!form.firstName.trim()) return t("partner.errors.firstNameRequired", "Please enter your first name.");
      if (!/^[a-zA-Z\s]+$/.test(form.firstName.trim())) return t("partner.errors.firstNameLettersOnly", "First name can only contain letters.");
      if (!form.mobile.trim()) return t("partner.errors.mobileRequired", "Please enter your mobile number.");
      if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return t("partner.errors.mobileInvalid", "Please enter a valid 10-digit mobile number.");
      if (!form.email.trim()) return t("partner.errors.emailRequired", "Please enter your email address.");
      if (!/\S+@\S+\.\S+/.test(form.email)) return t("partner.errors.emailInvalid", "Please enter a valid email address.");
      
      const cleanAadhaar = form.aadhaar.replace(/[\s-]/g, "");
      if (!cleanAadhaar) return t("partner.errors.aadhaarRequired", "Please enter your Aadhaar number.");
      if (!/^\d{12}$/.test(cleanAadhaar)) return t("partner.errors.aadhaarInvalid", "Please enter a valid 12-digit Aadhaar number.");

      if (!form.password) return t("partner.errors.passwordRequired", "Please enter a password.");
      if (form.password.length < 8) return t("partner.errors.passwordMinLength", "Password must be at least 8 characters.");
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        return t("partner.errors.passwordStrength", "Password must contain uppercase, lowercase and a number.");
      if (form.password !== form.confirmPassword) return t("partner.errors.passwordsMismatch", "Passwords do not match.");
    }
    if (step === 1) {
      if (!form.companyName.trim()) return t("partner.errors.companyNameRequired", "Company name is required.");
      if (!form.currentAddress.trim()) return t("partner.errors.companyAddressRequired", "Company address is required.");
      if (!form.pincode.trim()) return t("partner.errors.pincodeRequired", "Pincode is required.");
      if (!/^\d{6}$/.test(form.pincode.trim())) return t("partner.errors.pincodeInvalid", "Please enter a valid 6-digit Pincode.");
      if (!form.businessLocation.trim()) return t("partner.errors.businessLocationRequired", "City / Region is required.");
      if (form.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gst.trim())) {
        return t("partner.errors.gstInvalid", "Please enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV).");
      }
    }
    if (step === 2) {
      if (!form.bankName.trim()) return t("partner.errors.bankNameRequired", "Please enter your bank name.");
      if (!form.accountNumber.trim()) return t("partner.errors.accountNumberRequired", "Please enter your account number.");
      if (!/^\d{9,18}$/.test(form.accountNumber.trim())) return t("partner.errors.accountNumberInvalid", "Please enter a valid 9 to 18-digit account number.");
      if (!form.ifsc.trim()) return t("partner.errors.ifscRequired", "Please enter your IFSC code.");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())) {
        return t("partner.errors.ifscInvalid", "Please enter a valid 11-digit IFSC code (e.g. HDFC0001234).");
      }
      if (!form.accountHolderName.trim()) return t("partner.errors.accountHolderRequired", "Please enter account holder name.");
    }
    if (step === 3) {
      if (!form.pan.trim()) return t("partner.errors.panRequired", "Please enter your PAN number.");
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) return t("partner.errors.panInvalid", "Please enter a valid 10-character PAN number.");
      if (!form.termsAgreed) return "You must agree to the Terms & Conditions and Privacy Policy to proceed.";
    }
    return null;
  };

  const handleSendMobileOtp = () => {
    console.log('[MSG91] Send Mobile OTP button clicked (PartnerRegister)');
    setErr('');
    if (!isCaptchaVerified) {
      console.warn('[MSG91] Send Mobile OTP blocked: Captcha not verified');
      return setErr("Please complete the captcha verification first.");
    }
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
    console.time('MSG91_SendOTP');
    try {
      window.sendOtp(
        formattedMobile,
        (data) => {
          clearTimeout(timeoutId);
          console.timeEnd('MSG91_SendOTP');
          console.log('[MSG91] Mobile Success response:', data);
          const requestId = getMsg91RequestId(data);
          setMobileOtpRequestId(requestId);
          if (!requestId) {
            console.warn('MSG91 sendOtp did not return a request id.', data);
          }
          setMobileOtpSent(true);
          setMobileOtpTimer(120);
          setForm(f => ({ ...f, mobileOtp: '' }));
          setInfoMsg(t('partner.mobileOtpSent', 'SMS OTP sent successfully.'));
          setMobileOtpLoading(false);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.timeEnd('MSG91_SendOTP');
          console.error('[MSG91] Mobile Failure response:', error);
          const errorMsg = typeof error === 'string' ? error : (error?.message || t('partner.errors.sendMobileOtpFailed', 'Failed to send SMS OTP. Please try again.'));
          setErr(errorMsg);
          setMobileOtpLoading(false);
        }
      );
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[MSG91] Exception caught calling sendOtp for mobile:', err);
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
      '11', // SMS channel for custom MSG91 configuration
      (data) => {
        clearTimeout(timeoutId);
        const requestId = getMsg91RequestId(data);
        if (requestId) setMobileOtpRequestId(requestId);
        setMobileOtpTimer(120);
        setForm(f => ({ ...f, mobileOtp: '' }));
        setInfoMsg(t('partner.mobileOtpResent', 'SMS OTP resent successfully.'));
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
    console.log('[MSG91] Send Email OTP button clicked (PartnerRegister)');
    setErr('');
    if (!isCaptchaVerified) {
      console.warn('[MSG91] Send Email OTP blocked: Captcha not verified');
      return setErr("Please complete the captcha verification first.");
    }
    if (!form.email.trim()) return setErr(t('partner.errors.emailRequired', 'Please enter your email address.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setErr(t('partner.errors.emailInvalid', 'Please enter a valid email address.'));

    setErr('');
    setInfoMsg('');
    setEmailOtpLoading(true);
    console.log(`[Email OTP] Sending email registration OTP to: ${form.email.trim()}`);
    try {
      const res = await sendRegistrationOtp(form.email.trim());
      console.log('[Email OTP] Success response:', res);
      setEmailOtpSent(true);
      setEmailOtpTimer(120);
      setInfoMsg(t('partner.emailOtpSent', 'OTP sent to your email address.'));
    } catch (err) {
      console.error('[Email OTP] Failure response:', err);
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

    // Step 0 — check duplicate email / mobile and verify email OTP
    if (step === 0) {
      if (!form.emailPreVerified) {
        return setErr(t('partner.errors.verifyEmailBeforeContinue', 'Please verify your email with OTP before continuing.'));
      }
      if (!form.mobilePreVerified) {
        return setErr(t('partner.errors.verifyMobileBeforeContinue', 'Please verify your mobile number with OTP before continuing.'));
      }

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
        // ignore lookup failure and continue with validation
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
        role: "PARTNER",
      };
      const res = await registerPartner(payload);
      if (res.success) {
        setSuccess({ ...res.data, email: form.email });
      } else {
        if (res.errors && Array.isArray(res.errors)) {
          const aadhaarErr = res.errors.find(e => e.field === 'aadhaar');
          if (aadhaarErr) {
            setStep(0);
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
          setStep(0);
          setAadhaarBackendError(aadhaarErr.message);
          return;
        }
      }
      setErr(e.message || t("partner.errors.registrationFailedDetails", "Registration failed. Please check your details."));
    } finally {
      setLoading(false);
    }
  };

  const mobileActionDisabled = form.mobilePreVerified || mobileOtpLoading || (mobileOtpSent && mobileOtpTimer > 0) || !isCaptchaVerified;

  // ── Render Onboarding Top Progress Bar ─────────────────────────────────────
  const renderOnboardingProgress = () => {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "320px", width: "100%", margin: "0 auto 32px", position: "relative" }}>
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
        <div style={{ zIndex: 2, textAlign: "center", width: "80px", cursor: "pointer" }} onClick={() => setOnboardingStep(1)}>
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
            margin: "0 auto 8px",
            boxShadow: onboardingStep === 1 ? "0 0 12px rgba(13, 110, 253, 0.4)" : "none",
            transition: "all 0.3s"
          }}>
            {onboardingStep > 1 ? "✓" : "1"}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: onboardingStep >= 1 ? "#0D6EFD" : isDark ? "#3D6480" : "#64748B" }}>Welcome</span>
        </div>

        {/* Step 2: Preferences */}
        <div style={{ zIndex: 2, textAlign: "center", width: "80px", cursor: onboardingStep >= 2 ? "pointer" : "default" }} onClick={() => onboardingStep >= 2 && setOnboardingStep(2)}>
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
            margin: "0 auto 8px",
            boxShadow: onboardingStep === 2 ? "0 0 12px rgba(13, 110, 253, 0.4)" : "none",
            transition: "all 0.3s"
          }}>
            {onboardingStep > 2 ? "✓" : "2"}
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: onboardingStep >= 2 ? "#0D6EFD" : isDark ? "#3D6480" : "#64748B" }}>Preferences</span>
        </div>

        {/* Step 3: Register */}
        <div style={{ zIndex: 2, textAlign: "center", width: "80px" }}>
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
            margin: "0 auto 8px",
            boxShadow: onboardingStep === 3 ? "0 0 12px rgba(13, 110, 253, 0.4)" : "none",
            transition: "all 0.3s"
          }}>
            3
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: onboardingStep >= 3 ? "#0D6EFD" : isDark ? "#3D6480" : "#64748B" }}>Register</span>
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
            <div style={{ fontSize: "22px", fontWeight: 900, color: C.text, marginBottom: "10px" }}>
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
                <span style={{ fontSize: "18px" }}>{success.email_verified ? "✅" : "📧"}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
                  {success.email_verified ? t('partner.emailVerifiedTitle', 'Email Verified') : t('partner.verifyEmailTitle', 'Verify Your Email')}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: C.textMid, lineHeight: 1.6 }}>
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
              <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('partner.partnerCode', 'Your Partner Code')}</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: C.primary, letterSpacing: "4px", marginTop: "4px" }}>{success.partner_code ?? success.Partner_code ?? ''}</div>
            </div>

            <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "20px", lineHeight: 1.6 }}>
              {t('partner.partnerSubmittedDesc', 'Your partner application has been submitted. Our team will review your KYC and activate your account within 24-48 hours.')}
            </div>

            <button onClick={onBack} style={{ ...S.btn("primary"), width: "100%", borderRadius: "14px" }}>
              {t('partner.goToLogin', 'Go to Login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      padding: "24px 16px",
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
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: isDark ? "rgba(13, 110, 253, 0.05)" : "rgba(13, 110, 253, 0.06)", filter: "blur(80px)", top: "-100px", left: "-100px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: isDark ? "rgba(46, 144, 250, 0.06)" : "rgba(46, 144, 250, 0.07)", filter: "blur(80px)", bottom: "-50px", right: "-100px", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "440px", width: "100%", position: "relative", zIndex: 1 }}>

        {/* ── SCREEN 1: Welcome to GharKaPaisa ────────────────────────────────── */}
        {onboardingStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", minHeight: "90vh", justifyContent: "space-between" }}>
            
            {/* Top Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}>
              <img src={logoImg} alt="GharKaPaisa Logo" style={{ height: "36px", objectFit: "contain" }} />
              <button 
                onClick={() => setOnboardingStep(2)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.textLight || "#64748B",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                Skip
              </button>
            </div>

            {/* Step indicator */}
            {renderOnboardingProgress()}

            {/* Header Text */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, color: C.text }}>
                Welcome to <span style={{ background: "linear-gradient(135deg, #0D6EFD, #2E90FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>GharKaPaisa</span>
              </h1>
              <p style={{ fontSize: "14px", fontWeight: 700, color: C.textLight || "#64748B", marginTop: "6px", margin: 0 }}>
                India's Trusted Financial Partner Platform
              </p>
            </div>

            {/* Illustration Card Container */}
            <div style={{
              position: "relative",
              background: isDark ? "rgba(22, 40, 64, 0.6)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
              borderRadius: "24px",
              padding: "16px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <img 
                src={onboardingIllust} 
                alt="Financial Advisor illustration" 
                style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "16px" }} 
              />
              
              {/* Floating total earnings card */}
              <div style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "8px 12px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.2px" }}>Total Earnings</span>
                <span style={{ fontSize: "14px", fontWeight: 900, color: C.text }}>₹ 48,750</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#22C55E", display: "flex", alignItems: "center", gap: "2px" }}>
                  ▲ 12.5%
                </span>
              </div>
            </div>

            {/* Platform Description */}
            <p style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: C.textMid || "#475569",
              textAlign: "center",
              margin: "0 0 16px 0",
              padding: "0 8px"
            }}>
              Start earning attractive commissions by offering Credit Cards, Loans, Insurance and Financial Services to your customers.
            </p>

            {/* Grid of 4 Feature Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "24px"
            }}>
              {[
                { title: "High Commission", icon: "💎" },
                { title: "Secure KYC", icon: "🔒" },
                { title: "Instant Registration", icon: "⚡" },
                { title: "Real-time Tracking", icon: "📊" }
              ].map((feat, i) => (
                <div 
                  key={i} 
                  style={{
                    background: isDark ? "rgba(22, 40, 64, 0.4)" : "rgba(255, 255, 255, 0.6)",
                    border: `1px solid ${C.border}`,
                    borderRadius: "16px",
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{feat.icon}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: C.text }}>{feat.title}</span>
                </div>
              ))}
            </div>

            {/* Bottom Button */}
            <button
              onClick={() => setOnboardingStep(2)}
              style={{
                background: "linear-gradient(135deg, #0D6EFD, #2E90FA)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "16px",
                padding: "14px 20px",
                fontSize: "15px",
                fontWeight: 700,
                width: "100%",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(13, 110, 253, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.25s"
              }}
            >
              Get Started <Icons.arrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── SCREEN 2: Personalize Your Experience ───────────────────────────── */}
        {onboardingStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", minHeight: "90vh", justifyContent: "space-between" }}>
            
            {/* Top Back bar */}
            <div style={{ display: "flex", width: "100%", marginBottom: "12px", textAlign: "left" }}>
              <button 
                onClick={() => setOnboardingStep(1)}
                style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Icons.arrowLeft size={16} />
              </button>
            </div>

            {/* Step indicator */}
            {renderOnboardingProgress()}

            {/* Title & Subtitle */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: C.text }}>
                Personalize Your Experience
              </h2>
              <p style={{ fontSize: "13px", color: C.textLight || "#64748B", marginTop: "4px", margin: 0 }}>
                Choose your preferred language and theme to continue
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, justifyContent: "center" }}>
              {/* Section 1: Choose Language */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 10px 0", color: C.text }}>
                  1. Choose Your Language
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {LANGUAGES.map(lang => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <div
                        key={lang.code}
                        onClick={() => handleLangSelect(lang.code)}
                        style={{
                          background: isSelected ? "rgba(13, 110, 253, 0.08)" : C.card,
                          border: isSelected ? "2px solid #0D6EFD" : `1.5px solid ${C.border}`,
                          borderRadius: "14px",
                          padding: "12px 6px",
                          textAlign: "center",
                          cursor: "pointer",
                          position: "relative",
                          boxShadow: isSelected ? "0 4px 12px rgba(13, 110, 253, 0.12)" : "none",
                          transition: "all 0.25s ease"
                        }}
                      >
                        <div style={{ fontSize: "24px", marginBottom: "6px" }}>{lang.flag}</div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: C.text }}>{lang.label}</div>
                        {isSelected && (
                          <div style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            width: "14px",
                            height: "14px",
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
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 10px 0", color: C.text }}>
                  2. Choose Theme
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Light Mode */}
                  <div
                    onClick={() => handleThemeSelect("light")}
                    style={{
                      background: C.card,
                      border: !isDark ? "2px solid #0D6EFD" : `1.5px solid ${C.border}`,
                      borderRadius: "16px",
                      padding: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: !isDark ? "0 4px 12px rgba(13, 110, 253, 0.1)" : "none",
                      transition: "all 0.25s ease",
                      position: "relative"
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>☀️ Light Mode</div>
                    
                    {/* Theme mini mockup */}
                    <div style={{
                      marginTop: "8px",
                      height: "40px",
                      background: "#F8FAFC",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      padding: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px"
                    }}>
                      <div style={{ height: "4px", width: "40%", background: "#CBD5E1", borderRadius: "2px" }} />
                      <div style={{ height: "4px", width: "80%", background: "#E2E8F0", borderRadius: "2px" }} />
                      <div style={{ height: "14px", background: "#0D6EFD", borderRadius: "3px", marginTop: "auto" }} />
                    </div>
                    {!isDark && (
                      <div style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        width: "14px",
                        height: "14px",
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
                    onClick={() => handleThemeSelect("dark")}
                    style={{
                      background: C.card,
                      border: isDark ? "2px solid #0D6EFD" : `1.5px solid ${C.border}`,
                      borderRadius: "16px",
                      padding: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: isDark ? "0 4px 12px rgba(13, 110, 253, 0.1)" : "none",
                      transition: "all 0.25s ease",
                      position: "relative"
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>🌙 Dark Mode</div>
                    
                    {/* Theme mini mockup */}
                    <div style={{
                      marginTop: "8px",
                      height: "40px",
                      background: "#0B1622",
                      borderRadius: "8px",
                      border: "1px solid #1E3D5A",
                      padding: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px"
                    }}>
                      <div style={{ height: "4px", width: "40%", background: "#3D6480", borderRadius: "2px" }} />
                      <div style={{ height: "4px", width: "80%", background: "#112035", borderRadius: "2px" }} />
                      <div style={{ height: "14px", background: "#4BAF7D", borderRadius: "3px", marginTop: "auto" }} />
                    </div>
                    {isDark && (
                      <div style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        width: "14px",
                        height: "14px",
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
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => setOnboardingStep(1)}
                style={{
                  background: C.card,
                  color: C.textMid,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icons.arrowLeft size={16} /> Back
              </button>
              <button
                onClick={() => { setOnboardingStep(3); setStep(0); }}
                style={{
                  background: "linear-gradient(135deg, #0D6EFD, #2E90FA)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(13, 110, 253, 0.25)"
                }}
              >
                Continue <Icons.arrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: Create Your Partner Account ───────────────────────────── */}
        {onboardingStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", minHeight: "95vh" }}>
            
            {/* Top Back bar */}
            <div style={{ display: "flex", width: "100%", marginBottom: "12px", textAlign: "left" }}>
              <button 
                onClick={() => {
                  if (step === 0) {
                    setOnboardingStep(2);
                  } else {
                    setStep(s => s - 1);
                    setErr("");
                  }
                }}
                style={{ background: "transparent", border: "none", color: C.textMid, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Icons.arrowLeft size={16} />
              </button>
            </div>

            {/* Step indicator */}
            {renderOnboardingProgress()}

            {/* Form Title & Subtitle */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: C.text }}>
                {step === 0 && "Create Your Partner Account"}
                {step === 1 && "Business Information"}
                {step === 2 && "Bank Account Details"}
                {step === 3 && "Identity & KYC Documents"}
              </h2>
              <p style={{ fontSize: "13px", color: C.textLight || "#64748B", marginTop: "4px", margin: 0 }}>
                {step === 0 && "Complete your details to become a verified GharKaPaisa Partner"}
                {step === 1 && "Specify your business details and location parameters"}
                {step === 2 && "Enter your settlement bank account details"}
                {step === 3 && "Provide document numbers to start registration"}
              </p>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#0D6EFD", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Step {step + 1} of {STEPS.length}
              </div>
            </div>

            {/* Glassmorphic White Card Container */}
            <div style={{
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)",
              marginBottom: "20px"
            }}>
              
              {/* Error Box */}
              {err && (
                <div style={{
                  background: `${C.red}12`, border: `1.5px solid ${C.red}30`,
                  borderRadius: "12px", padding: "10px 14px",
                  fontSize: "13px", color: C.red,
                  marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
                  textAlign: "left"
                }}>
                  <Icons.x size={14} /> {err}
                </div>
              )}

              {/* Info Message Box */}
              {infoMsg && (
                <div style={{
                  background: `${C.green}12`, border: `1.5px solid ${C.green}30`,
                  borderRadius: "12px", padding: "10px 14px",
                  fontSize: "13px", color: C.green,
                  marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
                  textAlign: "left"
                }}>
                  <Icons.check size={14} /> {infoMsg}
                </div>
              )}

              {/* ── SUB-STEP 3.1: Account Details ── */}
              {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  
                  {/* Full Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Full Name</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.User size={16} /></span>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={handleFullNameChange}
                        placeholder="Enter your full name" 
                        style={{ ...S.input, paddingLeft: "42px" }}
                        onFocus={e => (e.target.style.border = focusBorder)}
                        onBlur={e => (e.target.style.border = `1.5px solid ${C.border}`)}
                      />
                    </div>
                  </div>

                  {/* Mobile & OTP */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>{t('partner.mobileNumber', 'Mobile Number')}</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.phone size={16} /></span>
                        <input
                          type="tel"
                          {...inputProps("mobile")}
                          placeholder="10-digit Mobile Number"
                          style={{ ...S.input, paddingLeft: "42px" }}
                          disabled={form.mobilePreVerified}
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={mobileOtpSent ? handleResendMobileOtp : handleSendMobileOtp}
                        style={{
                          background: form.mobilePreVerified ? `${C.green}15` : "rgba(13, 110, 253, 0.08)",
                          color: form.mobilePreVerified ? C.green : "#0D6EFD",
                          border: form.mobilePreVerified ? `1px solid ${C.green}40` : `1px solid #0D6EFD`,
                          borderRadius: "10px",
                          padding: "0 14px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: mobileActionDisabled ? "not-allowed" : "pointer",
                          opacity: mobileActionDisabled ? 0.6 : 1
                        }}
                        disabled={mobileActionDisabled}
                      >
                        {form.mobilePreVerified ? "✓ Verified" : mobileOtpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>

                    {/* Mobile OTP verify inputs */}
                    {mobileOtpSent && !form.mobilePreVerified && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input
                          style={{ ...S.input, flex: 1 }}
                          value={form.mobileOtp}
                          onChange={e => setForm(f => ({ ...f, mobileOtp: e.target.value.replace(/\D/g, '') }))}
                          placeholder="Enter 6-digit SMS OTP"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          disabled={mobileVerifyLoading || form.mobileOtp.trim().length < 6}
                          style={{
                            background: "#0D6EFD",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "0 16px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: (mobileVerifyLoading || form.mobileOtp.trim().length < 6) ? "not-allowed" : "pointer"
                          }}
                        >
                          {mobileVerifyLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email & OTP */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>{t('partner.emailAddress', 'Email Address')}</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.mail size={16} /></span>
                        <input
                          type="email"
                          {...inputProps("email")}
                          placeholder="name@domain.com"
                          style={{ ...S.input, paddingLeft: "42px" }}
                          disabled={form.emailPreVerified}
                          autoComplete="email"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleSendRegistrationOtp}
                        style={{
                          background: form.emailPreVerified ? `${C.green}15` : "rgba(13, 110, 253, 0.08)",
                          color: form.emailPreVerified ? C.green : "#0D6EFD",
                          border: form.emailPreVerified ? `1px solid ${C.green}40` : `1px solid #0D6EFD`,
                          borderRadius: "10px",
                          padding: "0 14px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: (form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0) || !isCaptchaVerified) ? "not-allowed" : "pointer",
                          opacity: (form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0) || !isCaptchaVerified) ? 0.6 : 1
                        }}
                        disabled={form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0) || !isCaptchaVerified}
                      >
                        {form.emailPreVerified ? "✓ Verified" : emailOtpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>

                    {/* Email OTP verify inputs */}
                    {emailOtpSent && !form.emailPreVerified && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <input
                          style={{ ...S.input, flex: 1 }}
                          value={form.emailOtp}
                          onChange={e => setForm(f => ({ ...f, emailOtp: e.target.value.replace(/\D/g, '') }))}
                          placeholder="Enter 6-digit Email OTP"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyRegistrationOtp}
                          disabled={emailOtpLoading || form.emailOtp.trim().length < 6}
                          style={{
                            background: "#0D6EFD",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "0 16px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: (emailOtpLoading || form.emailOtp.trim().length < 6) ? "not-allowed" : "pointer"
                          }}
                        >
                          {emailOtpLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Number */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Aadhaar Number</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}>📄</span>
                      <input 
                        type="text" 
                        placeholder="Enter 12-digit Aadhaar Number" 
                        maxLength={12}
                        {...inputProps("aadhaar")}
                        style={{ ...S.input, paddingLeft: "42px" }}
                      />
                    </div>
                    {aadhaarBackendError && (
                      <div style={{ color: C.red || '#ef4444', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                        {aadhaarBackendError}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Password</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.Lock size={16} /></span>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Choose password (min 8 chars)" 
                        {...inputProps("password")}
                        style={{ ...S.input, paddingLeft: "42px", paddingRight: "42px" }}
                        autoComplete="new-password"
                      />
                      <span 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, cursor: "pointer", display: "flex" }}
                      >
                        {showPassword ? <Icons.eyeOff size={16} /> : <Icons.eye size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Confirm Password</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, display: "flex" }}><Icons.Lock size={16} /></span>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Repeat your password" 
                        {...inputProps("confirmPassword")}
                        style={{ ...S.input, paddingLeft: "42px", paddingRight: "42px" }}
                        autoComplete="new-password"
                      />
                      <span 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight, cursor: "pointer", display: "flex" }}
                      >
                        {showConfirmPassword ? <Icons.eyeOff size={16} /> : <Icons.eye size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* MSG91 reCAPTCHA container */}
                  <div id={captchaId} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80px", marginTop: "5px", marginBottom: "5px" }} />
                </div>
              )}

              {/* ── SUB-STEP 3.2: Business Information ── */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  
                  {/* Partner Type */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Partner Type</label>
                    <select style={S.input} value={form.companyType} onChange={set("companyType")}>
                      {COMPANY_TYPES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Company Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Company Name</label>
                    <input {...inputProps("companyName")} placeholder="Enter company / firm name" />
                  </div>

                  {/* Company Address */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Company Address</label>
                    <input {...inputProps("currentAddress")} placeholder="Full business address" />
                  </div>

                  {/* Pincode */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Pincode</label>
                    <input {...inputProps("pincode")} maxLength={6} placeholder="6-digit pincode" />
                  </div>

                  {/* City / Region */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>City / Region</label>
                    <input {...inputProps("businessLocation")} placeholder="e.g. Mumbai, Maharashtra" />
                  </div>

                  {/* GST Number */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>GST Number (Optional)</label>
                    <input {...inputProps("gst")} placeholder="e.g. 27AAPFU0939F1ZV" style={{ ...S.input, textTransform: "uppercase" }} />
                  </div>
                </div>
              )}

              {/* ── SUB-STEP 3.3: Bank Details ── */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  
                  {/* Bank Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Bank Name</label>
                    <input list="onboarding-bank-list" {...inputProps("bankName")} placeholder="Search and select your bank" />
                    <datalist id="onboarding-bank-list">
                      {INDIA_BANKS.map(bank => <option key={bank} value={bank} />)}
                    </datalist>
                  </div>

                  {/* Account Number */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Account Number</label>
                    <input {...inputProps("accountNumber")} placeholder="Enter settlement account number" />
                  </div>

                  {/* IFSC Code */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>IFSC Code</label>
                    <input {...inputProps("ifsc")} placeholder="Enter 11-digit IFSC code" style={{ ...S.input, textTransform: "uppercase" }} />
                  </div>

                  {/* Account Holder Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>Account Holder Name</label>
                    <input {...inputProps("accountHolderName")} placeholder="Name as per bank records" />
                  </div>
                </div>
              )}

              {/* ── SUB-STEP 3.4: Bank & KYC Details ── */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                  
                  {/* PAN Number */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={S.label}>PAN Number</label>
                    <input {...inputProps("pan")} placeholder="Enter 10-char PAN" style={{ ...S.input, textTransform: "uppercase" }} maxLength={10} />
                  </div>

                  {/* Info callout card */}
                  <div style={{
                    background: isDark ? "#112035" : "#F8FAFC",
                    border: `1px solid ${C.border}`,
                    borderRadius: "14px",
                    padding: "14px",
                    fontSize: "12px",
                    color: C.textMid,
                    lineHeight: 1.5
                  }}>
                    <strong>Note:</strong> Document uploads (PAN card copy & cancelled cheque copy) can be completed from your dashboard after our team performs the initial review and activates your partner account (typically within 24-48 hours).
                  </div>

                  {/* Terms & Privacy Policy Checkbox */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
                    <input 
                      type="checkbox" 
                      id="termsAgreed"
                      checked={form.termsAgreed}
                      onChange={e => setForm(f => ({ ...f, termsAgreed: e.target.checked }))}
                      style={{ marginTop: "3px", width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label htmlFor="termsAgreed" style={{ fontSize: "12px", color: C.textMid, cursor: "pointer", userSelect: "none" }}>
                      I agree to the <span style={{ color: "#0D6EFD", fontWeight: 700 }}>Terms & Conditions</span> and <span style={{ color: "#0D6EFD", fontWeight: 700 }}>Privacy Policy</span> of GharKaPaisa.
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
              <button
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
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Icons.arrowLeft size={16} /> {step === 0 ? "Back" : "Previous"}
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #0D6EFD, #2E90FA)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  flex: 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(13, 110, 253, 0.25)"
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
                    Submitting...
                  </span>
                ) : step === STEPS.length - 1 ? (
                  <>Create Account <Icons.check size={16} /></>
                ) : (
                  <>Continue <Icons.arrowRight size={16} /></>
                )}
              </button>
            </div>

            {/* Bottom Log-in Link */}
            <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: C.textLight }}>
              Already have an account?{" "}
              <span 
                onClick={onBack} 
                style={{ color: "#0D6EFD", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
              >
                Login
              </span>
            </div>

          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
