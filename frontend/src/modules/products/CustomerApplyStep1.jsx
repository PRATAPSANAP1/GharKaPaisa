import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApiV1Url } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function CustomerApplyStep1() {
  const params = useParams();
  const token = params.token || params.trackingToken;
  const activeToken = token;
  const { C, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  // Top Center Tab State: 'product_details' | 'apply_now'
  const [activeTab, setActiveTab] = useState('apply_now');

  // Loaded Data
  const [product, setProduct] = useState(null);
  const [customer, setCustomer] = useState(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNum, setMobileNum] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('Salaried');
  const [income, setIncome] = useState('');
  const [employer, setEmployer] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    const fetchTokenDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${getApiV1Url()}/public/apply/${activeToken}`);
        const json = await res.json();

        if (json && json.success && json.data) {
          const data = json.data;
          setProduct(data.product || null);

          const bankLink = (data.product?.partner_url && data.product.partner_url.trim())
            || (data.product?.application_url && data.product.application_url.trim())
            || (data.product?.public_url && data.product.public_url.trim())
            || (data.product?.apply_url && data.product.apply_url.trim())
            || (data.product?.redirect_url && data.product.redirect_url.trim());
          if (bankLink) {
            setRedirectUrl(bankLink);
          }

          if (data.customer) {
            setCustomer(data.customer);
            setFullName(data.customer.full_name || '');
            setMobileNum(data.customer.mobile || '');
            setEmail(data.customer.email || '');
            setDob(data.customer.dob || '');
            setOccupation(data.customer.occupation || data.customer.employment_type || 'Salaried');
            setIncome(data.customer.monthly_income || '');
            setEmployer(data.customer.employer || '');
            setPan(data.customer.pan_number || '');
            setAadhaar(data.customer.aadhaar_number || '');
            setCity(data.customer.city || '');
            setState(data.customer.state || '');
            setPincode(data.customer.pincode || '');
          }
        } else {
          setError(json?.message || 'Invalid or expired application link');
        }
      } catch (err) {
        console.error('Fetch apply token details error:', err);
        setError('Network error loading details. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (activeToken) fetchTokenDetails();
  }, [activeToken]);

  const bankNameStr = String(product?.bank_name || product?.bank_code || product?.name || '').toLowerCase();
  const isSbiProduct = product?.bank_id === 'e7c2c604-139d-4fcf-a87c-695633535a02' || bankNameStr.includes('sbi') || bankNameStr.includes('state bank');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameVal = fullName.trim() || customer?.full_name || '';
    const mobileVal = mobileNum.trim() || customer?.mobile || '';

    if (!nameVal) {
      return alert('Please enter your Customer Name.');
    }

    const cleanMobile = mobileVal.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      return alert('Please enter a valid 10-digit Mobile Number.');
    }

    const cleanPan = pan.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (isSbiProduct) {
      if (!cleanPan || !panRegex.test(cleanPan)) {
        return alert('Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F) for SBI Bank product.');
      }
    } else if (cleanPan) {
      if (!panRegex.test(cleanPan)) {
        return alert('Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).');
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiV1Url()}/public/apply/${activeToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: nameVal,
          customer_name: nameVal,
          mobile: cleanMobile,
          customer_mobile: cleanMobile,
          pan: cleanPan || null,
          pan_number: cleanPan || null,
          process_type: 'linked_share',
          process_by: 'partner',
          source: 'linked_share'
        })
      });

      const json = await res.json();
      if (json && json.success) {
        setSubmitted(true);
        const targetUrl = json.data?.redirect_url || redirectUrl || product?.partner_url || product?.application_url || product?.public_url || product?.apply_url || product?.redirect_url || 'https://gharkapaisa.in';
        setRedirectUrl(targetUrl);
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      } else {
        alert(json?.message || 'Failed to submit application details. Please check your inputs.');
      }
    } catch (err) {
      console.error('Submit application error:', err);
      alert('Network error while saving details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Responsive Window Width Listener
  const [winWidth, setWinWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = winWidth < 640;

  const themeBg = isDark ? '#09090b' : '#f8fafc';
  const cardBg = isDark ? '#141417' : '#ffffff';
  const borderCol = isDark ? '#27272a' : '#e2e8f0';
  const textCol = isDark ? '#f4f4f5' : '#0f172a';
  const mutedCol = isDark ? '#a1a1aa' : '#64748b';
  const inputBg = isDark ? '#1f1f23' : '#f8fafc';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: themeBg, color: textCol, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '44px', height: '44px', border: `4px solid ${borderCol}`, borderTopColor: C.primary || '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px', fontWeight: 700 }}>Loading Official Application Portal...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: themeBg, color: textCol, fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px', color: '#f87171' }}>{error || 'Invalid Application Link'}</h2>
        <p style={{ fontSize: '14px', color: mutedCol, maxWidth: '400px', marginBottom: '24px' }}>This application link is expired, inactive, or already processed.</p>
        <a href="https://gharkapaisa.in" style={{ padding: '12px 24px', background: C.primary || '#2563eb', color: '#fff', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>Return to Homepage</a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: themeBg, color: textCol, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: isMobile ? '16px 12px' : '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Top Branding Banner */}
      <div style={{ width: '100%', maxWidth: '640px', textAlign: 'center', marginBottom: isMobile ? '16px' : '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${C.primary || '#2563eb'}18`, border: `1px solid ${C.primary || '#2563eb'}30`, padding: '6px 14px', borderRadius: '30px', color: C.primary || '#2563eb', fontWeight: 800, fontSize: isMobile ? '11px' : '12px', letterSpacing: '0.5px', marginBottom: '10px' }}>
          🛡️ OFFICIALLY VERIFIED APPLICATION PORTAL
        </div>
        <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{product.name}</h1>
        <p style={{ fontSize: isMobile ? '13px' : '14px', color: mutedCol, margin: 0 }}>
          {product.bank_name} • Self-Fulfillment Link
        </p>
      </div>

      {/* TOP CENTER TAB NAVIGATION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '440px', marginBottom: isMobile ? '18px' : '24px' }}>
        <div style={{ display: 'flex', background: isDark ? '#1f1f23' : '#e2e8f0', padding: '4px', borderRadius: '16px', width: '100%', border: `1px solid ${borderCol}`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('product_details')}
            style={{
              flex: 1,
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'product_details' ? (isDark ? '#27272a' : '#ffffff') : 'transparent',
              color: activeTab === 'product_details' ? (C.primary || '#2563eb') : mutedCol,
              boxShadow: activeTab === 'product_details' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📋 Product Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apply_now')}
            style={{
              flex: 1,
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'apply_now' ? `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)` : 'transparent',
              color: activeTab === 'apply_now' ? '#ffffff' : mutedCol,
              boxShadow: activeTab === 'apply_now' ? '0 4px 14px rgba(37,99,235,0.4)' : 'none'
            }}
          >
            ✍️ Apply Now
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCT DETAILS CONTENT */}
      {activeTab === 'product_details' && (
        <div style={{ width: '100%', maxWidth: '640px', background: cardBg, borderRadius: isMobile ? '20px' : '24px', border: `1px solid ${borderCol}`, padding: isMobile ? '18px 16px' : '28px', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
          
          {/* Header Info */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${borderCol}`, marginBottom: '18px' }}>
            {product.bank_logo && (
              <img src={product.bank_logo} alt={product.bank_name} style={{ width: isMobile ? '48px' : '60px', height: isMobile ? '48px' : '60px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '4px', border: `1px solid ${borderCol}`, flexShrink: 0 }} />
            )}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary || '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {product.category?.replace(/_/g, ' ')}
              </span>
              <h2 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 900, margin: '2px 0 2px' }}>{product.name}</h2>
              <div style={{ fontSize: '12.5px', color: mutedCol }}>Issued by {product.bank_name}</div>
            </div>
          </div>

          {/* Quick Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: inputBg, border: `1px solid ${borderCol}`, padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: mutedCol, fontWeight: 700, display: 'block', marginBottom: '2px' }}>Annual Fee</span>
              <strong style={{ fontSize: '13.5px', color: textCol }}>{product.annual_fee || (product.is_lifetime_free ? 'Lifetime Free' : 'N/A')}</strong>
            </div>
            <div style={{ background: inputBg, border: `1px solid ${borderCol}`, padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: mutedCol, fontWeight: 700, display: 'block', marginBottom: '2px' }}>Joining Fee</span>
              <strong style={{ fontSize: '13.5px', color: textCol }}>{product.is_lifetime_free ? '₹0 Free' : 'Standard'}</strong>
            </div>
            <div style={{ background: inputBg, border: `1px solid ${borderCol}`, padding: '12px', borderRadius: '14px', textAlign: 'center', gridColumn: isMobile ? 'span 2' : 'span 1' }}>
              <span style={{ fontSize: '11px', color: mutedCol, fontWeight: 700, display: 'block', marginBottom: '2px' }}>Min Monthly Income</span>
              <strong style={{ fontSize: '13.5px', color: textCol }}>₹25,000 / month</strong>
            </div>
          </div>

          {/* Description & Rewards */}
          {(product.short_description || product.description) && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 6px' }}>About {product.name}</h3>
              <p style={{ fontSize: '13px', color: mutedCol, lineHeight: '1.6', margin: 0 }}>
                {product.short_description || product.description}
              </p>
            </div>
          )}

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: '0 0 10px' }}>Key Highlights & Benefits</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {product.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: inputBg, padding: '10px 12px', borderRadius: '12px', border: `1px solid ${borderCol}`, fontSize: '12.5px' }}>
                    <span style={{ color: C.primary || '#2563eb', fontWeight: 900, fontSize: '14px' }}>✓</span>
                    <span>{typeof feat === 'string' ? feat : (feat.title || feat.description)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Switch to Form CTA */}
          <button
            type="button"
            onClick={() => setActiveTab('apply_now')}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              marginTop: '8px'
            }}
          >
            PROCEED TO APPLICATION FORM ➔
          </button>
        </div>
      )}

      {/* TAB 2: APPLY NOW FORM CONTENT */}
      {activeTab === 'apply_now' && (
        <div style={{ width: '100%', maxWidth: '640px', background: cardBg, borderRadius: isMobile ? '20px' : '24px', border: `1px solid ${borderCol}`, padding: isMobile ? '18px 16px' : '28px', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
          
          {submitted ? (
            /* SUBMITTED REDIRECTING SCREEN */
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <div style={{ width: '56px', height: '56px', border: `4px solid ${borderCol}`, borderTopColor: C.primary || '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: isMobile ? '19px' : '22px', fontWeight: 900, margin: '0 0 8px', color: '#10b981' }}>Details Saved Successfully!</h2>
              <p style={{ fontSize: '14px', color: mutedCol, maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                Redirecting you to the official bank application portal for <strong>{product.name}</strong>...
              </p>
              <a
                href={redirectUrl || product?.partner_url || product?.application_url || product?.public_url || product?.apply_url || product?.redirect_url || 'https://gharkapaisa.in'}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                }}
              >
                Click Here if Not Redirected Automatically ➔
              </a>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            /* APPLICATION FORM */
            <div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Customer Name & Mobile Number */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '5px' }}>Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Customer Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '13.5px', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '5px' }}>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-Digit Mobile Number"
                      value={mobileNum}
                      onChange={(e) => setMobileNum(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '13.5px', fontWeight: 700, fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* PAN Card Field (Mandatory for SBI products, optional for others) */}
                {(isSbiProduct || pan) && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '5px' }}>
                      PAN Card Number {isSbiProduct ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      required={isSbiProduct}
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '13.5px', fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', outline: 'none' }}
                    />
                    {isSbiProduct && (
                      <span style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ℹ️ PAN Card details are required for SBI Bank applications.
                      </span>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: 'none',
                    borderRadius: '14px',
                    background: submitting ? '#64748b' : `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
                    color: '#ffffff',
                    fontSize: isMobile ? '14.5px' : '16px',
                    fontWeight: 900,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                    marginTop: '8px'
                  }}
                >
                  {submitting ? 'Saving Application Details...' : 'SUBMIT DETAILS & PROCEED TO BANK ➔'}
                </button>

              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
