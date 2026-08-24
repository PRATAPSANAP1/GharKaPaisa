import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaArrowLeft, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaTruck } from 'react-icons/fa';

export default function ShippingPolicy() {
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
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Shipping & Delivery Policy</h1>
          </div>
        </div>

        {/* Intro Alert Box */}
        <div style={{ 
          background: isDark ? '#1e293b' : '#f0fdf4', border: `1px solid ${C.teal}30`, 
          borderRadius: '16px', padding: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' 
        }}>
          GharKaPaisa primarily provides digital services and financial-product application facilitation. We do not generally sell physical goods through the platform.
        </div>

        {/* Policy Content Card */}
        <div style={{ 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', 
          padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '28px' 
        }}>

          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>1. No Physical Product Shipping</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              GharKaPaisa does not normally ship physical products to customers.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Our services are delivered digitally through:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Website/application interfaces</li>
              <li>Online application forms</li>
              <li>Application links</li>
              <li>SMS</li>
              <li>Email</li>
              <li>Digital application tracking</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>2. Financial Product Delivery</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              For financial products such as credit cards, loans, insurance, or other products, the actual product/service is provided by the respective bank, NBFC, insurer, or financial institution.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              GharKaPaisa does not control the delivery timeline of such third-party products.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              For example, where a bank approves a credit card application, the physical card, if applicable, is delivered by the respective bank according to its delivery process.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>3. Application Processing Time</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Application processing time may vary depending on:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Product provider</li>
              <li>Customer eligibility</li>
              <li>Document verification</li>
              <li>KYC/VKYC</li>
              <li>Bank processing</li>
              <li>Additional information requirements</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>4. Physical Application Process</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              For applications submitted through the Physical Process, documents may be collected or processed through authorized personnel or partners. Any physical document movement or courier process, where applicable, may be handled by the relevant service provider or financial institution.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>5. Delays</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              GharKaPaisa is not responsible for delays caused by:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Banks/NBFCs</li>
              <li>Courier companies</li>
              <li>Government verification systems</li>
              <li>KYC/VKYC providers</li>
              <li>Network issues</li>
              <li>External service providers</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>6. Contact</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              For application delivery or processing-related queries:
            </p>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px 20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div><FaEnvelope style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Email:</strong> <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal }}>support@gharkapaisa.in</a></div>
              <div><FaPhone style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Phone:</strong> <a href="tel:9270319438" style={{ color: C.teal }}>9270319438</a></div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
