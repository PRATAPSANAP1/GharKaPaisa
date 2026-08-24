import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaArrowLeft, FaShieldAlt, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

export default function TermsAndConditions() {
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
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Terms & Conditions</h1>
            <p style={{ fontSize: '13px', color: C.textLight, margin: '4px 0 0 0' }}>
              Effective Date: 21/07/2026 | Last Updated: 21/07/2026
            </p>
          </div>
        </div>

        {/* Intro Alert Box */}
        <div style={{ 
          background: isDark ? '#1e293b' : '#f0fdf4', border: `1px solid ${C.teal}30`, 
          borderRadius: '16px', padding: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' 
        }}>
          Welcome to <strong>GharKaPaisa</strong> ("GharKaPaisa", "we", "us", or "our"). These Terms & Conditions govern your access to and use of the GharKaPaisa website, applications, services, partner services, and related digital platforms.<br /><br />
          By accessing or using our website or services, you agree to be bound by these Terms & Conditions. If you do not agree with these terms, please do not use the platform.
        </div>

        {/* Policy Content Card */}
        <div style={{ 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', 
          padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '28px' 
        }}>

          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>1. About GharKaPaisa</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              GharKaPaisa is a digital platform that helps users discover and apply for financial products and services offered by participating banks, financial institutions, and other product providers.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              The platform may provide information about products such as:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Credit Cards</li>
              <li>Loans</li>
              <li>Insurance and other financial products, where available</li>
              <li>Other financial products offered through participating institutions</li>
            </ul>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              GharKaPaisa may facilitate the application journey, collect application information, provide application tracking, and connect users with the relevant product provider.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>2. No Guarantee of Approval</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Submitting an application through GharKaPaisa does not guarantee approval, sanction, issuance, or disbursement of any financial product.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              The final decision regarding approval, eligibility, credit limit, interest rate, loan amount, fees, documentation, KYC, VKYC, and other conditions is made by the respective bank, NBFC, financial institution, or product provider.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>3. Information Provided by Users</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Users are responsible for providing accurate, complete, and up-to-date information. You agree that:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>The information submitted by you is accurate.</li>
              <li>You will not provide false or misleading information.</li>
              <li>You will not impersonate another person.</li>
              <li>You will provide documents belonging to you or documents that you are legally authorized to submit.</li>
              <li>You will promptly inform us if any submitted information needs correction.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>4. Application Processing</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Depending on the product and application channel, applications may be initiated through:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
              <li>Partner Punch</li>
              <li>Linked Share</li>
              <li>Direct Bank</li>
              <li>Physical Process</li>
            </ul>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Application information may be processed by GharKaPaisa and/or forwarded to the relevant product provider for further processing.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>5. Bank and Financial Institution Decisions</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Product details displayed on GharKaPaisa may include information provided by participating banks, financial institutions, or other providers.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Product eligibility, pricing, fees, interest rates, credit limits, approval criteria, and other terms may be determined by the respective provider.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Users should review the applicable terms and conditions of the respective provider before accepting a financial product.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>6. Third-Party Websites</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Certain applications may redirect users to the official website or application portal of a bank, NBFC, insurer, or other third-party provider.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Once you leave GharKaPaisa and access a third-party website:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>The third party's terms and privacy policy may apply.</li>
              <li>GharKaPaisa does not control the third-party website.</li>
              <li>GharKaPaisa is not responsible for the content, availability, security, or policies of third-party websites.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>7. Partner Services</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              GharKaPaisa may provide registered partners with tools for generating leads, sharing product links, tracking applications, and viewing applicable commissions.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Partner commissions are subject to the applicable partner agreement, eligibility criteria, verification, application status, and product/provider rules.
            </p>
          </section>

          {/* Section 8 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>8. Prohibited Activities</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>Users must not:</p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Use the platform for unlawful purposes.</li>
              <li>Submit fraudulent applications.</li>
              <li>Submit applications using another person's identity without authorization.</li>
              <li>Upload fraudulent or manipulated documents.</li>
              <li>Attempt to bypass security controls.</li>
              <li>Interfere with platform operations.</li>
              <li>Scrape or copy platform data without authorization.</li>
              <li>Attempt unauthorized access to another user's account.</li>
              <li>Use the platform for spam or misleading communications.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>9. Account Suspension</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              GharKaPaisa may suspend, restrict, or terminate an account if we reasonably believe that the account has violated these Terms, submitted fraudulent information, engaged in suspicious activity, misused the platform, or created security or compliance risks.
            </p>
          </section>

          {/* Section 10 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>10. Intellectual Property</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              The GharKaPaisa name, logo, website design, software, content, graphics, trademarks, and other platform materials are owned by or licensed to GharKaPaisa and may not be reproduced or used without authorization.
            </p>
          </section>

          {/* Section 11 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>11. Limitation of Liability</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              To the extent permitted by applicable law, GharKaPaisa will not be responsible for:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>A bank or financial institution rejecting an application.</li>
              <li>Changes in product eligibility or availability.</li>
              <li>Decisions made by third-party financial institutions.</li>
              <li>Third-party website downtime.</li>
              <li>Delays caused by banks, NBFCs, payment providers, SMS providers, or other external service providers.</li>
              <li>Incorrect information supplied by a user.</li>
              <li>Events beyond our reasonable control.</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>12. Changes to These Terms</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              We may update these Terms & Conditions from time to time. Updated terms will be published on this page with a revised "Last Updated" date.
            </p>
          </section>

          {/* Section 13 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>13. Contact</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              For questions regarding these Terms & Conditions:
            </p>
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
