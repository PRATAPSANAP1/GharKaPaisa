import React, { useState, useEffect } from "react";
import { Icons } from "./AgentIcons";
import { C, S } from "./AgentTheme";

export default function AgentLogin({ onLogin, onRegisterNav }) {
  const [tab, setTab] = useState("pwd");
  const [form, setForm] = useState({ email: "", password: "", mobile: "", otp: "" });
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
    if (tab === "pwd" && (!form.email || !form.password)) {
      return alert("Please enter credentials.");
    }
    if (tab === "otp" && (!form.mobile || !form.otp)) {
      return alert("Please enter mobile and OTP.");
    }
    onLogin({ name: "Rajesh Kumar", id: "AG-00123" });
  };

  return (
    <div style={{
      minHeight: "100vh", 
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 50%, #152A4A 100%)`,
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Portal Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "56px", 
            height: "56px", 
            borderRadius: "16px",
            background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
            boxShadow: `0 8px 30px ${C.teal}40`, 
            marginBottom: "14px",
            color: "#fff"
          }}>
            <Icons.trending size={28} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>GharKaPaisa</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>Agent Partner Terminal</div>
        </div>

        {/* Card */}
        <div style={{ ...S.card, padding: "28px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginBottom: "4px" }}>Partner Login</div>
          <div style={{ fontSize: "13px", color: C.textLight, marginBottom: "24px" }}>Access your agent wallet & tools</div>

          {/* Login Tabs */}
          <div style={{
            display: "flex", 
            background: C.bg, 
            borderRadius: "10px", 
            padding: "4px", 
            marginBottom: "20px"
          }}>
            {["pwd", "otp"].map(t => (
              <button 
                key={t} 
                type="button"
                onClick={() => { setTab(t); setOtpSent(false); }} 
                style={{
                  flex: 1, 
                  padding: "8px 0", 
                  borderRadius: "8px", 
                  border: "none", 
                  cursor: "pointer",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? C.navy : C.textLight,
                  fontWeight: tab === t ? 700 : 500, 
                  fontSize: "13px", 
                  transition: "all 0.2s",
                  boxShadow: tab === t ? "0 2px 4px rgba(10,17,40,0.06)" : "none",
                }}
              >
                {t === "pwd" ? "Password" : "OTP Login"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab === "pwd" ? (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Email or Mobile</label>
                  <input 
                    style={S.input} 
                    placeholder="example@gmail.com"
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={S.label}>Password</label>
                  <input 
                    type="password" 
                    style={S.input} 
                    placeholder="••••••••"
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                  />
                </div>
                <div style={{ textAlign: "right", marginTop: "-12px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", color: C.tealDim, cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
                </div>
              </>
            ) : (
              <>
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
                      style={{ ...S.btn("sm"), whiteSpace: "nowrap", width: "100px", padding: "0 10px" }}
                    >
                      {timer > 0 ? `${timer}s` : otpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </div>
                {otpSent && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={S.label}>Enter 6-Digit OTP</label>
                    <input 
                      style={{ ...S.input, textAlign: "center", letterSpacing: "6px", fontSize: "18px", fontWeight: 700 }} 
                      placeholder="••••••" 
                      maxLength={6}
                      value={form.otp} 
                      onChange={e => setForm({ ...form, otp: e.target.value })} 
                    />
                  </div>
                )}
              </>
            )}

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
