import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getApiV1Url } from '../../config/api';
import { getCleanImageUrl } from '../../utils/urlHelper';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import LoadingLogo from '../../components/Loader/LoadingLogo';

export default function ProductApplyLanding() {
  const { partnerCode, productId } = useParams();
  const [searchParams] = useSearchParams();

  const [product, setProduct] = useState(null);
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [countdown, setCountdown] = useState(5);

  const { clearPersistedDraft } = useFormPersistence(`product_landing_${productId || 'apply'}`, {
    customerName, customerMobile
  }, {
    customerName: setCustomerName,
    customerMobile: setCustomerMobile
  });

  // Responsive
  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setWinW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const isMobile = winW < 640;

  // Active tab for product details
  const [activeTab, setActiveTab] = useState('features');

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiV1Url()}/products/landing/${productId}?partner=${partnerCode || ''}`);
        const json = await res.json();
        if (json && json.success && json.data) {
          setProduct(json.data.product);
          setBank(json.data.bank || null);
        } else {
          setError(json.message || 'Product not found');
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId, partnerCode]);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return alert('Please enter your name');
    if (!customerMobile.trim() || customerMobile.trim().length < 10) return alert('Please enter a valid 10-digit mobile number');

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiV1Url()}/products/landing/${productId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_mobile: customerMobile.trim().replace(/\D/g, '').slice(-10),
          partner_code: partnerCode || searchParams.get('partner') || null
        })
      });
      const json = await res.json();
      if (json && json.success) {
        clearPersistedDraft();
        setRedirectUrl(json.data?.redirect_url || '');
        setSubmitted(true);
      } else {
        alert(json.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Apply failed:', err);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Colors
  const themeColor = bank?.theme_color || '#2563EB';
  const bgPrimary = '#0F172A';
  const bgCard = '#1E293B';
  const textPrimary = '#F1F5F9';
  const textSecondary = '#94A3B8';
  const borderColor = '#334155';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgPrimary, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <LoadingLogo size={100} />
        <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bgPrimary, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>{error || 'Product Not Found'}</h2>
        <p style={{ fontSize: '14px', color: textSecondary, marginBottom: '24px' }}>The product you are looking for may have been removed or the link is invalid.</p>
        <a href="https://gharkapaisa.in" style={{ padding: '10px 24px', background: themeColor, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
          Visit GharKaPaisa
        </a>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    const bankPortalUrl = redirectUrl || product?.partner_url || product?.public_url || 'https://gharkapaisa.in';
    const qdFormUrl = `/products/${product?.category || 'credit-cards'}/${product?.slug || productId}/apply`;

    return (
      <div style={{ minHeight: '100vh', background: bgPrimary, color: textPrimary, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: isMobile ? '16px 12px' : '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Top Branding Banner */}
        <div style={{ width: '100%', maxWidth: '640px', textAlign: 'center', marginBottom: isMobile ? '16px' : '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${themeColor}18`, border: `1px solid ${themeColor}30`, padding: '6px 14px', borderRadius: '30px', color: themeColor, fontWeight: 800, fontSize: isMobile ? '11px' : '12px', letterSpacing: '0.5px', marginBottom: '10px' }}>
            🛡️ OFFICIALLY VERIFIED APPLICATION PORTAL
          </div>
          <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{product.name}</h1>
          <p style={{ fontSize: isMobile ? '13px' : '14px', color: textSecondary, margin: 0 }}>
            {bank?.name || product.bank_name || 'Bank'} • Self-Fulfillment Link
          </p>
        </div>

        {/* TOP CENTER TAB NAVIGATION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '440px', marginBottom: isMobile ? '18px' : '24px' }}>
          <div style={{ display: 'flex', background: '#1E293B', padding: '4px', borderRadius: '16px', width: '100%', border: `1px solid ${borderColor}`, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={{
                flex: 1,
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: 'transparent',
                color: textSecondary
              }}
            >
              📋 Product Details
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 800,
                cursor: 'default',
                background: `linear-gradient(135deg, ${themeColor}, #1d4ed8)`,
                color: '#ffffff',
                boxShadow: `0 4px 14px ${themeColor}40`
              }}
            >
              ✍️ Apply Now
            </button>
          </div>
        </div>

        {/* SUCCESS CARD */}
        <div style={{ width: '100%', maxWidth: '640px', background: bgCard, borderRadius: isMobile ? '20px' : '24px', border: `1px solid ${borderColor}`, padding: isMobile ? '24px 18px' : '36px 28px', boxShadow: '0 16px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#10b98120', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: isMobile ? '19px' : '22px', fontWeight: 900, margin: '0 0 8px', color: '#10b981' }}>Details Saved Successfully!</h2>
          <p style={{ fontSize: '13.5px', color: textSecondary, maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.5' }}>
            Your customer details for <strong>{product.name}</strong> have been recorded. Proceed to the bank portal to finish your application.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '12px' }}>
            <a
              href={bankPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '15px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(16,185,129,0.35)'
              }}
            >
              1. OPEN OFFICIAL BANK APPLICATION PORTAL ➔
            </a>

            <a
              href={qdFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '15px 16px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${themeColor}, #1d4ed8)`,
                color: '#ffffff',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: `0 6px 20px ${themeColor}35`
              }}
            >
              2. OPEN QD (QUICK DETAILS) FORM IN NEW TAB ↗
            </a>
          </div>
        </div>

      </div>
    );
  }

  const features = Array.isArray(product.features) ? product.features : (product.features_list || []);
  const requiredDocs = Array.isArray(product.required_documents) && product.required_documents.length > 0 ? product.required_documents : ['PAN Card', 'Aadhaar Card', 'Income Proof / Salary Slip'];

  return (
    <div style={{ minHeight: '100vh', background: bgPrimary, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── TOP BAR ── */}
      <div style={{
        background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}CC 100%)`,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🏦</span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>GharKaPaisa</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px' }}>
          Official Partner Application
        </span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

        {/* ── PRODUCT HERO CARD ── */}
        <div style={{
          background: bgCard, borderRadius: '24px', border: `1px solid ${borderColor}`,
          padding: isMobile ? '20px' : '28px', marginBottom: '24px',
          boxShadow: `0 8px 30px rgba(0,0,0,0.3)`
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px', height: '48px', borderRadius: '12px', background: '#0F172A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px',
              border: `1px solid ${borderColor}`, flexShrink: 0
            }}>
              <img
                src={getCleanImageUrl(product.card_image_url || product.image_url || product.thumbnail_url) || (bank?.logo_url)}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.src = bank?.logo_url || ''; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, margin: '0 0 4px', lineHeight: 1.3 }}>{product.name}</h1>
              <p style={{ fontSize: '13px', color: themeColor, fontWeight: 700, margin: 0 }}>
                {bank?.name || 'Bank'} • {product.sub_category || product.category || 'Credit Card'}
              </p>
            </div>
          </div>

          {/* Key Points */}
          {features.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {features.slice(0, 4).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: textSecondary }}>
                  <span style={{ color: '#10B981', fontSize: '14px', flexShrink: 0 }}>✓</span>
                  <span>{typeof f === 'string' ? f : (f.title || f.label)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Info Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {product.joining_fee !== undefined && product.joining_fee !== null && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: `${themeColor}15`, color: themeColor, border: `1px solid ${themeColor}30` }}>
                Joining Fee: {product.joining_fee === 0 || product.joining_fee === '0' ? 'FREE' : `₹${product.joining_fee}`}
              </span>
            )}
            {product.annual_fee !== undefined && product.annual_fee !== null && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#10B98115', color: '#10B981', border: '1px solid #10B98130' }}>
                Annual Fee: {product.annual_fee === 0 || product.annual_fee === '0' ? 'FREE' : `₹${product.annual_fee}`}
              </span>
            )}
            {product.min_income && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30' }}>
                Min Income: ₹{Number(product.min_income).toLocaleString('en-IN')}/mo
              </span>
            )}
          </div>
        </div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
          gap: '24px',
          alignItems: 'start'
        }}>

          {/* LEFT: Product Details Tabs */}
          <div style={{
            background: bgCard, borderRadius: '24px', border: `1px solid ${borderColor}`,
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            order: isMobile ? 2 : 1
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
              {[
                { id: 'features', label: '✨ Features' },
                { id: 'eligibility', label: '📋 Eligibility' },
                { id: 'documents', label: '📄 Documents' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    background: activeTab === tab.id ? themeColor : 'transparent',
                    color: activeTab === tab.id ? '#fff' : textSecondary,
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '180px' }}>
              {activeTab === 'features' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px' }}>Key Features & Benefits</h3>
                  {features.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: textSecondary, lineHeight: 1.5 }}>
                          <span style={{ color: '#10B981', fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                          <span>{typeof f === 'string' ? f : (f.title || f.label)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: textSecondary, fontSize: '13px' }}>{product.description || 'Exclusive benefits and rewards on every transaction.'}</p>
                  )}
                </div>
              )}

              {activeTab === 'eligibility' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px' }}>Eligibility Requirements</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: textSecondary }}>
                    {product.min_age && <div><strong style={{ color: textPrimary }}>Min Age:</strong> {product.min_age} Years</div>}
                    {product.max_age && <div><strong style={{ color: textPrimary }}>Max Age:</strong> {product.max_age} Years</div>}
                    {product.min_income && <div><strong style={{ color: textPrimary }}>Min Monthly Income:</strong> ₹{Number(product.min_income).toLocaleString('en-IN')}</div>}
                    {product.eligibility_criteria && (
                      typeof product.eligibility_criteria === 'string' ? (
                        <div style={{ padding: '12px', background: '#0F172A', borderRadius: '10px', border: `1px solid ${borderColor}`, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{product.eligibility_criteria}</div>
                      ) : (
                        Object.entries(product.eligibility_criteria).map(([k, v]) => (
                          <div key={k} style={{ textTransform: 'capitalize' }}>
                            <strong style={{ color: textPrimary }}>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                          </div>
                        ))
                      )
                    )}
                    {!product.min_age && !product.max_age && !product.min_income && !product.eligibility_criteria && (
                      <p>Indian resident aged 21-65 with a regular monthly income source.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px' }}>Documents Required</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {requiredDocs.map((doc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: textSecondary }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: themeColor, flexShrink: 0 }} />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Apply Form */}
          <div style={{
            background: bgCard, borderRadius: '24px', border: `1px solid ${themeColor}40`,
            padding: isMobile ? '20px' : '28px',
            boxShadow: `0 8px 30px ${themeColor}15`,
            position: isMobile ? 'static' : 'sticky', top: '24px',
            order: isMobile ? 1 : 2
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${themeColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span style={{ fontSize: '22px' }}>📝</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 4px' }}>Apply for {product.name}</h3>
              <p style={{ fontSize: '12.5px', color: textSecondary, margin: 0 }}>Fill the details below to proceed to the official application</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                    background: '#0F172A', border: `1.5px solid ${borderColor}`, borderRadius: '12px',
                    color: textPrimary, fontSize: '14px', fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = themeColor}
                  onBlur={(e) => e.target.style.borderColor = borderColor}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '6px' }}>Mobile Number *</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#0F172A', border: `1.5px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <span style={{ padding: '12px 10px 12px 14px', fontSize: '14px', fontWeight: 700, color: textSecondary, borderRight: `1px solid ${borderColor}` }}>+91</span>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile"
                    required
                    maxLength={10}
                    style={{
                      flex: 1, padding: '12px 14px', background: 'transparent', border: 'none',
                      color: textPrimary, fontSize: '14px', fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: '14px',
                  background: submitting ? '#475569' : `linear-gradient(135deg, ${themeColor}, ${themeColor}CC)`,
                  color: '#fff', fontSize: '15px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : `0 8px 24px ${themeColor}40`,
                  transition: 'all 0.2s', marginTop: '4px'
                }}
              >
                {submitting ? 'Processing...' : `Apply Now →`}
              </button>

              <p style={{ fontSize: '11px', color: textSecondary, textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5 }}>
                By clicking Apply, you agree to our Terms & Conditions. You will be redirected to the official {bank?.name || 'bank'} application portal.
              </p>
            </form>

            {/* Trust Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textSecondary }}>
                <span>🔒</span> Secure
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textSecondary }}>
                <span>⚡</span> Instant
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textSecondary }}>
                <span>✅</span> Verified
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '48px', paddingBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: textSecondary }}>
            Powered by <strong style={{ color: themeColor }}>GharKaPaisa</strong> • India's Financial Products Marketplace
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
    </div>
  );
}
