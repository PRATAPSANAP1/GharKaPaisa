import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function CustomerShareApplyForm() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // Form State
  const [dob, setDob] = useState('');
  const [pan, setPan] = useState('');
  const [income, setIncome] = useState('');
  const [address, setAddress] = useState('');
  const [employment, setEmployment] = useState('Salaried');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    const fetchTokenData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/applications/apply/${token}`);
        if (res.data?.success) {
          setData(res.data.data);
          const targetUrl = res.data.data?.product?.partner_url || res.data.data?.product?.public_url || 'https://gharkapaisa.in';
          setRedirectUrl(targetUrl);
        } else {
          setError(res.data?.message || 'Invalid or expired application link.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load application details.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchTokenData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pan || pan.trim().length !== 10) return alert('Please enter a valid 10-character PAN Card number.');
    if (!dob) return alert('Please enter your Date of Birth.');
    if (!income) return alert('Please enter your Income.');

    setSubmitting(true);
    try {
      const res = await api.patch(`/applications/apply/${token}`, {
        dob,
        pan: pan.trim().toUpperCase(),
        income: parseFloat(income),
        address,
        employment
      });

      if (res.data?.success) {
        if (res.data.data?.redirect_url) {
          setRedirectUrl(res.data.data.redirect_url);
        }
        setSubmitted(true);
      } else {
        alert(res.data?.message || 'Failed to update application details.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application details. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
          <h3>Loading Application Details...</h3>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', padding: 20, fontFamily: 'sans-serif' }}>
        <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: 20, padding: 32, maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 20, color: '#f87171', margin: '0 0 10px' }}>Application Link Unavailable</h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px' }}>{error || 'This link may have expired or is invalid.'}</p>
          <a href="/" style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>Return to Homepage</a>
        </div>
      </div>
    );
  }

  const { product = {}, customer = {} } = data;

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 540, background: '#1e293b', border: '1px solid #334155', borderRadius: 24, padding: 32, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#10b98120', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px', color: '#10b981' }}>Details Saved Successfully!</h2>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 auto 24px', lineHeight: '1.5' }}>
            Your customer details for <strong>{product.name || 'this product'}</strong> have been recorded. Proceed to the bank portal to finish your application.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <a
              href={redirectUrl || 'https://gharkapaisa.in'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                fontSize: '14.5px',
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
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontSize: '14.5px',
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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#1e293b', border: '1px solid #334155', borderRadius: 24, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        
        {/* Header Branding */}
        <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 800, color: '#60a5fa', letterSpacing: '0.05em', marginBottom: 6 }}>
          GharKaPaisa Partner Verification
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: '#fff' }}>
          Apply for {product.name || 'Credit Card / Loan'}
        </h2>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          Bank: <strong style={{ color: '#e2e8f0' }}>{product.bank_name || 'Official Partner Bank'}</strong>
        </div>

        {/* Pre-filled Customer Info Box */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 16, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
            Pre-Filled Applicant Info
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
            <div>
              <span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Applicant Name</span>
              <strong style={{ color: '#f8fafc' }}>{customer.first_name || 'Customer'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Mobile Number</span>
              <strong style={{ color: '#f8fafc' }}>{customer.mobile || 'Confidential'}</strong>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>PAN Card Number *</label>
            <input
              type="text"
              maxLength={10}
              required
              placeholder="ABCDE1234F"
              value={pan}
              onChange={e => setPan(e.target.value.toUpperCase())}
              style={{ width: '100%', boxSizing: 'border-box', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>DOB (as per PAN) *</label>
              <input
                type="date"
                required
                value={dob}
                onChange={e => setDob(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '11px 12px', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Monthly Income (₹) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 50000"
                value={income}
                onChange={e => setIncome(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '11px 12px', color: '#fff', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Employment Type</label>
              <select
                value={employment}
                onChange={e => setEmployment(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '11px 12px', color: '#fff', fontSize: 13 }}
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business">Business Owner</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Current Pincode / City</label>
              <input
                type="text"
                placeholder="Pincode or City"
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '11px 12px', color: '#fff', fontSize: 13 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: 8, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
          >
            {submitting ? 'Connecting to Bank Portal...' : 'CONTINUE TO BANK APPLICATION ➔'}
          </button>
        </form>

      </div>
    </div>
  );
}
