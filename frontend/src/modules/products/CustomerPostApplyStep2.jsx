import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApiV1Url } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function CustomerPostApplyStep2() {
  const { token } = useParams();
  const { C, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Bank Info
  const [bankInfo, setBankInfo] = useState(null);

  // Form Fields
  const [appNumber, setAppNumber] = useState('');
  const [vkycUrl, setVkycUrl] = useState('');
  const [salarySlipUrl, setSalarySlipUrl] = useState('');
  const [panCardUrl, setPanCardUrl] = useState('');

  useEffect(() => {
    const fetchPostApplyInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiV1Url()}/public/apply/${token}/post-apply`);
        const json = await res.json();
        if (json && json.success && json.data) {
          setBankInfo(json.data);
        } else {
          setError(json.message || 'Invalid application link');
        }
      } catch (err) {
        console.error('Failed to fetch post apply info:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPostApplyInfo();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appNumber.trim()) return alert('Please enter your Bank Application Reference Number');

    if (bankInfo?.is_sbi_bank) {
      if (!salarySlipUrl.trim()) return alert('Salary Slip Document / Link is mandatory for SBI Bank applications');
      if (!panCardUrl.trim()) return alert('PAN Card Document / Link is mandatory for SBI Bank applications');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiV1Url()}/public/apply/${token}/post-apply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_application_number: appNumber.trim(),
          vkyc_url: vkycUrl.trim() || undefined,
          salary_slip_url: salarySlipUrl.trim() || undefined,
          pan_card_url: panCardUrl.trim() || undefined
        })
      });

      const json = await res.json();
      if (json && json.success) {
        setSubmittedSuccess(true);
      } else {
        alert(json.message || 'Failed to submit bank application reference.');
      }
    } catch (err) {
      console.error('Submit post apply error:', err);
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
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading reference portal...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: C.text, fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>{error}</h2>
        <a href="https://gharkapaisa.in" style={{ padding: '10px 20px', background: C.primary, color: '#fff', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '13px' }}>Visit GharKaPaisa</a>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: C.text, fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10B98115', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px' }}>
          ✓
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px' }}>Application Confirmed!</h2>
        <p style={{ fontSize: '14px', color: C.textLight, maxWidth: '400px', lineHeight: 1.5, marginBottom: '24px' }}>
          Your Bank Application Ref <strong>#{appNumber}</strong> and documents have been recorded. Our verification engine is now tracking your bank status.
        </p>
        <a href="https://gharkapaisa.in" style={{ padding: '12px 24px', background: C.primary, color: '#fff', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', fontSize: '14px' }}>
          Back to GharKaPaisa
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: C.text, fontFamily: 'Inter, sans-serif', padding: '24px 16px' }}>
      
      {/* Header */}
      <div style={{ maxWidth: '540px', margin: '0 auto 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: bankInfo?.is_sbi_bank ? '#EF444415' : `${C.primary}15`, padding: '6px 14px', borderRadius: '20px', color: bankInfo?.is_sbi_bank ? '#EF4444' : C.primary, fontWeight: 700, fontSize: '12px', marginBottom: '12px' }}>
          {bankInfo?.is_sbi_bank ? '📌 SBI Bank Strict Rule Verification' : '📋 Post-Application Reference Entry'}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px' }}>{bankInfo?.product_name}</h1>
        <p style={{ fontSize: '13px', color: C.textLight, margin: 0 }}>{bankInfo?.bank_name} • Step 2: Confirmation & Documents</p>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: '540px', margin: '0 auto', background: cardBg, borderRadius: '20px', border: `1px solid ${border}`, padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* Notice Box */}
        {bankInfo?.is_sbi_bank ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '12.5px', color: '#991B1B', lineHeight: 1.5 }}>
            <strong>🔴 Mandatory Rule for SBI Bank:</strong> SBI requires both <strong>Salary Slip</strong> and <strong>PAN Card</strong> uploads alongside the Application Reference Number to credit commissions.
          </div>
        ) : (
          <div style={{ background: isDark ? '#27272a' : '#f1f5f9', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '12.5px', color: C.textLight, lineHeight: 1.5 }}>
            💡 Enter your bank application reference number below after completing the application on the official bank site.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>
              Bank Application / Reference Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SBI9842157 / HDFC-APP-1002"
              value={appNumber}
              onChange={(e) => setAppNumber(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', fontFamily: 'monospace', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, display: 'block', marginBottom: '6px' }}>
              Video KYC (VKYC) Link <span style={{ color: C.textLight, fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="e.g. https://vkyc.sbi.co.in/..."
              value={vkycUrl}
              onChange={(e) => setVkycUrl(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, background: isDark ? '#1a1a1a' : '#fff', color: C.text, fontSize: '14px', outline: 'none' }}
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
            {submitting ? 'Submitting Application Reference...' : 'Confirm Application Details →'}
          </button>
        </form>
      </div>

    </div>
  );
}
