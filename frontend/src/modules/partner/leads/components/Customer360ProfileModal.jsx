import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { useTheme, makeS } from '../../../../contexts/ThemeContext';
import { 
  MdClose, MdPerson, MdCreditCard, MdDescription, MdTimeline, 
  MdNote, MdAlarm, MdChat, MdHistory, MdAccountBalanceWallet,
  MdCheckCircle, MdPhone, MdEmail, MdLocationOn, MdWork, MdBadge,
  MdAttachMoney, MdPictureAsPdf, MdDownload, MdCloudUpload, MdSend,
  MdCall, MdOutlineWhatsapp, MdPushPin, MdAdd, MdEdit, MdSave
} from 'react-icons/md';

export default function Customer360ProfileModal({ customerId, onClose, onRefresh }) {
  const { C } = useTheme();
  const S = makeS(C);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, applications, documents, timeline, notes, followups, communication, activities, commission

  // Customer Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Pipeline Status Update state
  const [pipelineStatus, setPipelineStatus] = useState('new');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Notes Form State
  const [noteText, setNoteText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  // Followup Form State
  const [followupDate, setFollowupDate] = useState('');
  const [followupPriority, setFollowupPriority] = useState('medium');
  const [followupRemarks, setFollowupRemarks] = useState('');
  const [addingFollowup, setAddingFollowup] = useState(false);

  // Communication Form State
  const [commType, setCommType] = useState('WhatsApp');
  const [commMessage, setCommMessage] = useState('Hello! Checking in regarding your GharKaPaisa application.');
  const [sendingComm, setSendingComm] = useState(false);

  // Document Upload & Share Link State
  const [uploadDocType, setUploadDocType] = useState('pan');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState('');
  const [docUploadSuccess, setDocUploadSuccess] = useState('');

  // Share Link State
  const [shareData, setShareData] = useState(null);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchProfileData = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await api.get(`/customers/${customerId}`);
      if (res.data?.success) {
        setProfile(res.data.data);
        setPipelineStatus(res.data.data.overview?.pipeline_status || 'new');
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setGeneratingShareLink(true);
    try {
      const res = await api.post(`/customers/${customerId}/share-link`);
      if (res.data?.success) {
        setShareData(res.data.data);
      }
    } catch (err) {
      alert('Failed to generate customer share link');
    } finally {
      setGeneratingShareLink(false);
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePartnerUploadDoc = async (e) => {
    e.preventDefault();
    if (!uploadFile) return setDocUploadError('Please select a file to upload');
    setUploadingDoc(true);
    setDocUploadError('');
    setDocUploadSuccess('');

    const formData = new FormData();
    formData.append('document_type', uploadDocType);
    formData.append('file', uploadFile);

    try {
      const res = await api.post(`/customers/${customerId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setDocUploadSuccess(`${uploadDocType.toUpperCase()} document uploaded successfully.`);
        setUploadFile(null);
        fetchProfileData();
      }
    } catch (err) {
      setDocUploadError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await api.delete(`/customers/${customerId}/documents/${docId}`);
      if (res.data?.success) {
        fetchProfileData();
      }
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [customerId]);

  if (!customerId) return null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.full_name?.trim()) return setEditError('Full Name is required');
    if (!editForm.mobile?.trim()) return setEditError('Mobile Number is required');
    setSavingEdit(true);
    setEditError('');
    try {
      const res = await api.put(`/customers/${customerId}`, editForm);
      if (res.data?.success) {
        setIsEditing(false);
        fetchProfileData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update customer profile');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/customers/${customerId}/status`, { status: newStatus });
      if (res.data?.success) {
        setPipelineStatus(newStatus);
        fetchProfileData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/customers/${customerId}/notes`, { note: noteText, is_pinned: isPinned });
      if (res.data?.success) {
        setNoteText('');
        setIsPinned(false);
        fetchProfileData();
      }
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!followupDate) return alert('Select follow-up date and time');
    setAddingFollowup(true);
    try {
      const res = await api.post(`/customers/${customerId}/followups`, {
        followup_date: followupDate,
        priority: followupPriority,
        remarks: followupRemarks
      });
      if (res.data?.success) {
        setFollowupDate('');
        setFollowupRemarks('');
        fetchProfileData();
      }
    } catch (err) {
      alert('Failed to schedule follow-up');
    } finally {
      setAddingFollowup(false);
    }
  };

  const handleSendComm = async (e) => {
    e.preventDefault();
    if (!commMessage.trim()) return;
    setSendingComm(true);
    try {
      let endpoint = `/customers/${customerId}/send-whatsapp`;
      if (commType === 'SMS') endpoint = `/customers/${customerId}/send-sms`;
      if (commType === 'Call') endpoint = `/customers/${customerId}/log-call`;
      if (commType === 'Email') endpoint = `/customers/${customerId}/send-email`;

      const res = await api.post(endpoint, { message: commMessage });
      if (res.data?.success) {
        if (commType === 'WhatsApp') {
          const mobile = profile?.overview?.mobile;
          const url = `https://wa.me/91${mobile}?text=${encodeURIComponent(commMessage)}`;
          window.open(url, '_blank');
        }
        setCommMessage('');
        fetchProfileData();
      }
    } catch (err) {
      alert('Failed to log communication');
    } finally {
      setSendingComm(false);
    }
  };

  const { overview = {}, applications = [], leads = [], documents = [], timeline = [], notes = [], followups = [], communications = [], activity_logs = [], wallet_ledger = [] } = profile || {};

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        height: '100%',
        background: C.card,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#F59E0B',
              color: '#1E1B4B',
              fontSize: '18px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(overview.full_name || 'C')[0]}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#A5B4FC', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>360° Customer Database Profile</div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>{overview.full_name || 'Loading...'}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Edit Profile Button */}
            <button
              onClick={() => {
                setEditForm({
                  full_name: overview.full_name || '',
                  mobile: overview.mobile || '',
                  email: overview.email || '',
                  dob: overview.dob ? new Date(overview.dob).toISOString().split('T')[0] : '',
                  pan_number: overview.pan_number || '',
                  aadhaar_last4: overview.aadhaar_last4 || '',
                  city: overview.city || '',
                  state: overview.state || '',
                  pincode: overview.pincode || '',
                  monthly_income: overview.monthly_income || '',
                  employer: overview.employer || '',
                  employment_type: overview.employment_type || 'salaried',
                  occupation: overview.occupation || '',
                  alternate_mobile: overview.alternate_mobile || '',
                  nominee_name: overview.nominee_name || '',
                  nominee_relation: overview.nominee_relation || ''
                });
                setEditError('');
                setIsEditing(true);
              }}
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <MdEdit style={{ fontSize: '16px' }} />
              <span>Edit Details</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MdClose style={{ fontSize: '20px' }} />
            </button>
          </div>
        </div>

        {/* 10 Profile Tabs Navigation Header */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: C.bgSecondary,
          borderBottom: `1px solid ${C.border}`,
          padding: '4px 12px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: MdPerson },
            { id: 'applications', label: `Applications (${applications.length})`, icon: MdCreditCard },
            { id: 'leads', label: `Tracked Leads (${leads.length})`, icon: MdBadge },
            { id: 'documents', label: `Documents (${documents.length})`, icon: MdDescription },
            { id: 'timeline', label: `Timeline (${timeline.length})`, icon: MdTimeline },
            { id: 'notes', label: `Notes (${notes.length})`, icon: MdNote },
            { id: 'followups', label: `Follow-ups (${followups.length})`, icon: MdAlarm },
            { id: 'communication', label: `Communication (${communications.length})`, icon: MdChat },
            { id: 'activities', label: 'Activities', icon: MdHistory },
            { id: 'commission', label: `Commission Ledger (${wallet_ledger.length})`, icon: MdAccountBalanceWallet },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: active ? C.card : 'transparent',
                  color: active ? C.text : C.textLight,
                  boxShadow: active ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <Icon style={{ fontSize: '16px', color: active ? C.teal : C.textLight }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>Loading 360° Profile...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Personal & Work Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>Full Name: <strong>{overview.full_name}</strong></div>
                      <div>Mobile: <strong>{overview.mobile}</strong></div>
                      <div>Alt Mobile: <strong>{overview.alternate_mobile || 'N/A'}</strong></div>
                      <div>Email: <strong>{overview.email || 'N/A'}</strong></div>
                      <div>Date of Birth: <strong>{overview.dob ? new Date(overview.dob).toLocaleDateString() : 'N/A'}</strong></div>
                      <div>Occupation: <strong>{overview.occupation || 'N/A'}</strong></div>
                      <div>Employment Type: <strong style={{ textTransform: 'capitalize' }}>{overview.employment_type || 'Salaried'}</strong></div>
                      <div>Employer: <strong>{overview.employer || 'N/A'}</strong></div>
                      <div>Monthly Income: <strong>{overview.monthly_income ? `₹${parseFloat(overview.monthly_income).toLocaleString('en-IN')}` : 'N/A'}</strong></div>
                    </div>
                  </div>

                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>KYC & Address Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>PAN Card: <strong>{overview.pan_number || 'N/A'}</strong></div>
                      <div>Aadhaar (Last 4): <strong>{overview.aadhaar_last4 ? `•••• ${overview.aadhaar_last4}` : 'N/A'}</strong></div>
                      <div>City: <strong>{overview.city || 'N/A'}</strong></div>
                      <div>State: <strong>{overview.state || 'N/A'}</strong></div>
                      <div>Pincode: <strong>{overview.pincode || 'N/A'}</strong></div>
                      <div>Nominee Name: <strong>{overview.nominee_name || 'N/A'}</strong></div>
                      <div>Nominee Relation: <strong>{overview.nominee_relation || 'N/A'}</strong></div>
                    </div>
                  </div>

                  <div style={{ ...S.card, padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 14px 0' }}>Attribution & Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div>Pipeline Status: <span style={{ background: `${C.teal}15`, color: C.teal, padding: '3px 8px', borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase', fontSize: '11px' }}>{(overview.pipeline_status || 'new').replace('_', ' ')}</span></div>
                      <div>Created By / Partner: <strong>{overview.partner_first_name ? `${overview.partner_first_name} ${overview.partner_last_name || ''}` : (overview.created_by_name || 'Direct Customer')}</strong></div>
                      <div>Partner Code: <strong style={{ color: C.teal }}>{overview.partner_code || 'DIRECT'}</strong></div>
                      <div>Created On: <strong>{overview.created_at ? new Date(overview.created_at).toLocaleDateString('en-IN') : 'N/A'}</strong></div>
                      <div>Product Interests: <strong>{Array.isArray(overview.product_interests) && overview.product_interests.length > 0 ? overview.product_interests.join(', ') : 'None specified'}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICATIONS */}
              {activeTab === 'applications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {applications.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No loan or credit card applications submitted for this customer yet.</div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} style={{ ...S.card, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: C.textLight }}>{app.bank_name} • {app.product_category?.replace('_', ' ').toUpperCase()}</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: C.text, marginTop: '2px' }}>{app.product_name}</div>
                          <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px' }}>App No: {app.app_number} | Amount: ₹{parseFloat(app.loan_amount || 0).toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            background: C.bg === "#000000" ? `${C.green}15` : '#ECFDF5',
                            color: C.bg === "#000000" ? C.green : '#059669',
                            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800
                          }}>
                            {app.status?.toUpperCase()}
                          </span>
                          <div style={{ fontSize: '12px', color: C.green, fontWeight: 700, marginTop: '6px' }}>
                            Payout: ₹{parseFloat(app.commission_amount || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* 1. Share Upload Link with Customer Card */}
                  <div style={{ ...S.card, padding: '18px', background: `${C.teal}08`, border: `1px solid ${C.teal}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📲 Customer Document & Details Upload Link
                        </h4>
                        <p style={{ fontSize: '12.5px', color: C.textMid, marginTop: '4px', margin: 0 }}>
                          Send a secure upload link to <strong>{overview.full_name}</strong> so they can fill their details & upload PAN, Aadhaar, Bank Statement, etc. directly from their mobile.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateShareLink}
                        disabled={generatingShareLink}
                        style={{
                          ...S.btn('primary'),
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <MdSend style={{ fontSize: '16px' }} />
                        <span>{generatingShareLink ? 'Generating Link...' : 'Generate / Get Share Link'}</span>
                      </button>
                    </div>

                    {shareData && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${C.teal}20`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '12px', color: C.textMid }}>
                          Share Link: <strong style={{ color: C.teal, wordBreak: 'break-all' }}>{shareData.upload_url}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleCopyLink(shareData.upload_url)}
                            style={{
                              background: copiedLink ? C.green : C.card,
                              color: copiedLink ? '#fff' : C.text,
                              border: `1px solid ${C.border}`,
                              borderRadius: '8px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {copiedLink ? <MdCheckCircle /> : <MdPictureAsPdf />}
                            <span>{copiedLink ? 'Link Copied!' : 'Copy Upload Link'}</span>
                          </button>
                          <a
                            href={shareData.whatsapp_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#25D366',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <MdOutlineWhatsapp style={{ fontSize: '16px' }} />
                            <span>Share via WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Partner Direct Upload Form */}
                  <div style={{ ...S.card, padding: '18px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MdCloudUpload style={{ fontSize: '18px', color: C.teal }} />
                      <span>Upload Document (Partner / Staff)</span>
                    </h4>

                    {docUploadSuccess && (
                      <div style={{ fontSize: '12.5px', color: C.green, background: `${C.green}15`, padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                        ✓ {docUploadSuccess}
                      </div>
                    )}
                    {docUploadError && (
                      <div style={{ fontSize: '12.5px', color: C.red, background: `${C.red}15`, padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                        ⚠️ {docUploadError}
                      </div>
                    )}

                    <form onSubmit={handlePartnerUploadDoc} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ flex: '1 1 180px' }}>
                        <select
                          value={uploadDocType}
                          onChange={e => setUploadDocType(e.target.value)}
                          style={{ ...S.input, width: '100%' }}
                        >
                          <option value="pan">🪪 PAN Card</option>
                          <option value="aadhaar">🆔 Aadhaar Card</option>
                          <option value="salary_slip">📄 Salary Slip</option>
                          <option value="bank_statement">🏦 Bank Statement</option>
                          <option value="itr">📊 ITR / Income Tax Return</option>
                          <option value="photo">📷 Photo / Passport Size</option>
                          <option value="other">📁 Other Document</option>
                        </select>
                      </div>
                      <div style={{ flex: '2 1 240px' }}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={e => setUploadFile(e.target.files[0] || null)}
                          style={{ ...S.input, width: '100%', padding: '6px 10px' }}
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={uploadingDoc || !uploadFile}
                          style={{
                            ...S.btn('primary'),
                            padding: '10px 20px',
                            fontSize: '13px',
                            opacity: (uploadingDoc || !uploadFile) ? 0.6 : 1,
                            cursor: (uploadingDoc || !uploadFile) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {uploadingDoc ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 3. Document Cards Grid */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 12px 0' }}>
                      Uploaded Customer Documents ({documents.length})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                      {['pan', 'aadhaar', 'salary_slip', 'itr', 'bank_statement', 'photo', 'other'].map(type => {
                        const docList = documents.filter(d => (d.document_type || '').toLowerCase() === type);
                        return (
                          <div key={type} style={{ ...S.card, padding: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {type.replace('_', ' ')}
                              </div>
                              {docList.length > 0 ? (
                                docList.map(doc => (
                                  <div key={doc.id} style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                                    <span style={{
                                      fontSize: '10.5px',
                                      background: `${C.green}18`,
                                      color: C.green,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      textTransform: 'uppercase'
                                    }}>
                                      {doc.status || 'VERIFIED'}
                                    </span>
                                    <div style={{ fontSize: '11px', color: C.textLight, marginTop: '4px' }}>
                                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </div>
                                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                      <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ fontSize: '12px', color: C.teal, fontWeight: 700, textDecoration: 'none' }}
                                      >
                                        Preview 👁️
                                      </a>
                                      <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        style={{ background: 'none', border: 'none', color: C.red, fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                      >
                                        Delete 🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontSize: '11px', color: C.textLight, marginTop: '10px' }}>Not Uploaded</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: TIMELINE */}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {timeline.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No activity timeline recorded yet.</div>
                  ) : (
                    timeline.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C.teal, marginTop: '4px', flexShrink: 0 }} />
                        <div style={{ ...S.card, padding: '12px 16px', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: C.text }}>
                            <span>{item.event_title}</span>
                            <span style={{ fontSize: '11px', color: C.textLight }}>{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: C.textMid, marginTop: '4px' }}>{item.event_description}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: NOTES */}
              {activeTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      style={{ ...S.input, flex: 1 }}
                      placeholder="Add partner note (e.g. Needs loan after Diwali)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button type="submit" disabled={addingNote} style={{ ...S.btn('primary'), padding: '10px 18px' }}>Add Note</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notes.map(n => (
                      <div key={n.id} style={{ ...S.card, padding: '12px 16px', background: n.is_pinned ? C.bgSecondary : C.card }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: C.textLight }}>
                          <span>By {n.author_name || 'Partner'}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '13.5px', color: C.text, marginTop: '6px' }}>{n.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: FOLLOWUPS */}
              {activeTab === 'followups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddFollowup} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      style={{ ...S.input, width: 'auto' }}
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                    />
                    <select style={{ ...S.input, width: 'auto' }} value={followupPriority} onChange={(e) => setFollowupPriority(e.target.value)}>
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <input style={{ ...S.input, flex: 1 }} placeholder="Remarks..." value={followupRemarks} onChange={(e) => setFollowupRemarks(e.target.value)} />
                    <button type="submit" disabled={addingFollowup} style={{ ...S.btn('primary') }}>Schedule</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {followups.map(f => (
                      <div key={f.id} style={{ ...S.card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{new Date(f.followup_date).toLocaleString()}</div>
                          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '2px' }}>{f.remarks || 'No remarks'}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: C.gold }}>{f.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: COMMUNICATION */}
              {activeTab === 'communication' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleSendComm} style={{ ...S.card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['WhatsApp', 'SMS', 'Call', 'Email'].map(t => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setCommType(t)}
                          style={{
                            padding: '8px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            background: commType === t ? C.teal : C.bgSecondary,
                            color: commType === t ? '#FFF' : C.text
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea style={{ ...S.input, minHeight: '80px' }} value={commMessage} onChange={(e) => setCommMessage(e.target.value)} />
                    <button type="submit" disabled={sendingComm} style={{ ...S.btn('primary'), alignSelf: 'flex-end' }}>Log & Send {commType}</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {communications.map(c => (
                      <div key={c.id} style={{ ...S.card, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textLight }}>
                          <span><strong>{c.type}</strong> by {c.sender_name || 'Agent'}</span>
                          <span>{new Date(c.sent_at).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: C.text, marginTop: '6px' }}>{c.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: ACTIVITIES */}
              {activeTab === 'activities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activity_logs.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: C.textLight }}>No audit activities recorded.</div>
                  ) : (
                    activity_logs.map(log => (
                      <div key={log.id} style={{ ...S.card, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span><strong>{log.activity_type}</strong> by {log.performer_name || 'System'}</span>
                        <span style={{ color: C.textLight }}>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 9: TRACKED LEADS */}
              {activeTab === 'leads' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {leads.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No separate lead entries logged for this customer.</div>
                  ) : (
                    leads.map(ld => (
                      <div key={ld.id} style={{ ...S.card, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: C.teal, textTransform: 'uppercase' }}>
                            {ld.bank_name || 'Bank Partner'} • {(ld.process_by || ld.process_type || 'direct_link').replace('_', ' ').toUpperCase()}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: C.text, marginTop: '2px' }}>
                            {ld.product_name || 'Product Lead'}
                          </div>
                          <div style={{ fontSize: '12px', color: C.textMid, marginTop: '4px' }}>
                            Partner: <strong>{ld.partner_first_name ? `${ld.partner_first_name} ${ld.partner_last_name || ''} (${ld.partner_code || ''})` : 'Direct'}</strong> | Created: {new Date(ld.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            background: `${C.teal}18`,
                            color: C.teal,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}>
                            {ld.status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 10: COMMISSION & WALLET LEDGER */}
              {activeTab === 'commission' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {wallet_ledger.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>No payout or commission ledger transactions generated yet for this customer.</div>
                  ) : (
                    wallet_ledger.map(tx => (
                      <div key={tx.id} style={{ ...S.card, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>
                            {tx.product_name || 'Application Payout'} (App #{tx.app_number})
                          </div>
                          <div style={{ fontSize: '12px', color: C.textLight, marginTop: '2px' }}>
                            {new Date(tx.created_at).toLocaleString('en-IN')} • Ref: {tx.reference_number || tx.id}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: C.green }}>
                            + ₹{parseFloat(tx.amount || tx.credit || 0).toLocaleString('en-IN')}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: C.teal, textTransform: 'uppercase' }}>
                            {tx.status || 'COMPLETED'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </div>

      {/* EDIT CUSTOMER MODAL OVERLAY */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: C.card,
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: `1px solid ${C.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${C.primary}20`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdEdit style={{ fontSize: '20px' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Edit Customer Details</h3>
              </div>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '22px' }}>✕</button>
            </div>

            {editError && (
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: '10px', color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Full Name *</label>
                <input
                  style={S.input}
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Mobile Number *</label>
                  <input
                    style={S.input}
                    value={editForm.mobile || ''}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={S.label}>Email Address</label>
                  <input
                    type="email"
                    style={S.input}
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Date of Birth</label>
                  <input
                    type="date"
                    style={S.input}
                    value={editForm.dob || ''}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>PAN Card Number</label>
                  <input
                    style={{ ...S.input, textTransform: 'uppercase' }}
                    value={editForm.pan_number || ''}
                    onChange={(e) => setEditForm({ ...editForm, pan_number: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>City</label>
                  <input
                    style={S.input}
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>State</label>
                  <input
                    style={S.input}
                    value={editForm.state || ''}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label style={S.label}>Pincode</label>
                  <input
                    style={S.input}
                    value={editForm.pincode || ''}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    maxLength={6}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Employment Type</label>
                  <select
                    style={S.input}
                    value={editForm.employment_type || 'salaried'}
                    onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                  >
                    <option value="salaried">Salaried</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="business">Business Owner</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Monthly Income (₹)</label>
                  <input
                    type="number"
                    style={S.input}
                    value={editForm.monthly_income || ''}
                    onChange={(e) => setEditForm({ ...editForm, monthly_income: e.target.value })}
                    placeholder="e.g. 75000"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Employer Name</label>
                  <input
                    style={S.input}
                    value={editForm.employer || ''}
                    onChange={(e) => setEditForm({ ...editForm, employer: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label style={S.label}>Occupation</label>
                  <input
                    style={S.input}
                    value={editForm.occupation || ''}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                    placeholder="Designation / Role"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ ...S.btn('outline'), padding: '10px 20px', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    ...S.btn('primary'),
                    padding: '10px 24px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MdSave style={{ fontSize: '18px' }} />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
