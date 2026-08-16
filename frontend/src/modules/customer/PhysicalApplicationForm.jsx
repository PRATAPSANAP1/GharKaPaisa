import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      const res = await axios.get(`${API_BASE}/api/applications/physical-application/${token}`);
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

        if (data.status === 'details_submitted' && pd.id) {
          // Keep form editable but note that details were previously submitted
        }
      } else {
        setErrorMsg(res.data?.message || 'Unable to load application details.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired application link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`${API_BASE}/api/applications/physical-application/${token}/submit`, form);
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

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedText = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: `1.5px solid ${border}`,
    background: isDark ? '#0f172a' : '#ffffff',
    color: textColor,
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: mutedText,
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 700, fontSize: 14 }}>Loading Physical Application Form...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !appData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: textColor, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 440, width: '100%', background: cardBg, borderRadius: 20, padding: 28, border: `1px solid ${border}`, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 18, color: '#ef4444' }}>Link Error</h2>
          <p style={{ fontSize: 13, color: mutedText, margin: '0 0 20px' }}>{errorMsg}</p>
          <button onClick={fetchApplicationDetails} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: textColor, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%', background: cardBg, borderRadius: 24, padding: 32, border: `1px solid ${border}`, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10b98115', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, fontWeight: 900 }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Details Submitted Successfully</h2>
          <p style={{ fontSize: 13, color: mutedText, margin: '0 0 20px' }}>
            Application #{appData?.app_number} has been updated. The operational team will verify the details shortly.
          </p>
          <div style={{ background: isDark ? '#0f172a' : '#f1f5f9', padding: 14, borderRadius: 14, fontSize: 12, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            <div><strong style={{ color: mutedText }}>Bank:</strong> {appData?.bank_name}</div>
            <div><strong style={{ color: mutedText }}>Product:</strong> {appData?.product_name}</div>
            <div><strong style={{ color: mutedText }}>Status:</strong> DETAILS SUBMITTED</div>
          </div>
        </div>
      </div>
    );
  }

  const isSbi = appData?.is_sbi;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textColor, padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Top Header Card */}
        <div style={{ background: cardBg, borderRadius: 20, padding: '20px 24px', border: `1px solid ${border}`, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>Physical Application Form</h1>
          <p style={{ margin: 0, fontSize: 12, color: mutedText }}>
            Application #{appData?.app_number} • Bank: {appData?.bank_name} • Product: {appData?.product_name}
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444', padding: '12px 16px', borderRadius: 14, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ background: cardBg, borderRadius: 24, padding: 24, border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>

          {isSbi ? (
            /* ═══ SBI BANK FORM ═══ */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>AADHAR LINK CONTACT NUMBER *</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>PAN CARD NUMBER *</label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={form.pan_number}
                    onChange={e => handleChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    style={inputStyle}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginTop: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting Details...' : 'Submit Physical Application Details'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
