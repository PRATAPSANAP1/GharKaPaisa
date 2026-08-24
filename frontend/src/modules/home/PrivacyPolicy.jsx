import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaArrowLeft, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

export default function PrivacyPolicy() {
  const { C, isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '40px 16px', fontFamily: "'Inter', sans-serif", color: C.text }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '50%', 
              width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.textMid, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Privacy Policy</h1>
          </div>
        </div>

        {/* Intro Alert Box */}
        <div style={{ 
          background: isDark ? '#1e293b' : '#f0fdf4', border: `1px solid ${C.teal}30`, 
          borderRadius: '16px', padding: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' 
        }}>
          GharKaPaisa respects your privacy and is committed to protecting the personal information you provide while using our website and services.<br /><br />
          This Privacy Policy explains what information we collect, why we collect it, how we use it, and how we protect it.
        </div>

        {/* Policy Content Card */}
        <div style={{ 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', 
          padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '28px' 
        }}>

          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>1. Information We Collect</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Depending on the service you use, we may collect:
            </p>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '12px 0 6px 0' }}>Personal Information</h3>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Full name</li>
              <li>Mobile number</li>
              <li>Email address</li>
              <li>Date of birth</li>
              <li>PAN information</li>
              <li>Aadhaar-related information where required for an applicable process</li>
              <li>Residential address</li>
              <li>City, state and pincode</li>
            </ul>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '12px 0 6px 0' }}>Employment and Financial Information</h3>
            <p style={{ color: C.textMid, fontSize: '14px', margin: '0 0 6px 0' }}>Where required for a particular application:</p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Employer/company name</li>
              <li>Designation</li>
              <li>Employment type</li>
              <li>Monthly income</li>
              <li>Salary-related information</li>
              <li>Other application-related information</li>
            </ul>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: C.text, margin: '12px 0 6px 0' }}>Application Information</h3>
            <p style={{ color: C.textMid, fontSize: '14px', margin: '0 0 6px 0' }}>We may collect:</p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Product selected</li>
              <li>Bank/product provider</li>
              <li>Application number</li>
              <li>Application status</li>
              <li>Application timestamps</li>
              <li>Bank reference number</li>
              <li>Application remarks</li>
              <li>Verification status</li>
              <li>VKYC-related status or information where applicable</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>2. How We Collect Information</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Information may be provided through:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>GharKaPaisa website forms</li>
              <li>Partner applications</li>
              <li>Shared application links</li>
              <li>Direct bank application journeys</li>
              <li>Physical application processes</li>
              <li>Customer support interactions</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>3. How We Use Information</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              We may use collected information to:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Create and manage customer profiles.</li>
              <li>Process financial-product applications.</li>
              <li>Connect customers with relevant product providers.</li>
              <li>Track application progress.</li>
              <li>Communicate application updates.</li>
              <li>Send OTPs and transactional SMS/email notifications.</li>
              <li>Perform verification and fraud-prevention checks.</li>
              <li>Maintain application records.</li>
              <li>Provide customer support.</li>
              <li>Improve our services.</li>
              <li>Maintain security and prevent misuse.</li>
              <li>Comply with applicable legal and regulatory requirements.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>4. Sharing of Information</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Where necessary to provide the requested service, information may be shared with:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Banks</li>
              <li>NBFCs</li>
              <li>Insurance/product providers</li>
              <li>Authorized partners</li>
              <li>Service providers involved in application processing</li>
              <li>SMS/email service providers</li>
              <li>Cloud/document storage providers</li>
              <li>Verification providers</li>
              <li>Government or regulatory authorities where legally required</li>
            </ul>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              We do not sell personal information merely for unrelated advertising purposes.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>5. Bank and Third-Party Applications</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              When you choose to apply for a product through a bank or financial institution, your information may be transferred to that institution for application processing.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              The bank or financial institution may independently process your information under its own privacy policy.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>6. Data Security</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              We use reasonable technical and organizational safeguards to protect information from unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              However, no internet-based system can guarantee absolute security.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>7. Data Retention</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              We retain information for as long as reasonably necessary for:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Providing services.</li>
              <li>Maintaining application and transaction records.</li>
              <li>Resolving disputes.</li>
              <li>Preventing fraud.</li>
              <li>Meeting legal and regulatory requirements.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>8. Cookies</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              GharKaPaisa may use cookies and similar technologies to:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Maintain sessions.</li>
              <li>Improve website functionality.</li>
              <li>Understand website usage.</li>
              <li>Improve user experience.</li>
              <li>Maintain security.</li>
            </ul>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              You may configure your browser to restrict cookies, although certain website features may not function properly.
            </p>
          </section>

          {/* Section 9 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>9. Your Rights</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Subject to applicable law, you may request:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Access to your personal information.</li>
              <li>Correction of inaccurate information.</li>
              <li>Information regarding processing of your data.</li>
              <li>Deletion of information where legally permissible.</li>
            </ul>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Requests can be sent to: <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal }}>support@gharkapaisa.in</a>
            </p>
          </section>

          {/* Section 10 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>10. Children's Privacy</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              GharKaPaisa services are not intended for individuals who are not legally eligible to use the relevant financial services.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              We do not knowingly collect information from children for financial-product applications.
            </p>
          </section>

          {/* Section 11 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>11. Policy Updates</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              We may update this Privacy Policy periodically. The latest version will always be published on this page.
            </p>
          </section>

          {/* Section 12 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>12. Contact</h2>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px 20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div><strong>GharKaPaisa</strong></div>
              <div><FaGlobe style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Website:</strong> <a href="https://gharkapaisa.in" target="_blank" rel="noreferrer" style={{ color: C.teal }}>https://gharkapaisa.in</a></div>
              <div><FaEnvelope style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Email:</strong> <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal }}>support@gharkapaisa.in</a></div>
              <div><FaPhone style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Phone:</strong> <a href="tel:9270319438" style={{ color: C.teal }}>9270319438</a></div>
              <div><FaMapMarkerAlt style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Address:</strong> Rajnandini Tower Dighi, Pune 411015</div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
