import React, { useState, useEffect, useRef } from 'react';
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

  const [status, setStatus] = useState("idle");
  const [borderProgress, setBorderProgress] = useState(0);
  const [showPlacementStyles, setShowPlacementStyles] = useState(false);

  useEffect(() => {
    if (status !== "idle") {
      setShowPlacementStyles(false);
      const timer = window.setTimeout(() => setShowPlacementStyles(true), 900);
      return () => window.clearTimeout(timer);
    }
    setShowPlacementStyles(false);
  }, [status]);

  useEffect(() => {
    const isComplete = otpDigits.every((digit) => digit !== "");

    if (!isComplete || status !== "idle") {
      if (!isComplete) {
        setBorderProgress(0);
      }
      return;
    }

    let progress = 0;
    const interval = window.setInterval(() => {
      progress += 1; // 100 steps over 1000ms = 1s total
      if (progress >= 100) {
        progress = 100;
        window.clearInterval(interval);
        verifyCompletedOtp();
      }
      setBorderProgress(progress);
    }, 10);

    return () => window.clearInterval(interval);
  }, [otpDigits, status]);

  const resetOtp = () => {
    setStatus("idle");
    setOtpDigits(["", "", "", "", "", ""]);
    setBorderProgress(0);
    setErrorMsg("");
    window.setTimeout(() => {
      otpRefs[0].current?.focus();
    }, 40);
  };

  const handleResolvedEdit = () => {
    if (status !== "idle") {
      resetOtp();
      return true;
    }
    return false;
  };

  const verifyCompletedOtp = async () => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      return setErrorMsg("Please enter the 6-digit OTP.");
    }

    setErrorMsg("");
    setLoading(true);

    if (typeof window.verifyOtp !== 'function') {
      setLoading(false);
      setStatus("fail");
      return setErrorMsg("OTP provider is not loaded.");
    }

    window.verifyOtp(
      fullOtp,
      async (data) => {
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
            setStatus("success");
            setTimeout(() => {
              const applyLink = getBankApplyLink(card.cardName, card.bankId);
              if (applyLink) {
                window.location.href = applyLink;
              } else {
                console.warn("No specific bank link resolved for", card.cardName);
              }
              onClose();
            }, 1500);
          } else {
            setStatus("fail");
            setErrorMsg(result.message || "Failed to record your application details.");
          }
        } catch (apiErr) {
          console.error(apiErr);
          setStatus("success");
          setTimeout(() => {
            const applyLink = getBankApplyLink(card.cardName, card.bankId);
            if (applyLink) {
              window.location.href = applyLink;
            }
            onClose();
          }, 1500);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setStatus("fail");
        const errMsg = typeof error === 'string' ? error : (error?.message || "Incorrect OTP. Please try again.");
        setErrorMsg(errMsg);
        setLoading(false);
      }
    );
  };

  const handleOtpChange = (index, value) => {
    if (handleResolvedEdit()) {
      return;
    }
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key !== "Backspace") {
      return;
    }
    e.preventDefault();
    if (handleResolvedEdit()) {
      return;
    }
    if (otpDigits[index]) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }
    if (index > 0) {
      otpRefs[index - 1].current?.focus();
      const newDigits = [...otpDigits];
      newDigits[index - 1] = "";
      setOtpDigits(newDigits);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    if (handleResolvedEdit()) {
      return;
    }
    const pastedData = e.clipboardData.getData("text").trim().substring(0, 6);
    const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("");
    const newDigits = ["", "", "", "", "", ""];

    digits.forEach((digit, idx) => {
      newDigits[idx] = digit;
    });
    setOtpDigits(newDigits);

    const focusIdx = digits.length >= 6 ? 5 : Math.max(digits.length, 0);
    otpRefs[focusIdx].current?.focus();
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
          <div className="otp-card-inner">
            <div className="otp-header" style={{ marginBottom: "1rem" }}>
              <p style={{ color: C.textLight || '#64748b', fontSize: '13px' }}>
                We've sent a 6-digit code to <span style={{ fontWeight: 700, color: C.text }}>+91 {mobile}</span>
              </p>
            </div>

            <div className={`otp-input-group ${status !== "idle" ? "stacked" : ""}`} onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => {
                const isTopCard = index === 0;
                const isBorderAnimating = status === "idle" && borderProgress > 0;
                const stackOffset = status === "idle" ? "translate(0, 0)" : 
                  isTopCard 
                    ? "translate(-50%, -50%) scale(1.05)" 
                    : `translate(calc(-50% + ${(6 - 1 - index) * 1.5}px), calc(-50% + ${(6 - 1 - index) * 1.5}px)) scale(${0.98 - (6 - 1 - index) * 0.02})`;

                return (
                  <div
                    key={index}
                    className={`otp-slot ${status !== "idle" ? "stacked" : ""} ${isTopCard ? "top-card" : "back-card"}`}
                    style={{
                      zIndex: 6 - index,
                      transform: stackOffset,
                      transitionDelay: status !== "idle" ? `${index * 60}ms` : "0ms",
                    }}
                  >
                    <div
                      className={`otp-shell ${isBorderAnimating ? "border-drawing" : ""} ${status} ${showPlacementStyles ? "placed" : ""}`}
                      style={
                        isBorderAnimating
                          ? { "--progress": `${borderProgress}%` }
                          : undefined
                      }
                    >
                      <input
                        ref={otpRefs[index]}
                        className={`otp-input ${status !== "idle" && !isTopCard ? "stack-shadow" : ""}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(event) => handleOtpChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        disabled={status !== "idle"}
                        aria-label={`OTP digit ${index + 1}`}
                      />
                      {status !== "idle" && isTopCard ? (
                        <span className={`otp-result-icon ${status} ${showPlacementStyles ? "placed" : ""}`} aria-hidden="true">
                          {status === "success" ? "✓" : status === "fail" ? "✕" : ""}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="resend-area" style={{ marginTop: '1.25rem' }}>
              <span>Didn't receive the code?</span>
              {otpTimer > 0 ? (
                <span style={{ fontWeight: 700, color: C.textLight || '#64748b', marginLeft: '4px' }}>{otpTimer}s</span>
              ) : (
                <button type="button" className="resend-link" onClick={handleResendOtp}>
                  Resend
                </button>
              )}
            </div>

            <div className="info-note" style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              {status === "idle"
                ? borderProgress > 0 && borderProgress < 100
                  ? "Drawing border, then verifying..."
                  : "Enter code - auto verify"
                : status === "success"
                  ? "Verified successfully"
                  : "Verification failed"}
            </div>


          </div>
        )}

      </div>

      <style>{`
        :root {
          --otp-card-bg: ${C.card || '#ffffff'};
          --otp-input-bg: ${C.bgSecondary || '#f1f5f9'};
          --otp-text: ${C.text || '#1e293b'};
          --otp-text-light: ${C.textLight || '#64748b'};
          --otp-border: ${C.border || '#e2e8f0'};
          --otp-primary: ${C.teal || '#0ea5e9'};
          --otp-success: ${C.green || '#1bbb6b'};
          --otp-danger: ${C.red || '#ef4444'};
        }
        .otp-card-inner {
          width: 100%;
          text-align: center;
        }
        .otp-input-group {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.65rem;
          min-height: 4.5rem;
          margin: 2rem 0 1.5rem;
        }
        .otp-input-group.stacked {
          min-height: 5.8rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .otp-slot {
          width: 3rem;
          height: 3.8rem;
          transition: transform 0.3s ease-in-out, opacity 0.3s ease, width 0.3s ease-in-out, height 0.3s ease-in-out;
          will-change: transform, width, height;
        }
        .otp-slot.stacked {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
        }
        .otp-shell {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 1.15rem;
          border: 2px solid transparent;
          box-shadow: none;
          transition: border-color 1s ease, box-shadow 1s ease, transform 1s ease, border-radius 0.3s ease-in-out;
        }
        .otp-slot.stacked .otp-shell {
          border-radius: 50%;
        }
        .otp-shell.placed {
          border-color: var(--otp-primary);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--otp-border);
        }
        .otp-shell.placed.success {
          border-color: var(--otp-success);
          box-shadow: 0 0 50px rgba(34, 197, 94, 0.3);
        }
        .otp-shell.placed.fail {
          border-color: var(--otp-danger);
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.3);
        }
        .otp-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 2px;
          border-radius: inherit;
          background: var(--otp-border);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          transition: background 1s ease-in-out, box-shadow 1s ease-in-out, transform 1s ease-in-out;
          z-index: 2;
        }
        .otp-shell.border-drawing::before {
          background: conic-gradient(
            from 315deg,
            var(--otp-primary) var(--progress, 0%),
            var(--otp-border) var(--progress, 0%)
          );
        }
        .otp-slot.top-card.stacked .otp-shell::before {
          background: transparent;
        }
        .otp-slot.top-card.stacked .otp-shell.placed {
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.6), 0 8px 20px rgba(0, 0, 0, 0.35), 0 3px 10px rgba(0, 0, 0, 0.25);
          animation: stack-glow 1s ease-in-out;
        }
        @keyframes stack-glow {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            transform: scale(0.8);
          }
          50% {
            box-shadow: 0 0 12px 6px rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
          }
          100% {
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.6), 0 8px 20px rgba(0, 0, 0, 0.35), 0 3px 10px rgba(0, 0, 0, 0.25);
            transform: scale(1.05);
          }
        }
        .otp-shell.success::before {
          background: var(--otp-success);
          box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.18), 0 22px 44px rgba(34, 197, 94, 0.28);
        }
        .otp-shell.fail::before {
          background: var(--otp-danger);
          box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.16), 0 22px 44px rgba(239, 68, 68, 0.26);
        }
        .otp-input {
          position: relative;
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-radius: 1.15rem;
          background: var(--otp-input-bg);
          color: var(--otp-text);
          text-align: center;
          font-size: 1.6rem;
          font-weight: 700;
          outline: none;
          caret-color: var(--otp-primary);
          box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.05);
          transition: background 0.25s ease, transform 0.25s ease, opacity 0.35s ease, box-shadow 0.25s ease, border-radius 0.3s ease-in-out;
        }
        .otp-slot.stacked .otp-input {
          border-radius: 50%;
        }
        .otp-input:focus {
          background: var(--otp-card-bg);
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15), inset 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .otp-input:disabled {
          cursor: default;
        }
        .otp-slot.stacked.back-card .otp-input,
        .otp-slot.stacked .otp-input {
          color: transparent;
        }
        .otp-slot.stacked.back-card .otp-input {
          opacity: 0.88;
        }
        .otp-input.stack-shadow {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        .otp-result-icon {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: 1.5rem;
          font-weight: 900;
          pointer-events: none;
          width: 100%;
          height: 100%;
          margin: auto;
          animation: icon-pop 0.48s ease;
        }
        .otp-result-icon.success {
          color: var(--otp-success);
          text-shadow: 0 0 18px rgba(34, 197, 94, 0.35);
        }
        .otp-result-icon.fail {
          color: var(--otp-danger);
          text-shadow: 0 0 18px rgba(239, 68, 68, 0.35);
        }
        .resend-area {
          display: flex;
          justify-content: center;
          gap: 0.3rem;
          align-items: center;
          color: var(--otp-text-light);
          font-size: 0.95rem;
        }
        .resend-link {
          border: 0;
          background: transparent;
          color: var(--otp-primary);
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .info-note {
          min-height: 1.25rem;
          margin-top: 0.55rem;
          color: var(--otp-text-light);
          font-size: 0.86rem;
        }
        @keyframes icon-pop {
          0% {
            transform: scale(0.55);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @media (max-width: 520px) {
          .otp-input-group {
            gap: 0.5rem;
          }
          .otp-slot {
            width: 2.6rem;
            height: 3.3rem;
          }
          .otp-input {
            font-size: 1.4rem;
          }
          .otp-result-icon {
            font-size: 1.6rem;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
