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

  // Bank & Application Header Info
  const [bankInfo, setBankInfo] = useState(null);

  // Section 1: Customer Quick Details (QD)
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [dob, setDob] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [address, setAddress] = useState('');
  const [motherName, setMotherName] = useState('');

  // Section 2: Operational Remarks & Stages
  const [softApprovalStatus, setSoftApprovalStatus] = useState('Approval-income 25k');
  const [vkycStage, setVkycStage] = useState('VKYC Pending');
  const [iqaStage, setIqaStage] = useState('IQA Pending');
  const [dispatchStatus, setDispatchStatus] = useState('E-sign Pending');

  // Section 3: Bank Reference & Final Stage
  const [appNumber, setAppNumber] = useState('');
  const [vkycUrl, setVkycUrl] = useState('');
  const [finalStatus, setFinalStatus] = useState('In Process');
  const [declineReason, setDeclineReason] = useState('');
  const [eligibleReqd, setEligibleReqd] = useState('No');

  useEffect(() => {
    const fetchPostApplyInfo = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiV1Url()}/public/apply/${token}/post-apply`);
        const json = await res.json();
        if (json && json.success && json.data) {
          setBankInfo(json.data);
          
          const details = json.data.application_details || {};
          const cust = json.data.customer || {};

          setCustomerMobile(details.customer_mobile || cust.mobile || '');
          setCustomerName(details.customer_name || cust.full_name || '');
          setDob(details.dob || '');
          setCustomerEmail(details.customer_email || cust.email || '');
          setPanNumber(details.pan_number || cust.pan_number || '');
          setCompanyName(details.company_name || '');
          setDesignation(details.designation || '');
          setAddress(details.address || '');
          setMotherName(details.mother_name || '');

          setSoftApprovalStatus(details.soft_approval_status || 'Approval-income 25k');
          setVkycStage(details.vkyc_stage || 'VKYC Pending');
          setIqaStage(details.iqa_stage || 'IQA Pending');
          setDispatchStatus(details.dispatch_status || 'E-sign Pending');

          setAppNumber(details.bank_application_number || '');
          setVkycUrl(details.vkyc_url || '');
          setFinalStatus(details.final_status || 'In Process');
          setDeclineReason(details.decline_reason || '');
          setEligibleReqd(details.eligible_reqd || 'No');
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

    if (!customerName.trim()) return alert('Please enter Name As Per PAN Card');
    
    const cleanPan = panNumber.trim().toUpperCase();
    if (!cleanPan) return alert('Please enter PAN Card Number');
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPan)) {
      return alert('Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiV1Url()}/public/apply/${token}/post-apply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_mobile: customerMobile.trim(),
          customer_name: customerName.trim(),
          dob: dob.trim(),
          customer_email: customerEmail.trim(),
          pan_number: cleanPan,
          company_name: companyName.trim(),
          designation: designation.trim(),
          address: address.trim(),
          mother_name: motherName.trim(),
          soft_approval_status: softApprovalStatus,
          vkyc_stage: vkycStage,
          iqa_stage: iqaStage,
          dispatch_status: dispatchStatus,
          bank_application_number: appNumber.trim(),
          vkyc_url: vkycUrl.trim(),
          final_status: finalStatus,
          decline_reason: declineReason.trim(),
          eligible_reqd: eligibleReqd
        })
      });

      const json = await res.json();
      if (json && json.success) {
        setSubmittedSuccess(true);
      } else {
        alert(json.message || 'Failed to submit application form details.');
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
  const inputBg = isDark ? '#27272a' : '#ffffff';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: bg, color: C.text, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Quick Details Form...</p>
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
        <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px' }}>Application Details Submitted!</h2>
        <p style={{ fontSize: '14px', color: C.textLight, maxWidth: '440px', lineHeight: 1.5, marginBottom: '24px' }}>
          All QD details, processing remarks, and status details for <strong>{bankInfo?.product_name || 'Application'}</strong> have been successfully updated.
        </p>
        <a href="https://gharkapaisa.in" style={{ padding: '12px 24px', background: C.primary, color: '#fff', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', fontSize: '14px' }}>
          Back to Home
        </a>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    borderRadius: '10px',
    border: `1px solid ${border}`,
    background: inputBg,
    color: C.text,
    fontSize: '13.5px',
    outline: 'none',
    transition: 'border 0.2s ease'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 700,
    color: C.textLight,
    display: 'block',
    marginBottom: '6px'
  };

  const sectionHeaderStyle = {
    fontSize: '15px',
    fontWeight: 800,
    color: C.primary,
    marginBottom: '14px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: C.text, fontFamily: 'Inter, sans-serif', padding: '24px 16px' }}>
      
      {/* Header Banner */}
      <div style={{ maxWidth: '720px', margin: '0 auto 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${C.primary}15`, padding: '6px 14px', borderRadius: '20px', color: C.primary, fontWeight: 700, fontSize: '12px', marginBottom: '12px' }}>
          📋 Post-Apply Master QD & Remark Form
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px' }}>{bankInfo?.product_name}</h1>
        <p style={{ fontSize: '13px', color: C.textLight, margin: 0 }}>{bankInfo?.bank_name} • Complete Lead Quick Details & Status Remarks</p>
      </div>

      {/* Main Unified Form Container */}
      <div style={{ maxWidth: '720px', margin: '0 auto', background: cardBg, borderRadius: '20px', border: `1px solid ${border}`, padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION 1: Customer Quick Details (QD) */}
          <div>
            <div style={sectionHeaderStyle}>
              <span>👤</span> <span>Customer Quick Details (QD)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Aadhaar Link Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Name As Per PAN Card *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name as on PAN Card"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>DOB As Per PAN Card (dd-mm-yyyy)</label>
                <input
                  type="text"
                  placeholder="e.g. 15-08-1995"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Personal Email ID</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>PAN Card Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Company Name</label>
                <input
                  type="text"
                  placeholder="Current Employer / Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer / Manager"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Mother Name</label>
                <input
                  type="text"
                  placeholder="Mother's Full Name"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={labelStyle}>Current Home Address with Landmark & Pincode</label>
              <textarea
                rows={2}
                placeholder="Full residential address including landmark & 6-digit pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* SECTION 2: Operational Remarks & Processing Stage */}
          <div>
            <div style={sectionHeaderStyle}>
              <span>⚙️</span> <span>Operational Remarks & Processing Stages</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Soft Approval Status</label>
                <select
                  value={softApprovalStatus}
                  onChange={(e) => setSoftApprovalStatus(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Approval-income 25k">Approval-income 25k</option>
                  <option value="Approval-income 30k">Approval-income 30k</option>
                  <option value="Approval-NSDP-Cibil based">Approval-NSDP-Cibil based</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Vkyc Stage</label>
                <select
                  value={vkycStage}
                  onChange={(e) => setVkycStage(e.target.value)}
                  style={inputStyle}
                >
                  <option value="VKYC Pending">VKYC Pending</option>
                  <option value="VKYC Complete">VKYC Complete</option>
                  <option value="VKYC Failed">VKYC Failed</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>IQA Stage</label>
                <select
                  value={iqaStage}
                  onChange={(e) => setIqaStage(e.target.value)}
                  style={inputStyle}
                >
                  <option value="IQA Sent">IQA Sent</option>
                  <option value="IQA Complete">IQA Complete</option>
                  <option value="IQA Pending">IQA Pending</option>
                  <option value="BLAZE Continue">BLAZE Continue</option>
                  <option value="BLAZE Decline">BLAZE Decline</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Dispatch Status</label>
                <select
                  value={dispatchStatus}
                  onChange={(e) => setDispatchStatus(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Dispatch Done">Dispatch Done</option>
                  <option value="WCP Stage">WCP Stage</option>
                  <option value="E-sign Done">E-sign Done</option>
                  <option value="E-sign Pending">E-sign Pending</option>
                  <option value="RTB(ERROR)">RTB(ERROR)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Bank Reference & Final Stage */}
          <div>
            <div style={sectionHeaderStyle}>
              <span>🏦</span> <span>Bank Reference & Final Application Stage</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Bank Application / Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. SBI9842157 / HDFC-APP-1002"
                  value={appNumber}
                  onChange={(e) => setAppNumber(e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Bank VKYC Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://vkyc.sbi.co.in/..."
                  value={vkycUrl}
                  onChange={(e) => setVkycUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Current Stage / Final Status</label>
                <select
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value)}
                  style={inputStyle}
                >
                  <option value="App File Generated (Approved)">App File Generated (Approved)</option>
                  <option value="Decline">Decline</option>
                  <option value="In Process">In Process</option>
                  <option value="Technical Error">Technical Error</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Eligible for Re-QD</label>
                <select
                  value={eligibleReqd}
                  onChange={(e) => setEligibleReqd(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Decline Reason Remark (shown if Decline selected) */}
            {finalStatus === 'Decline' && (
              <div style={{ marginTop: '14px' }}>
                <label style={labelStyle}>Decline Reason Remark *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Please enter reason for application decline..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              background: submitting ? '#64748b' : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              color: '#fff',
              fontSize: '15px',
              fontWeight: 800,
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
            }}
          >
            {submitting ? 'Submitting Form...' : 'Save & Confirm All Details →'}
          </button>
        </form>
      </div>

    </div>
  );
}
