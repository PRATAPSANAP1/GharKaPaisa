import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { Icons } from '../../components/Icon/PartnerIcons';

export default function ApplyForm() {
  const { id, slug, category } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    mobile: '',
    email: '',
    dob: '',
    occupation: 'Salaried Employee',
    monthly_salary: '',
    company_name: '',
    pan_number: '',
    aadhaar_number: '',
    city: '',
    state: '',
    pincode: '',
    partner_code: '',
    process_type: 'lead_punching'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const targetProductId = (slug && slug !== 'apply' ? slug : null) || (id && id !== 'apply' ? id : null) || (category && category !== 'apply' ? category : null);

  useEffect(() => {
    // Check partner code from URL query params (e.g. ?ref=PARTNER123 or ?partner_code=PARTNER123)
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || params.get('partner_code') || params.get('p_code');
    if (ref) setForm(prev => ({ ...prev, partner_code: ref }));

    if (targetProductId) {
      api.get(`/products/${targetProductId}`)
        .then(res => {
          if (res.data?.success) {
            const prod = res.data.data;
            setProduct(prod);
            const targetUrl = prod?.partner_url || prod?.application_url || prod?.public_url || prod?.apply_url || prod?.redirect_url || '';
            if (targetUrl) setRedirectUrl(targetUrl);
          }
        })
        .catch(err => console.error('Fetch product error:', err));
    }
  }, [targetProductId, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        product_id: product?.id || targetProductId,
        customer: {
          full_name: form.full_name,
          mobile: form.mobile,
          email: form.email,
          dob: form.dob,
          occupation: form.occupation,
          monthly_income: form.monthly_salary,
          company_name: form.company_name,
          pan_number: form.pan_number,
          aadhaar_number: form.aadhaar_number,
          city: form.city,
          state: form.state,
          pincode: form.pincode
        },
        full_name: form.full_name,
        mobile: form.mobile,
        email: form.email,
        dob: form.dob,
        occupation: form.occupation,
        monthly_salary: form.monthly_salary,
        monthly_income: form.monthly_salary,
        company_name: form.company_name,
        pan_number: form.pan_number,
        aadhaar_number: form.aadhaar_number,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        partner_code: form.partner_code,
        process_type: form.process_type
      };

      const res = await api.post('/applications/public', payload);
      const resData = res.data?.data || {};

      const finalBankUrl = resData.redirect_url
        || product?.partner_url
        || product?.application_url
        || product?.public_url
        || product?.apply_url
        || product?.redirect_url
        || redirectUrl
        || 'https://gharkapaisa.in';

      setRedirectUrl(finalBankUrl);
      setSuccess(true);

    } catch (err) {
      console.error('Application submit error:', err);
      alert(err.response?.data?.message || 'Failed to submit application. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: isMobile ? "20px 12px" : "60px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ ...S.card, padding: isMobile ? "28px 16px" : "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ color: '#10b981', fontSize: isMobile ? "48px" : "64px" }}>{Icons.CheckCircle || "✅"}</div>
          <h2 style={{ color: C.text, margin: 0, fontSize: isMobile ? "20px" : "24px", fontWeight: 900 }}>Details Saved Successfully!</h2>
          <p style={{ color: C.textLight, fontSize: isMobile ? "13px" : "14px", margin: 0, lineHeight: 1.5 }}>
            Your customer details for <strong>{product?.name || 'this product'}</strong> have been recorded. Proceed to the bank portal to finish your application.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '12px' }}>
            <a
              href={redirectUrl || 'https://gharkapaisa.in'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 20px',
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
              href={`/products/${product?.category || 'credit-cards'}/${product?.slug || targetProductId}/apply`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 20px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
                color: '#ffffff',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)'
              }}
            >
              2. OPEN QD (QUICK DETAILS) FORM IN NEW TAB ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  const borderCol = isDark ? '#2d3748' : '#e2e8f0';
  const inputBg = isDark ? '#1a202c' : '#f8fafc';

  return (
    <div style={{ padding: isMobile ? "16px 12px 60px" : "40px 20px", maxWidth: "680px", margin: "0 auto", color: C.text }}>
      <button onClick={() => navigate(-1)} style={{ ...S.btn("outline"), marginBottom: "16px", border: "none", padding: 0, cursor: 'pointer' }}>
        {Icons.ArrowLeft || "←"} Back
      </button>

      <div style={{ ...S.card, padding: isMobile ? "20px 16px" : "32px", borderRadius: '20px' }}>
        
        {/* HEADER / PRODUCT CARD */}
        <div style={{ marginBottom: isMobile ? "20px" : "28px", borderBottom: `1px solid ${borderCol}`, paddingBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: C.primary || '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            📋 OFFICIAL APPLICATION PORTAL
          </div>
          <h1 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 900, color: C.text, margin: "0 0 6px 0" }}>
            {product?.name || 'Bank Financial Product Application'}
          </h1>
          <p style={{ color: C.textLight, margin: 0, fontSize: isMobile ? "12.5px" : "14px" }}>
            Fill in your verified customer details below to proceed directly to the bank application portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* Customer Name & Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={S.label}>Customer Name *</label>
              <input 
                required
                type="text"
                placeholder="Full name as per PAN"
                style={S.input}
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
              />
            </div>
            <div>
              <label style={S.label}>Mobile Number *</label>
              <input 
                required
                type="tel"
                maxLength={10}
                placeholder="10-Digit Mobile Number"
                style={S.input}
                value={form.mobile}
                onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g, '')})}
              />
            </div>
          </div>

          {/* Email Address & DOB */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={S.label}>Email Address *</label>
              <input 
                required
                type="email"
                placeholder="name@example.com"
                style={S.input}
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
            <div>
              <label style={S.label}>Date of Birth (DOB) *</label>
              <input 
                required
                type="date"
                style={S.input}
                value={form.dob}
                onChange={e => setForm({...form, dob: e.target.value})}
              />
            </div>
          </div>

          {/* Occupation & Monthly Income */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={S.label}>Occupation / Employment *</label>
              <select
                required
                style={S.input}
                value={form.occupation}
                onChange={e => setForm({...form, occupation: e.target.value})}
              >
                <option value="Salaried Employee">Salaried Employee</option>
                <option value="Self-Employed Professional">Self-Employed Professional</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Retired">Retired</option>
                <option value="Student">Student</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Monthly Income (₹) *</label>
              <input 
                required
                type="number"
                placeholder="e.g. 50000"
                style={S.input}
                value={form.monthly_salary}
                onChange={e => setForm({...form, monthly_salary: e.target.value})}
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label style={S.label}>Employer / Company Name *</label>
            <input 
              required
              type="text"
              placeholder="Enter current employer or business name"
              style={S.input}
              value={form.company_name}
              onChange={e => setForm({...form, company_name: e.target.value})}
            />
          </div>

          {/* PAN Card & Aadhaar Number */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={S.label}>PAN Card Number *</label>
              <input 
                required
                type="text"
                maxLength={10}
                placeholder="ABCDE1234F"
                style={{ ...S.input, fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase' }}
                value={form.pan_number}
                onChange={e => setForm({...form, pan_number: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label style={S.label}>Aadhaar Number *</label>
              <input 
                required
                type="text"
                maxLength={12}
                placeholder="12-Digit Aadhaar"
                style={{ ...S.input, fontFamily: 'monospace', fontWeight: 800 }}
                value={form.aadhaar_number}
                onChange={e => setForm({...form, aadhaar_number: e.target.value.replace(/\D/g, '')})}
              />
            </div>
          </div>

          {/* City, State & Pincode */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>City *</label>
              <input 
                required
                type="text"
                placeholder="City"
                style={S.input}
                value={form.city}
                onChange={e => setForm({...form, city: e.target.value})}
              />
            </div>
            <div>
              <label style={S.label}>State *</label>
              <input 
                required
                type="text"
                placeholder="State"
                style={S.input}
                value={form.state}
                onChange={e => setForm({...form, state: e.target.value})}
              />
            </div>
            <div>
              <label style={S.label}>Pincode *</label>
              <input 
                required
                type="text"
                maxLength={6}
                placeholder="6 Digits"
                style={{ ...S.input, fontFamily: 'monospace' }}
                value={form.pincode}
                onChange={e => setForm({...form, pincode: e.target.value.replace(/\D/g, '')})}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              borderRadius: '14px',
              background: loading ? '#64748b' : `linear-gradient(135deg, ${C.primary || '#2563eb'}, #1d4ed8)`,
              color: '#ffffff',
              fontSize: isMobile ? '14.5px' : '16px',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              marginTop: '10px'
            }}
          >
            {loading ? "Saving Application Details..." : "SUBMIT DETAILS & PROCEED TO BANK ➔"}
          </button>
        </form>
      </div>
    </div>
  );
}
