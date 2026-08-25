import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { FaArrowLeft, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaGlobe, FaPaperPlane, FaInfoCircle } from "react-icons/fa";

export default function Contact() {
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", padding: "40px 16px", color: C.text }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Back Button & Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: "50%", 
              width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.textMid, boxShadow: `0 2px 8px rgba(0,0,0,0.05)`
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: C.text, margin: 0 }}>Contact Us</h1>
            <p style={{ fontSize: "14px", color: C.textLight, margin: "4px 0 0 0" }}>
              We are here to help you with any queries or support requests.
            </p>
          </div>
        </div>

        {/* Contact Details & Form Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px" }}>
          
          {/* Support Details Card */}
          <div style={{ background: C.card, padding: "28px", borderRadius: "24px", border: `1px solid ${C.border}`, boxShadow: `0 4px 16px rgba(0,0,0,0.03)` }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "20px", marginTop: 0 }}>GharKaPaisa Support</h2>
            
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FaGlobe size={18} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 700, textTransform: "uppercase" }}>Website</div>
                <a href="https://gharkapaisa.in" target="_blank" rel="noreferrer" style={{ fontSize: "14px", color: C.teal, fontWeight: 600 }}>https://gharkapaisa.in</a>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FaEnvelope size={18} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 700, textTransform: "uppercase" }}>Support Email</div>
                <a href="mailto:support@gharkapaisa.in" style={{ fontSize: "14px", color: C.teal, fontWeight: 600 }}>support@gharkapaisa.in</a>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FaPhoneAlt size={16} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 700, textTransform: "uppercase" }}>Phone Number</div>
                <a href="tel:9270319438" style={{ fontSize: "14px", color: C.teal, fontWeight: 600 }}>9270319438</a>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FaMapMarkerAlt size={18} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 700, textTransform: "uppercase" }}>Business Address</div>
                <div style={{ fontSize: "14px", color: C.text, fontWeight: 600, lineHeight: 1.5 }}>Rajnandini Tower Dighi, Pune 411015</div>
              </div>
            </div>
          </div>

          {/* Contact Form & Queries */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div style={{ background: C.card, padding: "28px", borderRadius: "24px", border: `1px solid ${C.border}`, boxShadow: `0 4px 16px rgba(0,0,0,0.03)` }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "16px", marginTop: 0 }}>Send Us a Message</h2>

              {submitted ? (
                <div style={{ background: isDark ? '#1e293b' : '#f0fdf4', border: `1px solid ${C.teal}40`, borderRadius: "14px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: C.teal, marginBottom: "6px" }}>Thank You!</div>
                  <p style={{ fontSize: "13px", color: C.textMid, margin: 0 }}>Your message has been received. Our support team will reach out to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "4px" }}>Full Name *</label>
                    <input required type="text" placeholder="Your Full Name" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "13px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "4px" }}>Mobile Number *</label>
                    <input required type="tel" placeholder="10-digit Mobile Number" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "13px", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "4px" }}>Description of Issue *</label>
                    <textarea required rows="4" placeholder="Describe your issue or query..." style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "13px", boxSizing: "border-box", resize: "vertical" }} />
                  </div>
                  <button type="submit" style={{ 
                    marginTop: "6px", padding: "12px", borderRadius: "10px", border: "none", 
                    background: C.teal, color: "#fff", fontSize: "14px", fontWeight: 700, 
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: `0 4px 12px ${C.teal}40`
                  }}>
                    <FaPaperPlane size={13} /> Submit Query
                  </button>
                </form>
              )}
            </div>

            {/* Note Box */}
            <div style={{ 
              background: isDark ? '#1e293b' : '#fffbeb', border: `1px solid ${C.border}`, 
              borderRadius: "16px", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "flex-start" 
            }}>
              <FaInfoCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "12px", color: C.textMid, lineHeight: 1.5 }}>
                <strong>Important Note:</strong> GharKaPaisa facilitates access to financial-product applications, but final approval or rejection is determined by the respective financial institution.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
