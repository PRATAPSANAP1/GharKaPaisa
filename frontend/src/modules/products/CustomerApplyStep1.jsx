import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApiV1Url } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function CustomerApplyStep1() {
  const { token } = useParams();
  const { C, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Safe prefilled data
  const [product, setProduct] = useState(null);
  const [customer, setCustomer] = useState(null);

  // Step 1 Form fields
  const [dob, setDob] = useState('');
  const [pan, setPan] = useState('');
  const [income, setIncome] = useState('');
  const [address, setAddress] = useState('');
  const [employment, setEmployment] = useState('Salaried');

  useEffect(() => {
    const fetchTokenDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiV1Url()}/applications/apply-token/${token}`);
        const json = await res.json();
        if (json && json.success && json.data) {
          setProduct({ name: json.data.product, bank_name: json.data.bank, logo: json.data.bank_logo });
          setCustomer(json.data.customer);
        } else {
          setError(json.message || 'Invalid or expired application link');
        }
      } catch (err) {
        console.error('Failed to load application link:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTokenDetails();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dob) return alert('Please enter your Date of Birth');
    if (!pan.trim() || pan.trim().length !== 10) return alert('Please enter a valid 10-character PAN number');
    if (!income || parseFloat(income) <= 0) return alert('Please enter your valid Annual Income');

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiV1Url()}/applications/apply-token/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dob,
          pan: pan.trim().toUpperCase(),
          income: parseFloat(income),
          address: address.trim(),
          employment
        })
      });

      const json = await res.json();
      if (json && json.success) {
        const redirectUrl = json.data?.redirect_url || 'https://gharkapaisa.in';
        alert('Application details verified! Redirecting to official bank portal...');
        window.location.href = redirectUrl;
      } else {
        alert(json.message || 'Validation failed. Please check your details.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = isDark ? '#09090b' : '#f8fafc';
  const cardBg = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? '#27272a' : '#e2e8f0';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: C.text, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading secure application portal...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: C.text, fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>{error || 'Invalid Link'}</h2>
        <p style={{ fontSize: '13px', color: C.textLight, marginBottom: '24px' }}>This application link is expired or incomplete.</p>
        <a href="https://gharkapaisa.in" style={{ padding: '10px 20px', background: C.primary, color: '#fff', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '13px' }}>Return to Homepage</a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: C.text, fontFamily: 'Inter, sans-serif', padding: '24px 16px' }}>
      
      {/* Header Banner */}
      <div style={{ maxWidth: '520px', margin: '0 auto 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${C.primary}15`, padding: '6px 14px', borderRadius: '20px', color: C.primary, fontWeight: 700, fontSize: '12px', marginBottom: '12px' }}>
          🛡️ Safe & Encrypted Direct Application
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px' }}>Apply for {product.name}</h1>
        <p style={{ fontSize: '13px', color: C.textLight, margin: 0 }}>{product.bank_name} • Self-Fulfillment Portal</p>
      </div>

      {/* Main Form Card */}
      <div style={{ maxWidth: '520px', margin: '0 auto', background: cardBg, borderRadius: '20px', border: `1px solid ${border}`, padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* Prefilled Customer Summary */}
        <div style={{ background: isDark ? '#27272a' : '#f1f5f9', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <div>
            <div style={{ fontSize: '11px', color: C.textLight, textTransform: 'uppercase', fontWeight: 700 }}>Applicant</div>
            <strong style={{ fontSize: '14px' }}>Rahul {customer?.first_name ? `(${customer.first_name})` : ''}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: C.textLight, textTransform: 'uppercase', fontWeight: 700 }}>Mobile</div>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{customer?.mobile || '98******10'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>Date of Birth (DOB) *</label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>PAN Card Number *</label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. ABCDE1234F"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', fontFamily: 'monospace', textTransform: 'uppercase', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>Annual Gross Income (INR) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 600000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>Employment Type *</label>
            <select
              value={employment}
              onChange={(e) => setEmployment(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', outline: 'none' }}
            >
              <option value="Salaried">Salaried Employee</option>
              <option value="Self Employed Professional">Self-Employed Professional</option>
              <option value="Business Owner">Business Owner</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>Residential Address *</label>
            <textarea
              rows={2}
              required
              placeholder="Enter your current residential address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '12px',
              background: submitting ? '#64748b' : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              color: '#fff', fontSize: '15px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {submitting ? 'Verifying Details...' : 'Submit & Proceed to Official Bank Portal →'}
          </button>
        </form>
      </div>

    </div>
  );
}
