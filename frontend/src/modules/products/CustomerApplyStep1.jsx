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

          if (data.customer) {
            setCustomer(data.customer);
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
        console.error('Failed to load application details:', err);
        setError('Failed to connect to backend server. Please refresh or try again.');
      } finally {
        setLoading(false);
      }
    };

    if (activeToken) fetchTokenDetails();
  }, [activeToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      return alert('Please enter a valid email address.');
    }
    if (!dob) {
      return alert('Please select your Date of Birth.');
    }
    if (!income || parseFloat(income) <= 0) {
      return alert('Please enter a valid monthly income.');
    }
    if (!employer.trim()) {
      return alert('Please enter your employer or company name.');
    }

    const cleanPan = pan.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!cleanPan || !panRegex.test(cleanPan)) {
      return alert('Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).');
    }

    const cleanAadhaar = aadhaar.trim();
    if (!cleanAadhaar || cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
      return alert('Please enter a valid 12-digit Aadhaar Card number.');
    }

    if (!city.trim()) return alert('Please enter your City.');
    if (!state.trim()) return alert('Please enter your State.');
    if (!pincode.trim() || pincode.trim().length !== 6) return alert('Please enter a valid 6-digit Pincode.');

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiV1Url()}/public/apply/${activeToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          dob,
          occupation,
          employment: occupation,
          income: parseFloat(income),
          monthly_income: parseFloat(income),
          employer: employer.trim(),
          company_name: employer.trim(),
          pan: cleanPan,
          pan_number: cleanPan,
          aadhaar: cleanAadhaar,
          aadhaar_number: cleanAadhaar,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim()
        })
      });

      const json = await res.json();
      if (json && json.success) {
        setSubmitted(true);
        const targetUrl = json.data?.redirect_url || 'https://gharkapaisa.in';
        setRedirectUrl(targetUrl);
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
    <div style={{ minHeight: '100vh', background: themeBg, color: textCol, fontFamily: "'Inter', sans-serif", padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Top Branding Banner */}
      <div style={{ width: '100%', maxWidth: '640px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${C.primary || '#2563eb'}18`, border: `1px solid ${C.primary || '#2563eb'}30`, padding: '6px 16px', borderRadius: '30px', color: C.primary || '#2563eb', fontWeight: 800, fontSize: '12px', letterSpacing: '0.5px', marginBottom: '12px' }}>
          🛡️ OFFICIALLY VERIFIED APPLICATION PORTAL
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{product.name}</h1>
        <p style={{ fontSize: '14px', color: mutedCol, margin: 0 }}>
          {product.bank_name} • Self-Fulfillment Link
        </p>
      </div>

      {/* TOP CENTER TAB NAVIGATION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '420px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', background: isDark ? '#1f1f23' : '#e2e8f0', padding: '5px', borderRadius: '16px', width: '100%', border: `1px solid ${borderCol}`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('product_details')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
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
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
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
        <div style={{ width: '100%', maxWidth: '640px', background: cardBg, borderRadius: '24px', border: `1px solid ${borderCol}`, padding: '28px', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
          
          {/* Header Info */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '20px', borderBottom: `1px solid ${borderCol}`, marginBottom: '20px' }}>
            {product.bank_logo && (
              <img src={product.bank_logo} alt={product.bank_name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '6px', border: `1px solid ${borderCol}` }} />
            )}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.primary || '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {product.category?.replace(/_/g, ' ')}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '2px 0 4px' }}>{product.name}</h2>
              <div style={{ fontSize: '13px', color: mutedCol }}>Issued by {product.bank_name}</div>
            </div>
          </div>

          {/* Quick Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: inputBg, border: `1px solid ${borderCol}`, padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: mutedCol, fontWeight: 700, display: 'block', marginBottom: '4px' }}>Annual Fee</span>
              <strong style={{ fontSize: '14px', color: textCol }}>{product.annual_fee || (product.is_lifetime_free ? 'Lifetime Free' : 'N/A')}</strong>
            </div>
            <div style={{ background: inputBg, border: `1px solid ${borderCol}`, padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: mutedCol, fontWeight: 700, display: 'block', marginBottom: '4px' }}>Joining Fee</span>
              <strong style={{ fontSize: '14px', color: textCol }}>{product.is_lifetime_free ? '₹0 Free' : 'Standard'}</strong>
            </div>
            <div style={{ background: inputBg, border: `1px solid ${borderCol}`, padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: mutedCol, fontWeight: 700, display: 'block', marginBottom: '4px' }}>Min Income</span>
              <strong style={{ fontSize: '14px', color: textCol }}>₹25,000 / mo</strong>
            </div>
          </div>

          {/* Description & Rewards */}
          {(product.short_description || product.description) && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 8px' }}>About {product.name}</h3>
              <p style={{ fontSize: '13px', color: mutedCol, lineHeight: '1.6', margin: 0 }}>
                {product.short_description || product.description}
              </p>
            </div>
          )}

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px' }}>Key Highlights & Benefits</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {product.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: inputBg, padding: '12px 14px', borderRadius: '14px', border: `1px solid ${borderCol}`, fontSize: '13px' }}>
                    <span style={{ color: C.primary || '#2563eb', fontWeight: 900, fontSize: '15px' }}>✓</span>
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
              padding: '16px',
              border: 'none',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              marginTop: '12px'
            }}
          >
            PROCEED TO APPLICATION FORM ➔
          </button>
        </div>
      )}

      {/* TAB 2: APPLY NOW FORM CONTENT */}
      {activeTab === 'apply_now' && (
        <div style={{ width: '100%', maxWidth: '640px', background: cardBg, borderRadius: '24px', border: `1px solid ${borderCol}`, padding: '28px', boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
          
          {submitted ? (
            /* SUBMITTED SUCCESS SCREEN */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#10b98120', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 10px', color: '#10b981' }}>Details Saved Successfully!</h2>
              <p style={{ fontSize: '14px', color: mutedCol, maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                Your customer details for <strong>{product.name}</strong> have been recorded. Proceed to the bank portal to finish your application.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <a
                  href={redirectUrl || 'https://gharkapaisa.in'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 900,
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(16,185,129,0.35)'
                  }}
                >
                  1. OPEN OFFICIAL BANK APPLICATION PORTAL ➔
                </a>

                <a
                  href={`/apply/${token}/post-apply`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '16px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 900,
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.35)'
                  }}
                >
                  2. OPEN QD (QUICK DETAILS) FORM IN NEW TAB ↗
                </a>
              </div>

              {/* 10-Minute SMS Notice Box */}
              <div style={{ background: isDark ? '#1f1f23' : '#f1f5f9', border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '16px', textAlign: 'left', fontSize: '13px', lineHeight: '1.5', color: mutedCol }}>
                <div style={{ fontWeight: 800, color: C.primary || '#2563eb', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📲 Automatic SMS Schedule Notice:
                </div>
                An automated SMS containing your <strong>QD (Quick Details / Post-Apply) Form link</strong> will be automatically sent to your mobile number in <strong>10 minutes</strong>. You can click button #2 above to open and submit it right now.
              </div>
            </div>
          ) : (
            /* APPLICATION FORM */
            <div>
              {/* Prefilled Customer Banner */}
              <div style={{ background: isDark ? '#1f1f23' : '#f1f5f9', border: `1px solid ${borderCol}`, borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: C.primary || '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  📌 Pre-Saved Applicant Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: mutedCol, fontSize: '11px', display: 'block' }}>Customer Name</span>
                    <strong style={{ fontSize: '14px' }}>{customer?.full_name || 'Customer'}</strong>
                  </div>
                  <div>
                    <span style={{ color: mutedCol, fontSize: '11px', display: 'block' }}>Mobile Number</span>
                    <strong style={{ fontSize: '14px', fontFamily: 'monospace' }}>{customer?.mobile || 'Confidential'}</strong>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Name & Mobile (Read Only) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: mutedCol, display: 'block', marginBottom: '6px' }}>Customer Name</label>
                    <input
                      type="text"
                      disabled
                      value={customer?.full_name || ''}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: mutedCol, fontSize: '14px', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: mutedCol, display: 'block', marginBottom: '6px' }}>Mobile Number</label>
                    <input
                      type="text"
                      disabled
                      value={customer?.mobile || ''}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: mutedCol, fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                {/* Email & DOB */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Date of Birth (DOB) *</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Occupation & Monthly Income */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Occupation / Employment *</label>
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                    >
                      <option value="Salaried">Salaried Employee</option>
                      <option value="Self Employed Professional">Self-Employed Professional</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Student">Student</option>
                      <option value="Homemaker">Homemaker</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Monthly Income (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Employer / Company Name */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Employer / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter current employer or business name"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                  />
                </div>

                {/* PAN Card & Aadhaar Number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>PAN Card Number *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Aadhaar Number *</label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      placeholder="12-Digit Aadhaar"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, outline: 'none' }}
                    />
                  </div>
                </div>

                {/* City, State & Pincode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>State *</label>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: textCol, display: 'block', marginBottom: '6px' }}>Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6 Digits"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: `1px solid ${borderCol}`, background: inputBg, color: textCol, fontSize: '14px', fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '16px',
                    background: submitting ? '#64748b' : `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                    marginTop: '12px'
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
