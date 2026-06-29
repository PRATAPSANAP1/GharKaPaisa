import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../../api/auth.api.js";
import { useTheme, makeS } from "../../../contexts/ThemeContext";
import { Icons } from "../../../components/Icon/PartnerIcons";

// ── Keyframe Animations ──────────────────────────────────────────────────────
const keyframes = `
  @keyframes resetFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes resetSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes resetCheck {
    0%   { stroke-dashoffset: 40; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes resetCircle {
    0%   { stroke-dashoffset: 160; }
    100% { stroke-dashoffset: 0; }
  }
`;

// ── Animated checkmark for success ───────────────────────────────────────────
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
          animation: "resetCircle 0.6s ease-out 0.1s forwards",
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
          animation: "resetCheck 0.4s ease-out 0.55s forwards",
        }}
      />
    </svg>
  );
}

export default function ResetPassword() {
  const { C } = useTheme();
  const S = makeS(C);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  // Validate Token existence
  useEffect(() => {
    if (!token) {
      setErr("Reset token is missing. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!password) {
      return setErr("Please enter a new password.");
    }
    if (password.length < 8) {
      return setErr("Password must be at least 8 characters long.");
    }
    if (password !== confirmPassword) {
      return setErr("Passwords do not match. Please verify.");
    }

    setErr("");
    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      setErr(error.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { ...S.input };
  const focusBorder = `1.5px solid ${C.teal}`;

  // Inject keyframes
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = keyframes;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div style={{
      minHeight: "calc(100vh - 110px)",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
      transition: "background 0.3s",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>
            Choose New Password
          </div>
          <div style={{ fontSize: "14px", color: C.textSecondary, marginTop: "6px" }}>
            Secure your GharKaPaisa account
          </div>
        </div>

        {/* Form Card */}
        <div style={{ ...S.card, padding: "28px", animation: "resetFadeUp 0.4s ease-out" }}>
          {err && (
            <div style={{
              background: `${C.red}15`, border: `1px solid ${C.red}40`,
              borderRadius: "10px", padding: "10px 14px", fontSize: "13px",
              color: C.red, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icons.x size={14} /> {err}
            </div>
          )}

          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: `${C.teal}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <AnimatedCheck color={C.teal} />
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>
                Password Updated!
              </h2>
              <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, marginBottom: 24 }}>
                Your password has been successfully reset. You can now log in using your new credentials.
              </p>

              <button
                onClick={() => navigate("/admin-login")}
                style={{
                  ...S.btn("primary"),
                  width: "100%",
                  padding: "13px 0",
                  fontSize: "14px",
                  borderRadius: "10px",
                }}
              >
                Proceed to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={S.label}>New Password</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                    <Icons.Lock size={18} />
                  </div>
                  <input
                    type="password"
                    style={{ ...inputStyle, paddingLeft: "42px" }}
                    placeholder="At least 8 characters"
                    value={password}
                    disabled={!token}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={e => e.target.style.border = focusBorder}
                    onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={S.label}>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: C.textSecondary }}>
                    <Icons.Lock size={18} />
                  </div>
                  <input
                    type="password"
                    style={{ ...inputStyle, paddingLeft: "42px" }}
                    placeholder="Verify new password"
                    value={confirmPassword}
                    disabled={!token}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={e => e.target.style.border = focusBorder}
                    onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  ...S.btn("primary"),
                  width: "100%",
                  padding: "13px 0",
                  fontSize: "14px",
                  borderRadius: "10px",
                  opacity: (loading || !token) ? 0.7 : 1,
                  cursor: (loading || !token) ? "not-allowed" : "pointer"
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                    <span style={{
                      width: "14px", height: "14px", borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTop: "2px solid #fff",
                      animation: "resetSpin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                    Updating Password…
                  </span>
                ) : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @keyframes resetSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
