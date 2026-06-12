import React, { useState } from "react";
import { Icons } from "./AgentIcons";
import { C, S } from "./AgentTheme";

export default function AgentRegister({ onBack }) {
  const [step, setStep] = useState(0);
  const steps = ["Personal", "Business", "Bank", "KYC"];

  const handleStepSubmit = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      alert("Application Submitted Successfully! Our Admin team will review and approve your account within 24 hours.");
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
            <div style={{ fontSize: "20px", fontWeight: 800, color: C.text }}>Agent Partner Request</div>
            <div style={{ fontSize: "12px", color: C.textLight, marginTop: "2px" }}>Join the premium network</div>
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
                <input style={S.input} placeholder="Rajesh Kumar" />
              </div>
              <div>
                <label style={S.label}>Mobile Number</label>
                <input style={S.input} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={S.label}>Verify Mobile (OTP)</label>
                <input style={S.input} placeholder="6-digit OTP" maxLength={6} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Email Address</label>
                <input type="email" style={S.input} placeholder="rajesh@gmail.com" />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input type="password" style={S.input} placeholder="Create Secure Password" />
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input type="password" style={S.input} placeholder="Repeat Password" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Current Full Address</label>
                <input style={S.input} placeholder="Flat, Building, Street" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Business Location</label>
                <input style={S.input} placeholder="Office or Shop Address" />
              </div>
              <div>
                <label style={S.label}>Company / Shop Name</label>
                <input style={S.input} placeholder="Kumar Fin Advisory (Optional)" />
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
                <input style={S.input} placeholder="27AAPFU0939F1ZV" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Bank Name</label>
                <input style={S.input} placeholder="HDFC Bank, SBI, ICICI" />
              </div>
              <div>
                <label style={S.label}>Account Number</label>
                <input style={S.input} placeholder="5010023452132" />
              </div>
              <div>
                <label style={S.label}>IFSC Code</label>
                <input style={S.input} placeholder="HDFC0001234" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={S.label}>Account Holder Name</label>
                <input style={S.input} placeholder="Rajesh Kumar" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={S.label}>Aadhaar Number</label>
                <input style={S.input} placeholder="•••• •••• •••• 1234" />
              </div>
              <div>
                <label style={S.label}>PAN Card Number</label>
                <input style={S.input} placeholder="ABCDE1234F" />
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
