import React, { useState, useEffect } from "react";
import { Icons } from "./AgentIcons";
import { C, S } from "./AgentTheme";

export default function AgentRegister({ onBack }) {
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const steps = ["Personal", "Business", "Bank", "KYC"];

  useEffect(() => {
    let t;
    if (timer > 0) {
      t = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [timer]);

  const handleSendOtp = () => {
    if (!mobile) return alert("Please enter mobile number.");
    setOtpSent(true);
    setTimer(30);
  };

  const handleStepSubmit = () => {
    if (step === 0) {
      if (!mobile) {
        return alert("Please enter mobile number.");
      }
      if (!otpSent) {
        return alert("Please click 'Verify Mobile' to send the OTP.");
      }
      if (!otp || otp.length < 6) {
        return alert("Please enter the 6-digit OTP.");
      }
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      alert("Next process is coming soon");
      onBack();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 16px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        
        {/* Back and title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={onBack} style={{ ...S.btn("ghost"), padding: "6px 8px" }}>
            <Icons.arrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Agent Request</div>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: "4px", 
                borderRadius: "99px", 
                background: i <= step ? C.teal : C.border,
                transition: "background 0.3s"
              }} />
              <div style={{ 
                fontSize: "11px", 
                color: i <= step ? C.text : C.textLight, 
                fontWeight: i <= step ? 700 : 500, 
                marginTop: "6px", 
                textAlign: "center" 
              }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: C.text, marginBottom: "18px", borderBottom: `1px solid ${C.border}`, paddingBottom: "10px" }}>
            {steps[step]} Information
          </div>

          {/* Form Content steps */}
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Agent Name (As on Aadhaar)</label>
                <input style={S.input} />
              </div>
              <div>
                <label style={S.label}>Mobile Number</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    style={{ ...S.input, flex: 1 }} 
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
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
              <div>
                <label style={S.label}>Verify Mobile (OTP)</label>
                <input 
                  style={{ 
                    ...S.input,
                    background: otpSent ? "#fff" : "#f1f3f5",
                    cursor: otpSent ? "text" : "not-allowed"
                  }} 
                  maxLength={6} 
                  disabled={!otpSent}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Email Address</label>
                <input type="email" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input type="password" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input type="password" style={S.input} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Current Full Address</label>
                <input style={S.input} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Business Location</label>
                <input style={S.input} />
              </div>
              <div>
                <label style={S.label}>Company / Shop Name</label>
                <input style={S.input} />
              </div>
              <div>
                <label style={S.label}>Company Type</label>
                <select style={S.input}>
                  <option>Individual / Freelancer</option>
                  <option>Proprietorship</option>
                  <option>Partnership</option>
                  <option>Pvt Ltd Company</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>GST Number (Optional)</label>
                <input style={S.input} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Bank Name</label>
                <input style={S.input} />
              </div>
              <div>
                <label style={S.label}>Account Number</label>
                <input style={S.input} />
              </div>
              <div>
                <label style={S.label}>IFSC Code</label>
                <input style={S.input} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Account Holder Name</label>
                <input style={S.input} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={S.label}>Aadhaar Number</label>
                <input style={S.input} />
              </div>
              <div>
                <label style={S.label}>PAN Card Number</label>
                <input style={S.input} />
              </div>

              {/* Uploads grid */}
              {[
                { title: "Upload Aadhaar (Front/Back PDF)", desc: "Aadhaar Card" },
                { title: "Upload PAN Card (PDF/Image)", desc: "PAN Card" },
                { title: "Upload GST Certificate (Optional)", desc: "GST Doc" },
                { title: "Upload Cancelled Cheque (Image)", desc: "Cheque Copy" }
              ].map(u => (
                <div key={u.title} style={{
                  gridColumn: "span 1",
                  border: `2px dashed ${C.border}`,
                  borderRadius: "12px",
                  padding: "16px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: C.bg
                }}>
                  <div style={{ color: C.tealDim, marginBottom: "6px" }}>
                    <Icons.upload size={20} />
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{u.desc}</div>
                  <div style={{ fontSize: "10px", color: C.textLight, marginTop: "3px" }}>Max size 5MB</div>
                </div>
              ))}
            </div>
          )}

          {/* Button Footer */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              onClick={() => step > 0 ? setStep(step - 1) : onBack()} 
              style={{ ...S.btn("outline"), padding: "10px 20px" }}
            >
              Reset / Back
            </button>
            <button 
              type="button" 
              onClick={handleStepSubmit} 
              style={{ ...S.btn("primary"), padding: "10px 24px" }}
            >
              {step === 3 ? "Submit Verification" : "Next Step →"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
