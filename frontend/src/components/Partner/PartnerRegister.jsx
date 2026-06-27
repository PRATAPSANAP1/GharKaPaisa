import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";
import { initMsg91 } from "../../msg91Init";
import { registerPartner, lookupUser, sendRegistrationOtp, verifyRegistrationOtp } from "../../api/auth.api";

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

export default function PartnerRegister() {
  const navigate = useNavigate();
  const onBack = () => navigate('/login');
  const { t } = useTranslation();
  
  const { C } = useTheme();
  const S = makeS(C);

  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // { Partner_code }

  const [aadhaarBackendError, setAadhaarBackendError] = useState("");

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
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

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

  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  useEffect(() => {
    let wasVerified = false;
    const interval = setInterval(() => {
      let token = '';
      if (window.hcaptcha && typeof window.hcaptcha.getResponse === 'function') {
        try {
          token = window.hcaptcha.getResponse();
        } catch (e) {}
      }
      if (!token && window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        try {
          token = window.grecaptcha.getResponse();
        } catch (e) {}
      }
      if (!token) {
        const els = document.querySelectorAll('textarea, input');
        for (const el of els) {
          const name = el.getAttribute('name') || '';
          if (name.includes('recaptcha-response') || name.includes('captcha-response')) {
            if (el.value.trim()) {
              token = el.value.trim();
              break;
            }
          }
        }
      }
      const verified = !!token;
      setIsCaptchaVerified(verified);
      
      if (verified && !wasVerified) {
        console.log('[MSG91] TCaptcha verified');
        wasVerified = true;
      } else if (!verified && wasVerified) {
        console.log('[MSG91] TCaptcha verification cleared/expired');
        wasVerified = false;
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === 0) {
      initMsg91();
    }
  }, [step]);

  

  const focusBorder = `1.5px solid ${C.teal}`;
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
      if (!form.firstName.trim()) return t("partner.errors.firstNameRequired", "Please enter your first name.");
      if (!/^[a-zA-Z\s]+$/.test(form.firstName.trim())) return t("partner.errors.firstNameLettersOnly", "First name can only contain letters.");
      if (!form.lastName.trim()) return t("partner.errors.lastNameRequired", "Please enter your last name.");
      if (!/^[a-zA-Z\s]+$/.test(form.lastName.trim())) return t("partner.errors.lastNameLettersOnly", "Last name can only contain letters.");
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

    const sendOtpExists = typeof window.sendOtp === 'function';
    console.log(`[MSG91] window.sendOtp exists: ${sendOtpExists}`);
    if (!sendOtpExists) {
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

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ ...S.card, padding: "40px 32px" }}>
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

            <button onClick={onBack} style={{ ...S.btn("primary"), width: "100%" }}>
              {t('partner.goToLogin', 'Go to Login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 110px)", background: C.bg, padding: "24px 16px", boxSizing: "border-box", transition: "background 0.3s" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", position: "relative" }}>

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <button onClick={onBack} style={{ ...S.btn("ghost"), padding: "6px 8px" }}>
            <Icons.arrowLeft size={18} />
          </button>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>{t('partner.partnerRequest', 'Partner Request')}</div>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: "4px",
                borderRadius: "99px",
                background: i < step ? C.green : i === step ? C.teal : C.border,
                transition: "background 0.3s"
              }} />
              <div style={{
                fontSize: "11px",
                color: i <= step ? C.text : C.textLight,
                fontWeight: i <= step ? 700 : 500,
                marginTop: "6px",
                textAlign: "center"
              }}>{t('partner.steps.' + s.toLowerCase(), s)}</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "18px", borderBottom: `1px solid ${C.border}`, paddingBottom: "10px" }}>
            {t('partner.steps.' + STEPS[step].toLowerCase(), STEPS[step])} {t('partner.information', 'Information')}
          </div>

          {/* Error */}
          {err && (
            <div style={{
              background: `${C.red}15`, border: `1px solid ${C.red}40`,
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: C.red,
              marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.x size={14} /> {err}
            </div>
          )}

          {/* Info Message */}
          {infoMsg && (
            <div style={{
              background: `${C.green}15`, border: `1px solid ${C.green}40`,
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: C.green,
              marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.check size={14} /> {infoMsg}
            </div>
          )}

          {/* ── Step 0: Personal ──────────────────────────────────────────────── */}
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={S.label}>{t('partner.firstName', 'First Name')}</label>
                <input {...inputProps("firstName")} />
              </div>
              <div>
                <label style={S.label}>{t('partner.lastName', 'Last Name')}</label>
                <input {...inputProps("lastName")} />
              </div>

              {/* Aadhaar Number */}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.aadhaarNumber', 'Aadhaar Number')}</label>
                <input
                  type="text"
                  placeholder={t('partner.aadhaarPlaceholder', 'Enter 12-digit Aadhaar Number')}
                  maxLength={19}
                  {...inputProps("aadhaar")}
                />
                {aadhaarBackendError && (
                  <div style={{ color: C.red || '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>
                    {aadhaarBackendError}
                  </div>
                )}
              </div>

              {/* Mobile */}
              <div style={{ gridColumn: "1/-1", display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>{t('partner.mobileNumber', 'Mobile Number')}</label>
                  <input
                    type="tel"
                    {...inputProps("mobile")}
                    placeholder={t('partner.mobilePlaceholder', '10-digit Mobile Number')}
                    disabled={form.mobilePreVerified}
                  />

                  {/* Mobile OTP input shown after sending OTP */}
                  {mobileOtpSent && !form.mobilePreVerified && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'stretch' }}>
                      <input
                        style={{ ...S.input, flex: 1 }}
                        value={form.mobileOtp}
                        onChange={e => setForm(f => ({ ...f, mobileOtp: e.target.value.replace(/\D/g, '') }))}
                        placeholder={t('partner.enterMobileOtp', 'Enter 6-digit SMS OTP')}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyMobileOtp}
                        disabled={mobileVerifyLoading || form.mobileOtp.trim().length < 6}
                        style={{ ...S.btn('primary'), minWidth: 170, opacity: (mobileVerifyLoading || form.mobileOtp.trim().length < 6) ? 0.7 : 1 }}
                      >
                        {mobileVerifyLoading ? t('partner.verifying', 'Verifying…') : t('partner.verifyMobileNumber', 'Verify Mobile Number')}
                      </button>
                    </div>
                  )}
                  {mobileOtpSent && !form.mobilePreVerified && (
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>
                      {t('partner.mobileOtpHelp', 'Enter the SMS OTP above, then click Verify Mobile Number.')}
                    </div>
                  )}
                  
                </div>

                <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ visibility: 'hidden' }}>.</label>
                  <button
                    type="button"
                    onClick={mobileOtpSent ? handleResendMobileOtp : handleSendMobileOtp}
                    style={{ ...S.btn('primary'), width: '100%', opacity: mobileActionDisabled ? 0.6 : 1, cursor: mobileActionDisabled ? 'not-allowed' : 'pointer' }}
                    disabled={mobileActionDisabled}
                    title={mobileOtpSent && mobileOtpTimer > 0 ? t('partner.waitBeforeResend', 'Please wait before requesting another OTP.') : ''}
                  >
                    {form.mobilePreVerified 
                      ? t('partner.verified', 'Verified') 
                      : mobileOtpSent 
                        ? (mobileOtpTimer > 0 
                          ? `${t('partner.resendOtp', 'Resend')} (${mobileOtpTimer}s)` 
                          : t('partner.resendOtp', 'Resend OTP')) 
                        : t('partner.sendVerify', 'Send OTP')}
                  </button>
                </div>
              </div>
              {!isCaptchaVerified && !form.mobilePreVerified && (
                <div style={{ gridColumn: "1/-1", color: C.textLight || "#64748b", fontSize: "11.5px", marginTop: "-8px", marginBottom: "8px", fontWeight: 500 }}>
                  Please complete the security verification to enable OTP.
                </div>
              )}

              {/* reCAPTCHA container */}
              <div
                id="msg91-captcha-global"
                style={{
                  gridColumn: "1/-1",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "80px",
                  marginTop: "10px",
                  marginBottom: "5px",
                }}
              ></div>
              <div style={{ gridColumn: "1/-1", fontSize: "11.5px", color: C.textLight || "#64748b", textAlign: "center", marginBottom: "12px", fontWeight: 600 }}>
                Note: First resolve the captcha, then verify/send OTP.
              </div>

              {/* Email */}
              <div style={{ gridColumn: "1/-1", display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>{t('partner.emailAddress', 'Email Address')}</label>
                  <input
                    type="email"
                    {...inputProps("email")}
                    placeholder={t('partner.placeholders.email', 'name@domain.com')}
                    autoComplete="email"
                    disabled={form.emailPreVerified}
                  />

                  {/* Email OTP input shown after sending OTP */}
                  {emailOtpSent && !form.emailPreVerified && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <input
                        style={{ ...S.input, flex: 1 }}
                        value={form.emailOtp}
                        onChange={e => setForm(f => ({ ...f, emailOtp: e.target.value.replace(/\D/g, '') }))}
                        placeholder={t('partner.enterEmailOtp', 'Enter 6-digit OTP')}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyRegistrationOtp}
                        disabled={emailOtpLoading}
                        style={{ ...S.btn('sm') }}
                      >
                        {emailOtpLoading ? t('partner.verifying', 'Verifying…') : t('partner.verifyOtpButton', 'Verify')}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ visibility: 'hidden' }}>.</label>
                  <button
                    type="button"
                    onClick={handleSendRegistrationOtp}
                    style={{ ...S.btn('primary'), width: '100%', opacity: (form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0) || !isCaptchaVerified) ? 0.6 : 1, cursor: (form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0) || !isCaptchaVerified) ? 'not-allowed' : 'pointer' }}
                    disabled={form.emailPreVerified || emailOtpLoading || (emailOtpSent && emailOtpTimer > 0) || !isCaptchaVerified}
                  >
                    {form.emailPreVerified 
                      ? t('partner.verified', 'Verified') 
                      : emailOtpSent 
                        ? (emailOtpTimer > 0 
                          ? `${t('partner.resendOtp', 'Resend')} (${emailOtpTimer}s)` 
                          : t('partner.resendOtp', 'Resend OTP')) 
                        : t('partner.sendVerify', 'Send OTP')}
                  </button>
                </div>
              </div>
              {!isCaptchaVerified && !form.emailPreVerified && (
                <div style={{ gridColumn: "1/-1", color: C.textLight || "#64748b", fontSize: "11.5px", marginTop: "-8px", marginBottom: "8px", fontWeight: 500 }}>
                  Please complete the security verification to enable OTP.
                </div>
              )}

              {/* Password */}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.password', 'Password')}</label>
                <input type="password" style={S.input} {...inputProps("password")} placeholder={t('partner.placeholders.min8chars', 'Min 8 chars')} autoComplete="new-password" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.confirmPassword', 'Confirm Password')}</label>
                <input type="password" style={S.input} {...inputProps("confirmPassword")} placeholder={t('partner.placeholders.repeatPassword', 'Repeat password')} autoComplete="new-password" />
              </div>
            </div>
          )}

          {/* ── Step 1: Business ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={S.label}>{t('partner.partnerType', 'Partner Type')}</label>
                <select style={S.input} value={form.companyType} onChange={set("companyType")}> 
                  {COMPANY_TYPES.map(tOption => <option key={tOption.value} value={tOption.value}>{t('companyTypes.' + tOption.value, tOption.label)}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>{t('partner.companyName', 'Company Name')}</label>
                <input {...inputProps("companyName")} placeholder={t('partner.placeholders.companyName', 'Enter company name')} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.companyAddress', 'Company Address')}</label>
                <input {...inputProps("currentAddress")} placeholder={t('partner.placeholders.companyAddress', 'Enter company address')} />
              </div>
              <div>
                <label style={S.label}>{t('partner.pincode', 'Pincode')}</label>
                <input {...inputProps("pincode")} maxLength={6} placeholder={t('partner.placeholders.pincode', '6-digit pincode')} />
              </div>
              <div>
                <label style={S.label}>{t('partner.businessLocation', 'City / Region')}</label>
                <input {...inputProps("businessLocation")} placeholder={t('partner.placeholders.businessLocation', 'e.g. Mumbai')} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.gstNumber', 'GST Number (Optional)')}</label>
                <input {...inputProps("gst")} placeholder={t('partner.placeholders.gst', 'e.g. 27AAPFU0939F1ZV')} style={{ ...S.input, textTransform: "uppercase" }} />
              </div>
            </div>
          )}

          {/* ── Step 2: Bank ─────────────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.bankName', 'Bank Name')}</label>
                <div style={{ position: 'relative' }}>
                  <input list="bank-list" {...inputProps("bankName")} placeholder={t('partner.selectBank', 'Search and select your bank')} />
                  <datalist id="bank-list">
                    {INDIA_BANKS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label style={S.label}>{t('partner.accountNumber', 'Account Number')}</label>
                <input {...inputProps("accountNumber")} />
              </div>
              <div>
                <label style={S.label}>{t('partner.ifscCode', 'IFSC Code')}</label>
                <input {...inputProps("ifsc")} style={{ ...S.input, textTransform: "uppercase" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.accountHolderName', 'Account Holder Name')}</label>
                <input {...inputProps("accountHolderName")} />
              </div>
            </div>
          )}

          {/* ── Step 3: KYC — Info Screen ─────────────────────────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
                <div>
                  <label style={S.label}>{t('partner.panNumber', 'PAN Number')}</label>
                  <input {...inputProps("pan")} style={{ ...S.input, textTransform: "uppercase" }} placeholder={t('partner.placeholders.pan', '10-char alphanumeric')} />
                </div>
              </div>

              {/* Document Uploads Informational Card */}
              <div style={{
                background: C.bgSecondary || '#f8fafc',
                border: `1.5px solid ${C.border || '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center',
                textAlign: 'center',
                marginTop: '10px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: `${C.teal || '#0ea5e9'}15`,
                  color: C.teal || '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}>
                  📄
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.text || '#1e293b' }}>
                    {t('partner.documentUploadsTitle', 'Document Uploads')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: C.textMid || '#475569', lineHeight: 1.6 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: C.text }}>
                      {t('partner.documentUploadsSubtitle', 'Document uploads are available after activation.')}
                    </p>
                    <p style={{ margin: 0 }}>
                      {t('partner.documentUploadsDesc', 'You can upload your PAN Card and Cancelled Cheque from your Partner Dashboard after our team reviews and activates your partner account. This review typically takes 24–48 hours.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => { setErr(""); step > 0 ? setStep(s => s - 1) : onBack(); }}
              style={{ ...S.btn("outline"), padding: "10px 20px" }}
            >
              {step === 0 ? t('partner.cancel', '← Cancel') : t('partner.back', '← Back')}
            </button>
            <button
              type="button"
              onClick={handleStepSubmit}
              disabled={loading}
              style={{ ...S.btn("primary"), padding: "10px 24px", opacity: loading ? 0.8 : 1 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "13px", height: "13px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTop: "2px solid #fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  {t('partner.submitting', 'Submitting…')}
                </span>
              ) : step === STEPS.length - 1 ? t('partner.submitRegistration', 'Submit Registration') : t('partner.next', 'Next Step →')}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
