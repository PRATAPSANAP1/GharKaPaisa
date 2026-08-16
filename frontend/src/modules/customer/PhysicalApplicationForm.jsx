import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import logo from '../../assets/logos/logo.png';

export default function PhysicalApplicationForm() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState(null);

  // Form states
  const [form, setForm] = useState({
    aadhaar_linked_mobile: '',
    pan_name: '',
    dob: '',
    pan_number: '',
    mother_name: '',
    personal_email: '',
    company_name: '',
    designation: '',
    flat_no: '',
    sub_area: '',
    landmark: '',
    pincode: '',
    company_address: ''
  });

  useEffect(() => {
    fetchApplicationDetails();
  }, [token]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/applications/physical-application/${token}`);
      if (res.data?.success) {
        const data = res.data.data;
        setAppData(data);

        const cust = data.customer || {};
        const pd = data.physical_details || {};

        setForm({
          aadhaar_linked_mobile: pd.aadhaar_linked_mobile || cust.mobile || '',
          pan_name: pd.pan_name || cust.full_name || '',
          dob: pd.dob || cust.dob || '',
          pan_number: pd.pan_number || cust.pan_number || '',
          mother_name: pd.mother_name || '',
          personal_email: pd.personal_email || cust.email || '',
          company_name: pd.company_name || '',
          designation: pd.designation || '',
          flat_no: pd.flat_no || '',
          sub_area: pd.sub_area || '',
          landmark: pd.landmark || '',
          pincode: pd.pincode || '',
          company_address: pd.company_address || ''
        });
      } else {
        setErrorMsg(res.data?.message || 'Unable to load application details.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired physical application link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/applications/physical-application/${token}/submit`, form);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.data?.message || 'Failed to submit application details.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Submission failed. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  // GharKaPaisa Theme Palette
  const theme = {
    pageBg: 'linear-gradient(135deg, #0b1329 0%, #152243 50%, #091024 100%)',
    cardBg: '#131e38',
    cardBorder: '1px solid rgba(59, 130, 246, 0.25)',
    cardShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
    inputBg: '#0a1122',
    inputBorder: '1.5px solid #233354',
    inputFocusBorder: '#3b82f6',
    textColor: '#f8fafc',
    mutedText: '#94a3b8',
    brandBlue: '#2563eb',
    brandBlueGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: theme.inputBorder,
    background: theme.inputBg,
    color: theme.textColor,
    fontSize: '13.5px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: theme.mutedText,
    marginBottom: '6px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg, color: theme.textColor, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', color: '#93c5fd' }}>Loading Application Form...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !appData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg, color: theme.textColor, padding: 20, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 460, width: '100%', background: theme.cardBg, borderRadius: 24, padding: 32, border: theme.cardBorder, textAlign: 'center', boxShadow: theme.cardShadow }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: '#f87171' }}>Application Form Error</h2>
          <p style={{ fontSize: 13.5, color: theme.mutedText, margin: '0 0 24px', lineHeight: 1.5 }}>{errorMsg}</p>
          <button onClick={fetchApplicationDetails} style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: theme.brandBlueGradient, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
            Retry Loading Form
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg, color: theme.textColor, padding: 20, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 500, width: '100%', background: theme.cardBg, borderRadius: 28, padding: 36, border: theme.cardBorder, textAlign: 'center', boxShadow: theme.cardShadow }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#10b98120', border: '2px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36, fontWeight: 900 }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#fff' }}>Details Submitted Successfully</h2>
          <p style={{ fontSize: 13.5, color: theme.mutedText, margin: '0 0 24px', lineHeight: 1.6 }}>
            Application <strong style={{ color: '#60a5fa' }}>#{appData?.app_number}</strong> has been updated with your verification details. Our operations desk will review and verify your application.
          </p>
          <div style={{ background: '#0a1122', border: '1px solid #233354', padding: 18, borderRadius: 18, fontSize: 13, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.mutedText }}>Bank Partner:</span>
              <strong style={{ color: '#f8fafc' }}>{appData?.bank_name || 'Partner Bank'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.mutedText }}>Product:</span>
              <strong style={{ color: '#f8fafc' }}>{appData?.product_name || 'Credit Card / Loan'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.mutedText }}>Status:</span>
              <strong style={{ color: '#10b981', textTransform: 'uppercase' }}>Details Submitted</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSbi = appData?.is_sbi;

  return (
    <div style={{ minHeight: '100vh', background: theme.pageBg, color: theme.textColor, padding: '24px 16px 48px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Header Navbar */}
      <div style={{ maxWidth: 680, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(19, 30, 56, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {logo && <img src={logo} alt="GharKaPaisa Logo" style={{ height: 32, width: 'auto' }} />}
          <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(90deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GharKaPaisa
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', background: '#064e3b40', border: '1px solid #05966950', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
          🔒 256-Bit SSL Encrypted
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header Card */}
        <div style={{ background: theme.cardBg, borderRadius: 24, padding: '24px 28px', border: theme.cardBorder, marginBottom: 20, boxShadow: theme.cardShadow }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            ⚡ Official Verification Portal
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {isSbi ? 'SBI Detail Sheet Form' : 'Bank Application Form'}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: theme.mutedText }}>
            Application <strong style={{ color: '#e2e8f0' }}>#{appData?.app_number}</strong> • Bank: <strong style={{ color: '#e2e8f0' }}>{appData?.bank_name || 'Bank'}</strong> • Product: <strong style={{ color: '#e2e8f0' }}>{appData?.product_name || 'Product'}</strong>
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444', padding: '14px 18px', borderRadius: 16, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: theme.cardBg, borderRadius: 28, padding: 28, border: theme.cardBorder, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: theme.cardShadow }}>

          {isSbi ? (
            /* ═══ SBI BANK FORM ═══ */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>ADHAR LINK CONTACT NUMBER *</label>
                  <input
                    type="text"
                    required
                    value={form.aadhaar_linked_mobile}
                    onChange={e => handleChange('aadhaar_linked_mobile', e.target.value)}
                    placeholder="10-digit mobile number"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>AS PER PAN CARD DOB</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>NAME AS PER PAN CARD *</label>
                <input
                  type="text"
                  required
                  value={form.pan_name}
                  onChange={e => handleChange('pan_name', e.target.value)}
                  placeholder="Full Name as per PAN card"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>PERSONAL EMAIL ID</label>
                  <input
                    type="email"
                    value={form.personal_email}
                    onChange={e => handleChange('personal_email', e.target.value)}
                    placeholder="email@example.com"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PAN CARD NUMBER</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={form.pan_number}
                    onChange={e => handleChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>AS PER SALARY SLIP COMPANY NAME</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => handleChange('company_name', e.target.value)}
                    placeholder="Company Name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>DESIGNATION</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={e => handleChange('designation', e.target.value)}
                    placeholder="Designation / Role"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>CURRENT HOME ADDRESS WITH LAND MARK PIN CODE</label>
                <input
                  type="text"
                  value={form.flat_no}
                  onChange={e => handleChange('flat_no', e.target.value)}
                  placeholder="Address with landmark and pincode"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>FULL COMPANY ADDRESS</label>
                <input
                  type="text"
                  value={form.company_address}
                  onChange={e => handleChange('company_address', e.target.value)}
                  placeholder="Full official company address"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>MOTHER NAME</label>
                <input
                  type="text"
                  value={form.mother_name}
                  onChange={e => handleChange('mother_name', e.target.value)}
                  placeholder="Mother Full Name"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            /* ═══ OTHER BANK FORM ═══ */
            <>
              <div>
                <label style={labelStyle}>CUSTOMER FULL NAME (As per PAN card) *</label>
                <input
                  type="text"
                  required
                  value={form.pan_name}
                  onChange={e => handleChange('pan_name', e.target.value)}
                  placeholder="Full Name as per PAN"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Flat no / House no / sr no</label>
                  <input
                    type="text"
                    value={form.flat_no}
                    onChange={e => handleChange('flat_no', e.target.value)}
                    placeholder="Flat / House / Sr No"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Sub Area</label>
                  <input
                    type="text"
                    value={form.sub_area}
                    onChange={e => handleChange('sub_area', e.target.value)}
                    placeholder="Sub Area / Locality"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Landmark</label>
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={e => handleChange('landmark', e.target.value)}
                    placeholder="Landmark"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={form.pincode}
                    onChange={e => handleChange('pincode', e.target.value)}
                    placeholder="6-digit pincode"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>PAN CARD NUMBER *</label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={form.pan_number}
                    onChange={e => handleChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>DOB (as per PAN)</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>MOTHER FULL NAME</label>
                  <input
                    type="text"
                    value={form.mother_name}
                    onChange={e => handleChange('mother_name', e.target.value)}
                    placeholder="Mother Full Name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PERSONAL MAIL ID</label>
                  <input
                    type="email"
                    value={form.personal_email}
                    onChange={e => handleChange('personal_email', e.target.value)}
                    placeholder="email@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>COMPANY Name (as per payment slip)</label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={e => handleChange('company_name', e.target.value)}
                    placeholder="Company Name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>DESIGNATION</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={e => handleChange('designation', e.target.value)}
                    placeholder="Designation / Role"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>MOBILE No *</label>
                <input
                  type="text"
                  required
                  value={form.aadhaar_linked_mobile}
                  onChange={e => handleChange('aadhaar_linked_mobile', e.target.value)}
                  placeholder="10-digit mobile number"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: 20, marginTop: 10 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '16px',
                border: 'none',
                background: theme.brandBlueGradient,
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em'
              }}
            >
              {submitting ? 'Submitting Application Details...' : 'SUBMIT PHYSICAL APPLICATION DETAILS ➔'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
