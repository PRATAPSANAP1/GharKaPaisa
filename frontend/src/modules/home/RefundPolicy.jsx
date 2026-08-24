import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaArrowLeft, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaUndo } from 'react-icons/fa';

export default function RefundPolicy() {
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
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: C.text, margin: 0 }}>Cancellation & Refund Policy</h1>
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
          GharKaPaisa primarily provides digital application facilitation and related platform services.
        </div>

        {/* Policy Content Card */}
        <div style={{ 
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', 
          padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '28px' 
        }}>

          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>1. Application Cancellation</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              A customer may request cancellation of an application before the application has been finally processed, subject to the status of the application and the applicable process.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Cancellation requests can be submitted through:
            </p>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <div><FaEnvelope style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Email:</strong> <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal }}>support@gharkapaisa.in</a></div>
              <div><FaPhone style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Phone:</strong> <a href="tel:9270319438" style={{ color: C.teal }}>9270319438</a></div>
            </div>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Please provide your application number and registered mobile number.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>2. Financial Product Cancellation</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              If an application has already been submitted to a bank, NBFC, insurer, or other financial institution, cancellation may also be subject to the policies and processing rules of that institution.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              GharKaPaisa cannot guarantee cancellation once the application has entered the third-party provider's processing system.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>3. Payments for GharKaPaisa Services</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              If a paid service is offered by GharKaPaisa in the future, the applicable price, payment terms, refund eligibility, and cancellation terms will be clearly displayed before payment.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              GharKaPaisa does not charge customers merely for submitting a standard application for a third-party financial product unless a specific fee is clearly disclosed before payment.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>4. Refund Eligibility</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Where a payment has been made directly to GharKaPaisa for an eligible paid service, a refund may be considered where:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: '0 0 16px 0' }}>
              <li>The service was not delivered due to an error attributable to GharKaPaisa.</li>
              <li>A duplicate payment was successfully processed.</li>
              <li>A payment was incorrectly charged.</li>
              <li>The specific service's terms provide for a refund.</li>
            </ul>

            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              <strong>Refunds are not generally applicable merely because:</strong>
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>A bank rejected an application.</li>
              <li>A customer was not eligible for a financial product.</li>
              <li>A credit limit was lower than expected.</li>
              <li>A loan amount was not approved.</li>
              <li>A bank/NBFC changed its decision.</li>
              <li>A customer changed their mind after the third-party financial institution began processing the application.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>5. Duplicate Payments</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              If you believe you have been charged more than once for the same transaction, contact us with the transaction details.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              After verification, an eligible duplicate payment will be processed for refund.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>6. Refund Processing</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Approved refunds will be processed to the original payment method, subject to the payment gateway and banking system timelines.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              The actual time taken for the amount to appear in the customer's account may depend on the bank/card issuer/payment provider.
            </p>
          </section>

          {/* Section 7 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>7. Third-Party Financial Products</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              Any fees, charges, cancellation terms, annual fees, processing fees, interest, penalties, or other financial-product charges imposed by a bank/NBFC/insurer are governed by that provider's terms.
            </p>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Such third-party charges are not automatically refundable by GharKaPaisa.
            </p>
          </section>

          {/* Section 8 */}
          <section style={{ borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.teal, marginBottom: '12px' }}>8. Contact for Refunds</h2>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              For refund or cancellation requests:
            </p>
            <div style={{ background: C.bgSecondary, border: `1px solid ${C.border}`, padding: '16px 20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
              <div><FaEnvelope style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Email:</strong> <a href="mailto:support@gharkapaisa.in" style={{ color: C.teal }}>support@gharkapaisa.in</a></div>
              <div><FaPhone style={{ display: 'inline', marginRight: 8, color: C.teal }} /> <strong>Phone:</strong> <a href="tel:9270319438" style={{ color: C.teal }}>9270319438</a></div>
            </div>
            <p style={{ color: C.textMid, fontSize: '14px', lineHeight: 1.7, margin: '0 0 8px 0' }}>
              Please include:
            </p>
            <ul style={{ paddingLeft: '20px', color: C.textMid, fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
              <li>Name</li>
              <li>Registered mobile number</li>
              <li>Application number</li>
              <li>Transaction ID, if applicable</li>
              <li>Payment date</li>
              <li>Reason for refund request</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
