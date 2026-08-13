import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApiV1Url } from '../../config/api';
import { getCleanImageUrl } from '../../utils/urlHelper';
import { useTheme } from '../../contexts/ThemeContext';
import { getBankApplyLink } from '../home/components/CreditCards/cardLinkHelper';

export default function PartnerShareLanding() {
  const { trackingToken } = useParams();
  const { C, isDark } = useTheme();

  const [product, setProduct] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => { setMounted(true); }, []);

  // Fetch share link details
  useEffect(() => {
    const fetchShareDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiV1Url()}/public/share/${trackingToken}`);
        const json = await res.json();
        if (json && json.success && json.data) {
          setProduct(json.data.product);
          setPartner(json.data.partner);
        } else {
          setError(json.message || 'Invalid or expired share link');
        }
      } catch (err) {
        console.error('Failed to load share link:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (trackingToken) fetchShareDetails();
  }, [trackingToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return alert('Please enter your name');
    if (!customerMobile.trim() || customerMobile.trim().length < 10) return alert('Please enter a valid 10-digit mobile number');

    setSubmitting(true);
    try {
      console.log('Submitting lead:', { trackingToken, customerName, customerMobile });
      const res = await fetch(`${getApiV1Url()}/public/share/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingToken,
          customerName: customerName.trim(),
          customerMobile: customerMobile.trim().replace(/\D/g, '').slice(-10)
        })
      });
      
      const json = await res.json();
      console.log('Response data:', json);
      if (json && json.success) {
        const targetUrl = json.data?.redirect_url || 
          product?.partner_url || 
          product?.public_url || 
          product?.application_url || 
          product?.apply_url || 
          product?.redirect_url || 
          getBankApplyLink(product?.name, product?.bank_code || product?.bank_name);

        if (targetUrl) {
          // DIRECTLY GO TO THIS CARD BANK LINK IMMEDIATELY!
          console.log('Directly navigating to bank portal link:', targetUrl);
          window.location.href = targetUrl;
          return;
        } else {
          setSubmitted(true);
          setRedirectUrl('https://gharkapaisa.in');
        }
      } else {
        // Fallback directly to bank apply link if backend lead submit had an issue
        const fallbackUrl = product?.partner_url || 
          product?.public_url || 
          product?.application_url || 
          product?.apply_url || 
          getBankApplyLink(product?.name, product?.bank_code || product?.bank_name);

        if (fallbackUrl) {
          window.location.href = fallbackUrl;
          return;
        }
        alert(json.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      const fallbackUrl = product?.partner_url || 
        product?.public_url || 
        product?.application_url || 
        product?.apply_url || 
        getBankApplyLink(product?.name, product?.bank_code || product?.bank_name);

      if (fallbackUrl) {
        window.location.href = fallbackUrl;
        return;
      }
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Colors from theme context
  const bg = isDark ? '#000' : C.bg;
  const cardBg = isDark ? '#0f0f0f' : '#fff';
  const border = isDark ? '#1f1f1f' : C.border;
  const textPrimary = C.text;
  const textSecondary = C.textMid;
  const accent = C.primary;
  const themeColor = product?.bank_code ? accent : accent;

  // Active section for top buttons ('details' | 'apply')
  const [activeSection, setActiveSection] = useState('apply');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '48px', height: '48px', border: `4px solid ${border}`, borderTopColor: themeColor, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Loading product details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>{error || 'Link Not Found'}</h2>
        <p style={{ fontSize: '14px', color: textSecondary, marginBottom: '24px' }}>This share link may have expired or is invalid.</p>
        <a href="https://gharkapaisa.in" style={{ padding: '10px 24px', background: themeColor, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}>
          Visit GharKaPaisa
        </a>
      </div>
    );
  }

  const features = Array.isArray(product.features) ? product.features : (product.features_list || []);
  const requiredDocs = Array.isArray(product.required_documents) && product.required_documents.length > 0 ? product.required_documents : ['PAN Card', 'Aadhaar Card', 'Income Proof / Salary Slip'];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── TOP ACTION BAR WITH 2 BUTTONS: Product Details & Apply ── */}
      <div style={{
        display: 'flex',
        justify: 'center',
        alignItems: 'center',
        padding: isMobile ? '10px 14px' : '14px 24px',
        gap: '12px',
        background: cardBg,
        borderBottom: `1px solid ${border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveSection('details');
            const el = document.getElementById('section-details');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            flex: 1,
            maxWidth: '220px',
            padding: isMobile ? '10px 12px' : '12px 20px',
            borderRadius: '12px',
            border: activeSection === 'details' ? 'none' : `1.5px solid ${border}`,
            background: activeSection === 'details' ? `linear-gradient(135deg, ${themeColor}, ${C.primaryDark})` : (isDark ? '#1a1a1a' : '#f8faff'),
            color: activeSection === 'details' ? '#fff' : textPrimary,
            fontWeight: 800,
            fontSize: isMobile ? '13px' : '14.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: activeSection === 'details' ? `0 4px 14px ${themeColor}40` : 'none'
          }}
        >
          <span>📄</span> Product Details
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('apply');
            const el = document.getElementById('section-apply');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            flex: 1,
            maxWidth: '220px',
            padding: isMobile ? '10px 12px' : '12px 20px',
            borderRadius: '12px',
            border: activeSection === 'apply' ? 'none' : `1.5px solid ${border}`,
            background: activeSection === 'apply' ? `linear-gradient(135deg, ${themeColor}, ${C.primaryDark})` : (isDark ? '#1a1a1a' : '#f8faff'),
            color: activeSection === 'apply' ? '#fff' : textPrimary,
            fontWeight: 800,
            fontSize: isMobile ? '13px' : '14.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: activeSection === 'apply' ? `0 4px 14px ${themeColor}40` : 'none'
          }}
        >
          <span>✍️</span> Apply
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

        {/* ── PRODUCT HERO CARD ── */}
        <div id="section-details" style={{
          background: cardBg, borderRadius: '24px', border: `1px solid ${border}`,
          padding: isMobile ? '20px' : '28px', marginBottom: '24px',
          boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.1)',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px', height: '48px', borderRadius: '12px', background: isDark ? '#1a1a1a' : '#f8faff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px',
              border: `1px solid ${border}`, flexShrink: 0
            }}>
              <img
                src={getCleanImageUrl(product.card_image_url || product.image_url || product.thumbnail_url) || (product.bank_logo)}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.src = product.bank_logo || ''; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, margin: '0 0 4px', lineHeight: 1.3 }}>{product.name}</h1>
              <p style={{ fontSize: '13px', color: themeColor, fontWeight: 700, margin: 0 }}>
                {product.bank_name || 'Bank'} • {product.sub_category || product.category || 'Credit Card'}
              </p>
              {partner && (
                <p style={{ fontSize: '11px', color: textSecondary, marginTop: '4px' }}>
                  Referred by: {partner.first_name} {partner.last_name} ({partner.partner_code})
                </p>
              )}
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
            background: cardBg, borderRadius: '24px', border: `1px solid ${border}`,
            padding: isMobile ? '16px' : '24px',
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
            order: isMobile ? 2 : 1
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: `1px solid ${border}`, paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
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
                        <div style={{ padding: '12px', background: isDark ? '#1a1a1a' : '#f8faff', borderRadius: '10px', border: `1px solid ${border}`, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{product.eligibility_criteria}</div>
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
          <div id="section-apply" style={{
            background: cardBg, borderRadius: '24px', border: `1px solid ${themeColor}40`,
            padding: isMobile ? '20px' : '28px',
            boxShadow: isDark ? 'none' : `0 8px 30px ${themeColor}15`,
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
                    background: isDark ? '#1a1a1a' : '#f8faff', border: `1.5px solid ${border}`, borderRadius: '12px',
                    color: textPrimary, fontSize: '14px', fontWeight: 600, outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = themeColor}
                  onBlur={(e) => e.target.style.borderColor = border}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '6px' }}>Mobile Number *</label>
                <div style={{ display: 'flex', alignItems: 'center', background: isDark ? '#1a1a1a' : '#f8faff', border: `1.5px solid ${border}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <span style={{ padding: '12px 10px 12px 14px', fontSize: '14px', fontWeight: 700, color: textSecondary, borderRight: `1px solid ${border}` }}>+91</span>
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
                  background: submitting ? '#475569' : `linear-gradient(135deg, ${themeColor}, ${C.primaryDark})`,
                  color: '#fff', fontSize: '15px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : `0 8px 24px ${themeColor}40`,
                  transition: 'all 0.2s', marginTop: '4px'
                }}
              >
                {submitting ? 'Processing...' : `Apply Now →`}
              </button>

              <p style={{ fontSize: '11px', color: textSecondary, textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5 }}>
                By clicking Apply, you agree to our Terms & Conditions. You will be redirected to the official {product.bank_name || 'bank'} application portal.
              </p>
            </form>

            {/* Trust Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${border}` }}>
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
