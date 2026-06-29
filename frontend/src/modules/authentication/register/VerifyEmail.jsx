import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../../../api/auth.api.js";
import { useTheme, makeS } from "../../../contexts/ThemeContext";

// ── Inline keyframe styles (injected once) ──────────────────────────────────
const keyframes = `
  @keyframes verifyPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.08); opacity: 0.85; }
  }
  @keyframes verifyFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes verifySpin {
    to { transform: rotate(360deg); }
  }
  @keyframes verifyCheck {
    0%   { stroke-dashoffset: 40; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes verifyCircle {
    0%   { stroke-dashoffset: 160; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// ── Animated success checkmark (SVG) ─────────────────────────────────────────
function AnimatedCheck({ color = "#0d9488" }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle
        cx="32" cy="32" r="28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          strokeDasharray: 160,
          strokeDashoffset: 160,
          animation: "verifyCircle 0.6s ease-out 0.1s forwards",
        }}
      />
      <path
        d="M20 33 L28 41 L44 24"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "verifyCheck 0.4s ease-out 0.55s forwards",
        }}
      />
    </svg>
  );
}

// ── Animated error X (SVG) ───────────────────────────────────────────────────
function AnimatedError({ color = "#E63946" }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle
        cx="32" cy="32" r="28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          strokeDasharray: 160,
          strokeDashoffset: 160,
          animation: "verifyCircle 0.6s ease-out 0.1s forwards",
        }}
      />
      <path
        d="M22 22 L42 42 M42 22 L22 42"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "verifyCheck 0.4s ease-out 0.55s forwards",
        }}
      />
    </svg>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton({ C }) {
  const shimmerBg = `linear-gradient(90deg, ${C.bgSecondary} 25%, ${C.border}44 50%, ${C.bgSecondary} 75%)`;
  const skel = (w, h, mb = 0) => ({
    width: w,
    height: h,
    borderRadius: h > 20 ? "12px" : "8px",
    background: shimmerBg,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.8s ease-in-out infinite",
    marginBottom: mb,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: shimmerBg, backgroundSize: "200% 100%",
        animation: "shimmer 1.8s ease-in-out infinite, verifyPulse 2s ease-in-out infinite",
        marginBottom: 24,
      }} />
      <div style={skel("70%", 24, 12)} />
      <div style={skel("90%", 14, 6)} />
      <div style={skel("60%", 14, 0)} />
    </div>
  );
}

// ── Main VerifyEmail Page ────────────────────────────────────────────────────
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { C } = useTheme();
  const S = makeS(C);

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. The link may be invalid or incomplete.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await verifyEmail(token);
        if (!cancelled) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.message || "Verification failed. The link may be invalid or expired.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setResendMessage("Please enter a valid email address.");
      return;
    }

    setResending(true);
    setResendMessage("");
    try {
      const data = await resendVerificationEmail(normalizedEmail);
      setResendMessage(data.message || "A new verification email has been requested.");
    } catch (err) {
      setResendMessage(err.message || "Could not resend the verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
        transition: "background 0.3s",
      }}>
        <div style={{
          maxWidth: 440,
          width: "100%",
          animation: "verifyFadeUp 0.5s ease-out",
        }}>
          <div style={{
            ...S.card,
            padding: "48px 36px 40px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative top gradient bar */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: 4,
              background: status === "success"
                ? `linear-gradient(90deg, ${C.green}, ${C.teal})`
                : status === "error"
                ? `linear-gradient(90deg, ${C.red}, ${C.gold})`
                : `linear-gradient(90deg, ${C.teal}, ${C.primary})`,
              transition: "background 0.5s",
            }} />

            {/* ── Loading State ───────────────────────────────────────── */}
            {status === "loading" && (
              <div>
                <LoadingSkeleton C={C} />
                <div style={{
                  marginTop: 28,
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.textMid,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `2.5px solid ${C.border}`,
                    borderTop: `2.5px solid ${C.teal}`,
                    animation: "verifySpin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Verifying your email…
                </div>
              </div>
            )}

            {/* ── Success State ───────────────────────────────────────── */}
            {status === "success" && (
              <div style={{ animation: "verifyFadeUp 0.4s ease-out" }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: `${C.green}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px",
                }}>
                  <AnimatedCheck color={C.green} />
                </div>

                <h1 style={{
                  fontSize: 24, fontWeight: 900, color: C.text,
                  margin: "0 0 8px", letterSpacing: "-0.3px",
                }}>
                  Email Verified!
                </h1>

                <p style={{
                  fontSize: 14, color: C.textMid, lineHeight: 1.7,
                  margin: "0 0 28px", maxWidth: 320, marginLeft: "auto", marginRight: "auto",
                }}>
                  {message}
                </p>

                <div style={{
                  background: `${C.green}10`,
                  border: `1px solid ${C.green}30`,
                  borderRadius: 10,
                  padding: "12px 18px",
                  marginBottom: 28,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                }}>
                  <span style={{ fontSize: 20 }}>🎉</span>
                  <span style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                    Your account is now active. You can log in using your registered email or mobile number.
                  </span>
                </div>

                <button
                  onClick={() => navigate("/login")}
                  style={{
                    ...S.btn("primary"),
                    width: "100%",
                    padding: "14px 24px",
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  Continue to Login →
                </button>
              </div>
            )}

            {/* ── Error State ─────────────────────────────────────────── */}
            {status === "error" && (
              <div style={{ animation: "verifyFadeUp 0.4s ease-out" }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: `${C.red}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px",
                }}>
                  <AnimatedError color={C.red} />
                </div>

                <h1 style={{
                  fontSize: 24, fontWeight: 900, color: C.text,
                  margin: "0 0 8px", letterSpacing: "-0.3px",
                }}>
                  Verification Failed
                </h1>

                <p style={{
                  fontSize: 14, color: C.textMid, lineHeight: 1.7,
                  margin: "0 0 28px", maxWidth: 320, marginLeft: "auto", marginRight: "auto",
                }}>
                  {message}
                </p>

                <div style={{
                  background: `${C.gold}12`,
                  border: `1px solid ${C.gold}30`,
                  borderRadius: 10,
                  padding: "12px 18px",
                  marginBottom: 28,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                    Try registering again, or contact support at <strong style={{ color: C.text }}>support@gharkapaisa.in</strong> if the issue persists.
                  </span>
                </div>

                <div style={{ marginBottom: 18, textAlign: "left" }}>
                  <label style={{ ...S.label, display: "block" }}>Resend verification email</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      style={{ ...S.input, flex: 1, minWidth: 0 }}
                    />
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      style={{ ...S.btn("primary"), padding: "0 14px", opacity: resending ? 0.7 : 1 }}
                    >
                      {resending ? "Sending…" : "Resend"}
                    </button>
                  </div>
                  {resendMessage && (
                    <div style={{ marginTop: 8, fontSize: 12, color: C.textMid }}>
                      {resendMessage}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      ...S.btn("outline"),
                      flex: 1,
                      padding: "13px 20px",
                    }}
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    style={{
                      ...S.btn("primary"),
                      flex: 1,
                      padding: "13px 20px",
                    }}
                  >
                    Register Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer branding */}
          <div style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 12,
            color: C.textLight,
          }}>
            © {new Date().getFullYear()} GharKaPaisa · All rights reserved
          </div>
        </div>
      </div>
    </>
  );
}
