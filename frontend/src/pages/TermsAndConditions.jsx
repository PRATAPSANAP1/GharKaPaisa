import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/Partner/ThemeContext";
import { 
  FaArrowLeft, FaInfoCircle, FaHandshake, FaUserCheck, FaLock, FaKey, 
  FaClipboardList, FaUsers, FaCoins, FaBan, FaBuilding, FaExclamationTriangle, 
  FaEnvelope, FaWindowClose, FaGavel 
} from "react-icons/fa";

export default function TermsAndConditions() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("about");

  const sections = [
    { id: "about", title: "1. About Us", icon: <FaBuilding /> },
    { id: "nature", title: "2. Nature of Services", icon: <FaHandshake /> },
    { id: "eligibility", title: "3. User Eligibility", icon: <FaUserCheck /> },
    { id: "security", title: "4. Account Security", icon: <FaLock /> },
    { id: "kyc", title: "5. KYC Verification", icon: <FaKey /> },
    { id: "processing", title: "6. Application Processing", icon: <FaClipboardList /> },
    { id: "agents", title: "7. Agent/Partner Rules", icon: <FaUsers /> },
    { id: "commission", title: "8. Commission Policy", icon: <FaCoins /> },
    { id: "prohibited", title: "9. Prohibited Activities", icon: <FaBan /> },
    { id: "ip", title: "10. Intellectual Property", icon: <FaInfoCircle /> },
    { id: "disclaimer", title: "11. Disclaimer", icon: <FaExclamationTriangle /> },
    { id: "liability", title: "12. Limitation of Liability", icon: <FaExclamationTriangle /> },
    { id: "termination", title: "13. Termination", icon: <FaWindowClose /> },
    { id: "law", title: "14. Governing Law", icon: <FaGavel /> },
    { id: "contact", title: "15. Contact Information", icon: <FaEnvelope /> },
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
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: C.text, margin: 0 }}>Terms and Conditions</h1>
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
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 16px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sections</h3>
              <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-1">
                {sections.map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px",
                      border: "none", background: activeSection === sec.id ? `${C.teal}15` : "transparent",
                      color: activeSection === sec.id ? C.teal : C.textMid, fontWeight: activeSection === sec.id ? 700 : 500,
                      fontSize: "12px", textAlign: "left", cursor: "pointer", width: "100%", transition: "all 0.2s"
                    }}
                  >
                    <span style={{ color: activeSection === sec.id ? C.teal : C.textLight }}>{sec.icon}</span>
                    <span className="truncate">{sec.title.split(". ")[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Intro Alert Box */}
            <div style={{ 
              background: `${C.teal}08`, border: `1px solid ${C.teal}20`, 
              borderRadius: "16px", padding: "20px", color: C.textMid, fontSize: "14px", lineHeight: 1.6 
            }}>
              By accessing or using GharKaPaisa, you agree to be bound by these Terms and Conditions.
            </div>

            {/* Document body Card */}
            <div style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: "24px", 
              padding: "28px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", color: C.text 
            }}>
              
              {/* Section 1 */}
              <div id="about" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaBuilding /> 1. About Us
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 10px 0" }}>GharKaPaisa is operated by:</p>
                <p style={{ fontWeight: 600, margin: "0 0 10px 0" }}>YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED</p>
                <p style={{ color: C.textMid, margin: "0 0 8px 0", fontSize: "14px" }}>Registered Address:</p>
                <pre style={{ 
                  background: C.bgSecondary, color: C.textMid, padding: "12px 16px", borderRadius: "10px", 
                  fontSize: "13px", fontFamily: "monospace", margin: 0, border: `1px solid ${C.border}` 
                }} className="whitespace-pre-wrap break-words">
                  GAT NO. 4/1/1B, DIGHIGAON THAN,{"\n"}
                  Dighi Camp,{"\n"}
                  Pune, Maharashtra – 411015,{"\n"}
                  India
                </pre>
              </div>

              {/* Section 2 */}
              <div id="nature" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaHandshake /> 2. Nature of Services
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: "0 0 14px 0" }}>
                  GharKaPaisa is a financial services platform that assists users in accessing:
                </p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Credit Cards</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Personal Loans & Business Loans</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Home Loans & Loan Against Property (LAP)</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Insurance Products</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Financial Consultation, Compliance and Registration Services</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  GharKaPaisa acts as a facilitator and aggregator between users and financial institutions. We are not a bank or lending institution.
                </p>
              </div>

              {/* Section 3 */}
              <div id="eligibility" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaUserCheck /> 3. User Eligibility
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Users must:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Be at least 18 years old.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Provide accurate, current and complete information.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Be legally capable of entering binding contracts.</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", margin: 0 }}>Providing false information may result in immediate account suspension.</p>
              </div>

              {/* Section 4 */}
              <div id="security" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaLock /> 4. Registration and Account Security
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Users are responsible for:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Maintaining account and credential confidentiality.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Protecting passwords and OTPs.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Updating account details when they change.</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", margin: 0 }}>Any activity performed using the account is the sole responsibility of the account holder.</p>
              </div>

              {/* Section 5 */}
              <div id="kyc" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaKey /> 5. KYC Verification
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Certain services require:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>PAN Verification.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Aadhaar Verification.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Identity, Address and Income Proof documents.</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", margin: 0 }}>Failure to provide authentic required documents may result in immediate rejection of services.</p>
              </div>

              {/* Section 6 */}
              <div id="processing" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaClipboardList /> 6. Application Processing
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Submission of an application does not guarantee approval. Approval depends upon:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Bank and NBFC lending policies.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Credit score and eligibility criteria.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Verification audits.</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", margin: 0 }}>GharKaPaisa has no control over approval decisions.</p>
              </div>

              {/* Section 7 */}
              <div id="agents" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaUsers /> 7. Agent and Partner Accounts
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Agents and partners must:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Provide genuine information.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Follow applicable laws and avoid misleading customers.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Maintain client confidentiality.</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", margin: 0 }}>Violations will result in immediate account termination.</p>
              </div>

              {/* Section 8 */}
              <div id="commission" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaCoins /> 8. Commission Policy
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Commission payments, where applicable, are subject to:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: "0 0 14px 0" }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Successful verification and product approval.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Successful disbursal by the financial institution.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Compliance review.</li>
                </ul>
                <p style={{ color: C.textMid, fontSize: "14px", marginTop: "12px", margin: 0 }}>The company reserves the right to withhold commissions in case of fraud, misrepresentation, or policy violations.</p>
              </div>

              {/* Section 9 */}
              <div id="prohibited" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaBan /> 9. Prohibited Activities
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>Users shall not:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Submit fraudulent applications or forged documents.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Misrepresent information.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Attempt unauthorized platform access.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Violate applicable Indian laws.</li>
                </ul>
              </div>

              {/* Section 10 */}
              <div id="ip" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaInfoCircle /> 10. Intellectual Property
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  All content, logos, branding, software, and website materials are the sole property of YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED. Unauthorized replication or usage is strictly prohibited.
                </p>
              </div>

              {/* Section 11 */}
              <div id="disclaimer" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaExclamationTriangle /> 11. Disclaimer
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>GharKaPaisa does not guarantee:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Loan or credit card approval.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Insurance coverage approval or immediate product availability.</li>
                </ul>
              </div>

              {/* Section 12 */}
              <div id="liability" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaExclamationTriangle /> 12. Limitation of Liability
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", margin: "0 0 12px 0" }}>The company shall not be liable for:</p>
                <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Rejection of applications by partner banks.</li>
                  <li style={{ fontSize: "14px", color: C.textMid }}>Platform service interruptions, technical errors, or losses arising from platform usage.</li>
                </ul>
              </div>

              {/* Section 13 */}
              <div id="termination" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaWindowClose /> 13. Termination
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  We reserve the right to suspend or terminate any user or partner account found violating these Terms and Conditions.
                </p>
              </div>

              {/* Section 14 */}
              <div id="law" style={{ marginBottom: "32px", borderBottom: `1px solid ${C.border}`, paddingBottom: "24px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaGavel /> 14. Governing Law
                </h2>
                <p style={{ color: C.textMid, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  These Terms shall be governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of the courts located in Pune, Maharashtra.
                </p>
              </div>

              {/* Section 15 */}
              <div id="contact" style={{ margin: 0 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: C.teal, display: "flex", alignItems: "center", gap: "10px", margin: "0 0 16px 0" }}>
                  <FaEnvelope /> 15. Contact Information
                </h2>
                <p style={{ fontWeight: 600, margin: "0 0 10px 0" }}>YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED</p>
                <p style={{ color: C.textMid, margin: "0 0 6px 0", fontSize: "14px" }}>
                  <strong>Email:</strong> <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal, textDecoration: "underline" }}>support@gharkapaisa.in</a>
                </p>
                <p style={{ color: C.textMid, margin: 0, fontSize: "14px" }}>
                  <strong>Website:</strong> <a href="https://gharkapaisa.in" target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: "underline" }}>https://gharkapaisa.in</a>
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
