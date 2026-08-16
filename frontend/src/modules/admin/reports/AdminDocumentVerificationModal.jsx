import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, CheckCircle, XCircle, Eye, Send, ShieldCheck, 
  Building2, User, Clock, AlertTriangle, FileText, Check, ArrowRight
} from 'lucide-react';
import ApplicationTracker from '../../../components/common/ApplicationTracker';

const AdminDocumentVerificationModal = ({ application, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'bank' | 'timeline'
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendLinkLoading, setSendLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // Bank status update state
  const [bankStatus, setBankStatus] = useState(application?.status || 'under_review');
  const [bankRefNumber, setBankRefNumber] = useState(application?.bank_ref_number || application?.app_number || '');
  const [approvedAmount, setApprovedAmount] = useState(application?.approved_amount || application?.loan_amount || '');
  const [bankRejectReason, setBankRejectReason] = useState('');

  const API_BASE = '/api/v1';

  const fetchData = async () => {
    if (!application?.id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const timelineRes = await axios.get(`${API_BASE}/applications/${application.id}/timeline`, { headers }).catch(() => ({ data: { data: [] } }));
      setTimeline(timelineRes.data.data || []);
    } catch (err) {
      console.error('Error loading application timeline details:', err);
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
        alert(`Application reference link sent to customer!\nLink: ${res.data.data.uploadUrl}`);
        fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send application link');
    } finally {
      setSendLinkLoading(false);
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

  const vkycLink = application?.vkyc_url || application?.vkyc_link || '';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '960px', maxHeight: '90vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Application #{application.app_number || application.bank_ref_number || 'APP-REF'}
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: '#ffedd5', color: '#c2410c' }}>
                {application.status ? application.status.replace(/_/g, ' ').toUpperCase() : 'UNDER REVIEW'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', wordBreak: 'break-word' }}>
              Customer: <strong>{application.customer_name}</strong> | Mobile: {application.customer_mobile || application.mobile} | Bank: {application.bank_name || application.bank_code || 'Bank Partner'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSendLink}
              disabled={sendLinkLoading}
              style={{ background: '#f97316', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} /> {sendLinkLoading ? 'Sending...' : 'Send Link to Customer'}
            </button>

            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Application Tracker */}
          <div style={{ marginBottom: '24px' }}>
            <ApplicationTracker currentStatus={application.status} />
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '24px' }}>
            {['details', 'bank', 'timeline'].map((tab) => (
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
                {tab === 'details' ? 'Application & V-KYC Details' : tab === 'bank' ? 'Bank Processing & Statuses' : 'Audit Timeline'}
              </button>
            ))}
          </div>

          {/* TAB 1: APPLICATION & V-KYC DETAILS */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Key Reference & VKYC Link Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📌 Application Identification & V-KYC Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Application Number</label>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                      {application.app_number || application.bank_ref_number || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>V-KYC Link</label>
                    {vkycLink ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          readOnly
                          value={vkycLink}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                        />
                        <button
                          onClick={() => window.open(vkycLink, '_blank')}
                          style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Open V-KYC
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No Video KYC link attached yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Physical Process & Form Fields (Bankwise Details) */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📋 Physical Application Form Fields (Bank-wise Details)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Customer Full Name</div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{application.customer_name || 'N/A'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Mobile Number</div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{application.customer_mobile || application.mobile || 'N/A'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PAN Card Number</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', textTransform: 'uppercase' }}>{application.pan_number || 'N/A'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Target Bank</div>
                    <div style={{ fontWeight: 800, color: '#ea580c' }}>{application.bank_name || application.bank_code || 'Bank Partner'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Product / Card Category</div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{application.product_name || application.credit_card_category || 'Credit Card / Loan'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Monthly Income</div>
                    <div style={{ fontWeight: 800, color: '#16a34a' }}>₹{application.monthly_income || application.loan_amount || 'N/A'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>City & Pincode</div>
                    <div style={{ fontWeight: 700, color: '#334155' }}>{application.city || 'N/A'} - {application.pincode || ''}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Process Channel</div>
                    <div style={{ fontWeight: 800, color: '#2563eb' }}>{application.process_by_name || application.process_by || 'Partner Lead'}</div>
                  </div>
                </div>
              </div>

              {/* Status Checklist Badges */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🏷 Application Statuses & Checklist Badges
                </h4>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                    Stage: {(application.final_stage || application.status || 'Submitted').toUpperCase()}
                  </span>

                  <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    QD Status: {application.qd_status || 'Verified'}
                  </span>

                  <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                    Income Verification: {application.income_status || 'Verified'}
                  </span>

                  <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
                    Dispatch Stage: {application.dispatch_stage || 'In Transit'}
                  </span>
                </div>
              </div>

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
      </div>
    </div>
  );
};

export default AdminDocumentVerificationModal;
