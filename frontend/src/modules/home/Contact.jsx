import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { FaArrowLeft, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import api from "../../services/api";

export default function Contact() {
  const navigate = useNavigate();
  const { C, isDark } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    description: ""
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.post("/support/tickets/public-contact", formData);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.data?.message || "Failed to submit query");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to submit query. Please try again.");
    } finally {
      setLoading(false);
    }
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
            
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${C.teal}15`, color: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FaEnvelope size={18} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: C.textLight, fontWeight: 700, textTransform: "uppercase" }}>Support Email</div>
                <a href="mailto:support@gharkapaisa.in" style={{ fontSize: "14px", color: C.teal, fontWeight: 600 }}>support@gharkapaisa.in</a>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
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

          {/* Contact Form */}
          <div style={{ background: C.card, padding: "28px", borderRadius: "24px", border: `1px solid ${C.border}`, boxShadow: `0 4px 16px rgba(0,0,0,0.03)` }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "16px", marginTop: 0 }}>Send Us a Message</h2>

            {errorMsg && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
                {errorMsg}
              </div>
            )}

            {submitted ? (
              <div style={{ background: isDark ? '#1e293b' : '#f0fdf4', border: `1px solid ${C.teal}40`, borderRadius: "14px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: C.teal, marginBottom: "6px" }}>Thank You!</div>
                <p style={{ fontSize: "13px", color: C.textMid, margin: 0 }}>Your message has been received and emailed to support@gharkapaisa.in. Our support team will reach out to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "4px" }}>Full Name *</label>
                  <input
                    required
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your Full Name"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "4px" }}>Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit Mobile Number"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "4px" }}>Description of Issue *</label>
                  <textarea
                    required
                    rows="4"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your issue or query..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: "13px", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    marginTop: "6px", padding: "12px", borderRadius: "10px", border: "none", 
                    background: C.teal, color: "#fff", fontSize: "14px", fontWeight: 700, 
                    cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: `0 4px 12px ${C.teal}40`,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <FaPaperPlane size={13} /> {loading ? "Submitting..." : "Submit Query"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
