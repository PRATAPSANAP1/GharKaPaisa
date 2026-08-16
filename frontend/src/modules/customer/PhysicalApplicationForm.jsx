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
  const [activeTab, setActiveTab] = useState('form1'); // 'form1' | 'form2'

  // Form states (Form 1 & Form 2)
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
    company_address: '',
    bank_ref_number: '',
    vkyc_url: '',
    // Form 2 Statuses
    appcode_status: 'Appcode Pending',
    soft_approval_status: 'Approval-income 25k',
    vkyc_stage: 'VKYC Pending',
    iqa_stage: 'IQA Pending',
    dispatch_status: 'E-sign Pending',
    eligible_reqd: 'No',
    final_status: 'In Process',
    bank_remark: '',
    decline_reason: ''
  });

  const bankNameStr = String(appData?.bank_name || appData?.bank?.name || appData?.product_name || appData?.product?.name || '').toLowerCase();
  const isSbi = bankNameStr.includes('sbi');

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
        const app = data.application || data || {};

        setForm({
          aadhaar_linked_mobile: pd.aadhaar_linked_mobile || cust.mobile || app.customer_mobile || '',
          pan_name: pd.pan_name || cust.full_name || app.customer_name || '',
          dob: pd.dob || cust.dob || app.dob || '',
          pan_number: pd.pan_number || cust.pan_number || app.pan_number || '',
          mother_name: pd.mother_name || app.mother_name || '',
          personal_email: pd.personal_email || cust.email || app.customer_email || '',
          company_name: pd.company_name || app.company_name || '',
          designation: pd.designation || app.designation || '',
          flat_no: pd.flat_no || app.address || '',
          sub_area: pd.sub_area || '',
          landmark: pd.landmark || '',
          pincode: pd.pincode || '',
          company_address: pd.company_address || app.company_address || '',
          bank_ref_number: app.bank_ref_number || app.app_number || '',
          vkyc_url: app.vkyc_url || '',
          appcode_status: app.appcode_status || 'Appcode Pending',
          soft_approval_status: app.soft_approval_status || 'Approval-income 25k',
          vkyc_stage: app.vkyc_stage || 'VKYC Pending',
          iqa_stage: app.iqa_stage || 'IQA Pending',
          dispatch_status: app.dispatch_status || 'E-sign Pending',
          eligible_reqd: app.eligible_reqd || 'No',
          final_status: app.final_status || 'In Process',
          bank_remark: app.bank_remark || '',
          decline_reason: app.decline_reason || ''
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
    if (e) e.preventDefault();
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
          <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#fff' }}>Details Saved Successfully</h2>
          <p style={{ fontSize: 13.5, color: theme.mutedText, margin: '0 0 24px', lineHeight: 1.6 }}>
            Application <strong style={{ color: '#60a5fa' }}>#{appData?.app_number}</strong> has been updated with physical verification details and operations status.
          </p>
          <div style={{ background: '#0a1122', border: '1px solid #233354', padding: 18, borderRadius: 18, fontSize: 13, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.mutedText }}>Bank Partner:</span>
              <strong style={{ color: '#f8fafc' }}>{appData?.bank_name || 'SBI Bank'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.mutedText }}>Product:</span>
              <strong style={{ color: '#f8fafc' }}>{appData?.product_name || 'Credit Card / Loan'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: theme.mutedText }}>Final Status:</span>
              <strong style={{ color: '#10b981', textTransform: 'uppercase' }}>{form.final_status}</strong>
            </div>
          </div>
          <button onClick={() => setSubmitted(false)} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 14, border: 'none', background: theme.brandBlueGradient, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Edit / View Form Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.pageBg, color: theme.textColor, padding: '24px 16px 48px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Header Navbar */}
      <div style={{ maxWidth: 720, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(19, 30, 56, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {logo && <img src={logo} alt="GharKaPaisa Logo" style={{ height: 32, width: 'auto' }} />}
          <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(90deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GharKaPaisa
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', background: '#064e3b40', border: '1px solid #05966950', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
          🔒 Physical Verification Portal
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header Card */}
        <div style={{ background: theme.cardBg, borderRadius: 24, padding: '24px 28px', border: theme.cardBorder, marginBottom: 20, boxShadow: theme.cardShadow }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            ⚡ {isSbi ? 'SBI' : 'Bank'} Physical Verification Sheet
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#fff' }}>
            Physical Application Verification
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: theme.mutedText }}>
            Application <strong style={{ color: '#e2e8f0' }}>#{appData?.app_number}</strong> • Bank: <strong style={{ color: '#e2e8f0' }}>{appData?.bank_name || 'SBI Bank'}</strong> • Product: <strong style={{ color: '#e2e8f0' }}>{appData?.product_name || 'Credit Card'}</strong>
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444', padding: '14px 18px', borderRadius: 16, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        {/* Form Tab Navigation (4 Steps) */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'step1', num: '1', title: 'Customer Details', sub: 'Form 1' },
            { id: 'step2', num: '2', title: 'Appcode & VKYC', sub: 'Remark Part 1' },
            { id: 'step3', num: '3', title: 'IQA & Dispatch', sub: 'Remark Part 2' },
            { id: 'step4', num: '4', title: 'Bank & Final Status', sub: 'Ops Head / Admin' }
          ].map((tab) => {
            const isActive = activeTab === tab.id || (activeTab === 'form1' && tab.id === 'step1') || (activeTab === 'form2' && tab.id === 'step2');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  minWidth: '130px',
                  padding: '10px 12px',
                  borderRadius: 14,
                  border: isActive ? '2px solid #3b82f6' : '1px solid #233354',
                  background: isActive ? '#1d4ed825' : '#0a1122',
                  color: isActive ? '#60a5fa' : theme.mutedText,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: 10, color: isActive ? '#93c5fd' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Step {tab.num} • {tab.sub}</div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{tab.title}</div>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ background: theme.cardBg, borderRadius: 28, padding: 28, border: theme.cardBorder, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: theme.cardShadow }}>

          {/* ═══ STEP 1: CUSTOMER & PHYSICAL DETAILS (FORM 1) ═══ */}
          {(activeTab === 'step1' || activeTab === 'form1') && (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #233354', paddingBottom: 10, marginBottom: 6 }}>
                📋 Form 1: Customer Details & Physical Verification Info
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>ADHAR LINK CONTACT NUMBER *</label>
                  <input
                    type="text"
                    required
                    value={form.aadhaar_linked_mobile}
                    onChange={e => handleChange('aadhaar_linked_mobile', e.target.value)}
                    placeholder="9370470694"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>AS PER PAN CARD DOB (dd-mm-yyyy)</label>
                  <input
                    type="text"
                    value={form.dob}
                    onChange={e => handleChange('dob', e.target.value)}
                    placeholder="dd-mm-yyyy"
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
                  placeholder="pratap"
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
                  placeholder="Address with landmark & pincode"
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
                  placeholder="Mother Name"
                  style={inputStyle}
                />
              </div>

              {isSbi && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>APPLICATION NUMBER</label>
                    <input
                      type="text"
                      value={form.bank_ref_number}
                      onChange={e => handleChange('bank_ref_number', e.target.value)}
                      placeholder="Bank Application Number"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>VKYC LINK</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={form.vkyc_url}
                        onChange={e => handleChange('vkyc_url', e.target.value)}
                        placeholder="https://vkyc..."
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      {form.vkyc_url && (
                        <button
                          type="button"
                          onClick={() => {
                            const raw = form.vkyc_url.trim();
                            if (!raw) return;
                            const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
                            window.open(target, '_blank', 'noopener,noreferrer');
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Open V-KYC ↗
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step2')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: theme.brandBlueGradient,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    letterSpacing: '0.02em'
                  }}
                >
                  Next Step 2: Appcode & VKYC Remark →
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 2: PARTNERS / OPERATIONS REMARK (PART 1: APPCODE, SOFT APPROVAL, VKYC) ═══ */}
          {(activeTab === 'step2' || activeTab === 'form2') && (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #233354', paddingBottom: 10, marginBottom: 6 }}>
                ⚙️ Form 2 (Part 1): Partners / Operations Remark — Appcode, Soft Approval & VKYC Stage
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>APPCODE STATUS</label>
                  <select
                    value={form.appcode_status}
                    onChange={e => handleChange('appcode_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Appcode Pending" style={{ background: '#0a1122' }}>1. Appcode Pending</option>
                    <option value="Appcode Submit" style={{ background: '#0a1122' }}>2. Appcode Submit</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>SOFT APPROVAL STATUS</label>
                  <select
                    value={form.soft_approval_status}
                    onChange={e => handleChange('soft_approval_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Approval-income 25k" style={{ background: '#0a1122' }}>1. Approval-income 25k</option>
                    <option value="Approval-income 30k" style={{ background: '#0a1122' }}>2. Approval-income 30k</option>
                    <option value="Approval-NSDP-Cibil based" style={{ background: '#0a1122' }}>3. Approval-NSDP-Cibil based</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>VKYC STAGE</label>
                <select
                  value={form.vkyc_stage}
                  onChange={e => handleChange('vkyc_stage', e.target.value)}
                  style={inputStyle}
                >
                  <option value="VKYC Pending" style={{ background: '#0a1122' }}>1. VKYC Pending</option>
                  <option value="VKYC Complete" style={{ background: '#0a1122' }}>2. VKYC Complete</option>
                  <option value="VKYC Failed" style={{ background: '#0a1122' }}>3. VKYC Failed</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step1')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '16px',
                    border: '1px solid #233354',
                    background: '#0a1122',
                    color: theme.mutedText,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Step 1
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('step3')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: theme.brandBlueGradient,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    letterSpacing: '0.02em'
                  }}
                >
                  Next Step 3: IQA & Dispatch Stage →
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 3: OPERATIONS & DISPATCH STAGE (PART 2: IQA & DISPATCH) ═══ */}
          {activeTab === 'step3' && (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #233354', paddingBottom: 10, marginBottom: 6 }}>
                📦 Form 2 (Part 2): Operations & Dispatch Stage — IQA & Dispatch Workflow
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>IQA STAGE</label>
                  <select
                    value={form.iqa_stage}
                    onChange={e => handleChange('iqa_stage', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="IQA Sent" style={{ background: '#0a1122' }}>1. IQA Sent</option>
                    <option value="IQA Complete" style={{ background: '#0a1122' }}>2. IQA Complete</option>
                    <option value="IQA Pending" style={{ background: '#0a1122' }}>3. IQA Pending</option>
                    <option value="BLAZE Continue" style={{ background: '#0a1122' }}>4. BLAZE Continue</option>
                    <option value="BLAZE Decline" style={{ background: '#0a1122' }}>5. BLAZE Decline</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>DISPATCH STATUS</label>
                  <select
                    value={form.dispatch_status}
                    onChange={e => handleChange('dispatch_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="DISPATCH DONE" style={{ background: '#0a1122' }}>1. DISPATCH DONE</option>
                    <option value="WCP STAGE" style={{ background: '#0a1122' }}>2. WCP STAGE</option>
                    <option value="E-sign Done" style={{ background: '#0a1122' }}>3. E-sign Done</option>
                    <option value="E-sign Pending" style={{ background: '#0a1122' }}>4. E-sign Pending</option>
                    <option value="RTB(ERROR)" style={{ background: '#0a1122' }}>5. RTB(ERROR)</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step2')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '16px',
                    border: '1px solid #233354',
                    background: '#0a1122',
                    color: theme.mutedText,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Step 2
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('step4')}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: theme.brandBlueGradient,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    letterSpacing: '0.02em'
                  }}
                >
                  Next Step 4: Bank & Final Status →
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 4: BANK REMARK & FINAL STATUS (PART 3: EDITABLE BY ADMIN / OPERATIONS HEAD ONLY) ═══ */}
          {activeTab === 'step4' && (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #233354', paddingBottom: 10, marginBottom: 6 }}>
                🏦 Form 2 (Part 3): Bank Remark & Final Status (Admin / Operations Head Only)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>FINAL STATUS FROM BANK / CURRENT STAGE</label>
                  <select
                    value={form.final_status}
                    onChange={e => handleChange('final_status', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="App file generated (approved)" style={{ background: '#0a1122' }}>1. App file generated (approved)</option>
                    <option value="Decline" style={{ background: '#0a1122' }}>2. Decline</option>
                    <option value="In Process" style={{ background: '#0a1122' }}>3. In Process</option>
                    <option value="Technical Error" style={{ background: '#0a1122' }}>4. Technical Error</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>ELIGIBLE FOR RE-QD</label>
                  <select
                    value={form.eligible_reqd}
                    onChange={e => handleChange('eligible_reqd', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Yes" style={{ background: '#0a1122' }}>1. Yes</option>
                    <option value="No" style={{ background: '#0a1122' }}>2. No</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>BANK REMARK (OPERATIONS HEAD ONLY)</label>
                <textarea
                  rows={3}
                  value={form.bank_remark}
                  onChange={e => handleChange('bank_remark', e.target.value)}
                  placeholder="Operations Head / Bank remark..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {form.final_status === 'Decline' && (
                <div>
                  <label style={{ ...labelStyle, color: '#f87171' }}>DECLINE REASON REMARK</label>
                  <textarea
                    rows={2}
                    value={form.decline_reason}
                    onChange={e => handleChange('decline_reason', e.target.value)}
                    placeholder="Enter decline reason..."
                    style={{ ...inputStyle, borderColor: '#ef444450', resize: 'vertical' }}
                  />
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('step3')}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '16px',
                    border: '1px solid #233354',
                    background: '#0a1122',
                    color: theme.mutedText,
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Step 3
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '16px',
                    border: 'none',
                    background: theme.brandBlueGradient,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                    letterSpacing: '0.02em'
                  }}
                >
                  {submitting ? 'Saving Details...' : 'SAVE DETAILS 💾'}
                </button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
}
