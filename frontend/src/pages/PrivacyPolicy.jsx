import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/Partner/ThemeContext";
import { FaArrowLeft, FaShieldAlt, FaBuilding, FaDatabase, FaEye, FaLock, FaUserShield, FaExclamationTriangle, FaEnvelope, FaGlobe } from "react-icons/fa";

export default function PrivacyPolicy() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("company");

  const sections = [
    { id: "company", title: "1. Company Information", icon: <FaBuilding /> },
    { id: "collect", title: "2. Information We Collect", icon: <FaDatabase /> },
    { id: "use", title: "3. How We Use Information", icon: <FaEye /> },
    { id: "share", title: "4. Data Sharing & Disclosure", icon: <FaUserShield /> },
    { id: "security", title: "5. Data Security", icon: <FaLock /> },
    { id: "cookies", title: "6. Cookies & Tracking", icon: <FaGlobe /> },
    { id: "rights", title: "7. User Rights", icon: <FaShieldAlt /> },
    { id: "changes", title: "8. Changes to this Policy", icon: <FaExclamationTriangle /> },
    { id: "contact", title: "9. Contact Us", icon: <FaEnvelope /> },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setActiveSection(id);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", transition: "all 0.3s ease", padding: "40px 16px" }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 mb-8">
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
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: C.text, margin: 0 }}>Privacy Policy</h1>
            <p style={{ fontSize: "13px", color: C.textLight, margin: "4px 0 0 0" }}>Last Updated: June 2026</p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation Table of Contents (Desktop only) */}
          <div className="hidden lg:block w-72 shrink-0">
            <div style={{ 
              position: "sticky", top: "100px", background: C.card, border: `1px solid ${C.border}`, 
              borderRadius: "20px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" 
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Table of Contents</h3>
              <div className="flex flex-col gap-2">
                {sections.map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px",
                      border: "none", background: activeSection === sec.id ? `${C.teal}15` : "transparent",
                      color: activeSection === sec.id ? C.teal : C.textMid, fontWeight: activeSection === sec.id ? 700 : 500,
                      fontSize: "13px", textAlign: "left", cursor: "pointer", width: "100%", transition: "all 0.2s"
                    }}
                  >
                    <span style={{ color: activeSection === sec.id ? C.teal : C.textLight }}>{sec.icon}</span>
                    <span>{sec.title.split(". ")[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Policy Document Content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Intro Alert Box */}
            <div style={{ 
              background: `${C.teal}08`, border: `1px solid ${C.teal}20`, 
              borderRadius: "16px", padding: "20px", color: C.textMid, fontSize: "14px", lineHeight: 1.6 
            }}>
              GharKaPaisa, operated by <strong>YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED</strong>, is committed to protecting the privacy of users, partners, agents, employees, and customers who access or use our website and services.
            </div>

            {/* Document body Card */}
            <div style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: "24px", 
              padding: "28px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", color: C.text 
            }}>
              
              {/* Section 1 */}
              <div id="company" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaBuilding /> 1. Company Information
                </h2>
                <p style={{ fontWeight: 600, margin: "0 0 10px 0" }}>YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED</p>
                <p style={{ color: C.textMid, margin: "0 0 8px 0", fontSize: "14px" }}>Registered Address:</p>
                <pre style={{ 
                  background: C.bgSecondary, color: C.textMid, padding: "12px 16px", borderRadius: "10px", 
                  fontSize: "13px", fontFamily: "monospace", margin: "0 0 16px 0", border: `1px solid ${C.border}` 
                }} className="whitespace-pre-wrap break-words">
                  GAT NO. 4/1/1B, DIGHIGAON THAN,{"\n"}
                  Dighi Camp,{"\n"}
                  Pune, Maharashtra – 411015,{"\n"}
                  India
                </pre>
                <p style={{ color: C.textMid, margin: "0 0 6px 0", fontSize: "14px" }}>
                  <strong>Email:</strong> <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal, textDecoration: "underline" }}>support@gharkapaisa.in</a>
                </p>
                <p style={{ color: C.textMid, margin: 0, fontSize: "14px" }}>
                  <strong>Website:</strong> <a href="https://gharkapaisa.in" target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>https://gharkapaisa.in</a>
                </p>
              </div>

              {/* Section 2 */}
              <div id="collect" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaDatabase /> 2. Information We Collect
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: "0 0 14px 0" }}>
                  We collect personal and business information when you register, apply for services, or interact with our platform, including:
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>
                    <strong>Personal Identifiable Information:</strong> Name, Date of Birth, Email, Mobile Number, Gender.
                  </li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>
                    <strong>Financial & KYC Information:</strong> PAN card, Aadhaar details, Bank Account information, income proof, employment details.
                  </li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>
                    <strong>Business Details:</strong> Company name, registration number, GST details, business address.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div id="use" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaEye /> 3. How We Use Your Information
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: "0 0 14px 0" }}>
                  Your information is used for the following purposes:
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Facilitating applications for loans, credit cards, and insurance with financial institutions.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Performing KYC verification and compliance checks.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Processing commission payouts and managing partner wallets.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Sending updates, notifications, and security alerts.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Improving platform performance and customer support.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div id="share" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaUserShield /> 4. Data Sharing and Disclosure
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: "0 0 14px 0" }}>
                  We do not sell your personal data. We only share information with:
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Lending institutions, banks, and insurance providers to process your applications.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Third-party verification services for KYC audits.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Law enforcement or regulatory authorities as required by applicable laws.</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div id="security" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaLock /> 5. Data Security
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  We implement industry-standard administrative, technical, and physical security measures to protect your information against unauthorized access, loss, or misuse. All sensitive details (like passwords and bank data) are securely stored and encrypted.
                </p>
              </div>

              {/* Section 6 */}
              <div id="cookies" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaGlobe /> 6. Cookies and Tracking
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  We use cookies and similar tracking technologies to enhance user experience, remember your preferences, and analyze platform traffic. You can modify your browser settings to decline cookies, though some features of the platform may not function properly as a result.
                </p>
              </div>

              {/* Section 7 */}
              <div id="rights" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaShieldAlt /> 7. User Rights
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: "0 0 14px 0" }}>
                  As a user, you have the right to:
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Access the personal information we hold about you.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Request correction of inaccurate or incomplete data.</li>
                  <li style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.5 }}>Request deletion of your account (subject to legal or contractual retention requirements).</li>
                </ul>
              </div>

              {/* Section 8 */}
              <div id="changes" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaExclamationTriangle /> 8. Changes to this Policy
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  We reserve the right to modify this Privacy Policy at any time. Any updates will be posted on this page with an updated "Last Updated" date.
                </p>
              </div>

              {/* Section 9 */}
              <div id="contact" style={{ margin: 0 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaEnvelope /> 9. Contact Us
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  If you have any questions, concerns, or complaints regarding this Privacy Policy, please contact our support team at <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal, textDecoration: "underline", fontWeight: 600 }}>support@gharkapaisa.in</a>.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
