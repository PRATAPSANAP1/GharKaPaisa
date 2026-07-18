import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, CheckCircle, XCircle, Eye, Send, ShieldCheck, 
  Building2, User, Clock, AlertTriangle, FileText, Check, ArrowRight
} from 'lucide-react';
import ApplicationTracker from '../../../components/common/ApplicationTracker';

const AdminDocumentVerificationModal = ({ application, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'bank' | 'timeline'
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendLinkLoading, setSendLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // Document preview state
  const [previewFile, setPreviewFile] = useState(null);

  // Reject modal state
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectReasonType, setRejectReasonType] = useState('Image blurred');
  const [rejectCustomReason, setRejectCustomReason] = useState('');

  // Bank status update state
  const [bankStatus, setBankStatus] = useState(application?.status || 'under_review');
  const [bankRefNumber, setBankRefNumber] = useState(application?.bank_ref_number || '');
  const [approvedAmount, setApprovedAmount] = useState(application?.approved_amount || application?.loan_amount || '');
  const [bankRejectReason, setBankRejectReason] = useState('');

  const API_BASE = '/api/v1';

  const fetchData = async () => {
    if (!application?.id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [docsRes, timelineRes] = await Promise.all([
        axios.get(`${API_BASE}/applications/${application.id}/documents`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/applications/${application.id}/timeline`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      setDocuments(docsRes.data.data || []);
      setTimeline(timelineRes.data.data || []);
    } catch (err) {
      console.error('Error loading application verification details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [application?.id]);

  const handleSendLink = async () => {
    try {
      setSendLinkLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE}/applications/${application.id}/send-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setGeneratedLink(res.data.data.uploadUrl);
        alert(`Upload link generated & sent to customer successfully!\nLink: ${res.data.data.uploadUrl}`);
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send upload link');
    } finally {
      setSendLinkLoading(false);
    }
  };

  const handleVerifyDoc = async (docId, status, reason = null) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE}/applications/${application.id}/documents/${docId}/verify`,
        { status, rejection_reason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setRejectingDoc(null);
        setRejectCustomReason('');
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteVerification = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE}/applications/${application.id}/verification-complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert('Verification completed! Application sent to bank.');
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBankStatus = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE}/applications/${application.id}/bank-status`,
        {
          status: bankStatus,
          bank_ref_number: bankRefNumber,
          approved_amount: approvedAmount,
          rejection_reason: bankRejectReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(`Status updated to ${bankStatus.toUpperCase()}`);
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bank status');
    } finally {
      setActionLoading(false);
    }
  };

  const allApproved = documents.length > 0 && documents.every(d => d.status === 'approved');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '960px', maxHeight: '90vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Application #{application.app_number}
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: '#ffedd5', color: '#c2410c' }}>
                {application.status ? application.status.replace(/_/g, ' ').toUpperCase() : 'PENDING'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Customer: <strong>{application.customer_name}</strong> | Mobile: {application.customer_mobile || application.mobile} | Product: {application.product_name}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleSendLink}
              disabled={sendLinkLoading}
              style={{ background: '#f97316', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} /> {sendLinkLoading ? 'Sending...' : 'Send Upload Link'}
            </button>

            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Module 12 Application Tracker */}
          <div style={{ marginBottom: '24px' }}>
            <ApplicationTracker currentStatus={application.status} />
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '24px' }}>
            {['documents', 'bank', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 4px',
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: '14px',
                  color: activeTab === tab ? '#ea580c' : '#64748b',
                  borderBottom: activeTab === tab ? '2px solid #ea580c' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'documents' ? 'Customer Documents' : tab === 'bank' ? 'Bank Processing' : 'Audit Timeline'}
              </button>
            ))}
          </div>

          {/* TAB 1: CUSTOMER DOCUMENTS VERIFICATION */}
          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Uploaded Customer Documents</h4>
                
                <button
                  onClick={handleCompleteVerification}
                  disabled={actionLoading || !allApproved}
                  style={{
                    background: allApproved ? '#10b981' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: allApproved ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={16} /> Mark Verification Complete
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading documents...</div>
              ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <FileText size={40} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>No documents uploaded yet by customer.</p>
                  <button onClick={handleSendLink} style={{ marginTop: '12px', background: '#f97316', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    Send Upload Link Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {documents.map((doc) => {
                    const docLabel = doc.document_type ? doc.document_type.replace(/_/g, ' ').toUpperCase() : 'DOCUMENT';
                    const isApproved = doc.status === 'approved';
                    const isRejected = doc.status === 'rejected';

                    return (
                      <div
                        key={doc.id}
                        style={{
                          background: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#ffffff',
                          border: `1px solid ${isApproved ? '#bbf7d0' : isRejected ? '#fecaca' : '#e2e8f0'}`,
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{docLabel}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#e0f2fe', color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#0369a1' }}>
                              {doc.status ? doc.status.toUpperCase() : 'PENDING'}
                            </span>
                            {doc.version > 1 && <span style={{ fontSize: '11px', color: '#64748b' }}>(v{doc.version})</span>}
                          </div>
                          {doc.rejection_reason && (
                            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                              <strong>Reason:</strong> {doc.rejection_reason}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => window.open(doc.file_url, '_blank')}
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} /> Preview
                          </button>

                          <button
                            onClick={() => handleVerifyDoc(doc.id, 'approved')}
                            disabled={actionLoading || isApproved}
                            style={{ background: isApproved ? '#10b981' : '#dcfce7', color: isApproved ? '#ffffff' : '#15803d', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: isApproved ? 'default' : 'pointer' }}
                          >
                            Approve ✓
                          </button>

                          <button
                            onClick={() => setRejectingDoc(doc)}
                            disabled={actionLoading}
                            style={{ background: isRejected ? '#ef4444' : '#fee2e2', color: isRejected ? '#ffffff' : '#b91c1c', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Reject ✗
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BANK PROCESSING */}
          {activeTab === 'bank' && (
            <div style={{ maxWidth: '600px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Bank Processing & Status Update</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Bank Application Status</label>
                  <select
                    value={bankStatus}
                    onChange={(e) => setBankStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="under_review">Under Review (Bank Review)</option>
                    <option value="approved">Approved</option>
                    <option value="disbursed">Disbursed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Bank Reference Number</label>
                  <input
                    type="text"
                    value={bankRefNumber}
                    onChange={(e) => setBankRefNumber(e.target.value)}
                    placeholder="Enter Bank Ref / LAN Number"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Sanctioned / Approved Amount (₹)</label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    placeholder="Approved loan amount"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                {bankStatus === 'rejected' && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', display: 'block', marginBottom: '6px' }}>Rejection Reason</label>
                    <textarea
                      value={bankRejectReason}
                      onChange={(e) => setBankRejectReason(e.target.value)}
                      placeholder="Specify rejection reason"
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '14px' }}
                    />
                  </div>
                )}

                <button
                  onClick={handleUpdateBankStatus}
                  disabled={actionLoading}
                  style={{ background: '#f97316', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
                >
                  {actionLoading ? 'Updating...' : 'Update Bank Status'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Application Timeline Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {timeline.map((event, idx) => (
                  <div key={event.id || idx} style={{ display: 'flex', gap: '14px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c', marginTop: '4px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{event.title}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{event.description}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reject Document Modal Popup */}
        {rejectingDoc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', marginBottom: '12px' }}>
                Reject Document: {rejectingDoc.document_type?.replace(/_/g, ' ').toUpperCase()}
              </h4>
              
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Select Reason</label>
              <select
                value={rejectReasonType}
                onChange={(e) => setRejectReasonType(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '14px' }}
              >
                <option value="Image blurred">Image blurred / Unreadable</option>
                <option value="Upload expired">Upload expired</option>
                <option value="Wrong document">Wrong document type uploaded</option>
                <option value="Other">Other (Specify below)</option>
              </select>

              {rejectReasonType === 'Other' && (
                <textarea
                  value={rejectCustomReason}
                  onChange={(e) => setRejectCustomReason(e.target.value)}
                  placeholder="Enter rejection details..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', fontSize: '14px' }}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => setRejectingDoc(null)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={() => handleVerifyDoc(rejectingDoc.id, 'rejected', rejectReasonType === 'Other' ? rejectCustomReason : rejectReasonType)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentVerificationModal;
