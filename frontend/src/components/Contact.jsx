import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./Partner/ThemeContext";
import { FaArrowLeft, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaPaperPlane, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Contact() {
  const navigate = useNavigate();
  const { C } = useTheme();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your message. We will get back to you shortly!");
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", padding: "40px 16px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Back Button & Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: "50%", 
              width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.textMid, boxShadow: `0 2px 8px rgba(0,0,0,0.05)`
            }}
          >
            <FaArrowLeft />
          </button>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: C.text, margin: 0 }}>Contact Us</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
          
          {/* Contact Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: C.card, padding: "32px", borderRadius: "24px", border: `1px solid ${C.border}`, boxShadow: `0 4px 12px rgba(0,0,0,0.03)` }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text, marginBottom: "24px", marginTop: 0 }}>Get in Touch</h2>
              
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaEnvelope size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: C.textLight, fontWeight: 600, marginBottom: "4px" }}>Email Us</div>
                  <div style={{ fontSize: "15px", color: C.text, fontWeight: 600 }}>sharadyohesa@gmail.com</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaPhoneAlt size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: C.textLight, fontWeight: 600, marginBottom: "4px" }}>Call Us</div>
                  <div style={{ fontSize: "15px", color: C.text, fontWeight: 600 }}>+91 8087179438</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FaMapMarkerAlt size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: C.textLight, fontWeight: 600, marginBottom: "4px" }}>Visit Us</div>
                  <div style={{ fontSize: "15px", color: C.text, fontWeight: 600, lineHeight: 1.4 }}>rajnandini tower, dighi,<br/>pune</div>
                </div>
              </div>

              <div style={{ width: "100%", height: "1px", background: C.border, margin: "24px 0" }} />

              <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "16px" }}>Follow Us</div>
              <div style={{ display: "flex", gap: "12px" }}>
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((SocialIcon, idx) => (
                  <div key={idx} style={{ 
                    width: "36px", height: "36px", borderRadius: "8px", background: C.bgSecondary, 
                    color: C.textMid, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", border: `1px solid ${C.border}`
                  }}>
                    <SocialIcon size={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: C.card, padding: "32px", borderRadius: "24px", border: `1px solid ${C.border}`, boxShadow: `0 4px 12px rgba(0,0,0,0.03)` }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text, marginBottom: "8px", marginTop: 0 }}>Send a Message</h2>
            <p style={{ fontSize: "14px", color: C.textLight, marginBottom: "24px" }}>We'll get back to you within 24 hours.</p>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.textMid, marginBottom: "6px" }}>Full Name</label>
                <input required type="text" placeholder="John Doe" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.textMid, marginBottom: "6px" }}>Email Address</label>
                <input required type="email" placeholder="john@example.com" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.textMid, marginBottom: "6px" }}>Message</label>
                <textarea required rows="4" placeholder="How can we help you?" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
              </div>
              <button type="submit" style={{ 
                marginTop: "8px", padding: "14px", borderRadius: "10px", border: "none", 
                background: C.teal, color: "#fff", fontSize: "15px", fontWeight: 700, 
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: `0 4px 12px ${C.teal}40`
              }}>
                <FaPaperPlane size={14} /> Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
