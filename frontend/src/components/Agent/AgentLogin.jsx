import React, { useState, useEffect } from "react";
import { Icons } from "./AgentIcons";
import { C, S } from "./AgentTheme";
import logo from "../../logo.jpeg";

export default function AgentLogin({ onLogin, onRegisterNav }) {
  const [form, setForm] = useState({ mobile: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let t;
    if (timer > 0) {
      t = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [timer]);

  const handleSendOtp = () => {
    if (!form.mobile) return alert("Please enter mobile number.");
    setOtpSent(true);
    setTimer(30);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.mobile || !form.password || !form.otp) {
      return alert("Please fill in your mobile number, password, and OTP code.");
    }
    onLogin({ name: "Rajesh Kumar", id: "AG-00123" });
  };

  return (
    <div style={{
      minHeight: "100vh", 
      background: C.bg,
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Portal Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img 
            src={logo} 
            alt="GharKaPaisa Logo" 
            style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "14px", 
              objectFit: "contain", 
              marginBottom: "14px",
              boxShadow: "0 4px 12px rgba(10,17,40,0.06)" 
            }} 
          />
          <div style={{ fontSize: "24px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>GharKaPaisa</div>
        </div>

        {/* Card */}
        <div style={{ ...S.card, padding: "28px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginBottom: "24px" }}>Agent Login</div>

          {/* Unified Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Mobile Number with Verify Button */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Mobile Number</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  style={{ ...S.input, flex: 1 }} 
                  placeholder="+91 Mobile Number"
                  value={form.mobile} 
                  onChange={e => setForm({ ...form, mobile: e.target.value })} 
                />
                <button 
                  type="button" 
                  onClick={handleSendOtp} 
                  disabled={timer > 0}
                  style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "110px", padding: "0 10px" }}
                >
                  {timer > 0 ? `${timer}s` : "Verify Mobile"}
                </button>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Password</label>
              <input 
                type="password" 
                style={S.input} 
                placeholder="••••••••"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
              />
            </div>

            {/* OTP Verification */}
            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Enter 6-Digit OTP</label>
              <input 
                style={{ 
                  ...S.input, 
                  textAlign: "center", 
                  letterSpacing: "6px", 
                  fontSize: "18px", 
                  fontWeight: 700,
                  background: otpSent ? "#fff" : "#f1f3f5",
                  cursor: otpSent ? "text" : "not-allowed"
                }} 
                placeholder="••••••" 
                maxLength={6}
                disabled={!otpSent}
                value={form.otp} 
                onChange={e => setForm({ ...form, otp: e.target.value })} 
              />
            </div>

            <button type="submit" style={{ ...S.btn("primary"), width: "100%", padding: "12px 0", fontSize: "14px", borderRadius: "10px", marginTop: "4px" }}>
              Secure Log In
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: C.textLight }}>
            New GharKaPaisa Agent? <span onClick={onRegisterNav} style={{ color: C.tealDim, cursor: "pointer", fontWeight: 700 }}>Apply Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
