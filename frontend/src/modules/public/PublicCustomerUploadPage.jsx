import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useTheme, makeS } from '../../contexts/ThemeContext';
import { MdShield, MdCloudUpload, MdCheckCircle, MdError, MdPerson, MdDescription } from 'react-icons/md';

export default function PublicCustomerUploadPage() {
  const { token } = useParams();
  const { C, isDark } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [data, setData] = useState(null);

  // Profile Form State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    dob: '',
    pan_number: '',
    aadhaar_last4: '',
    city: '',
    state: '',
    pincode: '',
    employment_type: 'salaried',
    monthly_income: '',
    employer: '',
    occupation: ''
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // File Upload States (keyed by doc type)
  const [uploadingTypes, setUploadingTypes] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const fetchPortalData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/customer-portal/link/${token}`);
      if (res.data?.success) {
        setData(res.data.data);
        const cust = res.data.data.customer || {};
        setForm({
          full_name: cust.full_name || '',
          email: cust.email || '',
          dob: cust.dob ? new Date(cust.dob).toISOString().split('T')[0] : '',
          pan_number: cust.pan_number || '',
          aadhaar_last4: cust.aadhaar_last4 || '',
          city: cust.city || '',
          state: cust.state || '',
          pincode: cust.pincode || '',
          employment_type: cust.employment_type || 'salaried',
          monthly_income: cust.monthly_income || '',
          employer: cust.employer || '',
          occupation: cust.occupation || ''
        });
      }
    } catch (err) {
      console.error('Portal load error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid or expired upload link. Please request a new link from your partner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPortalData();
  }, [token]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/customer-portal/link/${token}/update-details`, form);
      if (res.data?.success) {
        setSuccessMsg('Your details have been saved successfully.');
        fetchPortalData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save details');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;
    setUploadingTypes(prev => ({ ...prev, [docType]: true }));
    setUploadErrors(prev => ({ ...prev, [docType]: '' }));
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      const res = await api.post(`/customer-portal/link/${token}/upload-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setSuccessMsg(`${docType.replace('_', ' ').toUpperCase()} uploaded successfully!`);
        fetchPortalData();
      }
    } catch (err) {
      setUploadErrors(prev => ({ ...prev, [docType]: err.response?.data?.message || 'Failed to upload document' }));
    } finally {
      setUploadingTypes(prev => ({ ...prev, [docType]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', color: C.textMid }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${C.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Loading Secure Portal...</div>
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ ...S.card, maxWidth: '440px', width: '100%', textAlign: 'center', padding: '36px 24px' }}>
          <MdError style={{ fontSize: '48px', color: C.red, marginBottom: '12px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Portal Access Issue</h2>
          <p style={{ fontSize: '13.5px', color: C.textMid, marginTop: '8px', lineHeight: 1.5 }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  const { customer = {}, uploaded_documents = [] } = data || {};

  const docTypesList = [
    { type: 'pan', label: '🪪 PAN Card', desc: 'Upload clear front photo of your PAN Card' },
    { type: 'aadhaar', label: '🆔 Aadhaar Card', desc: 'Upload Aadhaar Card (Front/Back)' },
    { type: 'salary_slip', label: '📄 Salary Slip / Income Proof', desc: 'Upload latest salary slip' },
    { type: 'bank_statement', label: '🏦 Bank Statement', desc: 'Upload last 3-6 months bank statement (PDF/Image)' },
    { type: 'itr', label: '📊 ITR / Financial Document', desc: 'Upload Income Tax Return' },
    { type: 'photo', label: '📷 Passport Photo / Selfie', desc: 'Upload recent photo or clear selfie' },
    { type: 'other', label: '📁 Other Document', desc: 'Any additional document requested by advisor' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0F172A' : '#F1F5F9', color: C.text, paddingBottom: '60px' }}>
      {/* Header Banner */}
      <header style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        color: '#FFFFFF',
        padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#A5B4FC', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>GharKaPaisa Customer Portal</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '4px 0 0 0', color: '#FFFFFF' }}>Document & Profile Upload</h1>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#6EE7B7' }}>
            <MdShield style={{ fontSize: '16px' }} />
            <span>256-Bit Encrypted & Secure</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '24px auto 0', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Messages */}
        {successMsg && (
          <div style={{ background: `${C.green}18`, border: `1px solid ${C.green}40`, color: C.green, padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdCheckCircle style={{ fontSize: '18px' }} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: `${C.red}18`, border: `1px solid ${C.red}40`, color: C.red, padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdError style={{ fontSize: '18px' }} /> {errorMsg}
          </div>
        )}

        {/* SECTION 1: PERSONAL & EMPLOYMENT DETAILS */}
        <section style={{ ...S.card, padding: '24px' }}>
          <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdPerson style={{ fontSize: '22px', color: C.teal }} />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: C.text }}>Step 1: Confirm / Update Profile Details</h2>
              <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>Verify your basic details so we can process your application smoothly.</p>
            </div>
          </div>

          <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={S.label}>Full Name (As per PAN) *</label>
                <input
                  type="text"
                  required
                  style={S.input}
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Mobile Number</label>
                <input
                  type="text"
                  disabled
                  style={{ ...S.input, background: isDark ? '#1e293b' : '#f1f5f9', cursor: 'not-allowed' }}
                  value={customer.mobile || ''}
                />
              </div>

              <div>
                <label style={S.label}>Email Address</label>
                <input
                  type="email"
                  style={S.input}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Date of Birth</label>
                <input
                  type="date"
                  style={S.input}
                  value={form.dob}
                  onChange={e => setForm({ ...form, dob: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>PAN Card Number</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  style={{ ...S.input, textTransform: 'uppercase' }}
                  value={form.pan_number}
                  onChange={e => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label style={S.label}>Aadhaar Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  style={S.input}
                  value={form.aadhaar_last4}
                  onChange={e => setForm({ ...form, aadhaar_last4: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>City</label>
                <input
                  type="text"
                  style={S.input}
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>State</label>
                <input
                  type="text"
                  style={S.input}
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  style={S.input}
                  value={form.pincode}
                  onChange={e => setForm({ ...form, pincode: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Employment Type</label>
                <select
                  style={S.input}
                  value={form.employment_type}
                  onChange={e => setForm({ ...form, employment_type: e.target.value })}
                >
                  <option value="salaried">Salaried Employee</option>
                  <option value="self_employed">Self Employed Professional</option>
                  <option value="business">Business Owner</option>
                  <option value="other">Other / Retired</option>
                </select>
              </div>

              <div>
                <label style={S.label}>Monthly Net Income (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  style={S.input}
                  value={form.monthly_income}
                  onChange={e => setForm({ ...form, monthly_income: e.target.value })}
                />
              </div>

              <div>
                <label style={S.label}>Employer / Business Name</label>
                <input
                  type="text"
                  placeholder="Company Name"
                  style={S.input}
                  value={form.employer}
                  onChange={e => setForm({ ...form, employer: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={savingDetails}
                style={{ ...S.btn('primary'), padding: '10px 24px', fontSize: '13.5px' }}
              >
                {savingDetails ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 2: UPLOAD DOCUMENTS */}
        <section style={{ ...S.card, padding: '24px' }}>
          <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdDescription style={{ fontSize: '22px', color: C.teal }} />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: C.text }}>Step 2: Upload Required Documents</h2>
              <p style={{ fontSize: '12.5px', color: C.textMid, margin: '2px 0 0 0' }}>Upload clear PDF documents or photos (Max 5MB per file).</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {docTypesList.map(item => {
              const uploadedDoc = uploaded_documents.find(d => (d.document_type || '').toLowerCase() === item.type);
              const isUploading = !!uploadingTypes[item.type];
              const err = uploadErrors[item.type];

              return (
                <div
                  key={item.type}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${uploadedDoc ? C.green + '50' : C.border}`,
                    background: uploadedDoc ? `${C.green}08` : C.card,
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{item.label}</span>
                      {uploadedDoc && (
                        <span style={{ fontSize: '11px', background: `${C.green}20`, color: C.green, padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px' }}>{item.desc}</div>

                    {err && (
                      <div style={{ fontSize: '11.5px', color: C.red, marginTop: '6px' }}>⚠️ {err}</div>
                    )}
                  </div>

                  <div>
                    {uploadedDoc ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                        <a
                          href={uploadedDoc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: C.teal, fontWeight: 700, textDecoration: 'underline' }}
                        >
                          View File 👁️
                        </a>
                        <label style={{ fontSize: '12px', color: C.teal, fontWeight: 700, cursor: 'pointer' }}>
                          Replace File 🔄
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            style={{ display: 'none' }}
                            onChange={e => handleFileUpload(item.type, e.target.files[0])}
                          />
                        </label>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        border: `1.5px dashed ${C.teal}`,
                        borderRadius: '8px',
                        cursor: isUploading ? 'wait' : 'pointer',
                        background: `${C.teal}08`,
                        color: C.teal,
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        <MdCloudUpload style={{ fontSize: '18px' }} />
                        <span>{isUploading ? 'Uploading...' : 'Choose File to Upload'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                          disabled={isUploading}
                          onChange={e => handleFileUpload(item.type, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
