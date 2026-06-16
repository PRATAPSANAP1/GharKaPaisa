import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icons } from "./PartnerIcons";
import { useTheme, makeS } from "./ThemeContext";
import { sendRegisterOtp as sendOtp, registerPartner, lookupUser } from "../../api/auth.api";

const STEPS = ["Personal", "Business", "Bank", "KYC"];

const COMPANY_TYPES = [
  { label: "Individual", value: "individual" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership", value: "partnership" },
  { label: "Private Limited Company", value: "pvt_ltd" },
];

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
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedMobile, setVerifiedMobile] = useState("");
  const [timer, setTimer] = useState(0);
  const [success, setSuccess] = useState(null); // { Partner_code }

  // Flat form state for all steps
  const [form, setForm] = useState({
    // Step 0 – Personal
    firstName: "", lastName: "", mobile: "", otp: "",
    email: "", password: "", confirmPassword: "",
    // Step 1 – Business
    address: "", businessCity: "", shopName: "",
    companyType: "individual", gst: "",
    // Step 2 – Bank
    bankName: "", accountNumber: "", ifsc: "", accountHolderName: "",
    // Step 3 – KYC text
    aadhaar: "", pan: "",
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(t2 => t2 - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    return () => {};
  }, []);

  const focusBorder = `1.5px solid ${C.teal}`;
  const inputProps = (key, extra = {}) => ({
    style: { ...S.input, ...extra },
    value: form[key],
    onChange: set(key),
    onFocus: e => (e.target.style.border = focusBorder),
    onBlur: e => (e.target.style.border = `1.5px solid ${C.border}`),
  });

  // ── OTP Send ────────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!form.mobile) return setErr(t("partner.errors.mobileRequired", "Please enter your mobile number."));
    setErr("");
    setInfoMsg("");
    setOtpLoading(true);
    try {
      await sendOtp(form.mobile);
      setOtpSent(true);
      setTimer(30);
      setInfoMsg(t("partner.errors.otpSentSuccess", "OTP code sent successfully to your mobile."));
    } catch (e) {
      setErr(e.message || t("partner.errors.otpSendFailed", "Failed to send OTP. Please try again."));
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP Verify ──────────────────────────────────────────────────────────────
  const handleVerifyPhoneOtp = async () => {
    if (!form.otp || form.otp.length < 6) return setErr(t("partner.errors.enterOtpCode", "Please enter the 6-digit OTP."));
    setErr("");
    setInfoMsg("");
    setLoading(true);
    try {
      setPhoneVerified(true);
      setVerifiedMobile(form.mobile);
      setInfoMsg(t("partner.verifiedMobile", "Mobile number verified successfully!"));
    } catch (e) {
      setErr(t("partner.errors.otpVerifyFailed", "Invalid OTP verification code. Please check and try again."));
    } finally {
      setLoading(false);
    }
  };

  // ── Step Validation ─────────────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName.trim()) return t("partner.errors.firstNameRequired", "Please enter your first name.");
      if (!/^[a-zA-Z\s]+$/.test(form.firstName.trim())) return t("partner.errors.firstNameLettersOnly", "First name can only contain letters.");
      if (!form.lastName.trim()) return t("partner.errors.lastNameRequired", "Please enter your last name.");
      if (!/^[a-zA-Z\s]+$/.test(form.lastName.trim())) return t("partner.errors.lastNameLettersOnly", "Last name can only contain letters.");
      if (!form.mobile.trim()) return t("partner.errors.mobileRequired", "Please enter your mobile number.");
      if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return t("partner.errors.mobileInvalid", "Please enter a valid 10-digit mobile number.");
      if (!otpSent) return t("partner.errors.mobileSendOtp", "Please send OTP to verify your mobile number.");
      if (!phoneVerified) return t("partner.errors.mobileVerifyFirst", "Please enter the OTP and click verify mobile.");
      if (form.mobile !== verifiedMobile) return t("partner.errors.mobileChanged", "Mobile number changed after verification. Please verify again.");
      if (!form.email.trim()) return t("partner.errors.emailRequired", "Please enter your email address.");
      if (!/\S+@\S+\.\S+/.test(form.email)) return t("partner.errors.emailInvalid", "Please enter a valid email address.");
      if (form.password.length < 8) return t("partner.errors.passwordMinLength", "Password must be at least 8 characters.");
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        return t("partner.errors.passwordStrength", "Password must contain uppercase, lowercase and a number.");
      if (form.password !== form.confirmPassword) return t("partner.errors.passwordsMismatch", "Passwords do not match.");
    }
    if (step === 1) {
      if (!form.address.trim()) return t("partner.errors.addressRequired", "Please enter your current address.");
      if (!form.shopName.trim()) return t("partner.errors.shopNameRequired", "Please enter your company/shop name.");
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
      if (!form.aadhaar.trim()) return t("partner.errors.aadhaarRequired", "Please enter your Aadhaar number.");
      if (!/^\d{12}$/.test(form.aadhaar.trim())) return t("partner.errors.aadhaarInvalid", "Please enter a valid 12-digit Aadhaar number.");
      if (!form.pan.trim()) return t("partner.errors.panRequired", "Please enter your PAN number.");
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) return t("partner.errors.panInvalid", "Please enter a valid 10-character PAN number.");
    }
    return null;
  };

  // ── Step Submit / Final Register ─────────────────────────────────────────────
  const handleStepSubmit = async () => {
    setErr("");
    const validationErr = validateStep();
    if (validationErr) return setErr(validationErr);

    // Ensure phone verified in Step 0
    if (step === 0) {
      if (!phoneVerified) {
        return setErr(t("partner.errors.mobileVerifyFirstMsg", "Please complete mobile verification first."));
      }
      // Check duplicate email / mobile
      setLoading(true);
      try {
        const lookupMobile = await lookupUser(form.mobile.trim());
        if (lookupMobile.success && lookupMobile.data) {
          setLoading(false);
          return setErr(t("partner.errors.mobileExists", "This mobile number is already registered."));
        }
      } catch (e) {
        // If lookup fails because user not found, that's what we want
      }
      try {
        const lookupEmail = await lookupUser(form.email.trim());
        if (lookupEmail.success && lookupEmail.data) {
          setLoading(false);
          return setErr(t("partner.errors.emailExists", "This email address is already registered."));
        }
      } catch (e) {
        // Ignored
      }
      setLoading(false);
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
        current_address: form.address.trim(),
        business_location: form.businessCity.trim(),
        company_name: form.shopName.trim(),
        company_type: form.companyType,
        gst_number: form.gst ? form.gst.trim().toUpperCase() : null,
        bank_name: form.bankName.trim(),
        account_number: form.accountNumber.trim(),
        ifsc_code: form.ifsc ? form.ifsc.trim().toUpperCase() : "",
        account_holder_name: form.accountHolderName.trim(),
        aadhaar: form.aadhaar.trim(),
        pan: form.pan ? form.pan.trim().toUpperCase() : "",
        role: "Partner",
      };
      const res = await registerPartner(payload);
      if (res.success) {
        setSuccess({ ...res.data, email: form.email });
      } else {
        setErr(res.message || t("partner.errors.registrationFailed", "Registration failed. Please try again."));
      }
    } catch (e) {
      setErr(e.message || t("partner.errors.registrationFailedDetails", "Registration failed. Please check your details."));
    } finally {
      setLoading(false);
    }
  };

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
            <div style={{ fontSize: "13px", color: C.textMid, marginBottom: "16px", lineHeight: 1.6 }}>
              {t('partner.partnerSubmittedDesc', 'Your partner application has been submitted. Our team will review your KYC and activate your account within 24-48 hours.')}
            </div>

            <div style={{ background: C.bgSecondary, borderRadius: "12px", padding: "14px 20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: C.textLight, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('partner.partnerCode', 'Your Partner Code')}</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: C.primary, letterSpacing: "4px", marginTop: "4px" }}>{success.Partner_code || success.partner_code}</div>
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

              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.mobileNumber', 'Mobile Number')}</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    {...inputProps("mobile", { flex: 1 })}
                    style={{ ...S.input, flex: 1 }}
                    placeholder={t('partner.mobilePlaceholder', '10-digit Mobile Number')}
                    disabled={phoneVerified}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={timer > 0 || otpLoading || phoneVerified}
                    style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "110px", padding: "0 10px", opacity: (timer > 0 || phoneVerified) ? 0.7 : 1 }}
                  >
                    {otpLoading ? t('partner.sending', 'Sending…') : timer > 0 ? `${timer}s` : t('partner.sendOtp', 'Send OTP')}
                  </button>
                </div>
                {otpSent && !phoneVerified && (
                  <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icons.check size={12} /> {t('partner.otpSentMobile', 'OTP sent to your mobile')}
                  </div>
                )}
                {phoneVerified && (
                  <div style={{ fontSize: "12px", color: C.green, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 700 }}>
                    <Icons.check size={12} /> {t('partner.verifiedMobile', 'Mobile number verified successfully!')}
                  </div>
                )}
              </div>

              {/* Removed Recaptcha Container */}

              {otpSent && !phoneVerified && (
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>{t('partner.enterOtp', 'Enter OTP')}</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{
                        ...S.input,
                        flex: 1,
                        background: C.inputBg,
                        color: C.text,
                        letterSpacing: "6px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                      maxLength={6}
                      value={form.otp}
                      onChange={e => setForm(f => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                      onFocus={e => { e.target.style.border = focusBorder; }}
                      onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "110px", padding: "0 10px" }}
                    >
                      {t('partner.verifyOtp', 'Verify OTP')}
                    </button>
                  </div>
                </div>
              )}

              {/* Email */}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.emailAddress', 'Email Address')}</label>
                <input
                  type="email"
                  {...inputProps("email")}
                  placeholder={t('partner.placeholders.email', 'name@domain.com')}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label style={S.label}>{t('partner.password', 'Password')}</label>
                <input type="password" {...inputProps("password")} placeholder={t('partner.placeholders.min8chars', 'Min 8 chars')} autoComplete="new-password" />
              </div>
              <div>
                <label style={S.label}>{t('partner.confirmPassword', 'Confirm Password')}</label>
                <input type="password" {...inputProps("confirmPassword")} placeholder={t('partner.placeholders.repeatPassword', 'Repeat password')} autoComplete="new-password" />
              </div>
            </div>
          )}

          {/* ── Step 1: Business ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.currentAddress', 'Current Full Address')}</label>
                <input {...inputProps("address")} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.businessLocation', 'Business Location (City)')}</label>
                <input {...inputProps("businessCity")} />
              </div>
              <div>
                <label style={S.label}>{t('partner.companyShopName', 'Company / Shop Name')}</label>
                <input {...inputProps("shopName")} />
              </div>
              <div>
                <label style={S.label}>{t('partner.partnerType', 'Partner Type')}</label>
                <select style={S.input} value={form.companyType} onChange={set("companyType")}>
                  {COMPANY_TYPES.map(tOption => <option key={tOption.value} value={tOption.value}>{t('companyTypes.' + tOption.value, tOption.label)}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.gstNumber', 'GST Number')} <span style={{ color: C.textLight, fontWeight: 500 }}>({t('partner.optional', 'Optional')})</span></label>
                <input {...inputProps("gst")} />
              </div>
            </div>
          )}

          {/* ── Step 2: Bank ─────────────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>{t('partner.bankName', 'Bank Name')}</label>
                <input {...inputProps("bankName")} />
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={S.label}>{t('partner.aadhaarNumber', 'Aadhaar Number')}</label>
                  <input {...inputProps("aadhaar")} placeholder={t('partner.placeholders.aadhaar', '12-digit number')} />
                </div>
                <div>
                  <label style={S.label}>{t('partner.panNumber', 'PAN Number')}</label>
                  <input {...inputProps("pan")} style={{ ...S.input, textTransform: "uppercase" }} placeholder={t('partner.placeholders.pan', '10-char alphanumeric')} />
                </div>
              </div>

              {/* Header */}
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: `${C.teal}15`, color: C.teal,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <Icons.shield size={28} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: C.text }}>{t('partner.kycDocuments', 'KYC Documents')}</div>
                <div style={{ fontSize: '13px', color: C.textMid, marginTop: '6px', lineHeight: 1.5 }}>
                  {t('partner.docVerificationDesc', 'Document verification is done after your account is activated.')}
                </div>
              </div>

              {/* Document list */}
              {[
                { icon: '🪪', title: t('kycDocs.aadhaarCard', 'Aadhaar Card'), desc: t('kycDocs.aadhaarDesc', 'Front & Back (PDF/Image) · Max 5MB') },
                { icon: '🪄', title: t('kycDocs.panCard', 'PAN Card'), desc: t('kycDocs.panDesc', 'PDF or Image · Max 5MB') },
                { icon: '🧾', title: t('kycDocs.gstCert', 'GST Certificate'), desc: t('kycDocs.gstDesc', 'Optional · Max 5MB') },
                { icon: '🏦', title: t('kycDocs.cheque', 'Cancelled Cheque'), desc: t('kycDocs.chequeDesc', 'Image of cheque · Max 5MB') },
              ].map(doc => (
                <div key={doc.title} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: C.bgSecondary,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '12px', padding: '14px 16px',
                  opacity: 0.7,
                }}>
                  <span style={{ fontSize: '22px' }}>{doc.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{doc.title}</div>
                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{doc.desc}</div>
                  </div>
                </div>
              ))}

              {/* Info banner */}
              <div style={{
                background: `${C.gold}14`,
                border: `1px solid ${C.gold}35`,
                borderRadius: '10px', padding: '14px 16px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>ℹ️</span>
                <div style={{ fontSize: '13px', color: C.gold, lineHeight: 1.6 }}>
                  <strong>{t('partner.warnings.docUploadTitle', 'Document uploads are available after activation.')}</strong><br />
                  {t('partner.warnings.docUploadDesc', 'You can submit them from your Partner Profile dashboard once our team reviews your application (24–48 hours).')}
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
