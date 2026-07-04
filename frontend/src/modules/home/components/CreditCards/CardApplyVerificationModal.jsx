import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaLock, FaCheckCircle, FaUser, FaPhoneAlt } from "react-icons/fa";

import { getBankApplyLink } from "./cardLinkHelper";
import { getApiV1Url } from "../../../../config/api";
import { useMsg91OTP } from "../../../../hooks/useMsg91OTP";

export default function CardApplyVerificationModal({ card, onClose, C }) {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // ── MSG91 OTP SDK readiness ────────────────────────────────────────────────
  const { sdkReady } = useMsg91OTP();
  
  // 6-box OTP state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];


  // OTP Timer countdown
  useEffect(() => {
    let t;
    if (otpTimer > 0) {
      t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    setErrorMsg("");

    if (!customerName.trim()) {
      return setErrorMsg("Please enter your name.");
    }
    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      return setErrorMsg("Please enter a valid 10-digit mobile number.");
    }

    setLoading(true);

    try {
      if (!sdkReady) {
        throw new Error("OTP provider is loading. Please wait a moment and try again.");
      }

      if (typeof window.sendOtp !== 'function') {
        throw new Error("OTP provider is not loaded.");
      }

      const formattedMobile = '91' + mobile.trim();
      console.log(`[MSG91] Calling window.sendOtp for CardApplyVerificationModal: ${formattedMobile}`);

      window.sendOtp(
        formattedMobile,
        (data) => {
          setOtpSent(true);
          setOtpTimer(120);
          setStep(2);
          setLoading(false);
        },
        (errResponse) => {
          setErrorMsg(errResponse?.message || "Failed to send OTP. Please try again.");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to send OTP.");
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (typeof window.retryOtp !== 'function') {
      return setErrorMsg("OTP provider is not loaded.");
    }

    setErrorMsg("");
    setLoading(true);
    setOtpDigits(["", "", "", "", "", ""]);

    window.retryOtp(
      null, // channel null (default SMS)
      (data) => {
        setOtpTimer(120);
        setLoading(false);
      },
      (error) => {
        const errMsg = typeof error === 'string' ? error : (error?.message || "Failed to resend OTP.");
        setErrorMsg(errMsg);
        setLoading(false);
      }
    );
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      return setErrorMsg("Please enter the 6-digit OTP.");
    }

    setErrorMsg("");
    setLoading(true);

    if (typeof window.verifyOtp !== 'function') {
      setLoading(false);
      return setErrorMsg("OTP provider is not loaded.");
    }

    window.verifyOtp(
      fullOtp,
      async (data) => {
        // OTP Verified successfully! Call backend API to record direct card application
        try {
          const payload = {
            customerName: customerName.trim(),
            mobile: mobile.trim(),
            bankName: card.bankName || "Unknown Bank",
            cardName: card.cardName || "Credit Card"
          };

          const response = await fetch(`${getApiV1Url()}/card-applications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          if (result.success) {
            // Successfully saved lead. Now redirect visitor to bank application page
            const applyLink = getBankApplyLink(card.cardName, card.bankId);
            if (applyLink) {
              window.location.href = applyLink;
            } else {
              console.warn("No specific bank link resolved for", card.cardName);
            }
            onClose();
          } else {
            setErrorMsg(result.message || "Failed to record your application details.");
          }
        } catch (apiErr) {
          console.error(apiErr);
          setErrorMsg("Connection error while submitting application. Redirecting anyway...");
          // Fallback redirect even if backend saving fails temporarily
          const applyLink = getBankApplyLink(card.cardName, card.bankId);
          if (applyLink) {
            window.location.href = applyLink;
          }
          onClose();
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        const errMsg = typeof error === 'string' ? error : (error?.message || "Incorrect OTP. Please try again.");
        setErrorMsg(errMsg);
        setLoading(false);
      }
    );
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    // Auto-focus next box
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  // Handle Backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  // Handle Paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().substring(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
      if (otpRefs[i] && otpRefs[i].current) {
        otpRefs[i].current.value = pastedData[i];
      }
    }
    setOtpDigits(newDigits);

    // Focus last filled box
    const focusIdx = Math.min(pastedData.length, 5);
    if (otpRefs[focusIdx] && otpRefs[focusIdx].current) {
      otpRefs[focusIdx].current.focus();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.7)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      backdropFilter: "blur(8px)",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: C.card || "#ffffff",
        width: "100%",
        maxWidth: "420px",
        borderRadius: "24px",
        border: `1px solid ${C.border || '#e2e8f0'}`,
        padding: "28px",
        position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        color: C.text || "#1e293b",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: "20px",
            top: "20px",
            background: "none",
            border: "none",
            color: C.textLight || "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.target.style.background = C.bgSecondary || "#f1f5f9"; }}
          onMouseLeave={(e) => { e.target.style.background = "none"; }}
        >
          <FaTimes size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: `${C.teal || '#0ea5e9'}15`,
            color: C.teal || '#0ea5e9',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            fontSize: "20px"
          }}>
            <FaLock />
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Apply Now</h3>
        </div>

        {/* Selected Card Badge */}
        <div style={{
          background: C.bgSecondary || "#f8fafc",
          border: `1px solid ${C.border || '#e2e8f0'}`,
          borderRadius: "12px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px"
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textLight || "#64748b", textTransform: "uppercase" }}>Applying For</div>
            <div style={{ fontWeight: 700, marginTop: "2px" }}>{card.cardName}</div>
          </div>
          <span style={{
            fontSize: "11px",
            fontWeight: 800,
            background: `${C.teal || '#0ea5e9'}15`,
            color: C.teal || '#0ea5e9',
            padding: "4px 8px",
            borderRadius: "6px"
          }}>
            {card.bankName}
          </span>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            background: `${C.red || '#ef4444'}10`,
            border: `1px solid ${C.red || '#ef4444'}20`,
            borderRadius: "12px",
            padding: "10px 14px",
            color: C.red || '#ef4444',
            fontSize: "12.5px",
            fontWeight: 600,
            lineHeight: 1.3
          }}>
            {errorMsg}
          </div>
        )}



        {/* STEP 1: Enter Name and Mobile */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: C.textLight || "#64748b" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight || "#64748b" }}><FaUser size={13} /></span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 38px",
                    borderRadius: "10px",
                    border: `1px solid ${C.border || '#e2e8f0'}`,
                    background: C.bgSecondary || "#f8fafc",
                    color: C.text || "#1e293b",
                    fontSize: "13.5px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: C.textLight || "#64748b" }}>Mobile Number</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textLight || "#64748b" }}><FaPhoneAlt size={13} /></span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setMobile(val);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 38px",
                    borderRadius: "10px",
                    border: `1px solid ${C.border || '#e2e8f0'}`,
                    background: C.bgSecondary || "#f8fafc",
                    color: C.text || "#1e293b",
                    fontSize: "13.5px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                width: "100%",
                background: C.teal || '#0ea5e9',
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.3)"
              }}
            >
              {loading ? (
                <div style={{ width: "16px", height: "16px", border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "Apply"}
            </button>

          </div>
        )}

        {/* STEP 2: Enter OTP in 6 boxes */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: C.textLight || "#64748b" }}>
                SMS OTP sent to <span style={{ fontWeight: 700, color: C.text }}>+91 {mobile}</span>
              </div>
            </div>

            {/* 6 Digit Input Fields */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }} onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: "48px",
                    height: "52px",
                    borderRadius: "12px",
                    border: `2px solid ${digit ? (C.teal || '#0ea5e9') : (C.border || '#e2e8f0')}`,
                    background: C.bgSecondary || "#f8fafc",
                    color: C.text || "#1e293b",
                    fontSize: "20px",
                    fontWeight: 800,
                    textAlign: "center",
                    outline: "none",
                    transition: "all 0.15s"
                  }}
                />
              ))}
            </div>

            {/* Resend and Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
              <div style={{ fontSize: "12px" }}>
                {otpTimer > 0 ? (
                  <span style={{ color: C.textLight || "#64748b" }}>
                    Resend code in <span style={{ fontWeight: 700 }}>{otpTimer}s</span>
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.teal || '#0ea5e9',
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: `1.5px solid ${C.border || '#e2e8f0'}`,
                    color: C.textMid || "#475569",
                    borderRadius: "12px",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Back
                </button>
                
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  style={{
                    flex: 2,
                    background: C.teal || '#0ea5e9',
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {loading ? (
                    <div style={{ width: "16px", height: "16px", border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  ) : "Verify & Redirect"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
